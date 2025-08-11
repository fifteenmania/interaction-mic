# WebGL2 Shader Demo

이 프로젝트는 WebGL2를 사용하여 실시간 셰이더를 렌더링하는 데모입니다.

## 특징

- **WebGL2 기반**: 최신 WebGL2 API 사용
- **실시간 렌더링**: 60fps 실시간 셰이더 렌더링
- **fBm 노이즈**: 4 octave fractional Brownian motion 노이즈
- **Cos LUT 최적화**: 코사인 함수를 텍스처 LUT로 최적화
- **Ray Marching**: SDF 기반 레이 마칭으로 링 구조 렌더링
- **동적 카메라**: 시간에 따른 카메라 움직임

## 기술적 세부사항

### 셰이더 구조
- **버텍스 셰이더**: 풀스크린 쿼드 렌더링
- **프래그먼트 셰이더**: 메인 렌더링 로직
  - 4 octave fBm 노이즈
  - 로드리게스 회전 공식
  - 링 SDF (Signed Distance Function)
  - 톤매핑

### 최적화 기법
- Cos LUT 텍스처로 삼각함수 계산 최적화
- 3D 노이즈 텍스처로 노이즈 계산 최적화
- 조기 종료 조건으로 레이 마칭 최적화

## 실행 방법

### 1. 로컬 서버 실행 (권장)

```bash
# Python 3 사용
python3 -m http.server 8000

# 또는 Python 2 사용
python -m SimpleHTTPServer 8000

# 또는 Node.js 사용
npx http-server
```

### 2. 브라우저에서 접속

```
http://localhost:8000
```

### 3. 직접 파일 열기

`index.html` 파일을 브라우저에서 직접 열 수도 있지만, 일부 기능이 제한될 수 있습니다.

## 시스템 요구사항

- **브라우저**: WebGL2 지원 브라우저 (Chrome 56+, Firefox 51+, Safari 15+)
- **GPU**: WebGL2 지원 그래픽 카드
- **메모리**: 최소 2GB RAM 권장

## 파일 구조

```
interaction-demo/
├── index.html          # 메인 HTML 파일
├── shader.js           # WebGL2 셰이더 코드
└── README.md           # 이 파일
```

## 문제 해결

### WebGL2 미지원
- 최신 브라우저 사용
- 하드웨어 가속 활성화
- 그래픽 드라이버 업데이트

### 성능 문제
- 브라우저 개발자 도구에서 GPU 프로파일링 확인
- 다른 브라우저로 테스트
- 하드웨어 가속 설정 확인

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 참고 자료

- [WebGL2 Specification](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [GLSL ES 3.0 Specification](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf)
- [Ray Marching Tutorial](https://iquilezles.org/articles/distfunctions2d/) 