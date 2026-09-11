import type { Metadata, Viewport } from "next";
import {
  Archivo,
  Instrument_Serif,
  Inter,
  Geist_Mono,
} from "next/font/google";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import IntroConductor from "@/components/intro-conductor";
import MotionProvider from "@/components/motion-provider";
import ScrollRuler from "@/components/ruler/scroll-ruler";
import TunerPanel from "@/components/dev/tuner-panel";
import "./globals.css";

const SITE_URL = "https://getartcraft.com";

// Display face: variable Archivo with its width axis loaded — headings run
// slightly expanded (font-stretch) for the industrial-grotesque look, and
// the hero wordmark renders the same family at its poster extreme
// (wght 900 / wdth 125%, the Archivo Black look) so the ruler's hero flip
// can interpolate weight and width down to the heading setting. A separate
// Archivo Black cut could never interpolate.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  axes: ["wdth"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ArtCraft — Controllable AI for Artists",
    template: "%s — ArtCraft",
  },
  description:
    "ArtCraft is the open-source desktop app for generating AI video and images — built for artists who want real control.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "ArtCraft",
    title: "ArtCraft — Controllable AI for Artists",
    description:
      "ArtCraft is the open-source desktop app for generating AI video and images — built for artists who want real control.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/artcraft-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ArtCraft",
  applicationCategory: "DesignApplication",
  operatingSystem: "macOS, Windows, Web",
  description:
    "Open-source desktop app for generating AI video and images — built for artists who want real control.",
  url: SITE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: "ArtCraft", url: SITE_URL },
};

// Applies the stored theme before first paint so neither theme flashes.
// System preference is the default; an explicit user choice is persisted
// as "light" | "dark" under this key by the navbar toggle. Also stamps
// data-intro when the intro will play (JS + motion allowed), so the
// wordmark letters are CSS-hidden BEFORE first paint — without it, the
// full word flashes for the frames between paint and hydration, then
// snaps into the logo-only formation start.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("artcraft-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("data-intro","");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${instrumentSerif.variable} ${inter.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <MotionProvider>
          {/* First child: its effect must run before every intro consumer
              (the ruler cascade reads introClock.scale at mount). */}
          <IntroConductor />
          <SiteNav />
          <main id="main">{children}</main>
          <SiteFooter />
          <ScrollRuler />
        </MotionProvider>
        <TunerPanel />
      </body>
    </html>
  );
}
