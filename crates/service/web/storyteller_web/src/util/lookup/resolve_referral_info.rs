use log::warn;
use mysql_queries::queries::user_referral_codes::lookup_referral_code_by_code::lookup_referral_code_by_code;
use mysql_queries::queries::users::user::get::get_user_token_by_username_with_executor::get_user_token_by_username_with_executor;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use tokens::tokens::users::UserToken;

use crate::util::cleaners::sanitize_referral_code::sanitize_referral_code;
use crate::util::cleaners::sanitize_referral_username::sanitize_referral_username;

/// The resolved referral information to store on the new user record.
pub struct ResolvedReferralInfo {
  /// The raw referral partner string (trimmed, max 32 chars) for `users.maybe_referral_partner`.
  pub maybe_referral_partner: Option<String>,

  /// The resolved user token of the referrer for `users.maybe_referral_user_token`.
  pub maybe_referral_user_token: Option<UserToken>,

  /// The referral code token used, if the referral was resolved via a code.
  pub maybe_referral_code_token: Option<UserReferralCodeToken>,
}

/// Resolve referral info from either a referral code or a referral username.
///
/// If `maybe_referral_code` is present, try that first:
///   - Trim, lowercase, look up in `user_referral_codes` table
///   - If found: use the code's `owner_user_token` and the trimmed (pre-lowercase) code as partner
///
/// Otherwise, fall back to `maybe_referral_username`:
///   - Sanitize (trim + truncate to 32 chars) for `maybe_referral_partner`
///   - Trim + lowercase + look up user by username for `maybe_referral_user_token`
///
/// All lookups are fail-open: errors are logged and result in `None`.
pub async fn resolve_referral_info(
  maybe_referral_code: Option<&str>,
  maybe_referral_username: Option<&str>,
  mysql_connection: &mut PoolConnection<MySql>,
) -> ResolvedReferralInfo {
  // Try referral code first.
  if let Some(raw_code) = maybe_referral_code {
    let trimmed = raw_code.trim();
    if !trimmed.is_empty() {
      let code_lowercase = trimmed.to_lowercase();

      match lookup_referral_code_by_code(&code_lowercase, &mut **mysql_connection).await {
        Ok(Some(result)) => {
          let partner = sanitize_referral_code(trimmed);
          return ResolvedReferralInfo {
            maybe_referral_partner: partner,
            maybe_referral_user_token: Some(result.owner_user_token),
            maybe_referral_code_token: Some(result.token),
          };
        }
        Ok(None) => {
          // Code not found — fall through to username lookup.
        }
        Err(err) => {
          warn!("Referral code lookup failed (continuing): {:?}", err);
        }
      }
    }
  }

  // Fall back to referral username.
  if let Some(raw_username) = maybe_referral_username {
    let maybe_referral_partner = sanitize_referral_username(raw_username);

    let lookup_username = raw_username.trim().to_lowercase();
    let maybe_referral_user_token = if lookup_username.is_empty() {
      None
    } else {
      match get_user_token_by_username_with_executor(&lookup_username, &mut **mysql_connection).await {
        Ok(token) => token,
        Err(err) => {
          warn!("Referral user lookup failed (continuing): {:?}", err);
          None
        }
      }
    };

    return ResolvedReferralInfo {
      maybe_referral_partner,
      maybe_referral_user_token,
      maybe_referral_code_token: None,
    };
  }

  ResolvedReferralInfo {
    maybe_referral_partner: None,
    maybe_referral_user_token: None,
    maybe_referral_code_token: None,
  }
}
