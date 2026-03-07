import { Button } from "@storyteller/ui-button";
import { isMobile, isMacOs } from "react-device-detect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindows, faApple } from "@fortawesome/free-brands-svg-icons";
import { faRocket } from "@fortawesome/pro-solid-svg-icons";
import { DOWNLOAD_LINKS } from "../config/github_download_links";

interface LandingActionButtonsProps {
  onDownloadClick?: (e: React.MouseEvent) => void;
  className?: string;
  creditsButtonText?: string;
}

export const LandingActionButtons = ({
  onDownloadClick,
  className,
  creditsButtonText = "Supercharge Credits",
}: LandingActionButtonsProps) => {
  const MAC_LINK = DOWNLOAD_LINKS.MACOS;
  const WINDOWS_LINK = DOWNLOAD_LINKS.WINDOWS;
  const downloadUrl = isMacOs ? MAC_LINK : WINDOWS_LINK;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-4 ${
        className || ""
      }`}
    >
      {isMobile ? (
        <Button className="text-lg font-semibold rounded-xl shadow-lg" disabled>
          Download on a desktop
        </Button>
      ) : (
        <>
          <Button
            className="glow-border-animated text-md px-8 py-4 text-lg font-semibold rounded-xl shadow-lg gap-3 transition-all duration-300 hover:scale-105 hover:shadow-primary/25 border-2 border-primary/30 bg-gradient-to-r from-primary/20 to-purple-600/20 hover:from-primary/30 hover:to-purple-600/30 backdrop-blur-md"
            as="link"
            href="/pricing"
          >
            <FontAwesomeIcon icon={faRocket} />
            {creditsButtonText}
          </Button>
          <div className="relative">
            <Button
              className="text-md px-8 py-4 text-lg font-semibold rounded-xl shadow-lg gap-3 transition-all duration-300 bg-white hover:bg-white/80 text-black"
              as="link"
              href={downloadUrl}
              onClick={onDownloadClick}
            >
              <FontAwesomeIcon icon={isMacOs ? faApple : faWindows} />
              Download for {isMacOs ? "Mac" : "Windows"}
            </Button>
            <a
              href="/download"
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 text-xs text-white/40 hover:text-white/70 transition-colors duration-200 whitespace-nowrap"
            >
              More download options
            </a>
          </div>
        </>
      )}
    </div>
  );
};
