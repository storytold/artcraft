//! Opt-in source render of production shell/widgets; never starts the backend or reads accounts.

use egui_kittest::Harness;
use crate::shell::{self, Account, Page};
use crate::theme;
use crate::ui::widgets::{self, Kind, Leading, RowLead};

#[derive(Default)]
struct State {
  fonts_ready: bool,
  prompt: String,
}

/// `ARTCRAFT_COMPONENT_SCREENSHOT=/absolute/file.png cargo test -p artcraft_native
/// theme_render_tests::dark_components_source_render -- --exact`.
/// This is a production-component review fixture, not a full app/session screenshot.
#[test]
fn dark_components_source_render() {
  let Some(path) = std::env::var_os("ARTCRAFT_COMPONENT_SCREENSHOT") else {
    return;
  };
  let mut harness = Harness::builder().with_size(egui::vec2(1100.0, 900.0)).build_ui_state(
    |ui, state: &mut State| {
      if !state.fonts_ready {
        theme::apply(ui.ctx());
        state.fonts_ready = true;
        return;
      }
      ui.painter().rect_filled(ui.max_rect(), 0, theme::CHROME);
      ui.horizontal_top(|ui| {
        ui.allocate_ui_with_layout(egui::vec2(shell::SIDEBAR_WIDTH, 860.0), egui::Layout::top_down(egui::Align::Min), |ui| {
          shell::sidebar(ui, Page::CreateImage, &Account { username: None, display_name: None, credits: None });
          // Production sidebar paints into child UIs; reserve its extent in this review layout.
          ui.allocate_space(egui::vec2(shell::SIDEBAR_WIDTH, 860.0));
        });
        egui::Frame::new().fill(theme::BG).inner_margin(24).show(ui, |ui| {
          ui.with_layout(egui::Layout::top_down(egui::Align::Min), |ui| {
            ui.set_width(770.0);
            ui.heading("ArtCraft native source components");
            ui.label("Production sidebar and widget render • backend disconnected");
            ui.add_space(24.0);
            egui::Frame::new().fill(theme::PANEL).inner_margin(16).show(ui, |ui| {
              ui.set_width(720.0);
              widgets::hud(ui, "Image prompt", theme::MUTED);
              ui.add_space(8.0);
              ui.add(egui::TextEdit::multiline(&mut state.prompt).desired_width(700.0).desired_rows(4).hint_text("Describe what you want in the image...")).request_focus();
              ui.add_space(12.0);
              ui.horizontal(|ui| {
                widgets::pill(ui, Leading::None, "Nano Banana Pro", false);
                widgets::pill(ui, Leading::Aspect(Some((1.0, 1.0))), "Square", true);
                widgets::generate_button(ui, true, false, "Generate");
              });
            });
            ui.add_space(24.0);
            ui.horizontal(|ui| {
              widgets::button(ui, None, "Continue", Kind::Accent, 150.0, 38.0);
              widgets::button(ui, None, "Download", Kind::Primary, 150.0, 38.0);
              ui.add_enabled_ui(false, |ui| {
                widgets::button(ui, None, "Unavailable", Kind::Secondary, 150.0, 38.0);
              });
            });
            ui.add_space(24.0);
            widgets::popover_frame().show(ui, |ui| {
              ui.with_layout(egui::Layout::top_down(egui::Align::Min), |ui| {
                ui.set_width(340.0);
                widgets::menu_header(ui, "Aspect ratio");
                widgets::menu_row(ui, RowLead::Aspect(Some((1.0, 1.0))), "Square", Some("Selected option"), true, false, false);
                widgets::menu_row(ui, RowLead::Aspect(Some((16.0, 9.0))), "16:9 (Wide)", Some("Hovered option"), false, false, true);
                ui.add_enabled_ui(false, |ui| {
                  widgets::menu_row(ui, RowLead::None, "Unavailable", None, false, false, false);
                });
              });
            });
          });
        });
      });
    },
    State::default(),
  );
  harness.run();
  let image = harness.render().expect("source component render");
  assert_eq!(image.dimensions(), (1100, 900));
  image.save(path).expect("save source component screenshot");
}
