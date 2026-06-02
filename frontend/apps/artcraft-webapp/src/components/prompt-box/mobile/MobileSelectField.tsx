import { useState, type ReactNode } from "react";
import { type PopoverItem } from "@storyteller/ui-popover";
import { MobileFieldButton } from "./MobileFieldButton";
import { SettingsDrawer } from "./SettingsDrawer";
import { DrawerOptionList } from "./DrawerOptionList";

interface MobileSelectFieldProps {
  label: string;
  items: PopoverItem[];
  onSelect: (item: PopoverItem) => void;
  // Overrides; default to the currently selected item's icon/label.
  icon?: ReactNode;
  value?: ReactNode;
  title?: string;
  disabled?: boolean;
}

// A settings field that opens a bottom sheet of single-select options. Picking
// one calls `onSelect` and closes the drawer.
export function MobileSelectField({
  label,
  items,
  onSelect,
  icon,
  value,
  title,
  disabled,
}: MobileSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.selected);

  const handleSelect = (item: PopoverItem) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <>
      <MobileFieldButton
        label={label}
        icon={icon ?? selected?.icon}
        value={value ?? selected?.label ?? "—"}
        onClick={() => setOpen(true)}
        disabled={disabled}
      />
      <SettingsDrawer
        open={open}
        onOpenChange={setOpen}
        title={title ?? label}
      >
        <DrawerOptionList items={items} onSelect={handleSelect} />
      </SettingsDrawer>
    </>
  );
}
