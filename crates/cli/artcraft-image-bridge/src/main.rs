use artcraft_image_bridge::live_upload::LiveUploadClient;
use artcraft_image_bridge::Bridge;
use rmcp::{
  handler::server::wrapper::Parameters,
  model::{CallToolResult, ContentBlock},
  schemars, tool, tool_router,
  transport::stdio,
  ServiceExt,
};
use serde::Deserialize;
use std::{
  path::{Path, PathBuf},
  sync::{Arc, Mutex},
};

#[derive(Clone)]
struct ImageBridge {
  core: Arc<Mutex<Bridge>>,
  image_root: PathBuf,
  maybe_live_key: Option<PathBuf>,
}

#[derive(Deserialize, schemars::JsonSchema)]
struct ImagePath {
  path: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
struct ImportArgs {
  path: String,
  expected_sha256: String,
  request_id: String,
  /// Required for live uploads: user accepts remote storage and access by direct link.
  #[serde(default)]
  accept_remote_link_access: bool,
}

#[derive(Deserialize, schemars::JsonSchema)]
struct RequestId {
  request_id: String,
}

#[tool_router(server_handler)]
impl ImageBridge {
  #[tool(
    description = "Inspect one authorized local PNG/JPEG within the configured root. No network access.",
    annotations(read_only_hint = true, open_world_hint = false)
  )]
  fn artcraft_inspect_local_image(
    &self,
    Parameters(args): Parameters<ImagePath>,
  ) -> CallToolResult {
    result((|| {
      Ok(serde_json::to_value(
        self
          .core
          .lock()
          .map_err(|_| anyhow::anyhow!("Bridge unavailable"))?
          .inspect(Path::new(&args.path))?,
      )?)
    })())
  }

  #[tool(
    description = "Import an authorized PNG/JPEG. Default is disabled; --mock is offline. Explicit --live-key mode uploads to ArtCraft. Live requires accept_remote_link_access=true: private metadata does NOT prevent anonymous direct-link downloads. Only shareable artwork. No image generation. Keep the same request_id; unknown outcomes must not be retried with a new ID.",
    annotations(
      read_only_hint = false,
      destructive_hint = false,
      idempotent_hint = true,
      open_world_hint = true
    )
  )]
  async fn artcraft_import_local_image(
    &self,
    Parameters(args): Parameters<ImportArgs>,
  ) -> CallToolResult {
    if let Some(key) = &self.maybe_live_key {
      return result(self.import_live(key, args).await);
    }
    result((|| {
      Ok(serde_json::to_value(
        self
          .core
          .lock()
          .map_err(|_| anyhow::anyhow!("Bridge unavailable"))?
          .import(
            Path::new(&args.path),
            &args.expected_sha256,
            args.request_id.parse()?,
          )?,
      )?)
    })())
  }

  #[tool(
    description = "Get persisted import status. Mock records verify local bytes; live records report the last observed upload state and token. This is not a fresh remote privacy or integrity check.",
    annotations(read_only_hint = true, open_world_hint = false)
  )]
  fn artcraft_get_import(&self, Parameters(args): Parameters<RequestId>) -> CallToolResult {
    result((|| {
      Ok(serde_json::to_value(
        self
          .core
          .lock()
          .map_err(|_| anyhow::anyhow!("Bridge unavailable"))?
          .get(args.request_id.parse()?)?,
      )?)
    })())
  }

  #[tool(
    description = "Explain recovery for one known import request ID from retained local evidence. No network, credentials, upload, reset, or state writes. Does not identify the latest import or prove remote ownership, integrity, or failure. Preserve uncertain claims.",
    annotations(read_only_hint = true, open_world_hint = false)
  )]
  fn artcraft_explain_import_recovery(
    &self,
    Parameters(args): Parameters<RequestId>,
  ) -> CallToolResult {
    result((|| {
      Ok(serde_json::to_value(
        self
          .core
          .lock()
          .map_err(|_| anyhow::anyhow!("Bridge unavailable"))?
          .recovery_report(args.request_id.parse()?)?,
      )?)
    })())
  }

  #[tool(
    description = "Download the original of an existing live import and compare size and SHA-256 with its saved import record. Performs metadata/CDN GET requests only, no upload or state changes. Requires configured ArtCraft credentials and a saved accepted asset token. Does not prove ownership or privacy.",
    annotations(read_only_hint = true, open_world_hint = true)
  )]
  async fn artcraft_verify_remote_original(
    &self,
    Parameters(args): Parameters<RequestId>,
  ) -> CallToolResult {
    result(self.verify_remote(args).await)
  }
}

impl ImageBridge {
  async fn verify_remote(&self, args: RequestId) -> anyhow::Result<serde_json::Value> {
    let record = self
      .core
      .lock()
      .map_err(|_| anyhow::anyhow!("Bridge unavailable"))?
      .get(args.request_id.parse()?)?
      .ok_or_else(|| anyhow::anyhow!("No saved import for this request ID"))?;
    anyhow::ensure!(record.backend == "artcraft_live" && record.maybe_media_file_token.is_some(),
      "Remote verification requires a live import with an accepted asset token; preserve uncertain claims");
    let key = self
      .maybe_live_key
      .as_ref()
      .ok_or_else(|| anyhow::anyhow!("Remote verification requires explicit live credentials"))?
      .canonicalize()
      .map_err(|_| anyhow::anyhow!("Cannot open configured encrypted key"))?;
    anyhow::ensure!(
      !key.starts_with(&self.image_root),
      "Credential file must be outside the allowed image root"
    );
    LiveUploadClient::from_dpapi_file(&key)
      .await?
      .verify_original(&record)
      .await
  }

  async fn import_live(&self, key: &Path, args: ImportArgs) -> anyhow::Result<serde_json::Value> {
    anyhow::ensure!(
      args.accept_remote_link_access,
      "Live import requires explicit acceptance of remote storage and anonymous direct-link access"
    );
    // Local inspection and saved status must not depend on a usable credential.
    // Check the key only for an explicitly requested live call, before claiming
    // an upload ID. Re-resolve here so a replaced key cannot point into images.
    let key = key.canonicalize().map_err(|_| anyhow::anyhow!(
      "Cannot open the configured encrypted key. Run setup-bridge-key.ps1 under your Windows account; no upload attempt was recorded"
    ))?;
    anyhow::ensure!(
      !key.starts_with(&self.image_root),
      "Credential file must be outside the allowed image root"
    );
    let client = LiveUploadClient::from_dpapi_file(&key).await?;
    let (mut record, maybe_bytes) = self
      .core
      .lock()
      .map_err(|_| anyhow::anyhow!("Bridge unavailable"))?
      .prepare_live(
        Path::new(&args.path),
        &args.expected_sha256,
        args.request_id.parse()?,
      )?;
    if let Some(bytes) = maybe_bytes {
      let token = client
        .upload(bytes, &record.image.mime_type, record.request_id)
        .await?;
      record.maybe_media_file_token = Some(token);
      record.status = "uploaded_metadata_pending".into();
      self
        .core
        .lock()
        .map_err(|_| anyhow::anyhow!("Bridge unavailable"))?
        .save_live_result(&record)?;
    }
    let token = record.maybe_media_file_token.as_deref()
      .ok_or_else(|| anyhow::anyhow!("Previous upload outcome unknown; inspect persisted status and reconcile manually; no repeat POST was sent"))?;
    client.verify_metadata(token).await?;
    record.status = "uploaded_metadata_verified_link_access_not_private".into();
    self
      .core
      .lock()
      .map_err(|_| anyhow::anyhow!("Bridge unavailable"))?
      .save_live_result(&record)?;
    Ok(
      serde_json::json!({"record":record,"warning":"Private metadata is not access control. Direct-link downloads may be anonymous. No remote byte comparison performed by this tool."}),
    )
  }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  let args: Vec<String> = std::env::args().skip(1).collect();
  anyhow::ensure!(
    args.len() == 2 || (args.len() == 3 && args[2] == "--mock") || (args.len() == 4 && args[2] == "--live-key"),
    "Usage: artcraft-image-bridge <allowed-image-root> <state-directory> [--mock | --live-key <explicit-dpapi-file>]"
  );
  let core = Bridge::new(Path::new(&args[0]), Path::new(&args[1]), args.len() == 3)?;
  let image_root = Path::new(&args[0]).canonicalize()?;
  let maybe_live_key = if args.len() == 4 {
    anyhow::ensure!(
      Path::new(&args[3]).is_absolute(),
      "Credential path must be absolute"
    );
    Some(PathBuf::from(&args[3]))
  } else {
    None
  };
  ImageBridge {
    core: Arc::new(Mutex::new(core)),
    image_root,
    maybe_live_key,
  }
  .serve(stdio())
  .await?
  .waiting()
  .await?;
  Ok(())
}

fn result(value: anyhow::Result<serde_json::Value>) -> CallToolResult {
  match value {
    Ok(value) => CallToolResult::success(vec![ContentBlock::text(value.to_string())]),
    Err(err) => CallToolResult::error(vec![ContentBlock::text(err.to_string())]),
  }
}
