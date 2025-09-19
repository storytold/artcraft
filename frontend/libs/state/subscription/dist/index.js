import u from "react";
const g = {
  slug: "free",
  name: "Free",
  isPaidPlan: !1,
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    { text: "Free daily generations", included: !0 },
    { text: "Limited access to ArtCraft tools", included: !0 }
  ],
  colorScheme: "dark"
}, y = [
  g,
  {
    slug: "artcraft_basic",
    name: "Basic",
    isPaidPlan: !0,
    monthlyPrice: 8,
    yearlyPrice: 96,
    originalMonthlyPrice: 10,
    originalYearlyPrice: 120,
    features: [
      { text: "~1,010 Flux images", included: !0 },
      { text: "~36,000 real-time images", included: !0 },
      { text: "~180 enhanced images", included: !0 },
      { text: "~6 training jobs", included: !0 },
      { text: "Commercial license", included: !0 }
    ],
    colorScheme: "green"
  },
  {
    slug: "artcraft_pro",
    name: "Pro",
    isPaidPlan: !0,
    monthlyPrice: 28,
    yearlyPrice: 336,
    originalMonthlyPrice: 35,
    originalYearlyPrice: 420,
    features: [
      { text: "~5,048 Flux images", included: !0 },
      { text: "~180,000 real-time images", included: !0 },
      { text: "~900 enhanced images", included: !0 },
      { text: "~30 training jobs", included: !0 },
      { text: "Commercial license", included: !0 }
    ],
    colorScheme: "purple"
  },
  {
    slug: "artcraft_max",
    name: "Max",
    isPaidPlan: !0,
    monthlyPrice: 48,
    yearlyPrice: 576,
    originalMonthlyPrice: 60,
    originalYearlyPrice: 720,
    features: [
      { text: "~15,142 Flux images", included: !0 },
      { text: "~540,000 real-time images", included: !0 },
      { text: "~2,700 enhanced images", included: !0 },
      { text: "~90 training jobs", included: !0 },
      { text: "Commercial license", included: !0 }
    ],
    colorScheme: "orange"
  }
], O = new Map(
  y.map((e) => [e.slug, e])
), l = (e) => {
  let i;
  const t = /* @__PURE__ */ new Set(), r = (n, s) => {
    const a = typeof n == "function" ? n(i) : n;
    if (!Object.is(a, i)) {
      const m = i;
      i = s ?? (typeof a != "object" || a === null) ? a : Object.assign({}, i, a), t.forEach((b) => b(i, m));
    }
  }, c = () => i, o = { setState: r, getState: c, getInitialState: () => p, subscribe: (n) => (t.add(n), () => t.delete(n)) }, p = i = e(r, c, o);
  return o;
}, S = (e) => e ? l(e) : l, E = (e) => e;
function P(e, i = E) {
  const t = u.useSyncExternalStore(
    e.subscribe,
    () => i(e.getState()),
    () => i(e.getInitialState())
  );
  return u.useDebugValue(t), t;
}
const d = (e) => {
  const i = S(e), t = (r) => P(i, r);
  return Object.assign(t, i), t;
}, x = (e) => e ? d(e) : d;
async function f(e, i = {}, t) {
  return window.__TAURI_INTERNALS__.invoke(e, i, t);
}
const D = async () => {
  try {
    return await f("storyteller_get_subscription_command");
  } catch (e) {
    throw e;
  }
};
var _;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(_ || (_ = {}));
const A = x((e, i) => ({
  subscriptionInfo: void 0,
  // Returns true if the user has a paid plan.
  // (We do not store "free" as a plan.)
  hasPaidPlan: () => {
    var t;
    return ((t = i().subscriptionInfo) == null ? void 0 : t.subscriptionToken) !== void 0;
  },
  // Returns true if the user can cancel their plan.
  // (The user can't cancel an already set to cancel/expire plan again)
  canCancelPlan: () => {
    const t = i().subscriptionInfo;
    return (t == null ? void 0 : t.subscriptionToken) !== void 0 && (t == null ? void 0 : t.subscriptionEndAt) === void 0;
  },
  // Call to fetch credits from the server
  fetchFromServer: async () => {
    let t;
    try {
      t = await D();
    } catch (r) {
      console.error("Error fetching subscription", r);
      return;
    }
    if (console.log("Fetched subscription from server: ", t), t.payload) {
      let r;
      t.payload.active_subscription && (r = {
        subscriptionToken: t.payload.active_subscription.subscription_token,
        productSlug: t.payload.active_subscription.product_slug,
        namespace: t.payload.active_subscription.namespace,
        nextBillAt: t.payload.active_subscription.next_bill_at ? new Date(t.payload.active_subscription.next_bill_at) : void 0,
        subscriptionEndAt: t.payload.active_subscription.subscription_end_at ? new Date(t.payload.active_subscription.subscription_end_at) : void 0
      }), e((c) => ({
        subscriptionInfo: r
      }));
    }
  }
}));
export {
  g as FREE_PLAN,
  y as SUBSCRIPTION_PLANS,
  O as SUBSCRIPTION_PLANS_BY_SLUG,
  A as useSubscriptionState
};
