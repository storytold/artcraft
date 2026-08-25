import { z } from "zod";

import { GRANT_MAX_AGE_SECONDS } from "../auth/grant-age";
import { type Scope, SCOPES } from "../auth/resource";
import { base64Url, fromBase64Url } from "../encoding";
import type { CredentialProps } from "../upstream/credential";

/**
 * Personal tokens: long-lived bearer secrets for clients that cannot run the OAuth flow
 * themselves (the OpenAI Responses API `authorization` field, the Anthropic Messages API
 * connector's `authorization_token`). A token stands for one user, a fixed read-only scope
 * set, and its own upstream session — obtained by a fresh sign-in at creation time, never
 * borrowed from a browser.
 *
 * At rest (KV, shared with the OAuth provider but under our own prefixes):
 *
 *   mcppat:token:<sha256(secret)>  → the record, AES-GCM encrypted with a key derived from
 *                                    the secret itself. Someone holding the KV namespace
 *                                    holds no session; only the bearer of the secret can
 *                                    open its record — the same posture the provider takes
 *                                    with grant props.
 *   mcppat:user:<userToken>        → the user's index: labels, hints, dates, and the record
 *                                    keys — enough to list and revoke, nothing to sign in with.
 *
 * The record expires from KV at the token's expiry, so a forgotten token also disappears.
 */

export const PERSONAL_TOKEN_PREFIX = "artcraft_pat_";
/** Hard ceiling, shared with grants: nothing this service holds outlives 90 days. */
export const PERSONAL_TOKEN_MAX_TTL_SECONDS = GRANT_MAX_AGE_SECONDS;
export const PERSONAL_TOKENS_PER_USER_LIMIT = 10;
export const PERSONAL_TOKEN_LABEL_MAX_LENGTH = 64;
/** Personal tokens are read-only by construction; the scope set is not a choice. */
export const PERSONAL_TOKEN_SCOPES: readonly Scope[] = SCOPES;

const SECRET_BYTES = 32;
const ID_BYTES = 12;
const IV_BYTES = 12;
const TOKEN_KEY_PREFIX = "mcppat:token:";
const USER_INDEX_PREFIX = "mcppat:user:";
const HKDF_SALT = new TextEncoder().encode("artcraft-mcp personal token v1");
const HKDF_INFO = new TextEncoder().encode("record");
const SECRET_PATTERN = /^artcraft_pat_[A-Za-z0-9_-]{43}$/;

export interface PersonalTokenRecord {
  readonly id: string;
  readonly userToken: string;
  readonly username: string;
  readonly displayName: string;
  readonly scopes: readonly Scope[];
  readonly credential: CredentialProps;
  readonly label: string;
  /** Epoch milliseconds. */
  readonly createdAt: number;
  readonly expiresAt: number;
}

/** What the connections page shows: never the secret, never the session. */
export interface PersonalTokenSummary {
  readonly id: string;
  readonly label: string;
  /** `artcraft_pat_…abcd` — enough to recognise a token, useless to use it. */
  readonly hint: string;
  readonly createdAt: number;
  readonly expiresAt: number;
}

export interface CreatePersonalTokenInput {
  readonly user: {
    readonly userToken: string;
    readonly username: string;
    readonly displayName: string;
    readonly credential: CredentialProps;
  };
  readonly label: string;
  readonly ttlSeconds: number;
  readonly nowMs: number;
}

export interface PersonalTokenStore {
  /** Mints a token. The secret is returned exactly once and is not recoverable afterwards. */
  create(
    input: CreatePersonalTokenInput,
  ): Promise<{ secret: string; summary: PersonalTokenSummary }>;
  /** The record behind a secret, or `undefined` for anything malformed, unknown, or expired. */
  resolve(secret: string, nowMs: number): Promise<PersonalTokenRecord | undefined>;
  /** Live tokens of a user, newest first. */
  list(userToken: string, nowMs: number): Promise<PersonalTokenSummary[]>;
  /** Scoped to the user: another user's id is a no-op. Returns whether a token was removed. */
  revoke(userToken: string, id: string): Promise<boolean>;
  /** Revoke by the secret itself — for the handler, which holds nothing else about the token. */
  revokeBySecret(secret: string, nowMs: number): Promise<boolean>;
}

export type PersonalTokenErrorReason = "label" | "ttl" | "limit";

export class PersonalTokenError extends Error {
  override readonly name = "PersonalTokenError";
  readonly reason: PersonalTokenErrorReason;

  constructor(reason: PersonalTokenErrorReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

/** Cheap shape check so the external-token hook can dismiss every other bearer without I/O. */
export function isPersonalTokenSecret(bearer: string): boolean {
  return SECRET_PATTERN.test(bearer);
}

export function createPersonalTokenStore(kv: KVNamespace): PersonalTokenStore {
  return {
    async create(input) {
      const label = input.label.trim();
      if (label.length === 0 || label.length > PERSONAL_TOKEN_LABEL_MAX_LENGTH) {
        throw new PersonalTokenError(
          "label",
          `label must be 1 to ${String(PERSONAL_TOKEN_LABEL_MAX_LENGTH)} characters`,
        );
      }
      if (
        !Number.isInteger(input.ttlSeconds) ||
        input.ttlSeconds <= 0 ||
        input.ttlSeconds > PERSONAL_TOKEN_MAX_TTL_SECONDS
      ) {
        throw new PersonalTokenError(
          "ttl",
          `lifetime must be between 1 and ${String(PERSONAL_TOKEN_MAX_TTL_SECONDS)} seconds`,
        );
      }
      const index = await readIndex(kv, input.user.userToken);
      const live = index.filter((entry) => entry.expiresAt > input.nowMs);
      if (live.length >= PERSONAL_TOKENS_PER_USER_LIMIT) {
        throw new PersonalTokenError(
          "limit",
          `at most ${String(PERSONAL_TOKENS_PER_USER_LIMIT)} personal tokens per account`,
        );
      }

      const secret = PERSONAL_TOKEN_PREFIX + base64Url(randomBytes(SECRET_BYTES));
      const record: PersonalTokenRecord = {
        id: base64Url(randomBytes(ID_BYTES)),
        userToken: input.user.userToken,
        username: input.user.username,
        displayName: input.user.displayName,
        scopes: [...PERSONAL_TOKEN_SCOPES],
        credential: input.user.credential,
        label,
        createdAt: input.nowMs,
        expiresAt: input.nowMs + input.ttlSeconds * 1000,
      };
      const key = await tokenKeyFor(secret);
      await kv.put(key, await seal(secret, record), { expirationTtl: input.ttlSeconds });
      const summary = summarize(record, secret);
      await writeIndex(kv, input.user.userToken, [{ ...summary, key }, ...live]);
      return { secret, summary };
    },

    async resolve(secret, nowMs) {
      if (!isPersonalTokenSecret(secret)) return undefined;
      const sealed = await kv.get(await tokenKeyFor(secret));
      if (sealed === null) return undefined;
      const record = await open(secret, sealed);
      if (!record || record.expiresAt <= nowMs) return undefined;
      return record;
    },

    async list(userToken, nowMs) {
      const index = await readIndex(kv, userToken);
      const live = index.filter((entry) => entry.expiresAt > nowMs);
      if (live.length !== index.length) await writeIndex(kv, userToken, live);
      return live.map(summaryOf);
    },

    async revoke(userToken, id) {
      const index = await readIndex(kv, userToken);
      const target = index.find((entry) => entry.id === id);
      if (!target) return false;
      await kv.delete(target.key);
      await writeIndex(
        kv,
        userToken,
        index.filter((entry) => entry.id !== id),
      );
      return true;
    },

    async revokeBySecret(secret, nowMs) {
      const record = await this.resolve(secret, nowMs);
      if (!record) return false;
      return this.revoke(record.userToken, record.id);
    },
  };
}

// --- storage shapes -----------------------------------------------------------------------

const RecordSchema = z.object({
  id: z.string().min(1),
  userToken: z.string().regex(/^user_/),
  username: z.string().min(1),
  displayName: z.string(),
  scopes: z.array(z.enum(SCOPES)),
  credential: z.object({ kind: z.literal("session"), signedSession: z.string().min(1) }),
  label: z.string().min(1),
  createdAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});

const SealedSchema = z.object({ v: z.literal(1), iv: z.string(), data: z.string() });

const IndexEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  hint: z.string(),
  createdAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
  key: z.string().startsWith(TOKEN_KEY_PREFIX),
});

type IndexEntry = z.infer<typeof IndexEntrySchema>;

async function readIndex(kv: KVNamespace, userToken: string): Promise<IndexEntry[]> {
  const raw = await kv.get(USER_INDEX_PREFIX + userToken);
  if (raw === null) return [];
  const parsed = z.array(IndexEntrySchema).safeParse(JSON.parse(raw));
  // An index this build cannot read is treated as empty: tokens stay resolvable (the records
  // are keyed by secret), they just stop being listable until re-created.
  return parsed.success ? parsed.data : [];
}

async function writeIndex(
  kv: KVNamespace,
  userToken: string,
  entries: IndexEntry[],
): Promise<void> {
  if (entries.length === 0) {
    await kv.delete(USER_INDEX_PREFIX + userToken);
    return;
  }
  await kv.put(USER_INDEX_PREFIX + userToken, JSON.stringify(entries));
}

/** The index entry minus its storage key — the only shape that leaves this module. */
function summaryOf(entry: IndexEntry): PersonalTokenSummary {
  return {
    id: entry.id,
    label: entry.label,
    hint: entry.hint,
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
  };
}

function summarize(record: PersonalTokenRecord, secret: string): PersonalTokenSummary {
  return {
    id: record.id,
    label: record.label,
    hint: `${PERSONAL_TOKEN_PREFIX}…${secret.slice(-4)}`,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  };
}

// --- crypto -------------------------------------------------------------------------------

async function tokenKeyFor(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return TOKEN_KEY_PREFIX + hex(new Uint8Array(digest));
}

async function seal(secret: string, record: PersonalTokenRecord): Promise<string> {
  const iv = randomBytes(IV_BYTES);
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await recordKeyFor(secret),
    new TextEncoder().encode(JSON.stringify(record)),
  );
  return JSON.stringify({ v: 1, iv: base64Url(iv), data: base64Url(new Uint8Array(data)) });
}

async function open(secret: string, sealed: string): Promise<PersonalTokenRecord | undefined> {
  const envelope = SealedSchema.safeParse(JSON.parse(sealed));
  if (!envelope.success) return undefined;
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64Url(envelope.data.iv) },
      await recordKeyFor(secret),
      fromBase64Url(envelope.data.data),
    );
  } catch {
    return undefined;
  }
  const record = RecordSchema.safeParse(JSON.parse(new TextDecoder().decode(plaintext)));
  return record.success ? record.data : undefined;
}

/** HKDF over the secret: the record key exists only while someone presents the secret. */
async function recordKeyFor(secret: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: HKDF_SALT, info: HKDF_INFO },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
