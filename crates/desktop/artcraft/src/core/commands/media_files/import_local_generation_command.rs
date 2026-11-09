use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::GenerationServiceProvider;
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::local_generations::{resolve_token, validate_image_file};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file_with_idempotency_token, UploadImageFromFileArgs};
use artcraft_client::utils::login_challenge_client::LoginChallengeClient;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::io::Write;
use tauri::{AppHandle, State};
use tempfile::NamedTempFile;
use tokens::tokens::media_files::MediaFileToken;
use uuid_utils::uuid::generate_random_uuid;

static IMPORT_LOCK: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());

#[derive(Deserialize)]
pub struct ImportLocalGenerationRequest {
  pub id: String,
}

#[derive(Serialize)]
pub struct ImportLocalGenerationResponse {
  pub media_file_token: MediaFileToken,
}
impl SerializeMarker for ImportLocalGenerationResponse {}

#[derive(Deserialize, Serialize)]
struct ImportReceipt {
  idempotency_token: String,
  maybe_media_token: Option<MediaFileToken>,
}

#[tauri::command]
pub async fn import_local_generation_command(request: ImportLocalGenerationRequest, app: AppHandle, root: State<'_, AppDataRoot>, configs: State<'_, AppEnvConfigs>, manager: State<'_, StorytellerCredentialManager>) -> ResponseOrErrorMessage<ImportLocalGenerationResponse> {
  let token = import_image(&request.id, &root, &configs, &manager).await.map_err(|error| error.to_string())?;
  GenerationCompleteEvent { action: None, service: GenerationServiceProvider::WaveSpeed, model: None }.send_infallible(&app);
  Ok(ImportLocalGenerationResponse { media_file_token: token }.into())
}

async fn import_image(id: &str, root: &AppDataRoot, configs: &AppEnvConfigs, manager: &StorytellerCredentialManager) -> anyhow::Result<MediaFileToken> {
  let creds = manager.get_signed_in_credentials()?.ok_or_else(|| anyhow::anyhow!("Sign in to ArtCraft before uploading a local image"))?;
  let source = resolve_token(root, id)?;
  validate_image_file(&source)?;
  let session = LoginChallengeClient::new(&configs.storyteller_host)?.session(creds.session.as_ref().unwrap().as_str()).await?;
  anyhow::ensure!(session.success && session.logged_in, "Sign in to ArtCraft before uploading a local image");
  let user = session.user.ok_or_else(|| anyhow::anyhow!("ArtCraft did not return the signed-in user"))?;
  let directory = root.path().join("local_imports").join(URL_SAFE_NO_PAD.encode(format!("{}:{}", configs.storyteller_host.to_api_hostname_and_scheme(), user.user_token.as_str())));
  let _guard = IMPORT_LOCK.lock().await;
  std::fs::create_dir_all(&directory)?;
  anyhow::ensure!(!std::fs::symlink_metadata(directory.parent().unwrap())?.file_type().is_symlink() && !std::fs::symlink_metadata(&directory)?.file_type().is_symlink(), "Import receipt directory must not be a symlink");
  let path = directory.join(format!("{id}.json"));
  let mut receipt: ImportReceipt = match std::fs::read(&path) {
    Ok(bytes) => serde_json::from_slice(&bytes)?,
    Err(error) if error.kind() == std::io::ErrorKind::NotFound => ImportReceipt { idempotency_token: generate_random_uuid(), maybe_media_token: None },
    Err(error) => return Err(error.into()),
  };
  if let Some(token) = receipt.maybe_media_token {
    return Ok(token);
  }
  save_receipt(&path, &receipt)?;
  let response = upload_image_media_file_from_file_with_idempotency_token(UploadImageFromFileArgs { api_host: &configs.storyteller_host, maybe_creds: Some(&creds), path: &source, is_intermediate_system_file: false, maybe_prompt_token: None, maybe_generation_provider: Some(enums::common::generation_provider::GenerationProvider::WaveSpeed), maybe_batch_token: None }, &receipt.idempotency_token).await?;
  receipt.maybe_media_token = Some(response.media_file_token.clone());
  save_receipt(&path, &receipt)?;
  Ok(response.media_file_token)
}

fn save_receipt(path: &std::path::Path, receipt: &ImportReceipt) -> anyhow::Result<()> {
  let mut temporary = NamedTempFile::new_in(path.parent().unwrap())?;
  temporary.write_all(&serde_json::to_vec(receipt)?)?;
  temporary.as_file().sync_all()?;
  temporary.persist(path)?;
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
  use artcraft_client::utils::api_host::ApiHost;
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;

  #[tokio::test]
  async fn authenticated_import_reuses_lost_response_key_and_retains_original_local_image() {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    let session = session();
    let server = tokio::spawn(async move {
      let mut uploads = Vec::new();
      for body in [Some(session.clone()), None, Some(session.clone()), Some(r#"{"success":true,"media_file_token":"mf_imported"}"#.into()), Some(session)] {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut bytes = Vec::new();
        loop {
          let mut buffer = [0u8; 4096];
          let count = socket.read(&mut buffer).await.unwrap();
          assert_ne!(count, 0);
          bytes.extend_from_slice(&buffer[..count]);
          if let Some(position) = bytes.windows(4).position(|window| window == b"\r\n\r\n") {
            let headers = String::from_utf8_lossy(&bytes[..position]);
            let length = headers.lines().find_map(|line| line.to_ascii_lowercase().strip_prefix("content-length: ").and_then(|value| value.parse::<usize>().ok())).unwrap_or(0);
            if bytes.len() >= position + 4 + length {
              break;
            }
          }
        }
        let text = String::from_utf8_lossy(&bytes);
        assert!(text.contains("session=fixture"));
        if text.starts_with("POST") {
          let key = text.split("name=\"uuid_idempotency_token\"\r\n\r\n").nth(1).unwrap().split("\r\n").next().unwrap().to_owned();
          uploads.push(key);
        }
        if let Some(body) = body {
          socket.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).as_bytes()).await.unwrap();
        }
      }
      uploads
    });
    let temporary = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(temporary.path()).unwrap();
    let manager = StorytellerCredentialManager::initialize_empty(&root);
    manager.set_credentials(&StorytellerCredentialSet::initialize_with_just_cookie(StorytellerSessionCookie::new("fixture".into()))).unwrap();
    let source = temporary.path().join("source.png");
    image::DynamicImage::new_rgb8(2, 2).save(&source).unwrap();
    let local = crate::core::utils::local_generations::keep_as(&root, "import", &source, "a bird", "nano_banana_pro", "wavespeed").unwrap();
    let config = AppEnvConfigs { storyteller_host: ApiHost::Localhost { port: port as u32 } };
    assert!(import_image(local.token.as_str(), &root, &config, &manager).await.is_err());
    let imported = import_image(local.token.as_str(), &root, &config, &manager).await.unwrap();
    assert_eq!(import_image(local.token.as_str(), &root, &config, &manager).await.unwrap(), imported);
    let uploads = server.await.unwrap();
    assert_eq!(uploads.len(), 2);
    assert_eq!(uploads[0], uploads[1]);
    assert!(resolve_token(&root, local.token.as_str()).unwrap().exists());
    manager.clear_credentials().unwrap();
    assert!(import_image(local.token.as_str(), &root, &config, &manager).await.unwrap_err().to_string().contains("Sign in"));
  }

  fn session() -> String {
    let mut user = serde_json::json!({ "user_token":"u_test", "username":"tester", "display_name":"Tester", "email_gravatar_hash":"fixture", "core_info":{"user_token":"u_test","username":"tester","display_name":"Tester","gravatar_hash":"fixture","default_avatar":{"image_index":1,"color_index":1}}, "onboarding":{"email_not_set":false,"email_not_confirmed":false,"password_not_set":false,"username_not_customized":false}, "maybe_feature_flags":[], "fakeyou_plan":"free", "storyteller_stream_plan":"free" });
    for field in ["can_access_studio", "can_use_tts", "can_use_w2l", "can_delete_own_tts_results", "can_delete_own_w2l_results", "can_delete_own_account", "can_upload_tts_models", "can_upload_w2l_templates", "can_delete_own_tts_models", "can_delete_own_w2l_templates", "can_approve_w2l_templates", "can_edit_other_users_profiles", "can_edit_other_users_tts_models", "can_edit_other_users_w2l_templates", "can_delete_other_users_tts_models", "can_delete_other_users_w2l_templates", "can_delete_other_users_tts_results", "can_delete_other_users_w2l_results", "can_ban_users", "can_delete_users"] {
      user[field] = serde_json::json!(false);
    }
    serde_json::json!({"success":true,"logged_in":true,"user":user}).to_string()
  }
}
