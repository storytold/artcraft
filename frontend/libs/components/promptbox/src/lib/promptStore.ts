import { create } from "zustand";

export interface RefImage {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
}

// ----- 2D Prompt Box Store -----
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

export const usePrompt2DStore = create<Prompt2DStore>()((set) => ({
  prompt: "",
  aspectRatio: "3:2",
  useSystemPrompt: true,
  referenceImages: [],
  generationCount: 1,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setGenerationCount: (generationCount) => set({ generationCount }),
}));

export { usePrompt2DStore as usePromptStore };

// ----- 3D Prompt Box Store -----
interface Prompt3DStore {
  prompt: string;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  setPrompt: (prompt: string) => void;
  setUseSystemPrompt: (value: boolean) => void;
  setReferenceImages: (images: RefImage[]) => void;
}

export const usePrompt3DStore = create<Prompt3DStore>()((set) => ({
  prompt: "",
  useSystemPrompt: true,
  referenceImages: [],
  setPrompt: (prompt) => set({ prompt }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
}));

// ----- Image Prompt Box Store -----
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

export const usePromptImageStore = create<PromptImageStore>()((set) => ({
  prompt: "",
  aspectRatio: "3:2",
  useSystemPrompt: true,
  referenceImages: [],
  generationCount: 1,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setGenerationCount: (generationCount) => set({ generationCount }),
}));

// ----- Video Prompt Box Store -----
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

export const usePromptVideoStore = create<PromptVideoStore>()((set) => ({
  prompt: "",
  resolution: "720p",
  useSystemPrompt: true,
  referenceImages: [],
  endFrameImage: undefined,
  setPrompt: (prompt) => set({ prompt }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setEndFrameImage: (endFrameImage) => set({ endFrameImage }),
}));

// ----- Edit Prompt Box Store -----
interface PromptEditStore {
  referenceImages: RefImage[];
  setReferenceImages: (images: RefImage[]) => void;
}

export const usePromptEditStore = create<PromptEditStore>()((set) => ({
  referenceImages: [],
  setReferenceImages: (referenceImages) => set({ referenceImages }),
}));
