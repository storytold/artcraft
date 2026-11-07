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
  await page.getByRole("button", { name: "我的素材库", exact: true }).click();
  await page.getByRole("img", { name: "Session smoke image", exact: true }).click();
  await expect(page.getByRole("button", { name: "分享", exact: true })).toBeVisible();
  await expect(page.getByText("详细信息", { exact: true })).toBeVisible();
  await expect(page.getByText(/\d{4}年\d{1,2}月\d{1,2}日/)).toBeVisible();
  await mkdir("../output/playwright", { recursive: true });
  await expect.poll(() => page.getByRole("dialog").last().evaluate((element) => {
    let opacity = 1;
    for (let node = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    return opacity;
  })).toBeGreaterThan(0.99);
  await page.screenshot({ path: "../output/playwright/i18n-lightbox-zh-CN.png", fullPage: true });
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await expect(page.getByText("删除此素材？", { exact: true })).toBeVisible();
  await expect(page.getByText("此素材将从素材库中永久移除，此操作无法撤销。", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.__i18nMutations), []);
  const commands = await page.evaluate(() => Object.keys(window.__ARTCRAFT_COUNTERS__.commands));
  assert.equal(commands.some((command) => /delete/.test(command)), false);
  assert.deepEqual(errors, [], "Application runtime errors");
  console.log("PASS: Chinese media detail actions/date, unchanged media title, and delete cancellation.");
} finally {
  await browser.close();
}
