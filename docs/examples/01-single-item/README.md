# Single Item Scraping Example

This example demonstrates how to extract structured data from a single web page,
such as an article, product detail page, or blog post.

## What You'll Learn

- Basic pipeline configuration for single item extraction
- Field mapping with CSS selectors
- Data transformation and validation
- Output to JSON file

## Use Case

Extracting article information from a news website:

- Article title
- Author name
- Publication date
- Content text
- Category/tags

## Quick Start

```bash
# Run the example
npx tsx docs/examples/01-single-item/example.ts

# Check the output
cat docs/examples/01-single-item/output/article.json
```

## Configuration Explained

### Extractor Configuration

```typescript
extractor: {
  url: "https://example-news.com/article/123",
  browser: "chromium",
  options: {
    headless: true,
    timeout: 30000
  }
}
```

### Transformer Configuration

```typescript
transformer: {
  type: "item",  // Single item extraction
  schema: "article-schema",
  fieldMappings: {
    title: {
      selector: "h1",                    // CSS selector
      transformer: "trim"                // Remove whitespace
    },
    author: {
      selector: ".author-name",
      transformer: "trim"
    },
    publishedDate: {
      selector: "time[datetime]",
      attribute: "datetime",             // Extract attribute value
      transformer: "date"                // Parse as date
    },
    content: {
      selector: ".article-content",
      transformer: "html-to-text"        // Convert HTML to plain text
    },
    category: {
      selector: ".category",
      transformer: "trim"
    }
  }
}
```

### Loader Configuration

```typescript
loader: {
  targets: [
    {
      type: "file",
      config: {
        path: "docs/examples/01-single-item/output/article.json",
        format: "json",
        pretty: true,
      },
    },
  ];
}
```

## Expected Output

```json
{
  "title": "Sample Article Title",
  "author": "John Doe",
  "publishedDate": "2025-08-26T10:30:00Z",
  "content": "This is the article content...",
  "category": "Technology"
}
```

## Common Patterns

### Handling Missing Fields

```typescript
fieldMappings: {
  optionalField: {
    selector: ".optional",
    defaultValue: "Not Available",    // Fallback value
    required: false                   // Won't fail if missing
  }
}
```

### Complex Selectors

```typescript
fieldMappings: {
  socialMedia: {
    selector: ".social-links a",      // Multiple elements
    attribute: "href",                // Extract href attributes
    multiple: true                    // Return array
  }
}
```

### Custom Transformations

```typescript
fieldMappings: {
  price: {
    selector: ".price",
    transformer: "currency",          // Parse currency values
    transformerOptions: {
      currency: "USD"
    }
  }
}
```

## Error Handling

The pipeline includes built-in error handling:

```typescript
const result = await pipeline.execute(config);

if (result.isErr) {
  console.error("Extraction failed:", result.error.message);

  // Check specific error types
  switch (result.error.code) {
    case "PAGE_LOAD_FAILED":
      console.error("Could not load the webpage");
      break;
    case "SELECTOR_NOT_FOUND":
      console.error("Required element not found on page");
      break;
    case "VALIDATION_FAILED":
      console.error("Extracted data failed validation");
      break;
  }
}
```

## Testing

This example includes test data for offline development:

```typescript
// Use local HTML file instead of live website
const config = {
  extractor: {
    url:
      "file://" +
      path.resolve("docs/examples/01-single-item/data/sample-article.html"),
  },
  // ... rest of config
};
```

## Next Steps

- Try **[02-single-item-advanced](../02-single-item-advanced/)** for more
  complex field mapping
- Explore **[03-product-list](../03-product-list/)** for extracting multiple
  items
- Learn about **[09-file-output](../09-file-output/)** for different output
  formats
