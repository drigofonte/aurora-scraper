import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import { DataLoader } from "../data-loader";
import { LoadConfig } from "../types";

describe("DataLoader", () => {
  let dataLoader: DataLoader;
  let tempDir: string;
  let consoleSpy: any;

  beforeEach(async () => {
    dataLoader = new DataLoader();
    tempDir = path.join(process.cwd(), "temp-test-data-loader");

    // Clean up any existing temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }

    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleSpy.mockRestore();

    // Clean up temp directory after tests
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  describe("Multiple Targets", () => {
    it("should load data to multiple targets successfully", async () => {
      const data = [
        { name: "Product 1", price: 19.99 },
        { name: "Product 2", price: 29.99 },
      ];

      const config: LoadConfig = {
        targets: [
          {
            type: "file",
            config: { path: path.join(tempDir, "output.json") },
          },
          {
            type: "console",
            config: { format: "table" },
          },
        ],
        format: "json",
        options: { pretty: true },
      };

      const result = await dataLoader.load(data, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(2);

        // Check file target result
        const fileResult = result.value[0];
        expect(fileResult?.success).toBe(true);
        expect(fileResult?.recordCount).toBe(2);

        // Check console target result
        const consoleResult = result.value[1];
        expect(consoleResult?.success).toBe(true);
        expect(consoleResult?.recordCount).toBe(2);
      }

      // Verify file was created
      const fileContent = await fs.readFile(path.join(tempDir, "output.json"), "utf8");
      const parsedContent = JSON.parse(fileContent);
      expect(parsedContent).toEqual(data);

      // Verify console output
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should handle mixed success and failure across targets", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const config: LoadConfig = {
        targets: [
          {
            type: "file",
            config: { path: path.join(tempDir, "output.json") },
          },
          {
            type: "file",
            config: {}, // Missing path, should fail
          },
          {
            type: "console",
            config: { format: "json" },
          },
        ],
        format: "json",
      };

      const result = await dataLoader.load(data, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(3);

        expect(result.value[0]?.success).toBe(true);
        expect(result.value[1]?.success).toBe(false);
        expect(result.value[2]?.success).toBe(true);
      }
    });
  });

  describe("Convenience Methods", () => {
    it("should load to file using convenience method", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];
      const filePath = path.join(tempDir, "convenience.json");

      const result = await dataLoader.loadToFile(data, filePath, "json", true);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.success).toBe(true);
        expect(result.value[0]?.recordCount).toBe(1);
      }

      // Verify file was created
      const fileContent = await fs.readFile(filePath, "utf8");
      const parsedContent = JSON.parse(fileContent);
      expect(parsedContent).toEqual(data);
    });

    it("should load to console using convenience method", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const result = await dataLoader.loadToConsole(data, "table", false);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.success).toBe(true);
        expect(result.value[0]?.recordCount).toBe(1);
      }

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should handle different formats in convenience methods", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      // Test CSV
      const csvResult = await dataLoader.loadToFile(data, path.join(tempDir, "test.csv"), "csv");
      expect(csvResult.isOk).toBe(true);

      // Test XML
      const xmlResult = await dataLoader.loadToFile(data, path.join(tempDir, "test.xml"), "xml");
      expect(xmlResult.isOk).toBe(true);

      // Test JSONL
      const jsonlResult = await dataLoader.loadToFile(
        data,
        path.join(tempDir, "test.jsonl"),
        "jsonl"
      );
      expect(jsonlResult.isOk).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should return error when no targets are specified", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const config: LoadConfig = {
        targets: [],
        format: "json",
      };

      const result = await dataLoader.load(data, config);

      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error.message).toContain("No load targets specified");
      }
    });

    it("should return error when data is not an array", async () => {
      const data = { name: "Not an array" } as any;

      const config: LoadConfig = {
        targets: [
          {
            type: "console",
            config: {},
          },
        ],
        format: "json",
      };

      const result = await dataLoader.load(data, config);

      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error.message).toContain("Data must be an array");
      }
    });

    it("should handle unknown loader types", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const config: LoadConfig = {
        targets: [
          {
            type: "unknown" as any,
            config: {},
          },
        ],
        format: "json",
      };

      const result = await dataLoader.load(data, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.success).toBe(false);
        expect(result.value[0]?.metadata?.error).toContain("Unknown loader type");
      }
    });

    it("should handle unimplemented loader types", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const config: LoadConfig = {
        targets: [
          {
            type: "database",
            config: {},
          },
          {
            type: "api",
            config: {},
          },
        ],
        format: "json",
      };

      const result = await dataLoader.load(data, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]?.success).toBe(false);
        expect(result.value[0]?.metadata?.error).toContain("Database configuration requires");
        expect(result.value[1]?.success).toBe(false);
        expect(result.value[1]?.metadata?.error).toContain("API configuration requires");
      }
    });
  });

  describe("Configuration Options", () => {
    it("should respect format configuration", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const config: LoadConfig = {
        targets: [
          {
            type: "file",
            config: { path: path.join(tempDir, "test.json") },
          },
        ],
        format: "json",
        options: { pretty: false },
      };

      const result = await dataLoader.load(data, config);

      expect(result.isOk).toBe(true);

      // Verify compact JSON
      const fileContent = await fs.readFile(path.join(tempDir, "test.json"), "utf8");
      expect(fileContent).not.toContain("\n  ");
    });

    it("should handle missing configuration gracefully", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const config: LoadConfig = {
        targets: [
          {
            type: "console",
            config: {},
          },
        ],
        // No format specified, should default to json
      };

      const result = await dataLoader.load(data, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value[0]?.success).toBe(true);
      }
    });
  });
});
