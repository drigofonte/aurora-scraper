/**
 * Pipeline loader wrapper to adapt DataLoader to Pipeline Loader interface
 */

import type { Result } from "../../utils/result.utils.js";
import { ok, err } from "../../utils/result.utils.js";
import type {
  Loader,
  LoaderConfig,
  LoaderError,
  FileTargetConfig,
  ConsoleTargetConfig,
  DatabaseTargetConfig,
  WebhookTargetConfig,
} from "../types.js";
import { DataLoader } from "./data-loader.js";
import type { LoadConfig, LoadTarget } from "./types.js";
import { getLogger } from "../../utils/logger.utils.js";

const logger = getLogger("PipelineLoader");

/**
 * Pipeline loader that wraps DataLoader to conform to Pipeline interface
 */
export class PipelineLoader implements Loader {
  private readonly dataLoader = new DataLoader();

  async load(
    data: readonly Record<string, unknown>[],
    config: LoaderConfig
  ): Promise<Result<string, LoaderError>> {
    try {
      logger.debug("Converting pipeline config to data loader config", {
        target: config.target,
        recordCount: data.length,
      });

      // Convert pipeline config to data loader config
      const loadConfig = this.convertToLoadConfig(config);

      // Convert readonly array to mutable array
      const mutableData = [...data];

      // Execute the load
      const result = await this.dataLoader.load(mutableData, loadConfig);

      if (result.isErr) {
        const loaderError: LoaderError = {
          code: "UPLOAD_FAILED",
          message: result.error.message,
          details: { originalError: result.error },
        };
        return err(loaderError);
      }

      // Return target identifier
      const targetId = this.getTargetIdentifier(config);
      return ok(targetId);
    } catch (error) {
      const loaderError: LoaderError = {
        code: "UPLOAD_FAILED",
        message: `Pipeline loader failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
      };
      return err(loaderError);
    }
  }

  /**
   * Convert pipeline LoaderConfig to DataLoader LoadConfig
   */
  private convertToLoadConfig(config: LoaderConfig): LoadConfig {
    const target: LoadTarget = {
      type:
        config.target === "file"
          ? "file"
          : config.target === "console"
            ? "console"
            : config.target === "database"
              ? "database"
              : "api",
      config: this.convertTargetConfig(config),
    };

    const loadConfig: LoadConfig = {
      targets: [target],
      format: this.getFormatFromTarget(config) as "json" | "csv" | "xml" | "jsonl",
    };

    if (config.options) {
      // Map LoaderOptions to LoadConfig options
      const options: LoadConfig["options"] = {
        pretty: true, // Default for pretty printing
        encoding: "utf-8", // Default encoding
      };

      if (config.options.compression === "gzip") {
        options.compression = "gzip";
      }

      loadConfig.options = options;
    }

    return loadConfig;
  }

  /**
   * Convert target configuration
   */
  private convertTargetConfig(config: LoaderConfig): Record<string, unknown> {
    switch (config.target) {
      case "file": {
        const fileConfig = config.targetConfig as FileTargetConfig;
        return {
          type: "file",
          config: {
            path: fileConfig.path,
            format: fileConfig.format,
            encoding: fileConfig.encoding,
            createDirectory: fileConfig.createDirectory,
          },
        };
      }
      case "console": {
        const consoleConfig = config.targetConfig as ConsoleTargetConfig;
        return {
          type: "console",
          config: {
            format: consoleConfig.format,
            pretty: consoleConfig.pretty,
          },
        };
      }
      case "database": {
        const dbConfig = config.targetConfig as DatabaseTargetConfig;
        return {
          type: "database",
          config: {
            connectionString: dbConfig.connectionString,
            table: dbConfig.table,
            schema: dbConfig.schema,
            upsert: dbConfig.upsert,
          },
        };
      }
      case "webhook": {
        const webhookConfig = config.targetConfig as WebhookTargetConfig;
        return {
          type: "api",
          config: {
            url: webhookConfig.url,
            method: webhookConfig.method,
            headers: webhookConfig.headers,
            timeout: webhookConfig.timeout,
          },
        };
      }
      default:
        return {
          type: config.target,
          config: config.targetConfig,
        };
    }
  }

  /**
   * Get format from target configuration
   */
  private getFormatFromTarget(config: LoaderConfig): string {
    if (config.target === "file") {
      const fileConfig = config.targetConfig as FileTargetConfig;
      return fileConfig.format || "json";
    }
    return "json";
  }

  /**
   * Get target identifier for return value
   */
  private getTargetIdentifier(config: LoaderConfig): string {
    switch (config.target) {
      case "file": {
        const fileConfig = config.targetConfig as FileTargetConfig;
        return fileConfig.path;
      }
      case "console":
        return "console";
      case "database": {
        const dbConfig = config.targetConfig as DatabaseTargetConfig;
        return `${dbConfig.table}`;
      }
      case "webhook": {
        const webhookConfig = config.targetConfig as WebhookTargetConfig;
        return webhookConfig.url;
      }
      default:
        return config.target;
    }
  }
}

/**
 * Factory function to create a pipeline loader
 */
export function createPipelineLoader(): PipelineLoader {
  return new PipelineLoader();
}
