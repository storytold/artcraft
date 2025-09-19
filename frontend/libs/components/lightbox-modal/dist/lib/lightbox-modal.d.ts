import { default as React } from 'react';
interface LightboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCloseGallery: () => void;
    imageUrl?: string | null;
    imageAlt?: string;
    onImageError?: () => void;
    title?: string;
    createdAt?: string;
    additionalInfo?: React.ReactNode;
    downloadUrl?: string;
    mediaId?: string;
    onDownloadClicked?: (url: string, mediaClass?: string) => Promise<void>;
    onAddToSceneClicked?: (url: string, media_id: string | undefined) => Promise<void>;
    mediaClass?: string;
    onPromptCopy?: (prompt: string) => void;
    onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
}
export declare function LightboxModal({ isOpen, onClose, onCloseGallery, imageUrl, imageAlt, onImageError, title, createdAt, additionalInfo, downloadUrl, // cdn url of the image
mediaId, // media id of the image
onDownloadClicked, onAddToSceneClicked, mediaClass, onEditClicked, }: LightboxModalProps): import("react/jsx-runtime").JSX.Element;
export default LightboxModal;
//# sourceMappingURL=lightbox-modal.d.ts.map