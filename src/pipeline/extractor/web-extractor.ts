/**
 * Web extractor implementation using Playwright for browser automation
 */

import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import type { Extractor, ExtractorConfig, ExtractorError } from "../types.js";
import { BrowserManager, type BrowserManagerConfig } from "./browser-manager.js";
import { NavigationEngine } from "./navigation-engine.js";
import { getLogger } from "../../utils/logger.utils.js";

const logger = getLogger("WebExtractor");

/**
 * Web extractor for extracting HTML content from web pages using Playwright
 */
export class WebExtractor implements Extractor {
  private browserManager: BrowserManager | null = null;
  private navigationEngine: NavigationEngine | null = null;

  /**
   * Extract HTML content from a web page
   */
  async extract(config: ExtractorConfig): Promise<Result<string, ExtractorError>> {
    logger.info("Starting web extraction", { url: config.url });

    try {
      // Initialize browser manager
      const browserConfig: BrowserManagerConfig = {
        ...config.browserConfig,
        browserType: "chromium", // Default to chromium
      };

      this.browserManager = new BrowserManager(browserConfig);
      this.navigationEngine = new NavigationEngine(config.retries);

      // Launch browser
      const launchResult = await this.browserManager.launch();
      if (launchResult.isErr) {
        return launchResult;
      }

      // Create page
      const pageResult = await this.browserManager.createPage();
      if (pageResult.isErr) {
        return err(pageResult.error);
      }

      const page = pageResult.value;

      // Navigate to URL
      logger.debug("Navigating to URL", { url: config.url });
      await page.goto(config.url, { timeout: config.timeout });

      // Execute navigation steps
      if (config.navigationSteps.length > 0) {
        logger.debug("Executing navigation steps", {
          stepCount: config.navigationSteps.length,
        });

        const navigationResult = await this.navigationEngine.executeSteps(
          page,
          config.navigationSteps
        );

        if (navigationResult.isErr) {
          return navigationResult;
        }
      }

      // Extract HTML content
      logger.debug("Extracting HTML content");
      const html = await page.content();

      logger.info("Web extraction completed successfully", {
        htmlLength: html.length,
        url: config.url,
      });

      return ok(html);
    } catch (error) {
      const extractorError: ExtractorError = {
        code: "PAGE_LOAD_FAILED",
        message: `Web extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          url: config.url,
          error,
        },
      };

      logger.error("Web extraction failed", undefined, { extractorError });
      return err(extractorError);
    } finally {
      // Clean up browser resources
      await this.cleanup();
    }
  }

  /**
   * Clean up browser resources
   */
  private async cleanup(): Promise<void> {
    if (this.browserManager) {
      await this.browserManager.close();
      this.browserManager = null;
    }
    this.navigationEngine = null;
  }
}

/**
 * Factory function to create a new WebExtractor instance
 */
export function createWebExtractor(): WebExtractor {
  return new WebExtractor();
}
