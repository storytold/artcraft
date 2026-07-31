/**
 * `/v1/omni_gen` — model catalogues, cost estimates, and generation submission.
 *
 * `cost/*` is anonymous; `generate/*` requires a session, spends credits, and
 * queues jobs for the resolver. No provider is contacted, and there is no code
 * path here that could.
 */

import { currentUser } from "../auth.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, failure, paymentRequired, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import {
  audioModelsResponse,
  imageModelsResponse,
  isKnownModel,
  meshModelsResponse,
  splatModelsResponse,
  videoModelsResponse,
} from "../generation/catalogue.ts";
import { readPromptTriggers } from "../generation/prompt_flags.ts";
import {
  estimateCost,
  hasEnoughCredits,
  isReplayedIdempotencyToken,
  isValidIdempotencyToken,
  submitGeneration,
  type GenerateRequestBody,
  type GenerationKind,
} from "../generation/submit.ts";

const CATALOGUES: Record<GenerationKind, () => object> = {
  image: imageModelsResponse,
  video: videoModelsResponse,
  audio: audioModelsResponse,
  mesh: meshModelsResponse,
  splat: splatModelsResponse,
};

/** Only the image response omits `all_job_tokens`, matching the real handlers. */
const KINDS_WITH_ALL_JOB_TOKENS = new Set<GenerationKind>(["video", "audio", "mesh", "splat"]);

export function registerOmniGenRoutes(router: Router): void {
  for (const kind of Object.keys(CATALOGUES) as GenerationKind[]) {
    router.get(`/v1/omni_gen/models/${kind}`, () => new HttpResult(200, CATALOGUES[kind]()));
    router.post(`/v1/omni_gen/cost/${kind}`, (context) => getCost(kind, context));
    router.post(`/v1/omni_gen/generate/${kind}`, (context) => generate(kind, context));
  }
}

function getCost(kind: GenerationKind, context: RequestContext): HttpResult {
  const body = readBody(context);

  const modelError = validateModel(body);
  if (modelError !== undefined) {
    return modelError;
  }

  return new HttpResult(200, { success: true, ...estimateCost(kind, body) });
}

function generate(kind: GenerationKind, context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const body = readBody(context);

  const modelError = validateModel(body);
  if (modelError !== undefined) {
    return modelError;
  }

  if (!isValidIdempotencyToken(body.idempotency_token)) {
    return failure(400, "BadInput", "invalid idempotency token");
  }
  if (isReplayedIdempotencyToken(body.idempotency_token)) {
    return failure(400, "BadInput", "repeated idempotency token");
  }

  if (readPromptTriggers(body.prompt).rejectWithPaymentRequired) {
    return paymentRequired(
      "fake-storyteller-web: payment failure forced by the trigger_payment_failure prompt flag.",
    );
  }

  const cost = estimateCost(kind, body);
  if (!hasEnoughCredits(user, cost.cost_in_credits)) {
    return paymentRequired(
      `Not enough credits: ${cost.cost_in_credits} required, ${user.monthlyCredits + user.bankedCredits} available.`,
    );
  }

  const submitted = submitGeneration(kind, body, user);
  const primaryToken = submitted.jobTokens[0];

  const payload: Record<string, unknown> = { success: true, inference_job_token: primaryToken };
  if (KINDS_WITH_ALL_JOB_TOKENS.has(kind)) {
    payload["all_job_tokens"] = submitted.jobTokens;
  }

  return new HttpResult(200, payload);
}

function validateModel(body: GenerateRequestBody): HttpResult | undefined {
  if (body.model === undefined) {
    return failure(400, "BadInput", "no model supplied");
  }
  if (!isKnownModel(body.model)) {
    return failure(400, "BadInput", `unknown model: ${body.model}`);
  }
  return undefined;
}

function readBody(context: RequestContext): GenerateRequestBody {
  return context.json<GenerateRequestBody>();
}
