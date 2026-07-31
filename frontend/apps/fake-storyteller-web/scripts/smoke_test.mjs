/**
 * End-to-end smoke test.
 *
 * Boots the server on a scratch port, drives the flows the webapp depends on,
 * and exits non-zero on the first failure. Run it with
 * `nx run fake-storyteller-web:smoke` (or `node scripts/smoke_test.mjs`).
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PORT = Number(process.env["FAKE_API_PORT"] ?? 12456);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const APP_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** Generations resolve fast so the test does not spend its time waiting. */
const RESOLVE_SECONDS = 2;
const POLL_TIMEOUT_MILLIS = 20_000;

let failures = 0;
let cookie = "";

const server = spawn(
  process.execPath,
  ["--disable-warning=ExperimentalWarning", join(APP_ROOT, "src", "main.ts")],
  {
    cwd: APP_ROOT,
    env: {
      ...process.env,
      FAKE_API_PORT: String(PORT),
      FAKE_API_RESOLVE_SECONDS: String(RESOLVE_SECONDS),
    },
    stdio: ["ignore", "pipe", "inherit"],
  },
);

try {
  await waitForServer();
  await runChecks();
} finally {
  server.kill();
}

console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} smoke check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);

async function runChecks() {
  const status = await api("GET", "/_status");
  check("health check responds", status.body.success === true);

  const loggedOut = await api("GET", "/v1/session");
  check("logged-out session says so", loggedOut.body.logged_in === false);
  check("logged-out session sends user: null", loggedOut.body.user === null);

  const badLogin = await api("POST", "/v1/login", {
    username_or_email: "localdev1",
    password: "wrong",
  });
  check("bad password is a 401", badLogin.status === 401);
  check("bad password uses the error_type dialect", badLogin.body.error_type === "InvalidCredentials");

  const login = await api("POST", "/v1/login", {
    username_or_email: "localdev1",
    password: "localdev1pass",
  });
  check("login succeeds", login.body.success === true);
  check("login returns a signed session", typeof login.body.signed_session === "string");

  const session = await api("GET", "/v1/session");
  check("session cookie authenticates", session.body.logged_in === true);
  check("session carries feature flags", Array.isArray(session.body.user?.maybe_feature_flags));

  const credits = await api("GET", "/v1/credits/namespace/artcraft");
  const startingCredits = credits.body.sum_total_credits;
  check("credits are readable", startingCredits > 0);

  const library = await api("GET", "/v1/media_files/list/user/localdev1");
  check("seeded library is not empty", library.body.results.length >= 6);
  check("library rows carry a media_class", library.body.results.every((row) => row.media_class !== "unknown"));

  const firstImage = library.body.results.find((row) => row.media_class === "image");
  const asset = await fetch(firstImage.media_links.cdn_url);
  check("cdn_url serves real bytes", asset.ok && Number(asset.headers.get("content-length")) > 1000);
  check("cdn_url serves the right content type", asset.headers.get("content-type") === "image/jpeg");

  const thumbnail = await fetch(firstImage.media_links.maybe_thumbnail_template.replace("{WIDTH}", "256"));
  check("thumbnail template resolves", thumbnail.ok);

  const models = await api("GET", "/v1/omni_gen/models/image");
  check("image catalogue is populated", models.body.models.length > 10);
  check("catalogue lists providers", models.body.providers.length > 0);

  const cost = await api("POST", "/v1/omni_gen/cost/image", { model: "flux_1_dev", prompt: "a cat" });
  check("cost estimate returns credits", cost.body.cost_in_credits > 0);

  const unknownModel = await api("POST", "/v1/omni_gen/cost/image", { model: "not_a_model" });
  check("unknown model is rejected", unknownModel.status === 400);

  await checkSuccessfulGeneration(startingCredits, cost.body.cost_in_credits);
  await checkFailureTrigger();
  await checkPaymentTrigger();
  await checkUpload();
  await checkFoldersAndTags();

  const unimplemented = await api("GET", "/v1/definitely/not/a/real/route");
  check("unknown routes 501 loudly", unimplemented.status === 501);
  check("unknown routes name the fake", String(unimplemented.body.message).includes("fake-storyteller-web"));
}

async function checkSuccessfulGeneration(startingCredits, cost) {
  const generate = await api("POST", "/v1/omni_gen/generate/image", {
    idempotency_token: randomUuid(),
    model: "flux_1_dev",
    prompt: "a lighthouse at dusk",
  });
  check("generation returns a job token", typeof generate.body.inference_job_token === "string");

  const jobToken = generate.body.inference_job_token;

  const pending = await api("GET", `/v1/jobs/job/${jobToken}`);
  check("job starts pending", ["pending", "started"].includes(pending.body.state.status.status));

  const finished = await pollJob(jobToken);
  check("job completes successfully", finished.status.status === "complete_success");
  check("job reports 100% progress", finished.status.progress_percentage === 100);
  check("job carries a result media file", typeof finished.maybe_result?.entity_token === "string");

  const resultAsset = await fetch(finished.maybe_result.media_links.cdn_url);
  check("generated media is downloadable", resultAsset.ok);

  const afterCredits = await api("GET", "/v1/credits/namespace/artcraft");
  check(
    `credits were spent (${startingCredits} -> ${afterCredits.body.sum_total_credits})`,
    afterCredits.body.sum_total_credits === startingCredits - cost,
  );

  const sessionJobs = await api("GET", "/v1/jobs/session");
  check("session job list includes the job", sessionJobs.body.jobs.some((job) => job.job_token === jobToken));
  check(
    "session jobs expose the wide failure field",
    sessionJobs.body.jobs.every((job) => "maybe_failure_category_updated" in job.status),
  );

  const batch = await api("GET", `/v1/jobs/batch?tokens=${jobToken}`);
  check("batch job lookup works", batch.body.job_states.length === 1);

  const emptyBatch = await api("GET", "/v1/jobs/batch");
  check("batch with no tokens returns an empty list", emptyBatch.body.job_states.length === 0);
}

async function checkFailureTrigger() {
  const generate = await api("POST", "/v1/omni_gen/generate/image", {
    idempotency_token: randomUuid(),
    model: "flux_1_dev",
    prompt: "portrait simulate_artcraft_failure face_not_detected",
  });

  const finished = await pollJob(generate.body.inference_job_token);
  check("failure trigger fails the job", finished.status.status === "complete_failure");

  const sessionJobs = await api("GET", "/v1/jobs/session");
  const failed = sessionJobs.body.jobs.find((job) => job.job_token === generate.body.inference_job_token);
  check(
    "failure category is reported",
    failed.status.maybe_failure_category_updated === "face_not_detected",
  );
}

async function checkPaymentTrigger() {
  const generate = await api("POST", "/v1/omni_gen/generate/image", {
    idempotency_token: randomUuid(),
    model: "flux_1_dev",
    prompt: "trigger_payment_failure",
  });
  check("payment trigger returns 402", generate.status === 402);
}

async function checkUpload() {
  const pngBytes = Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000100ffff03000006000557bfabd40000000049454e44ae426082",
    "hex",
  );

  const form = new FormData();
  form.append("uuid_idempotency_token", randomUuid());
  form.append("maybe_title", "smoke upload");
  form.append("file", new Blob([pngBytes], { type: "image/png" }), "smoke.png");

  const upload = await fetch(`${ORIGIN}/v1/media_files/upload/image`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: form,
  });
  const uploadBody = await upload.json();
  check("upload succeeds", uploadBody.success === true);
  check("upload returns a media token", typeof uploadBody.media_file_token === "string");

  const record = await api("GET", `/v1/media_files/file/${uploadBody.media_file_token}`);
  check("uploaded file is readable", record.body.media_file.maybe_title === "smoke upload");
  check("uploaded file is flagged as an upload", record.body.media_file.is_user_upload === true);

  const served = await fetch(record.body.media_file.media_links.cdn_url);
  const servedBytes = Buffer.from(await served.arrayBuffer());
  check("uploaded bytes round-trip exactly", servedBytes.equals(pngBytes));

  const listed = await api("GET", "/v1/media_files/list/user/localdev1");
  check(
    "uploaded file appears in the library",
    listed.body.results.some((row) => row.token === uploadBody.media_file_token),
  );
}

async function checkFoldersAndTags() {
  const folders = await api("GET", "/v1/folders/list_all");
  check("seeded folder is listed", folders.body.folders.length >= 1);
  check("folder carries thumbnails", folders.body.folders[0].last_media_thumbnails.length > 0);

  const created = await api("POST", "/v1/folders/create", { name: "Smoke folder" });
  check("folder creation works", created.body.folder.name === "Smoke folder");

  const library = await api("GET", "/v1/media_files/list/user/localdev1");
  const mediaToken = library.body.results[0].token;

  const added = await api("POST", `/v1/folders/media_files/${created.body.folder.token}/bulk_add`, {
    media_file_tokens: [mediaToken],
  });
  check("bulk add accepts the media file", added.body.accepted_media_file_tokens.length === 1);

  const contents = await api("GET", `/v1/folders/media_files/${created.body.folder.token}`);
  check("folder contents come back", contents.body.media_files.length === 1);

  const tags = await api("GET", "/v1/tags/list");
  check("seeded tags are listed", tags.body.tags.length >= 2);
  check("tags report a use count", tags.body.tags.every((tag) => tag.use_count > 0));

  const tagged = await api("POST", `/v1/tags/media_file/add/${mediaToken}`, {
    maybe_tags_list: ["smoke"],
  });
  check("tagging works", tagged.body.tags.some((tag) => tag.tag_value === "smoke"));
}

async function pollJob(jobToken) {
  const deadline = Date.now() + POLL_TIMEOUT_MILLIS;

  while (Date.now() < deadline) {
    const response = await api("GET", `/v1/jobs/job/${jobToken}`);
    const state = response.body.state;
    if (state.status.status === "complete_success" || state.status.status === "complete_failure") {
      return state;
    }
    await sleep(250);
  }

  throw new Error(`job ${jobToken} did not finish within ${POLL_TIMEOUT_MILLIS}ms`);
}

async function api(method, path, body) {
  const response = await fetch(`${ORIGIN}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(cookie === "" ? {} : { Cookie: cookie }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie !== null && setCookie.startsWith("session=") && !setCookie.includes("Max-Age=0")) {
    cookie = setCookie.split(";")[0];
  }

  const text = await response.text();
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }

  return { status: response.status, body: parsed };
}

function check(description, condition) {
  if (condition) {
    console.log(`  ok    ${description}`);
    return;
  }
  console.log(`  FAIL  ${description}`);
  failures += 1;
}

async function waitForServer() {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      await fetch(`${ORIGIN}/_status`);
      return;
    } catch {
      await sleep(100);
    }
  }

  throw new Error("fake-storyteller-web did not start in time");
}

function randomUuid() {
  return crypto.randomUUID();
}

function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}
