/**
 * Unit tests for ApiLoader
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ApiLoader, type ApiConfig } from "../api-loader.js";
import type { LoadTarget, LoadConfig } from "../types.js";

describe("ApiLoader", () => {
  let apiLoader: ApiLoader;
  let testData: Record<string, unknown>[];
  let baseConfig: LoadConfig;

  beforeEach(() => {
    apiLoader = new ApiLoader();
    testData = [
      { id: 1, name: "Product 1", price: 10.99 },
      { id: 2, name: "Product 2", price: 15.99 },
      { id: 3, name: "Product 3", price: 20.99 },
    ];
    baseConfig = {
      targets: [],
      format: "json",
    };
  });

  describe("basic API loading", () => {
    it("should successfully load data to API endpoint", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.target).toBe(target);
        expect(result.value.recordCount).toBe(3);
        expect(result.value.success).toBe(true);
        expect(result.value.outputSize).toBeGreaterThan(0);
        expect(result.value.metadata?.url).toBe("https://api.example.com/webhook");
        expect(result.value.metadata?.method).toBe("POST");
      }
    });

    it("should handle different HTTP methods", async () => {
      const methods: ("POST" | "PUT" | "PATCH")[] = ["POST", "PUT", "PATCH"];

      for (const method of methods) {
        const target: LoadTarget = {
          type: "api",
          config: {
            url: "https://api.example.com/data",
            method,
          } as ApiConfig,
        };

        const result = await apiLoader.load(testData, target, baseConfig);

        expect(result.isOk).toBe(true);
        if (result.isOk) {
          expect(result.value.metadata?.method).toBe(method);
        }
      }
    });
  });

  describe("authentication", () => {
    it("should handle Bearer token authentication", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          authentication: {
            type: "bearer",
            token: "test-bearer-token",
          },
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
      }
    });

    it("should handle Basic authentication", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          authentication: {
            type: "basic",
            username: "testuser",
            password: "testpass",
          },
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
      }
    });

    it("should handle API key authentication", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          authentication: {
            type: "api-key",
            apiKey: "test-api-key",
            headerName: "X-API-Key",
          },
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe("batching", () => {
    it("should handle single batch for small datasets", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          batchSize: 10, // Larger than test data
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(3);
        expect(result.value.metadata?.batchCount).toBe(1);
      }
    });

    it("should handle multiple batches for large datasets", async () => {
      const largeDataset = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
      }));

      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          batchSize: 3, // Should create 4 batches (3+3+3+1)
        } as ApiConfig,
      };

      const result = await apiLoader.load(largeDataset, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(10);
        expect(result.value.metadata?.batchCount).toBe(4);
      }
    });

    it("should handle custom batch sizes", async () => {
      const dataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
      }));

      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          batchSize: 25, // Should create 4 batches
        } as ApiConfig,
      };

      const result = await apiLoader.load(dataset, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(100);
        expect(result.value.metadata?.batchCount).toBe(4);
      }
    });
  });

  describe("payload templates", () => {
    it("should handle payload templates", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          payloadTemplate: '{"records": {{data}}, "total": {{count}}}',
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
      }
    });

    it("should fallback to raw data when template fails", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          payloadTemplate: '{"invalid": {{nonexistent}}}', // Invalid template
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe("configuration validation", () => {
    it("should reject invalid target type", async () => {
      const target: LoadTarget = {
        type: "file", // Wrong type
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("Invalid target type");
      }
    });

    it("should reject missing URL", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          method: "POST",
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("requires a URL");
      }
    });
  });

  describe("custom headers", () => {
    it("should handle custom headers", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          headers: {
            "X-Custom-Header": "custom-value",
            "X-App-Version": "1.0.0",
          },
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe("error handling", () => {
    it("should handle empty data array", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
        } as ApiConfig,
      };

      const result = await apiLoader.load([], target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(0);
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe("metadata tracking", () => {
    it("should include execution time in metadata", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.metadata?.executionTime).toBeGreaterThan(0);
        expect(typeof result.value.metadata?.executionTime).toBe("number");
      }
    });

    it("should include batch results in metadata", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          batchSize: 2, // Force multiple batches
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.metadata?.batchCount).toBeGreaterThan(0);
        expect(Array.isArray(result.value.metadata?.batchResults)).toBe(true);
      }
    });
  });

  describe("timeout and retries", () => {
    it("should handle timeout configuration", async () => {
      const target: LoadTarget = {
        type: "api",
        config: {
          url: "https://api.example.com/webhook",
          method: "POST",
          timeout: 5000,
          retries: 3,
        } as ApiConfig,
      };

      const result = await apiLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
      }
    });
  });
});
