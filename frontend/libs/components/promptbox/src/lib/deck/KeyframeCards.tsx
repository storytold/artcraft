import { useState } from "react";
import { Tooltip } from "@storyteller/ui-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightArrowLeft,
  faPlus,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { DeckAddAction, DeckItem } from "./deckTypes";
import {
  DeckAddMenu,
  DeckCard,
  DeckPreviewModal,
  DeckStyles,
} from "./DeckCard";

interface KeyframeCardsProps {
  firstFrame?: DeckItem;
  lastFrame?: DeckItem;
  /** Whether the model supports an ending keyframe. */
  showLastFrame: boolean;
  onFirstAddActions: DeckAddAction[];
  onLastAddActions?: DeckAddAction[];
  onRemoveFirst: () => void;
  onRemoveLast?: () => void;
  /** Exchange first/last frames; only shown when both are set. */
  onSwap?: () => void;
  className?: string;
}

/**
 * Dreamina-style keyframe widget: two slightly tilted "First frame" /
 * "Last frame" card slots with a swap glyph between them, sitting left of
 * the prompt text inside the promptbox.
 */
export const KeyframeCards = ({
  firstFrame,
  lastFrame,
  showLastFrame,
  onFirstAddActions,
  onLastAddActions = [],
  onRemoveFirst,
  onRemoveLast,
  onSwap,
  className,
}: KeyframeCardsProps) => {
  const [previewItem, setPreviewItem] = useState<DeckItem | null>(null);

  return (
    <div
      className={twMerge(
        "relative flex shrink-0 items-center self-start",
        className,
      )}
    >
      <DeckStyles />

      <DeckSlotCard
        item={firstFrame}
        label="First frame"
        tiltClass={showLastFrame ? "-rotate-6" : ""}
        addActions={onFirstAddActions}
        onRemove={onRemoveFirst}
        onPreview={setPreviewItem}
      />

      {showLastFrame && (
        <>
          <div className="z-10 -mx-1.5 flex items-center justify-center">
            {firstFrame && lastFrame && onSwap ? (
              <button
                type="button"
                onClick={onSwap}
                title="Swap frames"
                className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/60 text-[10px] text-white shadow backdrop-blur-md transition-all hover:scale-110 hover:bg-black/80"
              >
                <FontAwesomeIcon icon={faArrowRightArrowLeft} />
              </button>
            ) : (
              <div className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[10px] text-white/50 backdrop-blur-md">
                <FontAwesomeIcon icon={faArrowRightArrowLeft} />
              </div>
            )}
          </div>

          <DeckSlotCard
            item={lastFrame}
            label="Last frame"
            tiltClass="rotate-6"
            addActions={onLastAddActions}
            onRemove={onRemoveLast}
            onPreview={setPreviewItem}
          />
        </>
      )}

      <DeckPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
};

/**
 * One always-visible labeled reference slot: a dashed add card (with a
 * per-slot add menu when there are multiple actions) that becomes a DeckCard
 * once filled. Used for keyframes and for fixed named slots like the 3D
 * multi-view angles; the caller owns the DeckPreviewModal fed by onPreview.
 */
export const DeckSlotCard = ({
  item,
  label,
  tiltClass = "",
  addActions,
  onRemove,
  onPreview,
}: {
  item?: DeckItem;
  label: string;
  tiltClass?: string;
  addActions: DeckAddAction[];
  onRemove?: () => void;
  onPreview: (item: DeckItem) => void;
}) => {
  const enabledActions = addActions.filter((a) => !a.disabled);

  if (item) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <DeckCard
          item={item}
          onRemove={item.uploading ? undefined : onRemove}
          onClick={() => onPreview(item)}
          className={twMerge(tiltClass, "hover:z-10 hover:rotate-0")}
        />
        <span className="text-[9px] font-medium leading-none text-base-fg/60">
          {label}
        </span>
      </div>
    );
  }

  const emptyCard = (
    <button
      type="button"
      onClick={() => enabledActions[0]?.onSelect()}
      className={twMerge(
        "glass flex aspect-square w-14 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-black/5 bg-ui-controls/40 text-base-fg transition-all duration-200 hover:z-10 hover:rotate-0 hover:scale-105 hover:bg-ui-controls/60 dark:border-white/25",
        tiltClass,
      )}
    >
      <FontAwesomeIcon icon={faPlus} className="text-lg opacity-80" />
      <span className="px-0.5 text-center text-[8px] font-medium leading-tight opacity-70">
        {label}
      </span>
    </button>
  );

  if (enabledActions.length === 0) {
    return emptyCard;
  }

  return enabledActions.length > 1 ? (
    <Tooltip
      interactive={true}
      position="top"
      delay={100}
      className="-mb-0.5 border border-ui-controls-border bg-ui-controls p-1.5 text-base-fg"
      closeOnClick={true}
      content={<DeckAddMenu actions={enabledActions} />}
    >
      {emptyCard}
    </Tooltip>
  ) : (
    emptyCard
  );
};
