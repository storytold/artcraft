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
  const mediaFilesApi = new MediaFilesApi();
  const response = await mediaFilesApi.ListUserMediaFiles({
    filter_media_classes: [FilterMediaClasses.VIDEO],
  });
  isRetreivingUserMovies.value = false;
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
  const mediaFilesApi = new MediaFilesApi();
  const response = await mediaFilesApi.ListUserMediaFiles({
    page_size: 100,
    filter_media_classes: [FilterMediaClasses.AUDIO],
  });
  isRetreivingAudioItems.value = false;
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
