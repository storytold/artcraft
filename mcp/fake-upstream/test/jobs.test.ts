import { describe, expect, it } from "vitest";

import { expectValid } from "../../test/helpers/contract";
import { createFakeUpstream } from "../src/index";
import { SEEDED_USER } from "../src/state";

async function signedIn() {
  const app = createFakeUpstream();
  const login = await app.request("/v1/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username_or_email: SEEDED_USER.username,
      password: SEEDED_USER.password,
    }),
  });
  const { signed_session } = await login.json<{ signed_session: string }>();
  return { app, headers: { session: signed_session } };
}

describe("single job", () => {
  it("returns a spec-shaped status with a result for a finished job", async () => {
    const response = await createFakeUpstream().request("/v1/jobs/job/jinf_fake_done_image");
    expect(response.status).toBe(200);
    const body = await response.json<{
      state: { status: { status: string }; maybe_result: { media_links: { cdn_url: string } } };
    }>();
    expectValid("GetInferenceJobStatusSuccessResponse", body);
    expect(body.state.status.status).toBe("complete_success");
    expect(body.state.maybe_result.media_links.cdn_url).toMatch(/^https:\/\//);
  });

  it("404s an unknown token with the common envelope", async () => {
    const response = await createFakeUpstream().request("/v1/jobs/job/jinf_nope");
    expect(response.status).toBe(404);
    expectValid("CommonWebError", await response.json());
  });
});

describe("batch", () => {
  it("returns the known jobs among the requested tokens, in the spec shape", async () => {
    const response = await createFakeUpstream().request(
      "/v1/jobs/batch?tokens=jinf_fake_done_image&tokens=jinf_nope&tokens=jinf_fake_running_video",
    );
    const body = await response.json<{ job_states: { job_token: string }[] }>();
    expectValid("BatchGetInferenceJobStatusSuccessResponse", body);
    expect(body.job_states.map((j) => j.job_token).sort()).toEqual([
      "jinf_fake_done_image",
      "jinf_fake_running_video",
    ]);
  });
});

describe("session listing", () => {
  it("is session-only", async () => {
    expect((await createFakeUpstream().request("/v1/jobs/session")).status).toBe(401);
  });

  it("lists the user's jobs newest first, with the richer status variant", async () => {
    const { app, headers } = await signedIn();
    const response = await app.request("/v1/jobs/session", { headers });
    const body = await response.json<{
      jobs: { job_token: string; status: Record<string, unknown> }[];
    }>();
    expectValid("ListSessionJobsSuccessResponse", body);
    expect(body.jobs.map((j) => j.job_token)).toEqual([
      "jinf_fake_running_video",
      "jinf_fake_done_image",
      "jinf_fake_failed_image",
    ]);
    const failed = body.jobs.find((j) => j.job_token === "jinf_fake_failed_image");
    expect(failed?.status.maybe_failure_category_updated).toBe("rule_bans_user_text_prompt");
    expect(failed?.status.maybe_failure_message).toMatch(/content rules/);
  });

  it("filters by include and exclude states", async () => {
    const { app, headers } = await signedIn();
    const included = await (
      await app.request("/v1/jobs/session?include_states=started,pending", { headers })
    ).json<{ jobs: { job_token: string }[] }>();
    expect(included.jobs.map((j) => j.job_token)).toEqual(["jinf_fake_running_video"]);
    const excluded = await (
      await app.request("/v1/jobs/session?exclude_states=complete_failure", { headers })
    ).json<{ jobs: { job_token: string }[] }>();
    expect(excluded.jobs.map((j) => j.job_token)).not.toContain("jinf_fake_failed_image");
  });
});
