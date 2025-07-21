import { DataProcessor, RawEventData } from "@/types/extraction.js";
import { EventData } from "@/types/event.js";
import { DOMExtractor } from "@/utils/extraction.utils.js";
import { BarcelonaEventTransformer } from "@/utils/transformation.utils.js";
import { EventDataValidator } from "@/utils/validation.utils.js";

/**
 * Complete data processing pipeline for Barcelona events
 */
export class BarcelonaEventProcessor
  implements DataProcessor<RawEventData, EventData>
{
  public readonly extractor: DOMExtractor;
  public readonly transformer: BarcelonaEventTransformer;
  public readonly validator: EventDataValidator;

  constructor(extractor: DOMExtractor) {
    this.extractor = extractor;
    this.transformer = new BarcelonaEventTransformer();
    this.validator = new EventDataValidator();
  }

  /**
   * Processes a DOM element through the complete pipeline
   */
  process(element: Element): EventData | null {
    try {
      // Step 1: Extract raw data
      const rawData = this.extractor.extract(element);

      // Step 2: Transform raw data
      const transformedData = this.transformer.transform(rawData);

      // Step 3: Validate transformed data
      if (!this.validator.validate(transformedData)) {
        const errors = this.validator.getValidationErrors(transformedData);
        console.warn("Event validation failed:", errors);
        return null;
      }

      return transformedData;
    } catch (error) {
      console.error("Error processing event data:", error);
      return null;
    }
  }

  /**
   * Processes multiple DOM elements
   */
  processMany(elements: Element[]): EventData[] {
    const results: EventData[] = [];

    elements.forEach((element, index) => {
      console.log(`🔍 Processing item ${index + 1}/${elements.length}`);
      const processedData = this.process(element);

      if (processedData) {
        results.push(processedData);
      }
    });

    console.log(
      `✅ Successfully processed ${results.length} valid events out of ${elements.length} total items`
    );
    return results;
  }
}
