use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::credentials::midjourney_user_id::MidjourneyUserId;
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use log::error;
use serde::Deserialize;
use wreq::Client;
use wreq_util::Emulation;

const DEFAULT_PAGE_SIZE : u64 = 1000;

/// This returns Midjourney's job/media list
pub struct ImagineRequest<'a> {
  pub hostname: MidjourneyHostname,
  pub cookie_header: String,
  pub user_id: &'a MidjourneyUserId,
  pub page_size: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct ImagineResponse {
  pub items: Vec<ImagineItem>,
  pub cursor: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ImagineItem {
  pub id: Option<String>,

  /// This is the prompt, e.g.
  /// `cute puppy wearing a polar bear suit --ar 4:3 --raw --v 7.0`
  pub full_command: Option<String>,

  pub job_type: Option<MidjourneyJobType>,
}

#[derive(Debug, Clone)]
pub enum MidjourneyJobType {
  V6Diffusion,
  V6p1Diffusion,
  V6p1RawDiffusion,
  V7Diffusion,
  V7DraftDiffusion,
  V7DraftRawDiffusion,
  V7RawDiffusion,
  Vid11I2vRenderAJointVideo,
  Vid11I2vRenderBJointVideo,
  Vid11I2vStartEndAVideo,
  Vid11I2vStartEndBVideo,
  Other(String),
}

impl MidjourneyJobType {
  pub fn from_str(s: &str) -> MidjourneyJobType {
    match s {
      "v6_diffusion" => MidjourneyJobType::V6Diffusion,
      "v6-1_diffusion" => MidjourneyJobType::V6p1Diffusion,
      "v6-1_raw_diffusion" => MidjourneyJobType::V6p1RawDiffusion,
      "v7_diffusion" => MidjourneyJobType::V7Diffusion,
      "v7_draft_diffusion" => MidjourneyJobType::V7DraftDiffusion,
      "v7_draft_raw_diffusion" => MidjourneyJobType::V7DraftRawDiffusion,
      "v7_raw_diffusion" => MidjourneyJobType::V7RawDiffusion,
      "vid_1.1_i2v_render_a_joint_video" => MidjourneyJobType::Vid11I2vRenderAJointVideo,
      "vid_1.1_i2v_render_b_joint_video" => MidjourneyJobType::Vid11I2vRenderBJointVideo,
      "vid_1.1_i2v_start_end_a_video" => MidjourneyJobType::Vid11I2vStartEndAVideo,
      "vid_1.1_i2v_start_end_b_video" => MidjourneyJobType::Vid11I2vStartEndBVideo,
      other => MidjourneyJobType::Other(other.to_string()),
    }
  }
}

pub async fn imagine(req: ImagineRequest<'_>) -> Result<ImagineResponse, MidjourneyError> {
  let cookie_header = req.cookie_header.trim();

  if cookie_header.len() < 20 {
    error!("Cookie header is too short (len: {}): {}", cookie_header.len(), cookie_header);
    return Err(MidjourneyClientError::CookieTooShort.into());
  }

  let page_size = req.page_size.unwrap_or(DEFAULT_PAGE_SIZE);

  let referer = format!("https://{}/imagine", req.hostname.as_str());

  let url = format!("https://{}/api/imagine?user_id={}&page_size={}",
    req.hostname.as_str(),
    req.user_id.as_str(),
    page_size,
  );

  let client = Client::builder()
      .emulation(Emulation::Firefox139)
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  // NB: missing headers that were in the browser request:
  // -H 'sec-ch-ua-platform: "macOS"' \
  // -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \

  let mut http_request = client.get(url)
      .header("cookie", cookie_header)
      .header("Referer", &referer)
      .header("Referrer-Policy", "origin-when-cross-origin")
      .header("accept", "*/*")
      .header("accept-encoding", "gzip, deflate, br, zstd")
      .header("accept-language", "en-US,en;q=0.8")
      .header("content-type", "application/json")
      .header("priority", "u=1, i")
      .header("sec-ch-ua-mobile", "?0")
      .header("sec-fetch-dest", "empty")
      .header("sec-fetch-mode", "cors")
      .header("sec-fetch-site", "same-origin")
      .header("x-csrf-protection", "1");

  let http_request  = http_request
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  let response = client.execute(http_request)
      .await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  let status = response.status();

  let response_body = response.text().await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  if !status.is_success() {
    if let Err(err) = filter_cloudflare_errors(status.as_u16(), &response_body) {
      return Err(MidjourneyApiError::CloudflareError(err).into());
    }
  }

  /*
  {
    "data": [
        {
            "id": "a2339f14-ff71-43e4-a69f-8da15e7ba871",
            "enqueue_time": "2025-08-14T17:21:28.403560+00:00",
            "parent_id": null,
            "video_segments": null,
            "rating": null,
            "job_type": "v7_diffusion",
            "event_type": "diffusion",
            "parent_grid": null,
            "full_command": "a modern n64 console",
            "batch_size": 4,
            "width": 1024,
            "height": 1024,
            "published": true,
            "shown": true,
            "user_hidden": false,
            "template": null,
            "vid_framecount": null
        },
      ],
      "cursor": "encrypted cursor",
      "checkpoint": "encrypted something ???"
    }
   */


  #[derive(Deserialize, Debug)]
  #[allow(non_snake_case)]
  struct RawImagineResponse {
    data: Vec<RawImagineItem>,
    cursor: Option<String>,
    //pub checkpoint: Option<String>,
  }

  #[derive(Deserialize, Debug)]
  #[allow(non_snake_case)]
  struct RawImagineItem {
    // The job id
    id: Option<String>,

    // The prompt plus `--` args.
    full_command: Option<String>,

    // Number of images, typically 4
    batch_size: Option<u8>,

    // Some possible values:
    // "v6_diffusion"
    // "v7_diffusion"
    // "v7_draft_raw_diffusion"
    // "v7_raw_diffusion"
    // "vid_1.1_i2v_render_b_joint_video",
    // "vid_1.1_i2v_start_end_a_video"
    // "vid_1.1_i2v_start_end_b_video"
    job_type: Option<String>,

    // Some possible values:
    // "diffusion"
    // "draft"
    // "variation"
    // "video_diffusion"
    // "video_start_end"
    event_type: Option<String>,
  }

  let response : RawImagineResponse = serde_json::from_str(&response_body)
      .map_err(|err| MidjourneyApiError::DeserializationError(err))?;

  Ok(ImagineResponse {
    cursor: response.cursor.clone(),
    items: response.data
        .into_iter()
        .map(|item| {
          ImagineItem {
            id: item.id,
            full_command: item.full_command,
            job_type: item.job_type.as_ref()
                .map(|jt| MidjourneyJobType::from_str(jt))
          }
        }).collect(),
  })
}

#[cfg(test)]
mod tests {
  use crate::client::midjourney_hostname::MidjourneyHostname;
  use crate::credentials::midjourney_user_id::MidjourneyUserId;
  use crate::endpoints::imagine::{imagine, ImagineRequest};
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;
    let user_id = read_to_trimmed_string("/Users/bt/secrets/midjourney/user_id.txt")?;
    let user_id = MidjourneyUserId::from_string(user_id);

    let result = imagine(ImagineRequest {
      cookie_header,
      hostname: MidjourneyHostname::Standard,
      user_id: &user_id,
      page_size: None,
    }).await?;

    println!("Response: {:?}\n\n", result);

    assert_eq!(1, 2);

    Ok(())
  }
}


