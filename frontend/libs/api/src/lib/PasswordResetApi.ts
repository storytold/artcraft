import { ApiManager, ApiResponse, buildSessionHeaders } from "./ApiManager.js";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

export class PasswordResetApi extends ApiManager {
  public async RequestPasswordReset({
    usernameOrEmail,
  }: {
    usernameOrEmail: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/password_reset/request`;
    const body = {
      username_or_email: usernameOrEmail,
    };

    try {
      const response = await this.post<
        { username_or_email: string },
        {
          success: boolean;
          error_type?: string;
          error_fields?: Record<string, string>;
          error_message?: string;
        }
      >({
        endpoint: endpoint,
        body: body,
      });

      return {
        success: response.success,
        errorMessage:
          response.error_message ||
          (response.error_fields
            ? Object.values(response.error_fields).join(", ")
            : undefined),
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public async RedeemPasswordReset({
    resetToken,
    newPassword,
    newPasswordValidation,
  }: {
    resetToken: string;
    newPassword: string;
    newPasswordValidation: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/password_reset/redeem`;
    const body = {
      reset_token: resetToken,
      new_password: newPassword,
      new_password_validation: newPasswordValidation,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: buildSessionHeaders({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          errorMessage:
            data.message ||
            "Failed to reset password. Please try again.",
        };
      }

      return {
        success: data.success,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }
}
