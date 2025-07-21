# Data Extraction & Transformation Abstraction

This document describes the new abstraction layer that separates data extraction from data transformation in the scraper architecture.

## Overview

The new architecture follows the **Extract-Transform-Load (ETL)** pattern with clear separation of concerns:

1. **Extract**: Get raw data from DOM elements
2. **Transform**: Convert raw data into structured objects
3. **Validate**: Ensure data quality and consistency

## Core Interfaces

### DataExtractor

```typescript
interface DataExtractor<TRaw> {
  extract(element: Element): TRaw;
}
```

Responsible for extracting raw data from DOM elements using CSS selectors.

### DataTransformer

```typescript
interface DataTransformer<TRaw, TTransformed> {
  transform(rawData: TRaw): TTransformed;
}
```

Responsible for converting raw extracted data into structured, clean objects.

### DataValidator

```typescript
interface DataValidator<T> {
  validate(data: T): boolean;
  getValidationErrors?(data: T): string[];
}
```

Responsible for ensuring data quality and providing validation feedback.

### DataProcessor

```typescript
interface DataProcessor<TRaw, TTransformed> {
  extractor: DataExtractor<TRaw>;
  transformer: DataTransformer<TRaw, TTransformed>;
  validator: DataValidator<TTransformed>;
  process(element: Element): TTransformed | null;
}
```

Orchestrates the complete pipeline: extract → transform → validate.

## Implementation Classes

### DOMExtractor

Generic DOM-based extractor using field mapping configuration:

```typescript
const fieldMap: ExtractionFieldMap = {
  title: {
    selector: "h2.title",
    required: true,
  },
  image: {
    selector: "img",
    attribute: "src",
  },
  date: {
    selector: ".date",
    transform: (value) => value.trim(),
  },
};

const extractor = new DOMExtractor(fieldMap);
```

### BarcelonaEventTransformer

Transforms Barcelona-specific raw data into `EventData` objects:

- Cleans Spanish labels ("Cuándo:", "Dónde:")
- Structures the data according to the `EventData` interface
- Handles optional fields gracefully

### EventDataValidator

Validates event data quality:

- Ensures required fields are present
- Validates URL formats
- Provides detailed error messages

### BarcelonaEventProcessor

Complete pipeline implementation for Barcelona events.

## Benefits

### 1. Separation of Concerns

- **Extraction**: Only deals with DOM traversal and CSS selectors
- **Transformation**: Only deals with data cleaning and structuring
- **Validation**: Only deals with data quality rules

### 2. Testability

Each component can be tested independently:

```typescript
// Test extraction
const rawData = extractor.extract(mockElement);

// Test transformation
const eventData = transformer.transform(mockRawData);

// Test validation
const isValid = validator.validate(mockEventData);
```

### 3. Reusability

Components can be reused across different scrapers:

```typescript
// Same extractor, different transformer
const simplifiedTransformer = new SimplifiedEventTransformer();
const customProcessor = new CustomProcessor(extractor, simplifiedTransformer);
```

### 4. Maintainability

- Easy to modify extraction logic without affecting transformation
- Easy to add new validation rules
- Clear error boundaries and debugging

### 5. Extensibility

Easy to add new website support:

```typescript
// New website configuration
const newSiteFieldMap: ExtractionFieldMap = {
  /* ... */
};
const newExtractor = new DOMExtractor(newSiteFieldMap);
const newProcessor = new CustomEventProcessor(newExtractor);
```

## Usage Examples

### Basic Usage

```typescript
const processor = createBarcelonaProcessor();
const eventData = processor.process(domElement);
```

### Individual Components

```typescript
const extractor = new DOMExtractor(BARCELONA_EXTRACTION_CONFIG);
const rawData = extractor.extract(element);

const transformer = new BarcelonaEventTransformer();
const eventData = transformer.transform(rawData);

const validator = new EventDataValidator();
const isValid = validator.validate(eventData);
```

### Custom Implementation

```typescript
const customFieldMap: ExtractionFieldMap = {
  name: { selector: ".event-name" },
  price: {
    selector: ".price",
    transform: (value) => value.replace("€", ""),
  },
};

const extractor = new DOMExtractor(customFieldMap);
const processor = new BarcelonaEventProcessor(extractor);
```

### Batch Processing

```typescript
const elements = Array.from(document.querySelectorAll(".event"));
const results = processor.processMany(elements);
```

## File Structure

```
src/
├── types/
│   └── extraction.ts           # Core interfaces
├── utils/
│   ├── extraction.utils.ts     # DOMExtractor implementation
│   ├── transformation.utils.ts # Transformer implementations
│   ├── validation.utils.ts     # Validator implementations
│   └── processor.utils.ts      # Processor implementations
└── scrapers/barcelona.cat.vivir-en-bcn/
    ├── config/
    │   └── extraction.config.ts # Field mapping configuration
    ├── examples/
    │   └── usage-examples.ts    # Usage examples
    └── scraper.ts              # Updated scraper using new architecture
```

## Migration

The original scraper has been updated to use the new architecture:

**Before:**

```typescript
const itemData = extractItemData(item as Element);
if (isValidEventData(itemData)) {
  eventsData.push(itemData);
}
```

**After:**

```typescript
const processor = new BarcelonaEventProcessor(extractor);
const eventsData = processor.processMany(itemElements);
```

## Future Enhancements

1. **Async Processing**: Support for async transformers (e.g., API calls for data enrichment)
2. **Caching**: Add caching layer for expensive transformations
3. **Metrics**: Add processing metrics and performance monitoring
4. **Parallel Processing**: Process multiple elements concurrently
5. **Schema Validation**: JSON Schema-based validation
6. **Plugin System**: Plugin architecture for custom extractors/transformers
