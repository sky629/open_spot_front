#!/bin/bash

# 개발 서버 종료 스크립트

echo "🔍 실행 중인 개발 서버들을 찾는 중..."

# 포트 3000 실행 중인 프로세스 종료
echo "📍 포트 3000 프로세스 종료 중..."
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
read -p "🚀 새로운 개발 서버를 시작하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🎯 개발 서버 시작 중..."
    yarn dev
else
    echo "👋 개발 서버 종료 완료!"
fi