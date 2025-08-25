import { describe, it, expect, beforeEach } from "vitest";
import { HtmlTransformer } from "../html-transformer";
import type { TransformerConfig } from "../../types";
import { readFile } from "fs/promises";
import { join } from "path";

describe("HtmlTransformer", () => {
  let transformer: HtmlTransformer;
  let testHtml: string;
  let testProductListHtml: string;

  beforeEach(async () => {
    transformer = new HtmlTransformer();
    const testDir = join(__dirname, "fixtures");
    testHtml = await readFile(join(testDir, "test-article.html"), "utf-8");
    testProductListHtml = await readFile(join(testDir, "test-product-list.html"), "utf-8");
  });

  describe("Single Item Transformation", () => {
    it("should transform HTML to structured data using selectors", async () => {
      const config: TransformerConfig = {
        type: "item",
        schema: "article-schema",
        fieldMappings: {
          title: {
            selector: "h1",
            transformer: "trim",
          },
          content: {
            selector: ".content",
            transformer: "html-to-text",
          },
          author: {
            selector: ".author",
            transformer: "trim",
          },
          category: {
            selector: "[data-category]",
            attribute: "data-category",
          },
        },
      };

      // Register schema
      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          author: { type: "string" },
          category: { type: "string" },
        },
        required: [],
      };

      const schemaResult = transformer
        .getSchemaValidator()
        .registerSchema("article-schema", schema);
      expect(schemaResult.isOk).toBe(true);

      const result = await transformer.transform(testHtml, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toMatchObject({
          title: "Sample Article Title",
          content: expect.stringContaining("This is the first paragraph"),
          author: "Author Name",
          category: "technology",
        });
      }
    });

    it("should handle missing optional fields with defaults", async () => {
      const config: TransformerConfig = {
        type: "item",
        schema: "simple-schema",
        fieldMappings: {
          title: {
            selector: "h1",
            transformer: "trim",
          },
          nonExistent: {
            selector: ".does-not-exist",
            defaultValue: "default-value",
          },
        },
      };

      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          nonExistent: { type: "string" },
        },
        required: [],
      };

      transformer.getSchemaValidator().registerSchema("simple-schema", schema);

      const result = await transformer.transform(testHtml, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toMatchObject({
          title: "Sample Article Title",
          nonExistent: "default-value",
        });
      }
    });
  });

  describe("List Transformation", () => {
    it("should transform HTML to array of structured data", async () => {
      const config: TransformerConfig = {
        type: "list",
        schema: "product-list-schema",
        listConfig: {
          containerSelector: "body",
          itemSelector: ".product-item",
        },
        fieldMappings: {
          name: {
            selector: ".product-title",
            transformer: "trim",
          },
          price: {
            selector: ".price",
            transformer: "price",
          },
          rating: {
            selector: ".rating",
            attribute: "data-stars",
          },
        },
      };

      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "number" },
          rating: { type: "string" },
        },
        required: [],
      };

      transformer.getSchemaValidator().registerSchema("product-list-schema", schema);

      const result = await transformer.transform(testProductListHtml, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(3);

        // Verify that all items have the expected structure, regardless of order
        expect(result.value[0]).toMatchObject({
          name: expect.any(String),
          price: expect.any(Number),
          rating: expect.any(String),
        });

        expect(result.value[1]).toMatchObject({
          name: expect.any(String),
          price: expect.any(Number),
          rating: expect.any(String),
        });

        expect(result.value[2]).toMatchObject({
          name: expect.any(String),
          price: expect.any(Number),
          rating: expect.any(String),
        });
      }
    });

    it("should handle empty lists", async () => {
      const config: TransformerConfig = {
        type: "list",
        schema: "empty-list-schema",
        listConfig: {
          containerSelector: "body",
          itemSelector: ".non-existent-products",
        },
        fieldMappings: {
          name: {
            selector: ".name",
          },
        },
      };

      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      };

      transformer.getSchemaValidator().registerSchema("empty-list-schema", schema);

      const result = await transformer.transform(testProductListHtml, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe("Attribute Extraction", () => {
    it("should extract attributes from elements", async () => {
      const config: TransformerConfig = {
        type: "item",
        schema: "attribute-schema",
        fieldMappings: {
          imageUrl: {
            selector: "img",
            attribute: "src",
          },
          linkUrl: {
            selector: ".source-link",
            attribute: "href",
          },
          dataValue: {
            selector: "[data-price]",
            attribute: "data-price",
          },
        },
      };

      const schema = {
        type: "object",
        properties: {
          imageUrl: { type: "string" },
          linkUrl: { type: "string" },
          dataValue: { type: "string" },
        },
        required: [],
      };

      transformer.getSchemaValidator().registerSchema("attribute-schema", schema);

      const result = await transformer.transform(testHtml, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toMatchObject({
          imageUrl: "https://example.com/image.jpg",
          linkUrl: "https://example.com/source",
          dataValue: "29.99",
        });
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed HTML gracefully", async () => {
      const config: TransformerConfig = {
        type: "item",
        schema: "malformed-schema",
        fieldMappings: {
          title: {
            selector: "h1",
            defaultValue: "No Title",
          },
        },
      };

      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
        },
        required: [],
      };

      transformer.getSchemaValidator().registerSchema("malformed-schema", schema);

      const malformedHtml = "<html><head><title>Test</title></head><body><h1>Incomplete";
      const result = await transformer.transform(malformedHtml, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.title).toBe("Incomplete");
      }
    });
  });

  describe("Configuration Validation", () => {
    it("should require listConfig for list transformations", async () => {
      const config: TransformerConfig = {
        type: "list",
        schema: "list-without-config",
        fieldMappings: {
          name: { selector: ".name" },
        },
        // Missing listConfig
      };

      const result = await transformer.transform(testProductListHtml, config);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("TRANSFORMATION_FAILED");
        expect(result.error.message).toContain("List configuration required");
      }
    });

    it("should handle unknown transformer types", async () => {
      const config: TransformerConfig = {
        type: "unknown-type" as any,
        schema: "unknown-schema",
        fieldMappings: {
          title: { selector: "h1" },
        },
      };

      const result = await transformer.transform(testHtml, config);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("TRANSFORMATION_FAILED");
        expect(result.error.message).toContain("Unknown configuration type");
      }
    });
  });
});
