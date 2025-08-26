import type { PipelineConfig } from "../../../src/pipeline/types.js";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ProductListConfigOptions {
  url: string;
  outputPath: string;
  headless?: boolean;
}

/**
 * Product List Scraping Configuration
 *
 * This configuration demonstrates:
 * - List-based extraction from container/item patterns
 * - Multiple field mappings with transformations
 * - Schema validation for product data
 */
export function createProductListConfig(options: ProductListConfigOptions): PipelineConfig {
  return {
    extractor: {
      url: options.url,
      navigationSteps: [],
      browserConfig: {
        headless: options.headless ?? true,
        viewport: { width: 1920, height: 1080 },
      },
      timeout: 30000,
    },

    transformer: {
      type: "list", // Extract multiple items from the page
      schema: "product",
      fieldMappings: {
        // Basic product information
        title: {
          selector: ".product-name",
          transformer: "trim",
        },
        description: {
          selector: ".product-description",
          transformer: "trim",
        },
        brand: {
          selector: ".brand",
          transformer: "trim",
        },

        // Price information
        price: {
          selector: ".price",
          transformer: "trim",
        },
        originalPrice: {
          selector: ".original-price",
          transformer: "trim",
          defaultValue: null, // Optional field
        },
        discount: {
          selector: ".discount",
          transformer: "trim",
          defaultValue: null, // Optional field
        },

        // Rating and review data
        rating: {
          selector: ".rating",
          attribute: "data-rating", // Extract from data attribute
          transformer: "number",
        },

        // URLs and links
        imageUrl: {
          selector: ".product-image img",
          attribute: "src",
        },
        productUrl: {
          selector: ".product-link",
          attribute: "href",
          defaultValue: null, // Set as optional field
        },

        // Category - default value for this example
        category: {
          selector: ".category",
          transformer: "trim",
          defaultValue: "Electronics", // Default category for this example
        },
      },

      // List-specific configuration
      listConfig: {
        containerSelector: ".products-grid", // Container holding all products
        itemSelector: ".product-card", // Individual product elements
      },
    },

    loader: {
      target: "file",
      targetConfig: {
        type: "file",
        path: options.outputPath,
        format: "json",
      } as import("../../../src/pipeline/types.js").FileTargetConfig,
    },
  };
}

export default createProductListConfig;
