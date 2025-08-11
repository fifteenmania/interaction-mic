# WebGL2 Shader Demo - React Three Fiber

이 프로젝트는 React Three Fiber와 Web Audio API를 사용하여 실시간 음성 입력에 반응하는 인터랙티브 셰이더 데모입니다.

## 🎯 주요 기능

- **실시간 음성 분석**: 마이크 입력을 통한 실시간 오디오 처리
- **동적 셰이더 렌더링**: 음성 레벨과 주파수에 반응하는 WebGL2 셰이더
- **음성 밴드 분석**: 4개 주파수 밴드로 음성 특성 분석
  - B0: 85-300 Hz (기본 주파수/저역)
  - B1: 300-1000 Hz (formant 1)
  - B2: 1-3 kHz (formant 2~3)
  - B3: 3-8 kHz (치찰음/자음)
- **인터랙티브 시각화**: 음성 강도에 따른 색상 변화와 애니메이션
- **React 기반**: 모던한 React 컴포넌트 아키텍처

## 🚀 시작하기

### 요구사항
- Node.js 16+
- WebGL2를 지원하는 최신 브라우저
- 마이크 접근 권한

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

1. 브라우저에서 `http://localhost:3000` 열기
2. 화면을 클릭하여 마이크 권한 허용
3. 마이크에 말하거나 소리를 내어 시각화 효과 확인

## 🛠️ 기술 스택

- **React 18**: 모던 React 훅과 컴포넌트
- **React Three Fiber**: Three.js를 위한 React 렌더러
- **Three.js**: WebGL 기반 3D 그래픽 라이브러리
- **Web Audio API**: 실시간 오디오 처리 및 분석
- **GLSL 셰이더**: 고성능 그래픽 파이프라인
- **Vite**: 빠른 개발 서버 및 빌드 도구

## 📁 프로젝트 구조

```
interaction-demo/
├── src/
│   ├── components/
│   │   ├── AudioVisualizer.jsx    # 메인 셰이더 컴포넌트
│   │   ├── InfoPanel.jsx          # 정보 표시 패널
│   │   └── MicrophoneHint.jsx     # 마이크 활성화 힌트
│   ├── hooks/
│   │   └── useAudioAnalyzer.js    # 오디오 분석 커스텀 훅
│   ├── App.jsx                    # 메인 앱 컴포넌트
│   └── main.jsx                   # React 앱 진입점
├── index.html                     # 메인 HTML 파일
├── package.json                   # 프로젝트 의존성
├── vite.config.js                 # Vite 설정
└── README.md                      # 프로젝트 문서
```

## 🎨 셰이더 특징

### Fragment Shader
- **Raymarching**: 복잡한 3D 기하학적 패턴 생성
- **음성 반응**: 음성 레벨과 주파수에 따른 동적 변화
- **색상 변환**: RGB-HSL 변환을 통한 다이나믹한 색상 조정
- **시간 기반 애니메이션**: 부드러운 시각적 전환

### 주요 Uniform 변수
- `uLevel`: 전체 음성 레벨 (0~0.6)
- `uVox[4]`: 4개 주파수 밴드의 파워 값
- `uPending`: 챗봇 대기 상태 (0~1)
- `iTime`: 경과 시간
- `iResolution`: 캔버스 해상도

## 🔊 오디오 처리

### 분석 파라미터
- **FFT 크기**: 1024 샘플
- **샘플링 레이트**: 44.1kHz
- **스무딩**: 0.65 (디테일 보존)
- **컴프레서**: 동적 범위 압축으로 안정적인 신호

### 신호 처리
- **RMS 계산**: 실시간 음성 레벨 측정
- **밴드 파워**: 주파수별 에너지 분석
- **60fps 제한**: 성능 최적화된 업데이트 주기

## 🎮 사용법

1. **시작**: 화면을 클릭하여 마이크 활성화
2. **음성 입력**: 마이크에 말하거나 소리 내기
3. **시각적 피드백**: 음성에 따라 변화하는 셰이더 효과 관찰
4. **대기 상태**: `fxSetPending()` 함수로 시각적 상태 제어

## 🔧 커스터마이징

### 셰이더 파라미터 조정
```javascript
// pending 상태 설정
window.fxSetPending(true);   // 대기 상태
window.fxSetPending(false);  // 활성 상태
```

### 오디오 설정 조정
```javascript
// src/hooks/useAudioAnalyzer.js에서 다음 값들을 조정 가능
const levelGate = 0.02;      // 노이즈 게이트
const levelMax = 0.6;        // 최대 레벨
```

### 셰이더 수정
```javascript
// src/components/AudioVisualizer.jsx의 fragmentShader를 수정
// GLSL 코드를 직접 편집하여 시각적 효과 변경
```

## 🌟 성능 최적화

- **60fps 제한**: 오디오 분석 주기 최적화
- **하드웨어 가속**: WebGL2를 통한 GPU 가속
- **React 최적화**: useMemo와 useCallback을 통한 불필요한 재렌더링 방지
- **메모리 효율성**: Float32Array 사용으로 빠른 데이터 처리

## 📱 브라우저 호환성

- ✅ Chrome 56+
- ✅ Firefox 51+
- ✅ Safari 15+
- ✅ Edge 79+

## 🚀 개발 환경

### 개발 서버
```bash
npm run dev
```
- Hot Module Replacement (HMR)
- 빠른 리로드
- 소스맵 지원

### 빌드
```bash
npm run build
```
- 프로덕션 최적화
- 코드 분할
- 압축 및 최소화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🙏 감사의 말

- React Three Fiber 커뮤니티
- Three.js 개발팀
- Web Audio API 표준화 그룹
- GLSL 셰이더 개발자들

---

**참고**: 이 데모는 실시간 음성 입력을 처리하므로 마이크 권한이 필요합니다. 브라우저에서 권한을 허용해야 정상적으로 작동합니다.
