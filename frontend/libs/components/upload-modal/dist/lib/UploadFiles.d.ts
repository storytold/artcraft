import { FilterEngineCategories } from '@storyteller/api';
import { UploaderState } from '@storyteller/common';
interface Props {
    title: string;
    engineCategory: FilterEngineCategories;
    fileTypes: string[];
    onClose: () => void;
    options?: {
        fileSubtypes?: {
            [key: string]: string;
        }[];
        hasLength?: boolean;
        hasThumbnailUpload?: boolean;
    };
    onUploadProgress: (newState: UploaderState) => void;
    getFileName: (file: File) => string;
    getFileExtension: (file: File) => string;
}
export declare const UploadFiles: ({ fileTypes, engineCategory, onClose, title, options, onUploadProgress, getFileName, getFileExtension, }: Props) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=UploadFiles.d.ts.map