import { CommandResult } from '../common/CommandStatus';
export declare enum FalHunyuanImageTo3dErrorType {
    ServerError = "server_error",
    NeedsFalApiKey = "needs_fal_api_key"
}
export interface FalHunyuanImageTo3dRequest {
    image_media_token?: string;
    base64_image?: string;
}
export interface FalHunyuanImageTo3dError extends CommandResult {
    error_type: FalHunyuanImageTo3dErrorType;
    error_message?: string;
}
export interface FalHunyuanImageTo3dPayload {
    media_token: string;
    cdn_url: string;
    base64_bytes: string;
}
export interface FalHunyuanImageTo3dSuccess extends CommandResult {
    payload: FalHunyuanImageTo3dPayload;
}
export type FalHunyuanImageTo3dResult = FalHunyuanImageTo3dSuccess | FalHunyuanImageTo3dError;
export declare const FalHunyuanImageTo3d: (request: FalHunyuanImageTo3dRequest) => Promise<FalHunyuanImageTo3dResult>;
//# sourceMappingURL=FalHunyuanImageTo3d.d.ts.map