import type { VideoEditorCore } from "../EditorCore";
import type { TScene, TimelineTrack, VideoTrack } from "../../types";

let sceneCounter = 1;

export class ScenesManager {
  private active: TScene | null = null;
  private list: TScene[] = [];
  private listeners = new Set<() => void>();

  constructor(private editor: VideoEditorCore) {
    void this.editor;
  }

  initializeScenes({
    scenes,
    currentSceneId,
  }: {
    scenes: TScene[];
    currentSceneId?: string;
  }): void {
    this.list = scenes;
    this.active = currentSceneId
      ? (scenes.find((s) => s.id === currentSceneId) ?? scenes[0] ?? null)
      : (scenes[0] ?? null);
    this.notify();
  }

  createDefaultScene(): TScene {
    const mainTrack: VideoTrack = {
      id: `track-main-${Date.now()}`,
      name: "Main",
      type: "video",
      elements: [],
      isMain: true,
      muted: false,
      hidden: false,
    };
    const scene: TScene = {
      id: `scene-${sceneCounter++}`,
      name: "Scene 1",
      tracks: [mainTrack],
    };
    this.list = [scene];
    this.active = scene;
    this.notify();
    return scene;
  }

  getActiveScene(): TScene | null {
    return this.active;
  }

  getScenes(): TScene[] {
    return this.list;
  }

  updateSceneTracks({ tracks }: { tracks: TimelineTrack[] }): void {
    if (!this.active) return;
    const updatedScene: TScene = { ...this.active, tracks };
    this.list = this.list.map((s) =>
      s.id === this.active?.id ? updatedScene : s,
    );
    this.active = updatedScene;
    this.notify();
  }

  clearScenes(): void {
    this.list = [];
    this.active = null;
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
