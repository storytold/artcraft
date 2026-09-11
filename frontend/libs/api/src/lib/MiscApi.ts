import { ApiManager, ApiResponse } from "./ApiManager.js";
import { StatusAlert } from "./models/StatusAlert.js";

export class MiscApi extends ApiManager {
  public GetStatusAlertCheck(): Promise<ApiResponse<StatusAlert>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/session`;
    return this.get<{
      success: boolean;
      maybe_alert?: Omit<StatusAlert, "refresh_interval_millis">;
      refresh_interval_millis: number;
    }>({ endpoint: endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          ...response.maybe_alert,
          refresh_interval_millis: response.refresh_interval_millis,
        },
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.mesasge,
        };
      });
  }
}
