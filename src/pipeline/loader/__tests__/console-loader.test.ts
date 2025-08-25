import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ConsoleLoader } from "../console-loader";
import { LoadTarget, LoadConfig } from "../types";

describe("ConsoleLoader", () => {
  let consoleLoader: ConsoleLoader;
  let consoleSpy: any;

  beforeEach(() => {
    consoleLoader = new ConsoleLoader();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("JSON Format", () => {
    it("should output JSON data to console with pretty formatting", async () => {
      const data = [
        { name: "Product 1", price: 19.99 },
        { name: "Product 2", price: 29.99 },
      ];

      const target: LoadTarget = {
        type: "console",
        config: { format: "json" },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
        options: { pretty: true },
      };

      const result = await consoleLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
        expect(result.value.recordCount).toBe(2);
        expect(result.value.metadata?.format).toBe("json");
      }

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith("\n=== Scraped Data (2 records) ===");
      expect(consoleSpy).toHaveBeenCalledWith("=== End of Data ===\n");
    });

    it("should output JSON data without pretty formatting", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const target: LoadTarget = {
        type: "console",
        config: { format: "json" },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
        options: { pretty: false },
      };

      const result = await consoleLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.metadata?.pretty).toBe(false);
      }
    });
  });

  describe("JSONL Format", () => {
    it("should output JSONL data to console", async () => {
      const data = [
        { name: "Product 1", price: 19.99 },
        { name: "Product 2", price: 29.99 },
      ];

      const target: LoadTarget = {
        type: "console",
        config: { format: "jsonl" },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "jsonl",
      };

      const result = await consoleLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
        expect(result.value.recordCount).toBe(2);
      }

      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("Table Format", () => {
    it("should output tabular data to console", async () => {
      const data = [
        { name: "Product 1", price: 19.99, category: "Electronics" },
        { name: "Product 2", price: 29.99, category: "Books" },
      ];

      const target: LoadTarget = {
        type: "console",
        config: { format: "table" },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
      };

      const result = await consoleLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
        expect(result.value.recordCount).toBe(2);
      }

      expect(consoleSpy).toHaveBeenCalledTimes(3);

      // Check that table formatting was used
      const tableOutput = consoleSpy.mock.calls[1][0];
      expect(tableOutput).toContain("name");
      expect(tableOutput).toContain("price");
      expect(tableOutput).toContain("category");
      expect(tableOutput).toContain("|");
    });

    it("should handle empty data gracefully", async () => {
      const data: any[] = [];

      const target: LoadTarget = {
        type: "console",
        config: { format: "table" },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
      };

      const result = await consoleLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(true);
        expect(result.value.recordCount).toBe(0);
      }

      expect(consoleSpy).toHaveBeenCalledWith("\n=== Scraped Data (0 records) ===");
      expect(consoleSpy).toHaveBeenCalledWith("No data to display");
    });

    it("should truncate long values in table format", async () => {
      const data = [
        {
          name: "Very Long Product Name That Exceeds The Maximum Column Width Limit",
          price: 19.99,
        },
      ];

      const target: LoadTarget = {
        type: "console",
        config: { format: "table" },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
      };

      const result = await consoleLoader.load(data, target, config);

      expect(result.isOk).toBe(true);

      const tableOutput = consoleSpy.mock.calls[1][0];
      expect(tableOutput).toContain("...");
    });
  });

  describe("Logger Output", () => {
    it("should use logger instead of console when configured", async () => {
      const data = [{ name: "Product 1", price: 19.99 }];

      const target: LoadTarget = {
        type: "console",
        config: { useLogger: true },
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
      };

      const result = await consoleLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.metadata?.outputMethod).toBe("logger");
      }

      // Console.log should not be called when using logger
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle exceptions gracefully", async () => {
      // Mock console.log to throw an error
      consoleSpy.mockImplementation(() => {
        throw new Error("Console error");
      });

      const data = [{ name: "Product 1", price: 19.99 }];

      const target: LoadTarget = {
        type: "console",
        config: {},
      };

      const config: LoadConfig = {
        targets: [target],
        format: "json",
      };

      const result = await consoleLoader.load(data, target, config);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.success).toBe(false);
        expect(result.value.recordCount).toBe(0);
        expect(result.value.metadata?.error).toContain("Console error");
      }
    });
  });
});
