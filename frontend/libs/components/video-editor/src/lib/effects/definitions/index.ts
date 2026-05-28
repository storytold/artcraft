import { effectsRegistry } from "../registry";
import { blurEffectDefinition } from "./blur";

const defaultEffects = [blurEffectDefinition];

// Called by EditorCore at construction (and from any host setup that
// bypasses EditorCore). Idempotent — re-registering a known type is a
// no-op so hot-reload doesn't double-register effects.
export function registerDefaultEffects(): void {
  for (const definition of defaultEffects) {
    if (effectsRegistry.has(definition.type)) {
      continue;
    }
    effectsRegistry.register({
      key: definition.type,
      definition,
    });
  }
}
