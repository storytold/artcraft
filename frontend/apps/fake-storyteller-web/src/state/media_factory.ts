/**
 * Creating media files.
 *
 * Uploads and finished generations both come through here so that a generated
 * image and an uploaded one are indistinguishable to the rest of the server —
 * same bucket layout, same URL shape, same record fields.
 */

import {
  contentTypeForExtension,
  fixtureBytes,
  makeBucketPath,
  putObject,
  type FixtureName,
} from "./assets.ts";
import { nowIso } from "./clock.ts";
import type {
  MediaClass,
  MediaFileRecord,
  MediaType,
  OriginCategory,
  ProductCategory,
  ProjectType,
  Visibility,
} from "./entities.ts";
import { store } from "./store.ts";
import { makeToken, TOKEN_PREFIX } from "./tokens.ts";

export interface CreateMediaFileArgs {
  bytes: Buffer;
  mediaClass: MediaClass;
  mediaType: MediaType;
  /** Filename prefix inside the bucket, e.g. `image_`, matching the real layout. */
  bucketPrefix: string;
  extension: string;
  maybeCreatorUserToken: string | undefined;
  originCategory: OriginCategory;
  originProductCategory: ProductCategory;
  isUserUpload: boolean;
  maybeTitle?: string | undefined;
  maybeOriginalFilename?: string | undefined;
  maybePromptToken?: string | undefined;
  maybeBatchToken?: string | undefined;
  maybeProjectType?: ProjectType | undefined;
  maybeEngineCategory?: string | undefined;
  maybeAnimationType?: string | undefined;
  maybeDurationMillis?: number | undefined;
  maybeSceneSourceMediaFileToken?: string | undefined;
  maybeOriginModelType?: string | undefined;
  creatorSetVisibility?: Visibility | undefined;
  isIntermediateSystemFile?: boolean | undefined;
}

export function createMediaFile(args: CreateMediaFileArgs): MediaFileRecord {
  const token = makeToken(TOKEN_PREFIX.mediaFile);
  const hash = token.slice(TOKEN_PREFIX.mediaFile.length);
  const bucketPath = makeBucketPath(hash, args.bucketPrefix, args.extension);

  putObject(bucketPath, args.bytes, contentTypeForExtension(args.extension));
  writeVideoThumbnails(bucketPath, args.mediaClass, args.mediaType);

  const timestamp = nowIso();
  const record: MediaFileRecord = {
    token,
    mediaClass: args.mediaClass,
    mediaType: args.mediaType,
    bucketPath,
    maybeProjectType: args.maybeProjectType,
    maybeCreatorUserToken: args.maybeCreatorUserToken,
    maybeTitle: args.maybeTitle,
    maybeOriginalFilename: args.maybeOriginalFilename,
    maybePromptToken: args.maybePromptToken,
    maybeBatchToken: args.maybeBatchToken,
    maybeStyleName: undefined,
    maybeDurationMillis: args.maybeDurationMillis,
    maybeEngineCategory: args.maybeEngineCategory,
    maybeAnimationType: args.maybeAnimationType,
    maybeEngineExtension: undefined,
    maybeSceneSourceMediaFileToken: args.maybeSceneSourceMediaFileToken,
    maybeCoverImageMediaFileToken: undefined,
    maybeTextTranscript: undefined,
    creatorSetVisibility: args.creatorSetVisibility ?? "public",
    isUserUpload: args.isUserUpload,
    isIntermediateSystemFile: args.isIntermediateSystemFile ?? false,
    isFeatured: false,
    originCategory: args.originCategory,
    originProductCategory: args.originProductCategory,
    maybeOriginModelType: args.maybeOriginModelType,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.mediaFilesByToken.set(token, record);
  return record;
}

/** Media type and class inferred from an uploaded file's extension. */
export function classifyUpload(fileName: string): { mediaClass: MediaClass; mediaType: MediaType; bucketPrefix: string } {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  const table: Record<string, { mediaClass: MediaClass; mediaType: MediaType; bucketPrefix: string }> = {
    ".jpg": { mediaClass: "image", mediaType: "jpg", bucketPrefix: "image_" },
    ".jpeg": { mediaClass: "image", mediaType: "jpg", bucketPrefix: "image_" },
    ".png": { mediaClass: "image", mediaType: "png", bucketPrefix: "image_" },
    ".gif": { mediaClass: "image", mediaType: "gif", bucketPrefix: "image_" },
    ".webp": { mediaClass: "image", mediaType: "webp", bucketPrefix: "image_" },
    ".mp4": { mediaClass: "video", mediaType: "mp4", bucketPrefix: "video_" },
    ".webm": { mediaClass: "video", mediaType: "webm", bucketPrefix: "video_" },
    ".mov": { mediaClass: "video", mediaType: "mov", bucketPrefix: "video_" },
    ".mp3": { mediaClass: "audio", mediaType: "mp3", bucketPrefix: "audio_" },
    ".wav": { mediaClass: "audio", mediaType: "wav", bucketPrefix: "audio_" },
    ".glb": { mediaClass: "mesh", mediaType: "glb", bucketPrefix: "engine_" },
    ".gltf": { mediaClass: "mesh", mediaType: "gltf", bucketPrefix: "engine_" },
    ".fbx": { mediaClass: "dimensional", mediaType: "fbx", bucketPrefix: "engine_" },
    ".obj": { mediaClass: "dimensional", mediaType: "obj", bucketPrefix: "engine_" },
    ".ply": { mediaClass: "splat", mediaType: "ply", bucketPrefix: "engine_" },
    ".spz": { mediaClass: "splat", mediaType: "spz", bucketPrefix: "splat_" },
    ".pmx": { mediaClass: "dimensional", mediaType: "pmx", bucketPrefix: "engine_" },
    ".bvh": { mediaClass: "dimensional", mediaType: "bvh", bucketPrefix: "engine_" },
    ".json": { mediaClass: "project", mediaType: "json", bucketPrefix: "project_" },
  };

  return table[extension] ?? { mediaClass: "unknown", mediaType: "json", bucketPrefix: "file_" };
}

/** Create a media file whose visible content is one of the repo fixtures. */
export function createMediaFileFromFixture(
  fixture: FixtureName,
  args: Omit<CreateMediaFileArgs, "bytes">,
): MediaFileRecord {
  return createMediaFile({ ...args, bytes: fixtureBytes(fixture) });
}

/**
 * Videos are served with `-thumb.jpg` / `-thumb.gif` siblings, because
 * `media_links.maybe_video_previews` points at them. Both get image bytes so
 * the browser renders something.
 */
function writeVideoThumbnails(bucketPath: string, mediaClass: MediaClass, mediaType: MediaType): void {
  if (mediaClass !== "video" && mediaType !== "mp4") {
    return;
  }

  const still = fixtureBytes("image");
  putObject(`${bucketPath}-thumb.jpg`, still, "image/jpeg");
  putObject(`${bucketPath}-thumb.gif`, still, "image/gif");
}
