use crate::http_server::common_responses::common_web_error::CommonWebError;

pub fn payments_error_test(prompt: &str) -> Result<(), CommonWebError> {
  let prompt = prompt.trim().to_ascii_lowercase();

  if prompt == "trigger_payment_failure" {
    return Err(CommonWebError::PaymentRequired);
  }

  Ok(())
}
