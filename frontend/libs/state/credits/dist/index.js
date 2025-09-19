import d from "react";
const u = (t) => {
  let e;
  const r = /* @__PURE__ */ new Set(), o = (a, c) => {
    const s = typeof a == "function" ? a(e) : a;
    if (!Object.is(s, e)) {
      const D = e;
      e = c ?? (typeof s != "object" || s === null) ? s : Object.assign({}, e, s), r.forEach((S) => S(e, D));
    }
  }, n = () => e, i = { setState: o, getState: n, getInitialState: () => E, subscribe: (a) => (r.add(a), () => r.delete(a)) }, E = e = t(o, n, i);
  return i;
}, W = (t) => t ? u(t) : u, y = (t) => t;
function O(t, e = y) {
  const r = d.useSyncExternalStore(
    t.subscribe,
    () => e(t.getState()),
    () => e(t.getInitialState())
  );
  return d.useDebugValue(r), r;
}
const l = (t) => {
  const e = W(t), r = (o) => O(e, o);
  return Object.assign(r, e), r;
}, I = (t) => t ? l(t) : l;
async function f(t, e = {}, r) {
  return window.__TAURI_INTERNALS__.invoke(t, e, r);
}
const g = async () => {
  try {
    return await f("storyteller_get_credits_command");
  } catch (t) {
    throw t;
  }
};
var _;
(function(t) {
  t.WINDOW_RESIZED = "tauri://resize", t.WINDOW_MOVED = "tauri://move", t.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", t.WINDOW_DESTROYED = "tauri://destroyed", t.WINDOW_FOCUS = "tauri://focus", t.WINDOW_BLUR = "tauri://blur", t.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", t.WINDOW_THEME_CHANGED = "tauri://theme-changed", t.WINDOW_CREATED = "tauri://window-created", t.WEBVIEW_CREATED = "tauri://webview-created", t.DRAG_ENTER = "tauri://drag-enter", t.DRAG_OVER = "tauri://drag-over", t.DRAG_DROP = "tauri://drag-drop", t.DRAG_LEAVE = "tauri://drag-leave";
})(_ || (_ = {}));
const m = I((t) => ({
  freeCredits: 0,
  monthlyCredits: 0,
  bankedCredits: 0,
  totalCredits: 0,
  // Call to fetch credits from the server
  fetchFromServer: async () => {
    let e;
    try {
      e = await g();
    } catch (r) {
      console.error("Error fetching credits", r);
      return;
    }
    console.log("Fetched credits from server: ", e), e.payload && t((r) => ({
      freeCredits: e.payload.free_credits,
      monthlyCredits: e.payload.monthly_credits,
      bankedCredits: e.payload.banked_credits,
      totalCredits: e.payload.sum_total_credits
    }));
  }
}));
export {
  m as useCreditsState
};
