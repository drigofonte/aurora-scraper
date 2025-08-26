# Advanced Single Item Scraping Example

This example demonstrates advanced product data extraction with complex field
mapping, data transformations, and comprehensive schema validation.

## Features Demonstrated

### 🎯 Advanced Data Extraction

- **Data Attribute Extraction**: Extract data from HTML `data-*` attributes
- **Type Conversions**: Automatic string to number/boolean transformations
- **Complex Field Mapping**: Multi-level data structure extraction
- **Default Values**: Fallback values for missing fields
- **Technical Specifications**: Structured data from HTML tables

### 📊 Product Information Extracted

- Basic product details (title, SKU, brand, category)
- Pricing information with discounts and currency
- Stock availability and delivery estimates
- Technical specifications (processor, memory, storage, etc.)
- Customer reviews and rating breakdowns
- Product images and seller information
- Product tags and certifications

### 🔧 Technical Features

- Custom schema validation with detailed field specifications
- Attribute-based data extraction from complex HTML
- Built-in field transformers (number, boolean, trim, url)
- Error handling and validation filtering
- JSON output with pretty formatting

## File Structure

```
02-single-item-advanced/
├── README.md                    # This documentation
├── example.ts                   # Main example script
├── config.ts                   # Pipeline configuration
├── data/
│   └── complex-product.html    # Sample product page with rich data
├── output/
│   └── advanced-product.json   # Extracted product data
└── schemas/
    └── advanced-product.schema.json  # JSON schema for validation
```

## How to Run

```bash
# From the project root
npx tsx docs/examples/02-single-item-advanced/example.ts
```

## Configuration Highlights

### Data Attribute Extraction

```typescript
currentPrice: {
  selector: '[data-current-price]',
  attribute: 'data-current-price',
  transformer: 'number'
}
```

### Technical Specifications

```typescript
processor: {
  selector: '[data-spec="cpu"]',
  transformer: 'trim'
},
memory: {
  selector: '[data-spec="ram"]',
  transformer: 'trim'
}
```

### Review Metrics

```typescript
averageRating: {
  selector: '[data-numeric-rating]',
  attribute: 'data-numeric-rating',
  transformer: 'number'
},
totalReviews: {
  selector: '[data-review-count]',
  attribute: 'data-review-count',
  transformer: 'number'
}
```

## Sample Data Structure

The example extracts data into this structure:

```json
{
  "title": "UltraBook Pro 15\" - High Performance Laptop",
  "sku": "TST-LT-2024-001",
  "brand": "TechStore",
  "category": "laptops",
  "currentPrice": 999.99,
  "originalPrice": 1299.99,
  "currency": "USD",
  "discountPercent": 23,
  "freeShipping": true,
  "stockStatus": "low",
  "stockLevel": 5,
  "estimatedDelivery": "2024-01-15",
  "processor": "Intel Core i7-12700H (12 cores, 20 threads)",
  "memory": "16GB DDR4-3200",
  "storage": "512GB PCIe 4.0 NVMe SSD",
  "display": "15.6\" 4K OLED (3840x2160), 100% DCI-P3",
  "graphics": "NVIDIA GeForce RTX 3060 6GB",
  "weight": "1.8 kg (3.96 lbs)",
  "averageRating": 4.6,
  "totalReviews": 1847,
  "mainImage": "https://techstore.com/images/laptop-main.jpg",
  "sellerName": "TechStore Official",
  "sellerId": "techstore-official",
  "sellerRating": 4.8
}
```

## Key Learning Points

### 1. Data Attribute Strategy

Use HTML `data-*` attributes for reliable data extraction:

```html
<span data-current-price="999.99" data-currency="USD">$999.99</span>
```

### 2. Built-in Transformers

Leverage built-in transformers for common conversions:

- `'number'` - Convert strings to numbers
- `'boolean'` - Convert strings to booleans
- `'trim'` - Clean up whitespace
- `'url'` - Process URLs

### 3. Complex Schema Validation

Define comprehensive schemas for data quality:

```json
{
  "properties": {
    "pricing": {
      "type": "object",
      "properties": {
        "currentPrice": { "type": "number" },
        "currency": { "type": "string" }
      },
      "required": ["currentPrice", "currency"]
    }
  }
}
```

### 4. Error Handling

Use validation filtering to handle missing or invalid data gracefully.

## Next Steps

- Try modifying the HTML file to add more product data
- Experiment with different field transformers
- Add validation rules to the schema
- Extract additional product features like specifications tables
- Compare with the basic single-item example to see the differences

## Related Examples

- [01-single-item](../01-single-item/) - Basic single item extraction
- [03-product-list](../03-product-list/) - Multiple product extraction
- [04-event-list](../04-event-list/) - Event listing extraction
