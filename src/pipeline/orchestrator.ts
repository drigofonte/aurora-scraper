/**
 * Pipeline orchestrator interface and factory
 *
 * This module provides the main entry point for executing ETL pipelines
 * with configurable extractor, transformer, and loader implementations.
 */

import type { Result } from "../utils/result.utils.js";
import type {
  Pipeline,
  PipelineConfig,
  PipelineResult,
  PipelineError,
  Extractor,
  Transformer,
  Loader,
  PipelineStage,
} from "./types.js";

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
export interface PipelineOrchestrator extends Pipeline {
  /**
   * Execute the complete ETL pipeline
   */
  execute(config: PipelineConfig): Promise<Result<PipelineResult, PipelineError>>;

  /**
   * Execute individual pipeline stage (for testing/debugging)
   */
  executeStage<T>(
    stage: PipelineStage,
    input: unknown,
    config: unknown
  ): Promise<Result<T, PipelineError>>;

  /**
   * Validate pipeline configuration
   */
  validateConfig(config: PipelineConfig): Result<void, PipelineError>;

  /**
   * Get pipeline health status
   */
  getHealth(): Promise<PipelineHealthStatus>;
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
 * Pipeline factory interface
 */
export interface PipelineFactory {
  /**
   * Create a pipeline orchestrator with default implementations
   */
  createDefault(): PipelineOrchestrator;

  /**
   * Create a pipeline orchestrator with custom implementations
   */
  create(config: PipelineOrchestratorConfig): PipelineOrchestrator;

  /**
   * Create an extractor instance
   */
  createExtractor(type: "playwright" | "puppeteer" | "cheerio"): Extractor;

  /**
   * Create a transformer instance
   */
  createTransformer(type: "cheerio" | "jsdom"): Transformer;

  /**
   * Create a loader instance
   */
  createLoader(type: "file" | "digitalocean-spaces" | "aws-s3" | "database"): Loader;
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
export type PipelineEventListener = (event: PipelineEventData) => void | Promise<void>;

/**
 * Pipeline monitoring interface
 */
export interface PipelineMonitor {
  /**
   * Subscribe to pipeline events
   */
  on(event: PipelineEvent, listener: PipelineEventListener): void;

  /**
   * Unsubscribe from pipeline events
   */
  off(event: PipelineEvent, listener: PipelineEventListener): void;

  /**
   * Emit a pipeline event
   */
  emit(event: PipelineEvent, data: Omit<PipelineEventData, "event" | "timestamp">): void;

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
 * Default pipeline configuration factory
 */
export interface DefaultPipelineConfig {
  /**
   * Create default configuration for Barcelona events scraper
   */
  barcelonaEvents(): PipelineConfig;

  /**
   * Create default configuration for generic event scraping
   */
  genericEvents(url: string): PipelineConfig;

  /**
   * Create test configuration for development
   */
  test(): PipelineConfig;
}

/**
 * Pipeline builder for fluent configuration
 */
export interface PipelineBuilder {
  /**
   * Set extractor configuration
   */
  withExtractor(config: unknown): PipelineBuilder;

  /**
   * Set transformer configuration
   */
  withTransformer(config: unknown): PipelineBuilder;

  /**
   * Set loader configuration
   */
  withLoader(config: unknown): PipelineBuilder;

  /**
   * Add monitoring
   */
  withMonitoring(monitor: PipelineMonitor): PipelineBuilder;

  /**
   * Set options
   */
  withOptions(options: PipelineOrchestratorOptions): PipelineBuilder;

  /**
   * Build the pipeline
   */
  build(): PipelineOrchestrator;
}
