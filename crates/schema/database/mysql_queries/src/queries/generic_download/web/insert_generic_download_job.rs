use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::generic_download_jobs::DownloadJobToken;

pub struct InsertGenericDownloadJobArgs<'a> {
  pub uuid_idempotency_token: &'a str,
  pub download_type: GenericDownloadType,
  pub download_url: &'a str,
  pub title: &'a str,
  pub creator_user_token: &'a str,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn insert_generic_download_job(args: InsertGenericDownloadJobArgs<'_>) -> AnyhowResult<(DownloadJobToken, u64)> {
  // This token is returned to the client.
  let job_token = DownloadJobToken::generate();

  let query = sqlx::query!(
        r#"
INSERT INTO generic_download_jobs
SET
  token = ?,
  uuid_idempotency_token = ?,
  download_type = ?,
  download_url = ?,
  title = ?,
  creator_user_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,
  status = "pending"
        "#,
        &job_token,
        args.uuid_idempotency_token,
        args.download_type.to_str(),
        args.download_url,
        args.title,
        args.creator_user_token,
        args.creator_ip_address,
        args.creator_set_visibility.to_str(),
    );

  let query_result = query.execute(args.mysql_pool)
      .await;

  let record_id = match query_result {
    Ok(res) => {
      res.last_insert_id()
    },
    Err(err) => {
      return Err(anyhow!("error inserting new generic download job: {:?}", err));
    }
  };

  Ok((job_token, record_id))
}
