import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faVideo,
  faImage,
  faCube,
  faFilm,
  faWandMagicSparkles,
  faGraduationCap,
  faNewspaper,
  faCircleQuestion,
  faDownload,
  faGift,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { Button } from "@storyteller/ui-button";
import { USER_FEATURE_FLAGS } from "@storyteller/api";
import { useSession } from "../../lib/session";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "../ui/sidebar";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { MARKETING_SITE, SOCIAL_LINKS } from "../../config/links";
import { useSceneCacheStore } from "../../pages/pagescene/scene-cache-store";
import { LibraryFoldersNav } from "./library-folders-nav";

type NavItem = {
  label: string;
  href: string;
  icon: IconDefinition;
  external?: boolean;
  badge?: string;
};

const PRIMARY_ITEMS: NavItem[] = [{ label: "Home", href: "/", icon: faHouse }];

// "Edit 3D" entry's href is computed at render time from the
// session-scoped scene-cache store (see useCreateItems below). The other
// entries stay static.
const CREATE_ITEMS_STATIC: NavItem[] = [
  { label: "Image", href: "/create-image", icon: faImage },
  { label: "Video", href: "/create-video", icon: faVideo },
  { label: "Edit 3D", href: "/edit-3d", icon: faCube },
  { label: "Edit Video", href: "/video-editor", icon: faFilm, badge: "BETA" },
  {
    label: "BG Change",
    href: "/background-change",
    icon: faWandMagicSparkles,
  },
];

// Rewrite the "Edit 3D" item's href to point at the user's last visited
// scene (if any) so returning to the editor from another sidebar page
// drops them back into the same scene rather than the blank splash.
// sessionStorage scope — closes when the tab closes.
function useCreateItems(): NavItem[] {
  const lastSceneToken = useSceneCacheStore((s) => s.lastVisitedSceneToken);
  return useMemo(
    () =>
      CREATE_ITEMS_STATIC.map((item) =>
        item.href === "/edit-3d" && lastSceneToken
          ? { ...item, href: `/edit-3d/${lastSceneToken}` }
          : item,
      ),
    [lastSceneToken],
  );
}

const REFERRALS_ITEM: NavItem = {
  label: "Referrals",
  href: "/referrals",
  icon: faGift,
};

const RESOURCES_ITEMS: NavItem[] = [
  {
    label: "Tutorials",
    href: `${MARKETING_SITE}/tutorials`,
    icon: faGraduationCap,
    external: true,
  },
  {
    label: "News",
    href: `${MARKETING_SITE}/news`,
    icon: faNewspaper,
    external: true,
  },
  {
    label: "FAQ",
    href: `${MARKETING_SITE}/faq`,
    icon: faCircleQuestion,
    external: true,
  },
];

const SUPPORT_ITEMS: NavItem[] = [
  {
    label: "Join Discord",
    href: SOCIAL_LINKS.DISCORD,
    icon: faDiscord,
    external: true,
  },
];

const DOWNLOAD_URL = `${MARKETING_SITE}/download`;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // Treat /edit-3d and /edit-3d/<token> as the same nav target — the
  // sidebar item's href may carry a remembered token, but we still want
  // the nav-item to highlight when the user is on any /edit-3d* route.
  if (href.startsWith("/edit-3d")) return pathname.startsWith("/edit-3d");
  return pathname === href || pathname.startsWith(href + "/");
}

function NavMenuItem({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick: () => void;
}) {
  const inner = (
    <>
      <FontAwesomeIcon icon={item.icon} />
      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-white group-data-[collapsible=icon]:hidden rounded-full">
          {item.badge}
        </span>
      )}
    </>
  );
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={!item.external && isActive(pathname, item.href)}
        tooltip={item.label}
      >
        {item.external ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
          >
            {inner}
          </a>
        ) : (
          <Link to={item.href} onClick={onClick}>
            {inner}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavSection({
  label,
  items,
  pathname,
  onClick,
  className,
}: {
  label?: string;
  items: NavItem[];
  pathname: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <SidebarGroup className={className}>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <NavMenuItem
              key={item.href}
              item={item}
              pathname={pathname}
              onClick={onClick}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const { user } = useSession();
  const showSidebarLogo = state === "expanded" || isMobile;
  const createItems = useCreateItems();

  const hasReferralsFlag = !!user?.maybe_feature_flags?.includes(
    USER_FEATURE_FLAGS.REFERRALS,
  );

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="px-3 py-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          {showSidebarLogo && (
            <Link
              to="/"
              onClick={handleNavClick}
              className="flex items-center gap-2"
            >
              <img
                src="/images/artcraft-logo.png"
                alt="ArtCraft"
                className="h-5 w-auto shrink-0"
              />
            </Link>
          )}
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavSection
          className="pt-1"
          items={PRIMARY_ITEMS}
          pathname={pathname}
          onClick={handleNavClick}
        />
        <NavSection
          label="Create"
          items={createItems}
          pathname={pathname}
          onClick={handleNavClick}
        />
        <LibraryFoldersNav pathname={pathname} onNavClick={handleNavClick} />
        {hasReferralsFlag && (
          <NavSection
            label="Invite"
            items={[REFERRALS_ITEM]}
            pathname={pathname}
            onClick={handleNavClick}
          />
        )}
        <NavSection
          label="Resources"
          items={RESOURCES_ITEMS}
          pathname={pathname}
          onClick={handleNavClick}
        />
        <NavSection
          label="Support"
          items={SUPPORT_ITEMS}
          pathname={pathname}
          onClick={handleNavClick}
        />
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <Button
          variant="primary"
          icon={faDownload}
          onClick={() =>
            window.open(DOWNLOAD_URL, "_blank", "noopener,noreferrer")
          }
          className="w-full justify-center h-9 text-sm font-semibold rounded-full"
        >
          Download ArtCraft
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
