import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import type { FetchHandler } from "../auth/oauth";
import { getRuntime } from "../runtime";
import { principalFromProps, PrincipalError } from "../tokens/principal";
import { createUpstreamClient } from "../upstream/client";
import { createMcpServer } from "./server";

/**
 * The protected MCP route. The OAuth provider invokes this only after validating a bearer
 * token, with the decrypted grant props on `ctx.props`. From there:
 *
 * 1. props → Principal (a grant this build cannot read is refused with 403, never guessed at);
 * 2. a read-use upstream client bound to the principal's credential;
 * 3. a fresh McpServer + web-standard Streamable HTTP transport per request — stateless, JSON
 *    responses — which is what lets this run on Workers with no session affinity;
 * 4. if a tool learns the upstream no longer accepts the credential, the grant is revoked
 *    after the response, so the client's next request meets a 401 and re-authorizes.
 *
 * Only /mcp is protected: access tokens are audience-bound to it, so a legacy /sse route could
 * never be reached with one; the unprotected app answers /sse with a pointer instead.
 */

export const mcpApiHandler: FetchHandler = {
  async fetch(request, env, ctx) {
    const props: unknown = (ctx as ExecutionContext & { props?: unknown }).props;
    let principal;
    try {
      principal = principalFromProps(props);
    } catch (error) {
      if (error instanceof PrincipalError) {
        return Response.json({ error: "This connection must be re-authorized." }, { status: 403 });
      }
      throw error;
    }

    const { config } = getRuntime(env);
    const upstream = createUpstreamClient({
      baseUrl: config.upstreamApiHost,
      use: "read",
      credential: principal.credential,
    });

    const state = { upstreamSessionInvalid: false };
    const server = createMcpServer({
      principal,
      upstream,
      onUpstreamSessionInvalid: () => {
        state.upstreamSessionInvalid = true;
      },
    });
    // No sessionIdGenerator: stateless; JSON responses: no SSE stream to hold open.
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    await server.connect(transport);
    try {
      return await transport.handleRequest(request);
    } finally {
      ctx.waitUntil(server.close());
      if (state.upstreamSessionInvalid) {
        ctx.waitUntil(revokeGrantForRequest(env.OAUTH_PROVIDER, request));
      }
    }
  },
};

/** Revoke the grant behind this request's bearer token; best effort, never throws. */
async function revokeGrantForRequest(helpers: OAuthHelpers, request: Request): Promise<void> {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const summary = await helpers.unwrapToken(token);
    if (summary) await helpers.revokeGrant(summary.grantId, summary.userId);
  } catch (error) {
    console.warn(JSON.stringify({ event: "grant_revoke_failed", reason: String(error) }));
  }
}
