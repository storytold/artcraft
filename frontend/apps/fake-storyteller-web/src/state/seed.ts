/**
 * The fixture the server starts from.
 *
 * A fresh process always contains the same demo user, credits, gallery and
 * folder, so "log in and look at the library" works immediately and tests can
 * rely on what they find.
 */

import { createHash } from "node:crypto";
import { config } from "../config.ts";
import { nowIso } from "./clock.ts";
import type { FolderRecord, MediaFileRecord, TagRecord, UserRecord } from "./entities.ts";
import { createMediaFileFromFixture } from "./media_factory.ts";
import { clearStore, store } from "./store.ts";
import { makeToken, TOKEN_PREFIX } from "./tokens.ts";

export const DEMO_USERNAME = "localdev1";
export const DEMO_PASSWORD = "localdev1pass";
const DEMO_EMAIL = "localdev1@example.com";

/** Titles for the seeded gallery, so the library is not a wall of identical rows. */
const SEED_IMAGE_TITLES = [
  "Juno at the lake",
  "Mochi in the studio",
  "Golden hour portrait",
  "Concept sheet, front view",
  "Reference plate 04",
  "Lighting test, warm key",
];

export function seedState(): void {
  clearStore();

  const user = seedDemoUser();
  const images = seedGallery(user);
  seedVideo(user);
  seedFolder(user, images);
  seedTags(user, images);

  console.log(`[fake-api] seeded ${DEMO_USERNAME} / ${DEMO_PASSWORD} with ${config.demoCredits} credits`);
  console.log(`[fake-api] seeded ${store.mediaFilesByToken.size} media files`);
}

function seedDemoUser(): UserRecord {
  const user: UserRecord = {
    userToken: makeToken(TOKEN_PREFIX.user),
    username: DEMO_USERNAME,
    displayName: "LocalDev1",
    emailAddress: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    gravatarHash: md5(DEMO_EMAIL),
    featureFlags: ["explore_media", "studio", "upload_3d", "video_style_transfer", "referrals", "api_key"],
    defaultAvatar: { image_index: 16, color_index: 5 },
    bankedCredits: config.demoCredits,
    monthlyCredits: 0,
    subscriptionSlug: "artcraft_pro",
    createdAt: nowIso(),
  };

  registerUser(user);
  return user;
}

/** Register a user in both lookup maps. Also used by the create-account handler. */
export function registerUser(user: UserRecord): void {
  store.usersByToken.set(user.userToken, user);
  store.usersByUsername.set(user.username.toLowerCase(), user);
}

export function md5(value: string): string {
  return createHash("md5").update(value.trim().toLowerCase()).digest("hex");
}

function seedGallery(user: UserRecord): MediaFileRecord[] {
  return SEED_IMAGE_TITLES.map((title, index) =>
    createMediaFileFromFixture(index % 2 === 0 ? "image" : "imageAlternate", {
      mediaClass: "image",
      mediaType: "jpg",
      bucketPrefix: "image_",
      extension: ".jpg",
      maybeCreatorUserToken: user.userToken,
      maybeTitle: title,
      maybeOriginalFilename: `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_")}.jpg`,
      originCategory: "upload",
      originProductCategory: "image_gen",
      isUserUpload: true,
    }),
  );
}

function seedVideo(user: UserRecord): MediaFileRecord {
  return createMediaFileFromFixture("video", {
    mediaClass: "video",
    mediaType: "mp4",
    bucketPrefix: "video_",
    extension: ".mp4",
    maybeCreatorUserToken: user.userToken,
    maybeTitle: "Garoh, golden sun",
    maybeOriginalFilename: "golden_sun_garoh.mp4",
    maybeDurationMillis: 8_000,
    originCategory: "upload",
    originProductCategory: "video_gen",
    isUserUpload: true,
  });
}

function seedFolder(user: UserRecord, images: MediaFileRecord[]): FolderRecord {
  const timestamp = nowIso();
  const folder: FolderRecord = {
    token: makeToken(TOKEN_PREFIX.folder),
    name: "References",
    ownerUserToken: user.userToken,
    maybeParentFolderToken: undefined,
    maybeColorCode: "#7c5cff",
    maybeCustomCoverMediaFileToken: undefined,
    hasStar: true,
    mediaFileTokens: images.slice(0, 3).map((image) => image.token),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.foldersByToken.set(folder.token, folder);
  return folder;
}

function seedTags(user: UserRecord, images: MediaFileRecord[]): void {
  const assignments: [string, MediaFileRecord[]][] = [
    ["character", images.slice(0, 2)],
    ["lighting", images.slice(4, 6)],
  ];

  for (const [value, taggedImages] of assignments) {
    const tag: TagRecord = {
      tagToken: makeToken(TOKEN_PREFIX.tag),
      tagValue: value,
      ownerUserToken: user.userToken,
      mediaFileTokens: new Set(taggedImages.map((image) => image.token)),
      createdAt: nowIso(),
    };
    store.tagsByToken.set(tag.tagToken, tag);
  }
}
