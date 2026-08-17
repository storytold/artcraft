import Link from "next/link";
import { SOCIAL_LINKS, SUPPORT_EMAIL, WEBAPP_URL } from "@/lib/links";

const LINK_COLUMNS: {
  heading: string;
  links: { name: string; href: string; external?: boolean }[];
}[] = [
  {
    heading: "Product",
    links: [
      { name: "Download", href: "/download" },
      { name: "Pricing", href: "/pricing" },
      { name: "Launch App", href: WEBAPP_URL, external: true },
    ],
  },
  {
    heading: "Resources",
    links: [
      { name: "Tutorials", href: "/tutorials" },
      { name: "News", href: "/news" },
      { name: "FAQ", href: "/faq" },
      { name: "Press Kit", href: "/press-kit" },
      { name: "Support", href: "/support" },
    ],
  },
  {
    heading: "Community",
    links: [
      { name: "Discord", href: SOCIAL_LINKS.DISCORD, external: true },
      { name: "GitHub", href: SOCIAL_LINKS.GITHUB, external: true },
      { name: "YouTube", href: SOCIAL_LINKS.YOUTUBE, external: true },
      { name: "Instagram", href: SOCIAL_LINKS.INSTAGRAM, external: true },
      { name: "TikTok", href: SOCIAL_LINKS.TIKTOK, external: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <div className="grid gap-px bg-line md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="bg-bg p-6 md:p-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="ArtCraft"
              src="/artcraft-icon.svg"
              className="themed-logo h-8 w-auto"
            />
            <p className="mt-4 max-w-xs leading-relaxed text-muted">
              The open-source studio for controllable AI image and video.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="hud-label mt-6 inline-block text-faint hover:text-ink"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>

          {LINK_COLUMNS.map((column) => (
            <nav
              key={column.heading}
              aria-label={column.heading}
              className="bg-bg p-6 md:p-8"
            >
              <p className="hud-label text-faint">{column.heading}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-ink"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-muted hover:text-ink">
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-6 py-4 md:flex-row md:items-center md:justify-between md:px-10">
          <p className="hud-label text-faint">
            © {new Date().getFullYear()} ArtCraft
          </p>
          <p className="hud-label text-faint">Made by artists, for artists</p>
        </div>
      </div>
    </footer>
  );
}
