import { CommandResult } from '../common/CommandStatus';
import { Model } from '@storyteller/model-list';
export declare enum EnqueueTextToImageErrorType {
    ModelNotSpecified = "model_not_specified",
    ServerError = "server_error",
    NeedsFalApiKey = "needs_fal_api_key",
    FalError = "fal_error"
}
export interface EnqueueTextToImageRequest {
    model?: Model | EnqueueTextToImageModel;
    prompt?: string;
    aspect_ratio?: EnqueueTextToImageSize;
    number_images?: number;
    image_media_tokens?: string[];
    frontend_caller?: string;
    frontend_subscriber_id?: string;
}
export declare enum EnqueueTextToImageModel {
    FluxProUltra = "flux_pro_ultra",
    GptImage1 = "gpt_image_1",
    Recraft3 = "recraft_3"
}
export declare enum EnqueueTextToImageSize {
    Auto = "auto",
    Square = "square",
    Wide = "wide",
    Tall = "tall"
}
export interface EnqueueTextToImageError extends CommandResult {
    error_type: EnqueueTextToImageErrorType;
    error_message?: string;
}
export interface EnqueueTextToImagePayload {
    media_token: string;
    cdn_url: string;
    base64_bytes: string;
}
export interface EnqueueTextToImageSuccess extends CommandResult {
    payload: EnqueueTextToImagePayload;
}
export type EnqueueTextToImageResult = EnqueueTextToImageSuccess | EnqueueTextToImageError;
export declare const EnqueueTextToImage: (request: EnqueueTextToImageRequest) => Promise<EnqueueTextToImageResult>;
//# sourceMappingURL=EnqueueTextToImage.d.ts.map