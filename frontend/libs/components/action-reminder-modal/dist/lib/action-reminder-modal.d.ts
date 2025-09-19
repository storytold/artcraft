import { ReactNode } from 'react';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
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
export declare function ActionReminderModal({ isOpen, onClose, reminderType, onPrimaryAction, title: customTitle, hideTitle, message: customMessage, children: customChildren, primaryActionText: customPrimaryActionText, secondaryActionText: customSecondaryActionText, onSecondaryAction, isLoading, modalClassName: customModalClassName, primaryActionIcon: customPrimaryActionIcon, primaryActionBtnClassName: customPrimaryActionBtnClassName, }: ActionReminderModalProps): import("react/jsx-runtime").JSX.Element;
export default ActionReminderModal;
//# sourceMappingURL=action-reminder-modal.d.ts.map