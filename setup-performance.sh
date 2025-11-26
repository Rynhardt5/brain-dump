#!/bin/bash

echo "🚀 Setting up Performance Optimizations..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp env.example .env
    echo "✅ Created .env file - please fill in your Pusher credentials"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies (pusher, pusher-js)..."
npm install
echo ""

# Run database migration
echo "🗄️  Running database migration..."
echo "This will add indexes and denormalized fields..."
npm run db:push
echo ""

echo "✅ Performance optimizations setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Sign up for Pusher at https://pusher.com/ (free tier)"
echo "2. Add Pusher credentials to your .env file:"
echo "   - PUSHER_APP_ID"
echo "   - PUSHER_SECRET"
echo "   - NEXT_PUBLIC_PUSHER_KEY"
echo "   - NEXT_PUBLIC_PUSHER_CLUSTER"
echo "3. Run 'npm run dev' to start the app"
echo ""
echo "📖 See PERFORMANCE_OPTIMIZATION.md for details"
