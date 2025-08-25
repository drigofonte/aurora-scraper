/**
 * Test utilities for extractor module
 */

import type {
  ExtractorConfig,
  NavigationStep,
  BrowserConfig,
  RetryConfig,
  WaitCondition,
  ExtractorError,
} from "../../types.js";

/**
 * Create a basic extractor configuration for testing
 */
export function createBasicExtractorConfig(overrides?: Partial<ExtractorConfig>): ExtractorConfig {
  const baseConfig: ExtractorConfig = {
    url: "https://example.com",
    navigationSteps: [],
    browserConfig: {
      headless: true,
      viewport: { width: 1920, height: 1080 },
    },
    timeout: 30000,
  };

  return { ...baseConfig, ...overrides };
}

/**
 * Create a browser configuration for testing
 */
export function createBrowserConfig(overrides?: Partial<BrowserConfig>): BrowserConfig {
  const baseConfig: BrowserConfig = {
    headless: true,
    viewport: { width: 1920, height: 1080 },
  };

  return { ...baseConfig, ...overrides };
}

/**
 * Create a retry configuration for testing
 */
export function createRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
  const baseConfig: RetryConfig = {
    count: 3,
    delay: 1000,
    backoff: "linear",
  };

  return { ...baseConfig, ...overrides };
}

/**
 * Create navigation steps for common scenarios
 */
export const createNavigationSteps = {
  /**
   * Simple click navigation
   */
  simpleClick: (selector: string, timeout?: number): NavigationStep => ({
    type: "click",
    selector,
    ...(timeout !== undefined && { timeout }),
  }),

  /**
   * Wait for element navigation
   */
  waitForElement: (selector: string, timeout?: number): NavigationStep => ({
    type: "wait",
    selector,
    ...(timeout !== undefined && { timeout }),
  }),

  /**
   * Wait for timeout navigation
   */
  waitForTimeout: (milliseconds: number): NavigationStep => ({
    type: "wait",
    value: milliseconds.toString(),
  }),

  /**
   * Fill form field navigation
   */
  fillField: (selector: string, value: string, timeout?: number): NavigationStep => ({
    type: "fill",
    selector,
    value,
    ...(timeout !== undefined && { timeout }),
  }),

  /**
   * Scroll navigation
   */
  scroll: (selector?: string): NavigationStep => ({
    type: "scroll",
    ...(selector !== undefined && { selector }),
  }),

  /**
   * Hover navigation
   */
  hover: (selector: string, timeout?: number): NavigationStep => ({
    type: "hover",
    selector,
    ...(timeout !== undefined && { timeout }),
  }),

  /**
   * Select option navigation
   */
  selectOption: (selector: string, value: string, timeout?: number): NavigationStep => ({
    type: "select",
    selector,
    value,
    ...(timeout !== undefined && { timeout }),
  }),

  /**
   * Navigate to URL
   */
  navigateToUrl: (url: string, timeout?: number): NavigationStep => ({
    type: "navigate",
    value: url,
    ...(timeout !== undefined && { timeout }),
  }),

  /**
   * Take screenshot
   */
  takeScreenshot: (path?: string): NavigationStep => ({
    type: "screenshot",
    ...(path !== undefined && { value: path }),
  }),

  /**
   * Cookie acceptance flow
   */
  cookieAcceptance: (): NavigationStep[] => [
    {
      type: "wait",
      selector: ".cookie-banner",
      timeout: 5000,
    },
    {
      type: "click",
      selector: ".cookie-accept",
      timeout: 3000,
    },
  ],

  /**
   * Search form interaction
   */
  searchForm: (query: string): NavigationStep[] => [
    {
      type: "fill",
      selector: "#search-input",
      value: query,
      timeout: 5000,
    },
    {
      type: "click",
      selector: "#search-button",
      timeout: 5000,
      waitCondition: {
        type: "selector",
        value: ".search-results",
        state: "visible",
      },
    },
  ],

  /**
   * Infinite scroll simulation
   */
  infiniteScroll: (scrollCount: number = 3): NavigationStep[] => {
    const steps: NavigationStep[] = [];

    for (let i = 0; i < scrollCount; i++) {
      steps.push(
        { type: "scroll" },
        { type: "wait", value: "2000" } // Wait for content to load
      );
    }

    return steps;
  },

  /**
   * Login form flow
   */
  loginForm: (username: string, password: string): NavigationStep[] => [
    {
      type: "fill",
      selector: "#username",
      value: username,
      timeout: 5000,
    },
    {
      type: "fill",
      selector: "#password",
      value: password,
      timeout: 5000,
    },
    {
      type: "click",
      selector: "#login-button",
      timeout: 10000,
      waitCondition: {
        type: "selector",
        value: ".dashboard",
        state: "visible",
      },
    },
  ],
};

/**
 * Common test HTML templates
 */
export const htmlTemplates = {
  /**
   * Basic page with simple structure
   */
  basicPage: `
    <!DOCTYPE html>
    <html>
    <head><title>Test Page</title></head>
    <body>
      <h1>Welcome</h1>
      <p>Content goes here</p>
      <button id="action-btn">Click Me</button>
    </body>
    </html>
  `,

  /**
   * Page with form elements
   */
  formPage: `
    <!DOCTYPE html>
    <html>
    <head><title>Form Page</title></head>
    <body>
      <form id="test-form">
        <input id="username" type="text" name="username" placeholder="Username">
        <input id="password" type="password" name="password" placeholder="Password">
        <select id="role" name="role">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" id="submit-btn">Submit</button>
      </form>
    </body>
    </html>
  `,

  /**
   * Page with list of items
   */
  listPage: `
    <!DOCTYPE html>
    <html>
    <head><title>List Page</title></head>
    <body>
      <div class="container">
        <h1>Articles</h1>
        <ul class="articles">
          <li class="article">
            <h2 class="title">First Article</h2>
            <p class="excerpt">First article excerpt</p>
            <time class="date">2024-01-01</time>
          </li>
          <li class="article">
            <h2 class="title">Second Article</h2>
            <p class="excerpt">Second article excerpt</p>
            <time class="date">2024-01-02</time>
          </li>
          <li class="article">
            <h2 class="title">Third Article</h2>
            <p class="excerpt">Third article excerpt</p>
            <time class="date">2024-01-03</time>
          </li>
        </ul>
      </div>
    </body>
    </html>
  `,

  /**
   * Page with loading states
   */
  loadingPage: `
    <!DOCTYPE html>
    <html>
    <head><title>Loading Page</title></head>
    <body>
      <div class="loading-spinner">Loading...</div>
      <div class="content" style="display: none;">
        <h1>Content Loaded</h1>
        <p>This content appears after loading</p>
      </div>
      <script>
        setTimeout(() => {
          document.querySelector('.loading-spinner').style.display = 'none';
          document.querySelector('.content').style.display = 'block';
        }, 2000);
      </script>
    </body>
    </html>
  `,
};

/**
 * Mock extractor error factory
 */
export function createMockExtractorError(
  code:
    | "NAVIGATION_TIMEOUT"
    | "ELEMENT_NOT_FOUND"
    | "BROWSER_LAUNCH_FAILED"
    | "PAGE_LOAD_FAILED"
    | "STEP_EXECUTION_FAILED"
    | "NETWORK_ERROR",
  message?: string,
  details?: Record<string, unknown>
): ExtractorError {
  return {
    code,
    message: message ?? `Mock error: ${code}`,
    details: details ?? {},
  };
}

/**
 * Test timeout helpers
 */
export const timeouts = {
  short: 1000, // 1 second
  medium: 5000, // 5 seconds
  long: 30000, // 30 seconds
  veryLong: 60000, // 1 minute
} as const;

/**
 * Common viewport configurations
 */
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
} as const;

/**
 * Browser configuration presets
 */
export const browserPresets = {
  headlessChrome: (): BrowserConfig => ({
    headless: true,
    viewport: viewports.desktop,
  }),

  headlessFirefox: (): BrowserConfig => ({
    headless: true,
    viewport: viewports.desktop,
  }),

  headedChrome: (): BrowserConfig => ({
    headless: false,
    viewport: viewports.desktop,
    args: ["--start-maximized"],
  }),

  mobileChrome: (): BrowserConfig => ({
    headless: true,
    viewport: viewports.mobile,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
  }),

  customUserAgent: (userAgent: string): BrowserConfig => ({
    headless: true,
    viewport: viewports.desktop,
    userAgent,
  }),

  withProxy: (args: string[]): BrowserConfig => ({
    headless: true,
    viewport: viewports.desktop,
    args,
  }),
};

/**
 * Retry configuration presets
 */
export const retryPresets = {
  fast: (): RetryConfig => ({
    count: 2,
    delay: 500,
    backoff: "linear",
  }),

  standard: (): RetryConfig => ({
    count: 3,
    delay: 1000,
    backoff: "linear",
  }),

  aggressive: (): RetryConfig => ({
    count: 5,
    delay: 1000,
    backoff: "exponential",
    maxDelay: 10000,
  }),

  patient: (): RetryConfig => ({
    count: 3,
    delay: 2000,
    backoff: "exponential",
    maxDelay: 15000,
  }),
};
