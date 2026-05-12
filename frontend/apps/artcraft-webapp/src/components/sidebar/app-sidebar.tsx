import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faVideo,
  faImage,
  faWandMagicSparkles,
  faGrid2,
  faGraduationCap,
  faNewspaper,
  faCircleQuestion,
  faDownload,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { Button } from "@storyteller/ui-button";
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

type NavItem = {
  label: string;
  href: string;
  icon: IconDefinition;
  external?: boolean;
};

const PRIMARY_ITEMS: NavItem[] = [{ label: "Home", href: "/", icon: faHouse }];

const CREATE_ITEMS: NavItem[] = [
  { label: "Image", href: "/create-image", icon: faImage },
  { label: "Video", href: "/create-video", icon: faVideo },
  {
    label: "BG Change",
    href: "/background-change",
    icon: faWandMagicSparkles,
  },
];

const ASSETS_ITEMS: NavItem[] = [
  { label: "Library", href: "/library", icon: faGrid2 },
];

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
      <span>{item.label}</span>
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
  const showSidebarLogo = state === "expanded" || isMobile;

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
          items={CREATE_ITEMS}
          pathname={pathname}
          onClick={handleNavClick}
        />
        <NavSection
          label="Assets"
          items={ASSETS_ITEMS}
          pathname={pathname}
          onClick={handleNavClick}
        />
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
