import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface SoraImageRemixRequest {
  // The media token of the visible screen snapshot
  snapshot_media_token: string,

  // Whether to disable (our) system prompt.
  disable_system_prompt: boolean,

  // The text prompt
  prompt: string,

  // Additional images (media tokens) to use as reference.
  maybe_additional_images: string[],

  // Typically "1"
  maybe_number_of_samples: number,

  // The aspect ratio of the output image
  aspect_ratio?: SoraImageRemixAspectRatio,
}

export enum SoraImageRemixAspectRatio {
  Square = "square",
  Wide = "wide",
  Tall = "tall",
}

export interface SoraImageRemixSuccess extends CommandResult {
  // TODO: Status fields (they're not on the backend yet)
}

export enum SoraImageRemixErrorType {
  ServerError = "server_error",
  TooManyConcurrentTasks = "too_many_concurrent_tasks",
  SoraIsHavingProblems = "sora_is_having_problems",
  SoraLoginRequired = "sora_login_required",
  SoraUsernameNotYetCreated = "sora_username_not_yet_created",
}

export interface SoraImageRemixError extends CommandResult {
  error_type: SoraImageRemixErrorType;
  error_message?: string;
}

export type SoraImageRemixResult = SoraImageRemixSuccess | SoraImageRemixError;

// Returns the Success and Error variants directly.
// Throws on Network/Tauri errors.
export const SoraImageRemix = async (request: SoraImageRemixRequest) : Promise<SoraImageRemixResult> => {
  try {
    return await invoke("sora_image_remix_command", {
      request: request,
    }) as SoraImageRemixResult;
  } catch (error) {
    let maybeTypedError = error as CommandResult;
    if ("status" in maybeTypedError) {
      return maybeTypedError
    } else {
      // Something else with Tauri, network, etc.
      throw error;
    }
  }
}
