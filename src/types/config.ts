/**
 * Configuration options for the scraper
 */
export interface ScraperConfig {
  readonly url: string;
  readonly headless: boolean;
  readonly maxClicks: number;
  readonly timeout: number;
  readonly viewport: {
    readonly width: number;
    readonly height: number;
  };
}

/**
 * Configuration for individual scraper targets
 */
export interface ScraperTargetConfig {
  readonly name: string;
  readonly urls: readonly string[];
  readonly maxConcurrency?: number;
  readonly delay?: {
    readonly min: number;
    readonly max: number;
  };
  readonly retries?: {
    readonly count: number;
    readonly delay: number;
  };
  readonly timeout?: {
    readonly page: number;
    readonly navigation: number;
  };
}

/**
 * Configuration for data extraction
 */
export interface ExtractionConfig {
  readonly selectors: {
    readonly container: string;
    readonly title: string;
    readonly date: string;
    readonly link: string;
    readonly description?: string;
    readonly image?: string;
    readonly price?: string;
    readonly location?: string;
    readonly category?: string;
  };
  readonly transformers?: {
    readonly date?: string; // Date format pattern
    readonly price?: string; // Price extraction pattern
  };
  readonly output: {
    readonly file: string;
    readonly format: "json" | "csv" | "yaml";
    readonly encoding?: string;
  };
}
