import { useSignals } from "@preact/signals-react/runtime";
import {
  faRectangle,
  faRectangleVertical,
  faSquare,
} from "@fortawesome/pro-solid-svg-icons";
import { useContext } from "react";
import { CameraAspectRatio } from "~/pages/PageEnigma/enums";
import { cameraAspectRatio } from "~/pages/PageEnigma/signals";
import { setCameraAspect } from "~/pages/PageEnigma/actions";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { ButtonDropdown } from "@storyteller/ui-button-dropdown";

export const AspectRatioMenu = () => {
  useSignals();
  const editor = useContext(EngineContext);
  const buttonIcon =
    cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9
      ? faRectangle
      : cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16
        ? faRectangleVertical
        : cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_3_2
          ? faRectangle
          : cameraAspectRatio.value === CameraAspectRatio.VERTICAL_2_3
            ? faRectangleVertical
            : faSquare;
  const buttonText =
    cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9
      ? "16:9 Horizontal"
      : cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16
        ? "9:16 Vertical"
        : cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_3_2
          ? "3:2 Horizontal"
          : cameraAspectRatio.value === CameraAspectRatio.VERTICAL_2_3
            ? "2:3 Vertical"
            : "1:1 Squared";

  const handleChangeAspectRatio = (newRatio: CameraAspectRatio) => {
    if (!editor) return;
    setCameraAspect(editor, newRatio);
  };
  return (
    <div className="absolute right-0 top-0 m-2 flex flex-col items-end">
      <ButtonDropdown
        label={`${buttonText}`}
        className="shadow-xl"
        icon={buttonIcon}
        align="right"
        showSelected={true}
        options={[
          {
            label: "16:9",
            icon: faRectangle,
            className: "pl-4",
            description: "Horizontal",
            selected:
              cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_16_9,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.HORIZONTAL_16_9),
          },
          {
            label: "3:2",
            icon: faRectangle,
            className: "pl-4",
            description: "Horizontal",
            selected:
              cameraAspectRatio.value === CameraAspectRatio.HORIZONTAL_3_2,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.HORIZONTAL_3_2),
          },
          {
            label: "2:3",
            icon: faRectangleVertical,
            className: "pl-4",
            description: "Vertical",
            selected:
              cameraAspectRatio.value === CameraAspectRatio.VERTICAL_2_3,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.VERTICAL_2_3),
          },
          {
            label: "9:16",
            icon: faRectangleVertical,
            className: "pl-4",
            description: "Vertical",
            selected:
              cameraAspectRatio.value === CameraAspectRatio.VERTICAL_9_16,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.VERTICAL_9_16),
          },
          {
            label: "1:1",
            icon: faSquare,
            className: "pl-4",
            description: "Squared",
            selected: cameraAspectRatio.value === CameraAspectRatio.SQUARE_1_1,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.SQUARE_1_1),
          },
        ]}
      />
    </div>
  );
};
