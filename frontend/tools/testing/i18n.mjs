import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { installBrowserFixture } from "../performance/browser-fixture.mjs";
import { installSessionFixture } from "./session-fixture.mjs";

const url = new URL(process.argv[2] || "http://127.0.0.1:5193");
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
  throw new Error("Use a local development or preview URL.");
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
  await page.goto(url.href);
  await expect(page.getByRole("heading", { name: "What will you craft today?" })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("zh-CN");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("button", { name: "通用", exact: true })).toBeVisible();
  await expect(page.getByText("按 Enter 生成", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "外观", exact: true }).click();
  await expect(page.getByRole("button", { name: "极光", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "快捷键", exact: true }).click();
  const shortcutSearch = page.getByPlaceholder("按名称搜索，例如“旋转”“相机上移”…");
  await shortcutSearch.fill("相机上移");
  await expect(page.getByText("相机上移", { exact: true })).toBeVisible();
  await expect(page.getByText("1 项匹配", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "修改快捷键", exact: true }).click();
  await page.keyboard.press("w");
  await expect(page.getByRole("alert")).toContainText("相机前移");
  await expect(page.getByRole("button", { name: "仍然重新绑定", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await shortcutSearch.fill("Camera up");
  await expect(page.getByText("相机上移", { exact: true })).toBeVisible();
  await shortcutSearch.fill("没有这个快捷键");
  await expect(page.getByText("没有与“没有这个快捷键”匹配的快捷键。", { exact: true })).toBeVisible();
  await shortcutSearch.fill("");
  await mkdir("../output/playwright", { recursive: true });
  await page.screenshot({ path: "../output/playwright/i18n-keybinds-zh-CN.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "今天想创作些什么？" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "今天想创作些什么？" })).toBeVisible();
  await mkdir("../output/playwright", { recursive: true });
  await page.screenshot({ path: "../output/playwright/i18n-home-zh-CN.png", fullPage: true });

  for (const [card, placeholder] of [
    ["生成图片 使用 AI 生成图片", "描述你想要的画面…"],
    ["生成视频 从图片生成视频", "描述你想要的视频内容…"],
    ["生成音频 生成音乐和音效", "描述你想要的音乐或声音…"],
  ]) {
    await page.goto(url.href);
    await page.getByRole("button", { name: card, exact: true }).click();
    await expect(page.getByPlaceholder(placeholder).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "生成", exact: true }).first()).toBeVisible();
  }
  const prompt = "Do not translate my prompt: 一只猫";
  await page.getByPlaceholder("描述你想要的音乐或声音…").first().fill(prompt);
  await page.getByRole("button", { name: "设置", exact: true }).click();
  await page.getByLabel("语言", { exact: true }).selectOption("en");
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder("Describe the music or sound you want...").first()).toHaveValue(prompt);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.getByRole("heading", { name: "What will you craft today?" })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("zh-CN");
  await page.getByRole("button", { name: "账户", exact: true }).click();
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await expect(page.getByRole("heading", { name: "创建账号", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("heading", { name: "欢迎回来。", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "扫码登录", exact: true })).toBeVisible();
  await page.screenshot({ path: "../output/playwright/i18n-login-zh-CN.png", fullPage: true });
  await page.getByPlaceholder("you@example.com 或用户名").fill("session_smoke");
  await page.getByPlaceholder("至少 8 个字符").fill("fixture-password-only");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("heading", { name: "已登录为 session_smoke", exact: true })).toBeVisible();
  assert.deepEqual(errors, [], "Application runtime errors");
  console.log("PASS: English default, Chinese settings/home/create pages, reload persistence, English restoration, unchanged user prompt, bilingual shortcut search/conflicts, and Chinese login.");
} finally {
  await browser.close();
}
