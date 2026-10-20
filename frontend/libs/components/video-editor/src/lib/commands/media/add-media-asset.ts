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

    // FIX: undo used to put back the whole asset list snapshotted in execute(),
    // which also threw away every asset added AFTER this command by something
    // outside the undo history (the assets panel and timeline drag-drop call
    // editor.media.addMediaAsset directly). Remove only the entry this command
    // appended instead. execute() appends at the end, so it is the last entry
    // with this id; removing just that one also leaves a same-id asset that was
    // already in the bin untouched. If it is already gone there is nothing to do.
    const current = editor.media.getAssets();
    const appendedIndex = current.map((a) => a.id).lastIndexOf(this.asset.id);
    if (appendedIndex !== -1) {
      editor.media.setAssets({
        assets: [
          ...current.slice(0, appendedIndex),
          ...current.slice(appendedIndex + 1),
        ],
      });
    }

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
