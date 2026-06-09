import { useSignals } from "@preact/signals-react/runtime";
import {
  ActionReminderModal,
  isActionReminderOpen,
  actionReminderProps,
} from "@storyteller/ui-action-reminder-modal";

/**
 * Global host for `showActionReminder()` (the signal-driven confirm dialog used
 * by shared components like the gallery tiles). Mounted once at the app root so
 * any caller can pop a confirm without wiring its own modal.
 */
export function GlobalActionReminder() {
  useSignals();
  const props = actionReminderProps.value;
  if (!props) return null;
  return (
    <ActionReminderModal
      isOpen={isActionReminderOpen.value}
      onClose={props.onClose}
      reminderType={props.reminderType}
      onPrimaryAction={props.onPrimaryAction}
      title={props.title}
      message={props.message}
      primaryActionText={props.primaryActionText}
      secondaryActionText={props.secondaryActionText}
      onSecondaryAction={props.onSecondaryAction}
      isLoading={props.isLoading}
      openAiLogo={props.openAiLogo}
      primaryActionIcon={props.primaryActionIcon}
      primaryActionBtnClassName={props.primaryActionBtnClassName}
    />
  );
}
