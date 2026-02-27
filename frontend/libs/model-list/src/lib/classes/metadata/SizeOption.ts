
export enum SizeIconOption {
  Landscape,
  Portrait,
  Square,
  Landscape16x9,
  Portrait9x16,
  Standard4x3,
  Portrait3x4,
}

export interface SizeOption {
  textLabel: string;
  tauriValue: string;
  icon: SizeIconOption;
}