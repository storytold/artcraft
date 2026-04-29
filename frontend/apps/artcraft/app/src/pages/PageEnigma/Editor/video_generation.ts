import Editor from "./editor";
import { EditorStates } from "~/pages/PageEnigma/enums";
import { usePageEnigmaStore } from "../PageEnigmaStore";
import { ToastTypes, ClipType } from "~/enums";

import { Visibility } from "./api_manager.js";
import * as THREE from "three";
import { getSceneSignals, addToast, startPollingActiveJobs } from "~/signals";
import { v4 as uuidv4 } from "uuid";
import { SceneGenereationMetaData as SceneGenerationMetaData } from "~/pages/PageEnigma/models/sceneGenerationMetadata";
import { MediaUploadApi, StudioGen2Api, VideoApi } from "~/Classes/ApiManager";


// TODO THIS CLASS MAKES NO SENSE
// Refactor so we generate all the frames first.
// then pass it through this pipeline as a data structure process it.
// through this class.

interface MediaTokens {
  // NB(bt,2025-01-27): This media token was likely called "color" because we were originally 
  // going to send a shaded "color" render, a depth map render, and an edge detect render to 
  // the backend for inference.
  color: string;
}

export class VideoGeneration {
  editor: Editor;
  mediaUploadAPI: MediaUploadApi;
  videoAPI: VideoApi;
  studioGen2Api: StudioGen2Api;

  // For cached style Re-Generation
  private last_scene_check_sum: string;
  // Last Media token IDs
  private last_media_tokens: MediaTokens;
  // Last toggle position for Render
  public last_position_of_preprocessing: boolean;

  constructor(editor: Editor) {
    this.editor = editor;
    this.mediaUploadAPI = new MediaUploadApi();
    this.videoAPI = new VideoApi();
    this.studioGen2Api = new StudioGen2Api();
    this.last_scene_check_sum = "";
    this.last_media_tokens = { color: "" };
    this.last_position_of_preprocessing = false;
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async videoProcessingPipeline(title: string): Promise<MediaTokens> {
    const mediaTokens: MediaTokens = {
      color: "",
    };
    try {
      // TODO send the audio a later time.
      // const audioClips = this.editor.timeline.timeline_items.filter((clip) => {
      //   return clip.type == ClipType.AUDIO;
      // });

      // TODO: timeline-driven engineFrameBuffers was removed; rewire video
      // capture to a non-timeline trigger (likely an explicit frame loop
      // owned by VideoGeneration).
      const zipBlob: Blob | null = null;
      if (!zipBlob) {
        await this.handleError(`"Payload blob is null."`, 3000);
      }

      const video_upload_response = await this.mediaUploadAPI.UploadStudioShot({
        maybe_title: title,
        uuid_idempotency_token: uuidv4(),
        blob: zipBlob,
        fileName: `${title}.zip`,
        maybe_visibility: Visibility.Public,
      });

      if (!video_upload_response.data) {
        console.log("Missing media_tokens.color Token");
        const error = {
          message: "Missing Data From Video Upload Response",
          code: 1,
        };
        throw error;
      }

      mediaTokens.color = video_upload_response.data;

      console.log(`Studio recording: https://storyteller.ai/media/${mediaTokens.color}`);

    } finally {
      
    }

    return mediaTokens;
  }

  // this is to generate previews
  async generateFrame() {
    if (!this.editor.generating_preview && this.editor.rawRenderer) {
      this.editor.generating_preview = true;
      this.editor.utils.removeTransformControls();
      this.editor.activeScene.renderMode(true);
      if (this.editor.activeScene.hot_items) {
        this.editor.activeScene.hot_items.forEach((element) => {
          element.visible = false;
        });
      }

      usePageEnigmaStore.getState().setPreviewSrc("");

      this.editor.rawRenderer.setSize(
        this.editor.render_width,
        this.editor.render_height,
      );

      this.editor.render_camera.aspect =
        this.editor.render_width / this.editor.render_height;

      this.editor.render_camera.updateProjectionMatrix();

      this.editor.rawRenderer.render(
        this.editor.activeScene.scene,
        this.editor.render_camera,
      );

      const imgData = this.editor.rawRenderer.domElement.toDataURL();
      const response = await fetch(imgData); // Fetch the data URL
      const blob = await response.blob(); // Convert to Blob

      if (!this.editor.camera_person_mode) {
        this.editor.switchCameraView();
        usePageEnigmaStore.getState().setEditorState(EditorStates.PREVIEW);
      }

      this.editor.generating_preview = false;

      try {
        const url = await this.editor.api_manager.uploadMediaFrameGeneration(
          blob,
          "render.png",
          this.editor.art_style,
          this.editor.positive_prompt,
          this.editor.negative_prompt,
        );

        usePageEnigmaStore.getState().setPreviewSrc(url);
        return Promise.resolve(url);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Unknown Error in Generate Frame";
        addToast(ToastTypes.ERROR, errorMessage);
      }
    }
  }

  // to determine if we should capture frames again or not.
  async shouldRenderScenesAgain(checkSumData: string): Promise<boolean> {
    // Should skip to rendering the scene if already processed the frames inputs for running a new style.
    if (this.last_scene_check_sum === "") {
      // no token means input was not processed so lets go do the video re-render process
      this.last_scene_check_sum = checkSumData;
      return false;
    } else {
      if (this.last_scene_check_sum === checkSumData) {
        return true;
      } else {
        this.last_scene_check_sum = checkSumData;
        return false;
      }
    }
  }

  async stopPlaybackAndUploadVideo() {
    this.editor.rendering = false; // not sure about this variable ... this has so many state issues.

    // precondition checks, if we have no frames then we shouldn't try to do generations or snapshots
    // This means no frames so error out

    this.editor.generating_preview = true;

    await this.editor.updateLoad({
      progress: 50,
      message:
        "Please stay on this screen and do not switch tabs! while your video is being processed.",
    });

    let media_tokens: MediaTokens = {
      color: "",
    };

    // properties used by the external scope to the for loop.
    const title = getSceneSignals().title || "Untitled";
    const style_name = this.editor.art_style.toString();
    const media_token = this.editor.current_scene_media_token || undefined;

    // TAKE A snap shot of the scene then use this token across all videos
    // convert the ip adapter image and upload as a media token
    const image_uuid = uuidv4();
    let ipa_image_token = undefined;

    if (this.editor.globalIpAdapterImage != undefined) {
      const response = await this.mediaUploadAPI.UploadImage({
        fileName: `${image_uuid}.ipa`,
        blob: this.editor.globalIpAdapterImage,
        uuid: image_uuid,
      });

      if (!response.success) {
        // ip adapter upload failed
        await this.handleError(
          "Reference Image Upload Failed Try Generating Movie Again.",
          3000,
        );
        return;
      }

      if (!response.data) {
        console.log("IPA Image Token Missing");
      }

      ipa_image_token = response.data;
    }

    // update the signal with this information
    if (ipa_image_token) {
      usePageEnigmaStore.getState().setGlobalIPAMediaToken(ipa_image_token);
    }

    // TODO Remove so many of these around wtf. SceneGenereationMetaData should only be one place
    const metaData: SceneGenerationMetaData = {
      artisticStyle: this.editor.art_style,
      positivePrompt: this.editor.positive_prompt,
      negativePrompt: this.editor.negative_prompt,
      cameraAspectRatio: this.editor.render_camera_aspect_ratio,
      upscale: this.editor.generation_options.upscale,
      faceDetail: this.editor.generation_options.faceDetail,
      styleStrength: this.editor.generation_options.styleStrength,
      lipSync: this.editor.generation_options.lipSync,
      cinematic: this.editor.generation_options.cinematic,
      globalIPAMediaToken: ipa_image_token,
      enginePreProcessing: this.editor.engine_preprocessing, // the only thing that will invalidate the cache
    };

    // for the one case where the engine preprecessing is turned we need to cache this.
    this.last_position_of_preprocessing = this.editor.engine_preprocessing;

    // This is to save the snapshot of the scene for remixing
    const uuid_snapshot = uuidv4();

    // Save the scene
    const saveData = await this.editor.save_manager.saveData({
      sceneTitle: title,
      sceneToken: media_token,
      sceneGenerationMetadata: metaData,
    });

    const file = new File([saveData], `${title}.glb`, {
      type: "application/json",
    });

    const response =
      await this.editor.media_upload.UploadSceneSnapshotMediaFileForm({
        maybe_title: title,
        maybe_scene_source_media_file_token: media_token, // can be undefined or null
        uuid: uuid_snapshot,
        blob: file,
      });

    let immutable_media_token = undefined;
    if (response.success) {
      if (response.data) {
        immutable_media_token = response.data;
      }
    } else {
      await this.handleError(
        "Scene Snapshot Failed Try Generating Movie Again.",
        3000,
      );
      return;
    }

    console.log(`Immutable Snapshot Token: ${immutable_media_token}`);

    await this.editor.updateLoad({
      progress: 50,
      message:
        "Please stay on this screen and do not switch tabs! while your video is being processed.",
    });
    // write the end point to upload the video
    // upload the color frames with end point.
    try {
      media_tokens = await this.videoProcessingPipeline(title);
    } catch (error) {
      await this.handleError(`Video Processing Failed Please Try Again`, 3000);
      throw error;
    }

    this.editor.onWindowResize();

    this.editor.setColorMap();

    await this.editor.updateLoad({
      progress: 100,
      message: "Done Check Your Movies Tab On Profile.",
      label: "Success",
    });

    // this is so that its a check point just encase enqueue fails, if it does we can still restylize
    this.last_media_tokens = media_tokens;

    // Legacy studio:
    //await this.handleEnqueue(media_tokens, ipa_image_token ?? "");

    // NB(bt,2025-01-27): We're using a hack to set the first frame (in CharacterFrameButton)
    const firstFrameMediaToken = (window as any).firstFrameMediaToken;
    const videoMediaToken = media_tokens.color;

    console.log(`Enqueue Studio Gen2 Render; Video: ${videoMediaToken} Image: ${firstFrameMediaToken}`);

    await this.handleEnqueueStudioGen2(videoMediaToken, firstFrameMediaToken); 

    await this.EndLoadingState();
  }

  async handleCachedEnqueue() {
    const enqueue_studio_response = await this.videoAPI.EnqueueStudio({
      enqueueVideo: {
        disable_lcm: false,
        enable_lipsync: this.editor.generation_options.lipSync,
        input_file: this.last_media_tokens.color,
        negative_prompt: this.editor.negative_prompt,
        prompt: this.editor.positive_prompt,
        remove_watermark: false,
        style: this.editor.art_style.toString(),
        frame_skip: 2,
        travel_prompt: "",
        trim_end_millis: 7000,
        trim_start_millis: 0,
        use_cinematic: this.editor.generation_options.cinematic,
        use_face_detailer: this.editor.generation_options.faceDetail,
        use_strength: this.editor.generation_options.styleStrength,
        use_upscaler: this.editor.generation_options.upscale,
        uuid_idempotency_token: uuidv4(),
        global_ipa_media_token:
          usePageEnigmaStore.getState().globalIPAMediaToken ?? "",
        input_depth_file: "",
        input_normal_file: "",
        input_outline_file: "",
        creator_set_visibility: Visibility.Public,
      },
    });

    if (enqueue_studio_response.success) {
      console.log("Start Polling Active Jobs");
      startPollingActiveJobs();
      addToast(
        ToastTypes.SUCCESS,
        "Done Check Your Movies Tab On Profile.",
        3000,
      );
    } else {
      addToast(ToastTypes.ERROR, "Failed To Process Movie Try Again", 3000);
    }
  }

  async handleEnqueue(upload_tokens: MediaTokens, ipa_image_token: string) {
    const enqueue_studio_response = await this.videoAPI.EnqueueStudio({
      enqueueVideo: {
        disable_lcm: false,
        enable_lipsync: this.editor.generation_options.lipSync,
        input_file: upload_tokens.color,
        negative_prompt: this.editor.negative_prompt,
        prompt: this.editor.positive_prompt,
        remove_watermark: false,
        style: this.editor.art_style.toString(),
        frame_skip: 2,
        travel_prompt: "",
        trim_end_millis: 7000,
        trim_start_millis: 0,
        use_cinematic: this.editor.generation_options.cinematic,
        use_face_detailer: this.editor.generation_options.faceDetail,
        use_strength: this.editor.generation_options.styleStrength,
        use_upscaler: this.editor.generation_options.upscale,
        uuid_idempotency_token: uuidv4(),
        global_ipa_media_token: ipa_image_token,
        input_depth_file: "",
        input_normal_file: "",
        input_outline_file: "",
        creator_set_visibility: Visibility.Public,
      },
    });

    if (enqueue_studio_response.success) {
      startPollingActiveJobs();
    } else {
      await this.handleError("Failed To Process Movie Try Again", 3000);
      return;
    }

    this.handleSuccess("Done Check Your Movies Tab On Profile.", 3000);
  }

  async handleEnqueueStudioGen2(videoMediaToken: string, firstFrameImageToken: string) {
    const response = await this.studioGen2Api.EnqueueStudioGen2({
      enqueueVideo: {
        uuid_idempotency_token: uuidv4(),
        image_file: firstFrameImageToken,
        video_file: videoMediaToken,
        creator_set_visibility: Visibility.Public,
      },
    });

    if (response.success) {
      startPollingActiveJobs();
    } else {
      await this.handleError("Failed To Process Animation Try Again", 3000);
      return;
    }

    this.handleSuccess("Done Check Your Movies Tab On Profile.", 3000);
  }


  async handleSuccess(message: string, timeout: number) {
    addToast(ToastTypes.SUCCESS, message, timeout);
  }
  async handleError(message: string, timeout: number) {
    addToast(ToastTypes.ERROR, message, timeout);
    await this.EndLoadingState();
  }
  async EndLoadingState() {
    this.editor.generating_preview = false;
    this.editor.endLoading();
    this.editor.onWindowResize();
    this.editor.recorder = undefined;
    if (this.editor.rawRenderer) {
      this.editor.rawRenderer.setSize(
        this.editor.startRenderWidth,
        this.editor.startRenderHeight,
      );
    }

    this.editor.camViewCanvasMayReset();

    this.editor.rawRenderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.editor.canvasRenderCamReference || undefined,
      preserveDrawingBuffer: true,
    });
    this.editor._configurePostProcessingRaw();

    this.editor.activeScene.renderMode(false);

    this.editor.switchEdit();
  }
}
