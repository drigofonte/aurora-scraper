/**
 * Default pipeline configurations for common scraping scenarios
 */

import type {
  PipelineConfig,
  FileTargetConfig,
  SpacesTargetConfig,
  ConsoleTargetConfig,
} from "./types.js";

/**
 * Default configuration for Barcelona events scraping
 */
export const BARCELONA_EVENTS_CONFIG: PipelineConfig = {
  extractor: {
    url: "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
    browserConfig: {
      headless: false,
      viewport: {
        width: 1280,
        height: 800,
      },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    },
    timeout: 60000,
    navigationSteps: [
      {
        type: "wait",
        waitCondition: {
          type: "load",
        },
        timeout: 5000,
        description: "Wait for initial page load",
      },
      {
        type: "click",
        selector: "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
        timeout: 3000,
        maxAttempts: 1,
        description: "Accept cookies if banner appears",
      },
      {
        type: "click",
        selector: 'button[data-api*="show_more"]',
        maxAttempts: 20,
        timeout: 2000,
        description: 'Click "Ver más" button to load more events',
      },
      {
        type: "wait",
        waitCondition: {
          type: "timeout",
          value: 1000,
        },
        description: "Wait for content to stabilize",
      },
    ],
    retries: {
      count: 3,
      delay: 1000,
      backoff: "exponential",
      maxDelay: 10000,
    },
  },
  transformer: {
    schema: "barcelona-event-v1",
    fieldMappings: {
      title: {
        selector: "a.ajuntament-guia-item-name",
        attribute: "text",
        transformer: "trim",
        required: true,
      },
      url: {
        selector: "a.ajuntament-guia-item-name",
        attribute: "href",
        transformer: "url",
        required: true,
      },
      description: {
        selector: "p.ajuntament-guia-item-excerpt",
        attribute: "text",
        transformer: "trim",
        required: false,
      },
      category: {
        selector: "strong",
        attribute: "text",
        transformer: "trim",
        required: false,
      },
      when: {
        selector: "li.ajuntament-guia-item-when",
        attribute: "text",
        transformer: "date",
        required: false,
      },
      where: {
        selector: "li.ajuntament-guia-item-where",
        attribute: "text",
        transformer: "trim",
        required: false,
      },
      location: {
        selector: "li.ajuntament-guia-item-where a",
        attribute: "text",
        transformer: "trim",
        required: false,
      },
      image: {
        selector: "img",
        attribute: "src",
        transformer: "url",
        required: false,
      },
    },
    validationRules: [
      {
        field: "title",
        rule: "required",
        message: "Event title is required",
      },
      {
        field: "title",
        rule: "minLength",
        value: 3,
        message: "Event title must be at least 3 characters",
      },
      {
        field: "url",
        rule: "url",
        message: "Event URL must be a valid URL",
      },
    ],
    options: {
      strictValidation: false,
      allowAdditionalFields: false,
      dateFormat: "DD/MM/YYYY",
      locale: "es-ES",
    },
  },
  loader: {
    target: "file",
    targetConfig: {
      type: "file",
      path: "output/barcelona_events.json",
      format: "json",
      encoding: "utf8",
      createDirectory: true,
    } as FileTargetConfig,
    options: {
      timeout: 10000,
      retries: {
        count: 3,
        delay: 1000,
        backoff: "linear",
      },
    },
  },
};

/**
 * Production configuration with DigitalOcean Spaces
 */
export const BARCELONA_EVENTS_PRODUCTION_CONFIG: PipelineConfig = {
  ...BARCELONA_EVENTS_CONFIG,
  extractor: {
    ...BARCELONA_EVENTS_CONFIG.extractor,
    browserConfig: {
      ...BARCELONA_EVENTS_CONFIG.extractor.browserConfig,
      headless: true, // Run headless in production
    },
  },
  loader: {
    target: "digitalocean-spaces",
    targetConfig: {
      type: "digitalocean-spaces",
      endpoint: "https://fra1.digitaloceanspaces.com",
      region: "fra1",
      bucket: "project-aurora-data",
      key: `events/barcelona/${new Date().toISOString().split("T")[0]}/events.json`,
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY || "",
      acl: "public-read",
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

/**
 * Test configuration for development
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
    navigationSteps: [
      {
        type: "wait",
        waitCondition: {
          type: "load",
        },
        timeout: 5000,
        description: "Wait for page load",
      },
    ],
  },
  transformer: {
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
 * Configuration factory functions
 */
export class PipelineConfigFactory {
  /**
   * Create configuration for Barcelona events scraping
   */
  static barcelonaEvents(options?: { headless?: boolean; outputPath?: string }): PipelineConfig {
    const config: PipelineConfig = {
      ...BARCELONA_EVENTS_CONFIG,
      extractor: {
        ...BARCELONA_EVENTS_CONFIG.extractor,
        browserConfig: {
          ...BARCELONA_EVENTS_CONFIG.extractor.browserConfig,
          headless: options?.headless ?? BARCELONA_EVENTS_CONFIG.extractor.browserConfig.headless,
        },
      },
      loader: {
        ...BARCELONA_EVENTS_CONFIG.loader,
        targetConfig: {
          ...BARCELONA_EVENTS_CONFIG.loader.targetConfig,
          path:
            options?.outputPath ??
            (BARCELONA_EVENTS_CONFIG.loader.targetConfig as FileTargetConfig).path,
        } as FileTargetConfig,
      },
    };

    return config;
  }

  /**
   * Create production configuration with cloud storage
   */
  static barcelonaEventsProduction(spaces: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  }): PipelineConfig {
    const config = { ...BARCELONA_EVENTS_PRODUCTION_CONFIG };

    const spacesConfig = config.loader.targetConfig as SpacesTargetConfig;
    Object.assign(spacesConfig, spaces);

    return config;
  }

  /**
   * Create generic event scraping configuration
   */
  static genericEvents(options: {
    url: string;
    containerSelector: string;
    fieldMappings: Record<string, { selector: string; attribute?: string }>;
    outputPath?: string;
  }): PipelineConfig {
    return {
      extractor: {
        url: options.url,
        browserConfig: {
          headless: true,
          viewport: { width: 1280, height: 800 },
        },
        timeout: 30000,
        navigationSteps: [
          {
            type: "wait",
            waitCondition: { type: "load" },
            timeout: 5000,
          },
        ],
      },
      transformer: {
        schema: "generic-event-v1",
        fieldMappings: Object.entries(options.fieldMappings).reduce(
          (acc, [key, mapping]) => ({
            ...acc,
            [key]: {
              selector: mapping.selector,
              attribute: mapping.attribute || "text",
              transformer: "trim",
              required: key === "title",
            },
          }),
          {}
        ),
      },
      loader: {
        target: "file",
        targetConfig: {
          type: "file",
          path: options.outputPath || "output/events.json",
          format: "json",
          encoding: "utf8",
          createDirectory: true,
        } as FileTargetConfig,
      },
    };
  }

  /**
   * Create test configuration
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
