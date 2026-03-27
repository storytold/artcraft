import { useRef, useState, useCallback, ReactNode, CSSProperties } from "react";

export type SplitPaneProps = {
  /** What should appear in the left pane */
  left: ReactNode;
  /** What should appear in the right pane */
  right: ReactNode;
  /** Starting width of the left pane (in %), default = 50 % */
  initialPercent?: number;
  /** Smallest allowed left-pane width, default = 15 % */
  minPercent?: number;
  /** Largest allowed left-pane width, default = 85 % */
  maxPercent?: number;
  /** Fires on every drag with the new % */
  onChange?: (percent: number) => void;
  /** Extra classes for the outer wrapper */
  className?: string;
  singlePaneMode: boolean;
};

export default function SplitPane({
  left,
  right,
  initialPercent = 50,
  minPercent = 15,
  maxPercent = 85,
  onChange,
  className = "",
  singlePaneMode = true,
}: SplitPaneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(initialPercent);

  /** Same logic for mouse + touch */
  const beginDrag = useCallback(() => {
    const move = (clientX: number) => {
      const { left: rootLeft, width } =
        rootRef.current!.getBoundingClientRect();
      const pct = ((clientX - rootLeft) / width) * 100;
      const clamped = Math.min(maxPercent, Math.max(minPercent, pct));
      setLeftPct(clamped);
      onChange?.(clamped);
    };

    const handleMove = (e: MouseEvent | TouchEvent) =>
      move(e instanceof MouseEvent ? e.clientX : e.touches[0].clientX);

    /* attach & clean up */
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });

    const endDrag = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchend", endDrag);
    };

    window.addEventListener("mouseup", endDrag, { once: true });
    window.addEventListener("touchend", endDrag, { once: true });
  }, [minPercent, maxPercent, onChange]);
  /* Tailwind handles almost all the styling—only flex-basis is inline */
  const leftStyle: CSSProperties = { flexBasis: `${leftPct}%` };

  return singlePaneMode ? (
    <div
      ref={rootRef}
      className={`pegboard-bg relative flex h-[calc(100vh-56px)] w-full items-center justify-center overflow-hidden ${className}`}
    >
      <div style={leftStyle} className="h-full min-w-0 overflow-hidden">
        {left}
      </div>
    </div>
  ) : (
    <div
      ref={rootRef}
      className={`pegboard-bg relative flex h-[calc(100vh-56px)] w-full overflow-hidden ${className}`}
    >
      <div style={leftStyle} className="h-full min-w-0 overflow-hidden">
        {left}
      </div>

      <div
        className="w-1 cursor-col-resize select-none bg-gray-500/80
                   transition hover:bg-gray-600"
        onMouseDown={beginDrag}
        onTouchStart={beginDrag}
      />

      <div className="h-full flex-1 overflow-hidden">{right}</div>
    </div>
  );
}
