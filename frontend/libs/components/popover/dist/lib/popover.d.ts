import { ReactNode } from 'react';
import { Model, ModelInfo } from '@storyteller/model-list';
export interface PopoverItem {
    label: string;
    selected: boolean;
    icon?: ReactNode;
    action?: string;
    disabled?: boolean;
    divider?: boolean;
    description?: string;
    badges?: Array<{
        label: string;
        icon?: ReactNode;
    }>;
    modelInfo?: ModelInfo;
    model?: Model;
}
interface PopoverMenuProps {
    items?: PopoverItem[];
    onSelect?: (item: PopoverItem) => void;
    onAdd?: () => void;
    triggerIcon?: ReactNode;
    showAddButton?: boolean;
    disableAddButton?: boolean;
    showIconsInList?: boolean;
    mode?: "default" | "toggle" | "button" | "hoverSelect";
    triggerLabel?: string | ReactNode;
    children?: ReactNode | ((close: () => void) => ReactNode);
    buttonClassName?: string;
    panelClassName?: string;
    onPanelAction?: (action: string) => void;
    panelTitle?: string;
    position?: "top" | "bottom";
    align?: "start" | "center" | "end";
    panelActionLabel?: string;
    onOpenChange?: (open: boolean) => void;
}
export declare const PopoverMenu: ({ items, onSelect, onAdd, triggerIcon, showAddButton, disableAddButton, showIconsInList, mode, triggerLabel, children, buttonClassName, panelClassName, onPanelAction, panelTitle, position, align, panelActionLabel, onOpenChange, }: PopoverMenuProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=popover.d.ts.map