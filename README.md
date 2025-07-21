# Barcelona Events Scraper

A TypeScript-based web scraper for Barcelona children's events using Playwright.

## Project Structure

```
scraper/
├── src/
│   ├── scrapers/
│       └── barcelona.cat.vivir-en-bcn/ # Root folder for Barcelona scraper implementation
│           ├── config/                 # Configuration files
│           ├── data-extraction.utils.ts # Barcelona-specific data extraction utilities
│           └── scraper.ts              # Business logic for this scraper
│   ├── types/                          # Common interfaces for all scrapers
│   ├── io/                             # Functions to read/write files
│   ├── utils/                          # Common utility functions
│   └── index.ts                        # Main entry point to execute any (or all) scrapers
├── output/                             # Generated output files
├── dist/                               # Compiled JavaScript files
└── package.json                        # Project dependencies and scripts
```

```
scraper/
├── src/
│   ├── scrapers/
│       └── barcelona.cat.vivir-en-bcn/ # Root folder for Barcelona scraper implementation
│           ├── config/                 # Configuration files
│           ├── data-extraction.utils.ts # Barcelona-specific data extraction utilities
│           └── scraper.ts              # Business logic for this scraper
│   ├── types/                          # Common interfaces for all scrapers
│   ├── io/                             # Functions to read/write files
│   ├── utils/                          # Common utility functions
│   └── index.ts                        # Main entry point to execute any (or all) scrapers
├── output/                             # Generated output files
├── dist/                               # Compiled JavaScript files
└── package.json                        # Project dependencies and scripts
```

## Features

- **Modular Architecture**: Organized into services, utilities, and configuration
- **TypeScript**: Full type safety and IntelliSense support
- **Cookie Consent Handling**: Automatically handles cookie consent dialogs
- **Error Handling**: Comprehensive error handling and logging
- **Configurable**: Easy to modify scraping parameters
- **Output Management**: Organized output files in dedicated directory

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npm run install-browsers
   ```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Clean Build Artifacts

```bash
npm run clean
```

## Configuration

The scraper can be configured through `src/scrapers/barcelona.cat.vivir-en-bcn/config/scraper.config.ts`:

- **URL**: Target website URL
- **Headless**: Browser visibility mode
- **Max Clicks**: Maximum "Load More" button clicks
- **Timeout**: Request timeout in milliseconds
- **Viewport**: Browser window size

## Output

The scraper generates two files in the `output/` directory:

1. **JSON File**: Structured event data with metadata
2. **HTML File**: Raw scraped HTML content for debugging

## Architecture

### Scrapers

- `barcelona.cat.vivir-en-bcn/scraper.ts`: Main scraping logic with Playwright for Barcelona events
- `barcelona.cat.vivir-en-bcn/data-extraction.utils.ts`: Barcelona-specific DOM parsing and data extraction

### Utils

- `utils/common.utils.ts`: Common utility functions shared across scrapers
- `io/file.utils.ts`: File I/O operations and directory management

### Types

- `events.ts`: TypeScript interfaces for type safety

### Config

- `scrapers/barcelona.cat.vivir-en-bcn/config/scraper.config.ts`: Application configuration and constants

## Best Practices Implemented

- ✅ Separation of concerns
- ✅ Type safety with TypeScript
- ✅ Error handling and logging
- ✅ Configurable parameters
- ✅ Modular code organization
- ✅ Clean output directory structure
- ✅ Comprehensive documentation
