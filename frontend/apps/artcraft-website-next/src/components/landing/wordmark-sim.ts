// Wordmark ball field: the brand name rasterized to a mask, then filled with
// small 3D balls by multi-pass dart throwing — big balls land first, smaller
// ones settle into the gaps, like a pile that collided into the letter shape
// (a faked impression, not a physics solve; it must run on laptops/phones).
// The balls separate under the cursor's push and rejoin on their home
// springs; a 3D collision pass keeps them from intersecting.
//
// Units are CSS pixels at the text's z=0 plane — the camera is fitted so one
// world unit projects to one pixel there, which keeps pointer math trivial.

export type Ball = {
  x: number;
  y: number;
  z: number;
  r: number;
};

export type SampledWordmark = {
  balls: Ball[];
  width: number;
  height: number;
};

// All knobs of the arrangement — registered with the dev tuner in
// hero-tunables.ts. Size factors are multiples of `spacing`.
export type FormationParams = {
  sizeMin: number;
  sizeMax: number;
  sizeNoiseScale: number; // px wavelength of the size clusters
  sizeRoughen: number;    // 0..1 per-ball white-noise contribution
  gap: number;            // px clearance between resting balls
  depth: number;          // slab thickness, × spacing
  density: number;        // dart-attempt multiplier
  edgeMargin: number;     // 0..1 — how far inside the stroke big balls stay
  seed: number;
};

// ————————————————————————————— sampling —————————————————————————————

export function sampleWordmark(opts: {
  text: string;
  fontFamily: string;
  fontWeight: number;
  targetWidth: number;
  /** Base unit in px — ball sizes and slab depth scale from this. */
  spacing: number;
  formation: FormationParams;
}): SampledWordmark {
  const { text, fontFamily, fontWeight, targetWidth, spacing, formation } =
    opts;

  // Each glyph is measured and drawn individually with a small manual gap:
  // no shaping ever runs across letters, so the font can't fuse tight pairs
  // ("ft") into a ligature that would blob together once quantized to balls.
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const glyphs = [...text];
  const GAP_EM = 0.05;

  ctx.font = `${fontWeight} 100px ${fontFamily}`;
  const width100 = glyphs.reduce((w, g) => w + ctx.measureText(g).width, 0)
    + 100 * GAP_EM * (glyphs.length - 1);
  const fontPx = (100 * targetWidth) / Math.max(1, width100);
  const gapPx = fontPx * GAP_EM;

  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  let ascent = 0;
  let descent = 0;
  for (const g of glyphs) {
    const m = ctx.measureText(g);
    ascent = Math.max(ascent, m.actualBoundingBoxAscent);
    descent = Math.max(descent, m.actualBoundingBoxDescent);
  }

  const pad = spacing;
  const width = Math.ceil(targetWidth + pad * 2);
  const height = Math.ceil(ascent + descent + pad * 2);
  canvas.width = width;
  canvas.height = height;
  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  ctx.fillStyle = "#fff";
  let penX = pad;
  for (const g of glyphs) {
    ctx.fillText(g, penX, pad + ascent);
    penX += ctx.measureText(g).width + gapPx;
  }
  const alpha = ctx.getImageData(0, 0, width, height).data;
  const covered = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return alpha[(y * width + x) * 4 + 3] > 127;
  };

  // Fast "random point inside the ink" sampling: collect covered pixels on a
  // coarse stride once, then darts pick from that list with subpixel jitter.
  const inkCells: number[] = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (covered(x, y)) inkCells.push(y * width + x);
    }
  }
  if (!inkCells.length) return { balls: [], width, height };

  const rand = mulberry32(formation.seed);
  const sizeNoise = makeValueNoise(formation.seed + 41);
  const rMin = spacing * formation.sizeMin;
  const rMax = spacing * formation.sizeMax;
  const halfDepth = (spacing * formation.depth) / 2;

  // Organic sizing: smooth spatial noise drifts the size in clusters across
  // the word; white noise roughens it per ball.
  const desiredRadius = (x: number, y: number) => {
    const n = Math.pow(
      sizeNoise(x / formation.sizeNoiseScale, y / formation.sizeNoiseScale),
      1.15,
    );
    const roughened =
      n * (1 - formation.sizeRoughen) + rand() * formation.sizeRoughen;
    return rMin + (rMax - rMin) * roughened;
  };

  // A ball only counts as "inside the letter" if its center plus four cross
  // points at ~edgeMargin·r are on ink — big balls stay inside the strokes,
  // small ones may nestle right up to the edge, keeping letterforms crisp.
  const insideStroke = (x: number, y: number, r: number) => {
    const m = r * formation.edgeMargin;
    return (
      covered(Math.round(x), Math.round(y)) &&
      covered(Math.round(x + m), Math.round(y)) &&
      covered(Math.round(x - m), Math.round(y)) &&
      covered(Math.round(x), Math.round(y + m)) &&
      covered(Math.round(x), Math.round(y - m))
    );
  };

  // Dart throwing with a 3D hash for overlap rejection. Three passes with a
  // descending size floor: the big balls claim their spots first and the
  // smaller ones settle into the leftover gaps — the arrangement reads like
  // a settled pile instead of a grid.
  const balls: Ball[] = [];
  const cell = rMax * 2 + formation.gap;
  const grid = new Map<number, number[]>();
  const key = (x: number, y: number, z: number) =>
    (Math.floor(x / cell) * 73856093) ^
    (Math.floor(y / cell) * 19349663) ^
    (Math.floor(z / cell) * 83492791);

  const fits = (x: number, y: number, z: number, r: number) => {
    for (let gz = -1; gz <= 1; gz++) {
      for (let gy = -1; gy <= 1; gy++) {
        for (let gx = -1; gx <= 1; gx++) {
          const bucket = grid.get(
            key(x + gx * cell, y + gy * cell, z + gz * cell),
          );
          if (!bucket) continue;
          for (const j of bucket) {
            const o = balls[j];
            const dx = o.x - x;
            const dy = o.y - y;
            const dz = o.z - z;
            const min = o.r + r + formation.gap;
            if (dx * dx + dy * dy + dz * dz < min * min) return false;
          }
        }
      }
    }
    return true;
  };

  const passes = [0.7, 0.35, 0]; // descending floor on the size range
  const attemptsPerPass = Math.floor(
    inkCells.length * 0.9 * formation.density,
  );
  for (const floor of passes) {
    for (let a = 0; a < attemptsPerPass; a++) {
      const c = inkCells[(rand() * inkCells.length) | 0];
      const x = (c % width) + rand() * 2 - 1;
      const y = Math.floor(c / width) + rand() * 2 - 1;
      const z = (rand() * 2 - 1) * halfDepth;
      let r = desiredRadius(x, y);
      const passMin = rMin + (rMax - rMin) * floor;
      if (r < passMin) r = passMin + (r - rMin) * 0.2;
      if (!insideStroke(x, y, r)) continue;
      if (!fits(x, y, z, r)) continue;
      balls.push({ x, y, z, r });
      const k = key(x, y, z);
      const bucket = grid.get(k);
      if (bucket) bucket.push(balls.length - 1);
      else grid.set(k, [balls.length - 1]);
    }
  }

  return { balls, width, height };
}

// Deterministic bilinear value noise, 0..1 — smooth variation across space.
function makeValueNoise(seed: number): (x: number, y: number) => number {
  const hash = (ix: number, iy: number) => {
    let h = ix * 374761393 + iy * 668265263 + seed * 2246822519;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ————————————————————————————— simulation —————————————————————————————

export type SimParams = {
  spring: number;       // pull toward home, 1/s²
  damping: number;      // exponential velocity decay, 1/s
  pushRadius: number;   // cursor influence radius, px
  pushStrength: number; // px/s² at cursor center
  swirl: number;        // tangential (xy) fraction of the push
  popZ: number;         // fraction of the push biased toward the viewer
  bobAmp: number;       // idle breathing amplitude, px
};

export const DEFAULT_PARAMS: SimParams = {
  spring: 46,
  damping: 5.2,
  pushRadius: 180,
  pushStrength: 23000,
  swirl: 0.55,
  popZ: 0.6,
  bobAmp: 1.4,
};

export class WordmarkSim {
  readonly n: number;
  readonly r: Float32Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  private readonly hx: Float32Array;
  private readonly hy: Float32Array;
  private readonly hz: Float32Array;
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly vz: Float32Array;
  private readonly phase: Float32Array;
  private readonly cell: number;
  private readonly grid = new Map<number, number[]>();
  private time = 0;

  // Balls are handed over in raster coordinates; homes are re-centered so the
  // wordmark sits centered on the origin. Live positions start scattered in a
  // loose shell so the mount plays an "assemble" — the balls fly in and join.
  constructor(sample: SampledWordmark, scatter = 480) {
    const { balls, width, height } = sample;
    this.n = balls.length;
    this.r = new Float32Array(this.n);
    this.x = new Float32Array(this.n);
    this.y = new Float32Array(this.n);
    this.z = new Float32Array(this.n);
    this.hx = new Float32Array(this.n);
    this.hy = new Float32Array(this.n);
    this.hz = new Float32Array(this.n);
    this.vx = new Float32Array(this.n);
    this.vy = new Float32Array(this.n);
    this.vz = new Float32Array(this.n);
    this.phase = new Float32Array(this.n);

    let rMax = 1;
    const rand = mulberry32(7177);
    for (let i = 0; i < this.n; i++) {
      const b = balls[i];
      this.hx[i] = b.x - width / 2;
      this.hy[i] = -(b.y - height / 2);
      this.hz[i] = b.z;
      const dir = randomUnit(rand);
      const dist = scatter * (0.55 + rand() * 0.9);
      this.x[i] = this.hx[i] + dir[0] * dist;
      this.y[i] = this.hy[i] + dir[1] * dist * 0.7;
      this.z[i] = this.hz[i] + dir[2] * dist * 0.55;
      this.r[i] = b.r;
      if (b.r > rMax) rMax = b.r;
      this.phase[i] = (i * 2.399963) % (Math.PI * 2);
    }
    this.cell = rMax * 2 + 2;
  }

  step(
    dt: number,
    pointerX: number,
    pointerY: number,
    pointerActive: boolean,
    params: SimParams = DEFAULT_PARAMS,
  ) {
    const clamped = Math.min(dt, 1 / 30);
    this.time += clamped;
    const { spring, damping, pushRadius, pushStrength, swirl, popZ, bobAmp } =
      params;
    const decay = Math.exp(-damping * clamped);
    const t = this.time;

    for (let i = 0; i < this.n; i++) {
      const bob = bobAmp;
      const homeX = this.hx[i] + Math.sin(t * 0.9 + this.phase[i]) * bob;
      const homeY = this.hy[i] + Math.cos(t * 0.7 + this.phase[i] * 1.7) * bob;
      const homeZ = this.hz[i] + Math.sin(t * 0.8 + this.phase[i] * 2.3) * bob;
      let fx = (homeX - this.x[i]) * spring;
      let fy = (homeY - this.y[i]) * spring;
      let fz = (homeZ - this.z[i]) * spring;

      if (pointerActive) {
        // The cursor lives on the z=0 plane; distance is measured in 3D so
        // front-layer balls feel it sooner than back-layer ones.
        const dx = this.x[i] - pointerX;
        const dy = this.y[i] - pointerY;
        const dz = this.z[i];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < pushRadius) {
          const f = 1 - dist / pushRadius;
          const inv = dist > 1e-4 ? 1 / dist : 0;
          const nx = dx * inv;
          const ny = dy * inv;
          const nz = dz * inv;
          const s = f * f * pushStrength;
          fx += (nx + -ny * swirl) * s;
          fy += (ny + nx * swirl) * s;
          // Radial z plus a toward-the-viewer bias: the crowd parts *and*
          // pops out of the page instead of only sliding sideways.
          fz += (nz + popZ) * s * 0.55;
        }
      }

      this.vx[i] = this.vx[i] * decay + fx * clamped;
      this.vy[i] = this.vy[i] * decay + fy * clamped;
      this.vz[i] = this.vz[i] * decay + fz * clamped;
      this.x[i] += this.vx[i] * clamped;
      this.y[i] += this.vy[i] * clamped;
      this.z[i] += this.vz[i] * clamped;
    }

    this.resolveCollisions();
  }

  // One positional-relaxation pass over a 3D spatial hash. The rest pose is
  // already gap-free by construction; this keeps shoved balls from tunneling
  // through neighbors, which is what makes them read as solid.
  private resolveCollisions() {
    const { grid, cell } = this;
    grid.clear();
    const key = (x: number, y: number, z: number) =>
      (Math.floor(x / cell) * 73856093) ^
      (Math.floor(y / cell) * 19349663) ^
      (Math.floor(z / cell) * 83492791);

    for (let i = 0; i < this.n; i++) {
      const k = key(this.x[i], this.y[i], this.z[i]);
      const bucket = grid.get(k);
      if (bucket) bucket.push(i);
      else grid.set(k, [i]);
    }

    for (let i = 0; i < this.n; i++) {
      for (let gz = -1; gz <= 1; gz++) {
        for (let gy = -1; gy <= 1; gy++) {
          for (let gx = -1; gx <= 1; gx++) {
            const bucket = grid.get(
              key(
                this.x[i] + gx * cell,
                this.y[i] + gy * cell,
                this.z[i] + gz * cell,
              ),
            );
            if (!bucket) continue;
            for (const j of bucket) {
              if (j <= i) continue;
              const dx = this.x[j] - this.x[i];
              const dy = this.y[j] - this.y[i];
              const dz = this.z[j] - this.z[i];
              const minDist = this.r[i] + this.r[j] + 0.4;
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 >= minDist * minDist || d2 < 1e-6) continue;
              const d = Math.sqrt(d2);
              const push = (minDist - d) / d;
              const px = dx * push * 0.5;
              const py = dy * push * 0.5;
              const pz = dz * push * 0.5;
              this.x[i] -= px;
              this.y[i] -= py;
              this.z[i] -= pz;
              this.x[j] += px;
              this.y[j] += py;
              this.z[j] += pz;
              const nx = dx / d;
              const ny = dy / d;
              const nz = dz / d;
              const rel =
                (this.vx[j] - this.vx[i]) * nx +
                (this.vy[j] - this.vy[i]) * ny +
                (this.vz[j] - this.vz[i]) * nz;
              if (rel < 0) {
                const imp = rel * 0.5;
                this.vx[i] += nx * imp;
                this.vy[i] += ny * imp;
                this.vz[i] += nz * imp;
                this.vx[j] -= nx * imp;
                this.vy[j] -= ny * imp;
                this.vz[j] -= nz * imp;
              }
            }
          }
        }
      }
    }
  }
}

function randomUnit(rand: () => number): [number, number, number] {
  const theta = rand() * Math.PI * 2;
  const cosPhi = rand() * 2 - 1;
  const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
  return [Math.cos(theta) * sinPhi, Math.sin(theta) * sinPhi, cosPhi];
}
