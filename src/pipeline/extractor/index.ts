/**
 * Extractor module exports
 */

// Core extractor components
export { BrowserManager, type BrowserManagerConfig, type BrowserType } from "./browser-manager.js";
export { NavigationEngine, type NavigationContext } from "./navigation-engine.js";
export { WebExtractor, createWebExtractor } from "./web-extractor.js";

// Re-export types from main pipeline types for convenience
export type {
  Extractor,
  ExtractorConfig,
  ExtractorError,
  ExtractorErrorCode,
  ExtractorMetrics,
  BrowserConfig,
  NavigationStep,
  NavigationStepType,
  WaitCondition,
  RetryConfig,
} from "../types.js";
