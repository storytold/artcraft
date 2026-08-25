import { createUpstreamClient } from "./client";
import type { UpstreamCredential } from "./credential";

/**
 * End an upstream session we hold. Best effort: the credential may already be dead, and a
 * failure here must never block the caller (a revoke, a page sign-in that only needed the
 * identity). Returns whether upstream confirmed the sign-out.
 */
export async function signOutUpstream(
  upstreamApiHost: string,
  credential: UpstreamCredential,
  fetchImpl: typeof globalThis.fetch = globalThis.fetch,
): Promise<boolean> {
  try {
    const client = createUpstreamClient({
      baseUrl: upstreamApiHost,
      use: "auth",
      credential,
      fetch: fetchImpl,
    });
    const result = await client.POST("/v1/logout");
    return result.response.ok;
  } catch {
    return false;
  }
}
