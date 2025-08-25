/**
 * Schema validator for validating transformed data against JSON schemas
 */

import Ajv, { type ValidateFunction, type ErrorObject } from "ajv";
import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import type { TransformerError } from "../types.js";
import { getLogger } from "../../utils/logger.utils.js";
import { SchemaRegistry } from "../../schemas/index.js";

const logger = getLogger("SchemaValidator");

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
 * Schema validator for transformed data
 */
export class SchemaValidator {
  private readonly schemaRegistry: SchemaRegistry;
  private readonly ajv: Ajv;

  constructor(schemaRegistry?: SchemaRegistry) {
    this.schemaRegistry = schemaRegistry || new SchemaRegistry();
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false, // Allow additional properties by default
    });
  }

  /**
   * Validate a single record against a schema
   */
  validateRecord(
    record: Record<string, unknown>,
    schemaName: string
  ): Result<ValidationResult, TransformerError> {
    try {
      logger.debug("Starting record validation", { schemaName, record });

      const schema = this.schemaRegistry.getSchema(schemaName);
      if (!schema) {
        const error: TransformerError = {
          code: "SCHEMA_VALIDATION_FAILED",
          message: `Schema not found: ${schemaName}`,
          details: { schemaName },
        };
        return err(error);
      }

      // Perform validation
      const isValid = schema(record);
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      if (!isValid && schema.errors) {
        for (const ajvError of schema.errors) {
          const expectedType =
            typeof ajvError.schema === "object" &&
            ajvError.schema !== null &&
            "type" in ajvError.schema
              ? String(ajvError.schema.type)
              : undefined;

          const error: ValidationError = {
            field: ajvError.instancePath || ajvError.schemaPath || "root",
            message: ajvError.message || "Validation failed",
            value: ajvError.data,
            ...(expectedType && { expectedType }),
          };
          errors.push(error);
        }
      }

      const validationResult: ValidationResult = {
        valid: isValid,
        errors,
        warnings,
      };

      logger.debug("Record validation completed", {
        schemaName,
        valid: validationResult.valid,
        errorCount: validationResult.errors.length,
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
    schemaName: string
  ): Result<readonly ValidationResult[], TransformerError> {
    const results: ValidationResult[] = [];
    let hasErrors = false;

    for (const [index, record] of records.entries()) {
      const validationResult = this.validateRecord(record, schemaName);

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
    });

    return ok(results);
  }

  /**
   * Validate and filter records, keeping only valid ones
   */
  validateAndFilter(
    records: readonly Record<string, unknown>[],
    schemaName: string,
    options: {
      readonly allowWarnings?: boolean;
      readonly logErrors?: boolean;
    } = {}
  ): Result<readonly Record<string, unknown>[], TransformerError> {
    const { allowWarnings = true, logErrors = true } = options;
    const validRecords: Record<string, unknown>[] = [];
    let validCount = 0;
    let errorCount = 0;

    for (const [index, record] of records.entries()) {
      const validationResult = this.validateRecord(record, schemaName);

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
