use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::credentials::midjourney_user_id::MidjourneyUserId;
use crate::endpoints::storage_list::{storage_list, GetStorageListRequest};
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_error::MidjourneyError;

pub struct GetMidjourneyUserIdRequest {
  pub hostname: MidjourneyHostname,
  pub cookie_header: String,
}

pub async fn get_midjourney_user_id_from_storage(req: GetMidjourneyUserIdRequest) -> Result<MidjourneyUserId, MidjourneyError> {
  let items = storage_list(GetStorageListRequest {
    hostname: req.hostname,
    cookie_header: req.cookie_header,
  }).await?;

  let user_id = items
    .into_iter()
    .find_map(|item| item.bucket_pathname)
    .and_then(|path| path.split('/').next().map(|id| id.to_owned()))
    .map(|id| MidjourneyUserId(id.to_string()))
    .ok_or(MidjourneyApiError::NoUserId)?;

  Ok(user_id)
}

#[cfg(test)]
mod tests {
  use crate::client::midjourney_hostname::MidjourneyHostname;
  use crate::recipes::get_midjourney_user_id_from_storage::{get_midjourney_user_id_from_storage, GetMidjourneyUserIdRequest};
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    let result = get_midjourney_user_id_from_storage(GetMidjourneyUserIdRequest {
      cookie_header,
      hostname: MidjourneyHostname::Standard,
    }).await?;

    println!("Response: {:?}\n\n", result);

    assert_eq!(1, 2);

    Ok(())
  }
}

