use crate::core::commands::response::shorthand::InfallibleResponse;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::os_platform::OsPlatform;
use log::info;
use serde_derive::Serialize;

#[derive(Debug, Serialize)]
pub struct PlatformInfoResponse {
  pub os_platform: DetectedOs,
  pub webview_runtime: WebviewRuntime,
}

impl SerializeMarker for PlatformInfoResponse {}

#[derive(Copy, Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DetectedOs {
  Windows,
  #[serde(rename = "macos")]
  MacOS,
  Linux,
  Unknown,
}

#[derive(Copy, Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum WebviewRuntime {
  #[serde(rename = "webkit_safari")]
  WebkitSafari,
  #[serde(rename = "webkit_gtk")]
  WebkitGtk,
  #[serde(rename = "edge_webview_2")]
  EdgeWebview2,
  Unknown,
}

#[tauri::command]
pub fn platform_info_command() -> InfallibleResponse<PlatformInfoResponse> {
  info!("platform_info_command called...");

  let os_platform = match OsPlatform::maybe_get() {
    Some(OsPlatform::Linux) => DetectedOs::Linux,
    Some(OsPlatform::MacOs) => DetectedOs::MacOS,
    Some(OsPlatform::Windows) => DetectedOs::Windows,
    None => DetectedOs::Unknown,
  };

  // These are the webviews that Tauri uses on each OS:
  // https://tauri.app/reference/webview-versions/
  let webview_runtime = match os_platform {
    DetectedOs::Windows => WebviewRuntime::EdgeWebview2,
    DetectedOs::MacOS => WebviewRuntime::WebkitSafari,
    DetectedOs::Linux => WebviewRuntime::WebkitGtk,
    DetectedOs::Unknown => WebviewRuntime::Unknown,
  };

  PlatformInfoResponse {
    os_platform,
    webview_runtime,
  }.into()
}
