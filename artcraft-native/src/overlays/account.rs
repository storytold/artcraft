//! The sign-in dialog and the settings dialog.

use egui::{Color32, Id, Sense, Stroke, Ui, pos2, vec2};

use crate::shell::{WEB_APP_URL, group_thousands};
use crate::theme;
use crate::ui::icons::Icon;
use crate::ui::widgets;

#[derive(Default)]
pub struct LoginDialog {
  pub username: String,
  pub password: String,
  pub error: Option<String>,
  pub busy: bool,
  /// A browser sign-in waiting for approval: (page, confirmation code).
  pub device: Option<(String, String)>,
}

#[derive(Debug, PartialEq)]
pub enum LoginAction {
  Close,
  Password,
  Browser,
  CancelBrowser,
}

impl LoginDialog {
  pub fn show(&mut self, ctx: &egui::Context) -> Option<LoginAction> {
    let mut action = None;
    let close = widgets::modal(ctx, Id::new("login"), 420.0, |ui| {
      ui.horizontal(|ui| {
        ui.label(widgets::heading("Sign in to ArtCraft", 24.0));
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
          if widgets::ghost(ui, Icon::X, None, "Close", false).clicked() {
            action = Some(LoginAction::Close);
          }
        });
      });
      ui.add_space(4.0);
      ui.label(egui::RichText::new("Use your ArtCraft account to generate images and videos.").color(theme::MUTED));
      ui.add_space(16.0);
      let width = ui.available_width();
      match &self.device {
        Some((url, code)) => {
          widgets::hud(ui, "Confirmation code", theme::FAINT);
          ui.add_space(6.0);
          ui.label(egui::RichText::new(code).size(28.0).family(theme::mono_bold()).color(theme::INK).extra_letter_spacing(4.0));
          ui.add_space(6.0);
          ui.label(egui::RichText::new("Approve the sign-in in your browser and check the code matches. This window updates by itself.").color(theme::MUTED));
          ui.add_space(10.0);
          ui.horizontal(|ui| {
            if widgets::button(ui, Some(Icon::ExternalLink), "Open page again", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
              ui.ctx().open_url(egui::OpenUrl::new_tab(url));
            }
            if widgets::button(ui, None, "Cancel", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
              action = Some(LoginAction::CancelBrowser);
            }
          });
        },
        None => {
          if ui.add_enabled_ui(!self.busy, |ui| widgets::button(ui, Some(Icon::Globe), "Sign in with browser", widgets::Kind::Primary, width, 40.0)).inner.clicked() {
            action = Some(LoginAction::Browser);
          }
          ui.add_space(14.0);
          divider_with_label(ui, "or");
          ui.add_space(14.0);
          widgets::hud(ui, "Username or email", theme::FAINT);
          ui.add_space(4.0);
          let user_resp = text_field(ui, &mut self.username, false, "you@example.com");
          ui.add_space(10.0);
          widgets::hud(ui, "Password", theme::FAINT);
          ui.add_space(4.0);
          let pass_resp = text_field(ui, &mut self.password, true, "\u{2022}\u{2022}\u{2022}\u{2022}\u{2022}\u{2022}\u{2022}\u{2022}");
          let submitted = (user_resp.lost_focus() || pass_resp.lost_focus()) && ui.input(|i| i.key_pressed(egui::Key::Enter));
          ui.add_space(14.0);
          let ready = !self.username.trim().is_empty() && !self.password.is_empty() && !self.busy;
          let clicked = ui.add_enabled_ui(ready, |ui| widgets::button(ui, if self.busy { None } else { Some(Icon::LogIn) }, if self.busy { "Signing in\u{2026}" } else { "Sign in" }, widgets::Kind::Secondary, width, 40.0)).inner.clicked();
          if ready && (clicked || submitted) {
            action = Some(LoginAction::Password);
          }
        },
      }
      if let Some(error) = &self.error {
        ui.add_space(10.0);
        ui.label(egui::RichText::new(error).color(theme::BAD));
      }
      ui.add_space(16.0);
      ui.horizontal(|ui| {
        widgets::hud_link(ui, "Create account", &format!("{WEB_APP_URL}/signup"));
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
          widgets::hud_link(ui, "Forgot password", &format!("{WEB_APP_URL}/forgot-password"));
        });
      });
    });
    if close && action.is_none() {
      action = Some(if self.device.is_some() { LoginAction::CancelBrowser } else { LoginAction::Close });
    }
    action
  }
}

#[derive(Debug, PartialEq)]
pub enum SettingsAction {
  Close,
  SignOut,
  SignIn,
}

/// The settings dialog (Settings → Misc and Account in the webapp).
pub fn settings_dialog(ctx: &egui::Context, enter_to_generate: &mut bool, username: Option<&str>, credits: Option<u64>, data_root: &std::path::Path) -> Option<SettingsAction> {
  let mut action = None;
  let close = widgets::modal(ctx, Id::new("settings"), 520.0, |ui| {
    ui.horizontal(|ui| {
      ui.label(widgets::heading("Settings", 24.0));
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        if widgets::ghost(ui, Icon::X, None, "Close", false).clicked() {
          action = Some(SettingsAction::Close);
        }
      });
    });
    ui.add_space(14.0);
    widgets::hud(ui, "General", theme::FAINT);
    ui.add_space(6.0);
    ui.horizontal(|ui| {
      ui.vertical(|ui| {
        ui.set_width(400.0);
        ui.label(egui::RichText::new("Enter to generate").size(14.0).family(theme::medium()));
        ui.label(egui::RichText::new("When on, pressing Enter submits the prompt and Shift+Enter adds a new line. When off (default), both Enter and Shift+Enter add a new line - use only the button to submit.").size(12.5).color(theme::MUTED));
      });
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        if switch(ui, *enter_to_generate).clicked() {
          *enter_to_generate = !*enter_to_generate;
        }
      });
    });
    ui.add_space(18.0);
    widgets::hud(ui, "Account", theme::FAINT);
    ui.add_space(6.0);
    match username {
      Some(user) => {
        ui.label(egui::RichText::new(format!("Signed in as @{user}")).size(14.0));
        if let Some(c) = credits {
          ui.label(egui::RichText::new(format!("{} credits", group_thousands(c))).size(12.5).color(theme::MUTED));
        }
        ui.add_space(8.0);
        ui.horizontal(|ui| {
          if widgets::button(ui, Some(Icon::Gem), "Buy credits", widgets::Kind::Accent, 0.0, theme::CONTROL_H).clicked() {
            ui.ctx().open_url(egui::OpenUrl::new_tab(format!("{WEB_APP_URL}/pricing")));
          }
          if widgets::button(ui, Some(Icon::LogOut), "Log out", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
            action = Some(SettingsAction::SignOut);
          }
        });
      },
      None => {
        if widgets::button(ui, Some(Icon::LogIn), "Sign in", widgets::Kind::Primary, 0.0, theme::CONTROL_H).clicked() {
          action = Some(SettingsAction::SignIn);
        }
      },
    }
    ui.add_space(18.0);
    widgets::hud(ui, "About", theme::FAINT);
    ui.add_space(6.0);
    ui.label(egui::RichText::new(format!("ArtCraft native {}", env!("CARGO_PKG_VERSION"))).size(13.0).color(theme::MUTED));
    if widgets::button(ui, Some(Icon::Folder), "Open data folder", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
      if let Err(err) = open::that(data_root) {
        log::warn!("Couldn't open {}: {err}", data_root.display());
      }
    }
  });
  if close && action.is_none() {
    action = Some(SettingsAction::Close);
  }
  action
}

/// A single-line input on the sunken surface with a hairline (and a blue line while focused).
fn text_field(ui: &mut Ui, value: &mut String, password: bool, hint: &str) -> egui::Response {
  let id = ui.next_auto_id();
  let focused = ui.memory(|m| m.has_focus(id));
  egui::Frame::new().fill(theme::SUNKEN).stroke(Stroke::new(1.0, if focused { theme::ACCENT } else { theme::LINE })).corner_radius(theme::RADIUS).inner_margin(egui::Margin::symmetric(10, 8)).show(ui, |ui| ui.add(egui::TextEdit::singleline(value).id(id).password(password).frame(egui::Frame::NONE).desired_width(f32::INFINITY).hint_text(egui::RichText::new(hint).color(theme::FAINT)))).inner
}

/// An on/off switch.
fn switch(ui: &mut Ui, on: bool) -> egui::Response {
  let (rect, resp) = ui.allocate_exact_size(vec2(36.0, 20.0), Sense::click());
  let t = ui.ctx().animate_bool(resp.id, on);
  let fill = if on { theme::ACCENT } else { theme::WASH_HOVER };
  ui.painter().rect(rect, egui::CornerRadius::same(10), fill, Stroke::new(1.0, theme::LINE), egui::StrokeKind::Inside);
  let x = egui::lerp(rect.left() + 10.0..=rect.right() - 10.0, t);
  ui.painter().circle_filled(pos2(x, rect.center().y), 7.0, Color32::WHITE);
  resp.on_hover_cursor(egui::CursorIcon::PointingHand)
}

fn divider_with_label(ui: &mut Ui, label: &str) {
  let (rect, _) = ui.allocate_exact_size(vec2(ui.available_width(), 12.0), Sense::hover());
  let galley = widgets::caps(ui, label, 10.0, theme::mono(), 1.5, theme::FAINT);
  let gap = galley.size().x / 2.0 + 10.0;
  let p = ui.painter();
  p.hline(rect.left()..=rect.center().x - gap, rect.center().y, theme::hairline());
  p.hline(rect.center().x + gap..=rect.right(), rect.center().y, theme::hairline());
  p.galley(rect.center() - galley.size() / 2.0, galley, theme::FAINT);
}
