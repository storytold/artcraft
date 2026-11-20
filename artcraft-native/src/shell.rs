//! The app frame: a custom title bar (mark, sidebar toggle, account, caption buttons), a sidebar
//! flush with the window edge, and the content panel's header (breadcrumbs and feed toggles).

use egui::{Align2, Color32, FontId, Id, Rect, Sense, Stroke, Ui, pos2, vec2};

use crate::feed::grid::ViewMode;
use crate::{i18n, theme};
use crate::ui::icons::{self, Icon};
use crate::ui::{widgets, window};

pub const SIDEBAR_WIDTH: f32 = 232.0;
pub const TITLEBAR_HEIGHT: f32 = 40.0;
pub const HEADER_HEIGHT: f32 = 48.0;
/// The content panel's gap to the window edges, and its corner radius (Claude-app style).
pub const PANEL_GAP: i8 = 8;
pub const PANEL_RADIUS: u8 = 8;
const ROW_HEIGHT: f32 = 32.0;
pub const DISCORD_URL: &str = "https://discord.gg/artcraft";
pub const GITHUB_URL: &str = "https://github.com/storytold/artcraft";
pub const TUTORIALS_URL: &str = "https://www.youtube.com/@OfficialArtCraftStudios";
pub const WEB_APP_URL: &str = "https://app.getartcraft.com";

/// Every page in the navigation.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum Page {
  Home,
  #[default]
  CreateImage,
  CreateVideo,
  CreateAudio,
  Object3d,
  World3d,
  EditImage,
  Stage3d,
  VideoEditor,
  RemoveBackground,
  FrameExtractor,
  Library,
}

impl Page {
  pub fn label(self) -> &'static str {
    match self {
      Page::Home => "Home",
      Page::CreateImage => "Image",
      Page::CreateVideo => "Video",
      Page::CreateAudio => "Audio",
      Page::Object3d => "3D Object",
      Page::World3d => "3D World",
      Page::EditImage => "Edit Image",
      Page::Stage3d => "3D Stage",
      Page::VideoEditor => "Edit Video",
      Page::RemoveBackground => "BG Remove",
      Page::FrameExtractor => "Frame Extract",
      Page::Library => "Library",
    }
  }

  /// Localized label for the active UI language.
  pub fn display_label(self) -> &'static str {
    i18n::t(self.label())
  }

  fn icon(self) -> Icon {
    match self {
      Page::Home => Icon::Home,
      Page::CreateImage => Icon::Image,
      Page::CreateVideo => Icon::Video,
      Page::CreateAudio => Icon::Music,
      Page::Object3d | Page::Stage3d => Icon::Box,
      Page::World3d => Icon::Globe,
      Page::EditImage => Icon::Pencil,
      Page::VideoEditor | Page::FrameExtractor => Icon::Film,
      Page::RemoveBackground => Icon::Wand,
      Page::Library => Icon::Library,
    }
  }

  /// The breadcrumb trail (`Create › Image`).
  pub fn crumbs(self) -> (&'static str, &'static str) {
    match self {
      Page::Home => ("ArtCraft", "Home"),
      Page::CreateImage | Page::CreateVideo | Page::CreateAudio | Page::Object3d | Page::World3d => ("Create", self.label()),
      Page::Library => ("Assets", "Library"),
      _ => ("Studio", self.label()),
    }
  }

  /// A page by its web-app style slug (`create-image`), for `ARTCRAFT_PAGE`.
  pub fn from_slug(slug: &str) -> Option<Self> {
    Some(match slug {
      "home" => Page::Home,
      "create-image" | "image" => Page::CreateImage,
      "create-video" | "video" => Page::CreateVideo,
      "create-audio" | "audio" => Page::CreateAudio,
      "library" => Page::Library,
      _ => return None,
    })
  }

  /// Pages the native app has; the rest open a "coming soon" page.
  pub fn is_ready(self) -> bool {
    matches!(self, Page::Home | Page::CreateImage | Page::CreateVideo | Page::CreateAudio | Page::Library)
  }

  /// The same tool in the web app.
  pub fn web_path(self) -> &'static str {
    match self {
      Page::CreateAudio => "/create-audio",
      Page::Object3d => "/create-object",
      Page::World3d => "/create-world",
      Page::EditImage => "/pagedraw",
      Page::Stage3d => "/pagescene",
      Page::VideoEditor => "/video-editor",
      Page::RemoveBackground => "/create-vfx",
      Page::FrameExtractor => "/frame-extractor",
      Page::CreateVideo => "/create-video",
      Page::Library => "/library",
      _ => "/create-image",
    }
  }
}

const SECTIONS: [(&str, &[Page]); 3] = [("Create", &[Page::CreateImage, Page::CreateVideo, Page::CreateAudio, Page::Object3d, Page::World3d]), ("Studio", &[Page::EditImage, Page::Stage3d, Page::VideoEditor, Page::RemoveBackground, Page::FrameExtractor]), ("Assets", &[Page::Library])];

/// Who's signed in, for the sidebar and top bar.
pub struct Account<'a> {
  pub username: Option<&'a str>,
  pub display_name: Option<&'a str>,
  pub credits: Option<u64>,
}

/// What the user did in the frame.
#[derive(Debug, PartialEq)]
pub enum ShellAction {
  Navigate(Page),
  ToggleSidebar,
  SignIn,
  SignOut,
  OpenSettings,
  SetViewMode(ViewMode),
  SetAutoplay(bool),
  ToggleSelect,
}

/// The custom title bar: the ArtCraft mark (home) and the sidebar toggle at the start side, the
/// account and (on Windows and Linux) the caption buttons at the end side; the rest drags the
/// window. In RTL, nav controls sit on the right while macOS traffic lights stay clear on the left.
pub fn titlebar(ui: &mut Ui, account: &Account<'_>, mark: &egui::TextureHandle) -> Option<ShellAction> {
  let mut action = None;
  let rtl = i18n::is_rtl();
  window::title_bar_drag(ui);
  let rect = ui.max_rect();
  let mut bar = ui.new_child(egui::UiBuilder::new().max_rect(rect).layout(egui::Layout::left_to_right(egui::Align::Center)));
  let ui = &mut bar;
  ui.spacing_mut().item_spacing.x = 4.0;
  ui.add_space(window::leading_inset() + 10.0);
  if rtl {
    titlebar_account(ui, account, &mut action);
    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
      if window::custom_caption_buttons() {
        ui.spacing_mut().item_spacing.x = 0.0;
        window::caption_buttons(ui, TITLEBAR_HEIGHT);
      }
      ui.add_space(12.0);
      ui.spacing_mut().item_spacing.x = 4.0;
      titlebar_mark(ui, mark, &mut action);
      if widgets::ghost(ui, Icon::PanelLeft, None, i18n::t("Toggle Sidebar"), false).clicked() {
        action = Some(ShellAction::ToggleSidebar);
      }
    });
  } else {
    titlebar_mark(ui, mark, &mut action);
    if widgets::ghost(ui, Icon::PanelLeft, None, i18n::t("Toggle Sidebar"), false).clicked() {
      action = Some(ShellAction::ToggleSidebar);
    }
    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
      ui.spacing_mut().item_spacing.x = 8.0;
      if window::custom_caption_buttons() {
        ui.spacing_mut().item_spacing.x = 0.0;
        window::caption_buttons(ui, TITLEBAR_HEIGHT);
        ui.add_space(12.0);
        ui.spacing_mut().item_spacing.x = 8.0;
      } else {
        ui.add_space(12.0);
      }
      titlebar_account(ui, account, &mut action);
    });
  }
  action
}

fn titlebar_mark(ui: &mut Ui, mark: &egui::TextureHandle, action: &mut Option<ShellAction>) {
  let (mark_rect, mark_resp) = ui.allocate_exact_size(vec2(28.0, 28.0), Sense::click());
  if mark_resp.hovered() {
    ui.painter().rect_filled(mark_rect, theme::RADIUS, theme::WASH);
  }
  ui.painter().image(mark.id(), Rect::from_center_size(mark_rect.center(), vec2(18.0, 16.0)), Rect::from_min_max(pos2(0.0, 0.0), pos2(1.0, 1.0)), theme::ACCENT);
  let accessible = i18n::tl("Home").to_owned();
  mark_resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, true, accessible.clone()));
  if mark_resp.on_hover_text(i18n::t("Home")).on_hover_cursor(egui::CursorIcon::PointingHand).clicked() {
    *action = Some(ShellAction::Navigate(Page::Home));
  }
}

fn titlebar_account(ui: &mut Ui, account: &Account<'_>, action: &mut Option<ShellAction>) {
  match account.username {
    Some(_) => {
      if let Some(a) = account_menu(ui, account) {
        *action = Some(a);
      }
      if let Some(credits) = account.credits {
        if credits_pill(ui, credits).clicked() {
          ui.ctx().open_url(egui::OpenUrl::new_tab(format!("{WEB_APP_URL}/pricing")));
        }
      }
    },
    None => {
      if widgets::button(ui, None, i18n::t("Sign in"), widgets::Kind::Primary, 0.0, 28.0).clicked() {
        *action = Some(ShellAction::SignIn);
      }
    },
  }
}

/// The sidebar, flush with the window's start edge. Returns the user's action, if any.
pub fn sidebar(ui: &mut Ui, page: Page, account: &Account<'_>) -> Option<ShellAction> {
  let mut action = None;
  let rect = ui.max_rect();
  let mut inner = ui.new_child(egui::UiBuilder::new().max_rect(rect.shrink2(vec2(10.0, 4.0))));
  let ui = &mut inner;
  ui.spacing_mut().item_spacing.y = 2.0;
  if nav_row(ui, Page::Home, page == Page::Home) {
    action = Some(ShellAction::Navigate(Page::Home));
  }
  for (title, pages) in SECTIONS {
    ui.add_space(10.0);
    widgets::section_label(ui, i18n::t(title), theme::SIDEBAR_INK);
    for &p in pages {
      if nav_row(ui, p, page == p) {
        action = Some(ShellAction::Navigate(p));
      }
    }
  }
  ui.add_space(10.0);
  widgets::section_label(ui, i18n::t("Resources"), theme::SIDEBAR_INK);
  for (label, icon, url) in [("Tutorials", Icon::Play, TUTORIALS_URL), ("Discord", Icon::Globe, DISCORD_URL), ("GitHub", Icon::ExternalLink, GITHUB_URL)] {
    if link_row(ui, label, icon) {
      ui.ctx().open_url(egui::OpenUrl::new_tab(url));
    }
  }

  // The account sits at the bottom, like the webapp's download button.
  let bottom = Rect::from_min_max(pos2(rect.left() + 10.0, rect.bottom() - 56.0), pos2(rect.right() - 10.0, rect.bottom() - 8.0));
  let mut foot = ui.new_child(egui::UiBuilder::new().max_rect(bottom));
  match account.username {
    Some(username) => {
      if account_row(&mut foot, account.display_name.unwrap_or(username), account.credits).clicked() {
        action = Some(ShellAction::OpenSettings);
      }
    },
    None => {
      if widgets::button(&mut foot, Some(Icon::LogIn), i18n::t("Sign in"), widgets::Kind::Primary, bottom.width(), 40.0).clicked() {
        action = Some(ShellAction::SignIn);
      }
    },
  }
  action
}

fn nav_row(ui: &mut Ui, page: Page, selected: bool) -> bool {
  let (rect, resp) = ui.allocate_exact_size(vec2(ui.available_width(), ROW_HEIGHT), Sense::click());
  let hovered = resp.hovered();
  let rtl = i18n::is_rtl();
  let p = ui.painter();
  if selected {
    p.rect_filled(rect, theme::RADIUS, theme::WASH_SELECTED);
    let bar_x = if rtl { rect.right() + 6.0 } else { rect.left() - 8.0 };
    p.rect_filled(Rect::from_min_size(pos2(bar_x, rect.top() + 7.0), vec2(2.0, 18.0)), 0.0, Color32::WHITE);
  } else if hovered {
    p.rect_filled(rect, theme::RADIUS, theme::WASH);
  }
  let ink = if selected || hovered { Color32::WHITE } else { theme::SIDEBAR_INK };
  let ready = page.is_ready();
  let ink = if ready { ink } else { theme::fade(ink, 0.7) };
  let icon_x = if rtl { rect.right() - 16.0 } else { rect.left() + 16.0 };
  icons::paint(p, Rect::from_center_size(pos2(icon_x, rect.center().y), vec2(15.0, 15.0)), page.icon(), ink);
  let font = FontId::new(14.0, if selected { theme::medium() } else { egui::FontFamily::Proportional });
  let text_pos = if rtl { pos2(rect.right() - 32.0, rect.center().y) } else { pos2(rect.left() + 32.0, rect.center().y) };
  let align = if rtl { Align2::RIGHT_CENTER } else { Align2::LEFT_CENTER };
  p.text(text_pos, align, page.display_label(), font, ink);
  if !ready {
    let badge_edge = if rtl { rect.left() + 6.0 } else { rect.right() - 6.0 };
    widgets::badge(p, ui, pos2(badge_edge, rect.center().y), i18n::t("Soon"), theme::FAINT);
  }
  let accessible = i18n::tl(page.label()).to_owned();
  resp.widget_info(move || egui::WidgetInfo::selected(egui::WidgetType::Button, true, selected, accessible.clone()));
  resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked()
}

fn link_row(ui: &mut Ui, label: &str, icon: Icon) -> bool {
  let (rect, resp) = ui.allocate_exact_size(vec2(ui.available_width(), ROW_HEIGHT), Sense::click());
  let hovered = resp.hovered();
  let rtl = i18n::is_rtl();
  let p = ui.painter();
  if hovered {
    p.rect_filled(rect, theme::RADIUS, theme::WASH);
  }
  let ink = if hovered { Color32::WHITE } else { theme::SIDEBAR_INK };
  let icon_x = if rtl { rect.right() - 16.0 } else { rect.left() + 16.0 };
  icons::paint(p, Rect::from_center_size(pos2(icon_x, rect.center().y), vec2(15.0, 15.0)), icon, ink);
  let text_pos = if rtl { pos2(rect.right() - 32.0, rect.center().y) } else { pos2(rect.left() + 32.0, rect.center().y) };
  let align = if rtl { Align2::RIGHT_CENTER } else { Align2::LEFT_CENTER };
  p.text(text_pos, align, i18n::t(label), FontId::new(14.0, egui::FontFamily::Proportional), ink);
  let ext_x = if rtl { rect.left() + 12.0 } else { rect.right() - 12.0 };
  icons::paint(p, Rect::from_center_size(pos2(ext_x, rect.center().y), vec2(11.0, 11.0)), Icon::ExternalLink, theme::FAINT);
  let accessible = i18n::tl(label).to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, true, accessible.clone()));
  resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked()
}

fn account_row(ui: &mut Ui, name: &str, credits: Option<u64>) -> egui::Response {
  let (rect, resp) = ui.allocate_exact_size(vec2(ui.available_width(), 46.0), Sense::click());
  let hovered = resp.hovered();
  let rtl = i18n::is_rtl();
  let p = ui.painter();
  p.rect(rect, theme::RADIUS, if hovered { theme::WASH_HOVER } else { theme::WASH }, theme::hairline(), egui::StrokeKind::Inside);
  let avatar_x = if rtl { rect.right() - 22.0 } else { rect.left() + 22.0 };
  let avatar = Rect::from_center_size(pos2(avatar_x, rect.center().y), vec2(28.0, 28.0));
  p.circle_filled(avatar.center(), 14.0, theme::ACCENT);
  let initial = name.chars().next().map(|c| c.to_uppercase().to_string()).unwrap_or_default();
  p.text(avatar.center(), Align2::CENTER_CENTER, initial, FontId::new(13.0, theme::semibold()), Color32::WHITE);
  let text_x = if rtl { avatar.left() - 10.0 } else { avatar.right() + 10.0 };
  let align = if rtl { Align2::RIGHT_CENTER } else { Align2::LEFT_CENTER };
  p.text(pos2(text_x, rect.center().y - 8.0), align, name, FontId::new(13.5, theme::medium()), theme::INK);
  let sub = credits.map_or_else(|| i18n::t("Account").to_owned(), |c| i18n::fmt("{count} credits", &[("count", &group_thousands(c))]));
  p.text(pos2(text_x, rect.center().y + 9.0), align, sub, FontId::new(11.5, egui::FontFamily::Proportional), theme::MUTED);
  let gear_x = if rtl { rect.left() + 16.0 } else { rect.right() - 16.0 };
  icons::paint(p, Rect::from_center_size(pos2(gear_x, rect.center().y), vec2(14.0, 14.0)), Icon::Settings, theme::DIM);
  let accessible = i18n::tl("Settings").to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, true, accessible.clone()));
  resp.on_hover_cursor(egui::CursorIcon::PointingHand).on_hover_text(i18n::t("Settings"))
}

/// The feed toggles a page's header shows.
pub struct FeedToggles {
  pub mode: ViewMode,
  pub selecting: bool,
  /// Shown on pages with videos (`GalleryAutoplayToggle`).
  pub autoplay: Option<bool>,
}

/// The content panel's header: breadcrumbs, and the select, previews and grid/list toggles on
/// feed pages.
pub fn page_header(ui: &mut Ui, page: Page, feed_toggles: Option<FeedToggles>) -> Option<ShellAction> {
  let mut action = None;
  let rtl = i18n::is_rtl();
  let rect = ui.max_rect();
  ui.painter().hline(rect.x_range(), rect.bottom() - 0.5, theme::hairline());
  let layout = if rtl { egui::Layout::right_to_left(egui::Align::Center) } else { egui::Layout::left_to_right(egui::Align::Center) };
  let mut bar = ui.new_child(egui::UiBuilder::new().max_rect(rect.shrink2(vec2(20.0, 0.0))).layout(layout));
  let ui = &mut bar;
  ui.spacing_mut().item_spacing.x = 8.0;
  let (section, leaf) = page.crumbs();
  widgets::hud(ui, i18n::t(section), theme::MUTED);
  let (chev, _) = ui.allocate_exact_size(vec2(10.0, 10.0), Sense::hover());
  icons::paint(ui.painter(), chev, if rtl { Icon::ChevronLeft } else { Icon::ChevronRight }, theme::FAINT);
  let galley = widgets::caps(ui, i18n::t(leaf), theme::HUD_SIZE, theme::mono(), theme::HUD_SPACING, theme::BG);
  let (crumb, _) = ui.allocate_exact_size(galley.size() + vec2(12.0, 8.0), Sense::hover());
  ui.painter().rect_filled(crumb, 0.0, theme::INK);
  ui.painter().galley(crumb.center() - galley.size() / 2.0, galley, theme::BG);
  if let Some(t) = feed_toggles {
    let toggle_layout = if rtl { egui::Layout::left_to_right(egui::Align::Center) } else { egui::Layout::right_to_left(egui::Align::Center) };
    ui.with_layout(toggle_layout, |ui| {
      if let Some(m) = view_toggle(ui, t.mode) {
        action = Some(ShellAction::SetViewMode(m));
      }
      if let Some(playing) = t.autoplay {
        // Right-to-left: stills first so "play" ends up on the left.
        if let Some(i) = segmented(ui, &[(Icon::Image, "Still thumbnails", !playing), (Icon::Play, "Play video previews", playing)]) {
          action = Some(ShellAction::SetAutoplay(i == 1));
        }
      }
      if segmented(ui, &[(Icon::SquareCheck, if t.selecting { "Exit selection" } else { "Select items" }, t.selecting)]).is_some() {
        action = Some(ShellAction::ToggleSelect);
      }
    });
  }
  action
}

fn credits_pill(ui: &mut Ui, credits: u64) -> egui::Response {
  let text = group_thousands(credits);
  let galley = ui.painter().layout_no_wrap(text, FontId::new(13.0, theme::semibold()), theme::INK);
  let (rect, resp) = ui.allocate_exact_size(vec2(galley.size().x + 40.0, 30.0), Sense::click());
  let hovered = resp.hovered();
  ui.painter().rect(rect, theme::RADIUS, if hovered { theme::WASH_HOVER } else { theme::WASH }, theme::hairline(), egui::StrokeKind::Inside);
  icons::paint(ui.painter(), Rect::from_center_size(pos2(rect.left() + 16.0, rect.center().y), vec2(14.0, 14.0)), Icon::Coins, theme::INK);
  ui.painter().galley(pos2(rect.left() + 28.0, rect.center().y - galley.size().y / 2.0), galley, theme::INK);
  let tip = i18n::t("Your credit balance · Buy credits");
  let accessible = i18n::tl("Your credit balance · Buy credits").to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, true, accessible.clone()));
  resp.on_hover_text(tip).on_hover_cursor(egui::CursorIcon::PointingHand)
}

fn account_menu(ui: &mut Ui, account: &Account<'_>) -> Option<ShellAction> {
  let name = account.display_name.or(account.username).unwrap_or_else(|| i18n::t("Account"));
  let (rect, resp) = ui.allocate_exact_size(vec2(30.0, 30.0), Sense::click());
  ui.painter().circle(rect.center(), 15.0, theme::ACCENT, Stroke::new(if resp.hovered() { 2.0 } else { 0.0 }, Color32::WHITE));
  let initial = name.chars().next().map(|c| c.to_uppercase().to_string()).unwrap_or_default();
  ui.painter().text(rect.center(), Align2::CENTER_CENTER, initial, FontId::new(13.0, theme::semibold()), Color32::WHITE);
  let resp = resp.on_hover_cursor(egui::CursorIcon::PointingHand);
  let mut action = None;
  let align = if i18n::is_rtl() { egui::RectAlign::BOTTOM_START } else { egui::RectAlign::BOTTOM_END };
  egui::Popup::menu(&resp).frame(widgets::popover_frame()).align(align).show(|ui| {
    ui.set_min_width(200.0);
    ui.label(egui::RichText::new(name).size(13.0).family(theme::semibold()));
    if let Some(u) = account.username {
      ui.label(egui::RichText::new(format!("@{u}")).size(11.5).color(theme::MUTED));
    }
    ui.add_space(4.0);
    if widgets::menu_row(ui, widgets::RowLead::Icon(Icon::Settings), i18n::t("Settings"), None, false, false, false).clicked() {
      action = Some(ShellAction::OpenSettings);
    }
    if widgets::menu_row(ui, widgets::RowLead::Icon(Icon::LogOut), i18n::t("Log out"), None, false, false, false).clicked() {
      action = Some(ShellAction::SignOut);
    }
  });
  action
}

/// The grid / list toggle (`GalleryViewToggle`).
fn view_toggle(ui: &mut Ui, mode: ViewMode) -> Option<ViewMode> {
  // Right-to-left: list first so grid ends up on the left.
  let picked = segmented(ui, &[(Icon::List, "List view", mode == ViewMode::List), (Icon::LayoutGrid, "Grid view", mode == ViewMode::Grid)])?;
  Some(if picked == 0 { ViewMode::List } else { ViewMode::Grid })
}

/// A segmented group of 24 px icon buttons; returns the clicked index.
fn segmented(ui: &mut Ui, buttons: &[(Icon, &str, bool)]) -> Option<usize> {
  let w = 4.0 + 26.0 * buttons.len() as f32;
  let (rect, _) = ui.allocate_exact_size(vec2(w, 30.0), Sense::hover());
  ui.painter().rect(rect, theme::RADIUS, Color32::from_white_alpha(10), Stroke::new(1.0, Color32::from_white_alpha(20)), egui::StrokeKind::Inside);
  let mut clicked = None;
  for (i, (icon, tip_key, active)) in buttons.iter().enumerate() {
    let b = Rect::from_min_size(pos2(rect.left() + 3.0 + 26.0 * i as f32, rect.top() + 3.0), vec2(24.0, 24.0));
    let resp = ui.interact(b, Id::new(("segmented", *tip_key)), Sense::click()).on_hover_text(i18n::t(tip_key)).on_hover_cursor(egui::CursorIcon::PointingHand);
    let accessible = i18n::tl(tip_key).to_owned();
    resp.widget_info(move || egui::WidgetInfo::selected(egui::WidgetType::Button, true, *active, accessible.clone()));
    if *active || resp.hovered() {
      ui.painter().rect_filled(b, theme::RADIUS, theme::WASH_HOVER);
    }
    icons::paint(ui.painter(), b.shrink(5.0), *icon, if *active { Color32::WHITE } else { theme::DIM });
    if resp.clicked() {
      clicked = Some(i);
    }
  }
  clicked
}

/// `1234567` → `1,234,567` (`toLocaleString`).
pub fn group_thousands(n: u64) -> String {
  let s = n.to_string();
  let mut out = String::with_capacity(s.len() + s.len() / 3);
  for (i, c) in s.chars().enumerate() {
    if i > 0 && (s.len() - i).is_multiple_of(3) {
      out.push(',');
    }
    out.push(c);
  }
  out
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn groups_thousands_like_to_locale_string() {
    assert_eq!(group_thousands(5663), "5,663");
    assert_eq!(group_thousands(1_234_567), "1,234,567");
    assert_eq!(group_thousands(15), "15");
  }

  #[test]
  fn rtl_sidebar_and_header_mirror_layout() {
    let ctx = egui::Context::default();
    theme::apply(&ctx);
    let mark = ctx.load_texture("test-mark", egui::ColorImage::filled([2, 2], Color32::WHITE), Default::default());
    let before = i18n::current();
    i18n::set_current(i18n::Lang::Hebrew);
    let mut sidebar_rect = Rect::NOTHING;
    let mut out = ctx.run_ui(egui::RawInput { screen_rect: Some(Rect::from_min_size(pos2(0.0, 0.0), vec2(1200.0, 800.0))), ..Default::default() }, |ui| {
      let account = Account { username: None, display_name: None, credits: None };
      egui::Panel::top("titlebar-test").exact_size(TITLEBAR_HEIGHT).resizable(false).show(ui, |ui| {
        let _ = titlebar(ui, &account, &mark);
      });
      let panel = if i18n::is_rtl() { egui::Panel::right("sidebar-test") } else { egui::Panel::left("sidebar-test") };
      let resp = panel.exact_size(SIDEBAR_WIDTH).resizable(false).show(ui, |ui| {
        let _ = sidebar(ui, Page::CreateImage, &account);
      });
      sidebar_rect = resp.response.rect;
      egui::CentralPanel::default().show(ui, |ui| {
        let _ = page_header(ui, Page::CreateImage, Some(FeedToggles { mode: ViewMode::Grid, selecting: false, autoplay: None }));
      });
    });
    out.textures_delta.clear();
    i18n::set_current(before);
    assert!(sidebar_rect.left() > 900.0, "expected RTL sidebar on right side of 1200 px window, got {sidebar_rect:?}");
  }
}
