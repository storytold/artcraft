import { useCallback, useEffect, useState } from "react";
import { SparklesIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { FolderNameDialog } from "@storyteller/ui-gallery-modal";
import {
  isActionReminderOpen,
  showActionReminder,
} from "@storyteller/ui-action-reminder-modal";
import type { ProjectMeta } from "@storyteller/ui-video-editor";
import { TopBarActions } from "../../components/topbar/TopBarActions";
import { webappToastAdapter } from "./adapters/toast-adapter";
import type { WebappProjectStorage } from "./adapters/project-storage-adapter";
import {
  NewProjectTile,
  VideoProjectCard,
  VideoProjectCardSkeleton,
} from "./components/VideoProjectCard";

// Landing view for /video-editor (no project in the URL): the user's saved
// video projects plus a "New project" tile. Styled to match the create
// pages and library: near-black canvas, eyebrow + display heading,
// ui-controls cards with hairline hover rings, kebab menus, and the app's
// standard confirm dialog.

const GRID_CLASSES =
  "mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
const SKELETON_COUNT = 8;

interface VideoEditorProjectsLandingProps {
  projectStorage: WebappProjectStorage;
  onNewProject: () => void;
  onOpenProject: (token: string) => void;
}

export function VideoEditorProjectsLanding({
  projectStorage,
  onNewProject,
  onOpenProject,
}: VideoEditorProjectsLandingProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<ProjectMeta | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const listed = await projectStorage.listProjects();
      setProjects(listed);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to list video projects:", error);
      setProjects([]);
      setStatus("error");
    }
  }, [projectStorage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDeleteRequest = (project: ProjectMeta) => {
    if (deletingId) return;
    showActionReminder({
      reminderType: "default",
      title: `Delete "${project.name}"?`,
      message: (
        <p className="text-sm text-white/70">
          This will permanently delete the project. This action cannot be
          undone.
        </p>
      ),
      primaryActionText: "Delete",
      secondaryActionText: "Cancel",
      primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
      onPrimaryAction: async () => {
        try {
          await deleteProject(project);
        } finally {
          isActionReminderOpen.value = false;
        }
      },
    });
  };

  const deleteProject = async (project: ProjectMeta) => {
    setDeletingId(project.id);
    try {
      await projectStorage.deleteProject(project.id);
      setProjects((current) => current.filter((p) => p.id !== project.id));
    } catch (error) {
      console.error("Failed to delete video project:", error);
      webappToastAdapter.error("Couldn't delete project", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const submitRename = async (name: string) => {
    const target = renameTarget;
    setRenameTarget(null);
    if (!target) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === target.name) return;

    setProjects((current) =>
      current.map((p) => (p.id === target.id ? { ...p, name: trimmed } : p)),
    );
    try {
      await projectStorage.renameProject(target.id, trimmed);
    } catch (error) {
      console.error("Failed to rename video project:", error);
      setProjects((current) =>
        current.map((p) =>
          p.id === target.id ? { ...p, name: target.name } : p,
        ),
      );
      webappToastAdapter.error("Couldn't rename project", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  return (
    <div className="relative h-full w-full overflow-y-auto bg-ui-background text-white">
      {/* The global topbar is hidden on /video-editor routes; surface its
          actions here like the editor header does. */}
      <div className="absolute right-4 top-3 z-20">
        <TopBarActions />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-3 pb-16 pt-10 sm:px-4 md:px-8 lg:px-12">
        <header className="animate-fade-in-up">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
            Video editor
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold md:text-4xl">
            Your <span className="font-serif-italic font-normal">projects</span>
          </h1>
          <p className="mt-2 text-base text-white/60">
            Pick up where you left off, or start something new.
          </p>
        </header>

        {status === "loading" && (
          <div className={GRID_CLASSES}>
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <VideoProjectCardSkeleton key={i} />
            ))}
          </div>
        )}

        {status === "ready" && projects.length > 0 && (
          <div className={GRID_CLASSES}>
            <NewProjectTile onClick={onNewProject} />
            {projects.map((project, index) => (
              <VideoProjectCard
                key={project.id}
                project={project}
                index={index}
                isDeleting={deletingId === project.id}
                onOpen={() => onOpenProject(project.id)}
                onRename={() => setRenameTarget(project)}
                onDelete={() => handleDeleteRequest(project)}
              />
            ))}
          </div>
        )}

        {status === "ready" && projects.length === 0 && (
          <div className="animate-fade-in-up flex flex-col items-center justify-center py-28 text-center">
            <h2 className="text-5xl font-semibold text-white md:text-6xl">
              Make your first{" "}
              <span className="font-serif-italic font-normal">edit</span>
            </h2>
            <p className="mt-3 text-lg text-white/80">
              Arrange clips, add text and audio, export in minutes.
            </p>
            <Button
              variant="primary"
              icon={SparklesIcon}
              onClick={onNewProject}
              className="mt-8 h-12 px-6"
            >
              New project
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-4 py-28 text-center">
            <TriangleAlertIcon
              
              className="text-3xl text-white/30" />
            <div>
              <div className="text-lg font-medium">
                Couldn't load your projects
              </div>
              <p className="mt-1 text-sm text-white/50">
                Something went wrong while fetching your saved edits.
              </p>
            </div>
            <Button variant="secondary" onClick={() => void refresh()}>
              Try again
            </Button>
          </div>
        )}
      </div>

      <FolderNameDialog
        isOpen={!!renameTarget}
        title="Rename project"
        initialValue={renameTarget?.name ?? ""}
        confirmLabel="Rename"
        onConfirm={(name) => void submitRename(name)}
        onClose={() => setRenameTarget(null)}
      />
    </div>
  );
}
