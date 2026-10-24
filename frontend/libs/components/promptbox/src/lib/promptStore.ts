// Zustand's create() builds a small shared store: any component can read it, and only the ones that read a changed field re-render.
import { create } from "zustand";
// The newer shared aspect-ratio, resolution and quality types from the model list (the image store uses them).
import { CommonAspectRatio } from "@storyteller/model-list";
import { CommonResolution } from "@storyteller/model-list";
import { CommonQuality } from "@storyteller/model-list";

// A reference image the user attached to a prompt (shown as a thumbnail, sent to the model as context).
export interface RefImage {
  // Unique id for this attachment; used as the React key and when removing it.
  id: string;
  /** Display thumbnail (downscaled object URL for uploads, CDN URL for
   *  library picks). Never sent to the backend — that's `mediaToken`. */
  url: string;
  /** Full-resolution URL for preview modals; falls back to `url`. */
  fullUrl?: string;
  // The original file the user picked or dropped.
  file: File;
  // The backend's id for the uploaded copy. This is what gets sent when generating.
  mediaToken: string;
}

// A reference video the user attached (video prompt box only).
export interface RefVideo {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
  // How long the clip is, in seconds.
  duration: number; // seconds
}

// A reference audio clip the user attached (video and audio prompt boxes).
export interface RefAudio {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
  duration: number; // seconds
}

// ----- 2D Prompt Box Store -----
// The older three-way shape choice: wide (landscape), tall (portrait) or square.
type AspectRatio = "wide" | "tall" | "square";
// The older output-size presets.
type Resolution = "1k" | "2k" | "4k";

// Everything the 2D prompt box remembers: its values first, then one setter per value.
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

// The store hook. Components read with usePrompt2DStore(selector) and write by calling the setters; the object below holds the starting values.
export const usePrompt2DStore = create<Prompt2DStore>()((set) => ({
  prompt: "",
  aspectRatio: "wide",
  resolution: "1k",
  useSystemPrompt: true,
  referenceImages: [],
  generationCount: 1,
  // Each setter changes just one field: set() merges it into the state and notifies the components that read it.
  setPrompt: (prompt) => set({ prompt }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
  setUseSystemPrompt: (useSystemPrompt) => set({ useSystemPrompt }),
  setReferenceImages: (referenceImages) => set({ referenceImages }),
  setGenerationCount: (generationCount) => set({ generationCount }),
}));

// The older name for the 2D store, kept as an alias so existing imports keep working.
export { usePrompt2DStore as usePromptStore };

// ----- 3D Prompt Box Store -----
// Newest first; capped so the history popover stays tidy.
const MAX_PROMPT_HISTORY = 20;

// State for the 3D prompt box, plus a short history of earlier prompts.
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

// The 3D store hook and its starting values.
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
  // Adds a prompt to the history, newest first, without duplicates and capped at MAX_PROMPT_HISTORY.
  pushPromptHistory: (prompt) =>
    set((state) => {
      // Ignore leading and trailing spaces so "fox" and "fox " count as the same prompt.
      const trimmed = prompt.trim();
      // A blank prompt is not worth remembering; returning the same state means nothing changes.
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
// State for the image prompt box. The commonAspectRatio / commonResolution / commonQuality fields are the newer values; the older aspectRatio / resolution remain for the code that still reads them.
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

// The image store hook and its starting values (the newer common* values start unset, meaning "model default").
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
// keyframe = start and end frame images; reference = free-form reference images, videos and audio.
export type VideoInputMode = "keyframe" | "reference";

// State for the video prompt box. A null value (aspect ratio, duration, bitrate, output format) means "let the model decide".
interface PromptVideoStore {
  prompt: string;
  resolution: Resolution | string;
  aspectRatio: string | null;
  useSystemPrompt: boolean;
  referenceImages: RefImage[];
  // Optional last frame, used only in keyframe mode.
  endFrameImage?: RefImage;
  referenceVideos: RefVideo[];
  referenceAudios: RefAudio[];
  // Whether the model should also produce an audio track.
  generateWithSound: boolean;
  duration: number | null;
  bitrate: string | null;
  outputFormat: string | null;
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
  setBitrate: (bitrate: string | null) => void;
  setOutputFormat: (outputFormat: string | null) => void;
  setInputMode: (mode: VideoInputMode) => void;
  setGenerationCount: (count: number) => void;
}

// The video store hook and its starting values.
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
  bitrate: null,
  outputFormat: null,
  // New sessions start in reference mode.
  inputMode: "reference",
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
  setBitrate: (bitrate) => set({ bitrate }),
  setOutputFormat: (outputFormat) => set({ outputFormat }),
  setInputMode: (inputMode) => set({ inputMode }),
  setGenerationCount: (generationCount) => set({ generationCount }),
}));

// ----- Audio Prompt Box Store -----
// State for the audio (music and sound) prompt box.
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

// The audio store hook and its starting values (no model chosen yet, tempo on Auto, normal speed and volume, no pitch shift).
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
// The edit box adds "auto", which keeps the shape of the source image.
type EditAspectRatio = "auto" | "wide" | "tall" | "square";

// State for the image-edit prompt box (no prompt text of its own here).
interface PromptEditStore {
  referenceImages: RefImage[];
  aspectRatio: EditAspectRatio;
  resolution: Resolution;
  setReferenceImages: (images: RefImage[]) => void;
  setAspectRatio: (ratio: EditAspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
}

// The edit store hook and its starting values.
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
// The localStorage key the preference is saved under.
const ENTER_TO_GENERATE_STORAGE_KEY = "artcraft_enter_to_generate";

// Reads the saved choice. Falls back to off when there is no window (tests) or the browser blocks storage.
const readEnterToGenerate = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ENTER_TO_GENERATE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

// Saves the choice: stores "true" when on and removes the entry when off. A storage failure is ignored.
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

// Just the on / off flag and its setter.
interface EnterToGenerateStore {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

// The store hook. Its starting value is read from storage once, when this file first loads.
export const useEnterToGenerateStore = create<EnterToGenerateStore>()((set) => ({
  enabled: readEnterToGenerate(),
  setEnabled: (enabled) => {
    writeEnterToGenerate(enabled);
    set({ enabled });
  },
}));

// ----- Characters Store -----
// One saved character as the prompt box needs it (its token, name and image links).
export interface StoredCharacter {
  character_token: string;
  name: string;
  avatar_image_url?: string;
  full_image_url?: string;
}

// The list of saved characters, with a flag saying whether the list has been fetched yet.
interface CharactersStore {
  characters: StoredCharacter[];
  loaded: boolean;
  setCharacters: (characters: StoredCharacter[]) => void;
  updateCharacter: (token: string, updates: Partial<StoredCharacter>) => void;
  removeCharacter: (token: string) => void;
  setLoaded: (loaded: boolean) => void;
}

// The characters store hook and its starting values (empty list, not loaded).
export const useCharactersStore = create<CharactersStore>()((set) => ({
  characters: [],
  loaded: false,
  setCharacters: (characters) => set({ characters }),
  // Merge the changed fields into the one character with this token and leave the others alone.
  updateCharacter: (token, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.character_token === token ? { ...c, ...updates } : c,
      ),
    })),
  // Drop the character with this token from the list.
  removeCharacter: (token) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.character_token !== token),
    })),
  setLoaded: (loaded) => set({ loaded }),
}));
