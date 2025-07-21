import { DataValidator } from "@/types/extraction.js";
import { EventData } from "@/types/event.js";

/**
 * Validates Barcelona event data quality
 */
export class EventDataValidator implements DataValidator<EventData> {
  /**
   * Validates if event data meets quality requirements
   */
  validate(data: EventData): boolean {
    return this.getValidationErrors(data).length === 0;
  }

  /**
   * Returns validation errors for the event data
   */
  getValidationErrors(data: EventData): string[] {
    const errors: string[] = [];

    // Check if event has meaningful content
    if (Object.keys(data).length === 0) {
      errors.push("Event data is empty");
    }

    // Title is required
    if (!data.title?.trim()) {
      errors.push("Event title is required");
    }

    // Validate URL format if link is provided
    if (data.link && !this.isValidUrl(data.link)) {
      errors.push("Event link is not a valid URL");
    }

    // Validate location link format if provided
    if (data.location_link && !this.isValidUrl(data.location_link)) {
      errors.push("Location link is not a valid URL");
    }

    return errors;
  }

  /**
   * Basic URL validation
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // If it's a relative URL, check if it starts with /
      return url.startsWith("/");
    }
  }
}
