import { z } from "zod";

import { READ_ONLY_ANNOTATIONS, type ToolDefinition, unwrapUpstream } from "./types";

/**
 * Job status tools. The three upstream endpoints return three slightly different payloads
 * (the session listing alone carries the newer failure category and message); all are
 * normalised to one `JobSummary` so a client sees the same shape wherever a job came from.
 */

export const JOB_STATUSES = [
  "pending",
  "started",
  "complete_success",
  "complete_failure",
  "attempt_failed",
  "dead",
  "cancelled_by_user",
  "cancelled_by_system",
] as const;

const FINISHED = new Set([
  "complete_success",
  "complete_failure",
  "dead",
  "cancelled_by_user",
  "cancelled_by_system",
]);

const JOB_TOKEN = z
  .string()
  .regex(/^jinf_[A-Za-z0-9_]+$/, "an inference job token starts with jinf_");

const jobSummarySchema = z.object({
  job_token: z.string(),
  category: z.string().describe("What was generated, e.g. image_generation, video_generation."),
  status: z.enum(JOB_STATUSES),
  is_finished: z.boolean().describe("True for every terminal state, success or not."),
  progress_percentage: z.number().int().min(0).max(100),
  model: z.object({ type: z.string().nullable(), title: z.string().nullable() }),
  prompt: z.string().nullable().describe("The text prompt, when the job had one."),
  failure: z
    .object({ category: z.string().nullable(), message: z.string().nullable() })
    .nullable()
    .describe("Why the job failed, when it did; null otherwise."),
  result: z
    .object({
      entity_type: z.string(),
      entity_token: z.string(),
      cdn_url: z.string().describe("Where to view or download the output."),
      thumbnail_template: z.string().nullable(),
      completed_at: z.string().nullable(),
    })
    .nullable()
    .describe("The output, once there is one."),
  created_at: z.string(),
  updated_at: z.string(),
});

export type JobSummary = z.infer<typeof jobSummarySchema>;

/** The fields common to all three upstream payloads, plus the session-only extras. */
interface RawJob {
  job_token: string;
  request: {
    inference_category: string;
    maybe_model_type?: string | null;
    maybe_model_title?: string | null;
    maybe_raw_inference_text?: string | null;
  };
  status: {
    status: (typeof JOB_STATUSES)[number];
    progress_percentage: number;
    maybe_failure_category?: string | null;
    /** Newer clients get the full enum; values this build predates arrive as `{ unknown }`. */
    maybe_failure_category_updated?: string | { unknown: string } | null;
    maybe_failure_message?: string | null;
  };
  maybe_result?: {
    entity_type: string;
    entity_token: string;
    media_links: { cdn_url: string; maybe_thumbnail_template?: string | null };
    maybe_successfully_completed_at?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export function summarizeJob(raw: RawJob): JobSummary {
  const failureCategory =
    failureCategoryString(raw.status.maybe_failure_category_updated) ??
    raw.status.maybe_failure_category ??
    null;
  const failureMessage = raw.status.maybe_failure_message ?? null;
  const failed =
    failureCategory !== null || failureMessage !== null || raw.status.status === "complete_failure";
  return {
    job_token: raw.job_token,
    category: raw.request.inference_category,
    status: raw.status.status,
    is_finished: FINISHED.has(raw.status.status),
    progress_percentage: raw.status.progress_percentage,
    model: {
      type: raw.request.maybe_model_type ?? null,
      title: raw.request.maybe_model_title ?? null,
    },
    prompt: raw.request.maybe_raw_inference_text ?? null,
    failure: failed ? { category: failureCategory, message: failureMessage } : null,
    result: raw.maybe_result
      ? {
          entity_type: raw.maybe_result.entity_type,
          entity_token: raw.maybe_result.entity_token,
          cdn_url: raw.maybe_result.media_links.cdn_url,
          thumbnail_template: raw.maybe_result.media_links.maybe_thumbnail_template ?? null,
          completed_at: raw.maybe_result.maybe_successfully_completed_at ?? null,
        }
      : null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

/** The API's forward-compatible enum: a known literal, or `{ unknown }` holding the raw value. */
function failureCategoryString(
  value: string | { unknown: string } | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : value.unknown;
}

export function describeJob(job: JobSummary): string {
  const what = job.model.title ? `${job.category} with ${job.model.title}` : job.category;
  const head = `${job.job_token}: ${what}, ${job.status.replace(/_/g, " ")}`;
  if (job.status === "complete_success" && job.result) return `${head} — ${job.result.cdn_url}`;
  if (job.failure) {
    const why = job.failure.message ?? job.failure.category ?? "no reason given";
    return `${head} — ${why}`;
  }
  if (!job.is_finished) return `${head} (${String(job.progress_percentage)}%)`;
  return head;
}

const singleOutput = jobSummarySchema.shape;

export const getJobStatus: ToolDefinition<{ job_token: typeof JOB_TOKEN }, typeof singleOutput> = {
  name: "get_job_status",
  title: "Get job status",
  description:
    "Returns the status of one Artcraft generation job by its token (jinf_…): state, progress, " +
    "the model and prompt used, the failure reason if it failed, and the output's CDN URL once " +
    "it succeeded. Use it to answer 'is my generation done?' for a specific job.",
  requiredScope: "read:jobs",
  inputSchema: { job_token: JOB_TOKEN.describe("The job token, e.g. jinf_abc123.") },
  outputSchema: singleOutput,
  annotations: { ...READ_ONLY_ANNOTATIONS, title: "Get job status" },

  async handler({ upstream }, { job_token }) {
    const response = unwrapUpstream(
      await upstream.GET("/v1/jobs/job/{token}", { params: { path: { token: job_token } } }),
    );
    const job = summarizeJob(response.state);
    return { structured: job, text: describeJob(job) };
  },
};

const listOutput = { jobs: z.array(jobSummarySchema) };

export const getJobsStatus: ToolDefinition<
  { job_tokens: z.ZodArray<typeof JOB_TOKEN> },
  typeof listOutput
> = {
  name: "get_jobs_status",
  title: "Get status of several jobs",
  description:
    "Returns the status of up to 50 generation jobs at once, by token. Jobs that do not exist " +
    "are simply absent from the result. Prefer this over repeated get_job_status calls when " +
    "checking on several generations.",
  requiredScope: "read:jobs",
  inputSchema: { job_tokens: z.array(JOB_TOKEN).min(1).max(50).describe("Job tokens (jinf_…).") },
  outputSchema: listOutput,
  annotations: { ...READ_ONLY_ANNOTATIONS, title: "Get status of several jobs" },

  async handler({ upstream }, { job_tokens }) {
    const response = unwrapUpstream(
      await upstream.GET("/v1/jobs/batch", {
        params: { query: { tokens: [...new Set(job_tokens)] } },
      }),
    );
    const jobs = response.job_states.map(summarizeJob);
    const text =
      jobs.length === 0 ? "None of those jobs were found." : jobs.map(describeJob).join("\n");
    return { structured: { jobs }, text };
  },
};

const recentInput = {
  include_states: z
    .array(z.enum(JOB_STATUSES))
    .optional()
    .describe("Only these states. Omit for all."),
  exclude_states: z
    .array(z.enum(JOB_STATUSES))
    .optional()
    .describe("Everything except these states."),
};

export const listRecentJobs: ToolDefinition<typeof recentInput, typeof listOutput> = {
  name: "list_recent_jobs",
  title: "List recent jobs",
  description:
    "Lists the signed-in user's recent generation jobs, newest first, with status, progress, " +
    "model, prompt, failure reason, and output URL where available. Filter by state with " +
    'include_states / exclude_states (e.g. include_states: ["started", "pending"] for ' +
    "what is still running). Use it for 'what did I generate today?' or 'is anything still running?'.",
  requiredScope: "read:jobs",
  inputSchema: recentInput,
  outputSchema: listOutput,
  annotations: { ...READ_ONLY_ANNOTATIONS, title: "List recent jobs" },

  async handler({ upstream }, { include_states, exclude_states }) {
    const query = {
      ...(include_states?.length ? { include_states: include_states.join(",") } : {}),
      ...(exclude_states?.length ? { exclude_states: exclude_states.join(",") } : {}),
    };
    const response = unwrapUpstream(await upstream.GET("/v1/jobs/session", { params: { query } }));
    const jobs = response.jobs.map(summarizeJob);
    const text = jobs.length === 0 ? "No recent jobs." : jobs.map(describeJob).join("\n");
    return { structured: { jobs }, text };
  },
};
