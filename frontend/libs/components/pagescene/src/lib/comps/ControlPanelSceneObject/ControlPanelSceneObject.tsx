import {
  ChangeEvent,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Transition } from "@headlessui/react";
import {
  faChevronDown,
  faChevronUp,
  faCube,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { EngineContext } from "../../contexts/EngineContext";
import { InputVector } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { usePageSceneStore } from "../../PageSceneStore";
import { twMerge } from "tailwind-merge";
import { sanitize } from "./utils/sanitize";
import { objectMismatch } from "./utils/objectMismatch";
import { XYZ } from "../../datastructures/common";
import { useViewportSize } from "../../hooks/useViewportSize";
import { DraggablePrecisionMutator } from "./DraggablePrecisionMutator";
import { beginColorSession, ColorSession } from "../../actions/setObjectColor";
import {
  beginTransformSession,
  TransformSession,
} from "../../actions/transformObject";

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
  const disableHotkeyInput = usePageSceneStore((s) => s.disableHotkeyInput);
  const enableHotkeyInput = usePageSceneStore((s) => s.enableHotkeyInput);
  const isShowing = usePageSceneStore((s) => s.objectPanelShowing);
  const currentSceneObject = usePageSceneStore((s) => s.objectPanelCurrent);

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

  // Pending transform session — opened on first panel edit, committed
  // when the *selection's uuid* actually changes (NOT on every per-frame
  // updateSelectedUI re-push that just creates a new currentSceneObject
  // reference for the same uuid). lastUuidRef tracks the previous uuid
  // so the commit effect can distinguish a real selection change from
  // a same-uuid resync.
  const transformSessionRef = useRef<TransformSession | null>(null);
  const lastUuidRef = useRef<string | null>(null);

  const beginPanelTransform = () => {
    if (transformSessionRef.current) return;
    if (!editorEngine || !currentSceneObject) return;
    transformSessionRef.current = beginTransformSession(
      editorEngine,
      currentSceneObject.object_uuid,
    );
  };

  const commitPanelTransform = () => {
    transformSessionRef.current?.commit();
    transformSessionRef.current = null;
  };

  // Color picker session — opened on input focus (picker dialog opens),
  // committed on input blur (picker dialog closes). Records exactly one
  // ColorAction per pick regardless of how many onChange events the
  // native picker fires while the user drags the slider.
  const colorSessionRef = useRef<ColorSession | null>(null);

  const colorInputId = useId();

  // Single source of truth for "which object the panel is acting on" —
  // the same store slice the transform path uses. The color path used
  // to read editorEngine?.selected?.* instead, which can be undefined/
  // stale relative to objectPanelCurrent, so picks silently no-oped.
  const selectedUuid = currentSceneObject?.object_uuid;

  // Guarantee an active color session before applying. Don't rely on
  // the hidden color input's onFocus firing (it's opacity-0/absolute,
  // and a missed onFocus would make apply() a no-op). beginColorSession
  // snapshots the before-state on first call, so a lazily-created
  // session still records a single correct undo entry.
  const ensureColorSession = () => {
    if (!editorEngine || !selectedUuid) return;
    if (!colorSessionRef.current) {
      colorSessionRef.current = beginColorSession(editorEngine, selectedUuid);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

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
    editorEngine.sceneManager?.updateSelectedTransform(
      localToEngine(localPosition),
      localToEngine(localRotation),
      localToEngine(localScale),
    );
  }, [inputsUpdated, localPosition, localRotation, localScale, editorEngine]);

  useEffect(() => {
    if (!editorEngine || !currentSceneObject) {
      return;
    }

    // The per-frame `updateSelectedUI` in the engine pushes a fresh
    // `currentSceneObject` object into the store every frame the
    // selected obj's transform changes. That re-fires this effect with
    // the *same* uuid but new vectors. Only an actual selection change
    // (different uuid) is a real session boundary — commit the pending
    // session for the previous uuid before we resync local state.
    if (
      lastUuidRef.current !== null &&
      lastUuidRef.current !== currentSceneObject.object_uuid
    ) {
      commitPanelTransform();
    }
    lastUuidRef.current = currentSceneObject.object_uuid;

    const vectors = currentSceneObject.objectVectors;

    // local state relies on strings
    setLocalPosition(engineToLocal(vectors.position));
    setLocalRotation(engineToLocal(vectors.rotation));
    setLocalScale(engineToLocal(vectors.scale));

    setLocked(editorEngine.selection.isObjectLocked(selectedUuid || ""));
    // Read the swatch from the panel's actual object (same uuid the
    // write path uses), not editorEngine.selected which can be stale.
    const selectedObj = selectedUuid
      ? editorEngine.activeScene?.get_object_by_uuid(selectedUuid)
      : undefined;
    setColor((selectedObj?.userData?.color as string) ?? "#ffffff");
    // No cleanup function — uuid-change commit lives in the body
    // above. Unmount commit is handled by the separate effect below.
  }, [currentSceneObject, editorEngine]);

  // Final commit on panel unmount.
  useEffect(() => {
    return () => commitPanelTransform();
  }, []);

  // Document-level commit triggers for the transform session. These
  // are the natural "end of edit gesture" signals — without them, a
  // pending session sits open during same-uuid editing and Ctrl+Z
  // falls through to a prior entry (often the CreateAction that
  // added the shape, so the shape disappears on undo).
  //
  // - mouseup: end of an InputVector numeric-scrub drag, OR a click
  //   that moves focus away after typing.
  // - Enter: explicit "I'm done" without losing focus.
  // - Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z (capture phase): flush before the
  //   engine's keymap handler runs the undo, so the pending entry is
  //   the one being reverted.
  //
  // Scoped to `isShowing` so the listeners aren't attached when the
  // panel is hidden (notably during CAMERA_VIEW, where stray
  // document mouseup/keydown listeners can interact poorly with the
  // freecam pointer-capture and canvas keydown handlers).
  useEffect(() => {
    if (!isShowing) return;
    const flush = () => {
      transformSessionRef.current?.commit();
      transformSessionRef.current = null;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") flush();
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.code === "KeyZ" || e.code === "KeyY")
      ) {
        flush();
      }
    };
    document.addEventListener("mouseup", flush);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mouseup", flush);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [isShowing]);

  // Must come before the early return below — hooks have to run in
  // the same order every render or React errors with "rendered more
  // hooks than during the previous render".
  const viewport = useViewportSize();
  const getScale = () => {
    const height = viewport.height - 56;
    return height < 620 ? height / 620 : 1;
  };

  if (!currentSceneObject) {
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
      beginPanelTransform();
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
      beginPanelTransform();
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
      beginPanelTransform();
      setInputsUpdated(true);
    }
    setLocalScale(xyz);
  };

  const handleDeleteObject = () => {
    editorEngine?.deleteObject(currentSceneObject.object_uuid);
  };

  return (
    <Transition
      as="div"
      show={isShowing}
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
          <p className="font-semibold text-sm">Color</p>
          {/* Native <input type="color"> is nested INSIDE the Button's
              <label> so Safari opens the picker reliably. Safari refuses
              to open a color picker triggered via label[htmlFor]→input
              when the input has no layout box (the prior h-0 w-0 setup).
              Positioning it absolute over the swatch keeps the click
              area identical to the visible button. */}
          <Button
            className="cursor-pointer p-3.5 w-full relative overflow-hidden"
            htmlFor={colorInputId}
            style={{
              backgroundColor: color,
            }}
          >
            <input
              className="absolute inset-0 cursor-pointer opacity-0"
              id={colorInputId}
              type="color"
              value={color ?? "#ffffff"}
              disabled={locked || !selectedUuid}
              onFocus={() => {
                // Normal path: picker opening → start the session that
                // captures the before-state once.
                ensureColorSession();
              }}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                // Native color picker fires per-pixel during slider
                // drag. ensureColorSession() guarantees apply() reaches
                // editor.activeScene.setColor even if onFocus didn't
                // fire. Recording happens once on blur.
                const after = e.target.value;
                ensureColorSession();
                colorSessionRef.current?.apply(after);
                setColor(after);
              }}
              onBlur={() => {
                colorSessionRef.current?.commit();
                colorSessionRef.current = null;
              }}
            />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-sm">Location</p>
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

        <div className="flex flex-col gap-2">
          <p className="font-semibold text-sm">Rotation</p>
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

        <div className="mb-1 flex flex-col gap-2">
          <DraggablePrecisionMutator onChange={handleUniformScaleChange}>
            <p className="font-semibold text-sm">Scale</p>
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
