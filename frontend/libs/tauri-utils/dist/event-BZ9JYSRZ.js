import { i as r, t as c } from "./index-qcv8R9fr.js";
var i;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(i || (i = {}));
async function _(e, a) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e, a), await r("plugin:event|unlisten", {
    event: e,
    eventId: a
  });
}
async function d(e, a, t) {
  var n;
  const l = typeof (t == null ? void 0 : t.target) == "string" ? { kind: "AnyLabel", label: t.target } : (n = t == null ? void 0 : t.target) !== null && n !== void 0 ? n : { kind: "Any" };
  return r("plugin:event|listen", {
    event: e,
    target: l,
    handler: c(a)
  }).then((u) => async () => _(e, u));
}
async function o(e, a, t) {
  return d(e, (n) => {
    _(e, n.id), a(n);
  }, t);
}
async function W(e, a) {
  await r("plugin:event|emit", {
    event: e,
    payload: a
  });
}
async function s(e, a, t) {
  await r("plugin:event|emit_to", {
    target: typeof e == "string" ? { kind: "AnyLabel", label: e } : e,
    event: a,
    payload: t
  });
}
export {
  i as TauriEvent,
  W as emit,
  s as emitTo,
  d as listen,
  o as once
};
