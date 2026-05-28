"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "../../../../components/section";
import { ColorPickerContent } from "../../../../components/ui/color-picker";
import { Popover, PopoverTrigger } from "../../../../components/ui/popover";
import {
  BACKGROUND_BLUR_INTENSITY_PRESETS,
  DEFAULT_BACKGROUND_BLUR_INTENSITY,
} from "../../../../background/blur";
import { DEFAULT_BACKGROUND_COLOR } from "../../../../background/color";
import { patternCraftGradients } from "../../../../data/colors/pattern-craft";
import { colors } from "../../../../data/colors/solid";
import { syntaxUIGradients } from "../../../../data/colors/syntax-ui";
import { useEditor } from "../../../../editor/use-editor";
import { effectPreviewService } from "../../../../services/renderer/effect-preview";
import { cn } from "../../../../utils/ui";

const BLUR_PREVIEW_UNIFORM_DIMENSIONS = {
  width: 1920,
  height: 1080,
} as const;

const CUSTOM_COLOR_SWATCH_BACKGROUND =
  "conic-gradient(from 180deg at 50% 50%, #ff5e5e 0deg, #ffb35e 55deg, #fff26b 110deg, #6bff8f 165deg, #5ee7ff 220deg, #6f7cff 275deg, #d76bff 330deg, #ff5e9b 360deg)";

const BlurPreview = memo(
  ({
    blur,
    isSelected,
    onSelect,
  }: {
    blur: { label: string; value: number };
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const renderPreview = () => {
        if (!canvasRef.current) return;

        effectPreviewService.renderPreview({
          effectType: "blur",
          params: { intensity: blur.value },
          targetCanvas: canvasRef.current,
          uniformDimensions: BLUR_PREVIEW_UNIFORM_DIMENSIONS,
        });
      };

      renderPreview();
      return effectPreviewService.onPreviewImageReady({
        callback: renderPreview,
      });
    }, [blur.value]);

    return (
      <button
        className={cn(
          "border-foreground/15 hover:border-primary relative aspect-square size-20 cursor-pointer overflow-hidden rounded-sm border",
          isSelected && "border-primary border-2",
        )}
        onClick={onSelect}
        type="button"
        aria-label={`Select ${blur.label} blur`}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute right-1 bottom-1 left-1 text-center">
          <span className="rounded bg-black/50 px-1 text-xs text-white">
            {blur.label}
          </span>
        </div>
      </button>
    );
  },
);

BlurPreview.displayName = "BlurPreview";

const BackgroundPreviews = memo(
  ({
    backgrounds,
    currentBackgroundColor,
    isColorBackground,
    onSelect,
    useBackgroundColor = false,
  }: {
    backgrounds: readonly string[];
    currentBackgroundColor: string;
    isColorBackground: boolean;
    onSelect: (bg: string) => void;
    useBackgroundColor?: boolean;
  }) => {
    return useMemo(
      () =>
        backgrounds.map((bg) => (
          <button
            key={bg}
            className={cn(
              "border-foreground/15 hover:border-primary aspect-square size-20 cursor-pointer rounded-sm border",
              isColorBackground &&
                bg.toLowerCase() === currentBackgroundColor.toLowerCase() &&
                "border-primary border-2",
            )}
            style={
              useBackgroundColor
                ? { backgroundColor: bg }
                : {
                    background: bg,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }
            }
            onClick={() => onSelect(bg)}
            type="button"
            aria-label={`Select background ${bg}`}
          />
        )),
      [
        backgrounds,
        isColorBackground,
        currentBackgroundColor,
        onSelect,
        useBackgroundColor,
      ],
    );
  },
);

BackgroundPreviews.displayName = "BackgroundPreviews";

function CustomColorPreview({
  currentBackgroundColor,
  isSelected,
  onPreview,
  onCommit,
}: {
  currentBackgroundColor: string;
  isSelected: boolean;
  onPreview: (color: string) => void;
  onCommit: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "border-foreground/15 hover:border-primary relative aspect-square size-20 cursor-pointer overflow-hidden rounded-sm border",
            isSelected && "border-primary border-2",
          )}
          type="button"
          aria-label="Pick a custom background color"
        >
          <span
            className="absolute inset-0"
            style={{ background: CUSTOM_COLOR_SWATCH_BACKGROUND }}
          />
          <span
            className="absolute right-1 bottom-1 size-5 rounded-sm border border-white/70 shadow-sm"
            style={{ backgroundColor: currentBackgroundColor }}
          />
        </button>
      </PopoverTrigger>
      <ColorPickerContent
        value={currentBackgroundColor.replace(/^#/, "").toUpperCase()}
        onChange={(color) => onPreview(`#${color}`)}
        onChangeEnd={(color) => onCommit(`#${color}`)}
      />
    </Popover>
  );
}

const COLOR_SECTIONS = [
  { id: "colors", title: "Colors", backgrounds: colors, useBackgroundColor: true, showCustomPicker: true },
  { id: "pattern-craft", title: "Pattern craft", backgrounds: patternCraftGradients, showCustomPicker: false },
  { id: "syntax-ui", title: "Syntax UI", backgrounds: syntaxUIGradients, showCustomPicker: false },
] as const;

export function BackgroundContent() {
  const editor = useEditor();
  const activeProject = useEditor((e) => e.project.getActive());

  const handleBlurSelect = useCallback(
    async (blurIntensity: number) => {
      await editor.project.updateSettings({
        settings: { background: { type: "blur", blurIntensity } },
      });
    },
    [editor.project],
  );

  const previewBackgroundColor = useCallback(
    async (color: string) => {
      await editor.project.updateSettings({
        settings: { background: { type: "color", color } },
        pushHistory: false,
      });
    },
    [editor.project],
  );

  const commitBackgroundColor = useCallback(
    async (color: string) => {
      await editor.project.updateSettings({
        settings: { background: { type: "color", color } },
        pushHistory: true,
      });
    },
    [editor.project],
  );

  const isBlurBackground = activeProject.settings.background.type === "blur";
  const isColorBackground = activeProject.settings.background.type === "color";

  const currentBlurIntensity = isBlurBackground
    ? (activeProject.settings.background as { blurIntensity: number })
        .blurIntensity
    : DEFAULT_BACKGROUND_BLUR_INTENSITY;

  const currentBackgroundColor = isColorBackground
    ? (activeProject.settings.background as { color: string }).color
    : DEFAULT_BACKGROUND_COLOR;

  const hasPresetColorMatch = colors.some(
    (color) => color.toLowerCase() === currentBackgroundColor.toLowerCase(),
  );

  const handlePresetColorSelect = useCallback(
    (color: string) => {
      void commitBackgroundColor(color);
    },
    [commitBackgroundColor],
  );

  const blurPreviews = useMemo(
    () =>
      BACKGROUND_BLUR_INTENSITY_PRESETS.map((blur) => (
        <BlurPreview
          key={blur.value}
          blur={blur}
          isSelected={isBlurBackground && currentBlurIntensity === blur.value}
          onSelect={() => handleBlurSelect(blur.value)}
        />
      )),
    [isBlurBackground, currentBlurIntensity, handleBlurSelect],
  );

  return (
    <div className="flex flex-col">
      <Section
        collapsible
        defaultOpen={true}
        sectionKey="background-blur"
        showTopBorder={false}
      >
        <SectionHeader>
          <SectionTitle>Blur</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <div className="flex flex-wrap gap-2">{blurPreviews}</div>
        </SectionContent>
      </Section>
      {COLOR_SECTIONS.map((section) => (
        <Section
          key={section.id}
          collapsible
          defaultOpen={false}
          sectionKey={`settings:background-${section.id}`}
        >
          <SectionHeader>
            <SectionTitle>{section.title}</SectionTitle>
          </SectionHeader>
          <SectionContent>
            <div className="flex flex-wrap gap-2">
              {section.showCustomPicker ? (
                <CustomColorPreview
                  currentBackgroundColor={currentBackgroundColor}
                  isSelected={isColorBackground && !hasPresetColorMatch}
                  onPreview={previewBackgroundColor}
                  onCommit={commitBackgroundColor}
                />
              ) : null}
              <BackgroundPreviews
                backgrounds={section.backgrounds}
                currentBackgroundColor={currentBackgroundColor}
                isColorBackground={isColorBackground}
                onSelect={handlePresetColorSelect}
                useBackgroundColor={
                  "useBackgroundColor" in section
                    ? section.useBackgroundColor
                    : false
                }
              />
            </div>
          </SectionContent>
        </Section>
      ))}
    </div>
  );
}
