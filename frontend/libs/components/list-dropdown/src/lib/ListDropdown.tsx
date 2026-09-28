import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

interface ListDropdownProps {
  list: { [key: string]: string }[];
  onSelect: (val: string) => void;
}
export const ListDropdown = ({ list, onSelect }: ListDropdownProps) => {
  const [selected, setSelected] = useState(list[0]);

  useEffect(() => {
    onSelect(Object.values(selected)[0]);
  }, [selected]);

  return (
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative mt-1">
        <Listbox.Button className="relative h-10 w-full cursor-pointer rounded-[3px] border border-ui-controls-border bg-ui-controls py-2 pl-3 pr-10 text-left text-base-fg outline-none outline-offset-0 transition-colors duration-150 ease-in-out hover:border-white/40 focus:!outline-none sm:text-sm">
          <span className="block truncate">{Object.keys(selected)[0]}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon  aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-[3px] border border-ui-panel-border bg-ui-panel text-base focus:outline-none sm:text-sm">
            {list.map((item, itemIdx) => (
              <Listbox.Option
                key={itemIdx}
                className={({ active, selected }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors duration-150 ${
                    active
                      ? "bg-white text-black"
                      : selected
                        ? "bg-white/10 text-base-fg"
                        : "text-base-fg/90"
                  }`
                }
                value={item}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${selected ? "font-medium" : "font-normal"
                        }`}
                    >
                      {Object.values(item)[0]}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <CheckIcon  aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};
