#!/bin/bash
# Complete system health check

echo "🏥 iwanyu Marketplace - System Health Check"
echo "============================================"
echo ""

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo "✅ $2"
  else
    echo "❌ $2"
  fi
}

# Check Node.js
node --version > /dev/null 2>&1
print_status $? "Node.js installed"

# Check npm
npm --version > /dev/null 2>&1
print_status $? "npm installed"

# Check dependencies
if [ -d "node_modules" ]; then
  print_status 0 "Dependencies installed"
else
  print_status 1 "Dependencies missing (run: npm install)"
fi

# Check environment file
if [ -f ".env.local" ]; then
  print_status 0 ".env.local exists"
  
  # Check required variables
  if grep -q "VITE_SUPABASE_URL" .env.local; then
    print_status 0 "VITE_SUPABASE_URL configured"
  else
    print_status 1 "VITE_SUPABASE_URL missing"
  fi
  
  if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    print_status 0 "VITE_SUPABASE_ANON_KEY configured"
  else
    print_status 1 "VITE_SUPABASE_ANON_KEY missing"
  fi
  
  if grep -q "VITE_CLOUDINARY_CLOUD_NAME" .env.local; then
    print_status 0 "VITE_CLOUDINARY_CLOUD_NAME configured"
  else
    print_status 1 "VITE_CLOUDINARY_CLOUD_NAME missing"
  fi
else
  print_status 1 ".env.local missing"
fi

echo ""
echo "🔨 Build Test"
echo "============================================"

# Test build
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  print_status 0 "Build successful"
  
  # Check build output
  if [ -d "dist" ]; then
    print_status 0 "Build output exists"
    
    # Check bundle size
    SIZE=$(du -sh dist/assets/*.js 2>/dev/null | awk '{print $1}' | head -1)
    if [ -n "$SIZE" ]; then
      echo "📦 Bundle size: $SIZE"
    fi
  else
    print_status 1 "Build output missing"
  fi
else
  print_status 1 "Build failed"
fi

echo ""
echo "🗄️  Database Connection"
echo "============================================"

# Test database connection
if command -v node &> /dev/null; then
  node scripts/verify-sync.mjs > /tmp/db_check.log 2>&1
  if grep -q "All systems connected" /tmp/db_check.log; then
    print_status 0 "Database connected"
    
    # Extract product count
    PRODUCTS=$(grep "Products:" /tmp/db_check.log | awk '{print $3}')
    if [ -n "$PRODUCTS" ]; then
      echo "📊 Products: $PRODUCTS"
    fi
    
    # Extract category count
    CATEGORIES=$(grep "Categories:" /tmp/db_check.log | awk '{print $3}')
    if [ -n "$CATEGORIES" ]; then
      echo "📂 Categories: $CATEGORIES"
    fi
    
    # Extract vendor count
    VENDORS=$(grep "Vendors:" /tmp/db_check.log | awk '{print $3}')
    if [ -n "$VENDORS" ]; then
      echo "🏪 Vendors: $VENDORS"
    fi
  else
    print_status 1 "Database connection failed"
  fi
  rm -f /tmp/db_check.log
fi

echo ""
echo "☁️  Edge Functions"
echo "============================================"

# Check Edge Functions
if command -v npx &> /dev/null; then
  FUNCTIONS=$(npx supabase functions list 2>/dev/null | grep "ACTIVE" | wc -l | tr -d ' ')
  if [ "$FUNCTIONS" -ge 2 ]; then
    print_status 0 "Edge Functions deployed ($FUNCTIONS active)"
  else
    print_status 1 "Edge Functions missing or inactive"
  fi
fi

echo ""
echo "🌐 Deployment"
echo "============================================"

# Check git status
if git rev-parse --git-dir > /dev/null 2>&1; then
  print_status 0 "Git repository initialized"
  
  # Check for uncommitted changes
  if [ -z "$(git status --porcelain)" ]; then
    print_status 0 "No uncommitted changes"
  else
    CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
    echo "⚠️  $CHANGES uncommitted changes"
  fi
  
  # Check remote
  if git remote get-url origin > /dev/null 2>&1; then
    print_status 0 "GitHub remote configured"
  else
    print_status 1 "GitHub remote missing"
  fi
else
  print_status 1 "Git not initialized"
fi

echo ""
echo "============================================"
echo "📋 Health Check Complete"
echo ""
echo "Next Steps:"
echo "1. If any checks failed, fix them"
echo "2. Run: npm run dev (local testing)"
echo "3. Run: ./deploy.sh (deploy to production)"
echo "============================================"
