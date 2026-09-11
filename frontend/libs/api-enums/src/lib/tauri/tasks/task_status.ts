// NOTE: These are defined in Rust (as the source of truth) and duplicated in the frontend.
// In the future, we should use code gen (protobufs or similar) to keep the two sides in sync.

export enum TaskStatus {
  Pending = "pending",
  Started = "started",
  CompleteSuccess = "complete_success",
  CompleteFailure = "complete_failure",
  AttemptFailed = "attempt_failed",
  Dead = "dead",
  CancelledByUser = "cancelled_by_user",
  CancelledByProvider = "cancelled_by_provider",
  CancelledByUs = "cancelled_by_us",
}