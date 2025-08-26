/**
 * Product List Scraping Example
 *
 * This example demonstrates extracting structured data from a product listing page.
 * Perfect for scraping e-commerce search results, product catalogs, or marketplace listings.
 */

import { PipelineFactory } from "../../../src/pipeline/orchestrator.js";
import { createProductListConfig } from "./config.js";
import { getLogger } from "../../../src/utils/logger.utils.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const logger = getLogger("ProductListExample");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runProductListExample(): Promise<void> {
  logger.info("🚀 Starting Product List Extraction Example");

  try {
    // Create pipeline using factory with local schema validation
    const factory = new PipelineFactory();
    const localSchemasPath = join(__dirname, "schemas");
    const pipeline = await factory.createDefaultWithCustomSchemas(localSchemasPath);

    // Create configuration for product list extraction
    const config = createProductListConfig({
      // Use local sample file for demonstration
      url: `file://${join(__dirname, "data", "products-listing.html")}`,
      outputPath: join(__dirname, "output", "products.json"),
    });

    // Execute the pipeline
    const result = await pipeline.execute(config);

    if (result.isOk) {
      logger.info("✅ Product list extraction completed successfully");
      logger.info(`📊 Extracted ${result.value.transformedData.length} products`);
      logger.info(`⏱️  Execution time: ${result.value.metadata.executionTime}ms`);
      logger.info(`📁 Output saved to: ${join(__dirname, "output", "products.json")}`);

      // Display extracted data summary
      console.log("\n🛍️  Extracted Product Data:");
      console.log("=" + "=".repeat(50));

      if (result.value.transformedData && result.value.transformedData.length > 0) {
        result.value.transformedData.forEach((product: any, index: number) => {
          console.log(`\n${index + 1}. ${product.title || "Unknown Product"}`);
          console.log(`   Brand: ${product.brand || "N/A"}`);
          console.log(`   Price: ${product.price || "N/A"}`);
          if (product.originalPrice) {
            console.log(
              `   Original Price: ${product.originalPrice} (${product.discount || "Discount"})`
            );
          }
          console.log(`   Rating: ${product.rating || "N/A"}/5`);
          console.log(`   Category: ${product.category || "N/A"}`);
        });

        // Summary statistics
        const validProducts = result.value.transformedData.filter((p: any) => p.title && p.price);
        const productsWithDiscounts = result.value.transformedData.filter(
          (p: any) => p.originalPrice
        );
        const averageRating =
          result.value.transformedData
            .filter((p: any) => p.rating)
            .reduce((sum: number, p: any) => sum + parseFloat(p.rating), 0) /
          result.value.transformedData.filter((p: any) => p.rating).length;

        console.log("\n📈 Summary Statistics:");
        console.log("=" + "=".repeat(30));
        console.log(`Total Products: ${result.value.transformedData.length}`);
        console.log(`Valid Products: ${validProducts.length}`);
        console.log(`Products with Discounts: ${productsWithDiscounts.length}`);
        console.log(`Average Rating: ${averageRating ? averageRating.toFixed(1) : "N/A"}/5`);

        // Show which brands were found
        const brands = [
          ...new Set(result.value.transformedData.map((p: any) => p.brand).filter(Boolean)),
        ];
        console.log(`Brands Found: ${brands.join(", ")}`);
      } else {
        logger.warn("⚠️ No products were extracted");
        console.log("\n💡 Debugging Tips:");
        console.log("- Check if the HTML file exists and contains product elements");
        console.log("- Verify the CSS selectors match the HTML structure");
        console.log("- Review the extraction logs above for any errors");
      }

      // Performance insights
      console.log("\n⚡ Performance Insights:");
      console.log("=" + "=".repeat(30));
      console.log(`Total Execution Time: ${result.value.metadata.executionTime}ms`);
      console.log(`Records Processed: ${result.value.metadata.recordsProcessed}`);
    } else {
      logger.error("❌ Product list extraction failed");
      console.error("\n🔍 Error Details:");
      console.error(`Code: ${result.error.code}`);
      console.error(`Message: ${result.error.message}`);

      if (result.error.details) {
        console.error("Details:", result.error.details);
      }

      console.log("\n💡 Troubleshooting:");
      console.log("1. Ensure the HTML file exists in the data/ directory");
      console.log("2. Check that CSS selectors match the HTML structure");
      console.log("3. Verify the product schema is valid");
      console.log("4. Review the pipeline configuration");

      process.exit(1);
    }
  } catch (error) {
    logger.error("💥 Unexpected error during extraction:", error);
    console.error(error);
    process.exit(1);
  }
}

// Execute the example
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductListExample().catch(console.error);
}
