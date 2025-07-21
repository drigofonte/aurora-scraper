import { DataTransformer, RawEventData } from "types/extraction.js";
import { EventData } from "types/event.js";

/**
 * Transforms raw Barcelona event data into structured EventData
 */
export class BarcelonaEventTransformer
  implements DataTransformer<RawEventData, EventData>
{
  /**
   * Transforms raw event data into structured EventData
   */
  transform(rawData: RawEventData): EventData {
    const eventData: EventData = {};

    // Transform image data
    if (rawData.image_src) {
      eventData.image = rawData.image_src;
    }
    if (rawData.image_alt) {
      eventData.image_alt = rawData.image_alt;
    }

    // Transform title and link
    if (rawData.title) {
      eventData.title = rawData.title;
    }
    if (rawData.link) {
      eventData.link = rawData.link;
    }

    // Transform description and extract category
    if (rawData.description) {
      eventData.description = rawData.description;

      // Extract category from description if it contains bold text
      if (rawData.category_bold) {
        eventData.category = rawData.category_bold;
      }
    }

    // Transform when (dates) - remove Spanish label
    if (rawData.when_raw) {
      eventData.when = this.cleanDateString(rawData.when_raw);
    }

    // Transform where (location) - remove Spanish label
    if (rawData.where_raw) {
      eventData.where = this.cleanLocationString(rawData.where_raw);
    }
    if (rawData.location_link) {
      eventData.location_link = rawData.location_link;
    }

    return eventData;
  }

  /**
   * Cleans date string by removing Spanish labels
   */
  private cleanDateString(dateString: string): string {
    return dateString.replace("Cuándo:", "").trim();
  }

  /**
   * Cleans location string by removing Spanish labels
   */
  private cleanLocationString(locationString: string): string {
    return locationString.replace("Dónde:", "").trim();
  }
}
