import { invoke } from "@tauri-apps/api/core";
import { commandErrorMessage } from "../common/commandErrorMessage";

// Starts the 1080p video from a Seedance 2.5 draft. The result arrives like any other generation.
export const RenderSeedanceFinal = async (mediaFileToken: string): Promise<void> => {
  try {
    await invoke("render_seedance_final_command", {
      request: { media_file_token: mediaFileToken },
    });
  } catch (error) {
    throw new Error(commandErrorMessage(error, "Could not start the final render."));
  }
};
