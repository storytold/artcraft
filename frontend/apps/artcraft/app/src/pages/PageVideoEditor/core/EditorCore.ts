import { CommandManager } from "./managers/CommandManager";
import { PlaybackManager } from "./managers/PlaybackManager";
import { TimelineManager } from "./managers/TimelineManager";
import { ScenesManager } from "./managers/ScenesManager";
import { ProjectManager } from "./managers/ProjectManager";
import { MediaManager } from "./managers/MediaManager";
import { RendererManager } from "./managers/RendererManager";
import { SelectionManager } from "./managers/SelectionManager";

export class VideoEditorCore {
  private static instance: VideoEditorCore | null = null;

  public readonly command: CommandManager;
  public readonly playback: PlaybackManager;
  public readonly timeline: TimelineManager;
  public readonly scenes: ScenesManager;
  public readonly project: ProjectManager;
  public readonly media: MediaManager;
  public readonly renderer: RendererManager;
  public readonly selection: SelectionManager;

  private constructor() {
    this.command = new CommandManager();
    this.playback = new PlaybackManager(this);
    this.timeline = new TimelineManager(this);
    this.scenes = new ScenesManager(this);
    this.project = new ProjectManager(this);
    this.media = new MediaManager(this);
    this.renderer = new RendererManager();
    this.selection = new SelectionManager();
  }

  static getInstance(): VideoEditorCore {
    if (!VideoEditorCore.instance) {
      VideoEditorCore.instance = new VideoEditorCore();
    }
    return VideoEditorCore.instance;
  }

  static reset(): void {
    if (VideoEditorCore.instance) {
      VideoEditorCore.instance.media.clearAllAssets();
      VideoEditorCore.instance.command.clear();
      VideoEditorCore.instance.selection.clearSelection();
    }
    VideoEditorCore.instance = null;
  }
}
