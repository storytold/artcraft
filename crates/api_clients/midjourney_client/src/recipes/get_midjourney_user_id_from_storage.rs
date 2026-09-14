use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::credentials::midjourney_user_id::MidjourneyUserId;
use crate::endpoints::storage_list::{storage_list, StorageListArgs};
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_error::MidjourneyError;
use browser_emulation::browser_profile::BrowserProfile;

/// Recovers the user id from the storage list. Has no semantic parameters —
/// only transport concerns.
pub struct GetMidjourneyUserIdArgs<'a> {
  pub cookie_header: &'a str,
  /// Defaults to the standard hostname if absent.
  pub hostname: Option<&'a MidjourneyHostname>,
  /// Defaults to [`BrowserProfile::default`] if absent.
  pub browser: Option<BrowserProfile>,
}

pub async fn get_midjourney_user_id_from_storage(
  args: GetMidjourneyUserIdArgs<'_>,
) -> Result<MidjourneyUserId, MidjourneyError> {
  let items = storage_list(StorageListArgs {
    cookie_header: args.cookie_header,
    hostname: args.hostname,
    browser: args.browser,
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
  use crate::recipes::get_midjourney_user_id_from_storage::{get_midjourney_user_id_from_storage, GetMidjourneyUserIdArgs};
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    let result = get_midjourney_user_id_from_storage(GetMidjourneyUserIdArgs {
      cookie_header: &cookie_header,
      hostname: None,
      browser: None,
    }).await?;

    println!("Response: {:?}\n\n", result);

    assert_eq!(1, 2);

    Ok(())
  }
}
