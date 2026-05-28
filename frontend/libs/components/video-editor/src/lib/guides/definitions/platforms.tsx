import type { GuideDefinition } from "../types";
import { TikTokLayout } from "./tiktok-layout";

function PlatformLogo({
  domain,
  className = "size-4",
}: {
  domain: string;
  className?: string;
}) {
  return (
    <img
      src={`https://cdn.brandfetch.io/${domain}/w/64/h/64`}
      alt=""
      width={18}
      height={18}
      className={className}
      draggable={false}
    />
  );
}

function PlatformGuidePreview({ domain }: { domain: string }) {
  return <PlatformLogo domain={domain} />;
}

function platformGuide({
  id,
  label,
  domain,
}: {
  id: string;
  label: string;
  domain: string;
}): GuideDefinition {
  return {
    id,
    label,
    renderPreview: () => <PlatformGuidePreview domain={domain} />,
    renderTriggerIcon: () => <PlatformLogo domain={domain} />,
    renderOverlay: () => null,
  };
}

export const tiktokGuide: GuideDefinition = {
  ...platformGuide({ id: "tiktok", label: "TikTok", domain: "tiktok.com" }),
  renderOverlay: () => <TikTokLayout />,
};
export const igReelsGuide = platformGuide({
  id: "ig-reels",
  label: "Reels",
  domain: "instagram.com",
});
export const ytShortsGuide = platformGuide({
  id: "yt-shorts",
  label: "Shorts",
  domain: "youtube.com",
});
export const spotlightGuide = platformGuide({
  id: "spotlight",
  label: "Spotlight",
  domain: "snapchat.com",
});
