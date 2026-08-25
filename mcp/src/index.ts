import { OAuthProvider } from "@cloudflare/workers-oauth-provider";

import { createOAuthProviderOptions } from "./auth/oauth";
import { ConfigError } from "./config";
import { mcpApiHandler } from "./mcp/handler";
import { getRuntime } from "./runtime";

/**
 * Worker entry point. Every request first passes the environment invariant (a misconfigured
 * deploy fails everything, including the OAuth endpoints), then the OAuth provider routes it:
 * protected MCP routes require a valid access token; everything else reaches the Hono app.
 */
export const oauthProviderOptions = createOAuthProviderOptions({
  defaultHandler: {
    fetch: (request, env, ctx) => getRuntime(env).app.fetch(request, env, ctx),
  },
  apiHandler: mcpApiHandler,
});

const provider = new OAuthProvider(oauthProviderOptions);

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
    try {
      getRuntime(env);
    } catch (error) {
      if (error instanceof ConfigError) {
        return Promise.resolve(
          new Response(`Worker misconfigured: ${error.message}`, {
            status: 500,
            headers: { "content-type": "text/plain; charset=utf-8" },
          }),
        );
      }
      throw error;
    }
    return provider.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Cloudflare.Env>;
