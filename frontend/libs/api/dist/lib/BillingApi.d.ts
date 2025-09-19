import { ApiManager, ApiResponse } from './ApiManager.js';
import { Subscription } from './models/Billing.js';
import { LoyaltyProgram } from './enums/Billing.js';
export declare class BillingApi extends ApiManager {
    ListActiveSubscriptions(): Promise<ApiResponse<{
        active_subscriptions: Subscription[];
        maybe_loyalty_program?: LoyaltyProgram;
    }>>;
}
//# sourceMappingURL=BillingApi.d.ts.map