#!/bin/bash

# Quick Vercel Deployment Script
# This script helps you deploy the frontend to Vercel

echo "🚀 Handsome Restaurant - Vercel Deployment"
echo "=========================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔐 Logging in to Vercel..."
vercel login

echo ""
echo "📁 Deploying frontend..."
cd frontend

echo ""
echo "🌐 Setting up project..."
vercel

echo ""
echo "⚙️  Setting environment variables..."
echo "Please enter your backend URL (e.g., https://your-backend.railway.app):"
read BACKEND_URL

vercel env add REACT_APP_API_URL production
echo "$BACKEND_URL" | vercel env add REACT_APP_API_URL production

vercel env add REACT_APP_SOCKET_URL production
echo "$BACKEND_URL" | vercel env add REACT_APP_SOCKET_URL production

echo ""
echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Deploy backend to Railway/Render/Fly.io"
echo "   2. Update CORS settings in backend/server.js"
echo "   3. Test all interfaces"
