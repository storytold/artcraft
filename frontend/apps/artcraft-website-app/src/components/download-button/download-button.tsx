import { Button } from "@storyteller/ui-button";
import {
  faApple,
  faWindows,
  faLinux,
} from "@fortawesome/free-brands-svg-icons";
import { isMobile, isWindows, isMacOs } from "react-device-detect";
import { DOWNLOAD_LINKS } from "../../config/github_download_links";

interface DownloadButtonProps {
  className?: string;
}

export const DownloadButton = ({ className = "" }: DownloadButtonProps) => {
  // Helper function to detect Linux
  const isLinux =
    !isWindows &&
    !isMacOs &&
    navigator.platform.toLowerCase().includes("linux");

  const getDownloadLink = () => {
    if (isWindows) return DOWNLOAD_LINKS.WINDOWS;
    if (isMacOs) return DOWNLOAD_LINKS.MACOS;
    if (isLinux) return DOWNLOAD_LINKS.LINUX;
    return null;
  };

  const getIcon = () => {
    if (isMobile) return undefined;
    if (isWindows) return faWindows;
    if (isMacOs) return faApple;
    if (isLinux) return faLinux;
    return undefined;
  };

  const downloadLink = getDownloadLink();

  return (
    <Button
      className={`rounded-full rounded-xl px-8 py-4 text-md transition-all duration-300 shadow-lg hover:shadow-blue-500/25 ${className}`}
      disabled={isMobile || !downloadLink}
      icon={getIcon()}
      as="link"
      href={downloadLink || "#"}
      target="_blank"
    >
      {isMobile
        ? "Download on desktop"
        : isWindows
        ? "Download for Windows"
        : isMacOs
        ? "Download for MacOS"
        : isLinux
        ? "Download for Linux"
        : "Not available on your device"}
    </Button>
  );
};
