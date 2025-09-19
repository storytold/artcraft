import { CommandResult } from '../common/CommandStatus';
export declare enum FalBackgroundRemovalErrorType {
    ServerError = "server_error",
    NeedsFalApiKey = "needs_fal_api_key"
}
export interface FalBackgroundRemovalRequest {
    image_media_token?: string;
    base64_image?: string;
}
export interface FalBackgroundRemovalError extends CommandResult {
    error_type: FalBackgroundRemovalErrorType;
    error_message?: string;
}
export interface FalBackgroundRemovalPayload {
    media_token: string;
    cdn_url: string;
    base64_bytes: string;
}
export interface FalBackgroundRemovalSuccess extends CommandResult {
    payload: FalBackgroundRemovalPayload;
}
export type FalBackgroundRemovalResult = FalBackgroundRemovalSuccess | FalBackgroundRemovalError;
export declare const FalBackgroundRemoval: (request: FalBackgroundRemovalRequest) => Promise<FalBackgroundRemovalResult>;
//# sourceMappingURL=FalBackgroundRemoval.d.ts.map