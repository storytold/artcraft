/// Returns `true` if the prompt contains the secret test phrase that triggers
/// a synthetic job failure. The job record is inserted with
/// `JobStatusPlus::CompleteFailure` immediately, without calling any external
/// inference service or performing billing.
pub fn is_job_failure_test(prompt: &str) -> bool {
  prompt.to_ascii_lowercase().contains("artcraft_test_job_failure")
}
