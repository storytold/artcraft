import { ReactNode } from "react";
import { AuthShowcase } from "./auth-showcase";
import { useMediaQuery } from "../ui/use-media-query";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthLayout = ({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) => {
  // Only mount the showcase on wide screens (matches the `lg` breakpoint) so
  // mobile never downloads the demo videos.
  const showShowcase = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101014] p-4 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#1C1C20] shadow-2xl lg:min-h-[640px]">
        {/* Form pane */}
        <div className="flex w-full flex-col lg:w-1/2">
          <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-10">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-8 text-center">
                <img
                  src="/images/artcraft-logo.png"
                  alt="ArtCraft"
                  className="mx-auto mb-6 h-7 w-auto"
                />
                <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
                <p className="text-sm text-white/60">{subtitle}</p>
              </div>

              {children}

              {footer && (
                <div className="mt-8 text-center text-sm text-white/60">
                  {footer}
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
