/**
 * API loader implementation for sending data to REST APIs and webhooks
 */

import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import { getLogger } from "../../utils/logger.utils.js";
import type { LoadConfig, LoadTarget, LoadResult, ApiConfig } from "./types.js";

export type { ApiConfig };

const logger = getLogger("ApiLoader");

/**
 * API loader for sending data to REST APIs and webhooks
 */
export class ApiLoader {
  /**
   * Load data to an API endpoint
   */
  async load(
    data: readonly Record<string, unknown>[],
    target: LoadTarget,
    config: LoadConfig
  ): Promise<Result<LoadResult, Error>> {
    logger.info("Starting API load", {
      recordCount: data.length,
      targetType: target.type,
    });

    try {
      if (target.type !== "api") {
        return err(new Error("Invalid target type for API loader"));
      }

      const apiConfig = target.config as ApiConfig;

      // Validate configuration
      if (!apiConfig.url) {
        return err(new Error("API configuration requires a URL"));
      }

      const startTime = Date.now();

      // Perform the API request
      const result = await this.performApiLoad(data, apiConfig);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      logger.info("API load completed", {
        recordCount: data.length,
        executionTime,
        url: apiConfig.url,
        method: apiConfig.method,
      });

      const loadResult: LoadResult = {
        target: target,
        recordCount: data.length,
        success: true,
        outputSize: this.calculateDataSize(data),
        metadata: {
          url: apiConfig.url,
          method: apiConfig.method,
          batchSize: apiConfig.batchSize,
          executionTime,
          ...result,
        },
      };

      return ok(loadResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("API load failed", undefined, { error });

      return err(new Error(`API load failed: ${errorMessage}`));
    }
  }

  /**
   * Perform the actual API load operation
   */
  private async performApiLoad(
    data: readonly Record<string, unknown>[],
    config: ApiConfig
  ): Promise<Record<string, unknown>> {
    const batchSize = config.batchSize ?? data.length;
    const batches = this.createBatches(data, batchSize);

    logger.debug("Sending data in batches", {
      totalRecords: data.length,
      batchSize,
      batchCount: batches.length,
    });

    const results: Record<string, unknown>[] = [];

    for (const [index, batch] of batches.entries()) {
      logger.debug("Sending batch", { batchIndex: index, batchSize: batch.length });

      const batchResult = await this.sendBatch(batch, config);
      results.push(batchResult);

      // Add small delay between batches to avoid overwhelming the API
      if (index < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return {
      batchCount: batches.length,
      batchResults: results,
    };
  }

  /**
   * Send a single batch to the API
   */
  private async sendBatch(
    batch: readonly Record<string, unknown>[],
    config: ApiConfig
  ): Promise<Record<string, unknown>> {
    // Prepare payload
    const payload = config.payloadTemplate
      ? this.applyPayloadTemplate(batch, config.payloadTemplate)
      : batch;

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "ETL-Pipeline/1.0",
      ...config.headers,
    };

    // Add authentication headers
    if (config.authentication) {
      this.addAuthenticationHeaders(headers, config.authentication);
    }

    // For now, simulate the API call
    // In a real implementation, this would use fetch or axios
    return this.simulateApiCall(config.url, config.method, payload, headers, config.timeout);
  }

  /**
   * Apply payload template to batch data
   */
  private applyPayloadTemplate(
    batch: readonly Record<string, unknown>[],
    template: string
  ): Record<string, unknown> {
    try {
      // Simple template replacement - in a real implementation would use a proper template engine
      const templateData = { data: batch, count: batch.length };
      return JSON.parse(
        template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return JSON.stringify(templateData[key as keyof typeof templateData]);
        })
      );
    } catch (error) {
      logger.warn("Failed to apply payload template, using raw data", { error });
      return { data: batch };
    }
  }

  /**
   * Add authentication headers based on configuration
   */
  private addAuthenticationHeaders(
    headers: Record<string, string>,
    auth: NonNullable<ApiConfig["authentication"]>
  ): void {
    switch (auth.type) {
      case "bearer":
        if (auth.token) {
          headers.Authorization = `Bearer ${auth.token}`;
        }
        break;
      case "basic":
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
          headers.Authorization = `Basic ${credentials}`;
        }
        break;
      case "api-key":
        if (auth.apiKey && auth.headerName) {
          headers[auth.headerName] = auth.apiKey;
        }
        break;
    }
  }

  /**
   * Simulate API call (placeholder for real implementation)
   */
  private async simulateApiCall(
    url: string,
    method: string,
    payload: unknown,
    headers: Record<string, string>,
    timeout?: number
  ): Promise<Record<string, unknown>> {
    logger.debug("Simulating API call", {
      url,
      method,
      payloadSize: JSON.stringify(payload).length,
    });

    // Simulate network delay
    const delay = Math.random() * 500 + 100;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // For now, return a simulated successful response
    // In a real implementation, this would use fetch() or a HTTP client library
    return {
      status: 200,
      statusText: "OK",
      response: {
        message: "Data received successfully",
        recordsProcessed: Array.isArray(payload) ? payload.length : 1,
      },
      url,
      method,
      headers: Object.keys(headers),
      simulatedDelay: delay,
    };
  }

  /**
   * Create batches from data array
   */
  private createBatches<T>(data: readonly T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize) as T[]);
    }
    return batches;
  }

  /**
   * Calculate the approximate size of the data
   */
  private calculateDataSize(data: readonly Record<string, unknown>[]): number {
    const jsonString = JSON.stringify(data);
    return Buffer.byteLength(jsonString, "utf8");
  }
}

/**
 * Factory function to create an API loader
 */
export function createApiLoader(): ApiLoader {
  return new ApiLoader();
}
