import { faUpload, faImages } from "@fortawesome/pro-solid-svg-icons";
import { faThumbtack } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";

interface Props {
  onUploadClick: () => void;
  onGalleryClick: () => void;
}

export const EmptyMoodboardCTA = ({ onUploadClick, onGalleryClick }: Props) => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
    <div className="glass pointer-events-auto flex w-full max-w-md flex-col items-center gap-5 rounded-2xl p-8 text-center shadow-xl">
      <FontAwesomeIcon
        icon={faThumbtack}
        className="-rotate-12 text-4xl text-base-fg/60"
      />
      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold tracking-tight text-base-fg">
          Start your moodboard
        </h3>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-base-fg/60">
          Drop, paste, or pick images from your library to start collecting
          inspiration.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          variant="primary"
          icon={faUpload}
          onClick={onUploadClick}
          className="px-5 py-2.5 text-sm font-semibold shadow-lg"
        >
          Select Image
        </Button>
        <Button
          variant="action"
          icon={faImages}
          onClick={onGalleryClick}
          className="border-2 px-5 py-2.5 text-sm font-semibold"
        >
          Pick from Library
        </Button>
      </div>
    </div>
  </div>
);
