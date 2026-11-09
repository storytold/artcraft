//! The pages around the create tools: Home, the Library, and a placeholder for tools that are
//! still web-only.

use egui::{Color32, Id, Rect, Sense, Ui, pos2, vec2};

use crate::feed::grid::{self, FeedAction, FeedView};
use crate::feed::store::FeedStore;
use crate::feed::types::MediaKind;
use crate::pages::common::{AppRequest, Env, FeedKey};
use crate::shell::{Page, WEB_APP_URL};
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::widgets;

/// Home: what ArtCraft does and where to start. Returns a page to open.
pub fn home(ui: &mut Ui, signed_in: bool, requests: &mut Vec<AppRequest>) -> Option<Page> {
  let mut open = None;
  let area = ui.max_rect();
  let width = (area.width() - 64.0).min(960.0);
  let mut col = ui.new_child(egui::UiBuilder::new().max_rect(Rect::from_min_size(pos2(area.center().x - width / 2.0, area.top() + 56.0), vec2(width, area.height() - 56.0))));
  let ui = &mut col;
  widgets::hud(ui, "01 / ArtCraft", theme::FAINT);
  ui.add_space(10.0);
  ui.label(widgets::heading("Capable tools for artists.", 52.0));
  ui.add_space(10.0);
  ui.label(egui::RichText::new("Generate images, videos and audio with the best models, steer them with references and keyframes, and keep everything in your library.").size(17.0).color(theme::MUTED));
  ui.add_space(28.0);
  ui.horizontal(|ui| {
    ui.spacing_mut().item_spacing.x = 16.0;
    let cards = [(Page::CreateImage, Icon::Image, "Create Image", "Describe anything. See it in seconds."), (Page::CreateVideo, Icon::Video, "Create Video", "Describe a scene. See it in motion."), (Page::CreateAudio, Icon::Music, "Create Audio", "Describe a song, a sound, or a sample.")];
    let card_w = (width - 16.0 * (cards.len() - 1) as f32) / cards.len() as f32;
    for (page, icon, title, text) in cards {
      if card(ui, card_w, icon, title, text) {
        open = Some(page);
      }
    }
  });
  if !signed_in {
    ui.add_space(24.0);
    if widgets::button(ui, Some(Icon::LogIn), "Sign in to start", widgets::Kind::Primary, 0.0, 44.0).clicked() {
      requests.push(AppRequest::SignIn);
    }
  }
  open
}

fn card(ui: &mut Ui, width: f32, icon: Icon, title: &str, text: &str) -> bool {
  let (rect, resp) = ui.allocate_exact_size(vec2(width, 180.0), Sense::click());
  let hovered = resp.hovered();
  let p = ui.painter();
  p.rect(rect, 0.0, if hovered { Color32::from_rgba_unmultiplied(242, 241, 238, 8) } else { Color32::from_rgba_unmultiplied(242, 241, 238, 4) }, egui::Stroke::new(1.0, if hovered { theme::LINE_STRONG } else { theme::LINE }), egui::StrokeKind::Inside);
  widgets::corner_marks(p, rect);
  icons::paint(p, Rect::from_min_size(rect.min + vec2(24.0, 24.0), vec2(26.0, 26.0)), icon, theme::INK);
  let body = Rect::from_min_max(pos2(rect.left() + 24.0, rect.top() + 76.0), pos2(rect.right() - 24.0, rect.bottom() - 16.0));
  let mut inner = ui.new_child(egui::UiBuilder::new().max_rect(body).layout(egui::Layout::top_down(egui::Align::Min)));
  inner.label(widgets::heading(title, 26.0));
  inner.add_space(4.0);
  inner.label(egui::RichText::new(text).size(14.0).color(theme::MUTED));
  icons::paint(ui.painter(), Rect::from_center_size(pos2(rect.right() - 28.0, rect.top() + 36.0), vec2(16.0, 16.0)), Icon::ChevronRight, if hovered { theme::INK } else { theme::FAINT });
  resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked()
}

/// The Library: everything generated, newest first.
pub fn library(ui: &mut Ui, env: &mut Env<'_>, feed: &mut FeedStore) {
  let area = ui.max_rect();
  if !env.signed_in {
    placeholder(ui, area, "Library", "Sign in to see everything you've generated.", None);
    return;
  }
  if !feed.library_started() {
    env.requests.push(AppRequest::LoadMoreLibrary(FeedKey::Library));
  }
  if !feed.has_content() && !feed.loading {
    placeholder(ui, area, "Library", "Your generations will appear here.", None);
    return;
  }
  let view = FeedView { id: Id::new("library-feed"), mode: env.view_mode, pending: &[], failed: &[], items: &feed.items, has_more: feed.has_more, loading: feed.loading, selecting: feed.selecting, selected: &feed.selected, last_viewed: feed.last_viewed.as_deref(), prompts: env.prompts, make_video: true, autoplay: env.autoplay, bottom_padding: 24.0 };
  let mut child = ui.new_child(egui::UiBuilder::new().max_rect(area.shrink2(vec2(12.0, 0.0)).with_min_y(area.top() + 2.0)));
  for action in grid::show(&mut child, &view, env.cache, env.ratios, env.audio, env.catalog) {
    match action {
      FeedAction::Open(token) => {
        let kind = feed.find(&token).map_or(MediaKind::Image, |i| i.kind);
        feed.last_viewed = Some(token.clone());
        env.requests.push(AppRequest::Open { kind, token });
      },
      FeedAction::ToggleSelect(token) => {
        if !feed.selected.remove(&token) {
          feed.selected.insert(token);
        }
      },
      FeedAction::LoadMore => env.requests.push(AppRequest::LoadMoreLibrary(FeedKey::Library)),
      FeedAction::Recreate(token) => {
        let kind = feed.find(&token).map_or(MediaKind::Image, |i| i.kind);
        env.requests.push(AppRequest::Recreate { kind, token });
      },
      FeedAction::MakeVideo(token) => env.requests.push(AppRequest::MakeVideo { token }),
      FeedAction::Share(token) => env.requests.push(AppRequest::Share(token)),
      FeedAction::Download(token) => env.requests.push(AppRequest::Download(vec![token])),
      FeedAction::CopyPrompt(text) => env.requests.push(AppRequest::CopyText(text)),
      FeedAction::DismissFailed(_) => {},
    }
  }
  if feed.selecting {
    crate::pages::common::selection_bar(ui, area, 24.0, feed, MediaKind::Image, env.requests);
  }
}

/// A tool that hasn't come to the native app yet.
pub fn coming_soon(ui: &mut Ui, page: Page) {
  let area = ui.max_rect();
  placeholder(ui, area, page.label(), "This tool is coming to the native app. You can use it in the ArtCraft web app in the meantime.", Some(format!("{WEB_APP_URL}{}", page.web_path())));
}

/// The bordered, corner-marked splash used for empty and placeholder pages.
fn placeholder(ui: &mut Ui, area: Rect, title: &str, text: &str, web_url: Option<String>) {
  let width = (area.width() - 64.0).min(768.0);
  let section = Rect::from_center_size(area.center(), vec2(width, if web_url.is_some() { 240.0 } else { 180.0 }));
  ui.painter().rect(section, 0.0, Color32::from_rgba_unmultiplied(242, 241, 238, 4), egui::Stroke::new(1.0, Color32::from_rgba_unmultiplied(242, 241, 238, 51)), egui::StrokeKind::Inside);
  widgets::corner_marks(ui.painter(), section);
  let mut child = ui.new_child(egui::UiBuilder::new().max_rect(section.shrink2(vec2(40.0, 44.0))));
  child.label(widgets::heading(title, 44.0));
  child.add_space(10.0);
  child.label(egui::RichText::new(text).size(15.0).color(theme::MUTED));
  if let Some(url) = web_url {
    child.add_space(20.0);
    if widgets::button(&mut child, Some(Icon::ExternalLink), "Open in web app", widgets::Kind::Primary, 0.0, 40.0).clicked() {
      child.ctx().open_url(egui::OpenUrl::new_tab(url));
    }
  }
}
