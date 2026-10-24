// Backend failure codes (the snake_case `TaskFailureType` values from the Rust side) mapped to messages a user can read.
// Shared by the task queue popover and the generation feed so both show the same text.
export const FAILURE_REASON_LABEL: Record<string, string> = {
  rule_bans_user_image: "Image violates content policy",
  rule_bans_user_image_with_faces: "Images with faces are not allowed",
  rule_bans_user_text_prompt: "Text prompt violates content policy",
  rule_bans_user_content: "Content violates content policy",
  rule_bans_generated_video: "Generated video flagged by content policy",
  rule_bans_generated_audio: "Generated audio flagged by content policy",
  rule_bans_generated_content: "Generated content flagged by content policy",
  // FIX: these two failure types had no label in either copy of this table, so a failed card for them showed no
  // reason unless the backend also sent a message.
  no_foreground_subject_detected: "No subject could be found in the image",
  format_not_supported: "This file format is not supported by the model",
  generation_failed: "Generation failed",
  unknown: "An unknown error occurred",
};
