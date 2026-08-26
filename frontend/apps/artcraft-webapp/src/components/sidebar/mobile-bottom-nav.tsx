import { Link, useLocation } from "react-router-dom";
import { HouseIcon, ImageIcon, LayoutGridIcon, VideoIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { twMerge } from "tailwind-merge";

type NavItem = { label: string; href: string; icon: LucideIcon };

const ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: HouseIcon },
  { label: "Image", href: "/create-image", icon: ImageIcon },
  { label: "Video", href: "/create-video", icon: VideoIcon },
  { label: "Library", href: "/library", icon: LayoutGridIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

// Mobile-only bottom tab bar. Rendered as a flex child below the content so it
// never overlaps page chrome (e.g. the create form's Create bar).
export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="flex shrink-0 items-stretch border-t border-ui-panel-border bg-ui-panel pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={twMerge(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors",
              active
                ? "text-white"
                : "text-base-fg/55 hover:text-base-fg/80",
            )}
          >
            <DynamicIcon icon={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
