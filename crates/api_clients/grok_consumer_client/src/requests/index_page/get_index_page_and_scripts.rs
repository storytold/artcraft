use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::index_page::parsers::index::parse_index_script_list::parse_index_svg_paths;
use crate::requests::index_page::requests::get_index_page_scripts_with_client::{get_index_page_scripts_with_client, GetIndexPageScriptsArgs};
use crate::requests::index_page::requests::get_index_page_with_client::{get_index_page_with_client, GetIndexPageWithClientArgs};
use crate::utils::create_firefox_client::create_firefox_client;
use log::info;
use std::collections::HashMap;
use wreq::Client;
use wreq_util::Emulation;

const INDEX_URL: &str = "https://grok.com";

pub struct GetIndexPageAndScriptsArgs<'a> {
  pub cookie: &'a str,
}

pub struct IndexPageAndScripts {
  /// Index.html
  pub index_body_html: String,

  /// Script path -> Javascript payload.
  pub scripts: HashMap<String, String>,
  
  // The client that we used.
  pub client: Client,
}

pub async fn get_index_page_and_scripts(args: GetIndexPageAndScriptsArgs<'_>) -> Result<IndexPageAndScripts, GrokError> {
  info!("Building client...");
  let client = create_firefox_client()?;

  info!("Fetching index page...");

  let index = get_index_page_with_client(GetIndexPageWithClientArgs {
    client: &client,
    cookie: args.cookie,
  }).await?;

  let scripts = parse_index_svg_paths(&index.body);

  info!("Fetching {} scripts...", scripts.len());

  let scripts = get_index_page_scripts_with_client(GetIndexPageScriptsArgs {
    client: &client,
    cookie: &args.cookie,
    scripts: &scripts,
  }).await?;

  Ok(IndexPageAndScripts {
    index_body_html: index.body,
    scripts,
    client,
  })
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page_and_scripts::{get_index_page_and_scripts, GetIndexPageAndScriptsArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // manually test
  async fn test() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);
    let cookie = get_test_cookies()?;
    let result = get_index_page_and_scripts(GetIndexPageAndScriptsArgs {
      cookie: &cookie,
    }).await?;

    let mut truncated_body = result.index_body_html.clone();
    truncated_body.truncate(500);

    println!("Body:\n\n");
    println!("{}", truncated_body);

    for (k, v) in result.scripts.iter() {
      let mut body = v.to_string();
      body.truncate(100);
      println!("{}: {}\n\n", k, body);
    }

    assert_eq!(1, 2);
    Ok(())
  }
}
