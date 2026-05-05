use crate::core::windows::main_window::constants::MAIN_WINDOW_NAME;
use errors::AnyhowResult;
use tauri::window::Color;
use tauri::{AppHandle, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

pub async fn setup_main_window(
  app: &AppHandle,
) -> AnyhowResult<()> {

  let win_builder =
      WebviewWindowBuilder::new(app, MAIN_WINDOW_NAME, WebviewUrl::default())
          .title("ArtCraft")
          .resizable(true)
          .fullscreen(false)
          .background_color(Color(0, 0, 0, 0))
          .enable_clipboard_access()
          .inner_size(2400.0, 1300.0);

  #[cfg(target_os = "macos")]
  let win_builder = win_builder
      .decorations(true) // NB: Mac requires decorations. Tons of capabilities disappear otherwise.
      .title_bar_style(TitleBarStyle::Overlay)
      .hidden_title(true)
      .accept_first_mouse(true) // https://github.com/tauri-apps/tauri/issues/11605#issuecomment-2460112096
      .focusable(true)
      .focused(true);

  // NB: Setting decorations(false) "breaks" Mac, though I never documented how/why.
  // NB: On Linux, setting decorations(false) will cause the window to be unable to be
  // resized, despite the arrow cursor indicating resize is possible. This might be
  // fixable another way, but for now it seems fine to disable this. There also seem to
  // be some performance loss with decorations(false), but I might be imagining it.
  #[cfg(target_os = "windows")]
  let win_builder = win_builder
      .decorations(false); // NB: This breaks Mac! (And breaks resize on Linux)

  // On macOS, Cmd+A/C/V/X/Z and friends are dispatched by AppKit through the application
  // menu. Without an Edit submenu containing the standard predefined items, these
  // shortcuts never reach the WKWebView and text inputs behave as if Cmd is unmapped.
  #[cfg(target_os = "macos")]
  install_macos_app_menu(app)?;

  let _window = win_builder.build()?;

  Ok(())
}

#[cfg(target_os = "macos")]
fn install_macos_app_menu(app: &AppHandle) -> AnyhowResult<()> {
  use tauri::menu::{Menu, PredefinedMenuItem, Submenu};

  let app_submenu = Submenu::with_items(
    app,
    "ArtCraft",
    true,
    &[
      &PredefinedMenuItem::about(app, None, None)?,
      &PredefinedMenuItem::separator(app)?,
      &PredefinedMenuItem::services(app, None)?,
      &PredefinedMenuItem::separator(app)?,
      &PredefinedMenuItem::hide(app, None)?,
      &PredefinedMenuItem::hide_others(app, None)?,
      &PredefinedMenuItem::show_all(app, None)?,
      &PredefinedMenuItem::separator(app)?,
      &PredefinedMenuItem::quit(app, None)?,
    ],
  )?;

  let edit_submenu = Submenu::with_items(
    app,
    "Edit",
    true,
    &[
      &PredefinedMenuItem::undo(app, None)?,
      &PredefinedMenuItem::redo(app, None)?,
      &PredefinedMenuItem::separator(app)?,
      &PredefinedMenuItem::cut(app, None)?,
      &PredefinedMenuItem::copy(app, None)?,
      &PredefinedMenuItem::paste(app, None)?,
      &PredefinedMenuItem::select_all(app, None)?,
    ],
  )?;

  let window_submenu = Submenu::with_items(
    app,
    "Window",
    true,
    &[
      &PredefinedMenuItem::minimize(app, None)?,
      &PredefinedMenuItem::maximize(app, None)?,
      &PredefinedMenuItem::separator(app)?,
      &PredefinedMenuItem::close_window(app, None)?,
    ],
  )?;

  let menu = Menu::with_items(app, &[&app_submenu, &edit_submenu, &window_submenu])?;
  app.set_menu(menu)?;
  Ok(())
}
