import { ChangeEvent } from "react";
import { TagsIcon, XIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface StylePromptRowProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Always-visible secondary prompt row for the style/genre direction
// (Suno's "tags"), rendered directly beneath the main prompt textarea.
export function StylePromptRow({
  value,
  onChange,
  placeholder = "Style: e.g. dreamy synth-pop, female vocals",
  className = "",
}: StylePromptRowProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div
      className={twMerge(
        "flex items-center gap-2 border-t border-white/10 px-1 pt-2",
        className,
      )}
    >
      <TagsIcon
        
        className="h-3.5 w-3.5 shrink-0 text-base-fg/40" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-base-fg placeholder:text-base-fg/35 focus:outline-none"
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Clear style"
          onClick={() => onChange("")}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] text-base-fg/40 transition-colors hover:bg-white/10 hover:text-base-fg"
        >
          <XIcon  className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
