/**
 * Schema Registry for ETL Pipeline Data Validation
 *
 * This module provides JSON Schema validation for extracted data, ensuring data quality
 * and consistency across the ETL pipeline. It automatically loads schemas from the
 * schemas directory and provides runtime validation.
 *
 * @example
 * ```typescript
 * // Auto-load schemas from directory
 * const registry = await initializeSchemas();
 *
 * // Validate data against a schema
 * const isValid = registry.validateData(extractedData, 'article');
 * ```
 */

import type { ValidateFunction } from "ajv";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { promises as fs } from "fs";
import { join, basename, extname } from "path";
import { getLogger } from "../utils/logger.utils.js";

const logger = getLogger("SchemaRegistry");

/**
 * TypeScript interfaces for example schemas.
 * These correspond to the JSON schema files in this directory.
 */

/** Article/blog post data structure - matches article.schema.json */
export interface ArticleData {
  readonly title: string;
  readonly author?: string;
  readonly publishedDate?: string;
  readonly content?: string;
  readonly metadata?: string;
  readonly sourceUrl?: string;
  readonly imageUrl?: string;
  readonly category?: string;
  readonly readingTime?: string;
}

export interface SearchResultData {
  readonly title: string;
  readonly metadata?: string;
  readonly sourceUrl?: string;
  readonly content?: string;
  readonly category?: string;
}

export interface EventData {
  readonly title: string;
  readonly publishedDate?: string;
  readonly eventDate?: string;
  readonly location?: string;
  readonly content?: string;
  readonly sourceUrl?: string;
  readonly imageUrl?: string;
  readonly category?: string;
  readonly price?: {
    readonly amount: number;
    readonly currency: string;
  };
}

export interface GenericItemData {
  readonly title: string;
  readonly publishedDate?: string;
  readonly content?: string;
  readonly metadata?: string;
  readonly sourceUrl?: string;
  readonly imageUrl?: string;
  readonly category?: string;
  readonly numericValue?: {
    readonly amount: number;
    readonly unit: string;
  };
}

/**
 * Schema registry for managing available schemas
 */
export class SchemaRegistry {
  private readonly schemas = new Map<string, ValidateFunction>();

  /**
   * Register a schema with the registry
   */
  registerSchema(name: string, validateFunction: ValidateFunction): void {
    this.schemas.set(name, validateFunction);
  }

  /**
   * Get a schema validator by name
   */
  getSchema(name: string): ValidateFunction | undefined {
    return this.schemas.get(name);
  }

  /**
   * Check if a schema exists
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * Get all registered schema names
   */
  getSchemaNames(): readonly string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Load schemas from file system
   */
  async loadSchemasFromDirectory(directoryPath: string): Promise<void> {
    try {
      logger.info("Loading schemas from directory", { directoryPath });

      // Create AJV instance for compiling schemas
      const ajv = new Ajv({
        allErrors: true,
        strict: false,
        validateSchema: false, // Disable meta-schema validation to avoid draft issues
      });

      // Add format support for date-time, uri, etc.
      addFormats(ajv);

      // Read all files in the directory
      const files = await fs.readdir(directoryPath);
      const schemaFiles = files.filter(
        (file) => extname(file) === ".json" && file.includes("schema")
      );

      logger.debug("Found schema files", { files: schemaFiles });

      for (const file of schemaFiles) {
        try {
          const filePath = join(directoryPath, file);
          const schemaContent = await fs.readFile(filePath, "utf-8");
          const schema = JSON.parse(schemaContent);

          // Extract schema name from filename (e.g., "article.schema.json" -> "article")
          const schemaName = basename(file, ".schema.json");

          // Compile the schema
          const validateFunction = ajv.compile(schema);

          // Register the compiled schema
          this.registerSchema(schemaName, validateFunction);

          logger.debug("Loaded schema", {
            schemaName,
            filePath,
            title: schema.title,
          });
        } catch (error) {
          logger.error("Failed to load schema file", error as Error, { file });
          // Continue loading other schemas even if one fails
        }
      }

      const loadedCount = this.getSchemaNames().length;
      logger.info("Schema loading completed", {
        directoryPath,
        loadedCount,
        schemaNames: this.getSchemaNames(),
      });
    } catch (error) {
      logger.error("Failed to load schemas from directory", error as Error, { directoryPath });
      throw new Error(
        `Schema loading failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Default schema registry instance
 */
export const defaultSchemaRegistry = new SchemaRegistry();

/**
 * Initialize schemas by loading them from the default directory
 */
export async function initializeSchemas(
  schemaRegistry: SchemaRegistry = defaultSchemaRegistry
): Promise<void> {
  try {
    // Get the schema directory path relative to this file
    const schemaDirectory = new URL(".", import.meta.url).pathname;
    await schemaRegistry.loadSchemasFromDirectory(schemaDirectory);
    logger.info("Default schemas initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize default schemas", error as Error);
    throw error;
  }
}

/**
 * Initialize schemas by loading them from a custom directory
 */
export async function initializeSchemasFromDirectory(
  schemaDirectory: string,
  schemaRegistry: SchemaRegistry = defaultSchemaRegistry
): Promise<void> {
  try {
    await schemaRegistry.loadSchemasFromDirectory(schemaDirectory);
    logger.info("Custom schemas initialized successfully", { schemaDirectory });
  } catch (error) {
    logger.error("Failed to initialize custom schemas", error as Error, { schemaDirectory });
    throw error;
  }
}

/**
 * Common schema types that examples might use
 * Note: Actual schemas now live in example directories (docs/examples/star/schemas/)
 */
export type SchemaType = string; // Generic string type since schemas are now dynamic
