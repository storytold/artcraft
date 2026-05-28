export const BACKGROUND_BLUR_INTENSITY_PRESETS: Array<{
  label: string;
  value: number;
}> = [
  { label: "Light", value: 100 },
  { label: "Medium", value: 200 },
  { label: "Heavy", value: 500 },
] as const;

export const DEFAULT_BACKGROUND_BLUR_INTENSITY = 10;
