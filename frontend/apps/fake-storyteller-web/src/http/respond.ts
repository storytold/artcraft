/**
 * Response helpers.
 *
 * Handlers normally return a plain object, which is serialized as a 200 JSON
 * body. Return an `HttpResult` when the status, headers, or a binary body
 * matter.
 */

export type HeaderMap = Record<string, string | string[]>;

/** An explicit status/header/body triple, for when a bare JSON 200 is not enough. */
export class HttpResult {
  readonly status: number;
  readonly body: unknown;
  readonly headers: HeaderMap;

  constructor(status: number, body: unknown, headers: HeaderMap = {}) {
    this.status = status;
    this.body = body;
    this.headers = headers;
  }

  /** Return a copy with `header` added. Used to attach cookies to an existing result. */
  withHeader(name: string, value: string | string[]): HttpResult {
    return new HttpResult(this.status, this.body, { ...this.headers, [name]: value });
  }
}

/** 200 with an arbitrary JSON payload. */
export function ok<T extends object>(payload: T): HttpResult {
  return new HttpResult(200, payload);
}

/** 200 with the `{ success: true, ... }` envelope the real backend uses. */
export function success<T extends object>(payload: T = {} as T): HttpResult {
  return new HttpResult(200, { success: true, ...payload });
}

/** Binary response, for serving stored media bytes back to the browser. */
export function bytes(payload: Buffer, contentType: string, headers: HeaderMap = {}): HttpResult {
  return new HttpResult(200, payload, { "Content-Type": contentType, ...headers });
}

/**
 * The real backend's error envelope. Callers read a mix of `error_type`,
 * `error_code`, `error_code_str` and `message` depending on the endpoint and
 * how old it is, so the fake always emits all four.
 */
export function failure(status: number, errorCode: string, message: string): HttpResult {
  return new HttpResult(status, {
    success: false,
    error_type: errorCode,
    error_code: errorCode,
    error_code_str: errorCode,
    message,
  });
}

export function badRequest(message: string, errorCode = "BadRequest"): HttpResult {
  return failure(400, errorCode, message);
}

export function unauthorized(message = "You must be logged in."): HttpResult {
  return failure(401, "NotLoggedIn", message);
}

export function notFound(message = "Not found."): HttpResult {
  return failure(404, "NotFound", message);
}

export function paymentRequired(message: string): HttpResult {
  return failure(402, "InsufficientCredits", message);
}
