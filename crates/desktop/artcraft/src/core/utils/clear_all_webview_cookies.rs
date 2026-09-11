use errors::AnyhowResult;
use tauri::Webview;

pub fn clear_all_webview_cookies(webview: &Webview) -> AnyhowResult<()> {
  webview.clear_all_browsing_data()?;
  Ok(())
}
