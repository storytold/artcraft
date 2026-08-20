"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

/*
 * Ported from @storyteller/ui-select, rebuilt as a native listbox (no
 * headlessui). Raised squared surface; the focused option inverts to the
 * theme's invert block.
 */

export type SelectValue = string | number;
export type SelectOption = { label: string; value: SelectValue };

export interface SelectProps {
  options: SelectOption[];
  onChange: (val: SelectValue) => void;
  placeholder?: string;
  value?: SelectValue;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  onChange,
  options,
  placeholder,
  value,
  id,
  className,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption =
    selectedIndex >= 0
      ? options[selectedIndex]
      : { label: placeholder ?? "", value: "" };

  const openList = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const selectIndex = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) openList();
        else if (activeIndex >= 0) selectIndex(activeIndex);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  return (
    <div ref={rootRef} className={twMerge("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={twMerge(
          "relative h-10 w-full cursor-pointer rounded-none border border-line bg-bg-raised py-2 pl-3 pr-10 text-left text-sm text-ink",
          "transition-colors duration-150 ease-in-out hover:border-line-strong",
          disabled && "cursor-not-allowed opacity-60 hover:border-line",
        )}
      >
        <span
          className={twMerge("block truncate", selectedIndex < 0 && "text-faint")}
        >
          {selectedOption.label}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted">
          <ChevronDownIcon
            aria-hidden
            className={twMerge("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-none border border-line bg-bg-raised text-sm"
        >
          {options.map((option, index) => {
            const selected = index === selectedIndex;
            const active = index === activeIndex;
            return (
              <li
                key={`${option.value}-${index}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectIndex(index)}
                className={twMerge(
                  "relative cursor-pointer select-none py-2 pl-7 pr-2 transition-colors duration-150 ease-in-out",
                  selected ? "bg-ink/10 font-medium text-ink" : "text-ink/90",
                  active && "bg-invert-bg text-invert-fg",
                )}
              >
                <span className="block truncate">{option.label}</span>
                {selected && (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                    <CheckIcon aria-hidden className="h-3 w-3" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Select;
