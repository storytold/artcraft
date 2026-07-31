/**
 * Pagination helpers.
 *
 * The real backend uses opaque encrypted row-id cursors. The fake uses a plain
 * offset — opaque enough for a client that only ever echoes it back, and much
 * easier to reason about when a list looks wrong.
 */

const DEFAULT_PAGE_SIZE = 25;

export interface PaginationCursors {
  maybe_next: string | null;
  maybe_previous: string | null;
  cursor_is_reversed: boolean;
}

export interface PaginationPage {
  current: number;
  total_page_count: number;
}

export interface CursorPage<T> {
  results: T[];
  pagination: PaginationCursors;
}

export interface IndexedPage<T> {
  results: T[];
  pagination: PaginationPage;
}

export function paginateByCursor<T>(
  records: T[],
  options: { cursor?: string; pageSize?: number; cursorIsReversed?: boolean },
): CursorPage<T> {
  const pageSize = clampPageSize(options.pageSize);
  const offset = decodeCursor(options.cursor);
  const results = records.slice(offset, offset + pageSize);

  const hasNext = offset + pageSize < records.length;
  const hasPrevious = offset > 0;

  return {
    results,
    pagination: {
      maybe_next: hasNext ? encodeCursor(offset + pageSize) : null,
      maybe_previous: hasPrevious ? encodeCursor(Math.max(0, offset - pageSize)) : null,
      cursor_is_reversed: options.cursorIsReversed ?? false,
    },
  };
}

export function paginateByIndex<T>(
  records: T[],
  options: { pageIndex?: number; pageSize?: number },
): IndexedPage<T> {
  const pageSize = clampPageSize(options.pageSize);
  const pageIndex = Math.max(0, options.pageIndex ?? 0);

  return {
    results: records.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    pagination: {
      current: pageIndex,
      total_page_count: Math.max(1, Math.ceil(records.length / pageSize)),
    },
  };
}

/** Cursor for the `maybe_cursor` style used by folders and tags (a bare next cursor). */
export function nextCursorOnly(records: unknown[], offset: number, pageSize: number): string | null {
  return offset + pageSize < records.length ? encodeCursor(offset + pageSize) : null;
}

export function decodeCursor(cursor: string | undefined): number {
  if (cursor === undefined) {
    return 0;
  }
  const parsed = Number.parseInt(Buffer.from(cursor, "base64url").toString("utf8"), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

export function clampPageSize(pageSize: number | undefined): number {
  if (pageSize === undefined || pageSize <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(pageSize, 1000);
}
