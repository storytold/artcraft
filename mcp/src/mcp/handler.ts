import type { FetchHandler } from "../auth/oauth";

/**
 * The protected MCP route. The OAuth provider only invokes this after validating a bearer
 * token, and exposes the decrypted grant props on `ctx.props`. The transport itself lands in
 * a later PR; until then this answers 501 so a valid token can be proven end to end without
 * anything being callable.
 */
export const mcpApiHandler: FetchHandler = {
  fetch(_request, _env, ctx) {
    const props: unknown = (ctx as ExecutionContext & { props?: unknown }).props;
    return Promise.resolve(
      Response.json(
        { error: "MCP transport not available yet", authenticated: props !== undefined },
        { status: 501 },
      ),
    );
  },
};
