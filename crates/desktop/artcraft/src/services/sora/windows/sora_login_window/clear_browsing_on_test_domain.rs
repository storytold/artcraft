use anyhow::anyhow;
use errors::AnyhowResult;
use log::info;
use tauri::Webview;

// This is just so we have a way to clear browsing data while debugging / building.
pub fn clear_browsing_data_on_test_domain(webview: &Webview) -> AnyhowResult<()> {
  let url = webview.url()?;
  let hostname= url.host()
      .ok_or(anyhow!("no host in url"))?
      .to_string();
  match hostname.as_str() {
    "storyteller.ai" => {
      info!("Clearing all browsing data...");
      webview.clear_all_browsing_data()?;
    }
    _ => {}
  }
  Ok(())
}
