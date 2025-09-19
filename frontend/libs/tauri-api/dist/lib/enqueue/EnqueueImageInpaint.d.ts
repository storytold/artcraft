import { CommandResult } from '../common/CommandStatus';
import { ImageModel, ModelInfo } from '@storyteller/model-list';
export interface EnqueueImageInpaintRequest {
    model?: ImageModel | ModelInfo | EnqueueImageInpaintModel;
    image_media_token?: string;
    mask_image_raw_bytes?: Uint8Array;
    prompt?: string;
    image_count?: number;
    frontend_caller?: string;
    frontend_subscriber_id?: string;
}
export declare enum EnqueueImageInpaintErrorType {
    ModelNotSpecified = "model_not_specified",
    NoProviderAvailable = "no_provider_available",
    BadRequest = "bad_request",
    ServerError = "server_error",
    TooManyConcurrentTasks = "too_many_concurrent_tasks",
    SoraLoginRequired = "sora_login_required",
    SoraUsernameNotYetCreated = "sora_username_not_yet_created",
    SoraIsHavingProblems = "sora_is_having_problems"
}
export declare enum EnqueueImageInpaintModel {
    FluxPro1 = "flux_pro_1",
    FluxDevJuggernaut = "flux_dev_juggernaut"
}
export interface EnqueueImageInpaintError extends CommandResult {
    error_type: EnqueueImageInpaintErrorType;
    error_message?: string;
}
export interface EnqueueImageInpaintPayload {
}
export interface EnqueueImageInpaintSuccess extends CommandResult {
    payload: EnqueueImageInpaintPayload;
}
export type EnqueueImageInpaintResult = EnqueueImageInpaintSuccess | EnqueueImageInpaintError;
export declare const EnqueueImageInpaint: (request: EnqueueImageInpaintRequest) => Promise<EnqueueImageInpaintResult>;
//# sourceMappingURL=EnqueueImageInpaint.d.ts.map