/**
 * Base error class for scraper-related errors
 */
export abstract class ScraperError extends Error {
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    if (context !== undefined) {
      this.context = context;
    }
    if (cause !== undefined) {
      this.cause = cause;
    }

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when navigation to a page fails
 */
export class NavigationError extends ScraperError {
  public constructor(url: string, cause?: Error) {
    super(`Failed to navigate to URL: ${url}`, { url }, cause);
  }
}

/**
 * Error thrown when a required element is not found
 */
export class ElementNotFoundError extends ScraperError {
  public constructor(selector: string, context?: Record<string, unknown>) {
    super(`Element not found: ${selector}`, { selector, ...context });
  }
}

/**
 * Error thrown when data extraction fails
 */
export class ExtractionError extends ScraperError {
  public constructor(
    field: string,
    selector: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(
      `Failed to extract field '${field}' using selector '${selector}'`,
      {
        field,
        selector,
        ...context,
      },
      cause
    );
  }
}

/**
 * Error thrown when data validation fails
 */
export class ValidationError extends ScraperError {
  public readonly validationErrors: readonly string[];

  public constructor(errors: readonly string[], data?: Record<string, unknown>) {
    const message = `Validation failed: ${errors.join(", ")}`;
    super(message, { validationErrors: errors, data });
    this.validationErrors = errors;
  }
}

/**
 * Error thrown when data transformation fails
 */
export class TransformationError extends ScraperError {
  public constructor(
    field: string,
    value: unknown,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(
      `Failed to transform field '${field}' with value: ${String(value)}`,
      {
        field,
        value,
        ...context,
      },
      cause
    );
  }
}

/**
 * Error thrown when browser automation fails
 */
export class BrowserError extends ScraperError {
  public constructor(operation: string, cause?: Error, context?: Record<string, unknown>) {
    super(`Browser operation failed: ${operation}`, { operation, ...context }, cause);
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends ScraperError {
  public constructor(configField: string, value: unknown, expectedType?: string) {
    const message = expectedType
      ? `Invalid configuration for '${configField}': expected ${expectedType}, got ${typeof value}`
      : `Invalid configuration for '${configField}': ${String(value)}`;

    super(message, { configField, value, expectedType });
  }
}

/**
 * Type guard to check if an error is a ScraperError
 */
export function isScraperError(error: unknown): error is ScraperError {
  return error instanceof ScraperError;
}

/**
 * Type guard to check if an error is a specific scraper error type
 */
export function isSpecificScraperError<T extends ScraperError>(
  error: unknown,
  errorClass: new (...args: unknown[]) => T
): error is T {
  return error instanceof errorClass;
}
