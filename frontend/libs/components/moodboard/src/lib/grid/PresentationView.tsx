import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/pro-regular-svg-icons";
import { BoardItem } from "../boards/boardTypes";

interface Props {
  items: BoardItem[];
  onClose: () => void;
}

// Distraction-free, full-bleed review deck. One item at a time, keyboard-driven
// (←/→ navigate, Esc exits). For client/team review and sharing-by-screen.
export const PresentationView = ({ items, onClose }: Props) => {
  const [index, setIndex] = useState(0);
  const count = items.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + count) % Math.max(count, 1));
      else if (e.key === "ArrowRight" || e.key === " ")
        setIndex((i) => (i + 1) % Math.max(count, 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, count]);

  const item = items[Math.min(index, count - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <button
        type="button"
        aria-label="Exit presentation"
        onClick={onClose}
        className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
      </button>

      {count === 0 ? (
        <p className="text-sm text-white/50">This board is empty.</p>
      ) : (
        <>
          <div className="flex h-full w-full items-center justify-center p-12">
            <Stage item={item} />
          </div>

          {count > 1 && (
            <>
              <Arrow
                side="left"
                onClick={() =>
                  setIndex((i) => (i - 1 + count) % count)
                }
              />
              <Arrow
                side="right"
                onClick={() => setIndex((i) => (i + 1) % count)}
              />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-white/70 backdrop-blur">
                {index + 1} / {count}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const Stage = ({ item }: { item: BoardItem }) => {
  switch (item.kind) {
    case "image":
      return (
        <img
          src={item.src}
          alt={item.caption || ""}
          className="max-h-full max-w-full object-contain"
        />
      );
    case "video":
      return (
        <video
          src={item.src}
          autoPlay
          muted
          loop
          controls
          playsInline
          className="max-h-full max-w-full"
        />
      );
    case "color":
      return (
        <div
          className="flex h-[60vh] w-[60vh] items-end rounded-3xl p-6"
          style={{ background: item.color }}
        >
          <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-medium uppercase tracking-wider text-white backdrop-blur">
            {item.color}
          </span>
        </div>
      );
    case "text":
      return (
        <p className="max-w-3xl whitespace-pre-wrap text-center text-3xl font-medium leading-relaxed text-white">
          {item.text || "Note"}
        </p>
      );
    case "link":
      return (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex max-w-2xl flex-col items-center gap-4 text-center"
        >
          {item.image && (
            <img
              src={item.image}
              alt=""
              className="max-h-[60vh] rounded-2xl object-contain"
            />
          )}
          <span className="text-xl font-medium text-white">
            {item.title || item.url}
          </span>
        </a>
      );
    default:
      return null;
  }
};

const Arrow = ({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={side === "left" ? "Previous" : "Next"}
    onClick={onClick}
    className={[
      "absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full",
      "border border-white/15 bg-white/5 text-white/80 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
      side === "left" ? "left-5" : "right-5",
    ].join(" ")}
  >
    <FontAwesomeIcon
      icon={side === "left" ? faChevronLeft : faChevronRight}
      className="h-5 w-5"
    />
  </button>
);
