use crate::api::api_types::image_input_object_id::ImageInputObjectId;
use crate::api::api_types::meta_world_object_id::MetaWorldObjectId;
use crate::api::api_types::pano_object_id::PanoObjectId;
use crate::api::api_types::run_object_id::RunObjectId;
use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::api_types::upload_object_id::UploadObjectId;
use crate::api::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use crate::api::utils::upload_id_to_image_url::upload_id_to_image_url;
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use chrono::Utc;
use http_headers::names::{PRIORITY, SEC_FETCH_DEST, SEC_FETCH_MODE, SEC_FETCH_SITE, SEC_GPC};
use http_headers::values::accept::ACCEPT_ALL;
use http_headers::values::cache_control::CACHE_CONTROL_NO_CACHE;
use http_headers::values::connection::CONNECTION_KEEP_ALIVE;
use http_headers::values::content_type::CONTENT_TYPE_APPLICATION_JSON;
use http_headers::values::pragma::PRAGMA_NO_CACHE;
use http_headers::values::priority::PRIORITY_4;
use http_headers::values::sec::{SEC_FETCH_DEST_EMPTY, SEC_FETCH_MODE_CORS, SEC_FETCH_SITE_CROSS_SITE};
use http_headers::values::te::TE_TRAILERS;
use indexmap::IndexMap;
use log::{debug, error};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, AUTHORIZATION, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, ORIGIN, PRAGMA, REFERER, TE};
use wreq::Client;
use wreq_util::Emulation;

const BASE_URL : &str = "https://api.worldlabs.ai/api/v1/objects";

// Note: WorldLabs is phasing out the old URL scheme:
// const BASE_URL : &str = "https://marble2-kgw-prod-iac1.wlt-ai.art/api/v1/objects";

fn get_url(run_id: &RunObjectId) -> String {
  format!("{}/{}", BASE_URL, run_id.0)
}

pub struct UpdateRunObjectWithUploadArgs<'a> {
  pub cookies: &'a WorldLabsCookies,
  pub bearer_token: &'a WorldLabsBearerToken,

  pub payload_args: UpdateRunObjectWithUploadPayloadArgs<'a>,

  pub request_timeout: Option<Duration>,
}

pub struct UpdateRunObjectWithUploadPayloadArgs<'a> {
  pub run_id: &'a RunObjectId,
  pub run_created_at_timestamp: u64,

  // eg. https://cdn.marble.worldlabs.ai/object/13ca760c-8ef9-4bf5-acc3-5a507fad3abf/asset.jpg
  pub image_upload_url: &'a str,

  pub image_input_id: &'a ImageInputObjectId,
  pub pano_id: &'a PanoObjectId,
  pub meta_world_id: &'a MetaWorldObjectId,
}

pub struct UpdateRunObjectWithUploadResponse {
  pub image_input_id: ImageInputObjectId,
  pub pano_id: PanoObjectId,
  pub meta_world_id: MetaWorldObjectId,
  pub run_updated_timestamp: u64,
}

/// Marble Image-to-World
/// This request patches an object. Seems to update it with the attached files.
/// Request #6 (of ~10)
pub async fn update_run_object_with_upload(args: UpdateRunObjectWithUploadArgs<'_>) -> Result<UpdateRunObjectWithUploadResponse, WorldLabsError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| WorldLabsClientError::WreqClientError(err))?;

  let url = get_url(args.payload_args.run_id);

  debug!("Requesting URL: {}", url);

  let mut request_builder = client.patch(url)
      .header(ACCEPT, ACCEPT_ALL)
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(REFERER, REFERER_VALUE)
      .header(CONTENT_TYPE, CONTENT_TYPE_APPLICATION_JSON)
      .header(AUTHORIZATION, args.bearer_token.to_bearer_token_header_string())
      .header(ORIGIN, ORIGIN_VALUE)
      .header(SEC_GPC, "1")
      .header(CONNECTION, CONNECTION_KEEP_ALIVE)
      .header(SEC_FETCH_DEST, SEC_FETCH_DEST_EMPTY)
      .header(SEC_FETCH_MODE, SEC_FETCH_MODE_CORS)
      .header(SEC_FETCH_SITE, SEC_FETCH_SITE_CROSS_SITE)
      .header(PRIORITY, PRIORITY_4)
      .header(PRAGMA, PRAGMA_NO_CACHE)
      .header(CACHE_CONTROL, CACHE_CONTROL_NO_CACHE)
      .header(TE, TE_TRAILERS);

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let payload = RawRequest::from_args(&args.payload_args);
  let updated_at = payload.object.metadata.updated_at;

  let http_request = request_builder.json(&payload)
      .build()
      .map_err(|err| {
        error!("Error building request: {:?}", err);
        WorldLabsClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Error during request execution: {:?}", err);
        WorldLabsGenericApiError::WreqError(err)
      })?;

  let status = response.status();

  let response_body = response.text()
      .await
      .map_err(|err| {
        error!("Error reading response body: {:?}", err);
        WorldLabsGenericApiError::WreqError(err)
      })?;

  // TODO: Handle errors (Cloudflare, Grok, etc.)
  if !status.is_success() {
    error!("Request returned an error (code {}) : {:?}", status.as_u16(), response_body);
    //return Err(classify_general_http_status_code_and_body(status, response_body));
    return Err(WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody { status_code: status, body: response_body}.into())
  }

  debug!("Response body (200): {}", response_body);

  let _response : RawResponse = serde_json::from_str(&response_body)
      .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(UpdateRunObjectWithUploadResponse {
    image_input_id: args.payload_args.image_input_id.clone(),
    pano_id: args.payload_args.pano_id.clone(),
    meta_world_id: args.payload_args.meta_world_id.clone(),
    run_updated_timestamp: updated_at,
  })
}

#[derive(Serialize)]
struct RawRequest {
  pub object: ObjectDef,
  pub update_mask: Vec<String>,
}

impl Default for RawRequest {
  fn default() -> Self {
    let now = Utc::now();
    let now = now.timestamp_millis().unsigned_abs();
    Self {
      object: ObjectDef {
        metadata: ObjectMetadata {
          version: "0.0.1".to_string(),
          created_at: now,
          updated_at: now,
          uses_advanced_editing: false,
          draft_mode: false,
          nodes: IndexMap::new(),
        }
      },
      update_mask: vec!["metadata".to_string()]
    }
  }
}

impl RawRequest {
  pub fn from_args(args: &UpdateRunObjectWithUploadPayloadArgs) -> Self {
    let mut request = RawRequest::default();
    request.add_image_input_node({
      let mut node = ImageInputNode::default();
      node.id = args.image_input_id.to_string();
      node.source.image_url = args.image_upload_url.to_string();
      node
    });
    request.add_pano_node({
      let mut node = PanoNode::default();
      node.id = args.pano_id.to_string();
      node.parent_id= Some(args.image_input_id.to_string());
      node
    });
    request.add_world_node({
      let mut node = WorldNode::default();
      node.id = args.meta_world_id.to_string();
      node.parent_id= Some(args.pano_id.to_string());
      node
    });
    request.set_updated_now();
    request
  }

  pub fn add_image_input_node(&mut self, mut node: ImageInputNode) {
    node.created_at = self.object.metadata.updated_at;
    self.object.metadata.nodes.insert(node.id.clone(), NodeValue::ImageInput(node));
  }

  pub fn add_pano_node(&mut self, mut node: PanoNode) {
    node.created_at = self.object.metadata.updated_at;
    self.object.metadata.nodes.insert(node.id.clone(), NodeValue::Pano(node));
  }

  pub fn add_world_node(&mut self, mut node: WorldNode) {
    node.created_at = self.object.metadata.updated_at;
    self.object.metadata.nodes.insert(node.id.clone(), NodeValue::World(node));
  }

  pub fn set_updated_now(&mut self) {
    let now = Utc::now();
    let now = now.timestamp_millis().unsigned_abs();
    self.set_updated_at(now);
  }

  pub fn set_updated_at(&mut self, updated_at: u64) {
    self.object.metadata.updated_at = updated_at;
    for (_key, node) in self.object.metadata.nodes.iter_mut() {
      match node {
        NodeValue::ImageInput(value) => value.created_at = updated_at,
        NodeValue::Pano(value) => value.created_at = updated_at,
        NodeValue::World(value) => value.created_at = updated_at,
      }
    }
  }
}

#[derive(Serialize)]
struct ObjectDef {
  pub metadata: ObjectMetadata,
}

#[derive(Serialize)]
struct ObjectMetadata {
  pub version: String,

  #[serde(rename = "createdAt")]
  pub created_at: u64,

  #[serde(rename = "updatedAt")]
  pub updated_at: u64,

  #[serde(rename = "usesAdvancedEditing")]
  pub uses_advanced_editing: bool,

  #[serde(rename = "draftMode")]
  pub draft_mode: bool,

  /// Polymorphic set of ID-to-object mappings.
  /// NB: IndexMap maintains insertion order.
  pub nodes: IndexMap<String, NodeValue>,
}

#[derive(Serialize)]
#[serde(untagged)]
//#[serde(tag = "type", content = "value")]
enum NodeValue {
  ImageInput(ImageInputNode),
  Pano(PanoNode),
  World(WorldNode),
}

#[derive(Serialize, Default)]
struct ImageInputNode {
  pub id: String,
  pub r#type: TypeInput,
  #[serde(rename = "parentId")]
  pub parent_id: Option<String>,
  pub source: ImageInputNodeSource,
  #[serde(rename = "createdAt")]
  pub created_at: u64,
}

#[derive(Serialize, Default)]
struct ImageInputNodeSource {
  pub r#type: TypeImage,
  pub image_url: String,
}

#[derive(Serialize, Default)]
enum TypeInput {
  #[serde(rename = "input")]
  #[default]
  Input
}

#[derive(Serialize, Default)]
enum TypeImage {
  #[serde(rename = "image")]
  #[default]
  Image
}

#[derive(Serialize, Default)]
enum StatusPending {
  #[serde(rename = "pending")]
  #[default]
  Pending
}

impl ImageInputNode {
  pub fn with_id(id: &str) -> Self{
    Self {
      id: id.to_string(),
      ..Default::default()
    }
  }
}

#[derive(Serialize, Default)]
struct PanoNode {
  pub id: String,
  pub r#type: TypePano,
  #[serde(rename = "parentId")]
  pub parent_id: Option<String>,
  pub source: PanoNodeSource,
  #[serde(rename = "createdAt")]
  pub created_at: u64,
}

#[derive(Serialize, Default)]
struct PanoNodeSource {
  pub r#type: TypeGenerateWorld,
  pub world_id: StatusPending,
  pub status: StatusPending,
}

#[derive(Serialize, Default)]
enum TypePano {
  #[serde(rename = "pano")]
  #[default]
  Pano
}

#[derive(Serialize, Default)]
enum TypeGenerateWorld {
  #[serde(rename = "generate_world")]
  #[default]
  GenerateWorld
}

impl PanoNode {
  pub fn with_id(id: &str) -> Self{
    Self {
      id: id.to_string(),
      ..Default::default()
    }
  }
}

#[derive(Serialize, Default)]
struct WorldNode {
  pub id: String,
  pub r#type: TypeWorld,
  #[serde(rename = "parentId")]
  pub parent_id: Option<String>,
  pub source: WorldNodeSource,
  #[serde(rename = "createdAt")]
  pub created_at: u64,
}

#[derive(Serialize, Default)]
struct WorldNodeSource {
  pub r#type: TypeGenerateWorld,
  pub world_id: StatusPending,
  pub posed_cubemaps_url: String,
  pub minimap_url: String,
  pub minimap_metadata: String,
  pub status: StatusPending,
}

#[derive(Serialize, Default)]
enum TypeWorld {
  #[serde(rename = "world")]
  #[default]
  World
}

impl WorldNode {
  pub fn with_id(id: &str) -> Self{
    Self {
      id: id.to_string(),
      ..Default::default()
    }
  }
}

#[derive(Deserialize)]
struct RawResponse {
  pub id: String,
}

#[cfg(test)]
mod tests {
  use crate::api::api_types::image_input_object_id::ImageInputObjectId;
  use crate::api::api_types::meta_world_object_id::MetaWorldObjectId;
  use crate::api::api_types::pano_object_id::PanoObjectId;
  use crate::api::api_types::run_object_id::RunObjectId;
  use crate::api::requests::objects::update_run_object_with_upload::{RawRequest, UpdateRunObjectWithUploadPayloadArgs};

  #[test]
  fn request_default() {
    let request = RawRequest::default();
    assert_eq!(request.object.metadata.version, "0.0.1");
    assert!(request.object.metadata.created_at > 10000);
    assert!(request.object.metadata.updated_at > 10000);
  }

  #[test]
  fn json() {
    let run_id = RunObjectId::from_str("79795b32-e44d-4333-bac1-05b2c9a3ea12");
    let image_input_id = ImageInputObjectId::from_str("bc17252b-811e-49d7-be3e-b7c538df9d30");
    let pano_id = PanoObjectId::from_str("82f6b488-8afe-4311-9022-80ad5789ad92");
    let world_id = MetaWorldObjectId::from_str("f08ec501-601c-47c6-a104-402d1820b8f0");

    let args = UpdateRunObjectWithUploadPayloadArgs {
      run_created_at_timestamp: 1234,
      image_upload_url: "https://todo.com",
      run_id: &run_id,
      image_input_id: &image_input_id,
      pano_id: &pano_id,
      meta_world_id: &world_id,
    };

    let request = RawRequest::from_args(&args);

    let json = serde_json::to_string_pretty(&request).unwrap();
    println!("{}", json);

    assert_eq!(json, r#"{"type":"abcxyz_image_input_id","value":"image_input_id"}"#);
  }
}
