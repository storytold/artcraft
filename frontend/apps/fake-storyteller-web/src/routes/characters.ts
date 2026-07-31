/**
 * `/v1/character` — reusable character references for video generation.
 *
 * Creating a character enqueues a job in the real backend, so the fake does the
 * same: the job resolves like any other and the character becomes usable once
 * it finishes.
 */

import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, failure, notFound, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { config } from "../config.ts";
import { nowIso } from "../state/clock.ts";
import type { CharacterRecord } from "../state/entities.ts";
import { sortNewestFirst, store } from "../state/store.ts";
import { makeToken, TOKEN_PREFIX } from "../state/tokens.ts";
import { mediaLinks } from "../wire/media.ts";

const PAGE_SIZE = 50;

export function registerCharacterRoutes(router: Router): void {
  router.post("/v1/character/create", createCharacter);
  router.post("/v1/character/edit", editCharacter);
  router.get("/v1/characters/session", listSessionCharacters);
  router.get("/v1/character/:characterToken", getCharacter);
  router.delete("/v1/character/:characterToken", deleteCharacter);
}

function createCharacter(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{
    image_media_token: string;
    model: string;
    uuid_idempotency_token: string;
    character_name: string;
    character_description: string | null;
  }>();

  if (body.image_media_token === undefined || body.character_name === undefined) {
    return failure(400, "BadInput", "image_media_token and character_name are required");
  }

  const character: CharacterRecord = {
    token: makeToken(TOKEN_PREFIX.character),
    name: body.character_name,
    maybeDescription: body.character_description ?? undefined,
    maybeAvatarMediaFileToken: body.image_media_token,
    maybeFullImageMediaFileToken: body.image_media_token,
    models: body.model === undefined ? [] : [body.model],
    ownerUserToken: user.userToken,
    isUserCreated: true,
    createdAt: nowIso(),
  };

  store.charactersByToken.set(character.token, character);

  const jobToken = makeToken(TOKEN_PREFIX.inferenceJob);
  const timestamp = nowIso();
  store.jobsByToken.set(jobToken, {
    jobToken,
    inferenceCategory: "character_generation",
    status: "pending",
    progressPercentage: 0,
    maybePromptToken: undefined,
    maybeModelType: body.model,
    maybeModelTitle: body.model,
    maybeRawInferenceText: body.character_name,
    maybeCreatorUserToken: user.userToken,
    maybeBatchToken: undefined,
    maybeResultMediaFileToken: undefined,
    maybeFailureCategory: undefined,
    maybeFailureMessage: undefined,
    maybeSuccessfullyCompletedAt: undefined,
    resolveAtMillis: Date.now() + config.resolveSeconds * 1000,
    isDismissed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return success({ inference_job_token: jobToken });
}

function editCharacter(context: RequestContext): HttpResult {
  const body = context.json<{
    token: string;
    updated_name: string | null;
    updated_description: string | null;
  }>();

  const character = store.charactersByToken.get(body.token ?? "");
  if (character === undefined) {
    return notFound();
  }

  if (body.updated_name != null) {
    character.name = body.updated_name;
  }
  if (body.updated_description !== undefined) {
    character.maybeDescription = body.updated_description ?? undefined;
  }

  return success();
}

function getCharacter(context: RequestContext): HttpResult {
  const character = store.charactersByToken.get(context.params["characterToken"] ?? "");
  if (character === undefined) {
    return notFound();
  }
  return success({ character: characterPayload(character) });
}

function deleteCharacter(context: RequestContext): HttpResult {
  const token = context.params["characterToken"] ?? "";
  if (!store.charactersByToken.has(token)) {
    return notFound();
  }
  store.charactersByToken.delete(token);
  return success();
}

/**
 * `next_cursor` must be null on the last page — the client loops until it is
 * falsy, so returning a stale cursor here spins forever.
 */
function listSessionCharacters(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const owned = sortNewestFirst(
    [...store.charactersByToken.values()].filter(
      (character) => character.ownerUserToken === user.userToken,
    ),
  );

  const offset = context.queryNumber("cursor") ?? 0;
  const page = owned.slice(offset, offset + PAGE_SIZE);
  const nextOffset = offset + PAGE_SIZE;

  return success({
    characters: page.map(characterPayload),
    next_cursor: nextOffset < owned.length ? nextOffset : null,
  });
}

function characterPayload(character: CharacterRecord): object {
  return {
    token: character.token,
    name: character.name,
    maybe_description: character.maybeDescription ?? null,
    maybe_avatar: characterMediaLinks(character.maybeAvatarMediaFileToken),
    maybe_full_image: characterMediaLinks(character.maybeFullImageMediaFileToken),
    models: character.models,
    is_user_created: character.isUserCreated,
  };
}

function characterMediaLinks(mediaFileToken: string | undefined): object | null {
  if (mediaFileToken === undefined) {
    return null;
  }

  const record = store.mediaFilesByToken.get(mediaFileToken);
  if (record === undefined) {
    return null;
  }

  const links = mediaLinks(record);
  return {
    cdn_url: links.cdn_url,
    maybe_thumbnail_template: links.maybe_thumbnail_template,
    maybe_video_previews: null,
  };
}
