import { describe, expect, it } from "vitest";
import { drawCssBackground } from "./canvas";

// Spec for the canvas background painter. The editor's background presets are CSS strings, and the
// picker draws their swatches with real CSS, so the canvas painter has to land on the same
// geometry as CSS does or the project background will not match the swatch the user clicked.

type GradientCall = {
  kind: "linear" | "radial";
  args: number[];
  stops: Array<[number, string]>;
  // The transform stack the gradient was created under: translate then scale(1, y).
  translate: [number, number];
  scaleY: number;
};

// A canvas context that only records what the painter asks of it.
function recordingContext() {
  const gradients: GradientCall[] = [];
  let translate: [number, number] = [0, 0];
  let scaleY = 1;
  const saved: Array<{ translate: [number, number]; scaleY: number }> = [];
  const ctx = {
    fillStyle: "" as unknown,
    fillRect: () => undefined,
    save: () => saved.push({ translate, scaleY }),
    restore: () => {
      const top = saved.pop();
      if (top) {
        translate = top.translate;
        scaleY = top.scaleY;
      }
    },
    translate: (x: number, y: number) => {
      translate = [translate[0] + x, translate[1] + y];
    },
    scale: (_x: number, y: number) => {
      scaleY *= y;
    },
    createLinearGradient: (...args: number[]) => {
      const call: GradientCall = { kind: "linear", args, stops: [], translate, scaleY };
      gradients.push(call);
      return { addColorStop: (offset: number, color: string) => call.stops.push([offset, color]) };
    },
    createRadialGradient: (...args: number[]) => {
      const call: GradientCall = { kind: "radial", args, stops: [], translate, scaleY };
      gradients.push(call);
      return { addColorStop: (offset: number, color: string) => call.stops.push([offset, color]) };
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, gradients };
}

const WIDTH = 1920;
const HEIGHT = 1080;

// Paints `css` on a 1920x1080 canvas and returns the gradients it created, bottom layer first.
function paint(css: string, width = WIDTH, height = HEIGHT): GradientCall[] {
  const { ctx, gradients } = recordingContext();
  drawCssBackground({ ctx, width, height, css });
  return gradients;
}

// Horizontal and vertical radius of a painted radial gradient, and its centre.
function ellipseOf(call: GradientCall) {
  const radius = call.args[5];
  return { cx: call.translate[0], cy: call.translate[1], rx: radius, ry: radius * call.scaleY };
}

// How far (in ellipse units) the point sits from the centre: 1 means it lies on the ellipse.
function ellipseDistance(call: GradientCall, x: number, y: number): number {
  const { cx, cy, rx, ry } = ellipseOf(call);
  return Math.hypot((x - cx) / rx, (y - cy) / ry);
}

describe("drawCssBackground linear gradients", () => {
  it("runs `to right` across the whole width", () => {
    const [gradient] = paint("linear-gradient(to right, #000000, #ffffff)");
    // Compared with a tolerance: the vertical component comes from cos(90deg), which is not exactly 0.
    const expected = [0, 540, 1920, 540];
    gradient.args.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 5));
    expect(gradient.stops).toEqual([[0, "#000000"], [1, "#ffffff"]]);
  });

  it("sizes an angled line so the corners get the end colours", () => {
    const [gradient] = paint("linear-gradient(135deg, #111111 0%, #222222 50%, #333333 100%)");
    const [x0, y0, x1, y1] = gradient.args;
    expect(x0).toBeCloseTo(210, 5);
    expect(y0).toBeCloseTo(-210, 5);
    expect(x1).toBeCloseTo(1710, 5);
    expect(y1).toBeCloseTo(1290, 5);
  });

  it("paints the first CSS layer last so it ends up on top", () => {
    const gradients = paint("linear-gradient(to right, #aaaaaa, #bbbbbb), linear-gradient(to bottom, #cccccc, #dddddd)");
    expect(gradients.map((gradient) => gradient.stops[0][1])).toEqual(["#cccccc", "#aaaaaa"]);
  });

  it("runs `to top` from the bottom edge to the top edge", () => {
    const [gradient] = paint("linear-gradient(to top, #111111, #222222)");
    const [x0, y0, x1, y1] = gradient.args;
    expect(x0).toBeCloseTo(960, 5);
    expect(y0).toBeCloseTo(1080, 5);
    expect(x1).toBeCloseTo(960, 5);
    expect(y1).toBeCloseTo(0, 5);
  });

  it("runs `to bottom right` along the 135deg diagonal", () => {
    const [gradient] = paint("linear-gradient(to bottom right, #111111, #222222)");
    const [x0, y0, x1, y1] = gradient.args;
    expect(x0).toBeCloseTo(210, 5);
    expect(y0).toBeCloseTo(-210, 5);
    expect(x1).toBeCloseTo(1710, 5);
    expect(y1).toBeCloseTo(1290, 5);
  });
});

describe("drawCssBackground radial gradients", () => {
  it("sizes a circle to the farthest corner", () => {
    const [gradient] = paint("radial-gradient(circle at top right, #ff0000, #0000ff)");
    expect(gradient.args.slice(0, 5)).toEqual([1920, 0, 0, 1920, 0]);
    expect(gradient.args[5]).toBeCloseTo(Math.hypot(1920, 1080), 5);
  });

  it("uses the given percentages as the radii of an explicit ellipse", () => {
    const [gradient] = paint("radial-gradient(ellipse 85% 65% at 8% 8%, #ff0000, #0000ff)");
    const { cx, cy, rx, ry } = ellipseOf(gradient);
    expect(cx).toBeCloseTo(153.6, 5);
    expect(cy).toBeCloseTo(86.4, 5);
    expect(rx).toBeCloseTo(1632, 5);
    expect(ry).toBeCloseTo(702, 5);
  });

  it("makes a default ellipse pass through the farthest corner", () => {
    // Centre (384, 324): the farthest corner is (1920, 1080). CSS keeps the aspect ratio of the
    // farthest-side ellipse and grows it until it touches that corner.
    const [gradient] = paint("radial-gradient(ellipse at 20% 30%, #ff0000, #0000ff)");
    expect(ellipseDistance(gradient, 1920, 1080)).toBeCloseTo(1, 5);
    const { rx, ry } = ellipseOf(gradient);
    expect(rx / ry).toBeCloseTo(1536 / 756, 5);
  });

  it("makes a radial gradient with no shape or size pass through the farthest corner", () => {
    const [gradient] = paint("radial-gradient(#ff0000, #0000ff)");
    expect(ellipseDistance(gradient, 0, 0)).toBeCloseTo(1, 5);
    expect(ellipseDistance(gradient, 1920, 1080)).toBeCloseTo(1, 5);
  });

  it("makes a closest-corner ellipse pass through the nearest corner", () => {
    // Centre (384, 324): the nearest corner is (0, 0) and the closest-side ellipse is 384 x 324.
    const [gradient] = paint("radial-gradient(ellipse closest-corner at 20% 30%, #ff0000, #0000ff)");
    expect(ellipseDistance(gradient, 0, 0)).toBeCloseTo(1, 5);
    const { rx, ry } = ellipseOf(gradient);
    expect(rx / ry).toBeCloseTo(384 / 324, 5);
  });

  it("keeps farthest-side ellipses at the side distances", () => {
    const [gradient] = paint("radial-gradient(ellipse farthest-side at 20% 30%, #ff0000, #0000ff)");
    const { rx, ry } = ellipseOf(gradient);
    expect(rx).toBeCloseTo(1536, 5);
    expect(ry).toBeCloseTo(756, 5);
  });

  it("measures pixel stops along the horizontal radius of a tall ellipse", () => {
    // 30% x 80% on 1920x1080 is 576 wide and 864 tall. The gradient ray runs along the width, so
    // a stop at 100px sits 100/576 of the way out, not 100/864.
    const [gradient] = paint("radial-gradient(ellipse 30% 80% at 50% 50%, #ff0000 0px, #0000ff 100px)");
    expect(gradient.stops[1][0]).toBeCloseTo(100 / 576, 5);
  });

  it("measures pixel stops against the radius of a circle", () => {
    const [gradient] = paint("radial-gradient(circle 200px at 50% 50%, #ff0000 0px, #0000ff 100px)");
    expect(gradient.stops[1][0]).toBeCloseTo(0.5, 5);
  });

  it("fades `transparent` stops from the neighbouring colour instead of through black", () => {
    const [gradient] = paint("radial-gradient(circle at center, rgba(173, 216, 230, 0.35), transparent 60%)");
    expect(gradient.stops).toEqual([[0, "rgba(173,216,230,0.35)"], [0.6, "rgba(173,216,230,0)"]]);
  });
});
