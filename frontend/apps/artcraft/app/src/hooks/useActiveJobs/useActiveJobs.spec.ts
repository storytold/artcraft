import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({ poll: vi.fn() }));

vi.mock("./utilities", () => ({ PollRecentJobs: m.poll }));
vi.mock("~/enums", () => ({
  JobType: { TextToSpeech: "tts", VoiceConversion: "vc" },
}));
vi.mock("~/constants", () => ({ TWO_SECONDS: 2000, TEN_SECONDS: 10000 }));
vi.mock("~/signals", async () => {
  const { signal } = await import("@preact/signals-react");
  const activeJobs = signal<unknown[] | undefined>(undefined);
  const shouldPollActiveJobs = signal(false);
  return {
    activeJobs,
    shouldPollActiveJobs,
    startPollingActiveJobs: vi.fn(() => {
      shouldPollActiveJobs.value = true;
    }),
    stopPollingActiveJobs: vi.fn(() => {
      shouldPollActiveJobs.value = false;
    }),
  };
});

import * as signals from "~/signals";
import { useActiveJobs } from "./useActiveJobs";

const s = signals as unknown as {
  activeJobs: { value: unknown[] | undefined };
  shouldPollActiveJobs: { value: boolean };
};

const job = (category: string) => ({ request: { inference_category: category } });

beforeEach(() => {
  vi.useFakeTimers();
  m.poll.mockReset();
  s.activeJobs.value = undefined;
  s.shouldPollActiveJobs.value = false;
});

afterEach(() => {
  // Unmount every hook from the test: the signals are shared module state, so
  // a hook left mounted would keep reacting (and polling) in later tests.
  cleanup();
  vi.useRealTimers();
});

describe("useActiveJobs", () => {
  it("does a first pull when no jobs list exists yet", () => {
    renderHook(() => useActiveJobs());
    expect(m.poll).toHaveBeenCalledTimes(1);
  });

  it("polls on a 10s timer for long jobs and stops once no jobs are active", () => {
    renderHook(() => useActiveJobs());
    m.poll.mockClear();
    act(() => {
      s.activeJobs.value = [job("image")];
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(m.poll).toHaveBeenCalledTimes(1);

    // An empty job list is what ends polling (stopPollingActiveJobs).
    act(() => {
      s.activeJobs.value = [];
    });
    m.poll.mockClear();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(m.poll).not.toHaveBeenCalled();
  });

  it("starts exactly one timer (never a second, untracked one)", () => {
    renderHook(() => useActiveJobs());
    m.poll.mockClear();
    act(() => {
      s.activeJobs.value = [job("image")];
    });
    act(() => {
      s.activeJobs.value = [job("image"), job("image")];
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(m.poll).toHaveBeenCalledTimes(1);
  });

  it("switches to a 2s timer when a short (text-to-speech) job appears", () => {
    renderHook(() => useActiveJobs());
    m.poll.mockClear();
    act(() => {
      s.activeJobs.value = [job("image")];
    });
    act(() => {
      s.activeJobs.value = [job("image"), job("tts")];
    });
    m.poll.mockClear();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(m.poll).toHaveBeenCalledTimes(5);
  });

  it("clears the timer on unmount", () => {
    const { unmount } = renderHook(() => useActiveJobs());
    act(() => {
      s.activeJobs.value = [job("image")];
    });
    unmount();
    m.poll.mockClear();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(m.poll).not.toHaveBeenCalled();
  });
});
