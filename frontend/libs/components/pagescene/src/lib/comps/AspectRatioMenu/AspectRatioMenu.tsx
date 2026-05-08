import {
  faRectangle,
  faRectangleVertical,
  faSquare,
} from "@fortawesome/pro-solid-svg-icons";
import { useContext } from "react";
import { CameraAspectRatio } from "../../enums";
import { setCameraAspect } from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { EngineContext } from "../../contexts/EngineContext";
import { ButtonDropdown } from "@storyteller/ui-button-dropdown";

const ICON_BY_RATIO: Record<CameraAspectRatio, typeof faRectangle> = {
  [CameraAspectRatio.HORIZONTAL_16_9]: faRectangle,
  [CameraAspectRatio.VERTICAL_9_16]: faRectangleVertical,
  [CameraAspectRatio.HORIZONTAL_3_2]: faRectangle,
  [CameraAspectRatio.VERTICAL_2_3]: faRectangleVertical,
  [CameraAspectRatio.SQUARE_1_1]: faSquare,
};

const LABEL_BY_RATIO: Record<CameraAspectRatio, string> = {
  [CameraAspectRatio.HORIZONTAL_16_9]: "16:9 Horizontal",
  [CameraAspectRatio.VERTICAL_9_16]: "9:16 Vertical",
  [CameraAspectRatio.HORIZONTAL_3_2]: "3:2 Horizontal",
  [CameraAspectRatio.VERTICAL_2_3]: "2:3 Vertical",
  [CameraAspectRatio.SQUARE_1_1]: "1:1 Squared",
};

export const AspectRatioMenu = () => {
  const aspect = usePageSceneStore((s) => s.cameraAspectRatio);
  const editor = useContext(EngineContext);

  const handleChangeAspectRatio = (newRatio: CameraAspectRatio) => {
    if (!editor) return;
    setCameraAspect(editor, newRatio);
  };

  return (
    <div className="absolute right-0 top-0 m-2 flex flex-col items-end">
      <ButtonDropdown
        label={LABEL_BY_RATIO[aspect]}
        className="shadow-xl"
        icon={ICON_BY_RATIO[aspect]}
        align="right"
        showSelected={true}
        options={[
          {
            label: "16:9",
            icon: faRectangle,
            className: "pl-4",
            description: "Horizontal",
            selected: aspect === CameraAspectRatio.HORIZONTAL_16_9,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.HORIZONTAL_16_9),
          },
          {
            label: "3:2",
            icon: faRectangle,
            className: "pl-4",
            description: "Horizontal",
            selected: aspect === CameraAspectRatio.HORIZONTAL_3_2,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.HORIZONTAL_3_2),
          },
          {
            label: "2:3",
            icon: faRectangleVertical,
            className: "pl-4",
            description: "Vertical",
            selected: aspect === CameraAspectRatio.VERTICAL_2_3,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.VERTICAL_2_3),
          },
          {
            label: "9:16",
            icon: faRectangleVertical,
            className: "pl-4",
            description: "Vertical",
            selected: aspect === CameraAspectRatio.VERTICAL_9_16,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.VERTICAL_9_16),
          },
          {
            label: "1:1",
            icon: faSquare,
            className: "pl-4",
            description: "Squared",
            selected: aspect === CameraAspectRatio.SQUARE_1_1,
            onClick: () =>
              handleChangeAspectRatio(CameraAspectRatio.SQUARE_1_1),
          },
        ]}
      />
    </div>
  );
};
