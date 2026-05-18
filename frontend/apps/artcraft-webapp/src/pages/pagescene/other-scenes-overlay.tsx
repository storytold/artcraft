import { RefObject, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCubes,
  faLayerGroup,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { SceneSplashCard } from "./splash/SceneSplashCard";
import { EXAMPLE_SCENES } from "./splash/example-scenes";

// Floating affordance shown only in demo mode (URL has `?output=`).
// Collapsed: a prominent pill above the promptbox; expanded: an inline
// panel that fades in over the canvas with the curated example scenes
// minus the one the user is currently viewing. Clicking a card
// navigates to that scene's demo URL — same shape as the splash modal's
// pickExample.
//
// The promptbox is rendered by the @storyteller/ui-pagescene lib at
// `bottom-4` and grows upward as the user types or opens the image-
// prompt row, so a static `bottom-N` here would collide with a tall
// promptbox (see screenshots in the design review). We track the
// promptbox's actual height via a ResizeObserver on the wrapper and
// stack our overlay just above whatever the current height is.

const GAP_ABOVE_PROMPTBOX_PX = 12;
const FALLBACK_BOTTOM_PX = 128;

interface OtherScenesOverlayProps {
  currentSceneToken: string | undefined;
  demoOutputToken: string | null;
  wrapperRef: RefObject<HTMLDivElement | null>;
}

export function OtherScenesOverlay({
  currentSceneToken,
  demoOutputToken,
  wrapperRef,
}: OtherScenesOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bottomPx = usePromptboxTopOffset(wrapperRef);
  const navigate = useNavigate();

  const otherScenes = useMemo(
    () => EXAMPLE_SCENES.filter((s) => s.sceneToken !== currentSceneToken),
    [currentSceneToken],
  );

  if (!demoOutputToken || otherScenes.length === 0) return null;

  const handlePick = (sceneToken: string, outputToken: string) => {
    setIsOpen(false);
    navigate(`/edit-3d/${sceneToken}?output=${outputToken}`);
  };

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
      style={{ bottom: bottomPx }}
    >
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
      className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-primary/40 bg-gradient-to-r from-primary/90 to-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:from-primary hover:to-primary animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <FontAwesomeIcon icon={faCubes} className="h-3.5 w-3.5" />
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
    <div className="glass pointer-events-auto w-[860px] max-w-[90vw] overflow-hidden rounded-xl border border-ui-controls-border shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between border-b border-ui-controls-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faLayerGroup}
            className="h-3 w-3 text-primary"
          />
          <div className="text-xs font-semibold uppercase tracking-wider text-base-fg">
            Other demo scenes
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close other scenes"
          className="flex h-6 w-6 items-center justify-center rounded-full text-base-fg/60 transition-colors hover:bg-ui-controls hover:text-base-fg"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
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

// Returns the `bottom` value (px) that places content immediately above
// the promptbox. The promptbox is owned by the @storyteller/ui-pagescene
// lib at `bottom-4` and grows as the user types or opens the image-
// prompt row, so we discover its DOM node via querySelector +
// MutationObserver and track its height with a ResizeObserver. We
// intentionally do NOT track the OnboardingHelper at `bottom-56` — that
// chip should stay above this button, not the other way around, so we
// let it occupy its natural slot up the page.
function usePromptboxTopOffset(
  wrapperRef: RefObject<HTMLDivElement | null>,
): number {
  const [bottomPx, setBottomPx] = useState<number>(FALLBACK_BOTTOM_PX);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const tracked = new Set<HTMLElement>();

    const recompute = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      let highest = 0;
      tracked.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Skip zero-height nodes (e.g. mid-leave transition / display:none).
        if (rect.height === 0) return;
        const topFromBottom = wrapperRect.bottom - rect.top;
        if (topFromBottom > highest) highest = topFromBottom;
      });
      setBottomPx(
        highest === 0
          ? FALLBACK_BOTTOM_PX
          : Math.round(highest + GAP_ABOVE_PROMPTBOX_PX),
      );
    };

    const sizeObserver = new ResizeObserver(recompute);

    const syncTracked = () => {
      const next = collectBottomAnchors(wrapper);
      tracked.forEach((el) => {
        if (!next.has(el)) {
          sizeObserver.unobserve(el);
          tracked.delete(el);
        }
      });
      next.forEach((el) => {
        if (!tracked.has(el)) {
          sizeObserver.observe(el);
          tracked.add(el);
        }
      });
      recompute();
    };

    syncTracked();

    const mutationObserver = new MutationObserver(syncTracked);
    mutationObserver.observe(wrapper, { childList: true, subtree: true });

    return () => {
      sizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [wrapperRef]);

  return bottomPx;
}

// Locates the promptbox stack — the `absolute bottom-4 ... flex flex-col`
// wrapper around the image row + textarea card + toolbar — via the
// textarea (the lib renders exactly one in the editor wrapper).
function collectBottomAnchors(wrapper: HTMLElement): Set<HTMLElement> {
  const result = new Set<HTMLElement>();
  const textarea = wrapper.querySelector("textarea");
  const promptbox = textarea?.closest('[class*="bottom-4"]');
  if (promptbox instanceof HTMLElement) result.add(promptbox);
  return result;
}
