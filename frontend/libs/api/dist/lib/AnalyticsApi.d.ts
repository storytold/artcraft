import { ApiManager, ApiResponse } from './ApiManager.js';
export declare class AnalyticsApi extends ApiManager {
    PostAnalytics({ maybeLastAction, maybeLogToken, }: {
        maybeLastAction: string;
        maybeLogToken: string;
    }): Promise<ApiResponse<string>>;
}
//# sourceMappingURL=AnalyticsApi.d.ts.map