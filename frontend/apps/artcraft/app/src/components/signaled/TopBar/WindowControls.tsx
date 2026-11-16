import {
  MinusIcon,
  PictureInPicture2Icon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import {
  useTauriPlatform,
  useTauriWindowControls,
} from "@storyteller/tauri-utils";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";

const BUTTON_CLASS_NAME =
  "h-[32px] w-[44px] rounded-none border-0 bg-transparent p-0 text-base-fg opacity-70 shadow-none hover:bg-white/10 hover:opacity-100";

// Minimize / maximize / close buttons for the frameless desktop window. The
// main window is built with `decorations(false)` on Windows (see
// `setup_main_window.rs`), so these are the only window controls the user has.
// macOS keeps its native traffic lights, so nothing renders there, and nothing
// renders in a plain browser.
//
// Rendered by the TopBar, and again by the login overlay, which sits above the
// TopBar and would otherwise leave the window stuck until the user signs in.
export const WindowControls = () => {
  const { isDesktop, isMaximized, minimize, toggleMaximize, close } =
    useTauriWindowControls();
  const platform = useTauriPlatform();

  if (!isDesktop || platform === "macos") {
    return null;
  }

  return (
    <div className="no-drag flex items-center">
      <Button
        variant="secondary"
        aria-label="Minimize window"
        className={BUTTON_CLASS_NAME}
        onClick={minimize}
      >
        <MinusIcon className="text-xs" />
      </Button>
      <Button
        variant="secondary"
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
        className={BUTTON_CLASS_NAME}
        onClick={toggleMaximize}
      >
        <DynamicIcon
          icon={isMaximized ? PictureInPicture2Icon : SquareIcon}
          className="text-xs"
        />
      </Button>
      <Button
        variant="secondary"
        aria-label="Close window"
        className={twMerge(BUTTON_CLASS_NAME, "hover:bg-red hover:text-white")}
        onClick={close}
      >
        <XIcon className="text-lg" />
      </Button>
    </div>
  );
};
