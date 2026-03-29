export const AspectRatioIcon = ({
  ratio,
  commonAspectRatio,
  size = 16,
}: {
  ratio?: [number, number];
  commonAspectRatio?: string;
  size?: number;
}) => {
  let rw: number;
  let rh: number;

  if (ratio) {
    [rw, rh] = ratio;
  } else if (commonAspectRatio !== undefined) {
    [rw, rh] = aspectRatioStringToProportions(commonAspectRatio);
  } else {
    [rw, rh] = [16, 10];
  }

  const scale = (size - 2) / Math.max(rw, rh);
  const w = Math.round(rw * scale);
  const h = Math.round(rh * scale);
  const x = (size - w) / 2;
  const y = (size - h) / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={1.5}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
};

export const AutoIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 1l1.2 3.3L12.5 5.5l-3.3 1.2L8 10l-1.2-3.3L3.5 5.5l3.3-1.2L8 1z"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
    <path
      d="M12 9l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7L9.7 11.3l1.7-.6L12 9z"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="round"
    />
  </svg>
);

const ASPECT_RATIO_PROPORTIONS: Record<string, [number, number]> = {
  square: [1, 1],
  square_hd: [1, 1],
  wide: [16, 10],
  wide_five_by_four: [5, 4],
  wide_four_by_three: [4, 3],
  wide_three_by_two: [3, 2],
  wide_sixteen_by_nine: [16, 9],
  wide_twenty_one_by_nine: [21, 9],
  tall: [10, 16],
  tall_four_by_five: [4, 5],
  tall_three_by_four: [3, 4],
  tall_two_by_three: [2, 3],
  tall_nine_by_sixteen: [9, 16],
  tall_nine_by_twenty_one: [9, 21],
  auto: [1, 1],
  auto_2k: [1, 1],
  auto_4k: [1, 1],
};

function aspectRatioStringToProportions(ratio: string): [number, number] {
  return ASPECT_RATIO_PROPORTIONS[ratio] ?? [1, 1];
}
