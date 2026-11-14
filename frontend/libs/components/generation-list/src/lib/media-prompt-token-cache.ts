import { useEffect, useState } from "react";
import { MediaFilesApi } from "@storyteller/api";

// Workaround until the profile media-list endpoint returns prompt tokens:
// resolve media token → prompt token via the batch media-files endpoint
// (GET /v1/media_files/batch), which does include `maybe_prompt_token`. The
// resolved prompt token is then fed into the prompts cache (usePrompts) to get
// the prompt text + model. Mirrors prompts-cache.ts: module-level cache,
// in-flight dedupe, and a subscribe-on-load hook.

// mediaToken → promptToken ("" = resolved, but the media has no prompt token).
const tokenCache = new Map<string, string>();
const inFlight = new Set<string>();
const subscribers = new Set<() => void>();
let api: MediaFilesApi | null = null;

// Keep request URLs (one `tokens=` param per token) comfortably under length limits.
const CHUNK_SIZE = 50;

function getApi(): MediaFilesApi {
  if (!api) api = new MediaFilesApi();
  return api;
}

function notifySubscribers() {
  for (const cb of subscribers) cb();
}

async function fetchMissing(mediaTokens: readonly string[]): Promise<void> {
  const missing = mediaTokens.filter(
    (t) => t && !tokenCache.has(t) && !inFlight.has(t),
  );
  if (missing.length === 0) return;
  for (const t of missing) inFlight.add(t);

  try {
    const chunks: string[][] = [];
    for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
      chunks.push(missing.slice(i, i + CHUNK_SIZE));
    }
    const responses = await Promise.all(
      chunks.map((chunk) =>
        getApi().ListMediaFilesByTokens({ mediaTokens: chunk }),
      ),
    );
    for (const response of responses) {
      if (!response.success || !response.data) continue;
      for (const file of response.data) {
        tokenCache.set(file.token, file.maybe_prompt_token ?? "");
      }
    }
  } catch {
    // Swallow — the finally block marks the tokens resolved (empty) so the
    // loading skeleton clears and we don't refetch in a loop.
  } finally {
    // Mark every requested token resolved. Tokens that errored or weren't
    // returned get "" (no prompt) so the row falls back to its label instead
    // of showing a skeleton forever. Always notify so skeletons clear.
    for (const t of missing) {
      if (!tokenCache.has(t)) tokenCache.set(t, "");
      inFlight.delete(t);
    }
    notifySubscribers();
  }
}

// Returns mediaToken → promptToken for every token whose media→prompt lookup
// has completed; the value is "" when the media has no prompt. A token that is
// absent from the map is still resolving (use `.has()` to distinguish that
// from a resolved-but-promptless item). Triggers a batched fetch for any not
// yet resolved.
export function useMediaPromptTokens(
  mediaTokens: readonly (string | null | undefined)[],
): Map<string, string> {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const cb = () => forceUpdate((n) => n + 1);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  const cleaned: string[] = [];
  for (const t of mediaTokens) {
    if (t) cleaned.push(t);
  }
  // Stable cache key for the effect's dep list, order-independent.
  const key = [...new Set(cleaned)].sort().join(",");

  useEffect(() => {
    if (key.length > 0) fetchMissing(key.split(","));
  }, [key]);

  const result = new Map<string, string>();
  for (const t of cleaned) {
    const promptToken = tokenCache.get(t);
    // Include "" entries so callers can tell "resolved, no prompt" (present)
    // apart from "still loading" (absent).
    if (promptToken !== undefined) result.set(t, promptToken);
  }
  return result;
}
