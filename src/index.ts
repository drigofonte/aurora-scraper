import { BarcelonaEventsScraper } from "./scrapers/barcelona.cat.vivir-en-bcn/scraper";
import { JsonOutput } from "./types/output.js";
import { OUTPUT_PATHS } from "./scrapers/barcelona.cat.vivir-en-bcn/config/scraper.config";
import {
  saveJsonFile,
  saveHtmlFile,
  ensureDirectoryExists,
} from "./io/file.utils";
import { formatScrapingDate } from "./utils/common.utils";
import * as path from "path";

/**
 * Main application class
 */
export class App {
  private scraper: BarcelonaEventsScraper;

  constructor() {
    this.scraper = new BarcelonaEventsScraper();
  }

  /**
   * Runs the scraping application
   */
  async run(): Promise<void> {
    console.log("🎯 Starting Barcelona Events Scraper...");

    try {
      // Ensure output directory exists
      await ensureDirectoryExists("output");

      // Run the scraper
      const { events, content } = await this.scraper.scrapeEvents();

      // Create JSON output
      const jsonOutput: JsonOutput = {
        total_events: events.length,
        scraping_date: formatScrapingDate(),
        source_url:
          "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
        scraping_method: "playwright-typescript",
        events: events,
      };

      // Save files
      await Promise.all([
        saveJsonFile(OUTPUT_PATHS.jsonFile, jsonOutput),
        saveHtmlFile(OUTPUT_PATHS.htmlFile, content),
      ]);

      console.log(`🎉 Successfully extracted ${events.length} events`);
      console.log("📁 Data saved to:");
      console.log(`   - ${OUTPUT_PATHS.jsonFile}`);
      console.log(`   - ${OUTPUT_PATHS.htmlFile}`);
    } catch (error) {
      console.error(`❌ Error during scraping: ${error}`);
      process.exit(1);
    }
  }
}

/**
 * Entry point
 */
async function main(): Promise<void> {
  const app = new App();
  await app.run();
}

// Run the application if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}
