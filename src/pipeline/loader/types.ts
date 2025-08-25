export interface ApiConfig {
  readonly url: string;
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly headers?: Record<string, string>;
  readonly authentication?: {
    readonly type: "bearer" | "basic" | "api-key";
    readonly token?: string;
    readonly username?: string;
    readonly password?: string;
    readonly apiKey?: string;
    readonly headerName?: string;
  };
  readonly timeout?: number;
  readonly retries?: number;
  readonly batchSize?: number;
  readonly payloadTemplate?: string;
}

export interface DatabaseConfig {
  readonly type: "postgresql" | "mysql" | "sqlite" | "mongodb";
  readonly connectionString: string;
  readonly table: string;
  readonly schema?: string;
  readonly upsert?: boolean;
  readonly batchSize?: number;
  readonly options?: Record<string, unknown>;
}

export interface FileConfig {
  path: string;
  format: "json" | "csv" | "xml" | "jsonl";
  encoding?: string;
  createDirectory?: boolean;
}

export interface ConsoleConfig {
  format: "json" | "table" | "yaml";
  pretty?: boolean;
  useLogger?: boolean;
}

export type LoadTargetConfig =
  | ApiConfig
  | DatabaseConfig
  | FileConfig
  | ConsoleConfig
  | Record<string, unknown>;

export interface LoadTarget {
  type: "file" | "console" | "database" | "api";
  config: LoadTargetConfig;
}

export interface LoadConfig {
  targets: LoadTarget[];
  format?: "json" | "csv" | "xml" | "jsonl";
  options?: {
    pretty?: boolean;
    encoding?: string;
    compression?: "gzip" | "brotli";
  };
}

export interface LoadResult {
  target: LoadTarget;
  success: boolean;
  recordCount: number;
  outputSize?: number;
  metadata?: Record<string, unknown>;
}
