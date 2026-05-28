import type { EditorCore } from "../index";
import {
  buildPasteClipboardCommand,
  copyClipboardEntry,
  type ClipboardEntry,
  type CopyContext,
  type PasteContext,
} from "../../clipboard";
import type { MediaTime } from "../../wasm";

export class ClipboardManager {
  private entry: ClipboardEntry | null = null;
  private listeners = new Set<() => void>();

  constructor(private editor: EditorCore) {}

  getEntry(): ClipboardEntry | null {
    return this.entry;
  }

  hasEntry(): boolean {
    return this.entry !== null;
  }

  copy(): boolean {
    const entry = copyClipboardEntry({
      context: this.getCopyContext(),
    });
    if (!entry) {
      return false;
    }

    this.entry = entry;
    this.notify();
    return true;
  }

  paste({ time }: { time?: MediaTime } = {}): boolean {
    if (!this.entry) {
      return false;
    }

    const command = buildPasteClipboardCommand({
      entry: this.entry,
      context: this.getPasteContext({ time }),
    });
    if (!command) {
      return false;
    }

    this.editor.command.execute({ command });
    return true;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private getCopyContext(): CopyContext {
    return {
      editor: this.editor,
      selectedElements: this.editor.selection.getSelectedElements(),
      selectedKeyframes: this.editor.selection.getSelectedKeyframes(),
    };
  }

  private getPasteContext({ time }: { time?: MediaTime }): PasteContext {
    return {
      editor: this.editor,
      selectedElements: this.editor.selection.getSelectedElements(),
      selectedKeyframes: this.editor.selection.getSelectedKeyframes(),
      time: time ?? this.editor.playback.getCurrentTime(),
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}
