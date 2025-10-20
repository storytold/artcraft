import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../../common/CommandStatus";
import {
  TaskStatus,
  TaskType,
  TaskModelType,
  TaskMediaFileClass,
  GenerationProvider,
} from "@storyteller/api-enums";

interface GetTaskQueueResponse {
  tasks: TaskQueueItem[];
}

export interface TaskQueueItem {
  id: string;
  task_status: TaskStatus;
  task_type: TaskType;
  model_type?: TaskModelType;
  provider?: GenerationProvider;
  provider_job_id?: string;
  completed_item?: TaskQueueCompletedItem;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface TaskQueueCompletedItem {
  primary_media_file: MediaFileData;
  media_file_class?: TaskMediaFileClass;
  maybe_batch_token?: string;
}

export interface MediaFileData {
  token: string;
  cdn_url: string;
  maybe_thumbnail_url_template?: string;
  created_at: Date;
}

interface GetTaskQueueSuccess extends CommandResult {
  payload: GetTaskQueueResponse;
}

export const GetTaskQueue = async (): Promise<GetTaskQueueResponse> => {
  const result = (await invoke(
    "get_task_queue_command"
  )) as GetTaskQueueSuccess;

  const tasks = result?.payload?.tasks || [];

  // Convert timestamps to Date objects
  const newTasks: TaskQueueItem[] = tasks.map((task) => {
    const completed_item = task.completed_item;

    if (completed_item) {
      completed_item.primary_media_file.created_at = new Date(
        completed_item.primary_media_file.created_at
      );
    }

    return {
      id: task.id,
      task_status: task.task_status,
      task_type: task.task_type,
      model_type: task.model_type,
      provider: task.provider,
      provider_job_id: task.provider_job_id,
      completed_item: completed_item,
      created_at: new Date(task.created_at),
      updated_at: new Date(task.updated_at),
      completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
    };
  });

  return {
    tasks: newTasks,
  };
};

// Temporary just for testing - expose on window in a typed way
declare global {
  interface Window {
    test_get_task_queue?: typeof GetTaskQueue;
  }
}
window.test_get_task_queue = GetTaskQueue;
