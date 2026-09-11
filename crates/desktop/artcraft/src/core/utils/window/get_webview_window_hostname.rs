use anyhow::anyhow;
use tauri::WebviewWindow;
use errors::AnyhowResult;

pub fn get_webview_window_hostname(webview: &WebviewWindow) -> AnyhowResult<String> {
  let url = webview.url()?;
  let url_hostname= url.host()
      .ok_or(anyhow!("no host in url"))?
      .to_string();
  Ok(url_hostname)
}
