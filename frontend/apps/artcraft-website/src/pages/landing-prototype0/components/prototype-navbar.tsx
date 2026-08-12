import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { twMerge } from "tailwind-merge";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { USER_FEATURE_FLAGS, UsersApi } from "@storyteller/api";
import {
  ChevronDownIcon,
  GiftIcon,
  LifeBuoyIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { DynamicIcon, DiscordIcon } from "@storyteller/icons";
import { useSession, invalidateSession } from "../../../lib/session";
import {
  appLink,
  SOCIAL_LINKS,
  USE_WEBAPP_FOR_APP_FEATURES,
  WEBAPP_URL,
  webappUrl,
} from "../../../config/links";

type NavLeaf = { name: string; href: string };
type NavGroup = { name: string; href?: string; children: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

const NAV_ITEMS: NavEntry[] = [
  { name: "Home", href: "/" },
  { name: "Image", href: appLink("/create-image") },
  { name: "Video", href: appLink("/create-video") },
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

// Marathon-style: the neon highlight sits on the label only, not the whole cell.
const NAV_LINK_CLASSES =
  "group flex h-full items-center px-2.5 font-mono text-xs font-medium uppercase tracking-[0.15em] whitespace-nowrap";
const NAV_LABEL_CLASSES =
  "flex items-center gap-1.5 px-1.5 py-0.5 group-hover:bg-white group-hover:text-black";
const NAV_LABEL_ACTIVE_CLASSES = "bg-white text-black";
const DROPDOWN_ITEM_CLASSES =
  "group flex px-3 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.15em] whitespace-nowrap";
const SOLID_CTA_CLASSES =
  "flex h-full items-center border-l border-white/15 bg-white px-5 font-mono text-xs font-bold uppercase tracking-[0.15em] text-black hover:bg-white/80";

const isExternalHref = (href: string) => /^https?:\/\//.test(href);

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry && Array.isArray(entry.children);
}

function isPathActive(pathname: string, href: string): boolean {
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

export default function PrototypeNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authChecked } = useSession();
  const isLoading = !authChecked;
  const hasReferralsFlag = !!user?.maybe_feature_flags?.includes(
    USER_FEATURE_FLAGS.REFERRALS,
  );

  const handleLogout = async () => {
    const api = new UsersApi();
    await api.Logout();
    invalidateSession();
    window.location.href = "/";
  };

  return (
    <Disclosure
      as="nav"
      className="sticky top-0 left-0 z-50 w-full border-b border-white/15 bg-[#0b0b0c]/95 backdrop-blur-sm"
    >
      {({ open }) => (
        <>
          <div className="flex h-12 items-stretch justify-between">
            {/* Left: Logo + nav items */}
            <div className="flex items-stretch min-w-0">
              <Link
                to="/"
                className="flex items-center border-r border-white/15 px-4 sm:px-5 hover:opacity-70"
              >
                <img
                  alt="ArtCraft"
                  src="/artcraft-icon.svg"
                  className="h-6 w-auto brightness-0 invert"
                />
              </Link>

              <NavigationMenu.Root
                delayDuration={120}
                className="hidden lg:flex items-stretch min-w-0"
              >
                <NavigationMenu.List className="flex items-stretch h-full">
                  {NAV_ITEMS.map((entry) => {
                    const active = isEntryActive(location.pathname, entry);
                    const linkClasses = twMerge(
                      NAV_LINK_CLASSES,
                      active ? "text-white" : "text-white/75 hover:text-white",
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
                                <span className={labelClasses}>
                                  {entry.name}
                                </span>
                              </a>
                            ) : (
                              <Link
                                to={entry.href}
                                aria-current={active ? "page" : undefined}
                                className={linkClasses}
                              >
                                <span className={labelClasses}>
                                  {entry.name}
                                </span>
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
                        {entry.href ? (
                          <NavigationMenu.Trigger asChild>
                            <Link
                              to={entry.href}
                              aria-current={active ? "page" : undefined}
                              className={linkClasses}
                            >
                              <span className={labelClasses}>
                                {entry.name}
                                <ChevronDownIcon className="text-[9px] group-data-[state=open]:rotate-180" />
                              </span>
                            </Link>
                          </NavigationMenu.Trigger>
                        ) : (
                          <NavigationMenu.Trigger
                            className={twMerge(
                              linkClasses,
                              "focus:outline-none",
                            )}
                          >
                            <span className={labelClasses}>
                              {entry.name}
                              <ChevronDownIcon className="text-[9px] group-data-[state=open]:rotate-180" />
                            </span>
                          </NavigationMenu.Trigger>
                        )}
                        <NavigationMenu.Content className="absolute top-full left-0 border border-white/15 border-t-0 bg-[#0b0b0c]">
                          <ul className="flex flex-col min-w-[200px]">
                            {entry.children.map((child) => {
                              const childActive = isPathActive(
                                location.pathname,
                                child.href,
                              );
                              return (
                                <li key={child.name}>
                                  <NavigationMenu.Link asChild>
                                    <Link
                                      to={child.href}
                                      aria-current={
                                        childActive ? "page" : undefined
                                      }
                                      className={twMerge(
                                        DROPDOWN_ITEM_CLASSES,
                                        childActive
                                          ? "text-white"
                                          : "text-white/60 hover:text-white",
                                      )}
                                    >
                                      <span
                                        className={twMerge(
                                          NAV_LABEL_CLASSES,
                                          childActive &&
                                            NAV_LABEL_ACTIVE_CLASSES,
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

            {/* Right: Auth + launch app */}
            <div className="flex items-stretch shrink-0">
              {isLoading ? (
                <div className="hidden md:flex items-stretch opacity-0" />
              ) : user ? (
                <div className="hidden md:flex items-stretch">
                  <Link
                    to="/pricing"
                    className={twMerge(
                      NAV_LINK_CLASSES,
                      "hidden xl:flex text-white/60 hover:text-white",
                    )}
                  >
                    <span className={NAV_LABEL_CLASSES}>Pricing</span>
                  </Link>

                  {USE_WEBAPP_FOR_APP_FEATURES && (
                    <a href={WEBAPP_URL} className={SOLID_CTA_CLASSES}>
                      Launch App
                    </a>
                  )}

                  <Menu
                    as="div"
                    className="relative flex items-stretch border-l border-white/15"
                  >
                    <MenuButton className="flex items-center px-3 hover:bg-white/10 focus:outline-none">
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-7 w-7 object-cover"
                        src={`https://www.gravatar.com/avatar/${user.email_gravatar_hash}?d=mp`}
                        alt=""
                      />
                    </MenuButton>
                    <MenuItems
                      modal={false}
                      className="absolute right-0 top-full z-50 w-52 border border-white/15 border-t-0 bg-[#0b0b0c] focus:outline-none"
                    >
                      <div className="border-b border-white/15 px-4 py-3">
                        <p className="truncate font-mono text-xs font-medium uppercase tracking-[0.1em] text-white">
                          {user.display_name || user.username}
                        </p>
                      </div>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={() => navigate("/support")}
                            className={twMerge(
                              DROPDOWN_ITEM_CLASSES,
                              "w-full text-left text-white/60",
                              active && "text-white",
                            )}
                          >
                            <span
                              className={twMerge(
                                "flex items-center gap-2 px-1.5 py-0.5",
                                active && NAV_LABEL_ACTIVE_CLASSES,
                              )}
                            >
                              <LifeBuoyIcon className="text-[11px]" />
                              Support
                            </span>
                          </button>
                        )}
                      </MenuItem>
                      {hasReferralsFlag && (
                        <MenuItem>
                          {({ active }) => (
                            <a
                              href={webappUrl("/referrals")}
                              className={twMerge(
                                DROPDOWN_ITEM_CLASSES,
                                "w-full text-white/60",
                                active && "text-white",
                              )}
                            >
                              <span
                                className={twMerge(
                                  "flex items-center gap-2 px-1.5 py-0.5",
                                  active && NAV_LABEL_ACTIVE_CLASSES,
                                )}
                              >
                                <GiftIcon className="text-[11px]" />
                                Referrals
                              </span>
                            </a>
                          )}
                        </MenuItem>
                      )}
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href={SOCIAL_LINKS.DISCORD}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={twMerge(
                              DROPDOWN_ITEM_CLASSES,
                              "w-full text-white/60",
                              active && "text-white",
                            )}
                          >
                            <span
                              className={twMerge(
                                "flex items-center gap-2 px-1.5 py-0.5",
                                active && NAV_LABEL_ACTIVE_CLASSES,
                              )}
                            >
                              <DiscordIcon className="text-[11px]" />
                              Join Discord
                            </span>
                          </a>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={twMerge(
                              DROPDOWN_ITEM_CLASSES,
                              "w-full text-left text-red-400",
                            )}
                          >
                            <span
                              className={twMerge(
                                "flex items-center px-1.5 py-0.5",
                                active && "bg-red-500 text-white",
                              )}
                            >
                              Sign out
                            </span>
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </div>
              ) : (
                <div className="hidden md:flex items-stretch">
                  <Link
                    to="/pricing"
                    className={twMerge(
                      NAV_LINK_CLASSES,
                      "text-white/60 hover:text-white",
                    )}
                  >
                    <span className={NAV_LABEL_CLASSES}>Pricing</span>
                  </Link>
                  {USE_WEBAPP_FOR_APP_FEATURES ? (
                    <a href={WEBAPP_URL} className={SOLID_CTA_CLASSES}>
                      Launch App
                    </a>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className={twMerge(
                          NAV_LINK_CLASSES,
                          "border-l border-white/15 text-white/60 hover:text-white",
                        )}
                      >
                        <span className={NAV_LABEL_CLASSES}>Login</span>
                      </Link>
                      <Link to="/signup" className={SOLID_CTA_CLASSES}>
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Mobile: hamburger only */}
              <div className="flex items-stretch lg:hidden">
                <DisclosureButton className="flex w-12 items-center justify-center border-l border-white/15 text-white/70 hover:bg-white hover:text-black">
                  <span className="sr-only">Open main menu</span>
                  <DynamicIcon
                    icon={open ? XIcon : MenuIcon}
                    className="text-base"
                  />
                </DisclosureButton>
              </div>
            </div>
          </div>

          {/* Mobile slide-down panel */}
          <DisclosurePanel className="lg:hidden border-t border-white/15">
            <div className="flex flex-col">
              {NAV_ITEMS.map((entry) => {
                if (!isGroup(entry)) {
                  const isCurrent = isPathActive(location.pathname, entry.href);
                  const leafClassName = twMerge(
                    DROPDOWN_ITEM_CLASSES,
                    "py-3",
                    isCurrent
                      ? "text-white"
                      : "text-white/60 active:text-white",
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
                    <DisclosureButton
                      key={entry.name}
                      as="a"
                      href={entry.href}
                      className={leafClassName}
                    >
                      {leafLabel}
                    </DisclosureButton>
                  ) : (
                    <DisclosureButton
                      key={entry.name}
                      as={Link}
                      to={entry.href}
                      className={leafClassName}
                    >
                      {leafLabel}
                    </DisclosureButton>
                  );
                }

                const headerActive =
                  entry.href !== undefined &&
                  isPathActive(location.pathname, entry.href);

                return (
                  <div key={entry.name} className="flex flex-col">
                    {entry.href ? (
                      <DisclosureButton
                        as={Link}
                        to={entry.href}
                        className={twMerge(
                          DROPDOWN_ITEM_CLASSES,
                          "py-3",
                          headerActive
                            ? "text-white"
                            : "text-white/60 active:text-white",
                        )}
                      >
                        <span
                          className={twMerge(
                            "flex items-center px-1.5 py-0.5",
                            headerActive && NAV_LABEL_ACTIVE_CLASSES,
                          )}
                        >
                          {entry.name}
                        </span>
                      </DisclosureButton>
                    ) : (
                      <div className="px-4 pt-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
                        {entry.name}
                      </div>
                    )}
                    <div className="flex flex-col">
                      {entry.children.map((child) => {
                        const childActive = isPathActive(
                          location.pathname,
                          child.href,
                        );
                        return (
                          <DisclosureButton
                            key={child.name}
                            as={Link}
                            to={child.href}
                            className={twMerge(
                              DROPDOWN_ITEM_CLASSES,
                              "py-3 pl-8",
                              childActive
                                ? "text-white"
                                : "text-white/55 active:text-white",
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
                          </DisclosureButton>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/15" />

            {!isLoading && user ? (
              <div className="flex flex-col">
                {USE_WEBAPP_FOR_APP_FEATURES && (
                  <DisclosureButton
                    as="a"
                    href={WEBAPP_URL}
                    className="flex h-11 items-center justify-center bg-white px-4 font-mono text-xs font-bold uppercase tracking-[0.15em] text-black active:bg-white/80"
                  >
                    Launch App
                  </DisclosureButton>
                )}
                <div className="flex items-stretch border-t border-white/15">
                  <DisclosureButton
                    as={Link}
                    to="/pricing"
                    className="flex flex-1 h-10 items-center justify-center gap-1.5 border-r border-white/15 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 active:bg-white active:text-black"
                  >
                    Pricing
                  </DisclosureButton>
                  <DisclosureButton
                    as="a"
                    href={SOCIAL_LINKS.DISCORD}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 h-10 items-center justify-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 active:bg-white active:text-black"
                  >
                    <DiscordIcon className="text-[10px]" />
                    Discord
                  </DisclosureButton>
                  {hasReferralsFlag && (
                    <DisclosureButton
                      as="a"
                      href={webappUrl("/referrals")}
                      className="flex flex-1 h-10 items-center justify-center gap-1.5 border-l border-white/15 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 active:bg-white active:text-black"
                    >
                      <GiftIcon className="text-[10px]" />
                      Referrals
                    </DisclosureButton>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-white/15 px-4 py-3">
                  <img
                    className="h-7 w-7 shrink-0 border border-white/15 object-cover"
                    src={`https://www.gravatar.com/avatar/${user.email_gravatar_hash}?d=mp`}
                    alt=""
                  />
                  <span className="flex-1 truncate font-mono text-xs font-medium uppercase tracking-[0.1em] text-white/80">
                    {user.display_name || user.username}
                  </span>
                  <DisclosureButton
                    as="button"
                    onClick={handleLogout}
                    className="flex h-8 shrink-0 items-center px-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-red-400 active:bg-red-500 active:text-white"
                  >
                    Sign out
                  </DisclosureButton>
                </div>
              </div>
            ) : !isLoading ? (
              USE_WEBAPP_FOR_APP_FEATURES ? (
                <DisclosureButton
                  as="a"
                  href={WEBAPP_URL}
                  className="flex h-11 items-center justify-center bg-white px-4 font-mono text-xs font-bold uppercase tracking-[0.15em] text-black active:bg-white/80"
                >
                  Launch App
                </DisclosureButton>
              ) : (
                <div className="flex items-stretch">
                  <DisclosureButton
                    as={Link}
                    to="/login"
                    className="flex h-11 flex-1 items-center justify-center border-r border-white/15 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-white/80 active:bg-white active:text-black"
                  >
                    Login
                  </DisclosureButton>
                  <DisclosureButton
                    as={Link}
                    to="/signup"
                    className="flex h-11 flex-1 items-center justify-center bg-white font-mono text-xs font-bold uppercase tracking-[0.15em] text-black active:bg-white/80"
                  >
                    Sign up
                  </DisclosureButton>
                </div>
              )
            ) : null}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
