/**
 * Unit tests for Pipeline Orchestrator
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  PipelineOrchestrator,
  PipelineFactory,
  DefaultPipelineConfig,
  createPipelineBuilder,
  createPipelineMonitor,
  type PipelineOrchestratorConfig,
} from "../orchestrator.js";
import type {
  PipelineConfig,
  Extractor,
  Transformer,
  Loader,
  ExtractorConfig,
  TransformerConfig,
  LoaderConfig,
  ExtractorError,
  TransformerError,
  LoaderError,
} from "../types.js";
import { ok, err, type Result } from "../../utils/result.utils.js";

// Mock implementations
class MockExtractor implements Extractor {
  async extract(_config: ExtractorConfig): Promise<Result<string, ExtractorError>> {
    await new Promise<void>((resolve) => setTimeout(resolve, 1)); // Add 1ms delay
    return ok("<html><body><h1>Test Content</h1></body></html>");
  }
}

class MockTransformer implements Transformer {
  async transform(
    _html: string,
    _config: TransformerConfig
  ): Promise<Result<readonly Record<string, unknown>[], TransformerError>> {
    await new Promise<void>((resolve) => setTimeout(resolve, 1)); // Add 1ms delay
    return ok([
      { title: "Test Item 1", price: 10.99 },
      { title: "Test Item 2", price: 15.99 },
    ]);
  }
}

class MockLoader implements Loader {
  async load(
    _data: readonly Record<string, unknown>[],
    _config: LoaderConfig
  ): Promise<Result<string, LoaderError>> {
    await new Promise<void>((resolve) => setTimeout(resolve, 2)); // Add 2ms delay
    return ok("console");
  }
}

class FailingExtractor implements Extractor {
  async extract(_config: ExtractorConfig): Promise<Result<string, ExtractorError>> {
    const error: ExtractorError = {
      code: "PAGE_LOAD_FAILED",
      message: "Failed to load page",
      details: {},
    };
    return err(error);
  }
}

class FailingTransformer implements Transformer {
  async transform(
    _html: string,
    _config: TransformerConfig
  ): Promise<Result<readonly Record<string, unknown>[], TransformerError>> {
    const error: TransformerError = {
      code: "INVALID_HTML",
      message: "Failed to parse HTML",
      details: {},
    };
    return err(error);
  }
}

class FailingLoader implements Loader {
  async load(
    _data: readonly Record<string, unknown>[],
    _config: LoaderConfig
  ): Promise<Result<string, LoaderError>> {
    const error: LoaderError = {
      code: "TARGET_UNAVAILABLE",
      message: "Failed to save data",
      details: {},
    };
    return err(error);
  }
}

describe("PipelineOrchestrator", () => {
  let orchestrator: PipelineOrchestrator;
  let mockConfig: PipelineOrchestratorConfig;
  let pipelineConfig: PipelineConfig;

  beforeEach(() => {
    mockConfig = {
      extractor: new MockExtractor(),
      transformer: new MockTransformer(),
      loader: new MockLoader(),
    };

    orchestrator = new PipelineOrchestrator(mockConfig);

    pipelineConfig = {
      extractor: {
        url: "https://example.com",
        navigationSteps: [],
        browserConfig: {
          headless: true,
          viewport: { width: 1280, height: 720 },
        },
        timeout: 30000,
      },
      transformer: {
        type: "item",
        schema: JSON.stringify({
          type: "object",
          properties: {
            title: { type: "string" },
            price: { type: "number" },
          },
        }),
        fieldMappings: {
          title: { selector: "h1", attribute: "text" },
          price: { selector: ".price", attribute: "text", transformer: "price" },
        },
      },
      loader: {
        target: "console",
        targetConfig: {
          type: "console",
          format: "table",
        } as any,
      },
    };
  });

  describe("successful pipeline execution", () => {
    it("should execute complete ETL pipeline successfully", async () => {
      const result = await orchestrator.execute(pipelineConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.extractedHtml).toContain("Test Content");
        expect(result.value.transformedData).toHaveLength(2);
        expect(result.value.transformedData[0]).toHaveProperty("title", "Test Item 1");
        expect(result.value.transformedData[1]).toHaveProperty("title", "Test Item 2");
        expect(result.value.loadedTo).toBe("console");
        expect(result.value.metadata.recordsProcessed).toBe(2);
        expect(result.value.metadata.executionTime).toBeGreaterThan(0);
      }
    });

    it("should include execution metrics", async () => {
      const result = await orchestrator.execute(pipelineConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const { metadata } = result.value;
        expect(metadata.extractorMetrics).toBeDefined();
        expect(metadata.transformerMetrics).toBeDefined();
        expect(metadata.loaderMetrics).toBeDefined();
        expect(metadata.extractorMetrics.totalExecutionTime).toBeGreaterThan(0);
        expect(metadata.transformerMetrics.totalExecutionTime).toBeGreaterThan(0);
        expect(metadata.loaderMetrics.totalExecutionTime).toBeGreaterThan(0);
      }
    });
  });

  describe("pipeline failure scenarios", () => {
    it("should handle extractor failure", async () => {
      const failingConfig: PipelineOrchestratorConfig = {
        extractor: new FailingExtractor(),
        transformer: new MockTransformer(),
        loader: new MockLoader(),
      };

      const failingOrchestrator = new PipelineOrchestrator(failingConfig);
      const result = await failingOrchestrator.execute(pipelineConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("PAGE_LOAD_FAILED");
        expect(result.error.message).toContain("Failed to load page");
      }
    });

    it("should handle transformer failure", async () => {
      const failingConfig: PipelineOrchestratorConfig = {
        extractor: new MockExtractor(),
        transformer: new FailingTransformer(),
        loader: new MockLoader(),
      };

      const failingOrchestrator = new PipelineOrchestrator(failingConfig);
      const result = await failingOrchestrator.execute(pipelineConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("INVALID_HTML");
        expect(result.error.message).toContain("Failed to parse HTML");
      }
    });

    it("should handle loader failure", async () => {
      const failingConfig: PipelineOrchestratorConfig = {
        extractor: new MockExtractor(),
        transformer: new MockTransformer(),
        loader: new FailingLoader(),
      };

      const failingOrchestrator = new PipelineOrchestrator(failingConfig);
      const result = await failingOrchestrator.execute(pipelineConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("TARGET_UNAVAILABLE");
        expect(result.error.message).toContain("Failed to save data");
      }
    });
  });

  describe("individual stage execution", () => {
    it("should execute extractor stage individually", async () => {
      const result = await orchestrator.executeStage("extractor", null, pipelineConfig.extractor);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toContain("Test Content");
      }
    });

    it("should execute transformer stage individually", async () => {
      const html = "<html><body><h1>Test</h1></body></html>";
      const result = await orchestrator.executeStage(
        "transformer",
        html,
        pipelineConfig.transformer
      );

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(Array.isArray(result.value)).toBe(true);
        expect((result.value as any[]).length).toBe(2);
      }
    });

    it("should execute loader stage individually", async () => {
      const data = [{ title: "Test", price: 10.99 }];
      const result = await orchestrator.executeStage("loader", data, pipelineConfig.loader);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe("console");
      }
    });

    it("should handle unknown stage", async () => {
      const result = await orchestrator.executeStage("unknown" as any, null, {});

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("Unknown pipeline stage");
      }
    });
  });

  describe("configuration validation", () => {
    it("should validate complete configuration", async () => {
      const result = orchestrator.validateConfig(pipelineConfig);

      expect(result.isOk).toBe(true);
    });

    it("should reject missing extractor URL", async () => {
      const invalidConfig = {
        ...pipelineConfig,
        extractor: {
          ...pipelineConfig.extractor,
          url: "",
        },
      };

      const result = orchestrator.validateConfig(invalidConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("requires a URL");
      }
    });

    it("should reject missing transformer schema", async () => {
      const invalidConfig = {
        ...pipelineConfig,
        transformer: {
          ...pipelineConfig.transformer,
          schema: "",
        },
      };

      const result = orchestrator.validateConfig(invalidConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("requires a schema");
      }
    });

    it("should reject missing loader target", async () => {
      const invalidConfig = {
        ...pipelineConfig,
        loader: {
          ...pipelineConfig.loader,
          target: "" as any,
        },
      };

      const result = orchestrator.validateConfig(invalidConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("requires a target");
      }
    });
  });

  describe("health status", () => {
    it("should return healthy status", async () => {
      const health = await orchestrator.getHealth();

      expect(health.healthy).toBe(true);
      expect(health.components.extractor.healthy).toBe(true);
      expect(health.components.transformer.healthy).toBe(true);
      expect(health.components.loader.healthy).toBe(true);
      expect(health.components.extractor.lastCheck).toBeGreaterThan(0);
    });
  });
});

describe("PipelineFactory", () => {
  let factory: PipelineFactory;

  beforeEach(() => {
    factory = new PipelineFactory();
  });

  describe("extractor creation", () => {
    it("should create playwright extractor", () => {
      const extractor = factory.createExtractor("playwright");
      expect(extractor).toBeDefined();
    });

    it("should throw for unsupported extractor types", () => {
      expect(() => factory.createExtractor("puppeteer")).toThrow("not yet implemented");
      expect(() => factory.createExtractor("cheerio")).toThrow("not yet implemented");
    });
  });

  describe("transformer creation", () => {
    it("should create cheerio transformer", () => {
      const transformer = factory.createTransformer("cheerio");
      expect(transformer).toBeDefined();
    });

    it("should throw for unsupported transformer types", () => {
      expect(() => factory.createTransformer("jsdom")).toThrow("not yet implemented");
    });
  });

  describe("loader creation", () => {
    it("should create data loader for all supported types", () => {
      const types: ("file" | "digitalocean-spaces" | "aws-s3" | "database")[] = [
        "file",
        "digitalocean-spaces",
        "aws-s3",
        "database",
      ];

      for (const type of types) {
        const loader = factory.createLoader(type);
        expect(loader).toBeDefined();
      }
    });
  });

  describe("pipeline creation", () => {
    it("should create orchestrator with custom config", () => {
      const config: PipelineOrchestratorConfig = {
        extractor: new MockExtractor(),
        transformer: new MockTransformer(),
        loader: new MockLoader(),
      };

      const orchestrator = factory.create(config);
      expect(orchestrator).toBeInstanceOf(PipelineOrchestrator);
    });
  });
});

describe("DefaultPipelineConfig", () => {
  let configFactory: DefaultPipelineConfig;

  beforeEach(() => {
    configFactory = new DefaultPipelineConfig();
  });

  describe("test configuration", () => {
    it("should create test configuration with default URL", () => {
      const config = configFactory.test();

      expect(config.extractor.url).toBe("https://example.com");
      expect(config.transformer.type).toBe("item");
      expect(config.loader.target).toBe("console");
    });

    it("should create test configuration with custom URL", () => {
      const customUrl = "https://test.example.com";
      const config = configFactory.test(customUrl);

      expect(config.extractor.url).toBe(customUrl);
    });
  });

  describe("basic configuration", () => {
    it("should create basic configuration", () => {
      const options = {
        url: "https://example.com/products",
        schema: JSON.stringify({ type: "object" }),
        fieldMappings: {
          title: { selector: "h1" },
          price: { selector: ".price", transformer: "price" },
        },
      };

      const config = configFactory.basic(options);

      expect(config.extractor.url).toBe(options.url);
      expect(config.transformer.schema).toBe(options.schema);
      expect(config.transformer.fieldMappings.title?.selector).toBe("h1");
      expect(config.transformer.fieldMappings.price?.transformer).toBe("price");
    });
  });

  describe("events configuration", () => {
    it("should create events configuration with all options", () => {
      const options = {
        url: "https://events.example.com",
        containerSelector: ".events",
        titleSelector: ".event-title",
        urlSelector: ".event-link",
        descriptionSelector: ".event-description",
        dateSelector: ".event-date",
        locationSelector: ".event-location",
        imageSelector: ".event-image",
        categorySelector: ".event-category",
      };

      const config = configFactory.events(options);

      expect(config.extractor.url).toBe(options.url);
      expect(config.transformer.type).toBe("list");
      expect(config.transformer.listConfig?.containerSelector).toBe(options.containerSelector);
      expect(config.transformer.fieldMappings.title?.selector).toBe(options.titleSelector);
      expect(config.transformer.fieldMappings.url?.selector).toBe(options.urlSelector);
      expect(config.transformer.fieldMappings.description?.selector).toBe(
        options.descriptionSelector
      );
      expect(config.transformer.fieldMappings.date?.transformer).toBe("date");
      expect(config.loader.target).toBe("file");
    });

    it("should create events configuration with minimal options", () => {
      const options = {
        url: "https://events.example.com",
        containerSelector: ".events",
        titleSelector: ".event-title",
      };

      const config = configFactory.events(options);

      expect(config.transformer.fieldMappings.title?.selector).toBe(options.titleSelector);
      expect(config.transformer.fieldMappings.url).toBeUndefined();
      expect(config.transformer.fieldMappings.description).toBeUndefined();
    });
  });
});

describe("Pipeline Builder", () => {
  it("should build pipeline with fluent interface", () => {
    const builder = createPipelineBuilder();
    const mockExtractor = new MockExtractor();
    const mockTransformer = new MockTransformer();
    const mockLoader = new MockLoader();

    const pipeline = builder
      .withExtractor(mockExtractor)
      .withTransformer(mockTransformer)
      .withLoader(mockLoader)
      .withOptions({ enableMetrics: true })
      .build();

    expect(pipeline).toBeInstanceOf(PipelineOrchestrator);
  });

  it("should build pipeline with defaults", () => {
    const builder = createPipelineBuilder();
    const pipeline = builder.build();

    expect(pipeline).toBeInstanceOf(PipelineOrchestrator);
  });
});

describe("Pipeline Monitor", () => {
  it("should create pipeline monitor", () => {
    const monitor = createPipelineMonitor();

    expect(monitor).toBeDefined();
    expect(typeof monitor.on).toBe("function");
    expect(typeof monitor.off).toBe("function");
    expect(typeof monitor.emit).toBe("function");
    expect(typeof monitor.getMetrics).toBe("function");
    expect(typeof monitor.resetMetrics).toBe("function");
  });

  it("should handle event listeners", () => {
    const monitor = createPipelineMonitor();
    const listener = vi.fn();

    monitor.on("pipeline:started", listener);
    monitor.emit("pipeline:started", {
      correlationId: "test-123",
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "pipeline:started",
        correlationId: "test-123",
        timestamp: expect.any(Number),
      })
    );
  });

  it("should remove event listeners", () => {
    const monitor = createPipelineMonitor();
    const listener = vi.fn();

    monitor.on("pipeline:started", listener);
    monitor.off("pipeline:started", listener);
    monitor.emit("pipeline:started", {
      correlationId: "test-123",
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("should return initial metrics", () => {
    const monitor = createPipelineMonitor();
    const metrics = monitor.getMetrics();

    expect(metrics.totalExecutions).toBe(0);
    expect(metrics.successfulExecutions).toBe(0);
    expect(metrics.failedExecutions).toBe(0);
    expect(metrics.averageExecutionTime).toBe(0);
  });

  it("should reset metrics", () => {
    const monitor = createPipelineMonitor();

    monitor.resetMetrics();
    const metrics = monitor.getMetrics();

    expect(metrics.totalExecutions).toBe(0);
    expect(metrics.successfulExecutions).toBe(0);
    expect(metrics.failedExecutions).toBe(0);
  });
});
