import React, { useState, useRef, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
  closeOnClick?: boolean;
  imageSrc?: string;
  description?: string;
  /**
   * When true, the tooltip can be hovered and clicked without closing
   * immediately when the cursor leaves the trigger. Useful for menus.
   */
  interactive?: boolean;
  onOpenChange?: (open: boolean) => void;
  zIndex?: number;
  disabled?: boolean;
  /**
   * Positioning strategy. "absolute" (default) positions relative to the
   * trigger wrapper. "fixed" positions relative to the viewport, useful
   * when the tooltip is inside an overflow-hidden / overflow-auto container.
   */
  strategy?: "absolute" | "fixed";
}

export const Tooltip = ({
  children,
  content,
  position,
  className,
  delay = 300,
  closeOnClick = false,
  imageSrc,
  description,
  interactive = false,
  onOpenChange,
  zIndex = 10,
  disabled = false,
  strategy = "absolute",
}: TooltipProps) => {
  const [isShowing, setIsShowing] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isHoveringTrigger, setIsHoveringTrigger] = useState(false);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);

  const checkForOpenPopovers = () => {
    if (!triggerRef.current) return false;
    return (
      triggerRef.current.querySelectorAll('[data-headlessui-state="open"]')
        .length > 0
    );
  };

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-headlessui-state"
        ) {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute("data-headlessui-state") === "open") {
            setIsShowing(false);
          }
        }
      });
    });

    if (triggerRef.current) {
      observer.observe(triggerRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ["data-headlessui-state"],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const [measuredWidth, setMeasuredWidth] = useState(0);

  const setTooltipRef = React.useCallback((node: HTMLDivElement | null) => {
    tooltipRef.current = node;
    if (node) {
      const w = node.getBoundingClientRect().width;
      if (w > 0) {
        setMeasuredWidth((prev) => (prev !== w ? w : prev));
      }
    }
  }, []);

  const getAbsoluteStyle = (
    rect: DOMRect,
    vw: number,
    estWidth: number,
    padding: number,
  ): React.CSSProperties => {
    switch (position) {
      case "top":
        return {
          bottom: rect.height + 10,
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "bottom": {
        const center = rect.left + rect.width / 2;
        const halfWidth = estWidth / 2;

        if (center - halfWidth < padding) {
          const diff = padding - (center - halfWidth);
          return {
            top: rect.height + 10,
            left: "50%",
            transform: `translateX(calc(-50% + ${diff}px))`,
          };
        } else if (center + halfWidth > vw - padding) {
          const diff = center + halfWidth - (vw - padding);
          return {
            top: rect.height + 10,
            left: "50%",
            transform: `translateX(calc(-50% - ${diff}px))`,
          };
        }
        return {
          top: rect.height + 10,
          left: "50%",
          transform: "translateX(-50%)",
        };
      }
      case "left":
        return {
          right: rect.width + 10,
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          left: rect.width + 10,
          top: "50%",
          transform: "translateY(-50%)",
        };
    }
  };

  /**
   * Walk up the DOM to find the nearest ancestor that creates a new containing
   * block for `position: fixed` (transform, filter, will-change, etc.).
   * Returns its viewport offset so we can compensate.
   */
  const getContainingBlockOffset = (): { x: number; y: number } => {
    if (!triggerRef.current) return { x: 0, y: 0 };
    let current = triggerRef.current.parentElement;
    while (current && current !== document.body) {
      const cs = getComputedStyle(current);
      if (
        cs.transform !== "none" ||
        cs.willChange === "transform" ||
        (cs.filter && cs.filter !== "none")
      ) {
        const r = current.getBoundingClientRect();
        return { x: r.left, y: r.top };
      }
      current = current.parentElement;
    }
    return { x: 0, y: 0 };
  };

  const getFixedStyle = (
    rect: DOMRect,
    vw: number,
    estWidth: number,
    padding: number,
  ): React.CSSProperties => {
    const offset = getContainingBlockOffset();
    const GAP = 10;

    switch (position) {
      case "top":
        return {
          top: rect.top - offset.y - GAP,
          left: rect.left + rect.width / 2 - offset.x,
          transform: "translate(-50%, -100%)",
        };
      case "bottom": {
        const centerX = rect.left + rect.width / 2;
        const halfWidth = estWidth / 2;
        let translateX = "-50%";

        if (centerX - halfWidth < padding) {
          const diff = padding - (centerX - halfWidth);
          translateX = `calc(-50% + ${diff}px)`;
        } else if (centerX + halfWidth > vw - padding) {
          const diff = centerX + halfWidth - (vw - padding);
          translateX = `calc(-50% - ${diff}px)`;
        }
        return {
          top: rect.bottom - offset.y + GAP,
          left: centerX - offset.x,
          transform: `translateX(${translateX})`,
        };
      }
      case "left":
        return {
          top: rect.top + rect.height / 2 - offset.y,
          left: rect.left - offset.x - GAP,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: rect.top + rect.height / 2 - offset.y,
          left: rect.right - offset.x + GAP,
          transform: "translateY(-50%)",
        };
    }
  };

  const getStyleForPosition = (): React.CSSProperties => {
    if (!triggerRef.current) return {};

    const rect = triggerRef.current.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
    const padding = 10;

    let estWidth = measuredWidth > 0 ? measuredWidth : 100;
    if (tooltipRef.current && measuredWidth === 0) {
      const currentWidth = tooltipRef.current.getBoundingClientRect().width;
      if (currentWidth > 0) estWidth = currentWidth;
    }

    return strategy === "fixed"
      ? getFixedStyle(rect, vw, estWidth, padding)
      : getAbsoluteStyle(rect, vw, estWidth, padding);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (closeOnClick) {
      setIsShowing(false);
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (disabled) {
      setIsShowing(false);
      return;
    }
    if (!checkForOpenPopovers()) {
      const shouldShow =
        isHoveringTrigger || (interactive && isHoveringTooltip);
      setIsShowing(shouldShow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHoveringTrigger, isHoveringTooltip, interactive, disabled]);

  useEffect(() => {
    onOpenChange?.(isShowing);
  }, [isShowing, onOpenChange]);

  const isFixed = strategy === "fixed";

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => {
        setIsHoveringTrigger(true);
        if (!checkForOpenPopovers() && !disabled) {
          setIsShowing(true);
        }
      }}
      onMouseLeave={() => {
        setIsHoveringTrigger(false);
        if (!interactive) {
          setIsShowing(false);
        }
      }}
      onClick={handleClick}
      className="relative"
    >
      {children}
      <Transition
        show={isShowing}
        enter={twMerge(
          "transition ease-out duration-200",
          delay ? `delay-[${delay}ms]` : "delay-[300ms]",
        )}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          ref={setTooltipRef}
          onMouseEnter={() => interactive && setIsHoveringTooltip(true)}
          onMouseLeave={() => interactive && setIsHoveringTooltip(false)}
          onClick={() => {
            if (closeOnClick) {
              setIsShowing(false);
            }
          }}
          style={{
            ...getStyleForPosition(),
            transitionDelay: `${delay}ms`,
            transitionProperty: "opacity",
            transitionDuration: "200ms",
            transitionTimingFunction: "ease-out",
            zIndex,
          }}
          className={twMerge(
            isFixed ? "fixed" : "absolute",
            "w-max rounded-lg bg-ui-controls shadow-xl border border-ui-panel-border",
            interactive
              ? "pointer-events-auto p-3"
              : "px-2.5 py-1.5 text-[13px] font-medium pointer-events-none",
            "text-base-fg",
            className ? className : "",
          )}
        >
          {interactive ? (
            content
          ) : (
            <div className="flex flex-col gap-1">
              {content}
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt="tooltip"
                  className="mb-1 aspect-square w-56 rounded-md"
                />
              )}
              {description && (
                <p className="text-sm text-base-fg font-normal">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      </Transition>
    </div>
  );
};

export default Tooltip;
