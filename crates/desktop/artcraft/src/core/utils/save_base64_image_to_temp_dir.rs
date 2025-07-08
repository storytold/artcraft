use crate::core::artcraft_error::ArtcraftError;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
use std::io::Write;
use tempfile::NamedTempFile;
use web_base64::web_base64_decode::web_base64_decode;

pub async fn save_base64_image_to_temp_dir(app_data_root: &AppDataRoot, base64_image: &str) -> Result<NamedTempFile, ArtcraftError> {
  let bytes = web_base64_decode(base64_image)?;

  let extension = MimetypeInfo::get_for_bytes(&bytes)
      .map(|info| info.file_extension())
      .flatten()
      .map(|ext| ext.extension_with_period().to_string())
      .unwrap_or_else(|| ".png".to_string());

  let mut file = app_data_root.temp_dir().new_named_temp_file_with_extension(&extension)?;

  file.write_all(bytes.as_ref())?;

  Ok(file) // NB: Must return TempFile to not drop / delete it
}
