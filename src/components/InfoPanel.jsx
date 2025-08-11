import React from 'react'

export function InfoPanel() {
  return (
    <div className="info">
      <h3>🎵 WebGL2 Shader Demo</h3>
      <p><strong>기술:</strong> React Three Fiber + Web Audio API</p>
      <p><strong>셰이더:</strong> Raymarching 기반 음성 반응형</p>
      <p><strong>음성 분석:</strong> 4개 주파수 밴드 실시간 처리</p>
      <p><strong>상태 제어:</strong> <code>window.fxSetPending(true/false)</code></p>
      <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
        <p>마이크에 말하거나 소리를 내어 시각화 효과를 확인하세요</p>
      </div>
    </div>
  )
}
