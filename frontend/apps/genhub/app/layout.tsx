import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: {
    default: "GenHub — Community Prompts by Storyteller",
    template: "%s | GenHub",
  },
  description:
    "Discover, share, and remix AI prompts for image, video, and audio generation.",
  openGraph: {
    title: "GenHub — Community Prompts by Storyteller",
    description:
      "Discover, share, and remix AI prompts for image, video, and audio generation.",
    type: "website",
    siteName: "GenHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "GenHub — Community Prompts by Storyteller",
    description:
      "Discover, share, and remix AI prompts for image, video, and audio generation.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
