#!/bin/bash
# Deploy to production environment

echo "🚀 Deploying to PRODUCTION..."
echo ""

# Check we're on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️  You're on '$BRANCH' branch. Switch to 'main' first:"
  echo "   git checkout main"
  exit 1
fi

# Deploy to Vercel production
echo "📦 Deploying to Vercel production..."
npx vercel --prod --yes

# Deploy to Trigger.dev production
echo ""
echo "⚙️  Deploying to Trigger.dev production..."
npx trigger.dev@latest deploy

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "📍 Live at: https://donorspark.app"
