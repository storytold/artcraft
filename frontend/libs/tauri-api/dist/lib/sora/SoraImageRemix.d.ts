import { CommandResult } from '../common/CommandStatus';
export interface SoraImageRemixRequest {
    snapshot_media_token: string;
    disable_system_prompt: boolean;
    prompt: string;
    maybe_additional_images: string[];
    maybe_number_of_samples: number;
    aspect_ratio?: SoraImageRemixAspectRatio;
}
export declare enum SoraImageRemixAspectRatio {
    Square = "square",
    Wide = "wide",
    Tall = "tall"
}
export interface SoraImageRemixSuccess extends CommandResult {
}
export declare enum SoraImageRemixErrorType {
    ServerError = "server_error",
    TooManyConcurrentTasks = "too_many_concurrent_tasks",
    SoraIsHavingProblems = "sora_is_having_problems",
    SoraLoginRequired = "sora_login_required",
    SoraUsernameNotYetCreated = "sora_username_not_yet_created"
}
export interface SoraImageRemixError extends CommandResult {
    error_type: SoraImageRemixErrorType;
    error_message?: string;
}
export type SoraImageRemixResult = SoraImageRemixSuccess | SoraImageRemixError;
export declare const SoraImageRemix: (request: SoraImageRemixRequest) => Promise<SoraImageRemixResult>;
//# sourceMappingURL=SoraImageRemix.d.ts.map