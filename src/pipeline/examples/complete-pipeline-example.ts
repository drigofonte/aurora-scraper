/**
 * Complete ETL Pipeline Integration Example
 *
 * This example demonstrates the full ETL pipeline with:
 * - Web extraction using Playwright
 * - HTML transformation using Cheerio
 * - Multiple loading targets (file, console, database, API)
 */

import {
  PipelineOrchestrator,
  PipelineFactory,
  DefaultPipelineConfig,
  createPipelineBuilder,
  type PipelineOrchestratorConfig,
} from "../orchestrator.js";
import { createWebExtractor } from "../extractor/web-extractor.js";
import { createHtmlTransformer } from "../transformer/html-transformer.js";
import { createPipelineLoader } from "../loader/pipeline-loader.js";
import type { PipelineConfig, LoaderTarget, TargetConfig, FileTargetConfig } from "../types.js";
import { getLogger } from "../../utils/logger.utils.js";

const logger = getLogger("CompletePipelineExample");

/**
 * Example 1: Basic pipeline with factory
 */
async function basicPipelineExample(): Promise<void> {
  logger.info("=== Basic Pipeline Example ===");

  const factory = new PipelineFactory();
  const configFactory = new DefaultPipelineConfig();

  // Create pipeline with default components
  const pipeline = factory.createDefault();

  // Create test configuration
  const config = configFactory.test("https://example.com");

  // Execute pipeline
  const result = await pipeline.execute(config);

  if (result.isOk) {
    console.log("✅ Pipeline executed successfully");
    console.log(`📊 Processed ${result.value.metadata.recordsProcessed} records`);
    console.log(`⏱️  Execution time: ${result.value.metadata.executionTime}ms`);
    console.log(`📍 Data loaded to: ${result.value.loadedTo}`);
  } else {
    console.error("❌ Pipeline failed:", result.error.message);
  }
}

/**
 * Example 2: Custom pipeline configuration
 */
async function customPipelineExample(): Promise<void> {
  console.log("\n=== Custom Pipeline Example ===");

  // Create custom pipeline configuration
  const config: PipelineOrchestratorConfig = {
    extractor: createWebExtractor(),
    transformer: createHtmlTransformer(),
    loader: createPipelineLoader(),
    options: {
      enableMetrics: true,
      correlationId: "custom-pipeline-001",
    },
  };

  const pipeline = new PipelineOrchestrator(config);

  // Create pipeline configuration for scraping product data
  const pipelineConfig: PipelineConfig = {
    extractor: {
      url: "https://example.com/products",
      navigationSteps: [
        {
          type: "wait",
          selector: ".products-container",
          timeout: 5000,
        },
        {
          type: "scroll",
          description: "Scroll to load more products",
        },
      ],
      browserConfig: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        userAgent: "ETL-Pipeline/1.0",
      },
      timeout: 30000,
    },
    transformer: {
      type: "list",
      schema: JSON.stringify({
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            price: { type: "number" },
            rating: { type: "number" },
            description: { type: "string" },
            imageUrl: { type: "string" },
          },
          required: ["title", "price"],
        },
      }),
      fieldMappings: {
        title: {
          selector: "h2.product-title",
          attribute: "text",
          required: true,
        },
        price: {
          selector: ".price",
          attribute: "text",
          transformer: "price",
          required: true,
        },
        rating: {
          selector: ".rating",
          attribute: "data-rating",
          transformer: "number",
        },
        description: {
          selector: ".description",
          attribute: "text",
          transformer: "trim",
        },
        imageUrl: {
          selector: "img.product-image",
          attribute: "src",
        },
      },
      listConfig: {
        containerSelector: ".products-container",
        itemSelector: ".product-item",
      },
    },
    loader: {
      target: "file" as const,
      targetConfig: {
        type: "file",
        path: "./output/custom-products.json",
        format: "json",
        createDirectory: true,
      } as FileTargetConfig,
    },
  };

  // Execute the pipeline
  const result = await pipeline.execute(pipelineConfig);

  if (result.isOk) {
    console.log("✅ Custom pipeline executed successfully");
    console.log(`📊 Extracted ${result.value.extractedHtml.length} characters of HTML`);
    console.log(`🔄 Transformed ${result.value.transformedData.length} records`);
    console.log(`💾 Loaded to: ${result.value.loadedTo}`);

    // Show sample data
    if (result.value.transformedData.length > 0) {
      console.log("📋 Sample record:", JSON.stringify(result.value.transformedData[0], null, 2));
    }
  } else {
    console.error("❌ Custom pipeline failed:", result.error.message);
  }
}

/**
 * Example 3: Multi-target loading (file + console + database + API)
 */
async function multiTargetLoadingExample(): Promise<void> {
  console.log("\n=== Multi-Target Loading Example ===");

  const factory = new PipelineFactory();
  const pipeline = factory.createDefault();

  // Configuration with multiple loading targets
  const pipelineConfig: PipelineConfig = {
    extractor: {
      url: "https://example.com/events",
      navigationSteps: [],
      browserConfig: {
        headless: true,
        viewport: { width: 1280, height: 720 },
      },
      timeout: 30000,
    },
    transformer: {
      type: "list",
      schema: JSON.stringify({
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            date: { type: "string" },
            location: { type: "string" },
            url: { type: "string" },
          },
          required: ["title"],
        },
      }),
      fieldMappings: {
        title: { selector: ".event-title", attribute: "text", required: true },
        date: { selector: ".event-date", attribute: "text", transformer: "date" },
        location: { selector: ".event-location", attribute: "text" },
        url: { selector: "a", attribute: "href" },
      },
      listConfig: {
        containerSelector: ".events-list",
        itemSelector: ".event-item",
      },
    },
    loader: {
      target: "file", // Primary target
      targetConfig: {
        type: "file",
        path: "./output/events.json",
        format: "json",
      } as FileTargetConfig,
    },
  };

  const result = await pipeline.execute(pipelineConfig);

  if (result.isOk) {
    console.log("✅ Multi-target loading completed");
    console.log(`📊 Events processed: ${result.value.transformedData.length}`);

    // Simulate additional loading to other targets
    console.log("🗄️  Would also save to database and send to API...");
  } else {
    console.error("❌ Multi-target loading failed:", result.error.message);
  }
}

/**
 * Example 4: Pipeline builder pattern
 */
async function builderPatternExample(): Promise<void> {
  console.log("\n=== Pipeline Builder Pattern Example ===");

  const pipeline = createPipelineBuilder()
    .withExtractor(createWebExtractor())
    .withTransformer(createHtmlTransformer())
    .withLoader(createPipelineLoader())
    .withOptions({
      enableMetrics: true,
      correlationId: "builder-example-001",
    })
    .build();

  const configFactory = new DefaultPipelineConfig();
  const config = configFactory.basic({
    url: "https://example.com/articles",
    schema: JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        author: { type: "string" },
      },
    }),
    fieldMappings: {
      title: { selector: "h1" },
      content: { selector: ".article-content", transformer: "html-to-text" },
      author: { selector: ".author" },
    },
  });

  const result = await pipeline.execute(config);

  if (result.isOk) {
    console.log("✅ Builder pattern pipeline executed successfully");
    console.log(`⚡ Total execution time: ${result.value.metadata.executionTime}ms`);
  } else {
    console.error("❌ Builder pattern pipeline failed:", result.error.message);
  }
}

/**
 * Example 5: Pipeline validation and health checks
 */
async function validationAndHealthExample(): Promise<void> {
  console.log("\n=== Validation and Health Example ===");

  const factory = new PipelineFactory();
  const pipeline = factory.createDefault();

  // Test configuration validation
  const invalidConfig: PipelineConfig = {
    extractor: {
      url: "", // Invalid: empty URL
      navigationSteps: [],
      browserConfig: {
        headless: true,
        viewport: { width: 1280, height: 720 },
      },
      timeout: 30000,
    },
    transformer: {
      type: "item",
      schema: "", // Invalid: empty schema
      fieldMappings: {},
    },
    loader: {
      target: "invalid-target" as LoaderTarget, // Invalid: non-existent target
      targetConfig: {
        type: "invalid-type" as LoaderTarget,
      } as TargetConfig,
    },
  };

  // Validate configuration
  const validationResult = pipeline.validateConfig(invalidConfig);
  if (validationResult.isErr) {
    console.log("✅ Configuration validation working:", validationResult.error.message);
  }

  // Check pipeline health
  const health = await pipeline.getHealth();
  console.log("🏥 Pipeline health status:", {
    healthy: health.healthy,
    extractor: health.components.extractor.healthy,
    transformer: health.components.transformer.healthy,
    loader: health.components.loader.healthy,
  });
}

/**
 * Run all examples
 */
async function runAllExamples(): Promise<void> {
  console.log("🚀 Running Complete ETL Pipeline Examples");
  console.log("==========================================");

  try {
    await basicPipelineExample();
    await customPipelineExample();
    await multiTargetLoadingExample();
    await builderPatternExample();
    await validationAndHealthExample();

    console.log("\n🎉 All examples completed successfully!");
  } catch (error) {
    console.error("\n💥 Example execution failed:", error);
  }
}

// Export for testing and manual execution
export {
  basicPipelineExample,
  customPipelineExample,
  multiTargetLoadingExample,
  builderPatternExample,
  validationAndHealthExample,
  runAllExamples,
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void runAllExamples();
}
