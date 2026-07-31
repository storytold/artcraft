/**
 * The whole server's state.
 *
 * One module-level object holding plain Maps. It is process-local and lost on
 * restart, which is the point: every run starts from the same seeded fixture,
 * so a developer or a test can rely on what is there.
 */

import type {
  ApiKeyRecord,
  CharacterRecord,
  FolderRecord,
  JobRecord,
  MediaFileRecord,
  PromptRecord,
  ReferralCodeRecord,
  SessionRecord,
  TagRecord,
  UserRecord,
} from "./entities.ts";
import { clearObjects } from "./assets.ts";
import { resetTokenSequence } from "./tokens.ts";

export interface FakeStore {
  usersByToken: Map<string, UserRecord>;
  usersByUsername: Map<string, UserRecord>;
  sessionsBySignedSession: Map<string, SessionRecord>;
  mediaFilesByToken: Map<string, MediaFileRecord>;
  jobsByToken: Map<string, JobRecord>;
  promptsByToken: Map<string, PromptRecord>;
  foldersByToken: Map<string, FolderRecord>;
  tagsByToken: Map<string, TagRecord>;
  charactersByToken: Map<string, CharacterRecord>;
  apiKeysByToken: Map<string, ApiKeyRecord>;
  referralCodesByToken: Map<string, ReferralCodeRecord>;
  /** Idempotency tokens already spent, so replays are rejected like the real API. */
  usedIdempotencyTokens: Set<string>;
}

export const store: FakeStore = {
  usersByToken: new Map(),
  usersByUsername: new Map(),
  sessionsBySignedSession: new Map(),
  mediaFilesByToken: new Map(),
  jobsByToken: new Map(),
  promptsByToken: new Map(),
  foldersByToken: new Map(),
  tagsByToken: new Map(),
  charactersByToken: new Map(),
  apiKeysByToken: new Map(),
  referralCodesByToken: new Map(),
  usedIdempotencyTokens: new Set(),
};

/** Drop everything, including stored bytes, and restart the token sequence. */
export function clearStore(): void {
  for (const collection of [
    store.usersByToken,
    store.usersByUsername,
    store.sessionsBySignedSession,
    store.mediaFilesByToken,
    store.jobsByToken,
    store.promptsByToken,
    store.foldersByToken,
    store.tagsByToken,
    store.charactersByToken,
    store.apiKeysByToken,
    store.referralCodesByToken,
  ]) {
    collection.clear();
  }

  store.usedIdempotencyTokens.clear();
  clearObjects();
  resetTokenSequence();
}

/** Media files owned by a user, newest first. */
export function mediaFilesForUser(userToken: string | undefined): MediaFileRecord[] {
  const owned: MediaFileRecord[] = [];
  for (const record of store.mediaFilesByToken.values()) {
    if (record.maybeCreatorUserToken === userToken) {
      owned.push(record);
    }
  }
  return sortNewestFirst(owned);
}

/** Sort any record set by `createdAt`, newest first — the default order everywhere in the UI. */
export function sortNewestFirst<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
