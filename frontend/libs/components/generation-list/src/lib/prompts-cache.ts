import { useEffect, useState } from "react";
import { PromptsApi } from "@storyteller/api";
import type { Prompts } from "@storyteller/api";

const promptCache = new Map<string, Prompts>();
const inFlight = new Set<string>();
const subscribers = new Set<() => void>();
let api: PromptsApi | null = null;

function getApi(): PromptsApi {
  if (!api) api = new PromptsApi();
  return api;
}

function notifySubscribers() {
  for (const cb of subscribers) cb();
}

async function fetchMissing(tokens: readonly string[]): Promise<void> {
  const missing = tokens.filter(
    (t) => t && !promptCache.has(t) && !inFlight.has(t),
  );
  if (missing.length === 0) return;
  for (const t of missing) inFlight.add(t);
  try {
    const response = await getApi().BatchGetPrompts({ tokens: missing });
    if (response.success && response.data) {
      for (const p of response.data) {
        promptCache.set(p.token, p);
      }
      notifySubscribers();
    }
  } catch {
    // Failures will be retried when usePrompts re-runs with the same tokens.
  } finally {
    for (const t of missing) inFlight.delete(t);
  }
}

export function getCachedPrompt(token: string): Prompts | undefined {
  return promptCache.get(token);
}

export function usePrompts(
  tokens: readonly (string | null | undefined)[],
): Map<string, Prompts> {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const cb = () => forceUpdate((n) => n + 1);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  const cleaned: string[] = [];
  for (const t of tokens) {
    if (t) cleaned.push(t);
  }
  // Stable cache key for the effect's dep list. Sorting keeps it stable when
  // a poll returns the same set in a different order.
  const key = [...new Set(cleaned)].sort().join(",");

  useEffect(() => {
    if (key.length > 0) fetchMissing(key.split(","));
  }, [key]);

  const result = new Map<string, Prompts>();
  for (const t of cleaned) {
    const p = promptCache.get(t);
    if (p) result.set(t, p);
  }
  return result;
}
