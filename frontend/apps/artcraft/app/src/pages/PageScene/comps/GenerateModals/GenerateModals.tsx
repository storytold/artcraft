import { useCallback, useEffect, useState } from "react";

import { MediaFile } from "~/pages/PageScene/models";

import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
import { ToastTypes } from "~/enums";
import { addToast } from "~/signals";

import { MyMovies } from "~/pages/PageScene/comps/GenerateModals/MyMovies";
import { Sharing } from "~/pages/PageScene/comps/GenerateModals/Sharing";
import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";

export function GenerateModals() {
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const generateMovieId = usePageSceneStore((s) => s.generateMovieId);
  const setGenerateMovieId = usePageSceneStore((s) => s.setGenerateMovieId);

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
