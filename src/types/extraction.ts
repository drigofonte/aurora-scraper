/**
 * Raw data extracted from a DOM element before any transformation
 */
export interface RawEventData {
  [key: string]: string | null | undefined;
}

/**
 * Configuration for field extraction
 */
export interface FieldExtractionConfig {
  selector: string;
  attribute?: string; // If not provided, uses textContent
  required?: boolean;
  transform?: (value: string) => string;
}

/**
 * Mapping configuration for extracting fields from DOM elements
 */
export interface ExtractionFieldMap {
  [fieldName: string]: FieldExtractionConfig;
}

/**
 * Base interface for data extractors
 */
export interface DataExtractor<TRaw = RawEventData> {
  /**
   * Extracts raw data from a DOM element
   * @param element - The DOM element to extract data from
   * @returns Raw extracted data
   */
  extract(element: Element): TRaw;
}

/**
 * Base interface for data transformers
 */
export interface DataTransformer<TRaw, TTransformed> {
  /**
   * Transforms raw data into structured data
   * @param rawData - The raw data to transform
   * @returns Transformed structured data
   */
  transform(rawData: TRaw): TTransformed;
}

/**
 * Base interface for data validators
 */
export interface DataValidator<T> {
  /**
   * Validates if the data meets quality requirements
   * @param data - The data to validate
   * @returns True if data is valid
   */
  validate(data: T): boolean;

  /**
   * Returns validation errors if any
   * @param data - The data to validate
   * @returns Array of validation error messages
   */
  getValidationErrors?(data: T): string[];
}

/**
 * Processing pipeline for extraction, transformation, and validation
 */
export interface DataProcessor<TRaw, TTransformed> {
  extractor: DataExtractor<TRaw>;
  transformer: DataTransformer<TRaw, TTransformed>;
  validator: DataValidator<TTransformed>;

  /**
   * Processes a DOM element through the complete pipeline
   * @param element - The DOM element to process
   * @returns Processed data or null if validation fails
   */
  process(element: Element): TTransformed | null;
}
