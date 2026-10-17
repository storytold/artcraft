import { describe, expect, it } from "vitest";
import { JobStatus } from "./enums";
import {
  deepCopySerializableObjects,
  getCurrentLocationWithoutParams,
  getFileExtension,
  getFileName,
  getFileTypesFromEnum,
  isJobStatusError,
  isJobStatusTerminal,
  isNumberString,
  isObjectSerializable,
  kebabCase,
} from "./utilities";

// Only `name` is read by the file helpers.
const file = (name: string) => ({ name }) as File;

describe("kebabCase", () => {
  it("splits camelCase and turns spaces/underscores into dashes", () => {
    expect(kebabCase("someValueHere")).toBe("some-value-here");
    expect(kebabCase("Some Value_here")).toBe("some-value-here");
  });
});

describe("serialization helpers", () => {
  it("deep copies plain data", () => {
    const src = { a: [1, { b: 2 }] };
    const copy = deepCopySerializableObjects(src);
    expect(copy).toEqual(src);
    expect(copy).not.toBe(src);
  });

  it("detects values that do not survive JSON", () => {
    expect(isObjectSerializable({ a: 1, b: ["x"] })).toBe(true);
    expect(isObjectSerializable({ a: undefined, b: 1 })).toBe(false);
    expect(isObjectSerializable({ fn: () => 1 })).toBe(false);
  });
});

describe("getCurrentLocationWithoutParams", () => {
  it("strips route params and ends with a slash", () => {
    expect(getCurrentLocationWithoutParams("/scene/abc123", { token: "abc123" })).toBe("/scene/");
  });

  it("keeps an existing trailing slash and handles no params", () => {
    expect(getCurrentLocationWithoutParams("/scene/", {})).toBe("/scene/");
    expect(getCurrentLocationWithoutParams("/scene", {})).toBe("/scene/");
  });
});

describe("job status helpers", () => {
  it("treats pending, started and attempt_failed as still running", () => {
    expect(isJobStatusTerminal(JobStatus.PENDING)).toBe(false);
    expect(isJobStatusTerminal(JobStatus.STARTED)).toBe(false);
    expect(isJobStatusTerminal(JobStatus.ATTEMPT_FAILED)).toBe(false);
  });

  it("treats every other status as terminal", () => {
    expect(isJobStatusTerminal(JobStatus.COMPLETE_SUCCESS)).toBe(true);
    expect(isJobStatusTerminal(JobStatus.COMPLETE_FAILURE)).toBe(true);
    expect(isJobStatusTerminal(JobStatus.DEAD)).toBe(true);
    expect(isJobStatusTerminal(JobStatus.CANCELLED_BY_USER)).toBe(true);
  });

  it("flags only failure statuses as errors", () => {
    expect(isJobStatusError(JobStatus.ATTEMPT_FAILED)).toBe(true);
    expect(isJobStatusError(JobStatus.COMPLETE_FAILURE)).toBe(true);
    expect(isJobStatusError(JobStatus.DEAD)).toBe(true);
    expect(isJobStatusError(JobStatus.COMPLETE_SUCCESS)).toBe(false);
    expect(isJobStatusError(JobStatus.CANCELLED_BY_USER)).toBe(false);
  });
});

describe("isNumberString", () => {
  it("accepts numbers and rejects words", () => {
    expect(isNumberString("42")).toBe(true);
    expect(isNumberString("-1.5")).toBe(true);
    expect(isNumberString("abc")).toBe(false);
  });
});

describe("file name helpers", () => {
  it("splits at the last dot", () => {
    expect(getFileName(file("scene.final.glb"))).toBe("scene.final");
    expect(getFileExtension(file("scene.final.glb"))).toBe(".glb");
  });

  it("treats a name with no dot as all name and no extension", () => {
    expect(getFileName(file("README"))).toBe("README");
    expect(getFileExtension(file("README"))).toBe("");
  });
});

describe("getFileTypesFromEnum", () => {
  it("returns the enum keys", () => {
    expect(getFileTypesFromEnum({ PNG: "png", JPG: "jpg" })).toEqual(["PNG", "JPG"]);
  });
});
