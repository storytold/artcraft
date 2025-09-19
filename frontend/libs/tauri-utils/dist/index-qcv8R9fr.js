import { useState as N, useEffect as W, useCallback as I } from "react";
const K = 1;
function E() {
  if (typeof window < "u") {
    if ("__TAURI_INTERNALS__" in window)
      return !0;
    if ("__TAURI__" in window)
      return !0;
  }
  return !1;
}
window.IsDesktopApp = E;
function s(t, e, n, r) {
  if (typeof e == "function" ? t !== e || !0 : !e.has(t)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return n === "m" ? r : n === "a" ? r.call(t) : r ? r.value : e.get(t);
}
function p(t, e, n, r, h) {
  if (typeof e == "function" ? t !== e || !0 : !e.has(t)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return e.set(t, n), n;
}
var l, a, m, C, g;
const S = "__TAURI_TO_IPC_KEY__";
function D(t, e = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(t, e);
}
class B {
  constructor(e) {
    l.set(this, void 0), a.set(this, 0), m.set(this, []), C.set(this, void 0), p(this, l, e || (() => {
    })), this.id = D((n) => {
      const r = n.index;
      if ("end" in n) {
        r == s(this, a, "f") ? this.cleanupCallback() : p(this, C, r);
        return;
      }
      const h = n.message;
      if (r == s(this, a, "f")) {
        for (s(this, l, "f").call(this, h), p(this, a, s(this, a, "f") + 1); s(this, a, "f") in s(this, m, "f"); ) {
          const _ = s(this, m, "f")[s(this, a, "f")];
          s(this, l, "f").call(this, _), delete s(this, m, "f")[s(this, a, "f")], p(this, a, s(this, a, "f") + 1);
        }
        s(this, a, "f") === s(this, C, "f") && this.cleanupCallback();
      } else
        s(this, m, "f")[r] = h;
    });
  }
  cleanupCallback() {
    window.__TAURI_INTERNALS__.unregisterCallback(this.id);
  }
  set onmessage(e) {
    p(this, l, e);
  }
  get onmessage() {
    return s(this, l, "f");
  }
  [(l = /* @__PURE__ */ new WeakMap(), a = /* @__PURE__ */ new WeakMap(), m = /* @__PURE__ */ new WeakMap(), C = /* @__PURE__ */ new WeakMap(), S)]() {
    return `__CHANNEL__:${this.id}`;
  }
  toJSON() {
    return this[S]();
  }
}
async function y(t, e = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(t, e, n);
}
class Q {
  get rid() {
    return s(this, g, "f");
  }
  constructor(e) {
    g.set(this, void 0), p(this, g, e);
  }
  /**
   * Destroys and cleans up this resource from memory.
   * **You should not call any method on this object anymore and should drop any reference to it.**
   */
  async close() {
    return y("plugin:resources|close", {
      rid: this.rid
    });
  }
}
g = /* @__PURE__ */ new WeakMap();
const R = "Request cancelled";
async function v(t, e) {
  const n = e == null ? void 0 : e.signal;
  if (n != null && n.aborted)
    throw new Error(R);
  const r = e == null ? void 0 : e.maxRedirections, h = e == null ? void 0 : e.connectTimeout, _ = e == null ? void 0 : e.proxy, d = e == null ? void 0 : e.danger;
  e && (delete e.maxRedirections, delete e.connectTimeout, delete e.proxy, delete e.danger);
  const o = e != null && e.headers ? e.headers instanceof Headers ? e.headers : new Headers(e.headers) : new Headers(), f = new Request(t, e), i = await f.arrayBuffer(), x = i.byteLength !== 0 ? Array.from(new Uint8Array(i)) : null;
  for (const [c, w] of f.headers)
    o.get(c) || o.set(c, w);
  const L = (o instanceof Headers ? Array.from(o.entries()) : Array.isArray(o) ? o : Object.entries(o)).map(([c, w]) => [
    c,
    // we need to ensure we have all header values as strings
    // eslint-disable-next-line
    typeof w == "string" ? w : w.toString()
  ]);
  if (n != null && n.aborted)
    throw new Error(R);
  const k = await y("plugin:http|fetch", {
    clientConfig: {
      method: f.method,
      url: f.url,
      headers: L,
      data: x,
      maxRedirections: r,
      connectTimeout: h,
      proxy: _,
      danger: d
    }
  }), z = () => y("plugin:http|fetch_cancel", { rid: k });
  if (n != null && n.aborted)
    throw z(), new Error(R);
  n == null || n.addEventListener("abort", () => void z());
  const { status: M, statusText: U, url: P, headers: H, rid: O } = await y("plugin:http|fetch_send", {
    rid: k
  }), F = [101, 103, 204, 205, 304].includes(M) ? null : new ReadableStream({
    start: (c) => {
      const w = new B();
      w.onmessage = (A) => {
        if (n != null && n.aborted) {
          c.error(R);
          return;
        }
        const b = new Uint8Array(A), j = b[b.byteLength - 1], q = b.slice(0, b.byteLength - 1);
        if (j == 1) {
          c.close();
          return;
        }
        c.enqueue(q);
      }, y("plugin:http|fetch_read_body", {
        rid: O,
        streamChannel: w
      }).catch((A) => {
        c.error(A);
      });
    }
  }), T = new Response(F, {
    status: M,
    statusText: U
  });
  return Object.defineProperty(T, "url", { value: P }), Object.defineProperty(T, "headers", {
    value: new Headers(H)
  }), T;
}
function $(t, e) {
  return E() ? e !== void 0 ? v(t, e) : v(t) : e !== void 0 ? fetch(t, e) : fetch(t);
}
window.FetchProxy = $;
async function u() {
  const { getCurrentWindow: t } = await import("./window-DWQP7J0e.js");
  return t();
}
function X() {
  const t = E(), [e, n] = N(!1);
  W(() => {
    if (!t) return;
    let d, o, f;
    return (async () => {
      try {
        const i = await u();
        n(await i.isMaximized());
      } catch {
      }
      try {
        const { listen: i } = await import("./event-BZ9JYSRZ.js");
        d = await i(
          "tauri://maximize",
          () => n(!0)
        ), o = await i(
          "tauri://unmaximize",
          () => n(!1)
        ), f = await i("tauri://resize", async () => {
          try {
            const x = await u();
            n(await x.isMaximized());
          } catch {
          }
        });
      } catch {
      }
    })(), () => {
      d && d(), o && o(), f && f();
    };
  }, [t]);
  const r = I(async () => {
    if (!t) return;
    await (await u()).minimize();
  }, [t]), h = I(async () => {
    if (!t) return;
    await (await u()).toggleMaximize();
  }, [t]), _ = I(async () => {
    if (!t) return;
    await (await u()).close();
  }, [t]);
  return { isDesktop: t, isMaximized: e, minimize: r, toggleMaximize: h, close: _ };
}
async function Y() {
  return (await u()).minimize();
}
async function Z() {
  return (await u()).toggleMaximize();
}
async function V() {
  return (await u()).close();
}
async function ee() {
  return (await u()).isMaximized();
}
function te() {
  const [t, e] = N(
    void 0
  );
  return W(() => {
    if (E() && typeof navigator < "u") {
      const n = navigator.userAgent || "";
      /Macintosh|Mac OS X/i.test(n) ? e("macos") : /Windows/i.test(n) ? e("windows") : e("linux");
    }
  }, []), t;
}
export {
  $ as F,
  E as I,
  Q as R,
  S,
  K as T,
  Z as a,
  ee as b,
  V as c,
  te as d,
  y as i,
  Y as m,
  D as t,
  X as u
};
