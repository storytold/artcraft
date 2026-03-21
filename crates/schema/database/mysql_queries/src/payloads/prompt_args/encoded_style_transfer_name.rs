use enums_api::no_table::style_transfer::style_transfer_name::StyleTransferName;

/// We encode the style name as a string so that we don't accidentally break
/// forward/reverse compatibility as we remove styles.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EncodedStyleTransferName(pub String);

impl EncodedStyleTransferName {
  pub fn from_style_name(style_name: StyleTransferName) -> Self {
    EncodedStyleTransferName(style_name.to_str().to_string())
  }

  // NB: Fail open
  pub fn to_style_name(&self) -> Option<StyleTransferName> {
    StyleTransferName::from_str(&self.0).ok()
  }
}
