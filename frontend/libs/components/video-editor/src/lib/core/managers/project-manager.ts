import type { EditorCore } from "../index";
import type { TProject, TProjectSettings, TTimelineViewState } from "../../project/types";
import type { MediaAsset } from "../../media/types";
import { UpdateProjectSettingsCommand } from "../../commands/project";

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

export class ProjectManager {
  private active: TProject | null = null;
  private isLoading = false;
  private migrationState: MigrationState = { isMigrating: false };
  private listeners = new Set<() => void>();

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

  // FPS-ratchet: bump project FPS up to the highest imported clip FPS
  // if the project was created at a lower rate. Verbatim with OpenCut
  // we'd compare against the highest of the imported media. Until
  // those helpers port, this is a no-op — the host can override.
  ratchetFpsForImportedMedia(_args: { importedAssets: MediaAsset[] }): void {
    // No-op until FPS helpers port.
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
