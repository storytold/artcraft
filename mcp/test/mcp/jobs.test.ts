import { describe, expect, it } from "vitest";

import {
  getJobsStatus,
  getJobStatus,
  listRecentJobs,
  summarizeJob,
} from "../../src/mcp/tools/jobs";
import { ToolFailure } from "../../src/mcp/tools/types";
import { principalFromProps } from "../../src/tokens/principal";
import { createUpstreamClient } from "../../src/upstream/client";
import { createFakeUpstream } from "../../fake-upstream/src/index";
import { SEEDED_USER } from "../../fake-upstream/src/state";

/** The tools run against the fake, signed in as the seeded user, recording the URLs sent. */
async function fakeContext() {
  const fake = createFakeUpstream();
  const login = await fake.request("/v1/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username_or_email: SEEDED_USER.username,
      password: SEEDED_USER.password,
    }),
  });
  const { signed_session } = await login.json<{ signed_session: string }>();
  const principal = principalFromProps({
    credential: { kind: "session", signedSession: signed_session },
    grantIssuedAt: 1_800_000_000_000,
    userToken: SEEDED_USER.userToken,
    username: SEEDED_USER.username,
    displayName: SEEDED_USER.displayName,
    scopes: ["read:jobs"],
  });
  const urls: string[] = [];
  const upstream = createUpstreamClient({
    baseUrl: "https://api.example.test",
    use: "read",
    credential: principal.credential,
    fetch: (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      urls.push(url.pathname + url.search);
      return Promise.resolve(
        fake.fetch(new Request(`http://fake${url.pathname}${url.search}`, request)),
      );
    },
  });
  return { urls, context: { principal, upstream } };
}

describe("summarizeJob", () => {
  it("prefers the newer failure category and reports a failure even without one", () => {
    const base = {
      job_token: "jinf_x",
      request: { inference_category: "image_generation" },
      status: { status: "complete_failure" as const, progress_percentage: 0 },
      created_at: "t",
      updated_at: "t",
    };
    expect(summarizeJob(base).failure).toEqual({ category: null, message: null });
    expect(
      summarizeJob({
        ...base,
        status: {
          ...base.status,
          maybe_failure_category: "retryable_worker_error",
          maybe_failure_category_updated: "generation_failed",
          maybe_failure_message: "boom",
        },
      }).failure,
    ).toEqual({ category: "generation_failed", message: "boom" });
  });

  it("keeps a failure category this build does not know, from the API's catch-all", () => {
    const job = summarizeJob({
      job_token: "jinf_x",
      request: { inference_category: "image_generation" },
      status: {
        status: "complete_failure",
        progress_percentage: 0,
        maybe_failure_category_updated: { unknown: "brand_new_reason" },
      },
      created_at: "t",
      updated_at: "t",
    });
    expect(job.failure).toEqual({ category: "brand_new_reason", message: null });
  });

  it("marks terminal states finished and running ones not", () => {
    const of = (status: Parameters<typeof summarizeJob>[0]["status"]["status"]) =>
      summarizeJob({
        job_token: "jinf_x",
        request: { inference_category: "x" },
        status: { status, progress_percentage: 0 },
        created_at: "t",
        updated_at: "t",
      }).is_finished;
    expect(of("pending")).toBe(false);
    expect(of("started")).toBe(false);
    expect(of("attempt_failed")).toBe(false);
    expect(of("complete_success")).toBe(true);
    expect(of("dead")).toBe(true);
    expect(of("cancelled_by_user")).toBe(true);
  });
});

describe("get_job_status", () => {
  it("returns a finished job with its output URL", async () => {
    const { urls, context } = await fakeContext();
    const result = await getJobStatus.handler(context, { job_token: "jinf_fake_done_image" });
    expect(urls).toEqual(["/v1/jobs/job/jinf_fake_done_image"]);
    expect(result.structured).toMatchObject({
      job_token: "jinf_fake_done_image",
      category: "image_generation",
      status: "complete_success",
      is_finished: true,
      model: { type: "seedream_4", title: "Seedream 4" },
      prompt: "a corgi running through a field",
      failure: null,
      result: { cdn_url: "https://cdn.fake.test/media/m_fake_corgi.png" },
    });
    expect(result.text).toBe(
      "jinf_fake_done_image: image_generation with Seedream 4, complete success — https://cdn.fake.test/media/m_fake_corgi.png",
    );
  });

  it("describes a running job with its progress", async () => {
    const { context } = await fakeContext();
    const result = await getJobStatus.handler(context, { job_token: "jinf_fake_running_video" });
    expect(result.structured.is_finished).toBe(false);
    expect(result.text).toBe(
      "jinf_fake_running_video: video_generation with Seedance 2.0, started (40%)",
    );
  });

  it("surfaces a 404 as a tool failure", async () => {
    const { context } = await fakeContext();
    await expect(getJobStatus.handler(context, { job_token: "jinf_nope" })).rejects.toThrow(
      ToolFailure,
    );
  });
});

describe("get_jobs_status", () => {
  it("fetches several jobs in one call, deduplicating tokens, and omits unknown ones", async () => {
    const { urls, context } = await fakeContext();
    const result = await getJobsStatus.handler(context, {
      job_tokens: [
        "jinf_fake_done_image",
        "jinf_fake_done_image",
        "jinf_nope",
        "jinf_fake_failed_image",
      ],
    });
    expect(urls[0]).toBe(
      "/v1/jobs/batch?tokens=jinf_fake_done_image&tokens=jinf_nope&tokens=jinf_fake_failed_image",
    );
    expect(result.structured.jobs.map((j) => j.job_token).sort()).toEqual([
      "jinf_fake_done_image",
      "jinf_fake_failed_image",
    ]);
    expect(result.text.split("\n")).toHaveLength(2);
  });
});

describe("list_recent_jobs", () => {
  it("lists the user's jobs newest first with the richer failure detail", async () => {
    const { urls, context } = await fakeContext();
    const result = await listRecentJobs.handler(context, {});
    expect(urls).toEqual(["/v1/jobs/session"]);
    expect(result.structured.jobs.map((j) => j.job_token)).toEqual([
      "jinf_fake_running_video",
      "jinf_fake_done_image",
      "jinf_fake_failed_image",
    ]);
    const failed = result.structured.jobs[2];
    expect(failed?.failure).toEqual({
      category: "rule_bans_user_text_prompt",
      message: "The prompt was rejected by the content rules.",
    });
    expect(result.text).toContain(
      "complete failure — The prompt was rejected by the content rules.",
    );
  });

  it("passes state filters as comma-joined queries", async () => {
    const { urls, context } = await fakeContext();
    const result = await listRecentJobs.handler(context, {
      include_states: ["started", "pending"],
      exclude_states: ["dead"],
    });
    expect(urls[0]).toBe("/v1/jobs/session?include_states=started%2Cpending&exclude_states=dead");
    expect(result.structured.jobs.map((j) => j.job_token)).toEqual(["jinf_fake_running_video"]);
  });

  it("is declared read-only and scoped to read:jobs, as are its siblings", () => {
    for (const tool of [getJobStatus, getJobsStatus, listRecentJobs]) {
      expect(tool.requiredScope).toBe("read:jobs");
      expect(tool.annotations.readOnlyHint).toBe(true);
    }
  });
});
