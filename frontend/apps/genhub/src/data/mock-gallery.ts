export interface GalleryItem {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  tags: string[];
  likes: number;
  createdAt: string;
}

export const CATEGORIES = [
  "Animal",
  "Anime",
  "Architecture",
  "Armor",
  "Astronomy",
  "Car",
  "Cartoon",
  "Cat",
  "City",
  "Clothing",
  "Comics",
  "Costume",
  "Dog",
  "Dragon",
  "Fantasy",
  "Food",
  "Game Character",
  "Landscape",
  "Man",
  "Nature",
  "Portrait",
  "Robot",
  "Sci-Fi",
  "Space",
  "Woman",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SORT_OPTIONS = [
  { value: "most-liked", label: "Most Liked" },
  { value: "newest", label: "Newest" },
  { value: "most-viewed", label: "Most Viewed" },
] as const;

export const FEED_TABS = ["featured", "hot", "new", "top"] as const;
export type FeedTab = (typeof FEED_TABS)[number];

// Varied aspect ratios for natural masonry look
const ASPECT_RATIOS = [0.75, 1.25, 1, 1.5, 0.875, 1.125, 1.375, 0.8] as const;

const IMG_WIDTH = 400;

function mockImageDimensions(id: number): {
  url: string;
  w: number;
  h: number;
} {
  const ratio = ASPECT_RATIOS[id % ASPECT_RATIOS.length];
  const h = Math.round(IMG_WIDTH * ratio);
  return {
    url: `https://picsum.photos/seed/genhub${id}/${IMG_WIDTH}/${h}`,
    w: IMG_WIDTH,
    h,
  };
}

const CREATORS = [
  "Nano Banana Pro",
  "PixelDreamer",
  "ArtBot 3000",
  "CreativeAI",
  "DreamForge",
  "NeuralCanvas",
  "PromptMaster",
  "VisionCraft",
];

const TITLES = [
  "Parrot Dark Background",
  "Eagle Close-up",
  "Parrot on a Stick",
  "Shark in the Sea",
  "Random Bird Portrait",
  "Jellyfish Glowing",
  "Mountain Sunset Vista",
  "Cyberpunk Street Scene",
  "Ancient Temple Ruins",
  "Crystal Dragon Lair",
  "Neon City Nightscape",
  "Enchanted Forest Path",
  "Steampunk Airship Dock",
  "Underwater Coral Palace",
  "Cosmic Nebula Burst",
  "Samurai in Cherry Blossoms",
  "Robot Garden Keeper",
  "Frozen Waterfall Cave",
  "Desert Oasis at Dusk",
  "Floating Island Kingdom",
  "Bioluminescent Jungle",
  "Clockwork Cathedral",
  "Phoenix Rising at Dawn",
  "Alien Market Square",
  "Snow Leopard Summit",
  "Volcanic Forge City",
  "Mermaid Lagoon",
  "Time Traveler Portal",
  "Giant Treehouse Village",
  "Aurora Over Mountains",
];

function pickRandom<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickTags(seed: number): string[] {
  const count = 1 + (seed % 3);
  const tags: string[] = [];
  for (let i = 0; i < count; i++) {
    const tag = CATEGORIES[(seed + i * 7) % CATEGORIES.length];
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

/** Estimate card height for masonic virtualizer based on column width */
export function estimateItemHeight(columnWidth: number, idx: number): number {
  const ratio = ASPECT_RATIOS[idx % ASPECT_RATIOS.length];
  // image height + overlay padding (~56px for text overlay)
  return Math.round(columnWidth * ratio) + 56;
}

const MAX_MOCK_ITEMS = 1000;

export function generateMockItems(count: number, offset = 0): GalleryItem[] {
  const available = Math.max(0, Math.min(count, MAX_MOCK_ITEMS - offset));
  return Array.from({ length: available }, (_, i) => {
    const idx = offset + i;
    const img = mockImageDimensions(idx);
    return {
      id: `item-${idx}`,
      title: TITLES[idx % TITLES.length],
      creator: pickRandom(CREATORS, idx),
      imageUrl: img.url,
      imageWidth: img.w,
      imageHeight: img.h,
      tags: pickTags(idx),
      likes: 10 + ((idx * 137) % 990),
      createdAt: new Date(Date.now() - idx * 3600000).toISOString(),
    };
  });
}
