import { ReactNode } from "react";
import { Outlet, useNavigate, Navigate } from "react-router-dom";
import { faArrowLeft, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TruchetPattern } from "@storyteller/ui-vfx";
import { AuthShowcase } from "./auth-showcase";
import { useMediaQuery } from "../ui/use-media-query";
import { useSession } from "../../lib/session";
import { Reveal, RevealGroup } from "../motion/reveal";

/**
 * Persistent shell for the auth pages. Rendered as a layout route so the
 * showcase pane (and its video) stays mounted while the form pane swaps
 * between login and signup via <Outlet> — toggling between the two no longer
 * reloads the showcase video from the start. Each page renders its own header
 * (AuthHeader) and footer (AuthFooter) into the outlet.
 */
export const AuthLayout = () => {
  // Only mount the showcase on wide screens (matches the `lg` breakpoint) so
  // mobile never downloads the demo videos.
  const showShowcase = useMediaQuery("(min-width: 1024px)");
  const navigate = useNavigate();
  const { loggedIn, authChecked } = useSession();

  const handleBack = () => {
    navigate("/");
  };

  // Already signed in? Never show the auth form — go straight home.
  if (loggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101014] p-4 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 80%)",
        }}
      >
        <TruchetPattern
          intensity={0.5}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[4%] bg-[#1C1C20] shadow-2xl lg:min-h-[640px]">
        {/* Form pane — only the inner content swaps per route (via Outlet), so
            this pane and the showcase beside it stay mounted across the
            login/signup toggle. */}
        <div className="relative flex w-full flex-col lg:w-1/2">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="absolute left-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>

          <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-10">
            <div className="mx-auto w-full max-w-sm">
              {authChecked ? (
                <Outlet />
              ) : (
                <div className="flex justify-center py-12">
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    className="animate-spin text-2xl text-white/40"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="px-8 pb-8 text-center text-xs text-white/20">
            &copy; {new Date().getFullYear()} ArtCraft. All rights reserved.
          </div>
        </div>

        {/* Showcase pane (desktop only) */}
        {showShowcase && (
          <div className="relative lg:w-1/2">
            <AuthShowcase />
          </div>
        )}
      </div>
    </div>
  );
};

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => (
  <RevealGroup inView={false} stagger={0.08} className="mb-8 text-center">
    <Reveal y={10}>
      <img
        src="/images/artcraft-icon.png"
        alt="ArtCraft"
        className="mx-auto mb-6 h-12 w-auto select-none pointer-events-none"
        draggable={false}
      />
    </Reveal>
    <Reveal as="h1" y={10} className="mb-2 text-2xl font-semibold">
      {title}
    </Reveal>
    <Reveal as="p" y={10} className="text-sm text-white/60">
      {subtitle}
    </Reveal>
  </RevealGroup>
);

export const AuthFooter = ({ children }: { children: ReactNode }) => (
  <div className="mt-8 text-center text-sm text-white/60">{children}</div>
);
