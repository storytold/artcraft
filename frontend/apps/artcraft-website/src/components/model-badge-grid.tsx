import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface BadgeInfo {
  id: string;
  label?: string | ReactNode;
  svg?: ReactNode | null;
}

interface ModelBadgeGridProps {
  className?: string;
  highlight?: string;
  rowOffsets?: number[];
}

const baseBadgeClasses =
  "rounded-2xl px-6 py-3 text-2xl font-normal flex-shrink-0 bg-white/10 text-white/90 text-center h-[58px] flex items-center justify-center gap-1.5";
const highlightClasses =
  "bg-primary/30 text-white font-semibold shadow-lg border-2 border-primary/60";

const rows: BadgeInfo[][] = [
  [
    { id: "empty1", svg: null },
    { id: "empty2", svg: null },
    { id: "empty3", svg: null },
    {
      id: "seedance-2",
      label: "Seedance 2.0",
      svg: (
        <img
          src="/model-logos/bytedance.svg"
          alt="Seedance logo"
          className="w-full h-full invert"
        />
      ),
    },
    { id: "empty4", svg: null },

    { id: "empty6", svg: null },
    { id: "empty7", svg: null },
    { id: "empty8", svg: null },
  ],
  [
    { id: "empty9", svg: null },
    {
      id: "midjourney",
      label: "Midjourney",
      svg: (
        <img
          src="/model-logos/midjourney.svg"
          alt="Midjourney logo"
          className="w-full h-full invert"
        />
      ),
    },
    {
      id: "nano-banana-2",
      label: "Nano Banana 2",
      svg: (
        <img
          src="/model-logos/google.svg"
          alt="Google gemini icon"
          className="w-full h-full invert"
        />
      ),
    },
    { id: "empty10", svg: null },

    { id: "empty11", svg: null },
    { id: "empty12", svg: null },
    { id: "empty13", svg: null },
    { id: "empty14", svg: null },
  ],
  [
    { id: "empty15", svg: null },
    { id: "empty16", svg: null },
    { id: "empty17", svg: null },
    {
      id: "kling",
      label: "Kling 3.0 Pro",
      svg: (
        <img
          src="/model-logos/kling.svg"
          alt="Kling AI logo"
          className="w-full h-full invert"
        />
      ),
    },
    { id: "empty18", svg: null },
    { id: "empty19", svg: null },
    { id: "empty20", svg: null },
    { id: "empty21", svg: null },
  ],
];

export default function ModelBadgeGrid({
  className = "",
  highlight,
  rowOffsets = [],
}: ModelBadgeGridProps) {
  return (
    <div
      className={`select-none relative z-10 h-full overflow-hidden ${className}`}
    >
      {/* Gradient fade overlays */}
      <div className="absolute left-0 top-0 w-32 xl:w-96 h-full bg-gradient-to-r from-[#28282C] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 w-32 xl:w-96 h-full bg-gradient-to-l from-[#28282C] to-transparent z-10 pointer-events-none" />

      <div className="flex flex-col gap-5 h-full -mx-[280px] xl:-mx-8">
        {rows.map((row, rowIdx) => {
          const offset = rowOffsets[rowIdx] ?? 0;
          return (
            <div
              key={rowIdx}
              className="flex gap-5 whitespace-nowrap"
              style={{ marginLeft: offset }}
            >
              {row.map(({ id, label, svg }, idx) => {
                const isHighlight = highlight && highlight.toLowerCase() === id;
                return (
                  <div
                    key={idx}
                    className={twMerge(
                      baseBadgeClasses,
                      label ? "" : "min-w-[180px]",
                      isHighlight ? highlightClasses : ""
                    )}
                  >
                    {svg ? (
                      <span className="mr-2 w-6 h-6 inline-flex ">{svg}</span>
                    ) : null}
                    {label}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
