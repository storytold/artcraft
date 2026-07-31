/**
 * Control endpoints that the real backend does not have.
 *
 * Everything here is namespaced under `/__fake` (plus the real `/_status`
 * health check) so it is obvious at a glance that a caller has become dependent
 * on the fake rather than on the API.
 */

import { currentUser } from "../auth.ts";
import { config, publicOrigin } from "../config.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, failure, success } from "../http/respond.ts";
import type { Router } from "../http/router.ts";
import { objectCount } from "../state/assets.ts";
import { seedState } from "../state/seed.ts";
import { store } from "../state/store.ts";
import { FAILURE_CATEGORIES } from "../generation/prompt_flags.ts";

export function registerControlRoutes(router: Router): void {
  router.get("/_status", () => success({ service: "fake-storyteller-web" }));
  router.get("/__fake/state", describeState);
  router.post("/__fake/reset", resetState);
  router.post("/__fake/credits", grantCredits);
  router.get("/__fake/checkout", explainCheckout);
}

function describeState(): HttpResult {
  return success({
    users: store.usersByToken.size,
    sessions: store.sessionsBySignedSession.size,
    media_files: store.mediaFilesByToken.size,
    stored_objects: objectCount(),
    jobs: store.jobsByToken.size,
    prompts: store.promptsByToken.size,
    folders: store.foldersByToken.size,
    tags: store.tagsByToken.size,
    characters: store.charactersByToken.size,
    resolve_seconds: config.resolveSeconds,
    failure_categories: FAILURE_CATEGORIES,
  });
}

/** Return to the seeded fixture. Logs everyone out, since sessions are cleared too. */
function resetState(): HttpResult {
  seedState();
  return success({ message: "fake-storyteller-web state reset to the seeded fixture" });
}

function grantCredits(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return failure(401, "NotLoggedIn", "log in before granting credits");
  }

  const body = context.json<{ banked_credits: number; monthly_credits: number }>();
  user.bankedCredits = body.banked_credits ?? user.bankedCredits;
  user.monthlyCredits = body.monthly_credits ?? user.monthlyCredits;

  return success({
    banked_credits: user.bankedCredits,
    monthly_credits: user.monthlyCredits,
    sum_total_credits: user.bankedCredits + user.monthlyCredits,
  });
}

/** Where the fake's Stripe checkout URLs land, so a click explains itself. */
function explainCheckout(context: RequestContext): HttpResult {
  const flow = context.queryValue("flow") ?? "unknown";
  const detail = context.queryValue("detail") ?? "";

  const page = `<!doctype html>
<meta charset="utf-8">
<title>fake-storyteller-web checkout</title>
<style>body{font:16px/1.6 system-ui;margin:4rem auto;max-width:34rem;padding:0 1rem}code{background:#8883;padding:.1em .3em;border-radius:.2em}</style>
<h1>There is no Stripe here</h1>
<p>The webapp is pointed at <code>fake-storyteller-web</code>, which has no payment provider.</p>
<p>Requested flow: <code>${escapeHtml(flow)}</code>${detail ? ` (<code>${escapeHtml(detail)}</code>)` : ""}</p>
<p>To change your credit balance, post to <code>${publicOrigin()}/__fake/credits</code> with
<code>{"banked_credits": 100000}</code> while logged in.</p>`;

  return new HttpResult(200, Buffer.from(page, "utf8"), { "Content-Type": "text/html; charset=utf-8" });
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
