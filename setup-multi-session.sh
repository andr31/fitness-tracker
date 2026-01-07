#!/bin/bash

# Multi-Session Feature Setup Script
# Run this script to set up the multi-session feature on your database

set -e  # Exit on error

echo "========================================="
echo "Multi-Session Feature Setup"
echo "========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your database connection string."
    exit 1
fi

echo "Step 1: Installing dependencies..."
npm install bcryptjs @types/bcryptjs

echo ""
echo "Step 2: Creating sessions tables..."
npx tsx create-sessions-tables.ts

echo ""
echo "Step 3: Adding sessionId columns to existing tables..."
npx tsx add-sessionid-to-tables.ts

echo ""
echo "Step 4: Migrating existing data to default session..."
npx tsx migrate-to-sessions.ts

echo ""
echo "========================================="
echo "✅ Multi-Session Setup Complete!"
echo "========================================="
echo ""
echo "🎯 Default Session Created:"
echo "   Name: Default Session"
echo "   Password: fitness2026"
echo ""
echo "⚠️  IMPORTANT: Change the default password immediately!"
echo ""
echo "📚 Next Steps:"
echo "   1. Start your app: npm run dev"
echo "   2. Click the 'Sessions' button in the header"
echo "   3. Select 'Default Session'"
echo "   4. Log in with password: fitness2026"
echo "   5. Create new sessions for different competitions"
echo ""
echo "📖 For more information, see MULTI_SESSION_GUIDE.md"
echo ""
