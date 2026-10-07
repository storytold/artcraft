import { useEffect, useState } from "react";
import { SparklesIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { toast } from "@storyteller/ui-toaster";
import { gtagEvent } from "@storyteller/google-analytics";
import {
  GetSeedanceDraft,
  RenderSeedanceFinal,
  type SeedanceDraftInfo,
} from "@storyteller/tauri-api";

interface SeedanceDraftRenderButtonProps {
  mediaFileToken?: string;
}

// "Render final 1080p" for a Seedance 2.5 draft made with BytePlus. Renders nothing for any
// other video, so the lightbox can always mount it next to its video actions.
export const SeedanceDraftRenderButton = ({
  mediaFileToken,
}: SeedanceDraftRenderButtonProps) => {
  const [draft, setDraft] = useState<SeedanceDraftInfo | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setDraft(null);
    if (!mediaFileToken) return;
    let cancelled = false;
    GetSeedanceDraft(mediaFileToken)
      .then((info) => {
        if (!cancelled) setDraft(info);
      })
      .catch((error) => console.warn("Could not check for a Seedance draft:", error));
    return () => {
      cancelled = true;
    };
  }, [mediaFileToken]);

  if (!draft || !mediaFileToken) return null;

  const renderFinal = async () => {
    setIsStarting(true);
    gtagEvent("seedance_render_final_clicked");
    try {
      await RenderSeedanceFinal(mediaFileToken);
      toast.success("Rendering the 1080p video. It will appear in your library.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsStarting(false);
    }
  };

  const button = (
    <Button
      className="w-full py-1.5 text-[13px]"
      variant="primary"
      icon={SparklesIcon}
      loading={isStarting}
      disabled={draft.is_expired}
      onClick={(e) => {
        e.stopPropagation();
        void renderFinal();
      }}
    >
      {draft.is_expired ? "Draft expired" : "Render final 1080p"}
    </Button>
  );

  // The grid cell spans both columns; the tooltip's wrapper sits inside it.
  return (
    <div className="col-span-2">
      <Tooltip
        content={
          draft.is_expired
            ? "Drafts can be rendered for 7 days. Generate a new draft."
            : `Renders this draft at 1080p. Available until ${new Date(draft.expires_at * 1000).toLocaleDateString()}.`
        }
        position="top"
        className="z-50"
      >
        {button}
      </Tooltip>
    </div>
  );
};
