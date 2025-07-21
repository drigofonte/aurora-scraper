/**
 * Configuration options for the scraper
 */
export interface ScraperConfig {
  url: string;
  headless: boolean;
  maxClicks: number;
  timeout: number;
  viewport: {
    width: number;
    height: number;
  };
}
