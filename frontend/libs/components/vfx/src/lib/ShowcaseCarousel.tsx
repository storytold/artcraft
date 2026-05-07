import { useCallback } from "react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import type { VFXShowcaseEntry } from "./showcase-fixtures";

interface ShowcaseCarouselProps {
  entries: VFXShowcaseEntry[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const ShowcaseCarousel = ({
  entries,
  activeId,
  onSelect,
  className,
}: ShowcaseCarouselProps) => {
  const activeIndex = Math.max(
    0,
    entries.findIndex((e) => e.id === activeId),
  );
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < entries.length - 1;

  const goPrev = useCallback(() => {
    if (canPrev) onSelect(entries[activeIndex - 1].id);
  }, [canPrev, entries, activeIndex, onSelect]);
  const goNext = useCallback(() => {
    if (canNext) onSelect(entries[activeIndex + 1].id);
  }, [canNext, entries, activeIndex, onSelect]);

  return (
    <div
      className={twMerge(
        "mx-auto flex w-fit max-w-full items-center gap-2 rounded-full backdrop-blur mb-2",
        className,
      )}
    >
      <ArrowButton direction="prev" disabled={!canPrev} onClick={goPrev} />

      <div className="flex items-center gap-2">
        {entries.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              title={entry.title}
              aria-label={entry.title}
              aria-pressed={isActive}
              className={twMerge(
                "relative h-10 overflow-hidden border-2 transition-all duration-200 ease-out",
                isActive
                  ? "w-20 rounded-full border-white/80"
                  : "w-10 rounded-full border-white/15 opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={entry.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              {!isActive && (
                <span className="absolute inset-0 bg-black/20 transition-opacity hover:bg-black/0" />
              )}
            </button>
          );
        })}
      </div>

      <ArrowButton direction="next" disabled={!canNext} onClick={goNext} />
    </div>
  );
};

interface ArrowButtonProps {
  direction: "prev" | "next";
  disabled?: boolean;
  onClick: () => void;
}

const ArrowButton = ({ direction, disabled, onClick }: ArrowButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === "prev" ? "Previous showcase" : "Next showcase"}
    className={twMerge(
      "flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors",
      disabled
        ? "cursor-not-allowed opacity-30"
        : "hover:bg-white/10 hover:text-white",
    )}
  >
    <FontAwesomeIcon
      icon={direction === "prev" ? faChevronLeft : faChevronRight}
      className="h-3 w-3"
    />
  </button>
);
