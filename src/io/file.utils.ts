import * as fs from "fs/promises";

import type { JsonOutput } from "@/types/output.js";
import type { Result } from "@/utils/result.utils.js";
import { tryAsync } from "@/utils/result.utils.js";
import { getLogger } from "@/utils/logger.utils.js";

const logger = getLogger("FileUtils");

/**
 * Saves data to a JSON file
 * @param filePath - Path where to save the JSON file
 * @param data - Data to save
 */
export async function saveJsonFile(filePath: string, data: JsonOutput): Promise<void> {
  const result = await saveJsonFileResult(filePath, data);
  if (result.isErr) {
    throw result.error;
  }
}

/**
 * Saves data to a JSON file and returns a Result
 * @param filePath - Path where to save the JSON file
 * @param data - Data to save
 */
export async function saveJsonFileResult(
  filePath: string,
  data: JsonOutput
): Promise<Result<void, Error>> {
  return tryAsync(async () => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    logger.info("JSON data saved successfully", { filePath });
  });
}

/**
 * Saves HTML content to a file
 * @param filePath - Path where to save the HTML file
 * @param content - HTML content to save
 */
export async function saveHtmlFile(filePath: string, content: string): Promise<void> {
  const result = await saveHtmlFileResult(filePath, content);
  if (result.isErr) {
    throw result.error;
  }
}

/**
 * Saves HTML content to a file and returns a Result
 * @param filePath - Path where to save the HTML file
 * @param content - HTML content to save
 */
export async function saveHtmlFileResult(
  filePath: string,
  content: string
): Promise<Result<void, Error>> {
  return tryAsync(async () => {
    await fs.writeFile(filePath, content, "utf-8");
    logger.info("HTML content saved successfully", { filePath });
  });
}

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param dirPath - Directory path to ensure exists
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  const result = await ensureDirectoryExistsResult(dirPath);
  if (result.isErr) {
    throw result.error;
  }
}

/**
 * Ensures a directory exists, creates it if it doesn't and returns a Result
 * @param dirPath - Directory path to ensure exists
 */
export async function ensureDirectoryExistsResult(dirPath: string): Promise<Result<void, Error>> {
  return tryAsync(async () => {
    await fs.mkdir(dirPath, { recursive: true });
    logger.debug("Directory ensured", { dirPath });
  });
}

/**
 * Reads a file and returns its contents
 * @param filePath - Path to the file to read
 */
export async function readFileResult(filePath: string): Promise<Result<string, Error>> {
  return tryAsync(async () => {
    const content = await fs.readFile(filePath, "utf-8");
    logger.debug("File read successfully", { filePath, size: content.length });
    return content;
  });
}

/**
 * Checks if a file exists
 * @param filePath - Path to the file to check
 */
export async function fileExistsResult(filePath: string): Promise<Result<boolean, Error>> {
  return tryAsync(async () => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });
}
