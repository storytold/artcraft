import {
  buildGraphicPreviewUrl,
  buildDefaultGraphicInstance,
  graphicsRegistry,
  registerDefaultGraphics,
} from "../../graphics";
import type { ParamValues } from "../../params";
import { buildStickerId, parseStickerId } from "../sticker-id";
import type {
  StickerBrowseResult,
  StickerItem,
  StickerProvider,
  StickerSearchResult,
} from "../types";

const SHAPES_PROVIDER_ID = "shapes";

type ShapeGraphicPreset = {
  shapeKey: string;
  name: string;
  definitionId: string;
  params?: ParamValues;
};

const LEGACY_SHAPE_PRESETS: Record<string, ShapeGraphicPreset> = {
  square: { shapeKey: "square", name: "Square", definitionId: "rectangle" },
  circle: { shapeKey: "circle", name: "Circle", definitionId: "ellipse" },
  triangle: {
    shapeKey: "triangle",
    name: "Triangle",
    definitionId: "polygon",
    params: { sides: 3 },
  },
  hexagon: {
    shapeKey: "hexagon",
    name: "Hexagon",
    definitionId: "polygon",
    params: { sides: 6 },
  },
  diamond: {
    shapeKey: "diamond",
    name: "Diamond",
    definitionId: "polygon",
    params: { sides: 4 },
  },
  star: { shapeKey: "star", name: "Star", definitionId: "star" },
};

function getShapePresets(): ShapeGraphicPreset[] {
  registerDefaultGraphics();
  return graphicsRegistry.getAll().map((definition) => ({
    shapeKey: definition.id,
    name: definition.name,
    definitionId: definition.id,
  }));
}

function getShapePreset({
  shapeKey,
}: {
  shapeKey: string;
}): ShapeGraphicPreset | null {
  return (
    getShapePresets().find((preset) => preset.shapeKey === shapeKey) ??
    LEGACY_SHAPE_PRESETS[shapeKey] ??
    null
  );
}

function getShapeParams({
  preset,
}: {
  preset: ShapeGraphicPreset;
}): ParamValues {
  return {
    ...buildDefaultGraphicInstance({ definitionId: preset.definitionId }).params,
    ...preset.params,
  };
}

export function parseShapeStickerId({
  stickerId,
}: {
  stickerId: string;
}): ShapeGraphicPreset | null {
  try {
    const { providerValue } = parseStickerId({ stickerId });
    return getShapePreset({ shapeKey: providerValue });
  } catch {
    return null;
  }
}

function buildShapeUrl({ shapeKey }: { shapeKey: string }): string {
  const preset = getShapePreset({ shapeKey });
  if (!preset) {
    return buildGraphicPreviewUrl({ definitionId: "rectangle" });
  }
  return buildGraphicPreviewUrl({
    definitionId: preset.definitionId,
    params: getShapeParams({ preset }),
  });
}

function toStickerItem({
  preset,
}: {
  preset: ShapeGraphicPreset;
}): StickerItem {
  return {
    id: buildStickerId({
      providerId: SHAPES_PROVIDER_ID,
      providerValue: preset.shapeKey,
    }),
    provider: SHAPES_PROVIDER_ID,
    name: preset.name,
    previewUrl: buildShapeUrl({ shapeKey: preset.shapeKey }),
    metadata: {
      definitionId: preset.definitionId,
      params: preset.params ?? {},
    },
  };
}

function filterShapesByQuery({ query }: { query: string }): ShapeGraphicPreset[] {
  const normalizedQuery = query.trim().toLowerCase();
  const presets = getShapePresets();
  if (!normalizedQuery) {
    return presets;
  }

  return presets.filter((preset) => {
    const definition = graphicsRegistry.get(preset.definitionId);
    return (
      preset.name.toLowerCase().includes(normalizedQuery) ||
      definition.keywords.some((keyword) =>
        keyword.toLowerCase().includes(normalizedQuery),
      )
    );
  });
}

function paginateShapes({
  shapes,
  options,
}: {
  shapes: ShapeGraphicPreset[];
  options?: { page?: number; limit?: number };
}): { items: ShapeGraphicPreset[]; hasMore: boolean; total: number } {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, options?.limit ?? getShapePresets().length);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pagedItems = shapes.slice(startIndex, endIndex);
  return {
    items: pagedItems,
    hasMore: endIndex < shapes.length,
    total: shapes.length,
  };
}

export const shapesProvider: StickerProvider = {
  id: SHAPES_PROVIDER_ID,
  async search({
    query,
    options,
  }: {
    query: string;
    options?: { limit?: number };
  }): Promise<StickerSearchResult> {
    const filteredShapes = filterShapesByQuery({ query });
    const paged = paginateShapes({
      shapes: filteredShapes,
      options: { page: 1, limit: options?.limit ?? getShapePresets().length },
    });
    return {
      items: paged.items.map((preset) => toStickerItem({ preset })),
      total: paged.total,
      hasMore: paged.hasMore,
    };
  },
  async browse({
    options,
  }: {
    options?: { page?: number; limit?: number };
  }): Promise<StickerBrowseResult> {
    const paged = paginateShapes({
      shapes: getShapePresets(),
      options,
    });
    return {
      sections: [
        {
          id: "all",
          items: paged.items.map((preset) => toStickerItem({ preset })),
          hasMore: paged.hasMore,
          layout: "grid",
        },
      ],
    };
  },
  resolveUrl({
    stickerId,
  }: {
    stickerId: string;
    options?: { width?: number; height?: number };
  }): string {
    const preset = parseShapeStickerId({ stickerId });
    return buildShapeUrl({ shapeKey: preset?.shapeKey ?? "rectangle" });
  },
};
