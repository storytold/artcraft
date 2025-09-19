import { ReactNode } from 'react';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
declare global {
    interface Window {
        __modalEscListenerInstalled?: boolean;
    }
}
interface ExpandButtonProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}
export declare const Modal: {
    ({ isOpen, title, titleIcon, onTitleIconClick, onClose, enableHotkeyInput, disableHotkeyInput, className, backdropClassName, width, children, childPadding, titleIconClassName, showClose, draggable, resizable, initialPosition, closeOnOutsideClick, closeOnEsc, allowBackgroundInteraction, expandable, accessibleTitle, accessibleDescription, }: {
        isOpen: boolean;
        title?: ReactNode;
        titleIcon?: IconDefinition;
        onTitleIconClick?: () => void;
        titleIconClassName?: string;
        onClose: () => void;
        className?: string;
        backdropClassName?: string;
        width?: number;
        children: ReactNode;
        childPadding?: boolean;
        showClose?: boolean;
        draggable?: boolean;
        resizable?: boolean;
        disableHotkeyInput?: (level: number) => void;
        enableHotkeyInput?: (level: number) => void;
        initialPosition?: {
            x: number;
            y: number;
        };
        closeOnOutsideClick?: boolean;
        closeOnEsc?: boolean;
        allowBackgroundInteraction?: boolean;
        expandable?: boolean;
        accessibleTitle?: string;
        accessibleDescription?: string;
    }): import("react/jsx-runtime").JSX.Element;
    DragHandle: ({ children }: {
        children: ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    ExpandButton: {
        ({ className, size }: ExpandButtonProps): import("react/jsx-runtime").JSX.Element | null;
        displayName: string;
    };
};
export {};
//# sourceMappingURL=modal.d.ts.map