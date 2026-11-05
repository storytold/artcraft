import { FilterMediaClasses, ToastTypes } from "~/enums";

import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";

import {
  addToast,
  authentication,
  setUserAudioItems,
  setUserMovies,
  isRetreivingAudioItems,
  isRetreivingUserMovies,
} from "~/signals";
const { userInfo } = authentication;

export async function PollUserGeneratedMovies(): Promise<boolean> {
  if (!userInfo.value || isRetreivingUserMovies.value) {
    //do nothing return if login info does not exist
    return true;
  }

  isRetreivingUserMovies.value = true;
  let response;
  try {
    const mediaFilesApi = new MediaFilesApi();
    response = await mediaFilesApi.ListUserMediaFiles({
      filter_media_classes: [FilterMediaClasses.VIDEO],
    });
  } catch (error) {
    // A thrown API error must not escape as an unhandled rejection from the
    // fire-and-forget caller; report it like any other failed poll.
    addToast(
      ToastTypes.ERROR,
      error instanceof Error && error.message
        ? error.message
        : "Unknown Error in Loading My Movies",
    );
    return false;
  } finally {
    // Always clear the in-flight flag, otherwise a throw blocks all future polls.
    isRetreivingUserMovies.value = false;
  }
  if (response.success && response.data) {
    const userGeneratedMovies = response.data.filter((movie) => {
      return movie.origin_category === "inference";
    });
    setUserMovies(userGeneratedMovies);
    return true;
  }
  addToast(
    ToastTypes.ERROR,
    response.errorMessage || "Unknown Error in Loading My Movies",
  );
  return false;
}

export async function PollUserAudioItems(): Promise<boolean> {
  if (!userInfo.value) {
    //do nothing return if login info does not exist
    return true;
  }
  isRetreivingAudioItems.value = true;
  let response;
  try {
    const mediaFilesApi = new MediaFilesApi();
    response = await mediaFilesApi.ListUserMediaFiles({
      page_size: 100,
      filter_media_classes: [FilterMediaClasses.AUDIO],
    });
  } catch (error) {
    // Same as the movies poller: surface the error instead of rejecting.
    addToast(
      ToastTypes.ERROR,
      error instanceof Error && error.message
        ? error.message
        : "Unknown Error in Loading My Audio Items",
    );
    return false;
  } finally {
    // Always clear the in-flight flag, even when the request throws.
    isRetreivingAudioItems.value = false;
  }
  if (response.success && response.data) {
    setUserAudioItems(response.data);
    return true;
  }
  addToast(
    ToastTypes.ERROR,
    response.errorMessage || "Unknown Error in Loading My Audio Items",
  );
  return false;
}
