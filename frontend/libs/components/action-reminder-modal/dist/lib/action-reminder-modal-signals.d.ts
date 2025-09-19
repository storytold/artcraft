import { ReactNode } from 'react';
import { ReminderType } from '@storyteller/ui-action-reminder-modal';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
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
export declare const isActionReminderOpen: import('@preact/signals-core').Signal<boolean>;
export declare const actionReminderProps: import('@preact/signals-core').Signal<ActionReminderModalFullProps | null>;
export declare function showActionReminder(options: ShowActionReminderOptions): void;
export {};
//# sourceMappingURL=action-reminder-modal-signals.d.ts.map