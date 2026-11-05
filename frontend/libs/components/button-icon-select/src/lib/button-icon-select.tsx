import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "@storyteller/ui-tooltip";

interface Option {
  value: string;
  icon: LucideIcon;
  text?: string;
  tooltip?: string;
}

interface ButtonIconSelectProps {
  options: Option[];
  onOptionChange?: (value: string) => void;
  selectedOption?: string;
  buttonClassName?: string;
}

export function ButtonIconSelect({
  options,
  onOptionChange,
  selectedOption,
  buttonClassName,
}: ButtonIconSelectProps) {
  const [internalSelectedOption, setInternalSelectedOption] = useState<string>(
    selectedOption || options[0].value
  );

  // BUG FIX: this used to depend on `options` and always reset. Callers that
  // pass an inline options array (new identity every render) and no
  // `selectedOption` had the user's click undone by the re-render that
  // onOptionChange triggers. Only sync when the parent controls the value.
  useEffect(() => {
    if (selectedOption) setInternalSelectedOption(selectedOption);
  }, [selectedOption]);

  const handleOptionChange = (value: string) => {
    setInternalSelectedOption(value);
    if (onOptionChange) {
      onOptionChange(value);
    }
  };

  return (
    <div className="flex space-x-1">
      {options.map(({ value, icon, text, tooltip }) =>
        tooltip ? (
          <Tooltip
            key={value}
            content={tooltip}
            position="bottom"
            delay={300}
            closeOnClick
          >
            <button
              className={twMerge(
                "flex h-9 items-center justify-center rounded-lg border text-sm outline-none transition-all duration-150 focus:outline-none",
                text ? "h-auto w-auto gap-2 px-3 py-1.5" : "w-9",
                internalSelectedOption === value
                  ? "border-brand-primary bg-brand-primary/20"
                  : "border-transparent hover:bg-ui-panel/[0.4]",
                buttonClassName,
              )}
              onClick={() => handleOptionChange(value)}
            >
              <DynamicIcon icon={icon} />
              {text && (
                <span className="text-nowrap text-sm font-medium">{text}</span>
              )}
            </button>
          </Tooltip>
        ) : (
          <button
            key={value}
            className={twMerge(
              `flex h-9 items-center justify-center rounded-lg border text-sm transition-all duration-150`,
              text ? "h-auto w-auto gap-2 px-3 py-1.5" : "w-9",
              internalSelectedOption === value
                ? "border-brand-primary bg-brand-primary/20"
                : "border-transparent hover:bg-ui-panel/[0.4]",
              buttonClassName,
            )}
            onClick={() => handleOptionChange(value)}
          >
            <DynamicIcon icon={icon} />
            {text && (
              <span className="text-nowrap text-sm font-medium">{text}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}
