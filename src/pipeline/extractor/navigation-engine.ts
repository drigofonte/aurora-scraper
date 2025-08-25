/**
 * Navigation engine for executing navigation steps in the browser
 */

import type { Page } from "playwright";
import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import type { NavigationStep, ExtractorError, RetryConfig } from "../types.js";
import { getLogger } from "../../utils/logger.utils.js";

const logger = getLogger("NavigationEngine");

/**
 * Navigation execution context
 */
export interface NavigationContext {
  readonly page: Page;
  readonly step: NavigationStep;
  readonly stepIndex: number;
  readonly retryConfig?: RetryConfig;
}

/**
 * Navigation engine for executing browser navigation steps
 */
export class NavigationEngine {
  constructor(private readonly _defaultRetryConfig?: RetryConfig) {}

  /**
   * Execute a sequence of navigation steps
   */
  async executeSteps(
    page: Page,
    steps: readonly NavigationStep[]
  ): Promise<Result<void, ExtractorError>> {
    logger.debug("Executing navigation steps", { stepCount: steps.length });

    for (const [index, step] of steps.entries()) {
      const context: NavigationContext = {
        page,
        step,
        stepIndex: index,
        ...(this._defaultRetryConfig && { retryConfig: this._defaultRetryConfig }),
      };

      const result = await this.executeStepWithRetry(context);
      if (result.isErr) {
        logger.error("Navigation step failed", undefined, {
          stepIndex: index,
          step: step.type,
          error: result.error,
        });
        return result;
      }

      logger.debug("Navigation step completed", {
        stepIndex: index,
        type: step.type,
      });
    }

    logger.debug("All navigation steps completed successfully");
    return ok(undefined);
  }

  /**
   * Execute a single navigation step with retry logic
   */
  private async executeStepWithRetry(
    context: NavigationContext
  ): Promise<Result<void, ExtractorError>> {
    const maxAttempts = context.step.maxAttempts ?? context.retryConfig?.count ?? 1;
    const baseDelay = context.retryConfig?.delay ?? 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this.executeStep(context);

      if (result.isOk) {
        return result;
      }

      // If this was the last attempt, return the error
      if (attempt === maxAttempts) {
        return result;
      }

      // Calculate retry delay
      const delay = this.calculateRetryDelay(baseDelay, attempt, context.retryConfig);

      logger.debug("Retrying navigation step", {
        stepIndex: context.stepIndex,
        attempt,
        maxAttempts,
        delayMs: delay,
      });

      await this.sleep(delay);
    }

    // This should never be reached, but TypeScript requires it
    const error: ExtractorError = {
      code: "STEP_EXECUTION_FAILED",
      message: "Unexpected retry loop exit",
      details: { step: context.step },
    };
    return err(error);
  }

  /**
   * Execute a single navigation step
   */
  private async executeStep(context: NavigationContext): Promise<Result<void, ExtractorError>> {
    const { page, step } = context;
    const timeout = step.timeout ?? 30000;

    try {
      logger.debug("Executing navigation step", {
        type: step.type,
        selector: step.selector,
      });

      switch (step.type) {
        case "click":
          await this.executeClickStep(page, step, timeout);
          break;
        case "wait":
          await this.executeWaitStep(page, step, timeout);
          break;
        case "scroll":
          await this.executeScrollStep(page, step, timeout);
          break;
        case "fill":
          await this.executeFillStep(page, step, timeout);
          break;
        case "hover":
          await this.executeHoverStep(page, step, timeout);
          break;
        case "select":
          await this.executeSelectStep(page, step, timeout);
          break;
        case "navigate":
          await this.executeNavigateStep(page, step, timeout);
          break;
        case "screenshot":
          await this.executeScreenshotStep(page, step);
          break;
        default:
          throw new Error(`Unsupported navigation step type: ${step.type}`);
      }

      // Wait for any specified condition after step execution
      if (step.waitCondition) {
        await this.waitForCondition(page, step.waitCondition, timeout);
      }

      return ok(undefined);
    } catch (error) {
      const extractorError: ExtractorError = {
        code: "STEP_EXECUTION_FAILED",
        message: `Navigation step '${step.type}' failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          step,
          stepIndex: context.stepIndex,
          error,
        },
      };
      return err(extractorError);
    }
  }

  /**
   * Execute click navigation step
   */
  private async executeClickStep(page: Page, step: NavigationStep, timeout: number): Promise<void> {
    if (!step.selector) {
      throw new Error("Click step requires a selector");
    }

    await page.click(step.selector, { timeout });
  }

  /**
   * Execute wait navigation step
   */
  private async executeWaitStep(page: Page, step: NavigationStep, timeout: number): Promise<void> {
    if (step.selector) {
      await page.waitForSelector(step.selector, { timeout });
    } else if (step.value) {
      const waitTime = parseInt(step.value, 10);
      if (isNaN(waitTime)) {
        throw new Error("Wait step value must be a number (milliseconds)");
      }
      await page.waitForTimeout(waitTime);
    } else {
      throw new Error("Wait step requires either a selector or a value (timeout)");
    }
  }

  /**
   * Execute scroll navigation step
   */
  private async executeScrollStep(
    page: Page,
    step: NavigationStep,
    _timeout: number
  ): Promise<void> {
    if (step.selector) {
      await page.locator(step.selector).scrollIntoViewIfNeeded();
    } else {
      // Scroll to bottom by default
      await page.evaluate(() => {
        // eslint-disable-next-line no-undef
        window.scrollTo(0, document.body.scrollHeight);
      });
    }
  }

  /**
   * Execute fill navigation step
   */
  private async executeFillStep(page: Page, step: NavigationStep, timeout: number): Promise<void> {
    if (!step.selector || !step.value) {
      throw new Error("Fill step requires both selector and value");
    }

    await page.fill(step.selector, step.value, { timeout });
  }

  /**
   * Execute hover navigation step
   */
  private async executeHoverStep(page: Page, step: NavigationStep, timeout: number): Promise<void> {
    if (!step.selector) {
      throw new Error("Hover step requires a selector");
    }

    await page.hover(step.selector, { timeout });
  }

  /**
   * Execute select navigation step
   */
  private async executeSelectStep(
    page: Page,
    step: NavigationStep,
    timeout: number
  ): Promise<void> {
    if (!step.selector || !step.value) {
      throw new Error("Select step requires both selector and value");
    }

    await page.selectOption(step.selector, step.value, { timeout });
  }

  /**
   * Execute navigate navigation step
   */
  private async executeNavigateStep(
    page: Page,
    step: NavigationStep,
    timeout: number
  ): Promise<void> {
    if (!step.value) {
      throw new Error("Navigate step requires a URL value");
    }

    await page.goto(step.value, { timeout });
  }

  /**
   * Execute screenshot navigation step
   */
  private async executeScreenshotStep(page: Page, step: NavigationStep): Promise<void> {
    const path = step.value ?? `screenshot-${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true });
  }

  /**
   * Wait for a condition to be met
   */
  private async waitForCondition(
    page: Page,
    condition: NonNullable<NavigationStep["waitCondition"]>,
    timeout: number
  ): Promise<void> {
    if (typeof condition === "string") {
      // Assume it's a selector
      await page.waitForSelector(condition, { timeout });
    } else if (typeof condition === "object") {
      // Handle complex wait conditions (future extension)
      throw new Error("Complex wait conditions not yet implemented");
    }
  }

  /**
   * Calculate retry delay based on strategy
   */
  private calculateRetryDelay(
    baseDelay: number,
    attempt: number,
    retryConfig?: RetryConfig
  ): number {
    if (!retryConfig) {
      return baseDelay;
    }

    switch (retryConfig.backoff) {
      case "exponential":
        return Math.min(baseDelay * Math.pow(2, attempt - 1), retryConfig.maxDelay ?? 30000);
      case "linear":
        return Math.min(baseDelay * attempt, retryConfig.maxDelay ?? 30000);
      default:
        return baseDelay;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
