import { useState, useEffect, useRef } from 'react'

export function useAudioAnalyzer(isEnabled) {
  const [audioData, setAudioData] = useState({
    level: 0.0,
    bands: [0.0, 0.0, 0.0, 0.0]
  })

  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const compressorRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastUpdateRef = useRef(0)

  // 오디오 컨텍스트 초기화
  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const audioCtx = audioContextRef.current
      
      sourceNodeRef.current = audioCtx.createMediaStreamSource(stream)
      
      // 컴프레서 설정
      compressorRef.current = audioCtx.createDynamicsCompressor()
      compressorRef.current.threshold.value = -28
      compressorRef.current.knee.value = 18
      compressorRef.current.ratio.value = 4
      compressorRef.current.attack.value = 0.012
      compressorRef.current.release.value = 0.20
      
      // 분석기 설정
      analyserRef.current = audioCtx.createAnalyser()
      analyserRef.current.fftSize = 1024
      analyserRef.current.smoothingTimeConstant = 0.65
      
      // 노드 연결
      sourceNodeRef.current.connect(compressorRef.current)
      compressorRef.current.connect(analyserRef.current)
      
      return true
    } catch (error) {
      console.error('마이크 접근 실패:', error)
      return false
    }
  }

  // 주파수 밴드 파워 계산
  const calculateBandPower = (freqData, sampleRate, f0, f1) => {
    const binWidth = sampleRate / 1024
    const a = Math.max(0, Math.min(511, Math.round(f0 / binWidth)))
    const b = Math.max(0, Math.min(511, Math.round(f1 / binWidth)))
    
    let sum = 0
    let count = 0
    
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
      sum += freqData[i]
      count++
    }
    
    return count > 0 ? (sum / count) / 255 : 0
  }

  // RMS 레벨 계산
  const calculateLevel = (timeData) => {
    let rms = 0
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128
      rms += v * v
    }
    rms = Math.sqrt(rms / timeData.length)
    
    // 게이트 및 클램프
    const levelGate = 0.02
    const levelMax = 0.6
    
    rms = rms < levelGate ? 0 : Math.min(rms, levelMax)
    return rms
  }

  // 오디오 데이터 업데이트
  const updateAudioData = () => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const freqData = new Uint8Array(analyser.frequencyBinCount)
    const timeData = new Uint8Array(analyser.fftSize)
    
    analyser.getByteFrequencyData(freqData)
    analyser.getByteTimeDomainData(timeData)
    
    const level = calculateLevel(timeData)
    const sampleRate = audioContextRef.current.sampleRate
    
    const bands = [
      calculateBandPower(freqData, sampleRate, 85, 300),    // B0: F0/저역
      calculateBandPower(freqData, sampleRate, 300, 1000),  // B1: formant1
      calculateBandPower(freqData, sampleRate, 1000, 3000), // B2: formant2~3
      calculateBandPower(freqData, sampleRate, 3000, 8000)  // B3: sibilance
    ]
    
    setAudioData({ level, bands })
  }

  // 오디오 활성화/비활성화
  useEffect(() => {
    if (isEnabled) {
      initAudio().then((success) => {
        if (success) {
          // 60fps로 오디오 데이터 업데이트
          const updateLoop = (timestamp) => {
            if (timestamp - lastUpdateRef.current > (1000 / 60)) {
              updateAudioData()
              lastUpdateRef.current = timestamp
            }
            animationFrameRef.current = requestAnimationFrame(updateLoop)
          }
          animationFrameRef.current = requestAnimationFrame(updateLoop)
        }
      })
    } else {
      // 오디오 정리
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      
      analyserRef.current = null
      sourceNodeRef.current = null
      compressorRef.current = null
      
      setAudioData({ level: 0.0, bands: [0.0, 0.0, 0.0, 0.0] })
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isEnabled])

  return { audioData }
}
