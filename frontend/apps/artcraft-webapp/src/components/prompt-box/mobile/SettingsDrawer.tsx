import { type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";

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
}

// Bottom sheet used for every mobile settings group (model, output, etc.).
export function SettingsDrawer({
  open,
  onOpenChange,
  title,
  children,
  modal = true,
}: SettingsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={modal}>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="ac-drawer-content max-h-[80vh] rounded-t-2xl bg-ui-panel pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />
        <SheetHeader className="pb-2">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
