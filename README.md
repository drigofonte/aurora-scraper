# Barcelona Events Scraper

A TypeScript-based web scraper for Barcelona children's events using Playwright, built following enterprise-grade best practices.

## 🚀 Features

- **Type Safety**: Full TypeScript with strict mode and comprehensive type definitions
- **Modern Architecture**: Clean separation of concerns with Extract-Transform-Load (ETL) pattern
- **Error Handling**: Functional error handling with Result types and custom error classes
- **Configuration Management**: Environment-based configuration with validation
- **Logging**: Structured logging with configurable levels
- **Testing**: Comprehensive test suite with Vitest
- **Code Quality**: ESLint, Prettier, and automated validation
- **CI/CD Ready**: Pre-commit hooks and validation scripts

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: Latest version
- **Operating System**: macOS, Linux, or Windows

## 🛠️ Quick Start

### Automated Setup

```bash
chmod +x setup_typescript.sh
./setup_typescript.sh
```

### Manual Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run install-browsers

# Run type checking
npm run type-check

# Format and lint code
npm run format
npm run lint

# Build project
npm run build

# Create environment file
cp .env.example .env
```

## 📖 Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test -- --watch
```

### Code Quality

```bash
# Validate entire project
npm run validate

# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

## 🏗️ Project Architecture

### Directory Structure

```
scraper/
├── src/
│   ├── config/                     # Configuration management
│   │   └── environment.config.ts   # Environment-based configuration
│   ├── io/                         # Input/Output utilities
│   │   └── file.utils.ts          # File operations with Result types
│   ├── scrapers/                   # Website-specific scrapers
│   │   └── barcelona.cat.vivir-en-bcn/
│   │       ├── config/             # Scraper configuration
│   │       ├── scraper.ts          # Main scraper implementation
│   │       └── data-extraction.utils.ts
│   ├── types/                      # TypeScript type definitions
│   │   ├── config.ts              # Configuration interfaces
│   │   ├── errors.ts              # Custom error classes
│   │   ├── event.ts               # Event data structures
│   │   ├── extraction.ts          # ETL pipeline interfaces
│   │   └── output.ts              # Output format definitions
│   ├── utils/                      # Shared utilities
│   │   ├── extraction.utils.ts    # DOM extraction utilities
│   │   ├── logger.utils.ts        # Structured logging
│   │   ├── processor.utils.ts     # Data processing pipeline
│   │   ├── result.utils.ts        # Functional error handling
│   │   ├── transformation.utils.ts # Data transformation
│   │   └── validation.utils.ts    # Data validation
│   ├── index.ts                    # Main application entry point
│   └── main.ts                     # Library exports
├── output/                         # Generated output files
├── dist/                          # Compiled JavaScript
├── docs/                          # Documentation
└── .github/                       # GitHub configuration and instructions
```

### ETL Architecture

The scraper follows the **Extract-Transform-Load** pattern with clear separation of concerns:

1. **Extract**: DOM-based data extraction using configurable field mappings
2. **Transform**: Data cleaning and structuring with type safety
3. **Validate**: Quality assurance with comprehensive validation rules
4. **Load**: File output with Result-based error handling

### Key Design Patterns

- **Repository Pattern**: Configurable data extraction strategies
- **Factory Pattern**: Logger and validator creation
- **Result Pattern**: Functional error handling without exceptions
- **Dependency Injection**: Loose coupling and testability
- **Strategy Pattern**: Pluggable extraction and transformation logic

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Scraper Configuration
SCRAPER_HEADLESS=false
SCRAPER_MAX_CLICKS=20
SCRAPER_TIMEOUT=60000
SCRAPER_URL=https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda

# Browser Configuration
BROWSER_WIDTH=1280
BROWSER_HEIGHT=800

# Output Configuration
OUTPUT_DIR=output
OUTPUT_JSON_FILE=barcelona_events_playwright_ts.json
OUTPUT_HTML_FILE=scraped_content_playwright_ts.html

# Logging Configuration
LOG_LEVEL=info
LOG_TO_FILE=false
```

### TypeScript Configuration

The project uses strict TypeScript configuration with:

- **Strict Mode**: Full type safety with null checks
- **Modern Target**: ES2022 for optimal performance
- **Path Mapping**: Clean import aliases
- **Incremental Compilation**: Fast rebuilds
- **Source Maps**: Full debugging support

### Code Quality Configuration

- **ESLint**: TypeScript-specific rules with complexity limits
- **Prettier**: Consistent code formatting
- **Vitest**: Fast unit testing with coverage
- **Husky**: Pre-commit hooks for quality gates

## 📊 Output

The scraper generates structured output in the `output/` directory:

### JSON Output (`barcelona_events_playwright_ts.json`)

```json
{
  "total_events": 42,
  "scraping_date": "2024-01-15T10:30:00.000Z",
  "source_url": "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
  "scraping_method": "playwright-typescript",
  "events": [
    {
      "title": "Event Title",
      "description": "Event description...",
      "link": "/event-link",
      "image": "/image.jpg",
      "image_alt": "Image description",
      "category": "Workshop",
      "when": "15 enero - 20 enero",
      "where": "Park Güell",
      "location_link": "/location-link"
    }
  ]
}
```

### HTML Output (`scraped_content_playwright_ts.html`)

Raw HTML content for debugging and analysis.

## 🧪 Testing

The project includes comprehensive testing with:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end pipeline testing
- **Type Tests**: TypeScript type validation
- **Coverage Reports**: Detailed coverage analysis

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- validation.utils.test.ts

# Run in watch mode
npm test -- --watch
```

## 🔧 Development

### Adding New Websites

1. Create a new directory under `src/scrapers/`
2. Implement extraction configuration
3. Add website-specific transformers
4. Create validation rules
5. Add tests

### Extending Functionality

- **Custom Extractors**: Implement `DataExtractor` interface
- **Custom Transformers**: Implement `DataTransformer` interface
- **Custom Validators**: Implement `DataValidator` interface
- **Custom Loggers**: Extend `Logger` interface

### Code Standards

- **Complexity**: Maximum cyclomatic complexity of 15
- **Function Length**: Maximum 30 lines per function
- **File Length**: Maximum 500-1000 lines per file
- **Test Coverage**: Minimum 80% coverage required

## 🚀 Production Deployment

### Build Process

```bash
# Clean previous builds
npm run clean

# Validate code quality
npm run validate

# Build for production
npm run build

# Run production build
npm start
```

### Docker Support

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY output/ ./output/

CMD ["npm", "start"]
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Validate** your changes: `npm run validate`
4. **Commit** your changes: `git commit -m 'Add amazing feature'`
5. **Push** to the branch: `git push origin feature/amazing-feature`
6. **Open** a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new extraction pattern
fix: resolve validation edge case
docs: update API documentation
test: add integration tests
refactor: simplify extraction logic
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Playwright**: Reliable browser automation
- **TypeScript**: Type safety and developer experience
- **Barcelona City Council**: Public data source
- **Open Source Community**: Tools and inspiration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Project Wiki](https://github.com/your-repo/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Built with ❤️ and TypeScript**
