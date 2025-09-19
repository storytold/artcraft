import { useState, useEffect } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { Tooltip } from "@storyteller/ui-tooltip";

interface Option {
  value: string;
  icon: IconDefinition;
  text?: string;
  tooltip?: string;
}

interface ButtonIconSelectProps {
  options: Option[];
  onOptionChange?: (value: string) => void;
  selectedOption?: string;
}

export function ButtonIconSelect({
  options,
  onOptionChange,
  selectedOption,
}: ButtonIconSelectProps) {
  const [internalSelectedOption, setInternalSelectedOption] = useState<string>(
    selectedOption || options[0].value
  );

  useEffect(() => {
    setInternalSelectedOption(selectedOption || options[0].value);
  }, [selectedOption, options]);

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
                  : "border-transparent hover:bg-ui-panel/[0.4]"
              )}
              onClick={() => handleOptionChange(value)}
            >
              <FontAwesomeIcon icon={icon} />
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
                : "border-transparent hover:bg-ui-panel/[0.4]"
            )}
            onClick={() => handleOptionChange(value)}
          >
            <FontAwesomeIcon icon={icon} />
            {text && (
              <span className="text-nowrap text-sm font-medium">{text}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}
