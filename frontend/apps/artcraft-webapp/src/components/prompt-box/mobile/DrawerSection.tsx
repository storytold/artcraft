import { type ReactNode } from "react";

interface DrawerSectionProps {
  label: string;
  children: ReactNode;
}

// A labeled group inside a SettingsDrawer (e.g. "Resolution", "Duration").
export function DrawerSection({ label, children }: DrawerSectionProps) {
  return (
    <div className="py-1">
      <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-base-fg/45">
        {label}
      </span>
      {children}
    </div>
  );
}
