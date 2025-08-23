import { BarcelonaEventsScraper } from "./scrapers/barcelona.cat.vivir-en-bcn/scraper.js";
import type { JsonOutput } from "@/types/output.js";
import { OUTPUT_PATHS } from "./scrapers/barcelona.cat.vivir-en-bcn/config/scraper.config.js";
import { saveJsonFile, saveHtmlFile, ensureDirectoryExists } from "@/io/file.utils.js";
import { formatScrapingDate } from "@/utils/common.utils.js";
import { getConfig } from "@/config/environment.config.js";
import { getLogger, parseLogLevel } from "@/utils/logger.utils.js";
import { BrowserError } from "@/types/errors.js";

const config = getConfig();
const logger = getLogger("App", parseLogLevel(config.logging.level));

/**
 * Main application class
 */
export class App {
  private readonly scraper: BarcelonaEventsScraper;

  public constructor() {
    this.scraper = new BarcelonaEventsScraper();
  }

  /**
   * Runs the scraping application
   */
  public async run(): Promise<void> {
    logger.info("Starting Barcelona Events Scraper");

    try {
      // Ensure output directory exists
      await ensureDirectoryExists(config.output.directory);

      // Run the scraper
      const { events, content } = await this.scraper.scrapeEvents();

      // Create JSON output
      const jsonOutput: JsonOutput = {
        total_events: events.length,
        scraping_date: formatScrapingDate(),
        source_url: config.scraper.url,
        scraping_method: "playwright-typescript",
        events: events,
      };

      // Save files
      await Promise.all([
        saveJsonFile(OUTPUT_PATHS.jsonFile, jsonOutput),
        saveHtmlFile(OUTPUT_PATHS.htmlFile, content),
      ]);

      logger.info("Scraping completed successfully", {
        eventCount: events.length,
        jsonFile: OUTPUT_PATHS.jsonFile,
        htmlFile: OUTPUT_PATHS.htmlFile,
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error("Error during scraping", error);
        throw new BrowserError("Scraping process failed", error);
      }
      throw error;
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
// In ES modules, we check if the file is the main entry point using import.meta
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    logger.error("Unhandled error", error as Error);
    process.exit(1);
  });
}
