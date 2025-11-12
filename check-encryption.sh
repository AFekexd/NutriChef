#!/bin/bash

# Deployment Verification Script for NutriChef
# This script checks if encryption keys are properly configured

echo "🔍 NutriChef Encryption Configuration Checker"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yaml" ]; then
    echo "❌ Error: docker-compose.yaml not found"
    echo "Please run this script from the NutriChef root directory"
    exit 1
fi

# Check frontend .env
echo "📁 Checking frontend configuration..."
if [ -f "frontend/.env" ]; then
    FRONTEND_KEY=$(grep "VITE_ENCRYPTION_KEY" frontend/.env | cut -d '=' -f 2 | tr -d '"' | tr -d "'")
    if [ -z "$FRONTEND_KEY" ]; then
        echo "❌ VITE_ENCRYPTION_KEY not found in frontend/.env"
    else
        echo "✅ Frontend encryption key found: ${FRONTEND_KEY:0:8}...${FRONTEND_KEY: -8}"
        echo "   Length: ${#FRONTEND_KEY} characters"
    fi
else
    echo "❌ frontend/.env file not found!"
    echo "   Create it with: echo 'VITE_ENCRYPTION_KEY=0jUtz49sXOaHvmTVEBP5Wv51adJyGAVg' > frontend/.env"
fi

echo ""

# Check backend .env
echo "📁 Checking backend configuration..."
if [ -f "backend/.env" ]; then
    BACKEND_KEY=$(grep "CLIENT_ENCRYPTION_KEY" backend/.env | cut -d '=' -f 2 | tr -d '"' | tr -d "'")
    if [ -z "$BACKEND_KEY" ]; then
        echo "❌ CLIENT_ENCRYPTION_KEY not found in backend/.env"
    else
        echo "✅ Backend encryption key found: ${BACKEND_KEY:0:8}...${BACKEND_KEY: -8}"
        echo "   Length: ${#BACKEND_KEY} characters"
    fi
else
    echo "❌ backend/.env file not found!"
fi

echo ""

# Compare keys
echo "🔐 Comparing encryption keys..."
if [ -n "$FRONTEND_KEY" ] && [ -n "$BACKEND_KEY" ]; then
    if [ "$FRONTEND_KEY" = "$BACKEND_KEY" ]; then
        echo "✅ Keys match! Encryption should work correctly."
    else
        echo "❌ Keys DO NOT match!"
        echo "   Frontend: ${FRONTEND_KEY:0:8}...${FRONTEND_KEY: -8}"
        echo "   Backend:  ${BACKEND_KEY:0:8}...${BACKEND_KEY: -8}"
        echo ""
        echo "   Fix this by ensuring both keys are:"
        echo "   VITE_ENCRYPTION_KEY=0jUtz49sXOaHvmTVEBP5Wv51adJyGAVg"
        echo "   CLIENT_ENCRYPTION_KEY=0jUtz49sXOaHvmTVEBP5Wv51adJyGAVg"
    fi
else
    echo "⚠️  Cannot compare - one or both keys are missing"
fi

echo ""

# Check if frontend needs rebuild
echo "📦 Checking if frontend needs rebuild..."
if [ -d "frontend/dist" ]; then
    DIST_TIME=$(stat -c %Y frontend/dist 2>/dev/null || stat -f %m frontend/dist 2>/dev/null)
    ENV_TIME=$(stat -c %Y frontend/.env 2>/dev/null || stat -f %m frontend/.env 2>/dev/null)
    
    if [ -n "$DIST_TIME" ] && [ -n "$ENV_TIME" ]; then
        if [ $ENV_TIME -gt $DIST_TIME ]; then
            echo "⚠️  frontend/.env is newer than dist/ - rebuild required!"
            echo "   Run: cd frontend && npm run build"
        else
            echo "✅ Frontend build is up to date"
        fi
    fi
else
    echo "⚠️  frontend/dist not found - build required"
    echo "   Run: cd frontend && npm run build"
fi

echo ""
echo "=============================================="
echo "📋 Summary"
echo "=============================================="

if [ -n "$FRONTEND_KEY" ] && [ -n "$BACKEND_KEY" ] && [ "$FRONTEND_KEY" = "$BACKEND_KEY" ]; then
    echo "✅ Configuration looks good!"
    echo ""
    echo "Next steps:"
    echo "1. Rebuild frontend: cd frontend && npm run build"
    echo "2. Restart services: docker-compose down && docker-compose up -d --build"
else
    echo "❌ Configuration issues detected"
    echo ""
    echo "Fix by running:"
    echo "1. echo 'VITE_ENCRYPTION_KEY=0jUtz49sXOaHvmTVEBP5Wv51adJyGAVg' > frontend/.env"
    echo "2. Ensure backend/.env has: CLIENT_ENCRYPTION_KEY=0jUtz49sXOaHvmTVEBP5Wv51adJyGAVg"
    echo "3. cd frontend && npm run build"
    echo "4. docker-compose down && docker-compose up -d --build"
fi

echo ""
