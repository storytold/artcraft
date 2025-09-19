import { SoundEffect } from "./SoundEffect";

export class SoundRegistry {
  static #instance: SoundRegistry | undefined;

  #sounds: Map<string, SoundEffect>;

  private constructor() {
    this.#sounds = new Map();
  }

  public static getInstance() {
    if (SoundRegistry.#instance === undefined) {
      SoundRegistry.#instance = new SoundRegistry();
    }
    return SoundRegistry.#instance;
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
