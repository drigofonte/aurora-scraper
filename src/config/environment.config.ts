import type { ScraperConfig } from "@/types/config.js";
import { ConfigurationError } from "@/types/errors.js";

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  readonly scraper: ScraperConfig;
  readonly browser: {
    readonly headless: boolean;
    readonly timeout: number;
    readonly width: number;
    readonly height: number;
  };
  readonly output: {
    readonly directory: string;
    readonly jsonFileName: string;
    readonly htmlFileName: string;
  };
  readonly logging: {
    readonly level: "debug" | "info" | "warn" | "error";
    readonly enableFileLogging: boolean;
  };
}

/**
 * Default environment configuration
 */
const DEFAULT_ENVIRONMENT_CONFIG: EnvironmentConfig = {
  scraper: {
    url: "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
    headless: false,
    maxClicks: 20,
    timeout: 60000,
    viewport: {
      width: 1280,
      height: 800,
    },
  },
  browser: {
    headless: false,
    timeout: 60000,
    width: 1280,
    height: 800,
  },
  output: {
    directory: "output",
    jsonFileName: "barcelona_events_playwright_ts.json",
    htmlFileName: "scraped_content_playwright_ts.html",
  },
  logging: {
    level: "info",
    enableFileLogging: false,
  },
} as const;

/**
 * Validates and parses environment variables into configuration
 */
export class EnvironmentConfigProvider {
  private readonly config: EnvironmentConfig;

  public constructor() {
    this.config = this.loadConfiguration();
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  private loadConfiguration(): EnvironmentConfig {
    const config: EnvironmentConfig = {
      scraper: {
        url: this.getStringEnv("SCRAPER_URL", DEFAULT_ENVIRONMENT_CONFIG.scraper.url),
        headless: this.getBooleanEnv(
          "SCRAPER_HEADLESS",
          DEFAULT_ENVIRONMENT_CONFIG.scraper.headless
        ),
        maxClicks: this.getNumberEnv(
          "SCRAPER_MAX_CLICKS",
          DEFAULT_ENVIRONMENT_CONFIG.scraper.maxClicks
        ),
        timeout: this.getNumberEnv("SCRAPER_TIMEOUT", DEFAULT_ENVIRONMENT_CONFIG.scraper.timeout),
        viewport: {
          width: this.getNumberEnv(
            "BROWSER_WIDTH",
            DEFAULT_ENVIRONMENT_CONFIG.scraper.viewport.width
          ),
          height: this.getNumberEnv(
            "BROWSER_HEIGHT",
            DEFAULT_ENVIRONMENT_CONFIG.scraper.viewport.height
          ),
        },
      },
      browser: {
        headless: this.getBooleanEnv(
          "SCRAPER_HEADLESS",
          DEFAULT_ENVIRONMENT_CONFIG.browser.headless
        ),
        timeout: this.getNumberEnv("SCRAPER_TIMEOUT", DEFAULT_ENVIRONMENT_CONFIG.browser.timeout),
        width: this.getNumberEnv("BROWSER_WIDTH", DEFAULT_ENVIRONMENT_CONFIG.browser.width),
        height: this.getNumberEnv("BROWSER_HEIGHT", DEFAULT_ENVIRONMENT_CONFIG.browser.height),
      },
      output: {
        directory: this.getStringEnv("OUTPUT_DIR", DEFAULT_ENVIRONMENT_CONFIG.output.directory),
        jsonFileName: this.getStringEnv(
          "OUTPUT_JSON_FILE",
          DEFAULT_ENVIRONMENT_CONFIG.output.jsonFileName
        ),
        htmlFileName: this.getStringEnv(
          "OUTPUT_HTML_FILE",
          DEFAULT_ENVIRONMENT_CONFIG.output.htmlFileName
        ),
      },
      logging: {
        level: this.getEnumEnv(
          "LOG_LEVEL",
          ["debug", "info", "warn", "error"],
          DEFAULT_ENVIRONMENT_CONFIG.logging.level
        ),
        enableFileLogging: this.getBooleanEnv(
          "LOG_TO_FILE",
          DEFAULT_ENVIRONMENT_CONFIG.logging.enableFileLogging
        ),
      },
    };

    this.validateConfiguration(config);
    return config;
  }

  private getStringEnv(key: string, defaultValue: string): string {
    const value = process.env[key];
    return value !== undefined && value.trim() !== "" ? value.trim() : defaultValue;
  }

  private getNumberEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined || value.trim() === "") {
      return defaultValue;
    }

    const numValue = Number(value);
    if (Number.isNaN(numValue)) {
      throw new ConfigurationError(key, value, "number");
    }

    return numValue;
  }

  private getBooleanEnv(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined || value.trim() === "") {
      return defaultValue;
    }

    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === "true" || lowerValue === "1") {
      return true;
    }
    if (lowerValue === "false" || lowerValue === "0") {
      return false;
    }

    throw new ConfigurationError(key, value, "boolean (true/false or 1/0)");
  }

  private getEnumEnv<T extends string>(
    key: string,
    allowedValues: readonly T[],
    defaultValue: T
  ): T {
    const value = process.env[key];
    if (value === undefined || value.trim() === "") {
      return defaultValue;
    }

    const trimmedValue = value.trim() as T;
    if (!allowedValues.includes(trimmedValue)) {
      throw new ConfigurationError(key, value, `one of: ${allowedValues.join(", ")}`);
    }

    return trimmedValue;
  }

  private validateConfiguration(config: EnvironmentConfig): void {
    // Validate URL
    try {
      new URL(config.scraper.url);
    } catch {
      throw new ConfigurationError("scraper.url", config.scraper.url, "valid URL");
    }

    // Validate positive numbers
    if (config.scraper.maxClicks <= 0) {
      throw new ConfigurationError(
        "scraper.maxClicks",
        config.scraper.maxClicks,
        "positive number"
      );
    }

    if (config.scraper.timeout <= 0) {
      throw new ConfigurationError("scraper.timeout", config.scraper.timeout, "positive number");
    }

    if (config.scraper.viewport.width <= 0) {
      throw new ConfigurationError(
        "scraper.viewport.width",
        config.scraper.viewport.width,
        "positive number"
      );
    }

    if (config.scraper.viewport.height <= 0) {
      throw new ConfigurationError(
        "scraper.viewport.height",
        config.scraper.viewport.height,
        "positive number"
      );
    }
  }
}

/**
 * Global configuration instance
 */
let configInstance: EnvironmentConfigProvider | undefined;

/**
 * Gets the global configuration instance
 */
export function getConfig(): EnvironmentConfig {
  if (configInstance === undefined) {
    configInstance = new EnvironmentConfigProvider();
  }
  return configInstance.getConfig();
}

/**
 * Resets the global configuration instance (useful for testing)
 */
export function resetConfig(): void {
  configInstance = undefined;
}
