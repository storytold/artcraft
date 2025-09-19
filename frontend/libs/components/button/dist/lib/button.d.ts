import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ButtonHTMLAttributes } from 'react';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: IconDefinition;
    iconClassName?: string;
    iconFlip?: boolean;
    htmlFor?: string;
    variant?: "primary" | "secondary" | "action" | "destructive" | "ghost";
    loading?: boolean;
    as?: "button" | "link";
    href?: string;
    target?: string;
}
export declare const Button: ({ icon, iconClassName, children, className: propsClassName, htmlFor, variant: propsVariant, disabled, iconFlip, loading, as, href, target, ...rest }: ButtonProps) => import("react/jsx-runtime").JSX.Element;
export default Button;
//# sourceMappingURL=button.d.ts.map