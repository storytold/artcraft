import { stickersRegistry } from "./registry";
import { parseStickerId } from "./sticker-id";
import { registerDefaultStickerProviders } from "./providers";
import type { StickerResolveOptions } from "./types";

export function resolveStickerId({
  stickerId,
  options,
}: {
  stickerId: string;
  options?: StickerResolveOptions;
}): string {
  registerDefaultStickerProviders();

  const parsedStickerId = parseStickerId({ stickerId });
  return stickersRegistry.get(parsedStickerId.providerId).resolveUrl({
    stickerId,
    options,
  });
}
