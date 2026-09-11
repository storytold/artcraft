use errors::AnyhowResult;
use tauri::WebviewWindow;

pub fn get_webview_window_url_path(webview: &WebviewWindow) -> AnyhowResult<String> {
  let url = webview.url()?;
  Ok(url.path().to_string())
}
