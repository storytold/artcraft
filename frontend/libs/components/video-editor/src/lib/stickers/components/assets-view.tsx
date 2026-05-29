"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { DraggableItem } from "../../panels/assets/draggable-item";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useEditor } from "../../editor/use-editor";
import { useEditorAdapters } from "../../EditorProvider";
import { resolveStickerIntrinsicSize } from "..";
import {
  buildGraphicElement,
  buildStickerElement,
} from "../../timeline/element-utils";
import { STICKER_CATEGORIES } from "../categories";
import { parseShapeStickerId } from "../providers/shapes";
import type { TimelineDragData } from "../../timeline/drag";
import type {
  StickerBrowseSection,
  StickerCategory,
  StickerItem as StickerData,
} from "..";
import { useStickersStore } from "../stickers-store";
import { cn } from "../../utils/ui";
import { HappyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function StickersView() {
  const {
    browseContent,
    browseStickers,
    searchQuery,
    searchStickers,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    viewMode,
  } = useStickersStore();

  useEffect(() => {
    if (viewMode === "browse" && !browseContent) {
      void browseStickers();
    }
  }, [browseContent, browseStickers, viewMode]);

  return (
    <div className="flex h-full flex-col py-2">
      <div className="px-2">
        <Input
          size="sm"
          variant="default"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery({ query: e.target.value });
            void searchStickers({ query: e.target.value });
          }}
          showClearIcon
          onClear={() => {
            setSearchQuery({ query: "" });
            void searchStickers({ query: "" });
          }}
          className="w-full"
          containerClassName="w-full"
        />
      </div>

      <Tabs
        value={selectedCategory}
        onValueChange={(value) => {
          setSelectedCategory({ category: value as StickerCategory });
        }}
        variant="underline"
        className="mt-2 flex min-h-0 flex-1 flex-col"
      >
        <TabsList aria-label="Sticker categories">
          {Object.entries(STICKER_CATEGORIES).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
          <StickersContentView />
        </div>
      </Tabs>
    </div>
  );
}

function InlineSpinner({ className }: { className?: string }) {
  // The OpenCut Classic shell ships a dedicated Spinner component
  // backed by HugeIcons. The lib doesn't ship a primitive of its own,
  // so we inline a minimal pure-SVG ring that matches the visual.
  return (
    <svg
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4 animate-spin", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StickerGrid({
  items,
  shouldCapSize = false,
}: {
  items: StickerData[];
  shouldCapSize?: boolean;
}) {
  const gridStyle: CSSProperties & {
    "--sticker-min": string;
    "--sticker-max"?: string;
  } = {
    gridTemplateColumns: shouldCapSize
      ? "repeat(auto-fill, minmax(var(--sticker-min, 80px), var(--sticker-max, 140px)))"
      : "repeat(auto-fill, minmax(var(--sticker-min, 80px), 1fr))",
    "--sticker-min": "80px",
    ...(shouldCapSize ? { "--sticker-max": "140px" } : {}),
  };

  return (
    <div className="grid gap-2" style={gridStyle}>
      {items.map((item) => (
        <StickerItem key={item.id} item={item} shouldCapSize={shouldCapSize} />
      ))}
    </div>
  );
}

function StickerRow({ items }: { items: StickerData[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
      {items.map((item) => (
        <div key={item.id} className="w-20 shrink-0">
          <StickerItem item={item} shouldCapSize containerClassName="w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyView({ message }: { message: string }) {
  return (
    <div className="bg-background flex h-full flex-col items-center justify-center gap-3 p-4">
      <HugeiconsIcon
        icon={HappyIcon}
        className="text-muted-foreground size-10"
      />
      <div className="flex flex-col gap-2 text-center">
        <p className="text-lg font-medium">No stickers found</p>
        <p className="text-muted-foreground text-sm text-balance">{message}</p>
      </div>
    </div>
  );
}

function StickersContentView() {
  const {
    browseContent,
    clearRecentStickers,
    isBrowsing,
    isSearching,
    searchQuery,
    searchResults,
    selectedCategory,
    setSelectedCategory,
    viewMode,
  } = useStickersStore();

  if (viewMode === "search") {
    if (isSearching) {
      return (
        <div className="flex items-center justify-center py-8">
          <InlineSpinner className="text-muted-foreground size-6" />
        </div>
      );
    }

    if (searchResults?.items.length) {
      return (
        <div className="flex flex-col gap-3 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {searchResults.total} results
            </span>
          </div>
          <StickerGrid items={searchResults.items} />
        </div>
      );
    }

    // "all" tab search — sections are in browseContent, fall through to section rendering below
    if (selectedCategory !== "all" && searchQuery) {
      return <EmptyView message={`No stickers found for "${searchQuery}"`} />;
    }
  }

  if (isBrowsing && !browseContent) {
    return (
      <div className="flex items-center justify-center py-8">
        <InlineSpinner className="text-muted-foreground size-6" />
      </div>
    );
  }

  if (!browseContent?.sections.length) {
    const categoryLabel = STICKER_CATEGORIES[selectedCategory];
    return (
      <EmptyView
        message={
          viewMode === "search"
            ? `No stickers found for "${searchQuery}"`
            : selectedCategory === "all"
              ? "No stickers available yet."
              : `No stickers available in ${categoryLabel.toLowerCase()} yet.`
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {browseContent.sections.map((section) => (
        <StickerSection
          key={section.id}
          section={section}
          onClearRecent={clearRecentStickers}
          onSeeAll={(category) => {
            setSelectedCategory({ category });
          }}
        />
      ))}
    </div>
  );
}

function StickerSection({
  section,
  onClearRecent,
  onSeeAll,
}: {
  section: StickerBrowseSection;
  onClearRecent: () => void;
  onSeeAll: (category: StickerCategory) => void;
}) {
  const hasHeader =
    Boolean(section.title) || section.id === "recent" || section.action;

  return (
    <div className="flex flex-col gap-2">
      {hasHeader && (
        <div className="flex items-center justify-between gap-2">
          {section.title ? (
            <p className="text-xs text-muted-foreground">{section.title}</p>
          ) : (
            <div />
          )}

          <div className="ml-auto flex items-center gap-2">
            {section.id === "recent" && (
              <Button
                onClick={onClearRecent}
                variant="text"
                size="sm"
                className="h-auto gap-1 p-0 text-xs text-muted-foreground"
              >
                Clear
              </Button>
            )}

            {section.action?.type === "see-all" && section.action.category && (
              <Button
                variant="text"
                size="sm"
                className="h-auto gap-1 p-0 text-xs text-primary"
                onClick={() => {
                  onSeeAll(section.action?.category as StickerCategory);
                }}
              >
                See all
              </Button>
            )}
          </div>
        </div>
      )}

      {section.layout === "row" ? (
        <StickerRow items={section.items} />
      ) : (
        <StickerGrid items={section.items} />
      )}
    </div>
  );
}

interface StickerItemProps {
  item: StickerData;
  shouldCapSize?: boolean;
  containerClassName?: string;
}

function StickerItem({
  item,
  shouldCapSize = false,
  containerClassName,
}: StickerItemProps) {
  const editor = useEditor();
  const { toast } = useEditorAdapters();
  const { addToRecentStickers } = useStickersStore();
  const [isAdding, setIsAdding] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    if (!item.id) {
      return;
    }

    setHasImageError(false);
  }, [item.id]);

  const displayName = item.name;
  const shapePreset =
    item.provider === "shapes" ? parseShapeStickerId({ stickerId: item.id }) : null;

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      const currentTime = editor.playback.getCurrentTime();

      let element:
        | ReturnType<typeof buildGraphicElement>
        | ReturnType<typeof buildStickerElement>;
      if (shapePreset) {
        element = buildGraphicElement({
          definitionId: shapePreset.definitionId,
          name: shapePreset.name,
          startTime: currentTime,
          params: shapePreset.params,
        });
      } else {
        const { width: intrinsicWidth, height: intrinsicHeight } =
          await resolveStickerIntrinsicSize({ stickerId: item.id });
        element = buildStickerElement({
          stickerId: item.id,
          name: item.name,
          startTime: currentTime,
          intrinsicWidth,
          intrinsicHeight,
        });
      }

      editor.timeline.insertElement({
        placement: { mode: "auto" },
        element,
      });

      addToRecentStickers({ stickerId: item.id });
    } catch (error) {
      console.error("Failed to add sticker:", error);
      toast.error("Failed to add sticker to timeline");
    } finally {
      setIsAdding(false);
    }
  };

  const preview = (
    <div className="flex size-full items-center justify-center p-3">
      {hasImageError ? (
        <span className="text-muted-foreground text-center text-xs break-all">
          {displayName}
        </span>
      ) : (
        <img
          src={item.previewUrl}
          alt={displayName}
          width={64}
          height={64}
          className="size-full object-contain"
          style={
            shouldCapSize
              ? {
                  maxWidth: "var(--sticker-max, 160px)",
                  maxHeight: "var(--sticker-max, 160px)",
                }
              : undefined
          }
          onError={() => setHasImageError(true)}
          loading="lazy"
        />
      )}
    </div>
  );

  const dragData: TimelineDragData = shapePreset
    ? {
        id: item.id,
        type: "graphic",
        name: displayName,
        definitionId: shapePreset.definitionId,
        params: shapePreset.params ?? {},
      }
    : {
        id: item.id,
        type: "sticker",
        name: displayName,
        stickerId: item.id,
      };

  return (
    <div
      className={cn("relative", isAdding && "pointer-events-none opacity-50")}
    >
      <DraggableItem
        name={displayName}
        preview={preview}
        dragData={dragData}
        onAddToTimeline={handleAdd}
        aspectRatio={1}
        shouldShowLabel={false}
        isRounded
        variant="card"
        containerClassName={containerClassName ?? "w-full"}
      />
      {isAdding && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/60">
          <InlineSpinner className="size-6 text-white" />
        </div>
      )}
    </div>
  );
}
