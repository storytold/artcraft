import { i18n } from "@storyteller/i18n";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";

export interface FolderDropPromptOptions {
  count: number;
  targetFolderName?: string;
  onMove: () => void | Promise<void>;
  onAdd: () => void | Promise<void>;
}

/**
 * Ask whether to move items into a folder or add a copy. Used when the items
 * come from another folder (folder → folder). "Move here" removes them from the
 * source; "Add a copy" keeps them in both; the X / backdrop cancels.
 */
export function promptFolderDrop({
  count,
  targetFolderName,
  onMove,
  onAdd,
}: FolderDropPromptOptions): void {
  const tr = i18n.t.bind(i18n);
  showActionReminder({
    reminderType: "default",
    title: tr("libraryMoveOrCopy", { count }),
    message: (
      <p className="text-sm text-white/70">
        {targetFolderName
          ? tr("Moving to “{{folder}}” removes the selected items from the current folder. Adding a copy keeps them in both folders.", { folder: targetFolderName })
          : tr("Moving removes the selected items from the current folder. Adding a copy keeps them in both folders.")}
      </p>
    ),
    primaryActionText: tr("Move here"),
    onPrimaryAction: async () => {
      try {
        await onMove();
      } finally {
        isActionReminderOpen.value = false;
      }
    },
    secondaryActionText: tr("Add a copy"),
    onSecondaryAction: async () => {
      try {
        await onAdd();
      } finally {
        isActionReminderOpen.value = false;
      }
    },
  });
}
