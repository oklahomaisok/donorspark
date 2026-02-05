#!/bin/bash
# Deploy to staging environment

echo "🚀 Deploying to STAGING..."
echo ""

# Check we're on staging branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "staging" ]; then
  echo "⚠️  You're on '$BRANCH' branch. Switch to 'staging' first:"
  echo "   git checkout staging"
  echo "   git merge main  # to get latest changes"
  exit 1
fi

# Deploy to Vercel preview (staging branch auto-deploys)
echo "📦 Pushing to staging branch (Vercel auto-deploys)..."
git push origin staging

# Deploy to Trigger.dev staging
echo ""
echo "⚙️  Deploying to Trigger.dev staging..."
npx trigger.dev@latest deploy --env staging

echo ""
echo "✅ Staging deployment complete!"
echo ""
echo "📍 Vercel staging URL: Check Vercel dashboard for preview URL"
echo "📍 Trigger.dev: Check dashboard for staging environment"
