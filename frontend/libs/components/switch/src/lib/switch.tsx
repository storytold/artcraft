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
    <HeadlessSwitch id={id} checked={enabled} onChange={setEnabled} disabled={disabled} as={Fragment}>
      {({ checked, disabled }) => (
        <button
          className={clsx(
            "group inline-flex h-6 w-11 items-center rounded-full",
            checked ? "bg-primary" : (offClassName ?? "bg-action"),
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
        >
          <span className="sr-only">{label}</span>
          <span
            className={clsx(
              "size-4 rounded-full bg-white transition",
              checked ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      )}
    </HeadlessSwitch>
  );
}

export default Switch;
