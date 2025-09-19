import { invoke } from "@tauri-apps/api/core";

export const LoadWithoutCors = async (url: string) : Promise<ArrayBuffer> => {
  try {
    // Tauri Result<Success, Error> - success case.
    let result = await invoke("load_without_cors_command", { url });
    return result as ArrayBuffer;
  } catch (error) {
    // Tauri Result<Success, Error> - error case.
    console.error("LoadWithoutCors error", error);
    throw error;
  }
}
