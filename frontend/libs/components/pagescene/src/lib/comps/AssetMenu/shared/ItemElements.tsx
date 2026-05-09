import { ItemElement } from "./ItemElement";
import type { MediaItem } from "../../../models/assets";
import { LoadingDots } from "@storyteller/ui-loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEmptySet } from "@fortawesome/pro-solid-svg-icons";
import { AutoSizer, Grid } from "react-virtualized";
import "react-virtualized/styles.css";

interface Props {
  busy?: boolean;
  className?: string;
  debug?: string;
  items: MediaItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const ItemElements = ({
  busy,
  className,
  debug,
  items,
  onLoadMore,
  hasMore,
}: Props) => {
  const GRID_GAP = 12;
  const ASPECT_RATIO = 16 / 12;
  const TEXT_HEIGHT = 32;
  const COLUMN_COUNT = 4;

  const rowCount = Math.ceil(items.length / COLUMN_COUNT);

  const cellRenderer = ({
    columnIndex,
    rowIndex,
    key,
    style,
  }: {
    columnIndex: number;
    rowIndex: number;
    key: string;
    style: React.CSSProperties;
  }) => {
    const index = rowIndex * COLUMN_COUNT + columnIndex;
    if (index >= items.length) return null;

    const containerWidth = (style.width as number) - GRID_GAP;
    const containerHeight = (style.height as number) - GRID_GAP;

    const adjustedStyle = {
      ...style,
      left: `${(style.left as number) + GRID_GAP / 2}px`,
      top: `${(style.top as number) + GRID_GAP / 2}px`,
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,
      padding: 0,
    };

    return (
      <div key={key} style={adjustedStyle}>
        <ItemElement debug={debug} item={items[index]} />
      </div>
    );
  };

  const handleScroll = ({
    clientHeight,
    scrollHeight,
    scrollTop,
  }: {
    clientHeight: number;
    scrollHeight: number;
    scrollTop: number;
  }) => {
    if (!onLoadMore || !hasMore || busy) return;

    const threshold = 100; // pixels from bottom
    const bottom = scrollHeight - clientHeight - scrollTop;
    if (bottom < threshold) {
      onLoadMore();
    }
  };

  if (busy && items.length === 0) {
    return (
      <div className="flex h-full w-full">
        <LoadingDots className="bg-transparent" />
      </div>
    );
  }

  if (items.length === 0 && !busy) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <FontAwesomeIcon
          icon={faEmptySet}
          className="mb-4 text-4xl opacity-30"
        />
        <h4>You do not have anything here.</h4>
        <p className="text-sm opacity-75">Please upload some assets.</p>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className || ""}`}>
      <AutoSizer className="w-full">
        {({ height, width }) => {
          const cellWidth = Math.floor(
            (width - GRID_GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT,
          );
          const imageHeight = Math.floor(cellWidth / ASPECT_RATIO);
          const cellHeight = imageHeight + TEXT_HEIGHT + GRID_GAP;

          return (
            <Grid
              cellRenderer={cellRenderer}
              columnCount={COLUMN_COUNT}
              columnWidth={cellWidth + GRID_GAP}
              height={height - GRID_GAP}
              rowCount={rowCount}
              rowHeight={cellHeight}
              width={width}
              style={{ outline: "none" }}
              overscanRowCount={2}
              onScroll={handleScroll}
            />
          );
        }}
      </AutoSizer>
      {busy && hasMore && (
        <div className="flex w-full justify-center py-4">
          <LoadingDots className="bg-transparent" />
        </div>
      )}
    </div>
  );
};
