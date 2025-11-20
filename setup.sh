#!/bin/bash

# DUDSZ.lk Quick Setup Script
# This script helps you quickly set up the development environment

set -e

echo "🚀 DUDSZ.lk Setup Script"
echo "========================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and configure your database connection"
else
    echo "✅ .env file already exists"
fi

# Check for Docker
echo ""
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker is installed"
    echo ""
    read -p "Do you want to start with Docker? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🐳 Starting Docker containers..."
        docker-compose up -d
        echo ""
        echo "✅ Application is starting!"
        echo "   - Frontend: http://localhost:3000"
        echo "   - Admin: http://localhost:3000/admin/login"
        echo "   - Default credentials: admin@dudsz.lk / admin123"
        echo ""
        echo "📊 View logs with: docker-compose logs -f app"
        exit 0
    fi
fi

# Local setup
echo ""
echo "💻 Setting up local development..."
echo ""

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found."
    echo "   Make sure PostgreSQL is installed and running."
    echo "   Update DATABASE_URL in .env with your connection string"
else
    echo "✅ PostgreSQL is available"
fi

echo ""
echo "🗄️  Setting up database..."
echo "   Running: npx prisma migrate dev"
npx prisma migrate dev --name init

echo ""
echo "🌱 Seeding database..."
echo "   Running: npx prisma db seed"
npx prisma db seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To open Prisma Studio:"
echo "  npm run prisma:studio"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@dudsz.lk"
echo "  Password: admin123"
echo ""
echo "Access points:"
echo "  - Customer site: http://localhost:3000"
echo "  - Admin panel: http://localhost:3000/admin/login"
echo ""
echo "Happy coding! 🎉"
