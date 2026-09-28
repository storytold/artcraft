import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
export type SelectValue = string | number;
export type SelectOption = { label: string; value: SelectValue };

interface ListDropdownProps {
  options: SelectOption[];
  onChange: (val: SelectValue) => void;
  placeholder?: string;
  value?: SelectValue;
  id?: string;
  className?: string;
}

export const Select = ({
  onChange,
  options,
  placeholder,
  value,
  id,
  className,
}: ListDropdownProps) => {
  const selectedOption = options.find(
    (option: SelectOption) => option.value === value,
  ) || { label: placeholder || "", value: "" };

  return (
    <div className={twMerge("relative", className)}>
      <Listbox value={value || ""} onChange={onChange}>
        {({ open }) => (
          <>
            <ListboxButton
              id={id}
              className="relative h-10 w-full cursor-pointer rounded-[3px] bg-ui-controls text-base-fg border border-ui-controls-border py-2 pl-3 pr-10 text-left outline-none outline-offset-0 transition-colors duration-150 ease-in-out sm:text-sm focus:!outline-none hover:border-white/40"
            >
              <span
                className={twMerge("block truncate", !value && "opacity-50")}
              >
                {selectedOption.label}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                <ChevronDownIcon aria-hidden="true" />
              </span>
            </ListboxButton>

            <Transition
              as="div"
              show={open}
              leave="transition ease-in duration-[50ms]"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-[3px] bg-ui-panel border border-ui-panel-border text-base focus:outline-none sm:text-sm">
                {options.map((option, itemIdx) => (
                  <ListboxOption
                    key={itemIdx}
                    className={({ focus, selected }) =>
                      twMerge(
                        "relative cursor-pointer select-none py-2 pl-7 pr-2 transition-colors duration-150 ease-in-out",
                        !selected ? "text-base-fg/90" : "text-base-fg",
                        selected && "bg-white/10",
                        focus && "bg-white text-black",
                      )
                    }
                    value={option.value}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {option.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5">
                            <CheckIcon aria-hidden="true" className="text-xs" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </>
        )}
      </Listbox>
    </div>
  );
};

export default Select;
