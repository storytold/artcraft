import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { twMerge } from "tailwind-merge";
import { useEffect, useState, Fragment } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@storyteller/ui-button";
import { PopoverMenu } from "@storyteller/ui-popover";
import { UsersApi, CreditsApi, BillingApi } from "@storyteller/api";
import { useSession, invalidateSession } from "../../lib/session";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faGrid2,
  faBars,
  faXmark,
  faGem,
  faCog,
  faArrowRight,
  faChevronDown,
  faLifeRing,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { TaskQueue } from "./task-queue";
import { CreditsModal } from "../credits-modal";
import { SettingsModal } from "../settings-modal/SettingsModal";
import { SOCIAL_LINKS } from "../../config/links";

type NavLeaf = { name: string; href: string };
type NavGroup = { name: string; href?: string; children: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

const NAV_ITEMS: NavEntry[] = [
  { name: "Home", href: "/" },
  { name: "Image", href: "/create-image" },
  { name: "Video", href: "/create-video" },
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

async function fetchCredits(): Promise<number | null> {
  try {
    const api = new CreditsApi();
    const response = await api.GetSessionCredits();
    if (response.success && response.data) {
      return response.data.sumTotalCredits;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchHasPaidPlan(): Promise<boolean> {
  try {
    const api = new BillingApi();
    const response = await api.ListActiveSubscriptions();
    if (response.success && response.data?.active_subscriptions) {
      return response.data.active_subscriptions.some(
        (sub) => sub.namespace === "artcraft",
      );
    }
    return false;
  } catch {
    return false;
  }
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authChecked } = useSession();
  const isLoading = !authChecked;
  const [credits, setCredits] = useState<number | null>(null);
  const [hasPaidPlan, setHasPaidPlan] = useState<boolean | null>(null);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCredits().then(setCredits);
      fetchHasPaidPlan().then(setHasPaidPlan);
    } else {
      setCredits(null);
      setHasPaidPlan(null);
    }
  }, [user]);

  useEffect(() => {
    const handleCreditsChange = () => {
      fetchCredits().then(setCredits);
    };
    window.addEventListener("credits-change", handleCreditsChange);
    return () => window.removeEventListener("credits-change", handleCreditsChange);
  }, []);

  const handleLogout = async () => {
    const api = new UsersApi();
    await api.Logout();
    invalidateSession();
    window.location.href = "/";
  };

  return (
    <Disclosure
      as="nav"
      className="z-50 fixed top-0 left-0 w-full font-display"
    >
      {({ open }) => {
        const isFullWidthRoute =
          location.pathname.startsWith("/create-image") ||
          location.pathname.startsWith("/create-video");

        return (
          <div className="px-3 sm:px-5 pt-3">
            <div
              className={twMerge(
                "liquid-glass mx-auto rounded-3xl transition-[max-width] duration-300",
                isFullWidthRoute ? "max-w-none" : "max-w-6xl",
              )}
            >
              <div className="flex h-11 sm:h-12 items-center justify-between pl-4 pr-2 sm:pl-5 sm:pr-2.5">
                {/* Left: Logo + nav items */}
                <div className="flex items-center gap-5 min-w-0">
                  <Link to="/" className="flex items-center shrink-0">
                    <img
                      alt="ArtCraft"
                      src="/images/artcraft-logo.png"
                      className="h-5 sm:h-5 w-auto"
                    />
                  </Link>

                  <NavigationMenu.Root
                    delayDuration={120}
                    className="hidden lg:flex items-center min-w-0"
                  >
                    <NavigationMenu.List className="flex items-center">
                      {NAV_ITEMS.map((entry) => {
                        const active = isEntryActive(location.pathname, entry);
                        const baseClasses =
                          "px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5";
                        const stateClasses = active
                          ? "text-white bg-white/[0.08]"
                          : "text-white/60 hover:text-white hover:bg-white/[0.04]";

                        if (!isGroup(entry)) {
                          return (
                            <NavigationMenu.Item key={entry.name}>
                              <NavigationMenu.Link asChild>
                                <Link
                                  to={entry.href}
                                  aria-current={active ? "page" : undefined}
                                  className={twMerge(baseClasses, stateClasses)}
                                >
                                  {entry.name}
                                </Link>
                              </NavigationMenu.Link>
                            </NavigationMenu.Item>
                          );
                        }

                        return (
                          <NavigationMenu.Item
                            key={entry.name}
                            className="relative"
                          >
                            {entry.href ? (
                              <NavigationMenu.Trigger asChild>
                                <Link
                                  to={entry.href}
                                  aria-current={active ? "page" : undefined}
                                  className={twMerge(
                                    baseClasses,
                                    stateClasses,
                                    "group",
                                  )}
                                >
                                  {entry.name}
                                  <FontAwesomeIcon
                                    icon={faChevronDown}
                                    className="text-[9px] transition-transform duration-200 group-data-[state=open]:rotate-180"
                                  />
                                </Link>
                              </NavigationMenu.Trigger>
                            ) : (
                              <NavigationMenu.Trigger
                                className={twMerge(
                                  baseClasses,
                                  stateClasses,
                                  "group focus:outline-none",
                                )}
                              >
                                {entry.name}
                                <FontAwesomeIcon
                                  icon={faChevronDown}
                                  className="text-[9px] transition-transform duration-200 group-data-[state=open]:rotate-180"
                                />
                              </NavigationMenu.Trigger>
                            )}
                            <NavigationMenu.Content
                              className="absolute top-full left-0 mt-2 rounded-xl border border-white/[0.08] bg-[#1a1a1a] shadow-xl overflow-hidden"
                            >
                              <ul className="flex flex-col p-1.5 min-w-[180px]">
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
                                            "block px-3 py-2 text-[13px] font-medium rounded-lg transition-colors whitespace-nowrap",
                                            childActive
                                              ? "text-white bg-white/[0.08]"
                                              : "text-white/70 hover:text-white hover:bg-white/[0.06]",
                                          )}
                                        >
                                          {child.name}
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

                {/* Right: Auth/credits/library */}
                <div className="flex items-center gap-2 shrink-0">
                  {isLoading ? (
                    <div className="hidden md:flex items-center gap-2 opacity-0" />
                  ) : user ? (
                    <div className="hidden md:flex items-center gap-2">
                      <Link
                        to="/pricing"
                        className="hidden xl:flex h-8 items-center gap-1.5 px-3 rounded-lg text-[13px] font-medium text-white/90 hover:text-white hover:bg-white/[0.04] transition-all"
                      >
                        <FontAwesomeIcon icon={faGem} className="text-[11px]" />
                        Pricing
                      </Link>

                      {credits !== null && (
                        <PopoverMenu
                          position="bottom"
                          align="center"
                          triggerIcon={
                            <FontAwesomeIcon
                              icon={faCoins}
                              className="text-primary text-[11px]"
                            />
                          }
                          triggerLabel={
                            <span className="whitespace-nowrap text-[13px] font-medium">
                              {credits.toLocaleString()}
                            </span>
                          }
                          buttonClassName="h-8 px-3 ps-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] shadow-none text-white/80 rounded-lg gap-1.5"
                          panelClassName="mt-2 bg-[#1a1a1a] border border-white/[0.08] text-white rounded-xl font-display"
                        >
                          {(close) => (
                            <div className="w-72 p-3 text-white">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-white/70">
                                  Your credit balance
                                </span>
                                <button
                                  className="text-sm font-medium text-primary hover:text-primary-300 transition-colors"
                                  onClick={() => {
                                    close();
                                    setCreditsModalOpen(true);
                                  }}
                                >
                                  Buy credits
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-3xl font-medium text-white tracking-tight">
                                <FontAwesomeIcon
                                  icon={faCoins}
                                  className="text-xl text-primary"
                                />
                                {credits.toLocaleString()}
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button
                                  variant="primary"
                                  className="h-9 grow"
                                  onClick={() => {
                                    close();
                                    navigate("/pricing");
                                  }}
                                  icon={faGem}
                                >
                                  Upgrade
                                </Button>
                              </div>
                            </div>
                          )}
                        </PopoverMenu>
                      )}

                      {hasPaidPlan === false && (
                        <Button
                          variant="primary"
                          icon={faGem}
                          onClick={() => navigate("/pricing")}
                          className="h-8 px-3 text-[13px] font-semibold rounded-lg transition-all"
                        >
                          Upgrade
                        </Button>
                      )}

                      <Link
                        to="/library"
                        className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-white/80 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
                      >
                        <FontAwesomeIcon icon={faGrid2} className="text-[11px]" />
                        Library
                      </Link>

                      <TaskQueue />

                      <Menu as="div" className="relative ml-1">
                        <MenuButton className="flex h-8 w-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40 ring-offset-2 ring-offset-[#121212]">
                          <span className="sr-only">Open user menu</span>
                          <img
                            className="h-full w-full object-cover"
                            src={`https://www.gravatar.com/avatar/${user.email_gravatar_hash}?d=mp`}
                            alt=""
                          />
                        </MenuButton>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="opacity-0 scale-95"
                          enterTo="opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="opacity-100 scale-100"
                          leaveTo="opacity-0 scale-95"
                        >
                          <MenuItems
                            modal={false}
                            className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-[#1a1a1a] border border-white/[0.08] shadow-xl focus:outline-none overflow-hidden"
                          >
                            <div className="px-4 py-3 border-b border-white/[0.06]">
                              <p className="text-sm font-medium text-white truncate">
                                {user.display_name || user.username}
                              </p>
                            </div>
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  onClick={() => navigate("/support")}
                                  className={twMerge(
                                    active ? "bg-white/[0.04]" : "",
                                    "flex w-full items-center gap-2 px-4 py-2 text-sm text-white/70 transition-colors",
                                  )}
                                >
                                  <FontAwesomeIcon
                                    icon={faLifeRing}
                                    className="text-[11px] text-white/50"
                                  />
                                  Support
                                </button>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  onClick={() => setSettingsOpen(true)}
                                  className={twMerge(
                                    active ? "bg-white/[0.04]" : "",
                                    "flex w-full items-center gap-2 px-4 py-2 text-sm text-white/70 transition-colors",
                                  )}
                                >
                                  <FontAwesomeIcon
                                    icon={faCog}
                                    className="text-[11px] text-white/50"
                                  />
                                  Settings
                                </button>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ active }) => (
                                <a
                                  href={SOCIAL_LINKS.DISCORD}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={twMerge(
                                    active ? "bg-white/[0.04]" : "",
                                    "flex w-full items-center gap-2 px-4 py-2 text-sm text-white/70 transition-colors",
                                  )}
                                >
                                  <FontAwesomeIcon
                                    icon={faDiscord}
                                    className="text-[11px] text-white/50"
                                  />
                                  Join Discord
                                </a>
                              )}
                            </MenuItem>
                            <MenuItem>
                              {({ active }) => (
                                <button
                                  onClick={handleLogout}
                                  className={twMerge(
                                    active ? "bg-white/[0.04]" : "",
                                    "block w-full text-left px-4 py-2 text-sm text-white/70 transition-colors",
                                  )}
                                >
                                  Sign out
                                </button>
                              )}
                            </MenuItem>
                          </MenuItems>
                        </Transition>
                      </Menu>
                    </div>
                  ) : (
                    <div className="hidden md:flex items-center gap-2">
                      <Link
                        to="/pricing"
                        className="h-8 flex items-center gap-1.5 px-3 rounded-lg text-[13px] font-medium text-white/90 hover:text-white hover:bg-white/[0.04] transition-all"
                      >
                        <FontAwesomeIcon icon={faGem} className="text-[11px]" />
                        Pricing
                      </Link>
                      <Link
                        to="/login"
                        className="h-8 flex items-center px-3 rounded-lg text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/[0.04] transition-all"
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="group h-8 flex items-center gap-1.5 px-3.5 rounded-full text-[13px] font-semibold text-black bg-white hover:bg-white/90 transition-all shadow-sm"
                      >
                        Sign up
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className="text-[10px] transition-transform group-hover:translate-x-0.5"
                        />
                      </Link>
                    </div>
                  )}

                  {/* Mobile: hamburger + task queue */}
                  <div className="flex items-center gap-2 lg:hidden">
                    {user && <TaskQueue />}
                    <DisclosureButton className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                      <span className="sr-only">Open main menu</span>
                      <FontAwesomeIcon
                        icon={open ? faXmark : faBars}
                        className="text-base"
                      />
                    </DisclosureButton>
                  </div>
                </div>
              </div>

              {/* Mobile slide-down panel */}
              <Transition
                as={Fragment}
                enter="transition duration-150 ease-out"
                enterFrom="opacity-0 -translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-100 ease-in"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-1"
              >
                <DisclosurePanel className="lg:hidden border-t border-white/[0.06] px-3 pb-3 pt-2">
                  <div className="flex flex-col">
                    {NAV_ITEMS.map((entry) => {
                      if (!isGroup(entry)) {
                        const isCurrent = isPathActive(
                          location.pathname,
                          entry.href,
                        );
                        return (
                          <DisclosureButton
                            key={entry.name}
                            as={Link}
                            to={entry.href}
                            className={twMerge(
                              "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                              isCurrent
                                ? "bg-white/[0.08] text-white"
                                : "text-white/60 active:bg-white/[0.04]",
                            )}
                          >
                            {entry.name}
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
                                "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                                headerActive
                                  ? "bg-white/[0.08] text-white"
                                  : "text-white/60 active:bg-white/[0.04]",
                              )}
                            >
                              {entry.name}
                            </DisclosureButton>
                          ) : (
                            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                              {entry.name}
                            </div>
                          )}
                          <div className="flex flex-col pl-3">
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
                                    "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                                    childActive
                                      ? "bg-white/[0.08] text-white"
                                      : "text-white/55 active:bg-white/[0.04]",
                                  )}
                                >
                                  {child.name}
                                </DisclosureButton>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="my-3 border-t border-white/[0.06]" />

                  {!isLoading && user ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-1.5">
                        <DisclosureButton
                          as={Link}
                          to="/library"
                          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-white/70 bg-white/[0.06] active:bg-white/10 transition-colors"
                        >
                          <FontAwesomeIcon
                            icon={faGrid2}
                            className="text-[10px]"
                          />
                          Library
                        </DisclosureButton>
                        <DisclosureButton
                          as={Link}
                          to="/pricing"
                          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-white/70 bg-white/[0.06] active:bg-white/10 transition-colors"
                        >
                          <FontAwesomeIcon icon={faGem} className="text-[10px]" />
                          Pricing
                        </DisclosureButton>
                        <DisclosureButton
                          as="button"
                          onClick={() => setSettingsOpen(true)}
                          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-white/70 bg-white/[0.06] active:bg-white/10 transition-colors"
                        >
                          <FontAwesomeIcon icon={faCog} className="text-[10px]" />
                          Settings
                        </DisclosureButton>
                        <DisclosureButton
                          as="a"
                          href={SOCIAL_LINKS.DISCORD}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-white/70 bg-white/[0.06] active:bg-white/10 transition-colors"
                        >
                          <FontAwesomeIcon
                            icon={faDiscord}
                            className="text-[10px]"
                          />
                          Discord
                        </DisclosureButton>
                        {credits !== null && (
                          <span className="flex items-center gap-1.5 ml-auto text-[12px] font-medium text-white/80">
                            <FontAwesomeIcon
                              icon={faCoins}
                              className="text-primary text-[10px]"
                            />
                            {credits.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          className="h-7 w-7 rounded-full border border-white/[0.08] shrink-0"
                          src={`https://www.gravatar.com/avatar/${user.email_gravatar_hash}?d=mp`}
                          alt=""
                        />
                        <span className="truncate text-[13px] font-medium text-white/80 flex-1">
                          {user.display_name || user.username}
                        </span>
                        <DisclosureButton
                          as="button"
                          onClick={handleLogout}
                          className="flex h-7 items-center rounded-lg px-2.5 text-[12px] font-medium text-red-400/80 active:bg-red-500/10 transition-colors shrink-0"
                        >
                          Sign out
                        </DisclosureButton>
                      </div>
                    </div>
                  ) : !isLoading ? (
                    <div className="flex gap-2">
                      <DisclosureButton as={Link} to="/login" className="flex-1">
                        <button className="w-full h-9 rounded-lg text-[13px] font-semibold text-white/80 bg-white/[0.06] active:bg-white/10 transition-colors">
                          Login
                        </button>
                      </DisclosureButton>
                      <DisclosureButton as={Link} to="/signup" className="flex-1">
                        <button className="w-full h-9 rounded-lg text-[13px] font-semibold text-black bg-white active:bg-white/90 transition-colors">
                          Sign up
                        </button>
                      </DisclosureButton>
                    </div>
                  ) : null}
                </DisclosurePanel>
              </Transition>
            </div>

            <CreditsModal
              isOpen={creditsModalOpen}
              onClose={() => setCreditsModalOpen(false)}
            />

            <SettingsModal
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
            />
          </div>
        );
      }}
    </Disclosure>
  );
}
