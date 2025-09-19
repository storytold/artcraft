import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
interface Option {
    value: string;
    icon: IconDefinition;
    text?: string;
    tooltip?: string;
}
interface ButtonIconSelectProps {
    options: Option[];
    onOptionChange?: (value: string) => void;
    selectedOption?: string;
}
export declare function ButtonIconSelect({ options, onOptionChange, selectedOption, }: ButtonIconSelectProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=button-icon-select.d.ts.map