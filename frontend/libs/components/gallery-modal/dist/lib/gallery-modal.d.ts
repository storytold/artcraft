import { default as React } from 'react';
export interface GalleryItem {
    id: string;
    label: string;
    thumbnail: string | null;
    fullImage?: string | null;
    createdAt: string;
    mediaClass?: string;
    assetType?: string;
}
type ModalMode = "select" | "view";
interface GalleryModalProps {
    onClose?: () => void;
    mode: ModalMode;
    selectedItemIds?: string[];
    onSelectItem?: (id: string) => void;
    maxSelections?: number;
    onUseSelected?: (selectedItems: GalleryItem[]) => void;
    onDownloadClicked?: (url: string, mediaClass?: string) => Promise<void>;
    onAddToSceneClicked?: (url: string, media_id: string | undefined) => Promise<void>;
    isOpen?: boolean;
    forceFilter?: string;
    onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
}
export declare const GalleryModal: React.MemoExoticComponent<({ onClose, mode, selectedItemIds, onSelectItem, maxSelections, onUseSelected, onDownloadClicked, onAddToSceneClicked, isOpen, forceFilter, onEditClicked, }: GalleryModalProps) => import("react/jsx-runtime").JSX.Element>;
export default GalleryModal;
//# sourceMappingURL=gallery-modal.d.ts.map