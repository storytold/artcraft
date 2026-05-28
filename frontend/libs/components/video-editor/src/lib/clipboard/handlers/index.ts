import type {
  ClipboardEntry,
  ClipboardEntryType,
  ClipboardHandler,
  ClipboardHandlerMap,
  CopyContext,
  PasteContext,
} from "../types";
import { ElementsClipboardHandler } from "./elements";
import { KeyframesClipboardHandler } from "./keyframes";

export const clipboardHandlers = {
  elements: ElementsClipboardHandler,
  keyframes: KeyframesClipboardHandler,
} satisfies ClipboardHandlerMap;

export const clipboardCopyHandlers = [
  KeyframesClipboardHandler,
  ElementsClipboardHandler,
] as const satisfies readonly ClipboardHandler<ClipboardEntryType>[];

export function copyClipboardEntry({
  context,
}: {
  context: CopyContext;
}): ClipboardEntry | null {
  for (const handler of clipboardCopyHandlers) {
    if (!handler.canCopy(context)) {
      continue;
    }

    return handler.copy(context);
  }

  return null;
}

export function buildPasteClipboardCommand({
  entry,
  context,
}: {
  entry: ClipboardEntry;
  context: PasteContext;
}) {
  const handler = clipboardHandlers[entry.type] as ClipboardHandler<
    typeof entry.type
  >;
  return handler.paste({ entry: entry as never, context });
}
