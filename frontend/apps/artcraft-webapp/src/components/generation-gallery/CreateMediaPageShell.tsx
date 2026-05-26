import { type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { type PopoverItem } from "@storyteller/ui-popover";
import { TruchetPattern } from "@storyteller/ui-vfx";
import Seo from "../../components/seo";

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
  modals: ReactNode;
}

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
  modals,
}: CreateMediaPageShellProps) {
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

  return (
    <div className="flex h-full w-full bg-[#101014] text-white">
      <Seo title={title} description={description} />

      {/* Glow orbs — only show on empty state, hide when gallery has content */}
      {!hasContent &&
        (glowOrbs ?? (
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-10%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-[0.12] blur-[120px] transform-gpu" />
            <div className="absolute bottom-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-600 via-blue-500 to-[#00AABA] opacity-[0.08] blur-[120px] transform-gpu" />
            <div className="absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-600 to-pink-500 opacity-[0.06] blur-[140px] transform-gpu" />
          </div>
        ))}

      {/* Subtle truchet pattern, only on the empty state so it never sits
          behind the gallery grid. Masked to a soft center vignette. */}
      {!hasContent && (
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

          {promptBox}
        </div>
      </div>

      {modals}
    </div>
  );
}
