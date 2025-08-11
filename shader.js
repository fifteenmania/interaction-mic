// firewall_speech_minimal.js
(() => {
  // ===== Canvas / GL =====
  const canvas = document.getElementById('fx') || (() => {
    const c = document.createElement('canvas');
    c.id = 'fx'; document.body.appendChild(c);
    Object.assign(c.style, {position:'fixed', inset:0, width:'100vw', height:'100vh', display:'block'});
    return c;
  })();
  const gl = canvas.getContext('webgl2', {antialias:false, premultipliedAlpha:false});
  if(!gl){ throw new Error('WebGL2 not supported'); }

  // ===== Shaders =====
  const vert = `#version 300 es
  layout(location=0) in vec2 aPos;
  out vec2 vUV;
  void main(){
    vUV = aPos*0.5 + 0.5;
    gl_Position = vec4(aPos,0.0,1.0);
  }`;

  // 원본 "Firewall" 알고리즘을 그대로 옮기고,
  // 음성(uLevel, uVox[4])로 t와 색상 위상만 소량 조정.
  // stronger color response (original geometry untouched)
// stronger color response + pending calm mode (geometry untouched)
const frag = `#version 300 es
precision mediump float;
out vec4 fragColor;
in vec2 vUV;

uniform vec3  iResolution;
uniform float iTime;
uniform float uTimeEff;

// 마이크(음성) 입력
uniform float uLevel;     // 0~약 0.6 (RMS)
uniform float uVox[4];    // [저역(F0), formant1, formant2, sibilance]

// 챗봇 pending 상태 (0~1)
uniform float uPending;

vec3 hueRotate(vec3 color, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    mat3 m = mat3(
        0.299 + 0.701*c + 0.168*s,
        0.587 - 0.587*c + 0.330*s,
        0.114 - 0.114*c - 0.497*s,

        0.299 - 0.299*c - 0.328*s,
        0.587 + 0.413*c + 0.035*s,
        0.114 - 0.114*c + 0.292*s,

        0.299 - 0.300*c + 1.250*s,
        0.587 - 0.588*c - 1.050*s,
        0.114 + 0.886*c - 0.203*s
    );
    return clamp(m * color, 0.0, 1.0);
}

void main(){
    vec2 I = vUV * iResolution.xy;
    float calm = clamp(uPending, 0.0, 1.0);
    float t = uTimeEff;

    // ------------------------------
    // Hue 회전 위상 계산 (항상 연속)
    // ------------------------------
    float huePhase = iTime * 0.15; // 기본 회전 속도
    float micHue = (uLevel + 0.5*uVox[1]) * 3.14159 * 0.4; // 마이크 기반 추가
    float hueAngle = huePhase + micHue * (1.0 - 0.7 * calm); // 진폭만 calm에 영향

    // 밝기/난류 위상
    float speakPhaseActive = 0.05 * (uLevel + 0.5*uVox[1]);
    float speakPhase = mix(speakPhaseActive, 0.0, calm);
    float colorGainActive = 1.0 + 1.5*uLevel + 0.5*uVox[3];
    float colorGain = mix(colorGainActive, 1.05, calm);

    // ------------------------------
    // Raymarch
    // ------------------------------
    vec3 col = vec3(0.0);
    float z = 0.0;
    float d = 0.0;
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
        col += colorGain * (1.0 + cos(p.y + i*0.4 + vec3(6.0, 1.0, 2.0))) / d;
    }

    col *= mix(1.0, 0.9, calm);

    // 톤매핑 + Hue 회전 적용
    vec3 finalColor = tanh(col*col / 6000.0);
    finalColor = hueRotate(finalColor, hueAngle);

    fragColor = vec4(finalColor, 1.0);
}`;

  // ===== GL program =====
  function compile(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
    throw new Error(gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  // Fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1,  1,-1, -1,1,  -1,1, 1,-1, 1,1
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const uRes   = gl.getUniformLocation(prog, 'iResolution');
  const uTime  = gl.getUniformLocation(prog, 'iTime');
  const uLevel = gl.getUniformLocation(prog, 'uLevel');
  const uVox0  = gl.getUniformLocation(prog, 'uVox[0]');
  const uPending = gl.getUniformLocation(prog, 'uPending');
  const uTimeEff = gl.getUniformLocation(prog, 'uTimeEff');

  // ===== Resize =====
  function resize(){
    const dpr = devicePixelRatio || 1;
    const w = Math.floor((canvas.clientWidth || innerWidth) * dpr);
    const h = Math.floor((canvas.clientHeight || innerHeight) * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0,0,w,h);
    }
  }

  // ===== Audio (Speech-focused) =====
  // 말하는 음성에 맞춘 밴드(대략):
  // B0: 85–300 Hz (기본 주파수/저역)
  // B1: 300–1000 Hz (formant 1)
  // B2: 1–3 kHz (formant 2~3)
  // B3: 3–8 kHz (치찰음/자음)
  const FFT_SIZE = 1024; // analyser.fftSize
  let audioCtx, analyser, srcNode, comp;
  let freqU8, timeU8;
  let levelEMA = 0;
  const levelGate = 0.02;   // 작은 잡음 컷
  const levelAlpha = 0.2;   // 레벨은 느슨하게
  const levelMax = 0.6;     // 셰이더 기대치와 맞춤

  let sampleRate = 44100;   // 초기값(실제는 AudioContext 생성 후 값 사용)

  function binForHz(hz){
    // freqBin[i] 대역폭 ≈ sampleRate/2 / (N/2) = sampleRate/N
    // Uint8Array 길이는 N/2
    const binWidth = sampleRate / FFT_SIZE;
    return Math.max(0, Math.min((FFT_SIZE>>1)-1, Math.round(hz/binWidth)));
  }

  function bandPower(u8, f0, f1){
    const a = binForHz(f0), b = binForHz(f1);
    let sum=0; let n=0;
    for(let i=Math.min(a,b); i<=Math.max(a,b); i++){ sum += u8[i]; n++; }
    return (n? (sum/n) : 0)/255;
  }

  function computeLevel(timeDomain){
    // RMS
    let rms=0;
    for(let i=0;i<timeDomain.length;i++){
      const v = (timeDomain[i]-128)/128;
      rms += v*v;
    }
    rms = Math.sqrt(rms/timeDomain.length);
    // 게이트/클램프 + EMA
    rms = (rms < levelGate) ? 0 : Math.min(rms, 1.0);
    levelEMA = levelEMA*(1-levelAlpha) + rms*levelAlpha;
    return Math.min(levelEMA, levelMax);
  }

  async function initMic(){
    if (audioCtx) return;
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sampleRate = audioCtx.sampleRate;

    srcNode = audioCtx.createMediaStreamSource(stream);

    // 가벼운 컴프레서(피크 눌러서 안정화)
    comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -28;
    comp.knee.value = 18;
    comp.ratio.value = 4;
    comp.attack.value = 0.012;
    comp.release.value = 0.20;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.65; // 너무 높지 않게(디테일 보존)

    srcNode.connect(comp);
    comp.connect(analyser);

    freqU8 = new Uint8Array(analyser.frequencyBinCount);
    timeU8 = new Uint8Array(analyser.fftSize);
  }

  // ===== Loop =====
  let start = performance.now();
  let lastUpload = 0;
  
  let pendingTarget = 0;     // 0 or 1
  let pendingSmooth = 0;     // EMA된 값(0~1)
  const pendingAlpha = 0.05; // 부드러운 전환 속도(0.12~0.25 권장)
  let timeEff = 0;            // 누적 시간(초)
  let lastNow = 0;
  
  // 외부에서 호출: 서버 요청 보낼 때 true, 응답 완료 시 false
  window.fxSetPending = (v) => { pendingTarget = v ? 1 : 0; };
  setInterval(() => {
    fxSetPending(pendingTarget === 0);
  }, 5000);
  
  function loop(now){
    resize();
    gl.useProgram(prog);

    const t = (now - start) * 0.001;
    const dt = (now - lastNow) * 0.001;  // 초
    lastNow = now;
    const speed = 1.0 - pendingSmooth * 0.75;
    timeEff += dt * speed;
    gl.uniform1f(uTimeEff, timeEff);
    
    gl.uniform3f(uRes, canvas.width, canvas.height, 1.0);
    gl.uniform1f(uTime, t);

    pendingSmooth = pendingSmooth*(1 - pendingAlpha) + pendingTarget*pendingAlpha;
    gl.uniform1f(uPending, pendingSmooth);

    // 오디오 갱신(60Hz 스로틀)
    if (analyser && (now - lastUpload) > (1000/60)) {
      analyser.getByteFrequencyData(freqU8);
      analyser.getByteTimeDomainData(timeU8);

      // 레벨(느슨히)
      const lvl = computeLevel(timeU8);
      gl.uniform1f(uLevel, lvl);

      // 음성 중심 4밴드
      const b0 = bandPower(freqU8,   85,  300);   // F0/저역
      const b1 = bandPower(freqU8,  300, 1000);   // formant1
      const b2 = bandPower(freqU8, 1000, 3000);   // formant2~3
      const b3 = bandPower(freqU8, 3000, 8000);   // sibilance
      gl.uniform1fv(uVox0, new Float32Array([b0,b1,b2,b3]));

      lastUpload = now;
    } else if (!analyser) {
      gl.uniform1f(uLevel, 0.0);
      gl.uniform1fv(uVox0, new Float32Array(4));
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ===== Start on user gesture =====
  const hint = document.createElement('div');
  hint.textContent = 'Tap/Click to enable microphone';
  Object.assign(hint.style, {
    position:'fixed', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
    font:'600 16px/1.4 system-ui, sans-serif', color:'#fff',
    background:'rgba(0,0,0,0.35)', padding:'12px 16px', borderRadius:'10px',
    zIndex:9999, pointerEvents:'none'
  });
  document.body.appendChild(hint);

  async function startAudio(){
    try{
      await initMic();
      hint.remove();
      window.removeEventListener('pointerdown', startAudio, {capture:true});
    }catch(e){
      console.error(e);
      hint.textContent = 'Microphone permission denied';
    }
  }
  window.addEventListener('pointerdown', startAudio, {capture:true, once:true});
})();

