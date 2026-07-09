import { Link } from "react-router-dom";
import { SOCIAL_LINKS, SUPPORT_EMAIL } from "../../../config/links";
import { MonoLabel } from "./ui";

const SITEMAP: ReadonlyArray<{ label: string; to: string }> = [
  { label: "Home", to: "/" },
  { label: "Download", to: "/download" },
  { label: "Pricing", to: "/pricing" },
  { label: "Tutorials", to: "/tutorials" },
  { label: "FAQ", to: "/faq" },
  { label: "News", to: "/news" },
  { label: "Press Kit", to: "/press-kit" },
  { label: "Support", to: "/support" },
];

const SOCIALS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "GitHub", href: SOCIAL_LINKS.GITHUB },
  { label: "Discord", href: SOCIAL_LINKS.DISCORD },
  { label: "YouTube", href: SOCIAL_LINKS.YOUTUBE },
  { label: "Instagram", href: SOCIAL_LINKS.INSTAGRAM },
  { label: "TikTok", href: SOCIAL_LINKS.TIKTOK },
  { label: "Reddit", href: SOCIAL_LINKS.REDDIT },
];

// Landing4-only footer. Dark chapter: mono column grid over a hairline, then
// a giant clipped wordmark bleeding off the bottom edge.
export const BrutFooter = () => (
  <footer className="border-t border-paper/15 bg-ink text-paper">
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-8">
      <div className="grid grid-cols-2 gap-10 border-b border-paper/15 py-14 md:grid-cols-4">
        <div>
          <MonoLabel className="text-paper/40">SITEMAP</MonoLabel>
          <ul className="mt-5 space-y-2">
            {SITEMAP.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="hover:text-volt font-brut-mono text-[13px] uppercase tracking-[0.1em] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <MonoLabel className="text-paper/40">SOCIAL</MonoLabel>
          <ul className="mt-5 space-y-2">
            {SOCIALS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-volt font-brut-mono text-[13px] uppercase tracking-[0.1em] transition-colors"
                >
                  {item.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <MonoLabel className="text-paper/40">CONTACT</MonoLabel>
          <ul className="mt-5 space-y-2">
            <li>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="hover:text-volt font-brut-mono text-[13px] uppercase tracking-[0.1em] transition-colors"
              >
                {SUPPORT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <MonoLabel className="text-paper/40">COLOPHON</MonoLabel>
          <MonoLabel className="mt-5 block text-paper/60">
            SET IN BRICOLAGE GROTESQUE
          </MonoLabel>
          <MonoLabel className="block text-paper/60">
            + SPACE MONO — {new Date().getFullYear()}
          </MonoLabel>
        </div>
      </div>

      <div className="flex items-center justify-between py-4">
        <MonoLabel className="text-paper/40">
          © {new Date().getFullYear()} ArtCraft. All rights reserved.
        </MonoLabel>
        <MonoLabel className="text-paper/40">MADE BY ARTISTS</MonoLabel>
      </div>
    </div>

    {/* Giant clipped wordmark */}
    <div aria-hidden className="overflow-hidden">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-8">
        <div className="font-brut-display -mb-[0.34em] select-none text-[18vw] font-bold uppercase leading-none tracking-[-0.03em] text-paper/90">
          ArtCraft<span className="text-volt">®</span>
        </div>
      </div>
    </div>
  </footer>
);
