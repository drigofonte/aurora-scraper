/**
 * Transformer module exports
 *
 * This module provides the complete transformation pipeline for converting
 * raw HTML into structured, validated data records.
 */

// Core transformer components
export { SelectorEngine } from "./selector-engine.js";
export { FieldTransformerEngine, type FieldTransformationFunction } from "./field-transformer.js";
export {
  SchemaValidator,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from "./schema-validator.js";
export { HtmlTransformer, type TransformationContext } from "./html-transformer.js";

// Re-export related types from pipeline types
export type {
  TransformerConfig,
  TransformerType,
  ListTransformerConfig,
  FieldMapping,
  ElementAttribute,
  FieldTransformer,
  TransformerOptions,
  TransformerMetrics,
  TransformerError,
  TransformerErrorCode,
} from "../types.js";
