/**
 * Pipeline configuration utilities and factory functions for creating reusable configurations
 */

import type {
  PipelineConfig,
  FileTargetConfig,
  SpacesTargetConfig,
  ConsoleTargetConfig,
  ExtractorConfig,
  TransformerConfig,
  LoaderConfig,
  NavigationStep,
} from "./types.js";

/**
 * Base configuration templates for common use cases
 */
export const BASE_EXTRACTOR_CONFIG: Partial<ExtractorConfig> = {
  browserConfig: {
    headless: true,
    viewport: {
      width: 1280,
      height: 800,
    },
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  },
  timeout: 30000,
  retries: {
    count: 3,
    delay: 1000,
    backoff: "exponential",
    maxDelay: 10000,
  },
};

export const BASE_TRANSFORMER_CONFIG: Partial<TransformerConfig> = {
  validationRules: [],
  options: {
    strictValidation: false,
    allowAdditionalFields: false,
    locale: "en-US",
  },
};

export const BASE_LOADER_CONFIG: Partial<LoaderConfig> = {
  options: {
    timeout: 10000,
    retries: {
      count: 3,
      delay: 1000,
      backoff: "linear",
    },
  },
};

/**
 * Common navigation step templates
 */
export const NAVIGATION_STEPS = {
  waitForPageLoad: (timeout = 5000): NavigationStep => ({
    type: "wait",
    waitCondition: { type: "load" },
    timeout,
    description: "Wait for page load",
  }),

  waitForTimeout: (value: number, description?: string): NavigationStep => ({
    type: "wait",
    waitCondition: { type: "timeout", value },
    description: description ?? `Wait for ${value}ms`,
  }),

  clickElement: (
    selector: string,
    options?: {
      maxAttempts?: number;
      timeout?: number;
      description?: string;
    }
  ): NavigationStep => ({
    type: "click",
    selector,
    maxAttempts: options?.maxAttempts ?? 1,
    timeout: options?.timeout ?? 3000,
    description: options?.description ?? `Click ${selector}`,
  }),

  scrollToBottom: (timeout = 1000): NavigationStep => ({
    type: "scroll",
    timeout,
    description: "Scroll to bottom of page",
  }),
};

/**
 * Test configuration for development and testing
 */
export const TEST_CONFIG: PipelineConfig = {
  extractor: {
    url: "https://example.com",
    browserConfig: {
      headless: true,
      viewport: {
        width: 1024,
        height: 768,
      },
    },
    timeout: 10000,
    navigationSteps: [NAVIGATION_STEPS.waitForPageLoad()],
  },
  transformer: {
    type: "item",
    schema: "test-event-v1",
    fieldMappings: {
      title: {
        selector: "h1",
        attribute: "text",
        required: true,
      },
    },
  },
  loader: {
    target: "console",
    targetConfig: {
      type: "console",
      format: "json",
      pretty: true,
    } as ConsoleTargetConfig,
  },
};

/**
 * Configuration factory functions for creating reusable pipeline configurations
 */
export class PipelineConfigFactory {
  /**
   * Create basic web scraping configuration
   */
  static createBasicConfig(options: {
    url: string;
    schema: string;
    type?: "item" | "list";
    listConfig?: {
      containerSelector: string;
      itemSelector: string;
    };
    fieldMappings: Record<
      string,
      {
        selector: string;
        attribute?: string;
        transformer?: string;
        required?: boolean;
      }
    >;
    navigationSteps?: NavigationStep[];
    outputPath?: string;
    headless?: boolean;
  }): PipelineConfig {
    return {
      extractor: {
        ...BASE_EXTRACTOR_CONFIG,
        url: options.url,
        browserConfig: {
          ...BASE_EXTRACTOR_CONFIG.browserConfig!,
          headless: options.headless ?? true,
        },
        navigationSteps: options.navigationSteps ?? [NAVIGATION_STEPS.waitForPageLoad()],
      } as ExtractorConfig,

      transformer: {
        ...BASE_TRANSFORMER_CONFIG,
        type: options.type ?? "item",
        schema: options.schema,
        ...(options.listConfig && { listConfig: options.listConfig }),
        fieldMappings: Object.entries(options.fieldMappings).reduce(
          (acc, [key, mapping]) => ({
            ...acc,
            [key]: {
              selector: mapping.selector,
              attribute: mapping.attribute ?? "text",
              transformer: mapping.transformer ?? "trim",
              required: mapping.required ?? false,
            },
          }),
          {}
        ),
      } as TransformerConfig,

      loader: {
        ...BASE_LOADER_CONFIG,
        target: "file",
        targetConfig: {
          type: "file",
          path: options.outputPath ?? "output/scraped_data.json",
          format: "json",
          encoding: "utf8",
          createDirectory: true,
        } as FileTargetConfig,
      } as LoaderConfig,
    };
  }

  /**
   * Create configuration with DigitalOcean Spaces target
   */
  static createCloudConfig(options: {
    url: string;
    schema: string;
    fieldMappings: Record<
      string,
      {
        selector: string;
        attribute?: string;
        transformer?: string;
        required?: boolean;
      }
    >;
    navigationSteps?: NavigationStep[];
    spaces: {
      endpoint: string;
      region: string;
      bucket: string;
      key: string;
      accessKeyId: string;
      secretAccessKey: string;
      acl?: string;
    };
    headless?: boolean;
  }): PipelineConfig {
    const baseConfig = this.createBasicConfig({
      url: options.url,
      schema: options.schema,
      fieldMappings: options.fieldMappings,
      ...(options.navigationSteps && { navigationSteps: options.navigationSteps }),
      headless: options.headless ?? true,
    });

    return {
      ...baseConfig,
      loader: {
        target: "digitalocean-spaces",
        targetConfig: {
          type: "digitalocean-spaces",
          endpoint: options.spaces.endpoint,
          region: options.spaces.region,
          bucket: options.spaces.bucket,
          key: options.spaces.key,
          accessKeyId: options.spaces.accessKeyId,
          secretAccessKey: options.spaces.secretAccessKey,
          acl: options.spaces.acl ?? "public-read",
        } as SpacesTargetConfig,
        options: {
          timeout: 30000,
          compression: "gzip",
          retries: {
            count: 5,
            delay: 2000,
            backoff: "exponential",
            maxDelay: 30000,
          },
        },
      },
    };
  }

  /**
   * Create configuration with console output (for testing)
   */
  static createTestConfig(options: {
    url: string;
    schema: string;
    fieldMappings: Record<
      string,
      {
        selector: string;
        attribute?: string;
        transformer?: string;
        required?: boolean;
      }
    >;
    navigationSteps?: NavigationStep[];
    headless?: boolean;
  }): PipelineConfig {
    const baseConfig = this.createBasicConfig({
      url: options.url,
      schema: options.schema,
      fieldMappings: options.fieldMappings,
      ...(options.navigationSteps && { navigationSteps: options.navigationSteps }),
      headless: options.headless ?? true,
    });

    return {
      ...baseConfig,
      loader: {
        target: "console",
        targetConfig: {
          type: "console",
          format: "json",
          pretty: true,
        } as ConsoleTargetConfig,
        options: {
          timeout: 5000,
        },
      },
    };
  }

  /**
   * Build field mappings for event scraping configuration
   */
  private static buildEventFieldMappings(options: {
    titleSelector: string;
    urlSelector?: string;
    descriptionSelector?: string;
    dateSelector?: string;
    locationSelector?: string;
    imageSelector?: string;
    categorySelector?: string;
  }): Record<
    string,
    {
      selector: string;
      attribute?: string;
      transformer?: string;
      required?: boolean;
    }
  > {
    const fieldMappings = this.buildRequiredFieldMappings(options);
    this.addOptionalFieldMappings(fieldMappings, options);
    return fieldMappings;
  }

  /**
   * Build required field mappings
   */
  private static buildRequiredFieldMappings(options: { titleSelector: string }): Record<
    string,
    {
      selector: string;
      attribute?: string;
      transformer?: string;
      required?: boolean;
    }
  > {
    return {
      title: {
        selector: options.titleSelector,
        attribute: "text",
        transformer: "trim",
        required: true,
      },
    };
  }

  /**
   * Add optional field mappings to existing mappings
   */
  private static addOptionalFieldMappings(
    fieldMappings: Record<
      string,
      {
        selector: string;
        attribute?: string;
        transformer?: string;
        required?: boolean;
      }
    >,
    options: {
      urlSelector?: string;
      descriptionSelector?: string;
      dateSelector?: string;
      locationSelector?: string;
      imageSelector?: string;
      categorySelector?: string;
    }
  ): void {
    if (options.urlSelector) {
      fieldMappings.url = {
        selector: options.urlSelector,
        attribute: "href",
        transformer: "url",
        required: false,
      };
    }

    if (options.descriptionSelector) {
      fieldMappings.description = {
        selector: options.descriptionSelector,
        attribute: "text",
        transformer: "trim",
        required: false,
      };
    }

    if (options.dateSelector) {
      fieldMappings.date = {
        selector: options.dateSelector,
        attribute: "text",
        transformer: "date",
        required: false,
      };
    }

    if (options.locationSelector) {
      fieldMappings.location = {
        selector: options.locationSelector,
        attribute: "text",
        transformer: "trim",
        required: false,
      };
    }

    if (options.imageSelector) {
      fieldMappings.image = {
        selector: options.imageSelector,
        attribute: "src",
        transformer: "url",
        required: false,
      };
    }

    if (options.categorySelector) {
      fieldMappings.category = {
        selector: options.categorySelector,
        attribute: "text",
        transformer: "trim",
        required: false,
      };
    }
  }

  /**
   * Create configuration for event scraping with common patterns
   */
  static createEventScrapingConfig(options: {
    url: string;
    containerSelector: string;
    titleSelector: string;
    urlSelector?: string;
    descriptionSelector?: string;
    dateSelector?: string;
    locationSelector?: string;
    imageSelector?: string;
    categorySelector?: string;
    navigationSteps?: NavigationStep[];
    outputPath?: string;
    headless?: boolean;
  }): PipelineConfig {
    const fieldMappings = this.buildEventFieldMappings(options);

    return this.createBasicConfig({
      url: options.url,
      schema: "event-v1",
      fieldMappings,
      navigationSteps: options.navigationSteps ?? [NAVIGATION_STEPS.waitForPageLoad()],
      outputPath: options.outputPath ?? "output/events.json",
      headless: options.headless ?? true,
    });
  }

  /**
   * Create minimal test configuration
   */
  static test(url?: string): PipelineConfig {
    return {
      ...TEST_CONFIG,
      extractor: {
        ...TEST_CONFIG.extractor,
        url: url ?? TEST_CONFIG.extractor.url,
      },
    };
  }
}
