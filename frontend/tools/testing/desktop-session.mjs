// Real app UI with isolated, deterministic IPC responses. Run against a dev or
// preview URL. Native HTTP/CORS correctness is tested separately in Rust and in
// the real-webview procedure in docs/desktop-session-regression.md.
import assert from "node:assert/strict";
import { installSessionFixture } from "./session-fixture.mjs";
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
    await expect(page.getByRole("button", { name: /^42(?: Credits)?$/ })).toBeVisible();
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
