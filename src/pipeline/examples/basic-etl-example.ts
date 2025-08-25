import { HtmlTransformer, TransformerConfig } from "../transformer";
import { DataLoader, LoadConfig } from "../loader";
import { getLogger } from "../../utils/logger.utils.js";

/**
 * Basic ETL Pipeline Integration Example
 *
 * This demonstrates how to use the transformer and loader modules together
 * to create a complete ETL pipeline for web scraping.
 */

const logger = getLogger("BasicETLExample");

async function runEtlExample(): Promise<void> {
  // Sample HTML data (would normally come from extractor)
  const sampleHtml = `
    <div class="products-container">
      <div class="product-item">
        <h3 class="product-title">Laptop Pro</h3>
        <span class="price">$1,299.99</span>
        <div class="rating" data-stars="4">4 stars</div>
        <p class="description">High-performance laptop for professionals</p>
      </div>
      <div class="product-item">
        <h3 class="product-title">Wireless Headphones</h3>
        <span class="price">$199.99</span>
        <div class="rating" data-stars="5">5 stars</div>
        <p class="description">Noise-cancelling wireless headphones</p>
      </div>
      <div class="product-item">
        <h3 class="product-title">Smartphone</h3>
        <span class="price">$899.99</span>
        <div class="rating" data-stars="4">4 stars</div>
        <p class="description">Latest smartphone with advanced features</p>
      </div>
    </div>
  `;

  // Configure the transformer
  const transformerConfig: TransformerConfig = {
    type: "list",
    schema: "product-schema",
    listConfig: {
      containerSelector: ".products-container",
      itemSelector: ".product-item",
    },
    fieldMappings: {
      title: {
        selector: ".product-title",
        transformer: "trim",
      },
      price: {
        selector: ".price",
        transformer: "price",
      },
      rating: {
        selector: ".rating",
        attribute: "data-stars",
        transformer: "number",
      },
      description: {
        selector: ".description",
        transformer: "trim",
      },
    },
  };

  // Configure the loader
  const loaderConfig: LoadConfig = {
    targets: [
      {
        type: "console",
        config: { format: "table" },
      },
      {
        type: "file",
        config: { path: "./output/products.json" },
      },
      {
        type: "file",
        config: { path: "./output/products.csv" },
      },
    ],
    format: "json",
    options: { pretty: true },
  };

  try {
    logger.info("🚀 Starting ETL Pipeline Example...");

    // Step 1: Transform (Extract + Transform)
    logger.info("📄 Transforming HTML data...");
    const transformer = new HtmlTransformer();

    // Register the schema
    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        price: { type: "number" },
        rating: { type: "number" },
        description: { type: "string" },
      },
      required: ["title", "price", "rating"],
    };
    transformer.getSchemaValidator().registerSchema("product-schema", schema);

    const transformResult = await transformer.transform(sampleHtml, transformerConfig);

    if (transformResult.isErr) {
      logger.error("❌ Transformation failed", undefined, { error: transformResult.error });
      return;
    }

    const extractedData = transformResult.value;
    logger.info(`✅ Transformation completed: ${extractedData.length} products extracted`);

    // Step 2: Load (Save data to targets)
    logger.info("💾 Loading data to targets...");
    const loader = new DataLoader();
    const loadResult = await loader.load(extractedData as Record<string, unknown>[], loaderConfig);

    if (loadResult.isErr) {
      logger.error("❌ Loading failed", undefined, { error: loadResult.error });
      return;
    }

    // Display results
    logger.info("📊 ETL Pipeline Results:");
    logger.info("========================");

    const results = loadResult.value;
    results.forEach((result, index) => {
      const status = result.success ? "✅" : "❌";
      logger.info(
        `${status} Target ${index + 1} (${result.target.type}): ${result.recordCount} records`
      );

      if (result.target.type === "file") {
        const fileConfig = result.target.config as { path: string };
        logger.info(`   📁 File: ${fileConfig.path}`);
        if (result.outputSize) {
          logger.info(`   📏 Size: ${result.outputSize} bytes`);
        }
      }
    });

    logger.info(`🎉 Pipeline completed successfully! Processed ${extractedData.length} records.`);
  } catch (error) {
    logger.error("💥 Pipeline failed with error", error instanceof Error ? error : undefined, {
      error: error instanceof Error ? undefined : error,
    });
  }
}

// Run the example
runEtlExample().catch((error: unknown) => {
  const errorLogger = getLogger("BasicETLExample");
  errorLogger.error("Unhandled pipeline error", error instanceof Error ? error : undefined, {
    error: error instanceof Error ? undefined : error,
  });
});

export { runEtlExample };
