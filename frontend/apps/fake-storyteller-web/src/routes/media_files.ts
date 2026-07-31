/**
 * `/v1/media_files` — reading and editing the library.
 *
 * Each listing endpoint has its own response shape in the real backend (see
 * `src/wire/media.ts`), so the handlers here mostly filter and paginate, then
 * hand off to the matching builder.
 */

import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, failure, notFound, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { nowIso } from "../state/clock.ts";
import type { MediaFileRecord, Visibility } from "../state/entities.ts";
import { mediaFilesForUser, sortNewestFirst, store } from "../state/store.ts";
import {
  batchListMediaFilePayload,
  batchMediaFilePayload,
  getMediaFilePayload,
  mediaFileListItemPayload,
  projectMediaFilePayload,
  searchMediaFilePayload,
  sessionMediaFilePayload,
  userMediaFileListItemPayload,
} from "../wire/media.ts";
import { paginateByCursor, paginateByIndex } from "../wire/pagination.ts";

const VALID_VISIBILITIES = new Set<Visibility>(["public", "hidden", "private"]);

export function registerMediaFileRoutes(router: Router): void {
  router.get("/v1/media_files/file/:token", getMediaFile);
  router.delete("/v1/media_files/file/:token", deleteMediaFile);
  router.get("/v1/media_files/batch", batchGetMediaFiles);
  router.get("/v1/media_files/batch/:batchToken", listByBatchToken);
  router.get("/v1/media_files/list", listMediaFiles);
  router.get("/v1/media_files/list_featured", listFeatured);
  router.get("/v1/media_files/list/user/:username", listUserMediaFiles);
  router.get("/v1/media_files/mesh/list", (context) => listSessionByClass(context, "mesh"));
  router.get("/v1/media_files/splat/list", (context) => listSessionByClass(context, "splat"));
  router.get("/v1/media_files/project/list", listProjects);
  router.get("/v1/media_files/search_featured", (context) => search(context, false));
  router.get("/v1/media_files/search_session", (context) => search(context, true));
  router.post("/v1/media_files/rename/:token", renameMediaFile);
  router.post("/v1/media_files/cover_image/:token", setCoverImage);
  router.post("/v1/media_files/visibility/:token", setVisibility);
}

function getMediaFile(context: RequestContext): HttpResult {
  const record = store.mediaFilesByToken.get(context.params["token"] ?? "");
  if (record === undefined) {
    return notFound();
  }
  return success({ media_file: getMediaFilePayload(record) });
}

function deleteMediaFile(context: RequestContext): HttpResult {
  const token = context.params["token"] ?? "";
  if (!store.mediaFilesByToken.has(token)) {
    return notFound();
  }

  store.mediaFilesByToken.delete(token);
  detachFromFoldersAndTags(token);
  return success();
}

function batchGetMediaFiles(context: RequestContext): HttpResult {
  const requested = context.query.getAll("tokens").flatMap((value) => value.split(","));
  const wanted = new Set(requested.filter((token) => token.length > 0));

  const media = [...wanted]
    .map((token) => store.mediaFilesByToken.get(token))
    .filter((record) => record !== undefined)
    .map((record) => batchMediaFilePayload(record));

  return success({ media_files: media });
}

function listByBatchToken(context: RequestContext): HttpResult {
  const batchToken = context.params["batchToken"] ?? "";
  const records = sortNewestFirst(
    [...store.mediaFilesByToken.values()].filter((record) => record.maybeBatchToken === batchToken),
  );

  const page = paginateByIndex(records, {
    pageIndex: context.queryNumber("page_index"),
    pageSize: context.queryNumber("page_size"),
  });

  return success({
    results: page.results.map(batchListMediaFilePayload),
    pagination: page.pagination,
  });
}

function listMediaFiles(context: RequestContext): HttpResult {
  const visible = applyFilters(
    context,
    [...store.mediaFilesByToken.values()].filter((record) => record.creatorSetVisibility === "public"),
  );

  const page = paginateByCursor(sortNewestFirst(visible), {
    cursor: context.queryValue("cursor"),
    pageSize: context.queryNumber("page_size"),
    cursorIsReversed: context.queryValue("cursor_is_reversed") === "true",
  });

  return success({
    results: page.results.map(mediaFileListItemPayload),
    pagination: page.pagination,
  });
}

function listFeatured(context: RequestContext): HttpResult {
  const visible = applyFilters(
    context,
    [...store.mediaFilesByToken.values()].filter((record) => record.creatorSetVisibility === "public"),
  );

  const page = paginateByCursor(sortNewestFirst(visible), {
    cursor: context.queryValue("cursor"),
    pageSize: context.queryNumber("page_size"),
    cursorIsReversed: context.queryValue("cursor_is_reversed") === "true",
  });

  return success({
    results: page.results.map(mediaFileListItemPayload),
    pagination: page.pagination,
  });
}

function listUserMediaFiles(context: RequestContext): HttpResult {
  const user = store.usersByUsername.get((context.params["username"] ?? "").toLowerCase());
  if (user === undefined) {
    return notFound();
  }

  const owned = applyFilters(context, mediaFilesForUser(user.userToken));
  const page = paginateByIndex(owned, {
    pageIndex: context.queryNumber("page_index"),
    pageSize: context.queryNumber("page_size"),
  });

  return success({
    results: page.results.map(userMediaFileListItemPayload),
    pagination: page.pagination,
  });
}

function listSessionByClass(context: RequestContext, mediaClass: "mesh" | "splat"): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const owned = mediaFilesForUser(user.userToken).filter((record) => record.mediaClass === mediaClass);
  const page = paginateByCursor(owned, {
    cursor: context.queryValue("cursor"),
    pageSize: context.queryNumber("page_size") ?? 100,
    cursorIsReversed: context.queryValue("cursor_is_reversed") === "true",
  });

  return success({
    results: page.results.map(sessionMediaFilePayload),
    pagination: page.pagination,
  });
}

function listProjects(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const filterProjectType = context.queryValue("filter_project_type");
  const owned = mediaFilesForUser(user.userToken).filter(
    (record) =>
      record.mediaClass === "project" &&
      (filterProjectType === undefined || record.maybeProjectType === filterProjectType),
  );

  const page = paginateByCursor(owned, {
    cursor: context.queryValue("cursor"),
    pageSize: context.queryNumber("page_size") ?? 100,
    cursorIsReversed: context.queryValue("cursor_is_reversed") === "true",
  });

  return success({
    results: page.results.map(projectMediaFilePayload),
    pagination: page.pagination,
  });
}

function search(context: RequestContext, sessionOnly: boolean): HttpResult {
  const searchTerm = context.queryValue("search_term");
  if (searchTerm === undefined) {
    return failure(400, "BadInput", "search_term is required");
  }

  let candidates = [...store.mediaFilesByToken.values()];
  if (sessionOnly) {
    const user = currentUser(context);
    if (user === undefined) {
      return unauthorized();
    }
    candidates = mediaFilesForUser(user.userToken);
  }

  const needle = searchTerm.toLowerCase();
  const matched = applyFilters(context, candidates).filter((record) =>
    `${record.maybeTitle ?? ""} ${record.maybeOriginalFilename ?? ""}`.toLowerCase().includes(needle),
  );

  return success({ results: sortNewestFirst(matched).map(searchMediaFilePayload) });
}

function renameMediaFile(context: RequestContext): HttpResult {
  const record = store.mediaFilesByToken.get(context.params["token"] ?? "");
  if (record === undefined) {
    return notFound();
  }

  const body = context.json<{ name: string | null }>();
  const name = body.name ?? undefined;
  record.maybeTitle = name === undefined || name.length === 0 ? undefined : name;
  record.updatedAt = nowIso();
  return success();
}

function setCoverImage(context: RequestContext): HttpResult {
  const record = store.mediaFilesByToken.get(context.params["token"] ?? "");
  if (record === undefined) {
    return notFound();
  }

  const body = context.json<{ cover_image_media_file_token: string | null }>();
  record.maybeCoverImageMediaFileToken = body.cover_image_media_file_token ?? undefined;
  record.updatedAt = nowIso();
  return success();
}

function setVisibility(context: RequestContext): HttpResult {
  const record = store.mediaFilesByToken.get(context.params["token"] ?? "");
  if (record === undefined) {
    return notFound();
  }

  const body = context.json<{ creator_set_visibility: Visibility | null }>();
  const visibility = body.creator_set_visibility ?? undefined;
  if (visibility !== undefined && !VALID_VISIBILITIES.has(visibility)) {
    return failure(400, "BadInput", `unknown visibility: ${visibility}`);
  }

  record.creatorSetVisibility = visibility ?? "public";
  record.updatedAt = nowIso();
  return success();
}

/** Apply the `filter_media_classes` / `filter_media_type` query filters shared by the list endpoints. */
function applyFilters(context: RequestContext, records: MediaFileRecord[]): MediaFileRecord[] {
  const classes = commaSeparated(context.queryValue("filter_media_classes"));
  const types = commaSeparated(context.queryValue("filter_media_type"));

  return records.filter((record) => {
    if (classes !== undefined && !classes.has(record.mediaClass)) {
      return false;
    }
    if (types !== undefined && !types.has(record.mediaType)) {
      return false;
    }
    return true;
  });
}

function commaSeparated(value: string | undefined): Set<string> | undefined {
  if (value === undefined) {
    return undefined;
  }
  const entries = value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  return entries.length === 0 ? undefined : new Set(entries);
}

function detachFromFoldersAndTags(mediaFileToken: string): void {
  for (const folder of store.foldersByToken.values()) {
    folder.mediaFileTokens = folder.mediaFileTokens.filter((token) => token !== mediaFileToken);
  }
  for (const tag of store.tagsByToken.values()) {
    tag.mediaFileTokens.delete(mediaFileToken);
  }
}
