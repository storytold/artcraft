use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

pub fn payments_error_test(prompt: &str) -> Result<(), AdvancedCommonWebError> {
  let prompt = prompt.trim().to_ascii_lowercase();

  if prompt == "trigger_payment_failure" {
    return Err(AdvancedCommonWebError::PaymentRequired);
  }

  Ok(())
}
