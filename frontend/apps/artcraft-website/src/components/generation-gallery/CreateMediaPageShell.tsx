import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird, type IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import Seo from "../../components/seo";
import Footer from "../../components/footer";

interface CreateMediaPageShellProps {
  // SEO
  title: string;
  description: string;
  // Auth state
  authChecked: boolean;
  isLoggedIn: boolean;
  // Unauthenticated state
  heroIcon: IconDefinition;
  heroTitle: string;
  heroSubtitle: string;
  // Content
  hasContent: boolean;
  emptyStateTitle: string;
  emptyStateSubtitle: string;
  bottomOffset: number;
  // Model selector
  modelItems: PopoverItem[];
  onModelChange: (item: PopoverItem) => void;
  // Glow orb overrides (optional - defaults provided)
  glowOrbs?: ReactNode;
  // Children slots
  gridContent: ReactNode;
  promptBox: ReactNode;
  modals: ReactNode;
}

export function CreateMediaPageShell({
  title,
  description,
  authChecked,
  isLoggedIn,
  heroIcon,
  heroTitle,
  heroSubtitle,
  hasContent,
  emptyStateTitle,
  emptyStateSubtitle,
  bottomOffset,
  modelItems,
  onModelChange,
  glowOrbs,
  gridContent,
  promptBox,
  modals,
}: CreateMediaPageShellProps) {
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#101014]">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="animate-spin text-4xl text-primary/80"
        />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[#101014] text-white">
        <Seo title={title} description={description} />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-teal-400/10 opacity-40 blur-[120px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20">
          <FontAwesomeIcon
            icon={heroIcon}
            className="mb-6 text-5xl text-white/20"
          />
          <h1 className="mb-3 text-4xl font-bold">{heroTitle}</h1>
          <p className="mb-8 max-w-md text-center text-lg text-white/60">
            {heroSubtitle}
          </p>
          <div className="flex gap-3">
            <Link to="/login">
              <Button
                variant="primary"
                className="bg-white px-6 py-2.5 font-semibold text-black shadow-md hover:bg-white/90"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                variant="primary"
                className="px-6 py-2.5 font-semibold shadow-md"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#101014] text-white">
      <Seo title={title} description={description} />

      {/* Glow orbs */}
      {glowOrbs ?? (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-10%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-[0.12] blur-[120px] transform-gpu" />
          <div className="absolute bottom-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-600 via-blue-500 to-[#00AABA] opacity-[0.08] blur-[120px] transform-gpu" />
          <div className="absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-600 to-pink-500 opacity-[0.06] blur-[140px] transform-gpu" />
        </div>
      )}

      <div className="relative z-[1] h-full w-full">
        <div className="flex h-full w-full flex-col">
          {!hasContent && (
            <div className="flex flex-1 items-center justify-center">
              <div className="animate-fade-in-up relative z-20 mb-32 flex flex-col items-center justify-center text-center drop-shadow-xl">
                <h1 className="text-5xl font-bold text-white md:text-7xl">
                  {emptyStateTitle}
                </h1>
                <span className="pt-2 text-lg text-white/80 md:text-xl">
                  {emptyStateSubtitle}
                </span>
              </div>
            </div>
          )}

          {hasContent && (
            <div
              className="h-full w-full overflow-y-auto pt-20"
              style={{ paddingBottom: bottomOffset }}
            >
              <div className="px-2 md:px-3 lg:px-4">
                {gridContent}
              </div>
            </div>
          )}

          {promptBox}

          <div
            className="animate-fade-in-up fixed bottom-3 left-6 z-20 hidden items-center gap-5 lg:flex"
            style={{ animationDelay: "300ms" }}
          >
            <div className="rounded-xl border border-white/10 px-3 py-2 shadow-lg backdrop-blur-xl" style={{ backgroundColor: "rgba(30, 30, 33, 0.85)" }}>
              <PopoverMenu
                items={modelItems}
                onSelect={onModelChange}
                mode="hoverSelect"
                panelTitle="Select Model"
                panelClassName="min-w-[300px]"
                buttonClassName="bg-transparent border-0 shadow-none p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
                showIconsInList
                triggerLabel="Model"
                maxListHeight={400}
              />
            </div>
          </div>
        </div>
      </div>

      {modals}
    </div>
  );
}
