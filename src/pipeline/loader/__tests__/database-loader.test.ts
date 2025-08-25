/**
 * Unit tests for DatabaseLoader
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseLoader, type DatabaseConfig } from "../database-loader.js";
import type { LoadTarget, LoadConfig } from "../types.js";

describe("DatabaseLoader", () => {
  let databaseLoader: DatabaseLoader;
  let testData: Record<string, unknown>[];
  let baseConfig: LoadConfig;

  beforeEach(() => {
    databaseLoader = new DatabaseLoader();
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

  describe("PostgreSQL loader", () => {
    it("should successfully load data to PostgreSQL", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
          table: "products",
          schema: "public",
          upsert: false,
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.target).toBe(target);
        expect(result.value.recordCount).toBe(3);
        expect(result.value.success).toBe(true);
        expect(result.value.outputSize).toBeGreaterThan(0);
        expect(result.value.metadata?.table).toBe("products");
        expect(result.value.metadata?.schema).toBe("public");
        expect(result.value.metadata?.upsert).toBe(false);
      }
    });

    it("should handle upsert configuration for PostgreSQL", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
          table: "products",
          upsert: true,
          batchSize: 100,
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.metadata?.upsert).toBe(true);
        expect(result.value.metadata?.batchSize).toBe(100);
      }
    });
  });

  describe("MySQL loader", () => {
    it("should successfully load data to MySQL", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "mysql",
          connectionString: "mysql://localhost:3306/testdb",
          table: "products",
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(3);
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe("SQLite loader", () => {
    it("should successfully load data to SQLite", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "sqlite",
          connectionString: "sqlite:./test.db",
          table: "products",
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(3);
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe("MongoDB loader", () => {
    it("should successfully load data to MongoDB", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "mongodb",
          connectionString: "mongodb://localhost:27017/testdb",
          table: "products", // collection name in MongoDB
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(3);
        expect(result.value.success).toBe(true);
      }
    });
  });

  describe("configuration validation", () => {
    it("should reject invalid target type", async () => {
      const target: LoadTarget = {
        type: "file", // Wrong type
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
          table: "products",
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("Invalid target type");
      }
    });

    it("should reject missing connectionString", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          table: "products",
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("connectionString and table");
      }
    });

    it("should reject missing table name", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("connectionString and table");
      }
    });

    it("should reject unsupported database type", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "oracle", // Unsupported type
          connectionString: "oracle://localhost:1521/testdb",
          table: "products",
        } as any,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toContain("Unsupported database type");
      }
    });
  });

  describe("data handling", () => {
    it("should handle empty data array", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
          table: "products",
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load([], target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(0);
        expect(result.value.success).toBe(true);
      }
    });

    it("should handle large datasets with batch size", async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: Math.random() * 100,
      }));

      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
          table: "products",
          batchSize: 100,
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(largeDataset, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.recordCount).toBe(1000);
        expect(result.value.success).toBe(true);
        expect(result.value.metadata?.batchSize).toBe(100);
      }
    });

    it("should calculate data size correctly", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
          table: "products",
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.outputSize).toBeGreaterThan(0);
        expect(typeof result.value.outputSize).toBe("number");
      }
    });
  });

  describe("metadata tracking", () => {
    it("should include execution time in metadata", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
          table: "products",
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.metadata?.executionTime).toBeGreaterThan(0);
        expect(typeof result.value.metadata?.executionTime).toBe("number");
      }
    });

    it("should include all configuration options in metadata", async () => {
      const target: LoadTarget = {
        type: "database",
        config: {
          type: "postgresql",
          connectionString: "postgresql://localhost:5432/testdb",
          table: "products",
          schema: "public",
          upsert: true,
          batchSize: 50,
        } as DatabaseConfig,
      };

      const result = await databaseLoader.load(testData, target, baseConfig);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.metadata?.table).toBe("products");
        expect(result.value.metadata?.schema).toBe("public");
        expect(result.value.metadata?.upsert).toBe(true);
        expect(result.value.metadata?.batchSize).toBe(50);
      }
    });
  });
});
