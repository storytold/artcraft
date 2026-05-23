use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use log::warn;
use wreq::Client;

const INDEX_URL: &str = "https://grok.com";

pub struct GetIndexPageScriptArgs<'a> {
  pub client: &'a Client,
  pub cookie: &'a str,
  pub script_url: &'a str,
}


/// Get javascript that we'll need for client crypto purposes.
pub async fn get_index_page_script_with_client(args: GetIndexPageScriptArgs<'_>) -> Result<String, GrokError> {

  let script_url;

  if args.script_url.starts_with("https://") {
    script_url = args.script_url.to_string();
  } else {
    script_url = get_script_url(args.script_url);
  }

  let builder = args.client.get(script_url)
      .header("User-Agent", FIREFOX_143_MAC_USER_AGENT)
      .header("Accept", "*/*")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Accept-Encoding", "gzip, deflate, br, zstd")
      .header("Referer", "https://grok.com")
      .header("Connection", "keep-alive")
      .header("Sec-Fetch-Dest", "script")
      .header("Sec-Fetch-Mode", "no-cors")
      .header("Sec-Fetch-Site", "same-origin")
      .header("TE", "trailers");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;
  
  let status = response.status();

  // TODO: Cloudflare handling.
  let body = response.text()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  if !status.is_success() {
    warn!("could not get index page script: {}, body: {}", status, body);
  }

  Ok(body)
}

fn get_script_url(script_path: &str) -> String {
  if script_path.starts_with("/") {
    format!("{}{}", INDEX_URL, script_path)
  } else {
    format!("{}/{}", INDEX_URL, script_path)
  }
}
