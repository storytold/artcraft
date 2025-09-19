export type SelectValue = string | number;
export type SelectOption = {
    label: string;
    value: SelectValue;
};
interface ListDropdownProps {
    options: SelectOption[];
    onChange: (val: SelectValue) => void;
    placeholder?: string;
    value?: SelectValue;
    id?: string;
    className?: string;
}
export declare const Select: ({ onChange, options, placeholder, value, id, className, }: ListDropdownProps) => import("react/jsx-runtime").JSX.Element;
export default Select;
//# sourceMappingURL=select.d.ts.map