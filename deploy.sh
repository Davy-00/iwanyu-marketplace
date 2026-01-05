#!/bin/bash
# Quick deployment script - Run this to deploy all changes

set -e

echo "🚀 iwanyu Marketplace - Quick Deploy Script"
echo "=========================================="

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "📝 Committing changes..."
  git add -A
  
  # Get commit message or use default
  if [ -z "$1" ]; then
    COMMIT_MSG="Update marketplace: $(date +%Y-%m-%d)"
  else
    COMMIT_MSG="$1"
  fi
  
  git commit -m "$COMMIT_MSG"
  echo "✅ Changes committed"
else
  echo "✅ No changes to commit"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
npx vercel deploy --prod -y
echo "✅ Deployed to production"

echo ""
echo "=========================================="
echo "🎉 Deployment complete!"
echo "Production URL: https://iwanyu-marketplace.vercel.app"
echo "=========================================="
