export interface RefImage {
    id: string;
    url: string;
    file: File;
    mediaToken: string;
}
type AspectRatio = "3:2" | "2:3" | "1:1";
interface Prompt2DStore {
    prompt: string;
    aspectRatio: AspectRatio;
    useSystemPrompt: boolean;
    referenceImages: RefImage[];
    generationCount: number;
    setPrompt: (prompt: string) => void;
    setAspectRatio: (ratio: AspectRatio) => void;
    setUseSystemPrompt: (value: boolean) => void;
    setReferenceImages: (images: RefImage[]) => void;
    setGenerationCount: (count: number) => void;
}
export declare const usePrompt2DStore: import('zustand').UseBoundStore<import('zustand').StoreApi<Prompt2DStore>>;
export { usePrompt2DStore as usePromptStore };
interface Prompt3DStore {
    prompt: string;
    useSystemPrompt: boolean;
    referenceImages: RefImage[];
    setPrompt: (prompt: string) => void;
    setUseSystemPrompt: (value: boolean) => void;
    setReferenceImages: (images: RefImage[]) => void;
}
export declare const usePrompt3DStore: import('zustand').UseBoundStore<import('zustand').StoreApi<Prompt3DStore>>;
interface PromptImageStore {
    prompt: string;
    aspectRatio: AspectRatio;
    useSystemPrompt: boolean;
    referenceImages: RefImage[];
    generationCount: number;
    setPrompt: (prompt: string) => void;
    setAspectRatio: (ratio: AspectRatio) => void;
    setUseSystemPrompt: (value: boolean) => void;
    setReferenceImages: (images: RefImage[]) => void;
    setGenerationCount: (count: number) => void;
}
export declare const usePromptImageStore: import('zustand').UseBoundStore<import('zustand').StoreApi<PromptImageStore>>;
type Resolution = "720p" | "480p";
interface PromptVideoStore {
    prompt: string;
    resolution: Resolution;
    useSystemPrompt: boolean;
    referenceImages: RefImage[];
    endFrameImage?: RefImage;
    setPrompt: (prompt: string) => void;
    setResolution: (resolution: Resolution) => void;
    setUseSystemPrompt: (value: boolean) => void;
    setReferenceImages: (images: RefImage[]) => void;
    setEndFrameImage: (image?: RefImage) => void;
}
export declare const usePromptVideoStore: import('zustand').UseBoundStore<import('zustand').StoreApi<PromptVideoStore>>;
interface PromptEditStore {
    referenceImages: RefImage[];
    setReferenceImages: (images: RefImage[]) => void;
}
export declare const usePromptEditStore: import('zustand').UseBoundStore<import('zustand').StoreApi<PromptEditStore>>;
//# sourceMappingURL=promptStore.d.ts.map