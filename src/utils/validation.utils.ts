import type { DataValidator, ValidationResult } from "@/types/extraction.js";
import type { EventData } from "@/types/event.js";
import { ValidationError } from "@/types/errors.js";
import type { Result } from "@/utils/result.utils.js";
import { ok, err } from "@/utils/result.utils.js";

/**
 * Validates Barcelona event data quality
 */
export class EventDataValidator implements DataValidator<EventData> {
  /**
   * Validates if event data meets quality requirements
   */
  public validate(data: EventData): ValidationResult {
    const errors = this.getValidationErrors(data);
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Returns validation errors for the event data
   */
  public getValidationErrors(data: EventData): readonly string[] {
    const errors: string[] = [];

    // Check if event has meaningful content
    if (Object.keys(data).length === 0) {
      errors.push("Event data is empty");
    }

    // Title is required
    if (data.title === undefined || data.title.trim() === "") {
      errors.push("Event title is required");
    }

    // Validate URL format if link is provided
    if (data.link !== undefined && !this.isValidUrl(data.link)) {
      errors.push("Event link is not a valid URL");
    }

    // Validate location link format if provided
    if (data.location_link !== undefined && !this.isValidUrl(data.location_link)) {
      errors.push("Location link is not a valid URL");
    }

    // Validate image URL if provided
    if (data.image !== undefined && data.image.trim() !== "" && !this.isValidUrl(data.image)) {
      errors.push("Image URL is not valid");
    }

    return errors;
  }

  /**
   * Validates event data and returns a Result
   */
  public validateResult(data: EventData): Result<EventData, ValidationError> {
    const errors = this.getValidationErrors(data);
    if (errors.length === 0) {
      return ok(data);
    }
    return err(new ValidationError(errors, data as Record<string, unknown>));
  }

  /**
   * Basic URL validation
   */
  private isValidUrl(url: string): boolean {
    if (url.trim() === "") {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      // If it's a relative URL, check if it starts with /
      return url.startsWith("/");
    }
  }
}

/**
 * Factory for creating event data validators
 */
export class ValidatorFactory {
  private static instance?: ValidatorFactory;
  private readonly validators = new Map<string, DataValidator<EventData>>();

  private constructor() {}

  public static getInstance(): ValidatorFactory {
    if (ValidatorFactory.instance === undefined) {
      ValidatorFactory.instance = new ValidatorFactory();
    }
    return ValidatorFactory.instance;
  }

  public getEventDataValidator(): DataValidator<EventData> {
    const key = "EventData";
    if (!this.validators.has(key)) {
      this.validators.set(key, new EventDataValidator());
    }
    return this.validators.get(key)!;
  }
}

/**
 * Gets the default event data validator
 */
export function getEventDataValidator(): DataValidator<EventData> {
  return ValidatorFactory.getInstance().getEventDataValidator();
}
