import {
  faCircleXmark,
  faFilterList,
  faSearch,
} from "@fortawesome/pro-solid-svg-icons";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import debounce from "lodash/debounce";
import { useRef, useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface SearchFilterProps {
  onSearchChange: (value: string) => void;
  placeholder?: string;
  searchTerm?: string;
  showFilters?: boolean;
}

export const SearchFilter = ({
  onSearchChange,
  placeholder = "Search...",
  searchTerm = "",
  showFilters = false,
}: SearchFilterProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(searchTerm);
  const [hasText, setHasText] = useState(searchTerm.length > 0);

  useEffect(() => {
    setInputValue(searchTerm);
    setHasText(searchTerm.length > 0);
  }, [searchTerm]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedChangeHandler = useCallback(
    debounce((value: string) => {
      onSearchChange(value);
    }, 500),
    [],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setHasText(value.length > 0);
    debouncedChangeHandler(value);
  };

  const clearSearch = () => {
    setInputValue("");
    setHasText(false);
    onSearchChange("");
  };

  return (
    <div className="flex gap-2">
      <div className="relative grow">
        <Input
          ref={inputRef}
          icon={faSearch}
          iconClassName="opacity-50 pt-[11px] text-sm"
          inputClassName="h-9 rounded-lg text-sm pr-8 pl-9"
          placeholder={placeholder}
          className="grow"
          value={inputValue}
          onChange={handleInputChange}
        />
        {hasText && (
          <FontAwesomeIcon
            icon={faCircleXmark}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 transform cursor-pointer opacity-50 transition-all duration-100 hover:opacity-100"
            onClick={clearSearch}
          />
        )}
      </div>

      {showFilters && (
        <Tooltip position="top" content="Filters">
          <Button
            icon={faFilterList}
            variant="secondary"
            className="h-9 w-9"
            iconClassName="text-[16px]"
          ></Button>
        </Tooltip>
      )}
    </div>
  );
};
