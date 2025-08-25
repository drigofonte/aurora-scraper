import { Result, ok } from "../../utils/result.utils";
import { getLogger } from "../../utils/logger.utils";
import type { LoadTarget, LoadConfig, LoadResult, ConsoleConfig } from "./types.js";

export class ConsoleLoader {
  private readonly logger = getLogger("ConsoleLoader");

  private readonly formatForConsole = (
    data: Record<string, unknown>[],
    format: string,
    pretty = true
  ): string => {
    switch (format) {
      case "json":
        return JSON.stringify(data, null, pretty ? 2 : 0);
      case "jsonl":
        return data.map((item) => JSON.stringify(item, null, pretty ? 2 : 0)).join("\n\n");
      case "table":
        return this.formatAsTable(data);
      default:
        return JSON.stringify(data, null, pretty ? 2 : 0);
    }
  };

  private readonly formatAsTable = (data: Record<string, unknown>[]): string => {
    if (data.length === 0) return "No data to display";

    // Get all unique keys
    const allKeys = [...new Set(data.flatMap((item) => Object.keys(item)))];

    // Calculate column widths
    const columnWidths = allKeys.map((key) => {
      const maxValueLength = Math.max(
        ...data.map((item) => String(item[key] || "").length),
        key.length
      );
      return Math.min(maxValueLength, 50); // Max width of 50 chars
    });

    // Create header
    const header = allKeys.map((key, i) => key.padEnd(columnWidths[i]!)).join(" | ");
    const separator = columnWidths.map((width) => "-".repeat(width!)).join(" | ");

    // Create rows
    const rows = data.map((item) =>
      allKeys
        .map((key, i) => {
          const value = String(item[key] || "");
          const width = columnWidths[i]!;
          return value.length > width ? value.slice(0, width - 3) + "..." : value.padEnd(width);
        })
        .join(" | ")
    );

    return [header, separator, ...rows].join("\n");
  };

  async load(
    data: Record<string, unknown>[],
    target: LoadTarget,
    config: LoadConfig
  ): Promise<Result<LoadResult, Error>> {
    try {
      const consoleConfig = target.config as ConsoleConfig;
      const format = consoleConfig.format || config.format || "json";
      const pretty = consoleConfig.pretty ?? config.options?.pretty ?? true;
      const content = this.formatForConsole(data, format, pretty);

      // Output to console
      if ((consoleConfig as ConsoleConfig & { useLogger?: boolean }).useLogger === true) {
        this.logger.info("Scraped data output", { recordCount: data.length });
        this.logger.info(content);
      } else {
        console.log(`\n=== Scraped Data (${data.length} records) ===`);
        if (data.length === 0 && format === "table") {
          console.log("No data to display");
        } else {
          console.log(content);
        }
        if (data.length > 0) {
          console.log("=== End of Data ===\n");
        }
      }

      return ok({
        target,
        success: true,
        recordCount: data.length,
        metadata: {
          format,
          pretty,
          outputMethod: (consoleConfig as ConsoleConfig & { useLogger?: boolean }).useLogger
            ? "logger"
            : "console",
        },
      });
    } catch (error) {
      this.logger.error(
        "Failed to output to console",
        error instanceof Error ? error : new Error("Unknown console output error"),
        { targetConfig: target.config }
      );
      return ok({
        target,
        success: false,
        recordCount: 0,
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
}
