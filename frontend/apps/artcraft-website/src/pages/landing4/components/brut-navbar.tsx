import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SOCIAL_LINKS } from "../../../config/links";
import { MonoLabel } from "./ui";

const NAV_LINKS: ReadonlyArray<{
  label: string;
  index: string;
  to?: string;
  href?: string;
}> = [
  { label: "PRICING", index: "01", to: "/pricing" },
  { label: "TUTORIALS", index: "02", to: "/tutorials" },
  { label: "NEWS", index: "03", to: "/news" },
  { label: "GITHUB ↗", index: "04", href: SOCIAL_LINKS.GITHUB },
];

// Landing4-only fixed navbar. Chapter-aware: text and hairlines read the
// --l4-* vars so the bar recolors as the page scrubs between ink and paper.
// A backdrop tinted with the current --l4-bg keeps links legible over content.
// Mobile: a full-screen ink overlay with numbered index-style rows.
export const BrutNavbar = ({
  onDownloadClick,
}: {
  onDownloadClick: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock page scroll behind the full-screen menu.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className="l4-line fixed inset-x-0 top-0 z-50 border-b"
        style={{ backgroundColor: "var(--l4-bg)", color: "var(--l4-ink)" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-4 sm:px-8">
          <Link
            to="/landing4"
            className="font-brut-display text-lg font-bold uppercase tracking-tight"
          >
            ArtCraft<span className="align-super text-[10px]">®</span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) =>
              link.to ? (
                <Link key={link.label} to={link.to} className="group">
                  <MonoLabel className="group-hover:text-flare transition-colors">
                    {link.label}{" "}
                    <span className="l4-muted">/{link.index}</span>
                  </MonoLabel>
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group"
                >
                  <MonoLabel className="group-hover:text-flare transition-colors">
                    {link.label}{" "}
                    <span className="l4-muted">/{link.index}</span>
                  </MonoLabel>
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onDownloadClick}
              className="bg-flare text-ink hover:bg-paper flex h-9 items-center px-5 font-brut-mono text-[12px] font-bold uppercase tracking-[0.14em] transition-colors"
            >
              Download
            </button>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation index"
              className="l4-line flex h-9 items-center border px-4 font-brut-mono text-[12px] uppercase tracking-[0.14em] lg:hidden"
            >
              {menuOpen ? "Close" : "Index"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen index */}
      {menuOpen && (
        <div className="bg-ink text-paper fixed inset-0 z-40 flex flex-col justify-center px-6 pt-14 lg:hidden">
          <nav className="border-t border-paper/15">
            {NAV_LINKS.map((link) => {
              const row = (
                <span className="flex items-baseline justify-between py-5">
                  <span className="font-brut-display text-4xl font-bold uppercase">
                    {link.label}
                  </span>
                  <MonoLabel className="text-paper/40">/{link.index}</MonoLabel>
                </span>
              );
              return link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-paper/15"
                >
                  {row}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-paper/15"
                >
                  {row}
                </a>
              );
            })}
          </nav>
          <MonoLabel className="mt-10 text-paper/40">
            ARTCRAFT — IMG / VID / 3D — OPEN SOURCE
          </MonoLabel>
        </div>
      )}
    </>
  );
};
