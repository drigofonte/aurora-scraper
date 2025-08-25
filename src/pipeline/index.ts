/**
 * ETL Pipeline module exports
 *
 * This module provides a complete ETL-based web scraping pipeline
 * with configurable extraction, transformation, and loading components.
 */

// Core pipeline interfaces and types
export type {
  // Pipeline orchestration
  Pipeline,
  PipelineConfig,
  PipelineResult,
  PipelineError,
  PipelineExecutionMetadata,
  PipelineMetadataConfig,
  PipelineStage,

  // Extractor types
  Extractor,
  ExtractorConfig,
  ExtractorMetrics,
  ExtractorError,
  ExtractorErrorCode,
  BrowserConfig,
  NavigationStep,
  NavigationStepType,
  WaitCondition,
  RetryConfig,

  // Transformer types
  Transformer,
  TransformerConfig,
  TransformerMetrics,
  TransformerError,
  TransformerErrorCode,
  FieldMapping,
  ElementAttribute,
  FieldTransformer,
  ValidationRule,
  ValidationRuleType,
  TransformerOptions,

  // Loader types
  Loader,
  LoaderConfig,
  LoaderMetrics,
  LoaderError,
  LoaderErrorCode,
  LoaderTarget,
  TargetConfig,
  FileTargetConfig,
  SpacesTargetConfig,
  S3TargetConfig,
  DatabaseTargetConfig,
  WebhookTargetConfig,
  ConsoleTargetConfig,
  LoaderOptions,
} from "./types.js";

// Loader implementation exports
export {
  LoadTarget,
  LoadConfig,
  LoadResult,
  FileLoader,
  ConsoleLoader,
  DatabaseLoader,
  ApiLoader,
  DataLoader,
} from "./loader/index.js";

// Orchestrator implementation exports
export {
  PipelineOrchestrator,
  PipelineFactory,
  DefaultPipelineConfig,
  SimplePipelineMonitor,
  createPipelineBuilder,
  createPipelineMonitor,
  pipelineFactory,
  defaultPipelineConfig,
} from "./orchestrator.js";

// Pipeline orchestrator interfaces
export type {
  PipelineOrchestratorConfig,
  PipelineOrchestratorOptions,
  PipelineExecutionContext,
  PipelineHealthStatus,
  ComponentHealth,
  PipelineEvent,
  PipelineEventData,
  PipelineEventListener,
  PipelineMonitor,
  PipelineMetrics,
  PipelineBuilder,
} from "./orchestrator.js";

// Configuration factory and base templates
export {
  BASE_EXTRACTOR_CONFIG,
  BASE_TRANSFORMER_CONFIG,
  BASE_LOADER_CONFIG,
  NAVIGATION_STEPS,
  TEST_CONFIG,
  PipelineConfigFactory,
} from "./configs.js";

// Re-export commonly used types for convenience
export type { Result, Ok, Err } from "../utils/result.utils.js";
