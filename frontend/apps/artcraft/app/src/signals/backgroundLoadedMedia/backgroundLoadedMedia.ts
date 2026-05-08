import { signal } from "@preact/signals-core";
import deepEqual from "deep-equal";

import type { AudioMediaItem, MediaInfo } from "@storyteller/ui-pagescene";
import { remapResponseToAudioMediaItems } from "./utilities";

// Signals and signal functions for background loading User's Movies
export const userMovies = signal<MediaInfo[] | undefined>(undefined);
export const isRetreivingUserMovies = signal<boolean>(false);

export const setUserMovies = (newSet: MediaInfo[]) => {
  if (!deepEqual(userMovies.value, newSet)) {
    userMovies.value = newSet;
  }
  //else do nothing cos it's the same list;
};

//Signals and signal functions for background loading User's Audio Items.
export const userAudioItems = signal<AudioMediaItem[] | undefined>(undefined);
export const setUserAudioItems = (newSet: MediaInfo[]) => {
  const previousItems = userAudioItems.value ? [...userAudioItems.value] : [];
  const morphedNewSet = remapResponseToAudioMediaItems(newSet, previousItems);
  userAudioItems.value = morphedNewSet;
};

export const isRetreivingAudioItems = signal<boolean>(false);

export const cancelNewFromAudioItem = (mediaId: string) => {
  if (!userAudioItems.value || userAudioItems.value.length === 0) {
    return;
  }
  const newList = userAudioItems.value.map((item) => {
    if (item.media_id === mediaId) item.isNew = false;
    return item;
  });
  userAudioItems.value = [...newList];
};

export const updateAudioItemLength = (mediaId: string, duration: number) => {
  if (!userAudioItems.value || userAudioItems.value.length === 0) {
    return;
  }
  const newList = userAudioItems.value.map((item) => {
    if (item.media_id === mediaId) item.length = duration;
    return item;
  });
  userAudioItems.value = [...newList];
};

// Signal functions for manipulating all background loaded media
export const flushAllBackgroundLoadedMedia = () => {
  userAudioItems.value = undefined;
  userMovies.value = undefined;
};
