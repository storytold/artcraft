import { ReactNode } from 'react';
interface SliderProps {
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    step: number;
    className?: string;
    showTooltip?: boolean;
    tooltipContent?: ReactNode;
    suffix?: string;
    innerLabel?: string;
    showDecrement?: boolean;
    showIncrement?: boolean;
    variant?: "filled" | "classic";
    showProgressBar?: boolean;
}
export declare const SliderV2: ({ min, max, value, onChange, step, className, showTooltip, tooltipContent, suffix, innerLabel, showDecrement, showIncrement, variant, showProgressBar, }: SliderProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=slider-v2.d.ts.map