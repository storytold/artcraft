//! Connecting provider accounts: the "Set up {provider}" dialog (`ProviderSetupModal`), the
//! Midjourney sign-in window (a system webview, used only to capture the login cookies, like
//! the Tauri app's), and the accounts rows in Settings.

use std::path::Path;

use cookie_store_wrapper::cookie_store::CookieStore;
use egui::{Id, Rect, Sense, Ui, vec2};
use log::warn;
use midjourney_client::credentials::cookie_store_has_auth_cookies::cookie_store_has_auth_cookies;
use midjourney_client::utils::midjourney_browser_profile::MIDJOURNEY_USER_AGENT;
use url::Url;
use wry::raw_window_handle::HasWindowHandle;
use wry::{WebContext, WebView, WebViewBuilder};

use crate::backend::providers::Provider;
use crate::overlays::account::text_field;
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::widgets;

const MIDJOURNEY_URL: &str = "https://www.midjourney.com/";
/// The login cookies live on both hosts.
const MIDJOURNEY_ORIGINS: [&str; 2] = ["https://www.midjourney.com/", "https://midjourney.com/"];
/// How often the sign-in window is checked for the login cookies.
const COOKIE_CHECK_SECS: f64 = 2.0;
const LOGIN_WIDTH: f32 = 560.0;

/// What the setup dialog asks for.
#[derive(Debug, PartialEq)]
pub enum SetupAction {
  Close,
  ConnectMidjourney,
  SaveFalKey,
  SaveOpenRouterKey,
}

/// The API keys being typed, in Settings and the setup dialog.
#[derive(Default)]
pub struct KeyInputs {
  pub fal: String,
  pub openrouter: String,
}

impl KeyInputs {
  /// The input for an API-key provider; `None` for the others.
  fn for_provider(&mut self, provider: Provider) -> Option<&mut String> {
    match provider {
      Provider::Fal => Some(&mut self.fal),
      Provider::OpenRouter => Some(&mut self.openrouter),
      Provider::Artcraft | Provider::Midjourney => None,
    }
  }
}

/// "Set up {provider}": Midjourney signs in through its window; fal and OpenRouter take an API
/// key here.
pub fn setup_dialog(ctx: &egui::Context, provider: Provider, keys: &mut KeyInputs) -> Option<SetupAction> {
  let name = provider.label();
  let mut action = None;
  let close = widgets::modal(ctx, Id::new("provider-setup"), 460.0, |ui| {
    ui.horizontal(|ui| {
      widgets::hud(ui, "Connect account", theme::FAINT);
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        if widgets::ghost(ui, Icon::X, None, "Close", false).clicked() {
          action = Some(SetupAction::Close);
        }
      });
    });
    ui.add_space(6.0);
    ui.label(widgets::heading(&format!("Set up {name}"), 26.0));
    ui.add_space(4.0);
    ui.label(egui::RichText::new(format!("Add your {name} account to ArtCraft!")).size(14.0).family(theme::medium()));
    ui.add_space(10.0);
    let description = match provider {
      Provider::OpenRouter => format!("Paste your {name} API key (openrouter.ai/keys) to generate with the image models on your own {name} account. Generations are billed by {name}, not with ArtCraft credits."),
      Provider::Fal => format!("Paste your {name} API key to generate with your own {name} account. You can add all of your AI accounts to ArtCraft to use them all in one place and build the ultimate AI art tool."),
      _ => format!("You can add your {name} account to ArtCraft by simply logging in. Use your credits and account directly within ArtCraft. You can add all of your AI accounts to ArtCraft to use them all in one place and build the ultimate AI art tool."),
    };
    ui.label(egui::RichText::new(description).size(13.0).color(theme::MUTED));
    ui.add_space(16.0);
    let key = keys.for_provider(provider);
    let ready = match key {
      Some(key) => {
        text_field(ui, key, true, &format!("{name} API key"));
        ui.add_space(10.0);
        !key.trim().is_empty()
      },
      None => true,
    };
    if ui.add_enabled_ui(ready, |ui| widgets::button(ui, Some(Icon::ChevronRight), &format!("Set up {name}"), widgets::Kind::Primary, ui.available_width(), 40.0)).inner.clicked() {
      action = Some(match provider {
        Provider::Fal => SetupAction::SaveFalKey,
        Provider::OpenRouter => SetupAction::SaveOpenRouterKey,
        Provider::Artcraft | Provider::Midjourney => SetupAction::ConnectMidjourney,
      });
    }
  });
  if close && action.is_none() {
    action = Some(SetupAction::Close);
  }
  action
}

/// What the accounts rows in Settings show.
pub struct AccountsView {
  /// The Midjourney account's email ("" when unknown), when one is connected.
  pub midjourney: Option<String>,
  /// The saved fal key, masked.
  pub fal_key_hint: Option<String>,
  /// The saved OpenRouter key, masked.
  pub openrouter_key_hint: Option<String>,
}

#[derive(Debug, PartialEq)]
pub enum AccountAction {
  ConnectMidjourney,
  DisconnectMidjourney,
  SaveFalKey,
  RemoveFalKey,
  SaveOpenRouterKey,
  RemoveOpenRouterKey,
}

/// The provider accounts in Settings (`MidjourneyAccountBlock`, plus the fal and OpenRouter keys).
pub fn accounts_section(ui: &mut Ui, view: &AccountsView, keys: &mut KeyInputs) -> Option<AccountAction> {
  let mut action = None;
  let detail = match view.midjourney.as_deref() {
    Some("") => "Connected",
    Some(email) => email,
    None => "Not logged in",
  };
  let (label, kind) = if view.midjourney.is_some() { ("Disconnect", widgets::Kind::Danger) } else { ("Connect", widgets::Kind::Secondary) };
  if account_row(ui, "Midjourney account", detail, |ui| widgets::button(ui, None, label, kind, 0.0, theme::CONTROL_H).clicked()) {
    action = Some(if view.midjourney.is_some() { AccountAction::DisconnectMidjourney } else { AccountAction::ConnectMidjourney });
  }
  ui.add_space(10.0);
  if let Some(key_action) = api_key_rows(ui, "FAL", view.fal_key_hint.as_deref(), &mut keys.fal) {
    action = Some(if key_action == KeyAction::Save { AccountAction::SaveFalKey } else { AccountAction::RemoveFalKey });
  }
  ui.add_space(10.0);
  if let Some(key_action) = api_key_rows(ui, "OpenRouter", view.openrouter_key_hint.as_deref(), &mut keys.openrouter) {
    action = Some(if key_action == KeyAction::Save { AccountAction::SaveOpenRouterKey } else { AccountAction::RemoveOpenRouterKey });
  }
  action
}

#[derive(PartialEq)]
enum KeyAction {
  Save,
  Remove,
}

/// A provider's API key: the masked key with Remove, or an input with Save.
fn api_key_rows(ui: &mut Ui, name: &str, hint: Option<&str>, input: &mut String) -> Option<KeyAction> {
  let label = format!("{name} API key");
  if let Some(hint) = hint {
    let remove = account_row(ui, &label, hint, |ui| widgets::button(ui, None, "Remove", widgets::Kind::Danger, 0.0, theme::CONTROL_H).clicked());
    return remove.then_some(KeyAction::Remove);
  }
  account_row(ui, &label, "Not set", |_| false);
  ui.add_space(6.0);
  ui.horizontal(|ui| {
    let save_w = 90.0;
    ui.allocate_ui(vec2(ui.available_width() - save_w - 8.0, theme::CONTROL_H), |ui| text_field(ui, input, true, &format!("Paste your {name} API key")));
    let enabled = !input.trim().is_empty();
    ui.add_enabled_ui(enabled, |ui| widgets::button(ui, None, "Save", widgets::Kind::Secondary, save_w, theme::CONTROL_H)).inner.clicked().then_some(KeyAction::Save)
  })
  .inner
}

/// A mono label over a detail line, with its button at the right. Returns the button's click.
fn account_row(ui: &mut Ui, label: &str, detail: &str, button: impl FnOnce(&mut Ui) -> bool) -> bool {
  ui.horizontal(|ui| {
    ui.vertical(|ui| {
      ui.set_width(300.0);
      widgets::hud(ui, label, theme::MUTED);
      ui.label(egui::RichText::new(detail).size(13.0));
    });
    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), button).inner
  })
  .inner
}

/// The Midjourney sign-in window: a webview over a modal, checked every two seconds for the
/// login cookies (both auth tokens), which it hands back once present.
pub struct MidjourneyLogin {
  context: WebContext,
  webview: Option<WebView>,
  error: Option<String>,
  next_check: f64,
}

/// What came of the sign-in window.
pub enum LoginEvent {
  Captured(CookieStore),
  Closed,
}

impl MidjourneyLogin {
  /// The window keeps its own browser profile under the data folder.
  pub fn new(data_root: &Path) -> Self {
    Self { context: WebContext::new(Some(data_root.join("webview").join("midjourney"))), webview: None, error: None, next_check: 0.0 }
  }

  pub fn show(&mut self, ctx: &egui::Context, window: &impl HasWindowHandle) -> Option<LoginEvent> {
    let mut closed = false;
    let mut slot = Rect::NOTHING;
    let height = (ctx.content_rect().height() - 120.0).clamp(420.0, 800.0);
    let dismissed = widgets::modal(ctx, Id::new("midjourney-login"), LOGIN_WIDTH, |ui| {
      ui.horizontal(|ui| {
        ui.label(widgets::heading("Login to Midjourney", 22.0));
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
          if widgets::ghost(ui, Icon::X, None, "Close", false).clicked() {
            closed = true;
          }
        });
      });
      ui.add_space(10.0);
      let (rect, _) = ui.allocate_exact_size(vec2(ui.available_width(), height), Sense::hover());
      ui.painter().rect_filled(rect, 0.0, theme::SUNKEN);
      match &self.error {
        Some(err) => {
          let mut note = ui.new_child(egui::UiBuilder::new().max_rect(rect.shrink(24.0)).layout(egui::Layout::top_down(egui::Align::Center)));
          note.add_space(rect.height() / 2.0 - 48.0);
          note.label(egui::RichText::new(format!("Couldn't open the sign-in window: {err}")).size(13.0).color(theme::BAD));
        },
        None => icons::paint_spinner(ui, Rect::from_center_size(rect.center(), vec2(28.0, 28.0)), theme::MUTED),
      }
      slot = rect;
    });
    if closed || dismissed {
      self.close();
      return Some(LoginEvent::Closed);
    }
    if self.error.is_some() {
      return None;
    }
    let bounds = physical_bounds(slot, ctx.pixels_per_point());
    match &self.webview {
      Some(webview) => {
        if let Err(err) = webview.set_bounds(bounds) {
          warn!("Couldn't move the sign-in window: {err}");
        }
      },
      None => match self.open(window, bounds) {
        Ok(webview) => self.webview = Some(webview),
        Err(err) => self.error = Some(err.to_string()),
      },
    }
    let now = ctx.input(|i| i.time);
    ctx.request_repaint_after(std::time::Duration::from_secs_f64(COOKIE_CHECK_SECS));
    if now < self.next_check {
      return None;
    }
    self.next_check = now + COOKIE_CHECK_SECS;
    let cookies = self.webview.as_ref().and_then(login_cookies)?;
    self.close();
    Some(LoginEvent::Captured(cookies))
  }

  /// Opens on a blank page, clears what an earlier sign-in left behind, then goes to Midjourney
  /// (with the user agent the saved cookies will be replayed with).
  fn open(&mut self, window: &impl HasWindowHandle, bounds: wry::Rect) -> wry::Result<WebView> {
    let webview = WebViewBuilder::new_with_web_context(&mut self.context).with_user_agent(MIDJOURNEY_USER_AGENT).with_url("about:blank").with_bounds(bounds).build_as_child(window)?;
    webview.clear_all_browsing_data()?;
    webview.load_url(MIDJOURNEY_URL)?;
    webview.focus()?;
    Ok(webview)
  }

  fn close(&mut self) {
    if let Some(webview) = self.webview.take() {
      let _ = webview.focus_parent();
    }
  }
}

/// The login cookies, once the page is on Midjourney and both auth tokens are set.
fn login_cookies(webview: &WebView) -> Option<CookieStore> {
  let host = webview.url().ok().and_then(|u| Url::parse(&u).ok()).and_then(|u| u.host_str().map(str::to_owned))?;
  log::debug!("The Midjourney sign-in window is on {host}");
  if host != "www.midjourney.com" && host != "midjourney.com" {
    return None;
  }
  let mut store = CookieStore::empty();
  for origin in MIDJOURNEY_ORIGINS {
    let Ok(origin) = Url::parse(origin) else {
      continue;
    };
    match webview.cookies_for_url(origin.as_str()) {
      // The cookie's own text keeps its path, domain, Secure, HttpOnly, SameSite and expiry.
      Ok(cookies) => cookies.iter().for_each(|c| {
        store.apply_set_cookie_header(&c.to_string(), &origin);
      }),
      Err(err) => warn!("Couldn't read the sign-in cookies: {err}"),
    }
  }
  cookie_store_has_auth_cookies(&store).then_some(store)
}

fn physical_bounds(rect: Rect, pixels_per_point: f32) -> wry::Rect {
  let r = rect * pixels_per_point;
  wry::Rect { position: wry::dpi::PhysicalPosition::new(r.left().round() as i32, r.top().round() as i32).into(), size: wry::dpi::PhysicalSize::new(r.width().round().max(1.0) as u32, r.height().round().max(1.0) as u32).into() }
}
