/**
 * `/v1/media_files/upload/*` — multipart uploads.
 *
 * Uploaded bytes are kept in memory and served straight back from `/media`, so
 * an uploaded file is immediately visible in the library and loadable in the
 * viewer, exactly as it would be through the real bucket.
 *
 * These handlers use the upload-specific error envelope (`{"BadInput": "..."}`)
 * rather than the shared one, because that is what the frontend reads here.
 */

import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, success } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import type { MultipartForm } from "../http/multipart.ts";
import { contentTypeForExtension, extensionOf, putObject } from "../state/assets.ts";
import { nowIso } from "../state/clock.ts";
import type { MediaClass, MediaType, ProjectType, Visibility } from "../state/entities.ts";
import { classifyUpload, createMediaFile } from "../state/media_factory.ts";
import { store } from "../state/store.ts";
import { makeToken, TOKEN_PREFIX } from "../state/tokens.ts";
import { isValidIdempotencyToken } from "../generation/submit.ts";

/** Which media type each project path segment produces. */
const PROJECT_MEDIA_TYPES: Record<string, { mediaType: MediaType; extension: string }> = {
  scene_3d: { mediaType: "scene_json", extension: ".scn.json" },
  mood_board: { mediaType: "mood_json", extension: ".mood.json" },
  editor_2d: { mediaType: "editor_json", extension: ".editor.json" },
  video_timeline: { mediaType: "timeline_json", extension: ".timeline.json" },
};

export function registerMediaUploadRoutes(router: Router): void {
  router.post("/v1/media_files/upload/image", (context) =>
    upload(context, { mediaClass: "image", mediaType: "png", bucketPrefix: "image_", fallbackExtension: ".png" }),
  );
  router.post("/v1/media_files/upload/audio", (context) =>
    upload(context, { mediaClass: "audio", mediaType: "wav", bucketPrefix: "audio_", fallbackExtension: ".wav" }),
  );
  router.post("/v1/media_files/upload/new_video", (context) =>
    upload(context, { mediaClass: "video", mediaType: "mp4", bucketPrefix: "video_", fallbackExtension: ".mp4" }),
  );
  router.post("/v1/media_files/upload/spz", (context) =>
    upload(context, { mediaClass: "splat", mediaType: "spz", bucketPrefix: "splat_", fallbackExtension: ".spz" }),
  );
  router.post("/v1/media_files/upload/new_engine_asset", (context) => upload(context, { inferFromFilename: true }));
  router.post("/v1/media_files/upload/pmx", (context) =>
    upload(context, { mediaClass: "dimensional", mediaType: "pmx", bucketPrefix: "engine_", fallbackExtension: ".pmx" }),
  );
  router.post("/v1/media_files/upload", (context) => upload(context, { inferFromFilename: true, useShortFieldNames: true }));

  router.post("/v1/media_files/upload/new_scene", (context) =>
    upload(context, { mediaClass: "project", mediaType: "scene_json", bucketPrefix: "project_", fallbackExtension: ".scn.json", projectType: "scene_3d" }),
  );
  router.post("/v1/media_files/upload/saved_scene/:token", updateSavedScene);
  router.post("/v1/media_files/upload/studio_shot", (context) =>
    upload(context, { mediaClass: "image", mediaType: "png", bucketPrefix: "image_", fallbackExtension: ".png" }),
  );

  router.post("/v1/media_files/upload/scene_snapshot", uploadSceneSnapshot);
  router.post("/v1/image_studio/scene_snapshot", uploadSceneSnapshot);

  router.post("/v1/media_files/upload/project/:projectType/new", createProject);
  router.post("/v1/media_files/upload/project/:projectType/update/:token", updateProject);

  router.post("/v1/conversion/enqueue_fbx_to_gltf", enqueueFbxToGltf);
}

interface UploadOptions {
  mediaClass?: MediaClass;
  mediaType?: MediaType;
  bucketPrefix?: string;
  fallbackExtension?: string;
  projectType?: ProjectType;
  /** Derive class and type from the uploaded filename instead of fixed values. */
  inferFromFilename?: boolean;
  /** The generic `/upload` endpoint uses `title`/`visibility` rather than `maybe_*`. */
  useShortFieldNames?: boolean;
}

function upload(context: RequestContext, options: UploadOptions): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return uploadError("NotAuthorized");
  }

  const form = context.form();

  const idempotencyError = checkIdempotency(form);
  if (idempotencyError !== undefined) {
    return idempotencyError;
  }

  const file = form.file("file") ?? form.anyFile();
  if (file === undefined) {
    return uploadError("BadInput", "no file part in the multipart body");
  }

  const inferred = classifyUpload(file.fileName);
  const mediaClass = options.inferFromFilename ? inferred.mediaClass : options.mediaClass ?? inferred.mediaClass;
  const mediaType = options.inferFromFilename ? inferred.mediaType : options.mediaType ?? inferred.mediaType;
  const bucketPrefix = options.inferFromFilename ? inferred.bucketPrefix : options.bucketPrefix ?? inferred.bucketPrefix;
  const extension = extensionOf(file.fileName) || options.fallbackExtension || "";

  const titleField = options.useShortFieldNames ? "title" : "maybe_title";
  const visibilityField = options.useShortFieldNames ? "visibility" : "maybe_visibility";

  const record = createMediaFile({
    bytes: file.bytes,
    mediaClass,
    mediaType,
    bucketPrefix,
    extension,
    maybeCreatorUserToken: user.userToken,
    maybeTitle: form.field(titleField),
    maybeOriginalFilename: file.fileName,
    maybePromptToken: form.field("maybe_prompt_token"),
    maybeBatchToken: form.field("maybe_batch_token"),
    maybeProjectType: options.projectType,
    maybeEngineCategory: form.field("engine_category"),
    maybeAnimationType: form.field("maybe_animation_type"),
    maybeDurationMillis: numberField(form, "maybe_duration_millis"),
    maybeSceneSourceMediaFileToken: form.field("maybe_scene_source_media_file_token"),
    originCategory: "upload",
    originProductCategory: "unknown",
    isUserUpload: true,
    isIntermediateSystemFile: form.field("is_intermediate_system_file") === "true",
    creatorSetVisibility: visibilityOf(form.field(visibilityField)),
  });

  return success({ media_file_token: record.token });
}

function uploadSceneSnapshot(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return uploadError("NotAuthorized");
  }

  const form = context.form();
  const file = form.file("snapshot") ?? form.file("file") ?? form.anyFile();
  if (file === undefined) {
    return uploadError("BadInput", "no snapshot part in the multipart body");
  }

  const record = createMediaFile({
    bytes: file.bytes,
    mediaClass: "image",
    mediaType: "png",
    bucketPrefix: "image_",
    extension: extensionOf(file.fileName) || ".png",
    maybeCreatorUserToken: user.userToken,
    maybeTitle: form.field("maybe_title"),
    maybeOriginalFilename: file.fileName,
    maybeSceneSourceMediaFileToken: form.field("scene_media_token") ?? form.field("maybe_scene_source_media_file_token"),
    originCategory: "studio",
    originProductCategory: "image_studio",
    isUserUpload: false,
    isIntermediateSystemFile: true,
  });

  return success({ snapshot_media_token: record.token, media_file_token: record.token });
}

function createProject(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return uploadError("NotAuthorized");
  }

  const projectType = context.params["projectType"] ?? "";
  const shape = PROJECT_MEDIA_TYPES[projectType];
  if (shape === undefined) {
    return uploadError("BadInput", `unknown project type: ${projectType}`);
  }

  const form = context.form();

  const idempotencyError = checkIdempotency(form);
  if (idempotencyError !== undefined) {
    return idempotencyError;
  }

  const file = form.file("file") ?? form.anyFile();
  if (file === undefined) {
    return uploadError("BadInput", "no file part in the multipart body");
  }

  const record = createMediaFile({
    bytes: file.bytes,
    mediaClass: "project",
    mediaType: shape.mediaType,
    bucketPrefix: "project_",
    extension: shape.extension,
    maybeCreatorUserToken: user.userToken,
    maybeTitle: form.field("maybe_title"),
    maybeProjectType: projectType as ProjectType,
    originCategory: "studio",
    originProductCategory: "studio",
    isUserUpload: false,
    creatorSetVisibility: visibilityOf(form.field("maybe_visibility")),
  });

  return success({ media_file_token: record.token });
}

function updateProject(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return uploadError("NotAuthorized");
  }

  const token = context.params["token"] ?? "";
  const record = store.mediaFilesByToken.get(token);
  if (record === undefined) {
    return uploadError("BadInput", `unknown media file: ${token}`);
  }

  const projectType = context.params["projectType"] ?? "";
  if (record.maybeProjectType !== undefined && record.maybeProjectType !== projectType) {
    return uploadError("BadInput", `media file is not a ${projectType} project`);
  }

  return replaceBytes(context, token);
}

function updateSavedScene(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return uploadError("NotAuthorized");
  }
  return replaceBytes(context, context.params["token"] ?? "");
}

/** Overwrite an existing media file's bytes in place, keeping its token and URL. */
function replaceBytes(context: RequestContext, token: string): HttpResult {
  const record = store.mediaFilesByToken.get(token);
  if (record === undefined) {
    return uploadError("BadInput", `unknown media file: ${token}`);
  }

  const file = context.form().file("file") ?? context.form().anyFile();
  if (file === undefined) {
    return uploadError("BadInput", "no file part in the multipart body");
  }

  // Re-storing under the same bucket path keeps every already-issued URL valid.
  putObject(record.bucketPath, file.bytes, contentTypeForExtension(extensionOf(record.bucketPath)));
  record.updatedAt = nowIso();

  return success({ media_file_token: record.token });
}

function enqueueFbxToGltf(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return uploadError("NotAuthorized");
  }

  const body = context.json<{ media_file_token: string; uuid_idempotency_token: string }>();
  if (body.media_file_token === undefined) {
    return uploadError("BadInput", "media_file_token is required");
  }

  const jobToken = makeToken(TOKEN_PREFIX.inferenceJob);
  const timestamp = nowIso();

  store.jobsByToken.set(jobToken, {
    jobToken,
    inferenceCategory: "format_conversion",
    status: "pending",
    progressPercentage: 0,
    maybePromptToken: undefined,
    maybeModelType: undefined,
    maybeModelTitle: undefined,
    maybeRawInferenceText: undefined,
    maybeCreatorUserToken: user.userToken,
    maybeBatchToken: undefined,
    maybeResultMediaFileToken: undefined,
    maybeFailureCategory: undefined,
    maybeFailureMessage: undefined,
    maybeSuccessfullyCompletedAt: undefined,
    resolveAtMillis: Date.now() + 2_000,
    isDismissed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return success({ inference_job_token: jobToken });
}

function checkIdempotency(form: MultipartForm): HttpResult | undefined {
  const token = form.field("uuid_idempotency_token");
  if (!isValidIdempotencyToken(token)) {
    return uploadError("BadInput", "invalid idempotency token");
  }
  if (store.usedIdempotencyTokens.has(token!)) {
    return uploadError("BadInput", "repeated idempotency token");
  }
  store.usedIdempotencyTokens.add(token!);
  return undefined;
}

/** The upload endpoints' own error envelope, which the frontend reads as `response.BadInput`. */
function uploadError(kind: "BadInput" | "NotAuthorized" | "ServerError" | "RateLimited", detail?: string): HttpResult {
  const status = kind === "NotAuthorized" ? 401 : kind === "RateLimited" ? 429 : kind === "ServerError" ? 500 : 400;
  const body = detail === undefined ? kind : { [kind]: detail };
  return new HttpResult(status, body);
}

function visibilityOf(value: string | undefined): Visibility {
  return value === "hidden" || value === "private" ? value : "public";
}

function numberField(form: MultipartForm, name: string): number | undefined {
  const raw = form.field(name);
  if (raw === undefined) {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
