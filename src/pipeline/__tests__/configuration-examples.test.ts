/**
 * Example test demonstrating the new configuration approach
 */

import { describe, it, expect } from "vitest";
import { PipelineConfigFactory, NAVIGATION_STEPS } from "../configs.js";

describe("Pipeline Configuration Examples", () => {
  describe("Simple Website Scraping", () => {
    it("should create configuration for a basic news site", () => {
      const config = PipelineConfigFactory.createBasicConfig({
        url: "https://example-news-site.com",
        schema: "news-article-v1",
        fieldMappings: {
          title: {
            selector: "h1.article-title",
            attribute: "text",
            required: true,
          },
          author: {
            selector: ".author-name",
            attribute: "text",
            transformer: "trim",
            required: false,
          },
          publishDate: {
            selector: ".publish-date",
            attribute: "text",
            transformer: "date",
            required: false,
          },
          content: {
            selector: ".article-content",
            attribute: "text",
            transformer: "trim",
            required: false,
          },
        },
        navigationSteps: [
          NAVIGATION_STEPS.waitForPageLoad(3000),
          NAVIGATION_STEPS.clickElement(".cookie-accept", {
            maxAttempts: 1,
            description: "Accept cookies if present",
          }),
        ],
        outputPath: "output/news_articles.json",
        headless: true,
      });

      expect(config.extractor.url).toBe("https://example-news-site.com");
      expect(config.transformer.schema).toBe("news-article-v1");
      expect(config.extractor.navigationSteps).toHaveLength(2);
      expect(config.transformer.fieldMappings.title?.required).toBe(true);
      expect(config.transformer.fieldMappings.author?.required).toBe(false);
    });

    it("should create configuration for e-commerce product listings", () => {
      const config = PipelineConfigFactory.createBasicConfig({
        url: "https://example-shop.com/products",
        schema: "product-v1",
        fieldMappings: {
          name: {
            selector: ".product-title",
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
            selector: ".rating-value",
            attribute: "text",
            transformer: "number",
            required: false,
          },
          image: {
            selector: ".product-image img",
            attribute: "src",
            transformer: "url",
            required: false,
          },
          availability: {
            selector: ".stock-status",
            attribute: "text",
            transformer: "trim",
            required: false,
          },
        },
        navigationSteps: [
          NAVIGATION_STEPS.waitForPageLoad(5000),
          NAVIGATION_STEPS.scrollToBottom(2000),
          NAVIGATION_STEPS.clickElement(".load-more-products", {
            maxAttempts: 5,
            timeout: 3000,
            description: "Load more products",
          }),
        ],
        outputPath: "output/products.json",
        headless: true,
      });

      expect(config.transformer.fieldMappings.price?.transformer).toBe("price");
      expect(config.transformer.fieldMappings.rating?.transformer).toBe("number");
    });
  });

  describe("Event Scraping Scenarios", () => {
    it("should create configuration for a university events page", () => {
      const config = PipelineConfigFactory.createEventScrapingConfig({
        url: "https://example-university.edu/events",
        containerSelector: ".event-card",
        titleSelector: ".event-title h3",
        urlSelector: ".event-title a",
        descriptionSelector: ".event-description",
        dateSelector: ".event-date-time",
        locationSelector: ".event-location",
        imageSelector: ".event-image img",
        categorySelector: ".event-category",
        navigationSteps: [
          NAVIGATION_STEPS.waitForPageLoad(3000),
          NAVIGATION_STEPS.clickElement(".filter-all-events", {
            description: "Show all events",
          }),
        ],
        outputPath: "output/university_events.json",
        headless: true,
      });

      expect(config.extractor.url).toBe("https://example-university.edu/events");
      expect(config.transformer.schema).toBe("event-v1");
      expect(config.transformer.fieldMappings.category).toBeDefined();
    });

    it("should create configuration for museum events", () => {
      const config = PipelineConfigFactory.createEventScrapingConfig({
        url: "https://example-museum.org/exhibitions",
        containerSelector: ".exhibition-item",
        titleSelector: ".exhibition-title",
        urlSelector: ".exhibition-link",
        descriptionSelector: ".exhibition-description",
        dateSelector: ".exhibition-dates",
        locationSelector: ".exhibition-gallery",
        imageSelector: ".exhibition-preview img",
        outputPath: "output/museum_exhibitions.json",
        headless: true,
      });

      expect(config.transformer.fieldMappings.title?.required).toBe(true);
      expect(config.transformer.fieldMappings.location?.selector).toBe(".exhibition-gallery");
    });
  });

  describe("Cloud Storage Integration", () => {
    it("should create configuration with DigitalOcean Spaces", () => {
      const config = PipelineConfigFactory.createCloudConfig({
        url: "https://example-events.com",
        schema: "event-v1",
        fieldMappings: {
          title: {
            selector: ".event-title",
            required: true,
          },
          date: {
            selector: ".event-date",
            transformer: "date",
            required: false,
          },
        },
        spaces: {
          endpoint: "https://fra1.digitaloceanspaces.com",
          region: "fra1",
          bucket: "my-scraping-data",
          key: "events/daily-scrape.json",
          accessKeyId: "mock-access-key",
          secretAccessKey: "mock-secret-key",
          acl: "public-read",
        },
        headless: true,
      });

      expect(config.loader.target).toBe("digitalocean-spaces");
      const targetConfig = config.loader.targetConfig as any;
      expect(targetConfig.bucket).toBe("my-scraping-data");
      expect(targetConfig.endpoint).toBe("https://fra1.digitaloceanspaces.com");
    });
  });

  describe("Development and Testing", () => {
    it("should create test configuration with console output", () => {
      const config = PipelineConfigFactory.createTestConfig({
        url: "https://test-site.com",
        schema: "test-v1",
        fieldMappings: {
          title: {
            selector: "h1",
            required: true,
          },
          content: {
            selector: ".content",
            required: false,
          },
        },
        headless: true,
      });

      expect(config.loader.target).toBe("console");
      expect((config.loader.targetConfig as any).pretty).toBe(true);
    });

    it("should create minimal test configuration", () => {
      const config = PipelineConfigFactory.test("https://custom-test-url.com");

      expect(config.extractor.url).toBe("https://custom-test-url.com");
      expect(config.transformer.schema).toBe("test-event-v1");
      expect(config.loader.target).toBe("console");
    });
  });

  describe("Configuration Customization", () => {
    it("should allow navigation step customization", () => {
      const customSteps = [
        NAVIGATION_STEPS.waitForPageLoad(8000),
        NAVIGATION_STEPS.clickElement("#special-button", {
          maxAttempts: 3,
          timeout: 5000,
          description: "Click special interaction button",
        }),
        NAVIGATION_STEPS.waitForTimeout(2000, "Wait for dynamic content"),
        NAVIGATION_STEPS.scrollToBottom(1000),
      ];

      const config = PipelineConfigFactory.createBasicConfig({
        url: "https://complex-spa.com",
        schema: "spa-content-v1",
        fieldMappings: {
          data: {
            selector: ".dynamic-content",
            required: true,
          },
        },
        navigationSteps: customSteps,
        headless: true,
      });

      expect(config.extractor.navigationSteps).toHaveLength(4);
      expect(config.extractor.navigationSteps[1]?.selector).toBe("#special-button");
      expect(config.extractor.navigationSteps[1]?.maxAttempts).toBe(3);
    });

    it("should handle complex field mappings", () => {
      const config = PipelineConfigFactory.createBasicConfig({
        url: "https://example.com",
        schema: "complex-v1",
        fieldMappings: {
          title: {
            selector: "h1",
            attribute: "text",
            transformer: "trim",
            required: true,
          },
          url: {
            selector: "a.primary-link",
            attribute: "href",
            transformer: "url",
            required: true,
          },
          metadata: {
            selector: ".metadata",
            attribute: "data-json",
            transformer: "json",
            required: false,
          },
          tags: {
            selector: ".tag",
            attribute: "text",
            transformer: "array",
            required: false,
          },
        },
      });

      expect(config.transformer.fieldMappings.metadata?.transformer).toBe("json");
      expect(config.transformer.fieldMappings.tags?.transformer).toBe("array");
    });
  });
});
