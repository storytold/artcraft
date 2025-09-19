import { default as React } from 'react';
interface TooltipProps {
    children: React.ReactElement;
    content: React.ReactNode;
    position: "top" | "bottom" | "left" | "right";
    className?: string;
    delay?: number;
    closeOnClick?: boolean;
    imageSrc?: string;
    description?: string;
    /**
     * When true, the tooltip can be hovered and clicked without closing
     * immediately when the cursor leaves the trigger. Useful for menus.
     */
    interactive?: boolean;
}
export declare const Tooltip: ({ children, content, position, className, delay, closeOnClick, imageSrc, description, interactive, }: TooltipProps) => import("react/jsx-runtime").JSX.Element;
export default Tooltip;
//# sourceMappingURL=tooltip.d.ts.map