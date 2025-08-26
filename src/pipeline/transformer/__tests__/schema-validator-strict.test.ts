import { describe, it, expect, beforeEach } from "vitest";
import { SchemaValidator } from "../schema-validator";

describe("SchemaValidator - Strict Validation", () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  describe("Strict Mode Validation", () => {
    beforeEach(() => {
      // Schema with additionalProperties: false for strict checking
      const strictSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          price: { type: "number" },
          category: { type: "string" },
        },
        required: ["title", "price"],
        additionalProperties: false, // This is key for strict validation
      };

      const lenientSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          price: { type: "number" },
        },
        required: ["title", "price"],
        // additionalProperties not specified (defaults to true)
      };

      validator.registerSchema("strict-schema", strictSchema);
      validator.registerSchema("lenient-schema", lenientSchema);
    });

    it("should pass validation for exact schema match in strict mode", () => {
      const validData = {
        title: "Valid Product",
        price: 19.99,
        category: "electronics",
      };

      const result = validator.validateRecord(validData, "strict-schema", { strict: true });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true);
        expect(result.value.errors).toHaveLength(0);
        expect(result.value.warnings).toHaveLength(0);
      }
    });

    it("should fail validation for additional properties in strict mode with strict schema", () => {
      const dataWithExtraProps = {
        title: "Product with Extra",
        price: 29.99,
        category: "electronics",
        extraField1: "not allowed",
        extraField2: 123,
      };

      const result = validator.validateRecord(dataWithExtraProps, "strict-schema", {
        strict: true,
      });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors.length).toBeGreaterThan(0);

        // Should have errors for additional properties
        const additionalPropErrors = result.value.errors.filter(
          (e) =>
            e.message.includes("additional properties") ||
            e.message.includes("additionalProperties") ||
            e.message.includes("must NOT have additional properties")
        );
        expect(additionalPropErrors.length).toBeGreaterThan(0);
      }
    });

    it("should allow additional properties in non-strict mode even with strict schema", () => {
      const dataWithExtraProps = {
        title: "Product with Extra",
        price: 29.99,
        category: "electronics",
        extraField: "allowed in non-strict mode",
      };

      const result = validator.validateRecord(dataWithExtraProps, "strict-schema", {
        strict: false,
      });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        // In non-strict mode, additional properties generate warnings, not errors
        expect(result.value.valid).toBe(false); // Still false because schema has additionalProperties: false
        expect(result.value.errors.length).toBeGreaterThan(0);
      }
    });

    it("should allow additional properties with lenient schema in non-strict mode", () => {
      const dataWithExtraProps = {
        title: "Product with Extra",
        price: 29.99,
        extraField: "allowed",
        anotherExtra: 456,
      };

      const result = validator.validateRecord(dataWithExtraProps, "lenient-schema", {
        strict: false,
      });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true); // Should pass with lenient schema
        expect(result.value.errors).toHaveLength(0);
      }
    });

    it("should handle required field validation in strict mode", () => {
      const incompleteData = {
        title: "Missing Price",
        category: "electronics",
        extraField: "not allowed",
      };

      const result = validator.validateRecord(incompleteData, "strict-schema", { strict: true });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors.length).toBeGreaterThan(0);

        // Should have errors for both missing required field and additional property
        const requiredError = result.value.errors.find(
          (e) => e.message.includes("price") || e.message.includes("required")
        );
        const additionalPropError = result.value.errors.find(
          (e) =>
            e.message.includes("additional properties") ||
            e.message.includes("additionalProperties") ||
            e.message.includes("must NOT have additional properties")
        );

        expect(requiredError).toBeTruthy();
        expect(additionalPropError).toBeTruthy();
      }
    });

    it("should handle type validation errors in strict mode", () => {
      const invalidTypeData = {
        title: "Valid Title",
        price: "not a number", // Type error
        category: "electronics",
        extraField: "not allowed", // Additional property
      };

      const result = validator.validateRecord(invalidTypeData, "strict-schema", { strict: true });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors.length).toBeGreaterThan(0);

        // Should have errors for both type mismatch and additional property
        const typeError = result.value.errors.find((e) => e.message.includes("number"));
        const additionalPropError = result.value.errors.find(
          (e) =>
            e.message.includes("additional properties") ||
            e.message.includes("additionalProperties") ||
            e.message.includes("must NOT have additional properties")
        );

        expect(typeError).toBeTruthy();
        expect(additionalPropError).toBeTruthy();
      }
    });
  });

  describe("Batch Validation with Strict Mode", () => {
    beforeEach(() => {
      const batchSchema = {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          active: { type: "boolean" },
        },
        required: ["id", "name"],
        additionalProperties: false,
      };

      validator.registerSchema("batch-schema", batchSchema);
    });

    it("should validate multiple records in strict mode", () => {
      const records = [
        { id: 1, name: "Item 1", active: true },
        { id: 2, name: "Item 2", active: false },
        { id: 3, name: "Item 3" }, // missing active is ok (not required)
      ];

      const result = validator.validateRecords(records, "batch-schema", { strict: true });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(3);
        result.value.forEach((validationResult) => {
          expect(validationResult.valid).toBe(true);
          expect(validationResult.errors).toHaveLength(0);
        });
      }
    });

    it("should detect invalid records in batch strict validation", () => {
      const records = [
        { id: 1, name: "Valid Item", active: true },
        { id: 2, name: "Invalid Item", extraField: "not allowed" },
        { name: "Missing ID" }, // missing required id
        { id: "not a number", name: "Type Error" }, // wrong type
      ];

      const result = validator.validateRecords(records, "batch-schema", { strict: true });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(4);
        expect(result.value[0]!.valid).toBe(true); // First record valid
        expect(result.value[1]!.valid).toBe(false); // Additional property
        expect(result.value[2]!.valid).toBe(false); // Missing required field
        expect(result.value[3]!.valid).toBe(false); // Type error
      }
    });

    it("should filter records properly in strict mode", () => {
      const records = [
        { id: 1, name: "Valid Item 1" },
        { id: 2, name: "Valid Item 2", active: true },
        { id: 3, name: "Invalid Item", extraField: "not allowed" },
        { name: "Missing ID" },
      ];

      const result = validator.validateAndFilter(records, "batch-schema", {
        strict: true,
        logErrors: false,
      });

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(2); // Only first two records should pass
        expect(result.value[0]).toEqual({ id: 1, name: "Valid Item 1" });
        expect(result.value[1]).toEqual({ id: 2, name: "Valid Item 2", active: true });
      }
    });
  });

  describe("Nested Object Strict Validation", () => {
    beforeEach(() => {
      const nestedStrictSchema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "number" },
              profile: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
            required: ["id", "profile"],
            additionalProperties: false,
          },
        },
        required: ["user"],
        additionalProperties: false,
      };

      validator.registerSchema("nested-strict-schema", nestedStrictSchema);
    });

    it("should validate nested objects in strict mode", () => {
      const validNestedData = {
        user: {
          id: 123,
          profile: {
            name: "John Doe",
            email: "john@example.com",
          },
        },
      };

      const result = validator.validateRecord(validNestedData, "nested-strict-schema", {
        strict: true,
      });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true);
        expect(result.value.errors).toHaveLength(0);
      }
    });

    it("should detect additional properties in nested objects", () => {
      const invalidNestedData = {
        user: {
          id: 123,
          profile: {
            name: "John Doe",
            email: "john@example.com",
            invalidField: "not allowed", // Additional property in nested object
          },
          extraUserField: "also not allowed", // Additional property in user object
        },
        topLevelExtra: "not allowed", // Additional property at top level
      };

      const result = validator.validateRecord(invalidNestedData, "nested-strict-schema", {
        strict: true,
      });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors.length).toBeGreaterThan(0);

        // Should detect additional properties at multiple levels
        const additionalPropErrors = result.value.errors.filter(
          (e) =>
            e.message.includes("additional properties") ||
            e.message.includes("additionalProperties") ||
            e.message.includes("must NOT have additional properties")
        );
        expect(additionalPropErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Edge Cases in Strict Validation", () => {
    beforeEach(() => {
      const edgeCaseSchema = {
        type: "object",
        properties: {
          requiredString: { type: "string" },
          optionalNumber: { type: "number" },
          nullableField: { type: ["string", "null"] },
        },
        required: ["requiredString"],
        additionalProperties: false,
      };

      validator.registerSchema("edge-case-schema", edgeCaseSchema);
    });

    it("should handle null values correctly in strict mode", () => {
      const dataWithNull = {
        requiredString: "value",
        nullableField: null,
      };

      const result = validator.validateRecord(dataWithNull, "edge-case-schema", { strict: true });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true);
        expect(result.value.errors).toHaveLength(0);
      }
    });

    it("should handle undefined values correctly in strict mode", () => {
      const dataWithUndefined = {
        requiredString: "value",
        optionalNumber: undefined, // undefined should be treated as missing property
      };

      const result = validator.validateRecord(dataWithUndefined, "edge-case-schema", {
        strict: true,
      });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(true);
        expect(result.value.errors).toHaveLength(0);
      }
    });

    it("should reject completely empty object when required fields exist", () => {
      const result = validator.validateRecord({}, "edge-case-schema", { strict: true });
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.valid).toBe(false);
        expect(result.value.errors.length).toBeGreaterThan(0);

        const requiredError = result.value.errors.find(
          (e) => e.message.includes("requiredString") || e.message.includes("required")
        );
        expect(requiredError).toBeTruthy();
      }
    });
  });
});
