import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface ListSystemFontsSuccess extends CommandResult {
  payload: ListSystemFontsPayload;
}

export interface ListSystemFontsPayload {
  // Installed font family names, sorted and de-duplicated.
  families: string[];
}

// Returns the installed font families. Throws on Tauri errors.
export const ListSystemFonts = async (): Promise<ListSystemFontsSuccess> => {
  return (await invoke("list_system_fonts_command")) as ListSystemFontsSuccess;
};
