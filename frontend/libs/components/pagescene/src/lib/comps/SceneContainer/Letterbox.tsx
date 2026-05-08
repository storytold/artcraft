import { twMerge } from "tailwind-merge";
import { usePageSceneStore } from "../../PageSceneStore";

import {
  calcMatteWidth,
  calcMatteHeight,
  getMatteOrientation,
  MatteOrientation,
} from "./helpers";

export const Letterbox = ({
  isShowing,
  width,
  height,
}: {
  isShowing: boolean;
  width: number;
  height: number;
}) => {
  const camAspect = usePageSceneStore((s) => s.cameraAspectRatio);

  const matteOri = getMatteOrientation({ camAspect, width, height });
  const matteWidth = calcMatteWidth({ matteOri, camAspect, width, height });
  const matteHeight = calcMatteHeight({ matteOri, camAspect, width, height });

  return (
    <div
      id="letterbox"
      className={twMerge(
        "user-select-none pointer-events-none absolute left-0 top-0 flex h-full w-full justify-between",
        matteOri === MatteOrientation.TOP_BOTTOM ? "flex-col" : null,
      )}
    >
      <Matte matteOri={matteOri} width={matteWidth} height={matteHeight} />
      <Matte matteOri={matteOri} width={matteWidth} height={matteHeight} />
    </div>
  );
};

const Matte = ({
  matteOri,
  width,
  height,
}: {
  matteOri: MatteOrientation;
  width?: number;
  height?: number;
}) => {
  if (matteOri === MatteOrientation.TOP_BOTTOM) {
    return (
      <div
        className="pointer-events-none h-20 w-full bg-black/30 brightness-75"
        style={{ height: `${height}px` }}
      />
    );
  }
  return (
    <div
      className="pointer-events-none h-full w-80 bg-black/30 brightness-75"
      style={{ width: `${width}px` }}
    />
  );
};
