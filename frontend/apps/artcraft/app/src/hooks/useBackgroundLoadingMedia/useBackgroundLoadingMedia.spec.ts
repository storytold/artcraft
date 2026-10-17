import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

// Orchestration only: the pollers are faked, so these tests check WHEN the hook
// asks for a refresh and when it toasts. (The pollers themselves, and how they
// interact with the effects, are covered by the .integration spec and utilities.spec.)
const m = vi.hoisted(() => ({
  pollMovies: vi.fn(),
  pollAudio: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock("./utilities", () => ({
  PollUserGeneratedMovies: m.pollMovies,
  PollUserAudioItems: m.pollAudio,
}));
vi.mock("~/enums", () => ({ ToastTypes: { SUCCESS: "success", ERROR: "error" } }));
vi.mock("~/signals", async () => {
  const { signal } = await import("@preact/signals-core");
  return {
    addToast: m.addToast,
    authentication: { userInfo: signal<unknown>({ username: "u" }) },
    userMovies: signal<unknown[] | undefined>(undefined),
    userAudioItems: signal<unknown[] | undefined>(undefined),
    completedWorkflowJobs: signal<unknown[] | undefined>(undefined),
    completedAudioJobs: signal<unknown[] | undefined>(undefined),
  };
});

import * as signals from "~/signals";
import { useBackgroundLoadingMedia } from "./useBackgroundLoadingMedia";

type Sig<T> = { value: T };
const s = signals as unknown as {
  authentication: { userInfo: Sig<unknown> };
  userMovies: Sig<unknown[] | undefined>;
  userAudioItems: Sig<unknown[] | undefined>;
  completedWorkflowJobs: Sig<unknown[] | undefined>;
  completedAudioJobs: Sig<unknown[] | undefined>;
};

const job = (token: string) => ({ job_token: token });

// Mounts the hook with both media lists already loaded, so only the
// "jobs completed" branches are in play.
const mountLoaded = () => {
  s.userMovies.value = [];
  s.userAudioItems.value = [];
  const rendered = renderHook(() => useBackgroundLoadingMedia());
  m.pollMovies.mockClear();
  m.pollAudio.mockClear();
  return rendered;
};

const set = async (signal: Sig<unknown[] | undefined>, value: unknown[] | undefined) => {
  await act(async () => {
    signal.value = value;
  });
};

beforeEach(() => {
  m.pollMovies.mockReset().mockResolvedValue(true);
  m.pollAudio.mockReset().mockResolvedValue(true);
  m.addToast.mockReset();
  s.authentication.userInfo.value = { username: "u" };
  s.userMovies.value = undefined;
  s.userAudioItems.value = undefined;
  s.completedWorkflowJobs.value = undefined;
  s.completedAudioJobs.value = undefined;
});

afterEach(() => {
  // Module-level signals outlive a test, so unmount every hook or it keeps reacting.
  cleanup();
});

describe("useBackgroundLoadingMedia first load", () => {
  it("polls movies and audio once when neither list has loaded", () => {
    renderHook(() => useBackgroundLoadingMedia());
    expect(m.pollMovies).toHaveBeenCalledTimes(1);
    expect(m.pollAudio).toHaveBeenCalledTimes(1);
  });

  it("does not poll again once the lists exist and no jobs have completed", async () => {
    renderHook(() => useBackgroundLoadingMedia());
    m.pollMovies.mockClear();
    m.pollAudio.mockClear();
    await set(s.userMovies, []);
    await set(s.userAudioItems, []);
    expect(m.pollMovies).not.toHaveBeenCalled();
    expect(m.pollAudio).not.toHaveBeenCalled();
  });

  it("treats the first completed-jobs list seen as a baseline, not as news", async () => {
    mountLoaded();
    await set(s.completedWorkflowJobs, [job("old")]);
    await set(s.completedAudioJobs, [job("old-audio")]);
    expect(m.pollMovies).not.toHaveBeenCalled();
    expect(m.pollAudio).not.toHaveBeenCalled();
    expect(m.addToast).not.toHaveBeenCalled();
  });

  it("does not poll twice when the jobs arrive before the lists finish loading", async () => {
    renderHook(() => useBackgroundLoadingMedia());
    s.completedWorkflowJobs.value = [job("old")];
    m.pollMovies.mockClear();
    await set(s.userMovies, []);
    // The list that was already there when movies loaded is the baseline.
    expect(m.pollMovies).not.toHaveBeenCalled();
  });
});

describe("useBackgroundLoadingMedia movie completion", () => {
  it("refreshes movies and shows a sticky success toast when a new workflow job completes", async () => {
    mountLoaded();
    await set(s.completedWorkflowJobs, [job("a")]);
    await set(s.completedWorkflowJobs, [job("a"), job("b")]);

    expect(m.pollMovies).toHaveBeenCalledTimes(1);
    expect(m.addToast).toHaveBeenCalledTimes(1);
    expect(m.addToast).toHaveBeenCalledWith(
      "success",
      "New movie is completed! Please check My Movies",
      false,
    );
  });

  it("refreshes but stays silent when the poll reports failure", async () => {
    mountLoaded();
    m.pollMovies.mockResolvedValue(false);
    await set(s.completedWorkflowJobs, [job("a")]);
    await set(s.completedWorkflowJobs, [job("a"), job("b")]);

    expect(m.pollMovies).toHaveBeenCalledTimes(1);
    expect(m.addToast).not.toHaveBeenCalled();
  });

  it("ignores a deep-equal copy of the list it already handled", async () => {
    mountLoaded();
    await set(s.completedWorkflowJobs, [job("a")]);
    await set(s.completedWorkflowJobs, [job("a"), job("b")]);
    await set(s.completedWorkflowJobs, [job("a"), job("b")]);
    expect(m.pollMovies).toHaveBeenCalledTimes(1);
  });

  it("ignores an empty list, and does not forget what it last handled", async () => {
    mountLoaded();
    await set(s.completedWorkflowJobs, [job("a")]);
    await set(s.completedWorkflowJobs, []);
    expect(m.pollMovies).not.toHaveBeenCalled();

    // Going back to the very list that was the baseline is still "nothing new".
    await set(s.completedWorkflowJobs, [job("a")]);
    expect(m.pollMovies).not.toHaveBeenCalled();
  });

  it("does not touch audio when a workflow job completes", async () => {
    mountLoaded();
    await set(s.completedWorkflowJobs, [job("a")]);
    await set(s.completedWorkflowJobs, [job("a"), job("b")]);
    expect(m.pollAudio).not.toHaveBeenCalled();
  });
});

describe("useBackgroundLoadingMedia audio completion", () => {
  it("refreshes audio and toasts when a new audio job completes", async () => {
    mountLoaded();
    await set(s.completedAudioJobs, [job("a")]);
    await set(s.completedAudioJobs, [job("a"), job("b")]);

    expect(m.pollAudio).toHaveBeenCalledTimes(1);
    expect(m.addToast).toHaveBeenCalledWith(
      "success",
      "New audio is generated! Please check your audio library",
    );
  });

  it("refreshes but stays silent when the poll reports failure", async () => {
    mountLoaded();
    m.pollAudio.mockResolvedValue(false);
    await set(s.completedAudioJobs, [job("a")]);
    await set(s.completedAudioJobs, [job("b")]);

    expect(m.pollAudio).toHaveBeenCalledTimes(1);
    expect(m.addToast).not.toHaveBeenCalled();
  });

  it("ignores an unchanged or empty audio list", async () => {
    mountLoaded();
    await set(s.completedAudioJobs, [job("a")]);
    await set(s.completedAudioJobs, [job("a")]);
    await set(s.completedAudioJobs, []);
    expect(m.pollAudio).not.toHaveBeenCalled();
  });

  it("does not touch movies when an audio job completes", async () => {
    mountLoaded();
    await set(s.completedAudioJobs, [job("a")]);
    await set(s.completedAudioJobs, [job("b")]);
    expect(m.pollMovies).not.toHaveBeenCalled();
  });
});

describe("useBackgroundLoadingMedia lifecycle", () => {
  it("stops reacting to job changes after unmount", async () => {
    const { unmount } = mountLoaded();
    await set(s.completedWorkflowJobs, [job("a")]);
    unmount();
    await set(s.completedWorkflowJobs, [job("a"), job("b")]);
    await set(s.completedAudioJobs, [job("x")]);
    await set(s.completedAudioJobs, [job("y")]);
    expect(m.pollMovies).not.toHaveBeenCalled();
    expect(m.pollAudio).not.toHaveBeenCalled();
  });

  it("keeps its baseline across a re-render", async () => {
    const { rerender } = mountLoaded();
    await set(s.completedWorkflowJobs, [job("a")]);
    rerender();
    await set(s.completedWorkflowJobs, [job("a")]);
    expect(m.pollMovies).not.toHaveBeenCalled();
  });
});
