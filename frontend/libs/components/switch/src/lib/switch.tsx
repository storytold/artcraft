import { Switch as HeadlessSwitch } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";

interface SwitchProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  className?: string;
  offClassName?: string;
}

export function Switch({ enabled, setEnabled, className, offClassName }: SwitchProps) {
  return (
    <HeadlessSwitch checked={enabled} onChange={setEnabled} as={Fragment}>
      {({ checked, disabled }) => (
        <button
          className={clsx(
            "group inline-flex h-6 w-11 items-center rounded-none border transition-colors",
            checked
              ? "border-white bg-white"
              : (offClassName ?? "border-ui-controls-border bg-transparent"),
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
        >
          <span className="sr-only">Enable notifications</span>
          <span
            className={clsx(
              "size-4 rounded-none transition",
              checked ? "translate-x-[22px] bg-black" : "translate-x-1 bg-white/70",
            )}
          />
        </button>
      )}
    </HeadlessSwitch>
  );
}

export default Switch;
