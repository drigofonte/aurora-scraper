/**
 * Pipeline orchestrator implementation
 *
 * This module provides the main entry point for executing ETL pipelines
 * with configurable extractor, transformer, and loader implementations.
 */

import type { Result } from "../utils/result.utils.js";
import { ok, err } from "../utils/result.utils.js";
import type {
  Pipeline,
  PipelineConfig,
  PipelineResult,
  PipelineError,
  PipelineExecutionMetadata,
  Extractor,
  Transformer,
  Loader,
  PipelineStage,
  ExtractorMetrics,
  TransformerMetrics,
  LoaderMetrics,
  ExtractorConfig,
  TransformerConfig,
  LoaderConfig,
  ConsoleTargetConfig,
  ElementAttribute,
  FieldTransformer,
  FileTargetConfig,
  FieldMapping,
} from "./types.js";
import { getLogger } from "../utils/logger.utils.js";
import { createWebExtractor } from "./extractor/web-extractor.js";
import { createHtmlTransformer } from "./transformer/html-transformer.js";
import { createPipelineLoader } from "./loader/pipeline-loader.js";

const logger = getLogger("PipelineOrchestrator");

/**
 * Pipeline orchestrator configuration
 */
export interface PipelineOrchestratorConfig {
  readonly extractor: Extractor;
  readonly transformer: Transformer;
  readonly loader: Loader;
  readonly options?: PipelineOrchestratorOptions;
}

/**
 * Pipeline orchestrator options
 */
export interface PipelineOrchestratorOptions {
  readonly enableMetrics?: boolean;
  readonly enableRetries?: boolean;
  readonly logLevel?: "debug" | "info" | "warn" | "error";
  readonly timeoutMs?: number;
  readonly correlationId?: string;
}

/**
 * Pipeline execution context
 */
export interface PipelineExecutionContext {
  readonly correlationId: string;
  readonly startTime: number;
  readonly config: PipelineConfig;
  readonly stage: PipelineStage;
}

/**
 * Pipeline orchestrator implementation
 */
export class PipelineOrchestrator implements Pipeline {
  constructor(private readonly config: PipelineOrchestratorConfig) {}

  /**
   * Execute the complete ETL pipeline
   */
  async execute(pipelineConfig: PipelineConfig): Promise<Result<PipelineResult, PipelineError>> {
    const correlationId = this.config.options?.correlationId ?? `pipeline-${Date.now()}`;
    const startTime = Date.now();

    logger.info("Starting pipeline execution", { correlationId });

    try {
      // Stage 1: Extract
      logger.debug("Starting extraction stage", { correlationId });
      const extractStart = Date.now();
      const extractResult = await this.config.extractor.extract(pipelineConfig.extractor);
      const extractTime = Date.now() - extractStart;

      if (extractResult.isErr) {
        logger.error("Extraction stage failed", undefined, {
          correlationId,
          error: extractResult.error,
        });
        return extractResult;
      }

      const extractedHtml = extractResult.value;
      logger.debug("Extraction stage completed", {
        correlationId,
        htmlLength: extractedHtml.length,
        executionTime: extractTime,
      });

      // Stage 2: Transform
      logger.debug("Starting transformation stage", { correlationId });
      const transformStart = Date.now();
      const transformResult = await this.config.transformer.transform(
        extractedHtml,
        pipelineConfig.transformer
      );
      const transformTime = Date.now() - transformStart;

      if (transformResult.isErr) {
        logger.error("Transformation stage failed", undefined, {
          correlationId,
          error: transformResult.error,
        });
        return transformResult;
      }

      const transformedData = transformResult.value;
      logger.debug("Transformation stage completed", {
        correlationId,
        recordCount: transformedData.length,
        executionTime: transformTime,
      });

      // Stage 3: Load
      logger.debug("Starting loading stage", { correlationId });
      const loadStart = Date.now();
      const loadResult = await this.config.loader.load(transformedData, pipelineConfig.loader);
      const loadTime = Date.now() - loadStart;

      if (loadResult.isErr) {
        logger.error("Loading stage failed", undefined, {
          correlationId,
          error: loadResult.error,
        });
        return loadResult;
      }

      const loadedTo = loadResult.value;
      const totalTime = Date.now() - startTime;

      logger.info("Pipeline execution completed successfully", {
        correlationId,
        recordsProcessed: transformedData.length,
        totalTime,
        extractTime,
        transformTime,
        loadTime,
      });

      // Build pipeline result
      const pipelineResult: PipelineResult = {
        extractedHtml,
        transformedData,
        loadedTo,
        metadata: {
          executionTime: totalTime,
          recordsProcessed: transformedData.length,
          extractorMetrics: {
            navigationSteps: pipelineConfig.extractor.navigationSteps.length,
            pageLoadTime: extractTime,
            totalExecutionTime: extractTime,
            retryAttempts: 0,
            errors: [],
          },
          transformerMetrics: {
            recordsProcessed: transformedData.length,
            validationErrors: 0,
            fieldExtractionTime: transformTime,
            validationTime: 0,
            totalExecutionTime: transformTime,
            errors: [],
          },
          loaderMetrics: {
            recordsLoaded: transformedData.length,
            uploadTime: loadTime,
            retryAttempts: 0,
            totalExecutionTime: loadTime,
            errors: [],
          },
        },
      };

      return ok(pipelineResult);
    } catch (error) {
      const pipelineError: PipelineError = {
        code: "PAGE_LOAD_FAILED", // Generic error code
        message: `Pipeline execution failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { correlationId, error },
      };

      logger.error("Pipeline execution failed", undefined, {
        correlationId,
        error: pipelineError,
      });
      return err(pipelineError);
    }
  }

  /**
   * Execute individual pipeline stage (for testing/debugging)
   */
  async executeStage<T>(
    stage: PipelineStage,
    input: unknown,
    config: unknown
  ): Promise<Result<T, PipelineError>> {
    logger.debug("Executing individual stage", { stage });

    try {
      switch (stage) {
        case "extractor": {
          const result = await this.config.extractor.extract(config as ExtractorConfig);
          return result as Result<T, PipelineError>;
        }
        case "transformer": {
          const result = await this.config.transformer.transform(
            input as string,
            config as TransformerConfig
          );
          return result as Result<T, PipelineError>;
        }
        case "loader": {
          const result = await this.config.loader.load(
            input as Record<string, unknown>[],
            config as LoaderConfig
          );
          return result as Result<T, PipelineError>;
        }
        default: {
          const error: PipelineError = {
            code: "STEP_EXECUTION_FAILED",
            message: `Unknown pipeline stage: ${stage}`,
            details: { stage },
          };
          return err(error);
        }
      }
    } catch (error) {
      const pipelineError: PipelineError = {
        code: "STEP_EXECUTION_FAILED",
        message: `Stage ${stage} execution failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { stage, error },
      };
      return err(pipelineError);
    }
  }

  /**
   * Validate pipeline configuration
   */
  validateConfig(config: PipelineConfig): Result<void, PipelineError> {
    try {
      // Basic validation checks
      if (!config.extractor?.url) {
        const error: PipelineError = {
          code: "INVALID_CREDENTIALS",
          message: "Extractor configuration requires a URL",
          details: { config },
        };
        return err(error);
      }

      if (!config.transformer?.schema) {
        const error: PipelineError = {
          code: "SCHEMA_VALIDATION_FAILED",
          message: "Transformer configuration requires a schema",
          details: { config },
        };
        return err(error);
      }

      if (!config.loader?.target) {
        const error: PipelineError = {
          code: "TARGET_UNAVAILABLE",
          message: "Loader configuration requires a target",
          details: { config },
        };
        return err(error);
      }

      return ok(undefined);
    } catch (error) {
      const pipelineError: PipelineError = {
        code: "INVALID_CREDENTIALS",
        message: `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { config, error },
      };
      return err(pipelineError);
    }
  }

  /**
   * Get pipeline health status
   */
  async getHealth(): Promise<PipelineHealthStatus> {
    const now = Date.now();

    return {
      healthy: true,
      components: {
        extractor: {
          healthy: true,
          lastCheck: now,
        },
        transformer: {
          healthy: true,
          lastCheck: now,
        },
        loader: {
          healthy: true,
          lastCheck: now,
        },
      },
    };
  }
}

/**
 * Pipeline health status
 */
export interface PipelineHealthStatus {
  readonly healthy: boolean;
  readonly components: {
    readonly extractor: ComponentHealth;
    readonly transformer: ComponentHealth;
    readonly loader: ComponentHealth;
  };
  readonly lastExecution?: {
    readonly timestamp: number;
    readonly success: boolean;
    readonly duration: number;
  };
}

/**
 * Component health status
 */
export interface ComponentHealth {
  readonly healthy: boolean;
  readonly lastCheck: number;
  readonly error?: string;
  readonly metrics?: Record<string, number>;
}

/**
 * Pipeline factory implementation
 */
export class PipelineFactory {
  /**
   * Create a pipeline orchestrator with default implementations
   */
  createDefault(): PipelineOrchestrator {
    const config: PipelineOrchestratorConfig = {
      extractor: createWebExtractor(),
      transformer: createHtmlTransformer(),
      loader: createPipelineLoader(),
    };

    return new PipelineOrchestrator(config);
  }

  /**
   * Create a pipeline orchestrator with custom implementations
   */
  create(config: PipelineOrchestratorConfig): PipelineOrchestrator {
    return new PipelineOrchestrator(config);
  }

  /**
   * Create an extractor instance
   */
  createExtractor(type: "playwright" | "puppeteer" | "cheerio"): Extractor {
    switch (type) {
      case "playwright": {
        return createWebExtractor();
      }
      case "puppeteer":
        throw new Error("Puppeteer extractor not yet implemented");
      case "cheerio":
        throw new Error("Cheerio extractor not yet implemented");
      default:
        throw new Error(`Unknown extractor type: ${type}`);
    }
  }

  /**
   * Create a transformer instance
   */
  createTransformer(type: "cheerio" | "jsdom"): Transformer {
    switch (type) {
      case "cheerio": {
        return createHtmlTransformer();
      }
      case "jsdom":
        throw new Error("JSDOM transformer not yet implemented");
      default:
        throw new Error(`Unknown transformer type: ${type}`);
    }
  }

  /**
   * Create a loader instance
   */
  createLoader(type: "file" | "digitalocean-spaces" | "aws-s3" | "database"): Loader {
    switch (type) {
      case "file":
      case "digitalocean-spaces":
      case "aws-s3":
      case "database": {
        return createPipelineLoader();
      }
      default:
        throw new Error(`Unknown loader type: ${type}`);
    }
  }
}

/**
 * Default pipeline configuration factory
 */
export class DefaultPipelineConfig {
  /**
   * Create test configuration for development
   */
  test(url?: string): PipelineConfig {
    return {
      extractor: {
        url: url ?? "https://example.com",
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
            content: { type: "string" },
          },
          required: ["title"],
        }),
        fieldMappings: {
          title: { selector: "h1", attribute: "text" },
          content: { selector: "body", attribute: "text" },
        },
      },
      loader: {
        target: "console",
        targetConfig: {
          type: "console",
          format: "table",
        } as ConsoleTargetConfig,
      },
    };
  }

  /**
   * Create basic configuration for any URL
   */
  basic(options: {
    url: string;
    schema: string;
    fieldMappings: Record<
      string,
      {
        selector: string;
        attribute?: string;
        transformer?: string;
        required?: boolean;
      }
    >;
  }): PipelineConfig {
    return {
      extractor: {
        url: options.url,
        navigationSteps: [],
        browserConfig: {
          headless: true,
          viewport: { width: 1280, height: 720 },
        },
        timeout: 30000,
      },
      transformer: {
        type: "item",
        schema: options.schema,
        fieldMappings: Object.fromEntries(
          Object.entries(options.fieldMappings).map(([key, mapping]) => [
            key,
            {
              selector: mapping.selector,
              attribute: mapping.attribute as ElementAttribute,
              transformer: mapping.transformer as FieldTransformer,
              ...(mapping.required !== undefined && { required: mapping.required }),
            },
          ])
        ),
      },
      loader: {
        target: "console",
        targetConfig: {
          type: "console",
          format: "table",
        } as ConsoleTargetConfig,
      },
    };
  }

  /**
   * Create event scraping configuration
   */
  events(options: {
    url: string;
    containerSelector: string;
    titleSelector: string;
    urlSelector?: string;
    descriptionSelector?: string;
    dateSelector?: string;
    locationSelector?: string;
    imageSelector?: string;
    categorySelector?: string;
  }): PipelineConfig {
    const fieldMappings: Record<string, FieldMapping> = {
      title: { selector: options.titleSelector, attribute: "text", required: true },
    };

    if (options.urlSelector) {
      fieldMappings.url = { selector: options.urlSelector, attribute: "href" };
    }
    if (options.descriptionSelector) {
      fieldMappings.description = { selector: options.descriptionSelector, attribute: "text" };
    }
    if (options.dateSelector) {
      fieldMappings.date = {
        selector: options.dateSelector,
        attribute: "text",
        transformer: "date",
      };
    }
    if (options.locationSelector) {
      fieldMappings.location = { selector: options.locationSelector, attribute: "text" };
    }
    if (options.imageSelector) {
      fieldMappings.image = { selector: options.imageSelector, attribute: "src" };
    }
    if (options.categorySelector) {
      fieldMappings.category = { selector: options.categorySelector, attribute: "text" };
    }

    return {
      extractor: {
        url: options.url,
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
              url: { type: "string" },
              description: { type: "string" },
              date: { type: "string" },
              location: { type: "string" },
              image: { type: "string" },
              category: { type: "string" },
            },
            required: ["title"],
          },
        }),
        fieldMappings,
        listConfig: {
          containerSelector: options.containerSelector,
          itemSelector: options.titleSelector, // Use title selector as item selector
        },
      },
      loader: {
        target: "file",
        targetConfig: {
          type: "file",
          path: "./output/events.json",
          format: "json",
        } as FileTargetConfig,
      },
    };
  }
}

/**
 * Pipeline builder for fluent configuration
 */
export class PipelineBuilder {
  private extractorConfig?: Extractor;
  private transformerConfig?: Transformer;
  private loaderConfig?: Loader;
  private monitor?: PipelineMonitor;
  private options?: PipelineOrchestratorOptions;

  /**
   * Set extractor configuration
   */
  withExtractor(config: Extractor): PipelineBuilder {
    this.extractorConfig = config;
    return this;
  }

  /**
   * Set transformer configuration
   */
  withTransformer(config: Transformer): PipelineBuilder {
    this.transformerConfig = config;
    return this;
  }

  /**
   * Set loader configuration
   */
  withLoader(config: Loader): PipelineBuilder {
    this.loaderConfig = config;
    return this;
  }

  /**
   * Add monitoring
   */
  withMonitoring(monitor: PipelineMonitor): PipelineBuilder {
    this.monitor = monitor;
    return this;
  }

  /**
   * Set options
   */
  withOptions(options: PipelineOrchestratorOptions): PipelineBuilder {
    this.options = options;
    return this;
  }

  /**
   * Build the pipeline
   */
  build(): PipelineOrchestrator {
    const factory = new PipelineFactory();

    const config: PipelineOrchestratorConfig = {
      extractor: this.extractorConfig ?? factory.createExtractor("playwright"),
      transformer: this.transformerConfig ?? factory.createTransformer("cheerio"),
      loader: this.loaderConfig ?? factory.createLoader("file"),
      ...(this.options && { options: this.options }),
    };

    return new PipelineOrchestrator(config);
  }
}

/**
 * Pipeline event types for monitoring and debugging
 */
export type PipelineEvent =
  | "pipeline:started"
  | "pipeline:completed"
  | "pipeline:failed"
  | "stage:started"
  | "stage:completed"
  | "stage:failed"
  | "stage:retry";

/**
 * Pipeline event data
 */
export interface PipelineEventData {
  readonly event: PipelineEvent;
  readonly timestamp: number;
  readonly correlationId: string;
  readonly stage?: PipelineStage;
  readonly data?: Record<string, unknown>;
  readonly error?: PipelineError;
}

/**
 * Pipeline event listener
 */
export type PipelineEventListener = (_event: PipelineEventData) => void | Promise<void>;

/**
 * Pipeline monitoring interface
 */
export interface PipelineMonitor {
  /**
   * Subscribe to pipeline events
   */
  on(_event: PipelineEvent, _listener: PipelineEventListener): void;

  /**
   * Unsubscribe from pipeline events
   */
  off(_event: PipelineEvent, _listener: PipelineEventListener): void;

  /**
   * Emit a pipeline event
   */
  emit(_event: PipelineEvent, _data: Omit<PipelineEventData, "event" | "timestamp">): void;

  /**
   * Get pipeline metrics
   */
  getMetrics(): PipelineMetrics;

  /**
   * Reset metrics
   */
  resetMetrics(): void;
}

/**
 * Pipeline metrics for monitoring
 */
export interface PipelineMetrics {
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly averageExecutionTime: number;
  readonly errorsByStage: Record<PipelineStage, number>;
  readonly errorsByCode: Record<string, number>;
}

/**
 * Simple pipeline monitor implementation
 */
export class SimplePipelineMonitor implements PipelineMonitor {
  private readonly listeners: Map<PipelineEvent, PipelineEventListener[]> = new Map();
  private metrics: PipelineMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    errorsByStage: {
      extractor: 0,
      transformer: 0,
      loader: 0,
    },
    errorsByCode: {},
  };

  on(event: PipelineEvent, listener: PipelineEventListener): void {
    const eventListeners = this.listeners.get(event) ?? [];
    eventListeners.push(listener);
    this.listeners.set(event, eventListeners);
  }

  off(event: PipelineEvent, listener: PipelineEventListener): void {
    const eventListeners = this.listeners.get(event) ?? [];
    const index = eventListeners.indexOf(listener);
    if (index >= 0) {
      eventListeners.splice(index, 1);
      this.listeners.set(event, eventListeners);
    }
  }

  emit(event: PipelineEvent, data: Omit<PipelineEventData, "event" | "timestamp">): void {
    const eventData: PipelineEventData = {
      event,
      timestamp: Date.now(),
      ...data,
    };

    const listeners = this.listeners.get(event) ?? [];
    for (const listener of listeners) {
      try {
        void listener(eventData);
      } catch (error) {
        logger.warn("Pipeline event listener error", { error, event });
      }
    }

    // Update metrics
    this.updateMetrics(eventData);
  }

  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      errorsByStage: {
        extractor: 0,
        transformer: 0,
        loader: 0,
      },
      errorsByCode: {},
    };
  }

  private updateMetrics(eventData: PipelineEventData): void {
    // Implementation would update metrics based on events
    // This is a simplified version for the basic implementation
  }
}

// Factory instances for convenience
export const pipelineFactory = new PipelineFactory();
export const defaultPipelineConfig = new DefaultPipelineConfig();

/**
 * Create a new pipeline builder
 */
export function createPipelineBuilder(): PipelineBuilder {
  return new PipelineBuilder();
}

/**
 * Create a simple pipeline monitor
 */
export function createPipelineMonitor(): PipelineMonitor {
  return new SimplePipelineMonitor();
}
