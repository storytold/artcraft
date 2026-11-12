import { invoke } from "@tauri-apps/api/core";

export interface UpdateInfo {
  current_version: string;
  maybe_available_version: string | null;
  can_install: boolean;
  tasks_running: boolean;
  releases_url: string;
}

export const CheckForUpdates = (): Promise<UpdateInfo> =>
  invoke("check_for_updates_command");

export const InstallUpdate = (): Promise<void> =>
  invoke("install_update_command", { confirmed: true });
