import { FilterEngineCategories } from './Types';
interface Props {
    onClose: () => void;
    onSuccess: () => void;
    isOpen: boolean;
    title: string;
    fileTypes: string[];
    type: FilterEngineCategories;
    options?: {
        fileSubtypes?: {
            [key: string]: string;
        }[];
        hasLength?: boolean;
        hasThumbnailUpload?: boolean;
    };
    getFileName: (file: File) => string;
    getFileExtension: (file: File) => string;
}
export declare function UploadModal({ isOpen, onClose, onSuccess, title, fileTypes, type, options, getFileName, getFileExtension, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=UploadModal.d.ts.map