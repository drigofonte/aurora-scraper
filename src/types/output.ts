import { EventData } from "./event.js";

/**
 * Represents the JSON output structure
 */
export interface JsonOutput {
  total_events: number;
  scraping_date: string;
  source_url: string;
  scraping_method: string;
  events: EventData[];
}

/**
 * Represents the scraper result
 */
export interface ScraperResult {
  events: EventData[];
  content: string;
}
