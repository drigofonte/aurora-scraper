import { Result, ok, err } from "../../utils/result.utils";
import { getLogger } from "../../utils/logger.utils";
import { LoadTarget, LoadConfig, LoadResult } from "./types";
import { FileLoader } from "./file-loader";
import { ConsoleLoader } from "./console-loader";
import { DatabaseLoader } from "./database-loader";
import { ApiLoader } from "./api-loader";

export class DataLoader {
  private readonly logger = getLogger("DataLoader");
  private readonly fileLoader = new FileLoader();
  private readonly consoleLoader = new ConsoleLoader();
  private readonly databaseLoader = new DatabaseLoader();
  private readonly apiLoader = new ApiLoader();

  async load(
    data: Record<string, unknown>[],
    config: LoadConfig
  ): Promise<Result<LoadResult[], Error>> {
    try {
      if (!config.targets || config.targets.length === 0) {
        return err(new Error("No load targets specified"));
      }

      if (!Array.isArray(data)) {
        return err(new Error("Data must be an array"));
      }

      this.logger.info("Starting data loading", {
        recordCount: data.length,
        targetCount: config.targets.length,
        format: config.format || "json",
      });

      const results: LoadResult[] = [];

      for (const target of config.targets) {
        let result: Result<LoadResult, Error>;

        switch (target.type) {
          case "file":
            result = await this.fileLoader.load(data, target, config);
            break;
          case "console":
            result = await this.consoleLoader.load(data, target, config);
            break;
          case "database":
            result = await this.databaseLoader.load(data, target, config);
            break;
          case "api":
            result = await this.apiLoader.load(data, target, config);
            break;
          default:
            result = err(new Error(`Unknown loader type: ${target.type}`));
        }

        if (result.isOk) {
          results.push(result.value);
          this.logger.info("Target load completed", {
            type: target.type,
            success: result.value.success,
            recordCount: result.value.recordCount,
          });
        } else {
          this.logger.error("Target load failed", result.error, {
            type: target.type,
            config: target.config,
          });

          // Add failed result
          results.push({
            target,
            success: false,
            recordCount: 0,
            metadata: {
              error: result.error.message,
            },
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const totalRecords = results.reduce((sum, r) => sum + r.recordCount, 0);

      this.logger.info("Data loading completed", {
        totalTargets: config.targets.length,
        successfulTargets: successCount,
        failedTargets: config.targets.length - successCount,
        totalRecordsLoaded: totalRecords,
      });

      return ok(results);
    } catch (error) {
      this.logger.error(
        "Data loading failed",
        error instanceof Error ? error : new Error("Unknown loading error")
      );
      return err(error instanceof Error ? error : new Error("Unknown loading error"));
    }
  }

  // Convenience methods for common scenarios
  async loadToFile(
    data: Record<string, unknown>[],
    filePath: string,
    format: "json" | "csv" | "xml" | "jsonl" = "json",
    pretty = true
  ): Promise<Result<LoadResult[], Error>> {
    return this.load(data, {
      targets: [
        {
          type: "file",
          config: { path: filePath },
        },
      ],
      format,
      options: { pretty },
    });
  }

  async loadToConsole(
    data: Record<string, unknown>[],
    format: "json" | "table" | "jsonl" = "table",
    useLogger = false
  ): Promise<Result<LoadResult[], Error>> {
    return this.load(data, {
      targets: [
        {
          type: "console",
          config: { format, useLogger },
        },
      ],
      format: format === "table" ? "json" : format,
      options: { pretty: true },
    });
  }
}

/**
 * Factory function to create a new data loader instance
 */
export function createDataLoader(): DataLoader {
  return new DataLoader();
}
