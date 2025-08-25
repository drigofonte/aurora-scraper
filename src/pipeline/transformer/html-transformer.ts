/**
 * HTML transformer for converting raw HTML into structured data
 */

import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import type {
  TransformerConfig,
  TransformerError,
  TransformerMetrics,
  FieldMapping,
} from "../types.js";
import { getLogger } from "../../utils/logger.utils.js";
import { SelectorEngine } from "./selector-engine.js";
import { FieldTransformerEngine } from "./field-transformer.js";
import { SchemaValidator } from "./schema-validator.js";

const logger = getLogger("HtmlTransformer");

/**
 * Transformation context for tracking execution state
 */
export interface TransformationContext {
  readonly startTime: number;
  readonly url?: string;
  readonly correlationId?: string;
}

/**
 * Main HTML transformer class that orchestrates the transformation pipeline
 */
export class HtmlTransformer {
  private readonly selectorEngine: SelectorEngine;
  private readonly fieldTransformer: FieldTransformerEngine;
  private readonly schemaValidator: SchemaValidator;

  constructor(
    selectorEngine?: SelectorEngine,
    fieldTransformer?: FieldTransformerEngine,
    schemaValidator?: SchemaValidator
  ) {
    this.selectorEngine = selectorEngine || new SelectorEngine();
    this.fieldTransformer = fieldTransformer || new FieldTransformerEngine();
    this.schemaValidator = schemaValidator || new SchemaValidator();
  }

  /**
   * Transform HTML content into structured data
   */
  async transform(
    html: string,
    config: TransformerConfig,
    context?: TransformationContext
  ): Promise<Result<readonly Record<string, unknown>[], TransformerError>> {
    const ctx = context || { startTime: Date.now() };

    logger.info("Starting HTML transformation", {
      configType: config.type,
      htmlLength: html.length,
      correlationId: ctx.correlationId,
    });

    try {
      // Load HTML into selector engine
      const loadResult = this.selectorEngine.loadHtml(html);
      if (loadResult.isErr) {
        return err(loadResult.error);
      }

      // Extract data based on configuration type
      let extractionResult: Result<readonly Record<string, unknown>[], TransformerError>;

      if (config.type === "item") {
        extractionResult = await this.extractSingleItem(config.fieldMappings);
      } else if (config.type === "list") {
        if (!config.listConfig) {
          const error: TransformerError = {
            code: "TRANSFORMATION_FAILED",
            message: "List configuration required for list extraction",
            details: { config },
          };
          return err(error);
        }
        extractionResult = await this.extractListItems(
          config.listConfig.containerSelector,
          config.listConfig.itemSelector,
          config.fieldMappings
        );
      } else {
        const error: TransformerError = {
          code: "TRANSFORMATION_FAILED",
          message: `Unknown configuration type: ${config.type}`,
          details: { config },
        };
        return err(error);
      }

      if (extractionResult.isErr) {
        return err(extractionResult.error);
      }

      // Transform extracted data
      const transformationResult = await this.transformRecords(
        extractionResult.value,
        config.fieldMappings
      );

      if (transformationResult.isErr) {
        return err(transformationResult.error);
      }

      // Validate against schema if specified
      let finalRecords = transformationResult.value;
      if (config.schema) {
        const validationResult = await this.validateRecords(finalRecords, config.schema);

        if (validationResult.isErr) {
          return err(validationResult.error);
        }

        finalRecords = validationResult.value;
      }

      const executionTime = Date.now() - ctx.startTime;
      logger.info("HTML transformation completed successfully", {
        recordCount: finalRecords.length,
        executionTime,
        correlationId: ctx.correlationId,
      });

      return ok(finalRecords);
    } catch (error) {
      const transformerError: TransformerError = {
        code: "TRANSFORMATION_FAILED",
        message: `Transformation failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { config, context: ctx, error },
      };
      return err(transformerError);
    }
  }

  /**
   * Get transformation metrics for monitoring
   */
  getMetrics(
    startTime: number,
    endTime: number,
    recordCount: number,
    errors: readonly TransformerError[]
  ): TransformerMetrics {
    const executionTime = endTime - startTime;
    return {
      recordsProcessed: recordCount,
      validationErrors: errors.filter((e) => e.code === "SCHEMA_VALIDATION_FAILED").length,
      fieldExtractionTime: 0, // TODO: Track separately
      validationTime: 0, // TODO: Track separately
      totalExecutionTime: executionTime,
      errors,
    };
  }

  /**
   * Extract data from a single item (non-list extraction)
   */
  private async extractSingleItem(
    fieldMappings: Record<string, FieldMapping>
  ): Promise<Result<readonly Record<string, unknown>[], TransformerError>> {
    // For single item extraction, we extract from the root document
    const extractionResult = this.selectorEngine.extractFromElement(
      null, // Using null to indicate root document extraction
      fieldMappings
    );

    if (extractionResult.isErr) {
      return err(extractionResult.error);
    }

    return ok([extractionResult.value]);
  }

  /**
   * Extract data from multiple items in a list
   */
  private async extractListItems(
    containerSelector: string,
    itemSelector: string,
    fieldMappings: Record<string, FieldMapping>
  ): Promise<Result<readonly Record<string, unknown>[], TransformerError>> {
    const extractionResult = this.selectorEngine.extractFromElements(
      containerSelector,
      itemSelector,
      fieldMappings
    );

    if (extractionResult.isErr) {
      return err(extractionResult.error);
    }

    logger.debug("List extraction completed", {
      containerSelector,
      itemSelector,
      itemCount: extractionResult.value.length,
    });

    return ok(extractionResult.value);
  }

  /**
   * Transform extracted records using field transformations
   */
  private async transformRecords(
    records: readonly Record<string, unknown>[],
    fieldMappings: Record<string, FieldMapping>
  ): Promise<Result<readonly Record<string, unknown>[], TransformerError>> {
    const transformedRecords: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (const [index, record] of records.entries()) {
      const transformResult = this.fieldTransformer.transformRecord(record, fieldMappings);

      if (transformResult.isErr) {
        errors.push(`Record ${index}: ${transformResult.error.message}`);
        continue;
      }

      transformedRecords.push(transformResult.value);
    }

    if (errors.length > 0) {
      logger.warn("Some records failed transformation", {
        errorCount: errors.length,
        successCount: transformedRecords.length,
      });
    }

    logger.debug("Record transformation completed", {
      inputCount: records.length,
      outputCount: transformedRecords.length,
      errorCount: errors.length,
    });

    return ok(transformedRecords);
  }

  /**
   * Validate records against schema and filter invalid ones
   */
  private async validateRecords(
    records: readonly Record<string, unknown>[],
    schemaName: string
  ): Promise<Result<readonly Record<string, unknown>[], TransformerError>> {
    const validationResult = this.schemaValidator.validateAndFilter(records, schemaName, {
      allowWarnings: true,
      logErrors: true,
    });

    if (validationResult.isErr) {
      return err(validationResult.error);
    }

    const validRecords = validationResult.value;
    const validationRate = records.length > 0 ? (validRecords.length / records.length) * 100 : 100;

    logger.debug("Schema validation completed", {
      inputCount: records.length,
      validCount: validRecords.length,
      validationRate: validationRate.toFixed(2) + "%",
      schemaName,
    });

    return ok(validRecords);
  }

  /**
   * Get selector engine instance (for advanced usage)
   */
  getSelectorEngine(): SelectorEngine {
    return this.selectorEngine;
  }

  /**
   * Get field transformer instance (for advanced usage)
   */
  getFieldTransformer(): FieldTransformerEngine {
    return this.fieldTransformer;
  }

  /**
   * Get schema validator instance (for advanced usage)
   */
  getSchemaValidator(): SchemaValidator {
    return this.schemaValidator;
  }
}

/**
 * Factory function to create a new HTML transformer instance
 */
export function createHtmlTransformer(): HtmlTransformer {
  return new HtmlTransformer();
}
