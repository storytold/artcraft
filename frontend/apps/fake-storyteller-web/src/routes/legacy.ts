/**
 * Endpoints with a client in `@storyteller/api` but no live webapp consumer:
 * weights, TTS, the video studio workflow, bookmarks, and ratings.
 *
 * They are implemented as empty-but-correctly-shaped responses. That is cheap,
 * and it means a page that starts calling one of them gets an empty list rather
 * than the 501 an unimplemented route would return — which would look like a
 * bug in the page rather than a gap in the fake.
 */

import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { config } from "../config.ts";
import { nowIso } from "../state/clock.ts";
import { store } from "../state/store.ts";
import { makeToken, TOKEN_PREFIX } from "../state/tokens.ts";

export function registerLegacyRoutes(router: Router): void {
  router.get("/v1/weights/list", listWeightsWithCursor);
  router.get("/v1/weights/list_featured", listWeightsWithCursor);
  router.get("/v1/weights/list_pinned", () => success({ results: [] }));
  router.get("/v1/weights/by_user/:username", listWeightsWithPages);
  router.post("/v1/weights/search", () => success({ weights: [] }));
  router.get("/v1/weights/weight/:weightToken", () => success());
  router.post("/v1/weights/weight/:weightToken", () => success());
  router.delete("/v1/weights/weight/:weightToken", () => success());
  router.post("/v1/weights/weight/:weightToken/cover_image", () => success());

  router.post("/v1/tts/inference", (context) => enqueueStubJob(context, "text_to_speech"));
  router.post("/v1/workflows/enqueue_studio", (context) => enqueueStubJob(context, "workflow"));

  router.get("/v1/user_bookmarks/batch", () => success({ bookmarks: [] }));
  router.post("/v1/user_bookmarks/create", createBookmark);
  router.delete("/v1/user_bookmarks/delete/:entityToken", () => success());

  router.get("/v1/user_rating/batch", () => success({ ratings: [] }));
  router.post("/v1/user_rating/rate", () => success({ new_positive_rating_count_for_entity: 1 }));
  router.get("/v1/user_rating/view/:entityType/:entityToken", () => success({ maybe_rating_value: null }));
}

function listWeightsWithCursor(): HttpResult {
  return success({
    results: [],
    pagination: { maybe_next: null, maybe_previous: null, cursor_is_reversed: false },
  });
}

function listWeightsWithPages(): HttpResult {
  return success({ results: [], pagination: { current: 0, total_page_count: 1 } });
}

function createBookmark(): HttpResult {
  return success({
    new_bookmark_count_for_entity: 1,
    user_bookmark_token: makeToken(TOKEN_PREFIX.userBookmark),
  });
}

/**
 * Queue a job that the resolver will complete like any other, so callers that
 * poll for a result get one instead of hanging.
 */
function enqueueStubJob(context: RequestContext, category: "text_to_speech" | "workflow"): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const jobToken = makeToken(TOKEN_PREFIX.inferenceJob);
  const timestamp = nowIso();

  store.jobsByToken.set(jobToken, {
    jobToken,
    inferenceCategory: category,
    status: "pending",
    progressPercentage: 0,
    maybePromptToken: undefined,
    maybeModelType: undefined,
    maybeModelTitle: undefined,
    maybeRawInferenceText: undefined,
    maybeCreatorUserToken: user.userToken,
    maybeBatchToken: undefined,
    maybeResultMediaFileToken: undefined,
    maybeFailureCategory: undefined,
    maybeFailureMessage: undefined,
    maybeSuccessfullyCompletedAt: undefined,
    resolveAtMillis: Date.now() + config.resolveSeconds * 1000,
    isDismissed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return success({ inference_job_token: jobToken, inference_job_token_type: "inference_job" });
}
