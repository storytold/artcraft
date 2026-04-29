import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import { MediaInfo } from "~/pages/PageScene/models";
import { FilterEngineCategories, ToastTypes } from "~/enums";
import { addToast } from "~/signals";
import { ScenePicker, SceneTypes } from "../ScenePicker";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { Label } from "@storyteller/ui-label";
import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";

interface LoadSceneProps {
  onSceneSelect: (token: string) => void;
}

export enum FetchStatus {
  paused,
  // ready triggers a new fetch
  ready,
  in_progress,
  success,
  error,
}

export enum Filters {
  Featured,
  Mine,
  Bookmarked,
}

export const LoadUserScenes = ({ onSceneSelect }: LoadSceneProps) => {
  const [scenes, setScenes] = useState<SceneTypes[] | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const getScenesByUser = useCallback(async () => {
    const modMediaInfoToScenes = (results: MediaInfo[]) =>
      results.map((scene: MediaInfo) => ({
        token: scene.token,
        name: scene.maybe_title ?? "Untitled",
        updated_at: dayjs(scene.updated_at).format("MMM D, YYYY HH:mm:ss"),
        thumbnail: scene.cover_image.maybe_cover_image_public_bucket_path
          ? scene.cover_image.maybe_cover_image_public_bucket_path
          : undefined,
      }));

    const mediaFilesApi = new MediaFilesApi();
    const response = await mediaFilesApi.ListUserMediaFiles({
      filter_engine_categories: [FilterEngineCategories.SCENE],
    });
    if (response.success && response.data) {
      setScenes(modMediaInfoToScenes(response.data));
      return;
    }
    addToast(
      ToastTypes.ERROR,
      response.errorMessage || "Unknown Error in Loading User Scenes",
    );
  }, []);

  useEffect(() => {
    if (scenes) {
      //only call once on mount
      return;
    }
    getScenesByUser();
  }, [scenes, getScenesByUser]);

  const handleSceneSelect = (selectedScene: SceneTypes) => {
    onSceneSelect(selectedScene.token);
  };

  const handleScroll = () => {
    const element = scrollContainerRef.current;
    if (element) {
      const atBottom =
        element.scrollHeight - element.scrollTop <= element.clientHeight + 1;
      const hasOverflow = element.scrollHeight > element.clientHeight;

      setBottomGradientOpacity(hasOverflow && !atBottom ? 1 : 0);
    }
  };

  useLayoutEffect(() => {
    if (scenes && scenes.length > 0) {
      const element = scrollContainerRef.current;
      if (element) {
        handleScroll();
        element.addEventListener("scroll", handleScroll);

        return () => {
          element.removeEventListener("scroll", handleScroll);
        };
      }
    }
  }, [scenes]);

  return (
    <div className="flex flex-col gap-0.5">
      <Label>My Scenes</Label>
      <div className="relative flex max-h-[500px] min-h-[140px] flex-col">
        {!scenes && (
          <div className="flex items-center justify-center gap-3 py-12">
            <LoadingSpinner />
            <span className="font-medium opacity-70">Loading scenes...</span>
          </div>
        )}
        {scenes && scenes.length === 0 && (
          <div className="flex items-center justify-center gap-3 py-12">
            <span className="font-medium opacity-50">
              You have no saved scenes yet.
            </span>
          </div>
        )}
        {scenes && scenes.length !== 0 && (
          <div
            className="overflow-y-auto overflow-x-hidden"
            ref={scrollContainerRef}
          >
            <ScenePicker
              scenes={scenes}
              onSceneSelect={handleSceneSelect}
              showDate={true}
            />
          </div>
        )}

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-10 bg-gradient-to-t from-ui-panel to-transparent transition-opacity duration-200"
          style={{ opacity: bottomGradientOpacity }}
        />
      </div>
    </div>
  );
};
