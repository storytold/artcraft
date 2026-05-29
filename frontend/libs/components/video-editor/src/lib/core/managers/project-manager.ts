import type { FrameRate } from "opencut-wasm";
import type { EditorCore } from "../index";
import type { TProject, TProjectSettings, TTimelineViewState } from "../../project/types";
import type { MediaAsset } from "../../media/types";
import type { ProjectMeta } from "../../adapters/types";
import type {
  ExportOptions,
  ExportResult,
} from "../../export";
import { UpdateProjectSettingsCommand } from "../../commands/project";
import { getRaisedProjectFpsForImportedMedia } from "../../fps/utils";

// Thin adapter-delegating ProjectManager. The OpenCut original (707
// LOC) handled IndexedDB CRUD, autosave migrations, project bytes
// serialization, etc. Per the lib's adapter contract, all of that
// belongs to the host's ProjectStorageAdapter. This manager only:
//   - holds the currently loaded project in memory
//   - exposes the surface SaveManager + ScenesManager + commands
//     depend on (getActive, setActiveProject, saveCurrentProject)
//   - delegates load/save/list to editor.adapters.projectStorage
//   - hosts the migrationState + isLoading flags that gate saves
//
// Methods only used by not-yet-ported panels (createNewProject,
// loadAllProjects, deleteProjects, renameProject, export, etc.)
// remain unimplemented — they'll land with the panels port (Task #9).

interface MigrationState {
  isMigrating: boolean;
}

export interface ExportProgressState {
  isExporting: boolean;
  progress: number;
  cancelled: boolean;
  error: string | null;
  result: ExportResult | null;
}

const INITIAL_EXPORT_STATE: ExportProgressState = {
  isExporting: false,
  progress: 0,
  cancelled: false,
  error: null,
  result: null,
};

export class ProjectManager {
  private active: TProject | null = null;
  private isLoading = false;
  private migrationState: MigrationState = { isMigrating: false };
  private listeners = new Set<() => void>();
  private exportState: ExportProgressState = { ...INITIAL_EXPORT_STATE };
  private exportCancelRequested = false;

  constructor(private editor: EditorCore) {}

  getActive(): TProject | null {
    return this.active;
  }

  getActiveOrNull(): TProject | null {
    return this.active;
  }

  setActiveProject({ project }: { project: TProject }): void {
    this.active = project;
    this.notify();
  }

  clearActive(): void {
    this.active = null;
    this.notify();
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  getMigrationState(): MigrationState {
    return this.migrationState;
  }

  async saveCurrentProject(): Promise<void> {
    if (!this.active) return;
    await this.editor.adapters.projectStorage.saveProject({
      id: this.active.metadata.id,
      name: this.active.metadata.name,
      updatedAt: this.active.metadata.updatedAt.getTime(),
      data: this.active,
    });
  }

  async loadProject({ id }: { id: string }): Promise<TProject | null> {
    this.isLoading = true;
    this.notify();
    try {
      const envelope =
        await this.editor.adapters.projectStorage.loadProject(id);
      const project = (envelope?.data as TProject | null) ?? null;
      this.active = project;
      this.notify();
      return project;
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  updateSettings({
    settings,
    pushHistory = true,
  }: {
    settings: Partial<TProjectSettings>;
    pushHistory?: boolean;
  }): void {
    if (!this.active) return;

    const command = new UpdateProjectSettingsCommand(settings);
    if (pushHistory) {
      this.editor.command.execute({ command });
    } else {
      command.execute();
    }
  }

  setTimelineViewState({
    timelineViewState,
  }: {
    timelineViewState: TTimelineViewState;
  }): void {
    if (!this.active) return;
    this.active = {
      ...this.active,
      timelineViewState,
    };
    this.notify();
  }

  getTimelineViewState(): TTimelineViewState | undefined {
    return this.active?.timelineViewState;
  }

  // Bump project FPS up to the highest imported clip FPS if the project
  // was created at a lower rate. Returns the new FrameRate if a bump
  // happened (so the caller can record it for undo) or null if the
  // existing rate already covers the imported media.
  ratchetFpsForImportedMedia({
    importedAssets,
  }: {
    importedAssets: MediaAsset[];
  }): FrameRate | null {
    if (!this.active) return null;
    const raised = getRaisedProjectFpsForImportedMedia({
      currentFps: this.active.settings.fps,
      importedAssets,
    });
    if (!raised) return null;
    this.active = {
      ...this.active,
      settings: { ...this.active.settings, fps: raised },
    };
    this.notify();
    return raised;
  }

  // --- Project lifecycle ---

  async prepareExit(): Promise<void> {
    await this.editor.save.flush();
  }

  closeProject(): void {
    this.editor.save.stop();
    this.editor.command.clear();
    this.editor.scenes.clearScenes();
    this.editor.media.clearAllAssets();
    this.exportState = { ...INITIAL_EXPORT_STATE };
    this.exportCancelRequested = false;
    this.clearActive();
  }

  async listProjects(): Promise<ProjectMeta[]> {
    return this.editor.adapters.projectStorage.listProjects();
  }

  async renameProject({
    id,
    name,
  }: {
    id: string;
    name: string;
  }): Promise<void> {
    const envelope = await this.editor.adapters.projectStorage.loadProject(id);
    if (!envelope) return;
    const project = envelope.data as TProject;
    const renamed: TProject = {
      ...project,
      metadata: {
        ...project.metadata,
        name,
        updatedAt: new Date(),
      },
    };
    await this.editor.adapters.projectStorage.saveProject({
      id: renamed.metadata.id,
      name: renamed.metadata.name,
      updatedAt: renamed.metadata.updatedAt.getTime(),
      data: renamed,
    });
    if (this.active?.metadata.id === id) {
      this.active = renamed;
      this.notify();
    }
  }

  async deleteProjects({ ids }: { ids: string[] }): Promise<void> {
    await Promise.all(
      ids.map((id) => this.editor.adapters.projectStorage.deleteProject(id)),
    );
    if (this.active && ids.includes(this.active.metadata.id)) {
      this.clearActive();
    }
  }

  // --- Export lifecycle ---

  getExportState(): ExportProgressState {
    return this.exportState;
  }

  clearExportState(): void {
    this.exportState = { ...INITIAL_EXPORT_STATE };
    this.exportCancelRequested = false;
    this.notify();
  }

  cancelExport(): void {
    if (!this.exportState.isExporting) return;
    this.exportCancelRequested = true;
  }

  async export({
    options,
  }: {
    options: ExportOptions;
  }): Promise<ExportResult> {
    if (this.exportState.isExporting) {
      return { success: false, error: "Export already in progress" };
    }

    this.exportCancelRequested = false;
    this.exportState = {
      isExporting: true,
      progress: 0,
      cancelled: false,
      error: null,
      result: null,
    };
    this.notify();

    try {
      const result = await this.editor.renderer.exportProject({
        options,
        onProgress: ({ progress }) => {
          this.exportState = { ...this.exportState, progress };
          this.notify();
        },
        onCancel: () => this.exportCancelRequested,
      });

      this.exportState = {
        isExporting: false,
        progress: result.success ? 1 : this.exportState.progress,
        cancelled: result.cancelled === true,
        error: result.success ? null : (result.error ?? null),
        result,
      };
      this.notify();
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown export error";
      const failure: ExportResult = { success: false, error: message };
      this.exportState = {
        isExporting: false,
        progress: this.exportState.progress,
        cancelled: false,
        error: message,
        result: failure,
      };
      this.notify();
      return failure;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      fn();
    });
  }
}
