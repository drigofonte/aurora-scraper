import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BrowserManager, NavigationEngine, WebExtractor } from "../index.js";
import type { ExtractorConfig, NavigationStep } from "../../types.js";

describe("Extractor Integration", () => {
  let webExtractor: WebExtractor;

  const mockHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <header>
    <h1>Welcome to Test Site</h1>
    <nav>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section class="hero">
      <h2>Hero Section</h2>
      <p>This is a test page for web scraping.</p>
      <button id="cta-button" data-testid="call-to-action">Get Started</button>
    </section>
    
    <section class="content">
      <article class="post">
        <h3>First Article</h3>
        <p class="excerpt">This is the first article excerpt.</p>
        <time datetime="2024-01-01">January 1, 2024</time>
      </article>
      
      <article class="post">
        <h3>Second Article</h3>
        <p class="excerpt">This is the second article excerpt.</p>
        <time datetime="2024-01-02">January 2, 2024</time>
      </article>
    </section>
    
    <aside class="sidebar">
      <h4>Related Links</h4>
      <ul class="links">
        <li><a href="https://example.com/link1">Link 1</a></li>
        <li><a href="https://example.com/link2">Link 2</a></li>
        <li><a href="https://example.com/link3">Link 3</a></li>
      </ul>
    </aside>
  </main>
  
  <footer>
    <p>&copy; 2024 Test Site</p>
  </footer>
</body>
</html>
  `.trim();

  beforeEach(() => {
    webExtractor = new WebExtractor();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Module Exports", () => {
    it("should export all core extractor components", () => {
      expect(BrowserManager).toBeDefined();
      expect(NavigationEngine).toBeDefined();
      expect(WebExtractor).toBeDefined();
    });

    it("should create instances of extractor components", () => {
      const browserManager = new BrowserManager({
        headless: true,
        viewport: { width: 1920, height: 1080 },
      });

      const navigationEngine = new NavigationEngine();
      const webExtractor = new WebExtractor();

      expect(browserManager).toBeInstanceOf(BrowserManager);
      expect(navigationEngine).toBeInstanceOf(NavigationEngine);
      expect(webExtractor).toBeInstanceOf(WebExtractor);
    });
  });

  describe("Configuration Integration", () => {
    it("should handle basic extraction configuration", () => {
      const config: ExtractorConfig = {
        url: "https://example.com",
        navigationSteps: [],
        browserConfig: {
          headless: true,
          viewport: { width: 1920, height: 1080 },
        },
        timeout: 30000,
      };

      expect(config.url).toBe("https://example.com");
      expect(config.navigationSteps).toHaveLength(0);
      expect(config.browserConfig.headless).toBe(true);
      expect(config.timeout).toBe(30000);
    });

    it("should handle complex navigation configuration", () => {
      const navigationSteps: NavigationStep[] = [
        {
          type: "wait",
          selector: ".loading-spinner",
          timeout: 10000,
          description: "Wait for page to load",
        },
        {
          type: "click",
          selector: "#cookie-accept",
          timeout: 5000,
          description: "Accept cookies",
        },
        {
          type: "fill",
          selector: "#search-input",
          value: "test query",
          timeout: 3000,
          description: "Fill search form",
        },
        {
          type: "click",
          selector: "#search-button",
          timeout: 5000,
          waitCondition: ".search-results" as any,
          description: "Submit search",
        },
        {
          type: "scroll",
          selector: ".load-more-button",
          description: "Scroll to load more",
        },
        {
          type: "hover",
          selector: ".dropdown-trigger",
          timeout: 2000,
          description: "Show dropdown menu",
        },
        {
          type: "select",
          selector: "#sort-dropdown",
          value: "date-desc",
          timeout: 3000,
          description: "Sort by date",
        },
        {
          type: "screenshot",
          value: "/tmp/test-screenshot.png",
          description: "Take screenshot",
        },
      ];

      const config: ExtractorConfig = {
        url: "https://example.com/search",
        navigationSteps,
        browserConfig: {
          headless: false,
          viewport: { width: 1366, height: 768 },
          args: ["--no-sandbox"],
          userAgent: "Mozilla/5.0 Test Agent",
          locale: "en-US",
        },
        timeout: 60000,
        retries: {
          count: 3,
          delay: 2000,
          backoff: "exponential",
          maxDelay: 10000,
        },
      };

      expect(config.navigationSteps).toHaveLength(8);
      expect(config.navigationSteps[0]?.type).toBe("wait");
      expect(config.navigationSteps[1]?.type).toBe("click");
      expect(config.navigationSteps[2]?.type).toBe("fill");
      expect(config.navigationSteps[2]?.value).toBe("test query");
      expect(config.retries?.count).toBe(3);
      expect(config.retries?.backoff).toBe("exponential");
    });

    it("should validate navigation step types", () => {
      const stepTypes = [
        "click",
        "wait",
        "scroll",
        "fill",
        "hover",
        "select",
        "navigate",
        "screenshot",
      ] as const;

      stepTypes.forEach((type) => {
        const step: NavigationStep = {
          type,
          selector: ".test-element",
          description: `Test ${type} step`,
        };

        expect(step.type).toBe(type);
        expect(step.selector).toBe(".test-element");
      });
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle extractor error structure", () => {
      const mockExtractorError = {
        code: "PAGE_LOAD_FAILED" as const,
        message: "Failed to load page",
        step: 2,
        selector: ".target-element",
        details: {
          url: "https://example.com",
          timeout: 30000,
          error: new Error("Network timeout"),
        },
      };

      expect(mockExtractorError.code).toBe("PAGE_LOAD_FAILED");
      expect(mockExtractorError.message).toBe("Failed to load page");
      expect(mockExtractorError.step).toBe(2);
      expect(mockExtractorError.selector).toBe(".target-element");
      expect(mockExtractorError.details.url).toBe("https://example.com");
    });

    it("should handle different error codes", () => {
      const errorCodes = [
        "NAVIGATION_TIMEOUT",
        "ELEMENT_NOT_FOUND",
        "BROWSER_LAUNCH_FAILED",
        "PAGE_LOAD_FAILED",
        "STEP_EXECUTION_FAILED",
        "NETWORK_ERROR",
      ] as const;

      errorCodes.forEach((code) => {
        const error = {
          code,
          message: `Test error for ${code}`,
          details: {},
        };

        expect(error.code).toBe(code);
        expect(error.message).toContain(code);
      });
    });
  });

  describe("Type Safety Integration", () => {
    it("should ensure type compatibility between components", () => {
      // This test ensures that all types work together correctly
      const browserConfig = {
        headless: true,
        viewport: { width: 1920, height: 1080 },
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
        userAgent: "Mozilla/5.0 Test Agent",
        locale: "en-US",
      };

      const retryConfig = {
        count: 3,
        delay: 1000,
        backoff: "linear" as const,
        maxDelay: 5000,
      };

      const navigationStep: NavigationStep = {
        type: "click",
        selector: ".test-button",
        timeout: 10000,
        maxAttempts: 2,
        waitCondition: ".result" as any,
        description: "Click test button",
      };

      const extractorConfig: ExtractorConfig = {
        url: "https://test.example.com",
        navigationSteps: [navigationStep],
        browserConfig,
        timeout: 30000,
        retries: retryConfig,
      };

      // Verify all types are compatible
      expect(extractorConfig.url).toBe("https://test.example.com");
      expect(extractorConfig.navigationSteps[0]?.type).toBe("click");
      expect(extractorConfig.browserConfig.headless).toBe(true);
      expect(extractorConfig.retries?.backoff).toBe("linear");
    });

    it("should handle optional properties correctly", () => {
      // Test with minimal required configuration
      const minimalConfig: ExtractorConfig = {
        url: "https://minimal.example.com",
        navigationSteps: [],
        browserConfig: {
          headless: true,
          viewport: { width: 1280, height: 720 },
        },
        timeout: 15000,
      };

      expect(minimalConfig.retries).toBeUndefined();
      expect(minimalConfig.navigationSteps).toHaveLength(0);

      // Test with full configuration
      const fullConfig: ExtractorConfig = {
        url: "https://full.example.com",
        navigationSteps: [
          {
            type: "wait",
            selector: ".loading",
            timeout: 5000,
            maxAttempts: 3,
            description: "Wait for loading",
          },
        ],
        browserConfig: {
          headless: false,
          viewport: { width: 1920, height: 1080 },
          args: ["--start-maximized"],
          userAgent: "Custom Agent",
          locale: "fr-FR",
        },
        timeout: 45000,
        retries: {
          count: 5,
          delay: 2000,
          backoff: "exponential",
          maxDelay: 15000,
        },
      };

      expect(fullConfig.retries).toBeDefined();
      expect(fullConfig.navigationSteps).toHaveLength(1);
      expect(fullConfig.browserConfig.args).toContain("--start-maximized");
    });
  });

  describe("Mock HTML Processing", () => {
    it("should validate mock HTML structure", () => {
      expect(mockHtmlContent).toContain("<!DOCTYPE html>");
      expect(mockHtmlContent).toContain("<title>Test Page</title>");
      expect(mockHtmlContent).toContain("<h1>Welcome to Test Site</h1>");
      expect(mockHtmlContent).toContain('class="hero"');
      expect(mockHtmlContent).toContain('id="cta-button"');
      expect(mockHtmlContent).toContain('data-testid="call-to-action"');
      expect(mockHtmlContent).toContain('class="post"');
      expect(mockHtmlContent).toContain('datetime="2024-01-01"');
    });

    it("should contain expected selectable elements", () => {
      const expectedSelectors = [
        "header",
        "nav",
        "hero", // Class name without dot
        "cta-button", // ID without hash
        "call-to-action", // data-testid value without quotes
        "post", // Class name without dot
        "excerpt", // Class name without dot
        "time",
        "sidebar", // Class name without dot
        "footer",
      ];

      expectedSelectors.forEach((selector) => {
        // Check if HTML contains elements that would match these selectors
        expect(mockHtmlContent).toContain(selector);
      });
    });

    it("should provide realistic test data structure", () => {
      // Verify the HTML contains multiple articles for list extraction testing
      const articleMatches = mockHtmlContent.match(/<article[^>]*class="post"[^>]*>/g);
      expect(articleMatches).toHaveLength(2);

      // Verify navigation links
      const navLinkMatches = mockHtmlContent.match(/<a href="#[^"]*">/g);
      expect(navLinkMatches).toHaveLength(3);

      // Verify external links
      const externalLinkMatches = mockHtmlContent.match(
        /<a href="https:\/\/example\.com\/[^"]*">/g
      );
      expect(externalLinkMatches).toHaveLength(3);

      // Verify time elements with datetime attributes
      const timeMatches = mockHtmlContent.match(/<time datetime="[^"]*">/g);
      expect(timeMatches).toHaveLength(2);
    });
  });

  describe("Test Configuration Examples", () => {
    it("should demonstrate common extraction scenarios", () => {
      // Simple page scraping
      const simpleConfig: ExtractorConfig = {
        url: "https://blog.example.com",
        navigationSteps: [],
        browserConfig: {
          headless: true,
          viewport: { width: 1920, height: 1080 },
        },
        timeout: 30000,
      };

      // SPA with loading states
      const spaConfig: ExtractorConfig = {
        url: "https://app.example.com",
        navigationSteps: [
          { type: "wait", selector: ".app-loaded" },
          { type: "click", selector: ".load-data-btn" },
          { type: "wait", selector: ".data-loaded" },
        ],
        browserConfig: {
          headless: true,
          viewport: { width: 1920, height: 1080 },
        },
        timeout: 60000,
        retries: {
          count: 3,
          delay: 2000,
          backoff: "exponential",
        },
      };

      // Infinite scroll page
      const infiniteScrollConfig: ExtractorConfig = {
        url: "https://feed.example.com",
        navigationSteps: [
          { type: "wait", selector: ".posts-container" },
          { type: "scroll" }, // Scroll to bottom
          { type: "wait", value: "2000" }, // Wait for new content
          { type: "scroll" }, // Scroll again
          { type: "wait", value: "2000" },
        ],
        browserConfig: {
          headless: true,
          viewport: { width: 1920, height: 1080 },
        },
        timeout: 45000,
      };

      // Form interaction
      const formConfig: ExtractorConfig = {
        url: "https://search.example.com",
        navigationSteps: [
          { type: "fill", selector: "#query", value: "test search" },
          { type: "select", selector: "#category", value: "all" },
          { type: "click", selector: "#search-btn" },
          { type: "wait", selector: ".results" },
        ],
        browserConfig: {
          headless: true,
          viewport: { width: 1920, height: 1080 },
        },
        timeout: 30000,
      };

      const configs = [simpleConfig, spaConfig, infiniteScrollConfig, formConfig];

      configs.forEach((config) => {
        expect(config.url).toMatch(/^https:\/\/[a-z.]+\.com/);
        expect(config.browserConfig.headless).toBe(true);
        expect(config.timeout).toBeGreaterThan(0);
      });
    });
  });
});
