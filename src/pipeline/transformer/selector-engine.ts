/**
 * Selector engine for processing CSS selectors and extracting data from HTML
 */

import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import type { FieldMapping, ElementAttribute, TransformerError } from "../types.js";
import { getLogger } from "../../utils/logger.utils.js";

const logger = getLogger("SelectorEngine");

/**
 * Extracted field value with metadata
 */
export interface ExtractedField {
  readonly value: unknown;
  readonly selector: string;
  readonly attribute: ElementAttribute;
  readonly found: boolean;
  readonly multiple: boolean;
}

/**
 * Selector engine for processing CSS selectors and extracting data
 */
export class SelectorEngine {
  private $: cheerio.CheerioAPI | null = null;

  /**
   * Load HTML content into the selector engine
   */
  loadHtml(html: string): Result<void, TransformerError> {
    try {
      this.$ = cheerio.load(html);
      logger.debug("HTML loaded successfully", { htmlLength: html.length });
      return ok(undefined);
    } catch (error) {
      const transformerError: TransformerError = {
        code: "INVALID_HTML",
        message: `Failed to parse HTML: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
      };
      return err(transformerError);
    }
  }

  /**
   * Extract data from a single element using field mappings
   */
  extractFromElement(
    element: unknown | null,
    fieldMappings: Record<string, FieldMapping>
  ): Result<Record<string, unknown>, TransformerError> {
    if (!this.$) {
      const error: TransformerError = {
        code: "INVALID_HTML",
        message: "HTML not loaded. Call loadHtml() first.",
        details: {},
      };
      return err(error);
    }

    const result: Record<string, unknown> = {};
    const errors: string[] = [];
    const $ = this.$;

    // Use root element if none provided
    const targetElement = element || ($("body").length ? $("body") : $.root());

    for (const [fieldName, mapping] of Object.entries(fieldMappings)) {
      try {
        const extractionResult = this.extractField(targetElement, mapping, $);
        this.processFieldExtraction(fieldName, mapping, extractionResult, result, errors);
      } catch (error) {
        this.handleFieldExtractionError(fieldName, mapping, error, result, errors);
      }
    }

    if (errors.length > 0) {
      const transformerError: TransformerError = {
        code: "FIELD_EXTRACTION_FAILED",
        message: `Field extraction failed: ${errors.join(", ")}`,
        details: { errors, fieldMappings },
      };
      return err(transformerError);
    }

    return ok(result);
  }

  /**
   * Extract data from multiple elements (list extraction)
   */
  extractFromElements(
    containerSelector: string,
    itemSelector: string,
    fieldMappings: Record<string, FieldMapping>
  ): Result<readonly Record<string, unknown>[], TransformerError> {
    if (!this.$) {
      const error: TransformerError = {
        code: "INVALID_HTML",
        message: "HTML not loaded. Call loadHtml() first.",
        details: {},
      };
      return err(error);
    }

    const $ = this.$;

    // Find container
    const container = $(containerSelector);
    if (container.length === 0) {
      const error: TransformerError = {
        code: "CONTAINER_NOT_FOUND",
        message: `Container selector '${containerSelector}' not found`,
        details: { containerSelector },
      };
      return err(error);
    }

    // Find items within container
    const items = container.find(itemSelector);
    if (items.length === 0) {
      logger.warn("No items found in container", { containerSelector, itemSelector });
      return ok([]);
    }

    const results: Record<string, unknown>[] = [];
    const errors: string[] = [];

    items.each((index, element) => {
      // Create a proper Cheerio wrapper for the individual element
      const $element = $(element);
      const extractionResult = this.extractFromElement($element, fieldMappings);

      if (extractionResult.isErr) {
        errors.push(`Item ${index}: ${extractionResult.error.message}`);
      } else {
        results.push(extractionResult.value);
      }
    });

    if (errors.length > 0) {
      logger.warn("Some items failed extraction", {
        successCount: results.length,
        errorCount: errors.length,
      });
    }

    logger.debug("List extraction completed", {
      itemCount: results.length,
      errorCount: errors.length,
    });

    return ok(results);
  }

  /**
   * Extract a single field using field mapping
   */
  private extractField(
    element: unknown,
    mapping: FieldMapping,
    $: cheerio.CheerioAPI
  ): Result<ExtractedField, TransformerError> {
    try {
      // Use the element.find() method to properly scope the selector to the element context
      // Note: element should be a Cheerio object here, not a raw DOM element
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected = (element as any).find(mapping.selector);
      const found = selected.length > 0;
      const multiple = mapping.multiple ?? false;

      if (!found) {
        if (mapping.required) {
          const error: TransformerError = {
            code: "SELECTOR_NOT_FOUND",
            message: `Required selector '${mapping.selector}' not found`,
            details: { mapping },
          };
          return err(error);
        }

        return ok({
          value: mapping.defaultValue ?? null,
          selector: mapping.selector,
          attribute: mapping.attribute ?? "text",
          found: false,
          multiple,
        });
      }

      const attribute = mapping.attribute ?? "text";
      let value: unknown;

      if (multiple) {
        // Extract from all matching elements
        const values: unknown[] = [];
        selected.each((_: number, el: Element) => {
          const extractedValue = this.extractAttribute($(el), attribute);
          if (extractedValue !== null && extractedValue !== undefined) {
            values.push(extractedValue);
          }
        });
        value = values;
      } else {
        // Extract from first matching element
        value = this.extractAttribute(selected.first(), attribute);
      }

      return ok({
        value,
        selector: mapping.selector,
        attribute,
        found,
        multiple,
      });
    } catch (error) {
      const transformerError: TransformerError = {
        code: "FIELD_EXTRACTION_FAILED",
        message: `Failed to extract field: ${error instanceof Error ? error.message : String(error)}`,
        details: { mapping, error },
      };
      return err(transformerError);
    }
  }

  /**
   * Extract attribute value from a Cheerio element
   */
  private extractAttribute(
    element: cheerio.Cheerio<Element>,
    attribute: ElementAttribute
  ): unknown {
    switch (attribute) {
      case "text":
        return element.text().trim();
      case "innerText":
        return element.text().trim();
      case "innerHTML":
        return element.html();
      case "href":
        return element.attr("href");
      case "src":
        return element.attr("src");
      case "title":
        return element.attr("title");
      case "alt":
        return element.attr("alt");
      case "value":
        return element.attr("value") ?? element.val();
      case "data-*": {
        // Extract all data attributes
        const dataAttrs: Record<string, string> = {};
        const attrs = element.get(0)?.attribs ?? {};
        for (const [key, value] of Object.entries(attrs)) {
          if (key.startsWith("data-")) {
            dataAttrs[key] = String(value);
          }
        }
        return dataAttrs;
      }
      default:
        // Custom attribute
        if (typeof attribute === "string" && (attribute as string).startsWith("data-")) {
          return element.attr(attribute);
        }
        return element.attr(attribute as string);
    }
  }

  /**
   * Check if HTML is loaded
   */
  isLoaded(): boolean {
    return this.$ !== null;
  }

  /**
   * Get the current Cheerio instance (for advanced usage)
   */
  getCheerio(): cheerio.CheerioAPI | null {
    return this.$;
  }

  /**
   * Process field extraction result and update result/errors
   */
  private processFieldExtraction(
    fieldName: string,
    mapping: FieldMapping,
    extractionResult: Result<ExtractedField, TransformerError>,
    result: Record<string, unknown>,
    errors: string[]
  ): void {
    if (extractionResult.isErr) {
      if (mapping.required) {
        errors.push(`Required field '${fieldName}': ${extractionResult.error.message}`);
      } else {
        // Use default value for optional fields
        result[fieldName] = mapping.defaultValue ?? null;
      }
      return;
    }

    const extracted = extractionResult.value;

    // Validate required fields
    if (
      mapping.required &&
      (!extracted.found || extracted.value === null || extracted.value === undefined)
    ) {
      errors.push(`Required field '${fieldName}' not found or empty`);
    } else {
      result[fieldName] = extracted.value;
    }
  }

  /**
   * Handle field extraction errors
   */
  private handleFieldExtractionError(
    fieldName: string,
    mapping: FieldMapping,
    error: unknown,
    result: Record<string, unknown>,
    errors: string[]
  ): void {
    const message = `Error extracting field '${fieldName}': ${error instanceof Error ? error.message : String(error)}`;
    if (mapping.required) {
      errors.push(message);
    } else {
      logger.warn(message);
      result[fieldName] = mapping.defaultValue ?? null;
    }
  }
}
