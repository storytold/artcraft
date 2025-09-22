import { Button } from "@storyteller/ui-button";
import { useImageEditCompleteEvent } from "@storyteller/tauri-events";
import {
  faClockRotateLeft,
  faTrashAlt,
  faTrashXmark,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { Fragment, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { BaseSelectorImage } from "./BaseImageSelector";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  isActionReminderOpen,
  showActionReminder,
} from "@storyteller/ui-action-reminder-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export interface ImageBundle {
  images: BaseSelectorImage[];
}

interface HistoryStackProps {
  onClear: () => void;
  onImageSelect?: (image: BaseSelectorImage) => void;
  onImageRemove?: (image: BaseSelectorImage) => void;
  imageBundles: ImageBundle[];
  onNewImageBundle?: (newBundle: ImageBundle) => void;
  pendingPlaceholders?: { id: string; count: number }[];
  onResolvePending?: (id: string) => void;
  selectedImageToken?: string;
  blurredBackgroundUrl?: string;
}

export const HistoryStack = ({
  onClear,
  onImageSelect = () => {},
  onImageRemove = () => {},
  imageBundles,
  onNewImageBundle = () => {},
  pendingPlaceholders = [],
  onResolvePending = () => {},
  selectedImageToken,
  blurredBackgroundUrl,
}: HistoryStackProps) => {
  useImageEditCompleteEvent(async (event) => {
    const newBundle: ImageBundle = {
      images: event.edited_images.map(
        (editedImage) =>
          ({
            url: editedImage.cdn_url,
            mediaToken: editedImage.media_token,
          }) as BaseSelectorImage,
      ),
    };

    onNewImageBundle(newBundle);
    // Resolve any matching pending placeholders using subscriber id
    if (event.maybe_frontend_subscriber_id) {
      onResolvePending(event.maybe_frontend_subscriber_id);
    }
    // Do not auto-select the new image; only scroll to top for visibility
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  });

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
            return reversed.map((p, idx) => (
              <Fragment key={`pending-group-${p.id}`}>
                {Array.from({ length: Math.max(1, p.count || 1) }).map(
                  (_, i) => (
                    <div
                      key={`pending-${p.id}-${i}`}
                      className="relative w-full"
                    >
                      <div className="st-loading-tile relative aspect-square w-full overflow-hidden rounded-lg">
                        {blurredBackgroundUrl && (
                          <img
                            src={
                              blurredBackgroundUrl?.startsWith("data:")
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
                  ),
                )}
                {idx < reversed.length - 1 && (
                  <hr className="my-1.5 h-0.5 min-h-0.5 w-3/4 rounded-md border-none bg-[var(--st-divider)]" />
                )}
              </Fragment>
            ));
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
                      "group relative aspect-square h-full w-full overflow-hidden rounded-lg border-2 bg-transparent p-0 hover:bg-transparent hover:opacity-80",
                      selectedImageToken === image.mediaToken &&
                        "border-primary hover:opacity-100",
                    )}
                    onClick={() => {
                      onImageSelect(image);
                    }}
                  >
                    <img
                      src={
                        image.url.startsWith("data:")
                          ? image.url
                          : `${image.url}?historystack+${sessionRandBuster.current}`
                      }
                      alt=""
                      crossOrigin="anonymous"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                      className="absolute -right-0 -top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-red/50 opacity-0 transition-opacity hover:bg-red/80 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        showActionReminder({
                          reminderType: "default",
                          title: "Delete Image",
                          primaryActionIcon: faTrashXmark,
                          primaryActionBtnClassName: "bg-red hover:bg-red/80",
                          message: (
                            <p className="text-base-fg text-sm opacity-70">
                              Are you sure you want to delete this image? This
                              action cannot be undone.
                            </p>
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
