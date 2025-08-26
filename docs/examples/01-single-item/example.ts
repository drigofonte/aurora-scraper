/**
 * Single Item Scraping Example
 *
 * This example demonstrates extracting structured data from a single article page.
 * Perfect for scraping blog posts, news articles, or product detail pages.
 */

import { PipelineFactory } from "../../../src/pipeline/orchestrator.js";
import { createArticleConfig } from "./config.js";
import { getLogger } from "../../../src/utils/logger.utils.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const logger = getLogger("SingleItemExample");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runSingleItemExample(): Promise<void> {
  logger.info("🚀 Starting Single Item Extraction Example");

  try {
    // Create pipeline using factory with local schema validation
    const factory = new PipelineFactory();
    const localSchemasPath = join(__dirname, "schemas");
    const pipeline = await factory.createDefaultWithCustomSchemas(localSchemasPath);

    // Create configuration for article extraction
    const config = createArticleConfig({
      // Use local sample file for demonstration
      url: `file://${join(__dirname, "data", "sample-article.html")}`,
      outputPath: join(__dirname, "output", "article.json"),
    });

    // Execute the pipeline
    const result = await pipeline.execute(config);

    if (result.isOk) {
      logger.info("✅ Article extraction completed successfully");
      logger.info(`📊 Extracted 1 article`);
      logger.info(`⏱️  Execution time: ${result.value.metadata.executionTime}ms`);
      logger.info(`📁 Output saved to: ${join(__dirname, "output", "article.json")}`);

      // Display extracted data
      console.log("\n📄 Extracted Article Data:");
      console.log("=" + "=".repeat(50));

      if (result.value.transformedData && result.value.transformedData.length > 0) {
        const article = result.value.transformedData[0];
        console.log(`Title: ${article.title}`);
        console.log(`Author: ${article.author}`);
        console.log(`Published: ${article.publishedDate}`);
        console.log(`Category: ${article.category}`);
        console.log(
          `Content: ${typeof article.content === "string" ? article.content.substring(0, 100) + "..." : "[No content]"}`
        );
      }
    } else {
      logger.error("❌ Article extraction failed");
      console.error("Error details:", result.error);

      // Provide helpful error guidance
      switch (result.error.code) {
        case "PAGE_LOAD_FAILED":
          logger.error("💡 Check if the URL is accessible and valid");
          break;
        case "SELECTOR_NOT_FOUND":
          logger.error("💡 Verify CSS selectors match the page structure");
          break;
        case "INVALID_HTML":
          logger.error("💡 Check if extracted data matches the schema");
          break;
        default:
          logger.error("💡 Check the configuration and try again");
      }

      process.exit(1);
    }
  } catch (error) {
    logger.error("💥 Unexpected error:", error);
    process.exit(1);
  }
}

// Alternative: Extract from a live website
async function runLiveWebsiteExample(): Promise<void> {
  logger.info("🌐 Starting Live Website Extraction Example");

  const factory = new PipelineFactory();
  const pipeline = factory.createDefault();

  // Example with a real website (replace with actual URL)
  const config = createArticleConfig({
    url: "https://example-news-site.com/article/sample",
    outputPath: join(__dirname, "output", "live-article.json"),
    headless: true, // Run browser in headless mode
  });

  const result = await pipeline.execute(config);

  if (result.isOk) {
    logger.info("✅ Live article extraction completed");
  } else {
    logger.error("❌ Live extraction failed");
    console.error("Error details:", result.error);
  }
}

// Run the appropriate example based on command line arguments
const args = process.argv.slice(2);

if (args.includes("--live")) {
  runLiveWebsiteExample().catch((error) => {
    console.error("Example failed:", error);
    process.exit(1);
  });
} else {
  runSingleItemExample().catch((error) => {
    console.error("Example failed:", error);
    process.exit(1);
  });
}

export { runSingleItemExample, runLiveWebsiteExample };
