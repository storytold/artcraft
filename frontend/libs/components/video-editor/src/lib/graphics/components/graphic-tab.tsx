"use client";

import { useRef } from "react";
import { useElementPlayhead } from "../../panels/properties/hooks/use-element-playhead";
import {
  useKeyframedParamProperty,
  type KeyframedParamPropertyResult,
} from "../../panels/properties/hooks/use-keyframed-param-property";
import type { ParamDefinition, ParamValues } from "../../params";
import type { GraphicElement } from "../../timeline/types";
import {
  graphicsRegistry,
  registerDefaultGraphics,
  resolveGraphicElementParamsAtTime,
} from "..";
import { useElementPreview } from "../../timeline/hooks/use-element-preview";
import { useEditor } from "../../editor/use-editor";
import {
  Section,
  SectionContent,
  SectionFields,
  SectionHeader,
  SectionTitle,
} from "../../components/section";
import { PropertyParamField } from "../../panels/properties/components/property-param-field";
import { Button } from "../../components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { cn } from "../../utils/ui";
import type { MediaTime } from "../../wasm";

registerDefaultGraphics();

const DEFAULT_STROKE_WIDTH = 2;

export function GraphicTab({
  element,
  trackId,
}: {
  element: GraphicElement;
  trackId: string;
}) {
  const definition = graphicsRegistry.get(element.definitionId);
  const { localTime, isPlayheadWithinElementRange } = useElementPlayhead({
    startTime: element.startTime,
    duration: element.duration,
  });
  const { renderElement } = useElementPreview({
    trackId,
    elementId: element.id,
    fallback: element,
  });

  const liveElement = renderElement as GraphicElement;
  const resolvedParams = resolveGraphicElementParamsAtTime({
    element: liveElement,
    localTime,
  });

  const shapeParams = definition.params.filter((p) => p.group !== "stroke");
  const hasStrokeParams = definition.params.some((p) => p.group === "stroke");

  return (
    <div className="flex flex-col">
      <Section collapsible sectionKey={`${element.id}:graphic`}>
        <SectionHeader>
          <SectionTitle>{definition.name}</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <SectionFields>
            {shapeParams.map((param) => (
              <AnimatedGraphicParamField
                key={param.key}
                param={param}
                trackId={trackId}
                element={liveElement}
                localTime={localTime}
                isPlayheadWithinElementRange={isPlayheadWithinElementRange}
                resolvedParams={resolvedParams}
              />
            ))}
          </SectionFields>
        </SectionContent>
      </Section>
      {hasStrokeParams && <StrokeSection element={element} trackId={trackId} />}
    </div>
  );
}

function StrokeSection({
  element,
  trackId,
}: {
  element: GraphicElement;
  trackId: string;
}) {
  const editor = useEditor();
  const definition = graphicsRegistry.get(element.definitionId);
  const { localTime, isPlayheadWithinElementRange } = useElementPlayhead({
    startTime: element.startTime,
    duration: element.duration,
  });
  const { renderElement } = useElementPreview({
    trackId,
    elementId: element.id,
    fallback: element,
  });

  const liveElement = renderElement as GraphicElement;
  const resolvedParams = resolveGraphicElementParamsAtTime({
    element: liveElement,
    localTime,
  });
  const strokeParams = definition.params.filter((p) => p.group === "stroke");
  const lastStrokeWidth = useRef(DEFAULT_STROKE_WIDTH);
  const isStrokeEnabled = Number(element.params.strokeWidth ?? 0) > 0;

  const toggleStroke = () => {
    if (isStrokeEnabled) {
      lastStrokeWidth.current = Number(
        element.params.strokeWidth ?? DEFAULT_STROKE_WIDTH,
      );
      editor.timeline.updateElements({
        updates: [
          {
            trackId,
            elementId: element.id,
            patch: { params: { ...element.params, strokeWidth: 0 } },
          },
        ],
      });
    } else {
      editor.timeline.updateElements({
        updates: [
          {
            trackId,
            elementId: element.id,
            patch: {
              params: {
                ...element.params,
                strokeWidth: lastStrokeWidth.current,
              },
            },
          },
        ],
      });
    }
  };

  return (
    <Section
      collapsible
      defaultOpen={isStrokeEnabled}
      sectionKey={`${element.id}:stroke`}
    >
      <SectionHeader
        trailing={
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              toggleStroke();
            }}
          >
            <HugeiconsIcon
              icon={isStrokeEnabled ? MinusSignIcon : PlusSignIcon}
              strokeWidth={1}
            />
          </Button>
        }
      >
        <SectionTitle>Stroke</SectionTitle>
      </SectionHeader>
      <SectionContent
        className={cn(!isStrokeEnabled && "pointer-events-none opacity-50")}
      >
        <SectionFields>
          {strokeParams.map((param) => (
            <AnimatedGraphicParamField
              key={param.key}
              param={param}
              trackId={trackId}
              element={liveElement}
              localTime={localTime}
              isPlayheadWithinElementRange={isPlayheadWithinElementRange}
              resolvedParams={resolvedParams}
            />
          ))}
        </SectionFields>
      </SectionContent>
    </Section>
  );
}

function AnimatedGraphicParamField({
  param,
  trackId,
  element,
  localTime,
  isPlayheadWithinElementRange,
  resolvedParams,
}: {
  key?: string;
  param: ParamDefinition;
  trackId: string;
  element: GraphicElement;
  localTime: MediaTime;
  isPlayheadWithinElementRange: boolean;
  resolvedParams: ParamValues;
}) {
  const animatedParam: KeyframedParamPropertyResult = useKeyframedParamProperty(
    {
      param,
      trackId,
      elementId: element.id,
      animations: element.animations,
      localTime,
      isPlayheadWithinElementRange,
      resolvedValue: resolvedParams[param.key] ?? param.default,
      buildBaseUpdates: ({ value }) => ({
        params: {
          ...element.params,
          [param.key]: value,
        },
      }),
    },
  );

  return (
    <PropertyParamField
      param={param}
      value={resolvedParams[param.key] ?? param.default}
      onPreview={animatedParam.onPreview}
      onCommit={animatedParam.onCommit}
      keyframe={{
        isActive: animatedParam.isKeyframedAtTime,
        isDisabled: !isPlayheadWithinElementRange,
        onToggle: animatedParam.toggleKeyframe,
      }}
    />
  );
}
