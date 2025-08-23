import type {
  DataExtractor,
  RawEventData,
  ExtractionFieldMap,
  FieldExtractionConfig,
} from "@/types/extraction.js";
import { ExtractionError } from "@/types/errors.js";
import type { Result } from "@/utils/result.utils.js";
import { tryCatch } from "@/utils/result.utils.js";
import { getLogger } from "@/utils/logger.utils.js";

const logger = getLogger("DOMExtractor");

/**
 * Generic DOM-based data extractor that uses field mapping configuration
 */
export class DOMExtractor implements DataExtractor<RawEventData> {
  public constructor(private readonly fieldMap: ExtractionFieldMap) {}

  /**
   * Extracts raw data from DOM element using the configured field mapping
   */
  public extract(element: Element): RawEventData {
    const rawData: RawEventData = {};

    for (const [fieldName, config] of Object.entries(this.fieldMap)) {
      const result = this.extractField(element, fieldName, config);
      if (result.isOk) {
        rawData[fieldName] = result.value;
      } else if (config.required === true) {
        throw result.error;
      } else {
        logger.debug(`Optional field extraction failed: ${fieldName}`, {
          selector: config.selector,
          error: result.error.message,
        });
        rawData[fieldName] = null;
      }
    }

    return rawData;
  }

  /**
   * Extracts a single field from the DOM element
   */
  private extractField(
    element: Element,
    fieldName: string,
    config: FieldExtractionConfig
  ): Result<string | null, ExtractionError> {
    return tryCatch(
      () => {
        const targetElement = element.querySelector(config.selector);
        if (targetElement === null) {
          if (config.required === true) {
            throw new ExtractionError(fieldName, config.selector, undefined, {
              reason: "Element not found",
            });
          }
          return null;
        }

        let value: string | null;

        if (config.attribute !== undefined) {
          value = targetElement.getAttribute(config.attribute);
          if (value === null && config.required === true) {
            throw new ExtractionError(fieldName, config.selector, undefined, {
              reason: `Attribute '${config.attribute}' not found`,
            });
          }
        } else {
          value = targetElement.textContent?.trim() || null;
          if ((value === null || value === "") && config.required === true) {
            throw new ExtractionError(fieldName, config.selector, undefined, {
              reason: "Element has no text content",
            });
          }
        }

        // Apply transformation if provided and value is not null
        if (value !== null && config.transform !== undefined) {
          value = config.transform(value);
        }

        return value;
      },
      (error) => {
        if (error instanceof ExtractionError) {
          return error;
        }
        return new ExtractionError(fieldName, config.selector, error as Error);
      }
    );
  }
}
