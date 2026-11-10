const RATIOS: Record<string, readonly [number, number]> = {
  square: [1, 1], square_hd: [1, 1],
  wide: [4, 3], tall: [3, 4],
  wide_five_by_four: [5, 4], tall_four_by_five: [4, 5],
  wide_four_by_three: [4, 3], tall_three_by_four: [3, 4],
  wide_three_by_two: [3, 2], tall_two_by_three: [2, 3],
  wide_sixteen_by_nine: [16, 9], tall_nine_by_sixteen: [9, 16],
  wide_twenty_one_by_nine: [21, 9], tall_nine_by_twenty_one: [9, 21],
};

export function outputDimensions(source: { width: number; height: number }, ratio?: string) {
  const dimensions = ratio && Object.hasOwn(RATIOS, ratio) ? RATIOS[ratio] : undefined;
  if (!dimensions) return source;
  const [width, height] = dimensions;
  const longest = Math.max(source.width, source.height);
  return {
    width: Math.max(1, Math.round(longest * width / Math.max(width, height))),
    height: Math.max(1, Math.round(longest * height / Math.max(width, height))),
  };
}
