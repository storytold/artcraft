use crate::core::commands::enqueue::common::maybe_notify_frontend_of_billing_errors::maybe_notify_frontend_of_billing_errors;
use crate::core::commands::enqueue::common::maybe_notify_frontend_of_grok_errors::maybe_notify_frontend_of_grok_errors;
use crate::core::commands::enqueue::generate_error::GenerateError;
use tauri::AppHandle;

pub async fn notify_frontend_of_errors(
  app: &AppHandle,
  error: &GenerateError,
) {
  maybe_notify_frontend_of_billing_errors(app, error).await;
  maybe_notify_frontend_of_grok_errors(app, error).await;
}
