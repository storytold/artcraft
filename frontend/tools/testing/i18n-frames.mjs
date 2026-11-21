import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { installBrowserFixture } from "../performance/browser-fixture.mjs";
import { installSessionFixture } from "./session-fixture.mjs";

const url = new URL(process.argv[2] || "http://127.0.0.1:5193");
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("Use a local development or preview URL.");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(installBrowserFixture);
  await context.addInitScript(installSessionFixture, { withLibraryAndTasks: true });
  await context.addInitScript(() => localStorage.setItem("artcraft-locale", "zh-CN"));
  await context.route("**/*", (route) => route.request().url().startsWith(url.origin) || route.request().url().startsWith("blob:") ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url.href);
  await page.getByRole("button", { name: "视频帧提取 从视频中提取画面", exact: true }).click();
  await expect(page.getByRole("heading", { name: "提取视频帧" })).toBeVisible();
  await expect(page.getByRole("button", { name: "从素材库选择" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles("apps/artcraft/app/public/resources/videos/artcraft-canvas-demo.mp4");
  await expect(page.getByLabel("提取帧数")).toHaveValue("10");
  await page.getByLabel("提取帧数").fill("2");
  await page.getByLabel("帧间隔（毫秒）").fill("200");
  await expect.poll(() => page.locator("video").evaluate((video) => video.readyState)).toBeGreaterThan(1);
  await page.getByRole("button", { name: "提取视频帧", exact: true }).click();
  await expect(page.getByRole("img", { name: "第 2 帧" })).toBeVisible();
  await expect(page.getByText("2 帧", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "保存", exact: true })).toHaveCount(2);
  await mkdir("../output/playwright", { recursive: true });
  await page.getByRole("img", { name: "第 2 帧" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "../output/playwright/i18n-frames-zh-CN.png", fullPage: true });
  await page.getByRole("button", { name: "设置", exact: true }).click();
  await page.getByLabel("语言", { exact: true }).selectOption("en");
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Number of Frames")).toHaveValue("2");
  await expect(page.getByLabel("Distance (ms)")).toHaveValue("200");
  await expect(page.getByRole("img", { name: "Frame 2" })).toBeVisible();
  assert.deepEqual(errors, [], "Application runtime errors");
  console.log("PASS: local video import, Chinese frame extraction, preserved settings/results after switching to English. No uploads.");
} finally {
  await browser.close();
}
