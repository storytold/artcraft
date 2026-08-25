import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

// The provider injects its helpers into `env` for every handler it invokes. The generated
// worker-configuration.d.ts knows only the wrangler.toml bindings, so add this one here.
declare global {
  namespace Cloudflare {
    interface Env {
      OAUTH_PROVIDER: OAuthHelpers;
    }
  }
}

export {};
