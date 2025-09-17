import { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { CloseButton } from "@storyteller/ui-close-button";
import { useRef, useState, useEffect, useContext, createContext } from "react";
import { cloneElement, isValidElement } from "react";
import { useTransition, animated } from "@react-spring/web";
import {
  faUpRightAndDownLeftFromCenter,
  faDownLeftAndUpRightToCenter,
} from "@fortawesome/pro-solid-svg-icons";
import { DomLevels } from "@storyteller/common";
import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";

// ---------------------------------------------------------------------------
// GLOBAL inert / aria-hidden stripper – applies once per page load
// Overrides the inert attribute set by Radix Dialog to allow background interaction / stacked modals
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    __modalEscListenerInstalled?: boolean;
  }
}

// ---------------------------------------------------------------------------
// Modal ESC handling & stack tracking
// If several modals are stacked, Esc will dismiss the one visually on top (highest z-index).
// ---------------------------------------------------------------------------

interface ModalRegistryEntry {
  id: number;
  zIndex: number;
  onClose: () => void;
  closeOnEsc: boolean;
}

const modalRegistry: ModalRegistryEntry[] = [];

const registerModal = (entry: ModalRegistryEntry) => {
  modalRegistry.push(entry);
};

const unregisterModal = (id: number) => {
  const idx = modalRegistry.findIndex((m) => m.id === id);
  if (idx !== -1) modalRegistry.splice(idx, 1);
};

const updateModal = (
  id: number,
  data: Partial<{ zIndex: number; onClose: () => void; closeOnEsc: boolean }>
) => {
  const entry = modalRegistry.find((m) => m.id === id);
  if (entry) Object.assign(entry, data);
};

const getTopEscapableModal = (): ModalRegistryEntry | undefined => {
  return modalRegistry
    .filter((m) => m.closeOnEsc)
    .sort((a, b) => b.zIndex - a.zIndex)[0];
};

// Install one global ESC listener (once per page load)
if (typeof window !== "undefined" && !window.__modalEscListenerInstalled) {
  window.__modalEscListenerInstalled = true;
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Escape" && e.key !== "Esc") return;
    const top = getTopEscapableModal();
    if (top) {
      e.preventDefault();
      top.onClose();
    }
  });
}

// Simple global z-index tracker for stacked modals
let modalZCounter = 70;

const AnimatedBackdrop = ({
  styles,
  backdropClassName,
  disableHotkeyInput,
  enableHotkeyInput,
}: {
  styles: any;
  backdropClassName?: string;
  disableHotkeyInput: (level: number) => void;
  enableHotkeyInput: (level: number) => void;
}) => {
  useEffect(() => {
    disableHotkeyInput(DomLevels.DIALOGUE);
    return () => {
      enableHotkeyInput(DomLevels.DIALOGUE);
    };
  }, [disableHotkeyInput, enableHotkeyInput]);

  return (
    <Dialog.Overlay forceMount asChild>
      <animated.div
        className={twMerge("fixed inset-0 z-[69]", backdropClassName)}
        style={{
          opacity: styles.opacity,
          pointerEvents: "none",
          background:
            "radial-gradient(800px 400px at 10% -10%, rgba(45,129,255,0.10), transparent), radial-gradient(600px 320px at 110% 110%, rgba(28,182,190,0.10), transparent), rgba(0,0,0,0.60)",
        }}
      />
    </Dialog.Overlay>
  );
};

// Drag handle subcomponent
const DragHandle = ({ children }: { children: ReactNode }) => <>{children}</>;

// Context for expanded state
interface ModalExpandContextType {
  expanded: boolean;
  toggleExpanded: () => void;
}
const ModalExpandContext = createContext<ModalExpandContextType | undefined>(
  undefined
);

// Expand button subcomponent
interface ExpandButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ExpandButton = ({ className, size = "md" }: ExpandButtonProps) => {
  const ctx = useContext(ModalExpandContext);
  if (!ctx) return null;
  const { expanded, toggleExpanded } = ctx;
  const sizeClasses = {
    sm: "h-5 w-5 text-sm",
    md: "h-7 w-7 text-md",
    lg: "h-9 w-9 text-xl",
  };
  return (
    <button
      type="button"
      aria-label={expanded ? "Restore modal size" : "Expand modal"}
      onClick={toggleExpanded}
      className={twMerge(
        "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
        sizeClasses[size],
        "relative z-[70]",
        className
      )}
    >
      <FontAwesomeIcon
        icon={
          expanded
            ? faDownLeftAndUpRightToCenter
            : faUpRightAndDownLeftFromCenter
        }
      />
    </button>
  );
};

ExpandButton.displayName = "ModalExpandButton";

export const Modal = ({
  isOpen,
  title,
  titleIcon,
  onTitleIconClick,
  onClose,
  enableHotkeyInput = () => {},
  disableHotkeyInput = () => {},
  className,
  backdropClassName,
  width,
  children,
  childPadding = true,
  titleIconClassName,
  showClose = true,
  draggable = false,
  resizable = false,
  initialPosition,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  allowBackgroundInteraction = false,
  expandable = false,
  accessibleTitle,
  accessibleDescription,
}: {
  isOpen: boolean;
  title?: ReactNode;
  titleIcon?: IconDefinition;
  onTitleIconClick?: () => void;
  titleIconClassName?: string;
  onClose: () => void;
  className?: string;
  backdropClassName?: string;
  width?: number;
  children: ReactNode;
  childPadding?: boolean;
  showClose?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  disableHotkeyInput?: (level: number) => void;
  enableHotkeyInput?: (level: number) => void;
  initialPosition?: { x: number; y: number };
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  allowBackgroundInteraction?: boolean;
  expandable?: boolean;
  accessibleTitle?: string;
  accessibleDescription?: string;
}) => {
  // Draggable logic
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<{ x: number; y: number } | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [zIndex, setZIndex] = useState<number>(() => ++modalZCounter);

  // Expanded state
  const [expanded, setExpanded] = useState(false);
  // Track last non-expanded position
  const lastNonExpandedPosition = useRef<{ x: number; y: number } | null>(null);

  // Animation transitions
  const transitions = useTransition(isOpen, {
    from: {
      opacity: 0,
      transform: "scale(0.95) translateY(-10px)",
    },
    enter: {
      opacity: 1,
      transform: "scale(1) translateY(0px)",
    },
    leave: {
      opacity: 0,
      transform: "scale(0.95) translateY(10px)",
    },
    config: {
      tension: 300,
      friction: 30,
      mass: 0.8,
    },
  });

  const backdropTransitions = useTransition(isOpen, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      tension: 280,
      friction: 25,
    },
  });
  // When expanding/restoring, update position
  useEffect(() => {
    if (expanded) {
      // Save last non-expanded position
      if (positionRef.current) {
        lastNonExpandedPosition.current = { ...positionRef.current };
      }
      // Set position to (0,0) for fullscreen
      setPosition({ x: 0, y: 0 });
      positionRef.current = { x: 0, y: 0 };
      if (modalRef.current) {
        modalRef.current.style.left = "0px";
        modalRef.current.style.top = "0px";
        modalRef.current.style.margin = "0";
        modalRef.current.style.position = "fixed";
        modalRef.current.style.zIndex = String(zIndex);
      }
    } else {
      // Restore last non-expanded position
      if (lastNonExpandedPosition.current) {
        setPosition({ ...lastNonExpandedPosition.current });
        positionRef.current = { ...lastNonExpandedPosition.current };
        if (modalRef.current) {
          modalRef.current.style.left =
            lastNonExpandedPosition.current.x + "px";
          modalRef.current.style.top = lastNonExpandedPosition.current.y + "px";
          modalRef.current.style.margin = "0";
          modalRef.current.style.position = "fixed";
          modalRef.current.style.zIndex = String(zIndex);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, zIndex]);
  const toggleExpanded = () => setExpanded((v) => !v);

  // Reset position when modal is closed or opened
  useEffect(() => {
    if (!isOpen) {
      // Don't reset position, just store the last position
      if (positionRef.current)
        lastPositionRef.current = { ...positionRef.current };
      // setPosition(null); // Don't reset position
      // positionRef.current = null; // Don't reset position
    } else {
      // When opening, restore last position if available
      if (lastPositionRef.current) {
        setPosition({ ...lastPositionRef.current });
        positionRef.current = { ...lastPositionRef.current };
        // Set DOM node style as well
        if (modalRef.current) {
          modalRef.current.style.left = lastPositionRef.current.x + "px";
          modalRef.current.style.top = lastPositionRef.current.y + "px";
          modalRef.current.style.margin = "0";
          modalRef.current.style.position = "fixed";
          modalRef.current.style.zIndex = String(zIndex);
        }
      } else if (initialPosition) {
        setPosition({ ...initialPosition });
        positionRef.current = { ...initialPosition };
        if (modalRef.current) {
          modalRef.current.style.left = initialPosition.x + "px";
          modalRef.current.style.top = initialPosition.y + "px";
          modalRef.current.style.margin = "0";
          modalRef.current.style.position = "fixed";
          modalRef.current.style.zIndex = String(zIndex);
        }
      }
    }
  }, [isOpen, zIndex]);

  // Handle mouse move and up events
  useEffect(() => {
    if (!dragging) return;
    let animationFrame: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (!modalRef.current) return;
      const dx = e.clientX - mouseStart.current.x;
      const dy = e.clientY - mouseStart.current.y;
      const newX = dragStart.current.x + dx;
      const newY = dragStart.current.y + dy;
      // Restrict within viewport, but allow overflow
      const modal = modalRef.current;
      const { width: mw, height: mh } = modal.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const overflow = 450; // Allow dragging 450px outside each edge except top
      const minX = -overflow;
      const minY = 0; // Do not allow dragging above the top edge
      const maxX = vw - mw + overflow;
      const maxY = vh - mh + overflow;
      const clampedX = Math.max(minX, Math.min(newX, maxX));
      const clampedY = Math.max(minY, Math.min(newY, maxY));
      positionRef.current = { x: clampedX, y: clampedY };
      if (modalRef.current) {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          if (modalRef.current && positionRef.current) {
            modalRef.current.style.left = positionRef.current.x + "px";
            modalRef.current.style.top = positionRef.current.y + "px";
            modalRef.current.style.margin = "0";
            modalRef.current.style.position = "fixed";
            modalRef.current.style.zIndex = String(zIndex);
          }
        });
      }
    };
    const handleMouseUp = () => {
      setDragging(false);
      // Update React state to the last position for next drag
      if (positionRef.current) setPosition({ ...positionRef.current });
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [dragging, zIndex]);

  // Calculate initial center position on first drag
  const handleDragStart = (e: React.MouseEvent) => {
    if (!modalRef.current) return;
    if (expanded) setExpanded(false); // Un-expand on drag
    e.preventDefault();
    e.stopPropagation();
    const modal = modalRef.current;
    const { width: mw, height: mh } = modal.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = positionRef.current?.x ?? position?.x;
    let y = positionRef.current?.y ?? position?.y;
    if (x === undefined || y === undefined) {
      if (initialPosition) {
        x = initialPosition.x;
        y = initialPosition.y;
      } else {
        x = (vw - mw) / 2;
        y = (vh - mh) / 2;
      }
    }
    dragStart.current = { x, y };
    mouseStart.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    // If position is not set, set it to center or last or initial
    if (!position && !positionRef.current) {
      setPosition({ x, y });
      positionRef.current = { x, y };
      if (modalRef.current) {
        modalRef.current.style.left = x + "px";
        modalRef.current.style.top = y + "px";
        modalRef.current.style.margin = "0";
        modalRef.current.style.position = "fixed";
        modalRef.current.style.zIndex = String(zIndex);
      }
    }
  };

  // Find and enhance the drag handle
  let enhancedChildren = children;
  if (draggable) {
    let foundHandle = false;
    enhancedChildren = Array.isArray(children)
      ? children.map((child) => {
          if (
            !foundHandle &&
            isValidElement(child) &&
            (child.type === DragHandle ||
              (child.type as any).displayName === "ModalDragHandle")
          ) {
            foundHandle = true;
            const typedChild = child as React.ReactElement<{
              children: ReactNode;
            }>;
            return cloneElement(typedChild, {
              children: (
                <div
                  style={{ cursor: "move", userSelect: "none" }}
                  onMouseDown={handleDragStart}
                >
                  {typedChild.props.children}
                </div>
              ),
            });
          }
          return child;
        })
      : isValidElement(children) &&
        (children.type === DragHandle ||
          (children.type as any).displayName === "ModalDragHandle")
      ? (() => {
          const typedChildren = children as React.ReactElement<{
            children: ReactNode;
          }>;
          return cloneElement(typedChildren, {
            children: (
              <div
                style={{ cursor: "move", userSelect: "none" }}
                onMouseDown={handleDragStart}
              >
                {typedChildren.props.children}
              </div>
            ),
          });
        })()
      : children;
  }

  /**
   * ------------------ RESIZING LOGIC --------------------
   */
  const resizeDirRef = useRef<string | null>(null);
  const resizeStart = useRef<{
    mouseX: number;
    mouseY: number;
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, dir: string) => {
    if (!modalRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    if (expanded) return; // don't allow resize when expanded
    const rect = modalRef.current.getBoundingClientRect();
    resizeDirRef.current = dir;
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top,
    };
    setResizing(true);
  };

  // Handle resizing mouse move / up
  useEffect(() => {
    if (!resizing) return;
    let animationFrame: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (!modalRef.current || !resizeStart.current || !resizeDirRef.current)
        return;
      const dx = e.clientX - resizeStart.current.mouseX;
      const dy = e.clientY - resizeStart.current.mouseY;

      let newWidth = resizeStart.current.width;
      let newHeight = resizeStart.current.height;
      let newX = resizeStart.current.x;
      let newY = resizeStart.current.y;

      const dir = resizeDirRef.current;

      const minWidth = 320;
      const minHeight = 240;

      if (dir.includes("right")) {
        newWidth = resizeStart.current.width + dx;
      }
      if (dir.includes("left")) {
        newWidth = resizeStart.current.width - dx;
        newX = resizeStart.current.x + dx;
      }
      if (dir.includes("bottom")) {
        newHeight = resizeStart.current.height + dy;
      }
      if (dir.includes("top")) {
        newHeight = resizeStart.current.height - dy;
        newY = resizeStart.current.y + dy;
      }

      newWidth = Math.max(minWidth, newWidth);
      newHeight = Math.max(minHeight, newHeight);

      positionRef.current = { x: newX, y: newY };
      sizeRef.current = { width: newWidth, height: newHeight };

      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        if (modalRef.current && positionRef.current) {
          modalRef.current.style.width = newWidth + "px";
          modalRef.current.style.height = newHeight + "px";
          modalRef.current.style.left = positionRef.current.x + "px";
          modalRef.current.style.top = positionRef.current.y + "px";
          modalRef.current.style.margin = "0";
          modalRef.current.style.position = "fixed";
          modalRef.current.style.zIndex = String(zIndex);
        }
      });
    };

    const handleMouseUp = () => {
      setResizing(false);
      if (positionRef.current) setPosition({ ...positionRef.current });
      if (sizeRef.current) setSize({ ...sizeRef.current });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [resizing, zIndex]);

  // Render resize handles if resizable and not expanded
  const renderResizeHandles = () => {
    if (!resizable || expanded) return null;
    const baseClass = "absolute z-[75] bg-transparent select-none";
    const handleSize = 5; // px
    const sideThickness = 2; // for edge handles
    const handles = [
      { dir: "top", className: `top-0 left-0 w-full h-${sideThickness}` },
      { dir: "bottom", className: `bottom-0 left-0 w-full h-${sideThickness}` },
      { dir: "left", className: `left-0 top-0 h-full w-${sideThickness}` },
      { dir: "right", className: `right-0 top-0 h-full w-${sideThickness}` },
      {
        dir: "top-left",
        className: `top-0 left-0 w-${handleSize} h-${handleSize}`,
      },
      {
        dir: "top-right",
        className: `top-0 right-0 w-${handleSize} h-${handleSize}`,
      },
      {
        dir: "bottom-left",
        className: `bottom-0 left-0 w-${handleSize} h-${handleSize}`,
      },
      {
        dir: "bottom-right",
        className: `bottom-0 right-0 w-${handleSize} h-${handleSize}`,
      },
    ];

    const cursorMap: Record<string, string> = {
      top: "n-resize",
      bottom: "s-resize",
      left: "w-resize",
      right: "e-resize",
      "top-left": "nw-resize",
      "top-right": "ne-resize",
      "bottom-left": "sw-resize",
      "bottom-right": "se-resize",
    };

    return handles.map((h) => (
      <div
        key={h.dir}
        className={`${baseClass} ${h.className}`}
        style={{ cursor: cursorMap[h.dir] }}
        onMouseDown={(e) => handleResizeStart(e, h.dir)}
      />
    ));
  };

  // Size (width & height) state for resizable modal
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const sizeRef = useRef<{ width: number; height: number } | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);

  // Capture initial size on first open (only for resizable modals)
  useEffect(() => {
    if (isOpen && !size && modalRef.current && resizable) {
      const { width, height } = modalRef.current.getBoundingClientRect();
      setSize({ width, height });
      sizeRef.current = { width, height };
    }
  }, [isOpen, size, resizable]);

  // Persist size across close / reopen (only for resizable modals)
  useEffect(() => {
    if (!resizable) return;
    if (!isOpen) {
      if (sizeRef.current) lastSizeRef.current = { ...sizeRef.current };
    } else {
      if (lastSizeRef.current && modalRef.current) {
        const { width, height } = lastSizeRef.current;
        modalRef.current.style.width = width + "px";
        modalRef.current.style.height = height + "px";
        setSize({ width, height });
        sizeRef.current = { width, height };
      }
    }
  }, [isOpen, resizable]);

  // Bring to front when user interacts with modal (mouse down anywhere inside)
  useEffect(() => {
    const handleBringToFront = () => {
      if (modalRef.current) {
        if (zIndex < modalZCounter) {
          modalZCounter += 1;
          setZIndex(modalZCounter);
          modalRef.current.style.zIndex = String(modalZCounter);
        }
      }
    };

    const node = modalRef.current;
    if (node) {
      node.addEventListener("mousedown", handleBringToFront);
    }
    return () => {
      if (node) node.removeEventListener("mousedown", handleBringToFront);
    };
  }, [zIndex]);

  // Block propagation of keyboard events to elements outside the modal so global hot-keys (T / R / G shortcuts in the 3-D editor) don't fire while a modal is open
  useEffect(() => {
    if (!isOpen || allowBackgroundInteraction) return;

    const stopKey = (e: KeyboardEvent) => {
      // Exclude ESC key
      if (e.key === "Escape" || e.key === "Esc") return;

      // Allow keyboard interactions for popovers and other UI elements
      const target = e.target as HTMLElement;
      if (target) {
        // Allow if target is inside a popover, dropdown, or other interactive UI
        const isInPopover = target.closest(
          '[role="dialog"], [role="menu"], [role="listbox"], [data-headlessui-portal]'
        );
        if (isInPopover) return;

        // Allow if target is a form element that might be outside the modal
        if (
          target.matches("input, textarea, select, button, [contenteditable]")
        )
          return;
      }

      e.stopPropagation();
    };

    window.addEventListener("keydown", stopKey, true);

    return () => {
      window.removeEventListener("keydown", stopKey, true);
    };
  }, [isOpen, allowBackgroundInteraction]);

  // If background interaction is allowed, ensure this modal (and its ancestors)
  // never get the "inert" attribute Headless-UI uses to lock background dialogs.
  useEffect(() => {
    if (!allowBackgroundInteraction) return;
    const node = modalRef.current as HTMLElement | null;
    if (!node) return;

    const stripInert = (el: HTMLElement | null) => {
      if (!el) return;
      if (el.hasAttribute("inert")) el.removeAttribute("inert");
      // Also clear the property for browsers implementing it as mutable prop
      // @ts-ignore
      if ((el as any).inert) (el as any).inert = false;
      if (el.getAttribute("aria-hidden") === "true") {
        el.removeAttribute("aria-hidden");
      }
    };

    // Remove inert from this modal and all its ancestors (Headless UI sets it on the modal container)
    let cur: HTMLElement | null = node;
    while (cur) {
      stripInert(cur);
      cur = cur.parentElement as HTMLElement | null;
    }

    // MutationObserver to keep stripping inert from THIS modal element if reapplied
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (
          m.type === "attributes" &&
          m.attributeName === "inert" &&
          m.target instanceof HTMLElement
        ) {
          const target = m.target as HTMLElement;
          // Only touch if the target is this modal or one of its ancestors
          if (target === node || node.contains(target)) {
            stripInert(target);
          }
        }
      });
    });
    observer.observe(node, {
      attributes: true,
      subtree: false,
      attributeFilter: ["inert"],
    });

    // Additionally, dialog libraries add inert to previous portal containers that are
    // siblings of the one just created. We strip inert from ANY portal container
    // so long as background interaction is requested.
    const stripInertFromPortals = () => {
      const portals = document.querySelectorAll(
        "[data-radix-portal][inert], [data-headlessui-portal][inert]"
      );
      portals.forEach((el) => el.removeAttribute("inert"));
    };

    stripInertFromPortals();

    const globalObserver = new MutationObserver((mutList) => {
      mutList.forEach((m) => {
        if (
          m.type === "attributes" &&
          m.attributeName === "inert" &&
          (m.target as HTMLElement).hasAttribute("inert")
        ) {
          const target = m.target as HTMLElement;
          if (
            target.hasAttribute("data-radix-portal") ||
            target.hasAttribute("data-headlessui-portal")
          ) {
            stripInert(target as HTMLElement);
          }
        }
      });
    });
    globalObserver.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["inert"],
    });

    return () => {
      observer.disconnect();
      globalObserver.disconnect();
    };
  }, [allowBackgroundInteraction]);

  // Register this modal in the global registry for ESC handling
  const idRef = useRef<number>(Math.floor(Math.random() * 1e9));

  useEffect(() => {
    if (!isOpen) return;
    registerModal({
      id: idRef.current,
      zIndex,
      onClose,
      closeOnEsc,
    });

    return () => {
      unregisterModal(idRef.current);
    };
    // We intentionally want to run this only on mount/unmount when isOpen true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keep registry entry updated when props change
  useEffect(() => {
    if (!isOpen) return;
    updateModal(idRef.current, { zIndex, onClose, closeOnEsc });
  }, [isOpen, zIndex, onClose, closeOnEsc]);

  const getModalStyle = (): React.CSSProperties => {
    // fill the entire viewport even if theres a stored size or position
    if (expanded) {
      return {
        position: "fixed",
        left: 0,
        top: 0,
        margin: 0,
        zIndex,
        width: "100vw",
        height: "100vh",
        ...(allowBackgroundInteraction ? { pointerEvents: "auto" } : {}),
      };
    }

    if (!draggable || !position) {
      // For regular modals, only apply size if resizable to prevent layout issues
      return {
        ...(resizable && size
          ? { width: size.width, height: size.height }
          : {}),
        ...(allowBackgroundInteraction ? { pointerEvents: "auto" } : {}),
      };
    }
    return {
      position: "fixed",
      left: position.x,
      top: position.y,
      margin: 0,
      zIndex,
      ...(resizable && size ? { width: size.width, height: size.height } : {}),
      ...(allowBackgroundInteraction ? { pointerEvents: "auto" } : {}),
    };
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => !open && closeOnOutsideClick && onClose()}
      modal={!allowBackgroundInteraction}
    >
      <Dialog.Portal>
        <div
          className="fixed inset-0 z-[70]"
          style={
            allowBackgroundInteraction ? { pointerEvents: "none" } : undefined
          }
        >
          {/* Animated Backdrop */}
          {!allowBackgroundInteraction &&
            backdropTransitions((styles, item) =>
              item ? (
                <AnimatedBackdrop
                  key="backdrop"
                  styles={styles}
                  backdropClassName={backdropClassName}
                  disableHotkeyInput={disableHotkeyInput}
                  enableHotkeyInput={enableHotkeyInput}
                />
              ) : null
            )}
          {allowBackgroundInteraction && (
            <div
              className={twMerge("fixed inset-0 z-[69]", backdropClassName)}
              style={{ pointerEvents: "none" }}
            />
          )}

          <ModalExpandContext.Provider value={{ expanded, toggleExpanded }}>
            <div
              className="flex min-h-full items-center justify-center p-4 text-center"
              style={
                allowBackgroundInteraction
                  ? { pointerEvents: "none" }
                  : undefined
              }
            >
              {/* Animated Modal Content */}
              {transitions((styles, item) => {
                return item ? (
                  <Dialog.Content
                    forceMount
                    asChild
                    {...(accessibleDescription
                      ? {}
                      : ({ "aria-describedby": undefined } as any))}
                    onPointerDownOutside={(e) => {
                      if (!closeOnOutsideClick || allowBackgroundInteraction) {
                        e.preventDefault();
                      }
                    }}
                    onEscapeKeyDown={(e) => {
                      if (!closeOnEsc) {
                        e.preventDefault();
                      }
                    }}
                    onInteractOutside={(e) => {
                      if (allowBackgroundInteraction) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <animated.div
                      className={twMerge(
                        "w-full max-w-lg rounded-xl relative border border-ui-panel-border bg-ui-modal text-left align-middle shadow-2xl z-[70]",
                        childPadding && !expanded ? "p-4" : "",
                        className,
                        "!transition-none", // Always disable CSS transitions for spring animations
                        expanded &&
                          "w-screen h-screen max-w-screen max-h-screen rounded-none"
                      )}
                      ref={modalRef}
                      style={{
                        ...getModalStyle(),
                        opacity: styles.opacity,
                        transform: styles.transform,
                        transformOrigin: "center center",
                        willChange: "transform, opacity", // Optimize for animations
                      }}
                    >
                      <div className="w-full h-full">
                        {accessibleDescription && (
                          <VisuallyHidden asChild>
                            <Dialog.Description>
                              {accessibleDescription}
                            </Dialog.Description>
                          </VisuallyHidden>
                        )}
                        {title ? (
                          <Dialog.Title
                            className={twMerge(
                              "mb-4 flex justify-between pb-0 text-xl font-bold text-base-fg"
                            )}
                          >
                            <>
                              {onTitleIconClick ? (
                                <button
                                  className="flex items-center gap-3"
                                  onClick={onTitleIconClick}
                                >
                                  {titleIcon && (
                                    <FontAwesomeIcon
                                      icon={titleIcon}
                                      className={titleIconClassName}
                                    />
                                  )}
                                  {title}
                                </button>
                              ) : (
                                <div className="flex items-center gap-3">
                                  {titleIcon && (
                                    <FontAwesomeIcon
                                      icon={titleIcon}
                                      className={titleIconClassName}
                                    />
                                  )}
                                  {title}
                                </div>
                              )}
                            </>
                          </Dialog.Title>
                        ) : (
                          <VisuallyHidden asChild>
                            <Dialog.Title>
                              {accessibleTitle ?? "Dialog"}
                            </Dialog.Title>
                          </VisuallyHidden>
                        )}
                        <div className={`h-full`.trim()}>
                          {enhancedChildren}
                        </div>
                        {/* resize handles inside panel so clicks don't count as outside */}
                        {renderResizeHandles()}
                      </div>
                      {(showClose || expandable) && (
                        <div className="absolute top-0 right-0 m-2.5 z-[80] flex items-center gap-2">
                          {expandable && <Modal.ExpandButton />}
                          {showClose && <CloseButton onClick={onClose} />}
                        </div>
                      )}
                    </animated.div>
                  </Dialog.Content>
                ) : null;
              })}
            </div>
          </ModalExpandContext.Provider>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

Modal.DragHandle = DragHandle;
(Modal.DragHandle as any).displayName = "ModalDragHandle";

Modal.ExpandButton = ExpandButton;
ExpandButton.displayName = "ModalExpandButton";
