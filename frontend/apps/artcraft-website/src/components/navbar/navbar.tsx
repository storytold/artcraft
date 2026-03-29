import {
  Disclosure,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { useEffect, useState, Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@storyteller/ui-button";
import { UsersApi, UserInfo, CreditsApi } from "@storyteller/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins, faGrid2 } from "@fortawesome/pro-solid-svg-icons";
import { TaskQueue } from "./task-queue";

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  // { name: "Image", href: "/create-image" },
  // { name: "Video", href: "/create-video" },
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

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Pages with content flush to top need a solid navbar background always
  const alwaysSolid =
    location.pathname === "/create-image" ||
    location.pathname === "/create-video" ||
    location.pathname === "/library";
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);

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
      } else {
        setUser(undefined);
        setCredits(null);
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
    // Reload to clear state/cache
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
    <Disclosure
      as="nav"
      className={twMerge(
        "z-20 fixed top-0 left-0 w-full transition-all duration-200 bg-transparent",
        scrolled || alwaysSolid
          ? "bg-[#1b1b1f]/70 backdrop-blur-lg"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-screen sm:px-6 lg:px-8 px-4 md:px-16 xl:px-4">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex shrink-0 items-center">
              <Link to="/">
                <img
                  alt="ArtCraft"
                  src="/images/artcraft-logo.png"
                  className="h-6 w-auto"
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
                        isCurrent ? "" : "",
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
              // Loading placeholder
              <div className="hidden md:ml-4 md:flex items-center gap-2.5 opacity-0"></div>
            ) : user ? (
              // Logged In State
              <div className="hidden md:ml-4 md:flex items-center gap-2.5">
                <Link
                  to="/pricing"
                  className="text-[15px] font-semibold text-white/60 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
                {credits !== null && (
                  <div className="flex items-center gap-2 px-4 text-[15px] font-semibold text-white/90">
                    <FontAwesomeIcon
                      icon={faCoins}
                      className="text-primary text-sm"
                    />
                    {credits.toLocaleString()} Credits
                  </div>
                )}

                <Link
                  to="/library"
                  className="flex h-[38px] items-center gap-2 rounded-lg px-3 text-sm font-medium text-base-fg bg-ui-controls hover:bg-ui-controls/80 border border-ui-controls-border shadow-sm transition-all duration-150 active:scale-95"
                >
                  <FontAwesomeIcon icon={faGrid2} className="text-xs" />
                  My Library
                </Link>

                <TaskQueue />

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
              // Logged Out State
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

            {/* Mobile Menu Button - simplified for now */}
            <div className="-ml-2 flex items-center md:hidden gap-3">
              {!user && (
                <div className="flex gap-2">
                  <Link to="/login">
                    <Button className="bg-white/60 text-black hover:bg-white/90 text-xs font-semibold px-3 py-1.5 h-auto rounded-lg">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button
                      variant="primary"
                      className="text-xs font-semibold px-3 py-1.5 h-auto"
                    >
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
              {user && (
                <img
                  className="h-8 w-8 rounded-full border border-white/10"
                  src={`https://www.gravatar.com/avatar/${user.email_gravatar_hash}?d=mp`}
                  alt=""
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <DisclosurePanel className="md:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={twMerge(
                item.current
                  ? "bg-gray-900 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white",
                "block rounded-md px-3 py-2 text-base font-medium"
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel> */}
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
    </Disclosure>
  );
}
