//! Commands' native implementation + real ArtCraft bindings + loopback HTTP.
//! All listeners bind to an ephemeral local port; no production host is contacted.
use super::*;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use serde_json::{json, Value};
use std::io::{Read, Write};
use std::net::TcpListener;
use std::thread;
use std::time::Duration;
use tauri_plugin_http::reqwest_cookie_store::CookieStore;

const SIGNED: &str = "signed_native_session_fixture";
const DEVICE: &str = "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD";

#[tokio::test]
async fn approved_session_is_verified_installed_persisted_and_retried_entirely_in_rust() {
  let server = server(vec![
    create(),
    pending(),
    redeemed(),
    session(),
    redeemed(),
    session(),
  ]);
  let h = harness();
  // Native installation must preserve visitor cookies and avoid importing other origins.
  h.jar.store.lock().unwrap().store_response_cookies(
    [RawCookie::parse("visitor=existing; Path=/; Max-Age=3600")
      .unwrap()
      .into_owned()]
    .into_iter(),
    &server_url(&server),
  );
  h.manager
    .set_credentials(&StorytellerCredentialSet::initialize_with_just_avt(
      StorytellerAvtCookie::new("existing".into()),
    ))
    .unwrap();
  let created = begin_challenge(&server.host, &h.state).await.unwrap();
  let public = serde_json::to_string(&created).unwrap();
  assert!(!public.contains(DEVICE));
  assert!(!public.contains("device_token"));
  assert!(h
    .manager
    .get_credentials_required()
    .unwrap()
    .session
    .is_none());
  let wait = poll_challenge(&h.state, &h.manager, &h.jar, &created.challenge_id)
    .await
    .unwrap();
  assert_eq!(wait.status, LoginChallengeState::Pending);
  assert!(h
    .manager
    .get_credentials_required()
    .unwrap()
    .session
    .is_none());
  for _ in 0..2 {
    let result = poll_challenge(&h.state, &h.manager, &h.jar, &created.challenge_id)
      .await
      .unwrap();
    assert_eq!(result.status, LoginChallengeState::Redeemed);
    assert_eq!(result.maybe_user.as_ref().unwrap().username, "google_user");
    assert!(!serde_json::to_string(&result).unwrap().contains(SIGNED));
    let credentials = h.manager.get_credentials_required().unwrap();
    assert_eq!(credentials.session.unwrap().as_str(), SIGNED);
    assert_eq!(credentials.avt.unwrap().as_str(), "existing");
    assert!(std::fs::read_to_string(&h.jar.path)
      .unwrap()
      .contains(SIGNED));
  }
  server.thread.join().unwrap();
}

#[tokio::test]
async fn rejection_and_timeout_never_install_a_session() {
  for expired in [false, true] {
    let mut steps = vec![create()];
    if !expired {
      steps.push(step(
        "/v1/login_challenges/poll",
        json!({"success":true,"status":"failed","maybe_failure_type":"user_declined"}),
      ));
    }
    let server = server(steps);
    let h = harness();
    let created = begin_challenge(&server.host, &h.state).await.unwrap();
    if expired {
      h.state
        .pending
        .lock()
        .await
        .get_mut(&created.challenge_id)
        .unwrap()
        .expires_at = Utc::now();
    }
    let result = poll_challenge(&h.state, &h.manager, &h.jar, &created.challenge_id)
      .await
      .unwrap();
    assert_eq!(result.status, LoginChallengeState::Failed);
    assert_eq!(
      result.maybe_failure_type,
      Some(if expired {
        LoginChallengeFailure::Expired
      } else {
        LoginChallengeFailure::UserDeclined
      })
    );
    assert!(h.manager.get_credentials().unwrap().is_none());
    assert!(h
      .jar
      .store
      .lock()
      .unwrap()
      .iter_unexpired()
      .next()
      .is_none());
    server.thread.join().unwrap();
  }
}

#[tokio::test]
async fn invalid_downstream_session_is_not_installed_and_error_has_host_without_credentials() {
  let mut invalid = session();
  invalid.status = 401;
  invalid.body = json!({"echo": SIGNED});
  let server = server(vec![create(), redeemed(), invalid]);
  let h = harness();
  let created = begin_challenge(&server.host, &h.state).await.unwrap();
  let error = poll_challenge(&h.state, &h.manager, &h.jar, &created.challenge_id)
    .await
    .err()
    .unwrap();
  assert_eq!(error.status, Some(401));
  assert!(!error.retryable);
  assert!(error
    .message
    .contains(&server.host.to_api_hostname_and_scheme()));
  assert!(!format!("{error:?}").contains(SIGNED));
  assert!(h.manager.get_credentials().unwrap().is_none());
  assert!(h
    .jar
    .store
    .lock()
    .unwrap()
    .iter_unexpired()
    .next()
    .is_none());
  server.thread.join().unwrap();
}

#[tokio::test]
async fn cancelling_during_http_prevents_late_cookie_installation() {
  let mut delayed = redeemed();
  delayed.delay = Duration::from_millis(150);
  let server = server(vec![create(), delayed, session()]);
  let h = harness();
  let created = begin_challenge(&server.host, &h.state).await.unwrap();
  let (result, _) = tokio::join!(
    poll_challenge(&h.state, &h.manager, &h.jar, &created.challenge_id),
    async {
      tokio::time::sleep(Duration::from_millis(30)).await;
      h.state.pending.lock().await.remove(&created.challenge_id);
    }
  );
  assert!(result.is_err());
  assert!(h.manager.get_credentials().unwrap().is_none());
  assert!(h
    .jar
    .store
    .lock()
    .unwrap()
    .iter_unexpired()
    .next()
    .is_none());
  server.thread.join().unwrap();
}

#[tokio::test]
async fn unknown_states_and_redirects_fail_closed() {
  for redirect in [false, true] {
    let mut result = step(
      "/v1/login_challenges/poll",
      json!({"success":true,"status":"future_state","maybe_signed_session":SIGNED}),
    );
    if redirect {
      result.status = 302;
      result.headers = "Location: https://must-never-be-contacted.invalid/\r\n".into();
    }
    let server = server(vec![create(), result]);
    let h = harness();
    let created = begin_challenge(&server.host, &h.state).await.unwrap();
    let error = poll_challenge(&h.state, &h.manager, &h.jar, &created.challenge_id)
      .await
      .err()
      .unwrap();
    assert!(!error.retryable);
    if redirect {
      assert_eq!(error.status, Some(302));
    }
    assert!(h.manager.get_credentials().unwrap().is_none());
    server.thread.join().unwrap();
  }
}

#[test]
fn website_origin_must_match_native_api_environment() {
  let local = LoginChallengeClient::new(&ApiHost::Localhost { port: 12345 }).unwrap();
  let prod = LoginChallengeClient::new(&ApiHost::Storyteller).unwrap();
  let fragment = format!("#approval_token={}", "A".repeat(43));
  assert!(local.allows_verification_url(&format!("http://localhost:4201/login/desktop{fragment}")));
  assert!(!local.allows_verification_url(&format!(
    "https://app.getartcraft.com/login/desktop{fragment}"
  )));
  assert!(prod.allows_verification_url(&format!(
    "https://app.getartcraft.com/login/desktop{fragment}"
  )));
  assert!(!prod.allows_verification_url(&format!("http://localhost:4201/login/desktop{fragment}")));
}

struct Harness {
  _directory: tempfile::TempDir,
  state: DesktopLoginBridgeState,
  manager: StorytellerCredentialManager,
  jar: Arc<CookieStoreMutex>,
}

struct Server {
  host: ApiHost,
  thread: thread::JoinHandle<()>,
}

struct Step {
  path: &'static str,
  status: u16,
  body: Value,
  headers: String,
  delay: Duration,
}

fn harness() -> Harness {
  let directory = tempfile::tempdir().unwrap();
  let root = AppDataRoot::create_existing(directory.path()).unwrap();
  let manager = StorytellerCredentialManager::initialize_empty(&root);
  let jar = Arc::new(CookieStoreMutex::new(
    directory.path().join("cookies.json"),
    CookieStore::default(),
  ));
  Harness {
    _directory: directory,
    state: DesktopLoginBridgeState::default(),
    manager,
    jar,
  }
}

fn server_url(server: &Server) -> reqwest::Url {
  reqwest::Url::parse(&format!("{}/", server.host.to_api_hostname_and_scheme())).unwrap()
}

fn server(steps: Vec<Step>) -> Server {
  let listener = TcpListener::bind("127.0.0.1:0").unwrap();
  let port = listener.local_addr().unwrap().port();
  let thread = thread::spawn(move || {
    for step in steps {
      let (mut stream, _) = listener.accept().unwrap();
      stream
        .set_read_timeout(Some(Duration::from_secs(10)))
        .unwrap();
      let mut data = Vec::new();
      let mut buffer = [0; 4096];
      loop {
        let count = stream.read(&mut buffer).unwrap();
        assert!(count > 0);
        data.extend_from_slice(&buffer[..count]);
        if let Some(end) = data.windows(4).position(|v| v == b"\r\n\r\n") {
          let headers = String::from_utf8_lossy(&data[..end]).to_lowercase();
          let length: usize = headers
            .lines()
            .find_map(|s| s.strip_prefix("content-length:"))
            .map(|s| s.trim().parse().unwrap())
            .unwrap_or(0);
          if data.len() >= end + 4 + length {
            break;
          }
        }
      }
      let request = String::from_utf8(data).unwrap();
      assert_eq!(request.split_whitespace().nth(1), Some(step.path));
      assert!(request
        .to_lowercase()
        .contains(&format!("host: localhost:{port}")));
      if step.path == "/v1/session" {
        assert!(request.starts_with("GET "));
        assert!(request.contains(&format!("session={SIGNED}")));
      } else {
        assert!(request.starts_with("POST "));
        assert!(!request.to_lowercase().contains("cookie:"));
        if step.path.ends_with("/poll") {
          let body: Value =
            serde_json::from_str(request.split_once("\r\n\r\n").unwrap().1).unwrap();
          assert_eq!(body, json!({"device_token":DEVICE}));
        }
      }
      thread::sleep(step.delay);
      let body = step.body.to_string();
      write!(stream, "HTTP/1.1 {} Test\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n{}\r\n{}", step.status, body.len(), step.headers, body).unwrap();
    }
  });
  Server {
    host: ApiHost::Localhost { port: port.into() },
    thread,
  }
}

fn step(path: &'static str, body: Value) -> Step {
  Step {
    path,
    body,
    status: 200,
    headers: String::new(),
    delay: Duration::ZERO,
  }
}

fn create() -> Step {
  step(
    "/v1/login_challenges/create",
    json!({"success":true,"device_token":DEVICE,"verification_url":format!("http://localhost:4201/login/desktop#approval_token={}","A".repeat(43)),"confirmation_code":"WDJBMJHT","expires_at":Utc::now()+chrono::Duration::minutes(20),"poll_interval_seconds":5}),
  )
}

fn pending() -> Step {
  step(
    "/v1/login_challenges/poll",
    json!({"success":true,"status":"pending","maybe_failure_type":null}),
  )
}

fn redeemed() -> Step {
  let mut response = step(
    "/v1/login_challenges/poll",
    json!({"success":true,"status":"redeemed","maybe_failure_type":null,"maybe_signed_session":SIGNED}),
  );
  response.headers = format!("Set-Cookie: session={SIGNED}; HttpOnly; Path=/; Max-Age=3600\r\n");
  response
}

fn session() -> Step {
  let mut user = json!({
    "user_token":"u_native_test", "username":"google_user", "display_name":"Google User", "email_gravatar_hash":"fixture",
    "core_info":{"user_token":"u_native_test","username":"google_user","display_name":"Google User","gravatar_hash":"fixture","default_avatar":{"image_index":1,"color_index":1}},
    "onboarding":{"email_not_set":false,"email_not_confirmed":false,"password_not_set":true,"username_not_customized":false},
    "maybe_feature_flags":[],"fakeyou_plan":"free","storyteller_stream_plan":"free"
  });
  for field in [
    "can_access_studio",
    "can_use_tts",
    "can_use_w2l",
    "can_delete_own_tts_results",
    "can_delete_own_w2l_results",
    "can_delete_own_account",
    "can_upload_tts_models",
    "can_upload_w2l_templates",
    "can_delete_own_tts_models",
    "can_delete_own_w2l_templates",
    "can_approve_w2l_templates",
    "can_edit_other_users_profiles",
    "can_edit_other_users_tts_models",
    "can_edit_other_users_w2l_templates",
    "can_delete_other_users_tts_models",
    "can_delete_other_users_w2l_templates",
    "can_delete_other_users_tts_results",
    "can_delete_other_users_w2l_results",
    "can_ban_users",
    "can_delete_users",
  ] {
    user[field] = json!(false);
  }
  step(
    "/v1/session",
    json!({"success":true,"logged_in":true,"user":user}),
  )
}
