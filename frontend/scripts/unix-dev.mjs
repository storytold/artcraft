// Invoked by script/artcraft/unix_dev.sh. Adapted from ArtcraftX's launcher.
// Living under frontend lets Node resolve the local Vite installation.
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const rootDir = fileURLToPath(new URL("../../", import.meta.url));
const frontendDir = path.join(rootDir, "frontend");
const appDir = path.join(frontendDir, "apps/artcraft");
const rustDir = path.join(rootDir, "crates/desktop/artcraft");
const host = "127.0.0.1";
const startingPort = Number(process.env.ARTCRAFT_DEV_PORT ?? "5193");

let vite;
let rust;
let stopping = false;

async function main() {
  if (!Number.isInteger(startingPort) || startingPort < 1024 || startingPort > 65535) {
    throw new Error("ARTCRAFT_DEV_PORT must be an integer between 1024 and 65535.");
  }

  process.env.VITE_ENVIRONMENT_TYPE ??= "production";
  // Match the app build's cwd, including Tailwind config/content resolution.
  process.chdir(appDir);
  vite = await createServer({
    configFile: path.join(appDir, "vite.config.ts"),
    clearScreen: false,
    server: {
      host,
      port: startingPort,
      // Vite retries occupied ports while binding the real server. There is no
      // port probe/release/rebind race, and no existing process is terminated.
      strictPort: false,
      open: false,
      hmr: true,
    },
  });
  if (stopping) return;
  await vite.listen();
  const { port } = vite.httpServer.address();
  const devUrl = `http://${host}:${port}`;

  // Only initial startup may choose another port. On a Vite config restart,
  // rebind this port or fail visibly so Tauri never follows a silent port hop.
  for (const options of [vite.config.server, vite.config.inlineConfig.server]) {
    options.port = port;
    options.strictPort = true;
  }

  const configPath = path.join(rustDir, "tauri-dev-hot-reload.conf.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (stopping) return;
  const csp = config.app.security.csp;
  const overrides = {
    build: { devUrl, beforeDevCommand: "" },
    app: {
      security: {
        devCsp: {
          ...csp,
          "connect-src": [...csp["connect-src"], devUrl, `ws://${host}:${port}`],
        },
      },
    },
  };

  console.log(`\n[artcraft] Frontend + HMR: ${devUrl}`);
  console.log("[artcraft] Rust/Tauri: native IPC; automatic rebuild and app restart enabled.");
  console.log("[artcraft] Press Ctrl-C to stop both.\n");

  rust = spawn("cargo", [
    "tauri", "dev",
    "--no-dev-server",
    // Tauri watches the desktop crate and its workspace dependencies itself.
    // SQLx's external metadata and migrations also affect the Rust build.
    "--additional-watch-folders", path.join(rootDir, ".sqlx"),
    "--additional-watch-folders", path.join(rootDir, "_database/sql/artcraft_migrations"),
    "--config", configPath,
    "--config", JSON.stringify(overrides),
  ], {
    cwd: rootDir,
    // All cargo/rustc/app descendants inherit this private Unix process group.
    detached: true,
    stdio: ["ignore", "inherit", "inherit"],
    env: {
      ...process.env,
      TAURI_FRONTEND_PATH: frontendDir,
      TAURI_APP_PATH: rustDir,
      SQLX_OFFLINE: process.env.SQLX_OFFLINE ?? "true",
      RUSTFLAGS: process.env.RUSTFLAGS ?? "-Awarnings",
      WEBKIT_DISABLE_DMABUF_RENDERER: process.env.WEBKIT_DISABLE_DMABUF_RENDERER ?? "1",
      WEBKIT_DISABLE_COMPOSITING_MODE: process.env.WEBKIT_DISABLE_COMPOSITING_MODE ?? "1",
    },
  });
  rust.on("error", fail);
  rust.on("exit", (code, signal) => {
    if (!stopping) {
      console.log(`[artcraft] Rust/Tauri exited (${signal ?? code}).`);
      void stop(code ?? 1);
    }
  });
}

async function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  console.log("\n[artcraft] Stopping frontend and Rust/Tauri...");

  const deadline = setTimeout(() => {
    signalRustGroup("SIGKILL");
    process.exit(exitCode);
  }, 5000);
  signalRustGroup("SIGTERM");
  await Promise.allSettled([
    vite?.close(),
    (async () => {
      while (signalRustGroup(0)) await delay(50);
    })(),
  ]);
  clearTimeout(deadline);
  process.exit(exitCode);
}

function signalRustGroup(signal) {
  if (!rust?.pid) return false;
  try {
    process.kill(-rust.pid, signal);
    return true;
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
    return false;
  }
}

function fail(error) {
  console.error(`[artcraft] ${error.stack ?? error}`);
  void stop(1);
}

process.on("SIGINT", () => void stop(130));
process.on("SIGTERM", () => void stop(143));
process.on("SIGHUP", () => void stop(129));
process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);

main().catch(fail);
