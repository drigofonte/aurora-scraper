import { describe, it, expect, beforeEach } from "vitest";
import { SchemaValidator } from "../schema-validator";

describe("SchemaValidator", () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  describe("Schema Registration", () => {
    it("should register a simple schema", () => {
      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          price: { type: "number" },
        },
        required: ["title"],
      };

      const result = validator.registerSchema("simple-schema", schema);
      expect(result.isOk).toBe(true);
    });

    it("should fail to register invalid schema", () => {
      const invalidSchema = {
        type: "invalid-type",
        properties: {},
      };

      const result = validator.registerSchema("invalid-schema", invalidSchema as any);
      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("SCHEMA_VALIDATION_FAILED");
      }
    });

    it("should allow overwriting existing schema", () => {
      const schema1 = {
        type: "object",
        properties: { name: { type: "string" } },
      };
      const schema2 = {
        type: "object",
        properties: { title: { type: "string" } },
      };

      validator.registerSchema("test-schema", schema1);
      const result = validator.registerSchema("test-schema", schema2);

      expect(result.isOk).toBe(true);
    });
  });

  describe("Data Validation", () => {
    beforeEach(() => {
      const articleSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          publishedDate: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
        },
        required: ["title"],
      };
      validator.registerSchema("article-schema", articleSchema);
    });

    it("should validate valid data", () => {
      const validData = {
        title: "Sample Title",
        publishedDate: "2024-01-15",
        category: "technology",
      };

      const result = validator.validateRecord(validData, "article-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true);
        expect(result.value.errors).toHaveLength(0);
      }
    });

    it("should detect missing required fields", () => {
      const invalidData = {
        publishedDate: "2024-01-15",
        category: "technology",
      };

      const result = validator.validateRecord(invalidData, "article-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors).toHaveLength(1);
        expect(result.value.errors[0]?.field).toBe("#/required");
        expect(result.value.errors[0]?.message).toBe("must have required property 'title'");
      }
    });

    it("should detect type mismatches", () => {
      const invalidData = {
        title: "Sample Title",
        price: "not-a-number",
      };

      const result = validator.validateRecord(invalidData, "article-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors).toHaveLength(1);
        expect(result.value.errors[0]?.field).toBe("/price");
        expect(result.value.errors[0]?.message).toBe("must be number");
      }
    });

    it("should fail when schema not found", () => {
      const data = { title: "Sample" };

      const result = validator.validateRecord(data, "non-existent-schema");
      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("SCHEMA_VALIDATION_FAILED");
        expect(result.error.message).toContain("Schema not found");
      }
    });
  });

  describe("Complex Schema Validation", () => {
    it("should handle nested objects", () => {
      const nestedSchema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
            },
            required: ["name"],
          },
        },
        required: ["user"],
      };

      validator.registerSchema("nested-schema", nestedSchema);

      const validData = {
        user: {
          name: "John Doe",
          age: 30,
        },
      };

      const result = validator.validateRecord(validData, "nested-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true);
      }
    });

    it("should handle arrays", () => {
      const arraySchema = {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      };

      validator.registerSchema("array-schema", arraySchema);

      const validData = {
        tags: ["tech", "science", "news"],
      };

      const result = validator.validateRecord(validData, "array-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true);
      }
    });

    it("should provide detailed error paths for nested validation failures", () => {
      const nestedSchema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
            },
            required: ["name"],
          },
        },
        required: ["user"],
      };

      validator.registerSchema("nested-error-schema", nestedSchema);

      const invalidData = {
        user: {
          age: "not-a-number",
        },
      };

      const result = validator.validateRecord(invalidData, "nested-error-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors.length).toBeGreaterThan(0);

        // Check for nested validation errors
        const nameError = result.value.errors.find(
          (e: any) => e.field.includes("/user/name") || e.message.includes("name")
        );
        const ageError = result.value.errors.find((e: any) => e.field.includes("/user/age"));

        expect(nameError || ageError).toBeTruthy();
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle null and undefined values", () => {
      const schema = {
        type: "object",
        properties: {
          optional: { type: "string" },
          required: { type: "string" },
        },
        required: ["required"],
      };

      validator.registerSchema("null-test-schema", schema);

      const dataWithNull = {
        required: "value",
        optional: null,
      };

      const result = validator.validateRecord(dataWithNull, "null-test-schema");
      expect(result.isOk).toBe(true);
    });

    it("should handle empty objects", () => {
      const schema = {
        type: "object",
        properties: {},
      };

      validator.registerSchema("empty-schema", schema);

      const result = validator.validateRecord({}, "empty-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true);
      }
    });
  });

  describe("Batch Validation", () => {
    beforeEach(() => {
      const productSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "number" },
        },
        required: ["name", "price"],
      };
      validator.registerSchema("product-schema", productSchema);
    });

    it("should validate multiple records", () => {
      const records = [
        { name: "Product 1", price: 19.99 },
        { name: "Product 2", price: 29.99 },
        { name: "Product 3", price: 39.99 },
      ];

      const result = validator.validateRecords(records, "product-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(3);
        result.value.forEach((validationResult) => {
          expect(validationResult.valid).toBe(true);
        });
      }
    });

    it("should handle mixed valid and invalid records", () => {
      const records = [
        { name: "Valid Product", price: 19.99 },
        { name: "Invalid Product" }, // missing price
        { price: 29.99 }, // missing name
      ];

      const result = validator.validateRecords(records, "product-schema");
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value[0]!.valid).toBe(true);
        expect(result.value[1]!.valid).toBe(false);
        expect(result.value[2]!.valid).toBe(false);
      }
    });
  });
});
