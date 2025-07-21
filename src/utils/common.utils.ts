/**
 * Formats the current date for the JSON output in ISO 8601 format
 * @returns ISO compliant date string
 */
export function formatScrapingDate(): string {
  return new Date().toISOString();
}
