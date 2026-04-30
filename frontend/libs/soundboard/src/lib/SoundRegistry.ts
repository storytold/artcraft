// Internal to @storyteller/soundboard. Consumers go through SoundManager.
import { SoundEffect } from "./SoundEffect";

export class SoundRegistry {
  #sounds: Map<string, SoundEffect>;

  private constructor() {
    this.#sounds = new Map();
  }

  public static getInstance() {
    // NB(bt,2026-01-03): Our `nx` build setup is deeply flawed and in need 
    // of repair: Production builds will compile libraries to multiple 
    // independent symbolic spaces, making singleton pattern unreliable.
    // Effectively, the singletons cannot be used across bundle boundaries.
    // We're going to be gross and bind everything to the global namespace.
    // 
    // To be clear, this does not work:
    //
    //    class SoundRegistry {
    //       static #instance: SoundRegistry | undefined;
    //
    //       [...]
    //
    //       static getInstance() {
    //         if (SoundRegistry.#instance === undefined) {
    //           SoundRegistry.#instance = new SoundRegistry();
    //         }
    //         return SoundRegistry.#instance;
    //       }

    if ((window as any).artcraft_sound_registry === undefined) {
      (window as any).artcraft_sound_registry = new SoundRegistry();
    }
    return (window as any).artcraft_sound_registry;
  }

  public hasSound(key: string) : boolean {
    return this.#sounds.has(key);
  }

  public setSound(key: string, sound: SoundEffect) {
    this.#sounds.set(key, sound);
  }

  public setSoundOnce(key: string, sound: SoundEffect) {
    if (!this.#sounds.has(key)) {
      this.#sounds.set(key, sound);
    }
  }

  public getSound(key: string) : SoundEffect | undefined {
    return this.#sounds.get(key);
  }

  public playSound(key: string) {
    this.#sounds.get(key)?.play()
  }
}
