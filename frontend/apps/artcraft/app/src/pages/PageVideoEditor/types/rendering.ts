export interface Transform {
  scale: number;
  position: {
    x: number;
    y: number;
  };
  rotate: number;
}

export type BlendMode =
  | "normal"
  | "darken"
  | "multiply"
  | "color-burn"
  | "lighten"
  | "screen"
  | "plus-lighter"
  | "color-dodge"
  | "overlay"
  | "soft-light"
  | "hard-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";
