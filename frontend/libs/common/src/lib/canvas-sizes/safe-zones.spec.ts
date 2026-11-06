import { BUILT_IN_SAFE_ZONES } from "./canvas-size-library";
import {
  matchingSafeZones,
  safeZoneGeometry,
  type SafeZone,
  type SafeZoneGeometry,
} from "./safe-zones";

describe("matchingSafeZones", () => {
  it("offers every 9:16 safe zone for platform-sized 9:16 canvases", () => {
    const ids = [
      "meta-stories-reels",
      "tiktok-in-feed",
      "tiktok-in-feed-anchor",
    ];
    expect(matchingIds(1440, 2560)).toEqual(ids);
    expect(matchingIds(1080, 1920)).toEqual(ids);
  });

  it("offers the channel banner for 16:9 canvases", () => {
    expect(matchingIds(2560, 1440)).toEqual(["youtube-channel-banner"]);
  });

  it("needs the exact ratio", () => {
    expect(matchingIds(1024, 1792)).toEqual([]); // 4:7, 1.6% wider than 9:16
    expect(matchingIds(1080, 1919)).toEqual([]);
    expect(matchingIds(1080, 1350)).toEqual([]);
    expect(matchingIds(1080, 1080)).toEqual([]);
  });
});

describe("safeZoneGeometry", () => {
  describe("TikTok", () => {
    it("covers the margins and the button column at 1080 × 1920", () => {
      const geometry = safeZoneGeometry(zone("tiktok-in-feed"), 1080, 1920);

      expect(coveredAt(geometry, 540, 239)).toBe(true);
      expect(coveredAt(geometry, 540, 240)).toBe(false);
      expect(coveredAt(geometry, 540, 1259)).toBe(false);
      expect(coveredAt(geometry, 540, 1260)).toBe(true);
      expect(coveredAt(geometry, 119, 500)).toBe(true);
      expect(coveredAt(geometry, 120, 500)).toBe(false);
      expect(coveredAt(geometry, 959, 500)).toBe(false);
      expect(coveredAt(geometry, 960, 500)).toBe(true);
      // The like, comment and share buttons, from y 840 down.
      expect(coveredAt(geometry, 779, 1000)).toBe(false);
      expect(coveredAt(geometry, 780, 1000)).toBe(true);
      expect(coveredAt(geometry, 900, 839)).toBe(false);
      expect(coveredAt(geometry, 900, 840)).toBe(true);
    });

    it("outlines the notched safe area with six edges", () => {
      const { outline } = safeZoneGeometry(zone("tiktok-in-feed"), 1080, 1920);

      expect(outline).toEqual([
        { x1: 120, y1: 240, x2: 120, y2: 1260 },
        { x1: 780, y1: 840, x2: 780, y2: 1260 },
        { x1: 960, y1: 240, x2: 960, y2: 840 },
        { x1: 120, y1: 240, x2: 960, y2: 240 },
        { x1: 780, y1: 840, x2: 960, y2: 840 },
        { x1: 120, y1: 1260, x2: 780, y2: 1260 },
      ]);
    });

    it("moves the button column to the left for right-to-left languages", () => {
      const geometry = safeZoneGeometry(
        zone("tiktok-in-feed"),
        1080,
        1920,
        true,
      );

      expect(coveredAt(geometry, 299, 1000)).toBe(true);
      expect(coveredAt(geometry, 300, 1000)).toBe(false);
      expect(coveredAt(geometry, 800, 1000)).toBe(false);
      expect(coveredAt(geometry, 960, 1000)).toBe(true);
    });

    it("leaves more room at the bottom for ads with a product link", () => {
      const geometry = safeZoneGeometry(
        zone("tiktok-in-feed-anchor"),
        1080,
        1920,
      );

      expect(coveredAt(geometry, 540, 251)).toBe(true);
      expect(coveredAt(geometry, 540, 252)).toBe(false);
      expect(coveredAt(geometry, 540, 1107)).toBe(false);
      expect(coveredAt(geometry, 540, 1108)).toBe(true);
      expect(coveredAt(geometry, 839, 400)).toBe(false);
      expect(coveredAt(geometry, 840, 400)).toBe(true);
      expect(coveredAt(geometry, 900, 399)).toBe(false);
    });
  });

  it("keeps the user's own safe zones as they were entered", () => {
    const own: SafeZone = {
      id: "custom-1-safe-zone-1",
      label: "Sticker",
      ratio: { width: 1, height: 1 },
      frame: { width: 1000, height: 1000 },
      margins: { top: 0, right: 0, bottom: 0, left: 300 },
      covered: [],
      mirrorsForRightToLeft: false,
    };
    const geometry = safeZoneGeometry(own, 1000, 1000, true);

    expect(coveredAt(geometry, 299, 500)).toBe(true);
    expect(coveredAt(geometry, 999, 500)).toBe(false);
  });

  it("scales Meta's percentages to the canvas", () => {
    const geometry = safeZoneGeometry(zone("meta-stories-reels"), 1440, 2560);

    expect(coveredAt(geometry, 720, 357)).toBe(true); // 14% of 2560 is 358.4
    expect(coveredAt(geometry, 720, 358)).toBe(false);
    expect(coveredAt(geometry, 720, 1663)).toBe(false); // 35% is 896 from the bottom
    expect(coveredAt(geometry, 720, 1664)).toBe(true);
    expect(coveredAt(geometry, 85, 1000)).toBe(true); // 6% of 1440 is 86.4
    expect(coveredAt(geometry, 86, 1000)).toBe(false);
  });

  it("centres YouTube's 1235 × 338 banner area at full size", () => {
    const { outline } = safeZoneGeometry(
      zone("youtube-channel-banner"),
      2560,
      1440,
    );

    expect(outline).toEqual([
      { x1: 508, y1: 509, x2: 508, y2: 931 },
      { x1: 2052, y1: 509, x2: 2052, y2: 931 },
      { x1: 508, y1: 509, x2: 2052, y2: 509 },
      { x1: 508, y1: 931, x2: 2052, y2: 931 },
    ]);
  });

  it("shades each covered pixel once", () => {
    const { covered } = safeZoneGeometry(zone("tiktok-in-feed"), 1080, 1920);
    const shaded = covered.reduce((sum, r) => sum + r.width * r.height, 0);
    const visible = 840 * 1020 - 180 * 420;

    expect(shaded).toBe(1080 * 1920 - visible);
  });
});

function matchingIds(width: number, height: number): string[] {
  return matchingSafeZones(BUILT_IN_SAFE_ZONES, width, height).map((z) => z.id);
}

function zone(id: string): SafeZone {
  const found = BUILT_IN_SAFE_ZONES.find((z) => z.id === id);
  if (!found) {
    throw new Error(`No built-in safe zone ${id}`);
  }
  return found;
}

/** Whether the pixel whose top-left corner is (x, y) is shaded. */
function coveredAt(geometry: SafeZoneGeometry, x: number, y: number): boolean {
  const cx = x + 0.5;
  const cy = y + 0.5;
  return geometry.covered.some(
    (r) => cx > r.x && cx < r.x + r.width && cy > r.y && cy < r.y + r.height,
  );
}
