import type { EditorCore } from "../index";
import type { Bookmark, SceneTracks, TScene } from "../../timeline/types";
import {
  getMainScene,
  ensureMainScene,
  canDeleteScene,
} from "../../timeline/scenes";
import {
  getBookmarkAtTime,
  getFrameTime,
  isBookmarkAtTime,
} from "../../timeline/bookmarks";
import {
  CreateSceneCommand,
  DeleteSceneCommand,
  MoveBookmarkCommand,
  RemoveBookmarkCommand,
  RenameSceneCommand,
  ToggleBookmarkCommand,
  UpdateBookmarkCommand,
} from "../../commands/scene";
import type { MediaTime } from "../../wasm";

export class ScenesManager {
  private active: TScene | null = null;
  private list: TScene[] = [];
  private listeners = new Set<() => void>();

  constructor(private editor: EditorCore) {}

  async createScene({
    name,
    isMain = false,
  }: {
    name: string;
    isMain: boolean;
  }): Promise<string> {
    if (!this.editor.project.getActive()) {
      throw new Error("No active project");
    }

    const command = new CreateSceneCommand({ name, isMain });
    this.editor.command.execute({ command });
    return command.getSceneId();
  }

  async deleteScene({ sceneId }: { sceneId: string }): Promise<void> {
    const sceneToDelete = this.list.find((s) => s.id === sceneId);

    if (!sceneToDelete) {
      throw new Error("Scene not found");
    }

    const { canDelete, reason } = canDeleteScene({ scene: sceneToDelete });
    if (!canDelete) {
      throw new Error(reason);
    }

    if (!this.editor.project.getActive()) {
      throw new Error("No active project");
    }

    const command = new DeleteSceneCommand(sceneId);
    this.editor.command.execute({ command });
  }

  async renameScene({
    sceneId,
    name,
  }: {
    sceneId: string;
    name: string;
  }): Promise<void> {
    if (!this.editor.project.getActive()) {
      throw new Error("No active project");
    }

    const command = new RenameSceneCommand({
      sceneId,
      newName: name,
    });
    this.editor.command.execute({ command });
  }

  async switchToScene({ sceneId }: { sceneId: string }): Promise<void> {
    const targetScene = this.list.find((s) => s.id === sceneId);

    if (!targetScene) {
      throw new Error("Scene not found");
    }

    const activeProject = this.editor.project.getActive();

    if (activeProject) {
      const updatedProject = {
        ...activeProject,
        currentSceneId: sceneId,
        metadata: {
          ...activeProject.metadata,
          updatedAt: new Date(),
        },
      };

      this.editor.project.setActiveProject({ project: updatedProject });
    }

    this.active = targetScene;
    this.notify();
  }

  async toggleBookmark({ time }: { time: MediaTime }): Promise<void> {
    const command = new ToggleBookmarkCommand(time);
    this.editor.command.execute({ command });
  }

  isBookmarked({ time }: { time: MediaTime }): boolean {
    const activeScene = this.getActiveScene();
    const activeProject = this.editor.project.getActive();

    if (!activeScene || !this.active || !activeProject) return false;

    const frameTime = getFrameTime({
      time,
      fps: activeProject.settings.fps,
    });

    return isBookmarkAtTime({ bookmarks: activeScene.bookmarks, frameTime });
  }

  async removeBookmark({ time }: { time: MediaTime }): Promise<void> {
    const command = new RemoveBookmarkCommand(time);
    this.editor.command.execute({ command });
  }

  async updateBookmark({
    time,
    updates,
  }: {
    time: MediaTime;
    updates: Partial<Omit<Bookmark, "time">>;
  }): Promise<void> {
    const command = new UpdateBookmarkCommand({ time, updates });
    this.editor.command.execute({ command });
  }

  async moveBookmark({
    fromTime,
    toTime,
  }: {
    fromTime: MediaTime;
    toTime: MediaTime;
  }): Promise<void> {
    const command = new MoveBookmarkCommand({ fromTime, toTime });
    this.editor.command.execute({ command });
  }

  getBookmarkAtTime({ time }: { time: MediaTime }) {
    const activeScene = this.active;
    const activeProject = this.editor.project.getActive();

    if (!activeScene || !activeProject) return null;

    const frameTime = getFrameTime({
      time,
      fps: activeProject.settings.fps,
    });

    return getBookmarkAtTime({
      bookmarks: activeScene.bookmarks,
      frameTime,
    });
  }

  initializeScenes({
    scenes,
    currentSceneId,
  }: {
    scenes: TScene[];
    currentSceneId?: string;
  }): void {
    const ensuredScenes = ensureMainScene({ scenes });
    const currentScene = currentSceneId
      ? ensuredScenes.find((s) => s.id === currentSceneId)
      : null;

    const fallbackScene = getMainScene({ scenes: ensuredScenes });

    this.list = ensuredScenes;
    this.active = currentScene || fallbackScene;
    this.notify();

    const hasAddedMainScene = ensuredScenes.length > scenes.length;
    if (hasAddedMainScene) {
      const activeProject = this.editor.project.getActive();

      if (activeProject) {
        const updatedProject = {
          ...activeProject,
          scenes: ensuredScenes,
          metadata: {
            ...activeProject.metadata,
            updatedAt: new Date(),
          },
        };

        this.editor.project.setActiveProject({ project: updatedProject });
        this.editor.save.markDirty({ force: true });
      }
    }
  }

  clearScenes(): void {
    this.list = [];
    this.active = null;
    this.notify();
  }

  getActiveScene(): TScene {
    if (!this.active) {
      throw new Error("No active scene.");
    }
    return this.active;
  }

  getActiveSceneOrNull(): TScene | null {
    return this.active;
  }

  getScenes(): TScene[] {
    return this.list;
  }

  setScenes({
    scenes,
    activeSceneId,
  }: {
    scenes: TScene[];
    activeSceneId?: string;
  }): void {
    this.list = scenes;
    const nextActiveSceneId = activeSceneId ?? this.active?.id ?? null;
    this.active = nextActiveSceneId
      ? (scenes.find((scene) => scene.id === nextActiveSceneId) ?? null)
      : null;
    this.notify();

    const activeProject = this.editor.project.getActive();
    if (activeProject) {
      const updatedProject = {
        ...activeProject,
        scenes,
        metadata: {
          ...activeProject.metadata,
          updatedAt: new Date(),
        },
      };
      this.editor.project.setActiveProject({ project: updatedProject });
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  updateSceneTracks({ tracks }: { tracks: SceneTracks }): void {
    if (!this.active) return;

    const updatedScene: TScene = {
      ...this.active,
      tracks,
      updatedAt: new Date(),
    };

    this.list = this.list.map((s) =>
      s.id === this.active?.id ? updatedScene : s,
    );
    this.active = updatedScene;
    this.notify();

    const activeProject = this.editor.project.getActive();
    if (activeProject) {
      const updatedProject = {
        ...activeProject,
        scenes: this.list,
        metadata: {
          ...activeProject.metadata,
          updatedAt: new Date(),
        },
      };
      this.editor.project.setActiveProject({ project: updatedProject });
    }
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      fn();
    });
  }
}
