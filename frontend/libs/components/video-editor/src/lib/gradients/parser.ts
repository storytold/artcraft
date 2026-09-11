/*
 * Original source: https://github.com/rafaelcaricio/gradient-parser/blob/master/lib/parser.js
 */

type GradientType =
  | "linear-gradient"
  | "repeating-linear-gradient"
  | "radial-gradient"
  | "repeating-radial-gradient";

type DirectionalOrientation = { type: "directional"; value: string };
type AngularOrientation = { type: "angular"; value: string };
type LinearOrientation = DirectionalOrientation | AngularOrientation;

type Distance =
  | { type: "%"; value: string }
  | { type: "position-keyword"; value: string }
  | { type: "calc"; value: string }
  | { type: "px"; value: string }
  | { type: "em"; value: string };

type PositionValue = { x?: Distance; y?: Distance };
type Position = { type: "position"; value: PositionValue };

type ExtentKeyword = { type: "extent-keyword"; value: string };

type ShapeValue = "circle" | "ellipse";
type Shape = {
  type: "shape";
  value: ShapeValue;
  style?: Distance | ExtentKeyword | Position;
  at?: Position;
};

type DefaultRadial = { type: "default-radial"; at: Position };

type RadialOrientation =
  | Shape
  | (ExtentKeyword & { at?: Position })
  | DefaultRadial;

export type GradientOrientation = LinearOrientation | Array<RadialOrientation>;

export type Color =
  | { type: "hex"; value: string }
  | { type: "literal"; value: string }
  | { type: "rgb"; value: Array<string> }
  | { type: "rgba"; value: Array<string> }
  | { type: "hsl"; value: [string, string, string] }
  | { type: "hsla"; value: [string, string, string, string] }
  | { type: "var"; value: string };

export type ColorStop = Color & { length?: Distance };

export type GradientAst = {
  type: GradientType;
  orientation: GradientOrientation | undefined;
  colorStops: Array<ColorStop>;
};

type Tokens = {
  linearGradient: RegExp;
  repeatingLinearGradient: RegExp;
  radialGradient: RegExp;
  repeatingRadialGradient: RegExp;
  sideOrCorner: RegExp;
  extentKeywords: RegExp;
  positionKeywords: RegExp;
  pixelValue: RegExp;
  percentageValue: RegExp;
  emValue: RegExp;
  angleValue: RegExp;
  radianValue: RegExp;
  startCall: RegExp;
  endCall: RegExp;
  comma: RegExp;
  hexColor: RegExp;
  literalColor: RegExp;
  rgbColor: RegExp;
  rgbaColor: RegExp;
  varColor: RegExp;
  calcValue: RegExp;
  variableName: RegExp;
  number: RegExp;
  hslColor: RegExp;
  hslaColor: RegExp;
};

const tokens: Tokens = {
  linearGradient: /^(-(webkit|o|ms|moz)-)?(linear-gradient)/i,
  repeatingLinearGradient:
    /^(-(webkit|o|ms|moz)-)?(repeating-linear-gradient)/i,
  radialGradient: /^(-(webkit|o|ms|moz)-)?(radial-gradient)/i,
  repeatingRadialGradient:
    /^(-(webkit|o|ms|moz)-)?(repeating-radial-gradient)/i,
  sideOrCorner:
    /^to (left (top|bottom)|right (top|bottom)|top (left|right)|bottom (left|right)|left|right|top|bottom)/i,
  extentKeywords:
    /^(closest-side|closest-corner|farthest-side|farthest-corner|contain|cover)/,
  positionKeywords: /^(left|center|right|top|bottom)/i,
  pixelValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))px/,
  percentageValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))%/,
  emValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))em/,
  angleValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))deg/,
  radianValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))rad/,
  startCall: /^\(/,
  endCall: /^\)/,
  comma: /^,/,
  hexColor: /^#([0-9a-fA-F]+)/,
  literalColor: /^([a-zA-Z]+)/,
  rgbColor: /^rgb/i,
  rgbaColor: /^rgba/i,
  varColor: /^var/i,
  calcValue: /^calc/i,
  variableName: /^(--[a-zA-Z0-9-,\s#]+)/,
  number: /^(([0-9]*\.[0-9]+)|([0-9]+\.?))/,
  hslColor: /^hsl/i,
  hslaColor: /^hsla/i,
};

let input = "";

const error = ({ message }: { message: string }): never => {
  const err = new Error(`${input}: ${message}`);
  (err as Error & { source?: string }).source = input;
  throw err;
};

const getAst = (): Array<GradientAst> => {
  const ast = matchListDefinitions();

  if (input.length > 0) {
    error({ message: "Invalid input not EOF" });
  }

  return ast;
};

const matchListDefinitions = (): Array<GradientAst> =>
  matchListing({ matcher: matchDefinition });

const matchDefinition = (): GradientAst | undefined =>
  matchGradient({
    gradientType: "linear-gradient",
    pattern: tokens.linearGradient,
    orientationMatcher: matchLinearOrientation,
  }) ||
  matchGradient({
    gradientType: "repeating-linear-gradient",
    pattern: tokens.repeatingLinearGradient,
    orientationMatcher: matchLinearOrientation,
  }) ||
  matchGradient({
    gradientType: "radial-gradient",
    pattern: tokens.radialGradient,
    orientationMatcher: matchListRadialOrientations,
  }) ||
  matchGradient({
    gradientType: "repeating-radial-gradient",
    pattern: tokens.repeatingRadialGradient,
    orientationMatcher: matchListRadialOrientations,
  });

const matchGradient = ({
  gradientType,
  pattern,
  orientationMatcher,
}: {
  gradientType: GradientType;
  pattern: RegExp;
  orientationMatcher: () => GradientOrientation | undefined;
}): GradientAst | undefined =>
  matchCall({
    pattern,
    callback: () => {
      const orientation = orientationMatcher();
      if (orientation && !scan({ regexp: tokens.comma })) {
        error({ message: "Missing comma before color stops" });
      }

      return {
        type: gradientType,
        orientation,
        colorStops: matchListing({ matcher: matchColorStop }),
      };
    },
  });

const matchCall = <T>({
  pattern,
  callback,
}: {
  pattern: RegExp;
  callback: (captures: RegExpExecArray) => T;
}): T | undefined => {
  const captures = scan({ regexp: pattern });

  if (!captures) {
    return undefined;
  }

  if (!scan({ regexp: tokens.startCall })) {
    error({ message: "Missing (" });
  }

  const result = callback(captures);

  if (!scan({ regexp: tokens.endCall })) {
    error({ message: "Missing )" });
  }

  return result;
};

const matchLinearOrientation = (): LinearOrientation | undefined => {
  const sideOrCorner = matchSideOrCorner();
  if (sideOrCorner) {
    return sideOrCorner;
  }

  const legacyDirection = match({
    type: "position-keyword",
    pattern: tokens.positionKeywords,
    captureIndex: 1,
  });
  if (legacyDirection) {
    return {
      type: "directional",
      value: legacyDirection.value,
    };
  }

  return matchAngle();
};

const matchSideOrCorner = (): DirectionalOrientation | undefined =>
  match({ type: "directional", pattern: tokens.sideOrCorner, captureIndex: 1 });

const matchAngle = (): AngularOrientation | undefined =>
  match({ type: "angular", pattern: tokens.angleValue, captureIndex: 1 }) ||
  match({ type: "angular", pattern: tokens.radianValue, captureIndex: 1 });

const matchListRadialOrientations = ():
  | Array<RadialOrientation>
  | undefined => {
  const radialOrientation = matchRadialOrientation();
  if (!radialOrientation) {
    return undefined;
  }

  const radialOrientations: Array<RadialOrientation> = [radialOrientation];
  const lookaheadCache = input;

  if (!scan({ regexp: tokens.comma })) {
    return radialOrientations;
  }

  const nextRadial = matchRadialOrientation();
  if (!nextRadial) {
    input = lookaheadCache;
    return radialOrientations;
  }

  radialOrientations.push(nextRadial);
  return radialOrientations;
};

const matchRadialOrientation = (): RadialOrientation | undefined => {
  const radialType = matchCircle() || matchEllipse();
  if (radialType) {
    radialType.at = matchAtPosition();
    return radialType;
  }

  const extent = matchExtentKeyword();
  if (extent) {
    const positionAt = matchAtPosition();
    if (positionAt) {
      return { ...extent, at: positionAt };
    }
    return extent;
  }

  const implicitEllipse = matchImplicitEllipse();
  if (implicitEllipse) {
    return implicitEllipse;
  }

  const atPosition = matchAtPosition();
  if (atPosition) {
    return { type: "default-radial", at: atPosition };
  }

  const defaultPosition = matchPositioning();
  if (defaultPosition) {
    return { type: "default-radial", at: defaultPosition };
  }

  return undefined;
};

const matchImplicitEllipse = (): Shape | undefined => {
  const lookaheadCache = input;

  const width = matchDistance();
  if (!width) {
    return undefined;
  }

  const height = matchDistance();
  if (!height) {
    input = lookaheadCache;
    return undefined;
  }

  const atPos = matchAtPosition();
  if (!atPos) {
    input = lookaheadCache;
    return undefined;
  }

  return {
    type: "shape",
    value: "ellipse",
    style: { type: "position", value: { x: width, y: height } },
    at: atPos,
  };
};

const matchCircle = (): Shape | undefined => {
  const circle = match({
    type: "shape",
    pattern: /^(circle)/i,
    captureIndex: 0,
  }) as Shape | undefined;

  if (!circle) {
    return undefined;
  }

  circle.style = matchLength() || matchExtentKeyword();
  circle.value = "circle";
  return circle;
};

const matchEllipse = (): Shape | undefined => {
  const ellipse = match({
    type: "shape",
    pattern: /^(ellipse)/i,
    captureIndex: 0,
  }) as Shape | undefined;

  if (!ellipse) {
    return undefined;
  }

  ellipse.style = matchPositioning() || matchDistance() || matchExtentKeyword();
  ellipse.value = "ellipse";
  return ellipse;
};

const matchExtentKeyword = (): ExtentKeyword | undefined =>
  match({
    type: "extent-keyword",
    pattern: tokens.extentKeywords,
    captureIndex: 1,
  });

const matchAtPosition = (): Position | undefined => {
  if (!match({ type: "position", pattern: /^at/, captureIndex: 0 })) {
    return undefined;
  }

  const positioning = matchPositioning();
  if (!positioning) {
    error({ message: "Missing positioning value" });
  }

  return positioning;
};

const matchPositioning = (): Position | undefined => {
  const location = matchCoordinates();

  if (!location.x && !location.y) {
    return undefined;
  }

  return {
    type: "position",
    value: location,
  };
};

const matchCoordinates = (): PositionValue => ({
  x: matchDistance(),
  y: matchDistance(),
});

const matchListing = <T>({
  matcher,
}: {
  matcher: () => T | undefined;
}): Array<T> => {
  const captures = matcher();
  const result: Array<T> = [];

  if (!captures) {
    return result;
  }

  result.push(captures);
  while (scan({ regexp: tokens.comma })) {
    const nextCapture = matcher() ?? error({ message: "One extra comma" });
    result.push(nextCapture);
  }

  return result;
};

const matchColorStop = (): ColorStop => {
  const color = matchColor() ?? error({ message: "Expected color definition" });
  const length = matchDistance();
  return { ...color, length };
};

const matchColor = (): Color | undefined =>
  matchHexColor() ||
  matchHSLAColor() ||
  matchHSLColor() ||
  matchRGBAColor() ||
  matchRGBColor() ||
  matchVarColor() ||
  matchLiteralColor();

const matchLiteralColor = (): Color | undefined =>
  match({ type: "literal", pattern: tokens.literalColor, captureIndex: 0 });

const matchHexColor = (): Color | undefined =>
  match({ type: "hex", pattern: tokens.hexColor, captureIndex: 1 });

const matchRGBColor = (): Color | undefined =>
  matchCall({
    pattern: tokens.rgbColor,
    callback: () => ({
      type: "rgb",
      value: matchListing({ matcher: matchNumber }),
    }),
  });

const matchRGBAColor = (): Color | undefined =>
  matchCall({
    pattern: tokens.rgbaColor,
    callback: () => ({
      type: "rgba",
      value: matchListing({ matcher: matchNumber }),
    }),
  });

const matchVarColor = (): Color | undefined =>
  matchCall({
    pattern: tokens.varColor,
    callback: () => ({
      type: "var",
      value: matchVariableName(),
    }),
  });

const matchHSLColor = (): Color | undefined =>
  matchCall({
    pattern: tokens.hslColor,
    callback: () => {
      const lookahead = scan({ regexp: tokens.percentageValue });
      if (lookahead) {
        error({
          message:
            "HSL hue value must be a number in degrees (0-360) or normalized (-360 to 360), not a percentage",
        });
      }

      const hue = matchNumber();
      scan({ regexp: tokens.comma });
      let captures = scan({ regexp: tokens.percentageValue });
      const sat = captures ? captures[1] : null;
      scan({ regexp: tokens.comma });
      captures = scan({ regexp: tokens.percentageValue });
      const light = captures ? captures[1] : null;
      const ensuredSat =
        sat ??
        error({
          message:
            "Expected percentage value for saturation and lightness in HSL",
        });
      const ensuredLight =
        light ??
        error({
          message:
            "Expected percentage value for saturation and lightness in HSL",
        });
      return {
        type: "hsl",
        value: [hue, ensuredSat, ensuredLight],
      };
    },
  });

const matchHSLAColor = (): Color | undefined =>
  matchCall({
    pattern: tokens.hslaColor,
    callback: () => {
      const hue = matchNumber();
      scan({ regexp: tokens.comma });
      let captures = scan({ regexp: tokens.percentageValue });
      const sat = captures ? captures[1] : null;
      scan({ regexp: tokens.comma });
      captures = scan({ regexp: tokens.percentageValue });
      const light = captures ? captures[1] : null;
      scan({ regexp: tokens.comma });
      const alpha = matchNumber();
      const ensuredSat =
        sat ??
        error({
          message:
            "Expected percentage value for saturation and lightness in HSLA",
        });
      const ensuredLight =
        light ??
        error({
          message:
            "Expected percentage value for saturation and lightness in HSLA",
        });
      return {
        type: "hsla",
        value: [hue, ensuredSat, ensuredLight, alpha],
      };
    },
  });

const matchVariableName = (): string => {
  const captures =
    scan({ regexp: tokens.variableName }) ??
    error({ message: "Expected CSS variable name" });
  return captures[1];
};

const matchNumber = (): string => {
  const captures =
    scan({ regexp: tokens.number }) ?? error({ message: "Expected number" });
  return captures[1];
};

const matchDistance = (): Distance | undefined =>
  match({ type: "%", pattern: tokens.percentageValue, captureIndex: 1 }) ||
  matchPositionKeyword() ||
  matchCalc() ||
  matchLength();

const matchPositionKeyword = (): Distance | undefined =>
  match({
    type: "position-keyword",
    pattern: tokens.positionKeywords,
    captureIndex: 1,
  });

const matchCalc = (): Distance | undefined =>
  matchCall({
    pattern: tokens.calcValue,
    callback: () => {
      let openParenCount = 1;
      let index = 0;

      while (openParenCount > 0 && index < input.length) {
        const char = input.charAt(index);
        if (char === "(") {
          openParenCount++;
        } else if (char === ")") {
          openParenCount--;
        }
        index++;
      }

      if (openParenCount > 0) {
        error({ message: "Missing closing parenthesis in calc() expression" });
      }

      const calcContent = input.slice(0, index - 1);
      consume({ size: index - 1 });

      return {
        type: "calc",
        value: calcContent,
      };
    },
  });

const matchLength = (): Distance | undefined =>
  match({ type: "px", pattern: tokens.pixelValue, captureIndex: 1 }) ||
  match({ type: "em", pattern: tokens.emValue, captureIndex: 1 });

const match = <TType extends string>({
  type,
  pattern,
  captureIndex,
}: {
  type: TType;
  pattern: RegExp;
  captureIndex: number;
}): { type: TType; value: string } | undefined => {
  const captures = scan({ regexp: pattern });
  if (!captures) {
    return undefined;
  }

  return {
    type,
    value: captures[captureIndex],
  };
};

const scan = ({ regexp }: { regexp: RegExp }): RegExpExecArray | null => {
  const blankCaptures = /^[\n\r\t\s]+/.exec(input);
  if (blankCaptures) {
    consume({ size: blankCaptures[0].length });
  }

  const captures = regexp.exec(input);
  if (captures) {
    consume({ size: captures[0].length });
  }

  return captures;
};

const consume = ({ size }: { size: number }): void => {
  input = input.slice(size);
};

export const parseGradient = ({
  code,
}: {
  code: string;
}): Array<GradientAst> => {
  input = code.toString().trim();
  if (input.endsWith(";")) {
    input = input.slice(0, -1);
  }
  return getAst();
};

export const GradientParser = {
  parse: parseGradient,
};
