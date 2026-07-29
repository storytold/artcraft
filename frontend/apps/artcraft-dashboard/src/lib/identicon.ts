import { createAvatar } from "@dicebear/core";
import { identicon } from "@dicebear/collection";

const cache = new Map<string, string>();

export function getIdenticonUrl(seed: string): string {
  const cached = cache.get(seed);
  if (cached) return cached;

  const avatar = createAvatar(identicon, {
    seed,
    size: 128,
    backgroundColor: [
      "eef2ff", "f0fdf4", "fef2f2", "fdf4ff", "fff7ed",
      "ecfeff", "fefce8", "fdf2f8", "f0f9ff", "f5f3ff",
    ],
    rowColor: [
      "4f46e5", "16a34a", "dc2626", "9333ea", "ea580c",
      "0891b2", "ca8a04", "db2777", "0284c7", "7c3aed",
    ],
  });

  const url = avatar.toDataUri();
  cache.set(seed, url);
  return url;
}
