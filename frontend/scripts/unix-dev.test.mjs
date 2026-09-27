// Integration tests: real Vite sockets + a fake cargo process tree, no GUI/build.
// Run: node --test frontend/scripts/unix-dev.test.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import WebSocket from "ws";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("../../", import.meta.url));
const launcher = path.join(rootDir, "script/artcraft/unix_dev.sh");

test("skips occupied ports, pairs Tauri with real Vite/HMR, and cleans up on Ctrl-C", { timeout: 40000 }, async (t) => {
  const occupied = await occupyPort(t);
  const startingPort = occupied.address().port;
  const run = await fixture(t, { ARTCRAFT_DEV_PORT: String(startingPort) });
  const record = await run.record();
  const config = overrides(record);
  const url = config.build.devUrl;
  assert.ok(Number(new URL(url).port) > startingPort);
  assert.equal(new URL(url).hostname, "127.0.0.1");
  assert.equal(config.build.beforeDevCommand, "");
  assert.ok(!record.args.includes("--no-watch"));
  assert.ok(!record.args.includes("--no-dev-server-wait"));
  assert.equal(record.env.TAURI_APP_PATH, path.join(rootDir, "crates/desktop/artcraft"));
  assert.equal(record.env.TAURI_FRONTEND_PATH, path.join(rootDir, "frontend"));
  assert.ok(config.app.security.devCsp["connect-src"].includes(url.replace("http:", "ws:")));
  assert.match(await (await fetch(url)).text(), /\/src\/index\.tsx/);
  assert.match(await (await fetch(`${url}/@vite/client`)).text(), /WebSocket/);

  run.proc.kill("SIGINT");
  assert.deepEqual(await run.exited, [130, null], run.output());
  await until(() => !alive(record.pid) && !alive(record.childPid));
  await assert.rejects(fetch(url));
  assert.equal(occupied.listening, true, "must not terminate the existing listener");
});

test("Tauri failure propagates and stops Vite and leftover descendants", { timeout: 40000 }, async (t) => {
  const run = await fixture(t, { TEST_EXIT_CODE: "17" });
  const record = await run.record();
  assert.deepEqual(await run.exited, [17, null], run.output());
  await until(() => !alive(record.childPid));
  await assert.rejects(fetch(overrides(record).build.devUrl));
});

test("SIGTERM shuts down the complete process tree", { timeout: 40000 }, async (t) => {
  const run = await fixture(t);
  const record = await run.record();
  run.proc.kill("SIGTERM");
  assert.deepEqual(await run.exited, [143, null], run.output());
  await until(() => !alive(record.pid) && !alive(record.childPid));
  await assert.rejects(fetch(overrides(record).build.devUrl));
});

test("invalid ports fail before starting Tauri", { timeout: 40000 }, async (t) => {
  const run = await fixture(t, { ARTCRAFT_DEV_PORT: "65536" });
  assert.deepEqual(await run.exited, [1, null]);
  assert.match(run.output(), /ARTCRAFT_DEV_PORT must be an integer/);
});

test("concurrent launchers use different ports without replacing either frontend", { timeout: 40000 }, async (t) => {
  const occupied = await occupyPort(t);
  const env = { ARTCRAFT_DEV_PORT: String(occupied.address().port) };
  const first = await fixture(t, env);
  const second = await fixture(t, env);
  const [a, b] = await Promise.all([first.record(), second.record()]);
  const firstUrl = overrides(a).build.devUrl;
  const secondUrl = overrides(b).build.devUrl;
  assert.notEqual(firstUrl, secondUrl);
  assert.equal((await fetch(firstUrl)).status, 200);
  assert.equal((await fetch(secondUrl)).status, 200);
  first.proc.kill("SIGINT");
  await first.exited;
  assert.equal((await fetch(secondUrl)).status, 200);
  assert.ok(alive(b.pid));
});

test("a React source edit sends HMR on the selected port without restarting Rust", { timeout: 40000 }, async (t) => {
  const run = await fixture(t);
  const record = await run.record();
  const url = overrides(record).build.devUrl;
  const probeDir = await mkdtemp(path.join(rootDir, "frontend/apps/artcraft/app/src/dev-probe-"));
  t.after(() => rm(probeDir, { recursive: true, force: true }));
  const probe = path.join(probeDir, "Probe.tsx");
  const moduleUrl = `/src/${path.basename(probeDir)}/Probe.tsx`;
  await writeFile(probe, "export default function Probe() { return <div>before</div>; }\n");
  const code = await (await fetch(`${url}${moduleUrl}`)).text();
  assert.match(code, /\$RefreshReg\$/);

  const client = await (await fetch(`${url}/@vite/client`)).text();
  const token = client.match(/const wsToken = "([^"]+)"/)[1];
  const ws = new WebSocket(`${url.replace("http:", "ws:")}/?token=${token}`, "vite-hmr");
  t.after(() => ws.terminate());
  const messages = [];
  ws.on("message", (data) => messages.push(JSON.parse(data.toString())));
  await once(ws, "open");
  await writeFile(probe, "export default function Probe() { return <div>after</div>; }\n");
  await until(() => messages.some((m) => m.type === "update" && m.updates.some((u) => u.path === moduleUrl)));
  assert.match(await (await fetch(`${url}${moduleUrl}`)).text(), /after/);
  assert.ok(alive(record.pid), "JS edits must leave the Rust watcher running");
  assert.equal((await run.record()).pid, record.pid);
});

test("Rust watcher arguments include SQLx inputs and preserve caller overrides", { timeout: 40000 }, async (t) => {
  const run = await fixture(t, { SQLX_OFFLINE: "false", RUSTFLAGS: "-C debuginfo=1" });
  const record = await run.record();
  assert.equal(record.env.SQLX_OFFLINE, "false");
  assert.equal(record.env.RUSTFLAGS, "-C debuginfo=1");
  assert.ok(record.args.includes(path.join(rootDir, ".sqlx")));
  assert.ok(record.args.includes(path.join(rootDir, "_database/sql/artcraft_migrations")));
  const ignores = await readFile(path.join(rootDir, "crates/desktop/artcraft/.taurignore"), "utf8");
  assert.doesNotMatch(ignores, /^(crates\/|Cargo\.toml|Cargo\.lock)$/m);
});

async function until(check) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const result = await check();
    if (result) return result;
    await delay(50);
  }
  throw new Error("Timed out waiting for dev launcher");
}

async function fixture(t, env = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "artcraft-dev-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, "cargo"), `#!/usr/bin/env node
const fs = require("node:fs");
const { spawn } = require("node:child_process");
if (process.argv.includes("--version")) process.exit(0);
const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
fs.writeFileSync(process.env.TEST_RECORD, JSON.stringify({
  args: process.argv.slice(2), cwd: process.cwd(),
  env: Object.fromEntries(["TAURI_APP_PATH", "TAURI_FRONTEND_PATH", "SQLX_OFFLINE", "RUSTFLAGS"].map(key => [key, process.env[key]])),
  pid: process.pid, childPid: child.pid,
}));
if (process.env.TEST_EXIT_CODE) setTimeout(() => process.exit(Number(process.env.TEST_EXIT_CODE)), 200);
setInterval(() => {}, 1000);
`, { mode: 0o755 });

  const recordFile = path.join(dir, "record.json");
  const proc = spawn(launcher, [], {
    // Prove the launcher is independent of the invoking working directory.
    cwd: dir,
    env: { ...process.env, ...env, PATH: `${dir}:${process.env.PATH}`, TEST_RECORD: recordFile },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  proc.stdout.on("data", (chunk) => { output += chunk; });
  proc.stderr.on("data", (chunk) => { output += chunk; });
  const exited = once(proc, "exit");
  t.after(async () => {
    if (proc.exitCode === null && proc.signalCode === null) proc.kill("SIGTERM");
    await exited;
  });
  return {
    proc, exited, output: () => output,
    async record() {
      return until(async () => {
        if (proc.exitCode !== null) throw new Error(output);
        try { return JSON.parse(await readFile(recordFile, "utf8")); }
        catch (error) { if (error.code !== "ENOENT") throw error; }
      });
    },
  };
}

async function occupyPort(t) {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return server;
}

function alive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error.code === "ESRCH") return false; throw error; }
}

function overrides(record) {
  return JSON.parse(record.args.at(-1));
}
