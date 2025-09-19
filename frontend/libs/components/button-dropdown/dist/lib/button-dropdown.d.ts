import { ButtonHTMLAttributes } from 'react';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { ButtonProps } from '@storyteller/ui-button';
type UnionedButtonProps = {
    label?: string;
} & ButtonProps;
interface ButtonDropdownProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    icon?: IconDefinition;
    align?: "left" | "right";
    showSelected?: boolean;
    options: Array<{
        label: string;
        className?: string;
        icon?: IconDefinition;
        selected?: boolean;
        description?: string;
        onClick?: () => void;
        disabled?: boolean;
        divider?: boolean;
        onDialogOpen?: () => void;
        dialogProps?: {
            title: string;
            content: React.ReactNode;
            className?: string;
            confirmButtonProps?: UnionedButtonProps;
            closeButtonProps?: UnionedButtonProps;
            showClose?: boolean;
            onClose?: () => void;
        };
    }>;
}
export declare const ButtonDropdown: ({ className, label, options, icon, align, showSelected, }: ButtonDropdownProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=button-dropdown.d.ts.map