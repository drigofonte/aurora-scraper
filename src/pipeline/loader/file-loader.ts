import fs from "fs/promises";
import path from "path";
import { Result, ok, err } from "../../utils/result.utils";
import { getLogger } from "../../utils/logger.utils";
import type { LoadTarget, LoadConfig, LoadResult, FileConfig } from "./types.js";

type FileEncoding = "utf8" | "utf16le" | "latin1" | "base64" | "hex" | "ascii" | "binary" | "ucs2";

export class FileLoader {
  private readonly logger = getLogger("FileLoader");

  private readonly ensureDirectoryExists = async (filePath: string): Promise<void> => {
    const dir = path.dirname(filePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  };

  private readonly formatData = (
    data: Record<string, unknown>[],
    format: string,
    pretty = false
  ): string => {
    switch (format) {
      case "json":
        return JSON.stringify(data, null, pretty ? 2 : 0);
      case "jsonl":
        return data.map((item) => JSON.stringify(item)).join("\n");
      case "csv":
        return this.convertToCSV(data);
      case "xml":
        return this.convertToXML(data);
      default:
        return JSON.stringify(data, null, pretty ? 2 : 0);
    }
  };

  private readonly convertToCSV = (data: Record<string, unknown>[]): string => {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0] ?? {});
    const csvHeaders = headers.join(",");
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value?.toString() || "";
        })
        .join(",")
    );

    return [csvHeaders, ...csvRows].join("\n");
  };

  private readonly convertToXML = (data: Record<string, unknown>[]): string => {
    const xmlItems = data
      .map((item) => {
        const itemXml = Object.entries(item)
          .map(([key, value]) => `    <${key}>${this.escapeXML(value?.toString() ?? "")}</${key}>`)
          .join("\n");
        return `  <item>\n${itemXml}\n  </item>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${xmlItems}\n</data>`;
  };

  private readonly escapeXML = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  async load(
    data: Record<string, unknown>[],
    target: LoadTarget,
    config: LoadConfig
  ): Promise<Result<LoadResult, Error>> {
    try {
      const filePath = (target.config as FileConfig).path;
      if (!filePath) {
        return err(new Error("File path is required for file loader"));
      }

      await this.ensureDirectoryExists(filePath);

      const format = config.format || "json";
      const pretty = config.options?.pretty ?? true;
      const content = this.formatData(data, format, pretty);

      const encoding = (config.options?.encoding ?? "utf8") as FileEncoding;
      await fs.writeFile(filePath, content, { encoding });

      const stats = await fs.stat(filePath);

      this.logger.info("File successfully written", {
        filePath,
        recordCount: data.length,
        fileSize: stats.size,
        format,
      });

      return ok({
        target,
        success: true,
        recordCount: data.length,
        outputSize: stats.size,
        metadata: {
          filePath,
          format,
          encoding,
          pretty,
        },
      });
    } catch (error) {
      this.logger.error(
        "Failed to write file",
        error instanceof Error ? error : new Error("Unknown file write error"),
        { targetConfig: target.config }
      );
      return err(error instanceof Error ? error : new Error("Unknown file write error"));
    }
  }
}
