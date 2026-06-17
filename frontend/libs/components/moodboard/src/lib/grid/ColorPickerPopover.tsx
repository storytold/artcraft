import { useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette } from "@fortawesome/pro-regular-svg-icons";
import { PopoverMenu } from "@storyteller/ui-popover";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";

const DEFAULT_COLOR = "#6384F4"; // character-selected — seeds the picker

interface Props {
  onAdd: (color: string) => void;
}

// "Add color" entry. Picking only updates a local preview; nothing lands on the
// board until the explicit "Add color" button — so dragging through the spectrum
// no longer spams the board with a swatch on every tick.
export const ColorPickerPopover = ({ onAdd }: Props) => (
  // Tooltip matches the sibling ToolbarIconButtons (bottom, 300ms, close on click).
  <Tooltip content="Add color" position="bottom" delay={300} closeOnClick>
    <PopoverMenu
      mode="default"
      position="bottom"
      panelTitle="Add a color"
      panelClassName="w-60"
      triggerIcon={
        <FontAwesomeIcon
          icon={faPalette}
          className="h-4 w-4"
          aria-label="Add color"
        />
      }
      buttonClassName="h-9 w-9 rounded-[10px] border-transparent bg-transparent p-0 text-base-fg/80 shadow-none hover:bg-base-fg/10 hover:text-base-fg"
    >
      {(close) => (
        <ColorPickerPanel
          onAdd={(color) => {
            onAdd(color);
            close();
          }}
        />
      )}
    </PopoverMenu>
  </Tooltip>
);

const ColorPickerPanel = ({ onAdd }: Props) => {
  const [color, setColor] = useState(DEFAULT_COLOR);
  const normalized = color.toUpperCase();
  return (
    <div className="flex flex-col gap-3 p-1">
      <HexColorPicker
        color={color}
        onChange={setColor}
        style={{ width: "100%", height: 168 }}
      />
      <div className="flex items-center gap-2">
        <span
          className="h-9 w-9 shrink-0 rounded-lg border border-ui-divider"
          style={{ backgroundColor: normalized }}
          aria-hidden
        />
        <HexColorInput
          color={color}
          onChange={setColor}
          prefixed
          aria-label="Hex color"
          className="h-9 w-full rounded-lg border border-ui-controls-border bg-ui-controls px-2.5 text-sm uppercase text-base-fg outline-none focus:border-primary"
        />
      </div>
      <Button
        variant="primary"
        onClick={() => onAdd(normalized)}
        className="w-full justify-center"
      >
        Add color
      </Button>
    </div>
  );
};
