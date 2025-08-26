/**
 * Configuration for Advanced Single Item Scraping Example
 */

import type { PipelineConfig } from "../../../src/pipeline/types.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AdvancedProductConfigOptions {
  outputPath: string;
  headless?: boolean;
}

export function createAdvancedProductConfig(options: AdvancedProductConfigOptions): PipelineConfig {
  return {
    extractor: {
      url: `file://${join(__dirname, "data/complex-product.html")}`,
      navigationSteps: [],
      browserConfig: {
        headless: options.headless ?? true,
        viewport: { width: 1920, height: 1080 },
      },
      timeout: 30000,
    },
    transformer: {
      type: "item",
      schema: "advanced-product",
      fieldMappings: {
        // Basic product information
        title: {
          selector: ".product-title",
          transformer: "trim",
        },
        sku: {
          selector: "[data-sku]",
          attribute: "data-sku",
          transformer: "trim",
        },
        brand: {
          selector: ".brand",
          transformer: "trim",
        },
        category: {
          selector: "[data-category]",
          attribute: "data-category",
          transformer: "trim",
        },

        // Pricing information
        currentPrice: {
          selector: "[data-current-price]",
          attribute: "data-current-price",
          transformer: "number",
        },
        originalPrice: {
          selector: "[data-original-price]",
          attribute: "data-original-price",
          transformer: "number",
        },
        currency: {
          selector: "[data-currency]",
          attribute: "data-currency",
          defaultValue: "USD",
        },
        discountPercent: {
          selector: "[data-discount-percent]",
          attribute: "data-discount-percent",
          transformer: "number",
        },
        freeShipping: {
          selector: "[data-free-shipping]",
          attribute: "data-free-shipping",
          transformer: "boolean",
        },

        // Availability
        stockStatus: {
          selector: "[data-stock-status]",
          attribute: "data-stock-status",
          defaultValue: "unknown",
        },
        stockLevel: {
          selector: "[data-stock-level]",
          attribute: "data-stock-level",
          transformer: "number",
        },
        estimatedDelivery: {
          selector: ".estimated-delivery",
          attribute: "datetime",
        },

        // Technical specifications
        processor: {
          selector: '[data-spec="cpu"]',
          transformer: "trim",
        },
        memory: {
          selector: '[data-spec="ram"]',
          transformer: "trim",
        },
        storage: {
          selector: '[data-spec="storage"]',
          transformer: "trim",
        },
        display: {
          selector: '[data-spec="display"]',
          transformer: "trim",
        },
        graphics: {
          selector: '[data-spec="gpu"]',
          transformer: "trim",
        },
        weight: {
          selector: '[data-spec="weight"]',
          transformer: "trim",
        },
        dimensions: {
          selector: '[data-spec="dimensions"]',
          transformer: "trim",
        },
        battery: {
          selector: '[data-spec="battery"]',
          transformer: "trim",
        },
        connectivity: {
          selector: '[data-spec="ports"]',
          transformer: "trim",
        },
        operatingSystem: {
          selector: '[data-spec="os"]',
          transformer: "trim",
        },

        // Review information
        averageRating: {
          selector: "[data-numeric-rating]",
          attribute: "data-numeric-rating",
          transformer: "number",
        },
        totalReviews: {
          selector: "[data-review-count]",
          attribute: "data-review-count",
          transformer: "number",
        },

        // Images
        mainImage: {
          selector: ".main-image",
          attribute: "src",
          transformer: "url",
        },

        // Seller information
        sellerName: {
          selector: "[data-seller-id]",
          transformer: "trim",
        },
        sellerId: {
          selector: "[data-seller-id]",
          attribute: "data-seller-id",
        },
        sellerRating: {
          selector: "[data-seller-rating]",
          attribute: "data-seller-rating",
          transformer: "number",
        },
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

// Default configuration for quick usage

/**
 * Advanced product extraction configuration
 * Example: Extract complex product data with nested structure and transformations
 */
export const advancedProductConfig: PipelineConfig = {
  extractor: {
    url:
      "file://" + process.cwd() + "/docs/examples/02-single-item-advanced/data/sample-product.html",
    navigationSteps: [],
    browserConfig: {
      headless: true,
      viewport: { width: 1920, height: 1080 },
    },
    timeout: 30000,
  },

  transformer: {
    type: "item",
    schema: "advanced-product-nested",
    fieldMappings: {
      // Basic product information (nested under 'basic')
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

      // Pricing information with type transformations (nested under 'pricing')
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

      // Availability information (nested under 'availability')
      "availability.status": {
        selector: "[data-stock-status]",
        attribute: "data-stock-status",
        defaultValue: "unknown",
      },
      "availability.stockLevel": {
        selector: "[data-stock-level]",
        attribute: "data-stock-level",
        transformer: "number",
      },
      "availability.estimatedDelivery": {
        selector: ".estimated-delivery",
        attribute: "datetime",
      },

      // Technical specifications as nested object (nested under 'specifications')
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

      // Arrays using multiple flag
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

      // Review metrics (nested under 'reviews')
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
    },
  },

  loader: {
    target: "file",
    targetConfig: {
      type: "file",
      path: "./output/advanced-product.json",
      format: "json",
    } as import("../../../src/pipeline/types.js").FileTargetConfig,
  },
};
