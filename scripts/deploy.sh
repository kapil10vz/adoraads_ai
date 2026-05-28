#!/bin/bash

# adoraads.ai Waitlist Server Deployment Script
# Runs full test, QA, build, and deployment checks

set -e

echo ""
echo "🚀 adoraads.ai Waitlist Server — Deployment Pipeline"
echo "════════════════════════════════════════════════════════"
echo ""

# Step 1: Check environment
echo "📋 Step 1: Checking environment..."
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "   Copy .env.example to .env and update with your values"
  exit 1
fi
echo "✅ .env file found"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm ci --prefer-offline
echo "✅ Dependencies installed"
echo ""

# Step 3: Lint and QA
echo "🔍 Step 3: Running linting and QA..."
npm run lint:check || {
  echo "⚠️  Lint errors found. Run 'npm run lint' to auto-fix"
  exit 1
}
echo "✅ Linting passed"
echo ""

# Step 4: Unit tests
echo "🧪 Step 4: Running unit tests..."
npm run test:unit || exit 1
echo "✅ Unit tests passed"
echo ""

# Step 5: Build check
echo "🏗️  Step 5: Build verification..."
npm run build || exit 1
echo "✅ Build verified"
echo ""

echo "════════════════════════════════════════════════════════"
echo "✅ All deployment checks passed!"
echo ""
echo "Next steps:"
echo "  • Railway (recommended): railway up"
echo "  • Render: git push to your Render branch"
echo "  • Fly.io: flyctl deploy"
echo ""
