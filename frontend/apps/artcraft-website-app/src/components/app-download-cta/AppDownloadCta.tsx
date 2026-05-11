import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { useDismissibleBanner } from "../../lib/useDismissibleBanner";

const DISMISS_KEY = "artcraft-app-download-cta-dismissed-v1";

export function AppDownloadCta() {
  const { visible, dismiss } = useDismissibleBanner(DISMISS_KEY);

  if (!visible) return null;

  return (
    <div className="glass animate-fade-in-up mb-2 hidden sm:flex w-fit mx-auto items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-white">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
        <FontAwesomeIcon icon={faDesktop} className="h-3.5 w-3.5" />
      </div>
      <span className="text-white/90">
        Get more out of ArtCraft on desktop - 3D Stage, 2D Canvas &amp; more.
      </span>
      <Link
        to="/download"
        className="rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary"
      >
        Download
      </Link>
      <button
        onClick={dismiss}
        className="ml-1 text-white/40 transition-colors hover:text-white/80"
        aria-label="Dismiss"
      >
        <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
      </button>
    </div>
  );
}

export default AppDownloadCta;
