import { v4 as uuidv4 } from "uuid";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { signalScene, startPollingActiveJobs } from "~/signals";
import { updateExistingScene, uploadNewScene } from "./api_fetchers";
import environmentVariables from "~/Classes/EnvironmentVariables";
import { GetCdnOrigin } from "~/api/GetCdnOrigin";
import { StorytellerApiHostStore } from "@storyteller/api";

interface StylizeVideoParams {
  media_token: string;
  style: ArtStyle;
  positive_prompt: string;
  negative_prompt: string;
  visibility: Visibility;
  use_face_detailer?: boolean;
  use_upscaler?: boolean;
  use_strength?: number;
  use_lipsync?: boolean;
  use_cinematic?: boolean;
  use_global_ipa_media_token?: string | null;
  input_depth_file?: string | null;
  input_normal_file?: string | null;
  input_outline_file?: string | null;
}

/**
 * Storyteller Studio API Manager
 * The source of truth of all these media items is the database in the cloud
 */
export class MediaFile {
  public_bucket_path: string;
  media_type: string;
  media_token: string;

  constructor(
    public_bucket_path: string,
    media_type: string,
    media_token: string,
  ) {
    this.media_token = media_token;
    this.public_bucket_path = public_bucket_path;
    this.media_type = media_type;
  }
}

export enum ArtStyle {
  Anime2_5D = "anime_2_5d",
  Anime2DFlat = "anime_2d_flat",
  Cartoon3D = "cartoon_3d",
  ComicBook = "comic_book",
  AnimeGhibli = "anime_ghibli",
  InkPunk = "ink_punk",
  InkSplash = "ink_splash",
  InkBWStyle = "ink_bw_style",
  JojoStyle = "jojo_style",
  PaperOrigami = "paper_origami",
  PixelArt = "pixel_art",
  PopArt = "pop_art",
  Realistic1 = "realistic_1",
  Realistic2 = "realistic_2",
  AnimeRetroNeon = "anime_retro_neon",
  AnimeStandard = "anime_standard",
  HRGiger = "hr_giger",
  Simpsons = "simpsons",
  Carnage = "carnage",
  PastelCuteAnime = "pastel_cute_anime",
  Bloom = "bloom_lighting",
  Horror2_5D = "25d_horror",
  Creepy = "creepy",
  CreepyVHS = "creepy_vhs",
  TrailCamFootage = "trail_cam_footage",
  OldBWMovie = "old_black_white_movie",
  HorrorNoirBW = "horror_noir_black_white",
  TechnoNoirBW = "techno_noir_black_white",
  BW20s = "black_white_20s",
  AnimeCyberpunk = "cyberpunk_anime",
  Dragonball = "dragonball",
  RealisticMatrix = "realistic_matrix",
  RealisticCyberpunk = "realistic_cyberpunk",
}

export enum Visibility {
  Public = "public",
  Hidden = "hidden",
  Private = "private",
}

/**
 * This is designed to surface user customer facing messages as errors.
 */
// type Data = { [key: string]: any };
// class APIManagerResponseSuccess {
//   public user_message: string;
//   public data: Data | null;
//   constructor(user_message: string = "", data: Data | null = null) {
//     this.data = data;
//     this.user_message = user_message;
//   }
// }

/**
 * This is designed to surface user customer facing messages as errors.
 * Errors shouldn't be 404 or something confusing should be
 */
class APIManagerResponseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "APIManagerResponseError";
  }
}

export class APIManager {

  constructor() {
    // NB(bt,2025-07-06): Cleaning this up. The code was duplicated a half dozen times.
    //  I think all of the code in this file is legacy, but to be safe I'm continuing to update it.
  }

  protected getApiSchemeAndHost() {
    return StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  }

  /**
   * @param scene The 3JS Scene we want to save.
   * @param scene_name The Scene name we want to display
   * @param scene_media_file_token If null we will we will create a new save or copy the scene, if provided we will overwrite the scene.
   * @returns APIManagerResponseMessage
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

    // failed so catch this.
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

    console.log(uploadSceneResponse);
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
    const media_base_url = GetCdnOrigin();
    //const media_url = `${media_base_url}/vocodes-public${bucket_path}`; // gets you a bucket path
    const media_url = `${media_base_url}${bucket_path}`; // gets you a bucket path

    const file_response = await fetch(media_url);

    if (!file_response.ok) {
      throw new APIManagerResponseError("Failed to download file");
    }
    // Convert the response from a blob to json text
    const blob = await file_response.blob();
    const json_result: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(JSON.parse(reader.result as string));
      reader.onerror = reject;
      reader.readAsText(blob);
    });

    return json_result;
  }

  /**
   * This recieves the bucket path of a media file
   * @param media_file_token
   * @returns
   */
  public async getMediaFile(media_file_token: string): Promise<string> {
    const url = `${this.getApiSchemeAndHost()}/v1/media_files/file/${media_file_token}`;
    const response = await fetch(url);
    const json = await JSON.parse(await response.text());
    const bucketPath = json["media_file"]["public_bucket_path"];
    const media_base_url = GetCdnOrigin();
    const media_url = `${media_base_url}${bucketPath}`; // gets you a bucket path
    return media_url;
  }

  /**
    This will save the scene to keep ids positions.
    It will also give the file a name which will be a uuidv4()
    @param scene The 3JS Scene we want to make a file to be uploaded as multipart form.
  */
  private async gltfExport(scene: THREE.Scene): Promise<File> {
    const gltfExporter = new GLTFExporter();
    const uuid = uuidv4();
    const result = await gltfExporter.parseAsync(scene);
    const file = new File([JSON.stringify(result)], `${uuid}.glb`, {
      type: "application/json",
    });
    return file;
  }

  public async uploadMediaSceneThumbnail(blob: Blob | File, fileName: string) {
    const url = `${this.getApiSchemeAndHost()}/v1/media_files/upload/image`;
    const uuid = uuidv4();

    const formData = new FormData();
    formData.append("uuid_idempotency_token", uuid);
    formData.append("is_intermediate_system_file", "true");
    formData.append("maybe_title", "Screenshot");
    formData.append("file", blob, fileName);
    //formData.append("source", "file");
    //formData.append("type", "video");
    //formData.append("source", "file");

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
    } else {
      const json_data = await response.json();
      //console.log(`uploadMedia: ${JSON.stringify(json_data)}`);
      return json_data;
    }
  }

  public async uploadMedia({
    blob,
    fileName,
    title,
    styleName,
    maybe_scene_source_media_file_token,
  }: {
    blob: Blob;
    fileName: string;
    title: string;
    styleName?: string;
    maybe_scene_source_media_file_token: string | undefined;
  }) {
    // Promise<APIManagerResponseSuccess>
    //TODO: UPDATE ENDPOINT!!!!
    const url = `${this.getApiSchemeAndHost()}/v1/media_files/upload/new_video`;
    const uuid = uuidv4();

    const formData = new FormData();
    formData.append("uuid_idempotency_token", uuid);

    formData.append("file", blob, fileName);
    // formData.append("source", "file");
    // formData.append("type", "video");
    if (styleName) formData.append("maybe_style_name", styleName);
    formData.append("maybe_title", title);

    // This signals to the backend to hide the video from view
    formData.append("is_intermediate_system_file", "true");
    if (maybe_scene_source_media_file_token !== undefined) {
      formData.append(
        "maybe_scene_source_media_file_token",
        maybe_scene_source_media_file_token,
      );
    }
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
    } else {
      const json_data = await response.json();
      //console.log(`uploadMedia: ${JSON.stringify(json_data)}`);
      return json_data;
    }
  }

  public async uploadMediaFrameGeneration(
    blob: Blob | File,
    fileName: string,
    style: string = "comic_book",
    positive_prompt: string,
    negative_prompt: string,
  ): Promise<string> {
    const url = `${environmentVariables.values.FUNNEL_API}/preview/`;

    const payload = {
      style: style,
      positive_prompt: positive_prompt,
      negative_prompt: negative_prompt,
    };

    const formData = new FormData();
    formData.append("input_file", blob, fileName);
    formData.append("request", JSON.stringify(payload));

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
    } else {
      return URL.createObjectURL(await response.blob());
    }
  }

  public async getMediaBatch(media_tokens: string[]): Promise<MediaFile[]> {
    const tokens = media_tokens;
    const url = new URL(`${this.getApiSchemeAndHost()}/v1/media_files/batch`);
    tokens.forEach((token) => url.searchParams.append("tokens", token));
    const result = await fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const result = data["media_files"].map((element: any) => {
          return new MediaFile(
            element["public_bucket_path"],
            element["media_type"],
            element["token"],
          );
        });
        return result;
      })
      .catch((error) => console.error("Error:", error));
    return result;
  }

  public async stylizeVideo({
    media_token,
    style,
    positive_prompt,
    negative_prompt,
    visibility,
    use_face_detailer = false,
    use_upscaler = false,
    use_strength = 1.0,
    use_lipsync = false,
    use_cinematic = false,
    use_global_ipa_media_token = null,
    input_depth_file = null,
    input_normal_file = null,
    input_outline_file = null,
  }: StylizeVideoParams) {
    const uuid = uuidv4();

    const data = {
      uuid_idempotency_token: uuid,
      style: style,
      input_file: media_token,
      prompt: positive_prompt,
      negative_prompt: negative_prompt,
      trim_start_millis: 0,
      trim_end_millis: 7000,
      enable_lipsync: use_lipsync,
      creator_set_visibility: visibility,
      use_face_detailer: use_face_detailer,
      use_upscaler: use_upscaler,
      use_strength: use_strength,
      use_lipsync: use_lipsync,
      global_ipa_media_token: use_global_ipa_media_token,
      use_cinematic: use_cinematic,
      input_depth_file: input_depth_file,
      input_normal_file: input_normal_file,
      input_outline_file: input_outline_file,
    };

    const json_data = JSON.stringify(data);

    const response = await fetch(
      `${this.getApiSchemeAndHost()}/v1/workflows/enqueue_studio`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: json_data,
      },
    );

    startPollingActiveJobs();

    if (!response.ok) {
      // Handle HTTP error responses
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} ${errorData.message}`);
    }

    // Assuming the response is JSON and matches the EnqueueVideoStyleTransferSuccessResponse interface
    return await response.json();
  }
}
