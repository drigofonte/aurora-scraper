# TypeScript Playwright Scraper

A TypeScript implementation of the Barcelona children's events scraper using Playwright.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup

### Option 1: Automated Setup

```bash
chmod +x setup_typescript.sh
./setup_typescript.sh
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Install browser binaries
npx playwright install chromium

# Build TypeScript
npm run build
```

## Usage

### Production (compiled JavaScript)

```bash
npm start
```

### Development (TypeScript with ts-node)

```bash
npm run dev
```

## Features

- **Type Safety**: Full TypeScript type definitions
- **Modern JavaScript**: ES2020 features
- **Browser Automation**: Uses Playwright for reliable scraping
- **DOM Parsing**: Uses JSDOM for HTML parsing
- **Structured Output**: Saves data to JSON and HTML files

## Output Files

- `barcelona_events_playwright_ts.json` - Structured event data
- `scraped_content_playwright_ts.html` - Raw HTML content

## Configuration

You can modify the scraper behavior by editing `playwright_scraper.ts`:

- Set `headless: true` to run browser in background
- Adjust `maxClicks` to limit "Ver más" button clicks
- Modify timeout values for different network conditions

## TypeScript Benefits

1. **Type Safety**: Catch errors at compile time
2. **IntelliSense**: Better IDE support and autocomplete
3. **Maintainability**: Clear interfaces and type definitions
4. **Modern Features**: Latest JavaScript features with transpilation support

## Project Structure

```
├── playwright_scraper.ts     # Main scraper code
├── package.json             # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
├── setup_typescript.sh     # Setup script
├── dist/                   # Compiled JavaScript (after build)
└── README_TYPESCRIPT.md    # This file
```
