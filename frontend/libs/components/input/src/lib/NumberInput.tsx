import React, { useEffect, useState } from "react";
import { Input } from "./input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState<string>(value.toString());

  useEffect(() => {
    setInputValue(Math.round(value * 100) / 100 + "");
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (
      newValue === "" ||
      (!isNaN(Number(newValue)) && Number(newValue) <= 100)
    ) {
      setInputValue(newValue);
      const numericValue = parseFloat(newValue);
      if (newValue !== "") {
        onChange(Math.round(numericValue * 100) / 100);
      }
    }
  };

  const handleBlur = () => {
    if (inputValue === "") {
      setInputValue(Math.round(value * 100) / 100 + "");
    }
  };

  const handleIncrement = () => {
    const newValue = Math.min(Number(inputValue) + 1, 100);
    setInputValue(Math.round(newValue * 100) / 100 + "");
    onChange(Math.round(newValue * 100) / 100);
  };

  const handleDecrement = () => {
    const newValue = Math.max(Number(inputValue) - 1, 0);
    setInputValue(Math.round(newValue * 100) / 100 + "");
    onChange(Math.round(newValue * 100) / 100);
  };

  const incrementButtonStyle =
    "flex h-[15px] w-6 items-center justify-center text-[10px] text-white/80 bg-ui-controls hover:bg-ui-controls-button outline-none focus:outline-none transition-all active:outline-none";

  return (
    <div className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        inputClassName="w-[70px] h-[30px] rounded-md text-sm"
      />

      <div className="absolute right-0 top-0 flex h-[30px] flex-col rounded-r-md border-l border-white/15 bg-gray-800">
        <button
          className={twMerge(
            incrementButtonStyle,
            "rounded-tr-md border-b border-white/10",
          )}
          onClick={handleIncrement}
        >
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
        <button
          className={twMerge(incrementButtonStyle, "rounded-br-md")}
          onClick={handleDecrement}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </div>
    </div>
  );
};
