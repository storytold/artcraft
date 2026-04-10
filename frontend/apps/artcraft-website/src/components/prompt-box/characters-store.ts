import { create } from "zustand";

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
