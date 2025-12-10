import { create } from "zustand";

export interface RefImage {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
}

// ----- 2D Prompt Box Store -----
type AspectRatio = "wide" | "tall" | "square";
type Resolution = "1k" | "2k" | "4k";

interface Prompt2DStore {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  generationCount: number;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
  setUseSystemPrompt: (value: boolean) => void;
  setReferenceImages: (images: RefImage[]) => void;
  setGenerationCount: (count: number) => void;
}

export const usePrompt2DStore = create<Prompt2DStore>()((set) => ({
  prompt: "",
  aspectRatio: "wide",
  resolution: "1k",
  useSystemPrompt: true,
  referenceImages: [],
  generationCount: 1,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setGenerationCount: (generationCount) => set({ generationCount }),
}));

export { usePrompt2DStore as usePromptStore };

// ----- 3D Prompt Box Store -----
interface Prompt3DStore {
  prompt: string;
  resolution: Resolution;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  setPrompt: (prompt: string) => void;
  setResolution: (resolution: Resolution) => void;
  setUseSystemPrompt: (value: boolean) => void;
  setReferenceImages: (images: RefImage[]) => void;
}

export const usePrompt3DStore = create<Prompt3DStore>()((set) => ({
  prompt: "",
  resolution: "1k",
  useSystemPrompt: true,
  referenceImages: [],
  setPrompt: (prompt) => set({ prompt }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
}));

// ----- Image Prompt Box Store -----
interface PromptImageStore {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  generationCount: number;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
  setUseSystemPrompt: (value: boolean) => void;
  setReferenceImages: (images: RefImage[]) => void;
  setGenerationCount: (count: number) => void;
}

export const usePromptImageStore = create<PromptImageStore>()((set) => ({
  prompt: "",
  aspectRatio: "wide",
  resolution: "1k",
  useSystemPrompt: true,
  referenceImages: [],
  generationCount: 1,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setGenerationCount: (generationCount) => set({ generationCount }),
}));

// ----- Video Prompt Box Store -----
type Resolution = "720p" | "480p"; // TODO: This needs to be relaxed.

interface PromptVideoStore {
  prompt: string;
  resolution: Resolution | string;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  endFrameImage?: RefImage;
  generateWithSound: boolean;
  setPrompt: (prompt: string) => void;
  setResolution: (resolution: Resolution | string) => void;
  setUseSystemPrompt: (value: boolean) => void;
  setReferenceImages: (images: RefImage[]) => void;
  setEndFrameImage: (image?: RefImage) => void;
  setGenerateWithSound: (value: boolean) => void;
}

export const usePromptVideoStore = create<PromptVideoStore>()((set) => ({
  prompt: "",
  resolution: "720p",
  useSystemPrompt: true,
  referenceImages: [],
  endFrameImage: undefined,
  generateWithSound: true,
  setPrompt: (prompt) => set({ prompt }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setEndFrameImage: (endFrameImage) => set({ endFrameImage }),
  setGenerateWithSound: (generateWithSound) => set({ generateWithSound }),
}));

// ----- Edit Prompt Box Store -----
type EditAspectRatio = "auto" | "wide" | "tall" | "square";

interface PromptEditStore {
  referenceImages: RefImage[];
  aspectRatio: EditAspectRatio;
  resolution: Resolution;
  setReferenceImages: (images: RefImage[]) => void;
  setAspectRatio: (ratio: EditAspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
}

export const usePromptEditStore = create<PromptEditStore>()((set) => ({
  referenceImages: [],
  aspectRatio: "auto",
  resolution: "1k",
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
}));
