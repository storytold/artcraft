"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { SOCIAL_LINKS, WEBAPP_URL, webappUrl } from "@/lib/links";
import { Button } from "@/components/ui";
import ThemeToggle from "./theme-toggle";

type NavLeaf = { name: string; href: string };
type NavGroup = { name: string; href?: string; children: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

const NAV_ITEMS: NavEntry[] = [
  { name: "Home", href: "/" },
  { name: "Image", href: webappUrl("/create-image") },
  { name: "Video", href: webappUrl("/create-video") },
  {
    name: "Resources",
    children: [
      { name: "Tutorials", href: "/tutorials" },
      { name: "News", href: "/news" },
      { name: "FAQ", href: "/faq" },
      { name: "Press Kit", href: "/press-kit" },
    ],
  },
  { name: "Download", href: "/download" },
  { name: "Support", href: "/support" },
];

// Marathon-style: the inversion highlight sits on the label only, not the cell.
const NAV_LINK_CLASSES =
  "group flex h-full items-center px-2.5 hud-label whitespace-nowrap";
const NAV_LABEL_CLASSES =
  "flex items-center gap-1.5 px-1.5 py-0.5 group-hover:bg-invert-bg group-hover:text-invert-fg";
const NAV_LABEL_ACTIVE_CLASSES = "bg-invert-bg text-invert-fg";
const DROPDOWN_ITEM_CLASSES =
  "group flex px-3 py-2.5 hud-label whitespace-nowrap";

const isExternalHref = (href: string) => /^https?:\/\//.test(href);

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry && Array.isArray(entry.children);
}

function isPathActive(pathname: string, href: string): boolean {
  if (isExternalHref(href)) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function isEntryActive(pathname: string, entry: NavEntry): boolean {
  if (isGroup(entry)) {
    if (entry.href && isPathActive(pathname, entry.href)) return true;
    return entry.children.some((c) => isPathActive(pathname, c.href));
  }
  return isPathActive(pathname, entry.href);
}

export default function SiteNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 left-0 z-50 w-full border-b border-line bg-bg/95 backdrop-blur-sm">
      <div className="flex h-12 items-stretch justify-between">
        {/* Left: logo + nav cells */}
        <div className="flex min-w-0 items-stretch">
          <Link
            href="/"
            className="flex items-center border-r border-line px-4 hover:opacity-70 sm:px-5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="ArtCraft"
              src="/artcraft-icon.svg"
              className="themed-logo h-6 w-auto"
            />
          </Link>

          <NavigationMenu.Root
            delayDuration={120}
            className="hidden min-w-0 items-stretch lg:flex"
          >
            <NavigationMenu.List className="flex h-full items-stretch">
              {NAV_ITEMS.map((entry) => {
                const active = isEntryActive(pathname, entry);
                const linkClasses = twMerge(
                  NAV_LINK_CLASSES,
                  active ? "text-ink" : "text-muted hover:text-ink",
                );
                const labelClasses = twMerge(
                  NAV_LABEL_CLASSES,
                  active && NAV_LABEL_ACTIVE_CLASSES,
                );

                if (!isGroup(entry)) {
                  return (
                    <NavigationMenu.Item
                      key={entry.name}
                      className="flex items-stretch"
                    >
                      <NavigationMenu.Link asChild>
                        {isExternalHref(entry.href) ? (
                          <a href={entry.href} className={linkClasses}>
                            <span className={labelClasses}>{entry.name}</span>
                          </a>
                        ) : (
                          <Link
                            href={entry.href}
                            aria-current={active ? "page" : undefined}
                            className={linkClasses}
                          >
                            <span className={labelClasses}>{entry.name}</span>
                          </Link>
                        )}
                      </NavigationMenu.Link>
                    </NavigationMenu.Item>
                  );
                }

                return (
                  <NavigationMenu.Item
                    key={entry.name}
                    className="relative flex items-stretch"
                  >
                    <NavigationMenu.Trigger
                      className={twMerge(linkClasses, "focus:outline-none")}
                    >
                      <span className={labelClasses}>
                        {entry.name}
                        <ChevronDownIcon
                          aria-hidden
                          className="h-3 w-3 group-data-[state=open]:rotate-180"
                        />
                      </span>
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className="absolute top-full left-0 border border-t-0 border-line bg-bg">
                      <ul className="flex min-w-[200px] flex-col">
                        {entry.children.map((child) => {
                          const childActive = isPathActive(
                            pathname,
                            child.href,
                          );
                          return (
                            <li key={child.name}>
                              <NavigationMenu.Link asChild>
                                <Link
                                  href={child.href}
                                  aria-current={
                                    childActive ? "page" : undefined
                                  }
                                  className={twMerge(
                                    DROPDOWN_ITEM_CLASSES,
                                    childActive
                                      ? "text-ink"
                                      : "text-muted hover:text-ink",
                                  )}
                                >
                                  <span
                                    className={twMerge(
                                      NAV_LABEL_CLASSES,
                                      childActive && NAV_LABEL_ACTIVE_CLASSES,
                                    )}
                                  >
                                    {child.name}
                                  </span>
                                </Link>
                              </NavigationMenu.Link>
                            </li>
                          );
                        })}
                      </ul>
                    </NavigationMenu.Content>
                  </NavigationMenu.Item>
                );
              })}
            </NavigationMenu.List>
          </NavigationMenu.Root>
        </div>

        {/* Right: pricing, theme, launch app */}
        <div className="flex shrink-0 items-stretch">
          <div className="hidden items-stretch md:flex">
            <Link
              href="/pricing"
              className={twMerge(NAV_LINK_CLASSES, "text-muted hover:text-ink")}
            >
              <span className={NAV_LABEL_CLASSES}>Pricing</span>
            </Link>
            <ThemeToggle className="w-12 border-l border-line" />
            <Button
              href={WEBAPP_URL}
              className="h-full border-l border-line px-5"
            >
              Launch App
            </Button>
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex items-stretch md:hidden">
            <ThemeToggle className="w-12 border-l border-line" />
          </div>
          <div className="flex items-stretch lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className="flex w-12 items-center justify-center border-l border-line text-muted hover:bg-invert-bg hover:text-invert-fg"
            >
              <span className="sr-only">
                {mobileOpen ? "Close main menu" : "Open main menu"}
              </span>
              {mobileOpen ? (
                <XIcon aria-hidden className="h-5 w-5" />
              ) : (
                <MenuIcon aria-hidden className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile slide-down panel */}
      {mobileOpen && (
        <div id="mobile-nav" className="border-t border-line lg:hidden">
          <div className="flex flex-col">
            {NAV_ITEMS.map((entry) => {
              if (!isGroup(entry)) {
                const isCurrent = isPathActive(pathname, entry.href);
                const leafClassName = twMerge(
                  DROPDOWN_ITEM_CLASSES,
                  "py-3",
                  isCurrent ? "text-ink" : "text-muted active:text-ink",
                );
                const leafLabel = (
                  <span
                    className={twMerge(
                      "flex items-center px-1.5 py-0.5",
                      isCurrent && NAV_LABEL_ACTIVE_CLASSES,
                    )}
                  >
                    {entry.name}
                  </span>
                );
                return isExternalHref(entry.href) ? (
                  <a
                    key={entry.name}
                    href={entry.href}
                    className={leafClassName}
                  >
                    {leafLabel}
                  </a>
                ) : (
                  <Link
                    key={entry.name}
                    href={entry.href}
                    onClick={() => setMobileOpen(false)}
                    className={leafClassName}
                  >
                    {leafLabel}
                  </Link>
                );
              }

              return (
                <div key={entry.name} className="flex flex-col">
                  <div className="hud-label px-4 pt-3 pb-1 text-[10px] font-semibold tracking-[0.25em] text-faint">
                    {entry.name}
                  </div>
                  <div className="flex flex-col">
                    {entry.children.map((child) => {
                      const childActive = isPathActive(pathname, child.href);
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={twMerge(
                            DROPDOWN_ITEM_CLASSES,
                            "py-3 pl-8",
                            childActive
                              ? "text-ink"
                              : "text-muted active:text-ink",
                          )}
                        >
                          <span
                            className={twMerge(
                              "flex items-center px-1.5 py-0.5",
                              childActive && NAV_LABEL_ACTIVE_CLASSES,
                            )}
                          >
                            {child.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-line" />

          <Button
            href={WEBAPP_URL}
            className="h-11 w-full active:opacity-80"
          >
            Launch App
          </Button>
          <div className="flex items-stretch border-t border-line">
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="hud-label flex h-10 flex-1 items-center justify-center gap-1.5 border-r border-line text-[11px] text-muted active:bg-invert-bg active:text-invert-fg"
            >
              Pricing
            </Link>
            <a
              href={SOCIAL_LINKS.DISCORD}
              target="_blank"
              rel="noopener noreferrer"
              className="hud-label flex h-10 flex-1 items-center justify-center gap-1.5 text-[11px] text-muted active:bg-invert-bg active:text-invert-fg"
            >
              Discord
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
