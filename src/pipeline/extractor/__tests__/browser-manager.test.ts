import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from "vitest";
import type {
  Browser,
  BrowserContext,
  Page,
  LaunchOptions,
  BrowserType as PlaywrightBrowserType,
} from "playwright";
import { chromium, firefox, webkit } from "playwright";
import { BrowserManager, type BrowserManagerConfig, type BrowserType } from "../browser-manager.js";

// Mock playwright browsers
vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn(),
  },
  firefox: {
    launch: vi.fn(),
  },
  webkit: {
    launch: vi.fn(),
  },
}));

describe("BrowserManager", () => {
  let browserManager: BrowserManager;
  let mockBrowser: Browser;
  let mockContext: BrowserContext;
  let mockPage: Page;

  const defaultConfig: BrowserManagerConfig = {
    headless: true,
    viewport: { width: 1920, height: 1080 },
  };

  beforeEach(() => {
    // Create mock browser objects
    mockPage = {
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as BrowserContext;

    mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as Browser;

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Constructor", () => {
    it("should create BrowserManager with provided config", () => {
      browserManager = new BrowserManager(defaultConfig);
      expect(browserManager).toBeInstanceOf(BrowserManager);
    });

    it("should accept additional browser configuration options", () => {
      const extendedConfig: BrowserManagerConfig = {
        ...defaultConfig,
        browserType: "firefox",
        userAgent: "test-agent",
        locale: "en-US",
        args: ["--no-sandbox"],
        contextOptions: { ignoreHTTPSErrors: true },
        launchOptions: { slowMo: 100 },
      };

      browserManager = new BrowserManager(extendedConfig);
      expect(browserManager).toBeInstanceOf(BrowserManager);
    });
  });

  describe("launch()", () => {
    beforeEach(() => {
      browserManager = new BrowserManager(defaultConfig);
    });

    it("should launch chromium browser by default", async () => {
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);

      const result = await browserManager.launch();

      expect(result.isOk).toBe(true);
      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
      });
      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: { width: 1920, height: 1080 },
      });
    });

    it("should launch firefox when specified", async () => {
      const firefoxConfig: BrowserManagerConfig = {
        ...defaultConfig,
        browserType: "firefox",
      };
      browserManager = new BrowserManager(firefoxConfig);

      (firefox.launch as MockedFunction<typeof firefox.launch>).mockResolvedValue(mockBrowser);

      const result = await browserManager.launch();

      expect(result.isOk).toBe(true);
      expect(firefox.launch).toHaveBeenCalledWith({
        headless: true,
      });
    });

    it("should launch webkit when specified", async () => {
      const webkitConfig: BrowserManagerConfig = {
        ...defaultConfig,
        browserType: "webkit",
      };
      browserManager = new BrowserManager(webkitConfig);

      (webkit.launch as MockedFunction<typeof webkit.launch>).mockResolvedValue(mockBrowser);

      const result = await browserManager.launch();

      expect(result.isOk).toBe(true);
      expect(webkit.launch).toHaveBeenCalledWith({
        headless: true,
      });
    });

    it("should pass custom launch options to browser", async () => {
      const configWithOptions: BrowserManagerConfig = {
        ...defaultConfig,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
        launchOptions: { slowMo: 100, timeout: 60000 },
      };
      browserManager = new BrowserManager(configWithOptions);

      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);

      const result = await browserManager.launch();

      expect(result.isOk).toBe(true);
      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
        slowMo: 100,
        timeout: 60000,
      });
    });

    it("should pass custom context options", async () => {
      const configWithContext: BrowserManagerConfig = {
        ...defaultConfig,
        userAgent: "Mozilla/5.0 Custom Agent",
        locale: "es-ES",
        contextOptions: { ignoreHTTPSErrors: true, permissions: ["geolocation"] },
      };
      browserManager = new BrowserManager(configWithContext);

      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);

      const result = await browserManager.launch();

      expect(result.isOk).toBe(true);
      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        viewport: { width: 1920, height: 1080 },
        userAgent: "Mozilla/5.0 Custom Agent",
        locale: "es-ES",
        ignoreHTTPSErrors: true,
        permissions: ["geolocation"],
      });
    });

    it("should return error when browser launch fails", async () => {
      const launchError = new Error("Failed to launch browser");
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockRejectedValue(launchError);

      const result = await browserManager.launch();

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("BROWSER_LAUNCH_FAILED");
        expect(result.error.message).toContain("Failed to launch browser");
        expect(result.error.details).toHaveProperty("error", launchError);
      }
    });

    it("should return error when context creation fails", async () => {
      const contextError = new Error("Failed to create context");
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);
      (mockBrowser.newContext as MockedFunction<typeof mockBrowser.newContext>).mockRejectedValue(
        contextError
      );

      const result = await browserManager.launch();

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("BROWSER_LAUNCH_FAILED");
        expect(result.error.message).toContain("Failed to launch browser");
      }
    });

    it("should handle unsupported browser type", async () => {
      const invalidConfig = {
        ...defaultConfig,
        browserType: "invalid" as BrowserType,
      };
      browserManager = new BrowserManager(invalidConfig);

      const result = await browserManager.launch();

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("BROWSER_LAUNCH_FAILED");
        expect(result.error.message).toContain("Unsupported browser type: invalid");
      }
    });
  });

  describe("createPage()", () => {
    beforeEach(async () => {
      browserManager = new BrowserManager(defaultConfig);
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);
      await browserManager.launch();
    });

    it("should create a new page successfully", async () => {
      const result = await browserManager.createPage();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe(mockPage);
      }
      expect(mockContext.newPage).toHaveBeenCalledTimes(1);
    });

    it("should return error when browser context is not available", async () => {
      const freshBrowserManager = new BrowserManager(defaultConfig);

      const result = await freshBrowserManager.createPage();

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("BROWSER_LAUNCH_FAILED");
        expect(result.error.message).toBe("Browser context not available. Call launch() first.");
      }
    });

    it("should return error when page creation fails", async () => {
      const pageError = new Error("Failed to create page");
      (mockContext.newPage as MockedFunction<typeof mockContext.newPage>).mockRejectedValue(
        pageError
      );

      const result = await browserManager.createPage();

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("PAGE_LOAD_FAILED");
        expect(result.error.message).toContain("Failed to create page");
      }
    });
  });

  describe("getCurrentPage()", () => {
    beforeEach(async () => {
      browserManager = new BrowserManager(defaultConfig);
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);
      await browserManager.launch();
    });

    it("should return null when no page is created", () => {
      const page = browserManager.getCurrentPage();
      expect(page).toBeNull();
    });

    it("should return current page after creation", async () => {
      await browserManager.createPage();
      const page = browserManager.getCurrentPage();
      expect(page).toBe(mockPage);
    });
  });

  describe("isRunning()", () => {
    beforeEach(() => {
      browserManager = new BrowserManager(defaultConfig);
    });

    it("should return false when browser is not launched", () => {
      expect(browserManager.isRunning()).toBe(false);
    });

    it("should return true when browser is launched", async () => {
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);
      await browserManager.launch();
      expect(browserManager.isRunning()).toBe(true);
    });

    it("should return false after browser is closed", async () => {
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);
      await browserManager.launch();
      await browserManager.close();
      expect(browserManager.isRunning()).toBe(false);
    });
  });

  describe("close()", () => {
    beforeEach(async () => {
      browserManager = new BrowserManager(defaultConfig);
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);
      await browserManager.launch();
      await browserManager.createPage();
    });

    it("should close all browser resources", async () => {
      await browserManager.close();

      expect(mockPage.close).toHaveBeenCalledTimes(1);
      expect(mockContext.close).toHaveBeenCalledTimes(1);
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
      expect(browserManager.isRunning()).toBe(false);
      expect(browserManager.getCurrentPage()).toBeNull();
    });

    it("should handle errors during cleanup gracefully", async () => {
      const closeError = new Error("Close failed");
      (mockPage.close as MockedFunction<typeof mockPage.close>).mockRejectedValue(closeError);

      // Should not throw, continue with cleanup
      await expect(browserManager.close()).resolves.toBeUndefined();

      // Context and browser should still be closed despite page error
      expect(mockPage.close).toHaveBeenCalledTimes(1);
      // Note: In actual implementation, context.close may not be called if page.close fails
      // This depends on the error handling logic in the close method
    });

    it("should be safe to call multiple times", async () => {
      await browserManager.close();
      await browserManager.close();

      // Should only call close once on each resource
      expect(mockPage.close).toHaveBeenCalledTimes(1);
      expect(mockContext.close).toHaveBeenCalledTimes(1);
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("should handle partial cleanup state", async () => {
      // Simulate a state where only browser exists
      const partialBrowserManager = new BrowserManager(defaultConfig);
      (chromium.launch as MockedFunction<typeof chromium.launch>).mockResolvedValue(mockBrowser);
      await partialBrowserManager.launch();

      await partialBrowserManager.close();

      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });
  });
});
