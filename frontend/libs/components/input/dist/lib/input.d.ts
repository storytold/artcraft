import { default as React } from 'react';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    inputClassName?: string;
    iconClassName?: string;
    label?: string;
    icon?: IconDefinition;
    isError?: boolean;
    errorMessage?: string;
}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
export default Input;
//# sourceMappingURL=input.d.ts.map