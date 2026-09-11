use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_error::SoraError;
use crate::recipes::utils::maybe_renew_session_jwt::maybe_renew_session_jwt;
use crate::requests::list_sora2_drafts::list_sora2_drafts::{list_sora2_drafts, ListSora2DraftsResponse};

/// Check Sora 2 drafts with session auto-renewal.
/// If a new sora credential is returned, replace the old one with the new one.
pub async fn list_sora2_drafts_with_session_auto_renew(
  credentials: &SoraCredentialSet,
) -> Result<(ListSora2DraftsResponse, Option<SoraCredentialSet>), SoraError> {

  let mut maybe_new_creds = maybe_renew_session_jwt(&credentials).await?;

  let use_creds = maybe_new_creds.as_ref()
      .unwrap_or_else(|| &credentials);

  let result = list_sora2_drafts(&use_creds).await;

  match result {
    Ok(response) => Ok((response, maybe_new_creds)),
    Err(err) => Err(err), // TODO: Should we retry?
  }
}


#[cfg(test)]
mod tests {
  use crate::recipes::list_sora2_drafts::list_sora2_drafts_with_session_auto_renew::list_sora2_drafts_with_session_auto_renew;
  use crate::test_utils::get_test_credentials::get_test_credentials;
  use errors::AnyhowResult;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let creds = get_test_credentials()?;

    let (result , creds) =
        list_sora2_drafts_with_session_auto_renew(&creds).await?;

    println!("result: {:#?}", result);
    assert_eq!(1, 2);
    
    Ok(())
  }
}
