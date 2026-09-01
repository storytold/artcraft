// Right-side header actions: pricing, credit balance, upgrade CTA, task
// queue, and the profile dropdown (plus the credits/settings modals they
// open). Extracted from TopBar so the Edit 3D page can host the same
// cluster inside the 3D editor toolbar (its global header is hidden there
// to reclaim vertical space) without duplicating the logic.

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
import {
  CoinsIcon,
  GemIcon,
  GiftIcon,
  ImagesIcon,
  LifeBuoyIcon,
  SettingsIcon,
} from "lucide-react";
import { DiscordIcon } from "@storyteller/icons";
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

export function TopBarActions({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { user, authChecked } = useSession();
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
    <div
      className={twMerge(
        "flex items-center gap-1 sm:gap-1.5 shrink-0",
        className,
      )}
    >
      {!authChecked ? null : user ? (
        <>
          <Link
            to="/pricing"
            className="hidden lg:flex h-8 items-center gap-1.5 px-3 rounded-[3px] font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <GemIcon className="text-[11px]" />
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
              icon={GemIcon}
              onClick={() => navigate("/pricing")}
              className="h-8 px-3"
            >
              Upgrade
            </Button>
          )}

          <TaskQueue />

          <Link
            to="/library"
            className="hidden sm:flex h-8 items-center gap-1.5 px-3 rounded-[3px] border border-white/15 hover:bg-white/10 hover:border-white/30 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80 transition-colors"
          >
            <ImagesIcon className="text-[11px]" />
            My Library
          </Link>

          <Menu as="div" className="relative ml-1">
            <MenuButton className="flex h-8 w-8 overflow-hidden border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/60 ring-offset-2 ring-offset-[#0b0b0c]">
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
                className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-[3px] bg-[#101014] border border-white/15 focus:outline-none overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/15">
                  <p className="text-sm font-medium text-white truncate">
                    {user.display_name || user.username}
                  </p>
                </div>
                <MenuItem>
                  {({ active }) => (
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className={twMerge(
                        active ? "bg-white/10" : "",
                        "flex w-full items-center gap-2 px-4 py-2 text-sm text-white/70 transition-colors",
                      )}
                    >
                      <SettingsIcon className="text-[11px] text-white/50" />
                      Settings
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <button
                      onClick={() => navigate("/support")}
                      className={twMerge(
                        active ? "bg-white/10" : "",
                        "flex w-full items-center gap-2 px-4 py-2 text-sm text-white/70 transition-colors",
                      )}
                    >
                      <LifeBuoyIcon className="text-[11px] text-white/50" />
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
                          active ? "bg-white/10" : "",
                          "flex w-full items-center gap-2 px-4 py-2 text-sm text-white/70 transition-colors",
                        )}
                      >
                        <GiftIcon className="text-[11px] text-white/50" />
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
                        active ? "bg-white/10" : "",
                        "flex w-full items-center gap-2 px-4 py-2 text-sm text-white/70 transition-colors",
                      )}
                    >
                      <DiscordIcon className="text-[11px] text-white/50" />
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
            to="/pricing"
            className="hidden lg:flex h-8 items-center gap-1.5 px-3 rounded-[3px] font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <GemIcon className="text-[11px]" />
            Pricing
          </Link>
          <Link
            to="/login"
            className="h-8 flex items-center px-3 rounded-[3px] font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="h-8 flex items-center gap-1.5 px-3.5 rounded-[3px] font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-black bg-white hover:bg-white/80 transition-colors"
          >
            Sign up
          </Link>
        </>
      )}

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
      triggerIcon={<CoinsIcon className="text-primary text-[11px]" />}
      triggerLabel={
        <span className="whitespace-nowrap text-sm font-medium">
          {credits.toLocaleString()}
        </span>
      }
      buttonClassName="h-8 px-3 ps-2.5 bg-transparent hover:bg-white/10 border border-white/15 hover:border-white/30 shadow-none text-white/80 rounded-[3px] gap-1.5"
      panelClassName="mt-2 bg-[#101014] border border-white/15 text-white rounded-[3px]"
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
            <CoinsIcon className="text-xl text-primary" />
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
              icon={GemIcon}
            >
              Upgrade
            </Button>
          </div>
        </div>
      )}
    </PopoverMenu>
  );
}
