"use client";

import { useEffect, useRef, useCallback } from "react";
import { PanelView } from "../../panels/assets/views/base-panel";
import { DraggableItem } from "../../panels/assets/draggable-item";
import { effectsRegistry, EFFECT_TARGET_ELEMENT_TYPES } from "../";
import { effectPreviewService } from "../../services/renderer/effect-preview";
import { useEditor } from "../../editor/use-editor";
import { buildEffectElement } from "../../timeline/element-utils";
import type { EffectDefinition } from "../types";

export function EffectsView() {
  const effects = effectsRegistry.getAll();

  return (
    <PanelView title="Effects">
      <EffectsGrid effects={effects} />
    </PanelView>
  );
}

function EffectsGrid({ effects }: { effects: EffectDefinition[] }) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
    >
      {effects.map((effect) => (
        <EffectItem key={effect.type} effect={effect} />
      ))}
    </div>
  );
}

function EffectPreviewCanvas({ effectType }: { effectType: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const render = () => {
      if (canvasRef.current) {
        effectPreviewService.renderPreview({
          effectType,
          params: {},
          targetCanvas: canvasRef.current,
        });
      }
    };

    render();
    return effectPreviewService.onPreviewImageReady({ callback: render });
  }, [effectType]);

  return <canvas ref={canvasRef} className="size-full" />;
}

function EffectItem({ effect }: { effect: EffectDefinition }) {
  const editor = useEditor();

  const handleAddToTimeline = useCallback(() => {
    const currentTime = editor.playback.getCurrentTime();
    const element = buildEffectElement({
      effectType: effect.type,
      startTime: currentTime,
    });

    editor.timeline.insertElement({
      placement: { mode: "auto", trackType: "effect" },
      element,
    });
  }, [editor, effect.type]);

  const preview = <EffectPreviewCanvas effectType={effect.type} />;

  return (
    <DraggableItem
      name={effect.name}
      preview={preview}
      dragData={{
        id: effect.type,
        name: effect.name,
        type: "effect",
        effectType: effect.type,
        targetElementTypes: EFFECT_TARGET_ELEMENT_TYPES,
      }}
      onAddToTimeline={handleAddToTimeline}
      aspectRatio={1}
      isRounded
      variant="card"
      containerClassName="w-full"
    />
  );
}
