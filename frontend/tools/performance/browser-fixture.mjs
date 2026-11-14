// Runs before any application script. No real account, Rust IPC, or remote API.
export function installBrowserFixture() {
  const counters = { commands: {}, fileReads: 0, webglContexts: 0, longTasks: [] };
  window.__ARTCRAFT_COUNTERS__ = counters;
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") counters.webglContexts++;
    return getContext.call(this, type, ...args);
  };
  const readAsDataURL = FileReader.prototype.readAsDataURL;
  FileReader.prototype.readAsDataURL = function (...args) {
    counters.fileReads++;
    return readAsDataURL.apply(this, args);
  };
  if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
    new PerformanceObserver((list) => {
      counters.longTasks.push(...list.getEntries().map(({ startTime, duration }) => ({ startTime, duration })));
    }).observe({ type: "longtask", buffered: true });
  }
  let callbackId = 0;
  const callbacks = new Map();
  window.__TAURI_INTERNALS__ = {
    metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
    transformCallback(callback) { callbacks.set(++callbackId, callback); return callbackId; },
    unregisterCallback(id) { callbacks.delete(id); },
    convertFileSrc(path) { return path; },
    async invoke(command, args) {
      counters.commands[command] = (counters.commands[command] ?? 0) + 1;
      if (command === "plugin:event|listen") return args.handler;
      if (command === "plugin:window|inner_size") return { width: 1440, height: 1000 };
      if (command === "plugin:window|scale_factor") return 1;
      if (command === "storyteller_get_login_session_command") return {
        username: "performance_fixture", user_token: "u_performance_fixture",
      };
      if (command === "get_task_queue_command") return { payload: { tasks: [] } };
      // Use the bundled model overlay, as the app does when the listing is unavailable.
      if (command === "list_image_models_command" || command === "list_video_models_command") throw new Error("Offline model listing fixture");
      if (command === "plugin:app|version") return "0.0.0-benchmark";
      if (command === "plugin:app|name") return "ArtCraft Benchmark";
      if (command === "plugin:os|platform") return "macos";
      if (command.startsWith("plugin:http|")) throw new Error("Network disabled in performance fixture");
      return { success: true, payload: {} };
    },
  };
  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
}

export async function seedDrawingScene() {
  const { scene, Node } = window.__ARTCRAFT_BENCH__;
  scene.getState().RESET();
  scene.getState().setBaseImageInfo({ url: "", mediaToken: "fixture-blank", isBlankCanvas: true, blankCanvasWidth: 1024, blankCanvasHeight: 1024 });
  // Deterministic noisy pixels resist PNG compression, like imported artwork.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d");
  const pixels = context.createImageData(1024, 1024);
  let random = 12345;
  for (let i = 0; i < pixels.data.length; i += 4) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    pixels.data[i] = random & 255;
    pixels.data[i + 1] = (random >>> 8) & 255;
    pixels.data[i + 2] = (random >>> 16) & 255;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve));
  const drawNodes = [];
  for (let i = 0; i < 4; i++) {
    const node = new Node({ id: `fixture-image-${i}`, type: "image", x: i * 220, y: i * 100, width: 400, height: 400, fill: "transparent" });
    await node.setImageFromFile(new File([blob], `fixture-${i}.png`, { type: "image/png" }));
    drawNodes.push(node);
  }
  for (let i = 0; i < 80; i++) {
    drawNodes.push({
      id: `fixture-line-${i}`, type: "line", draggable: true, stroke: "#7766ee", strokeWidth: 3,
      points: Array.from({ length: 200 }, (_, j) => j % 2 === 0 ? j * 4 : i * 10 + Math.sin(j) * 30),
    });
  }
  scene.setState({ drawNodes, selectedNodeIds: [drawNodes[0].id] });
  scene.getState().saveState();
  return { images: 4, imageSize: 1024, imageBytesEach: blob.size, strokes: 80, coordinatesPerStroke: 200 };
}

export async function measureTabChange(target) {
  const counters = window.__ARTCRAFT_COUNTERS__;
  const readsBefore = counters.fileReads;
  const start = performance.now();
  const success = await window.__ARTCRAFT_BENCH__.tabs.getState().setActiveTab(target);
  if (!success) throw new Error(`Tab change to ${target} failed`);
  const stateReadyMs = performance.now() - start;
  const ready = () => target === "2D"
    ? !!document.querySelector(".konvajs-content canvas")
    : !!Array.from(document.querySelectorAll("h1")).find((h) => h.textContent.includes("craft"));
  while (!ready()) {
    if (performance.now() - start > 15000) throw new Error(`Tab ${target} never rendered`);
    await new Promise(requestAnimationFrame);
  }
  // A rendering opportunity after the target DOM committed, not GPU completion.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const paintMs = performance.now() - start;
  performance.measure(`artcraft:tab:${target}`, { start, end: performance.now() });
  return { stateReadyMs, paintMs, fileReads: counters.fileReads - readsBefore };
}
