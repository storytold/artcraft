import { UploaderState } from './UploaderState';
export interface UploadImageArgs {
    title: string;
    assetFile: File;
    progressCallback: (newState: UploaderState) => void;
}
//# sourceMappingURL=UploadImage.d.ts.map