# ETL Pipeline Module

This module implements an Extract-Transform-Load (ETL) pipeline architecture for
web scraping operations. It provides a modular, configurable, and testable
approach to extracting data from web pages.

## Architecture

The pipeline consists of three main stages:

1. **Extractor**: Takes a URL and navigation steps, outputs raw HTML
2. **Transformer**: Takes HTML and mapping rules, outputs structured JSON data
3. **Loader**: Takes JSON data and target configuration, saves to destination

## Quick Start

```typescript
import { PipelineConfigFactory } from "./pipeline";

// Create a pipeline configuration
const config = PipelineConfigFactory.barcelonaEvents({
  headless: true,
  outputPath: "output/events.json",
});

// Execute the pipeline (implementation would be provided by concrete classes)
// const pipeline = new ConcretePipeline();
// const result = await pipeline.execute(config);
```

## Configuration

### Extractor Configuration

```typescript
const extractorConfig: ExtractorConfig = {
  url: "https://example.com",
  browserConfig: {
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  timeout: 30000,
  navigationSteps: [
    {
      type: "click",
      selector: "button.load-more",
      maxAttempts: 5,
    },
  ],
};
```

### Transformer Configuration

```typescript
const transformerConfig: TransformerConfig = {
  schema: "event-v1",
  fieldMappings: {
    title: {
      selector: "h2.event-title",
      attribute: "text",
      required: true,
    },
    date: {
      selector: ".event-date",
      attribute: "text",
      transformer: "date",
    },
  },
};
```

### Loader Configuration

```typescript
// File target
const fileLoader: LoaderConfig = {
  target: "file",
  targetConfig: {
    type: "file",
    path: "output/events.json",
    format: "json",
  },
};

// DigitalOcean Spaces target
const spacesLoader: LoaderConfig = {
  target: "digitalocean-spaces",
  targetConfig: {
    type: "digitalocean-spaces",
    endpoint: "https://fra1.digitaloceanspaces.com",
    bucket: "my-bucket",
    key: "data/events.json",
    accessKeyId: process.env.DO_ACCESS_KEY,
    secretAccessKey: process.env.DO_SECRET_KEY,
  },
};
```

## Error Handling

The pipeline uses a `Result<T, E>` type for error handling:

```typescript
const result = await pipeline.execute(config);

if (result.isOk) {
  console.log("Pipeline succeeded:", result.value);
} else {
  console.error("Pipeline failed:", result.error);
}
```

## Testing

Each component can be tested in isolation:

```typescript
// Test extractor only
const extractorResult = await extractor.extract(extractorConfig);

// Test transformer only
const transformerResult = await transformer.transform(html, transformerConfig);

// Test loader only
const loaderResult = await loader.load(data, loaderConfig);
```

## Monitoring

Pipeline execution includes detailed metrics:

```typescript
const result = await pipeline.execute(config);
if (result.isOk) {
  const { metadata } = result.value;
  console.log("Execution time:", metadata.executionTime);
  console.log("Records processed:", metadata.recordsProcessed);
  console.log("Extractor metrics:", metadata.extractorMetrics);
}
```

## Related Documentation

- [ADR-001: ETL-Based Scraper Architecture](../docs/architecture-decision-records/ADR-001-etl-scraper-architecture.md)
- [ETL Pipeline Specification](etl-pipeline-spec.md)
