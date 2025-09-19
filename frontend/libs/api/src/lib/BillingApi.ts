import { ApiManager, ApiResponse } from "./ApiManager.js";
import { Subscription } from "./models/Billing.js";
import { LoyaltyProgram } from "./enums/Billing.js";

export class BillingApi extends ApiManager {
  public async ListActiveSubscriptions(): Promise<
    ApiResponse<{
      active_subscriptions: Subscription[];
      maybe_loyalty_program?: LoyaltyProgram;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/billing/active_subscriptions`;
    return await this.get<{
      success: boolean;
      active_subscriptions?: Subscription[];
      maybe_loyalty_program?: LoyaltyProgram;
      error_message?: string;
    }>({ endpoint: endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          active_subscriptions: response.active_subscriptions || [],
          maybe_loyalty_program: response.maybe_loyalty_program,
        },
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }
}
