import { type ReactNode } from "react";

interface DrawerSectionProps {
  label: string;
  children: ReactNode;
}

// A labeled group inside a SettingsDrawer (e.g. "Resolution", "Duration").
export function DrawerSection({ label, children }: DrawerSectionProps) {
  return (
    <div className="py-1">
      <span className="px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/45">
        {label}
      </span>
      {children}
    </div>
  );
}
