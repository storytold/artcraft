import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/enums", () => ({ ToastTypes: { SUCCESS: "success", ERROR: "error" } }));

import { addToast, deleteToast, toasts } from "./toasts";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  toasts.value = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("addToast", () => {
  it("appends a toast with an id and timestamp", () => {
    addToast("error" as never, "bad");
    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]).toMatchObject({ type: "error", message: "bad" });
    expect(toasts.value[0].id).toBeTruthy();
  });

  it("drops an identical toast raised within 2 seconds", () => {
    addToast("error" as never, "bad");
    vi.advanceTimersByTime(500);
    addToast("error" as never, "bad");
    expect(toasts.value).toHaveLength(1);
  });

  it("allows an identical toast once the 2 second window has passed", () => {
    addToast("error" as never, "bad", false);
    vi.advanceTimersByTime(2500);
    addToast("error" as never, "bad", false);
    expect(toasts.value).toHaveLength(2);
  });

  it("allows a different message or type inside the window", () => {
    addToast("error" as never, "bad");
    addToast("error" as never, "worse");
    addToast("success" as never, "bad");
    expect(toasts.value).toHaveLength(3);
  });

  it("removes error toasts after 5 seconds and success toasts after 10", () => {
    addToast("error" as never, "e");
    addToast("success" as never, "s");
    vi.advanceTimersByTime(5000);
    expect(toasts.value.map((t) => t.message)).toEqual(["s"]);
    vi.advanceTimersByTime(5000);
    expect(toasts.value).toHaveLength(0);
  });

  it("honours a custom timeout", () => {
    addToast("error" as never, "e", 1000);
    vi.advanceTimersByTime(1000);
    expect(toasts.value).toHaveLength(0);
  });

  it("keeps the toast until dismissed when timeout is false", () => {
    addToast("error" as never, "sticky", false);
    vi.advanceTimersByTime(60_000);
    expect(toasts.value).toHaveLength(1);
  });
});

describe("deleteToast", () => {
  it("removes only the toast with that id", () => {
    addToast("error" as never, "a", false);
    addToast("error" as never, "b", false);
    deleteToast(toasts.value[0].id);
    expect(toasts.value.map((t) => t.message)).toEqual(["b"]);
  });

  it("leaves the same array in place when the id is unknown", () => {
    addToast("error" as never, "a", false);
    const before = toasts.value;
    deleteToast("nope");
    expect(toasts.value).toBe(before);
  });
});
