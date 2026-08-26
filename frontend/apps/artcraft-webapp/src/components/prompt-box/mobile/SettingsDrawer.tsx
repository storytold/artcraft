import { useRef, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";

// Drag distance past which releasing the handle dismisses the drawer.
const DRAG_DISMISS_PX = 80;

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  // Defaults to a modal sheet (focus trap + body scroll lock). Pass false when
  // this drawer opens another modal on top of it: two modal Radix layers each
  // lock <body> (react-remove-scroll adds a `pointer-events: none` class), and
  // their overlapping mount/unmount strands one of those locks on <body>,
  // freezing the whole page. A non-modal sheet skips the lock entirely.
  modal?: boolean;
  // Visually hide the header (the title stays for screen readers) when the
  // drawer body renders its own heading, e.g. a back-arrow sub-view.
  hideHeader?: boolean;
}

// Bottom sheet used for every mobile settings group (model, output, etc.).
export function SettingsDrawer({
  open,
  onOpenChange,
  title,
  children,
  modal = true,
  hideHeader = false,
}: SettingsDrawerProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startY: 0, delta: 0 });

  const endDrag = () => {
    if (!drag.current.active) return;
    const { delta } = drag.current;
    drag.current.active = false;
    const el = sheetRef.current;
    if (el) {
      // Restore the base transition so the snap back to rest animates.
      el.style.transition = "";
      el.style.transform = "";
      if (delta > DRAG_DISMISS_PX) {
        // Radix unmounts the sheet after the close animation, so the var
        // never leaks into later opens or button/backdrop closes.
        el.style.setProperty("--ac-drawer-drag-y", `${delta}px`);
      }
    }
    if (delta > DRAG_DISMISS_PX) onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={modal}>
      <SheetContent
        ref={sheetRef}
        side="bottom"
        aria-describedby={undefined}
        modal={modal}
        open={open}
        className="ac-drawer-content max-h-[80vh] bg-ui-panel pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
          <XIcon  className="text-sm" />
        </button>
        {/* Drag zone: the handle pill + header pull the sheet down; past the
            threshold, releasing dismisses. `touch-none` keeps the browser
            from claiming the gesture for scrolling. The body below scrolls
            natively and does not drag. */}
        <div
          className={hideHeader ? "shrink-0 touch-none pb-3" : "shrink-0 touch-none"}
          onPointerDown={(e) => {
            drag.current = { active: true, startY: e.clientY, delta: 0 };
            e.currentTarget.setPointerCapture(e.pointerId);
            // The sheet's base `transition` class would ease each transform
            // update ~150ms behind the finger — disable it while dragging
            // so the sheet sticks to the thumb.
            const el = sheetRef.current;
            if (el) el.style.transition = "none";
          }}
          onPointerMove={(e) => {
            if (!drag.current.active) return;
            const raw = e.clientY - drag.current.startY;
            drag.current.delta = raw;
            const el = sheetRef.current;
            if (el) {
              // Downward tracks 1:1; upward rubber-bands (the sheet can't
              // grow, but a dead stop feels broken).
              const y = raw >= 0 ? raw : Math.max(raw / 4, -32);
              el.style.transform = `translateY(${y}px)`;
            }
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 bg-white/20" />
          <SheetHeader className={hideHeader ? "sr-only" : "select-none pb-2 pr-12"}>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
