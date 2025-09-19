import { RefImage } from './promptStore';
import { UploaderState } from '@storyteller/common';
export type UploadImageFn = ({ title, assetFile, progressCallback, }: {
    title: string;
    assetFile: File;
    progressCallback: (newState: UploaderState) => void;
}) => Promise<void>;
interface ImagePromptRowProps {
    visible: boolean;
    className?: string;
    maxImagePromptCount: number;
    allowUpload: boolean;
    referenceImages: RefImage[];
    setReferenceImages: (images: RefImage[]) => void;
    onVisibilityChange?: (visible: boolean) => void;
    uploadImage?: UploadImageFn;
    onImageClick?: (image: RefImage) => void;
    isVideo?: boolean;
    endFrameImage?: RefImage;
    setEndFrameImage?: (image?: RefImage) => void;
    allowUploadEnd?: boolean;
    showEndFrameSection?: boolean;
}
export declare const ImagePromptRow: ({ visible, className, maxImagePromptCount, allowUpload, referenceImages, setReferenceImages, onVisibilityChange, uploadImage, onImageClick, isVideo, endFrameImage, setEndFrameImage, allowUploadEnd, showEndFrameSection, }: ImagePromptRowProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ImagePromptRow.d.ts.map