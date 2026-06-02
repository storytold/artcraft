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
}

// Bottom sheet used for every mobile settings group (model, output, etc.).
export function SettingsDrawer({
  open,
  onOpenChange,
  title,
  children,
}: SettingsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
