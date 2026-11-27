// Real desktop frontend in Chrome with synthetic native IPC. No accounts/network.
// From frontend/: node tools/testing/copy-error-details.mjs
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { createServer } from "vite";
import { installBrowserFixture } from "../performance/browser-fixture.mjs";

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const output =
  process.env.ARTCRAFT_DIAGNOSTICS_OUTPUT || "/tmp/artcraft-diagnostics";
const message =
  "Provider diagnostic\n" + "complete detail ".repeat(80) + "END OF ERROR";
process.chdir(resolve(frontend, "apps/artcraft"));
await mkdir(output, { recursive: true });
const server = await createServer({
  configFile: resolve(frontend, "apps/artcraft/vite.config.ts"),
  server: { host: "127.0.0.1", port: 0, open: false },
});
let browser;
try {
  await server.listen();
  const url = server.resolvedUrls.local[0];
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await context.addInitScript(installBrowserFixture);
  await context.addInitScript(installDiagnosticsFixture, message);
  await context.route("**/*", (route) => {
    const target = route.request().url();
    return target.startsWith(url) || target.startsWith("blob:")
      ? route.continue()
      : route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page
    .getByRole("heading", { name: "What will you craft today?" })
    .waitFor({ timeout: 60000 });
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.body).userSelect),
    "none",
  );

  const showError = () =>
    page.evaluate(
      async ({ frontend, message }) => {
        const { usePageSceneStore } = await import(
          `/@fs${frontend}/libs/components/pagescene/src/lib/PageSceneStore.ts`
        );
        usePageSceneStore
          .getState()
          .setErrorDialog("Synthetic diagnostic", message);
      },
      { frontend, message },
    );
  await showError();
  const diagnostic = page.getByText(/Provider diagnostic/);
  await expect(diagnostic).toBeVisible();
  // This assertion fails on unchanged main: the message inherits `none`.
  await expect(diagnostic).toHaveCSS("user-select", "text");
  await expect(diagnostic).toHaveCSS("white-space", "pre-wrap");
  await dragAcross(page, diagnostic);
  assert.match(
    await page.evaluate(() => getSelection().toString()),
    /Provider/,
  );
  // Native browser Copy of the mouse selection, as well as the explicit action.
  const selected = await page.evaluate(() => getSelection().toString());
  await page.keyboard.press("ControlOrMeta+c");
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    selected,
  );
  const copy = page.getByRole("button", { name: "Copy error details" });
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(message);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Error details copied" })
      .first(),
  ).toBeVisible();
  await page.screenshot({ path: resolve(output, "dialog.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await showError();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await showError();
  await page.getByRole("region", { name: "Error details" }).focus();
  await page.mouse.click(10, 500);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const queueTrigger = page
    .locator("button")
    .filter({ has: page.locator("svg.lucide-list-checks") });
  await queueTrigger.click();
  const taskCopy = page.getByRole("button", { name: "Copy error details" });
  await expect(taskCopy).toHaveCount(2);
  const reason = page.getByText("Generation failed", { exact: true }).first();
  assert.equal(
    await reason.evaluate((el) => getComputedStyle(el).textOverflow),
    "ellipsis",
  );
  await reason.hover();
  const tooltip = page.getByText(/Provider diagnostic/).first();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS("pointer-events", "none");
  await taskCopy.first().focus();
  await page.keyboard.press("Space");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("Generation failed\n\n" + message);
  await expect(taskCopy.first()).toBeFocused();
  await taskCopy.nth(1).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("An unknown error occurred\n\n" + message);

  await page.evaluate(() => {
    navigator.clipboard.writeText = () =>
      Promise.reject(new DOMException("Synthetic denial", "NotAllowedError"));
  });
  await taskCopy.first().click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Unable to copy error details" })
      .first(),
  ).toBeVisible();
  assert.deepEqual(
    await page.evaluate(() => window.__DIAGNOSTIC_DISMISSED__),
    [],
  );
  await page.screenshot({ path: resolve(output, "tasks.png") });
  await page
    .getByRole("button", { name: "Dismiss", exact: true })
    .first()
    .click();
  await expect(taskCopy).toHaveCount(1);
  assert.deepEqual(await page.evaluate(() => window.__DIAGNOSTIC_DISMISSED__), [
    "t_diagnostic",
  ]);
  await taskCopy.first().focus();
  await page.keyboard.press("Escape");
  await expect(taskCopy).toHaveCount(0);

  // Exercise an actual editor canvas drag with the unchanged global selection policy.
  await page.evaluate(async (frontend) => {
    const { useSceneStore } = await import(
      `/@fs${frontend}/libs/components/pagedraw/src/lib/stores/SceneState.ts`
    );
    useSceneStore.getState().setBaseImageInfo({
      url: "",
      mediaToken: "fixture-blank",
      isBlankCanvas: true,
      blankCanvasWidth: 1024,
      blankCanvasHeight: 1024,
    });
    const { useTabStore } = await import("/src/pages/Stores/TabState.ts");
    await useTabStore.getState().setActiveTab("2D");
  }, frontend);
  const canvas = page.locator(".konvajs-content canvas").last();
  await expect(canvas).toBeVisible({ timeout: 60000 });
  await page.evaluate(() => getSelection().removeAllRanges());
  await expect(canvas).toHaveCSS("user-select", "none");
  await dragAcross(page, canvas, { x: 500, y: 400 });
  assert.equal(await page.evaluate(() => getSelection().toString()), "");
  await page.screenshot({ path: resolve(output, "editor.png") });
  assert.deepEqual(errors, [], "Application runtime errors");
  console.log(
    "PASS: native Chrome selection/copy, complete dialog/task/unknown details, keyboard focus, live feedback, clipboard denial, close/outside/Escape/dismiss, tooltip hover and editor drag.",
  );
} finally {
  await browser?.close();
  await server.close();
}

async function dragAcross(page, locator, start = { x: 3, y: 10 }) {
  // Wait for the modal entrance animation before measuring drag coordinates.
  await locator.hover({ position: start });
  const box = await locator.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + start.x, box.y + start.y);
  await page.mouse.down();
  await page.mouse.move(
    box.x + Math.min(start.x + 170, box.width - 5),
    box.y + start.y,
    {
      steps: 15,
    },
  );
  await page.mouse.up();
}

function installDiagnosticsFixture(message) {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const dismissed = [];
  window.__DIAGNOSTIC_DISMISSED__ = dismissed;
  window.__TAURI_INTERNALS__.invoke = async (command, args) => {
    if (command === "mark_task_as_dismissed_command") {
      dismissed.push(args.request.task);
      return { success: true };
    }
    if (command === "get_task_queue_command") {
      return {
        payload: {
          tasks: ["generation_failed", "unknown"]
            .map((type, index) => ({
              id: index ? "t_unknown" : "t_diagnostic",
              task_status: "complete_failure",
              task_type: "image_generation",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              failure_reason: { failure_type: type, failure_message: message },
            }))
            .filter((task) => !dismissed.includes(task.id)),
        },
      };
    }
    return invoke(command, args);
  };
}
