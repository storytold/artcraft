import { CommandResult } from '../common/CommandStatus';
import { ImageModel } from '@storyteller/model-list';
export interface EnqueueContextualEditImageRequest {
    model?: ImageModel | EnqueueContextualEditImageModel;
    scene_image_media_token?: string;
    image_media_tokens?: string[];
    prompt?: string;
    disable_system_prompt?: boolean;
    image_count?: number;
    aspect_ratio?: EnqueueContextualEditImageSize;
    image_quality?: EnqueueContextualEditImageQuality;
}
export declare enum EnqueueContextualEditImageErrorType {
    ModelNotSpecified = "model_not_specified",
    NoProviderAvailable = "no_provider_available",
    BadRequest = "bad_request",
    ServerError = "server_error",
    TooManyConcurrentTasks = "too_many_concurrent_tasks",
    SoraLoginRequired = "sora_login_required",
    SoraUsernameNotYetCreated = "sora_username_not_yet_created",
    SoraIsHavingProblems = "sora_is_having_problems"
}
export declare enum EnqueueContextualEditImageModel {
    GptImage1 = "gpt_image_1",
    FluxProKontextMax = "flux_pro_kontext_max"
}
export declare enum EnqueueContextualEditImageSize {
    Auto = "auto",
    Square = "square",
    Wide = "wide",
    Tall = "tall"
}
export declare enum EnqueueContextualEditImageQuality {
    Auto = "auto",
    High = "high",
    Medium = "medium",
    Low = "low"
}
export interface EnqueueContextualEditImageError extends CommandResult {
    error_type: EnqueueContextualEditImageErrorType;
    error_message?: string;
}
export interface EnqueueContextualEditImagePayload {
}
export interface EnqueueContextualEditImageSuccess extends CommandResult {
    payload: EnqueueContextualEditImagePayload;
}
export type EnqueueContextualEditImageResult = EnqueueContextualEditImageSuccess | EnqueueContextualEditImageError;
export declare const EnqueueContextualEditImage: (request: EnqueueContextualEditImageRequest) => Promise<EnqueueContextualEditImageResult>;
//# sourceMappingURL=EnqueueContextualEditImage.d.ts.map