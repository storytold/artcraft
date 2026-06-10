import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { FOLDER_COLOR_PRESETS } from "./folderUtils";

interface FolderColorRowProps {
  colorCode?: string | null;
  onSetColor: (color: string | null) => void;
}

/**
 * Preset color swatches + a clear option + a native custom-color picker, shared
 * by the desktop and webapp folder context menus.
 */
export const FolderColorRow: React.FC<FolderColorRowProps> = ({
  colorCode,
  onSetColor,
}) => (
  <div className="flex flex-wrap items-center gap-1.5 px-2 py-2">
    {FOLDER_COLOR_PRESETS.map((c) => (
      <button
        key={c}
        type="button"
        aria-label={`Color ${c}`}
        onClick={() => onSetColor(c)}
        style={{ backgroundColor: c }}
        className={twMerge(
          "h-5 w-5 rounded-full border border-black/20 transition-transform hover:scale-110",
          colorCode === c &&
            "ring-2 ring-white ring-offset-1 ring-offset-ui-panel",
        )}
      />
    ))}
    {/* Clear color */}
    <button
      type="button"
      aria-label="Clear color"
      onClick={() => onSetColor(null)}
      className={twMerge(
        "flex h-5 w-5 items-center justify-center rounded-full border border-ui-panel-border text-base-fg/50 hover:text-base-fg",
        !colorCode && "ring-2 ring-white ring-offset-1 ring-offset-ui-panel",
      )}
    >
      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
    </button>
    {/* Custom hex (native picker) */}
    <label
      title="Custom color"
      className="relative h-5 w-5 cursor-pointer overflow-hidden rounded-full border border-ui-panel-border"
      style={{
        background:
          "conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)",
      }}
    >
      <input
        type="color"
        value={
          colorCode && /^#[0-9a-fA-F]{6}$/.test(colorCode) ? colorCode : "#888888"
        }
        onChange={(e) => onSetColor(e.target.value)}
        className="absolute -inset-1 h-[150%] w-[150%] cursor-pointer opacity-0"
      />
    </label>
  </div>
);
