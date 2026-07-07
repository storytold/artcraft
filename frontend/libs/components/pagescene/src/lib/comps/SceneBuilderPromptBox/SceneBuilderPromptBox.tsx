import { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faClockRotateLeft,
  faWandMagicSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { usePrompt3DStore } from "@storyteller/ui-promptbox";
import { EngineContext } from "../../contexts/EngineContext";
import { createTimeline } from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { TimelineBar } from "../Timeline";

// The Build-mode promptbox. This is the (upcoming) MCP scene-builder tool:
// describe a change and Update applies it to the scene via the descriptor
// backend. Update is stubbed until that backend lands — it records the
// prompt on the engine + in history so the flow is exercisable. Also hosts
// the collapsed timeline bar (when a timeline exists) and the
// "Add animation timeline" affordance (when the scene is still static).
export const SceneBuilderPromptBox = () => {
  const editor = useContext(EngineContext);
  const prompt = usePrompt3DStore((s) => s.prompt);
  const setPrompt = usePrompt3DStore((s) => s.setPrompt);
  const promptHistory = usePrompt3DStore((s) => s.promptHistory);
  const pushPromptHistory = usePrompt3DStore((s) => s.pushPromptHistory);

  const timelineExists = usePageSceneStore((s) => s.timelineExists);
  const timelineExpanded = usePageSceneStore((s) => s.timelineExpanded);
  const setTimelineExpanded = usePageSceneStore((s) => s.setTimelineExpanded);

  const handleUpdate = () => {
    const trimmed = prompt.trim();
    if (!trimmed || !editor) return;
    // TODO(scene-builder): send { sceneDescriptor, prompt } to the MCP
    // backend and apply the returned descriptor. Stubbed for now.
    editor.positive_prompt = trimmed;
    pushPromptHistory(trimmed);
  };

  const handleAddTimeline = () => {
    if (!editor) return;
    createTimeline(editor);
    setTimelineExpanded(true);
  };

  return (
    <div className="absolute bottom-4 left-1/2 flex w-[90vw] max-w-3xl -translate-x-1/2 flex-col gap-3">
      {timelineExists && !timelineExpanded && <TimelineBar />}

      <div
        className="glass relative w-full rounded-2xl p-4 text-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2">
          <FontAwesomeIcon
            icon={faWandMagicSparkles}
            className="mt-1.5 h-4 w-4 shrink-0 text-base-fg/50"
          />
          <textarea
            rows={1}
            placeholder="Describe a change to the scene…"
            className="promptbox-scrollbar text-md max-h-[8em] min-h-[2.5em] w-full resize-y overflow-y-auto rounded bg-transparent pb-2 pt-1 text-base-fg placeholder-base-fg/50 focus:outline-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          {!timelineExists ? (
            <Button
              variant="secondary"
              icon={faPlus}
              className="flex h-9 items-center border border-ui-controls-border bg-ui-controls/60 px-3 text-sm text-base-fg backdrop-blur-lg hover:bg-ui-controls/90"
              onClick={handleAddTimeline}
            >
              Add animation timeline
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Tooltip
              content="Prompt history"
              position="top"
              className="z-50"
              delay={200}
              closeOnClick={true}
            >
              <PopoverMenu
                mode="toggle"
                panelTitle="Recent prompts"
                triggerIcon={
                  <FontAwesomeIcon icon={faClockRotateLeft} className="h-4 w-4" />
                }
                items={
                  promptHistory.length
                    ? promptHistory.map((p) => ({ label: p, selected: false }))
                    : [{ label: "No prompts yet", selected: false, disabled: true }]
                }
                onSelect={(item) => {
                  if (item.disabled) return;
                  setPrompt(item.label);
                }}
              />
            </Tooltip>
            <Button
              variant="primary"
              className="flex items-center border-none bg-brand-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleUpdate}
              disabled={!prompt.trim()}
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SceneBuilderPromptBox;
