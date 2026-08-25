import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

import type { Scope } from "../../auth/oauth";
import type { Principal } from "../../tokens/principal";
import type { UpstreamClient } from "../../upstream/client";

/**
 * How a tool is declared. Handlers are pure functions of the caller and their input; they
 * reach the API only through the (allowlisted, credentialed) upstream client they are given.
 */

export interface ToolContext {
  readonly principal: Principal;
  readonly upstream: UpstreamClient;
}

export interface ToolResult<Output> {
  /** Returned as `structuredContent`; validated against `outputSchema` by the SDK. */
  readonly structured: Output;
  /** A short human-readable rendering, returned alongside for clients that only show text. */
  readonly text: string;
}

export interface ToolDefinition<
  InputShape extends z.ZodRawShape,
  OutputShape extends z.ZodRawShape,
> {
  readonly name: string;
  readonly title: string;
  /** Written for the model: what it returns, when to call it, what arguments mean. */
  readonly description: string;
  /** The tool is registered only for principals holding this scope. */
  readonly requiredScope: Scope;
  readonly inputSchema: InputShape;
  readonly outputSchema: OutputShape;
  readonly annotations: ToolAnnotations;
  handler(
    context: ToolContext,
    input: z.infer<z.ZodObject<InputShape>>,
  ): Promise<ToolResult<z.infer<z.ZodObject<OutputShape>>>>;
}

/** Every M1 tool is read-only; declare it once so no tool forgets. */
export const READ_ONLY_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/** A failure the user (or model) should see, phrased for them. Becomes an `isError` result. */
export class ToolFailure extends Error {
  override readonly name = "ToolFailure";
}

/**
 * The upstream no longer accepts the credential this grant holds (the user signed out of
 * Artcraft, or the session was deleted). The handler revokes the grant so the client
 * re-authorizes on its next request.
 */
export class UpstreamSessionInvalid extends Error {
  override readonly name = "UpstreamSessionInvalid";

  constructor() {
    super(
      "Your Artcraft sign-in is no longer valid. Disconnect and reconnect Artcraft to continue.",
    );
  }
}

const UNAVAILABLE = "Artcraft could not be reached. Please try again in a moment.";

/**
 * Turn an openapi-fetch result into either its data or a tool-level error. Shared by every
 * tool so the mapping — 401 → session invalid, 4xx → the server's message, 5xx/network →
 * unavailable — is decided once.
 */
export function unwrapUpstream<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.data !== undefined) return result.data;
  const status = result.response.status;
  if (status === 401) throw new UpstreamSessionInvalid();
  if (status >= 400 && status < 500) {
    const message = serverMessage(result.error);
    throw new ToolFailure(message ?? `Artcraft rejected the request (HTTP ${String(status)}).`);
  }
  throw new ToolFailure(UNAVAILABLE);
}

function serverMessage(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.length > 0 ? message : undefined;
}
