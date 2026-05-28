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

  // Stub managers pending full port. Typed as `any` so command code
  // that references `editor.timeline.updateTracks(...)` etc. compiles
  // today; calls will fail at runtime until the real managers land.
  public readonly command: any = undefined as any;
  public readonly playback: any = undefined as any;
  public readonly scenes: any = undefined as any;
  public readonly project: any = undefined as any;
  public readonly media: any = undefined as any;
  public readonly renderer: any = undefined as any;
  public readonly save: any = undefined as any;
  public readonly audio: any = undefined as any;
  public readonly timeline: any = undefined as any;
  public readonly clipboard: any = undefined as any;

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
