interface LoginModalProps {
    onClose?: () => void;
    videoSrc2D?: string;
    videoSrc3D?: string;
    onOpenChange?: (isOpen: boolean) => void;
    onArtCraftAuthSuccess?: (userInfo: any) => void;
    isSignUp?: boolean;
}
export declare function LoginModal({ onClose, videoSrc2D, videoSrc3D, onOpenChange, onArtCraftAuthSuccess, isSignUp: initialIsSignUp, }: LoginModalProps): import("react/jsx-runtime").JSX.Element;
export default LoginModal;
//# sourceMappingURL=login-modal.d.ts.map