import { CameraAspectRatio } from "../../enums";

export enum MatteOrientation {
  TOP_BOTTOM,
  LEFT_RIGHT,
}

export const getMatteOrientation = ({
  camAspect,
  width,
  height,
}: {
  camAspect: CameraAspectRatio;
  width: number;
  height: number;
}): MatteOrientation => {
  switch (camAspect) {
    case CameraAspectRatio.SQUARE_1_1: {
      return width > height
        ? MatteOrientation.LEFT_RIGHT
        : MatteOrientation.TOP_BOTTOM;
    }
    case CameraAspectRatio.VERTICAL_9_16: {
      return (height / 16) * 9 - width >= 0
        ? MatteOrientation.TOP_BOTTOM
        : MatteOrientation.LEFT_RIGHT;
    }
    case CameraAspectRatio.VERTICAL_2_3: {
      return (height / 3) * 2 - width >= 0
        ? MatteOrientation.TOP_BOTTOM
        : MatteOrientation.LEFT_RIGHT;
    }
    case CameraAspectRatio.HORIZONTAL_3_2: {
      return (width / 3) * 2 - height >= 0
        ? MatteOrientation.LEFT_RIGHT
        : MatteOrientation.TOP_BOTTOM;
    }
    case CameraAspectRatio.HORIZONTAL_16_9:
    default: {
      return (width / 16) * 9 - height >= 0
        ? MatteOrientation.LEFT_RIGHT
        : MatteOrientation.TOP_BOTTOM;
    }
  }
};

export const calcMatteWidth = ({
  matteOri,
  camAspect,
  width,
  height,
}: {
  matteOri: MatteOrientation;
  camAspect: CameraAspectRatio;
  width: number;
  height: number;
}): number | undefined => {
  if (matteOri === MatteOrientation.TOP_BOTTOM) {
    return undefined;
  }
  switch (camAspect) {
    case CameraAspectRatio.SQUARE_1_1: {
      return (width - height) / 2;
    }
    case CameraAspectRatio.HORIZONTAL_16_9: {
      return (width - (height / 9) * 16) / 2;
    }
    case CameraAspectRatio.VERTICAL_9_16: {
      return (width - (height / 16) * 9) / 2;
    }
    case CameraAspectRatio.HORIZONTAL_3_2: {
      return (width - (height / 2) * 3) / 2;
    }
    case CameraAspectRatio.VERTICAL_2_3: {
      return (width - (height / 3) * 2) / 2;
    }
    default: {
      return undefined;
    }
  }
};

export const calcMatteHeight = ({
  matteOri,
  camAspect,
  width,
  height,
}: {
  matteOri: MatteOrientation;
  camAspect: CameraAspectRatio;
  width: number;
  height: number;
}): number | undefined => {
  if (matteOri === MatteOrientation.LEFT_RIGHT) {
    return undefined;
  }
  switch (camAspect) {
    case CameraAspectRatio.SQUARE_1_1: {
      return (height - width) / 2;
    }
    case CameraAspectRatio.HORIZONTAL_16_9: {
      return (height - (width / 16) * 9) / 2;
    }
    case CameraAspectRatio.VERTICAL_9_16: {
      return (height - (width / 9) * 16) / 2;
    }
    case CameraAspectRatio.HORIZONTAL_3_2: {
      return (height - (width / 3) * 2) / 2;
    }
    case CameraAspectRatio.VERTICAL_2_3: {
      return (height - (width / 2) * 3) / 2;
    }
    default: {
      return undefined;
    }
  }
};
