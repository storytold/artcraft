import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BoxesIcon, LayersIcon, XIcon } from "lucide-react";
import { SceneSplashCard } from "./splash/SceneSplashCard";
import { EXAMPLE_SCENES } from "./splash/example-scenes";

// Demo-mode affordance fed into Stage3D's `promptboxAboveStackSlot`
// (lib slot rendered just above the promptbox stack). Collapsed: a
// pill that fades in below the model. Expanded: an inline panel that
// grows upward with the same horizontal lane as the promptbox, listing
// the curated example scenes minus the one the user is on. Clicking a
// card navigates to `/edit-3d/${sceneToken}?image=${outputToken}` —
// same shape as the splash modal's pickExample.
//
// Rendering through the lib's slot (instead of as a separately
// absolutely-positioned overlay) means the lib's `bottom-4` anchor
// owns the vertical math: the slot is part of the same `flex flex-col
// gap-3` stack as the prompt card and toolbar, so it never overlaps
// the prompt input regardless of how tall the textarea has grown. The
// host doesn't need to measure anything.

interface OtherScenesOverlayProps {
  currentSceneToken: string | undefined;
  demoOutputToken: string | null;
}

export function OtherScenesOverlay({
  currentSceneToken,
  demoOutputToken,
}: OtherScenesOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const otherScenes = useMemo(
    () => EXAMPLE_SCENES.filter((s) => s.sceneToken !== currentSceneToken),
    [currentSceneToken],
  );

  if (!demoOutputToken || otherScenes.length === 0) return null;

  const handlePick = (sceneToken: string, outputToken: string) => {
    setIsOpen(false);
    navigate(`/edit-3d/${sceneToken}?image=${outputToken}`);
  };

  return (
    <div className="flex justify-center">
      {isOpen ? (
        <ExpandedPanel
          scenes={otherScenes}
          onClose={() => setIsOpen(false)}
          onPick={handlePick}
        />
      ) : (
        <CollapsedPill onClick={() => setIsOpen(true)} />
      )}
    </div>
  );
}

function CollapsedPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 bg-white px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-colors hover:bg-white/80 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <BoxesIcon  className="h-3.5 w-3.5" />
      <span>See other demo scenes</span>
    </button>
  );
}

interface ExpandedPanelProps {
  scenes: readonly (typeof EXAMPLE_SCENES)[number][];
  onClose: () => void;
  onPick: (sceneToken: string, outputToken: string) => void;
}

function ExpandedPanel({ scenes, onClose, onPick }: ExpandedPanelProps) {
  return (
    <div className="glass w-[860px] max-w-[90vw] overflow-hidden rounded-[3px] border border-ui-controls-border animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between border-b border-ui-controls-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <LayersIcon

            className="h-3 w-3 text-primary" />
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-base-fg">
            Other demo scenes
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close other scenes"
          className="flex h-6 w-6 items-center justify-center text-base-fg/60 transition-colors hover:bg-ui-controls hover:text-base-fg"
        >
          <XIcon  className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
        {scenes.map((scene) => (
          <SceneSplashCard
            key={scene.id}
            variant="example"
            title={scene.title}
            description={scene.description}
            accentClass={scene.accentClass}
            outputToken={scene.outputToken}
            onClick={() => onPick(scene.sceneToken, scene.outputToken)}
          />
        ))}
      </div>
    </div>
  );
}
