import { CommandResult } from '../common/CommandStatus';
export declare enum EnqueueImageTo3dObjectErrorType {
    ModelNotSpecified = "model_not_specified",
    ServerError = "server_error",
    NeedsFalApiKey = "needs_fal_api_key",
    FalError = "fal_error",
    NeedsStorytellerCredentials = "needs_storyteller_credentials"
}
export interface EnqueueImageTo3dObjectRequest {
    image_media_token?: string;
    model?: EnqueueImageTo3dObjectModel;
}
export declare enum EnqueueImageTo3dObjectModel {
    Hunyuan3d2 = "hunyuan_3d_2",
    Hunyuan3d2_0 = "hunyuan_3d_2_0",
    Hunyuan3d2_1 = "hunyuan_3d_2_1"
}
export interface EnqueueImageTo3dObjectError extends CommandResult {
    error_type: EnqueueImageTo3dObjectErrorType;
    error_message?: string;
}
export interface EnqueueImageTo3dObjectPayload {
}
export interface EnqueueImageTo3dObjectSuccess extends CommandResult {
    payload: EnqueueImageTo3dObjectPayload;
}
export type EnqueueImageTo3dObjectResult = EnqueueImageTo3dObjectSuccess | EnqueueImageTo3dObjectError;
export declare const EnqueueImageTo3dObject: (request: EnqueueImageTo3dObjectRequest) => Promise<EnqueueImageTo3dObjectResult>;
//# sourceMappingURL=EnqueueImageTo3dObject.d.ts.map