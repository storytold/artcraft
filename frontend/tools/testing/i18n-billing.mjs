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
  await context.addInitScript(installSessionFixture);
  await context.addInitScript(() => localStorage.setItem("artcraft-locale", "zh-CN"));
  await context.route("**/*", (route) => route.request().url().startsWith(url.origin) || route.request().url().startsWith("blob:") ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url.href);
  await page.getByRole("button", { name: "升级", exact: true }).click();
  await expect(page.getByRole("heading", { name: "选择套餐", exact: true })).toBeVisible();
  await expect(page.getByText("1,000 积分/月", { exact: true })).toBeVisible();
  await page.getByText("月付", { exact: true }).click();
  await expect(page.getByText("按月付费 · 随时取消")).toHaveCount(3);
  await mkdir("../output/playwright", { recursive: true });
  await expect.poll(() => page.getByRole("dialog").last().evaluate((element) => {
    let opacity = 1;
    for (let node = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    return opacity;
  })).toBeGreaterThan(0.99);
  await page.screenshot({ path: "../output/playwright/i18n-pricing-zh-CN.png", fullPage: true });
  await page.getByRole("button", { name: "购买积分", exact: true }).click();
  await expect(page.getByRole("heading", { name: /购买\s*积分/ })).toBeVisible();
  await expect(page.getByText("一次性购买积分包，无需订阅。")).toBeVisible();
  await expect(page.getByRole("button", { name: /1,000.*积分.*\$10.*购买/ })).toBeVisible();
  await expect.poll(() => page.getByRole("dialog").last().evaluate((element) => {
    let opacity = 1;
    for (let node = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    return opacity;
  })).toBeGreaterThan(0.99);
  await page.screenshot({ path: "../output/playwright/i18n-credits-zh-CN.png", fullPage: true });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "生成图片 使用 AI 生成图片", exact: true }).click();
  await page.getByTitle("费用计算器", { exact: true }).click();
  await expect(page.getByText("费用明细", { exact: true })).toBeVisible();
  await expect(page.getByText("预估价格", { exact: true })).toBeVisible();
  await expect.poll(() => page.getByRole("dialog").last().evaluate((element) => {
    let opacity = 1;
    for (let node = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
    return opacity;
  })).toBeGreaterThan(0.99);
  await page.screenshot({ path: "../output/playwright/i18n-costs-zh-CN.png", fullPage: true });
  const commands = await page.evaluate(() => Object.keys(window.__ARTCRAFT_COUNTERS__.commands));
  assert.equal(commands.some((cmd) => /purchase|customer_portal|open_url/.test(cmd)), false, "No checkout or external links opened");
  assert.deepEqual(errors, [], "Application runtime errors");
  console.log("PASS: Chinese pricing, cadence, credits, costs, and no checkout commands.");
} finally {
  await browser.close();
}
