use super::*;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use sqlite_tasks::queries::get_task_by_provider_and_provider_job_id::{get_task_by_provider_and_provider_job_id, GetTaskByProviderAndProviderJobIdArgs};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use artcraft_client::utils::api_host::ApiHost;
use tempfile::NamedTempFile;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tauri::Listener;
use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
use std::sync::{Arc, Mutex};

const UPLOADED: &str = r#"{"success":true,"media_file_token":"mf_uploaded"}"#;

#[tokio::test]
async fn full_completion_downloads_validates_saves_notifies_and_cleans_local_and_cloud_results() {
  for signed_in in [false, true] {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let database = TaskDatabase::connect(&root).await.unwrap();
    let task = pending_task(&database, "job_full").await;
    let mut receipt = crate::core::utils::provider_submission::ProviderSubmission::begin(&root, ProviderImageContext { prompt: "a bird".into(), model_id: "nano_banana_pro".into(), local_only: !signed_in }, TaskType::ImageGeneration, "test-host".into(), None, None, None).unwrap();
    receipt.accept(&root, &crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess { task_type: TaskType::ImageGeneration, model: None, provider: GenerationProvider::WaveSpeed, provider_job_id: Some("job_full".into()), maybe_queue_status_url: None, maybe_queue_response_url: None, maybe_prompt_token: None }).unwrap();
    let source = directory.path().join("source.png");
    image::DynamicImage::new_rgb8(4, 3).save(&source).unwrap();
    let mut replies = vec![(200, std::fs::read(&source).unwrap())];
    if signed_in {
      replies.extend([(200, session_response().into_bytes()), (200, UPLOADED.as_bytes().to_vec()), (200, media_response("image", None).into_bytes())]);
    }
    let (address, server) = binary_server(replies).await;
    let config = config(&format!("http://{address}"));
    let app = test_app(&root);
    let events = Arc::new(Mutex::new(Vec::new()));
    let captured = events.clone();
    app.listen_any("generation-complete-event", move |event| captured.lock().unwrap().push(event.payload().to_owned()));
    let credentials = StorytellerCredentialManager::initialize_empty(&root);
    if signed_in {
      credentials.set_credentials(&StorytellerCredentialSet::initialize_with_just_cookie(artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie::new("test-session".into()))).unwrap();
    }
    let client = reqwest::Client::builder().no_proxy().resolve("media.example", address).build().unwrap();
    let path = checkpoint_path(&root, &task).unwrap();
    handle_provider_complete_with_client(app.handle(), &config, &root, &database, &credentials, &task, vec![format!("http://media.example:{}/result.png", address.port())], TaskMediaFileClass::Image, &client).await.unwrap();
    let requests = server.await.unwrap();
    let saved = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: "job_full" }).await.unwrap().unwrap();
    assert_eq!(saved.status, TaskStatus::CompleteSuccess);
    assert!(!path.exists());
    assert!(!path.with_extension("media").exists());
    assert!(ProviderImageContext::load(&root, "job_full").unwrap().is_none());
    assert_eq!(std::fs::read_dir(root.state_dir().path().join("wavespeed_submissions")).unwrap().count(), 0);
    assert_eq!(crate::core::utils::local_generations::list(&root).unwrap().len(), usize::from(!signed_in));
    assert_eq!(std::fs::read_dir(directory.path().join("downloads")).unwrap().count(), 1);
    assert_eq!(events.lock().unwrap().len(), 1);
    if signed_in {
      assert!(requests[1].starts_with("GET /v1/session "));
      assert!(requests[2].contains("uuid_idempotency_token"));
      assert!(requests[2].contains("session=test-session"));
    } else {
      assert_eq!(requests.len(), 1);
    }
  }
}

#[tokio::test]
async fn saved_local_completion_resumes_from_cached_bytes_without_provider_network_access() {
  let directory = tempfile::tempdir().unwrap();
  let root = AppDataRoot::create_existing(directory.path()).unwrap();
  let database = TaskDatabase::connect(&root).await.unwrap();
  let task = pending_task(&database, "saved_local").await;
  let app = test_app(&root);
  let config = config("http://localhost:1");
  let credentials = StorytellerCredentialManager::initialize_empty(&root);
  let path = checkpoint_path(&root, &task).unwrap();
  let urls = vec!["https://media.invalid/result.png".into()];
  UploadCheckpoint::prepare(&path, &completion_identity(&config, &task, TaskMediaFileClass::Image), &urls).unwrap();
  std::fs::create_dir_all(path.with_extension("media")).unwrap();
  image::DynamicImage::new_rgb8(4, 3).save(path.with_extension("media").join("0.png")).unwrap();
  assert!(try_resume_saved_completion(app.handle(), &config, &root, &database, &credentials, &task).await.unwrap());
  let saved = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: "saved_local" }).await.unwrap().unwrap();
  assert_eq!(saved.status, TaskStatus::CompleteSuccess);
  assert_eq!(crate::core::utils::local_generations::list(&root).unwrap().len(), 1);
  assert!(!path.exists());
  assert!(!path.with_extension("media").exists());
}

#[tokio::test]
async fn corrupt_saved_completions_fail_instead_of_looping_and_empty_results_fail() {
  let directory = tempfile::tempdir().unwrap();
  let root = AppDataRoot::create_existing(directory.path()).unwrap();
  let database = TaskDatabase::connect(&root).await.unwrap();
  let app = test_app(&root);
  let config = config("http://localhost:1");
  let credentials = StorytellerCredentialManager::initialize_empty(&root);
  for corrupt in [false, true] {
    let job = if corrupt { "corrupt" } else { "empty" };
    let task = pending_task(&database, job).await;
    if corrupt {
      std::fs::write(checkpoint_path(&root, &task).unwrap(), b"broken JSON").unwrap();
      assert!(try_resume_saved_completion(app.handle(), &config, &root, &database, &credentials, &task).await.unwrap());
    } else {
      handle_provider_complete(app.handle(), &config, &root, &database, &credentials, &task, vec![], TaskMediaFileClass::Image).await.unwrap();
    }
    let saved = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: job }).await.unwrap().unwrap();
    assert_eq!(saved.status, TaskStatus::CompleteFailure);
  }
}

#[tokio::test]
#[ignore = "Creates real cloud uploads; requires explicit approval and ARTCRAFT_LIVE_UPLOAD_TEST=1"]
async fn live_artcraft_image_upload_idempotency_contract() {
  assert_eq!(std::env::var("ARTCRAFT_LIVE_UPLOAD_TEST").as_deref(), Ok("1"));
  let session = std::env::var("ARTCRAFT_TEST_SESSION").expect("Set a dedicated test-account session; never commit it");
  let creds = StorytellerCredentialSet::initialize_with_just_cookie(artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie::new(session));
  let temporary = tempfile::tempdir().unwrap();
  let source = temporary.path().join("idempotency-test.png");
  image::DynamicImage::new_rgb8(2, 2).save(&source).unwrap();
  let config = AppEnvConfigs { storyteller_host: ApiHost::Storyteller, ..config("http://localhost:1") };
  let key = uuid_utils::uuid::generate_random_uuid();
  let first = try_upload(&creds, &config, &source, None, None, TaskMediaFileClass::Image, GenerationProvider::WaveSpeed, &key).await.unwrap();
  let second = try_upload(&creds, &config, &source, None, None, TaskMediaFileClass::Image, GenerationProvider::WaveSpeed, &key).await.unwrap();
  assert_eq!(first, second, "The server did not deduplicate the repeated upload key");
}

#[test]
fn local_image_submission_stays_local_when_the_user_signs_in_before_completion() {
  let context = ProviderImageContext { prompt: "a bird".into(), model_id: "nano_banana_pro".into(), local_only: true };
  assert!(should_keep_locally(GenerationProvider::WaveSpeed, TaskMediaFileClass::Image, Some(&context), true));
  assert!(should_keep_locally(GenerationProvider::WaveSpeed, TaskMediaFileClass::Image, None, false));
  assert!(!should_keep_locally(GenerationProvider::WaveSpeed, TaskMediaFileClass::Image, None, true));
  assert!(should_keep_locally(GenerationProvider::WaveSpeed, TaskMediaFileClass::Video, Some(&context), false));
  assert!(!should_keep_locally(GenerationProvider::Fal, TaskMediaFileClass::Image, Some(&context), false));
}

#[test]
fn restarting_local_completion_keeps_all_results_without_duplicate_library_entries() {
  let directory = tempfile::tempdir().unwrap();
  let root = AppDataRoot::create_existing(directory.path()).unwrap();
  let task = Task { id: tokens::tokens::sqlite::tasks::TaskId::new_from_str("task_local"), status: TaskStatus::Started, task_type: TaskType::ImageGeneration, model_type: None, provider: GenerationProvider::WaveSpeed, provider_job_id: Some("job_local".into()), queue_status_url: None, queue_response_url: None, prompt_token: None, frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: Some("unchanged".into()) };
  let source = directory.path().join("output.png");
  image::DynamicImage::new_rgb8(2, 2).save(&source).unwrap();
  let context = ProviderImageContext { prompt: "a bird".into(), model_id: "nano_banana_pro".into(), local_only: true };
  let files = vec![source.clone(), source];
  let first = keep_local_images(&root, &task, &files, Some(&context)).unwrap();
  let second = keep_local_images(&root, &task, &files, Some(&context)).unwrap();
  assert_eq!(first.len(), 2);
  assert_eq!(first[0].media_token, second[0].media_token);
  assert_ne!(first[0].media_token, first[1].media_token);
  let listed = crate::core::utils::local_generations::list(&root).unwrap();
  assert_eq!(listed.len(), 2);
  assert!(listed.iter().all(|image| image.prompt == context.prompt && image.model_id == context.model_id && image.provider == "wavespeed"));
  assert_eq!(task.frontend_subscriber_payload.as_deref(), Some("unchanged"));
}

#[tokio::test]
async fn durable_idempotency_tokens_reach_image_video_and_legacy_endpoints() {
  let (base, server) = http_server(vec![Some((200, UPLOADED)); 6]).await;
  let config = config(&base);
  let file = NamedTempFile::new().unwrap();
  std::fs::write(file.path(), b"synthetic media").unwrap();
  let creds = StorytellerCredentialSet::empty();
  for media_class in [TaskMediaFileClass::Image, TaskMediaFileClass::Video, TaskMediaFileClass::Dimensional] {
    for _ in 0..2 {
      let token = try_upload(&creds, &config, file.path(), None, None, media_class, GenerationProvider::WaveSpeed, "durable-upload-id").await.unwrap();
      assert_eq!(token.as_str(), "mf_uploaded");
    }
  }
  let requests = server.await.unwrap();
  for request in &requests {
    assert!(request.contains("name=\"uuid_idempotency_token\"\r\n\r\ndurable-upload-id"));
    assert!(request.contains("name=\"maybe_generation_provider\"\r\n\r\nwavespeed"));
  }
  assert!(requests[0].starts_with("POST /v1/media_files/upload/image "));
  assert!(requests[2].starts_with("POST /v1/media_files/upload/new_video "));
  assert!(requests[4].starts_with("POST /v1/media_files/upload "));
}

#[tokio::test]
async fn lost_upload_response_then_restart_reuses_identity_and_skips_confirmed_results() {
  let (base, server) = http_server(vec![Some((200, "first media")), Some((200, r#"{"success":true,"media_file_token":"mf_first"}"#)), Some((200, "second media")), None, Some((200, "second media")), Some((200, r#"{"success":true,"media_file_token":"mf_second"}"#))]).await;
  let directory = tempfile::tempdir().unwrap();
  let root = AppDataRoot::create_existing(directory.path()).unwrap();
  let config = config(&base);
  let creds = StorytellerCredentialSet::empty();
  let path = root.state_dir().path().join("test_upload.json");
  let identity = CompletionIdentity { task_id: "task_test".into(), provider: GenerationProvider::WaveSpeed, maybe_provider_job_id: Some("job".into()), api_host: config.storyteller_host.to_api_hostname_and_scheme(), media_class: TaskMediaFileClass::Image };
  let urls = vec![format!("{base}/first.png"), format!("{base}/second.png")];
  for succeeds in [false, true] {
    let result = resume_uploads(&path, &identity, &urls, |plan| {
      let root = &root;
      let config = &config;
      let creds = &creds;
      async move {
        let download = super::super::provider_transfer::download_with_client(&reqwest::Client::new(), &plan.url, root.temp_dir().path(), 1024).await?;
        upload_to_backend(creds, config, download.path(), None, plan.maybe_batch_token.as_ref(), TaskMediaFileClass::Image, GenerationProvider::WaveSpeed, &plan.idempotency_token).await
      }
    })
    .await;
    assert_eq!(result.is_ok(), succeeds);
    assert_eq!(std::fs::read_dir(root.temp_dir().path()).unwrap().count(), 0);
    if let Ok((primary, batch)) = result {
      assert_eq!(primary.as_str(), "mf_first");
      assert!(batch.is_some());
    }
  }
  let requests = server.await.unwrap();
  assert_eq!(multipart_field(&requests[3], "uuid_idempotency_token"), multipart_field(&requests[5], "uuid_idempotency_token"));
  assert_eq!(multipart_field(&requests[1], "maybe_batch_token"), multipart_field(&requests[5], "maybe_batch_token"));
  assert_ne!(multipart_field(&requests[1], "uuid_idempotency_token"), multipart_field(&requests[5], "uuid_idempotency_token"));
  let saved = UploadCheckpoint::load(&path).unwrap().unwrap();
  let database = TaskDatabase::connect(&root).await.unwrap();
  let db = database.get_connection();
  let task_id = create_task(CreateTaskArgs { db, status: TaskStatus::Started, task_type: TaskType::ImageGeneration, model_type: None, provider: GenerationProvider::WaveSpeed, provider_job_id: Some("db_failure"), queue_status_url: None, queue_response_url: None, prompt_token: None, frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: None }).await.unwrap();
  db.get_pool().close().await;
  assert!(update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs { db, task_id: &task_id, maybe_batch_token: None, maybe_primary_media_file_token: Some(&MediaFileToken::new_from_str("mf_first")), maybe_primary_media_file_class: Some(TaskMediaFileClass::Image), maybe_primary_media_file_cdn_url: None, maybe_primary_media_file_thumbnail_url_template: None }).await.is_err());
  assert!(path.exists());
  resume_uploads(&path, &identity, &saved.urls(), |_| async { panic!("a failed task database commit must not cause another download or upload") }).await.unwrap();
}

#[tokio::test]
async fn late_completion_or_failure_cannot_change_terminal_tasks() {
  let directory = tempfile::tempdir().unwrap();
  let root = AppDataRoot::create_existing(directory.path()).unwrap();
  let database = TaskDatabase::connect(&root).await.unwrap();
  let db = database.get_connection();
  for status in [TaskStatus::CompleteSuccess, TaskStatus::CompleteFailure, TaskStatus::Dead, TaskStatus::CancelledByUser, TaskStatus::CancelledByProvider, TaskStatus::CancelledByUs] {
    let job = format!("job_{status:?}");
    let task_id = create_task(CreateTaskArgs { db, status, task_type: TaskType::ImageGeneration, model_type: None, provider: GenerationProvider::WaveSpeed, provider_job_id: Some(&job), queue_status_url: None, queue_response_url: None, prompt_token: None, frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: None }).await.unwrap();
    assert!(!update_task_status(UpdateTaskArgs { db, task_id: &task_id, status: TaskStatus::CompleteFailure }).await.unwrap());
    assert!(!update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs { db, task_id: &task_id, maybe_batch_token: None, maybe_primary_media_file_token: Some(&MediaFileToken::new_from_str("mf_late")), maybe_primary_media_file_class: Some(TaskMediaFileClass::Image), maybe_primary_media_file_cdn_url: None, maybe_primary_media_file_thumbnail_url_template: None }).await.unwrap());
    let saved = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db, provider: GenerationProvider::WaveSpeed, provider_job_id: &job }).await.unwrap().unwrap();
    assert_eq!(saved.status, status);
  }
  let task_id = create_task(CreateTaskArgs { db, status: TaskStatus::AttemptFailed, task_type: TaskType::ImageGeneration, model_type: None, provider: GenerationProvider::WaveSpeed, provider_job_id: Some("retryable"), queue_status_url: None, queue_response_url: None, prompt_token: None, frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: None }).await.unwrap();
  assert!(update_task_status(UpdateTaskArgs { db, task_id: &task_id, status: TaskStatus::CompleteSuccess }).await.unwrap());
}

fn config(base: &str) -> AppEnvConfigs {
  AppEnvConfigs { storyteller_host: ApiHost::Localhost { port: u32::from(reqwest::Url::parse(base).unwrap().port().unwrap()) } }
}

pub(crate) fn test_app(root: &AppDataRoot) -> tauri::App<tauri::test::MockRuntime> {
  let preferences = AppPreferences { auto_download: true, preferred_download_directory: PreferredDownloadDirectory::Custom(root.path().join("downloads")), ..Default::default() };
  tauri::test::mock_builder().manage(root.clone()).manage(AppPreferencesManager::with_owned(preferences)).build(tauri::test::mock_context(tauri::test::noop_assets())).unwrap()
}

pub(crate) async fn pending_task(database: &TaskDatabase, job: &str) -> Task {
  create_task(CreateTaskArgs { db: database.get_connection(), status: TaskStatus::Started, task_type: TaskType::ImageGeneration, model_type: None, provider: GenerationProvider::WaveSpeed, provider_job_id: Some(job), queue_status_url: None, queue_response_url: None, prompt_token: None, frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: None }).await.unwrap();
  get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: job }).await.unwrap().unwrap()
}

pub(crate) fn media_response(class: &str, duration: Option<u64>) -> String {
  serde_json::json!({"success":true,"media_file":{
    "token":"mf_uploaded", "media_class":class, "media_type":"image", "creator_set_visibility":"public",
    "media_links":{"cdn_url":"https://example.com/result.png"},
    "cover_image":{"default_cover":{"image_index":0,"color_index":0}},
    "is_user_upload":true,"is_intermediate_system_file":false,"used_face_detailer":false,"used_upscaler":false,
    "maybe_duration_millis":duration,"is_emulated_media_file":false,"is_featured":false,
    "stats":{"positive_rating_count":0,"bookmark_count":0},"created_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-01T00:00:00Z"
  }}).to_string()
}

fn session_response() -> String {
  let mut user = serde_json::json!({"core_info":{"user_token":"user_test","username":"test","display_name":"Test","gravatar_hash":"","default_avatar":{"image_index":0,"color_index":0}},
    "user_token":"user_test","username":"test","display_name":"Test","email_gravatar_hash":"", "onboarding":{"email_not_set":false,"email_not_confirmed":false,"password_not_set":false,"username_not_customized":false},"fakeyou_plan":"free","storyteller_stream_plan":"free","can_ban_users":false,"can_delete_users":false});
  for field in ["can_access_studio", "can_use_tts", "can_use_w2l", "can_delete_own_tts_results", "can_delete_own_w2l_results", "can_delete_own_account", "can_upload_tts_models", "can_upload_w2l_templates", "can_delete_own_tts_models", "can_delete_own_w2l_templates", "can_approve_w2l_templates", "can_edit_other_users_profiles", "can_edit_other_users_tts_models", "can_edit_other_users_w2l_templates", "can_delete_other_users_tts_models", "can_delete_other_users_tts_results", "can_delete_other_users_w2l_templates", "can_delete_other_users_w2l_results"] {
    user[field] = false.into();
  }
  serde_json::json!({"success":true,"logged_in":true,"user":user}).to_string()
}

pub(crate) async fn binary_server(replies: Vec<(u16, Vec<u8>)>) -> (std::net::SocketAddr, tokio::task::JoinHandle<Vec<String>>) {
  let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
  let address = listener.local_addr().unwrap();
  let server = tokio::spawn(async move {
    let mut requests = Vec::new();
    for (status, body) in replies {
      let (mut socket, _) = tokio::time::timeout(Duration::from_secs(10), listener.accept()).await.unwrap().unwrap();
      let mut request = Vec::new();
      let mut buffer = [0; 4096];
      loop {
        let count = socket.read(&mut buffer).await.unwrap();
        assert!(count > 0);
        request.extend_from_slice(&buffer[..count]);
        if let Some(start) = request.windows(4).position(|part| part == b"\r\n\r\n") {
          let headers = String::from_utf8_lossy(&request[..start]).to_ascii_lowercase();
          let length = headers.lines().find_map(|line| line.strip_prefix("content-length:")).map(|value| value.trim().parse::<usize>().unwrap()).unwrap_or(0);
          if request.len() >= start + 4 + length { break; }
        }
      }
      requests.push(String::from_utf8_lossy(&request).into_owned());
      socket.write_all(format!("HTTP/1.1 {status} OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", body.len()).as_bytes()).await.unwrap();
      socket.write_all(&body).await.unwrap();
    }
    requests
  });
  (address, server)
}

fn multipart_field<'a>(request: &'a str, field: &str) -> &'a str {
  request.split(&format!("name=\"{field}\"\r\n\r\n")).nth(1).unwrap().split("\r\n").next().unwrap()
}

async fn http_server(replies: Vec<Option<(u16, &'static str)>>) -> (String, tokio::task::JoinHandle<Vec<String>>) {
  let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
  let base = format!("http://{}", listener.local_addr().unwrap());
  let server = tokio::spawn(async move {
    let mut requests = Vec::new();
    for reply in replies {
      let (mut socket, _) = listener.accept().await.unwrap();
      let mut request = Vec::new();
      let mut buffer = [0; 4096];
      loop {
        let count = socket.read(&mut buffer).await.unwrap();
        assert!(count > 0);
        request.extend_from_slice(&buffer[..count]);
        if let Some(start) = request.windows(4).position(|part| part == b"\r\n\r\n") {
          let headers = String::from_utf8_lossy(&request[..start]).to_ascii_lowercase();
          let length = headers.lines().find_map(|line| line.strip_prefix("content-length:")).map(|value| value.trim().parse::<usize>().unwrap()).unwrap_or(0);
          if request.len() >= start + 4 + length {
            break;
          }
        }
      }
      requests.push(String::from_utf8_lossy(&request).into_owned());
      if let Some((status, body)) = reply {
        socket.write_all(format!("HTTP/1.1 {status} OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).as_bytes()).await.unwrap();
      }
    }
    requests
  });
  (base, server)
}
