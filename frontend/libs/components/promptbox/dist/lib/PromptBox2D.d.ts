import { JobContextType, MaybeCanvasRenderBitmapType, UploaderState } from '@storyteller/common';
import { ImageModel } from '@storyteller/model-list';
export type AspectRatio = "1:1" | "3:2" | "2:3";
interface PromptBox2DProps {
    uploadImage: ({ title, assetFile, progressCallback, }: {
        title: string;
        assetFile: File;
        progressCallback: (newState: UploaderState) => void;
    }) => Promise<void>;
    selectedImageModel?: ImageModel;
    getCanvasRenderBitmap: () => MaybeCanvasRenderBitmapType;
    EncodeImageBitmapToBase64: (imageBitmap: ImageBitmap) => Promise<string>;
    useJobContext: () => JobContextType;
    onEnqueuePressed?: () => void | Promise<void>;
    onAspectRatioChange?: (ratio: AspectRatio) => void;
    onFitPressed?: () => void | Promise<void>;
}
export declare const PromptBox2D: ({ uploadImage, getCanvasRenderBitmap, EncodeImageBitmapToBase64, useJobContext, onEnqueuePressed, onAspectRatioChange, selectedImageModel, onFitPressed, }: PromptBox2DProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PromptBox2D.d.ts.map