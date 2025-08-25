# Product List Scraping Example

This example demonstrates how to extract structured data from product listing
pages, such as e-commerce search results or catalog pages.

## What You'll Learn

- List-based extraction configuration
- Container and item selector patterns
- Price and rating data transformation
- Multiple data output formats

## Use Case

Extracting product information from an e-commerce listing:

- Product names and descriptions
- Prices with currency formatting
- Customer ratings and reviews
- Product images and links
- Availability status

## Quick Start

```bash
# Run the example
npx tsx docs/examples/03-product-list/example.ts

# Check the outputs
cat docs/examples/03-product-list/output/products.json
cat docs/examples/03-product-list/output/products.csv
```

## Configuration Highlights

### List Extraction Setup

```typescript
transformer: {
  type: "list",  // Extract multiple items
  listConfig: {
    containerSelector: ".products-grid",     // Container holding all products
    itemSelector: ".product-card"            // Individual product elements
  },
  fieldMappings: {
    name: {
      selector: ".product-name",
      transformer: "trim"
    },
    price: {
      selector: ".price",
      transformer: "currency"                // Parse price values
    },
    rating: {
      selector: ".rating",
      attribute: "data-rating",              // Extract rating from attribute
      transformer: "number"
    },
    inStock: {
      selector: ".availability",
      transformer: "boolean"                 // Convert to true/false
    }
  }
}
```

### Multiple Output Targets

```typescript
loader: {
  targets: [
    {
      type: "file",
      config: { path: "output/products.json", format: "json" },
    },
    {
      type: "file",
      config: { path: "output/products.csv", format: "csv" },
    },
    {
      type: "console",
      config: { format: "table" }, // Display as table
    },
  ];
}
```

## Expected Output

### JSON Format

```json
[
  {
    "name": "Wireless Headphones Pro",
    "price": 199.99,
    "rating": 4.5,
    "inStock": true,
    "imageUrl": "https://example.com/images/headphones.jpg"
  },
  {
    "name": "Smart Watch Series X",
    "price": 399.99,
    "rating": 4.8,
    "inStock": false,
    "imageUrl": "https://example.com/images/watch.jpg"
  }
]
```

### CSV Format

```csv
name,price,rating,inStock,imageUrl
"Wireless Headphones Pro",199.99,4.5,true,"https://example.com/images/headphones.jpg"
"Smart Watch Series X",399.99,4.8,false,"https://example.com/images/watch.jpg"
```

## Advanced Patterns

### Conditional Field Extraction

```typescript
fieldMappings: {
  salePrice: {
    selector: ".sale-price",
    condition: ".on-sale",                   // Only extract if sale element exists
    defaultValue: null
  },
  discount: {
    selector: ".discount-percent",
    transformer: "percentage"
  }
}
```

### Nested Data Extraction

```typescript
fieldMappings: {
  specifications: {
    selector: ".specs-list li",
    multiple: true,                          // Extract array of specs
    transformer: "text-array"
  },
  reviews: {
    selector: ".review",
    multiple: true,
    fieldMappings: {                         // Nested field mapping
      author: { selector: ".reviewer-name" },
      rating: { selector: ".review-rating", transformer: "number" },
      text: { selector: ".review-text" }
    }
  }
}
```

## Error Handling

```typescript
// Handle empty results
if (result.isOk && result.value.transformedData.length === 0) {
  console.warn("⚠️ No products found - check selectors");
}

// Handle partial failures
const products = result.value.transformedData;
const validProducts = products.filter((p) => p.name && p.price);
console.log(
  `✅ Extracted ${validProducts.length}/${products.length} valid products`
);
```

## Performance Tips

- Use specific selectors to reduce parsing time
- Implement pagination for large catalogs
- Cache results for repeated runs
- Use headless browsing for JavaScript-heavy sites

## Next Steps

- Try **[04-event-list](../04-event-list/)** for date-based list extraction
- Explore **[06-pagination](../06-pagination/)** for handling multiple pages
- Learn **[12-multi-target](../12-multi-target/)** for complex data distribution
