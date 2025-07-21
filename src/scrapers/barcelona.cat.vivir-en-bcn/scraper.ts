import { chromium, Browser, Page } from "playwright";
import { JSDOM } from "jsdom";
import { EventData } from "../../types/event.js";
import { ScraperResult } from "../../types/output.js";
import { ScraperConfig } from "../../types/config.js";
import {
  DEFAULT_CONFIG,
  BROWSER_CONFIG,
  SELECTORS,
} from "./config/scraper.config";
import { extractItemData, isValidEventData } from "./data-extraction.utils";

/**
 * Barcelona Events Scraper Service
 * Handles the scraping logic using Playwright
 */
export class BarcelonaEventsScraper {
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main scraping method
   * @returns Promise with scraped events and page content
   */
  async scrapeEvents(): Promise<ScraperResult> {
    console.log("🚀 Launching browser...");

    const browser: Browser = await chromium.launch({
      headless: this.config.headless,
      args: BROWSER_CONFIG.args,
    });

    try {
      const page: Page = await browser.newPage();
      await this.setupPage(page);

      console.log(`🌐 Navigating to ${this.config.url}...`);
      await page.goto(this.config.url, {
        waitUntil: "networkidle",
        timeout: this.config.timeout,
      });

      await this.handleCookieConsent(page);
      await this.waitForInitialContent(page);
      await this.loadAllContent(page);

      const content = await page.content();
      const events = await this.extractEventsFromContent(content);

      return { events, content };
    } finally {
      await browser.close();
      console.log("🔒 Browser closed");
    }
  }

  /**
   * Sets up the page with viewport and other configurations
   */
  private async setupPage(page: Page): Promise<void> {
    await page.setViewportSize(this.config.viewport);
  }

  /**
   * Handles cookie consent dialog by accepting all cookies
   */
  private async handleCookieConsent(page: Page): Promise<void> {
    try {
      console.log("🍪 Checking for cookie consent dialog...");

      // Wait for the cookie banner to appear
      await page.waitForSelector(SELECTORS.cookieBanner, {
        timeout: 10000,
        state: "visible",
      });

      console.log("🍪 Cookie consent dialog detected");

      // Try to click "Accept All Cookies" button
      const acceptAllButton = page.locator(SELECTORS.cookieAcceptAll);
      const isVisible = await acceptAllButton.isVisible();

      if (isVisible) {
        console.log("🍪 Clicking 'Accept All Cookies' button...");
        await acceptAllButton.click();

        // Wait for the banner to disappear
        await page.waitForSelector(SELECTORS.cookieBanner, {
          state: "hidden",
          timeout: 5000,
        });

        console.log("✅ Cookie consent accepted successfully");
      } else {
        console.log("⚠️ Accept All button not visible, trying alternative...");

        // Try the accept selection button as fallback
        const acceptSelectionButton = page.locator(
          SELECTORS.cookieAcceptSelection
        );
        if (await acceptSelectionButton.isVisible()) {
          await acceptSelectionButton.click();
          console.log("✅ Cookie selection accepted");
        }
      }

      // Small delay to ensure cookies are processed
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log("ℹ️ No cookie consent dialog found or already handled");
      // Continue without error as this might not always be present
    }
  }

  /**
   * Waits for initial content to load
   */
  private async waitForInitialContent(page: Page): Promise<void> {
    await page.waitForSelector(SELECTORS.eventItem, { timeout: 30000 });
    console.log("✅ Initial content loaded");
  }

  /**
   * Loads all content by clicking "Ver más" button repeatedly
   */
  private async loadAllContent(page: Page): Promise<void> {
    let clickCount = 0;

    while (clickCount < this.config.maxClicks) {
      try {
        const verMasButton = page.locator(SELECTORS.verMasButton);
        const count = await verMasButton.count();

        if (count === 0) {
          console.log('ℹ️ No "Ver más" button found');
          break;
        }

        const isVisible = await verMasButton.isVisible();
        const isDisabled = await verMasButton.isDisabled();

        if (!isVisible || isDisabled) {
          console.log('ℹ️ "Ver más" button is not visible or disabled');
          break;
        }

        console.log(
          `🔄 Clicking "Ver más" button (click ${clickCount + 1})...`
        );
        await verMasButton.click();
        clickCount++;

        // Wait for new content to load
        await page.waitForTimeout(3000);
        await page.waitForLoadState("networkidle", { timeout: 10000 });
      } catch (error) {
        console.log(`⚠️ Error clicking "Ver más" button: ${error}`);
        break;
      }
    }

    console.log(`✅ Clicked "Ver más" button ${clickCount} times`);
  }

  /**
   * Extracts events from HTML content using JSDOM
   */
  private async extractEventsFromContent(
    content: string
  ): Promise<EventData[]> {
    console.log("📊 Extracting event data...");

    const dom = new JSDOM(content);
    const document = dom.window.document;
    const items = document.querySelectorAll(SELECTORS.eventItem);

    console.log(`📋 Found ${items.length} total items`);

    const eventsData: EventData[] = [];

    items.forEach((item, index) => {
      console.log(`🔍 Processing item ${index + 1}/${items.length}`);
      const itemData = extractItemData(item as Element);

      if (isValidEventData(itemData)) {
        eventsData.push(itemData);
      }
    });

    console.log(`✅ Successfully extracted ${eventsData.length} valid events`);
    return eventsData;
  }
}
