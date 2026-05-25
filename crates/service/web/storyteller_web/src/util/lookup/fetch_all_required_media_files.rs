use crate::http_server::common_responses::common_web_error::CommonWebError;
use log::{error, warn};
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens_with_connection, MediaFilesByTokensRecord};
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::media_files::MediaFileToken;

const CAN_SEE_DELETED: bool = false;

/// Look up all the media tokens. If any are missing, return an error.
pub async fn fetch_all_required_media_files(
  mysql_connection: &mut PoolConnection<MySql>,
  media_file_tokens: &[MediaFileToken],
) -> Result<Vec<MediaFilesByTokensRecord>, CommonWebError> {
  let result = batch_get_media_files_by_tokens_with_connection(
    mysql_connection,
    &media_file_tokens,
    CAN_SEE_DELETED,
  ).await;

  let media_files = match result {
    Ok(files) => files,
    Err(err) => {
      error!("Error getting media files by tokens: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  if media_files.len() != media_file_tokens.len() {
    warn!("Wrong number of media files returned for tokens: {} found for {} tokens", media_files.len(), media_file_tokens.len());
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("Not all media files could be found. Media files found: {}, tokens provided: {}",
        media_files.len(), media_file_tokens.len())));
  }

  Ok(media_files)
}
