/**
 * `/v1/jobs` — polling generation progress.
 *
 * One deliberate divergence from the real backend: `GET /v1/jobs/batch`
 * requires a `tokens` query parameter server-side, but `JobsApi.ListJobs()`
 * calls it with none and always gets a 400. The fake returns an empty list
 * instead, so the client's own call pattern works.
 */

import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, notFound, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { nowIso } from "../state/clock.ts";
import { sortNewestFirst, store } from "../state/store.ts";
import { jobPreviewPayload, jobStatePayload, sessionJobPayload } from "../wire/jobs.ts";

export function registerJobRoutes(router: Router): void {
  router.get("/v1/jobs/job/:token", getJob);
  router.delete("/v1/jobs/job/:token", deleteJob);
  router.get("/v1/jobs/batch", batchGetJobs);
  router.get("/v1/jobs/session", listSessionJobs);
  router.post("/v1/jobs/session/dismiss_finished", dismissFinishedJobs);
  router.get("/v1/workflows/preview_status/:token", getPreviewStatus);

  router.get("/v1/model_inference/job_status/:token", getJob);
  router.delete("/v1/model_inference/job/:token", deleteJob);
  router.get("/v1/model_inference/queue_length", getQueueLength);
}

function getJob(context: RequestContext): HttpResult {
  const job = store.jobsByToken.get(context.params["token"] ?? "");
  if (job === undefined) {
    return notFound();
  }
  return success({ state: jobStatePayload(job) });
}

function deleteJob(context: RequestContext): HttpResult {
  const token = context.params["token"] ?? "";
  if (!store.jobsByToken.has(token)) {
    return notFound();
  }
  store.jobsByToken.delete(token);
  return success();
}

function batchGetJobs(context: RequestContext): HttpResult {
  const requested = context.query.getAll("tokens").flatMap((value) => value.split(","));
  const wanted = new Set(requested.filter((token) => token.length > 0 && token !== "None"));

  const states = [...wanted]
    .map((token) => store.jobsByToken.get(token))
    .filter((job) => job !== undefined)
    .map((job) => jobStatePayload(job));

  return success({ job_states: states });
}

function listSessionJobs(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const owned = [...store.jobsByToken.values()].filter(
    (job) => job.maybeCreatorUserToken === user.userToken && !job.isDismissed,
  );

  return success({ jobs: sortNewestFirst(owned).map(sessionJobPayload) });
}

function dismissFinishedJobs(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  for (const job of store.jobsByToken.values()) {
    if (job.maybeCreatorUserToken !== user.userToken) {
      continue;
    }
    if (job.status === "complete_success" || job.status === "complete_failure") {
      job.isDismissed = true;
      job.updatedAt = nowIso();
    }
  }

  return success();
}

function getPreviewStatus(context: RequestContext): HttpResult {
  const job = store.jobsByToken.get(context.params["token"] ?? "");
  if (job === undefined) {
    return new HttpResult(404, { success: false, error_message: "job not found" });
  }
  return success({ state: jobPreviewPayload(job) });
}

function getQueueLength(): HttpResult {
  let pending = 0;
  for (const job of store.jobsByToken.values()) {
    if (job.status === "pending" || job.status === "started") {
      pending += 1;
    }
  }
  return success({ pending_job_count: pending });
}
