import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer'
import { ShaderMaterial } from 'three'

export function AudioVisualizer({ isAudioEnabled, pendingState }) {
  const meshRef = useRef()
  const { audioData } = useAudioAnalyzer(isAudioEnabled)
  const { viewport } = useThree()
  const lastTimeRef = useRef(0)

  // 셰이더 머티리얼 생성
  const material = useMemo(() => {
    console.log('셰이더 머티리얼 생성 시작')
    
    try {
      const shaderMaterial = new ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision mediump float;
          varying vec2 vUv;
          
          uniform vec3 iResolution;
          uniform float iTime;
          uniform float uTimeEff;
          uniform float uLevel;
          uniform float uVox0;
          uniform float uVox1;
          uniform float uVox2;
          uniform float uVox3;
          uniform float uPending;
          
          // RGB → HSL 변환
          vec3 rgb2hsl(vec3 c) {
            float maxc = max(max(c.r, c.g), c.b);
            float minc = min(min(c.r, c.g), c.b);
            float l = (maxc + minc) * 0.5;
            if (maxc == minc) return vec3(0.0, 0.0, l);
            float d = maxc - minc;
            float s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);
            float h = 0.0;
            if (maxc == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
            else if (maxc == c.g) h = (c.b - c.r) / d + 2.0;
            else h = (c.r - c.g) / d + 4.0;
            h /= 6.0;
            return vec3(h, s, l);
          }
          
          // HSL → RGB 변환
          vec3 hsl2rgb(vec3 c) {
            float h = c.x, s = c.y, l = c.z;
            float r, g, b;
            
            if (s == 0.0) {
              r = g = b = l;
            } else {
              float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
              float p = 2.0 * l - q;
              float hk = fract(h);
              
              float t[3];
              t[0] = hk + 1.0/3.0;
              t[1] = hk;
              t[2] = hk - 1.0/3.0;
              
              for (int i = 0; i < 3; i++) {
                if (t[i] < 0.0) t[i] += 1.0;
                if (t[i] > 1.0) t[i] -= 1.0;
                if (t[i] < 1.0/6.0) t[i] = p + (q - p) * 6.0 * t[i];
                else if (t[i] < 0.5) t[i] = q;
                else if (t[i] < 2.0/3.0) t[i] = p + (q - p) * (2.0/3.0 - t[i]) * 6.0;
                else t[i] = p;
              }
              
              r = t[0]; g = t[1]; b = t[2];
            }
            return vec3(r, g, b);
          }
          
          void main() {
            vec2 I = vUv * iResolution.xy;
            
            // pending → calm 스케일
            float calm = clamp(uPending, 0.0, 1.0);
            
            // === 배경 소음 데드존 적용 ===
            float level = max(0.0, uLevel - 0.05);
            level /= (1.0 - 0.05);
            
            // 시간 속도
            float t = uTimeEff;
            
            // 난류 위상
            float speakPhaseActive = 0.05 * (level + 0.5*uVox1);
            float speakPhase = mix(speakPhaseActive, 0.0, calm);
            
            // 밝기 게인
            float colorGainActive = 1.0 + 1.5*level + 0.5*uVox3;
            float colorGain = mix(colorGainActive, 1.05, calm);
            
            // 누적 색상
            vec3 col = vec3(0.0);
            float z = 0.0;
            float d = 0.0;
            
            // Raymarch loop
            for (float i = 0.0; i < 20.0; i++) {
              vec3 p = z * normalize(vec3(I+I, 0.0) - iResolution.xyx) + 0.1;
              
              p = vec3(
                atan(p.z += 9.0, p.x + 0.1) * 2.0,
                0.6*p.y + t + t,
                length(p.xz) - 3.0
              );
              
              for (d = 0.0; d++ < 7.0; ) {
                p += sin(p.yzx * d + (t + speakPhase) + 0.5*i) / d;
              }
              
              z += d = 0.4 * length(vec4(0.3*cos(p) - 0.3, p.z));
              
              col += colorGain * (1.0 + cos(p.y + i*0.4 + vec3(6.0,1.0,2.0))) / d;
            }
            
            col *= mix(1.0, 0.9, calm);
            col = tanh(col*col / 6000.0);
            
            // === Hue rotation 적용 ===
            float hueAngleDynamic = ((level - 0.5) * 3.14159 * 0.6)
                                  + iTime * (0.08 + 0.08*level);
            float hueAngle = mix(hueAngleDynamic, hueAngleDynamic * 0.3, calm);
            
            vec3 hsl = rgb2hsl(col);
            hsl.x = fract(hsl.x + hueAngle / (2.0 * 3.14159));
            vec3 finalColor = hsl2rgb(hsl);
            
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `,
        uniforms: {
          iResolution: { value: [window.innerWidth, window.innerHeight, 1.0] },
          iTime: { value: 0.0 },
          uTimeEff: { value: 0.0 },
          uLevel: { value: 0.0 },
          uVox0: { value: 0.0 },
          uVox1: { value: 0.0 },
          uVox2: { value: 0.0 },
          uVox3: { value: 0.0 },
          uPending: { value: 0.0 }
        }
      })

      // uniform이 제대로 설정되었는지 확인
      console.log('셰이더 머티리얼 생성 완료:', shaderMaterial)
      console.log('uniforms 확인:', {
        iTime: shaderMaterial.uniforms.iTime,
        uTimeEff: shaderMaterial.uniforms.uTimeEff,
        uLevel: shaderMaterial.uniforms.uLevel
      })
      
      // 각 uniform의 value 속성도 확인
      console.log('uniform values 확인:', {
        iTimeValue: shaderMaterial.uniforms.iTime?.value,
        uTimeEffValue: shaderMaterial.uniforms.uTimeEff?.value,
        uLevelValue: shaderMaterial.uniforms.uLevel?.value
      })
      
      return shaderMaterial
    } catch (error) {
      console.error('셰이더 머티리얼 생성 실패:', error)
      // 에러 발생 시 기본 머티리얼 반환
      return new ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision mediump float;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // 빨간색 (에러 표시)
          }
        `
      })
    }
  }, [])

  // 오디오 데이터를 셰이더에 전달
  useEffect(() => {
    if (material && material.uniforms && audioData) {
      console.log('오디오 데이터 업데이트:', audioData)
      console.log('pendingState:', pendingState)
      
      // 각 uniform이 존재하는지 확인하고 안전하게 설정
      if (material.uniforms.uLevel) {
        material.uniforms.uLevel.value = audioData.level
      }
      if (material.uniforms.uVox0) {
        material.uniforms.uVox0.value = audioData.bands[0]
      }
      if (material.uniforms.uVox1) {
        material.uniforms.uVox1.value = audioData.bands[1]
      }
      if (material.uniforms.uVox2) {
        material.uniforms.uVox2.value = audioData.bands[2]
      }
      if (material.uniforms.uVox3) {
        material.uniforms.uVox3.value = audioData.bands[3]
      }
      if (material.uniforms.uPending) {
        material.uniforms.uPending.value = pendingState
      }
      
      console.log('셰이더 uniform 업데이트 완료')
    }
  }, [material, audioData, pendingState])

  // 애니메이션 루프
  useFrame((state) => {
    // state와 state.clock이 존재하는지 확인
    if (!state || !state.clock) {
      console.warn('Invalid state or state.clock:', state)
      return
    }
    
    if (material && material.uniforms) {
      const time = state.clock.elapsedTime
      
      // time이 유효한 숫자인지 확인
      if (typeof time !== 'number' || isNaN(time)) {
        console.warn('Invalid time value:', { time })
        return
      }
      
      // delta 값을 직접 계산 (이전 프레임과의 시간 차이)
      const delta = lastTimeRef.current > 0 ? time - lastTimeRef.current : (1.0 / 60.0)
      lastTimeRef.current = time
      
      // uniform이 존재하고 value가 정의되어 있는지 확인
      if (material.uniforms.iTime && material.uniforms.iTime.value !== undefined) {
        material.uniforms.iTime.value = time
      }
      
      if (material.uniforms.uTimeEff && material.uniforms.uTimeEff.value !== undefined) {
        material.uniforms.uTimeEff.value += delta * (1.0 - pendingState * 0.75)
      }
      
      // 주기적으로 로그 출력 (너무 자주 출력하지 않도록)
      if (Math.floor(time * 10) % 10 === 0) {
        const uTimeEffValue = material.uniforms.uTimeEff && 
                             material.uniforms.uTimeEff.value !== undefined ? 
                             material.uniforms.uTimeEff.value.toFixed(2) : 'undefined'
        
        console.log('프레임 업데이트:', {
          time: time.toFixed(2),
          delta: delta.toFixed(4),
          pendingState,
          uTimeEff: uTimeEffValue,
          uniformsExist: {
            iTime: !!material.uniforms.iTime,
            uTimeEff: !!material.uniforms.uTimeEff,
            uTimeEffValue: material.uniforms.uTimeEff?.value
          }
        })
      }
    }
  })

  // 뷰포트 변경 시 해상도 업데이트
  useEffect(() => {
    if (material && material.uniforms && material.uniforms.iResolution) {
      material.uniforms.iResolution.value = [viewport.width, viewport.height, 1.0]
      console.log('해상도 업데이트:', [viewport.width, viewport.height, 1.0])
    }
  }, [material, viewport])

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}
