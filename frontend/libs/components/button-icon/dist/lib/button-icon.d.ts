import { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
interface ButtonIconProps extends FontAwesomeIconProps {
    icon: IconDefinition;
    onClick: () => void;
    className?: string;
    bgFill?: boolean;
    disabled?: boolean;
}
export declare const ButtonIcon: ({ icon, size, onClick, className: propsClassName, bgFill, disabled, ...rest }: ButtonIconProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=button-icon.d.ts.map