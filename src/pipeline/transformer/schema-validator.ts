/**
 * Schema validator for validating transformed data against JSON schemas
 */

import Ajv from "ajv";
import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import type { TransformerError } from "../types.js";
import { getLogger } from "../../utils/logger.utils.js";
import { SchemaRegistry } from "../../schemas/index.js";

const logger = getLogger("SchemaValidator");

/**
 * Safe structured clone utility that works across Node.js versions
 */
const safeStructuredClone = <T>(obj: T): T => {
  // Use native structuredClone if available (Node.js 17+)
  if (typeof globalThis !== "undefined" && "structuredClone" in globalThis) {
    const globalWithStructuredClone = globalThis as unknown as {
      structuredClone: <U>(_value: U) => U;
    };
    return globalWithStructuredClone.structuredClone(obj);
  }
  // Fallback to JSON parse/stringify for basic cloning
  return JSON.parse(JSON.stringify(obj)) as T;
};

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value: unknown;
  readonly expectedType?: string;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly value: unknown;
}

/**
 * Validation options for customizing validation behavior
 */
export interface ValidationOptions {
  readonly strict?: boolean; // Throw error on additional properties
  readonly allowWarnings?: boolean; // Allow records with warnings to pass
  readonly logErrors?: boolean; // Log validation errors
  readonly removeAdditional?: boolean; // Remove additional properties from valid records
}

/**
 * Schema validator for transformed data
 */
export class SchemaValidator {
  private readonly schemaRegistry: SchemaRegistry;
  private readonly ajv: Ajv;
  private readonly strictAjv: Ajv;

  constructor(schemaRegistry?: SchemaRegistry) {
    this.schemaRegistry = schemaRegistry || new SchemaRegistry();

    // Default AJV instance (lenient)
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      removeAdditional: false,
    });

    // Strict AJV instance for strict validation
    this.strictAjv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: true,
      removeAdditional: "all", // Remove additional properties
      addUsedSchema: false, // Prevent schema id conflicts
    });
  }

  /**
   * Process AJV validation errors and categorize them
   */
  private processValidationErrors(
    ajvErrors: NonNullable<ReturnType<typeof this.ajv.compile>["errors"]>,
    strict: boolean
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const ajvError of ajvErrors) {
      const expectedType =
        typeof ajvError.schema === "object" && ajvError.schema !== null && "type" in ajvError.schema
          ? String(ajvError.schema.type)
          : undefined;

      const field = ajvError.instancePath || ajvError.schemaPath || "root";
      const message = ajvError.message || "Validation failed";

      const errorDetails: ValidationError = {
        field,
        message,
        value: ajvError.data,
        ...(expectedType && { expectedType }),
      };

      // In strict mode, any validation error is treated as an error
      // In non-strict mode, additional properties could be warnings
      if (strict || !message.includes("additionalProperties")) {
        errors.push(errorDetails);
      } else {
        // Convert additional properties to warnings in non-strict mode
        const warning: ValidationWarning = {
          field,
          message,
          value: ajvError.data,
        };
        warnings.push(warning);
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate a single record against a schema
   */
  validateRecord(
    record: Record<string, unknown>,
    schemaName: string,
    options: ValidationOptions = {}
  ): Result<ValidationResult, TransformerError> {
    try {
      const { strict = false } = options;
      logger.debug("Starting record validation", { schemaName, record, strict });

      const schema = this.schemaRegistry.getSchema(schemaName);
      if (!schema) {
        const error: TransformerError = {
          code: "SCHEMA_VALIDATION_FAILED",
          message: `Schema not found: ${schemaName}`,
          details: { schemaName },
        };
        return err(error);
      }

      // Clone record for validation
      const recordToValidate = safeStructuredClone(record);

      // Perform validation
      const isValid = schema(recordToValidate);
      let errors: ValidationError[] = [];
      let warnings: ValidationWarning[] = [];

      // Process validation errors if any
      if (!isValid && schema.errors) {
        const processedErrors = this.processValidationErrors(schema.errors, strict);
        errors = processedErrors.errors;
        warnings = processedErrors.warnings;
      }

      const validationResult: ValidationResult = {
        valid: isValid && errors.length === 0, // Invalid if there are any errors
        errors,
        warnings,
      };

      logger.debug("Record validation completed", {
        schemaName,
        valid: validationResult.valid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
        strict,
      });

      return ok(validationResult);
    } catch (error) {
      const transformerError: TransformerError = {
        code: "SCHEMA_VALIDATION_FAILED",
        message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { schemaName, record, error },
      };
      return err(transformerError);
    }
  }

  /**
   * Validate multiple records against a schema
   */
  validateRecords(
    records: readonly Record<string, unknown>[],
    schemaName: string,
    options: ValidationOptions = {}
  ): Result<readonly ValidationResult[], TransformerError> {
    const results: ValidationResult[] = [];
    let hasErrors = false;

    for (const [index, record] of records.entries()) {
      const validationResult = this.validateRecord(record, schemaName, options);

      if (validationResult.isErr) {
        const error: TransformerError = {
          code: "SCHEMA_VALIDATION_FAILED",
          message: `Validation failed for record ${index}: ${validationResult.error.message}`,
          details: { index, record, originalError: validationResult.error },
        };
        return err(error);
      }

      results.push(validationResult.value);
      if (!validationResult.value.valid) {
        hasErrors = true;
      }
    }

    logger.debug("Batch validation completed", {
      schemaName,
      recordCount: records.length,
      hasErrors,
      strict: options.strict,
    });

    return ok(results);
  }

  /**
   * Validate and filter records, keeping only valid ones
   */
  validateAndFilter(
    records: readonly Record<string, unknown>[],
    schemaName: string,
    options: ValidationOptions = {}
  ): Result<readonly Record<string, unknown>[], TransformerError> {
    const { allowWarnings = true, logErrors = true, strict = false } = options;
    const validRecords: Record<string, unknown>[] = [];
    let validCount = 0;
    let errorCount = 0;

    for (const [index, record] of records.entries()) {
      const validationResult = this.validateRecord(record, schemaName, { strict });

      if (validationResult.isErr) {
        errorCount++;
        if (logErrors) {
          logger.warn(`Record ${index} validation failed`, { error: validationResult.error });
        }
        continue;
      }

      const result = validationResult.value;

      if (result.valid || (allowWarnings && result.errors.length === 0)) {
        validRecords.push(record);
        validCount++;
      } else {
        errorCount++;
        if (logErrors) {
          logger.warn(`Record ${index} failed validation`, {
            errors: result.errors,
            warnings: result.warnings,
            strict,
          });
        }
      }
    }

    logger.info("Validation filtering completed", {
      schemaName,
      totalRecords: records.length,
      validRecords: validCount,
      errorCount,
      filterRate: ((validCount / records.length) * 100).toFixed(2) + "%",
    });

    return ok(validRecords);
  }

  /**
   * Get validation statistics for a batch of records
   */
  getValidationStats(validationResults: readonly ValidationResult[]): {
    readonly total: number;
    readonly valid: number;
    readonly invalid: number;
    readonly withWarnings: number;
    readonly validationRate: number;
  } {
    const total = validationResults.length;
    const valid = validationResults.filter((r) => r.valid).length;
    const invalid = total - valid;
    const withWarnings = validationResults.filter((r) => r.warnings.length > 0).length;
    const validationRate = total > 0 ? (valid / total) * 100 : 0;

    return {
      total,
      valid,
      invalid,
      withWarnings,
      validationRate: Math.round(validationRate * 100) / 100,
    };
  }

  /**
   * Register a new schema with the validator
   */
  registerSchema(name: string, schema: object): Result<void, TransformerError> {
    try {
      // Compile the schema with AJV
      const validateFunction = this.ajv.compile(schema);

      // Register with the schema registry
      this.schemaRegistry.registerSchema(name, validateFunction);

      logger.debug(`Schema registered successfully: ${name}`);
      return ok(undefined);
    } catch (error) {
      const transformerError: TransformerError = {
        code: "SCHEMA_VALIDATION_FAILED",
        message: `Schema registration failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { name, schema, error },
      };
      return err(transformerError);
    }
  }

  /**
   * Get list of available schemas
   */
  getAvailableSchemas(): readonly string[] {
    return this.schemaRegistry.getSchemaNames();
  }
}
