import { ApiManager, ApiResponse } from "./ApiManager.js";

export interface SessionCredits {
  freeCredits: number;
  monthlyCredits: number;
  bankedCredits: number;
  sumTotalCredits: number;
}

export class CreditsApi extends ApiManager {
  public GetSessionCredits(): Promise<ApiResponse<SessionCredits>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/credits/namespace/artcraft`;

    return this.get<{
      success: boolean;
      free_credits: number;
      monthly_credits: number;
      banked_credits: number;
      sum_total_credits: number;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          freeCredits: response.free_credits,
          monthlyCredits: response.monthly_credits,
          bankedCredits: response.banked_credits,
          sumTotalCredits: response.sum_total_credits,
        },
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }
}
