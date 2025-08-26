/**
 * Core pipeline interfaces for the ETL-based web scraping system
 */

import type { Result } from "../utils/result.utils.js";

// =============================================================================
// PIPELINE ORCHESTRATION
// =============================================================================

/**
 * Main pipeline configuration interface
 */
export interface PipelineConfig {
  readonly extractor: ExtractorConfig;
  readonly transformer: TransformerConfig;
  readonly loader: LoaderConfig;
  readonly metadata?: PipelineMetadataConfig;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  readonly extractedHtml: string;
  readonly transformedData: readonly Record<string, unknown>[];
  readonly loadedTo: string;
  readonly metadata: PipelineExecutionMetadata;
}

/**
 * Pipeline execution metadata
 */
export interface PipelineExecutionMetadata {
  readonly executionTime: number;
  readonly recordsProcessed: number;
  readonly extractorMetrics: ExtractorMetrics;
  readonly transformerMetrics: TransformerMetrics;
  readonly loaderMetrics: LoaderMetrics;
}

/**
 * Pipeline metadata configuration
 */
export interface PipelineMetadataConfig {
  readonly includeHtml?: boolean;
  readonly includeMetrics?: boolean;
  readonly correlationId?: string;
}

// =============================================================================
// EXTRACTOR INTERFACES
// =============================================================================

/**
 * Configuration for the extraction stage
 */
export interface ExtractorConfig {
  readonly url: string;
  readonly navigationSteps: readonly NavigationStep[];
  readonly browserConfig: BrowserConfig;
  readonly timeout: number;
  readonly retries?: RetryConfig;
}

/**
 * Browser configuration for extraction
 */
export interface BrowserConfig {
  readonly headless: boolean;
  readonly viewport: {
    readonly width: number;
    readonly height: number;
  };
  readonly args?: readonly string[];
  readonly userAgent?: string;
  readonly locale?: string;
}

/**
 * Navigation step definition
 */
export interface NavigationStep {
  readonly type: NavigationStepType;
  readonly selector?: string;
  readonly value?: string;
  readonly timeout?: number;
  readonly maxAttempts?: number;
  readonly waitCondition?: WaitCondition;
  readonly description?: string;
}

/**
 * Types of navigation steps supported
 */
export type NavigationStepType =
  | "click"
  | "wait"
  | "scroll"
  | "fill"
  | "hover"
  | "select"
  | "navigate"
  | "screenshot";

/**
 * Wait conditions for navigation steps
 */
export interface WaitCondition {
  readonly type: "selector" | "network" | "load" | "timeout";
  readonly value?: string | number;
  readonly state?: "attached" | "detached" | "visible" | "hidden";
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  readonly count: number;
  readonly delay: number;
  readonly backoff: "linear" | "exponential";
  readonly maxDelay?: number;
}

/**
 * Extractor execution metrics
 */
export interface ExtractorMetrics {
  readonly navigationSteps: number;
  readonly pageLoadTime: number;
  readonly totalExecutionTime: number;
  readonly retryAttempts: number;
  readonly errors: readonly ExtractorError[];
}

/**
 * Extractor-specific errors
 */
export interface ExtractorError {
  readonly code: ExtractorErrorCode;
  readonly message: string;
  readonly step?: number;
  readonly selector?: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Extractor error codes
 */
export type ExtractorErrorCode =
  | "NAVIGATION_TIMEOUT"
  | "ELEMENT_NOT_FOUND"
  | "BROWSER_LAUNCH_FAILED"
  | "PAGE_LOAD_FAILED"
  | "STEP_EXECUTION_FAILED"
  | "NETWORK_ERROR";

// =============================================================================
// TRANSFORMER INTERFACES
// =============================================================================

/**
 * Configuration for the transformation stage
 */
export interface TransformerConfig {
  readonly type: TransformerType;
  readonly schema?: string;
  readonly fieldMappings: Record<string, FieldMapping>;
  readonly listConfig?: ListTransformerConfig;
  readonly validationRules?: readonly ValidationRule[];
  readonly options?: TransformerOptions;
}

/**
 * Type of transformation (item vs list extraction)
 */
export type TransformerType = "item" | "list";

/**
 * Configuration for list-based transformations
 */
export interface ListTransformerConfig {
  readonly containerSelector: string;
  readonly itemSelector: string;
}

/**
 * Field mapping definition
 */
export interface FieldMapping {
  readonly selector: string;
  readonly attribute?: ElementAttribute;
  readonly transformer?: FieldTransformer;
  readonly required?: boolean;
  readonly defaultValue?: unknown;
  readonly multiple?: boolean;
}

/**
 * HTML element attributes that can be extracted
 */
export type ElementAttribute =
  | "text"
  | "innerText"
  | "innerHTML"
  | "href"
  | "src"
  | "title"
  | "alt"
  | "value"
  | "data-*"
  | string; // Allow any string for custom attributes

/**
 * Built-in field transformers
 */
export type FieldTransformer =
  | "date"
  | "price"
  | "url"
  | "html-to-text"
  | "trim"
  | "lowercase"
  | "uppercase"
  | "number"
  | "boolean";

/**
 * Validation rule definition
 */
export interface ValidationRule {
  readonly field: string;
  readonly rule: ValidationRuleType;
  readonly value?: unknown;
  readonly message?: string;
}

/**
 * Types of validation rules
 */
export type ValidationRuleType =
  | "required"
  | "minLength"
  | "maxLength"
  | "pattern"
  | "enum"
  | "date"
  | "url"
  | "email";

/**
 * Transformer options
 */
export interface TransformerOptions {
  readonly strictValidation?: boolean;
  readonly allowAdditionalFields?: boolean;
  readonly dateFormat?: string;
  readonly currencyCode?: string;
  readonly locale?: string;
}

/**
 * Transformer execution metrics
 */
export interface TransformerMetrics {
  readonly recordsProcessed: number;
  readonly validationErrors: number;
  readonly fieldExtractionTime: number;
  readonly validationTime: number;
  readonly totalExecutionTime: number;
  readonly errors: readonly TransformerError[];
}

/**
 * Transformer-specific errors
 */
export interface TransformerError {
  readonly code: TransformerErrorCode;
  readonly message: string;
  readonly field?: string;
  readonly record?: number;
  readonly details?: Record<string, unknown>;
}

/**
 * Transformer error codes
 */
export type TransformerErrorCode =
  | "INVALID_HTML"
  | "SCHEMA_VALIDATION_FAILED"
  | "FIELD_EXTRACTION_FAILED"
  | "SELECTOR_NOT_FOUND"
  | "CONTAINER_NOT_FOUND"
  | "TRANSFORMATION_FAILED"
  | "REQUIRED_FIELD_MISSING";

// =============================================================================
// LOADER INTERFACES
// =============================================================================

/**
 * Configuration for the loading stage
 */
export interface LoaderConfig {
  readonly target: LoaderTarget;
  readonly targetConfig: TargetConfig;
  readonly options?: LoaderOptions;
}

/**
 * Supported loader targets
 */
export type LoaderTarget =
  | "file"
  | "digitalocean-spaces"
  | "aws-s3"
  | "database"
  | "webhook"
  | "console";

/**
 * Base target configuration
 */
export interface TargetConfig {
  readonly type: LoaderTarget;
}

/**
 * File system target configuration
 */
export interface FileTargetConfig extends TargetConfig {
  readonly type: "file";
  readonly path: string;
  readonly format: "json" | "csv" | "yaml";
  readonly encoding?: string;
  readonly createDirectory?: boolean;
}

/**
 * DigitalOcean Spaces target configuration
 */
export interface SpacesTargetConfig extends TargetConfig {
  readonly type: "digitalocean-spaces";
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly key: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly acl?: string;
}

/**
 * AWS S3 target configuration
 */
export interface S3TargetConfig extends TargetConfig {
  readonly type: "aws-s3";
  readonly bucket: string;
  readonly key: string;
  readonly region: string;
  readonly accessKeyId?: string;
  readonly secretAccessKey?: string;
  readonly sessionToken?: string;
}

/**
 * Database target configuration
 */
export interface DatabaseTargetConfig extends TargetConfig {
  readonly type: "database";
  readonly connectionString: string;
  readonly table: string;
  readonly schema?: string;
  readonly upsert?: boolean;
}

/**
 * Webhook target configuration
 */
export interface WebhookTargetConfig extends TargetConfig {
  readonly type: "webhook";
  readonly url: string;
  readonly method: "POST" | "PUT" | "PATCH";
  readonly headers?: Record<string, string>;
  readonly timeout?: number;
}

/**
 * Console target configuration (for testing)
 */
export interface ConsoleTargetConfig extends TargetConfig {
  readonly type: "console";
  readonly format?: "json" | "table" | "yaml";
  readonly pretty?: boolean;
}

/**
 * Loader options
 */
export interface LoaderOptions {
  readonly batchSize?: number;
  readonly timeout?: number;
  readonly retries?: RetryConfig;
  readonly compression?: "gzip" | "deflate";
  readonly metadata?: Record<string, unknown>;
}

/**
 * Loader execution metrics
 */
export interface LoaderMetrics {
  readonly recordsLoaded: number;
  readonly uploadTime: number;
  readonly fileSize?: number;
  readonly retryAttempts: number;
  readonly totalExecutionTime: number;
  readonly errors: readonly LoaderError[];
}

/**
 * Loader-specific errors
 */
export interface LoaderError {
  readonly code: LoaderErrorCode;
  readonly message: string;
  readonly target?: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Loader error codes
 */
export type LoaderErrorCode =
  | "TARGET_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "INVALID_CREDENTIALS"
  | "UPLOAD_FAILED"
  | "INVALID_FORMAT"
  | "QUOTA_EXCEEDED"
  | "CONNECTION_FAILED";

// =============================================================================
// PIPELINE INTERFACES
// =============================================================================

/**
 * Main pipeline interface
 */
export interface Pipeline {
  execute(_config: PipelineConfig): Promise<Result<PipelineResult, PipelineError>>;
}

/**
 * Extractor interface
 */
export interface Extractor {
  extract(_config: ExtractorConfig): Promise<Result<string, ExtractorError>>;
}

/**
 * Transformer interface
 */
export interface Transformer {
  transform(
    _html: string,
    _config: TransformerConfig
  ): Promise<Result<readonly Record<string, unknown>[], TransformerError>>;
}

/**
 * Loader interface
 */
export interface Loader {
  load(
    _data: readonly Record<string, unknown>[],
    _config: LoaderConfig
  ): Promise<Result<string, LoaderError>>;
}

/**
 * Pipeline error union type
 */
export type PipelineError = ExtractorError | TransformerError | LoaderError;

/**
 * Pipeline stage identifier
 */
export type PipelineStage = "extractor" | "transformer" | "loader";
