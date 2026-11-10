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

const UPLOADED: &str = r#"{"success":true,"media_file_token":"mf_uploaded"}"#;

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
