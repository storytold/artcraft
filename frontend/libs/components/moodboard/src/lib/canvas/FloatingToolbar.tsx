import { ReactNode } from "react";
import {
  ToolbarShell,
  ToolbarIconButton,
  ToolbarDivider,
} from "../ui/Toolbar";

interface FloatingToolbarProps {
  children: ReactNode;
  className?: string;
}

// Canvas top bar — the same glass island as the Grid toolbar (ToolbarShell),
// centered and detached from the top edge.
export const FloatingToolbar = ({
  children,
  className,
}: FloatingToolbarProps) => (
  <div className="pointer-events-none flex w-full justify-center pt-3">
    <ToolbarShell className={className}>{children}</ToolbarShell>
  </div>
);

// Re-exported under the canvas names so existing callers stay unchanged while
// sharing one button/divider look with the Grid toolbar.
export const FloatingToolbarDivider = ToolbarDivider;
export const FloatingToolbarButton = ToolbarIconButton;
