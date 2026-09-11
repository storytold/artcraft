import { Command, type CommandResult } from "../base-command";
import { EditorCore } from "../../core";
import type { TProject, TProjectSettings } from "../../project/types";

export class UpdateProjectSettingsCommand extends Command {
  private savedSettings: TProjectSettings | null = null;
  private savedUpdatedAt: Date | null = null;

  constructor(private updates: Partial<TProjectSettings>) {
    super();
  }

  execute(): CommandResult | undefined {
    const editor = EditorCore.getInstance();
    const activeProject = editor.project.getActive();
    if (!activeProject) return;

    this.savedSettings = activeProject.settings;
    this.savedUpdatedAt = activeProject.metadata.updatedAt;

    const updatedProject: TProject = {
      ...activeProject,
      settings: { ...activeProject.settings, ...this.updates },
      metadata: { ...activeProject.metadata, updatedAt: new Date() },
    };

    editor.project.setActiveProject({ project: updatedProject });
    editor.save.markDirty();
  }

  undo(): void {
    if (!this.savedSettings || !this.savedUpdatedAt) return;
    const editor = EditorCore.getInstance();
    const activeProject = editor.project.getActive();
    if (!activeProject) return;

    const updatedProject: TProject = {
      ...activeProject,
      settings: this.savedSettings,
      metadata: { ...activeProject.metadata, updatedAt: this.savedUpdatedAt },
    };

    editor.project.setActiveProject({ project: updatedProject });
    editor.save.markDirty();
  }
}
