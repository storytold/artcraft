"use client";

import { resolveAnimationPathValueAtTime } from "../../../animation";
import { Section, SectionContent, SectionFields } from "../../../components/section";
import { useElementPlayhead } from "../hooks/use-element-playhead";
import { useKeyframedParamProperty } from "../hooks/use-keyframed-param-property";
import { PropertyParamField } from "./property-param-field";
import type { ParamValue, ParamValues } from "../../../params";
import {
  getElementParams,
  readElementParamValue,
  writeElementParamValue,
  type ElementParamDefinition,
} from "../../../params/registry";
import type { TimelineElement } from "../../../timeline/types";
import type { MediaTime } from "../../../wasm";

export function ElementParamsTab({
  element,
  trackId,
  paramKeys,
  sectionKey,
}: {
  element: TimelineElement;
  trackId: string;
  paramKeys?: readonly string[];
  sectionKey: string;
}) {
  const { localTime, isPlayheadWithinElementRange } = useElementPlayhead({
    startTime: element.startTime,
    duration: element.duration,
  });
  const params = getElementParams({ element }).filter(
    (param) => !paramKeys || paramKeys.includes(param.key),
  );
  const baseValues = buildValues({ element, params });

  return (
    <Section sectionKey={`${element.id}:${sectionKey}`}>
      <SectionContent className="pt-4">
        <SectionFields>
          {params
            .filter((param) => isVisible({ param, values: baseValues }))
            .map((param) => (
              <ElementParamField
                key={param.key}
                element={element}
                trackId={trackId}
                param={param}
                baseValue={baseValues[param.key] ?? param.default}
                localTime={localTime}
                isPlayheadWithinElementRange={isPlayheadWithinElementRange}
              />
            ))}
        </SectionFields>
      </SectionContent>
    </Section>
  );
}

function ElementParamField({
  element,
  trackId,
  param,
  baseValue,
  localTime,
  isPlayheadWithinElementRange,
}: {
  element: TimelineElement;
  trackId: string;
  param: ElementParamDefinition;
  baseValue: ParamValue;
  localTime: MediaTime;
  isPlayheadWithinElementRange: boolean;
}) {
  const resolvedValue = resolveAnimationPathValueAtTime({
    animations: element.animations,
    propertyPath: param.key,
    localTime,
    fallbackValue: baseValue,
  });
  const animatedParam = useKeyframedParamProperty({
    param,
    trackId,
    elementId: element.id,
    animations: element.animations,
    propertyPath: param.key,
    localTime,
    isPlayheadWithinElementRange,
    resolvedValue,
    buildBaseUpdates: ({ value }) =>
      writeElementParamValue({ element, param, value }),
  });

  return (
    <PropertyParamField
      param={param}
      value={resolvedValue}
      onPreview={animatedParam.onPreview}
      onCommit={animatedParam.onCommit}
      keyframe={
        param.keyframable === false
          ? undefined
          : {
              isActive: animatedParam.isKeyframedAtTime,
              isDisabled: !isPlayheadWithinElementRange,
              onToggle: animatedParam.toggleKeyframe,
            }
      }
    />
  );
}

function buildValues({
  element,
  params,
}: {
  element: TimelineElement;
  params: readonly ElementParamDefinition[];
}): ParamValues {
  const values: ParamValues = {};
  for (const param of params) {
    const value = readElementParamValue({ element, param });
    if (value !== null) {
      values[param.key] = value;
    }
  }
  return values;
}

function isVisible({
  param,
  values,
}: {
  param: ElementParamDefinition;
  values: ParamValues;
}): boolean {
  return (param.dependencies ?? []).every((dependency) =>
    areParamValuesEqual({
      left: values[dependency.param],
      right: dependency.equals,
    }),
  );
}

function areParamValuesEqual({
  left,
  right,
}: {
  left: ParamValue | undefined;
  right: ParamValue;
}): boolean {
  return left === right;
}
