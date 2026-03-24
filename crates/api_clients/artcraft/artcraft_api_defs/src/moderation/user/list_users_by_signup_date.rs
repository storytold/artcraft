use chrono::{DateTime, Utc};
use enums::by_table::users::user_signup_method::UserSignupMethod;
use enums::by_table::users::user_signup_source::UserSignupSource;
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;

pub const MODERATOR_LIST_USERS_BY_SIGNUP_DATE_PATH: &str = "/v1/moderation/users/list_all_by_signup_date";

#[derive(Deserialize, ToSchema)]
pub struct ModeratorListUsersBySignupDateRequest {
  /// Optional cursor for pagination. Pass the `next_cursor` from a previous response.
  pub id_cursor: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorListUsersBySignupDateResponse {
  pub success: bool,
  pub users: Vec<ModeratorListUsersBySignupDateEntry>,
  /// The cursor for the next page. `None` if there are no more results.
  pub next_cursor: Option<u64>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorListUsersBySignupDateEntry {
  pub id: u64,
  pub token: UserToken,
  pub username: String,
  pub display_name: String,
  pub username_is_not_customized: bool,
  pub email_address: String,
  pub email_confirmed: bool,
  pub is_without_password: bool,
  pub ip_address_creation: String,
  pub maybe_source: Option<UserSignupSource>,
  pub maybe_signup_method: Option<UserSignupMethod>,
  pub created_at: DateTime<Utc>,
  pub maybe_referral_url: Option<String>,
  pub is_temporary: bool,
}
