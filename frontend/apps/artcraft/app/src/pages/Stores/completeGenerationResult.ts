import { v4 as uuidv4 } from "uuid";

interface GenerationResult {
  id: string;
  mode: "image" | "text";
  timestamp: number;
  note?: string;
  status: "pending" | "completed";
  subscriberId: string;
  modelUrl?: string;
  mediaToken?: string;
}

/**
 * The results after a 3D job finishes: the one with that subscriber id (else the first still
 * pending) becomes completed with the model; with none to update, a completed one is added first.
 */
export function completeGenerationResult<T extends GenerationResult>(
  results: readonly T[],
  subscriberId: string | undefined,
  completed: { modelUrl: string; mediaToken: string; note: string },
): T[] {
  const { modelUrl, mediaToken, note } = completed;
  const index = subscriberId
    ? results.findIndex((r) => r.subscriberId === subscriberId)
    : results.findIndex((r) => r.status === "pending");
  if (index === -1) {
    const id = uuidv4();
    // The other fields of T are optional, as the 3D result types declare them.
    const added = { id, subscriberId: id, mode: "image", timestamp: Date.now(), note, status: "completed", modelUrl, mediaToken } as T;
    return [added, ...results];
  }
  const next = [...results];
  next[index] = { ...next[index], status: "completed", modelUrl, mediaToken };
  return next;
}

/** A store's `completeGeneration`: logs the finished job under `store` and applies completeGenerationResult. */
export function completeGenerationAction<T extends GenerationResult>(
  set: (update: (state: { results: T[] }) => { results: T[] }) => void,
  store: string,
  note: string,
) {
  return (modelUrl: string, mediaToken: string, maybeSubscriberId?: string) => {
    console.log(`[${store}] completeGeneration`, { modelUrl, mediaToken, maybeSubscriberId });
    set((s) => ({
      results: completeGenerationResult(s.results, maybeSubscriberId, { modelUrl, mediaToken, note }),
    }));
  };
}
