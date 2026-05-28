import { DefinitionRegistry } from "../params/registry";
import type { EffectDefinition } from "./types";

// Singleton registry where the lib's built-in effects (blur, etc.) and
// any host-extended effects register themselves at module-init time.
// The properties panel and the effect-pass resolver both look up
// definitions by effect type via `effectsRegistry.get(type)`.
export class EffectsRegistry extends DefinitionRegistry<string, EffectDefinition> {
  constructor() {
    super("effect");
  }
}

export const effectsRegistry = new EffectsRegistry();
