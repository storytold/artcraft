import { ImageModel } from '@storyteller/model-list';
import { UploadImageFn } from './ImagePromptRow';
export interface PromptBoxEditProps {
    onModeChange?: (mode: string) => void;
    selectedMode?: string;
    onGenerateClick: (prompt: string) => void | Promise<void>;
    isDisabled?: boolean;
    onFitPressed?: () => void | Promise<void>;
    selectedImageModel?: ImageModel;
    generationCount?: number;
    onGenerationCountChange?: (count: number) => void;
    supportsMaskedInpainting?: boolean;
    isEnqueueing?: boolean;
    uploadImage?: UploadImageFn;
}
export declare const PromptBoxEdit: ({ onModeChange: onModeSelectionChange, selectedMode, onGenerateClick, isEnqueueing, isDisabled, onFitPressed, selectedImageModel, generationCount: generationCountProp, onGenerationCountChange, supportsMaskedInpainting, uploadImage, }: PromptBoxEditProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PromptBoxEdit.d.ts.map