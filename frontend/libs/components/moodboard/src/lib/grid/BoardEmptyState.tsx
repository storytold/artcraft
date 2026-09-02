import { ImagesIcon, UploadIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";

interface Props {
  onUpload: () => void;
  onLibrary: () => void;
}

// Shared sizing so both CTAs stay visually aligned; the shared Button supplies
// the brutalist idiom (mono uppercase label, 3px corners).
const CTA_CLASS = "h-9 px-4";

// Editorial empty state — the board's first impression. Doubles as the
// drop / paste affordance (the whole grid accepts drops; this just says so).
export const BoardEmptyState = ({ onUpload, onLibrary }: Props) => {
  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <span className="mb-5 border border-ui-divider px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-base-fg/50">
          Moodboard
        </span>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-base-fg">
          Start collecting ideas
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-base-fg/55">
          Drag images in, paste from anywhere, or pull from your library.
          Everything you gather here can later steer a generation.
        </p>

        <div className="mt-7 flex items-center gap-3">
          <Button
            variant="primary"
            onClick={onUpload}
            icon={UploadIcon}
            className={CTA_CLASS}
          >
            Upload
          </Button>
          <Button
            variant="secondary"
            onClick={onLibrary}
            icon={ImagesIcon}
            className={CTA_CLASS}
          >
            From library
          </Button>
        </div>
      </div>
    </div>
  );
};
