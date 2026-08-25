import { Hono } from "hono";

import { GENERATION_KINDS, hasProviderFilter, modelsResponse } from "../catalogue";
import { type CostRequest, estimateCost, validateCostRequest } from "../pricing";

/**
 * Omni-gen catalogue and cost routes — ported from `infra/fake-storyteller-web`
 * (routes/omni_gen.ts). Models need no user upstream (a session only unlocks a few gated
 * models) and cost estimates are anonymous there too; the fake serves both to everyone.
 */
export function omniGenRoutes(): Hono {
  const app = new Hono();

  for (const kind of GENERATION_KINDS) {
    app.get(`/v1/omni_gen/models/${kind}`, (c) => {
      // Only image and video declare the query; actix ignores unknown params elsewhere.
      const provider = hasProviderFilter(kind) ? c.req.query("provider") : undefined;
      if (provider !== undefined && provider !== "artcraft" && provider !== "all") {
        return c.json(badInput(`unknown provider filter: ${provider}`), 400);
      }
      return c.json(modelsResponse(kind, provider));
    });

    app.post(`/v1/omni_gen/cost/${kind}`, async (c) => {
      const body = await c.req.json<CostRequest>();
      const failure = validateCostRequest(kind, body);
      if (failure) return c.json(badInput(failure.message), 400);
      return c.json(estimateCost(kind, body));
    });
  }

  return app;
}

function badInput(message: string): Record<string, unknown> {
  return { success: false, error_code: 400, error_code_str: "BadInput", message };
}
