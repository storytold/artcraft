import { Button } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import { ReactNode } from "react";
import { faRightToBracket } from "@fortawesome/pro-solid-svg-icons";
import { IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

export type ReminderType = "default" | "soraLogin" | "artcraftLogin";

interface ActionReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderType?: ReminderType;
  onPrimaryAction: () => void;
  title?: string;
  hideTitle?: boolean;
  message?: ReactNode;
  children?: ReactNode;
  primaryActionText?: string;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  isLoading?: boolean;
  openAiLogo?: string;
  modalClassName?: string;
  primaryActionIcon?: IconDefinition;
  primaryActionBtnClassName?: string;
}

export function ActionReminderModal({
  isOpen,
  onClose,
  reminderType = "default",
  onPrimaryAction,
  title: customTitle,
  hideTitle = false,
  message: customMessage,
  children: customChildren,
  primaryActionText: customPrimaryActionText,
  secondaryActionText: customSecondaryActionText,
  onSecondaryAction,
  isLoading = false,
  modalClassName: customModalClassName = "",
  primaryActionIcon: customPrimaryActionIcon = faRightToBracket,
  primaryActionBtnClassName: customPrimaryActionBtnClassName = "",
}: ActionReminderModalProps) {
  let titleText: string | undefined;
  let messageContent: ReactNode;
  let primaryActionBtnText: string;
  let primaryActionIcon = faRightToBracket;
  let primaryActionBtnClassName = "";

  if (!hideTitle) {
    switch (reminderType) {
      case "soraLogin":
        titleText = customTitle || "Link Your OpenAI Sora Account";
        break;
      case "artcraftLogin":
        titleText = customTitle || "Login to ArtCraft";
        break;
      default:
        titleText = customTitle || "Action Required";
        break;
    }
  } else {
    titleText = undefined;
  }

  switch (reminderType) {
    case "soraLogin":
      titleText = customTitle || "Link Your OpenAI Account";
      messageContent = customMessage || (
        <p>
          To use this feature, please connect your OpenAI account. This allows
          us to leverage your existing subscription.
        </p>
      );
      primaryActionBtnText = customPrimaryActionText || "Login with OpenAI";
      primaryActionIcon = customPrimaryActionIcon || faRightToBracket;
      primaryActionBtnClassName = customPrimaryActionBtnClassName || "";
      break;
    case "artcraftLogin":
      messageContent = customMessage || (
        <p className="text-sm text-white/70">
          Please log in or sign up to ArtCraft to proceed. This will allow you
          to save your work and access all features.
        </p>
      );
      primaryActionBtnText = customPrimaryActionText || "Login / Sign Up";
      primaryActionIcon = customPrimaryActionIcon || faRightToBracket;
      primaryActionBtnClassName = customPrimaryActionBtnClassName || "";
      break;
    default:
      messageContent = customMessage || (
        <p className="text-sm text-white/70">
          Please complete the required action.
        </p>
      );
      primaryActionBtnText = customPrimaryActionText || "Proceed";
      primaryActionIcon = customPrimaryActionIcon || faRightToBracket;
      primaryActionBtnClassName = customPrimaryActionBtnClassName || "";
      break;
  }

  const effectiveSecondaryAction = onSecondaryAction || onClose;
  const effectiveSecondaryActionText = customSecondaryActionText || "Cancel";

  let modalSpecificClasses = "";

  const finalModalClassName =
    `${customModalClassName} ${modalSpecificClasses}`.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleText}
      className={finalModalClassName}
    >
      <div>
        {customChildren ? (
          <div className="space-y-4">{customChildren}</div>
        ) : (
          <div className="space-y-4">{messageContent}</div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <Button
            onClick={onPrimaryAction}
            loading={isLoading}
            disabled={isLoading}
            icon={primaryActionIcon}
            className={twMerge("w-full sm:w-auto", primaryActionBtnClassName)}
          >
            {primaryActionBtnText}
          </Button>
          {(onSecondaryAction || customSecondaryActionText) && (
            <Button
              variant="secondary"
              onClick={effectiveSecondaryAction}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {effectiveSecondaryActionText}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ActionReminderModal;
