#[expect(clippy::module_inception, reason = "Preserve the existing public module path")]
pub mod extension;
pub mod extract_extension_from_url;
