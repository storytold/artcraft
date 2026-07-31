/**
 * `/v1/folders` — library organisation.
 *
 * Folder membership is an ordered token list on the folder record, so bulk
 * add/move/remove can report the counts the UI displays.
 */

import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, notFound, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { nowIso } from "../state/clock.ts";
import type { FolderRecord } from "../state/entities.ts";
import { sortNewestFirst, store } from "../state/store.ts";
import { makeToken, TOKEN_PREFIX } from "../state/tokens.ts";
import { folderMediaFilePayload, folderThumbnailPayload } from "../wire/media.ts";
import { clampPageSize, decodeCursor, nextCursorOnly } from "../wire/pagination.ts";

/** Folder cards show up to this many recent thumbnails. */
const FOLDER_THUMBNAIL_COUNT = 4;

export function registerFolderRoutes(router: Router): void {
  router.post("/v1/folders/create", createFolder);
  router.get("/v1/folders/list_all", listAllFolders);
  router.get("/v1/folders/folder/:folderToken", getFolder);
  router.delete("/v1/folders/folder/:folderToken", deleteFolder);
  router.put("/v1/folders/folder/:folderToken/color_code", setColorCode);
  router.put("/v1/folders/folder/:folderToken/cover_image", setCoverImage);
  router.put("/v1/folders/folder/:folderToken/rename", renameFolder);
  router.put("/v1/folders/folder/:folderToken/star", starFolder);

  router.get("/v1/folders/subfolders/:folderToken", listSubfolders);
  router.post("/v1/folders/subfolders/:folderToken/bulk_add", bulkAddSubfolders);
  router.post("/v1/folders/subfolders/:folderToken/bulk_remove", bulkRemoveSubfolders);

  router.get("/v1/folders/media_files/:folderToken", listFolderMedia);
  router.get("/v1/folders/media_files_without_folder", listMediaWithoutFolder);
  router.post("/v1/folders/media_files/:folderToken/bulk_add", bulkAddMedia);
  router.post("/v1/folders/media_files/:folderToken/bulk_move", bulkMoveMedia);
  router.post("/v1/folders/media_files/:folderToken/bulk_remove", bulkRemoveMedia);
}

function createFolder(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{
    name: string;
    maybe_parent_folder_token: string | null;
    maybe_color_code: string | null;
  }>();

  const timestamp = nowIso();
  const folder: FolderRecord = {
    token: makeToken(TOKEN_PREFIX.folder),
    name: body.name ?? "Untitled folder",
    ownerUserToken: user.userToken,
    maybeParentFolderToken: body.maybe_parent_folder_token ?? undefined,
    maybeColorCode: body.maybe_color_code ?? undefined,
    maybeCustomCoverMediaFileToken: undefined,
    hasStar: false,
    mediaFileTokens: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.foldersByToken.set(folder.token, folder);
  return success({ folder: folderPayload(folder) });
}

function listAllFolders(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const owned = sortNewestFirst(
    [...store.foldersByToken.values()].filter((folder) => folder.ownerUserToken === user.userToken),
  );

  const { page, maybeCursor } = sliceWithCursor(owned, context);
  return success({ folders: page.map(folderPayload), maybe_cursor: maybeCursor });
}

function getFolder(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }
  return success({ folder: folderPayload(folder) });
}

function deleteFolder(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  store.foldersByToken.delete(folder.token);
  for (const other of store.foldersByToken.values()) {
    if (other.maybeParentFolderToken === folder.token) {
      other.maybeParentFolderToken = undefined;
    }
  }

  return success();
}

function setColorCode(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const body = context.json<{ maybe_color_code: string | null }>();
  folder.maybeColorCode = body.maybe_color_code ?? undefined;
  folder.updatedAt = nowIso();
  return success();
}

function setCoverImage(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const body = context.json<{ maybe_media_file_token: string | null }>();
  folder.maybeCustomCoverMediaFileToken = body.maybe_media_file_token ?? undefined;
  folder.updatedAt = nowIso();

  return success({ maybe_resolved_cover_media_file_token: folder.maybeCustomCoverMediaFileToken ?? null });
}

function renameFolder(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const body = context.json<{ new_name: string }>();
  if (body.new_name !== undefined) {
    folder.name = body.new_name;
    folder.updatedAt = nowIso();
  }

  return success();
}

function starFolder(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const body = context.json<{ has_star: boolean }>();
  folder.hasStar = body.has_star ?? false;
  folder.updatedAt = nowIso();
  return success();
}

function listSubfolders(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const children = sortNewestFirst(
    [...store.foldersByToken.values()].filter((child) => child.maybeParentFolderToken === folder.token),
  );

  const { page, maybeCursor } = sliceWithCursor(children, context);
  return success({ subfolders: page.map(folderPayload), maybe_cursor: maybeCursor });
}

function bulkAddSubfolders(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const body = context.json<{ subfolder_tokens: string[] }>();
  const accepted: string[] = [];

  for (const token of body.subfolder_tokens ?? []) {
    const child = store.foldersByToken.get(token);
    if (child === undefined || child.token === folder.token) {
      continue;
    }
    child.maybeParentFolderToken = folder.token;
    child.updatedAt = nowIso();
    accepted.push(token);
  }

  return success({ accepted_subfolder_tokens: accepted });
}

function bulkRemoveSubfolders(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const body = context.json<{ subfolder_tokens: string[] }>();
  let removed = 0;

  for (const token of body.subfolder_tokens ?? []) {
    const child = store.foldersByToken.get(token);
    if (child?.maybeParentFolderToken !== folder.token) {
      continue;
    }
    child.maybeParentFolderToken = undefined;
    child.updatedAt = nowIso();
    removed += 1;
  }

  return success({ removed_count: removed });
}

function listFolderMedia(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const records = folder.mediaFileTokens
    .map((token) => store.mediaFilesByToken.get(token))
    .filter((record) => record !== undefined);

  const { page, maybeCursor } = sliceWithCursor(records, context);
  return success({
    media_files: page.map((record) => folderMediaFilePayload(record, folder.updatedAt)),
    maybe_cursor: maybeCursor,
  });
}

function listMediaWithoutFolder(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const filed = new Set<string>();
  for (const folder of store.foldersByToken.values()) {
    for (const token of folder.mediaFileTokens) {
      filed.add(token);
    }
  }

  const filterMediaClass = context.queryValue("filter_media_class");
  const unfiled = sortNewestFirst(
    [...store.mediaFilesByToken.values()].filter(
      (record) =>
        record.maybeCreatorUserToken === user.userToken &&
        !filed.has(record.token) &&
        (filterMediaClass === undefined || record.mediaClass === filterMediaClass),
    ),
  );

  const { page, maybeCursor } = sliceWithCursor(unfiled, context);
  return success({
    media_files: page.map((record) => folderMediaFilePayload(record)),
    maybe_cursor: maybeCursor,
  });
}

function bulkAddMedia(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const body = context.json<{ media_file_tokens: string[] }>();
  const accepted = addMediaToFolder(folder, body.media_file_tokens ?? []);
  return success({ accepted_media_file_tokens: accepted });
}

function bulkMoveMedia(context: RequestContext): HttpResult {
  const destination = findFolder(context);
  if (destination === undefined) {
    return notFound();
  }

  const body = context.json<{ media_file_tokens: string[]; source_folder: string }>();
  const tokens = body.media_file_tokens ?? [];

  const accepted = addMediaToFolder(destination, tokens);

  let removedFromSource = 0;
  const source = store.foldersByToken.get(body.source_folder ?? "");
  if (source !== undefined) {
    const before = source.mediaFileTokens.length;
    source.mediaFileTokens = source.mediaFileTokens.filter((token) => !tokens.includes(token));
    removedFromSource = before - source.mediaFileTokens.length;
    source.updatedAt = nowIso();
  }

  return success({
    accepted_media_file_tokens: accepted,
    added_to_destination_count: accepted.length,
    removed_from_source_count: removedFromSource,
  });
}

function bulkRemoveMedia(context: RequestContext): HttpResult {
  const folder = findFolder(context);
  if (folder === undefined) {
    return notFound();
  }

  const body = context.json<{ media_file_tokens: string[] }>();
  const tokens = new Set(body.media_file_tokens ?? []);

  const before = folder.mediaFileTokens.length;
  folder.mediaFileTokens = folder.mediaFileTokens.filter((token) => !tokens.has(token));
  folder.updatedAt = nowIso();

  return success({ removed_count: before - folder.mediaFileTokens.length });
}

function addMediaToFolder(folder: FolderRecord, tokens: string[]): string[] {
  const accepted: string[] = [];

  for (const token of tokens) {
    if (!store.mediaFilesByToken.has(token) || folder.mediaFileTokens.includes(token)) {
      continue;
    }
    folder.mediaFileTokens.push(token);
    accepted.push(token);
  }

  folder.updatedAt = nowIso();
  return accepted;
}

function folderPayload(folder: FolderRecord): object {
  const thumbnails = folder.mediaFileTokens
    .slice(-FOLDER_THUMBNAIL_COUNT)
    .map((token) => store.mediaFilesByToken.get(token))
    .filter((record) => record !== undefined)
    .map(folderThumbnailPayload);

  const customCover = folder.maybeCustomCoverMediaFileToken === undefined
    ? undefined
    : store.mediaFilesByToken.get(folder.maybeCustomCoverMediaFileToken);

  return {
    token: folder.token,
    name: folder.name,
    owner_user_token: folder.ownerUserToken,
    maybe_parent_folder_token: folder.maybeParentFolderToken ?? null,
    last_media_thumbnails: thumbnails,
    maybe_custom_cover_thumbnail: customCover === undefined ? null : folderThumbnailPayload(customCover),
    maybe_color_code: folder.maybeColorCode ?? null,
    has_star: folder.hasStar,
    is_orphaned:
      folder.maybeParentFolderToken !== undefined && !store.foldersByToken.has(folder.maybeParentFolderToken),
    created_at: folder.createdAt,
    updated_at: folder.updatedAt,
  };
}

function findFolder(context: RequestContext): FolderRecord | undefined {
  return store.foldersByToken.get(context.params["folderToken"] ?? "");
}

/** Shared cursor slicing for the `maybe_cursor` style used across folders and tags. */
function sliceWithCursor<T>(records: T[], context: RequestContext): { page: T[]; maybeCursor: string | null } {
  const pageSize = clampPageSize(context.queryNumber("limit") ?? context.queryNumber("page_size"));
  const offset = decodeCursor(context.queryValue("cursor"));

  return {
    page: records.slice(offset, offset + pageSize),
    maybeCursor: nextCursorOnly(records, offset, pageSize),
  };
}
