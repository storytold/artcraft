import { useState } from "react";
import { Label } from "@storyteller/ui-label";
import { Switch } from "@storyteller/ui-switch";
import { gtagEvent } from "@storyteller/google-analytics";
import { useExperimentalStore } from "../experimental-store";
import { ExperimentalConfirmModal } from "../ExperimentalConfirmModal";

interface Props {
  // Called immediately before the storyboard flag flips off, so the host app
  // can reset page state and navigate away from the soon-to-be-hidden tab.
  onStoryboardPageDisable?: () => void;
  // Same contract as above for the moodboard page.
  onMoodboardPageDisable?: () => void;
  // Same contract as above for the HTML moodboard page.
  onMoodboardHtmlPageDisable?: () => void;
}

export const ExperimentalSettingsPane = ({
  onStoryboardPageDisable,
  onMoodboardPageDisable,
  onMoodboardHtmlPageDisable,
}: Props) => {
  const storyboardPageEnabled = useExperimentalStore(
    (s) => s.storyboardPageEnabled,
  );
  const setStoryboardPageEnabled = useExperimentalStore(
    (s) => s.setStoryboardPageEnabled,
  );
  const moodboardPageEnabled = useExperimentalStore(
    (s) => s.moodboardPageEnabled,
  );
  const setMoodboardPageEnabled = useExperimentalStore(
    (s) => s.setMoodboardPageEnabled,
  );
  const moodboardHtmlPageEnabled = useExperimentalStore(
    (s) => s.moodboardHtmlPageEnabled,
  );
  const setMoodboardHtmlPageEnabled = useExperimentalStore(
    (s) => s.setMoodboardHtmlPageEnabled,
  );
  const [isStoryboardDisableConfirmOpen, setIsStoryboardDisableConfirmOpen] =
    useState(false);
  const [isMoodboardDisableConfirmOpen, setIsMoodboardDisableConfirmOpen] =
    useState(false);
  const [
    isMoodboardHtmlDisableConfirmOpen,
    setIsMoodboardHtmlDisableConfirmOpen,
  ] = useState(false);

  const fireToggleEvent = (feature: string, enabled: boolean) => {
    gtagEvent("toggle_experimental_feature", {
      feature,
      enabled: String(enabled),
    });
  };

  const handleStoryboardToggle = (enabled: boolean) => {
    if (enabled) {
      setStoryboardPageEnabled(true);
      fireToggleEvent("storyboard_page", true);
    } else {
      setIsStoryboardDisableConfirmOpen(true);
    }
  };

  const handleConfirmStoryboardDisable = () => {
    onStoryboardPageDisable?.();
    setStoryboardPageEnabled(false);
    fireToggleEvent("storyboard_page", false);
    setIsStoryboardDisableConfirmOpen(false);
  };

  const handleMoodboardToggle = (enabled: boolean) => {
    if (enabled) {
      setMoodboardPageEnabled(true);
      fireToggleEvent("moodboard_page", true);
    } else {
      setIsMoodboardDisableConfirmOpen(true);
    }
  };

  const handleConfirmMoodboardDisable = () => {
    onMoodboardPageDisable?.();
    setMoodboardPageEnabled(false);
    fireToggleEvent("moodboard_page", false);
    setIsMoodboardDisableConfirmOpen(false);
  };

  const handleMoodboardHtmlToggle = (enabled: boolean) => {
    if (enabled) {
      setMoodboardHtmlPageEnabled(true);
      fireToggleEvent("moodboard_html_page", true);
    } else {
      setIsMoodboardHtmlDisableConfirmOpen(true);
    }
  };

  const handleConfirmMoodboardHtmlDisable = () => {
    onMoodboardHtmlPageDisable?.();
    setMoodboardHtmlPageEnabled(false);
    fireToggleEvent("moodboard_html_page", false);
    setIsMoodboardHtmlDisableConfirmOpen(false);
  };

  return (
    <>
      <div className="space-y-4 text-base-fg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Label htmlFor="experimental-storyboard-page">Storyboard page</Label>
            <p className="text-xs opacity-70">
              Plan shots on a visual storyboard. In-development.
            </p>
          </div>
          <Switch
            className="shrink-0"
            enabled={storyboardPageEnabled}
            setEnabled={handleStoryboardToggle}
          />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Label htmlFor="experimental-moodboard-page">Moodboard page</Label>
            <p className="text-xs opacity-70">
              Collage references on a 2D canvas. In-development.
            </p>
          </div>
          <Switch
            className="shrink-0"
            enabled={moodboardPageEnabled}
            setEnabled={handleMoodboardToggle}
          />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Label htmlFor="experimental-moodboard-html-page">
              Moodboard (HTML)
            </Label>
            <p className="text-xs opacity-70">
              HTML-only render of the moodboard, no canvas. In-development.
            </p>
          </div>
          <Switch
            className="shrink-0"
            enabled={moodboardHtmlPageEnabled}
            setEnabled={handleMoodboardHtmlToggle}
          />
        </div>
      </div>
      <ExperimentalConfirmModal
        isOpen={isStoryboardDisableConfirmOpen}
        onClose={() => setIsStoryboardDisableConfirmOpen(false)}
        onConfirm={handleConfirmStoryboardDisable}
        title="Disable Storyboard page?"
        text="The Storyboard page will be reset and any unsaved changes will be lost."
        confirmText="Disable"
      />
      <ExperimentalConfirmModal
        isOpen={isMoodboardDisableConfirmOpen}
        onClose={() => setIsMoodboardDisableConfirmOpen(false)}
        onConfirm={handleConfirmMoodboardDisable}
        title="Disable Moodboard page?"
        text="The Moodboard page will be reset and any unsaved changes will be lost."
        confirmText="Disable"
      />
      <ExperimentalConfirmModal
        isOpen={isMoodboardHtmlDisableConfirmOpen}
        onClose={() => setIsMoodboardHtmlDisableConfirmOpen(false)}
        onConfirm={handleConfirmMoodboardHtmlDisable}
        title="Disable Moodboard (HTML)?"
        text="The HTML Moodboard page will be reset and any unsaved changes will be lost."
        confirmText="Disable"
      />
    </>
  );
};
