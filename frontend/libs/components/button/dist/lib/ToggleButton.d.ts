import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
interface ToggleButtonProps {
    isActive: boolean;
    icon?: IconDefinition;
    activeIcon?: IconDefinition;
    onClick: () => void;
    className?: string;
}
export declare const ToggleButton: ({ isActive, icon, activeIcon, onClick, className, }: ToggleButtonProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ToggleButton.d.ts.map