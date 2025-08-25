import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { FileLoader } from "../file-loader";
import { LoadTarget, LoadConfig, FileConfig } from "../types";

describe("FileLoader", () => {
  let fileLoader: FileLoader;
  let tempDir: string;

  beforeEach(async () => {
    fileLoader = new FileLoader();
    tempDir = path.join(process.cwd(), "temp-test-loader");

    // Clean up any existing temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  afterEach(async () => {
    // Clean up temp directory after tests
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  describe("JSON Output", () => {
    it("should write JSON data to file with pretty formatting", async () => {
      const data = [
        { name: "Product 1", price: 19.99 },
        { name: "Product 2", price: 29.99 },
      ];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "output.json") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
        options: { pretty: true },
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
        expect(result.value.recordCount).toBe(2);
        expect(result.value.outputSize).toBeGreaterThan(0);

        // Verify file contents
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");
        const parsedContent = JSON.parse(fileContent);
        expect(parsedContent).toEqual(data);
      }
    });

    it("should write JSON data to file with compact formatting", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "compact.json") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
        options: { pretty: false },
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        // Verify file contents are compact
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");
        expect(fileContent).not.toContain("\n  ");
        const parsedContent = JSON.parse(fileContent);
        expect(parsedContent).toEqual(data);
      }
    });
  });

  describe("CSV Output", () => {
    it("should write CSV data to file", async () => {
      const data = [
        { name: "Product 1", price: 19.99, category: "Electronics" },
        { name: "Product 2", price: 29.99, category: "Books" },
      ];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "output.csv") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "csv",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");
        const lines = fileContent.trim().split("\n");

        expect(lines).toHaveLength(3); // Header + 2 data rows
        expect(lines[0]).toBe("name,price,category");
        expect(lines[1]).toBe("Product 1,19.99,Electronics");
        expect(lines[2]).toBe("Product 2,29.99,Books");
      }
    });

    it("should handle CSV data with commas and quotes", async () => {
      const data = [{ name: 'Product "Special"', description: "Item, with commas" }];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "special.csv") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "csv",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");
        expect(fileContent).toContain('"Product ""Special"""');
        expect(fileContent).toContain('"Item, with commas"');
      }
    });

    it("should handle empty CSV data", async () => {
      const data: any[] = [];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "empty.csv") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "csv",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");
        expect(fileContent).toBe("");
      }
    });
  });

  describe("XML Output", () => {
    it("should write XML data to file", async () => {
      const data = [
        { name: "Product 1", price: 19.99 },
        { name: "Product 2", price: 29.99 },
      ];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "output.xml") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "xml",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");

        expect(fileContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(fileContent).toContain("<data>");
        expect(fileContent).toContain("<item>");
        expect(fileContent).toContain("<name>Product 1</name>");
        expect(fileContent).toContain("<price>19.99</price>");
      }
    });

    it("should escape XML special characters", async () => {
      const data = [{ name: "Product & Co", description: '<special> "quoted"' }];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "escaped.xml") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "xml",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");
        expect(fileContent).toContain("Product &amp; Co");
        expect(fileContent).toContain("&lt;special&gt; &quot;quoted&quot;");
      }
    });
  });

  describe("JSONL Output", () => {
    it("should write JSONL data to file", async () => {
      const data = [
        { name: "Product 1", price: 19.99 },
        { name: "Product 2", price: 29.99 },
      ];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "output.jsonl") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "jsonl",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");
        const lines = fileContent.trim().split("\n");

        expect(lines).toHaveLength(2);
        expect(JSON.parse(lines[0]!)).toEqual(data[0]);
        expect(JSON.parse(lines[1]!)).toEqual(data[1]);
      }
    });
  });

  describe("Directory Creation", () => {
    it("should create nested directories if they don't exist", async () => {
      const data = [{ test: "data" }];

      const target: LoadTarget = {
        type: "file",
        config: { path: path.join(tempDir, "nested", "deep", "output.json") },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        // Verify file exists and directory was created
        const fileContent = await fs.readFile((target.config as FileConfig).path, "utf8");
        expect(JSON.parse(fileContent)).toEqual(data);
      }
    });
  });

  describe("Error Handling", () => {
    it("should return error when file path is missing", async () => {
      const data = [{ test: "data" }];

      const target: LoadTarget = {
        type: "file",
        config: {},
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error.message).toContain("File path is required");
      }
    });

    it("should handle invalid file paths gracefully", async () => {
      const data = [{ test: "data" }];

      const target: LoadTarget = {
        type: "file",
        config: { path: "/invalid/path/\0null/file.json" },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
      };

      const result = await fileLoader.load(data, target, config);

      expect(result.isOk).toBe(false);
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });
});
