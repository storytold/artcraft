import type { EditorProject, ProjectMeta } from "./types";

// Persistence for editor projects. Default impl writes to IndexedDB
// so the lib runs standalone. Hosts (artcraft, artcraft-webapp) will
// later swap this for an Artcraft-backed implementation that calls
// MediaFilesApi / the artcraft server.
//
// All methods are async because every realistic backend (IndexedDB,
// Tauri filesystem, HTTP API) is async.
export interface ProjectStorageAdapter {
  loadProject(id: string): Promise<EditorProject | null>;
  saveProject(project: EditorProject): Promise<void>;
  deleteProject(id: string): Promise<void>;
  listProjects(): Promise<ProjectMeta[]>;
  // Creates a fresh project and returns its id. The implementation
  // is free to assign the id (cuid, uuid, db-generated) so the lib
  // does not need to know the scheme.
  createProject(name: string): Promise<EditorProject>;
}
