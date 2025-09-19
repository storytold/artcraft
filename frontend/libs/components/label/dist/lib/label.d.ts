import { LabelHTMLAttributes, ReactNode } from 'react';
interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    className?: string;
    children: ReactNode;
    required?: boolean;
}
export declare const Label: ({ className, children, required, ...rest }: LabelProps) => import("react/jsx-runtime").JSX.Element;
export default Label;
//# sourceMappingURL=label.d.ts.map