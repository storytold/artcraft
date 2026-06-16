import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faImages,
} from "@fortawesome/pro-regular-svg-icons";

interface Props {
  onUpload: () => void;
  onLibrary: () => void;
}

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
          <button
            type="button"
            onClick={onUpload}
            className="group flex items-center gap-2.5 rounded-full bg-primary py-2.5 pl-5 pr-2.5 text-sm font-medium text-white transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary-600 active:scale-[0.98]"
          >
            Upload
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
              <FontAwesomeIcon
                icon={faArrowUpFromBracket}
                className="h-3.5 w-3.5"
              />
            </span>
          </button>
          <button
            type="button"
            onClick={onLibrary}
            className="flex items-center gap-2 rounded-full border border-ui-divider px-5 py-2.5 text-sm font-medium text-base-fg/80 transition-colors duration-200 hover:bg-base-fg/5 hover:text-base-fg"
          >
            <FontAwesomeIcon icon={faImages} className="h-3.5 w-3.5" />
            From library
          </button>
        </div>
      </div>
    </div>
  );
};
