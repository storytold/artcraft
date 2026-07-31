/**
 * The in-memory record types.
 *
 * These are storage records, not wire types — each one feeds several different
 * response shapes, because the real backend emits a different subset of media
 * file fields on almost every endpoint. Response construction lives in
 * `src/wire/`.
 */

export type MediaClass = "unknown" | "audio" | "image" | "video" | "dimensional" | "mesh" | "splat" | "project";

export type MediaType =
  | "audio" | "image" | "video"
  | "bvh" | "fbx" | "obj" | "ply" | "glb" | "gltf" | "spz"
  | "scene_ron" | "scene_json" | "mood_json" | "timeline_json" | "editor_json"
  | "pmd" | "vmd" | "pmx" | "csv"
  | "jpg" | "png" | "gif" | "mp4" | "wav" | "mp3" | "webp" | "webm" | "mov"
  | "opus" | "ogg" | "aac" | "m4a" | "flac" | "json";

export type ProjectType = "scene_3d" | "mood_board" | "workflow" | "video_timeline" | "editor_2d";

export type Visibility = "public" | "hidden" | "private";

export type OriginCategory =
  | "inference" | "inference3rd" | "processed" | "upload" | "device_api" | "studio" | "story_engine";

export type ProductCategory =
  | "unknown" | "face_animator" | "face_fusion" | "face_mirror" | "vst" | "image_studio"
  | "studio" | "tts" | "voice_conversion" | "zs_voice" | "mocap" | "image_gen" | "video_gen"
  | "video_edit" | "world_gen" | "video_filter" | "workflow";

export type JobStatus =
  | "pending" | "started" | "complete_success" | "complete_failure"
  | "attempt_failed" | "dead" | "cancelled_by_user" | "cancelled_by_system";

export type InferenceCategory =
  | "image_generation" | "video_generation" | "audio_generation" | "object_generation"
  | "splat_generation" | "character_generation" | "text_to_speech" | "voice_conversion"
  | "lipsync_animation" | "format_conversion" | "workflow";

export interface UserRecord {
  userToken: string;
  username: string;
  displayName: string;
  emailAddress: string;
  password: string;
  gravatarHash: string;
  featureFlags: string[];
  defaultAvatar: { image_index: number; color_index: number };
  bankedCredits: number;
  monthlyCredits: number;
  subscriptionSlug: string | undefined;
  createdAt: string;
}

export interface SessionRecord {
  signedSession: string;
  userToken: string;
  createdAt: string;
}

export interface MediaFileRecord {
  token: string;
  mediaClass: MediaClass;
  mediaType: MediaType;
  /** Path within the object store, also the URL path under `/media/`. */
  bucketPath: string;
  maybeProjectType: ProjectType | undefined;
  maybeCreatorUserToken: string | undefined;
  maybeTitle: string | undefined;
  maybeOriginalFilename: string | undefined;
  maybePromptToken: string | undefined;
  maybeBatchToken: string | undefined;
  maybeStyleName: string | undefined;
  maybeDurationMillis: number | undefined;
  maybeEngineCategory: string | undefined;
  maybeAnimationType: string | undefined;
  maybeEngineExtension: string | undefined;
  maybeSceneSourceMediaFileToken: string | undefined;
  maybeCoverImageMediaFileToken: string | undefined;
  maybeTextTranscript: string | undefined;
  creatorSetVisibility: Visibility;
  isUserUpload: boolean;
  isIntermediateSystemFile: boolean;
  isFeatured: boolean;
  originCategory: OriginCategory;
  originProductCategory: ProductCategory;
  maybeOriginModelType: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface JobRecord {
  jobToken: string;
  inferenceCategory: InferenceCategory;
  status: JobStatus;
  progressPercentage: number;
  maybePromptToken: string | undefined;
  maybeModelType: string | undefined;
  maybeModelTitle: string | undefined;
  maybeRawInferenceText: string | undefined;
  maybeCreatorUserToken: string | undefined;
  maybeBatchToken: string | undefined;
  maybeResultMediaFileToken: string | undefined;
  maybeFailureCategory: string | undefined;
  maybeFailureMessage: string | undefined;
  maybeSuccessfullyCompletedAt: string | undefined;
  /** Epoch millis at which the resolver should finish this job. */
  resolveAtMillis: number;
  isDismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptRecord {
  token: string;
  promptType: string;
  maybePositivePrompt: string | undefined;
  maybeNegativePrompt: string | undefined;
  maybeModelType: string | undefined;
  maybeModelClass: string | undefined;
  maybeGenerationProvider: string | undefined;
  maybeAspectRatio: string | undefined;
  maybeResolution: string | undefined;
  maybeBatchCount: number | undefined;
  maybeDurationSeconds: number | undefined;
  maybeStyleName: string | undefined;
  maybeGenerateAudio: boolean | undefined;
  contextImageMediaTokens: string[];
  createdAt: string;
}

export interface FolderRecord {
  token: string;
  name: string;
  ownerUserToken: string;
  maybeParentFolderToken: string | undefined;
  maybeColorCode: string | undefined;
  maybeCustomCoverMediaFileToken: string | undefined;
  hasStar: boolean;
  mediaFileTokens: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TagRecord {
  tagToken: string;
  tagValue: string;
  ownerUserToken: string;
  mediaFileTokens: Set<string>;
  createdAt: string;
}

export interface CharacterRecord {
  token: string;
  name: string;
  maybeDescription: string | undefined;
  maybeAvatarMediaFileToken: string | undefined;
  maybeFullImageMediaFileToken: string | undefined;
  models: string[];
  ownerUserToken: string;
  isUserCreated: boolean;
  createdAt: string;
}

export interface ApiKeyRecord {
  token: string;
  apiKey: string;
  name: string;
  maybeDescription: string | undefined;
  ownerUserToken: string;
  maybeDeletedAt: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralCodeRecord {
  token: string;
  code: string;
  ownerUserToken: string;
  createdAt: string;
  updatedAt: string;
}
