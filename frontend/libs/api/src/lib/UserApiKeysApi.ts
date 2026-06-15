import { ApiManager, ApiResponse, buildSessionHeaders } from "./ApiManager.js";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

export interface ApiKeyItem {
  token: string;
  name: string;
  maybe_description: string | null;
  // TRUNCATED key value (display-only). The full secret is only ever returned
  // once, from CreateApiKey — never from the list.
  api_key: string;
  created_at: string;
  updated_at: string;
  // Soft-delete timestamp; null means the key is live. The list includes
  // deleted keys, so the UI filters these out.
  maybe_deleted_at: string | null;
}

// Create response: the full secret, shown to the user exactly once, plus the
// `token` used for subsequent update/delete calls.
export interface CreatedApiKey {
  token: string;
  name: string;
  maybe_description: string | null;
  api_key: string;
}

export interface ApiKeysPage {
  current: number;
  total_page_count: number;
}

interface ErrorBody {
  success: boolean;
  error_code?: number;
  error_code_str?: string;
  message?: string;
}

export class UserApiKeysApi extends ApiManager {
  public ListApiKeys({
    pageSize,
    pageIndex,
  }: {
    pageSize?: number;
    pageIndex?: number;
  } = {}): Promise<ApiResponse<{ api_keys: ApiKeyItem[] }, ApiKeysPage>> {
    const query = new URLSearchParams();
    if (pageSize !== undefined) query.set("page_size", String(pageSize));
    if (pageIndex !== undefined) query.set("page_index", String(pageIndex));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const endpoint = `${this.getApiSchemeAndHost()}/v1/api_keys/list${suffix}`;
    return this.jsonFetch<{
      success: boolean;
      api_keys?: ApiKeyItem[];
      pagination?: ApiKeysPage;
    } & ErrorBody>(endpoint, { method: "GET" })
      .then((response) => {
        if (!response.success) {
          return {
            success: false,
            errorMessage: response.message ?? this.statusFallback(response),
          };
        }
        return {
          success: true,
          data: { api_keys: response.api_keys ?? [] },
          pagination: response.pagination ?? {
            current: 0,
            total_page_count: 1,
          },
        };
      })
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // Single-key lookup. Not currently used by the settings UI (the list already
  // carries everything), but provided for parity with the backend.
  // TODO: confirm the response wrapper field name (`api_key_info` assumed).
  public GetApiKey({
    token,
  }: {
    token: string;
  }): Promise<ApiResponse<ApiKeyItem>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/api_keys/${encodeURIComponent(token)}`;
    return this.jsonFetch<
      { success: boolean; api_key_info?: ApiKeyItem } & ErrorBody
    >(endpoint, { method: "GET" })
      .then((response) => {
        if (!response.success || !response.api_key_info) {
          return {
            success: false,
            errorMessage: response.message ?? this.statusFallback(response),
          };
        }
        return { success: true, data: response.api_key_info };
      })
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  public CreateApiKey({
    name,
    maybeDescription,
  }: {
    name: string;
    maybeDescription?: string;
  }): Promise<ApiResponse<CreatedApiKey>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/api_keys/create`;
    return this.jsonFetch<
      {
        success: boolean;
        token?: string;
        name?: string;
        maybe_description?: string | null;
        api_key?: string;
      } & ErrorBody
    >(endpoint, {
      method: "POST",
      body: { name, maybe_description: maybeDescription ?? null },
    })
      .then((response) => {
        if (!response.success || !response.token || !response.api_key) {
          return {
            success: false,
            errorMessage: response.message ?? this.statusFallback(response),
          };
        }
        return {
          success: true,
          data: {
            token: response.token,
            name: response.name ?? name,
            maybe_description: response.maybe_description ?? null,
            api_key: response.api_key,
          },
        };
      })
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  public UpdateApiKey({
    token,
    maybeDescription,
  }: {
    token: string;
    maybeDescription: string | null;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/api_keys/${encodeURIComponent(token)}`;
    return this.jsonFetch<{ success: boolean } & ErrorBody>(endpoint, {
      method: "PUT",
      body: { maybe_description: maybeDescription },
    })
      .then((response) => {
        if (!response.success) {
          return {
            success: false,
            errorMessage: response.message ?? this.statusFallback(response),
          };
        }
        return { success: true };
      })
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  public DeleteApiKey({ token }: { token: string }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/api_keys/${encodeURIComponent(token)}`;
    return this.jsonFetch<{ success: boolean } & ErrorBody>(endpoint, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.success) {
          return {
            success: false,
            errorMessage: response.message ?? this.statusFallback(response),
          };
        }
        return { success: true };
      })
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // Parses JSON for both 2xx and 4xx so `BadInputWithSimpleMessage` text
  // reaches the caller. The base ApiManager.fetch throws on non-2xx.
  private async jsonFetch<T>(
    endpoint: string,
    { method, body }: { method: string; body?: unknown },
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method,
      headers: buildSessionHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(text || `Request failed with status ${response.status}`);
    }
  }

  private statusFallback(response: ErrorBody): string {
    if (response.error_code_str) return response.error_code_str;
    if (response.error_code) return `Request failed (${response.error_code})`;
    return "Request failed";
  }
}
