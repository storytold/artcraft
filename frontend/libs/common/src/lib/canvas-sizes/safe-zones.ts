// A safe zone is the part of an image that a platform's interface leaves
// visible. Its numbers stay in the units the platform publishes them in (a
// template's pixels, or percent), so each one can be checked against its
// source; the overlay scales them to the canvas. The built-in safe zones come
// from canvas-sizes.json, see canvas-size-library.ts.

export interface SafeZone {
  id: string;
  label: string;
  /** The exact aspect ratio a canvas needs for this safe zone to show. */
  ratio: Size;
  /** The units of `margins` and `covered`: a template's size in pixels, or 100 × 100 for percent. */
  frame: Size;
  /** How far the platform's interface reaches in from each edge. */
  margins: Margins;
  /** Areas inside the margins that the interface covers too, in a left-to-right layout. */
  covered: CanvasRect[];
  /**
   * Whether it flips for right-to-left languages, as the platform's interface
   * does (TikTok's Arabic templates are exact mirror images of its standard
   * ones). The user's own safe zones are entered as they see them, so they
   * don't flip.
   */
  mirrorsForRightToLeft: boolean;
  sourceUrl?: string;
}

export interface Size {
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Where a safe zone falls on a canvas, in canvas pixels. */
export interface SafeZoneGeometry {
  /** What the platform's interface covers, as rectangles that don't overlap. */
  covered: CanvasRect[];
  /** The edges of the area it leaves visible. */
  outline: Segment[];
}

/**
 * The safe zones that fit a `width` × `height` canvas: those whose ratio it has
 * exactly. Platform sizes are fixed, so there is no tolerance; integers are
 * compared crosswise to avoid floating-point equality.
 */
export function matchingSafeZones(
  zones: SafeZone[],
  width: number,
  height: number,
): SafeZone[] {
  return zones.filter(
    (zone) => width * zone.ratio.height === height * zone.ratio.width,
  );
}

/**
 * Where `zone` falls on a `width` × `height` canvas, in whole canvas pixels.
 * For a `rightToLeft` language it is mirrored if the zone says so.
 */
export function safeZoneGeometry(
  zone: SafeZone,
  width: number,
  height: number,
  rightToLeft = false,
): SafeZoneGeometry {
  const mirror = rightToLeft && zone.mirrorsForRightToLeft;
  const toCanvas = (rect: CanvasRect): CanvasRect => {
    const x0 = Math.round((rect.x / zone.frame.width) * width);
    const x1 = Math.round(((rect.x + rect.width) / zone.frame.width) * width);
    const y0 = Math.round((rect.y / zone.frame.height) * height);
    const y1 = Math.round(
      ((rect.y + rect.height) / zone.frame.height) * height,
    );
    const [left, right] = mirror ? [width - x1, width - x0] : [x0, x1];
    return { x: left, y: y0, width: right - left, height: y1 - y0 };
  };
  const { margins } = zone;
  const safeArea = toCanvas({
    x: margins.left,
    y: margins.top,
    width: zone.frame.width - margins.left - margins.right,
    height: zone.frame.height - margins.top - margins.bottom,
  });
  const blocked = zone.covered.map(toCanvas);

  // Cut the canvas into a grid along every edge, so each cell is either all
  // visible or all covered. Covered cells become the shading; edges between a
  // visible and a covered cell become the outline.
  const rects = [safeArea, ...blocked];
  const xs = gridLines(
    width,
    rects.flatMap((r) => [r.x, r.x + r.width]),
  );
  const ys = gridLines(
    height,
    rects.flatMap((r) => [r.y, r.y + r.height]),
  );
  const columns = xs.length - 1;
  const rows = ys.length - 1;
  const isVisible = (column: number, row: number): boolean => {
    if (column < 0 || row < 0 || column >= columns || row >= rows) {
      return false;
    }
    const x = (xs[column] + xs[column + 1]) / 2;
    const y = (ys[row] + ys[row + 1]) / 2;
    return contains(safeArea, x, y) && !blocked.some((r) => contains(r, x, y));
  };

  const covered = runs(
    rows,
    columns,
    (row, column) => !isVisible(column, row),
  ).map(({ line, from, to }) => ({
    x: xs[from],
    y: ys[line],
    width: xs[to] - xs[from],
    height: ys[line + 1] - ys[line],
  }));
  const verticalEdges = runs(
    xs.length,
    rows,
    (line, row) => isVisible(line - 1, row) !== isVisible(line, row),
  ).map(({ line, from, to }) => ({
    x1: xs[line],
    y1: ys[from],
    x2: xs[line],
    y2: ys[to],
  }));
  const horizontalEdges = runs(
    ys.length,
    columns,
    (line, column) => isVisible(column, line - 1) !== isVisible(column, line),
  ).map(({ line, from, to }) => ({
    x1: xs[from],
    y1: ys[line],
    x2: xs[to],
    y2: ys[line],
  }));

  return { covered, outline: [...verticalEdges, ...horizontalEdges] };
}

/** For each grid line, the stretches of consecutive cells where `matches` holds. */
function runs(
  lines: number,
  cells: number,
  matches: (line: number, cell: number) => boolean,
): { line: number; from: number; to: number }[] {
  const found: { line: number; from: number; to: number }[] = [];
  for (let line = 0; line < lines; line++) {
    let from: number | null = null;
    for (let cell = 0; cell <= cells; cell++) {
      const match = cell < cells && matches(line, cell);
      if (match && from === null) {
        from = cell;
      } else if (!match && from !== null) {
        found.push({ line, from, to: cell });
        from = null;
      }
    }
  }
  return found;
}

/** The sorted, distinct positions in `0..size`, including both ends. */
function gridLines(size: number, positions: number[]): number[] {
  const inside = positions.filter((p) => p > 0 && p < size);
  return [...new Set([0, size, ...inside])].sort((a, b) => a - b);
}

function contains(rect: CanvasRect, x: number, y: number): boolean {
  return (
    x > rect.x &&
    x < rect.x + rect.width &&
    y > rect.y &&
    y < rect.y + rect.height
  );
}
