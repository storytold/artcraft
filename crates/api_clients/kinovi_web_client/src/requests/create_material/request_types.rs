use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Debug)]
pub (super) struct BatchRequest {
  #[serde(rename = "0")]
  pub zero: BatchRequestInner,
}

#[derive(Serialize, Debug)]
pub (super) struct BatchRequestInner {
  pub json: MaterialJson,
  /// superjson type annotations. Only present for photos, where the site
  /// marks the null `duration` as `undefined`:
  /// `{"values":{"duration":["undefined"]},"v":1}`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub meta: Option<MaterialMeta>,
}

#[derive(Serialize, Debug)]
pub (super) struct MaterialJson {
  pub url: String,
  /// "video" or "photo".
  pub format: &'static str,
  pub width: u32,
  pub height: u32,
  /// Duration in whole seconds for videos; null for photos (annotated as
  /// `undefined` via the meta block).
  pub duration: Option<u64>,
  /// File size in bytes.
  pub size: u64,
}

#[derive(Serialize, Debug)]
pub (super) struct MaterialMeta {
  pub values: MaterialMetaValues,
  pub v: u8,
}

#[derive(Serialize, Debug)]
pub (super) struct MaterialMetaValues {
  pub duration: [&'static str; 1],
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseItem {
  pub result: BatchResponseResult,
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseResult {
  pub data: BatchResponseData,
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseData {
  pub json: super::create_material::KinoviMaterial,
}
