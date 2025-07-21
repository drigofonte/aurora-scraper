import { ExtractionFieldMap } from "types/extraction.js";
import { SELECTORS } from "./scraper.config";

/**
 * Field mapping configuration for Barcelona events extraction
 */
export const BARCELONA_EXTRACTION_CONFIG: ExtractionFieldMap = {
  // Image data
  image_src: {
    selector: SELECTORS.image,
    attribute: "src",
  },
  image_alt: {
    selector: SELECTORS.image,
    attribute: "alt",
  },

  // Title and link
  title: {
    selector: SELECTORS.titleLink,
    required: true,
  },
  link: {
    selector: SELECTORS.titleLink,
    attribute: "href",
  },

  // Description and category
  description: {
    selector: SELECTORS.excerpt,
  },
  category_bold: {
    selector: `${SELECTORS.excerpt} ${SELECTORS.category}`,
  },

  // Date information
  when_raw: {
    selector: SELECTORS.when,
  },

  // Location information
  where_raw: {
    selector: SELECTORS.where,
  },
  location_link: {
    selector: `${SELECTORS.where} ${SELECTORS.locationLink}`,
    attribute: "href",
  },
};
