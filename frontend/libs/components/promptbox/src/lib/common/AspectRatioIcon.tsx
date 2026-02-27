import { CommonAspectRatio } from "@storyteller/model-list";
import { SizeIconOption } from "@storyteller/model-list";

/**
 * Renders a proportionally-sized rounded rectangle SVG icon
 * that visually represents the actual shape of an aspect ratio.
 *
 * Supports three input modes:
 *   - `ratio` — raw [width, height] tuple
 *   - `commonAspectRatio` — CommonAspectRatio enum (image models)
 *   - `sizeIcon` — SizeIconOption enum (video models)
 */
export const AspectRatioIcon = ({
  ratio,
  commonAspectRatio,
  sizeIcon,
  size = 16,
}: {
  ratio?: [number, number];
  commonAspectRatio?: CommonAspectRatio;
  sizeIcon?: SizeIconOption;
  size?: number;
}) => {
  let rw: number;
  let rh: number;

  if (ratio) {
    [rw, rh] = ratio;
  } else if (commonAspectRatio !== undefined) {
    [rw, rh] = commonAspectRatioToProportions(commonAspectRatio);
  } else if (sizeIcon !== undefined) {
    [rw, rh] = sizeIconToProportions(sizeIcon);
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

// "Auto" icon — magic wand sparkle, kept as SVG to avoid FontAwesome dependency
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

function commonAspectRatioToProportions(
  ratio: CommonAspectRatio,
): [number, number] {
  switch (ratio) {
    // Square
    case CommonAspectRatio.Square:
    case CommonAspectRatio.SquareHd:
      return [1, 1];

    // Wide
    case CommonAspectRatio.Wide:
      return [16, 10];
    case CommonAspectRatio.WideFiveByFour:
      return [5, 4];
    case CommonAspectRatio.WideFourByThree:
      return [4, 3];
    case CommonAspectRatio.WideThreeByTwo:
      return [3, 2];
    case CommonAspectRatio.WideSixteenByNine:
      return [16, 9];
    case CommonAspectRatio.WideTwentyOneByNine:
      return [21, 9];

    // Tall
    case CommonAspectRatio.Tall:
      return [10, 16];
    case CommonAspectRatio.TallFourByFive:
      return [4, 5];
    case CommonAspectRatio.TallThreeByFour:
      return [3, 4];
    case CommonAspectRatio.TallTwoByThree:
      return [2, 3];
    case CommonAspectRatio.TallNineBySixteen:
      return [9, 16];
    case CommonAspectRatio.TallNineByTwentyOne:
      return [9, 21];

    // Auto
    case CommonAspectRatio.Auto:
    case CommonAspectRatio.Auto2k:
    case CommonAspectRatio.Auto4k:
      return [1, 1]; // fallback, Auto uses the sparkle icon instead

    default:
      return [1, 1];
  }
}

function sizeIconToProportions(icon: SizeIconOption): [number, number] {
  switch (icon) {
    case SizeIconOption.Landscape16x9:
      return [16, 9];
    case SizeIconOption.Landscape:
      return [16, 10];
    case SizeIconOption.Standard4x3:
      return [4, 3];
    case SizeIconOption.Square:
      return [1, 1];
    case SizeIconOption.Portrait3x4:
      return [3, 4];
    case SizeIconOption.Portrait:
      return [10, 16];
    case SizeIconOption.Portrait9x16:
      return [9, 16];
    default:
      return [16, 10];
  }
}
