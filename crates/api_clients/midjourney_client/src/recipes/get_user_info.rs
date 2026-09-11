use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::credentials::midjourney_user_id::MidjourneyUserId;
use crate::endpoints::get_index_page_html::{get_index_page_html, GetIndexPageRequest};
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_error::MidjourneyError;
use dom_query::Document;
use serde::Deserialize;

pub struct GetUserInfoRequest {
  pub hostname: MidjourneyHostname,
  pub cookie_header: String,
}

#[derive(Debug, Clone)]
pub struct GetUserInfoResponse {
  pub user_id: Option<MidjourneyUserId>,
  pub email: Option<String>,
  pub websocket_token: Option<String>,
}

pub async fn get_user_info(req: GetUserInfoRequest) -> Result<GetUserInfoResponse, MidjourneyError> {
  let index_html = get_index_page_html(GetIndexPageRequest {
    hostname: req.hostname,
    cookie_header: req.cookie_header,
  }).await?;

  /*
    <script id="initialProps" type="application/json">
      {
          "initialAuthUser": {
              "idpID": "ENTROPY",
              "id": "UUID",
              "displayName": "uNUMBER",
              "email": "USER@gmail.com",
              "emailVerified": true,
              "photoURL": "https://lh3.googleusercontent.com/a/ENTROPY",
              "abilities": {
                  "admin": false,
                  "developer": false,
                  "accepted_tos": true,
                  "moderator": false,
                  "guide": false,
                  "vip": false,
                  "employee": false,
                  "content_moderator": false,
                  "gdpr_preferences_set": false,
                  "gdpr_allow_advertising": false,
                  "gdpr_allow_analytics": false,
                  "editor_whitelist": false,
                  "allow_nsfw": false,
                  "cooldowns_removed": false,
                  "blocked": false,
                  "community": false,
                  "billing": false,
                  "system_verified": false,
                  "simplified_flow": false,
                  "total_jobs": 57,
                  "is_sub_at_least_one_year_old": false,
                  "can_private": false,
                  "can_relax": false,
                  "has_discord": false,
                  "delete_at": null,
                  "subscription": {
                      "type": "subscription",
                      "plan_type": "basic",
                      "recurring": "month"
                  },
                  "relax_video_job_concurrency": 0
              },
              "websocketToken": "WEBSOCKET_TOKEN_ENTROPY",
              "providers": [
                  "google.com"
              ],
              "system": "firebase",
              "streamToken": "STREAM_TOKEN_ENTROPY"
          },
          "urlFromInitialServerRequest": "/"
      }
    </script>
   */
  
  let document = Document::from(index_html);
  let maybe_nodes = document.select("script[id=initialProps]");

  let node = match maybe_nodes.get(0) {
    Some(node) => node,
    None => {
      return Err(MidjourneyApiError::NoUserProps.into());
    }
  };

  let inner_json = node.inner_html().to_string();

  #[derive(Deserialize, Debug)]
  #[allow(non_snake_case)]
  struct RawAuthUser {
    // NB: The Midjourney user id.
    id: Option<String>,
    email: Option<String>,
    websocketToken: Option<String>,
  }

  #[derive(Deserialize, Debug)]
  #[allow(non_snake_case)]
  struct RawBody {
    initialAuthUser: Option<RawAuthUser>,
  }

  let response : RawBody = serde_json::from_str(&inner_json)
      .map_err(|err| MidjourneyApiError::DeserializationError(err))?;
  
  let props = match response.initialAuthUser {
    Some(props) => props,
    None => {
      return Err(MidjourneyApiError::NoInitialAuthUser.into());
    }
  };

  Ok(GetUserInfoResponse {
    user_id: props.id
        .map(|id| MidjourneyUserId::from_string(id)),
    email: props.email
        .map(|email| email.to_string()),
    websocket_token: props.websocketToken
        .map(|email| email.to_string()),
  })
}

#[cfg(test)]
mod tests {
  use crate::client::midjourney_hostname::MidjourneyHostname;
  use crate::recipes::get_user_info::{get_user_info, GetUserInfoRequest};
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    let result = get_user_info(GetUserInfoRequest {
      cookie_header,
      hostname: MidjourneyHostname::Standard,
    }).await?;

    println!("Response: {:?}\n\n", result);

    assert_eq!(1, 2);

    Ok(())
  }
}

