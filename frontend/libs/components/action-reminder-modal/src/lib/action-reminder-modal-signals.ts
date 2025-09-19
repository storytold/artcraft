// frontend/apps/editor3d/app/src/signals/actionReminderSignals.ts
import { signal } from "@preact/signals-react";
import { ReactNode } from "react";
import { ReminderType } from "@storyteller/ui-action-reminder-modal";
import { IconDefinition } from "@fortawesome/pro-solid-svg-icons";

export interface ShowActionReminderOptions {
  reminderType: ReminderType;
  onPrimaryAction: () => void;
  title?: string;
  message?: ReactNode;
  primaryActionText?: string;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  isLoading?: boolean;
  openAiLogo?: string;
  primaryActionIcon?: IconDefinition;
  primaryActionBtnClassName?: string;
}

interface ActionReminderModalFullProps extends ShowActionReminderOptions {
  onClose: () => void;
}

export const isActionReminderOpen = signal(false);
export const actionReminderProps = signal<ActionReminderModalFullProps | null>(
  null
);

export function showActionReminder(options: ShowActionReminderOptions): void {
  actionReminderProps.value = {
    ...options,
    onClose: () => {
      isActionReminderOpen.value = false;
    },
  };
  isActionReminderOpen.value = true;
}

// Example of how to trigger it - BFlat:
// import { showGlobalActionReminder } from "@storyteller/ui-action-reminder-modal";
// import openAiLogo from 'path/to/logo.svg';
//
// function someAction() {
//   showActionReminder({
//     reminderType: 'soraLogin',
//     onPrimaryAction: () => console.log('Login with Sora!'),
//     openAiLogo: openAiLogo,
//     title: 'Sora Login Needed'
//   });
// }
