import {
  faArrowUpFromBracket,
  faImages,
} from "@fortawesome/pro-regular-svg-icons";
import { Button } from "@storyteller/ui-button";

interface Props {
  onUpload: () => void;
  onLibrary: () => void;
}

// Shared sizing so both CTAs match the webapp create pages' empty-state buttons
// (h-12, pill, semibold). Centralized so the pair stays visually aligned.
const CTA_CLASS = "h-12 px-6 text-base font-semibold rounded-full";

// Editorial empty state — the board's first impression. Doubles as the
// drop / paste affordance (the whole grid accepts drops; this just says so).
export const BoardEmptyState = ({ onUpload, onLibrary }: Props) => {
  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <span className="mb-5 rounded-full border border-ui-divider px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-base-fg/50">
          Moodboard
        </span>
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-base-fg">
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
            icon={faArrowUpFromBracket}
            className={CTA_CLASS}
          >
            Upload
          </Button>
          <Button
            variant="secondary"
            onClick={onLibrary}
            icon={faImages}
            className={CTA_CLASS}
          >
            From library
          </Button>
        </div>
      </div>
    </div>
  );
};
