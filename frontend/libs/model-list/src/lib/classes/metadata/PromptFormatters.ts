const ASPECT_RATIO_LABELS: Record<string, string> = {
  auto: "Auto",
  square: "Square",
  square_hd: "Square (HD)",
  wide: "Wide",
  tall: "Tall",
  wide_three_by_two: "3:2",
  wide_four_by_three: "4:3",
  wide_five_by_four: "5:4",
  wide_sixteen_by_nine: "16:9",
  wide_twenty_one_by_nine: "21:9",
  tall_two_by_three: "2:3",
  tall_three_by_four: "3:4",
  tall_four_by_five: "4:5",
  tall_nine_by_sixteen: "9:16",
  tall_nine_by_twenty_one: "9:21",
  auto_2k: "Auto (2K)",
  auto_3k: "Auto (3K)",
  auto_4k: "Auto (4K)",
};

const RESOLUTION_LABELS: Record<string, string> = {
  half_k: "0.5K",
  one_k: "1K",
  two_k: "2K",
  three_k: "3K",
  four_k: "4K",
  four_eighty_p: "480p",
  seven_twenty_p: "720p",
  ten_eighty_p: "1080p",
};

export const formatAspectRatio = (value: string): string =>
  ASPECT_RATIO_LABELS[value] ?? value;

export const formatResolution = (value: string): string =>
  RESOLUTION_LABELS[value] ?? value;

export const formatDuration = (seconds: number): string => `${seconds}s`;
