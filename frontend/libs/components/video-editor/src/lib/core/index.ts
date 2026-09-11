import { SelectionManager } from "./managers/selection-manager";
import { DiagnosticsManager } from "./managers/diagnostics-manager";
import { CommandManager } from "./managers/commands";
import { PlaybackManager } from "./managers/playback-manager";
import { ClipboardManager } from "./managers/clipboard-manager";
import { SaveManager } from "./managers/save-manager";
import { RendererManager } from "./managers/renderer-manager";
import { AudioManager } from "./managers/audio-manager";
import { ScenesManager } from "./managers/scenes-manager";
import { TimelineManager } from "./managers/timeline-manager";
import { MediaManager } from "./managers/media-manager";
import { ProjectManager } from "./managers/project-manager";
import { registerDefaultEffects } from "../effects";
import { registerDefaultMasks } from "../masks";
import type { VideoEditorAdapters } from "../adapters";
import { createDefaultAdapters } from "../adapters/default";

// Singleton coordinator for the editor. Manager construction order
// mirrors OpenCut's:
//   command, timeline, playback, scenes, project, media, renderer,
//   save, audio, selection, clipboard, diagnostics.
//
// Adapters land via `EditorCore.initialize({ adapters })`, called by
// EditorProvider on mount. If a command path calls getInstance() before
// initialize() has been wired up (e.g. tests), bundled defaults are
// used. Hosts that want their own adapters must call initialize() before
// mounting any panels.
export class EditorCore {
  private static instance: EditorCore | null = null;

  public readonly adapters: VideoEditorAdapters;

  public readonly command: CommandManager;
  public readonly timeline: TimelineManager;
  public readonly playback: PlaybackManager;
  public readonly scenes: ScenesManager;
  public readonly project: ProjectManager;
  public readonly media: MediaManager;
  public readonly renderer: RendererManager;
  public readonly save: SaveManager;
  public readonly audio: AudioManager;
  public readonly selection: SelectionManager;
  public readonly clipboard: ClipboardManager;
  public readonly diagnostics: DiagnosticsManager;

  private constructor(adapters: VideoEditorAdapters) {
    this.adapters = adapters;
    registerDefaultEffects();
    registerDefaultMasks();
    this.command = new CommandManager(this);
    this.timeline = new TimelineManager(this);
    this.playback = new PlaybackManager(this);
    this.scenes = new ScenesManager(this);
    this.project = new ProjectManager(this);
    this.media = new MediaManager(this);
    this.renderer = new RendererManager(this);
    this.save = new SaveManager({ editor: this });
    this.audio = new AudioManager(this);
    this.selection = new SelectionManager(this);
    this.clipboard = new ClipboardManager(this);
    this.diagnostics = new DiagnosticsManager(this);
    this.playback.bindTimelineScope();
    this.command.registerReactor(() => {
      const activeScene = this.scenes.getActiveSceneOrNull();
      if (!activeScene) {
        return;
      }

      const tracks = activeScene.tracks;
      const prunedTracks = {
        ...tracks,
        overlay: tracks.overlay.filter((track) => track.elements.length > 0),
        audio: tracks.audio.filter((track) => track.elements.length > 0),
      };
      if (
        prunedTracks.overlay.length !== tracks.overlay.length ||
        prunedTracks.audio.length !== tracks.audio.length
      ) {
        this.timeline.updateTracks(prunedTracks);
      }
    });
    this.save.start();
  }

  // First-call wins. Subsequent calls return the existing instance
  // regardless of the adapters supplied, so the typical host pattern
  // ("explicit initialize before VideoEditor mounts, then again from
  // EditorProvider") is safe — the host's adapter bundle stays in
  // effect. Hosts that want to swap adapters should call reset() first.
  static initialize({
    adapters,
  }: {
    adapters: VideoEditorAdapters;
  }): EditorCore {
    if (!EditorCore.instance) {
      EditorCore.instance = new EditorCore(adapters);
    }
    return EditorCore.instance;
  }

  static getInstance(): EditorCore {
    if (!EditorCore.instance) {
      EditorCore.instance = new EditorCore(createDefaultAdapters());
    }
    return EditorCore.instance;
  }

  static reset(): void {
    EditorCore.instance = null;
  }
}
