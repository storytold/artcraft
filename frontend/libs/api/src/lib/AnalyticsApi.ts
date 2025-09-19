import { ApiManager, ApiResponse } from "./ApiManager.js";

export class AnalyticsApi extends ApiManager {
  public PostAnalytics({
    maybeLastAction,
    maybeLogToken,
  }: {
    maybeLastAction: string;
    maybeLogToken: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/analytics/log_session`;

    const body = {
      maybe_last_action: maybeLastAction,
      maybe_log_token: maybeLogToken,
    };

    return this.post<
      {
        maybe_last_action: string;
        maybe_log_token: string;
      },
      {
        success?: boolean;
        log_token?: string;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        data: response.log_token,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
