import { Switch as HeadlessSwitch } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";

interface SwitchProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  className?: string;
}

export function Switch({ enabled, setEnabled, className }: SwitchProps) {
  return (
    <HeadlessSwitch checked={enabled} onChange={setEnabled} as={Fragment}>
      {({ checked, disabled }) => (
        <button
          className={clsx(
            "group inline-flex h-6 w-11 items-center rounded-full",
            checked ? "bg-primary" : "bg-action",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <span className="sr-only">Enable notifications</span>
          <span
            className={clsx(
              "size-4 rounded-full bg-white transition",
              checked ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      )}
    </HeadlessSwitch>
  );
}

export default Switch;
