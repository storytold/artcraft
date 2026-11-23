#[expect(clippy::module_inception, reason = "Preserve the existing public module path")]
mod download_extension;
pub mod extract_download_extension_from_url;

pub use download_extension::DownloadExtension;
