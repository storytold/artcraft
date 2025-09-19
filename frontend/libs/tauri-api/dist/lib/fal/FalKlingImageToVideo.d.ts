import { CommandResult } from '../common/CommandStatus';
export declare enum FalKlingImageToVideoErrorType {
    ServerError = "server_error",
    NeedsFalApiKey = "needs_fal_api_key"
}
export interface FalKlingImageToVideoRequest {
    image_media_token?: string;
    base64_image?: string;
}
export interface FalKlingImageToVideoError extends CommandResult {
    error_type: FalKlingImageToVideoErrorType;
    error_message?: string;
}
export interface FalKlingImageToVideoPayload {
    media_token: string;
    cdn_url: string;
    base64_bytes: string;
}
export interface FalKlingImageToVideoSuccess extends CommandResult {
    payload: FalKlingImageToVideoPayload;
}
export type FalKlingImageToVideoResult = FalKlingImageToVideoSuccess | FalKlingImageToVideoError;
export declare const FalKlingImageToVideo: (request: FalKlingImageToVideoRequest) => Promise<FalKlingImageToVideoResult>;
//# sourceMappingURL=FalKlingImageToVideo.d.ts.map