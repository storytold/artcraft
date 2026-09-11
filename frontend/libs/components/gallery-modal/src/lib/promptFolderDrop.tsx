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
  const plural = count === 1 ? "" : "s";
  const dest = targetFolderName ? ` to "${targetFolderName}"` : "";
  showActionReminder({
    reminderType: "default",
    title: `Move or copy ${count} item${plural}?`,
    message: (
      <p className="text-sm text-white/70">
        Move{dest} removes {count === 1 ? "it" : "them"} from the current folder.
        Add a copy keeps {count === 1 ? "it" : "them"} in both.
      </p>
    ),
    primaryActionText: "Move here",
    onPrimaryAction: async () => {
      try {
        await onMove();
      } finally {
        isActionReminderOpen.value = false;
      }
    },
    secondaryActionText: "Add a copy",
    onSecondaryAction: async () => {
      try {
        await onAdd();
      } finally {
        isActionReminderOpen.value = false;
      }
    },
  });
}
