import type { VideoEditorCore } from "../EditorCore";
import type { TProject, TProjectSettings } from "../../types";
import { DEFAULT_FPS, DEFAULT_CANVAS_SIZE } from "../../constants/project";

export class ProjectManager {
  private project: TProject | null = null;
  private listeners = new Set<() => void>();

  constructor(private editor: VideoEditorCore) {}

  createDefault(): void {
    const scene = this.editor.scenes.createDefaultScene();
    this.project = {
      id: `project-${Date.now()}`,
      name: "Untitled Project",
      scenes: [scene],
      currentSceneId: scene.id,
      settings: {
        fps: DEFAULT_FPS,
        canvasSize: { ...DEFAULT_CANVAS_SIZE },
        background: { type: "color", color: "#000000" },
      },
    };
    this.notify();
  }

  getActive(): TProject | null {
    return this.project;
  }

  getSettings(): TProjectSettings | null {
    return this.project?.settings ?? null;
  }

  updateSettings(updates: Partial<TProjectSettings>): void {
    if (!this.project) return;
    this.project = {
      ...this.project,
      settings: { ...this.project.settings, ...updates },
    };
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
