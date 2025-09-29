import { Disclosure } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { DiscordButton } from "../discord-button";

const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "Tutorials", href: "/tutorials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [underlineAnim, setUnderlineAnim] = useState<
    Record<string, "in" | "out" | null>
  >({});
  const outTimersRef = useRef<Record<string, number | undefined>>({});

  const handleEnter = (href: string) => {
    if (outTimersRef.current[href] !== undefined) {
      window.clearTimeout(outTimersRef.current[href]);
      delete outTimersRef.current[href];
    }
    setUnderlineAnim((prev) => ({ ...prev, [href]: "in" }));
  };

  const handleLeave = (href: string) => {
    setUnderlineAnim((prev) => ({ ...prev, [href]: "out" }));
    outTimersRef.current[href] = window.setTimeout(() => {
      setUnderlineAnim((prev) => ({ ...prev, [href]: null }));
      delete outTimersRef.current[href];
    }, 260);
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
        "z-20 fixed top-0 left-0 w-full transition-colors duration-200 bg-transparent",
        scrolled
          ? "bg-[#1b1b1f]/70 backdrop-blur-lg lg:bg-transparent lg:backdrop-blur-none"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-screen sm:px-6 lg:px-8 px-6 md:px-16 xl:px-4">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex shrink-0 items-center">
              <a href="/">
                <img
                  alt="ArtCraft"
                  src="/images/artcraft-logo.png"
                  className="h-7 w-auto"
                />
              </a>
            </div>
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-6">
              {NAV_ITEMS.map((item) => {
                const isCurrent = location.pathname === item.href;
                const anim = underlineAnim[item.href] ?? null;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={twMerge(
                      isCurrent
                        ? "text-white"
                        : "text-white/60 hover:text-white",
                      "relative rounded-md text-[15px] font-semibold transition-all"
                    )}
                    onMouseEnter={() => !isCurrent && handleEnter(item.href)}
                    onMouseLeave={() => !isCurrent && handleLeave(item.href)}
                  >
                    <span className="relative z-10">{item.name}</span>
                    <span
                      className={twMerge(
                        "pointer-events-none absolute left-0 right-0 -bottom-1 h-[2px] overflow-hidden",
                        isCurrent ? "" : ""
                      )}
                      aria-hidden="true"
                    >
                      <span
                        className={twMerge(
                          "link-underline block h-full w-full bg-primary/90",
                          isCurrent
                            ? "visible-line"
                            : anim === "in"
                            ? "animate-in"
                            : anim === "out"
                            ? "animate-out"
                            : "hidden-line"
                        )}
                      />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex md:shrink-0 md:items-center">
              {/* <Button as="link" href="/download">
                Download
              </Button> */}
              <DiscordButton
                small
                className="bg-white text-black hover:bg-white/90"
              />
            </div>
            <div className="-ml-2 flex items-center md:hidden">
              {/* Mobile menu button */}
              <DiscordButton
                className="text-sm bg-white text-black hover:bg-white/90"
                small
              />
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
        }
        .visible-line {
          transform: scaleX(1) translateX(0);
          opacity: 1;
        }
        .hidden-line {
          transform: scaleX(0) translateX(0);
          opacity: 0;
        }
        @keyframes underline-in {
          0% { transform: scaleX(0) translateX(0); opacity: 0.8; }
          100% { transform: scaleX(1) translateX(0); opacity: 1; }
        }
        @keyframes underline-out {
          0% { transform: scaleX(1) translateX(0); opacity: 1; }
          100% { transform: scaleX(1) translateX(100%); opacity: 0; }
        }
        .animate-in { animation: underline-in 220ms ease-out forwards; }
        .animate-out { animation: underline-out 220ms ease-in forwards; }
      `}</style>
    </Disclosure>
  );
}
