// One reusable card for the edit-3D splash. The blank-scene variant
// renders a dashed plus tile; the example variant renders a gradient
// thumbnail with a "Preview" pill. Sharing one component keeps the
// hover/border/typography treatment consistent across the grid.

import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/pro-solid-svg-icons";

interface BlankCardProps {
  variant: "blank";
  title: string;
  description: string;
  onClick: () => void;
}

interface ExampleCardProps {
  variant: "example";
  title: string;
  description: string;
  accentClass: string;
  onClick: () => void;
}

type SceneSplashCardProps = BlankCardProps | ExampleCardProps;

const SHELL_CLASS =
  "group flex flex-col overflow-hidden rounded-xl border bg-white/[0.03] text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

export function SceneSplashCard(props: SceneSplashCardProps) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={twMerge(
        SHELL_CLASS,
        props.variant === "blank"
          ? "border-dashed border-white/15 hover:border-white/40 hover:bg-white/[0.05]"
          : "border-white/10 hover:border-white/25 hover:bg-white/[0.05]",
      )}
    >
      <CardThumbnail {...props} />
      <CardCaption title={props.title} description={props.description} />
    </button>
  );
}

function CardThumbnail(props: SceneSplashCardProps) {
  if (props.variant === "blank") {
    return (
      <div className="flex aspect-video items-center justify-center bg-white/[0.02]">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/55 transition-colors group-hover:bg-primary/15 group-hover:text-primary">
          <FontAwesomeIcon icon={faPlus} className="text-sm" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={twMerge(
        "relative aspect-video bg-gradient-to-br",
        props.accentClass,
      )}
    >
      <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/75 backdrop-blur-sm">
        Preview
      </span>
    </div>
  );
}

function CardCaption({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5">
      <span className="text-sm font-medium text-white">{title}</span>
      <span className="text-xs text-white/55">{description}</span>
    </div>
  );
}
