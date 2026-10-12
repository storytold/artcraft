// Shared deterministic session fixture. No real account or remote service.
export function installSessionFixture({ withLibraryAndTasks = false } = {}) {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  let loggedIn = true;
  let nextResource = 0;
  const responses = new Map();
  const now = new Date().toISOString();
  const tasks = withLibraryAndTasks ? [
    { id: "i18n-pending", task_status: "started", task_type: "image_generation", created_at: now, updated_at: now },
    { id: "i18n-failed", task_status: "complete_failure", task_type: "video_generation", created_at: now, updated_at: now, failure_reason: { failure_type: "generation_failed", failure_message: "Fixture detail stays unchanged" } },
  ] : [];
  const folders = withLibraryAndTasks ? [{ token: "folder_i18n", name: "My 原始 folder", has_star: false, last_media_thumbnails: [] }] : [];
  window.__i18nMutations = [];
  const user = {
    username: "session_smoke", display_name: "Session Smoke Account",
    user_token: "u_session_smoke", can_access_studio: true, maybe_feature_flags: [],
  };
  const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6mTQAAAAASUVORK5CYII=";
  const media = {
    token: "m_session_smoke", media_class: "image", media_type: "png",
    maybe_title: "Session smoke image", created_at: new Date().toISOString(),
    origin_category: "inference", origin: { origin_category: "inference" },
    media_links: { cdn_url: image, maybe_thumbnail_template: image, thumbnail_template: image },
    stats: { positive_rating_count: 0, bookmark_count: 0 },
  };
  window.__TAURI_INTERNALS__.invoke = async (command, args) => {
    if (command === "get_task_queue_command") return { payload: { tasks } };
    if (withLibraryAndTasks && command.startsWith("tasks_")) {
      window.__i18nMutations.push(command);
      return { payload: null };
    }
    if (command === "storyteller_get_login_session_command") return loggedIn ? user : null;
    if (command === "storyteller_password_login_command") { loggedIn = true; return user; }
    if (command === "storyteller_purge_credentials_command") { loggedIn = false; return; }
    if (command === "get_app_info_command") return { payload: { storyteller_host: "https://api.storyteller.ai" } };
    if (command === "storyteller_get_credits_command") return { payload: { free_credits: 0, monthly_credits: 42, banked_credits: 0, sum_total_credits: 42 } };
    if (command === "plugin:http|fetch") {
      const request = new URL(args.clientConfig.url);
      let body = { success: true, results: [], folders: [], tags: [], active_subscriptions: [] };
      if (request.pathname === "/v1/session") body = { success: true, logged_in: loggedIn, user: loggedIn ? user : undefined };
      if (request.pathname === "/v1/logout") loggedIn = false;
      if (request.pathname === "/v1/media_files/list/user/session_smoke") body = { success: true, results: [media], pagination: { has_next: false } };
      if (withLibraryAndTasks && request.pathname.startsWith("/v1/folders/")) {
        if (args.clientConfig.method && args.clientConfig.method !== "GET") window.__i18nMutations.push(request.pathname);
        body = { success: true, folders, media_files: [], maybe_cursor: null };
      }
      responses.set(++nextResource, { url: request.href, body });
      return nextResource;
    }
    if (command === "plugin:http|fetch_send") {
      const response = responses.get(args.rid);
      return { rid: args.rid, status: 200, statusText: "OK", url: response.url, headers: [["content-type", "application/json"]] };
    }
    if (command === "plugin:http|fetch_read_body") {
      const response = responses.get(args.rid);
      args.streamChannel.onmessage([...new TextEncoder().encode(JSON.stringify(response.body)), 0]);
      args.streamChannel.onmessage([1]);
      responses.delete(args.rid);
      return;
    }
    return invoke(command, args);
  };
}
