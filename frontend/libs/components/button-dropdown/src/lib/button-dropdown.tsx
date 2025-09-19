import { ButtonHTMLAttributes, Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  IconDefinition,
  faChevronDown,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "@storyteller/ui-modal";
import { Button, ButtonProps } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";

type UnionedButtonProps = { label?: string } & ButtonProps;

interface ButtonDropdownProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: IconDefinition;
  align?: "left" | "right";
  showSelected?: boolean;
  options: Array<{
    label: string;
    className?: string;
    icon?: IconDefinition;
    selected?: boolean;
    description?: string;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
    onDialogOpen?: () => void;
    dialogProps?: {
      title: string;
      content: React.ReactNode;
      className?: string;
      confirmButtonProps?: UnionedButtonProps;
      closeButtonProps?: UnionedButtonProps;
      showClose?: boolean;
      onClose?: () => void;
    };
  }>;
}

export const ButtonDropdown = ({
  className,
  label,
  options,
  icon,
  align = "left",
  showSelected,
}: ButtonDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );

  const closeModal = () => {
    setIsOpen(false);
    options[selectedOptionIndex!].dialogProps?.onClose?.();
  };

  const handleOptionClick = (index: number) => {
    const option = options[index];
    if (option.onClick) {
      option.onClick();
    }
    if (option.onDialogOpen) {
      option.onDialogOpen();
    }
    if (option.dialogProps) {
      setSelectedOptionIndex(index);
      setIsOpen(true);
    }
  };

  const currentDialogProps =
    selectedOptionIndex !== null
      ? options[selectedOptionIndex].dialogProps
      : null;

  return (
    <div className="relative">
      <Menu as="div" className="inline-block text-left">
        <Menu.Button as="div">
          <Button
            className={className}
            icon={faChevronDown}
            iconFlip={true}
            variant="secondary"
          >
            {icon ? <FontAwesomeIcon icon={icon} /> : null}
            {label}
          </Button>
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items
            static
            className={twMerge(
              "absolute z-20 mt-1 w-max divide-y divide-gray-100 overflow-hidden rounded-lg bg-brand-secondary py-1.5 shadow-xl focus:outline-none",
              align === "left" ? "left-0" : "right-0"
            )}
          >
            <div>
              {options.map((option, index) => (
                <Fragment key={index}>
                  {option.divider && (
                    <div className="my-1.5 border-t border-ui-divider" />
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        disabled={option.disabled}
                        className={twMerge(
                          "duration-50 bg-brand-secondary font-medium text-white transition-all",
                          active ? "bg-brand-secondary-800" : "",
                          option.disabled
                            ? "pointer-events-none opacity-40"
                            : "",
                          "group flex w-full items-center py-1.5 pl-7 pr-4 text-sm",
                          option.className
                        )}
                        onClick={() => handleOptionClick(index)}
                      >
                        <div className="flex w-full items-center">
                          {option.icon && (
                            <FontAwesomeIcon
                              icon={option.icon}
                              className="mr-2"
                            />
                          )}
                          <div className="grow text-start">{option.label}</div>
                          <div className="ml-10 font-normal text-white/75">
                            {option.description && option.description}
                          </div>
                          {showSelected && (
                            <>
                              {option.selected ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512 512"
                                  className="ml-3 flex h-5"
                                >
                                  <path
                                    opacity="1"
                                    d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
                                    fill="#FC6B68"
                                  />
                                  <path
                                    d="M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z"
                                    fill="#FFFFFF"
                                  />
                                </svg>
                              ) : (
                                <div className="w-8" />
                              )}
                            </>
                          )}
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                </Fragment>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {currentDialogProps && (
        <Modal
          title={currentDialogProps.title}
          isOpen={isOpen}
          onClose={closeModal}
          className={currentDialogProps.className}
        >
          {currentDialogProps.content}

          <div className="mt-6 flex justify-end gap-2">
            {currentDialogProps.showClose !== false &&
              currentDialogProps.closeButtonProps && (
                <Button
                  variant="secondary"
                  {...currentDialogProps.closeButtonProps}
                  onClick={closeModal}
                >
                  {currentDialogProps.closeButtonProps.label}
                </Button>
              )}

            {currentDialogProps.confirmButtonProps && (
              <Button
                {...currentDialogProps.confirmButtonProps}
                onClick={(e) => {
                  if (currentDialogProps.confirmButtonProps?.onClick) {
                    currentDialogProps.confirmButtonProps?.onClick(e);
                  }
                  closeModal();
                }}
              >
                {currentDialogProps.confirmButtonProps.label || "Confirm"}
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
