#!/bin/bash

echo "WebGL2 Shader Demo 서버 시작 중..."
echo ""

# Python 3 확인
if command -v python3 &> /dev/null; then
    echo "Python 3를 사용하여 서버를 시작합니다..."
    echo "브라우저에서 http://localhost:8000 으로 접속하세요"
    echo "서버를 중지하려면 Ctrl+C를 누르세요"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Python을 사용하여 서버를 시작합니다..."
    echo "브라우저에서 http://localhost:8000 으로 접속하세요"
    echo "서버를 중지하려면 Ctrl+C를 누르세요"
    echo ""
    python -m SimpleHTTPServer 8000
elif command -v node &> /dev/null; then
    echo "Node.js를 사용하여 서버를 시작합니다..."
    echo "브라우저에서 http://localhost:8080 으로 접속하세요"
    echo "서버를 중지하려면 Ctrl+C를 누르세요"
    echo ""
    npx http-server -p 8080
else
    echo "Python 또는 Node.js가 설치되어 있지 않습니다."
    echo ""
    echo "설치 방법:"
    echo "  - Python: https://www.python.org/downloads/"
    echo "  - Node.js: https://nodejs.org/"
    echo ""
    echo "또는 index.html 파일을 브라우저에서 직접 열어보세요."
    exit 1
fi 