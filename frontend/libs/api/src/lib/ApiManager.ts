// import { bool } from "@techstark/opencv-js";
import { StorytellerApiHostStore } from "./config/StorytellerApiHostStore.js";
import { API_TARGETS } from "./enums/Api.js";
//import { fetch } from '@tauri-apps/plugin-http'
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

const SESSION_STORAGE_KEY = "artcraft_signed_session";

/** Store a signed session JWT for use as a header fallback (mobile browsers block 3rd-party cookies). */
export function storeSignedSession(signedSession: string) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, signedSession);
  } catch { /* localStorage unavailable */ }
}

/** Clear stored session (on logout). */
export function clearSignedSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch { /* localStorage unavailable */ }
}

/** Get the stored session token, if any. */
export function getSignedSession(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Build headers with session fallback for mobile browsers. */
export function buildSessionHeaders(base: Record<string, string>): Record<string, string> {
  const session = getSignedSession();
  if (session) {
    return { ...base, session };
  }
  return base;
}

type NonNullableObject<T extends object> = NonNullable<T>;

export interface ApiResponse<T, P = undefined> {
  success: boolean;
  errorMessage?: string;
  data?: T;
  pagination?: P;
}

/**
 * Thrown on non-2xx responses. Carries the HTTP status and, when the server
 * returned the standard `{ success, error_code, message }` error envelope,
 * the human-readable `message` so callers can surface it to the user.
 *
 * The `message` string keeps the legacy `HTTP error! status: N` prefix so
 * existing callers that regex the status out of `err.message` keep working.
 */
export class HttpApiError extends Error {
  readonly status: number;
  readonly serverMessage?: string;

  constructor(status: number, serverMessage?: string) {
    super(
      serverMessage
        ? `HTTP error! status: ${status} - ${serverMessage}`
        : `HTTP error! status: ${status}`,
    );
    this.name = "HttpApiError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

export class ApiManager {
  ApiTargets: Record<string, string> = {};

  constructor() {
    this.ApiTargets = {
      GoggleApi: API_TARGETS.GOOGLE_API,
      FunnelApi: API_TARGETS.FUNNEL_API,
      CdnApi: API_TARGETS.CDN_API,
      GravatarApi: API_TARGETS.GRAVATAR_API,
    };
  }

  protected getApiSchemeAndHost(): string {
    return StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  }

  public async fetch<B, T>(
    endpoint: string,
    {
      method,
      query,
      body,
    }: {
      method: string;
      query?: Record<string, string | boolean | number | undefined>;
      body?: B;
    },
  ): Promise<T> {
    const queryInString =
      query &&
      Object.entries(query).reduce(
        (allOptions, [key, value]) => {
          if (!value) {
            return allOptions;
          }
          allOptions[key] = value.toString();
          return allOptions;
        },
        {} as Record<string, string>,
      );

    // Only append when there is something to send, and join with "&" when the
    // endpoint already carries a query, otherwise we'd emit "?a=1?b=2" or a bare "?".
    const queryString = queryInString
      ? new URLSearchParams(queryInString).toString()
      : "";
    const endpointWithQueries = queryString
      ? endpoint + (endpoint.includes("?") ? "&" : "?") + queryString
      : endpoint;

    const bodyInString = JSON.stringify(body);

    const response = await fetch(endpointWithQueries, {
      method,
      headers: buildSessionHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      credentials: "include",
      body: bodyInString,
    });

    if (!response.ok) {
      let serverMessage: string | undefined;
      try {
        const errorBody = await response.json();
        if (
          errorBody &&
          typeof errorBody.message === "string" &&
          errorBody.message.length > 0
        ) {
          serverMessage = errorBody.message;
        }
      } catch {
        // Non-JSON error body; fall back to the bare status.
      }
      throw new HttpApiError(response.status, serverMessage);
    }

    return response.json();
  }

  public async fetchMultipartFormData<T>(
    endpoint: string,
    {
      method,
      body,
    }: {
      method: string;
      body: FormData;
    },
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method,
      headers: buildSessionHeaders({
        Accept: "application/json",
      }),
      credentials: "include",
      body: body,
    });

    // A non-JSON error body (eg. an HTML 502 page) would make json() reject with
    // a cryptic SyntaxError; surface the HTTP status like fetch() does instead.
    // JSON error bodies are still returned so callers can read their error fields.
    try {
      return await response.json();
    } catch (err) {
      if (!response.ok) {
        throw new HttpApiError(response.status);
      }
      throw err;
    }
  }

  protected get<T>({
    endpoint,
    query,
  }: {
    endpoint: string;
    query?: Record<string, string | boolean | number | undefined>;
  }): Promise<T> {
    return this.fetch<null, T>(endpoint, { method: "GET", query });
  }

  protected post<B, T>({
    endpoint,
    query,
    body,
  }: {
    endpoint: string;
    query?: Record<string, string | boolean | number | undefined>;
    body?: B;
  }): Promise<T> {
    return this.fetch<B, T>(endpoint, {
      method: "POST",
      query,
      body,
    });
  }

  protected put<B, T>({
    endpoint,
    query,
    body,
  }: {
    endpoint: string;
    query?: Record<string, string | boolean | number | undefined>;
    body?: B;
  }): Promise<T> {
    return this.fetch<B, T>(endpoint, {
      method: "PUT",
      query,
      body,
    });
  }

  protected delete<B, T>({
    endpoint,
    query,
    body,
  }: {
    endpoint: string;
    query?: Record<string, string | boolean | number | undefined>;
    body?: B;
  }): Promise<T> {
    return this.fetch<B, T>(endpoint, {
      method: "DELETE",
      query,
      body,
    });
  }

  protected async postFormVideo<T>({
    endpoint,
    formRecord,
    uuid,
    blob,
    blobFileName,
  }: {
    endpoint: string;
    formRecord: Record<string, string>;
    uuid: string;
    blob?: Blob | File;
    blobFileName?: string;
  }): Promise<T> {
    const formData = new FormData();
    formData.append("uuid_idempotency_token", uuid);
    Object.entries(formRecord).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (blob && blobFileName) {
      formData.append("video", blob, blobFileName);
    } else if (blob) {
      formData.append("video", blob);
    }

    return this.fetchMultipartFormData<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }

  protected async postForm<T>({
    endpoint,
    formRecord,
    uuid,
    blob,
    blobFileName,
  }: {
    endpoint: string;
    formRecord: Record<string, string>;
    uuid: string;
    blob?: Blob | File;
    blobFileName?: string;
  }): Promise<T> {
    const formData = new FormData();
    formData.append("uuid_idempotency_token", uuid);
    Object.entries(formRecord).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (blob && blobFileName) {
      formData.append("file", blob, blobFileName);
    } else if (blob) {
      formData.append("file", blob);
    }

    return this.fetchMultipartFormData<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }

  protected camelToSnakeCase(str: string) {
    return str.replace(/([a-z0])([A-Z])/g, "$1_$2").toLowerCase();
  }

  protected parseQueryValues(
    params: Record<string, string | string[] | boolean | number | undefined>,
  ): Record<string, string> {
    return Object.entries(params).reduce(
      (allParams, [key, value]) => {
        // FIX: skip only absent values (undefined / null). `!value` also dropped false, 0 and "", so a flag switched off, a zero or an emptied text field was silently left out of the request.
        if (value === undefined || value === null) {
          return allParams;
        }
        const snakeKey = this.camelToSnakeCase(key);
        if (Array.isArray(value)) {
          return { ...allParams, [snakeKey]: value.join(",") };
        }
        return { ...allParams, [snakeKey]: value.toString() };
      },
      {} as Record<string, string>,
    );
  }

  protected parseBodyValues<T extends object, B extends object>(
    params: NonNullableObject<T>,
  ): B {
    return Object.entries(params).reduce((allParams, [key, value]) => {
      // FIX: same as parseQueryValues: only undefined / null mean "not provided"; false, 0 and "" are real values to send.
      if (value === undefined || value === null) {
        return allParams;
      }
      const snakeKey = this.camelToSnakeCase(key);
      if (Array.isArray(value)) {
        return { ...allParams, [snakeKey]: value };
      }
      return { ...allParams, [snakeKey]: value };
    }, {} as B);
  }
}
