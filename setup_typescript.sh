#!/bin/bash

set -e

echo "🚀 Setting up TypeScript Playwright scraper environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node --version)"
    echo "   Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"

echo "📦 Installing Node.js dependencies..."
npm install

echo "🎭 Installing Playwright browsers..."
npx playwright install chromium

echo "🔍 Running type checking..."
npm run type-check

echo "✨ Running code formatting..."
npm run format

echo "🧹 Running linting..."
npm run lint

echo "🏗️ Building TypeScript..."
npm run build

echo "📋 Creating .env file from template..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env file created. Please review and modify as needed."
else
    echo "ℹ️ .env file already exists. Skipping creation."
fi

echo ""
echo "🎉 Setup complete! You can now run the scraper with:"
echo ""
echo "  📋 Development mode (with hot reload):"
echo "     npm run dev"
echo ""
echo "  🚀 Production mode (compiled):"
echo "     npm run build && npm start"
echo ""
echo "  🧪 Run tests:"
echo "     npm test"
echo ""
echo "  🔍 Validate code quality:"
echo "     npm run validate"
echo ""
echo "⚙️ Configuration:"
echo "   - Edit .env file for environment-specific settings"
echo "   - Modify src/config/ files for scraper-specific configuration"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview and usage"
echo "   - src/pipeline/README.md - ETL Pipeline architecture"
echo "   - docs/ - Architecture decision records and specifications"
