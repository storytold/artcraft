import { Fragment } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Menu, Transition } from "@headlessui/react";
import { Gravatar } from "@storyteller/ui-gravatar";
import { twMerge } from "tailwind-merge";
import { authentication, logout } from "~/signals";

export default function ProfileDropdown() {
  useSignals();
  const { userInfo } = authentication;

  if (!userInfo.value) {
    return null;
  }
  const username = userInfo.value.core_info.username;
  const emailHash = userInfo.value.core_info.gravatar_hash;
  const profileUrl = `https://storyteller.ai/profile/${userInfo.value.core_info.display_name}`;
  const avatarIndex = userInfo.value.core_info.default_avatar.image_index;
  const backgroundColorIndex =
    userInfo.value.core_info.default_avatar.color_index;

  const options = [
    {
      label: "Logout",
      icon: LogOutIcon,
      onClick: () => {
        logout();
      },
    },
  ];

  return (
    <Menu as="div" className="relative">
      <Menu.Button as="div">
        <div className="group flex cursor-pointer items-center gap-1.5 transition-opacity duration-150 hover:opacity-90">
          <Gravatar
            size={34}
            username={username}
            email_hash={emailHash}
            avatarIndex={avatarIndex}
            backgroundIndex={backgroundColorIndex}
          />
          <ChevronDownIcon />
        </div>
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
          className="absolute right-[-5px] mt-2.5 w-36 overflow-hidden rounded-lg bg-brand-secondary shadow-lg focus:outline-none"
        >
          <Menu.Item key={0}>
            {({ active }) => (
              <a
                className={twMerge(
                  "duration-50 group flex w-full items-center gap-2 bg-action/60 px-3 py-[10px] text-start text-sm font-medium text-white transition-all",
                  active && "bg-action-500/80",
                )}
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
              >
                <UserIcon />
                My Profile
              </a>
            )}
          </Menu.Item>
          {options.map((option, index) => (
            <Menu.Item key={index + 1}>
              {({ active }) => (
                <button
                  className={twMerge(
                    "duration-50 group flex w-full items-center gap-2 bg-action/60 px-3 py-[10px] text-start text-sm font-medium text-white transition-all",
                    active && "bg-action-500/80",
                  )}
                  onClick={() => option.onClick()}
                >
                  <DynamicIcon icon={option.icon} />
                  {option.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
