import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks are hoisted so they exist before ./utilities is imported.
const m = vi.hoisted(() => ({
  listRecentJobs: vi.fn(),
  addToast: vi.fn(),
  setJobs: vi.fn(),
  disabled: vi.fn(),
}));

vi.mock("~/enums", () => ({ ToastTypes: { ERROR: "error" } }));
vi.mock("~/signals", () => ({ addToast: m.addToast, setJobs: m.setJobs }));
vi.mock("~/Classes/ApiManager/JobsApi", () => ({
  JobsApi: class {
    ListRecentJobs = m.listRecentJobs;
  },
}));
vi.mock("~/flags/DevConsoleFlags", () => ({ IsJobPollingDisabled: m.disabled }));

import { PollRecentJobs } from "./utilities";

beforeEach(() => {
  vi.clearAllMocks();
  m.disabled.mockReturnValue(false);
});

describe("PollRecentJobs", () => {
  it("does nothing at all when polling is disabled by the dev flag", async () => {
    m.disabled.mockReturnValue(true);
    await PollRecentJobs();
    expect(m.listRecentJobs).not.toHaveBeenCalled();
    expect(m.setJobs).not.toHaveBeenCalled();
  });

  it("stores the jobs on success", async () => {
    const jobs = [{ id: 1 }];
    m.listRecentJobs.mockResolvedValue({ success: true, data: jobs });
    await PollRecentJobs();
    expect(m.setJobs).toHaveBeenCalledWith(jobs);
    expect(m.addToast).not.toHaveBeenCalled();
  });

  it("shows the API's error message on failure", async () => {
    m.listRecentJobs.mockResolvedValue({ success: false, errorMessage: "boom" });
    await PollRecentJobs();
    expect(m.addToast).toHaveBeenCalledWith("error", "boom");
    expect(m.setJobs).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when none is given", async () => {
    m.listRecentJobs.mockResolvedValue({ success: false });
    await PollRecentJobs();
    expect(m.addToast).toHaveBeenCalledWith("error", "Unknown Error: List Recent Jobs");
  });
});
