// Tab routing for the artcraft host's non-3D pages. Lifted out of
// PageEditor so PageEditor can focus on just the 3D editor body.
//
// PageScene's tree currently still mounts <PageEditor> at all times
// (the EngineProvider lifecycle relies on the engine root being
// reachable so its DOM-ref-driven effect can construct the Editor
// when the user returns to 3D); the alternate tabs render *inside*
// PageEditor as siblings of the 3D content. Keeping that contract
// for now -- this file is just a clean home for the JSX, not a
// behavior change.
//
// A future step lifts this all the way up to a route-level switch
// so non-3D tabs don't even mount the EngineProvider tree.

import { AppsIndexPage } from "../PageApps/AppsIndexPage";
import PageDraw from "../PageDraw/PageDraw";
import TextToImage from "../PageImage/TextToImage";
import ImageToVideo from "../PageVideo/ImageToVideo";
import { VideoFrameExtractor } from "../PageVideoFrameExtractor";
import { VideoWatermarkRemover } from "../PageVideoWatermarkRemover";
import { ImageWatermarkRemover } from "../PageImageWatermarkRemover";
import { ImageTo3DObject } from "../PageImageTo3DObject";
import { ImageTo3DWorld } from "../PageImageTo3DWorld";
import { RemoveBackground } from "../PageRemoveBackground";
import { Angles } from "../PageAngles";
import { Storyboard } from "../PageStoryboard";
import { useStoryboardPageEnabled } from "@storyteller/ui-settings-modal";
import { useTabStore } from "../Stores/TabState";
import {
  topNavMediaId,
  topNavMediaUrl,
} from "~/components/signaled/TopBar/TopBar";

export const TabbedPages = () => {
  const tabStore = useTabStore();
  const storyboardPageEnabled = useStoryboardPageEnabled();
  return (
    <>
      {tabStore.activeTabId == "APPS" && (
        <div>
          <AppsIndexPage />
        </div>
      )}
      {tabStore.activeTabId == "2D" && (
        <div>
          <PageDraw />
        </div>
      )}
      {tabStore.activeTabId == "IMAGE" && (
        <div>
          <TextToImage
            imageMediaId={topNavMediaId.value}
            imageUrl={topNavMediaUrl.value}
          />
        </div>
      )}
      {tabStore.activeTabId == "VIDEO" && (
        <div>
          <ImageToVideo />
        </div>
      )}
      {tabStore.activeTabId == "VIDEO_FRAME_EXTRACTOR" && (
        <div>
          <VideoFrameExtractor />
        </div>
      )}
      {tabStore.activeTabId == "VIDEO_WATERMARK_REMOVAL" && (
        <div>
          <VideoWatermarkRemover />
        </div>
      )}
      {tabStore.activeTabId == "IMAGE_WATERMARK_REMOVAL" && (
        <div>
          <ImageWatermarkRemover />
        </div>
      )}
      {tabStore.activeTabId == "IMAGE_TO_3D_OBJECT" && (
        <div>
          <ImageTo3DObject />
        </div>
      )}
      {tabStore.activeTabId == "IMAGE_TO_3D_WORLD" && (
        <div>
          <ImageTo3DWorld />
        </div>
      )}
      {tabStore.activeTabId == "REMOVE_BACKGROUND" && (
        <div>
          <RemoveBackground />
        </div>
      )}
      {tabStore.activeTabId == "ANGLES" && (
        <div>
          <Angles />
        </div>
      )}
      {tabStore.activeTabId == "STORYBOARD" && storyboardPageEnabled && (
        <div>
          <Storyboard />
        </div>
      )}
    </>
  );
};
