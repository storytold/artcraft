/**
 * `/v1/api_keys` and `/v1/user_referral_codes` — settings-page resources.
 *
 * Both use a response envelope that returns the created record's fields at the
 * top level rather than nested, and both parse error bodies on 4xx, so the
 * shapes here matter more than usual.
 */

import { randomBytes } from "node:crypto";
import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, failure, notFound, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { nowIso } from "../state/clock.ts";
import type { ApiKeyRecord, ReferralCodeRecord } from "../state/entities.ts";
import { sortNewestFirst, store } from "../state/store.ts";
import { makeToken, TOKEN_PREFIX } from "../state/tokens.ts";

const LOCAL_IP = "127.0.0.1";

export function registerAccountRoutes(router: Router): void {
  // Literal paths must be registered before `:token`, which would otherwise capture them.
  router.get("/v1/api_keys/list", listApiKeys);
  router.post("/v1/api_keys/create", createApiKey);
  router.get("/v1/api_keys/:token", getApiKey);
  router.put("/v1/api_keys/:token", updateApiKey);
  router.delete("/v1/api_keys/:token", deleteApiKey);

  router.get("/v1/user_referral_codes/list", listReferralCodes);
  router.post("/v1/user_referral_codes/create", createReferralCode);
  router.delete("/v1/user_referral_codes/code/:token", deleteReferralCode);
}

function listApiKeys(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const owned = sortNewestFirst(
    [...store.apiKeysByToken.values()].filter((key) => key.ownerUserToken === user.userToken),
  );

  const offset = context.queryNumber("offset") ?? 0;
  const limit = context.queryNumber("limit") ?? owned.length;

  return success({ api_keys: owned.slice(offset, offset + limit).map(apiKeyPayload) });
}

function getApiKey(context: RequestContext): HttpResult {
  const key = store.apiKeysByToken.get(context.params["token"] ?? "");
  if (key === undefined) {
    return notFound();
  }
  return success({ api_key: apiKeyPayload(key) });
}

function createApiKey(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{ name: string; maybe_description: string | null }>();
  if ((body.name ?? "").trim().length === 0) {
    return failure(400, "BadInput", "name is required");
  }

  const timestamp = nowIso();
  const key: ApiKeyRecord = {
    token: makeToken(TOKEN_PREFIX.apiKey),
    apiKey: `sk_fake_${randomBytes(24).toString("hex")}`,
    name: body.name ?? "",
    maybeDescription: body.maybe_description ?? undefined,
    ownerUserToken: user.userToken,
    maybeDeletedAt: undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.apiKeysByToken.set(key.token, key);

  // The full secret is returned once, at creation, exactly like the real API.
  return success({ api_key_token: key.token, api_key: key.apiKey });
}

function updateApiKey(context: RequestContext): HttpResult {
  const key = store.apiKeysByToken.get(context.params["token"] ?? "");
  if (key === undefined) {
    return notFound();
  }

  const body = context.json<{ maybe_description: string | null }>();
  key.maybeDescription = body.maybe_description ?? undefined;
  key.updatedAt = nowIso();
  return success();
}

/** Soft delete, because the list endpoint returns deleted rows and the UI filters them. */
function deleteApiKey(context: RequestContext): HttpResult {
  const key = store.apiKeysByToken.get(context.params["token"] ?? "");
  if (key === undefined) {
    return notFound();
  }

  key.maybeDeletedAt = nowIso();
  key.updatedAt = key.maybeDeletedAt;
  return success();
}

function listReferralCodes(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const owned = sortNewestFirst(
    [...store.referralCodesByToken.values()].filter((code) => code.ownerUserToken === user.userToken),
  );

  return success({ referral_codes: owned.map(referralCodePayload) });
}

function createReferralCode(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = context.json<{ code: string }>();
  const code = (body.code ?? "").trim();
  if (code.length === 0) {
    return failure(400, "BadInput", "code is required");
  }

  for (const existing of store.referralCodesByToken.values()) {
    if (existing.code.toLowerCase() === code.toLowerCase()) {
      return failure(400, "BadInput", "that referral code is already taken");
    }
  }

  const timestamp = nowIso();
  const record: ReferralCodeRecord = {
    token: makeToken(TOKEN_PREFIX.appSession),
    code,
    ownerUserToken: user.userToken,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.referralCodesByToken.set(record.token, record);

  return success({ token: record.token, code: record.code, code_lowercase: record.code.toLowerCase() });
}

function deleteReferralCode(context: RequestContext): HttpResult {
  const token = context.params["token"] ?? "";
  if (!store.referralCodesByToken.has(token)) {
    return notFound();
  }
  store.referralCodesByToken.delete(token);
  return success();
}

function apiKeyPayload(key: ApiKeyRecord): object {
  return {
    token: key.token,
    truncated_api_key: `${key.apiKey.slice(0, 12)}...`,
    name: key.name,
    maybe_description: key.maybeDescription ?? null,
    owner_user_token: key.ownerUserToken,
    ip_address_creation: LOCAL_IP,
    ip_address_update: LOCAL_IP,
    created_at: key.createdAt,
    updated_at: key.updatedAt,
    maybe_deleted_at: key.maybeDeletedAt ?? null,
  };
}

function referralCodePayload(record: ReferralCodeRecord): object {
  return {
    token: record.token,
    code: record.code,
    code_lowercase: record.code.toLowerCase(),
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}
