import { CommandResult } from '../common/CommandStatus';
export interface EnqueueImageBgRemovalRequest {
    image_media_token?: string;
    base64_image?: string;
    frontend_caller?: string;
    frontend_subscriber_id?: string;
}
export declare enum EnqueueImageBgRemovalErrorType {
    ModelNotSpecified = "model_not_specified",
    ServerError = "server_error",
    NeedsFalApiKey = "needs_fal_api_key",
    FalError = "fal_error"
}
export interface EnqueueImageBgRemovalError extends CommandResult {
    error_type: EnqueueImageBgRemovalErrorType;
    error_message?: string;
}
export interface EnqueueImageBgRemovalPayload {
}
export interface EnqueueImageBgRemovalSuccess extends CommandResult {
    payload: EnqueueImageBgRemovalPayload;
}
export type EnqueueImageBgRemovalResult = EnqueueImageBgRemovalSuccess | EnqueueImageBgRemovalError;
export declare const EnqueueImageBgRemoval: (request: EnqueueImageBgRemovalRequest) => Promise<EnqueueImageBgRemovalResult>;
//# sourceMappingURL=EnqueueImageBgRemovalCommand.d.ts.map