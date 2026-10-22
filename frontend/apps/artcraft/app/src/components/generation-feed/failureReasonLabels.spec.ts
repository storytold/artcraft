import { describe, expect, it } from "vitest";
import { FAILURE_REASON_LABEL } from "./failureReasonLabels";

// Every value of the Rust `TaskFailureType` enum (crates/schema/public/enums/src/tauri/tasks/task_failure_type.rs).
const ALL_TASK_FAILURE_TYPES = [
  "unknown",
  "rule_bans_user_image",
  "rule_bans_user_image_with_faces",
  "rule_bans_user_text_prompt",
  "rule_bans_user_content",
  "rule_bans_generated_video",
  "rule_bans_generated_audio",
  "rule_bans_generated_content",
  "no_foreground_subject_detected",
  "format_not_supported",
  "generation_failed",
];

describe("FAILURE_REASON_LABEL", () => {
  it.each(ALL_TASK_FAILURE_TYPES)("has a readable label for %s", (failureType) => {
    expect(FAILURE_REASON_LABEL[failureType]).toBeTruthy();
  });
});
