import { ReactNode, useRef, useEffect } from "react";
import {
  Popover,
  Transition,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { Button } from "@storyteller/ui-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronUp,
  faCircleCheck,
} from "@fortawesome/pro-solid-svg-icons";
import { Model, ModelInfo } from "@storyteller/model-list";

// Global hover manager to debounce close across adjacent hover popovers
let globalCloseTimer: NodeJS.Timeout | null = null;
const cancelGlobalClose = () => {
  if (globalCloseTimer) {
    clearTimeout(globalCloseTimer);
    globalCloseTimer = null;
  }
};
const scheduleGlobalClose = (fn: () => void, delayMs: number) => {
  cancelGlobalClose();
  globalCloseTimer = setTimeout(() => {
    fn();
    globalCloseTimer = null;
  }, delayMs);
};

// Global coordination so opening one hover popover closes others immediately
const ST_POPOVER_OPEN_EVENT = "st-popover-open";
let popoverIdCounter = 0;

export interface PopoverItem {
  label: string;
  selected: boolean;
  icon?: ReactNode;
  action?: string;
  disabled?: boolean;
  divider?: boolean;
  description?: string;
  badges?: Array<{
    label: string;
    icon?: ReactNode;
  }>;
  modelInfo?: ModelInfo;
  model?: Model; // NB: Let's migrate to using this.
}

interface PopoverMenuProps {
  items?: PopoverItem[];
  onSelect?: (item: PopoverItem) => void;
  onAdd?: () => void;
  triggerIcon?: ReactNode;
  showAddButton?: boolean;
  disableAddButton?: boolean;
  showIconsInList?: boolean;
  mode?: "default" | "toggle" | "button" | "hoverSelect";
  triggerLabel?: string | ReactNode;
  children?: ReactNode | ((close: () => void) => ReactNode);
  buttonClassName?: string;
  panelClassName?: string;
  onPanelAction?: (action: string) => void;
  panelTitle?: string;
  position?: "top" | "bottom";
  align?: "start" | "center" | "end";
  panelActionLabel?: string;
  onOpenChange?: (open: boolean) => void;
  closeOnUnhover?: boolean;
}

export const PopoverMenu = ({
  items = [],
  onSelect,
  onAdd,
  triggerIcon,
  showAddButton = false,
  disableAddButton = false,
  showIconsInList = false,
  mode = "default",
  triggerLabel,
  children,
  buttonClassName,
  panelClassName,
  onPanelAction,
  panelTitle,
  position = "top",
  align = "start",
  panelActionLabel,
  onOpenChange,
  closeOnUnhover = false,
}: PopoverMenuProps) => {
  const selectedItem = items.find((item) => item.selected);

  const handleItemClick = (item: PopoverItem, close: () => void) => {
    if (mode === "button" && item.action && onPanelAction) {
      onPanelAction(item.action);
      close();
    } else {
      onSelect?.(item);
      close();
    }
  };

  const className = twMerge(
    "text-sm font-medium rounded-lg px-3 py-2 shadow-sm",
    "flex gap-2 items-center justify-center outline-none",
    "transition-all duration-150",
    "bg-ui-controls px-3 text-base-fg hover:bg-ui-controls/80 border border-ui-controls-border",
    "active:scale-95 transform",
    buttonClassName
  );

  const positionClasses = {
    top: "bottom-full",
    bottom: "top-full",
  };

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  // Hover timers and refs
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popoverButtonRef = useRef<HTMLButtonElement>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      cancelGlobalClose();
    };
  }, []);

  const handleButtonMouseEnter = (open: boolean, openFn: () => void) => {
    if (!(mode === "hoverSelect" || closeOnUnhover)) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!open && mode === "hoverSelect") {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = setTimeout(() => {
        openFn();
      }, 0);
    }
  };

  const handleButtonMouseLeave = () => {
    // Defer close to wrapper/panel leave so moving from button to panel doesn't close
    if (!(mode === "hoverSelect" || closeOnUnhover)) return;
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  };

  const handlePanelMouseEnter = () => {
    if (!(mode === "hoverSelect" || closeOnUnhover)) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handlePanelMouseLeave = (closeFn: () => void) => {
    if (!(mode === "hoverSelect" || closeOnUnhover)) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(
      () => {
        closeFn();
      },
      mode === "hoverSelect" ? 200 : 120
    );
  };

  return (
    <div className="relative inline-block">
      <Popover>
        {({ open, close }) => (
          <>
            {(() => {
              const thisId = ++popoverIdCounter;
              useEffect(() => {
                onOpenChange?.(open);
                if (open && (mode === "hoverSelect" || closeOnUnhover)) {
                  // Broadcast that this popover opened; others should close
                  window.dispatchEvent(
                    new CustomEvent(ST_POPOVER_OPEN_EVENT, {
                      detail: { id: thisId },
                    })
                  );
                }
                const handler = (e: Event) => {
                  const detail = (e as CustomEvent).detail as { id: number };
                  if (detail?.id !== thisId && open) {
                    // Another popover opened; close this one immediately
                    close();
                  }
                };
                window.addEventListener(
                  ST_POPOVER_OPEN_EVENT,
                  handler as EventListener
                );
                return () =>
                  window.removeEventListener(
                    ST_POPOVER_OPEN_EVENT,
                    handler as EventListener
                  );
              }, [open]);
              return null;
            })()}
            <div
              className="inline-flex"
              onMouseEnter={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
                cancelGlobalClose();
              }}
              onMouseLeave={() => {
                if (!(mode === "hoverSelect" || closeOnUnhover)) return;
                if (openTimeoutRef.current) {
                  clearTimeout(openTimeoutRef.current);
                  openTimeoutRef.current = null;
                }
                if (closeTimeoutRef.current)
                  clearTimeout(closeTimeoutRef.current);
                // Use global close so moving to another hover popover cancels this
                scheduleGlobalClose(
                  () => close(),
                  mode === "hoverSelect" ? 200 : 120
                );
              }}
            >
              <PopoverButton
                className={className}
                onMouseEnter={() =>
                  handleButtonMouseEnter(open, () => {
                    if (popoverButtonRef.current && !open) {
                      popoverButtonRef.current.click();
                    }
                  })
                }
                onMouseLeave={handleButtonMouseLeave}
                onClick={(e) => {
                  if (mode === "hoverSelect" && open) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                ref={popoverButtonRef}
              >
                {triggerIcon}
                {mode === "toggle" && selectedItem ? (
                  <span className="truncate">{selectedItem.label}</span>
                ) : null}
                {mode === "default" && triggerLabel ? (
                  <span className="truncate">{triggerLabel}</span>
                ) : null}
                {mode === "hoverSelect" && selectedItem ? (
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-70">{triggerLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{selectedItem.label}</span>
                      <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                    </div>
                  </div>
                ) : null}
              </PopoverButton>

              <Transition
                show={open}
                enter="transition duration-75 ease-out"
                enterFrom={
                  position === "bottom"
                    ? "translate-y-1 opacity-0"
                    : "-translate-y-1 opacity-0"
                }
                enterTo="translate-y-0 opacity-100"
                leave="transition duration-75 ease-in"
                leaveFrom="translate-y-0 opacity-100"
                leaveTo={
                  position === "bottom"
                    ? "translate-y-1 opacity-0"
                    : "-translate-y-1 opacity-0"
                }
              >
                <PopoverPanel
                  static
                  className={twMerge(
                    "absolute transform-gpu z-50",
                    positionClasses[position],
                    alignClasses[align],
                    position === "bottom" ? "origin-top" : "origin-bottom"
                  )}
                >
                  <div
                    className={twMerge(
                      "z-10 min-w-48 mt-2 rounded-lg bg-ui-panel p-1.5 shadow-lg border border-ui-panel-border",
                      position === "top" ? "mb-2" : "mt-2",
                      panelClassName
                    )}
                    onMouseEnter={handlePanelMouseEnter}
                    onMouseLeave={() => handlePanelMouseLeave(close)}
                  >
                    {panelTitle && (
                      <div className="mb-2 mt-0.5 flex justify-between px-1.5 text-sm font-normal text-base-fg opacity-70">
                        {panelTitle}
                        {panelActionLabel && (
                          <button
                            onClick={() => {
                              onPanelAction?.(panelActionLabel);
                              close();
                            }}
                            className="text-end text-sm text-base-fg/85 hover:underline"
                          >
                            {panelActionLabel}
                          </button>
                        )}
                      </div>
                    )}
                    {mode === "default" && children ? (
                      <div className="text-sm text-base-fg">
                        {typeof children === "function"
                          ? children(close)
                          : children}
                      </div>
                    ) : mode === "hoverSelect" ? (
                      <div className="flex flex-col gap-0 text-sm text-base-fg">
                        {items.map((item, index) => (
                          <div key={index}>
                            <div
                              onClick={() => {
                                if (!item.disabled) {
                                  handleItemClick(item, close);
                                }
                              }}
                              className={twMerge(
                                "group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 transition-all",
                                item.selected
                                  ? "bg-ui-controls/70 border-l-4 border-primary"
                                  : "hover:bg-ui-controls/50",
                                item.disabled
                                  ? "!cursor-not-allowed opacity-50"
                                  : ""
                              )}
                              style={{ minHeight: 48 }}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <div className="flex items-start gap-2 grow">
                                  {showIconsInList && (
                                    <span className="mt-1 flex h-5 w-5 items-center justify-center text-lg text-base-fg/80">
                                      {item.icon}
                                    </span>
                                  )}
                                  <div className="flex flex-1 flex-col min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="truncate font-semibold text-base-fg text-base">
                                        {item.label}
                                      </span>
                                    </div>

                                    {item.description && (
                                      <div className="truncate text-xs text-base-fg/60 mt-0.5">
                                        {item.description}
                                      </div>
                                    )}

                                    <div className="flex flex-row gap-1 flex-wrap mt-1.5">
                                      {item.badges &&
                                        Array.isArray(item.badges) &&
                                        item.badges.map((badge, i) => (
                                          <div
                                            key={i}
                                            className="flex items-center gap-1 min-w-0"
                                          >
                                            <span className="inline-flex items-center rounded bg-black/40 px-1.5 py-0.5 text-xs font-medium text-base-fg gap-1">
                                              {badge?.icon && (
                                                <span>{badge.icon}</span>
                                              )}
                                              {badge?.label || ""}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                </div>

                                {item.selected && (
                                  <span className="text-primary text-xl font-bold bg-white rounded-full p-0 h-4 w-4 flex items-center justify-center mr-1">
                                    <FontAwesomeIcon icon={faCircleCheck} />
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.divider && (
                              <div className="my-1 border-t border-white/10" />
                            )}
                          </div>
                        ))}
                        {showAddButton && onAdd && (
                          <Button
                            variant="secondary"
                            className={twMerge(
                              "w-full mb-0.5 mt-2 border-none py-1",
                              disableAddButton
                                ? "cursor-not-allowed bg-[#7B7B84]/50 opacity-50"
                                : "bg-[#7B7B84] hover:bg-[#8c8c96]"
                            )}
                            onClick={onAdd}
                            disabled={disableAddButton}
                          >
                            + Add
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0 text-sm text-base-fg">
                        {items.map((item, index) => (
                          <div key={index}>
                            <Button
                              className={twMerge(
                                "flex w-full items-center shadow-none justify-between px-1.5",
                                "bg-transparent hover:bg-ui-controls/60",
                                mode === "toggle" && item.selected
                                  ? "hover:bg-ui-controls/80"
                                  : "",
                                item.disabled
                                  ? "!cursor-not-allowed opacity-50"
                                  : "",
                                "border-0"
                              )}
                              onClick={() =>
                                !item.disabled && handleItemClick(item, close)
                              }
                              variant="secondary"
                              disabled={item.disabled}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {showIconsInList && item.icon}
                                {mode === "toggle" ? (
                                  <span
                                    className={twMerge(
                                      "truncate",
                                      item.selected
                                        ? "text-base-fg"
                                        : "text-base-fg/70"
                                    )}
                                  >
                                    {item.label}
                                  </span>
                                ) : (
                                  <span className="truncate">{item.label}</span>
                                )}
                              </div>
                              {mode === "toggle" && (
                                <span
                                  className={twMerge(
                                    "ml-2 h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                                    item.selected
                                      ? "border-primary bg-primary"
                                      : "border-transparent bg-transparent"
                                  )}
                                >
                                  {item.selected && (
                                    <FontAwesomeIcon
                                      icon={faCheck}
                                      className="text-base-fg text-xs font-bold"
                                    />
                                  )}
                                </span>
                              )}
                            </Button>
                            {item.divider && (
                              <div className="my-1 border-t border-white/10" />
                            )}
                          </div>
                        ))}
                        {showAddButton && onAdd && (
                          <Button
                            variant="secondary"
                            className={twMerge(
                              "w-full mb-0.5 mt-2 py-1 border-0",
                              disableAddButton
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            )}
                            onClick={onAdd}
                            disabled={disableAddButton}
                          >
                            + Add
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </PopoverPanel>
              </Transition>
            </div>
          </>
        )}
      </Popover>
    </div>
  );
};
