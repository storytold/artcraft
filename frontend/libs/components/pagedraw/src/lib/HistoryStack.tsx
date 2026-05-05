import { Button } from "@storyteller/ui-button";
import {
  faClockRotateLeft,
  faTrashAlt,
  faTrashXmark,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { Fragment, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { BaseSelectorImage, ImageBundle } from "./types";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  isActionReminderOpen,
  showActionReminder,
} from "@storyteller/ui-action-reminder-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type { ImageBundle };

interface HistoryStackProps {
  onClear: () => void;
  onImageSelect?: (image: BaseSelectorImage) => void;
  onImageRemove?: (image: BaseSelectorImage) => void;
  onPendingRemove?: (id: string) => void;
  imageBundles: ImageBundle[];
  pendingPlaceholders?: { id: string; count: number }[];
  selectedImageToken?: string;
  blurredBackgroundUrl?: string;
}

export const HistoryStack = ({
  onClear,
  onImageSelect = () => {},
  onImageRemove = () => {},
  onPendingRemove = () => {},
  imageBundles,
  pendingPlaceholders = [],
  selectedImageToken,
  blurredBackgroundUrl,
}: HistoryStackProps) => {
  const handleSelectWithPreload = (image: BaseSelectorImage) => {
    const preload = new Image();
    preload.crossOrigin = "anonymous";
    (
      preload as HTMLImageElement & { decoding?: "sync" | "async" | "auto" }
    ).decoding = "async";
    preload.src = image.url;
    const select = () => onImageSelect(image);
    const decodeFn = (
      preload as HTMLImageElement & { decode?: () => Promise<void> }
    ).decode;
    if (typeof decodeFn === "function") {
      decodeFn.call(preload).then(select).catch(select);
    } else {
      preload.onload = select;
      preload.onerror = select;
    }
  };

  // This is used to force image reloads in different sessions
  // and prevent fetching CORS-tainted images from cache
  const sessionRandBuster = useRef(Math.random());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevPendingCountRef = useRef<number>(0);

  const handleClear = () => {
    onClear();
  };

  const handleOnImageRemove = (baseImage: BaseSelectorImage) => {
    onImageRemove(baseImage);
  };

  // Tracks which pending tile (if any) currently has its remove-confirmation
  // modal open, so we can auto-close the modal if the underlying generation
  // finishes loading before the user confirms.
  const [pendingRemoveTargetId, setPendingRemoveTargetId] = useState<
    string | null
  >(null);

  const handlePendingRemoveClick = (id: string) => {
    setPendingRemoveTargetId(id);
    showActionReminder({
      reminderType: "default",
      title: "Remove pending generation",
      primaryActionIcon: faTrashXmark,
      primaryActionBtnClassName: "bg-red hover:bg-red/80",
      message: (
        <>
          <p className="text-base-fg text-sm opacity-70">
            Stop showing this generation in the history stack? This action
            cannot be undone.
          </p>
          <p className="text-base-fg text-sm opacity-70">
            The image may still finish in the background and will be available
            in your library when it does.
          </p>
        </>
      ),
      primaryActionText: "Remove",
      onPrimaryAction: () => {
        onPendingRemove(id);
        setPendingRemoveTargetId(null);
        isActionReminderOpen.value = false;
      },
    });
  };

  // If the pending generation we opened the confirm modal for resolves
  // before the user clicks confirm, close the modal — there's nothing left
  // to dismiss.
  useEffect(() => {
    if (pendingRemoveTargetId === null) return;
    const stillPending = pendingPlaceholders.some(
      (p) => p.id === pendingRemoveTargetId,
    );
    if (!stillPending) {
      isActionReminderOpen.value = false;
      setPendingRemoveTargetId(null);
    }
  }, [pendingPlaceholders, pendingRemoveTargetId]);

  // If the modal is dismissed by other means (Escape, backdrop click), clear
  // our target so we don't try to manage a modal that's already gone.
  // Uses the signal's subscribe API so we react to external dismissals.
  useEffect(() => {
    if (pendingRemoveTargetId === null) return;
    const unsubscribe = isActionReminderOpen.subscribe((isOpen) => {
      if (!isOpen) setPendingRemoveTargetId(null);
    });
    return unsubscribe;
  }, [pendingRemoveTargetId]);

  // Scroll to top when new pending placeholders are added (after enqueue)
  useEffect(() => {
    const current = pendingPlaceholders.length;
    if (current > prevPendingCountRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
    prevPendingCountRef.current = current;
  }, [pendingPlaceholders.length]);

  // Scroll to top when a new bundle arrives (newest image just resolved)
  const prevBundlesLenRef = useRef<number>(0);
  useEffect(() => {
    if (imageBundles.length > prevBundlesLenRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
    prevBundlesLenRef.current = imageBundles.length;
  }, [imageBundles.length]);

  const getImageThumbnailSource = (image: BaseSelectorImage) => {
    if (!!image.thumbnailUrlTemplate) {
      return image.thumbnailUrlTemplate.replace("{WIDTH}", "256");
    }
    if (image.url.startsWith("data:") || image.url.startsWith("blob:")) {
      return image.url;
    }
    console.warn("Using older image source for history stack image", image);
    return `${image.url}?historystack+${sessionRandBuster.current}`;
  };

  return (
    <div className="h-auto w-20 rounded-lg">
      <div className="glass rounded-lg p-1.5">
        <div className="mb-2 flex w-full items-center justify-center">
          <FontAwesomeIcon
            icon={faClockRotateLeft}
            className="p-1 text-gray-400"
          />
        </div>
        <div
          ref={scrollRef}
          className={
            "scrollbar-hidden flex max-h-[50vh] flex-col items-center justify-start gap-1 overflow-y-auto"
          }
        >
          {/* Pending placeholders first (newest at top) */}
          {(() => {
            const reversed = [...pendingPlaceholders].slice().reverse();
            return reversed.map((p, idx) => {
              const tileCount = Math.max(1, p.count || 1);
              return (
                <Fragment key={`pending-group-${p.id}`}>
                  {/* Outer batch group: the entire group is the click target
                      for removal. Hovering reveals a striped overlay and a
                      centered trash affordance. */}
                  <div
                    className="group relative w-full cursor-pointer"
                    title={
                      tileCount > 1
                        ? `Remove batch of ${tileCount}`
                        : "Remove"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePendingRemoveClick(p.id);
                    }}
                  >
                    <div className="flex w-full flex-col gap-1">
                      {Array.from({ length: tileCount }).map((_, i) => (
                        <div
                          key={`pending-${p.id}-${i}`}
                          className="relative w-full"
                        >
                          <div className="st-loading-tile relative aspect-square w-full overflow-hidden rounded-lg">
                            {blurredBackgroundUrl && (
                              <img
                                src={
                                  blurredBackgroundUrl?.startsWith("data:") ||
                                  blurredBackgroundUrl?.startsWith("blob:")
                                    ? blurredBackgroundUrl
                                    : `${blurredBackgroundUrl}?placeholderbg`
                                }
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover opacity-80 blur-lg"
                                crossOrigin="anonymous"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--st-divider)] border-t-[var(--st-fg)]" />
                            </div>
                            {/* SVG running border (single solid line) */}
                            <svg
                              className="st-border-svg"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              <rect
                                className="st-border-solid"
                                x="1"
                                y="1"
                                width="98"
                                height="98"
                                rx="16"
                                ry="16"
                                pathLength="200"
                              />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Batch-removal hover overlay: alternating dark-red and
                        near-black diagonal stripes covering the whole batch.
                        pointer-events-none so the click bubbles to the
                        outer group. */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-[5] rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                      style={{
                        background:
                          "repeating-linear-gradient(45deg, rgba(220, 38, 38, 0.55) 0px, rgba(220, 38, 38, 0.55) 8px, rgba(0, 0, 0, 0.55) 8px, rgba(0, 0, 0, 0.55) 16px)",
                      }}
                    />

                    {/* Centered remove affordance, shown on hover. Decorative
                        only — actual click is handled on the outer group. */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <div className="flex items-center justify-center gap-1 rounded-lg bg-red/80 px-3 py-2 shadow-lg">
                        <FontAwesomeIcon
                          icon={faTrashAlt}
                          className="text-base-fg text-base"
                        />
                        {tileCount > 1 && (
                          <span className="text-base-fg text-xs font-semibold">
                            ×{tileCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {idx < reversed.length - 1 && (
                    <hr className="my-1.5 h-0.5 min-h-0.5 w-3/4 rounded-md border-none bg-[var(--st-divider)]" />
                  )}
                </Fragment>
              );
            });
          })()}

          {pendingPlaceholders.length > 0 && (
            <hr className="my-1.5 h-0.5 min-h-0.5 w-3/4 rounded-md border-none bg-[var(--st-divider)]" />
          )}

          {/* Completed images below placeholders, newest bundles first */}
          {[...imageBundles]
            .slice()
            .reverse()
            .map((bundle, index) => (
              <Fragment key={index}>
                {bundle.images.map((image) => (
                  <Button
                    key={image.mediaToken}
                    className={twMerge(
                      "group relative aspect-square h-full w-full shrink-0 overflow-hidden rounded-lg border-2 bg-transparent p-0 hover:bg-transparent hover:opacity-80",
                      selectedImageToken === image.mediaToken &&
                        "border-primary hover:opacity-100",
                    )}
                    onClick={() => handleSelectWithPreload(image)}
                  >
                    {image.isBlankCanvas ? (
                      <div className="absolute inset-0 h-full w-full bg-white" />
                    ) : (
                      <img
                        src={getImageThumbnailSource(image)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div
                      className="absolute -right-0 -top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-red/50 opacity-0 transition-opacity hover:bg-red/80 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        showActionReminder({
                          reminderType: "default",
                          title: "Remove Image",
                          primaryActionIcon: faTrashXmark,
                          primaryActionBtnClassName: "bg-red hover:bg-red/80",
                          message: (
                            <>
                            <p className="text-base-fg text-sm opacity-70">
                              Are you sure you want to remove this image from the history stack? This
                              action cannot be undone.
                            </p>
                            <p className="text-base-fg text-sm opacity-70">
                              Images removed here can still be found in the library.
                            </p>
                            </>
                          ),
                          primaryActionText: "Delete",
                          onPrimaryAction: () => {
                            handleOnImageRemove(image);
                            isActionReminderOpen.value = false;
                          },
                        });
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faTrashAlt}
                        className="text-base-fg h-full w-full text-[13px]"
                      />
                    </div>
                  </Button>
                ))}
                {index < imageBundles.length - 1 && (
                  <hr
                    className="my-1.5 h-0.5 min-h-0.5 w-3/4 rounded-md border-none bg-[var(--st-divider)]"
                    key={"hr" + index}
                  />
                )}
              </Fragment>
            ))}
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <div className="glass w-fit rounded-xl border-2 border-red/50 shadow-lg hover:border-red/80">
          <div className="relative h-full">
            <Tooltip
              content="Reset All"
              position="left"
              closeOnClick={true}
              className="ms-1 rounded-md bg-red px-3 py-1"
              delay={100}
            >
              <button
                className="text-base-fg flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent transition-colors hover:bg-red/50"
                onClick={() =>
                  showActionReminder({
                    reminderType: "default",
                    title: "Reset All",
                    primaryActionIcon: faTrashXmark,
                    primaryActionBtnClassName: "bg-red hover:bg-red/80",
                    message: (
                      <p className="text-base-fg text-sm opacity-70">
                        Are you sure you want to reset all? This will clear all
                        your work and cannot be undone.
                      </p>
                    ),
                    primaryActionText: "Reset all",
                    onPrimaryAction: () => {
                      handleClear();
                      isActionReminderOpen.value = false;
                    },
                  })
                }
              >
                <FontAwesomeIcon icon={faXmark} className="h-5 w-5 text-xl" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
