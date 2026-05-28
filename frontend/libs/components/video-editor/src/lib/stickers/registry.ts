import type { StickerProvider } from "./types";
import { DefinitionRegistry } from "../params/registry";

export class StickersRegistry extends DefinitionRegistry<string, StickerProvider> {
  constructor() {
    super("sticker provider");
  }
}

export const stickersRegistry = new StickersRegistry();
