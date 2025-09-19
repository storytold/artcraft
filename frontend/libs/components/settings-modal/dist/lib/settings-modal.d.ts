interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    globalAccountLogoutCallback: () => void;
    initialSection?: SettingsSection;
}
type SettingsSection = "general" | "appearance" | "accounts" | "alerts" | "about" | "provider_priority" | "billing";
export declare const SettingsModal: ({ isOpen, onClose, globalAccountLogoutCallback, initialSection, }: SettingsModalProps) => import("react/jsx-runtime").JSX.Element;
export default SettingsModal;
//# sourceMappingURL=settings-modal.d.ts.map