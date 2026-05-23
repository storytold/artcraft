use crate::datatypes::api::svg_path_data::SvgPathData;
use crate::error::grok_client_error::GrokClientError;
use crate::requests::index_page::utils::convert_verification_token_to_loading_anim::LoadingAnim;
use log::error;

pub fn select_svg_path_by_loading_anim(
  svg_paths: &[SvgPathData], 
  loading_anim: &LoadingAnim
) -> Result<SvgPathData, GrokClientError> {
  svg_paths.get(loading_anim.0)
      .map(|path| path.clone())
      .ok_or_else(|| {
        error!("There was not an SVG path data at index {} (array len {})", loading_anim.0, svg_paths.len());
        GrokClientError::ScriptSvgLogicOutOfDate
      })
}

// #[cfg(test)]
// mod tests {
//   #[test]
//   fn test() {
//   }
// }
