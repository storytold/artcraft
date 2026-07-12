import { create } from "zustand";
import { CommonAspectRatio } from "@storyteller/model-list";
import { CommonResolution } from "@storyteller/model-list";
import { CommonQuality } from "@storyteller/model-list";

export interface RefImage {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
}

export interface RefVideo {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
  duration: number; // seconds
}

export interface RefAudio {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
  duration: number; // seconds
}

// ----- 2D Prompt Box Store -----
type AspectRatio = "wide" | "tall" | "square";
type Resolution = "1k" | "2k" | "4k";

export interface Prompt2DStore {
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
// Newest first; capped so the history popover stays tidy.
const MAX_PROMPT_HISTORY = 20;

interface Prompt3DStore {
  prompt: string;
  resolution: Resolution;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  promptHistory: string[];
  setPrompt: (prompt: string) => void;
  setResolution: (resolution: Resolution) => void;
  setUseSystemPrompt: (value: boolean) => void;
  setReferenceImages: (images: RefImage[]) => void;
  pushPromptHistory: (prompt: string) => void;
}

export const usePrompt3DStore = create<Prompt3DStore>()((set) => ({
  prompt: "",
  resolution: "1k",
  useSystemPrompt: true,
  referenceImages: [],
  promptHistory: [],
  setPrompt: (prompt) => set({ prompt }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  pushPromptHistory: (prompt) =>
    set((state) => {
      const trimmed = prompt.trim();
      if (!trimmed) return state;
      // De-dupe: drop any existing copy, then unshift so it's newest-first.
      const next = [
        trimmed,
        ...state.promptHistory.filter((p) => p !== trimmed),
      ].slice(0, MAX_PROMPT_HISTORY);
      return { promptHistory: next };
    }),
}));

// ----- Image Prompt Box Store -----
interface PromptImageStore {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  generationCount: number;
  // New-style aspect ratio and resolution (preferred over legacy fields above)
  commonAspectRatio: CommonAspectRatio | undefined;
  commonResolution: CommonResolution | undefined;
  commonQuality: CommonQuality | undefined;
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
  setUseSystemPrompt: (value: boolean) => void;
  setReferenceImages: (images: RefImage[]) => void;
  setGenerationCount: (count: number) => void;
  setCommonAspectRatio: (ratio: CommonAspectRatio | undefined) => void;
  setCommonResolution: (resolution: CommonResolution | undefined) => void;
  setCommonQuality: (quality: CommonQuality | undefined) => void;
}

export const usePromptImageStore = create<PromptImageStore>()((set) => ({
  prompt: "",
  aspectRatio: "wide",
  resolution: "1k",
  useSystemPrompt: true,
  referenceImages: [],
  generationCount: 1,
  commonAspectRatio: undefined,
  commonResolution: undefined,
  commonQuality: undefined,
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setGenerationCount: (generationCount) => set({ generationCount }),
  setCommonAspectRatio: (commonAspectRatio) => set({ commonAspectRatio }),
  setCommonResolution: (commonResolution) => set({ commonResolution }),
  setCommonQuality: (commonQuality) => set({ commonQuality }),
}));

// ----- Video Prompt Box Store -----
export type VideoInputMode = "keyframe" | "reference";

interface PromptVideoStore {
  prompt: string;
  resolution: Resolution | string;
  aspectRatio: string | null;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  endFrameImage?: RefImage;
  referenceVideos: RefVideo[];
  referenceAudios: RefAudio[];
  generateWithSound: boolean;
  duration: number | null;
  inputMode: VideoInputMode;
  generationCount: number;
  setPrompt: (prompt: string) => void;
  setResolution: (resolution: Resolution | string) => void;
  setAspectRatio: (aspectRatio: string | null) => void;
  setUseSystemPrompt: (value: boolean) => void;
  setReferenceImages: (images: RefImage[]) => void;
  setEndFrameImage: (image?: RefImage) => void;
  setReferenceVideos: (videos: RefVideo[]) => void;
  setReferenceAudios: (audios: RefAudio[]) => void;
  setGenerateWithSound: (value: boolean) => void;
  setDuration: (duration: number | null) => void;
  setInputMode: (mode: VideoInputMode) => void;
  setGenerationCount: (count: number) => void;
}

export const usePromptVideoStore = create<PromptVideoStore>()((set) => ({
  prompt: "",
  resolution: "720p",
  aspectRatio: null,
  useSystemPrompt: true,
  referenceImages: [],
  endFrameImage: undefined,
  referenceVideos: [],
  referenceAudios: [],
  generateWithSound: true,
  duration: null,
  inputMode: "keyframe",
  generationCount: 1,
  setPrompt: (prompt) => set({ prompt }),
  setResolution: (resolution) => set({ resolution }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setEndFrameImage: (endFrameImage) => set({ endFrameImage }),
  setReferenceVideos: (referenceVideos) => set({ referenceVideos }),
  setReferenceAudios: (referenceAudios) => set({ referenceAudios }),
  setGenerateWithSound: (generateWithSound) => set({ generateWithSound }),
  setDuration: (duration) => set({ duration }),
  setInputMode: (inputMode) => set({ inputMode }),
  setGenerationCount: (generationCount) => set({ generationCount }),
}));

// ----- Audio Prompt Box Store -----
interface PromptAudioStore {
  prompt: string;
  // Style/genre direction (Suno's "tags").
  stylePrompt: string;
  // Model id ("suno_music", ...) — audio models come from the omni HTTP API,
  // not the ClassyModelSelector store.
  selectedModelId: string | null;
  // Suno toggles
  isInstrumental: boolean;
  keepLyrics: boolean;
  isLoopable: boolean;
  // Suno Sounds beat controls. bpm null = "Auto" (omitted from the request).
  bpm: number | null;
  musicalKey: string;
  // Seed Audio output shaping.
  sampleRateHz: number | null;
  speed: number;
  volume: number;
  pitch: number;
  referenceAudios: RefAudio[];
  referenceImages: RefImage[];
  setPrompt: (prompt: string) => void;
  setStylePrompt: (stylePrompt: string) => void;
  setSelectedModelId: (modelId: string | null) => void;
  setIsInstrumental: (value: boolean) => void;
  setKeepLyrics: (value: boolean) => void;
  setIsLoopable: (value: boolean) => void;
  setBpm: (bpm: number | null) => void;
  setMusicalKey: (musicalKey: string) => void;
  setSampleRateHz: (sampleRateHz: number | null) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setPitch: (pitch: number) => void;
  setReferenceAudios: (audios: RefAudio[]) => void;
  setReferenceImages: (images: RefImage[]) => void;
}

export const usePromptAudioStore = create<PromptAudioStore>()((set) => ({
  prompt: "",
  stylePrompt: "",
  selectedModelId: null,
  isInstrumental: false,
  keepLyrics: false,
  isLoopable: false,
  bpm: null,
  musicalKey: "auto",
  sampleRateHz: null,
  speed: 1,
  volume: 1,
  pitch: 0,
  referenceAudios: [],
  referenceImages: [],
  setPrompt: (prompt) => set({ prompt }),
  setStylePrompt: (stylePrompt) => set({ stylePrompt }),
  setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
  setIsInstrumental: (isInstrumental) => set({ isInstrumental }),
  setKeepLyrics: (keepLyrics) => set({ keepLyrics }),
  setIsLoopable: (isLoopable) => set({ isLoopable }),
  setBpm: (bpm) => set({ bpm }),
  setMusicalKey: (musicalKey) => set({ musicalKey }),
  setSampleRateHz: (sampleRateHz) => set({ sampleRateHz }),
  setSpeed: (speed) => set({ speed }),
  setVolume: (volume) => set({ volume }),
  setPitch: (pitch) => set({ pitch }),
  setReferenceAudios: (referenceAudios) => set({ referenceAudios }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
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

// ----- Enter-to-Generate Preference Store -----
// Controls how the Enter key behaves inside prompt boxes.
//   false (default): Both Enter and Shift+Enter insert a newline; only the button submits.
//   true:            Enter submits; Shift+Enter inserts a newline.
// Persisted to localStorage so the choice survives reloads.
const ENTER_TO_GENERATE_STORAGE_KEY = "artcraft_enter_to_generate";

const readEnterToGenerate = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ENTER_TO_GENERATE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const writeEnterToGenerate = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(ENTER_TO_GENERATE_STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(ENTER_TO_GENERATE_STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
};

interface EnterToGenerateStore {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useEnterToGenerateStore = create<EnterToGenerateStore>()((set) => ({
  enabled: readEnterToGenerate(),
  setEnabled: (enabled) => {
    writeEnterToGenerate(enabled);
    set({ enabled });
  },
}));

// ----- Characters Store -----
export interface StoredCharacter {
  character_token: string;
  name: string;
  avatar_image_url?: string;
}

interface CharactersStore {
  characters: StoredCharacter[];
  loaded: boolean;
  setCharacters: (characters: StoredCharacter[]) => void;
  addCharacter: (character: StoredCharacter) => void;
  updateCharacter: (token: string, updates: Partial<StoredCharacter>) => void;
  removeCharacter: (token: string) => void;
  setLoaded: (loaded: boolean) => void;
}

export const useCharactersStore = create<CharactersStore>()((set) => ({
  characters: [],
  loaded: false,
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) =>
    set((state) => ({ characters: [...state.characters, character] })),
  updateCharacter: (token, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.character_token === token ? { ...c, ...updates } : c,
      ),
    })),
  removeCharacter: (token) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.character_token !== token),
    })),
  setLoaded: (loaded) => set({ loaded }),
}));
