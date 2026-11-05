import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";
import { toast } from "@storyteller/ui-toaster";

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
    onPrimaryAction: () => runAction(onMove, "move"),
    secondaryActionText: "Add a copy",
    onSecondaryAction: () => runAction(onAdd, "copy"),
  });
}

// BUG FIX: try/finally alone re-threw a failed move/copy as an unhandled
// promise rejection (the modal's click handler never awaits it), so the user
// saw the dialog just vanish with no hint that nothing was moved.
async function runAction(
  action: () => void | Promise<void>,
  verb: string,
): Promise<void> {
  try {
    await action();
  } catch (err) {
    toast.error(
      `Failed to ${verb} items: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    isActionReminderOpen.value = false;
  }
}
