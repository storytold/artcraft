import { CommandResult } from '../common/CommandStatus';
import { Model } from '@storyteller/model-list';
export declare enum EnqueueImageToVideoErrorType {
    ModelNotSpecified = "model_not_specified",
    ServerError = "server_error",
    NeedsFalApiKey = "needs_fal_api_key",
    FalError = "fal_error"
}
export interface EnqueueImageToVideoRequest {
    model?: Model;
    image_media_token?: string;
    end_frame_image_media_token?: string;
    prompt?: string;
    frontend_caller?: string;
    frontend_subscriber_id?: string;
}
export interface EnqueueImageToVideoError extends CommandResult {
    error_type: EnqueueImageToVideoErrorType;
    error_message?: string;
}
export interface EnqueueImageToVideoPayload {
}
export interface EnqueueImageToVideoSuccess extends CommandResult {
    payload: EnqueueImageToVideoPayload;
}
export type EnqueueImageToVideoResult = EnqueueImageToVideoSuccess | EnqueueImageToVideoError;
export declare const EnqueueImageToVideo: (request: EnqueueImageToVideoRequest) => Promise<EnqueueImageToVideoResult>;
//# sourceMappingURL=EnqueueImageToVideo.d.ts.map