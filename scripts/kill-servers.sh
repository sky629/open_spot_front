#!/bin/bash

# 개발 서버 종료 스크립트 (로컬 및 Docker 지원)

echo "🔍 실행 중인 개발 서버들을 찾는 중..."

# Docker 컨테이너 확인 및 종료
echo "🐳 Docker 컨테이너 확인 중..."
if command -v docker &> /dev/null; then
    # 개발 환경 컨테이너 종료
    DEV_CONTAINERS=$(docker ps -q --filter "name=open-spot-frontend-dev" --filter "name=open-spot-nginx-dev")
    if [ ! -z "$DEV_CONTAINERS" ]; then
        echo "   개발 Docker 컨테이너 종료 중..."
        docker stop $DEV_CONTAINERS 2>/dev/null || true
    else
        echo "   실행 중인 개발 Docker 컨테이너 없음"
    fi

    # 프로덕션 환경 컨테이너 종료
    PROD_CONTAINERS=$(docker ps -q --filter "name=open-spot-frontend" --filter "name=open-spot-nginx")
    if [ ! -z "$PROD_CONTAINERS" ]; then
        echo "   프로덕션 Docker 컨테이너 종료 중..."
        docker stop $PROD_CONTAINERS 2>/dev/null || true
    else
        echo "   실행 중인 프로덕션 Docker 컨테이너 없음"
    fi
else
    echo "   Docker가 설치되지 않음"
fi

# 포트 확인 및 종료
echo "📍 포트 사용 중인 프로세스 종료 중..."
# 포트 80 (nginx)
lsof -ti:80 | xargs sudo kill -9 2>/dev/null || echo "   포트 80에 실행 중인 프로세스 없음"
# 포트 3000 (개발 서버)
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "   포트 3000에 실행 중인 프로세스 없음"

# yarn dev 프로세스 모두 종료
echo "🧶 yarn dev 프로세스 종료 중..."
pkill -f "yarn dev" 2>/dev/null || echo "   실행 중인 yarn dev 프로세스 없음"

# vite 프로세스 모두 종료
echo "⚡ vite 프로세스 종료 중..."
pkill -f "vite" 2>/dev/null || echo "   실행 중인 vite 프로세스 없음"

# node 프로세스 중 개발 서버 관련 종료 (주의: 다른 node 앱은 보존)
echo "🟢 개발 서버 관련 node 프로세스 종료 중..."
pkill -f "node.*vite" 2>/dev/null || echo "   실행 중인 vite node 프로세스 없음"

echo ""
echo "✅ 모든 개발 서버가 종료되었습니다!"
echo ""

# 선택적으로 새 서버 시작
read -p "🚀 새로운 개발 서버를 시작하시겠습니까? (로컬: y, Docker 개발: d, 종료: N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🎯 로컬 개발 서버 시작 중..."
    yarn dev
elif [[ $REPLY =~ ^[Dd]$ ]]; then
    echo "🐳 Docker 개발 환경 시작 중..."
    yarn docker:dev
else
    echo "👋 개발 서버 종료 완료!"
fi