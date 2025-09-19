export declare function useTauriWindowControls(): {
    isDesktop: boolean;
    isMaximized: boolean;
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
};
export declare function minimizeCurrentWindow(): Promise<void>;
export declare function toggleMaximizeCurrentWindow(): Promise<void>;
export declare function closeCurrentWindow(): Promise<void>;
export declare function isCurrentWindowMaximized(): Promise<boolean>;
//# sourceMappingURL=useWindowControls.d.ts.map