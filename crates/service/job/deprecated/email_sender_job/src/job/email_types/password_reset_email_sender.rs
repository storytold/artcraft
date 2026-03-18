use anyhow::anyhow;

use email_sender::letter_exports;
use email_sender::letter_exports::Message;
use mysql_queries::payloads::email_sender_jobs::email_sender_job_args::PolymorphicEmailSenderJobArgs;
use mysql_queries::queries::email_sender_jobs::list_available_email_sender_jobs::AvailableEmailSenderJob;
use server_environment::ServerEnvironment;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job_dependencies::JobDependencies;

pub async fn password_reset_email_sender(job: &AvailableEmailSenderJob, job_dependencies: &JobDependencies) -> Result<(), ProcessSingleJobError> {

  let maybe_inner_args = job.maybe_email_args
      .as_ref()
      .and_then(|args| args.args.as_ref());

  let maybe_secret_key = match maybe_inner_args {
    Some(PolymorphicEmailSenderJobArgs::Pr(reset_args)) => {
      reset_args.password_reset_secret_key.clone()
    }
    _ => {
      log::error!("Incorrect job args for password reset!");
      return Err(ProcessSingleJobError::InvalidJob(anyhow!("Incorrect job args for password reset!")));
    },
  };

  let secret_key = match maybe_secret_key {
    Some(key) => key,
    None => {
      return Err(ProcessSingleJobError::InvalidJob(anyhow!("No secret key for password reset!")));
    }
  };

  match &job.maybe_email_args {
    Some(args) => {
      match args.args {
        None => {}
        Some(_) => {}
      }

    }
    None => {}
  }

  let from_address = "Support <support@storyteller.ai>"
      .parse()
      .map_err(|err| {
        log::error!("Error parsing from address: {err}");
        ProcessSingleJobError::InvalidJob(anyhow!("Error parsing from address: {err}"))
      })?;

  let to_address = job.destination_email_address
      .parse()
      .map_err(|err| {
        log::error!("Error parsing to address: {err}");
        ProcessSingleJobError::InvalidJob(anyhow!("Error parsing to address: {err}"))
      })?;

  // TODO(bt,2023-11-12): Environmentally configure, allow overrides.
  let link = match job_dependencies.server_environment {
    ServerEnvironment::Development => format!("http://dev.fakeyou.com:7000/password-reset/verify?token={secret_key}"),
    ServerEnvironment::Production => format!("https://fakeyou.com/password-reset/verify?token={secret_key}"),
  };

  let message = format!(r#"
      <a href="{link}">Click here to reset your password!</a>
      <br />
      <br />
      If you can't click the link, here's the secret reset code: {secret_key}
      <br />
      <br />
      Thank You,
      <br />
      <br />
      Storyteller.ai (FakeYou) Team
    "#);

  let email = Message::builder()
      .from(from_address)
      .to(to_address)
      .subject("FakeYou Password Reset")
      .header(letter_exports::ContentType::TEXT_HTML)
      .body(message)
      .map_err(|err| {
        log::error!("Error constructing email: {err}");
        ProcessSingleJobError::InvalidJob(anyhow!("Error constructing email: {err}"))
      })?;

  job_dependencies.email_sender.send_message(&email).map_err(|err| {
    log::error!("Error sending email: {err}");
    ProcessSingleJobError::Other(anyhow!("Error sending email: {err}"))
  })?;

  Ok(())
}
