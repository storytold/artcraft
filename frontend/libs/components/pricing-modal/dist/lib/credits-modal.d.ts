interface CreditPack {
    id: string;
    total: number;
    base: number;
    bonus: number;
    priceUsd: number;
    badge?: string;
    priceId?: string;
}
interface CreditsModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    onPurchase?: (pack: CreditPack) => void;
}
export declare function CreditsModal({ isOpen, onClose, onPurchase, }: CreditsModalProps): import("react/jsx-runtime").JSX.Element;
export default CreditsModal;
//# sourceMappingURL=credits-modal.d.ts.map