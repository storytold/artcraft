import { type ReactNode, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { isMobile } from "react-device-detect";
import { type PopoverItem } from "@storyteller/ui-popover";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { TruchetPattern } from "@storyteller/ui-vfx";
import Seo from "../../components/seo";
import { useIsMobile } from "../ui/use-mobile";
import { GalleryViewToggle } from "./GalleryViewToggle";
import {
  MobileCreateTabsProvider,
  type MobileCreateTab,
} from "./mobile-create-tabs";

interface CreateMediaPageShellProps {
  // SEO
  title: string;
  description: string;
  // Auth state — `authChecked` gates the initial spinner so we don't flash
  // logged-out chrome while the session resolves. Pages stay viewable for
  // logged-out users; the signup CTA modal is triggered at generate time.
  authChecked: boolean;
  // Content
  hasContent: boolean;
  emptyStateTitle: string;
  emptyStateSubtitle: string;
  // Optional CTA rendered under the empty-state subtitle (e.g. a signup button
  // for logged-out visitors). Omitted for logged-in users.
  emptyStateCta?: ReactNode;
  bottomOffset: number;
  // Model selector
  modelItems: PopoverItem[];
  onModelChange: (item: PopoverItem) => void;
  // Glow orb overrides (optional - defaults provided)
  glowOrbs?: ReactNode;
  // Children slots
  gridContent: ReactNode;
  promptBox: ReactNode;
  // Mobile-only form rendered on the "Generate" tab. When provided and the
  // viewport is mobile, the shell swaps the floating prompt box for a tabbed
  // Generate / History layout.
  promptForm?: ReactNode;
  modals: ReactNode;
}

const MOBILE_TABS = [
  { id: "generate", label: "Generate" },
  { id: "history", label: "History" },
];

export function CreateMediaPageShell({
  title,
  description,
  authChecked,
  hasContent,
  emptyStateTitle,
  emptyStateSubtitle,
  emptyStateCta,
  bottomOffset,
  glowOrbs,
  gridContent,
  promptBox,
  promptForm,
  modals,
}: CreateMediaPageShellProps) {
  const viewportIsMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileCreateTab>("generate");

  if (!authChecked) {
    return (
      <div className="flex h-full items-center justify-center bg-[#101014]">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="animate-spin text-4xl text-primary/80"
        />
      </div>
    );
  }

  // Mobile: split into Generate (form) / History (gallery) tabs so the prompt
  // box no longer overlaps results. Desktop keeps the floating prompt box.
  if (viewportIsMobile && promptForm) {
    return (
      <MobileCreateTabsProvider
        value={{
          tab: mobileTab,
          setTab: setMobileTab,
          goToHistory: () => setMobileTab("history"),
        }}
      >
        <div className="flex h-full w-full flex-col bg-[#101014] text-white">
          <Seo title={title} description={description} />

          <div className="relative flex items-center justify-center border-b border-ui-panel-border px-3 py-2">
            <TabSelector
              tabs={MOBILE_TABS}
              activeTab={mobileTab}
              onTabChange={(id) => setMobileTab(id as MobileCreateTab)}
              className="w-auto"
            />
            {mobileTab === "history" && hasContent && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <GalleryViewToggle />
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {mobileTab === "generate" ? (
              promptForm
            ) : hasContent ? (
              <div className="h-full w-full overflow-y-auto pt-0.5">
                <div className="px-3">{gridContent}</div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <span className="text-lg font-semibold text-white">
                  {emptyStateTitle}
                </span>
                <span className="pt-1 text-sm text-white/60">
                  Your generations will appear here.
                </span>
              </div>
            )}
          </div>
        </div>

        {modals}
      </MobileCreateTabsProvider>
    );
  }

  return (
    <div className="flex h-full w-full bg-[#101014] text-white">
      <Seo title={title} description={description} />

      {/* Decorative background, empty state only. Not rendered on mobile
          devices: the glow orbs use filter: blur(120px) and the truchet uses
          mask-image, both of which are full-screen GPU layers that iOS Safari
          must re-rasterize when an overlay (mobile menu, modal) composites over
          them, causing multi-second hangs. (This is distinct from
          backdrop-filter.) We gate on the actual device (react-device-detect's
          user-agent check) rather than a viewport breakpoint so the layers
          never mount on a real phone/tablet, and a narrow desktop window still
          gets the decoration. */}
      {!hasContent && !isMobile && (
        <>
          {glowOrbs ?? (
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
              <div className="absolute left-1/2 top-[-10%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-[0.12] blur-[120px] transform-gpu" />
              <div className="absolute bottom-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-600 via-blue-500 to-[#00AABA] opacity-[0.08] blur-[120px] transform-gpu" />
              <div className="absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-600 to-pink-500 opacity-[0.06] blur-[140px] transform-gpu" />
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              maskImage:
                "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)",
            }}
          >
            <TruchetPattern
              intensity={0.5}
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </>
      )}

      <div className="relative z-[1] h-full w-full">
        <div className="flex h-full w-full flex-col">
          {!hasContent && (
            <div className="flex flex-1 items-center justify-center">
              <div className="animate-fade-in-up relative z-20 mb-32 flex flex-col items-center justify-center text-center drop-shadow-xl">
                <h1 className="text-5xl font-semibold text-white md:text-7xl">
                  {emptyStateTitle}
                </h1>
                <span className="pt-2 text-lg text-white/80 md:text-xl">
                  {emptyStateSubtitle}
                </span>
                {emptyStateCta && <div className="pt-6">{emptyStateCta}</div>}
              </div>
            </div>
          )}

          {hasContent && (
            <div
              className="h-full w-full overflow-y-auto pt-0.5"
              style={{ paddingBottom: bottomOffset }}
            >
              <div className="px-3">{gridContent}</div>
            </div>
          )}

          {/* Bottom fade behind the floating prompt box so it stays legible
              over the feed. Sits under the prompt box (z-30). */}
          {hasContent && (
            <div
              aria-hidden
              className="pointer-events-none fixed bottom-0 right-0 z-20 h-48 bg-gradient-to-t from-[#101014] to-transparent"
              style={{ left: "var(--ac-sidebar-offset, 0px)" }}
            />
          )}

          {promptBox}
        </div>
      </div>

      {modals}
    </div>
  );
}
