import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";
import { commandErrorMessage } from "../common/commandErrorMessage";

export interface SeedanceDraftInfo {
  // Unix seconds after which the final video can no longer be rendered.
  expires_at: number;
  is_expired: boolean;
}

interface GetSeedanceDraftSuccess extends CommandResult {
  payload: { maybe_draft?: SeedanceDraftInfo | null };
}

// Whether a video is a Seedance 2.5 draft (made with BytePlus on this computer) that can
// still render its 1080p final. Resolves to null for any other video.
export const GetSeedanceDraft = async (
  mediaFileToken: string,
): Promise<SeedanceDraftInfo | null> => {
  try {
    const result = (await invoke("get_seedance_draft_command", {
      request: { media_file_token: mediaFileToken },
    })) as GetSeedanceDraftSuccess;
    return result.payload.maybe_draft ?? null;
  } catch (error) {
    throw new Error(commandErrorMessage(error, "Could not check this video's draft."));
  }
};
