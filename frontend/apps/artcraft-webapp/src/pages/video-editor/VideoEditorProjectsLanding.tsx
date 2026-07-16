import { useCallback, useEffect, useState } from "react";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import type {
  ProjectMeta,
  ProjectStorageAdapter,
} from "@storyteller/ui-video-editor";
import { TopBarActions } from "../../components/topbar/TopBarActions";

// Landing view for /video-editor (no project in the URL): the user's saved
// video projects plus a "New project" tile. Card styling follows the
// pagescene splash (rounded-2xl, border-white/10, aspect-video covers).

interface VideoEditorProjectsLandingProps {
  projectStorage: ProjectStorageAdapter;
  onNewProject: () => void;
  onOpenProject: (token: string) => void;
}

export function VideoEditorProjectsLanding({
  projectStorage,
  onNewProject,
  onOpenProject,
}: VideoEditorProjectsLandingProps) {
  const [projects, setProjects] = useState<ProjectMeta[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const listed = await projectStorage.listProjects();
      setProjects(listed);
      setLoadError(false);
    } catch (error) {
      console.error("Failed to list video projects:", error);
      setProjects([]);
      setLoadError(true);
    }
  }, [projectStorage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDelete = async (project: ProjectMeta) => {
    if (deletingId) return;
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) {
      return;
    }
    setDeletingId(project.id);
    try {
      await projectStorage.deleteProject(project.id);
      setProjects(
        (current) => current?.filter((p) => p.id !== project.id) ?? current,
      );
    } catch (error) {
      console.error("Failed to delete video project:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="relative h-full w-full overflow-y-auto">
      {/* The global topbar is hidden on /video-editor routes; surface its
          actions here like the editor header does. */}
      <div className="absolute right-4 top-3 z-10">
        <TopBarActions />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold">Video projects</h1>
        <p className="mt-1 text-sm opacity-60">
          Pick up where you left off, or start a new edit.
        </p>

        {!projects && (
          <div className="flex items-center justify-center gap-3 py-24">
            <LoadingSpinner />
            <span className="font-medium opacity-70">Loading projects...</span>
          </div>
        )}

        {projects && (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <button
              onClick={onNewProject}
              className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] transition-colors hover:border-white/40 hover:bg-white/[0.05]"
            >
              <span className="text-3xl font-light opacity-70">+</span>
              <span className="text-sm font-medium opacity-70">
                New project
              </span>
            </button>

            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isDeleting={deletingId === project.id}
                onOpen={() => onOpenProject(project.id)}
                onDelete={() => handleDelete(project)}
              />
            ))}
          </div>
        )}

        {projects && projects.length === 0 && !loadError && (
          <p className="mt-6 text-sm opacity-50">
            You have no saved video projects yet.
          </p>
        )}
        {loadError && (
          <p className="mt-6 text-sm text-red-400">
            Couldn't load your projects. Refresh the page to try again.
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  isDeleting,
  onOpen,
  onDelete,
}: {
  project: ProjectMeta;
  isDeleting: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const updatedLabel = new Date(project.updatedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      className={
        "group relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-white/30" +
        (isDeleting ? " pointer-events-none opacity-50" : "")
      }
    >
      <button onClick={onOpen} className="h-full w-full cursor-pointer">
        {project.thumbnailUrl && !thumbnailError ? (
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
            loading="lazy"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-3 text-start drop-shadow-md">
          <div className="truncate text-sm font-medium">{project.name}</div>
          <div className="text-xs opacity-70">{updatedLabel}</div>
        </div>
      </button>
      <button
        onClick={onDelete}
        aria-label={`Delete ${project.name}`}
        className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-1 text-xs opacity-0 transition-opacity hover:bg-red-500/80 focus:opacity-100 group-hover:opacity-100"
      >
        Delete
      </button>
    </div>
  );
}
