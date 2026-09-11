import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { EngineContext } from "../../../contexts/EngineContext/EngineContext";
import { FilterEngineCategories, ToastTypes } from "../../../enums";
import type { MediaInfo } from "../../../models";
import { ScenePicker, SceneTypes } from "../ScenePicker";

interface NewSceneFromTemplateProps {
  onSceneSelect: (token: string) => void;
}

export const NewSceneFromTemplate = ({
  onSceneSelect,
}: NewSceneFromTemplateProps) => {
  const editor = useContext(EngineContext);
  const [featuredScenes, setFeaturedScenes] = useState<SceneTypes[] | undefined>(
    undefined,
  );
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const listFeaturedScenes = useCallback(async () => {
    if (!editor) return;

    const dummyScenes: SceneTypes[] = [
      {
        token: "m_nmzvdqr6kr8eqpmxqdzkqj0yknrjwv",
        name: "Dancing Girl",
        thumbnail: "/resources/placeholders/scene_placeholder.png",
      },
    ];
    const modMediaInfoToScenes = (results: MediaInfo[]): SceneTypes[] =>
      results.map((s) => ({
        token: s.token,
        name: s.maybe_title ?? "Untitled",
        updated_at: dayjs(s.updated_at).format("MMM D, YYYY HH:mm:ss"),
        thumbnail: s.cover_image.maybe_cover_image_public_bucket_path
          ? s.cover_image.maybe_cover_image_public_bucket_path
          : "",
      }));
    const response = await editor.adapter.listFeaturedMediaFiles({
      pageSize: 100,
      filterEngineCategories: [FilterEngineCategories.SCENE],
    });
    if (response.success && response.data) {
      setFeaturedScenes([
        ...modMediaInfoToScenes(response.data),
        ...dummyScenes,
      ]);
      return;
    }
    setFeaturedScenes(dummyScenes);
    editor.adapter.showToast(
      ToastTypes.ERROR,
      response.errorMessage || "Unknown Error in Listing Feature Scenes",
    );
  }, [editor]);

  useEffect(() => {
    if (featuredScenes) return;
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
      return () => element.removeEventListener("scroll", handleScroll);
    }
    return undefined;
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
