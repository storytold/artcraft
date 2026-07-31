/** Everything a handler needs about the incoming request, already buffered. */

import type { IncomingHttpHeaders } from "node:http";
import { parseMultipart, type MultipartForm } from "./multipart.ts";

export class RequestContext {
  readonly method: string;
  readonly pathname: string;
  readonly query: URLSearchParams;
  readonly headers: IncomingHttpHeaders;
  readonly body: Buffer;

  /** Path parameters captured by the matched route pattern, e.g. `:token`. */
  params: Readonly<Record<string, string>>;

  private cachedCookies: Record<string, string> | undefined;
  private cachedForm: MultipartForm | undefined;

  constructor(args: {
    method: string;
    pathname: string;
    query: URLSearchParams;
    headers: IncomingHttpHeaders;
    body: Buffer;
  }) {
    this.method = args.method;
    this.pathname = args.pathname;
    this.query = args.query;
    this.headers = args.headers;
    this.body = args.body;
    this.params = {};
  }

  /**
   * Parse the body as JSON. Returns an empty object for an empty body so
   * handlers can destructure without guarding — a fake backend should not 400
   * on a shape mismatch that the real one tolerates.
   */
  json<T>(): Partial<T> {
    if (this.body.length === 0) {
      return {};
    }
    try {
      return JSON.parse(this.body.toString("utf8")) as Partial<T>;
    } catch {
      return {};
    }
  }

  /** Parse the body as `multipart/form-data`. Cached, since parsing copies buffers. */
  form(): MultipartForm {
    if (this.cachedForm === undefined) {
      this.cachedForm = parseMultipart(this.body, this.headers["content-type"]);
    }
    return this.cachedForm;
  }

  /** A single query parameter, or undefined when absent or blank. */
  queryValue(name: string): string | undefined {
    const value = this.query.get(name);
    return value === null || value === "" ? undefined : value;
  }

  /** A query parameter parsed as a positive integer, or undefined. */
  queryNumber(name: string): number | undefined {
    const raw = this.queryValue(name);
    if (raw === undefined) {
      return undefined;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  cookie(name: string): string | undefined {
    return this.cookies()[name];
  }

  /** The `session` header the frontend sends when cookies are unavailable. */
  sessionHeader(): string | undefined {
    const value = this.headers["session"];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  private cookies(): Record<string, string> {
    if (this.cachedCookies !== undefined) {
      return this.cachedCookies;
    }

    const jar: Record<string, string> = {};
    const header = this.headers.cookie;
    if (typeof header === "string") {
      for (const pair of header.split(";")) {
        const separator = pair.indexOf("=");
        if (separator > 0) {
          jar[pair.slice(0, separator).trim()] = decodeURIComponent(pair.slice(separator + 1).trim());
        }
      }
    }

    this.cachedCookies = jar;
    return jar;
  }
}
