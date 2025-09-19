interface LoadingBarProps {
    id?: string;
    wrapperClassName?: string;
    innerWrapperClassName?: string;
    progressBackgroundClassName?: string;
    progressClassName?: string;
    variant?: string;
    show?: boolean;
    hasSpinner?: boolean;
    progressData: {
        progress: number;
        label?: string;
        message?: string;
    };
}
export declare const LoadingBar: ({ wrapperClassName: propsWrapperClassName, innerWrapperClassName: propsInnerWrapperClassName, progressBackgroundClassName: propsProgressBackgroundClassName, progressClassName: propsProgressClassName, progressData, hasSpinner, variant, show, ...rest }: LoadingBarProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LoadingBar.d.ts.map