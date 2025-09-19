import { JobContextType } from '@storyteller/common';
import { VideoModel } from '@storyteller/model-list';
import { UploadImageFn } from './ImagePromptRow';
interface PromptBoxVideoProps {
    useJobContext: () => JobContextType;
    onEnqueuePressed?: (prompt: string, subscriberId: string) => void | Promise<void>;
    selectedModel?: VideoModel;
    imageMediaId?: string;
    url?: string;
    onImageRowVisibilityChange?: (visible: boolean) => void;
    uploadImage?: UploadImageFn;
}
export declare const PromptBoxVideo: ({ useJobContext, onEnqueuePressed, selectedModel, imageMediaId, url, onImageRowVisibilityChange, uploadImage, }: PromptBoxVideoProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PromptBoxVideo.d.ts.map