import { useCallback, useEffect, useState } from "react";

import { MediaFile } from "~/pages/PageEnigma/models";

import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";
import { ToastTypes } from "~/enums";
import { addToast } from "~/signals";

import { MyMovies } from "~/pages/PageEnigma/comps/GenerateModals/MyMovies";
import { Sharing } from "~/pages/PageEnigma/comps/GenerateModals/Sharing";
import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";

export function GenerateModals() {
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const generateMovieId = usePageEnigmaStore((s) => s.generateMovieId);
  const setGenerateMovieId = usePageEnigmaStore((s) => s.setGenerateMovieId);

  const GetMediaFileByToken = useCallback(async (movieId: string) => {
    const mediaFilesApi = new MediaFilesApi();
    const response = await mediaFilesApi.GetMediaFileByToken({
      mediaFileToken: movieId,
    });
    if (response.success && response.data) {
      setMediaFile(response.data);
      return;
    }
    addToast(
      ToastTypes.ERROR,
      response.errorMessage ||
        `Unknown Error in Getting Movie (token=${movieId}`,
    );
  }, []);
  const setMovieId = useCallback(
    (movieId: string) => setGenerateMovieId(movieId),
    [setGenerateMovieId],
  );
  useEffect(() => {
    if (generateMovieId) {
      GetMediaFileByToken(generateMovieId);
    }
  }, [generateMovieId, GetMediaFileByToken]);

  if (!mediaFile) {
    return <MyMovies setMovieId={setMovieId} />;
  }
  return <Sharing mediaFile={mediaFile!} setMediaFile={setMediaFile} />;
}
