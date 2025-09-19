import { JobContextType, UploaderState } from '@storyteller/common';
import { ImageModel } from '@storyteller/model-list';
interface PromptBoxImageProps {
    useJobContext: () => JobContextType;
    uploadImage?: ({ title, assetFile, progressCallback, }: {
        title: string;
        assetFile: File;
        progressCallback: (newState: UploaderState) => void;
    }) => Promise<void>;
    onEnqueuePressed?: (prompt: string, count: number, subscriberId: string) => void | Promise<void>;
    selectedModel?: ImageModel;
    imageMediaId?: string;
    url?: string;
    onImageRowVisibilityChange?: (visible: boolean) => void;
}
export declare const PromptBoxImage: ({ useJobContext, uploadImage, onEnqueuePressed, selectedModel, imageMediaId, url, onImageRowVisibilityChange, }: PromptBoxImageProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PromptBoxImage.d.ts.map