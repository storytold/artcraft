import { Hono } from "hono";

import { jobStatePayload, sessionJobPayload } from "../jobs";
import { currentUser } from "../session";
import type { FakeStore } from "../state";

/**
 * Job status routes — ported from `infra/fake-storyteller-web` (routes/jobs.ts). Single and
 * batch lookups need no user (tokens are unguessable); the session listing is session-only.
 */
export function jobRoutes(store: FakeStore): Hono {
  const app = new Hono();

  app.get("/v1/jobs/job/:token", (c) => {
    const job = store.jobsByToken.get(c.req.param("token"));
    if (job === undefined) {
      return c.json(
        { success: false, error_code: 404, error_code_str: "NotFound", message: "job not found" },
        404,
      );
    }
    return c.json({ success: true, state: jobStatePayload(job) });
  });

  app.get("/v1/jobs/batch", (c) => {
    // Repeated `tokens=` params (what openapi-fetch sends) and comma-joined values both work.
    const requested = c.req.queries("tokens")?.flatMap((value) => value.split(",")) ?? [];
    const wanted = new Set(requested.filter((token) => token.length > 0));
    const states = [...wanted]
      .map((token) => store.jobsByToken.get(token))
      .filter((job) => job !== undefined)
      .map((job) => jobStatePayload(job));
    return c.json({ success: true, job_states: states });
  });

  app.get("/v1/jobs/session", (c) => {
    const user = currentUser(store, c.req.raw);
    if (user === undefined) {
      return c.json(
        {
          success: false,
          error_code: 401,
          error_code_str: "NotAuthorized",
          message: "not authorized",
        },
        401,
      );
    }
    const include = statesParam(c.req.query("include_states"));
    const exclude = statesParam(c.req.query("exclude_states"));
    const owned = [...store.jobsByToken.values()]
      .filter((job) => job.ownerUserToken === user.userToken)
      .filter((job) => (include ? include.has(job.status) : true))
      .filter((job) => (exclude ? !exclude.has(job.status) : true))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return c.json({ success: true, jobs: owned.map(sessionJobPayload) });
  });

  return app;
}

function statesParam(value: string | undefined): Set<string> | undefined {
  if (!value) return undefined;
  return new Set(
    value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
}
