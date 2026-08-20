import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Inter, Geist_Mono } from "next/font/google";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import MotionProvider from "@/components/motion-provider";
import TunerPanel from "@/components/dev/tuner-panel";
import "./globals.css";

const SITE_URL = "https://getartcraft.com";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
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
// as "light" | "dark" under this key by the navbar toggle.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("artcraft-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${instrumentSerif.variable} ${inter.variable} ${geistMono.variable}`}
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
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
        </MotionProvider>
        <TunerPanel />
      </body>
    </html>
  );
}
