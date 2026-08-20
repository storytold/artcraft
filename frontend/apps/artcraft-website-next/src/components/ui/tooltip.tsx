"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";

/*
 * Ported from @storyteller/ui-tooltip, simplified for the marketing site:
 * hover/focus label positioned off the trigger, mono uppercase micro-copy on
 * a raised hairline surface.
 */

const POSITION_CLASSES = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
} as const;

export interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
  position?: keyof typeof POSITION_CLASSES;
  className?: string;
  delay?: number;
  /** Optional body copy shown under the mono label. */
  description?: string;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  position = "top",
  className,
  delay = 300,
  description,
  disabled = false,
}: TooltipProps) {
  const [showing, setShowing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowing(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowing(false);
  };

  useEffect(() => {
    if (disabled) setShowing(false);
  }, [disabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-block"
      onPointerEnter={show}
      onPointerLeave={hide}
      onPointerCancel={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <div
        role="tooltip"
        aria-hidden={!showing}
        className={twMerge(
          "pointer-events-none absolute z-50 w-max rounded-none border border-line bg-bg-raised px-2.5 py-1.5",
          "font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink",
          "transition-opacity duration-150",
          POSITION_CLASSES[position],
          showing ? "opacity-100" : "opacity-0",
          className,
        )}
      >
        {content}
        {description && (
          <p className="mt-1 max-w-[240px] whitespace-normal font-body text-xs font-normal normal-case tracking-normal text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default Tooltip;
