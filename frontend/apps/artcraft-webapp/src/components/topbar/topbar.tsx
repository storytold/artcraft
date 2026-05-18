import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faGem,
  faCog,
  faLifeRing,
  faGift,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { Button } from "@storyteller/ui-button";
import { PopoverMenu } from "@storyteller/ui-popover";
import {
  BillingApi,
  CreditsApi,
  USER_FEATURE_FLAGS,
  UsersApi,
} from "@storyteller/api";
import { invalidateSession, useSession } from "../../lib/session";
import { SOCIAL_LINKS } from "../../config/links";
import { CreditsModal } from "../credits-modal";
import { SettingsModal } from "../settings-modal/SettingsModal";
import { TaskQueue } from "./task-queue";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { Breadcrumbs } from "./breadcrumbs";
import { ActiveSceneTitle } from "./ActiveSceneTitle";

async function fetchCredits(): Promise<number | null> {
  try {
    const response = await new CreditsApi().GetSessionCredits();
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
    const response = await new BillingApi().ListActiveSubscriptions();
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

function CreditsChip({
  credits,
  onBuyCredits,
  onUpgrade,
}: {
  credits: number;
  onBuyCredits: () => void;
  onUpgrade: () => void;
}) {
  return (
    <PopoverMenu
      position="bottom"
      align="end"
      triggerIcon={
        <FontAwesomeIcon icon={faCoins} className="text-primary text-[11px]" />
      }
      triggerLabel={
        <span className="whitespace-nowrap text-sm font-medium">
          {credits.toLocaleString()}
        </span>
      }
      buttonClassName="h-8 px-3 ps-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] shadow-none text-white/80 rounded-lg gap-1.5"
      panelClassName="mt-2 bg-[#1a1a1a] border border-white/[0.08] text-white rounded-xl"
    >
      {(close) => (
        <div className="w-72 max-w-[calc(100vw-24px)] p-3 text-white">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-white/70">
              Your credit balance
            </span>
            <button
              className="text-sm font-medium text-primary hover:text-primary-300 transition-colors"
              onClick={() => {
                close();
                onBuyCredits();
              }}
            >
              Buy credits
            </button>
          </div>
          <div className="flex items-center gap-2 text-3xl font-semibold text-white tracking-tight">
            <FontAwesomeIcon icon={faCoins} className="text-xl text-primary" />
            {credits.toLocaleString()}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="primary"
              className="h-9 grow"
              onClick={() => {
                close();
                onUpgrade();
              }}
              icon={faGem}
            >
              Upgrade
            </Button>
          </div>
        </div>
      )}
    </PopoverMenu>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const { user, authChecked } = useSession();
  const { state, isMobile } = useSidebar();
  const showTopbarLogo = isMobile || state === "collapsed";
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
    const handler = () => {
      fetchCredits().then(setCredits);
    };
    window.addEventListener("credits-change", handler);
    return () => window.removeEventListener("credits-change", handler);
  }, []);

  const handleLogout = async () => {
    await new UsersApi().Logout();
    invalidateSession();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-20 relative flex items-center gap-3 border-b border-white/[0.06] bg-[#121212]/80 backdrop-blur-md px-3 pb-4 pt-3 sm:pt-6">
      {/* Left: sidebar trigger (mobile only) + logo (when sidebar closed) + breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <SidebarTrigger className="md:hidden" />
        <div className="flex gap-6">
          {showTopbarLogo && (
            <Link to="/" className="flex items-center shrink-0">
              <img
                src="/images/artcraft-logo.png"
                alt="ArtCraft"
                className="h-4 sm:h-5 w-auto"
              />
            </Link>
          )}
          <Breadcrumbs />
        </div>
      </div>

      {/* Middle: route-scoped chrome (scene title on /edit-3d, empty
          elsewhere). Absolutely centered to the topbar (which already
          spans only the canvas area, since it sits beside the sidebar)
          so the title aligns horizontally with the Controls3D bar
          regardless of the left/right widths. pointer-events:none on
          the overlay lets clicks pass through to whatever's beneath;
          the inner wrapper re-enables pointer-events for the title. */}
      <div className="pointer-events-none absolute inset-x-0 inset-y-0 flex items-center justify-center pb-4 pt-3 sm:pt-6">
        <div className="pointer-events-auto">
          <ActiveSceneTitle />
        </div>
      </div>

      {/* Right: credits / upgrade / library / avatar */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {!authChecked ? null : user ? (
          <>
            <Link
              to="/pricing"
              className="hidden lg:flex h-8 items-center gap-1.5 px-3 rounded-lg text-sm font-medium text-white/85 hover:bg-white/[0.04] transition-colors"
            >
              <FontAwesomeIcon icon={faGem} className="text-[11px]" />
              Pricing
            </Link>

            {credits !== null && (
              <CreditsChip
                credits={credits}
                onBuyCredits={() => setCreditsModalOpen(true)}
                onUpgrade={() => navigate("/pricing")}
              />
            )}

            {hasPaidPlan === false && (
              <Button
                variant="primary"
                icon={faGem}
                onClick={() => navigate("/pricing")}
                className="h-8 px-3 text-sm font-semibold rounded-lg"
              >
                Upgrade
              </Button>
            )}

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
                  {user.maybe_feature_flags?.includes(
                    USER_FEATURE_FLAGS.REFERRALS,
                  ) && (
                    <MenuItem>
                      {({ active }) => (
                        <button
                          onClick={() => navigate("/referrals")}
                          className={twMerge(
                            active ? "bg-white/[0.04]" : "",
                            "flex w-full items-center gap-2 px-4 py-2 text-sm text-white/70 transition-colors",
                          )}
                        >
                          <FontAwesomeIcon
                            icon={faGift}
                            className="text-[11px] text-white/50"
                          />
                          Referrals
                        </button>
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
          </>
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
              className="h-8 flex items-center gap-1.5 px-3.5 rounded-full text-sm font-semibold text-black bg-white hover:bg-white/90 transition-all shadow-sm"
            >
              Sign up
            </Link>
          </>
        )}
      </div>

      <CreditsModal
        isOpen={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
