export enum JobState {
  UNKNOWN = "unknown", // Only on frontend.
  PENDING = "pending",
  STARTED = "started",
  COMPLETE_SUCCESS = "complete_success",
  COMPLETE_FAILURE = "complete_failure",
  ATTEMPT_FAILED = "attempt_failed",
  DEAD = "dead",
  CANCELED_BY_USER = "canceled_by_user",
}
