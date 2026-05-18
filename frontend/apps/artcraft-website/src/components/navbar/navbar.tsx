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
import { Fragment } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UsersApi } from "@storyteller/api";
import { useSession, invalidateSession } from "../../lib/session";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faGem,
  faArrowRight,
  faChevronDown,
  faLifeRing,
  faRocket,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import {
  SOCIAL_LINKS,
  USE_WEBAPP_FOR_APP_FEATURES,
  WEBAPP_URL,
} from "../../config/links";

type NavLeaf = { name: string; href: string };
type NavGroup = { name: string; href?: string; children: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

const NAV_ITEMS: NavEntry[] = [
  { name: "Home", href: "/" },
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

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authChecked } = useSession();
  const isLoading = !authChecked;

  const handleLogout = async () => {
    const api = new UsersApi();
    await api.Logout();
    invalidateSession();
    window.location.href = "/";
  };

  return (
    <Disclosure as="nav" className="z-50 fixed top-0 left-0 w-full">
      {({ open }) => (
        <div className="px-3 sm:px-5 pt-3">
          <div className="liquid-glass mx-auto rounded-3xl max-w-6xl">
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
                        "px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5";
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
                          <NavigationMenu.Content className="absolute top-full left-0 mt-2 rounded-xl border border-white/[0.08] bg-[#1a1a1a] shadow-xl overflow-hidden">
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
                                          "block px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
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

              {/* Right: Auth + launch app */}
              <div className="flex items-center gap-2 shrink-0">
                {isLoading ? (
                  <div className="hidden md:flex items-center gap-2 opacity-0" />
                ) : user ? (
                  <div className="hidden md:flex items-center gap-2">
                    <Link
                      to="/pricing"
                      className="hidden xl:flex h-8 items-center gap-1.5 px-3 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/[0.04] transition-all"
                    >
                      <FontAwesomeIcon icon={faGem} className="text-[11px]" />
                      Pricing
                    </Link>

                    {USE_WEBAPP_FOR_APP_FEATURES && (
                      <a
                        href={WEBAPP_URL}
                        className="group h-8 flex items-center gap-1.5 px-3.5 rounded-full text-sm font-semibold text-black bg-white hover:bg-white/90 transition-all shadow-sm"
                      >
                        <FontAwesomeIcon
                          icon={faRocket}
                          className="text-[10px]"
                        />
                        Launch App
                      </a>
                    )}

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
                                  active ? "bg-red-500/10" : "",
                                  "block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors",
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
                      className="h-8 flex items-center gap-1.5 px-3 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/[0.04] transition-all"
                    >
                      <FontAwesomeIcon icon={faGem} className="text-[11px]" />
                      Pricing
                    </Link>
                    {USE_WEBAPP_FOR_APP_FEATURES ? (
                      <a
                        href={WEBAPP_URL}
                        className="group h-8 flex items-center gap-1.5 px-3.5 rounded-full text-sm font-semibold text-black bg-white hover:bg-white/90 transition-all shadow-sm"
                      >
                        <FontAwesomeIcon
                          icon={faRocket}
                          className="text-[10px]"
                        />
                        Launch App
                      </a>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="h-8 flex items-center px-3 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.04] transition-all"
                        >
                          Login
                        </Link>
                        <Link
                          to="/signup"
                          className="group h-8 flex items-center gap-1.5 px-3.5 rounded-full text-sm font-semibold text-black bg-white hover:bg-white/90 transition-all shadow-sm"
                        >
                          Sign up
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="text-[10px] transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {/* Mobile: hamburger only */}
                <div className="flex items-center gap-1.5 lg:hidden">
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
                            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
                              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
                                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
                    {USE_WEBAPP_FOR_APP_FEATURES && (
                      <DisclosureButton
                        as="a"
                        href={WEBAPP_URL}
                        className="group h-10 flex items-center justify-center gap-1.5 px-3.5 rounded-full text-sm font-semibold text-black bg-white active:bg-white/90 transition-all shadow-sm"
                      >
                        <FontAwesomeIcon
                          icon={faRocket}
                          className="text-[10px]"
                        />
                        Launch App
                      </DisclosureButton>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <DisclosureButton
                        as={Link}
                        to="/pricing"
                        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-white/70 bg-white/[0.06] active:bg-white/10 transition-colors"
                      >
                        <FontAwesomeIcon
                          icon={faGem}
                          className="text-[10px]"
                        />
                        Pricing
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
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        className="h-7 w-7 rounded-full border border-white/[0.08] shrink-0"
                        src={`https://www.gravatar.com/avatar/${user.email_gravatar_hash}?d=mp`}
                        alt=""
                      />
                      <span className="truncate text-sm font-medium text-white/80 flex-1">
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
                  USE_WEBAPP_FOR_APP_FEATURES ? (
                    <DisclosureButton
                      as="a"
                      href={WEBAPP_URL}
                      className="group h-10 flex items-center justify-center gap-1.5 px-3.5 rounded-full text-sm font-semibold text-black bg-white active:bg-white/90 transition-all shadow-sm"
                    >
                      <FontAwesomeIcon icon={faRocket} className="text-[10px]" />
                      Launch App
                    </DisclosureButton>
                  ) : (
                    <div className="flex gap-2">
                      <DisclosureButton
                        as={Link}
                        to="/login"
                        className="flex-1 h-9 rounded-lg text-sm font-semibold text-white/80 bg-white/[0.06] active:bg-white/10 transition-colors flex items-center justify-center"
                      >
                        Login
                      </DisclosureButton>
                      <DisclosureButton
                        as={Link}
                        to="/signup"
                        className="flex-1 h-9 rounded-lg text-sm font-semibold text-black bg-white active:bg-white/90 transition-colors flex items-center justify-center"
                      >
                        Sign up
                      </DisclosureButton>
                    </div>
                  )
                ) : null}
              </DisclosurePanel>
            </Transition>
          </div>

        </div>
      )}
    </Disclosure>
  );
}
