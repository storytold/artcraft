import { Node } from "../Node";
import type { PageDrawPersistenceAdapter } from "../adapter";
import type {
  LineNode,
  SerializedDrawNode,
  SerializedNodeData,
} from "../stores/SceneState";
import { serializeDrawNode, useSceneStore } from "../stores/SceneState";
import {
  applyResolvedMediaUrls,
  buildServerDocument,
  collectDocumentMediaIds,
  parseDocument,
} from "./documentSchema";
import {
  draftKey,
  deleteSessionRecord,
  PageDrawSessionRecord,
  readLastActiveKey,
  readSessionRecord,
  writeLastActiveKey,
  writeSessionRecord,
} from "./localReplica";
import { resetDrawSessionStore, useDrawSessionStore } from "./sessionStore";

// Sync controller for pagedraw sessions. Design (mirrors the moodboard sync
// layer, single-document variant):
//
//   SceneState mutations ──(store subscription)──▶ markDirty
//     ├─ debounced local-replica write (always — draft protection)
//     └─ debounced server autosave (only once the session is named + owned)
//          upload pending media → serialize → freshness check → push
//
// Guarantees:
// - Saves are gated behind hydration; a half-loaded canvas can never be
//   pushed over the server copy.
// - Freshness check before every push: if another device advanced the server
//   copy past our base revision, we surface a conflict (reactive store state)
//   and pause autosave — the user chooses which side wins; neither is
//   silently discarded (the losing side is stashed in a replica backup slot).
// - Replicas are owner-stamped; a record owned by a different account is
//   never hydrated into the canvas and never pushed (machine-shared storage).
// - Failed pushes retry with exponential backoff; the durable needsSync flag
//   resumes interrupted pushes on the next visit.

const AUTOSAVE_DEBOUNCE_MS = 2000;
const REPLICA_DEBOUNCE_MS = 600;
const RETRY_BASE_MS = 5000;
const RETRY_MAX_MS = 60000;
const MEDIA_UPLOAD_CONCURRENCY = 3;

export type ConflictResolution = "keepMine" | "takeServer";

interface ControllerState {
  adapter: PageDrawPersistenceAdapter;
  ownerId: string | null;
  /** Replica key of the active session (project token or draft slot). */
  sessionKey: string;
  /** Server updated_at we last hydrated from / pushed to. */
  baseRevision: string | null;
  needsSync: boolean;
  /** Edits arrived after the in-flight save serialized its snapshot. */
  dirtySinceSnapshot: boolean;
  saveInFlight: boolean;
  trailingSave: boolean;
  retryDelayMs: number;
  saveTimer: ReturnType<typeof setTimeout> | null;
  replicaTimer: ReturnType<typeof setTimeout> | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  unsubScene: () => void;
  unsubAuth: () => void;
  removeLifecycle: () => void;
}

let controller: ControllerState | null = null;

// Reentrant guard: controlled mutations (hydration, media-token write-backs,
// account-switch resets) must not re-mark the session dirty.
let suppressDepth = 0;

const withSuppressedDirty = <T>(fn: () => T): T => {
  suppressDepth += 1;
  try {
    return fn();
  } finally {
    suppressDepth -= 1;
  }
};

// ─── Lifecycle ─────────────────────────────────────────────────────────────

/**
 * Initialize session persistence. Idempotent — re-initializing tears down the
 * previous controller first. `openToken` forces a specific server session;
 * otherwise the last-active session (or the account's draft) is restored.
 */
export const initDrawSessionSync = (
  adapter: PageDrawPersistenceAdapter,
  options: { openToken?: string } = {},
): void => {
  teardownDrawSessionSync();

  const ownerId = adapter.getUserId();
  resetDrawSessionStore();
  useDrawSessionStore.setState({
    hydration: "hydrating",
    loggedIn: ownerId !== null,
  });

  const unsubScene = useSceneStore.subscribe((state, prev) => {
    if (suppressDepth > 0) return;
    if (useDrawSessionStore.getState().hydration !== "ready") return;
    const contentChanged =
      state.history !== prev.history ||
      state.historyIndex !== prev.historyIndex ||
      state.brushColor !== prev.brushColor ||
      state.brushSize !== prev.brushSize ||
      state.fillColor !== prev.fillColor ||
      state.aspectRatioType !== prev.aspectRatioType;
    if (contentChanged) markDirty();
  });

  const unsubAuth = adapter.subscribeAuthState(() => {
    const c = controller;
    if (!c) return;
    const nextOwner = c.adapter.getUserId();
    if (nextOwner !== c.ownerId) void handleAccountSwitch(nextOwner);
  });

  // Best-effort flush when the tab hides/unloads. IDB puts are async so this
  // is fire-and-forget, but the tight replica debounce keeps the at-risk
  // window under a second either way.
  const onPageHide = () => flushReplicaNow();
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flushReplicaNow();
  };
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibility);

  controller = {
    adapter,
    ownerId,
    sessionKey: draftKey(ownerId),
    baseRevision: null,
    needsSync: false,
    dirtySinceSnapshot: false,
    saveInFlight: false,
    trailingSave: false,
    retryDelayMs: RETRY_BASE_MS,
    saveTimer: null,
    replicaTimer: null,
    retryTimer: null,
    unsubScene,
    unsubAuth,
    removeLifecycle: () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };

  void hydrate(options.openToken);
};

/** Tear down the controller (page unmount). Flushes the replica if dirty. */
export const teardownDrawSessionSync = (): void => {
  const c = controller;
  if (!c) return;
  if (c.saveTimer) clearTimeout(c.saveTimer);
  if (c.replicaTimer) clearTimeout(c.replicaTimer);
  if (c.retryTimer) clearTimeout(c.retryTimer);
  c.unsubScene();
  c.unsubAuth();
  c.removeLifecycle();
  if (c.needsSync) void writeReplica(c);
  controller = null;
};

// ─── Public commands (UI intents) ──────────────────────────────────────────

/**
 * Manual save. For a named session this is an immediate server push; for an
 * unnamed one it flushes the local replica (server rows are only created via
 * nameSession — naming is the user-triggered creation point).
 */
export const saveSessionNow = async (): Promise<void> => {
  const c = controller;
  if (!c) return;
  const session = useDrawSessionStore.getState();
  if (session.hydration !== "ready") return;
  if (session.remoteToken) {
    if (c.saveTimer) clearTimeout(c.saveTimer);
    await doSave(c, { force: false });
  } else if (session.isNamed && session.sessionName) {
    await createServerSession(c, session.sessionName);
  } else {
    await flushReplicaNow();
  }
};

/**
 * Name (or rename) the session. The first naming of an unnamed session
 * creates its server row and re-keys the local replica to the new token.
 */
export const nameSession = async (name: string): Promise<void> => {
  const c = controller;
  if (!c) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const session = useDrawSessionStore.getState();
  useDrawSessionStore.setState({ sessionName: trimmed, isNamed: true });
  if (session.remoteToken) {
    markDirty();
    await saveSessionNow();
  } else {
    await createServerSession(c, trimmed);
  }
};

/**
 * Resolve a multi-device conflict. Either way the losing side is stashed in
 * a replica backup slot first, so a mis-click is recoverable.
 */
export const resolveSessionConflict = async (
  resolution: ConflictResolution,
): Promise<void> => {
  const c = controller;
  if (!c) return;
  const session = useDrawSessionStore.getState();
  const token = session.remoteToken;
  if (session.saveStatus !== "conflict" || !token) return;

  if (resolution === "keepMine") {
    // Server copy is about to be overwritten — back it up locally first.
    try {
      const serverDoc = await c.adapter.loadProjectDocument(token);
      if (serverDoc.success && serverDoc.documentJson) {
        await backupDocumentJson(c, `backup:server:${token}`, serverDoc.documentJson);
      }
    } catch {
      // Best-effort only.
    }
    useDrawSessionStore.setState({ conflict: null, saveStatus: "saving" });
    await doSave(c, { force: true });
  } else {
    // Local copy is the losing side — snapshot it, then adopt the server's.
    const backup = buildReplicaRecord(c);
    if (backup) {
      await writeSessionRecord({ ...backup, key: `backup:local:${token}` });
    }
    useDrawSessionStore.setState({ conflict: null });
    c.needsSync = false;
    await loadServerSession(c, token);
  }
};

/** Start a fresh unnamed session (replaces the account's draft slot). */
export const newSession = async (): Promise<void> => {
  const c = controller;
  if (!c) return;
  await flushReplicaNow();
  c.sessionKey = draftKey(c.ownerId);
  c.baseRevision = null;
  c.needsSync = false;
  resetSceneForSessionSwitch();
  useDrawSessionStore.setState({
    sessionName: "",
    isNamed: false,
    remoteToken: null,
    saveStatus: "idle",
    lastSavedAt: null,
    errorMessage: null,
    conflict: null,
    hydration: "ready",
  });
  writeLastActiveKey(c.ownerId, c.sessionKey);
  // The fresh empty canvas replaces whatever the draft slot held.
  void writeReplica(c);
};

/** Open an existing server session by token. */
export const openSession = async (token: string): Promise<void> => {
  const c = controller;
  if (!c) return;
  await flushReplicaNow();
  useDrawSessionStore.setState({ hydration: "hydrating" });
  await hydrate(token);
};

/** List the account's pagedraw sessions (for the picker UI). */
export const listSessions = async (): Promise<
  { token: string; name: string; updatedAt: string }[]
> => {
  const c = controller;
  if (!c) return [];
  const response = await c.adapter.listProjects();
  return response.success ? (response.projects ?? []) : [];
};

// ─── Hydration ─────────────────────────────────────────────────────────────

const hydrate = async (openToken?: string): Promise<void> => {
  const c = controller;
  if (!c) return;

  let targetKey =
    openToken ?? readLastActiveKey(c.ownerId) ?? draftKey(c.ownerId);

  let record = await readSessionRecord(targetKey);
  // Machine-shared storage: never hydrate another account's session. Null
  // owner (signed-out work) is adoptable by whoever opens it.
  if (record && record.ownerId !== null && record.ownerId !== c.ownerId) {
    record = null;
    if (!openToken) {
      targetKey = draftKey(c.ownerId);
      record = await readSessionRecord(targetKey);
      if (record && record.ownerId !== null && record.ownerId !== c.ownerId) {
        record = null;
      }
    }
  }

  c.sessionKey = targetKey;
  writeLastActiveKey(c.ownerId, targetKey);

  const isServerSession = !targetKey.startsWith("draft:") && !targetKey.startsWith("backup:");
  if (isServerSession) {
    await hydrateServerSession(c, targetKey, record);
  } else if (record) {
    await restoreReplicaRecord(c, record);
    useDrawSessionStore.setState({
      hydration: "ready",
      saveStatus: record.needsSync ? "dirty" : "idle",
    });
  } else {
    useDrawSessionStore.setState({ hydration: "ready", saveStatus: "idle" });
  }
};

/**
 * Hydration for a token-linked session: dirty-aware last-write-wins with
 * conflict detection, per the decision table in decideServerHydration.
 */
const hydrateServerSession = async (
  c: ControllerState,
  token: string,
  record: PageDrawSessionRecord | null,
): Promise<void> => {
  const info = await c.adapter.getProjectInfo(token);

  if (!info.success) {
    // Offline / transient failure: the replica (if any) keeps the user
    // working; the durable needsSync flag resumes the push later.
    if (record) {
      await restoreReplicaRecord(c, record);
      useDrawSessionStore.setState({
        hydration: "ready",
        saveStatus: record.needsSync ? "error" : "idle",
        errorMessage: "Couldn't reach the server — working from the local copy.",
      });
      if (record.needsSync) scheduleRetry(c);
    } else {
      useDrawSessionStore.setState({
        hydration: "ready",
        saveStatus: "error",
        errorMessage: "Couldn't load this session from the server.",
      });
    }
    return;
  }

  const serverUpdatedAt = info.updatedAt ?? null;
  const decision = decideServerHydration({
    localDirty: record?.needsSync ?? false,
    localBaseRevision: record?.baseRevision ?? null,
    serverUpdatedAt,
  });

  if (decision === "useLocalAndPush" && record) {
    await restoreReplicaRecord(c, record);
    useDrawSessionStore.setState({ hydration: "ready", saveStatus: "dirty" });
    scheduleAutosave(c);
    return;
  }

  if (decision === "conflict" && record) {
    // Show the user their local copy and pause sync until they choose.
    await restoreReplicaRecord(c, record);
    useDrawSessionStore.setState({
      hydration: "ready",
      saveStatus: "conflict",
      conflict: { serverUpdatedAt: serverUpdatedAt ?? "" },
    });
    return;
  }

  // Clean local (or no local): the server copy is the truth.
  c.baseRevision = serverUpdatedAt;
  await loadServerSession(c, token, info.title ?? undefined);
};

/**
 * Pure hydration decision for a token-linked session — kept side-effect-free
 * for direct unit testing.
 */
export const decideServerHydration = ({
  localDirty,
  localBaseRevision,
  serverUpdatedAt,
}: {
  localDirty: boolean;
  localBaseRevision: string | null;
  serverUpdatedAt: string | null;
}): "useLocalAndPush" | "conflict" | "useServer" => {
  if (!localDirty) return "useServer";
  // Dirty local, server unchanged since we last synced → our edits are the
  // only new work; push them.
  if (localBaseRevision !== null && serverUpdatedAt === localBaseRevision) {
    return "useLocalAndPush";
  }
  // Dirty local AND the server moved (or we never learned its revision):
  // both sides have work the other lacks.
  return "conflict";
};

const loadServerSession = async (
  c: ControllerState,
  token: string,
  serverTitle?: string,
): Promise<void> => {
  const response = await c.adapter.loadProjectDocument(token);
  if (!response.success || !response.documentJson) {
    useDrawSessionStore.setState({
      hydration: "ready",
      saveStatus: "error",
      errorMessage: "Couldn't download this session's document.",
    });
    return;
  }
  const doc = parseDocument(response.documentJson);
  if (!doc) {
    // A malformed document must never be treated as an empty canvas — that
    // path ends with autosave overwriting the server copy with nothing.
    useDrawSessionStore.setState({
      hydration: "ready",
      saveStatus: "error",
      errorMessage: "This session's document couldn't be parsed.",
    });
    return;
  }

  const urlByToken = await resolveMediaSafe(c, collectDocumentMediaIds(doc));
  const resolved = applyResolvedMediaUrls(doc, urlByToken);

  withSuppressedDirty(() => {
    useSceneStore.getState().RESET();
    useSceneStore.getState().importSceneFromJson(JSON.stringify(resolved));
  });

  const name = doc.name ?? serverTitle ?? "";
  c.sessionKey = token;
  c.needsSync = false;
  useDrawSessionStore.setState({
    sessionName: name,
    isNamed: true,
    remoteToken: token,
    hydration: "ready",
    saveStatus: "idle",
    errorMessage: null,
    conflict: null,
  });
  writeLastActiveKey(c.ownerId, token);
  // Refresh the replica so a reload lands on this same content offline.
  void writeReplica(c);
};

const restoreReplicaRecord = async (
  c: ControllerState,
  record: PageDrawSessionRecord,
): Promise<void> => {
  const drawNodes = await deserializeDrawNodes(record.drawNodes);
  withSuppressedDirty(() => {
    useSceneStore.getState().RESET();
    useSceneStore.setState({
      drawNodes,
      inpaintLineNodes: record.inpaintLineNodes,
      brushColor: record.brushColor,
      brushSize: record.brushSize,
      fillColor: record.fillColor,
      aspectRatioType: record.aspectRatioType,
      history: record.history,
      historyIndex: record.historyIndex,
      selectedNodeIds: [],
    });
  });
  c.baseRevision = record.baseRevision;
  c.needsSync = record.needsSync;
  useDrawSessionStore.setState({
    sessionName: record.name,
    isNamed: record.remoteToken !== null || record.name !== "",
    remoteToken: record.remoteToken,
  });
};

// ─── Dirty tracking + scheduling ───────────────────────────────────────────

const markDirty = (): void => {
  const c = controller;
  if (!c) return;
  c.needsSync = true;
  c.dirtySinceSnapshot = true;

  const session = useDrawSessionStore.getState();
  if (session.saveStatus !== "conflict" && session.saveStatus !== "saving") {
    useDrawSessionStore.setState({ saveStatus: "dirty" });
  }

  if (c.replicaTimer) clearTimeout(c.replicaTimer);
  c.replicaTimer = setTimeout(() => {
    c.replicaTimer = null;
    void writeReplica(c);
  }, REPLICA_DEBOUNCE_MS);

  // Server autosave only for named (row-backed) sessions, and never while a
  // conflict is pending resolution.
  if (session.remoteToken && session.saveStatus !== "conflict") {
    scheduleAutosave(c);
  }
};

const scheduleAutosave = (c: ControllerState): void => {
  if (c.saveTimer) clearTimeout(c.saveTimer);
  c.saveTimer = setTimeout(() => {
    c.saveTimer = null;
    void doSave(c, { force: false });
  }, AUTOSAVE_DEBOUNCE_MS);
};

const scheduleRetry = (c: ControllerState): void => {
  if (c.retryTimer) clearTimeout(c.retryTimer);
  const delay = c.retryDelayMs;
  c.retryDelayMs = Math.min(c.retryDelayMs * 2, RETRY_MAX_MS);
  c.retryTimer = setTimeout(() => {
    c.retryTimer = null;
    void doSave(c, { force: false });
  }, delay);
};

// ─── Save pipeline ─────────────────────────────────────────────────────────

const doSave = async (
  c: ControllerState,
  { force }: { force: boolean },
): Promise<void> => {
  if (controller !== c) return;
  const session = useDrawSessionStore.getState();
  if (session.hydration !== "ready") return;
  if (!force && session.saveStatus === "conflict") return;
  const token = session.remoteToken;
  if (!token) return;
  if (c.saveInFlight) {
    c.trailingSave = true;
    return;
  }

  c.saveInFlight = true;
  c.dirtySinceSnapshot = false;
  useDrawSessionStore.setState({ saveStatus: "saving", errorMessage: null });

  try {
    await uploadPendingMedia(c);
    const documentJson = await buildServerDocument(
      useSceneStore.getState(),
      useDrawSessionStore.getState().sessionName,
    );

    // Freshness check immediately before the push (smallest race window).
    if (!force) {
      const info = await c.adapter.getProjectInfo(token);
      if (!info.success) {
        onSaveFailure(c, "Couldn't verify the server copy — will retry.");
        return;
      }
      if (
        c.baseRevision !== null &&
        info.updatedAt !== undefined &&
        info.updatedAt !== c.baseRevision
      ) {
        useDrawSessionStore.setState({
          saveStatus: "conflict",
          conflict: { serverUpdatedAt: info.updatedAt },
        });
        return;
      }
    }

    const response = await c.adapter.updateProject({
      token,
      documentJson,
      name: useDrawSessionStore.getState().sessionName,
    });
    if (!response.success) {
      onSaveFailure(c, response.errorMessage ?? "Save failed — will retry.");
      return;
    }

    await adoptServerRevision(c, token);
    onSaveSuccess(c);
  } catch (error) {
    console.error("[PageDraw] save failed", error);
    onSaveFailure(c, "Save failed — will retry.");
  } finally {
    c.saveInFlight = false;
    if (c.trailingSave && controller === c) {
      c.trailingSave = false;
      scheduleAutosave(c);
    }
  }
};

const createServerSession = async (
  c: ControllerState,
  name: string,
): Promise<void> => {
  if (c.saveInFlight) {
    c.trailingSave = true;
    return;
  }
  const previousKey = c.sessionKey;
  c.saveInFlight = true;
  c.dirtySinceSnapshot = false;
  useDrawSessionStore.setState({ saveStatus: "saving", errorMessage: null });

  try {
    await uploadPendingMedia(c);
    const documentJson = await buildServerDocument(
      useSceneStore.getState(),
      name,
    );
    const response = await c.adapter.createProject({ documentJson, name });
    if (!response.success || !response.token) {
      // No row was created; the named draft stays local until a retry (via
      // manual save) succeeds. No auto-retry here — creation is user-paced
      // to avoid any chance of duplicate rows.
      useDrawSessionStore.setState({
        saveStatus: "error",
        errorMessage:
          response.errorMessage ?? "Couldn't create the session on the server.",
      });
      return;
    }

    const token = response.token;
    useDrawSessionStore.setState({ remoteToken: token });
    c.sessionKey = token;
    await adoptServerRevision(c, token);
    onSaveSuccess(c);
    writeLastActiveKey(c.ownerId, token);
    // The draft slot's content now lives under the token key.
    if (previousKey.startsWith("draft:")) {
      await writeReplica(c);
      void deleteSessionRecord(previousKey);
    }
  } catch (error) {
    console.error("[PageDraw] session create failed", error);
    useDrawSessionStore.setState({
      saveStatus: "error",
      errorMessage: "Couldn't create the session on the server.",
    });
  } finally {
    c.saveInFlight = false;
    if (c.trailingSave && controller === c) {
      c.trailingSave = false;
      const token = useDrawSessionStore.getState().remoteToken;
      if (token) scheduleAutosave(c);
    }
  }
};

const onSaveSuccess = (c: ControllerState): void => {
  c.retryDelayMs = RETRY_BASE_MS;
  if (c.retryTimer) {
    clearTimeout(c.retryTimer);
    c.retryTimer = null;
  }
  if (c.dirtySinceSnapshot) {
    // Edits landed while the push was in flight — the snapshot we saved is
    // already stale, so stay dirty and go again.
    useDrawSessionStore.setState({
      saveStatus: "dirty",
      lastSavedAt: Date.now(),
    });
    scheduleAutosave(c);
  } else {
    c.needsSync = false;
    useDrawSessionStore.setState({
      saveStatus: "saved",
      lastSavedAt: Date.now(),
      errorMessage: null,
    });
  }
  void writeReplica(c);
};

const onSaveFailure = (c: ControllerState, message: string): void => {
  useDrawSessionStore.setState({ saveStatus: "error", errorMessage: message });
  scheduleRetry(c);
};

/**
 * After a successful push, adopt the server's new updated_at as our base
 * revision. If this refetch fails we leave the base null; the next save's
 * freshness check then has nothing to compare against and pushes anyway —
 * one save cycle of plain last-write-wins rather than a false conflict.
 */
const adoptServerRevision = async (
  c: ControllerState,
  token: string,
): Promise<void> => {
  try {
    const info = await c.adapter.getProjectInfo(token);
    c.baseRevision = info.success ? (info.updatedAt ?? null) : null;
  } catch {
    c.baseRevision = null;
  }
};

/** Upload local image files that don't have a media token yet. */
const uploadPendingMedia = async (c: ControllerState): Promise<void> => {
  const pending = useSceneStore
    .getState()
    .drawNodes.filter(
      (n): n is Node => n instanceof Node && !!n.imageFile && !n.mediaId,
    );
  if (pending.length === 0) return;

  let index = 0;
  const workers = Array.from(
    { length: Math.min(MEDIA_UPLOAD_CONCURRENCY, pending.length) },
    async () => {
      while (index < pending.length) {
        const node = pending[index];
        index += 1;
        try {
          const mediaToken = await c.adapter.uploadMedia(node.imageFile as File);
          if (!mediaToken) continue;
          // The node may have been deleted/replaced while uploading.
          const live = useSceneStore
            .getState()
            .drawNodes.find((n) => n.id === node.id);
          if (!(live instanceof Node) || live.imageFile !== node.imageFile) {
            continue;
          }
          withSuppressedDirty(() => {
            useSceneStore.getState().updateNode(node.id, { mediaId: mediaToken }, false);
          });
        } catch (error) {
          // Non-fatal: the document keeps this image inline as base64 until
          // a later save's upload succeeds.
          console.error("[PageDraw] media upload failed", error);
        }
      }
    },
  );
  await Promise.all(workers);
};

// ─── Replica plumbing ──────────────────────────────────────────────────────

const buildReplicaRecord = (
  c: ControllerState,
): PageDrawSessionRecord | null => {
  const session = useDrawSessionStore.getState();
  if (session.hydration !== "ready") return null;
  const scene = useSceneStore.getState();
  return {
    key: c.sessionKey,
    ownerId: c.ownerId,
    name: session.sessionName,
    remoteToken: session.remoteToken,
    baseRevision: c.baseRevision,
    needsSync: c.needsSync,
    savedAt: Date.now(),
    drawNodes: scene.drawNodes.map(serializeDrawNode),
    inpaintLineNodes: JSON.parse(JSON.stringify(scene.inpaintLineNodes)),
    brushColor: scene.brushColor,
    brushSize: scene.brushSize,
    fillColor: scene.fillColor,
    aspectRatioType: scene.aspectRatioType,
    history: scene.history,
    historyIndex: scene.historyIndex,
  };
};

const writeReplica = async (c: ControllerState): Promise<void> => {
  const record = buildReplicaRecord(c);
  if (!record) return;
  await writeSessionRecord(record);
};

const flushReplicaNow = (): void => {
  const c = controller;
  if (!c) return;
  if (c.replicaTimer) {
    clearTimeout(c.replicaTimer);
    c.replicaTimer = null;
  }
  void writeReplica(c);
};

const backupDocumentJson = async (
  c: ControllerState,
  key: string,
  documentJson: string,
): Promise<void> => {
  const doc = parseDocument(documentJson);
  if (!doc) return;
  await writeSessionRecord({
    key,
    ownerId: c.ownerId,
    name: doc.name ?? "",
    remoteToken: null,
    baseRevision: null,
    needsSync: false,
    savedAt: Date.now(),
    drawNodes: doc.drawNodes as SerializedDrawNode[],
    inpaintLineNodes: doc.inpaintLineNodes,
    brushColor: doc.brushColor,
    brushSize: doc.brushSize,
    fillColor: doc.fillColor,
    aspectRatioType: doc.aspectRatioType,
    history: [],
    historyIndex: -1,
  });
};

// ─── Account switching ─────────────────────────────────────────────────────

/**
 * The signed-in account changed under us. Flush the outgoing account's
 * replica, clear the canvas (cross-account content must never linger), and
 * hydrate the incoming account's last session. Signed-out drafts are
 * adoptable: logging in stamps the anonymous draft with the new owner.
 */
const handleAccountSwitch = async (nextOwner: string | null): Promise<void> => {
  const c = controller;
  if (!c) return;

  if (c.saveTimer) clearTimeout(c.saveTimer);
  if (c.retryTimer) clearTimeout(c.retryTimer);
  c.saveTimer = null;
  c.retryTimer = null;
  flushReplicaNow();

  const previousOwner = c.ownerId;
  c.ownerId = nextOwner;
  c.baseRevision = null;
  c.needsSync = false;

  // anon → signed-in: adopt the anonymous draft into the new account rather
  // than hiding the work the user just did before logging in.
  if (previousOwner === null && nextOwner !== null) {
    const anonRecord = await readSessionRecord(draftKey(null));
    const ownRecord = await readSessionRecord(draftKey(nextOwner));
    if (anonRecord && !ownRecord) {
      await writeSessionRecord({
        ...anonRecord,
        key: draftKey(nextOwner),
        ownerId: nextOwner,
      });
      void deleteSessionRecord(draftKey(null));
      writeLastActiveKey(nextOwner, draftKey(nextOwner));
    }
  }

  resetSceneForSessionSwitch();
  resetDrawSessionStore();
  useDrawSessionStore.setState({
    hydration: "hydrating",
    loggedIn: nextOwner !== null,
  });
  await hydrate();
};

const resetSceneForSessionSwitch = (): void => {
  withSuppressedDirty(() => {
    useSceneStore.getState().RESET();
  });
};

// ─── Deserialization ───────────────────────────────────────────────────────

/** Rebuild live nodes from replica-serialized form (async image loads). */
const deserializeDrawNodes = async (
  nodes: SerializedDrawNode[],
): Promise<(Node | LineNode)[]> =>
  Promise.all(
    nodes.map(async (nodeData) => {
      if (nodeData.type === "line") return nodeData as LineNode;
      const shapeData = nodeData as SerializedNodeData;
      const node = new Node(shapeData);
      if (node.type === "image" && (node.imageUrl || node.imageFile)) {
        try {
          if (node.imageFile) {
            await node.setImageFromFile(node.imageFile);
          } else if (node.imageUrl) {
            await node.setImageFromUrl(node.imageUrl);
          }
        } catch (error) {
          console.error("[PageDraw] image restore failed", error);
        }
      }
      return node;
    }),
  );

const resolveMediaSafe = async (
  c: ControllerState,
  tokens: string[],
): Promise<Record<string, string>> => {
  if (tokens.length === 0) return {};
  try {
    return await c.adapter.resolveMediaUrls(tokens);
  } catch (error) {
    console.error("[PageDraw] media URL resolution failed", error);
    return {};
  }
};
