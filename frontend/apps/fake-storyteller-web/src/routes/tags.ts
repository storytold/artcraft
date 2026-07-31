/**
 * `/v1/tags` — free-text tagging of media files.
 *
 * Tags are stored per owner and deduplicated by lowercased value, so adding an
 * existing tag reuses its token and bumps `use_count` rather than creating a
 * duplicate — the behaviour the library UI assumes.
 */

import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, notFound, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { nowIso } from "../state/clock.ts";
import type { TagRecord, UserRecord } from "../state/entities.ts";
import { sortNewestFirst, store } from "../state/store.ts";
import { makeToken, TOKEN_PREFIX } from "../state/tokens.ts";
import { folderMediaFilePayload } from "../wire/media.ts";
import { clampPageSize, decodeCursor, nextCursorOnly } from "../wire/pagination.ts";

export function registerTagRoutes(router: Router): void {
  router.get("/v1/tags/list", listTags);
  router.put("/v1/tags/rename/:tagToken", renameTag);
  router.delete("/v1/tags/:tagToken", deleteTag);
  router.post("/v1/tags/bulk_add", bulkAddTags);
  router.post("/v1/tags/bulk_set", bulkSetTags);

  router.get("/v1/tags/media_file/list/:mediaFileToken", listTagsForMediaFile);
  router.post("/v1/tags/media_file/add/:mediaFileToken", addTagsToMediaFile);
  router.post("/v1/tags/media_file/set/:mediaFileToken", setTagsOnMediaFile);
  router.post("/v1/tags/media_file/clear/:mediaFileToken", clearTagsOnMediaFile);

  router.get("/v1/tags/media_files/list_tagged", (context) => listByTagged(context, true));
  router.get("/v1/tags/media_files/list_untagged", (context) => listByTagged(context, false));
  router.get("/v1/tags/media_files/with_tag/:tagToken", listMediaWithTag);
  router.post("/v1/tags/media_files/bulk_list_tags", bulkListTags);
}

function listTags(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const owned = sortNewestFirst(tagsOwnedBy(user));
  const pageSize = clampPageSize(context.queryNumber("limit"));
  const offset = decodeCursor(context.queryValue("cursor"));

  return success({
    tags: owned.slice(offset, offset + pageSize).map(tagPayload),
    maybe_cursor: nextCursorOnly(owned, offset, pageSize),
  });
}

function renameTag(context: RequestContext): HttpResult {
  const tag = store.tagsByToken.get(context.params["tagToken"] ?? "");
  if (tag === undefined) {
    return notFound();
  }

  const body = context.json<{ new_tag_value: string }>();
  if (body.new_tag_value !== undefined) {
    tag.tagValue = body.new_tag_value;
  }

  return success({ tag: tagPayload(tag) });
}

function deleteTag(context: RequestContext): HttpResult {
  const tag = store.tagsByToken.get(context.params["tagToken"] ?? "");
  if (tag === undefined) {
    return notFound();
  }

  const removedLinkCount = tag.mediaFileTokens.size;
  store.tagsByToken.delete(tag.tagToken);
  return success({ removed_link_count: removedLinkCount });
}

function bulkAddTags(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{ media_file_tokens: string[]; maybe_tags_list: string[] }>();
  const accepted = knownMediaTokens(body.media_file_tokens ?? []);
  const tags = (body.maybe_tags_list ?? []).map((value) => findOrCreateTag(user, value));

  for (const tag of tags) {
    for (const token of accepted) {
      tag.mediaFileTokens.add(token);
    }
  }

  return success({ accepted_media_file_tokens: accepted, tags: tags.map(tagPayload) });
}

function bulkSetTags(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{ media_file_tokens: string[]; maybe_tags_list: string[] }>();
  const accepted = knownMediaTokens(body.media_file_tokens ?? []);

  const removedCount = detachTags(user, accepted);
  const tags = (body.maybe_tags_list ?? []).map((value) => findOrCreateTag(user, value));

  for (const tag of tags) {
    for (const token of accepted) {
      tag.mediaFileTokens.add(token);
    }
  }

  return success({
    accepted_media_file_tokens: accepted,
    tags: tags.map(tagPayload),
    removed_count: removedCount,
  });
}

function listTagsForMediaFile(context: RequestContext): HttpResult {
  const mediaFileToken = context.params["mediaFileToken"] ?? "";
  const tags = [...store.tagsByToken.values()].filter((tag) => tag.mediaFileTokens.has(mediaFileToken));
  return success({ tags: tags.map(tagPayload) });
}

function addTagsToMediaFile(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const mediaFileToken = context.params["mediaFileToken"] ?? "";
  const body = context.json<{ maybe_tags_list: string[] }>();

  for (const value of body.maybe_tags_list ?? []) {
    findOrCreateTag(user, value).mediaFileTokens.add(mediaFileToken);
  }

  return listTagsForMediaFile(context);
}

function setTagsOnMediaFile(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const mediaFileToken = context.params["mediaFileToken"] ?? "";
  const removedCount = detachTags(user, [mediaFileToken]);

  const body = context.json<{ maybe_tags_list: string[] }>();
  const tags = (body.maybe_tags_list ?? []).map((value) => findOrCreateTag(user, value));
  for (const tag of tags) {
    tag.mediaFileTokens.add(mediaFileToken);
  }

  return success({ tags: tags.map(tagPayload), removed_count: removedCount });
}

function clearTagsOnMediaFile(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const removedCount = detachTags(user, [context.params["mediaFileToken"] ?? ""]);
  return success({ removed_count: removedCount });
}

function listByTagged(context: RequestContext, tagged: boolean): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const taggedTokens = new Set<string>();
  for (const tag of tagsOwnedBy(user)) {
    for (const token of tag.mediaFileTokens) {
      taggedTokens.add(token);
    }
  }

  const records = sortNewestFirst(
    [...store.mediaFilesByToken.values()].filter(
      (record) => record.maybeCreatorUserToken === user.userToken && taggedTokens.has(record.token) === tagged,
    ),
  );

  const pageSize = clampPageSize(context.queryNumber("limit"));
  const offset = decodeCursor(context.queryValue("cursor"));

  return success({
    media_files: records.slice(offset, offset + pageSize).map((record) => folderMediaFilePayload(record)),
    maybe_cursor: nextCursorOnly(records, offset, pageSize),
  });
}

function listMediaWithTag(context: RequestContext): HttpResult {
  const tag = store.tagsByToken.get(context.params["tagToken"] ?? "");
  if (tag === undefined) {
    return notFound();
  }

  const records = sortNewestFirst(
    [...tag.mediaFileTokens]
      .map((token) => store.mediaFilesByToken.get(token))
      .filter((record) => record !== undefined),
  );

  const pageSize = clampPageSize(context.queryNumber("limit"));
  const offset = decodeCursor(context.queryValue("cursor"));

  return success({
    media_files: records.slice(offset, offset + pageSize).map((record) => folderMediaFilePayload(record)),
    maybe_cursor: nextCursorOnly(records, offset, pageSize),
  });
}

function bulkListTags(context: RequestContext): HttpResult {
  const body = context.json<{ media_file_tokens: string[] }>();

  const entries = (body.media_file_tokens ?? []).map((mediaFileToken) => ({
    media_file_token: mediaFileToken,
    tags: [...store.tagsByToken.values()]
      .filter((tag) => tag.mediaFileTokens.has(mediaFileToken))
      .map(tagPayload),
  }));

  return success({ media_files: entries });
}

function findOrCreateTag(user: UserRecord, value: string): TagRecord {
  const normalized = value.trim().toLowerCase();

  for (const tag of tagsOwnedBy(user)) {
    if (tag.tagValue.toLowerCase() === normalized) {
      return tag;
    }
  }

  const tag: TagRecord = {
    tagToken: makeToken(TOKEN_PREFIX.tag),
    tagValue: value.trim(),
    ownerUserToken: user.userToken,
    mediaFileTokens: new Set(),
    createdAt: nowIso(),
  };

  store.tagsByToken.set(tag.tagToken, tag);
  return tag;
}

/** Remove these media files from every tag the user owns; returns how many links went away. */
function detachTags(user: UserRecord, mediaFileTokens: string[]): number {
  let removed = 0;

  for (const tag of tagsOwnedBy(user)) {
    for (const token of mediaFileTokens) {
      if (tag.mediaFileTokens.delete(token)) {
        removed += 1;
      }
    }
  }

  return removed;
}

function tagsOwnedBy(user: UserRecord): TagRecord[] {
  return [...store.tagsByToken.values()].filter((tag) => tag.ownerUserToken === user.userToken);
}

function knownMediaTokens(tokens: string[]): string[] {
  return tokens.filter((token) => store.mediaFilesByToken.has(token));
}

function tagPayload(tag: TagRecord): object {
  return {
    tag_token: tag.tagToken,
    tag_value: tag.tagValue,
    tag_value_lowercase: tag.tagValue.toLowerCase(),
    use_count: tag.mediaFileTokens.size,
  };
}
