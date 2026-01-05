import { invoke } from "@tauri-apps/api/core";
import { CommandResult, CommandSuccessStatus } from "../common/CommandStatus";

export interface OpenUrlSuccess extends CommandResult {
  payload: OpenUrlPayload;
}

export interface OpenUrlPayload {
}

export const OpenUrl = async (url: string) : Promise<OpenUrlSuccess> => {
  try {
    await invoke("plugin:opener|open_url", {
      url: url,
    });
    
    return {
      status: CommandSuccessStatus.Success,
      payload: {},
    };
  } catch (error) {
    throw error;
  }
}

