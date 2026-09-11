import { Command, type CommandResult } from "../base-command";
import { EditorCore } from "../../core";
import type { TScene } from "../../timeline/types";
import { canDeleteScene, getFallbackSceneAfterDelete } from "../../timeline/scenes";

export class DeleteSceneCommand extends Command {
  private savedScenes: TScene[] | null = null;
  private savedActiveSceneId: string | null = null;
  private deletedScene: TScene | null = null;

  constructor(private sceneId: string) {
    super();
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    const scenes = editor.scenes.getScenes();
    const activeScene = editor.scenes.getActiveScene();

    this.savedScenes = [...scenes];
    this.savedActiveSceneId = activeScene?.id ?? null;

    this.deletedScene = scenes.find((s: TScene) => s.id === this.sceneId) ?? null;

    if (!this.deletedScene) {
      console.error("Scene not found:", this.sceneId);
      return;
    }

    const { canDelete, reason } = canDeleteScene({ scene: this.deletedScene });
    if (!canDelete) {
      console.error("Cannot delete scene:", reason);
      return;
    }

    const updatedScenes = scenes.filter((s: TScene) => s.id !== this.sceneId);

    const newActiveScene = getFallbackSceneAfterDelete({
      scenes: updatedScenes,
      deletedSceneId: this.sceneId,
      currentSceneId: activeScene?.id ?? null,
    });

    editor.scenes.setScenes({
      scenes: updatedScenes,
      activeSceneId: newActiveScene?.id,
    });
  }

  undo(): void {
    if (this.savedScenes && this.deletedScene) {
      const editor = EditorCore.getInstance();
      editor.scenes.setScenes({
        scenes: this.savedScenes,
        activeSceneId: this.savedActiveSceneId ?? undefined,
      });
    }
  }
}
