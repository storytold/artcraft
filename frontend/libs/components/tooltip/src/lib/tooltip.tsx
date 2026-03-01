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

  const getStyleForPosition = () => {
    let baseStyle: React.CSSProperties = {};
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
      //const vh = typeof window !== "undefined" ? window.innerHeight : 1000;
      const padding = 10;

      // Use the known measured width over fallback, or aggressively measure via ref
      let estWidth = measuredWidth > 0 ? measuredWidth : 100;
      if (tooltipRef.current && measuredWidth === 0) {
        const currentWidth = tooltipRef.current.getBoundingClientRect().width;
        if (currentWidth > 0) estWidth = currentWidth;
      }

      switch (position) {
        case "top": {
          baseStyle = {
            bottom: rect.height + 10,
            left: "50%",
            transform: "translateX(-50%)",
          };
          break;
        }
        case "bottom": {
          const center = rect.left + rect.width / 2;
          const halfWidth = estWidth / 2;

          if (center - halfWidth < padding) {
            // Fixes flush-left behavior
            const diff = padding - (center - halfWidth);
            baseStyle = {
              top: rect.height + 10,
              left: "50%",
              transform: `translateX(calc(-50% + ${diff}px))`,
            };
          } else if (center + halfWidth > vw - padding) {
            // Fixes flush-right behavior
            const diff = center + halfWidth - (vw - padding);
            baseStyle = {
              top: rect.height + 10,
              left: "50%",
              transform: `translateX(calc(-50% - ${diff}px))`,
            };
          } else {
            // Uses normal centering
            baseStyle = {
              top: rect.height + 10,
              left: "50%",
              transform: "translateX(-50%)",
            };
          }
          break;
        }
        case "left": {
          baseStyle = {
            right: rect.width + 10,
            top: "50%",
            transform: "translateY(-50%)",
          };
          break;
        }
        case "right": {
          baseStyle = {
            left: rect.width + 10,
            top: "50%",
            transform: "translateY(-50%)",
          };
          break;
        }
      }
    }

    return baseStyle;
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
            "absolute w-max rounded-lg bg-ui-controls shadow-xl border border-ui-panel-border",
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
