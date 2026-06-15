import { ApiManager, ApiResponse, buildSessionHeaders } from "./ApiManager.js";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

// Canonical wire shape for an API key (list rows + single-key GET). Mirrors the
// backend `ApiKeyInfo`. The full secret is NEVER here — only
// `truncated_api_key` (first 20 chars). The full value is returned exactly once
// at creation time (see CreatedApiKey).
export interface ApiKeyInfo {
  token: string;
  truncated_api_key: string;
  name: string;
  maybe_description: string | null;
  owner_user_token: string;
  ip_address_creation: string;
  ip_address_update: string;
  created_at: string;
  updated_at: string;
  // Soft-delete timestamp; null means live. The list includes deleted keys, so
  // the UI filters these out.
  maybe_deleted_at: string | null;
}

// Create response: the `api_key_token` (used for all subsequent management) plus
// the full secret `api_key`, returned exactly once.
export interface CreatedApiKey {
  api_key_token: string;
  api_key: string;
}

interface ErrorBody {
  success: boolean;
  error_code?: number;
  error_code_str?: string;
  message?: string;
}

export class UserApiKeysApi extends ApiManager {
  public ListApiKeys({
    limit,
    offset,
  }: {
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<{ api_keys: ApiKeyInfo[] }>> {
    const query = new URLSearchParams();
    if (limit !== undefined) query.set("limit", String(limit));
    if (offset !== undefined) query.set("offset", String(offset));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const endpoint = `${this.getApiSchemeAndHost()}/v1/api_keys/list${suffix}`;
    return this.jsonFetch<{
      success: boolean;
      api_keys?: ApiKeyInfo[];
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
        };
      })
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // Single-key lookup. Not currently used by the settings UI (the list already
  // carries everything), but provided for parity with the backend.
  public GetApiKey({
    token,
  }: {
    token: string;
  }): Promise<ApiResponse<ApiKeyInfo>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/api_keys/${encodeURIComponent(token)}`;
    return this.jsonFetch<
      { success: boolean; api_key?: ApiKeyInfo } & ErrorBody
    >(endpoint, { method: "GET" })
      .then((response) => {
        if (!response.success || !response.api_key) {
          return {
            success: false,
            errorMessage: response.message ?? this.statusFallback(response),
          };
        }
        return { success: true, data: response.api_key };
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
        api_key_token?: string;
        api_key?: string;
      } & ErrorBody
    >(endpoint, {
      method: "POST",
      body: { name, maybe_description: maybeDescription ?? null },
    })
      .then((response) => {
        if (!response.success || !response.api_key_token || !response.api_key) {
          return {
            success: false,
            errorMessage: response.message ?? this.statusFallback(response),
          };
        }
        return {
          success: true,
          data: {
            api_key_token: response.api_key_token,
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
