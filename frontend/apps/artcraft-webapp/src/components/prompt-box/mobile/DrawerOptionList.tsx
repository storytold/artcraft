import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { type PopoverItem } from "@storyteller/ui-popover";

interface DrawerOptionListProps {
  items: PopoverItem[];
  onSelect: (item: PopoverItem) => void;
}

// Renders a list of `PopoverItem`s as large tappable rows inside a drawer.
// Reuses the same item arrays the desktop popovers consume — no new data.
export function DrawerOptionList({ items, onSelect }: DrawerOptionListProps) {
  return (
    <div className="flex flex-col gap-1 py-1">
      {items.map((item, i) => (
        <button
          key={item.action ?? `${item.label}-${i}`}
          type="button"
          disabled={item.disabled}
          onClick={() => !item.disabled && onSelect(item)}
          className={twMerge(
            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
            item.selected ? "bg-primary/15" : "hover:bg-white/5",
            item.disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {item.icon && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base-fg">
              {item.icon}
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-base-fg">
              {item.label}
            </span>
            {item.description && (
              <span className="truncate text-xs text-base-fg/55">
                {item.description}
              </span>
            )}
          </span>
          {item.trailing}
          {item.selected && (
            <FontAwesomeIcon
              icon={faCheck}
              className="h-3.5 w-3.5 shrink-0 text-primary"
            />
          )}
        </button>
      ))}
    </div>
  );
}
