/**
 * Log levels enumeration
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry interface
 */
export interface LogEntry {
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly error?: Error;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(_message: string, _context?: Record<string, unknown>): void;
  info(_message: string, _context?: Record<string, unknown>): void;
  warn(_message: string, _context?: Record<string, unknown>): void;
  error(_message: string, _error?: Error, _context?: Record<string, unknown>): void;
}

/**
 * Console-based logger implementation
 */
export class ConsoleLogger implements Logger {
  private readonly minLevel: LogLevel;

  public constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(LogLevel.ERROR, message, context, error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const emoji = this.getLevelEmoji(level);

    let logMessage = `${timestamp} ${emoji} [${levelName}] ${message}`;

    if (context !== undefined && Object.keys(context).length > 0) {
      logMessage += ` | Context: ${JSON.stringify(context)}`;
    }

    if (error !== undefined) {
      logMessage += ` | Error: ${error.message}`;
      if (error.stack !== undefined) {
        logMessage += `\\n${error.stack}`;
      }
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "🔍";
      case LogLevel.INFO:
        return "ℹ️";
      case LogLevel.WARN:
        return "⚠️";
      case LogLevel.ERROR:
        return "❌";
      default:
        return "📝";
    }
  }
}

/**
 * Factory for creating loggers
 */
export class LoggerFactory {
  private static instance?: LoggerFactory;
  private readonly loggers = new Map<string, Logger>();

  private constructor() {}

  public static getInstance(): LoggerFactory {
    if (LoggerFactory.instance === undefined) {
      LoggerFactory.instance = new LoggerFactory();
    }
    return LoggerFactory.instance;
  }

  public getLogger(name: string, minLevel: LogLevel = LogLevel.INFO): Logger {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, new ConsoleLogger(minLevel));
    }
    return this.loggers.get(name)!;
  }

  public createLogger(name: string, minLevel: LogLevel = LogLevel.INFO): Logger {
    const logger = new ConsoleLogger(minLevel);
    this.loggers.set(name, logger);
    return logger;
  }
}

/**
 * Gets a logger instance for the specified class or module
 */
export function getLogger(name: string, minLevel: LogLevel = LogLevel.INFO): Logger {
  return LoggerFactory.getInstance().getLogger(name, minLevel);
}

/**
 * Converts string log level to LogLevel enum
 */
export function parseLogLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case "debug":
      return LogLevel.DEBUG;
    case "info":
      return LogLevel.INFO;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    default:
      throw new Error(`Invalid log level: ${level}`);
  }
}
