/**
 * Prompt-driven test triggers.
 *
 * Typing one of these words into a prompt forces a specific outcome, which is
 * how a developer exercises failure paths without a real provider. The flag
 * names match the ones the team already uses.
 *
 *   simulate_artcraft_failure [category]  fail after the normal delay
 *   test_artcraft_failure [category]      alias of the above
 *   artcraft_test_job_failure             fail immediately, no pending phase
 *   trigger_payment_failure               reject the submission with 402
 *   simulate_artcraft_slow [seconds]      stay pending for the given seconds
 *
 * `category` is any `FrontendFailureCategory` value, e.g.
 * `simulate_artcraft_failure face_not_detected`. Omitted, it is
 * `generation_failed`.
 */

/** Every failure category the frontend knows how to render. */
export const FAILURE_CATEGORIES = [
  "face_not_detected",
  "no_foreground_subject_detected",
  "format_not_supported",
  "keep_alive_elapsed",
  "not_yet_implemented",
  "retryable_worker_error",
  "model_rules_violation",
  "rule_bans_user_image",
  "rule_bans_user_image_with_faces",
  "rule_bans_user_text_prompt",
  "rule_bans_user_content",
  "rule_bans_generated_video",
  "rule_bans_generated_audio",
  "rule_bans_generated_content",
  "filesize_too_large",
  "image_dimensions_too_small",
  "image_dimensions_too_large",
  "generation_failed",
] as const;

export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];

const DEFAULT_FAILURE_CATEGORY: FailureCategory = "generation_failed";

const FAILURE_FLAGS = ["simulate_artcraft_failure", "test_artcraft_failure"];
const IMMEDIATE_FAILURE_FLAG = "artcraft_test_job_failure";
const PAYMENT_FAILURE_FLAG = "trigger_payment_failure";
const SLOW_FLAG = "simulate_artcraft_slow";

export interface PromptTriggers {
  /** Reject the submission outright with a 402, before a job is created. */
  rejectWithPaymentRequired: boolean;
  /** Complete the job as a failure rather than a success. */
  failWithCategory: FailureCategory | undefined;
  /** Skip the pending phase entirely and land in a terminal state immediately. */
  resolveImmediately: boolean;
  /** Override how long the job stays pending, in seconds. */
  overrideResolveSeconds: number | undefined;
}

export function readPromptTriggers(prompt: string | undefined): PromptTriggers {
  const text = (prompt ?? "").toLowerCase();

  const immediate = text.includes(IMMEDIATE_FAILURE_FLAG);
  const delayedFailureFlag = FAILURE_FLAGS.find((flag) => text.includes(flag));

  return {
    rejectWithPaymentRequired: text.includes(PAYMENT_FAILURE_FLAG),
    failWithCategory:
      immediate || delayedFailureFlag !== undefined
        ? readCategoryAfter(text, delayedFailureFlag ?? IMMEDIATE_FAILURE_FLAG)
        : undefined,
    resolveImmediately: immediate,
    overrideResolveSeconds: readSecondsAfter(text, SLOW_FLAG),
  };
}

/** The word following a flag, when it names a known failure category. */
function readCategoryAfter(text: string, flag: string): FailureCategory {
  const nextWord = wordAfter(text, flag);
  if (nextWord === undefined) {
    return DEFAULT_FAILURE_CATEGORY;
  }

  const match = FAILURE_CATEGORIES.find((category) => category === nextWord);
  return match ?? DEFAULT_FAILURE_CATEGORY;
}

function readSecondsAfter(text: string, flag: string): number | undefined {
  if (!text.includes(flag)) {
    return undefined;
  }

  const nextWord = wordAfter(text, flag);
  if (nextWord === undefined) {
    return undefined;
  }

  const seconds = Number.parseInt(nextWord, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function wordAfter(text: string, flag: string): string | undefined {
  const flagIndex = text.indexOf(flag);
  if (flagIndex < 0) {
    return undefined;
  }

  const remainder = text.slice(flagIndex + flag.length);
  const words = remainder.split(/[^a-z0-9_]+/).filter((word) => word.length > 0);
  return words[0];
}
