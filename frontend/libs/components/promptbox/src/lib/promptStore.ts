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

// Kling 3.0 multishot (`shot_type: "customize"`): the user splits the video
// into sequential shots that share everything except prompt text and per-shot
// duration. The sum of durations is capped at `MULTISHOT_MAX_TOTAL_SECONDS`.
export const MULTISHOT_MAX_TOTAL_SECONDS = 15;
export const MULTISHOT_MIN_SHOT_SECONDS = 1;
export const MULTISHOT_MAX_SHOT_SECONDS = 15;
export const MULTISHOT_DEFAULT_SHOT_SECONDS = 5;

export interface MultishotShot {
  id: string;
  prompt: string;
  durationSeconds: number;
}

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
  // Multishot state (only read when the selected model supports it, currently
  // Kling 3.0 pro / standard). The single `prompt` field above is ignored when
  // `isMultishot` is true.
  isMultishot: boolean;
  multishotShots: MultishotShot[];
  multishotActiveShotId: string | null;
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
  setIsMultishot: (value: boolean) => void;
  setMultishotShots: (shots: MultishotShot[]) => void;
  setMultishotActiveShotId: (id: string | null) => void;
  addMultishotShot: () => void;
  removeMultishotShot: (id: string) => void;
  updateMultishotShot: (id: string, patch: Partial<Omit<MultishotShot, "id">>) => void;
}

function createDefaultShot(durationSeconds = MULTISHOT_DEFAULT_SHOT_SECONDS): MultishotShot {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    durationSeconds,
  };
}

function totalSeconds(shots: MultishotShot[]): number {
  return shots.reduce((sum, s) => sum + s.durationSeconds, 0);
}

function clampShotDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return MULTISHOT_MIN_SHOT_SECONDS;
  return Math.min(
    MULTISHOT_MAX_SHOT_SECONDS,
    Math.max(MULTISHOT_MIN_SHOT_SECONDS, Math.round(seconds)),
  );
}

export const usePromptVideoStore = create<PromptVideoStore>()((set) => {
  const initialShot = createDefaultShot();
  return {
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
    isMultishot: false,
    multishotShots: [initialShot],
    multishotActiveShotId: initialShot.id,
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
    setIsMultishot: (isMultishot) =>
      set((state) => {
        if (isMultishot === state.isMultishot) return {};
        if (isMultishot) {
          // Turning on: seed the first shot's prompt from the current single
          // prompt so the toggle feels lossless.
          if (state.multishotShots.length === 0) {
            const seed = createDefaultShot();
            seed.prompt = state.prompt;
            return {
              isMultishot: true,
              multishotShots: [seed],
              multishotActiveShotId: seed.id,
            };
          }
          const shots = state.multishotShots.map((shot, i) =>
            i === 0 ? { ...shot, prompt: state.prompt } : shot,
          );
          return {
            isMultishot: true,
            multishotShots: shots,
            multishotActiveShotId:
              state.multishotActiveShotId ?? shots[0]?.id ?? null,
          };
        }
        // Turning off: collapse to shot 1's prompt in the single-prompt field.
        const firstShotPrompt = state.multishotShots[0]?.prompt ?? state.prompt;
        return {
          isMultishot: false,
          prompt: firstShotPrompt,
        };
      }),
    setMultishotShots: (multishotShots) =>
      set((state) => ({
        multishotShots,
        multishotActiveShotId:
          multishotShots.find((s) => s.id === state.multishotActiveShotId)?.id ??
          multishotShots[0]?.id ??
          null,
      })),
    setMultishotActiveShotId: (multishotActiveShotId) =>
      set({ multishotActiveShotId }),
    addMultishotShot: () =>
      set((state) => {
        const used = totalSeconds(state.multishotShots);
        const remaining = MULTISHOT_MAX_TOTAL_SECONDS - used;
        if (remaining < MULTISHOT_MIN_SHOT_SECONDS) return {};
        const duration = Math.min(MULTISHOT_DEFAULT_SHOT_SECONDS, remaining);
        const shot = createDefaultShot(duration);
        return {
          multishotShots: [...state.multishotShots, shot],
          multishotActiveShotId: shot.id,
        };
      }),
    removeMultishotShot: (id) =>
      set((state) => {
        if (state.multishotShots.length <= 1) return {};
        const shots = state.multishotShots.filter((s) => s.id !== id);
        const nextActiveId =
          state.multishotActiveShotId === id
            ? shots[0]?.id ?? null
            : state.multishotActiveShotId;
        return {
          multishotShots: shots,
          multishotActiveShotId: nextActiveId,
        };
      }),
    updateMultishotShot: (id, patch) =>
      set((state) => {
        const shots = state.multishotShots.map((shot) => {
          if (shot.id !== id) return shot;
          const next = { ...shot, ...patch };
          if (patch.durationSeconds !== undefined) {
            // Cap the new duration so the total can never exceed the max.
            const otherTotal =
              totalSeconds(state.multishotShots) - shot.durationSeconds;
            const headroom = MULTISHOT_MAX_TOTAL_SECONDS - otherTotal;
            next.durationSeconds = Math.min(
              clampShotDuration(patch.durationSeconds),
              Math.max(MULTISHOT_MIN_SHOT_SECONDS, headroom),
            );
          }
          return next;
        });
        return { multishotShots: shots };
      }),
  };
});

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
//   false (default): Enter inserts a newline; Shift+Enter submits.
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
