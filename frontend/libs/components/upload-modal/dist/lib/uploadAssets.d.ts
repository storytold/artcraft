import { FilterEngineCategories } from '@storyteller/api';
import { MediaFileAnimationType, UploaderState } from '@storyteller/common';
export declare const uploadAssets: ({ title, assetFile, thumbnailFile, engineCategory, animationType, length, progressCallback, getFileName, getFileExtension, }: {
    title: string;
    assetFile: File;
    engineCategory: FilterEngineCategories;
    thumbnailFile?: File;
    animationType?: MediaFileAnimationType;
    length?: number;
    progressCallback: (newState: UploaderState) => void;
    getFileName: (file: File) => string;
    getFileExtension: (file: File) => string;
}) => Promise<void>;
//# sourceMappingURL=uploadAssets.d.ts.map