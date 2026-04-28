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
  faArrowRight,
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
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [hasPaidPlan, setHasPaidPlan] = useState<boolean | null>(null);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <Disclosure as="nav" className="z-50 fixed top-0 left-0 w-full">
      {({ open }) => (
        <div className="px-3 sm:px-5 pt-3 sm:pt-4">
          <div
            className={twMerge(
              "liquid-glass mx-auto max-w-[1280px] transition-all duration-300",
              open ? "rounded-3xl" : "rounded-full",
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

                <div className="hidden lg:flex items-center gap-1 min-w-0">
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
                          "px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all whitespace-nowrap",
                          isCurrent
                            ? "text-white bg-white/[0.08]"
                            : "text-white/60 hover:text-white hover:bg-white/[0.04]",
                        )}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Right: Auth/credits/library */}
              <div className="flex items-center gap-2 shrink-0">
                {isLoading ? (
                  <div className="hidden md:flex items-center gap-2 opacity-0" />
                ) : user ? (
                  <div className="hidden md:flex items-center gap-2">
                    <Link
                      to="/pricing"
                      className="hidden xl:flex h-8 items-center px-3 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
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
                            className="text-primary text-[11px]"
                          />
                        }
                        triggerLabel={
                          <span className="whitespace-nowrap text-[13px] font-medium">
                            {credits.toLocaleString()}
                          </span>
                        }
                        buttonClassName="h-8 px-3 ps-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] shadow-none text-white/80 rounded-lg gap-1.5"
                        panelClassName="mt-2 bg-[#1a1a1a] border border-white/[0.08] text-white rounded-xl"
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
                        className="h-8 px-3 text-[13px] font-semibold rounded-lg transition-all"
                      >
                        Support
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
                        <MenuItems className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-[#1a1a1a] border border-white/[0.08] shadow-xl focus:outline-none overflow-hidden">
                          <div className="px-4 py-3 border-b border-white/[0.06]">
                            <p className="text-sm font-medium text-white truncate">
                              {user.display_name || user.username}
                            </p>
                          </div>
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
                      className="h-8 flex items-center px-3 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all"
                    >
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
                      className="group h-8 flex items-center gap-1.5 px-3.5 rounded-lg text-[13px] font-semibold text-black bg-white hover:bg-white/90 transition-all shadow-sm"
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
                          "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                          isCurrent
                            ? "bg-white/[0.08] text-white"
                            : "text-white/60 active:bg-white/[0.04]",
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
                        className="flex h-8 items-center rounded-lg px-2.5 text-[12px] font-medium text-white/70 bg-white/[0.06] active:bg-white/10 transition-colors"
                      >
                        Pricing
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
      )}
    </Disclosure>
  );
}
