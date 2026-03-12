export interface Comment {
  username: string;
  text: string;
  date: string;
  likes: number;
}

export type MediaType = "image" | "video";

export interface GalleryItem {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  mediaType: MediaType;
  tags: string[];
  likes: number;
  createdAt: string;
  prompt: string;
  model: string;
  comments: Comment[];
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

const IMG_WIDTH = 800;

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

const MODELS = [
  "Seedance 2.0",
  "Midjourney v6",
  "DALL-E 3",
  "Stable Diffusion XL",
  "Flux Pro",
];

const PROMPTS = [
  "A dragon with detailed scales and sharp teeth, breathing fire; a knight in shiny armor and a dark cape, holding a sword; a dense forest background with tall trees and scattered foliage; warm orange and yellow flames contrasted against dark greens and browns; cinematic lighting with volumetric fog",
  "A mystical underwater palace made of coral and bioluminescent jellyfish, with schools of colorful tropical fish swimming through arched doorways; deep ocean blue tones with glowing accents of teal and magenta; god rays filtering through the water surface above",
  "A cyberpunk street market at night, neon signs reflecting on wet pavement; vendors selling holographic wares from makeshift stalls; a lone figure in a hooded jacket walking through steam rising from grates; rain droplets caught in colorful light",
  "An ancient temple ruin overgrown with vines and moss, golden sunlight breaking through the canopy above; intricate stone carvings depicting mythological creatures; a small waterfall cascading down moss-covered steps into a crystal-clear pool",
  "A steampunk airship docked at a floating sky platform, brass gears and copper pipes visible on the hull; clouds stretching to the horizon in warm sunset colors; crew members in Victorian-era clothing loading cargo; steam billowing from exhaust pipes",
  "A snow leopard perched on a rocky mountain summit at golden hour; wind blowing through its thick fur; dramatic mountain range stretching into the distance; warm amber light contrasting with cool blue shadows on snow",
  "A massive treehouse village connected by rope bridges, lanterns hanging from branches casting warm pools of light; a starry night sky visible through gaps in the canopy; fireflies drifting lazily between the wooden structures",
  "A phoenix rising from flames at dawn, feathers made of liquid fire and molten gold; the sky transitioning from deep purple to brilliant orange; sparks and embers swirling in elaborate patterns; photorealistic, 8k detail",
];

const COMMENT_TEXTS = [
  "This is cool af!",
  "How did you get the lighting so perfect?",
  "The details on this are insane",
  "What settings did you use?",
  "Absolutely stunning work!",
  "This is giving me serious inspiration",
  "The composition is *chef's kiss*",
  "Can you share the negative prompt too?",
  "Tried to recreate this but yours is way better",
  "Following for more content like this!",
];

const COMMENT_USERS = [
  "racecarguy",
  "artlover42",
  "pixel_queen",
  "synthwave_kid",
  "promptengineer",
  "aiexplorer",
  "creativemind",
  "digitalartist",
];

/** Deterministic pseudo-UUID from an index (looks realistic, reversible via lookup). */
function mockUuid(idx: number): string {
  const hash = (n: number, seed: number) => ((n * seed) >>> 0);
  const h8 = (n: number) => n.toString(16).padStart(8, '0');
  const h4 = (n: number) => (n & 0xffff).toString(16).padStart(4, '0');
  const i = idx + 1; // avoid zero-multiplication
  return [
    h8(hash(i, 2654435761)),
    h4(hash(i, 2246822519)),
    h4(0x4000 | (hash(i, 3266489917) & 0x0fff)),
    h4(0x8000 | (hash(i, 668265263) & 0x3fff)),
    h8(hash(i, 374761393)) + h4(hash(i, 1234567891)),
  ].join('-');
}

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

function generateMockComments(seed: number): Comment[] {
  const count = seed % 5;
  return Array.from({ length: count }, (_, i) => ({
    username: COMMENT_USERS[(seed + i * 3) % COMMENT_USERS.length],
    text: COMMENT_TEXTS[(seed + i * 7) % COMMENT_TEXTS.length],
    date: new Date(Date.now() - (seed + i) * 3600000 * 6).toISOString(),
    likes: (seed * (i + 1) * 7) % 50,
  }));
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
      id: mockUuid(idx),
      title: TITLES[idx % TITLES.length],
      creator: pickRandom(CREATORS, idx),
      imageUrl: img.url,
      imageWidth: img.w,
      imageHeight: img.h,
      mediaType: idx % 3 === 1 ? "video" : "image",
      tags: pickTags(idx),
      likes: 10 + ((idx * 137) % 990),
      createdAt: new Date(Date.now() - idx * 3600000).toISOString(),
      prompt: PROMPTS[idx % PROMPTS.length],
      model: MODELS[idx % MODELS.length],
      comments: generateMockComments(idx),
    };
  });
}

/** Lazy UUID → index lookup map. */
let _uuidMap: Map<string, number> | null = null;
function getUuidMap(): Map<string, number> {
  if (!_uuidMap) {
    _uuidMap = new Map();
    for (let i = 0; i < MAX_MOCK_ITEMS; i++) _uuidMap.set(mockUuid(i), i);
  }
  return _uuidMap;
}

/** Look up a single mock item by its UUID id. */
export function getItemById(id: string): GalleryItem | undefined {
  const idx = getUuidMap().get(id);
  if (idx === undefined) return undefined;
  return generateMockItems(1, idx)[0];
}
