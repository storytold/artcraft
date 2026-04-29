import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faFacebookF,
  faRedditAlien,
  faWhatsapp,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faXmark, faEnvelope } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface SocialButtonProps {
  social: "x" | "whatsapp" | "facebook" | "reddit" | "email";
  shareUrl: string;
  shareText: string;
}

export default function SocialButton({
  social,
  shareUrl,
  shareText,
}: SocialButtonProps) {
  const socialIcons = {
    x: faXTwitter,
    whatsapp: faWhatsapp,
    facebook: faFacebookF,
    reddit: faRedditAlien,
    email: faEnvelope,
  };

  const socialIcon = socialIcons[social] || faXmark;

  const getShareLink = (social: string, url: string, text: string) => {
    switch (social) {
      case "x":
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url,
        )}&text=${encodeURIComponent(text)}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url,
        )}`;
      case "whatsapp":
        return `https://wa.me/?text=${encodeURIComponent(
          text,
        )} ${encodeURIComponent(url)}`;
      case "reddit":
        return `https://www.reddit.com/submit?url=${encodeURIComponent(
          url,
        )}&title=${encodeURIComponent(text)}`;
      case "email":
        return `mailto:?subject=${encodeURIComponent(
          text,
        )}&body=${encodeURIComponent(url)}`;
      default:
        return "#";
    }
  };

  const handleClick = () => {
    const shareLink = getShareLink(social, shareUrl, shareText);
    window.open(shareLink, "_blank");
  };

  return (
    <button className="flex flex-col items-center" onClick={handleClick}>
      <div
        className={[
          "flex h-[56px] w-[56px]",
          "items-center justify-center rounded-lg",
          "text-[32px] text-white",
          `bg-${social}`,
          "transition-all duration-200 hover:opacity-80",
        ].join(" ")}>
        <FontAwesomeIcon icon={socialIcon as IconProp} />
      </div>

      <p className="mt-2 text-xs">
        {social.charAt(0).toUpperCase() + social.slice(1)}
      </p>
    </button>
  );
}
