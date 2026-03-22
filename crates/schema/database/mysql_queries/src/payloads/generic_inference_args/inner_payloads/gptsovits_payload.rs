use enums_db::common::visibility::Visibility;

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct GptSovitsPayload {
  #[serde(rename = "ti")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_title: Option<String>,

  #[serde(rename = "de")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_description: Option<String>,

  #[serde(rename = "cv")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub creator_visibility: Option<Visibility>,

  // For free users, we may occasionally append an advertisement
  // to sign in or upgrade.
  #[serde(rename = "a")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub append_advertisement: Option<bool>,
}

