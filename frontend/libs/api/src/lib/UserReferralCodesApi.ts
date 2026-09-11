import { ApiManager, ApiResponse, buildSessionHeaders } from "./ApiManager.js";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

export interface ReferralCodeEntry {
  token: string;
  code: string;
  code_lowercase: string;
  created_at: string;
  updated_at: string;
}

interface ErrorBody {
  success: boolean;
  error_code?: number;
  error_code_str?: string;
  message?: string;
}

export class UserReferralCodesApi extends ApiManager {
  public ListReferralCodes(): Promise<
    ApiResponse<{ referral_codes: ReferralCodeEntry[] }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_referral_codes/list`;
    return this.jsonFetch<{
      success: boolean;
      referral_codes?: ReferralCodeEntry[];
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
          data: { referral_codes: response.referral_codes ?? [] },
        };
      })
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  public CreateReferralCode({
    code,
  }: {
    code: string;
  }): Promise<
    ApiResponse<{ token: string; code: string; code_lowercase: string }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_referral_codes/create`;
    return this.jsonFetch<
      {
        success: boolean;
        token?: string;
        code?: string;
        code_lowercase?: string;
      } & ErrorBody
    >(endpoint, { method: "POST", body: { code } })
      .then((response) => {
        if (!response.success || !response.token) {
          return {
            success: false,
            errorMessage: response.message ?? this.statusFallback(response),
          };
        }
        return {
          success: true,
          data: {
            token: response.token,
            code: response.code ?? code,
            code_lowercase: response.code_lowercase ?? code.toLowerCase(),
          },
        };
      })
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  public DeleteReferralCode({
    token,
  }: {
    token: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_referral_codes/code/${encodeURIComponent(token)}`;
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
