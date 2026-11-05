import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ poll: vi.fn() }));

vi.mock("~/enums", () => ({
  JobStatus: {
    PENDING: "pending",
    STARTED: "started",
    ATTEMPT_FAILED: "attempt_failed",
    COMPLETE_SUCCESS: "complete_success",
    COMPLETE_FAILURE: "complete_failure",
  },
  JobType: {
    VideoStyleTransfer: "vst",
    ImageGeneration: "img",
    TextToSpeech: "tts",
    VoiceConversion: "vc",
  },
}));
vi.mock("~/hooks/useActiveJobs/utilities", () => ({ PollRecentJobs: m.poll }));
vi.mock("~/models", () => ({}));
vi.mock("~/utilities", () => ({
  isJobStatusTerminal: (s: string) => !["pending", "started", "attempt_failed"].includes(s),
}));

import {
  activeAudioJobs,
  activeImageGenerationJobs,
  activeJobs,
  activeWorkflowJobs,
  completedAudioJobs,
  completedJobs,
  completedWorkflowJobs,
  recentJobs,
  setJobs,
  shouldPollActiveJobs,
  startPollingActiveJobs,
  stopPollingActiveJobs,
} from "./activeJobs";

const job = (status: string, category: string) =>
  ({ status: { status }, request: { inference_category: category } }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  recentJobs.value = undefined;
  shouldPollActiveJobs.value = false;
});

describe("derived job lists", () => {
  it("are undefined until jobs have been loaded", () => {
    expect(activeJobs.value).toBeUndefined();
    expect(completedJobs.value).toBeUndefined();
    expect(activeWorkflowJobs.value).toBeUndefined();
  });

  it("split jobs into active and completed", () => {
    setJobs([
      job("pending", "vst"),
      job("started", "img"),
      job("attempt_failed", "tts"),
      job("complete_success", "vc"),
      job("complete_failure", "vst"),
    ]);
    expect(activeJobs.value).toHaveLength(3);
    expect(completedJobs.value).toHaveLength(1);
  });

  it("filter active jobs by category", () => {
    setJobs([job("pending", "vst"), job("started", "img"), job("pending", "tts"), job("pending", "vc")]);
    expect(activeWorkflowJobs.value).toHaveLength(1);
    expect(activeImageGenerationJobs.value).toHaveLength(1);
    expect(activeAudioJobs.value).toHaveLength(2);
  });

  it("filter completed jobs by category", () => {
    setJobs([job("complete_success", "vst"), job("complete_success", "tts"), job("complete_success", "img")]);
    expect(completedWorkflowJobs.value).toHaveLength(1);
    expect(completedAudioJobs.value).toHaveLength(1);
  });
});

describe("setJobs", () => {
  it("keeps the same list object when an identical list is set again", () => {
    setJobs([job("pending", "vst")]);
    const first = recentJobs.value;
    setJobs([job("pending", "vst")]);
    expect(recentJobs.value).toBe(first);
  });

  it("replaces the list when something changed", () => {
    setJobs([job("pending", "vst")]);
    const first = recentJobs.value;
    setJobs([job("complete_success", "vst")]);
    expect(recentJobs.value).not.toBe(first);
  });
});

describe("polling switch", () => {
  it("polls once immediately and turns polling on", () => {
    startPollingActiveJobs();
    expect(m.poll).toHaveBeenCalledTimes(1);
    expect(shouldPollActiveJobs.value).toBe(true);
  });

  it("turns polling off", () => {
    shouldPollActiveJobs.value = true;
    stopPollingActiveJobs();
    expect(shouldPollActiveJobs.value).toBe(false);
  });
});
