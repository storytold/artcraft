import type { ProjectStorageAdapter } from "../project-storage";
import type { EditorProject, ProjectMeta } from "../types";

// Minimal IndexedDB-backed implementation of ProjectStorageAdapter.
// Stores each project as one row in object store `projects`, keyed
// by project id. No migration logic — phase 1 schema only.

const DB_NAME = "video-editor";
const DB_VERSION = 1;
const STORE = "projects";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        let result: T | undefined;
        const req = run(store);
        if (req) {
          req.onsuccess = () => {
            result = req.result;
          };
          req.onerror = () => reject(req.error);
        }
        t.oncomplete = () => resolve(result as T);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

function newId(): string {
  // Sufficient for local-only storage; the lib does not expose this
  // id outside the host process.
  return `proj_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function createIndexedDBProjectStorage(): ProjectStorageAdapter {
  return {
    async loadProject(id) {
      const project = await tx<EditorProject | undefined>("readonly", (s) =>
        s.get(id) as IDBRequest<EditorProject | undefined>,
      );
      return project ?? null;
    },
    async saveProject(project) {
      await tx("readwrite", (s) => s.put(project));
    },
    async deleteProject(id) {
      await tx("readwrite", (s) => s.delete(id));
    },
    async listProjects() {
      const all = await tx<EditorProject[]>("readonly", (s) =>
        s.getAll() as IDBRequest<EditorProject[]>,
      );
      const metas: ProjectMeta[] = (all ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
      }));
      metas.sort((a, b) => b.updatedAt - a.updatedAt);
      return metas;
    },
    async createProject(name) {
      const project: EditorProject = {
        id: newId(),
        name,
        updatedAt: Date.now(),
        data: null,
      };
      await tx("readwrite", (s) => s.put(project));
      return project;
    },
  };
}
