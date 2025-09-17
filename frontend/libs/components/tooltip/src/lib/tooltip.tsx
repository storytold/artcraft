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

  const getStyleForPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      switch (position) {
        case "top":
          return {
            bottom: rect.height + 10,
            left: "50%",
            transform: "translateX(-50%)",
          };
        case "bottom":
          return {
            top: rect.height + 10,
            left: "50%",
            transform: "translateX(-50%)",
          };
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
        default:
          return {};
      }
    }
    return {};
  };

  const handleClick = (e: React.MouseEvent) => {
    if (closeOnClick) {
      setIsShowing(false);
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (!checkForOpenPopovers()) {
      const shouldShow =
        isHoveringTrigger || (interactive && isHoveringTooltip);
      setIsShowing(shouldShow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHoveringTrigger, isHoveringTooltip, interactive]);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => {
        setIsHoveringTrigger(true);
        if (!checkForOpenPopovers()) {
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
          delay ? `delay-[${delay}ms]` : "delay-[300ms]"
        )}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          ref={tooltipRef}
          onMouseEnter={() => interactive && setIsHoveringTooltip(true)}
          onMouseLeave={() => interactive && setIsHoveringTooltip(false)}
          style={{
            ...getStyleForPosition(),
            transitionDelay: `${delay}ms`,
            transitionProperty: "opacity",
            transitionDuration: "200ms",
            transitionTimingFunction: "ease-out",
          }}
          className={twMerge(
            "absolute z-10 w-max rounded-lg bg-ui-controls px-2.5 py-1.5 text-[13px] font-medium text-base-fg shadow-xl border border-ui-panel-border",
            interactive ? "pointer-events-auto" : "pointer-events-none",
            className ? className : ""
          )}
        >
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
              <p className="text-sm text-base-fg font-normal">{description}</p>
            )}
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default Tooltip;
