use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::email_sender_jobs::email_category::EmailCategory;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::email_sender_job_token::EmailSenderJobToken;
use tokens::tokens::users::UserToken;

use crate::payloads::email_sender_jobs::email_sender_job_args::EmailSenderJobArgs;

pub struct InsertEmailSenderJobArgs<'a> {
  pub uuid_idempotency_token: &'a str,

  pub destination_email_address: &'a str,
  pub maybe_destination_user_token: Option<&'a UserToken>,

  pub email_category: EmailCategory,
  pub maybe_email_args: Option<EmailSenderJobArgs>,

  pub ietf_language_tag: &'a str,
  pub ietf_primary_language_subtag: &'a str,

  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_avt_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'a str,

  pub priority_level: u8,

  pub is_debug_request: bool,
  pub maybe_routing_tag: Option<&'a str>,

  pub mysql_pool: &'a MySqlPool,
}

pub async fn insert_email_sender_job(args: InsertEmailSenderJobArgs<'_>) -> AnyhowResult<(EmailSenderJobToken, u64)> {
  let job_token = EmailSenderJobToken::generate();

  let serialized_args_payload = serde_json::ser::to_string(&args.maybe_email_args)
      .map_err(|_e| anyhow!("could not encode inference args"))?;

  // The routing tag column is VARCHAR(32), so we should truncate.
  let maybe_routing_tag = args.maybe_routing_tag
      .map(|routing_tag| {
        let mut routing_tag = routing_tag.trim().to_string();
        routing_tag.truncate(32);
        routing_tag
      });

  let query = sqlx::query!(
        r#"
INSERT INTO email_sender_jobs
SET
  token = ?,
  uuid_idempotency_token = ?,

  destination_email_address = ?,
  maybe_destination_user_token = ?,

  email_category = ?,
  maybe_email_args = ?,

  ietf_language_tag = ?,
  ietf_primary_language_subtag = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  maybe_creator_ip_address = ?,

  priority_level = ?,

  is_debug_request = ?,
  maybe_routing_tag = ?,

  status = "pending"
        "#,
        job_token.as_str(),
        args.uuid_idempotency_token,

        args.destination_email_address,
        args.maybe_destination_user_token,

        args.email_category,
        serialized_args_payload,

        args.ietf_language_tag,
        args.ietf_primary_language_subtag,

        args.maybe_creator_user_token.map(|t| t.to_string()),
        args.maybe_avt_token.map(|t| t.to_string()),
        args.creator_ip_address,

        args.priority_level,

        args.is_debug_request,
        maybe_routing_tag,
    );

  let query_result = query.execute(args.mysql_pool)
      .await;

  let record_id = match query_result {
    Ok(res) => {
      res.last_insert_id()
    },
    Err(err) => {
      return Err(anyhow!("error inserting new generic inference job: {:?}", err));
    }
  };

  Ok((job_token, record_id))
}
