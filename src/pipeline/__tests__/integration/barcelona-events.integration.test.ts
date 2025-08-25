/**
 * Integration tests for Barcelona events scraping configuration
 *
 * These tests demonstrate how to use the pipeline with real-world configurations
 * and can be used to validate the pipeline works with different scenarios.
 */

import { describe, it, expect } from "vitest";
import {
  createBarcelonaEventsConfig,
  createBarcelonaEventsConfigAdvanced,
  createBarcelonaEventsProductionConfig,
  BARCELONA_TEST_CONSTANTS,
} from "./barcelona-events.config.js";
import { PipelineConfigFactory } from "../../configs.js";

describe("Barcelona Events Integration Configuration", () => {
  describe("Configuration Factory Functions", () => {
    it("should create basic Barcelona events configuration", () => {
      const config = createBarcelonaEventsConfig();

      expect(config.extractor.url).toBe(BARCELONA_TEST_CONSTANTS.URL);
      expect(config.transformer.schema).toBe("barcelona-event-v1");
      expect(config.extractor.browserConfig.headless).toBe(false);
      expect(config.loader.target).toBe("file");

      // Verify navigation steps are properly configured
      expect(config.extractor.navigationSteps).toHaveLength(4);
      expect(config.extractor.navigationSteps[1]?.selector).toBe(
        BARCELONA_TEST_CONSTANTS.COOKIE_BANNER_SELECTOR
      );
      expect(config.extractor.navigationSteps[2]?.selector).toBe(
        BARCELONA_TEST_CONSTANTS.LOAD_MORE_BUTTON_SELECTOR
      );
    });

    it("should create Barcelona events configuration with custom options", () => {
      const customOutputPath = "test/output/custom_barcelona_events.json";
      const config = createBarcelonaEventsConfig({
        headless: true,
        outputPath: customOutputPath,
      });

      expect(config.extractor.browserConfig.headless).toBe(true);
      expect((config.loader.targetConfig as any).path).toBe(customOutputPath);
    });

    it("should create advanced Barcelona events configuration", () => {
      const config = createBarcelonaEventsConfigAdvanced({
        headless: true,
        timeout: 45000,
        retries: 5,
      });

      expect(config.extractor.browserConfig.headless).toBe(true);
      expect(config.extractor.timeout).toBe(45000);
      expect(config.extractor.retries?.count).toBe(5);
      expect(config.transformer.schema).toBe("barcelona-event-v1");
    });

    it("should create production configuration with cloud storage", () => {
      const spacesConfig = {
        endpoint: "https://fra1.digitaloceanspaces.com",
        region: "fra1",
        bucket: "test-bucket",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        keyPrefix: "test",
      };

      const config = createBarcelonaEventsProductionConfig(spacesConfig);

      expect(config.extractor.browserConfig.headless).toBe(true);
      expect(config.loader.target).toBe("digitalocean-spaces");

      const targetConfig = config.loader.targetConfig as any;
      expect(targetConfig.endpoint).toBe(spacesConfig.endpoint);
      expect(targetConfig.bucket).toBe(spacesConfig.bucket);
      expect(targetConfig.key).toMatch(/^test\/barcelona\/\d{4}-\d{2}-\d{2}\/events\.json$/);
    });
  });

  describe("Configuration Validation", () => {
    it("should have all required selectors for Barcelona events", () => {
      const config = createBarcelonaEventsConfig();
      const fieldMappings = config.transformer.fieldMappings;

      // Check that all expected selectors are present
      expect(fieldMappings.title?.selector).toBe(BARCELONA_TEST_CONSTANTS.SELECTORS.title);
      expect(fieldMappings.url?.selector).toBe(BARCELONA_TEST_CONSTANTS.SELECTORS.url);
      expect(fieldMappings.description?.selector).toBe(
        BARCELONA_TEST_CONSTANTS.SELECTORS.description
      );
      expect(fieldMappings.category?.selector).toBe(BARCELONA_TEST_CONSTANTS.SELECTORS.category);
      expect(fieldMappings.when?.selector).toBe(BARCELONA_TEST_CONSTANTS.SELECTORS.when);
      expect(fieldMappings.where?.selector).toBe(BARCELONA_TEST_CONSTANTS.SELECTORS.where);
      expect(fieldMappings.location?.selector).toBe(BARCELONA_TEST_CONSTANTS.SELECTORS.location);
      expect(fieldMappings.image?.selector).toBe(BARCELONA_TEST_CONSTANTS.SELECTORS.image);
    });

    it("should have proper field requirements", () => {
      const config = createBarcelonaEventsConfig();
      const fieldMappings = config.transformer.fieldMappings;

      // Title and URL should be required
      expect(fieldMappings.title?.required).toBe(true);
      expect(fieldMappings.url?.required).toBe(true); // URL is required in Barcelona config

      // Other fields should be optional
      expect(fieldMappings.description?.required).toBe(false);
      expect(fieldMappings.category?.required).toBe(false);
      expect(fieldMappings.when?.required).toBe(false);
      expect(fieldMappings.where?.required).toBe(false);
      expect(fieldMappings.location?.required).toBe(false);
      expect(fieldMappings.image?.required).toBe(false);
    });
  });

  describe("Reusability Examples", () => {
    it("should demonstrate how to create similar configurations for other cities", () => {
      // Example: Madrid events (hypothetical)
      const madridConfig = PipelineConfigFactory.createEventScrapingConfig({
        url: "https://example-madrid-events.com",
        containerSelector: ".event-item",
        titleSelector: ".event-title a",
        urlSelector: ".event-title a",
        descriptionSelector: ".event-description",
        dateSelector: ".event-date",
        locationSelector: ".event-location",
        outputPath: "output/madrid_events.json",
        headless: true,
      });

      expect(madridConfig.extractor.url).toBe("https://example-madrid-events.com");
      expect(madridConfig.transformer.fieldMappings.title?.selector).toBe(".event-title a");
      expect(madridConfig.loader.target).toBe("file");
    });

    it("should demonstrate configuration for different event types", () => {
      // Example: Museum events
      const museumConfig = PipelineConfigFactory.createBasicConfig({
        url: "https://example-museum.com/events",
        schema: "museum-event-v1",
        fieldMappings: {
          title: {
            selector: "h3.exhibition-title",
            attribute: "text",
            required: true,
          },
          startDate: {
            selector: ".start-date",
            attribute: "text",
            transformer: "date",
            required: true,
          },
          endDate: {
            selector: ".end-date",
            attribute: "text",
            transformer: "date",
            required: false,
          },
          artist: {
            selector: ".artist-name",
            attribute: "text",
            transformer: "trim",
            required: false,
          },
        },
        outputPath: "output/museum_events.json",
        headless: true,
      });

      expect(museumConfig.transformer.schema).toBe("museum-event-v1");
      expect(museumConfig.transformer.fieldMappings.artist?.selector).toBe(".artist-name");
    });

    it("should demonstrate console output configuration for testing", () => {
      const testConfig = PipelineConfigFactory.createTestConfig({
        url: "https://test-events.com",
        schema: "test-event-v1",
        fieldMappings: {
          title: {
            selector: "h1",
            required: true,
          },
          description: {
            selector: ".description",
            required: false,
          },
        },
        headless: true,
      });

      expect(testConfig.loader.target).toBe("console");
      expect((testConfig.loader.targetConfig as any).format).toBe("json");
      expect((testConfig.loader.targetConfig as any).pretty).toBe(true);
    });
  });

  describe("Error Scenarios", () => {
    it("should handle missing optional parameters gracefully", () => {
      const config = createBarcelonaEventsConfig();

      // Should use defaults when options are not provided
      expect(config.extractor.browserConfig.headless).toBe(false);
      expect((config.loader.targetConfig as any).path).toContain(
        "barcelona_events_integration.json"
      );
    });

    it("should validate production configuration requirements", () => {
      // This would normally throw or validate in real implementation
      const spacesConfig = {
        endpoint: "https://fra1.digitaloceanspaces.com",
        region: "fra1",
        bucket: "test-bucket",
        accessKeyId: "", // Empty - should be validated
        secretAccessKey: "", // Empty - should be validated
      };

      const config = createBarcelonaEventsProductionConfig(spacesConfig);

      // Configuration should still be created, but with empty credentials
      // In real implementation, this would be validated at runtime
      expect((config.loader.targetConfig as any).accessKeyId).toBe("");
      expect((config.loader.targetConfig as any).secretAccessKey).toBe("");
    });
  });
});

describe("Configuration Comparison", () => {
  it("should show differences between basic and Barcelona-specific configurations", () => {
    const basicConfig = PipelineConfigFactory.createBasicConfig({
      url: "https://example.com",
      schema: "basic-v1",
      fieldMappings: {
        title: {
          selector: "h1",
          required: true,
        },
      },
    });

    const barcelonaConfig = createBarcelonaEventsConfig();

    // Basic config should be simpler
    expect(basicConfig.extractor.navigationSteps).toHaveLength(1);
    expect(Object.keys(basicConfig.transformer.fieldMappings)).toHaveLength(1);

    // Barcelona config should be more complex
    expect(barcelonaConfig.extractor.navigationSteps).toHaveLength(4);
    expect(Object.keys(barcelonaConfig.transformer.fieldMappings)).toHaveLength(8);
  });
});
