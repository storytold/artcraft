import { Command, type CommandResult } from "../base-command";
import { EditorCore } from "../../core";
import type { MediaAsset } from "../../media/types";
import type { FrameRate } from "opencut-wasm";

export class AddMediaAssetCommand extends Command {
  private savedAssets: MediaAsset[] | null = null;
  private previousProjectFps: FrameRate | null = null;
  private appliedProjectFps: FrameRate | null = null;

  constructor({
    projectId,
    asset,
  }: {
    projectId: string;
    asset: MediaAsset;
  }) {
    super();
    this.projectId = projectId;
    this.asset = asset;
  }

  private projectId: string;
  private asset: MediaAsset;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedAssets = [...editor.media.getAssets()];

    editor.media.setAssets({
      assets: [...this.savedAssets, this.asset],
    });
    this.previousProjectFps = editor.project.getActiveOrNull()?.settings.fps ?? null;
    this.appliedProjectFps = editor.project.ratchetFpsForImportedMedia({
      importedAssets: [this.asset],
    });

    // Persistence handled by host via ProjectStorageAdapter
    return undefined;
  }

  undo(): void {
    if (!this.savedAssets) return;
    const editor = EditorCore.getInstance();
    editor.media.setAssets({ assets: this.savedAssets });

    // If execute() ratcheted the project FPS up to accommodate this
    // media, roll it back. previousProjectFps is the rate the project
    // had before this command ran.
    if (this.appliedProjectFps && this.previousProjectFps) {
      const activeProject = editor.project.getActive();
      if (activeProject) {
        editor.project.setActiveProject({
          project: {
            ...activeProject,
            settings: {
              ...activeProject.settings,
              fps: this.previousProjectFps,
            },
          },
        });
      }
    }

    // Persistence handled by host via ProjectStorageAdapter
  }

  getAssetId(): string {
    return this.asset.id;
  }
}
