import { Command, type CommandResult } from "../base-command";
import { EditorCore } from "../../core";
import type { MediaAsset } from "../../media/types";
import { generateUUID } from "../../utils/id";
import type { FrameRate } from "opencut-wasm";

export class AddMediaAssetCommand extends Command {
  private assetId: string;
  private savedAssets: MediaAsset[] | null = null;
  private createdAsset: MediaAsset | null = null;
  private previousProjectFps: FrameRate | null = null;
  private appliedProjectFps: FrameRate | null = null;

  constructor({
    projectId,
    asset,
  }: {
    projectId: string;
    asset: Omit<MediaAsset, "id">;
  }) {
    super();
    this.projectId = projectId;
    this.asset = asset;
    this.assetId = generateUUID();
  }

  private projectId: string;
  private asset: Omit<MediaAsset, "id">;

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    this.savedAssets = [...editor.media.getAssets()];

    this.createdAsset = {
      ...this.asset,
      id: this.assetId,
    };

    editor.media.setAssets({
      assets: [...this.savedAssets, this.createdAsset],
    });
    this.previousProjectFps = editor.project.getActiveOrNull()?.settings.fps ?? null;
    this.appliedProjectFps = editor.project.ratchetFpsForImportedMedia({
      importedAssets: [this.createdAsset],
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
    return this.assetId;
  }
}
