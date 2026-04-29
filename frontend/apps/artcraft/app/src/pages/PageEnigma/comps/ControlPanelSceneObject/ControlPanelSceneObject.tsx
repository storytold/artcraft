import { ChangeEvent, useContext, useEffect, useId, useState } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { Transition } from "@headlessui/react";
import {
  faChevronDown,
  faChevronUp,
  faCube,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { objectPanel as objectPanelSignals } from "../../signals";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { InputVector } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";
import { twMerge } from "tailwind-merge";
import { EditorStates } from "~/pages/PageEnigma/enums";
import { sanitize } from "./utils/sanitize";
import { objectMismatch } from "~/pages/PageEnigma/comps/ControlPanelSceneObject/utils/objectMismatch";
import { XYZ } from "~/pages/PageEnigma/datastructures/common";
import { pageHeight } from "~/signals";
import { DraggablePrecisionMutator } from "./DraggablePrecisionMutator";

// TODO this will be useful later to fix the bug on leading zeros
// const formatNumber = (input: string): number => {
//   // Convert the input string to a number to remove leading zeros
//   const num = parseFloat(input);
//   // Convert the number back to a string with at least two decimal places
//   const str = num.toFixed(2);
//   return parseFloat(str);
// };

const defaultAxises: Record<string, string> = {
  x: "0",
  y: "0",
  z: "0",
};

export const ControlPanelSceneObject = () => {
  useSignals();
  const editorState = usePageEnigmaStore((s) => s.editorState);
  const disableHotkeyInput = usePageEnigmaStore((s) => s.disableHotkeyInput);
  const enableHotkeyInput = usePageEnigmaStore((s) => s.enableHotkeyInput);
  const { isShowing, currentObject } = objectPanelSignals;

  const editorEngine = useContext(EngineContext);

  // const [appUiState] = useContext(AppUiContext);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // local translation axises to allow for validation before handing them to the engine
  const [localPosition, setLocalPosition] = useState(defaultAxises);
  const [localRotation, setLocalRotation] = useState(defaultAxises);
  const [localScale, setLocalScale] = useState(defaultAxises);

  // used to update engine object
  const [inputsUpdated, setInputsUpdated] = useState(false);

  const [locked, setLocked] = useState(false);

  const [color, setColor] = useState("#ffffff");

  const colorInputId = useId();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const currentSceneObject = currentObject.value;

  function localToEngine(xyz: Record<string, string>) {
    return {
      x: parseFloat(xyz.x),
      y: parseFloat(xyz.y),
      z: parseFloat(xyz.z),
    };
  }
  function engineToLocal(xyz: XYZ) {
    return {
      x: xyz.x.toString(),
      y: xyz.y.toString(),
      z: xyz.z.toString(),
    };
  }

  useEffect(() => {
    if (!inputsUpdated || !editorEngine) {
      return;
    }

    setInputsUpdated(false);
    editorEngine.setSelectedObject(
      localToEngine(localPosition),
      localToEngine(localRotation),
      localToEngine(localScale),
    );
  }, [inputsUpdated, localPosition, localRotation, localScale, editorEngine]);

  useEffect(() => {
    if (!editorEngine || !currentSceneObject) {
      return;
    }

    const vectors = currentSceneObject.objectVectors;

    // local state relies on strings
    setLocalPosition(engineToLocal(vectors.position));
    setLocalRotation(engineToLocal(vectors.rotation));
    setLocalScale(engineToLocal(vectors.scale));

    setLocked(editorEngine.isObjectLocked(editorEngine?.selected?.uuid || ""));
    setColor(editorEngine?.selected?.userData.color);
  }, [currentSceneObject, editorEngine]);

  if (!currentSceneObject || editorState === EditorStates.PREVIEW) {
    return null;
  }

  const isInvalid = (xyz: Record<string, string>) =>
    Object.values(xyz).some((value) => {
      if (value === "" || value === "-" || value === ".") {
        return true;
      }
      return !/^-?[0-9]*(.[0-9]*)?$/.test(value);
    });

  const handlePositionChange = (xyz: Record<string, string>) => {
    if (isInvalid(xyz)) {
      setLocalPosition(xyz);
      return;
    }
    const cleanXyz = sanitize(xyz);
    if (objectMismatch(localPosition, cleanXyz)) {
      setInputsUpdated(true);
    }
    setLocalPosition(xyz);
  };

  const handleRotationChange = (xyz: Record<string, string>) => {
    if (isInvalid(xyz)) {
      setLocalRotation(xyz);
      return;
    }
    const cleanXyz = sanitize(xyz);
    if (objectMismatch(localRotation, cleanXyz)) {
      setInputsUpdated(true);
    }
    setLocalRotation(xyz);
  };

  const handleUniformScaleChange = (scale: number) => {
    const updatedScaleValues: Record<string, string> = {};
    updatedScaleValues.x = (parseFloat(localScale.x) + scale).toString();
    updatedScaleValues.y = (parseFloat(localScale.y) + scale).toString();
    updatedScaleValues.z = (parseFloat(localScale.z) + scale).toString();

    handleScaleChange(updatedScaleValues);
  };

  const handleScaleChange = (xyz: Record<string, string>) => {
    if (isInvalid(xyz)) {
      setLocalScale(xyz);
      return;
    }
    const cleanXyz = sanitize(xyz);
    if (objectMismatch(localScale, cleanXyz)) {
      setInputsUpdated(true);
    }
    setLocalScale(xyz);
  };

  const handleDeleteObject = () => {
    editorEngine?.deleteObject(currentSceneObject.object_uuid);
  };

  const getScale = () => {
    const height = pageHeight.value - 56;
    return height < 620 ? height / 620 : 1;
  };

  return (
    <Transition
      as="div"
      show={isShowing.value}
      className={twMerge(
        "glass absolute bottom-16 right-0 mb-4 mr-4 flex h-fit w-56 origin-bottom-right flex-col gap-2 rounded-lg border border-ui-panel-border p-3.5 text-white shadow-lg",
      )}
      enter="transition-opacity duration-150"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      style={{ transform: `scale(${getScale()})` }}
    >
      <div className="mb-1 flex justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faCube} />
          <p className="max-w-36 truncate font-semibold">
            {currentSceneObject.object_name.charAt(0).toUpperCase() +
              currentSceneObject.object_name.slice(1)}
          </p>
        </div>
        <FontAwesomeIcon
          icon={isCollapsed ? faChevronUp : faChevronDown}
          onClick={toggleCollapse}
          className="cursor-pointer opacity-75 transition-opacity duration-100 ease-in-out hover:opacity-50"
        />
      </div>

      <Transition
        as="div"
        show={!isCollapsed}
        enter="transition-all duration-200 ease-in-out"
        enterFrom="opacity-0 max-h-0"
        enterTo="opacity-100 max-h-96"
        leave="transition-all duration-200 ease-in-out"
        leaveFrom="opacity-100 max-h-96"
        leaveTo="opacity-0 max-h-0"
        className={"flex flex-col gap-2 overflow-y-auto"}
      >
        <div className="flex flex-col gap-1">
          <h5>Color</h5>
          <input
            className="h-0 w-0 cursor-pointer opacity-0"
            id={colorInputId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              editorEngine?.setColor(
                editorEngine?.selected?.uuid || "",
                e.target.value,
              );
              setColor(e.target.value);
            }}
            type="color"
            value={color}
            disabled={locked}
          />
          <Button
            className="cursor-pointer p-3.5"
            htmlFor={colorInputId}
            style={{
              backgroundColor: color,
            }}
          ></Button>
        </div>
        <div className="flex flex-col gap-1">
          <h5>Location</h5>
          <InputVector
            x={localPosition.x.toString()}
            y={localPosition.y.toString()}
            z={localPosition.z.toString()}
            onChange={handlePositionChange}
            disabled={locked}
            enableHotkeyInput={enableHotkeyInput}
            disableHotkeyInput={disableHotkeyInput}
          />
        </div>

        <div className="flex flex-col gap-1">
          <h5>Rotation</h5>
          <InputVector
            x={localRotation.x.toString()}
            y={localRotation.y.toString()}
            z={localRotation.z.toString()}
            onChange={handleRotationChange}
            increment={1}
            disabled={locked}
            enableHotkeyInput={enableHotkeyInput}
            disableHotkeyInput={disableHotkeyInput}
          />
        </div>

        <div className="mb-1 flex flex-col gap-1">
          <DraggablePrecisionMutator onChange={handleUniformScaleChange}>
            <h5>Scale</h5>
          </DraggablePrecisionMutator>
          <InputVector
            x={localScale.x.toString()}
            y={localScale.y.toString()}
            z={localScale.z.toString()}
            onChange={handleScaleChange}
            disabled={locked}
            enableHotkeyInput={enableHotkeyInput}
            disableHotkeyInput={disableHotkeyInput}
          />
        </div>
      </Transition>

      <div className="mt-0.5 flex gap-1.5">
        {/* <Button variant="action" className="grow" onClick={handleOnAddKeyFrame}>
          Add Keyframe (K)
        </Button> */}
        <Button
          variant="secondary"
          icon={faTrash}
          onClick={handleDeleteObject}
          className="w-full"
        >
          Delete
        </Button>
      </div>
    </Transition>
  );
};
