import { EventData } from "../types/event.js";
import { SELECTORS } from "../scrapers/barcelona.cat.vivir-en-bcn/config/scraper.config";

/**
 * Extracts event data from a DOM element
 * @param item - The DOM element representing an event
 * @returns EventData object with extracted information
 */
export function extractItemData(item: Element): EventData {
  const data: EventData = {};

  // Extract image
  const imgElement = item.querySelector(SELECTORS.image);
  if (imgElement) {
    data.image = imgElement.getAttribute("src") || "";
    data.image_alt = imgElement.getAttribute("alt") || "";
  }

  // Extract title and link
  const titleLink = item.querySelector(SELECTORS.titleLink);
  if (titleLink) {
    data.title = titleLink.textContent?.trim() || "";
    data.link = titleLink.getAttribute("href") || "";
  }

  // Extract description
  const excerpt = item.querySelector(SELECTORS.excerpt);
  if (excerpt) {
    data.description = excerpt.textContent?.trim() || "";
    // Extract category from bold text
    const boldText = excerpt.querySelector(SELECTORS.category);
    if (boldText) {
      data.category = boldText.textContent?.trim() || "";
    }
  }

  // Extract when (dates)
  const whenElement = item.querySelector(SELECTORS.when);
  if (whenElement) {
    const whenText = whenElement.textContent?.trim() || "";
    // Remove the "Cuándo:" label
    data.when = whenText.replace("Cuándo:", "").trim();
  }

  // Extract where (location)
  const whereElement = item.querySelector(SELECTORS.where);
  if (whereElement) {
    const whereText = whereElement.textContent?.trim() || "";
    // Remove the "Dónde:" label
    const locationText = whereText.replace("Dónde:", "").trim();
    data.where = locationText;

    // Extract location link if available
    const locationLink = whereElement.querySelector(SELECTORS.locationLink);
    if (locationLink) {
      data.location_link = locationLink.getAttribute("href") || "";
    }
  }

  return data;
}

/**
 * Formats the current date for the JSON output
 * @returns Formatted date string
 */
export function formatScrapingDate(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Validates if an event data object has meaningful content
 * @param eventData - The event data to validate
 * @returns True if the event has meaningful content
 */
export function isValidEventData(eventData: EventData): boolean {
  return Object.keys(eventData).length > 0 && Boolean(eventData.title?.trim());
}
