import { Switch as HeadlessSwitch } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";

interface SwitchProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  offClassName?: string;
}

export function Switch({ enabled, setEnabled, id, label = "Enable notifications", disabled = false, className, offClassName }: SwitchProps) {
  return (
    // Headless UI accepts `id` at runtime, but its `as={Fragment}` typings omit it, so it is spread untyped.
    <HeadlessSwitch {...({ id } as object)} checked={enabled} onChange={setEnabled} disabled={disabled} as={Fragment}>
      {({ checked, disabled }) => (
        <button
          className={clsx(
            "group inline-flex h-6 w-11 items-center rounded-[3px] border transition-colors",
            checked
              ? "border-white bg-white"
              : (offClassName ?? "border-ui-controls-border bg-transparent"),
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
        >
          <span className="sr-only">{label}</span>
          <span
            className={clsx(
              "size-4 rounded-[2px] transition",
              checked
                ? "translate-x-[22px] bg-black"
                : "translate-x-1 bg-white/70",
            )}
          />
        </button>
      )}
    </HeadlessSwitch>
  );
}

export default Switch;
