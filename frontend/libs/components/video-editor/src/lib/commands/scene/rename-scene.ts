import { Command, type CommandResult } from "../base-command";
import { EditorCore } from "../../core";
import type { TScene } from "../../timeline/types";
import { updateSceneInArray } from "../../timeline/scenes";

export class RenameSceneCommand extends Command {
  private savedScenes: TScene[] | null = null;
  private previousName: string | null = null;

  constructor({
    sceneId,
    newName,
  }: {
    sceneId: string;
    newName: string;
  }) {
    super();
    this.sceneId = sceneId;
    this.newName = newName;
  }

  private sceneId: string;
  private newName: string;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    const scenes = editor.scenes.getScenes();

    this.savedScenes = [...scenes];

    const scene = scenes.find((s: TScene) => s.id === this.sceneId);
    if (!scene) {
      console.error("Scene not found:", this.sceneId);
      return;
    }

    this.previousName = scene.name;

    const updatedScenes = updateSceneInArray({
      scenes,
      sceneId: this.sceneId,
      updates: { name: this.newName, updatedAt: new Date() },
    });

    editor.scenes.setScenes({ scenes: updatedScenes });
  }

  undo(): void {
    if (this.savedScenes && this.previousName !== null) {
      const editor = EditorCore.getInstance();
      editor.scenes.setScenes({ scenes: this.savedScenes });
    }
  }
}
