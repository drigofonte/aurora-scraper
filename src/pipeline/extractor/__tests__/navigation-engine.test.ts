import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from "vitest";
import type { Page } from "playwright";
import { NavigationEngine, type NavigationContext } from "../navigation-engine.js";
import type { NavigationStep, RetryConfig } from "../../types.js";

describe("NavigationEngine", () => {
  let navigationEngine: NavigationEngine;
  let mockPage: Page;

  const defaultRetryConfig: RetryConfig = {
    count: 3,
    delay: 1000,
    backoff: "linear",
    maxDelay: 5000,
  };

  beforeEach(() => {
    navigationEngine = new NavigationEngine(defaultRetryConfig);

    // Create comprehensive mock page
    mockPage = {
      click: vi.fn().mockResolvedValue(undefined),
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      fill: vi.fn().mockResolvedValue(undefined),
      hover: vi.fn().mockResolvedValue(undefined),
      selectOption: vi.fn().mockResolvedValue(undefined),
      goto: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(undefined),
      locator: vi.fn().mockReturnValue({
        scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as Page;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Constructor", () => {
    it("should create NavigationEngine without retry config", () => {
      const engine = new NavigationEngine();
      expect(engine).toBeInstanceOf(NavigationEngine);
    });

    it("should create NavigationEngine with retry config", () => {
      const engine = new NavigationEngine(defaultRetryConfig);
      expect(engine).toBeInstanceOf(NavigationEngine);
    });
  });

  describe("executeSteps()", () => {
    it("should execute single navigation step successfully", async () => {
      const steps: NavigationStep[] = [
        {
          type: "click",
          selector: ".submit-button",
          timeout: 5000,
        },
      ];

      const result = await navigationEngine.executeSteps(mockPage, steps);

      expect(result.isOk).toBe(true);
      expect(mockPage.click).toHaveBeenCalledWith(".submit-button", { timeout: 5000 });
    });

    it("should execute multiple navigation steps in sequence", async () => {
      const steps: NavigationStep[] = [
        { type: "fill", selector: "#username", value: "testuser" },
        { type: "fill", selector: "#password", value: "testpass" },
        { type: "click", selector: "#submit" },
        { type: "wait", selector: ".dashboard" },
      ];

      const result = await navigationEngine.executeSteps(mockPage, steps);

      expect(result.isOk).toBe(true);
      expect(mockPage.fill).toHaveBeenCalledTimes(2);
      expect(mockPage.fill).toHaveBeenNthCalledWith(1, "#username", "testuser", { timeout: 30000 });
      expect(mockPage.fill).toHaveBeenNthCalledWith(2, "#password", "testpass", { timeout: 30000 });
      expect(mockPage.click).toHaveBeenCalledWith("#submit", { timeout: 30000 });
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(".dashboard", { timeout: 30000 });
    });

    it("should stop execution on first failed step", async () => {
      // Create navigation engine without default retry config for this test
      const noRetryEngine = new NavigationEngine();

      const steps: NavigationStep[] = [
        { type: "click", selector: ".valid-button" },
        { type: "click", selector: ".invalid-button" },
        { type: "wait", selector: ".never-reached" },
      ];

      (mockPage.click as MockedFunction<typeof mockPage.click>)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Element not found"));

      const result = await noRetryEngine.executeSteps(mockPage, steps);

      expect(result.isErr).toBe(true);
      // Should call click twice (once successful, once failed) - no retries
      expect(mockPage.click).toHaveBeenCalledTimes(2);
      expect(mockPage.waitForSelector).not.toHaveBeenCalled();

      if (result.isErr) {
        expect(result.error.code).toBe("STEP_EXECUTION_FAILED");
        expect(result.error.details).toHaveProperty("stepIndex", 1);
      }
    });

    it("should handle empty steps array", async () => {
      const result = await navigationEngine.executeSteps(mockPage, []);

      expect(result.isOk).toBe(true);
      expect(mockPage.click).not.toHaveBeenCalled();
    });
  });

  describe("Navigation Step Types", () => {
    describe("click step", () => {
      it("should execute click step with selector", async () => {
        const step: NavigationStep = {
          type: "click",
          selector: ".button",
          timeout: 10000,
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.click).toHaveBeenCalledWith(".button", { timeout: 10000 });
      });

      it("should fail click step without selector", async () => {
        const step: NavigationStep = {
          type: "click",
          timeout: 5000,
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Click step requires a selector");
        }
      });
    });

    describe("wait step", () => {
      it("should wait for selector", async () => {
        const step: NavigationStep = {
          type: "wait",
          selector: ".loading-spinner",
          timeout: 15000,
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.waitForSelector).toHaveBeenCalledWith(".loading-spinner", {
          timeout: 15000,
        });
      });

      it("should wait for timeout value", async () => {
        const step: NavigationStep = {
          type: "wait",
          value: "2000",
          timeout: 5000,
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
        expect(mockPage.waitForSelector).not.toHaveBeenCalled();
      });

      it("should fail wait step with invalid timeout value", async () => {
        const step: NavigationStep = {
          type: "wait",
          value: "invalid",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Wait step value must be a number");
        }
      });

      it("should fail wait step without selector or value", async () => {
        const step: NavigationStep = {
          type: "wait",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Wait step requires either a selector or a value");
        }
      });
    });

    describe("scroll step", () => {
      it("should scroll element into view with selector", async () => {
        const step: NavigationStep = {
          type: "scroll",
          selector: ".target-element",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.locator).toHaveBeenCalledWith(".target-element");
      });

      it("should scroll to bottom without selector", async () => {
        const step: NavigationStep = {
          type: "scroll",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    describe("fill step", () => {
      it("should fill input field", async () => {
        const step: NavigationStep = {
          type: "fill",
          selector: "#email",
          value: "test@example.com",
          timeout: 5000,
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.fill).toHaveBeenCalledWith("#email", "test@example.com", { timeout: 5000 });
      });

      it("should fail fill step without selector", async () => {
        const step: NavigationStep = {
          type: "fill",
          value: "test value",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Fill step requires both selector and value");
        }
      });

      it("should fail fill step without value", async () => {
        const step: NavigationStep = {
          type: "fill",
          selector: "#input",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Fill step requires both selector and value");
        }
      });
    });

    describe("hover step", () => {
      it("should hover over element", async () => {
        const step: NavigationStep = {
          type: "hover",
          selector: ".menu-item",
          timeout: 3000,
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.hover).toHaveBeenCalledWith(".menu-item", { timeout: 3000 });
      });

      it("should fail hover step without selector", async () => {
        const step: NavigationStep = {
          type: "hover",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Hover step requires a selector");
        }
      });
    });

    describe("select step", () => {
      it("should select option", async () => {
        const step: NavigationStep = {
          type: "select",
          selector: "#country",
          value: "US",
          timeout: 5000,
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.selectOption).toHaveBeenCalledWith("#country", "US", { timeout: 5000 });
      });

      it("should fail select step without selector", async () => {
        const step: NavigationStep = {
          type: "select",
          value: "option",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Select step requires both selector and value");
        }
      });

      it("should fail select step without value", async () => {
        const step: NavigationStep = {
          type: "select",
          selector: "#select",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Select step requires both selector and value");
        }
      });
    });

    describe("navigate step", () => {
      it("should navigate to URL", async () => {
        const step: NavigationStep = {
          type: "navigate",
          value: "https://example.com",
          timeout: 10000,
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", { timeout: 10000 });
      });

      it("should fail navigate step without URL", async () => {
        const step: NavigationStep = {
          type: "navigate",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Navigate step requires a URL value");
        }
      });
    });

    describe("screenshot step", () => {
      it("should take screenshot with custom path", async () => {
        const step: NavigationStep = {
          type: "screenshot",
          value: "/tmp/custom-screenshot.png",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.screenshot).toHaveBeenCalledWith({
          path: "/tmp/custom-screenshot.png",
          fullPage: true,
        });
      });

      it("should take screenshot with auto-generated path", async () => {
        const step: NavigationStep = {
          type: "screenshot",
        };

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isOk).toBe(true);
        expect(mockPage.screenshot).toHaveBeenCalledWith({
          path: expect.stringMatching(/^screenshot-\d+\.png$/),
          fullPage: true,
        });
      });
    });

    describe("unsupported step type", () => {
      it("should fail for unsupported step type", async () => {
        const step = {
          type: "unsupported",
          selector: ".element",
        } as unknown as NavigationStep;

        const result = await navigationEngine.executeSteps(mockPage, [step]);

        expect(result.isErr).toBe(true);
        if (result.isErr) {
          expect(result.error.message).toContain("Unsupported navigation step type: unsupported");
        }
      });
    });
  });

  describe("Wait Conditions", () => {
    it("should wait for condition after step execution", async () => {
      const step: NavigationStep = {
        type: "click",
        selector: ".button",
        waitCondition: ".result-element" as any, // Type assertion for test purposes
      };

      const result = await navigationEngine.executeSteps(mockPage, [step]);

      expect(result.isOk).toBe(true);
      expect(mockPage.click).toHaveBeenCalledWith(".button", { timeout: 30000 });
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(".result-element", { timeout: 30000 });
    });

    it("should handle complex wait conditions", async () => {
      const step: NavigationStep = {
        type: "click",
        selector: ".button",
        waitCondition: { type: "selector", value: ".complex-condition" } as any,
      };

      const result = await navigationEngine.executeSteps(mockPage, [step]);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("Complex wait conditions not yet implemented");
      }
    });
  });

  describe("Retry Logic", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should retry failed step with linear backoff", async () => {
      const retryConfig: RetryConfig = {
        count: 3,
        delay: 1000,
        backoff: "linear",
      };

      const engineWithRetry = new NavigationEngine(retryConfig);
      const step: NavigationStep = {
        type: "click",
        selector: ".flaky-button",
        maxAttempts: 3,
      };

      (mockPage.click as MockedFunction<typeof mockPage.click>)
        .mockRejectedValueOnce(new Error("First attempt failed"))
        .mockRejectedValueOnce(new Error("Second attempt failed"))
        .mockResolvedValueOnce(undefined);

      const executePromise = engineWithRetry.executeSteps(mockPage, [step]);

      // Advance timers for retries
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry

      const result = await executePromise;

      expect(result.isOk).toBe(true);
      expect(mockPage.click).toHaveBeenCalledTimes(3);
    });

    it("should retry failed step with exponential backoff", async () => {
      const retryConfig: RetryConfig = {
        count: 3,
        delay: 1000,
        backoff: "exponential",
        maxDelay: 10000,
      };

      const engineWithRetry = new NavigationEngine(retryConfig);
      const step: NavigationStep = {
        type: "click",
        selector: ".flaky-button",
        maxAttempts: 3,
      };

      (mockPage.click as MockedFunction<typeof mockPage.click>)
        .mockRejectedValueOnce(new Error("First attempt failed"))
        .mockRejectedValueOnce(new Error("Second attempt failed"))
        .mockResolvedValueOnce(undefined);

      const executePromise = engineWithRetry.executeSteps(mockPage, [step]);

      // Advance timers for exponential backoff
      await vi.advanceTimersByTimeAsync(1000); // 1000ms delay for first retry
      await vi.advanceTimersByTimeAsync(2000); // 2000ms delay for second retry

      const result = await executePromise;

      expect(result.isOk).toBe(true);
      expect(mockPage.click).toHaveBeenCalledTimes(3);
    });

    it("should respect maxDelay in exponential backoff", async () => {
      const retryConfig: RetryConfig = {
        count: 5,
        delay: 1000,
        backoff: "exponential",
        maxDelay: 3000,
      };

      const engineWithRetry = new NavigationEngine(retryConfig);
      const step: NavigationStep = {
        type: "click",
        selector: ".flaky-button",
        maxAttempts: 5,
      };

      (mockPage.click as MockedFunction<typeof mockPage.click>).mockRejectedValue(
        new Error("Always fails")
      );

      const executePromise = engineWithRetry.executeSteps(mockPage, [step]);

      // Advance timers through all retries
      await vi.advanceTimersByTimeAsync(1000); // 1000ms
      await vi.advanceTimersByTimeAsync(2000); // 2000ms
      await vi.advanceTimersByTimeAsync(3000); // capped at 3000ms
      await vi.advanceTimersByTimeAsync(3000); // capped at 3000ms

      const result = await executePromise;

      expect(result.isErr).toBe(true);
      expect(mockPage.click).toHaveBeenCalledTimes(5);
    });

    it("should fail after maximum retry attempts", async () => {
      const step: NavigationStep = {
        type: "click",
        selector: ".always-fails",
        maxAttempts: 2,
      };

      (mockPage.click as MockedFunction<typeof mockPage.click>).mockRejectedValue(
        new Error("Element not found")
      );

      const executePromise = navigationEngine.executeSteps(mockPage, [step]);

      // Advance timer for retry
      await vi.advanceTimersByTimeAsync(1000);

      const result = await executePromise;

      expect(result.isErr).toBe(true);
      expect(mockPage.click).toHaveBeenCalledTimes(2);

      if (result.isErr) {
        expect(result.error.code).toBe("STEP_EXECUTION_FAILED");
        expect(result.error.message).toContain("Element not found");
      }
    });

    it("should use step-specific maxAttempts over engine default", async () => {
      const step: NavigationStep = {
        type: "click",
        selector: ".button",
        maxAttempts: 1, // Override engine default of 3
      };

      (mockPage.click as MockedFunction<typeof mockPage.click>).mockRejectedValue(
        new Error("Failed")
      );

      const result = await navigationEngine.executeSteps(mockPage, [step]);

      expect(result.isErr).toBe(true);
      expect(mockPage.click).toHaveBeenCalledTimes(1); // Should not retry
    });
  });

  describe("Default Timeout Handling", () => {
    it("should use default timeout when not specified", async () => {
      const step: NavigationStep = {
        type: "click",
        selector: ".button",
      };

      const result = await navigationEngine.executeSteps(mockPage, [step]);

      expect(result.isOk).toBe(true);
      expect(mockPage.click).toHaveBeenCalledWith(".button", { timeout: 30000 });
    });

    it("should use custom timeout when specified", async () => {
      const step: NavigationStep = {
        type: "click",
        selector: ".button",
        timeout: 5000,
      };

      const result = await navigationEngine.executeSteps(mockPage, [step]);

      expect(result.isOk).toBe(true);
      expect(mockPage.click).toHaveBeenCalledWith(".button", { timeout: 5000 });
    });
  });
});
