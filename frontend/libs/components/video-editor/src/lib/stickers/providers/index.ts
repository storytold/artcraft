import { stickersRegistry } from "../registry";
import type { StickerProvider } from "../types";
import { logosProvider } from "./logos";
import { shapesProvider } from "./shapes";

const defaultProviders: StickerProvider[] = [
  logosProvider,
  shapesProvider,
];

export function registerDefaultStickerProviders({
  providersToRegister = defaultProviders,
}: {
  providersToRegister?: StickerProvider[];
} = {}): void {
  for (const provider of providersToRegister) {
    if (stickersRegistry.has(provider.id)) {
      continue;
    }
    stickersRegistry.register({
      key: provider.id,
      definition: provider,
    });
  }
}
