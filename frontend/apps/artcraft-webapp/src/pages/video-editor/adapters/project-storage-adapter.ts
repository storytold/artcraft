import { MediaFilesApi, ProjectsApi } from "@storyteller/api";
import type {
  EditorProject,
  ProjectMeta,
  ProjectStorageAdapter,
} from "@storyteller/ui-video-editor";
import { webappToastAdapter } from "./toast-adapter";

// Server-backed ProjectStorageAdapter over the project-document endpoints
// (`/v1/media_files/upload/project/video_timeline/{new,update/{token}}` +
// `/v1/media_files/project/list`). Replaces the lib's IndexedDB default in
// the webapp.
//
// Project ids: the host bootstraps fresh sessions with a transient
// `local-{uuid}` id; the first successful save creates the server row and
// every id after that is the media_file_token. The local→token mapping is
// kept here so debounced autosaves that still carry the local id route to
// the update endpoint, and `onProjectCreated` lets the host re-key the
// active project + URL.

const LOCAL_ID_PREFIX = "local-";
const UNTITLED_PROJECT_NAME = "Untitled project";

export function isLocalProjectId(id: string): boolean {
  return id.startsWith(LOCAL_ID_PREFIX);
}

export function makeLocalProjectId(): string {
  return `${LOCAL_ID_PREFIX}${crypto.randomUUID()}`;
}

export function createWebappProjectStorage({
  onProjectCreated,
}: {
  onProjectCreated?: (args: { localId: string; token: string }) => void;
} = {}): ProjectStorageAdapter {
  const projectsApi = new ProjectsApi();
  const filesApi = new MediaFilesApi();

  // local-{uuid} → media_file_token, filled by the first create.
  const localToRemote = new Map<string, string>();
  // Per-project save chain: SaveManager already serializes autosaves, but
  // renames call saveCurrentProject directly — the chain guarantees a
  // create can never race a second create for the same project.
  const saveQueues = new Map<string, Promise<void>>();

  const resolveId = (id: string): string => localToRemote.get(id) ?? id;

  const uploadDocument = async (envelope: EditorProject): Promise<void> => {
    const name = envelope.name || UNTITLED_PROJECT_NAME;
    const blob = new Blob([JSON.stringify(envelope.data)], {
      type: "application/json",
    });
    const fileName = `${name}.timeline.json`;
    const resolved = resolveId(envelope.id);

    if (isLocalProjectId(resolved)) {
      const response = await projectsApi.UploadNewProject({
        projectType: "video_timeline",
        blob,
        fileName,
        uuid: crypto.randomUUID(),
        maybe_title: name,
      });
      if (!response.success || !response.data) {
        throw new Error(response.errorMessage || "Upload failed");
      }
      localToRemote.set(envelope.id, response.data);
      onProjectCreated?.({ localId: envelope.id, token: response.data });
      return;
    }

    const response = await projectsApi.UpdateProject({
      projectType: "video_timeline",
      token: resolved,
      blob,
      fileName,
      uuid: crypto.randomUUID(),
      maybe_title: name,
    });
    if (!response.success) {
      throw new Error(response.errorMessage || "Update failed");
    }
  };

  return {
    async saveProject(envelope) {
      const queueKey = envelope.id;
      const task = async () => {
        try {
          await uploadDocument(envelope);
        } catch (error) {
          // Saves ship the full document, so a failed save is fully
          // recovered by the next successful one — surface it and move
          // on instead of leaving an unhandled rejection in the
          // autosave path.
          console.error("Project save failed:", error);
          webappToastAdapter.error("Couldn't save project", {
            description:
              error instanceof Error ? error.message : "Please try again",
          });
        }
      };
      const prior = saveQueues.get(queueKey) ?? Promise.resolve();
      const next = prior.then(task, task);
      saveQueues.set(queueKey, next);
      await next;
    },

    async loadProject(id) {
      const token = resolveId(id);
      if (isLocalProjectId(token)) return null;

      const response = await filesApi.GetMediaFileByToken({
        mediaFileToken: token,
      });
      const media = response.success ? response.data : undefined;
      const cdnUrl = media?.media_links?.cdn_url;
      if (!media || !cdnUrl) return null;

      const documentResponse = await fetch(cdnUrl);
      if (!documentResponse.ok) return null;
      const data: unknown = await documentResponse.json();

      return {
        id: token,
        name: media.maybe_title ?? UNTITLED_PROJECT_NAME,
        updatedAt: new Date(media.updated_at).getTime(),
        data,
      };
    },

    async listProjects(): Promise<ProjectMeta[]> {
      const response = await projectsApi.ListSessionProjects({
        filter_project_type: "video_timeline",
        page_size: 100,
      });
      if (!response.success || !response.data) {
        throw new Error(response.errorMessage || "Couldn't list projects");
      }
      return response.data.map((row) => ({
        id: row.token,
        name: row.maybe_title ?? UNTITLED_PROJECT_NAME,
        updatedAt: new Date(row.updated_at).getTime(),
        thumbnailUrl:
          row.cover_image?.maybe_links?.thumbnail_template?.replace(
            "{WIDTH}",
            "600",
          ) ??
          row.cover_image?.maybe_links?.cdn_url ??
          undefined,
      }));
    },

    async deleteProject(id) {
      const token = resolveId(id);
      if (isLocalProjectId(token)) return;
      const response = await filesApi.DeleteMediaFileByToken({
        mediaFileToken: token,
        asMod: false,
      });
      if (!response.success) {
        throw new Error(response.errorMessage || "Delete failed");
      }
    },

    async createProject(name) {
      // The webapp defers server-row creation to the first save (see
      // saveProject), so "creating" a project is purely local.
      return {
        id: makeLocalProjectId(),
        name: name || UNTITLED_PROJECT_NAME,
        updatedAt: Date.now(),
        data: null,
      };
    },
  };
}
