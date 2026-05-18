import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/pro-solid-svg-icons";

// Small fixed-position card shown next to the camera when a visitor is
// looking at someone else's scene. Renders the author's generation
// result so a visitor can see what the scene was made to produce. Today
// this is scaffolding only — the URL data path (likely a new field
// returned by adapter.loadScene's response payload, propagated into
// sceneMeta.previewImageUrl) is wired up in a follow-up PR. Renders
// null when no URL is supplied, so it's safe to mount unconditionally
// inside the isVisitingOthersScene branch.
export interface PreviewBoxProps {
  imageUrl?: string;
}

export const PreviewBox = ({ imageUrl }: PreviewBoxProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (!imageUrl || dismissed) return null;

  return (
    <div className="glass absolute bottom-6 right-6 z-20 flex w-48 flex-col gap-2 rounded-lg border border-white/10 p-2 shadow-lg">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        aria-label="Hide preview"
      >
        <FontAwesomeIcon icon={faXmark} className="text-xs" />
      </button>
      <img
        src={imageUrl}
        crossOrigin="anonymous"
        alt="Author's generation"
        className="rounded-md"
      />
      <span className="text-center text-[11px] text-white/60">
        Author's generation
      </span>
    </div>
  );
};
