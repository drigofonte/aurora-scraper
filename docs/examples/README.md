# ETL Pipeline Examples

This directory contains practical examples demonstrating how to use the scraping
ETL pipeline for various use cases. Each example includes complete documentation
and runnable code.

## Quick Start

All examples can be run directly using Node.js/TypeScript:

```bash
# Install dependencies
npm install

# Run any example
npx tsx docs/examples/01-single-item/example.ts
```

## Example Categories

### 📄 Single Item Scraping

- **[01-single-item](./01-single-item/)** - Extract data from a single
  article/product page
- **[02-single-item-advanced](./02-single-item-advanced/)** - Advanced single
  item with complex field mapping

### 📋 List Scraping

- **[03-product-list](./03-product-list/)** - Extract product listings from
  e-commerce sites
- **[04-event-list](./04-event-list/)** - Scrape event listings with dates and
  locations
- **[05-news-articles](./05-news-articles/)** - Extract multiple news articles
  from listing pages

### 🔗 Pagination & Navigation

- **[06-pagination](./06-pagination/)** - Handle paginated results
- **[07-infinite-scroll](./07-infinite-scroll/)** - Work with infinite scroll
  pages
- **[08-navigation-steps](./08-navigation-steps/)** - Complex navigation
  workflows

### 💾 Data Loading

- **[09-file-output](./09-file-output/)** - Save data to JSON/CSV files
- **[10-database-storage](./10-database-storage/)** - Store data in databases
- **[11-api-integration](./11-api-integration/)** - Send data to REST APIs
- **[12-multi-target](./12-multi-target/)** - Load to multiple destinations

### 🏗️ Pipeline Orchestration

- **[13-basic-pipeline](./13-basic-pipeline/)** - Simple end-to-end pipeline
- **[14-custom-pipeline](./14-custom-pipeline/)** - Custom pipeline
  configuration
- **[15-error-handling](./15-error-handling/)** - Robust error handling patterns

### 🌐 Real-World Use Cases

- **[16-barcelona-events](./16-barcelona-events/)** - Complete Barcelona events
  scraper
- **[17-ecommerce-products](./17-ecommerce-products/)** - E-commerce product
  catalog
- **[18-job-listings](./18-job-listings/)** - Job board scraping

## Example Structure

Each example follows a consistent structure:

```
example-name/
├── README.md           # Detailed explanation and usage
├── example.ts          # Main example code
├── config.ts           # Pipeline configuration
├── data/              # Sample data and fixtures
│   ├── input.html     # Sample HTML for testing
│   └── expected.json  # Expected output
└── output/            # Generated output files
    ├── data.json
    └── data.csv
```

## Common Patterns

### Basic Pipeline Setup

```typescript
import { PipelineOrchestrator } from "../../src/pipeline";

const pipeline = new PipelineOrchestrator();
const config = {
  extractor: { url: "https://example.com" },
  transformer: { type: "item", fieldMappings: {...} },
  loader: { targets: [{ type: "file", path: "output.json" }] }
};

const result = await pipeline.execute(config);
```

### Error Handling

```typescript
const result = await pipeline.execute(config);

if (result.isOk) {
  console.log(`✅ Success: ${result.value.metadata.recordsProcessed} records`);
} else {
  console.error(`❌ Error: ${result.error.message}`);
}
```

## Getting Help

- 📖 **[Pipeline Documentation](../pipeline/README.md)** - Core pipeline
  concepts
- 🏗️ **[ETL Specification](../pipeline/etl-pipeline-spec.md)** - Technical
  specification
- 🎯 **[Configuration Guide](../pipeline/CONFIG_GUIDE.md)** - Configuration
  options
- 🧪 **[Testing Guide](../pipeline/__tests__/README.md)** - Testing patterns

## Contributing Examples

Want to add a new example? Follow these guidelines:

1. **Clear Use Case** - Address a specific, real-world scenario
2. **Complete Documentation** - Include README with explanation and usage
3. **Runnable Code** - Ensure examples work out of the box
4. **Sample Data** - Provide test HTML and expected outputs
5. **Error Handling** - Demonstrate proper error handling
6. **Performance** - Include performance considerations if relevant

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed guidelines.
