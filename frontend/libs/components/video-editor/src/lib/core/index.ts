import { SelectionManager } from "./managers/selection-manager";
import { DiagnosticsManager } from "./managers/diagnostics-manager";

// Partial EditorCore — only the managers that have been ported so far
// are wired up. Each manager gets a back-reference to the core so it
// can coordinate with siblings (e.g. ClipboardManager.copy needs
// editor.selection.getSelectedElements()). As more managers port, they
// join this constructor in opencut's original order:
//
//   command, timeline, playback, scenes, project, media, renderer,
//   save, audio, selection, clipboard, diagnostics
//
// The not-yet-ported managers will appear as optional/undefined fields
// during the migration, but consumers should treat the eventual surface
// as required.
export class EditorCore {
  private static instance: EditorCore | null = null;

  public readonly selection: SelectionManager;
  public readonly diagnostics: DiagnosticsManager;

  private constructor() {
    this.selection = new SelectionManager(this);
    this.diagnostics = new DiagnosticsManager(this);
  }

  static getInstance(): EditorCore {
    if (!EditorCore.instance) {
      EditorCore.instance = new EditorCore();
    }
    return EditorCore.instance;
  }

  static reset(): void {
    EditorCore.instance = null;
  }
}
