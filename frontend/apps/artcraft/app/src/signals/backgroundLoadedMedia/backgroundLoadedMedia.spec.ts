import { beforeEach, describe, expect, it, vi } from "vitest";
import { effect } from "@preact/signals-core";

// The real remapping helper is used; only its "~/enums" import is narrowed so
// the heavy barrel (3D page-scene package) is not loaded.
vi.mock("~/enums", async () => await import("~/enums/AssetType"));

import type { AudioMediaItem, MediaInfo } from "@storyteller/ui-pagescene";
import {
  cancelNewFromAudioItem,
  flushAllBackgroundLoadedMedia,
  setUserAudioItems,
  setUserMovies,
  updateAudioItemLength,
  userAudioItems,
  userMovies,
} from "./backgroundLoadedMedia";

const media = (token: string, extra: Record<string, unknown> = {}) =>
  ({ token, public_bucket_path: `/p/${token}`, ...extra }) as unknown as MediaInfo;

const idsOf = (items: AudioMediaItem[] | undefined) => items?.map((i) => i.media_id);

beforeEach(() => {
  flushAllBackgroundLoadedMedia();
});

describe("setUserMovies", () => {
  it("stores the first list, including an empty one", () => {
    setUserMovies([]);
    expect(userMovies.value).toEqual([]);
  });

  it("replaces the stored list when the content differs", () => {
    setUserMovies([media("a")]);
    const next = [media("a"), media("b")];
    setUserMovies(next);
    expect(userMovies.value).toBe(next);
  });

  it("keeps the existing list (and does not notify) when the new one is deep-equal", () => {
    const first = [media("a", { maybe_title: "x" })];
    setUserMovies(first);

    let runs = 0;
    const stop = effect(() => {
      void userMovies.value;
      runs += 1;
    });
    setUserMovies([media("a", { maybe_title: "x" })]);
    stop();

    expect(userMovies.value).toBe(first);
    expect(runs).toBe(1);
  });
});

describe("setUserAudioItems", () => {
  it("maps the response into audio items, none flagged new on the first load", () => {
    setUserAudioItems([
      media("a", { maybe_title: "Song" }),
      media("b", { maybe_duration_millis: 2000 }),
    ]);
    expect(idsOf(userAudioItems.value)).toEqual(["a", "b"]);
    expect(userAudioItems.value?.[0]).toMatchObject({
      media_id: "a",
      object_uuid: "a",
      name: "Song",
      isMine: true,
      isNew: false,
    });
    expect(userAudioItems.value?.every((i) => i.isNew === false)).toBe(true);
  });

  it("flags only tokens that were not in the previous list as new", () => {
    setUserAudioItems([media("a")]);
    setUserAudioItems([media("a"), media("b")]);
    const byId = Object.fromEntries(userAudioItems.value!.map((i) => [i.media_id, i.isNew]));
    expect(byId).toEqual({ a: false, b: true });
  });

  it("keeps an item flagged new across re-polls until it is cancelled", () => {
    setUserAudioItems([media("a")]);
    setUserAudioItems([media("a"), media("b")]);
    setUserAudioItems([media("a"), media("b")]);
    expect(userAudioItems.value?.find((i) => i.media_id === "b")?.isNew).toBe(true);

    cancelNewFromAudioItem("b");
    setUserAudioItems([media("a"), media("b")]);
    expect(userAudioItems.value?.find((i) => i.media_id === "b")?.isNew).toBe(false);
  });

  it("drops items the server no longer returns, and accepts an empty response", () => {
    setUserAudioItems([media("a"), media("b")]);
    setUserAudioItems([media("b")]);
    expect(idsOf(userAudioItems.value)).toEqual(["b"]);

    setUserAudioItems([]);
    expect(userAudioItems.value).toEqual([]);
  });

  it("does not treat everything as new when the previous list was empty", () => {
    setUserAudioItems([]);
    setUserAudioItems([media("a")]);
    expect(userAudioItems.value?.[0].isNew).toBe(false);
  });
});

describe("cancelNewFromAudioItem", () => {
  it("clears the new flag on the matching item only", () => {
    setUserAudioItems([media("a")]);
    setUserAudioItems([media("a"), media("b"), media("c")]);
    cancelNewFromAudioItem("b");
    const byId = Object.fromEntries(userAudioItems.value!.map((i) => [i.media_id, i.isNew]));
    expect(byId).toEqual({ a: false, b: false, c: true });
  });

  it("publishes a new array so subscribers are notified", () => {
    setUserAudioItems([media("a")]);
    setUserAudioItems([media("a"), media("b")]);
    const before = userAudioItems.value;
    cancelNewFromAudioItem("b");
    expect(userAudioItems.value).not.toBe(before);
  });

  it("does nothing when no list is loaded or the list is empty", () => {
    cancelNewFromAudioItem("a");
    expect(userAudioItems.value).toBeUndefined();

    setUserAudioItems([]);
    const empty = userAudioItems.value;
    cancelNewFromAudioItem("a");
    expect(userAudioItems.value).toBe(empty);
  });

  it("leaves every flag alone for an unknown id", () => {
    setUserAudioItems([media("a")]);
    setUserAudioItems([media("a"), media("b")]);
    cancelNewFromAudioItem("zzz");
    expect(userAudioItems.value?.find((i) => i.media_id === "b")?.isNew).toBe(true);
  });
});

describe("updateAudioItemLength", () => {
  it("sets the length of the matching item only", () => {
    setUserAudioItems([media("a"), media("b")]);
    updateAudioItemLength("b", 42);
    const byId = Object.fromEntries(userAudioItems.value!.map((i) => [i.media_id, i.length]));
    expect(byId.b).toBe(42);
    expect(byId.a).toBeUndefined();
  });

  it("does nothing when no list is loaded", () => {
    updateAudioItemLength("a", 5);
    expect(userAudioItems.value).toBeUndefined();
  });
});

describe("flushAllBackgroundLoadedMedia", () => {
  it("resets movies and audio items to the not-loaded state", () => {
    setUserMovies([media("m")]);
    setUserAudioItems([media("a")]);
    flushAllBackgroundLoadedMedia();
    expect(userMovies.value).toBeUndefined();
    expect(userAudioItems.value).toBeUndefined();
  });

  it("means the next audio load is treated as a first load again", () => {
    setUserAudioItems([media("a")]);
    flushAllBackgroundLoadedMedia();
    setUserAudioItems([media("a"), media("b")]);
    expect(userAudioItems.value?.every((i) => i.isNew === false)).toBe(true);
  });
});
