import { ScraperConfig } from "types/config.js";

/**
 * Default configuration for the Barcelona events scraper
 */
export const DEFAULT_CONFIG: ScraperConfig = {
  url: "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
  headless: false,
  maxClicks: 20,
  timeout: 60000,
  viewport: {
    width: 1280,
    height: 800,
  },
};

/**
 * Browser configuration options
 */
export const BROWSER_CONFIG = {
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
};

/**
 * CSS selectors used by the scraper
 */
export const SELECTORS = {
  eventItem: "li.ajuntament-guia-item",
  verMasButton: 'button[data-api*="show_more"]',
  image: "img",
  titleLink: "a.ajuntament-guia-item-name",
  excerpt: "p.ajuntament-guia-item-excerpt",
  category: "strong",
  when: "li.ajuntament-guia-item-when",
  where: "li.ajuntament-guia-item-where",
  locationLink: "a",
  // Cookie consent selectors
  cookieBanner: "#cookiebanner",
  cookieAcceptAll: "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
  cookieAcceptSelection:
    "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection",
  cookieReject: "#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll",
};

/**
 * File paths for output
 */
export const OUTPUT_PATHS = {
  jsonFile: "output/barcelona_events_playwright_ts.json",
  htmlFile: "output/scraped_content_playwright_ts.html",
};
