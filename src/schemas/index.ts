/**
 * Schema registry for managing JSON schemas used in data validation
 */

import type { ValidateFunction } from "ajv";

// Schema imports - these would be loaded dynamically in a real implementation
export interface ArticleData {
  readonly title: string;
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
   * Load schemas from file system (placeholder for future implementation)
   */
  async loadSchemasFromDirectory(_directoryPath: string): Promise<void> {
    // TODO: Implement dynamic schema loading from JSON files
    throw new Error("Schema loading from directory not yet implemented");
  }
}

/**
 * Default schema registry instance
 */
export const defaultSchemaRegistry = new SchemaRegistry();

/**
 * Schema type definitions for known schemas
 */
export type SchemaType = "article" | "search-result" | "event" | "generic-item";

/**
 * Schema file paths mapping
 */
export const SCHEMA_PATHS = {
  article: "./article.schema.json",
  "search-result": "./search-result.schema.json",
  event: "./event.schema.json",
  "generic-item": "./generic-item.schema.json",
} as const;
