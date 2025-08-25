/**
 * Unit tests for FieldTransformerEngine
 */

import { describe, it, expect, beforeEach } from "vitest";
import { FieldTransformerEngine } from "../field-transformer.js";
import type { FieldMapping } from "../../types.js";

describe("FieldTransformerEngine", () => {
  let transformerEngine: FieldTransformerEngine;

  beforeEach(() => {
    transformerEngine = new FieldTransformerEngine();
  });

  describe("Built-in Transformers", () => {
    it("should have registered built-in transformers", () => {
      const availableTransformers = transformerEngine.getAvailableTransformers();

      expect(availableTransformers).toContain("trim");
      expect(availableTransformers).toContain("lowercase");
      expect(availableTransformers).toContain("uppercase");
      expect(availableTransformers).toContain("number");
      expect(availableTransformers).toContain("date");
      expect(availableTransformers).toContain("boolean");
      expect(availableTransformers).toContain("html-to-text");
      expect(availableTransformers).toContain("url");
      expect(availableTransformers).toContain("price");
    });

    describe("trim transformer", () => {
      it("should trim whitespace from strings", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "trim",
        };

        const result = transformerEngine.transformField("  hello world  ", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe("hello world");
        }
      });

      it("should pass through non-string values", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "trim",
        };

        const result = transformerEngine.transformField(123, mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(123);
        }
      });
    });

    describe("case transformers", () => {
      it("should convert to lowercase", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "lowercase",
        };

        const result = transformerEngine.transformField("HELLO WORLD", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe("hello world");
        }
      });

      it("should convert to uppercase", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "uppercase",
        };

        const result = transformerEngine.transformField("hello world", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe("HELLO WORLD");
        }
      });
    });

    describe("number transformer", () => {
      it("should parse valid numbers", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "number",
        };

        const result = transformerEngine.transformField("123.45", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(123.45);
        }
      });

      it("should return null for invalid numbers", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "number",
        };

        const result = transformerEngine.transformField("not a number", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBeNull();
        }
      });

      it("should pass through non-string values", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "number",
        };

        const result = transformerEngine.transformField(42, mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(42);
        }
      });
    });

    describe("date transformer", () => {
      it("should parse valid dates", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "date",
        };

        const result = transformerEngine.transformField("2024-01-15", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe("2024-01-15T00:00:00.000Z");
        }
      });

      it("should return null for invalid dates", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "date",
        };

        const result = transformerEngine.transformField("invalid date", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBeNull();
        }
      });
    });

    describe("boolean transformer", () => {
      it("should parse string 'true' as true", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "boolean",
        };

        const result = transformerEngine.transformField("true", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(true);
        }
      });

      it("should parse string '1' as true", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "boolean",
        };

        const result = transformerEngine.transformField("1", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(true);
        }
      });

      it("should parse other strings as false", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "boolean",
        };

        const result = transformerEngine.transformField("false", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(false);
        }
      });

      it("should convert non-string values to boolean", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "boolean",
        };

        const result = transformerEngine.transformField(0, mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(false);
        }
      });
    });

    describe("html-to-text transformer", () => {
      it("should strip HTML tags", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "html-to-text",
        };

        const result = transformerEngine.transformField(
          "<p>Hello <strong>world</strong>!</p>",
          mapping
        );

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe("Hello world!");
        }
      });

      it("should handle nested tags", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "html-to-text",
        };

        const html = "<div><p>Paragraph 1</p><p>Paragraph 2</p></div>";
        const result = transformerEngine.transformField(html, mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe("Paragraph 1Paragraph 2");
        }
      });
    });

    describe("url transformer", () => {
      it("should normalize valid URLs", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "url",
        };

        const result = transformerEngine.transformField("https://example.com/path", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe("https://example.com/path");
        }
      });

      it("should pass through invalid URLs unchanged", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "url",
        };

        const invalidUrl = "not-a-url";
        const result = transformerEngine.transformField(invalidUrl, mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(invalidUrl);
        }
      });
    });

    describe("price transformer", () => {
      it("should extract price from currency string", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "price",
        };

        const result = transformerEngine.transformField("$29.99", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(29.99);
        }
      });

      it("should handle European format", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "price",
        };

        const result = transformerEngine.transformField("€1,234.56", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBe(1234.56);
        }
      });

      it("should return null for non-numeric strings", () => {
        const mapping: FieldMapping = {
          selector: ".test",
          transformer: "price",
        };

        const result = transformerEngine.transformField("Free", mapping);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value).toBeNull();
        }
      });
    });
  });

  describe("transformField", () => {
    it("should apply transformation when transformer is specified", () => {
      const mapping: FieldMapping = {
        selector: ".test",
        transformer: "trim",
      };

      const result = transformerEngine.transformField("  test  ", mapping);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe("test");
      }
    });

    it("should pass through value when no transformer specified", () => {
      const mapping: FieldMapping = {
        selector: ".test",
      };

      const result = transformerEngine.transformField("  test  ", mapping);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe("  test  ");
      }
    });

    it("should use default value when result is null/undefined", () => {
      const mapping: FieldMapping = {
        selector: ".test",
        transformer: "number",
        defaultValue: 0,
      };

      const result = transformerEngine.transformField("invalid", mapping);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe(0);
      }
    });

    it("should fail for required fields that become null", () => {
      const mapping: FieldMapping = {
        selector: ".test",
        transformer: "number",
        required: true,
      };

      const result = transformerEngine.transformField("invalid", mapping);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("REQUIRED_FIELD_MISSING");
      }
    });

    it("should fail for unknown transformers", () => {
      const mapping: FieldMapping = {
        selector: ".test",
        transformer: "non-existent" as any,
      };

      const result = transformerEngine.transformField("test", mapping);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("TRANSFORMATION_FAILED");
        expect(result.error.message).toContain("Unknown transformer");
      }
    });
  });

  describe("transformRecord", () => {
    it("should transform all fields in a record", () => {
      const record = {
        name: "  John Doe  ",
        email: "JOHN@EXAMPLE.COM",
        age: "25",
        active: "true",
      };

      const fieldMappings: Record<string, FieldMapping> = {
        name: { selector: ".name", transformer: "trim" },
        email: { selector: ".email", transformer: "lowercase" },
        age: { selector: ".age", transformer: "number" },
        active: { selector: ".active", transformer: "boolean" },
      };

      const result = transformerEngine.transformRecord(record, fieldMappings);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.name).toBe("John Doe");
        expect(result.value.email).toBe("john@example.com");
        expect(result.value.age).toBe(25);
        expect(result.value.active).toBe(true);
      }
    });

    it("should handle missing optional fields with defaults", () => {
      const record = {
        name: "John",
      };

      const fieldMappings: Record<string, FieldMapping> = {
        name: { selector: ".name", transformer: "trim" },
        age: {
          selector: ".age",
          transformer: "number",
          required: false,
          defaultValue: 0,
        },
      };

      const result = transformerEngine.transformRecord(record, fieldMappings);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.name).toBe("John");
        expect(result.value.age).toBe(0);
      }
    });

    it("should fail when required fields fail transformation", () => {
      const record = {
        name: "John",
        age: "invalid-number",
      };

      const fieldMappings: Record<string, FieldMapping> = {
        name: { selector: ".name", transformer: "trim" },
        age: {
          selector: ".age",
          transformer: "number",
          required: true,
        },
      };

      const result = transformerEngine.transformRecord(record, fieldMappings);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("TRANSFORMATION_FAILED");
        expect(result.error.message).toContain("age");
      }
    });
  });

  describe("Custom Transformers", () => {
    it("should allow registering custom transformers", () => {
      const customTransformer = (value: unknown): unknown => {
        return typeof value === "string" ? value.replace(/\d+/g, "X") : value;
      };

      transformerEngine.registerTransformer("mask-numbers", customTransformer);

      const availableTransformers = transformerEngine.getAvailableTransformers();
      expect(availableTransformers).toContain("mask-numbers");
    });

    it("should use custom transformers", () => {
      const customTransformer = (value: unknown): unknown => {
        return typeof value === "string" ? value.replace(/\d+/g, "X") : value;
      };

      transformerEngine.registerTransformer("mask-numbers", customTransformer);

      const mapping: FieldMapping = {
        selector: ".test",
        transformer: "mask-numbers" as any,
      };

      const result = transformerEngine.transformField("abc123def456", mapping);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe("abcXdefX");
      }
    });
  });
});
