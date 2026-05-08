import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";

import type { MediaInfo } from "@storyteller/ui-pagescene";
import { FilterEngineCategories, ToastTypes } from "~/enums";

import { ScenePicker, SceneTypes } from "../ScenePicker";
import { LoadingSpinner } from "~/components";

import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";
import { addToast } from "~/signals";

interface NewSceneFromTemplateProps {
  onSceneSelect: (token: string) => void;
}

export const NewSceneFromTemplate = ({
  onSceneSelect,
}: NewSceneFromTemplateProps) => {
  const [featuredScenes, setFeaturedScenes] = useState<
    SceneTypes[] | undefined
  >(undefined);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const listFeaturedScenes = useCallback(async () => {
    const mediaFilesApi = new MediaFilesApi();
    // Hard coded scenes

    const dummyScenes: SceneTypes[] = [
      {
        token: "m_nmzvdqr6kr8eqpmxqdzkqj0yknrjwv",
        name: "Dancing Girl",
        thumbnail: "/resources/placeholders/scene_placeholder.png",
      },
    ];
    const modMediaInfoToScenes = (results: MediaInfo[]) =>
      results.map((scene: MediaInfo) => ({
        token: scene.token,
        name: scene.maybe_title ?? "Untitled",
        updated_at: dayjs(scene.updated_at).format("MMM D, YYYY HH:mm:ss"),
        thumbnail: scene.cover_image.maybe_cover_image_public_bucket_path
          ? scene.cover_image.maybe_cover_image_public_bucket_path
          : undefined,
      }));
    const response = await mediaFilesApi.ListFeaturedMediaFiles({
      filter_engine_categories: [FilterEngineCategories.SCENE],
    });
    if (response.success && response.data) {
      setFeaturedScenes([
        ...modMediaInfoToScenes(response.data),
        ...dummyScenes,
      ]);
      return;
    }
    setFeaturedScenes(dummyScenes);
    addToast(
      ToastTypes.ERROR,
      response.errorMessage || "Unknown Error in Listing Feature Scenes",
    );
  }, []);
  useEffect(() => {
    if (featuredScenes) {
      //only call once on mount
      return;
    }
    listFeaturedScenes();
  }, [featuredScenes, listFeaturedScenes]);

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
    const element = scrollContainerRef.current;
    if (element) {
      handleScroll();
      element.addEventListener("scroll", handleScroll);

      return () => {
        element.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="relative flex max-h-[500px] min-h-[140px] flex-col">
        {!featuredScenes && (
          <div className="flex items-center justify-center gap-3 py-12">
            <LoadingSpinner />
            <span className="font-medium opacity-70">Loading scenes...</span>
          </div>
        )}
        {featuredScenes && (
          <div
            className="overflow-y-auto overflow-x-hidden"
            ref={scrollContainerRef}
          >
            <ScenePicker
              scenes={featuredScenes}
              onSceneSelect={handleSceneSelect}
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
