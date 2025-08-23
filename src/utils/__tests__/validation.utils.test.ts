import { describe, it, expect, beforeEach } from "vitest";

import { EventDataValidator } from "@/utils/validation.utils.js";
import type { EventData } from "@/types/event.js";

describe("EventDataValidator", () => {
  let validator: EventDataValidator;

  beforeEach(() => {
    validator = new EventDataValidator();
  });

  describe("validate", () => {
    it("should return true for valid event data", () => {
      const validEvent: EventData = {
        title: "Valid Event",
        description: "This is a valid event description",
        link: "https://example.com/event",
        when: "2024-01-01",
        where: "Barcelona",
      };

      expect(validator.validate(validEvent).isValid).toBe(true);
    });

    it("should return false for event data without title", () => {
      const invalidEvent: EventData = {
        description: "Event without title",
      };

      expect(validator.validate(invalidEvent).isValid).toBe(false);
    });

    it("should return false for empty event data", () => {
      const emptyEvent: EventData = {};

      expect(validator.validate(emptyEvent).isValid).toBe(false);
    });

    it("should return false for event with invalid URL", () => {
      const invalidEvent: EventData = {
        title: "Event with invalid URL",
        link: "not-a-valid-url",
      };

      expect(validator.validate(invalidEvent).isValid).toBe(false);
    });
  });

  describe("getValidationErrors", () => {
    it("should return no errors for valid event data", () => {
      const validEvent: EventData = {
        title: "Valid Event",
        link: "https://example.com",
      };

      const errors = validator.getValidationErrors(validEvent);
      expect(errors).toHaveLength(0);
    });

    it("should return title error for event without title", () => {
      const invalidEvent: EventData = {
        description: "No title",
      };

      const errors = validator.getValidationErrors(invalidEvent);
      expect(errors).toContain("Event title is required");
    });

    it("should return multiple errors for invalid event", () => {
      const invalidEvent: EventData = {
        link: "invalid-url",
        location_link: "also-invalid",
      };

      const errors = validator.getValidationErrors(invalidEvent);
      expect(errors).toContain("Event title is required");
      expect(errors).toContain("Event link is not a valid URL");
      expect(errors).toContain("Location link is not a valid URL");
    });

    it("should accept relative URLs", () => {
      const eventWithRelativeUrl: EventData = {
        title: "Event with relative URL",
        link: "/events/123",
        location_link: "/locations/456",
      };

      const errors = validator.getValidationErrors(eventWithRelativeUrl);
      expect(errors).not.toContain("Event link is not a valid URL");
      expect(errors).not.toContain("Location link is not a valid URL");
    });
  });

  describe("validateResult", () => {
    it("should return Ok result for valid event data", () => {
      const validEvent: EventData = {
        title: "Valid Event",
      };

      const result = validator.validateResult(validEvent);
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toEqual(validEvent);
      }
    });

    it("should return Err result for invalid event data", () => {
      const invalidEvent: EventData = {};

      const result = validator.validateResult(invalidEvent);
      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.validationErrors).toContain("Event data is empty");
        expect(result.error.validationErrors).toContain("Event title is required");
      }
    });
  });
});
