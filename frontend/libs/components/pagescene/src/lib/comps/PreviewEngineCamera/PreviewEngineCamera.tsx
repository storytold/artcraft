import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBlinds,
  faBlindsRaised,
  faCameraViewfinder,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import { useShallow } from "zustand/shallow";
import { usePageSceneStore } from "../../PageSceneStore";
import { useViewportSize } from "../../hooks/useViewportSize";
import { CameraAspectRatio, EditorStates } from "../../enums";
import { CameraViewCanvas } from "../EngineCanvases";
import { ButtonIcon } from "@storyteller/ui-button-icon";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";

export const PreviewEngineCamera = () => {
  const viewport = useViewportSize();
  const {
    camAspect,
    editorState,
    editorLetterBox,
    toggleEditorLetterBox,
    outlinerShowing,
  } = usePageSceneStore(
    useShallow((s) => ({
      camAspect: s.cameraAspectRatio,
      editorState: s.editorState,
      editorLetterBox: s.editorLetterBox,
      toggleEditorLetterBox: s.toggleEditorLetterBox,
      outlinerShowing: s.outlinerShowing,
    })),
  );

  const handleButtonCameraView = () => {
    const { editorState, setEditorState } = usePageSceneStore.getState();
    setEditorState(
      editorState === EditorStates.CAMERA_VIEW
        ? EditorStates.EDIT
        : EditorStates.CAMERA_VIEW,
    );
    // useFreeCam picks up the editorState change from the store and
    // (de)activates its listeners + clears held keys automatically.
  };

  const getLargeScreenHeightClass = () => {
    if (camAspect === CameraAspectRatio.VERTICAL_9_16) {
      return viewport.width >= 2000
        ? "w-44 justify-center"
        : "w-36 justify-center";
    }
    return viewport.width >= 2000
      ? "w-72 justify-between"
      : "w-64 justify-between";
  };

  const getSmallScreenHeightClass = () => {
    if (
      camAspect === CameraAspectRatio.VERTICAL_9_16 &&
      viewport.height - 64 < 2000 &&
      outlinerShowing
    ) {
      return "w-40 justify-center";
    }
    return "";
  };

  const getSquareAspectRatioClass = () => {
    if (camAspect === CameraAspectRatio.SQUARE_1_1) {
      return viewport.width >= 2000
        ? "w-[240px] justify-between"
        : "w-60 justify-between";
    }
    return undefined;
  };

  return (
    <div
      id="preview-engine-camera"
      className="hidden origin-bottom-left shadow-lg" //hidden right now with css
    >
      <div
        className={twMerge(
          "relative",
          getLargeScreenHeightClass(),
          getSmallScreenHeightClass(),
          getSquareAspectRatioClass(),
        )}
      >
        <div
          className={twMerge(
            "origin -z-10 flex h-auto w-full flex-wrap items-center gap-1.5 rounded-t-lg bg-ui-panel p-2 text-white",
            camAspect !== CameraAspectRatio.VERTICAL_9_16
              ? "justify-between"
              : "flex-col justify-center",
            camAspect === CameraAspectRatio.SQUARE_1_1 && "justify-center",
          )}
        >
          <div
            className={twMerge(
              "ms-1 flex grow items-center gap-2",
              camAspect === CameraAspectRatio.VERTICAL_9_16 &&
                "-ms-1 justify-center",
            )}
          >
            <FontAwesomeIcon icon={faCameraViewfinder} className="text-sm" />
            <p className="mt-[2px] text-sm font-medium">Camera View</p>
          </div>

          <div className="flex gap-1.5">
            {editorState === EditorStates.CAMERA_VIEW && (
              <Tooltip content="Toggle Letterbox" position={"top"}>
                <ButtonIcon
                  icon={editorLetterBox ? faBlinds : faBlindsRaised}
                  onClick={() => toggleEditorLetterBox()}
                  className="h-7 w-7"
                />
              </Tooltip>
            )}

            <Button
              variant="secondary"
              onClick={handleButtonCameraView}
              className="rounded-md px-2 py-1 text-sm"
            >
              {editorState === EditorStates.EDIT ? "Enter View" : "Exit View"}
            </Button>
          </div>
        </div>
        <div
          className={twMerge(
            "relative overflow-hidden rounded-b-lg border border-gray-600",
            camAspect === CameraAspectRatio.HORIZONTAL_16_9
              ? "aspect-[16/9]"
              : camAspect === CameraAspectRatio.VERTICAL_9_16
                ? "aspect-[9/16]"
                : camAspect === CameraAspectRatio.SQUARE_1_1
                  ? "aspect-[1/1]"
                  : "aspect-video",
          )}
        >
          <div className="flex h-full w-full items-center justify-center bg-ui-panel">
            <FontAwesomeIcon icon={faSpinnerThird} size={"3x"} spin />
          </div>
          <div className="absolute left-0 top-0 h-full w-full overflow-hidden">
            <CameraViewCanvas className="!h-full !w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
