import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faImage,
  faVideo,
  faGrid2,
} from "@fortawesome/pro-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { twMerge } from "tailwind-merge";

type NavItem = { label: string; href: string; icon: IconDefinition };

const ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: faHouse },
  { label: "Image", href: "/create-image", icon: faImage },
  { label: "Video", href: "/create-video", icon: faVideo },
  { label: "Library", href: "/library", icon: faGrid2 },
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
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors active:scale-95",
              active
                ? "text-primary"
                : "text-base-fg/55 hover:text-base-fg/80",
            )}
          >
            <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
