#!/bin/bash

# ChemClass Pro - Deployment Helper Script

echo "🚀 ChemClass Pro Deployment Helper"
echo "=================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: ChemClass Pro application"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create a GitHub repository at https://github.com/new"
echo "2. Run: git remote add origin YOUR_GITHUB_REPO_URL"
echo "3. Run: git push -u origin main"
echo ""
echo "📊 Choose your deployment platform:"
echo ""
echo "   Option 1: Vercel (https://vercel.com)"
echo "   - Most popular for Next.js"
echo "   - Best performance"
echo "   - Free tier available"
echo ""
echo "   Option 2: Render (https://render.com)"
echo "   - All-in-one (hosting + database)"
echo "   - Easy to set up"
echo "   - Free tier available"
echo ""
echo "   Option 3: Railway (https://railway.app)"
echo "   - Built-in database"
echo "   - Easy setup"
echo "   - Free tier available"
echo ""
echo "⚠️  IMPORTANT: You need a PostgreSQL database for production!"
echo "   Get one for free from:"
echo "   - Supabase: https://supabase.com"
echo "   - Neon: https://neon.tech"
echo ""
echo "📝 After creating your database:"
echo "   1. Update DATABASE_URL in your deployment platform"
echo "   2. Update prisma/schema.prisma to use 'postgresql' instead of 'sqlite'"
echo "   3. Deploy!"
echo ""
echo "💡 For detailed instructions, see DEPLOYMENT.md"
