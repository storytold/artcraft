import { Command, type CommandResult } from "../base-command";
import { EditorCore } from "../../core";
import type { TScene } from "../../timeline/types";
import { buildDefaultScene } from "../../timeline/scenes";

export class CreateSceneCommand extends Command {
  private savedScenes: TScene[] | null = null;
  private createdScene: TScene | null = null;

  constructor({
    name,
    isMain = false,
  }: {
    name: string;
    isMain?: boolean;
  }) {
    super();
    this.name = name;
    this.isMain = isMain;
  }

  private name: string;
  private isMain: boolean;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedScenes = [...editor.scenes.getScenes()];

    this.createdScene = buildDefaultScene({
      name: this.name,
      isMain: this.isMain,
    });

    const updatedScenes = [...this.savedScenes, this.createdScene];
    editor.scenes.setScenes({ scenes: updatedScenes });
    return undefined;
  }

  undo(): void {
    if (this.savedScenes) {
      const editor = EditorCore.getInstance();
      editor.scenes.setScenes({ scenes: this.savedScenes });
    }
  }

  getSceneId(): string {
    return this.createdScene?.id ?? "";
  }
}
