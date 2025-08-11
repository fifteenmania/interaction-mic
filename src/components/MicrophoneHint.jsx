import React from 'react'

export function MicrophoneHint({ onEnable }) {
  const handleClick = () => {
    onEnable()
  }

  return (
    <div className="hint" onClick={handleClick} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
      🎤 마이크를 활성화하려면 클릭하세요
    </div>
  )
}
