import { Hono } from "hono";

import { GENERATION_KINDS, hasProviderFilter, modelsResponse } from "../catalogue";

/**
 * Omni-gen catalogue routes — ported from `infra/fake-storyteller-web` (routes/omni_gen.ts).
 * Models need no user upstream (a session only unlocks a few gated models); the fake serves the
 * same list to everyone. Cost estimates arrive with the estimate_cost tool.
 */
export function omniGenRoutes(): Hono {
  const app = new Hono();

  for (const kind of GENERATION_KINDS) {
    app.get(`/v1/omni_gen/models/${kind}`, (c) => {
      // Only image and video declare the query; actix ignores unknown params elsewhere.
      const provider = hasProviderFilter(kind) ? c.req.query("provider") : undefined;
      if (provider !== undefined && provider !== "artcraft" && provider !== "all") {
        return c.json(
          {
            success: false,
            error_code: 400,
            error_code_str: "BadInput",
            message: `unknown provider filter: ${provider}`,
          },
          400,
        );
      }
      return c.json(modelsResponse(kind, provider));
    });
  }

  return app;
}
