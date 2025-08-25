/**
 * Barcelona events integration test configuration
 * This configuration is specific to the Barcelona events scraping scenario
 * and should only be used in integration tests.
 */

import { PipelineConfigFactory, NAVIGATION_STEPS } from "../../configs.js";
import type { PipelineConfig, NavigationStep } from "../../types.js";

/**
 * Create navigation steps specific to Barcelona events page
 */
function createBarcelonaNavigationSteps(): NavigationStep[] {
  return [
    NAVIGATION_STEPS.waitForPageLoad(5000),
    NAVIGATION_STEPS.clickElement("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll", {
      timeout: 3000,
      maxAttempts: 1,
      description: "Accept cookies if banner appears",
    }),
    NAVIGATION_STEPS.clickElement('button[data-api*="show_more"]', {
      maxAttempts: 20,
      timeout: 2000,
      description: 'Click "Ver más" button to load more events',
    }),
    NAVIGATION_STEPS.waitForTimeout(1000, "Wait for content to stabilize"),
  ];
}

/**
 * Field mappings specific to Barcelona events page structure
 */
const BARCELONA_FIELD_MAPPINGS = {
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
} as const;

/**
 * Create Barcelona events configuration for development/testing
 */
export function createBarcelonaEventsConfig(options?: {
  headless?: boolean;
  outputPath?: string;
  timeout?: number;
}): PipelineConfig {
  return PipelineConfigFactory.createBasicConfig({
    url: "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
    schema: "barcelona-event-v1",
    fieldMappings: BARCELONA_FIELD_MAPPINGS,
    navigationSteps: createBarcelonaNavigationSteps(),
    outputPath: options?.outputPath ?? "output/barcelona_events_integration.json",
    headless: options?.headless ?? false,
  });
}

/**
 * Create Barcelona events configuration using the basic factory
 * for more control over the configuration
 */
export function createBarcelonaEventsConfigAdvanced(options?: {
  headless?: boolean;
  outputPath?: string;
  timeout?: number;
  retries?: number;
}): PipelineConfig {
  let baseConfig = PipelineConfigFactory.createBasicConfig({
    url: "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
    schema: "barcelona-event-v1",
    fieldMappings: BARCELONA_FIELD_MAPPINGS,
    navigationSteps: createBarcelonaNavigationSteps(),
    outputPath: options?.outputPath ?? "output/barcelona_events_advanced.json",
    headless: options?.headless ?? false,
  });

  // Create new config with overrides if needed
  if (options?.timeout || options?.retries) {
    baseConfig = {
      ...baseConfig,
      extractor: {
        ...baseConfig.extractor,
        ...(options.timeout && { timeout: options.timeout }),
        ...(options.retries && {
          retries: {
            ...baseConfig.extractor.retries!,
            count: options.retries,
          },
        }),
      },
    };
  }

  return baseConfig;
}

/**
 * Create Barcelona events configuration for production with cloud storage
 */
export function createBarcelonaEventsProductionConfig(spacesConfig: {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  keyPrefix?: string;
}): PipelineConfig {
  const currentDate = new Date().toISOString().split("T")[0];
  const key = spacesConfig.keyPrefix
    ? `${spacesConfig.keyPrefix}/barcelona/${currentDate}/events.json`
    : `events/barcelona/${currentDate}/events.json`;

  return PipelineConfigFactory.createCloudConfig({
    url: "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
    schema: "barcelona-event-v1",
    fieldMappings: BARCELONA_FIELD_MAPPINGS,
    navigationSteps: createBarcelonaNavigationSteps(),
    spaces: {
      endpoint: spacesConfig.endpoint,
      region: spacesConfig.region,
      bucket: spacesConfig.bucket,
      key,
      accessKeyId: spacesConfig.accessKeyId,
      secretAccessKey: spacesConfig.secretAccessKey,
      acl: "public-read",
    },
    headless: true, // Always headless in production
  });
}

/**
 * Constants for test validation
 */
export const BARCELONA_TEST_CONSTANTS = {
  URL: "https://www.barcelona.cat/es/vivir-en-bcn/con-ninos-y-ninas/agenda",
  EXPECTED_CONTAINER_SELECTOR: "li.ajuntament-guia-item",
  EXPECTED_SCHEMA: "barcelona-event-v1",
  COOKIE_BANNER_SELECTOR: "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
  LOAD_MORE_BUTTON_SELECTOR: 'button[data-api*="show_more"]',
  SELECTORS: {
    title: "a.ajuntament-guia-item-name",
    url: "a.ajuntament-guia-item-name",
    description: "p.ajuntament-guia-item-excerpt",
    category: "strong",
    when: "li.ajuntament-guia-item-when",
    where: "li.ajuntament-guia-item-where",
    location: "li.ajuntament-guia-item-where a",
    image: "img",
  },
} as const;
