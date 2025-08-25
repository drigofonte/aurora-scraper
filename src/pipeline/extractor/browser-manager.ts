/**
 * Browser manager for handling Playwright browser automation
 */

import type { Browser, BrowserContext, Page, LaunchOptions } from "playwright";
import { chromium, firefox, webkit } from "playwright";
import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import type { BrowserConfig, ExtractorError } from "../types.js";
import { getLogger } from "../../utils/logger.utils.js";

const logger = getLogger("BrowserManager");

/**
 * Browser types supported by the extractor
 */
export type BrowserType = "chromium" | "firefox" | "webkit";

/**
 * Browser manager configuration
 */
export interface BrowserManagerConfig extends BrowserConfig {
  readonly browserType?: BrowserType;
  readonly contextOptions?: Record<string, unknown>;
  readonly launchOptions?: LaunchOptions;
}

/**
 * Browser manager for handling browser lifecycle and operations
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  constructor(private readonly config: BrowserManagerConfig) {}

  /**
   * Launch browser and create context
   */
  async launch(): Promise<Result<void, ExtractorError>> {
    try {
      logger.debug("Launching browser", {
        type: this.config.browserType,
        headless: this.config.headless,
      });

      const launchOptions: LaunchOptions = {
        headless: this.config.headless,
        ...(this.config.args && { args: [...this.config.args] }),
        ...this.config.launchOptions,
      };

      // Select browser based on type
      const browserType = this.config.browserType ?? "chromium";
      switch (browserType) {
        case "chromium":
          this.browser = await chromium.launch(launchOptions);
          break;
        case "firefox":
          this.browser = await firefox.launch(launchOptions);
          break;
        case "webkit":
          this.browser = await webkit.launch(launchOptions);
          break;
        default:
          throw new Error(`Unsupported browser type: ${browserType}`);
      }

      // Create browser context
      const contextOptions = {
        viewport: this.config.viewport,
        ...(this.config.userAgent && { userAgent: this.config.userAgent }),
        ...(this.config.locale && { locale: this.config.locale }),
        ...this.config.contextOptions,
      };

      this.context = await this.browser.newContext(contextOptions);

      logger.debug("Browser launched successfully");
      return ok(undefined);
    } catch (error) {
      const extractorError: ExtractorError = {
        code: "BROWSER_LAUNCH_FAILED",
        message: `Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`,
        details: { browserType: this.config.browserType, error },
      };

      logger.error("Browser launch failed", undefined, { extractorError });
      return err(extractorError);
    }
  }

  /**
   * Create a new page
   */
  async createPage(): Promise<Result<Page, ExtractorError>> {
    if (!this.context) {
      const error: ExtractorError = {
        code: "BROWSER_LAUNCH_FAILED",
        message: "Browser context not available. Call launch() first.",
        details: {},
      };
      return err(error);
    }

    try {
      this.page = await this.context.newPage();
      logger.debug("Page created successfully");
      return ok(this.page);
    } catch (error) {
      const extractorError: ExtractorError = {
        code: "PAGE_LOAD_FAILED",
        message: `Failed to create page: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
      };

      logger.error("Page creation failed", undefined, { extractorError });
      return err(extractorError);
    }
  }

  /**
   * Get the current page
   */
  getCurrentPage(): Page | null {
    return this.page;
  }

  /**
   * Close the browser and clean up resources
   */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      logger.debug("Browser closed successfully");
    } catch (error) {
      logger.warn("Error during browser cleanup", { error });
    }
  }

  /**
   * Check if browser is running
   */
  isRunning(): boolean {
    return this.browser !== null && this.context !== null;
  }
}
