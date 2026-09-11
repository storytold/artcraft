import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../../common/CommandStatus";

interface MarkTaskAsDismissedSuccess extends CommandResult {
  payload: void;
}

export const MarkTaskAsDismissed = async (task_id: string) : Promise<MarkTaskAsDismissedSuccess> => {
  try {
    let result = await invoke("mark_task_as_dismissed_command", { 
      request: {
        task: task_id 
      } 
    }) as MarkTaskAsDismissedSuccess;
    return result;
  } catch (error) {
    throw error;
  }
}

// Temporary just for testing -
(window as any).test_mark_task_as_dismissed = MarkTaskAsDismissed;
