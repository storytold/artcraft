interface LoadingDotsProps {
    className?: string;
    isShowing?: boolean;
}
interface LoadingDotsInnerProps {
    className?: string;
    isShowing?: boolean;
    type?: "typing" | "bricks";
    message?: string;
}
export declare const LoadingDotsTyping: (props: LoadingDotsProps) => import("react/jsx-runtime").JSX.Element;
export declare const LoadingDotsBricks: (props: LoadingDotsProps) => import("react/jsx-runtime").JSX.Element;
export declare function LoadingDots({ className, isShowing, type, message, }: LoadingDotsInnerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LoadingDots.d.ts.map