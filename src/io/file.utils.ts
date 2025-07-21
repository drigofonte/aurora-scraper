import * as fs from "fs/promises";
import { JsonOutput } from "types/output.js";

/**
 * Saves data to a JSON file
 * @param filePath - Path where to save the JSON file
 * @param data - Data to save
 */
export async function saveJsonFile(
  filePath: string,
  data: JsonOutput
): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✅ JSON data saved to: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error saving JSON file: ${error}`);
    throw error;
  }
}

/**
 * Saves HTML content to a file
 * @param filePath - Path where to save the HTML file
 * @param content - HTML content to save
 */
export async function saveHtmlFile(
  filePath: string,
  content: string
): Promise<void> {
  try {
    await fs.writeFile(filePath, content, "utf-8");
    console.log(`✅ HTML content saved to: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error saving HTML file: ${error}`);
    throw error;
  }
}

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param dirPath - Directory path to ensure exists
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`❌ Error creating directory ${dirPath}: ${error}`);
    throw error;
  }
}
