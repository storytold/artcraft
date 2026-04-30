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
import { twMerge } from "tailwind-merge";
import { useEffect, useState, Fragment } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@storyteller/ui-button";
import { PopoverMenu } from "@storyteller/ui-popover";
import { UsersApi, UserInfo, CreditsApi, BillingApi } from "@storyteller/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faGrid2,
  faBars,
  faXmark,
  faGem,
  faCog,
} from "@fortawesome/pro-solid-svg-icons";
import { TaskQueue } from "./task-queue";
import { CreditsModal } from "../credits-modal";
import { SettingsModal } from "../settings-modal/SettingsModal";

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "Image", href: "/create-image" },
  { name: "Video", href: "/create-video" },
  { name: "Tutorials", href: "/tutorials" },
  { name: "News", href: "/news" },
  { name: "FAQ", href: "/faq" },
  { name: "Press Kit", href: "/press-kit" },
  { name: "Download", href: "/download" },
];

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
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Pages with content flush to top need a solid navbar background always
  const alwaysSolid =
    location.pathname === "/create-image" ||
    location.pathname === "/create-video" ||
    location.pathname === "/library";
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  // null = unknown (still loading) so we don't flash the upgrade button
  const [hasPaidPlan, setHasPaidPlan] = useState<boolean | null>(null);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Check session on mount and when auth changes or location changes
  useEffect(() => {
    const checkSession = async () => {
      const api = new UsersApi();
      const response = await api.GetSession();
      if (
        response.success &&
        response.data &&
        response.data.loggedIn &&
        response.data.user
      ) {
        setUser(response.data.user);
        fetchCredits().then(setCredits);
        fetchHasPaidPlan().then(setHasPaidPlan);
      } else {
        setUser(undefined);
        setCredits(null);
        setHasPaidPlan(null);
      }
      setIsLoading(false);
    };

    checkSession();

    const handleAuthChange = () => {
      setIsLoading(true);
      checkSession();
    };

    const handleCreditsChange = () => {
      fetchCredits().then(setCredits);
    };

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("credits-change", handleCreditsChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("credits-change", handleCreditsChange);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    const api = new UsersApi();
    await api.Logout();
    window.location.href = "/";
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Disclosure as="nav" className="z-20 fixed top-0 left-0 w-full">
      {({ open }) => (
        <div
          className={twMerge(
            "transition-all duration-200",
            scrolled || alwaysSolid || open ? "bg-[#1b1b1f]" : "bg-transparent",
          )}
        >
          <div className="mx-auto max-w-screen px-4">
            <div className="flex h-12 sm:h-16 justify-between">
              <div className="flex">
                <div className="flex shrink-0 items-center">
                  <Link to="/">
                    <img
                      alt="ArtCraft"
                      src="/images/artcraft-logo.png"
                      className="h-5 sm:h-6 w-auto"
                    />
                  </Link>
                </div>
                <div className="hidden md:ml-10 md:flex md:items-center md:space-x-6">
                  {NAV_ITEMS.map((item) => {
                    const isCurrent =
                      item.href === "/"
                        ? location.pathname === "/"
                        : location.pathname === item.href ||
                          location.pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={twMerge(
                          "nav-link",
                          isCurrent
                            ? "text-white"
                            : "text-white/60 hover:text-white",
                          "relative rounded-md text-[15px] font-semibold transition-all",
                        )}
                      >
                        <span className="relative z-10">{item.name}</span>
                        <span
                          className={twMerge(
                            "pointer-events-none absolute left-0 right-0 -bottom-1 h-[2px] overflow-hidden",
                          )}
                          aria-hidden="true"
                        >
                          <span
                            className={twMerge(
                              "link-underline block h-full w-full bg-primary/90",
                              isCurrent ? "visible-line" : "",
                            )}
                          />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center">
                {isLoading ? (
                  <div className="hidden md:ml-4 md:flex items-center gap-2 opacity-0"></div>
                ) : user ? (
                  // ── Desktop: Logged In ─────────────────────────
                  <div className="hidden md:ml-4 md:flex items-center gap-2">
                    <Link
                      to="/pricing"
                      className="text-[15px] font-semibold text-white/60 hover:text-white transition-colors"
                    >
                      Pricing
                    </Link>
                    {credits !== null && (
                      <PopoverMenu
                        position="bottom"
                        align="center"
                        triggerIcon={
                          <FontAwesomeIcon
                            icon={faCoins}
                            className="text-primary"
                          />
                        }
                        triggerLabel={
                          <span className="whitespace-nowrap text-[15px] font-semibold">
                            {credits.toLocaleString()} Credits
                          </span>
                        }
                        buttonClassName="h-[34px] px-2 ps-1.5 bg-transparent hover:bg-white/10 border-0 shadow-none text-white/90 ms-2.5 me-1.5"
                        panelClassName="mt-3 bg-[#1C1C20] border border-white/10 text-white"
                      >
                        {(close) => (
                          <div className="w-72 p-2.5 text-white">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-medium text-white/80">
                                Your credit balance
                              </span>
                              <button
                                className="text-sm font-medium text-primary-400 transition-all hover:text-primary-300"
                                onClick={() => {
                                  close();
                                  setCreditsModalOpen(true);
                                }}
                              >
                                Buy credits
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-4xl font-bold text-white">
                              <FontAwesomeIcon
                                icon={faCoins}
                                className="text-2xl text-primary"
                              />
                              {credits.toLocaleString()}
                            </div>

                            <div className="mt-3 flex gap-2">
                              {/* <Button
                                variant="action"
                                className="h-9 grow"
                                onClick={() => {
                                  close();
                                  navigate("/pricing");
                                }}
                              >
                                See details
                              </Button> */}
                              <Button
                                variant="primary"
                                className="h-9 grow"
                                onClick={() => {
                                  close();
                                  navigate("/pricing");
                                }}
                                icon={faGem}
                              >
                                Support
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
                        className="h-[38px] transition-all duration-300 hover:shadow-md hover:shadow-primary-600/75"
                      >
                        Support
                      </Button>
                    )}

                    <Link
                      to="/library"
                      className="flex h-[38px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-base-fg bg-ui-controls hover:bg-ui-controls/80 border border-ui-controls-border shadow-sm transition-all duration-150 active:scale-95"
                    >
                      <FontAwesomeIcon icon={faGrid2} className="text-xs" />
                      My Library
                    </Link>

                    <TaskQueue />

                    <Button
                      variant="secondary"
                      onClick={() => setSettingsOpen(true)}
                      className="h-[38px] w-[38px]"
                    >
                      <FontAwesomeIcon icon={faCog} className="text-base" />
                    </Button>

                    <Menu as="div" className="relative ml-3">
                      <div>
                        <MenuButton className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                          <span className="sr-only">Open user menu</span>
                          <img
                            className="h-8 w-8 rounded-full border border-white/10"
                            src={`https://www.gravatar.com/avatar/${user.email_gravatar_hash}?d=mp`}
                            alt=""
                          />
                        </MenuButton>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems
                          modal={false}
                          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-[#1C1C20] py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/10"
                        >
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-sm text-white font-semibold truncate">
                              {user.display_name || user.username}
                            </p>
                          </div>
                          <MenuItem>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={twMerge(
                                  active ? "bg-white/5" : "",
                                  "block w-full text-left px-4 py-2 text-sm text-white/70",
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
                  // ── Desktop: Logged Out ────────────────────────
                  <div className="hidden md:ml-4 md:flex md:shrink-0 md:items-center gap-6">
                    <Link
                      to="/pricing"
                      className="text-[15px] font-semibold text-white/60 hover:text-white transition-colors"
                    >
                      Pricing
                    </Link>

                    <div className="flex gap-2">
                      <Link to="/login">
                        <Button
                          variant="primary"
                          className="bg-white text-black hover:bg-white/90 text-sm font-semibold px-4 py-2 rounded-lg shadow-md"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button
                          variant="primary"
                          className="text-sm font-semibold px-4 py-2 rounded-lg shadow-md"
                        >
                          Sign up
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* ── Mobile: hamburger + task queue ──────────── */}
                <div className="flex items-center gap-2 md:hidden">
                  {user && <TaskQueue />}
                  <DisclosureButton className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                    <span className="sr-only">Open main menu</span>
                    <FontAwesomeIcon
                      icon={open ? faXmark : faBars}
                      className="text-lg"
                    />
                  </DisclosureButton>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile slide-down panel ─────────────────────── */}
          <Transition
            as={Fragment}
            enter="transition duration-150 ease-out"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition duration-100 ease-in"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <DisclosurePanel className="md:hidden border-t border-white/10 bg-[#1b1b1f]/95 backdrop-blur-xl">
              <div className="px-3 pb-3 pt-3">
                {/* Nav links */}
                <div className="flex flex-col">
                  {NAV_ITEMS.map((item) => {
                    const isCurrent =
                      item.href === "/"
                        ? location.pathname === "/"
                        : location.pathname === item.href ||
                          location.pathname.startsWith(item.href + "/");
                    return (
                      <DisclosureButton
                        key={item.name}
                        as={Link}
                        to={item.href}
                        className={twMerge(
                          "rounded-md px-3 py-[7px] text-[13px] font-medium transition-colors",
                          isCurrent
                            ? "bg-white/10 text-white"
                            : "text-white/60 active:bg-white/5",
                        )}
                      >
                        {item.name}
                      </DisclosureButton>
                    );
                  })}
                </div>

                <div className="my-3 border-t border-white/[0.06]" />

                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-[7px] text-[13px] font-medium text-white/60 active:bg-white/5 transition-colors"
                >
                  <FontAwesomeIcon icon={faCog} className="text-xs" />
                  Settings
                </button>

                <div className="my-3 border-t border-white/[0.06]" />

                {!isLoading && user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-1.5">
                      <DisclosureButton
                        as={Link}
                        to="/library"
                        className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-white/60 bg-white/[0.06] active:bg-white/10 transition-colors"
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
                        className="flex h-8 items-center rounded-md px-2.5 text-[12px] font-medium text-white/60 bg-white/[0.06] active:bg-white/10 transition-colors"
                      >
                        Pricing
                      </DisclosureButton>
                      {credits !== null && (
                        <span className="flex items-center gap-2 ml-auto text-[12px] font-medium text-white/80">
                          <FontAwesomeIcon
                            icon={faCoins}
                            className="text-primary text-[10px]"
                          />
                          {credits.toLocaleString()} Credits
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        className="h-7 w-7 rounded-full border border-white/10 shrink-0"
                        src={`https://www.gravatar.com/avatar/${user.email_gravatar_hash}?d=mp`}
                        alt=""
                      />
                      <span className="truncate text-[13px] font-medium text-white/80 flex-1">
                        {user.display_name || user.username}
                      </span>
                      <DisclosureButton
                        as="button"
                        onClick={handleLogout}
                        className="flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium text-red-400/70 active:bg-red-500/10 transition-colors shrink-0"
                      >
                        Sign out
                      </DisclosureButton>
                    </div>
                  </div>
                ) : !isLoading ? (
                  <div className="flex gap-2">
                    <DisclosureButton as={Link} to="/login" className="flex-1">
                      <Button className="w-full bg-white text-black hover:bg-white/90 text-[13px] font-semibold h-9 rounded-lg justify-center">
                        Login
                      </Button>
                    </DisclosureButton>
                    <DisclosureButton as={Link} to="/signup" className="flex-1">
                      <Button
                        variant="primary"
                        className="w-full text-[13px] font-semibold h-9 rounded-lg justify-center"
                      >
                        Sign up
                      </Button>
                    </DisclosureButton>
                  </div>
                ) : null}
              </div>
            </DisclosurePanel>
          </Transition>

          <CreditsModal
            isOpen={creditsModalOpen}
            onClose={() => setCreditsModalOpen(false)}
          />

          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />

          <style>{`
            .link-underline {
              transform-origin: left center;
              transform: scaleX(0) translateX(0);
              opacity: 0;
              transition: transform 220ms ease, opacity 220ms ease;
            }
            .nav-link:hover .link-underline {
              transform: scaleX(1) translateX(0);
              opacity: 1;
            }
            .visible-line {
              transform: scaleX(1) translateX(0);
              opacity: 1;
            }
          `}</style>
        </div>
      )}
    </Disclosure>
  );
}
