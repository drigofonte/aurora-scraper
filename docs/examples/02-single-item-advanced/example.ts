/**
 * Advanced Single Item Scraping Example
 *
 * This example demonstrates advanced product data extraction with:
 * - Complex field mapping using data attributes
 * - Multiple data types (strings, numbers, booleans)
 * - Technical specifications extraction
 * - Review and rating information
 * - Seller details
 * - Image processing
 * - Default values and transformations
 */

import { pipelineFactory } from "../../../src/pipeline/orchestrator.js";
import { createAdvancedProductConfig } from "./config.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runAdvancedProductScraper() {
  console.log("🚀 Starting Advanced Product Scraper Example");
  console.log("=".repeat(50));

  try {
    // Create pipeline with custom schema loading
    const schemaDir = join(__dirname, "schemas");
    const pipeline = await pipelineFactory.createDefaultWithCustomSchemas(schemaDir);

    // Create configuration for advanced product extraction
    const config = createAdvancedProductConfig({
      outputPath: join(__dirname, "output/advanced-product.json"),
      headless: true,
    });

    console.log("📄 Configuration:");
    console.log(`- Source: Local HTML file (complex-product.html)`);
    console.log(`- Schema: advanced-product (custom validation)`);
    console.log(`- Output: ${join(__dirname, "output/advanced-product.json")}`);
    console.log(`- Data Complexity: Advanced field mapping`);
    console.log("");

    console.log("🔧 Extraction Features:");
    console.log("- Basic product info (title, SKU, brand, category)");
    console.log("- Pricing data with discounts and currency");
    console.log("- Stock availability and delivery info");
    console.log("- Technical specifications table");
    console.log("- Customer reviews and ratings");
    console.log("- Product images and seller details");
    console.log("- Data attribute extraction");
    console.log("- Type transformations (string → number/boolean)");
    console.log("");

    // Execute the pipeline
    console.log("🏃 Executing pipeline...");
    const startTime = Date.now();

    const result = await pipeline.execute(config);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    if (result.isOk) {
      console.log("✅ Pipeline executed successfully!");
      console.log("");
      console.log("📊 Results Summary:");
      console.log(`- Records processed: ${result.value.metadata.recordsProcessed}`);
      console.log(`- Execution time: ${executionTime}ms`);
      console.log(`- Output saved to: ${join(__dirname, "output/advanced-product.json")}`);
      console.log("");

      // Display sample of extracted data
      if (result.value.transformedData.length > 0) {
        const sample = result.value.transformedData[0];
        console.log("📦 Extracted Product Sample:");
        console.log(`- Title: ${sample.title}`);
        console.log(`- SKU: ${sample.sku}`);
        console.log(`- Brand: ${sample.brand}`);
        console.log(`- Current Price: $${sample.currentPrice} ${sample.currency}`);
        console.log(`- Original Price: $${sample.originalPrice} ${sample.currency}`);
        console.log(`- Discount: ${sample.discountPercent}%`);
        console.log(`- Stock Status: ${sample.stockStatus}`);
        console.log(`- Stock Level: ${sample.stockLevel} units`);
        console.log(`- Processor: ${sample.processor}`);
        console.log(`- Memory: ${sample.memory}`);
        console.log(`- Storage: ${sample.storage}`);
        console.log(`- Average Rating: ${sample.averageRating}/5`);
        console.log(`- Total Reviews: ${sample.totalReviews}`);
        console.log(`- Seller: ${sample.sellerName} (${sample.sellerRating}/5)`);
        console.log("");
      }

      console.log("🎯 Advanced Features Demonstrated:");
      console.log("✓ Data attribute extraction (data-* attributes)");
      console.log("✓ Type conversion (strings to numbers/booleans)");
      console.log("✓ Technical specifications from structured data");
      console.log("✓ Review metrics and rating breakdowns");
      console.log("✓ Multi-level field mapping and transformations");
      console.log("✓ Custom schema validation");
      console.log("✓ Default value handling");
      console.log("✓ Image URL processing");
      console.log("");
    } else {
      console.error("❌ Pipeline execution failed:");
      console.error(`- Error: ${result.error.message}`);
      console.error(`- Code: ${result.error.code}`);
      if (result.error.details) {
        console.error(`- Details:`, result.error.details);
      }
    }
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  }

  console.log("=".repeat(50));
  console.log("🏁 Advanced Product Scraper Example completed");
}

// Run the example
if (import.meta.url.endsWith(process.argv[1])) {
  runAdvancedProductScraper().catch(console.error);
}

export { runAdvancedProductScraper };
