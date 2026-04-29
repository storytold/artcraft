import { useSignals } from "@preact/signals-react/runtime";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBlinds,
  faBlindsRaised,
  faCameraViewfinder,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import {
  cameraAspectRatio,
  editorState,
  editorLetterBox,
  toggleEditorLetterBox,
  sidePanelHeight,
  outlinerIsShowing,
} from "~/pages/PageEnigma/signals";
import { pageWidth } from "~/signals";
import { CameraAspectRatio, EditorStates } from "~/pages/PageEnigma/enums";
import { CameraViewCanvas } from "~/pages/PageEnigma/comps/EngineCanvases";
import { ButtonIcon } from "@storyteller/ui-button-icon";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useEffect } from "react";

export const PreviewEngineCamera = () => {
  useSignals();

  const handleButtonCameraView = () => {
    // TODO: wire to editor.toggleCameraView() once editor.ts is migrated.
  };

  const getLargeScreenHeightClass = () => {
    if (cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16) {
      return pageWidth.value >= 2000
        ? "w-44 justify-center"
        : "w-36 justify-center";
    } else {
      return pageWidth.value >= 2000
        ? "w-72 justify-between"
        : "w-64 justify-between";
    }
  };

  const getSmallScreenHeightClass = () => {
    if (
      cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16 &&
      sidePanelHeight.value < 2000 &&
      outlinerIsShowing.value
    ) {
      return "w-40 justify-center";
    }
    return "";
  };

  const getSquareAspectRatioClass = () => {
    if (cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1) {
      return pageWidth.value >= 2000
        ? "w-[240px] justify-between"
        : "w-60 justify-between";
    }
  };

  useEffect(() => {
    console.log("Editor state changed:", editorState.value);
  }, [editorState.value]);

  return (
    <div
      id="preview-engine-camera"
      className={twMerge(
        "hidden origin-bottom-left shadow-lg", //hidden right now with css
        editorState.value === EditorStates.PREVIEW
          ? "invisible h-0 w-0"
          : "visible",
      )}
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
            cameraAspectRatio.value !== CameraAspectRatio.VERTICAL_9_16
              ? "justify-between"
              : "flex-col justify-center",
            cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1 &&
              "justify-center",
          )}
        >
          <div
            className={twMerge(
              "ms-1 flex grow items-center gap-2",
              cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16 &&
                "-ms-1 justify-center",
            )}
          >
            <FontAwesomeIcon icon={faCameraViewfinder} className="text-sm" />
            <p className="mt-[2px] text-sm font-medium">Camera View</p>
          </div>

          <div className="flex gap-1.5">
            {editorState.value === EditorStates.CAMERA_VIEW && (
              <Tooltip content="Toggle Letterbox" position={"top"}>
                <ButtonIcon
                  icon={editorLetterBox.value ? faBlinds : faBlindsRaised}
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
              {editorState.value === EditorStates.EDIT
                ? "Enter View"
                : "Exit View"}
            </Button>
          </div>
        </div>
        <div
          className={twMerge(
            "relative overflow-hidden rounded-b-lg border border-gray-600",
            cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9
              ? "aspect-[16/9]"
              : cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16
                ? "aspect-[9/16]"
                : cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1
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
