import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { AudioVisualizer } from './components/AudioVisualizer'
import { InfoPanel } from './components/InfoPanel'
import { MicrophoneHint } from './components/MicrophoneHint'

function App() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [pendingState, setPendingState] = useState(false)

  // 외부에서 호출할 수 있는 함수
  useEffect(() => {
    window.fxSetPending = (value) => {
      setPendingState(value)
    }
  }, [])

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{ 
          antialias: false, 
          premultipliedAlpha: false,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 1)
        }}
      >
        <AudioVisualizer 
          isAudioEnabled={isAudioEnabled}
          pendingState={pendingState}
        />
      </Canvas>
      
      <InfoPanel />
      
      {!isAudioEnabled && (
        <MicrophoneHint onEnable={() => setIsAudioEnabled(true)} />
      )}
    </>
  )
}

export default App
