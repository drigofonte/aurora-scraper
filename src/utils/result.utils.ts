/**
 * Result type   public flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  public mapErr<F>(_fn: (error: never) => F): Result<T, F> {unctional error handling
 * Represents either a success value (Ok) or an error (Err)
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Success result containing a value
 */
export class Ok<T> {
  public readonly isOk = true;
  public readonly isErr = false;

  public constructor(public readonly value: T) {}

  public map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }

  public flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  public mapErr<F>(_fn: (error: never) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  public unwrap(): T {
    return this.value;
  }

  public unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  public unwrapErr(): never {
    throw new Error("Called unwrapErr on Ok value");
  }

  public expect(_message: string): T {
    return this.value;
  }

  public expectErr(_message: string): never {
    throw new Error(_message);
  }

  public match<U>(handlers: { ok: (value: T) => U; err: (error: never) => U }): U {
    return handlers.ok(this.value);
  }
}

/**
 * Error result containing an error
 */
export class Err<E> {
  public readonly isOk = false;
  public readonly isErr = true;

  public constructor(public readonly error: E) {}

  public map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  public flatMap<U, F>(_fn: (value: never) => Result<U, F>): Result<U, E | F> {
    return this as unknown as Result<U, E | F>;
  }

  public mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error));
  }

  public unwrap(): never {
    throw new Error(`Called unwrap on Err value: ${String(this.error)}`);
  }

  public unwrapOr<T>(_defaultValue: T): T {
    return _defaultValue;
  }

  public unwrapErr(): E {
    return this.error;
  }

  public expect(_message: string): never {
    throw new Error(`${_message}: ${String(this.error)}`);
  }

  public expectErr(_message: string): E {
    return this.error;
  }

  public match<U>(handlers: { ok: (value: never) => U; err: (error: E) => U }): U {
    return handlers.err(this.error);
  }
}

/**
 * Creates a successful result
 */
export function ok<T>(value: T): Result<T, never> {
  return new Ok(value);
}

/**
 * Creates an error result
 */
export function err<E>(error: E): Result<never, E> {
  return new Err(error);
}

/**
 * Wraps a potentially throwing function in a Result
 */
export function tryCatch<T, E = Error>(
  fn: () => T,
  errorHandler?: (error: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    const handledError = errorHandler !== undefined ? errorHandler(error) : (error as E);
    return err(handledError);
  }
}

/**
 * Wraps an async potentially throwing function in a Result
 */
export async function tryAsync<T, E = Error>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    const handledError = errorHandler !== undefined ? errorHandler(error) : (error as E);
    return err(handledError);
  }
}

/**
 * Combines multiple Results into a single Result
 * Returns Ok with array of values if all are Ok, otherwise returns the first Err
 */
export function combine<T, E>(results: readonly Result<T, E>[]): Result<readonly T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (result.isErr) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
}

/**
 * Type guard to check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.isOk;
}

/**
 * Type guard to check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.isErr;
}
