import type { ImageModel } from "./ImageModel.js";
import { CommonAspectRatio } from "./properties/CommonAspectRatio.js";

// Options that leave the shape to the model, which works it out from the input
// image. The `auto_*` variants also fix a resolution (Seedream), so plain
// `auto` wins when a model offers both.
const AUTO_ASPECT_RATIOS = [
  CommonAspectRatio.Auto,
  CommonAspectRatio.Auto2k,
  CommonAspectRatio.Auto3k,
  CommonAspectRatio.Auto4k,
];

// Models that can change aspect ratio but do not say which ones they accept.
// These are the values the image editor has always sent.
const LEGACY_ASPECT_RATIOS = [
  CommonAspectRatio.Square,
  CommonAspectRatio.Wide,
  CommonAspectRatio.Tall,
];

// width / height of every option that names a fixed shape. `auto*` and values
// from a newer server than this build have no entry, so they are never chosen
// by closeness.
const ASPECT_RATIO_SHAPES: Partial<Record<CommonAspectRatio, number>> = {
  [CommonAspectRatio.Square]: 1,
  [CommonAspectRatio.SquareHd]: 1,

  [CommonAspectRatio.WideFiveByFour]: 5 / 4,
  [CommonAspectRatio.WideFourByThree]: 4 / 3,
  [CommonAspectRatio.WideThreeByTwo]: 3 / 2,
  [CommonAspectRatio.WideSixteenByNine]: 16 / 9,
  [CommonAspectRatio.WideTwentyOneByNine]: 21 / 9,

  [CommonAspectRatio.TallFourByFive]: 4 / 5,
  [CommonAspectRatio.TallThreeByFour]: 3 / 4,
  [CommonAspectRatio.TallTwoByThree]: 2 / 3,
  [CommonAspectRatio.TallNineBySixteen]: 9 / 16,
  [CommonAspectRatio.TallNineByTwentyOne]: 9 / 21,

  // Imprecise labels whose exact shape varies by model (4:3 to 16:9); 3:2 and
  // 2:3 are the middle.
  [CommonAspectRatio.Wide]: 3 / 2,
  [CommonAspectRatio.Tall]: 2 / 3,
};

type ModelAspectRatios = Pick<ImageModel, "canChangeAspectRatio" | "aspectRatios">;

/**
 * The aspect ratio to request so an edit keeps the shape of its source image.
 *
 * That is the model's own auto option when it has one, since it reads the
 * source image itself. Otherwise it is the listed ratio closest to the
 * source's shape. Returns `undefined` when the model has no aspect ratio
 * control or lists nothing usable; leave the field out and the model decides.
 */
export function matchSourceAspectRatio(
  model: ModelAspectRatios | undefined,
  sourceWidth: number,
  sourceHeight: number,
): CommonAspectRatio | undefined {
  if (!model?.canChangeAspectRatio) return undefined;
  const options = listedOrLegacyAspectRatios(model);
  return (
    findAutoAspectRatio(options) ??
    closestAspectRatio(options, sourceWidth / sourceHeight)
  );
}

/** The model's "work it out from the input image" option, if it lists one. */
export function autoAspectRatio(
  model: ModelAspectRatios | undefined,
): CommonAspectRatio | undefined {
  if (!model?.canChangeAspectRatio) return undefined;
  return findAutoAspectRatio(listedOrLegacyAspectRatios(model));
}

function listedOrLegacyAspectRatios(
  model: ModelAspectRatios,
): readonly CommonAspectRatio[] {
  return model.aspectRatios.length > 0 ? model.aspectRatios : LEGACY_ASPECT_RATIOS;
}

function findAutoAspectRatio(
  options: readonly CommonAspectRatio[],
): CommonAspectRatio | undefined {
  return AUTO_ASPECT_RATIOS.find((ratio) => options.includes(ratio));
}

function closestAspectRatio(
  options: readonly CommonAspectRatio[],
  sourceShape: number,
): CommonAspectRatio | undefined {
  if (!Number.isFinite(sourceShape) || sourceShape <= 0) return undefined;

  let closest: CommonAspectRatio | undefined;
  let closestDistance = Infinity;
  for (const option of options) {
    const shape = ASPECT_RATIO_SHAPES[option];
    if (shape === undefined) continue;
    // Compare in log space so 2:1 and 1:2 are equally far from square.
    const distance = Math.abs(Math.log(sourceShape / shape));
    // Strictly closer: on a tie the option listed first wins.
    if (distance < closestDistance) {
      closest = option;
      closestDistance = distance;
    }
  }
  return closest;
}
