import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from "vitest";
import type { Page } from "playwright";
import { WebExtractor, createWebExtractor } from "../web-extractor.js";
import { BrowserManager } from "../browser-manager.js";
import { NavigationEngine } from "../navigation-engine.js";
import type { ExtractorConfig, NavigationStep, RetryConfig } from "../../types.js";

// Mock the browser manager and navigation engine
vi.mock("../browser-manager.js");
vi.mock("../navigation-engine.js");

describe("WebExtractor", () => {
  let webExtractor: WebExtractor;
  let mockBrowserManager: BrowserManager;
  let mockNavigationEngine: NavigationEngine;
  let mockPage: Page;

  const baseConfig: ExtractorConfig = {
    url: "https://example.com",
    navigationSteps: [],
    browserConfig: {
      headless: true,
      viewport: { width: 1920, height: 1080 },
    },
    timeout: 30000,
  };

  beforeEach(() => {
    // Create mock page
    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      content: vi.fn().mockResolvedValue("<html><body>Mock HTML content</body></html>"),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;

    // Create mock browser manager
    mockBrowserManager = {
      launch: vi.fn(),
      createPage: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as BrowserManager;

    // Create mock navigation engine
    mockNavigationEngine = {
      executeSteps: vi.fn(),
    } as unknown as NavigationEngine;

    // Setup constructor mocks
    (BrowserManager as any).mockImplementation(() => mockBrowserManager);
    (NavigationEngine as any).mockImplementation(() => mockNavigationEngine);

    webExtractor = new WebExtractor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Constructor and Factory", () => {
    it("should create WebExtractor instance", () => {
      expect(webExtractor).toBeInstanceOf(WebExtractor);
    });

    it("should create WebExtractor via factory function", () => {
      const extractor = createWebExtractor();
      expect(extractor).toBeInstanceOf(WebExtractor);
    });
  });

  describe("extract()", () => {
    beforeEach(() => {
      // Setup successful mocks by default
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);
      (
        mockNavigationEngine.executeSteps as MockedFunction<
          typeof mockNavigationEngine.executeSteps
        >
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
    });

    it("should extract HTML content successfully", async () => {
      const expectedHtml = "<html><body><h1>Test Page</h1></body></html>";
      (mockPage.content as MockedFunction<typeof mockPage.content>).mockResolvedValue(expectedHtml);

      const result = await webExtractor.extract(baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe(expectedHtml);
      }

      // Verify the extraction flow
      expect(BrowserManager).toHaveBeenCalledWith({
        ...baseConfig.browserConfig,
        browserType: "chromium",
      });
      expect(NavigationEngine).toHaveBeenCalledWith(baseConfig.retries);
      expect(mockBrowserManager.launch).toHaveBeenCalledTimes(1);
      expect(mockBrowserManager.createPage).toHaveBeenCalledTimes(1);
      expect(mockPage.goto).toHaveBeenCalledWith(baseConfig.url, { timeout: baseConfig.timeout });
      expect(mockPage.content).toHaveBeenCalledTimes(1);
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });

    it("should handle complex navigation steps", async () => {
      const navigationSteps: NavigationStep[] = [
        { type: "click", selector: ".cookie-accept" },
        { type: "wait", selector: ".content-loaded" },
        { type: "scroll", selector: ".load-more" },
        { type: "click", selector: ".load-more" },
      ];

      const configWithSteps: ExtractorConfig = {
        ...baseConfig,
        navigationSteps,
      };

      const result = await webExtractor.extract(configWithSteps);

      expect(result.isOk).toBe(true);
      expect(mockNavigationEngine.executeSteps).toHaveBeenCalledWith(mockPage, navigationSteps);
    });

    it("should skip navigation steps when none provided", async () => {
      const result = await webExtractor.extract(baseConfig);

      expect(result.isOk).toBe(true);
      expect(mockNavigationEngine.executeSteps).not.toHaveBeenCalled();
    });

    it("should pass retry configuration to navigation engine", async () => {
      const retryConfig: RetryConfig = {
        count: 5,
        delay: 2000,
        backoff: "exponential",
        maxDelay: 10000,
      };

      const configWithRetries: ExtractorConfig = {
        ...baseConfig,
        retries: retryConfig,
      };

      const result = await webExtractor.extract(configWithRetries);

      expect(result.isOk).toBe(true);
      expect(NavigationEngine).toHaveBeenCalledWith(retryConfig);
    });

    it("should handle custom browser configuration", async () => {
      const customBrowserConfig = {
        headless: false,
        viewport: { width: 1366, height: 768 },
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
        userAgent: "Mozilla/5.0 Custom Agent",
        locale: "es-ES",
      };

      const configWithCustomBrowser: ExtractorConfig = {
        ...baseConfig,
        browserConfig: customBrowserConfig,
      };

      const result = await webExtractor.extract(configWithCustomBrowser);

      expect(result.isOk).toBe(true);
      expect(BrowserManager).toHaveBeenCalledWith({
        ...customBrowserConfig,
        browserType: "chromium",
      });
    });

    it("should handle different timeout configurations", async () => {
      const customConfig: ExtractorConfig = {
        ...baseConfig,
        timeout: 60000,
      };

      const result = await webExtractor.extract(customConfig);

      expect(result.isOk).toBe(true);
      expect(mockPage.goto).toHaveBeenCalledWith(customConfig.url, { timeout: 60000 });
    });
  });

  describe("Error Handling", () => {
    it("should handle browser launch failure", async () => {
      const launchError = {
        code: "BROWSER_LAUNCH_FAILED",
        message: "Failed to launch browser",
        details: {},
      };

      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isErr: true, error: launchError } as any);

      const result = await webExtractor.extract(baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error).toEqual(launchError);
      }
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });

    it("should handle page creation failure", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);

      const pageError = {
        code: "PAGE_LOAD_FAILED",
        message: "Failed to create page",
        details: {},
      };

      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isErr: true, error: pageError } as any);

      const result = await webExtractor.extract(baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error).toEqual(pageError);
      }
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });

    it("should handle navigation failure", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const navigationError = {
        code: "STEP_EXECUTION_FAILED",
        message: "Navigation step failed",
        details: {},
      };

      (
        mockNavigationEngine.executeSteps as MockedFunction<
          typeof mockNavigationEngine.executeSteps
        >
      ).mockResolvedValue({ isErr: true, error: navigationError } as any);

      const configWithSteps: ExtractorConfig = {
        ...baseConfig,
        navigationSteps: [{ type: "click", selector: ".button" }],
      };

      const result = await webExtractor.extract(configWithSteps);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error).toEqual(navigationError);
      }
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });

    it("should handle page navigation failure", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const navigationError = new Error("Timeout exceeded");
      (mockPage.goto as MockedFunction<typeof mockPage.goto>).mockRejectedValue(navigationError);

      const result = await webExtractor.extract(baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("PAGE_LOAD_FAILED");
        expect(result.error.message).toContain("Web extraction failed");
        expect(result.error.details).toHaveProperty("url", baseConfig.url);
        expect(result.error.details).toHaveProperty("error", navigationError);
      }
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });

    it("should handle HTML content extraction failure", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const contentError = new Error("Failed to extract content");
      (mockPage.content as MockedFunction<typeof mockPage.content>).mockRejectedValue(contentError);

      const result = await webExtractor.extract(baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("PAGE_LOAD_FAILED");
        expect(result.error.message).toContain("Web extraction failed");
        expect(result.error.details).toHaveProperty("error", contentError);
      }
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });

    it("should handle non-Error exceptions", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const stringError = "String error message";
      (mockPage.goto as MockedFunction<typeof mockPage.goto>).mockRejectedValue(stringError);

      const result = await webExtractor.extract(baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("Web extraction failed: String error message");
      }
    });
  });

  describe("Resource Cleanup", () => {
    it("should cleanup browser resources on success", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const result = await webExtractor.extract(baseConfig);

      expect(result.isOk).toBe(true);
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });

    it("should cleanup browser resources on failure", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockRejectedValue(new Error("Launch failed"));

      const result = await webExtractor.extract(baseConfig);

      expect(result.isErr).toBe(true);
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });

    it("should handle cleanup errors gracefully", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const cleanupError = new Error("Cleanup failed");
      (
        mockBrowserManager.close as MockedFunction<typeof mockBrowserManager.close>
      ).mockRejectedValue(cleanupError);

      // Cleanup errors should cause the extraction to fail since they're not caught
      await expect(webExtractor.extract(baseConfig)).rejects.toThrow("Cleanup failed");

      expect(mockBrowserManager.close).toHaveBeenCalledTimes(1);
    });
  });

  describe("Configuration Validation", () => {
    it("should handle missing optional retry configuration", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const configWithoutRetries: ExtractorConfig = {
        url: baseConfig.url,
        navigationSteps: baseConfig.navigationSteps,
        browserConfig: baseConfig.browserConfig,
        timeout: baseConfig.timeout,
        // retries is optional, so we omit it
      };

      const result = await webExtractor.extract(configWithoutRetries);

      expect(result.isOk).toBe(true);
      expect(NavigationEngine).toHaveBeenCalledWith(undefined);
    });

    it("should handle empty navigation steps array", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const result = await webExtractor.extract(baseConfig);

      expect(result.isOk).toBe(true);
      expect(mockNavigationEngine.executeSteps).not.toHaveBeenCalled();
    });

    it("should handle various URL formats", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const urls = [
        "https://example.com",
        "http://localhost:3000",
        "https://sub.domain.com/path?query=value",
        "https://example.com:8080/api/data",
      ];

      for (const url of urls) {
        const config = { ...baseConfig, url };
        const result = await webExtractor.extract(config);

        expect(result.isOk).toBe(true);
        expect(mockPage.goto).toHaveBeenCalledWith(url, { timeout: config.timeout });
      }
    });
  });

  describe("Multiple Extraction Sessions", () => {
    it("should handle multiple sequential extractions", async () => {
      (
        mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>
      ).mockResolvedValue({ isOk: true, value: undefined } as any);
      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      const urls = ["https://example1.com", "https://example2.com", "https://example3.com"];

      for (const url of urls) {
        const config = { ...baseConfig, url };
        const result = await webExtractor.extract(config);

        expect(result.isOk).toBe(true);
      }

      // Each extraction should create and cleanup its own browser
      expect(BrowserManager).toHaveBeenCalledTimes(3);
      expect(mockBrowserManager.close).toHaveBeenCalledTimes(3);
    });

    it("should isolate extraction sessions", async () => {
      (mockBrowserManager.launch as MockedFunction<typeof mockBrowserManager.launch>)
        .mockResolvedValueOnce({ isOk: true, value: undefined } as any)
        .mockResolvedValueOnce({ isErr: true, error: { code: "BROWSER_LAUNCH_FAILED" } } as any);

      (
        mockBrowserManager.createPage as MockedFunction<typeof mockBrowserManager.createPage>
      ).mockResolvedValue({ isOk: true, value: mockPage } as any);

      // First extraction should succeed
      const result1 = await webExtractor.extract({ ...baseConfig, url: "https://success.com" });
      expect(result1.isOk).toBe(true);

      // Second extraction should fail independently
      const result2 = await webExtractor.extract({ ...baseConfig, url: "https://fail.com" });
      expect(result2.isErr).toBe(true);

      expect(mockBrowserManager.close).toHaveBeenCalledTimes(2);
    });
  });
});
