#!/bin/bash
# Deploy script for Convex to production

echo "Deploying Convex to production..."
echo "Note: This requires Node.js 18+ to work properly"

# Check if we have the right Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Warning: Node.js $NODE_VERSION detected. Convex requires Node.js 18+"
    echo "Please upgrade Node.js or use a compatible environment"
    exit 1
fi

# Deploy to production
npx convex deploy --prod

echo ""
echo "After deployment:"
echo "1. Copy the production URL from the output above"
echo "2. Set VITE_CONVEX_URL in Cloudflare Pages environment variables"
echo "3. Set TMDB_API_KEY in Cloudflare Pages environment variables"
echo "4. Redeploy your Cloudflare Pages site"
