// Real app UI with isolated, deterministic IPC responses. Run against a dev or
// preview URL. Native HTTP/CORS correctness is tested separately in Rust and in
// the real-webview procedure in docs/desktop-session-regression.md.
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { installBrowserFixture } from "../performance/browser-fixture.mjs";

const url = new URL(process.argv[2] || "http://127.0.0.1:5193");
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
  throw new Error("Use the local development or preview URL printed by the launcher.");
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(installBrowserFixture);
  await context.addInitScript(installSessionFixture);
  await context.route("**/*", (route) => {
    const target = route.request().url();
    return target.startsWith(url.origin) || target.startsWith("blob:")
      ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const home = async () => {
    await page.goto(url.href);
    await expect(page.getByRole("heading", { name: "What will you craft today?" })).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole("button", { name: "42 Credits" })).toBeVisible();
  };
  const account = async () => {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: "Accounts", exact: true }).click();
    await expect(page.getByText("Session Smoke Account", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log Out", exact: true })).toBeVisible();
  };

  await home();
  await account();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "My Library" }).click();
  await expect(page.getByRole("img", { name: "Session smoke image", exact: true })).toBeVisible();
  await expect.poll(() => page.getByRole("img", { name: "Session smoke image", exact: true })
    .evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.getByText("Log in to browse and use your library.")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Create Image Generate AI images" }).click();
  await expect(page.getByRole("img", { name: "Session smoke image", exact: true })).toBeVisible();
  await account();
  await page.keyboard.press("Escape");
  for (const [card, heading] of [
    ["Create Video Create video from images", "Create Video"],
    ["Create Audio Generate music and sound effects", "Create Audio"],
  ]) {
    await home();
    await page.getByRole("button", { name: card }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true }).first()).toBeVisible();
  }
  await account();
  await page.getByRole("button", { name: "Log Out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByPlaceholder("you@example.com or username").fill("session_smoke");
  await page.getByPlaceholder("Min. 8 characters").fill("fixture-password-only");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toHaveCount(0, { timeout: 10000 });
  await account();
  assert.deepEqual(errors, [], "Application runtime errors");
  console.log("PASS: credits, Accounts, Library media, deferred image/video/audio pages, logout gate, and sign-in agree.");
} finally {
  await browser.close();
}

function installSessionFixture() {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  let loggedIn = true;
  let nextResource = 0;
  const responses = new Map();
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
