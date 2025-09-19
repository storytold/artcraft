import { CommandResult } from '../common/CommandStatus';
export interface ArtcraftGetCreditsSuccess extends CommandResult {
    payload: ArtcraftGetCreditsPayload;
}
export interface ArtcraftGetCreditsPayload {
    free_credits: number;
    monthly_credits: number;
    banked_credits: number;
    sum_total_credits: number;
}
export declare const ArtcraftGetCredits: () => Promise<ArtcraftGetCreditsSuccess>;
//# sourceMappingURL=ArtcraftGetCredits.d.ts.map