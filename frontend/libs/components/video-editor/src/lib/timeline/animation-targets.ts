import type {
  AnimationInterpolation,
  AnimationPath,
  NumericSpec,
} from "../animation/types";
import { parseEffectParamPath } from "../animation/effect-param-channel";
import { parseGraphicParamPath } from "../animation/graphic-param-channel";
import { effectsRegistry, registerDefaultEffects } from "../effects";
import { getGraphicDefinition } from "../graphics";
import {
  coerceParamValue,
  getParamDefaultInterpolation,
  getParamChannelLayout,
  getParamNumericRange,
  type ParamChannelLayout,
  type ParamDefinition,
  type ParamValue,
  type ParamValues,
} from "../params";
import { getElementParam } from "../params/registry";
import type { TimelineElement } from "./types";
import { isVisualElement } from "./element-utils";

// Resolves an AnimationPath ("opacity" / "params.fill" /
// "effects.<id>.params.intensity") into a descriptor that knows how
// to coerce/get/set the base value AND describes the channel layout
// + default interpolation. Used by the keyframe upsert flow so the
// caller doesn't need to know whether a path targets an element param,
// a graphic param, or an effect param.
//
// AnimationPathDescriptor.setBaseValue returns a new TimelineElement
// with the param updated; callers persist that via the appropriate
// command. getBaseValue reads the current static value (without
// considering keyframe animation).

export interface AnimationPathDescriptor {
  channelLayout: ParamChannelLayout;
  defaultInterpolation: AnimationInterpolation;
  numericRanges?: Partial<Record<string, NumericSpec>>;
  coerceValue: ({ value }: { value: ParamValue }) => ParamValue | null;
  getBaseValue: () => ParamValue | null;
  setBaseValue: ({ value }: { value: ParamValue }) => TimelineElement;
}

// Leaf params expose a single component named "value". Composite
// params don't carry numeric ranges yet — revisit when one does.
function paramNumericRanges({
  param,
}: {
  param: ParamDefinition;
}): Partial<Record<string, NumericSpec>> | undefined {
  const range = getParamNumericRange({ param });
  return range ? { value: range } : undefined;
}

function buildParamDescriptor({
  param,
  baseParams,
  setParams,
}: {
  param: ParamDefinition;
  baseParams: ParamValues;
  setParams: (params: ParamValues) => TimelineElement;
}): AnimationPathDescriptor | null {
  if (param.keyframable === false) {
    return null;
  }

  return {
    channelLayout: getParamChannelLayout({ param }),
    defaultInterpolation: getParamDefaultInterpolation({ param }),
    numericRanges: paramNumericRanges({ param }),
    coerceValue: ({ value }) => coerceParamValue({ param, value }),
    getBaseValue: () => baseParams[param.key] ?? param.default,
    setBaseValue: ({ value }) => {
      const coercedValue = coerceParamValue({ param, value });
      if (coercedValue === null) {
        return setParams(baseParams);
      }

      return setParams({
        ...baseParams,
        [param.key]: coercedValue,
      });
    },
  };
}

function buildElementParamDescriptor({
  element,
  paramKey,
}: {
  element: TimelineElement;
  paramKey: string;
}): AnimationPathDescriptor | null {
  const param = getElementParam({ element, key: paramKey });
  if (!param) {
    return null;
  }

  return buildParamDescriptor({
    param,
    baseParams: element.params,
    setParams: (params) => ({
      ...element,
      params,
    }),
  });
}

function buildGraphicParamDescriptor({
  element,
  paramKey,
}: {
  element: TimelineElement;
  paramKey: string;
}): AnimationPathDescriptor | null {
  if (element.type !== "graphic") {
    return null;
  }

  const definition = getGraphicDefinition({
    definitionId: element.definitionId,
  });
  const param = definition.params.find((candidate) => candidate.key === paramKey);
  if (!param) {
    return null;
  }

  return buildParamDescriptor({
    param,
    baseParams: element.params,
    setParams: (params) => ({
      ...element,
      params,
    }),
  });
}

function buildEffectParamDescriptor({
  element,
  effectId,
  paramKey,
}: {
  element: TimelineElement;
  effectId: string;
  paramKey: string;
}): AnimationPathDescriptor | null {
  if (!isVisualElement(element)) {
    return null;
  }

  const effect = element.effects?.find((candidate) => candidate.id === effectId);
  if (!effect) {
    return null;
  }

  registerDefaultEffects();
  const definition = effectsRegistry.get(effect.type);
  const param = definition.params.find((candidate) => candidate.key === paramKey);
  if (!param) {
    return null;
  }

  return buildParamDescriptor({
    param,
    baseParams: effect.params,
    setParams: (params) => ({
      ...element,
      effects:
        element.effects?.map((candidate) =>
          candidate.id !== effectId
            ? candidate
            : {
                ...candidate,
                params,
              },
        ) ?? element.effects,
    }),
  });
}

export function resolveAnimationTarget({
  element,
  path,
}: {
  element: TimelineElement;
  path: AnimationPath;
}): AnimationPathDescriptor | null {
  const elementParamTarget = buildElementParamDescriptor({
    element,
    paramKey: path,
  });
  if (elementParamTarget) {
    return elementParamTarget;
  }

  const graphicParamTarget = parseGraphicParamPath({ propertyPath: path });
  if (graphicParamTarget) {
    return buildGraphicParamDescriptor({
      element,
      paramKey: graphicParamTarget.paramKey,
    });
  }

  const effectParamTarget = parseEffectParamPath({ propertyPath: path });
  if (effectParamTarget) {
    return buildEffectParamDescriptor({
      element,
      effectId: effectParamTarget.effectId,
      paramKey: effectParamTarget.paramKey,
    });
  }

  return null;
}
