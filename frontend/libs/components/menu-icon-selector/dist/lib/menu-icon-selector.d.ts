import { default as React } from 'react';
export interface MenuIconItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    imageSrc?: string;
    description?: string;
    large?: boolean;
}
interface MenuIconSelectorProps {
    menuItems: MenuIconItem[];
    activeMenu: string;
    onMenuChange: (menuId: string) => void;
    className?: string;
    disabled?: boolean;
    disabledMessage?: string;
}
export declare const MenuIconSelector: React.FC<MenuIconSelectorProps>;
export default MenuIconSelector;
//# sourceMappingURL=menu-icon-selector.d.ts.map