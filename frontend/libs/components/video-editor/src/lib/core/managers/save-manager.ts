import type { EditorCore } from "../index";

type SaveManagerOptions = {
  debounceMs?: number;
};

export class SaveManager {
  private debounceMs: number;
  private isPaused = false;
  private isSaving = false;
  private hasPendingSave = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeHandlers: Array<() => void> = [];
  // Resolvers for flush() calls waiting for the running save to finish. They are
  // all released together in saveNow()'s finally block.
  private idleWaiters: Array<() => void> = [];

  constructor({
    editor,
    debounceMs = 800,
  }: {
    editor: EditorCore;
  } & SaveManagerOptions) {
    this.editor = editor;
    this.debounceMs = debounceMs;
  }

  private editor: EditorCore;

  start(): void {
    if (this.unsubscribeHandlers.length > 0) return;

    this.unsubscribeHandlers = [
      this.editor.scenes.subscribe(() => {
        this.markDirty();
      }),
      this.editor.timeline.subscribe(() => {
        this.markDirty();
      }),
    ];
  }

  stop(): void {
    for (const unsubscribe of this.unsubscribeHandlers) {
      unsubscribe();
    }
    this.unsubscribeHandlers = [];
    this.clearTimer();
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    if (this.hasPendingSave) {
      this.queueSave();
    }
  }

  markDirty({ force = false }: { force?: boolean } = {}): void {
    if (this.isPaused && !force) return;
    this.hasPendingSave = true;
    this.queueSave();
  }

  async flush(): Promise<void> {
    // FIX: flush() used to set the dirty flag and call saveNow(), which returns
    // at once when a save is already running. If an autosave was mid-write when
    // the user hit Exit, flush() resolved immediately, the editor closed the
    // project, and the edits made DURING that write were never saved. Wait for
    // the running save to finish first (looping, because another flush may start
    // its own save in the gap), then save the newest state ourselves. The wait
    // ends whether the running save succeeds or fails; a failure is the
    // autosave's to report, and this flush still makes its own attempt below.
    while (this.isSaving) {
      await new Promise<void>((resolve) => {
        this.idleWaiters.push(resolve);
      });
    }
    this.hasPendingSave = true;
    await this.saveNow();
  }

  getIsDirty(): boolean {
    return this.hasPendingSave || this.isSaving;
  }

  private queueSave(): void {
    if (this.isSaving) return;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      // FIX: saveNow() now rethrows a failed save (so flush() callers can see
      // it). This fire-and-forget timer path has no caller to receive that
      // rejection, so `void` left it as an unhandled promise rejection. Catch
      // and log it here; the project stays marked dirty and is retried on the
      // next edit / flush.
      this.saveNow().catch((error) => {
        console.error("Autosave failed; changes are still unsaved:", error);
      });
    }, this.debounceMs);
  }

  private async saveNow(): Promise<void> {
    if (this.isSaving) return;
    if (!this.hasPendingSave) return;

    const activeProject = this.editor.project.getActive();
    if (!activeProject) return;
    if (this.editor.project.getIsLoading()) return;
    if (this.editor.project.getMigrationState().isMigrating) return;

    this.isSaving = true;
    this.hasPendingSave = false;
    this.clearTimer();

    // Tracks whether the write below threw, so the finally block can skip the
    // automatic re-queue (which would retry a broken save in a tight loop).
    let didFail = false;
    try {
      await this.editor.project.saveCurrentProject();
    } catch (error) {
      // FIX: hasPendingSave was cleared BEFORE the write, so a failed write
      // left the manager believing everything was saved (getIsDirty() === false)
      // and the edits were never retried. Mark the project dirty again so the
      // unsaved state is visible and the next edit / flush / resume saves it.
      didFail = true;
      this.hasPendingSave = true;
      throw error;
    } finally {
      this.isSaving = false;
      // Wake every flush() that was waiting on this save (success or failure).
      // isSaving is already false, so each waiter re-checks and proceeds.
      const waiters = this.idleWaiters;
      this.idleWaiters = [];
      for (const wake of waiters) wake();
      // Only auto-requeue after a SUCCESSFUL save that saw newer edits; after a
      // failure wait for the next trigger instead of hammering storage.
      if (this.hasPendingSave && !didFail) {
        this.queueSave();
      }
    }
  }

  private clearTimer(): void {
    if (!this.saveTimer) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
  }
}
