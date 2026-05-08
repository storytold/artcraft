import { v4 as uuidv4 } from "uuid";
import { signalScene } from "~/signals";
import { updateExistingScene, uploadNewScene } from "./api_fetchers";
import { GetCdnOrigin } from "~/api/GetCdnOrigin";
import { StorytellerApiHostStore } from "@storyteller/api";

/**
 * Storyteller Studio API Manager
 *
 * The 3D editor used to drive a video-render pipeline through this
 * file (uploadMediaFrameGeneration, stylizeVideo, getMediaBatch,
 * etc.); all of that is gone. What's left handles scene save +
 * load and the cover-image thumbnail that goes with a save.
 */

class APIManagerResponseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "APIManagerResponseError";
  }
}

export class APIManager {
  protected getApiSchemeAndHost() {
    return StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  }

  /**
   * @param saveJson  Serialized scene JSON to upload as the scene file.
   * @param sceneTitle  Display title.
   * @param sceneToken  If provided, overwrite that scene; otherwise a new scene is created.
   * @param sceneThumbnail  Cover image to attach to the scene record.
   * @returns The media file token of the saved scene, or "" on failure.
   */
  public async saveSceneState({
    saveJson,
    sceneTitle,
    sceneToken,
    sceneThumbnail,
  }: {
    saveJson: string;
    sceneTitle: string;
    sceneToken?: string;
    sceneThumbnail: Blob | undefined;
  }): Promise<string> {
    const file = new File([saveJson], `${sceneTitle}.glb`, {
      type: "application/json",
    });

    const uploadSceneResponse = sceneToken
      ? await updateExistingScene(file, sceneToken)
      : await uploadNewScene(file, sceneTitle);

    if (uploadSceneResponse["success"] == false) {
      return "";
    }

    if (sceneThumbnail) {
      const image_resp = await this.uploadMediaSceneThumbnail(
        sceneThumbnail,
        "render.png",
      );

      if (image_resp["success"] == false) {
        return "";
      }

      if (image_resp["media_file_token"]) {
        const image_token = image_resp["media_file_token"];
        const endpoint = `${this.getApiSchemeAndHost()}/v1/media_files/cover_image/${uploadSceneResponse["media_file_token"]}`;

        await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cover_image_media_file_token: image_token }),
        });
      }
    }

    return uploadSceneResponse["media_file_token"];
  }

  public async loadSceneState(
    scene_media_file_token: string | null,
  ): Promise<any> {
    const url = `${this.getApiSchemeAndHost()}/v1/media_files/file/${scene_media_file_token}`;
    const response = await fetch(url);
    if (response.status > 200) {
      throw new APIManagerResponseError("Failed to load scene");
    }

    const json = await response.json();
    if (json && json.media_file) {
      if (json.media_file.maybe_title === null) {
        console.warn(`Scene /w Token: ${scene_media_file_token} has no title`);
      }
      signalScene({
        title: json.media_file.maybe_title || "Untitled Scene",
        token: scene_media_file_token || undefined,
        ownerToken: json.media_file.maybe_creator_user.user_token,
        isModified: false,
      });
    }
    const bucket_path = json["media_file"]["public_bucket_path"];
    const media_url = `${GetCdnOrigin()}${bucket_path}`;

    const file_response = await fetch(media_url);
    if (!file_response.ok) {
      throw new APIManagerResponseError("Failed to download file");
    }

    const blob = await file_response.blob();
    const json_result: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(JSON.parse(reader.result as string));
      reader.onerror = reject;
      reader.readAsText(blob);
    });

    return json_result;
  }

  public async uploadMediaSceneThumbnail(blob: Blob | File, fileName: string) {
    const url = `${this.getApiSchemeAndHost()}/v1/media_files/upload/image`;
    const uuid = uuidv4();

    const formData = new FormData();
    formData.append("uuid_idempotency_token", uuid);
    formData.append("is_intermediate_system_file", "true");
    formData.append("maybe_title", "Screenshot");
    formData.append("file", blob, fileName);

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });
    if (!response.ok) {
      throw new APIManagerResponseError("Upload Media Failed to send file");
    }
    return await response.json();
  }
}
