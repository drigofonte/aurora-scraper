import {
  DataExtractor,
  RawEventData,
  ExtractionFieldMap,
  FieldExtractionConfig,
} from "types/extraction.js";

/**
 * Generic DOM-based data extractor that uses field mapping configuration
 */
export class DOMExtractor implements DataExtractor<RawEventData> {
  constructor(private fieldMap: ExtractionFieldMap) {}

  /**
   * Extracts raw data from DOM element using the configured field mapping
   */
  extract(element: Element): RawEventData {
    const rawData: RawEventData = {};

    for (const [fieldName, config] of Object.entries(this.fieldMap)) {
      rawData[fieldName] = this.extractField(element, config);
    }

    return rawData;
  }

  /**
   * Extracts a single field from the DOM element
   */
  private extractField(
    element: Element,
    config: FieldExtractionConfig
  ): string | null {
    try {
      const targetElement = element.querySelector(config.selector);
      if (!targetElement) {
        return null;
      }

      let value: string | null;

      if (config.attribute) {
        value = targetElement.getAttribute(config.attribute);
      } else {
        value = targetElement.textContent?.trim() || null;
      }

      // Apply transformation if provided
      if (value && config.transform) {
        value = config.transform(value);
      }

      return value;
    } catch (error) {
      console.warn(`Failed to extract field ${config.selector}:`, error);
      return null;
    }
  }
}
