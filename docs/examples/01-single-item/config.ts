/**
 * Configuration for Single Item Scraping Example
 */

import type { PipelineConfig } from "../../../src/pipeline/types.js";

interface ArticleConfigOptions {
  url: string;
  outputPath: string;
  headless?: boolean;
}

export function createArticleConfig(options: ArticleConfigOptions): PipelineConfig {
  return {
    extractor: {
      url: options.url,
      navigationSteps: [],
      browserConfig: {
        headless: options.headless ?? true,
        viewport: { width: 1920, height: 1080 },
      },
      timeout: 30000,
    },
    transformer: {
      type: "item",
      schema: "article",
      fieldMappings: {
        title: {
          selector: "h1, .article-title, .title",
          transformer: "trim",
        },
        author: {
          selector: ".author, .author-name, .by-author",
          transformer: "trim",
          defaultValue: "Unknown Author",
        },
        publishedDate: {
          selector: "time[datetime], .publish-date, .date",
          attribute: "datetime",
          transformer: "trim",
          defaultValue: new Date().toISOString(),
        },
        content: {
          selector: ".article-content, .content, .article-body, p",
          transformer: "html-to-text",
        },
        category: {
          selector: ".category, .tag, .section",
          transformer: "trim",
          defaultValue: "General",
        },
      },
    },
    loader: {
      target: "file",
      targetConfig: {
        type: "file",
        path: options.outputPath,
        format: "json",
      } as import("../../../src/pipeline/types.js").FileTargetConfig,
    },
  };
}
