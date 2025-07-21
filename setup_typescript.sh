#!/bin/bash

echo "Setting up TypeScript Playwright scraper environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first:"
    echo "https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

echo "Installing Node.js dependencies..."
npm install

echo "Installing Playwright browsers..."
npx playwright install chromium

echo "Building TypeScript..."
npm run build

echo "Setup complete! You can now run the scraper with:"
echo "npm start"
echo ""
echo "Or for development (with TypeScript compilation):"
echo "npm run dev"
