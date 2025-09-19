import { CommandResult } from '../common/CommandStatus';
export interface ArtcraftGetSubscriptionSuccess extends CommandResult {
    payload: ArtcraftGetSubscriptionPayload;
}
export interface ArtcraftGetSubscriptionPayload {
    active_subscription?: ActiveSubscriptionInfo;
}
export interface ActiveSubscriptionInfo {
    subscription_token: string;
    product_slug: string;
    namespace: string;
    next_bill_at?: string;
    subscription_end_at?: string;
}
export declare const ArtcraftGetSubscription: () => Promise<ArtcraftGetSubscriptionSuccess>;
//# sourceMappingURL=ArtcraftGetSubscription.d.ts.map