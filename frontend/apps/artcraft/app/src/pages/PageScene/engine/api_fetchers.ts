import { v4 as uuidv4 } from "uuid";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";
import { StorytellerApiHostStore } from "@storyteller/api";

export const uploadNewScene = async (file: File, sceneTitle: string) => {
  const apiSchemeAndHost = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  const endpoint = `${apiSchemeAndHost}/v1/media_files/upload/new_scene`;

  const formData = new FormData();
  formData.append("uuid_idempotency_token", uuidv4());
  formData.append("file", file);
  formData.append("maybe_title", sceneTitle);
  formData.append("maybe_visibility", "public");
  formData.append("engine_category", "scene");

  return await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    body: formData,
  })
    .then((res) => res.json())
    .then((res) => {
      if (res && res.success) {
        return res;
      } else {
        return { success: false };
      }
    })
    .catch(() => {
      return { success: false };
    });
};

export const updateExistingScene = async (file: File, sceneToken: string) => {
  const apiSchemeAndHost = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  const endpoint = `${apiSchemeAndHost}/v1/media_files/upload/saved_scene/${sceneToken}`;

  const formData = new FormData();
  formData.append("uuid_idempotency_token", uuidv4());
  formData.append("file", file);

  return await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    body: formData,
  })
    .then((res) => res.json())
    .then((res) => {
      if (res && res.success) {
        return res;
      } else {
        return { success: false };
      }
    })
    .catch(() => {
      return { success: false };
    });
};
