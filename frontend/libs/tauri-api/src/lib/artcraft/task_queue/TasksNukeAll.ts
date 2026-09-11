import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../../common/CommandStatus";

interface TasksNukeAllSuccess extends CommandResult {
  payload: void;
}

export const TasksNukeAll = async () : Promise<TasksNukeAllSuccess> => {
  try {
    let result = await invoke("tasks_nuke_all_command") as TasksNukeAllSuccess;
    return result;
  } catch (error) {
    throw error;
  }
}

// Temporary just for testing -
(window as any).test_tasks_nuke_all = TasksNukeAll;
