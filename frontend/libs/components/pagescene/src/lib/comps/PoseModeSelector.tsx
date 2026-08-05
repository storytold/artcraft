import React from "react";
import { useShallow } from "zustand/shallow";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button } from "@storyteller/ui-button";
import {
  faCheck,
  faFilm,
  faPersonRunning,
} from "@fortawesome/pro-solid-svg-icons";
import { usePageSceneStore } from "../PageSceneStore";
import { getActiveEditor } from "../contexts/EngineContext/EngineContext";
import { openAnimationsModal } from "../actions";

interface PoseModeSelectorProps {}

export const PoseModeSelector: React.FC<PoseModeSelectorProps> = () => {
  const { poseMode, showPoseControls, setPoseMode } = usePageSceneStore(
    useShallow((s) => ({
      poseMode: s.poseMode,
      showPoseControls: s.showPoseControls,
      setPoseMode: s.setPoseMode,
    })),
  );

  const handleModeChange = () => {
    setPoseMode(poseMode === "select" ? "pose" : "select");
    getActiveEditor()?.mouse_controls?.toggleFKMode();
  };

  if (!showPoseControls) {
    return null;
  }

  return (
    <div
      className="fixed left-1/2 top-32 flex -translate-x-1/2 transform items-center justify-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Tooltip
        content={"Toggle pose mode (K)"}
        position={"bottom"}
        delay={300}
        closeOnClick={true}
      >
        <>
          {poseMode === "select" ? (
            <Button
              icon={faPersonRunning}
              onClick={handleModeChange}
              className="rounded-xl shadow-xl outline-none focus-visible:outline-none"
            >
              Enter Pose Mode
            </Button>
          ) : (
            <Button
              icon={faCheck}
              onClick={handleModeChange}
              className="rounded-xl outline-none  focus-visible:outline-none"
            >
              Done
            </Button>
          )}
        </>
      </Tooltip>
      {/* Animations-only library for the selected character. Hidden while
          posing so the row stays a single "Done" affordance. */}
      {poseMode === "select" && (
        <Tooltip
          content={"Add an animation to this character"}
          position={"bottom"}
          delay={300}
          closeOnClick={true}
        >
          <Button
            icon={faFilm}
            onClick={() => openAnimationsModal()}
            className="rounded-xl shadow-xl outline-none focus-visible:outline-none"
          >
            Add Animation
          </Button>
        </Tooltip>
      )}
    </div>
  );
};
