import { CommandResult } from '../common/CommandStatus';
export interface MidjourneyGetCredentialInfoPayload {
    maybe_email?: string;
    can_clear_state: boolean;
}
export interface MidjourneyGetCredentialInfoSuccess extends CommandResult {
    payload: MidjourneyGetCredentialInfoPayload;
}
export declare const MidjourneyGetCredentialInfo: () => Promise<MidjourneyGetCredentialInfoSuccess>;
//# sourceMappingURL=MidjourneyGetCredentialInfo.d.ts.map