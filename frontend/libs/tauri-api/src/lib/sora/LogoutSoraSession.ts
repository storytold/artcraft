import { invoke } from "@tauri-apps/api/core";

export const LogoutSoraSession = async (): Promise<void> => {
  return await invoke("sora_logout_command");
};
