/**
 * Test nested field mapping functionality
 */

import { SelectorEngine } from "./src/pipeline/transformer/selector-engine.js";
import type { FieldMapping } from "./src/pipeline/types.js";

async function testNestedFieldMapping() {
  console.log("🧪 Testing Nested Field Mapping");
  console.log("=".repeat(40));

  const html = `
    <div class="product">
      <h1 class="product-title">UltraBook Pro 15"</h1>
      <span data-sku="TST-LT-2024-001">SKU: TST-LT-2024-001</span>
      <span class="brand">TechStore</span>
      <span data-category="electronics/laptops">Laptops</span>
      
      <span data-current-price="999.99">$999.99</span>
      <span data-original-price="1299.99">$1,299.99</span>
      <span data-currency="USD">USD</span>
      <span data-discount-percent="23">23% off</span>
      
      <span data-stock-status="low-stock">Low Stock</span>
      <span data-stock-level="5">5 left</span>
      <time class="estimated-delivery" datetime="2024-01-15">January 15, 2024</time>
      
      <span data-spec="cpu">Intel Core i7-12700H</span>
      <span data-spec="ram">16GB DDR4-3200</span>
      <span data-spec="storage">512GB PCIe NVMe SSD</span>
      <span data-spec="display">15.6" 4K OLED</span>
      
      <span data-feature>Latest Intel processor</span>
      <span data-feature>16GB DDR4 RAM</span>
      <span data-feature>512GB NVMe SSD</span>
      
      <img class="thumbnail" src="/images/laptop-side.jpg" alt="Side view">
      <img class="thumbnail" src="/images/laptop-keyboard.jpg" alt="Keyboard">
      
      <span data-rating="4.6">4.6/5</span>
      <span data-review-count="1847">1,847 reviews</span>
    </div>
  `;

  const fieldMappings: Record<string, FieldMapping> = {
    // Nested basic information
    "basic.title": {
      selector: "h1.product-title",
      attribute: "text",
      required: true,
      transformer: "trim",
    },
    "basic.sku": {
      selector: "[data-sku]",
      attribute: "data-sku",
      required: true,
    },
    "basic.brand": {
      selector: ".brand",
      attribute: "text",
      transformer: "trim",
    },
    "basic.category": {
      selector: "[data-category]",
      attribute: "data-category",
    },

    // Nested pricing information
    "pricing.currentPrice": {
      selector: "[data-current-price]",
      attribute: "data-current-price",
      transformer: "number",
      required: true,
    },
    "pricing.originalPrice": {
      selector: "[data-original-price]",
      attribute: "data-original-price",
      transformer: "number",
    },
    "pricing.currency": {
      selector: "[data-currency]",
      attribute: "data-currency",
      defaultValue: "USD",
    },
    "pricing.discount.percent": {
      selector: "[data-discount-percent]",
      attribute: "data-discount-percent",
      transformer: "number",
    },

    // Nested availability
    "availability.status": {
      selector: "[data-stock-status]",
      attribute: "data-stock-status",
    },
    "availability.stockLevel": {
      selector: "[data-stock-level]",
      attribute: "data-stock-level",
      transformer: "number",
    },

    // Nested specifications
    "specifications.processor": {
      selector: "[data-spec='cpu']",
      attribute: "text",
      transformer: "trim",
    },
    "specifications.memory": {
      selector: "[data-spec='ram']",
      attribute: "text",
      transformer: "trim",
    },
    "specifications.storage": {
      selector: "[data-spec='storage']",
      attribute: "text",
      transformer: "trim",
    },
    "specifications.display": {
      selector: "[data-spec='display']",
      attribute: "text",
      transformer: "trim",
    },

    // Arrays
    features: {
      selector: "[data-feature]",
      attribute: "text",
      multiple: true,
    },
    "images.gallery": {
      selector: ".thumbnail",
      attribute: "src",
      multiple: true,
    },

    // Nested reviews
    "reviews.averageRating": {
      selector: "[data-rating]",
      attribute: "data-rating",
      transformer: "number",
    },
    "reviews.totalReviews": {
      selector: "[data-review-count]",
      attribute: "data-review-count",
      transformer: "number",
    },
  };

  try {
    const engine = new SelectorEngine();

    // Load HTML
    const loadResult = engine.loadHtml(html);
    if (loadResult.isErr) {
      console.error("❌ Failed to load HTML:", loadResult.error.message);
      return;
    }

    // Extract data
    const result = engine.extractFromElement(null, fieldMappings);
    if (result.isErr) {
      console.error("❌ Extraction failed:", result.error.message);
      return;
    }

    const extractedData = result.value;

    console.log("✅ Extraction successful!");
    console.log("\n📊 Extracted Data Structure:");
    console.log(JSON.stringify(extractedData, null, 2));

    // Validate nested structure
    console.log("\n🔍 Validation:");
    console.log(`- Basic info nested: ${extractedData.basic ? "✅" : "❌"}`);
    console.log(`- Pricing nested: ${extractedData.pricing ? "✅" : "❌"}`);
    console.log(`- Availability nested: ${extractedData.availability ? "✅" : "❌"}`);
    console.log(`- Specifications nested: ${extractedData.specifications ? "✅" : "❌"}`);
    console.log(`- Reviews nested: ${extractedData.reviews ? "✅" : "❌"}`);
    console.log(`- Images nested: ${extractedData.images ? "✅" : "❌"}`);

    // Check nested discount
    const discountPercent = (extractedData.pricing as any)?.discount?.percent;
    console.log(`- Nested discount: ${discountPercent ? "✅" : "❌"} (${discountPercent})`);

    // Check arrays
    const features = extractedData.features as string[];
    const gallery = (extractedData.images as any)?.gallery as string[];
    console.log(
      `- Features array: ${Array.isArray(features) ? "✅" : "❌"} (${features?.length} items)`
    );
    console.log(
      `- Gallery array: ${Array.isArray(gallery) ? "✅" : "❌"} (${gallery?.length} items)`
    );

    // Check transformations
    const currentPrice = (extractedData.pricing as any)?.currentPrice;
    const stockLevel = (extractedData.availability as any)?.stockLevel;
    console.log(
      `- Number transformations: ${typeof currentPrice === "number" && typeof stockLevel === "number" ? "✅" : "❌"}`
    );
  } catch (error) {
    console.error("💥 Unexpected error:", error);
  }
}

// Run test if this file is executed directly
if (import.meta.url.endsWith(process.argv[1] || "")) {
  testNestedFieldMapping().catch(console.error);
}

export { testNestedFieldMapping };
