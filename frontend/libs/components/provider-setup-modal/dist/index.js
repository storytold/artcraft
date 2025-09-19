import { jsx as G, jsxs as He, Fragment as ft } from "react/jsx-runtime";
import * as C from "react";
import On, { createContext as rv, useState as dt, useRef as De, useEffect as Fe, isValidElement as wu, cloneElement as _u, useContext as wm, useMemo as av, useLayoutEffect as ov, forwardRef as iv, useCallback as sv } from "react";
import * as lv from "react-dom";
import cv, { unstable_batchedUpdates as uv } from "react-dom";
function fn(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function(r) {
    if (e == null || e(r), n === !1 || !r.defaultPrevented)
      return t == null ? void 0 : t(r);
  };
}
function ku(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function _m(...e) {
  return (t) => {
    let n = !1;
    const r = e.map((a) => {
      const o = ku(a, t);
      return !n && typeof o == "function" && (n = !0), o;
    });
    if (n)
      return () => {
        for (let a = 0; a < r.length; a++) {
          const o = r[a];
          typeof o == "function" ? o() : ku(e[a], null);
        }
      };
  };
}
function Wn(...e) {
  return C.useCallback(_m(...e), e);
}
function fv(e, t) {
  const n = C.createContext(t), r = (o) => {
    const { children: s, ...l } = o, f = C.useMemo(() => l, Object.values(l));
    return /* @__PURE__ */ G(n.Provider, { value: f, children: s });
  };
  r.displayName = e + "Provider";
  function a(o) {
    const s = C.useContext(n);
    if (s) return s;
    if (t !== void 0) return t;
    throw new Error(`\`${o}\` must be used within \`${e}\``);
  }
  return [r, a];
}
function dv(e, t = []) {
  let n = [];
  function r(o, s) {
    const l = C.createContext(s), f = n.length;
    n = [...n, s];
    const u = (i) => {
      var c;
      const { scope: p, children: g, ...m } = i, h = ((c = p == null ? void 0 : p[e]) == null ? void 0 : c[f]) || l, b = C.useMemo(() => m, Object.values(m));
      return /* @__PURE__ */ G(h.Provider, { value: b, children: g });
    };
    u.displayName = o + "Provider";
    function d(i, c) {
      var p;
      const g = ((p = c == null ? void 0 : c[e]) == null ? void 0 : p[f]) || l, m = C.useContext(g);
      if (m) return m;
      if (s !== void 0) return s;
      throw new Error(`\`${i}\` must be used within \`${o}\``);
    }
    return [u, d];
  }
  const a = () => {
    const o = n.map((s) => C.createContext(s));
    return function(s) {
      const l = (s == null ? void 0 : s[e]) || o;
      return C.useMemo(
        () => ({ [`__scope${e}`]: { ...s, [e]: l } }),
        [s, l]
      );
    };
  };
  return a.scopeName = e, [r, pv(a, ...t)];
}
function pv(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const r = e.map((a) => ({
      useScope: a(),
      scopeName: a.scopeName
    }));
    return function(a) {
      const o = r.reduce((s, { useScope: l, scopeName: f }) => {
        const u = l(a)[`__scope${f}`];
        return { ...s, ...u };
      }, {});
      return C.useMemo(() => ({ [`__scope${t.scopeName}`]: o }), [o]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
var ra = globalThis != null && globalThis.document ? C.useLayoutEffect : () => {
}, mv = C[" useId ".trim().toString()] || (() => {
}), hv = 0;
function ci(e) {
  const [t, n] = C.useState(mv());
  return ra(() => {
    n((r) => r ?? String(hv++));
  }, [e]), e || (t ? `radix-${t}` : "");
}
var gv = C[" useInsertionEffect ".trim().toString()] || ra;
function yv({
  prop: e,
  defaultProp: t,
  onChange: n = () => {
  },
  caller: r
}) {
  const [a, o, s] = bv({
    defaultProp: t,
    onChange: n
  }), l = e !== void 0, f = l ? e : a;
  {
    const d = C.useRef(e !== void 0);
    C.useEffect(() => {
      const i = d.current;
      i !== l && console.warn(
        `${r} is changing from ${i ? "controlled" : "uncontrolled"} to ${l ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), d.current = l;
    }, [l, r]);
  }
  const u = C.useCallback(
    (d) => {
      var i;
      if (l) {
        const c = vv(d) ? d(e) : d;
        c !== e && ((i = s.current) == null || i.call(s, c));
      } else
        o(d);
    },
    [l, e, o, s]
  );
  return [f, u];
}
function bv({
  defaultProp: e,
  onChange: t
}) {
  const [n, r] = C.useState(e), a = C.useRef(n), o = C.useRef(t);
  return gv(() => {
    o.current = t;
  }, [t]), C.useEffect(() => {
    var s;
    a.current !== n && ((s = o.current) == null || s.call(o, n), a.current = n);
  }, [n, a]), [n, r, o];
}
function vv(e) {
  return typeof e == "function";
}
// @__NO_SIDE_EFFECTS__
function km(e) {
  const t = /* @__PURE__ */ xv(e), n = C.forwardRef((r, a) => {
    const { children: o, ...s } = r, l = C.Children.toArray(o), f = l.find(_v);
    if (f) {
      const u = f.props.children, d = l.map((i) => i === f ? C.Children.count(u) > 1 ? C.Children.only(null) : C.isValidElement(u) ? u.props.children : null : i);
      return /* @__PURE__ */ G(t, { ...s, ref: a, children: C.isValidElement(u) ? C.cloneElement(u, void 0, d) : null });
    }
    return /* @__PURE__ */ G(t, { ...s, ref: a, children: o });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function xv(e) {
  const t = C.forwardRef((n, r) => {
    const { children: a, ...o } = n;
    if (C.isValidElement(a)) {
      const s = Av(a), l = kv(o, a.props);
      return a.type !== C.Fragment && (l.ref = r ? _m(r, s) : s), C.cloneElement(a, l);
    }
    return C.Children.count(a) > 1 ? C.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var wv = Symbol("radix.slottable");
function _v(e) {
  return C.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === wv;
}
function kv(e, t) {
  const n = { ...t };
  for (const r in t) {
    const a = e[r], o = t[r];
    /^on[A-Z]/.test(r) ? a && o ? n[r] = (...s) => {
      const l = o(...s);
      return a(...s), l;
    } : a && (n[r] = a) : r === "style" ? n[r] = { ...a, ...o } : r === "className" && (n[r] = [a, o].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function Av(e) {
  var t, n;
  let r = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, a = r && "isReactWarning" in r && r.isReactWarning;
  return a ? e.ref : (r = (n = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : n.get, a = r && "isReactWarning" in r && r.isReactWarning, a ? e.props.ref : e.props.ref || e.ref);
}
var Ov = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
], Et = Ov.reduce((e, t) => {
  const n = /* @__PURE__ */ km(`Primitive.${t}`), r = C.forwardRef((a, o) => {
    const { asChild: s, ...l } = a, f = s ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ G(f, { ...l, ref: o });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {});
function Sv(e, t) {
  e && lv.flushSync(() => e.dispatchEvent(t));
}
function aa(e) {
  const t = C.useRef(e);
  return C.useEffect(() => {
    t.current = e;
  }), C.useMemo(() => (...n) => {
    var r;
    return (r = t.current) == null ? void 0 : r.call(t, ...n);
  }, []);
}
function Ev(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = aa(e);
  C.useEffect(() => {
    const r = (a) => {
      a.key === "Escape" && n(a);
    };
    return t.addEventListener("keydown", r, { capture: !0 }), () => t.removeEventListener("keydown", r, { capture: !0 });
  }, [n, t]);
}
var Pv = "DismissableLayer", xs = "dismissableLayer.update", Cv = "dismissableLayer.pointerDownOutside", Nv = "dismissableLayer.focusOutside", Au, Am = C.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), Om = C.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: n = !1,
      onEscapeKeyDown: r,
      onPointerDownOutside: a,
      onFocusOutside: o,
      onInteractOutside: s,
      onDismiss: l,
      ...f
    } = e, u = C.useContext(Am), [d, i] = C.useState(null), c = (d == null ? void 0 : d.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, p] = C.useState({}), g = Wn(t, (F) => i(F)), m = Array.from(u.layers), [h] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1), b = m.indexOf(h), _ = d ? m.indexOf(d) : -1, k = u.layersWithOutsidePointerEventsDisabled.size > 0, A = _ >= b, v = $v((F) => {
      const Q = F.target, B = [...u.branches].some((ie) => ie.contains(Q));
      !A || B || (a == null || a(F), s == null || s(F), F.defaultPrevented || l == null || l());
    }, c), H = jv((F) => {
      const Q = F.target;
      [...u.branches].some((B) => B.contains(Q)) || (o == null || o(F), s == null || s(F), F.defaultPrevented || l == null || l());
    }, c);
    return Ev((F) => {
      _ === u.layers.size - 1 && (r == null || r(F), !F.defaultPrevented && l && (F.preventDefault(), l()));
    }, c), C.useEffect(() => {
      if (d)
        return n && (u.layersWithOutsidePointerEventsDisabled.size === 0 && (Au = c.body.style.pointerEvents, c.body.style.pointerEvents = "none"), u.layersWithOutsidePointerEventsDisabled.add(d)), u.layers.add(d), Ou(), () => {
          n && u.layersWithOutsidePointerEventsDisabled.size === 1 && (c.body.style.pointerEvents = Au);
        };
    }, [d, c, n, u]), C.useEffect(() => () => {
      d && (u.layers.delete(d), u.layersWithOutsidePointerEventsDisabled.delete(d), Ou());
    }, [d, u]), C.useEffect(() => {
      const F = () => p({});
      return document.addEventListener(xs, F), () => document.removeEventListener(xs, F);
    }, []), /* @__PURE__ */ G(
      Et.div,
      {
        ...f,
        ref: g,
        style: {
          pointerEvents: k ? A ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: fn(e.onFocusCapture, H.onFocusCapture),
        onBlurCapture: fn(e.onBlurCapture, H.onBlurCapture),
        onPointerDownCapture: fn(
          e.onPointerDownCapture,
          v.onPointerDownCapture
        )
      }
    );
  }
);
Om.displayName = Pv;
var Tv = "DismissableLayerBranch", Iv = C.forwardRef((e, t) => {
  const n = C.useContext(Am), r = C.useRef(null), a = Wn(t, r);
  return C.useEffect(() => {
    const o = r.current;
    if (o)
      return n.branches.add(o), () => {
        n.branches.delete(o);
      };
  }, [n.branches]), /* @__PURE__ */ G(Et.div, { ...e, ref: a });
});
Iv.displayName = Tv;
function $v(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = aa(e), r = C.useRef(!1), a = C.useRef(() => {
  });
  return C.useEffect(() => {
    const o = (l) => {
      if (l.target && !r.current) {
        let f = function() {
          Sm(
            Cv,
            n,
            u,
            { discrete: !0 }
          );
        };
        const u = { originalEvent: l };
        l.pointerType === "touch" ? (t.removeEventListener("click", a.current), a.current = f, t.addEventListener("click", a.current, { once: !0 })) : f();
      } else
        t.removeEventListener("click", a.current);
      r.current = !1;
    }, s = window.setTimeout(() => {
      t.addEventListener("pointerdown", o);
    }, 0);
    return () => {
      window.clearTimeout(s), t.removeEventListener("pointerdown", o), t.removeEventListener("click", a.current);
    };
  }, [t, n]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => r.current = !0
  };
}
function jv(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = aa(e), r = C.useRef(!1);
  return C.useEffect(() => {
    const a = (o) => {
      o.target && !r.current && Sm(Nv, n, { originalEvent: o }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", a), () => t.removeEventListener("focusin", a);
  }, [t, n]), {
    onFocusCapture: () => r.current = !0,
    onBlurCapture: () => r.current = !1
  };
}
function Ou() {
  const e = new CustomEvent(xs);
  document.dispatchEvent(e);
}
function Sm(e, t, n, { discrete: r }) {
  const a = n.originalEvent.target, o = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && a.addEventListener(e, t, { once: !0 }), r ? Sv(a, o) : a.dispatchEvent(o);
}
var ui = "focusScope.autoFocusOnMount", fi = "focusScope.autoFocusOnUnmount", Su = { bubbles: !1, cancelable: !0 }, Mv = "FocusScope", Em = C.forwardRef((e, t) => {
  const {
    loop: n = !1,
    trapped: r = !1,
    onMountAutoFocus: a,
    onUnmountAutoFocus: o,
    ...s
  } = e, [l, f] = C.useState(null), u = aa(a), d = aa(o), i = C.useRef(null), c = Wn(t, (m) => f(m)), p = C.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  C.useEffect(() => {
    if (r) {
      let m = function(k) {
        if (p.paused || !l) return;
        const A = k.target;
        l.contains(A) ? i.current = A : sn(i.current, { select: !0 });
      }, h = function(k) {
        if (p.paused || !l) return;
        const A = k.relatedTarget;
        A !== null && (l.contains(A) || sn(i.current, { select: !0 }));
      }, b = function(k) {
        if (document.activeElement === document.body)
          for (const A of k)
            A.removedNodes.length > 0 && sn(l);
      };
      document.addEventListener("focusin", m), document.addEventListener("focusout", h);
      const _ = new MutationObserver(b);
      return l && _.observe(l, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", m), document.removeEventListener("focusout", h), _.disconnect();
      };
    }
  }, [r, l, p.paused]), C.useEffect(() => {
    if (l) {
      Pu.add(p);
      const m = document.activeElement;
      if (!l.contains(m)) {
        const h = new CustomEvent(ui, Su);
        l.addEventListener(ui, u), l.dispatchEvent(h), h.defaultPrevented || (Rv(Wv(Pm(l)), { select: !0 }), document.activeElement === m && sn(l));
      }
      return () => {
        l.removeEventListener(ui, u), setTimeout(() => {
          const h = new CustomEvent(fi, Su);
          l.addEventListener(fi, d), l.dispatchEvent(h), h.defaultPrevented || sn(m ?? document.body, { select: !0 }), l.removeEventListener(fi, d), Pu.remove(p);
        }, 0);
      };
    }
  }, [l, u, d, p]);
  const g = C.useCallback(
    (m) => {
      if (!n && !r || p.paused) return;
      const h = m.key === "Tab" && !m.altKey && !m.ctrlKey && !m.metaKey, b = document.activeElement;
      if (h && b) {
        const _ = m.currentTarget, [k, A] = zv(_);
        k && A ? !m.shiftKey && b === A ? (m.preventDefault(), n && sn(k, { select: !0 })) : m.shiftKey && b === k && (m.preventDefault(), n && sn(A, { select: !0 })) : b === _ && m.preventDefault();
      }
    },
    [n, r, p.paused]
  );
  return /* @__PURE__ */ G(Et.div, { tabIndex: -1, ...s, ref: c, onKeyDown: g });
});
Em.displayName = Mv;
function Rv(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const r of e)
    if (sn(r, { select: t }), document.activeElement !== n) return;
}
function zv(e) {
  const t = Pm(e), n = Eu(t, e), r = Eu(t.reverse(), e);
  return [n, r];
}
function Pm(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (r) => {
      const a = r.tagName === "INPUT" && r.type === "hidden";
      return r.disabled || r.hidden || a ? NodeFilter.FILTER_SKIP : r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function Eu(e, t) {
  for (const n of e)
    if (!Dv(n, { upTo: t })) return n;
}
function Dv(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function Fv(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function sn(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && Fv(e) && t && e.select();
  }
}
var Pu = Lv();
function Lv() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && (n == null || n.pause()), e = Cu(e, t), e.unshift(t);
    },
    remove(t) {
      var n;
      e = Cu(e, t), (n = e[0]) == null || n.resume();
    }
  };
}
function Cu(e, t) {
  const n = [...e], r = n.indexOf(t);
  return r !== -1 && n.splice(r, 1), n;
}
function Wv(e) {
  return e.filter((t) => t.tagName !== "A");
}
var Vv = "Portal", Cm = C.forwardRef((e, t) => {
  var n;
  const { container: r, ...a } = e, [o, s] = C.useState(!1);
  ra(() => s(!0), []);
  const l = r || o && ((n = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : n.body);
  return l ? cv.createPortal(/* @__PURE__ */ G(Et.div, { ...a, ref: t }), l) : null;
});
Cm.displayName = Vv;
function Yv(e, t) {
  return C.useReducer((n, r) => t[n][r] ?? n, e);
}
var No = (e) => {
  const { present: t, children: n } = e, r = Uv(t), a = typeof n == "function" ? n({ present: r.isPresent }) : C.Children.only(n), o = Wn(r.ref, Hv(a));
  return typeof n == "function" || r.isPresent ? C.cloneElement(a, { ref: o }) : null;
};
No.displayName = "Presence";
function Uv(e) {
  const [t, n] = C.useState(), r = C.useRef(null), a = C.useRef(e), o = C.useRef("none"), s = e ? "mounted" : "unmounted", [l, f] = Yv(s, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  return C.useEffect(() => {
    const u = $a(r.current);
    o.current = l === "mounted" ? u : "none";
  }, [l]), ra(() => {
    const u = r.current, d = a.current;
    if (d !== e) {
      const i = o.current, c = $a(u);
      e ? f("MOUNT") : c === "none" || (u == null ? void 0 : u.display) === "none" ? f("UNMOUNT") : f(d && i !== c ? "ANIMATION_OUT" : "UNMOUNT"), a.current = e;
    }
  }, [e, f]), ra(() => {
    if (t) {
      let u;
      const d = t.ownerDocument.defaultView ?? window, i = (p) => {
        const g = $a(r.current).includes(p.animationName);
        if (p.target === t && g && (f("ANIMATION_END"), !a.current)) {
          const m = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", u = d.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = m);
          });
        }
      }, c = (p) => {
        p.target === t && (o.current = $a(r.current));
      };
      return t.addEventListener("animationstart", c), t.addEventListener("animationcancel", i), t.addEventListener("animationend", i), () => {
        d.clearTimeout(u), t.removeEventListener("animationstart", c), t.removeEventListener("animationcancel", i), t.removeEventListener("animationend", i);
      };
    } else
      f("ANIMATION_END");
  }, [t, f]), {
    isPresent: ["mounted", "unmountSuspended"].includes(l),
    ref: C.useCallback((u) => {
      r.current = u ? getComputedStyle(u) : null, n(u);
    }, [])
  };
}
function $a(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function Hv(e) {
  var t, n;
  let r = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, a = r && "isReactWarning" in r && r.isReactWarning;
  return a ? e.ref : (r = (n = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : n.get, a = r && "isReactWarning" in r && r.isReactWarning, a ? e.props.ref : e.props.ref || e.ref);
}
var di = 0;
function Gv() {
  C.useEffect(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? Nu()), document.body.insertAdjacentElement("beforeend", e[1] ?? Nu()), di++, () => {
      di === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), di--;
    };
  }, []);
}
function Nu() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var yt = function() {
  return yt = Object.assign || function(e) {
    for (var t, n = 1, r = arguments.length; n < r; n++) {
      t = arguments[n];
      for (var a in t) Object.prototype.hasOwnProperty.call(t, a) && (e[a] = t[a]);
    }
    return e;
  }, yt.apply(this, arguments);
};
function Nm(e, t) {
  var n = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var a = 0, r = Object.getOwnPropertySymbols(e); a < r.length; a++)
      t.indexOf(r[a]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[a]) && (n[r[a]] = e[r[a]]);
  return n;
}
function Bv(e, t, n) {
  for (var r = 0, a = t.length, o; r < a; r++)
    (o || !(r in t)) && (o || (o = Array.prototype.slice.call(t, 0, r)), o[r] = t[r]);
  return e.concat(o || Array.prototype.slice.call(t));
}
var Ja = "right-scroll-bar-position", Za = "width-before-scroll-bar", qv = "with-scroll-bars-hidden", Xv = "--removed-body-scroll-bar-size";
function pi(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function Kv(e, t) {
  var n = dt(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return n.value;
        },
        set current(r) {
          var a = n.value;
          a !== r && (n.value = r, n.callback(r, a));
        }
      }
    };
  })[0];
  return n.callback = t, n.facade;
}
var Qv = typeof window < "u" ? C.useLayoutEffect : C.useEffect, Tu = /* @__PURE__ */ new WeakMap();
function Jv(e, t) {
  var n = Kv(null, function(r) {
    return e.forEach(function(a) {
      return pi(a, r);
    });
  });
  return Qv(function() {
    var r = Tu.get(n);
    if (r) {
      var a = new Set(r), o = new Set(e), s = n.current;
      a.forEach(function(l) {
        o.has(l) || pi(l, null);
      }), o.forEach(function(l) {
        a.has(l) || pi(l, s);
      });
    }
    Tu.set(n, e);
  }, [e]), n;
}
function Zv(e) {
  return e;
}
function e1(e, t) {
  t === void 0 && (t = Zv);
  var n = [], r = !1, a = {
    read: function() {
      if (r)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return n.length ? n[n.length - 1] : e;
    },
    useMedium: function(o) {
      var s = t(o, r);
      return n.push(s), function() {
        n = n.filter(function(l) {
          return l !== s;
        });
      };
    },
    assignSyncMedium: function(o) {
      for (r = !0; n.length; ) {
        var s = n;
        n = [], s.forEach(o);
      }
      n = {
        push: function(l) {
          return o(l);
        },
        filter: function() {
          return n;
        }
      };
    },
    assignMedium: function(o) {
      r = !0;
      var s = [];
      if (n.length) {
        var l = n;
        n = [], l.forEach(o), s = n;
      }
      var f = function() {
        var d = s;
        s = [], d.forEach(o);
      }, u = function() {
        return Promise.resolve().then(f);
      };
      u(), n = {
        push: function(d) {
          s.push(d), u();
        },
        filter: function(d) {
          return s = s.filter(d), n;
        }
      };
    }
  };
  return a;
}
function t1(e) {
  e === void 0 && (e = {});
  var t = e1(null);
  return t.options = yt({ async: !0, ssr: !1 }, e), t;
}
var Tm = function(e) {
  var t = e.sideCar, n = Nm(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var r = t.read();
  if (!r)
    throw new Error("Sidecar medium not found");
  return C.createElement(r, yt({}, n));
};
Tm.isSideCarExport = !0;
function n1(e, t) {
  return e.useMedium(t), Tm;
}
var Im = t1(), mi = function() {
}, To = C.forwardRef(function(e, t) {
  var n = C.useRef(null), r = C.useState({
    onScrollCapture: mi,
    onWheelCapture: mi,
    onTouchMoveCapture: mi
  }), a = r[0], o = r[1], s = e.forwardProps, l = e.children, f = e.className, u = e.removeScrollBar, d = e.enabled, i = e.shards, c = e.sideCar, p = e.noRelative, g = e.noIsolation, m = e.inert, h = e.allowPinchZoom, b = e.as, _ = b === void 0 ? "div" : b, k = e.gapMode, A = Nm(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), v = c, H = Jv([n, t]), F = yt(yt({}, A), a);
  return C.createElement(
    C.Fragment,
    null,
    d && C.createElement(v, { sideCar: Im, removeScrollBar: u, shards: i, noRelative: p, noIsolation: g, inert: m, setCallbacks: o, allowPinchZoom: !!h, lockRef: n, gapMode: k }),
    s ? C.cloneElement(C.Children.only(l), yt(yt({}, F), { ref: H })) : C.createElement(_, yt({}, F, { className: f, ref: H }), l)
  );
});
To.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
To.classNames = {
  fullWidth: Za,
  zeroRight: Ja
};
var r1 = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function a1() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = r1();
  return t && e.setAttribute("nonce", t), e;
}
function o1(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function i1(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var s1 = function() {
  var e = 0, t = null;
  return {
    add: function(n) {
      e == 0 && (t = a1()) && (o1(t, n), i1(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, l1 = function() {
  var e = s1();
  return function(t, n) {
    C.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && n]);
  };
}, $m = function() {
  var e = l1(), t = function(n) {
    var r = n.styles, a = n.dynamic;
    return e(r, a), null;
  };
  return t;
}, c1 = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, hi = function(e) {
  return parseInt(e || "", 10) || 0;
}, u1 = function(e) {
  var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], a = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [hi(n), hi(r), hi(a)];
}, f1 = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return c1;
  var t = u1(e), n = document.documentElement.clientWidth, r = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, r - n + t[2] - t[0])
  };
}, d1 = $m(), rr = "data-scroll-locked", p1 = function(e, t, n, r) {
  var a = e.left, o = e.top, s = e.right, l = e.gap;
  return n === void 0 && (n = "margin"), `
  .`.concat(qv, ` {
   overflow: hidden `).concat(r, `;
   padding-right: `).concat(l, "px ").concat(r, `;
  }
  body[`).concat(rr, `] {
    overflow: hidden `).concat(r, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(r, ";"),
    n === "margin" && `
    padding-left: `.concat(a, `px;
    padding-top: `).concat(o, `px;
    padding-right: `).concat(s, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(l, "px ").concat(r, `;
    `),
    n === "padding" && "padding-right: ".concat(l, "px ").concat(r, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(Ja, ` {
    right: `).concat(l, "px ").concat(r, `;
  }
  
  .`).concat(Za, ` {
    margin-right: `).concat(l, "px ").concat(r, `;
  }
  
  .`).concat(Ja, " .").concat(Ja, ` {
    right: 0 `).concat(r, `;
  }
  
  .`).concat(Za, " .").concat(Za, ` {
    margin-right: 0 `).concat(r, `;
  }
  
  body[`).concat(rr, `] {
    `).concat(Xv, ": ").concat(l, `px;
  }
`);
}, Iu = function() {
  var e = parseInt(document.body.getAttribute(rr) || "0", 10);
  return isFinite(e) ? e : 0;
}, m1 = function() {
  C.useEffect(function() {
    return document.body.setAttribute(rr, (Iu() + 1).toString()), function() {
      var e = Iu() - 1;
      e <= 0 ? document.body.removeAttribute(rr) : document.body.setAttribute(rr, e.toString());
    };
  }, []);
}, h1 = function(e) {
  var t = e.noRelative, n = e.noImportant, r = e.gapMode, a = r === void 0 ? "margin" : r;
  m1();
  var o = C.useMemo(function() {
    return f1(a);
  }, [a]);
  return C.createElement(d1, { styles: p1(o, !t, a, n ? "" : "!important") });
}, ws = !1;
if (typeof window < "u")
  try {
    var ja = Object.defineProperty({}, "passive", {
      get: function() {
        return ws = !0, !0;
      }
    });
    window.addEventListener("test", ja, ja), window.removeEventListener("test", ja, ja);
  } catch {
    ws = !1;
  }
var Yn = ws ? { passive: !1 } : !1, g1 = function(e) {
  return e.tagName === "TEXTAREA";
}, jm = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var n = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    n[t] !== "hidden" && // contains scroll inside self
    !(n.overflowY === n.overflowX && !g1(e) && n[t] === "visible")
  );
}, y1 = function(e) {
  return jm(e, "overflowY");
}, b1 = function(e) {
  return jm(e, "overflowX");
}, $u = function(e, t) {
  var n = t.ownerDocument, r = t;
  do {
    typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host);
    var a = Mm(e, r);
    if (a) {
      var o = Rm(e, r), s = o[1], l = o[2];
      if (s > l)
        return !0;
    }
    r = r.parentNode;
  } while (r && r !== n.body);
  return !1;
}, v1 = function(e) {
  var t = e.scrollTop, n = e.scrollHeight, r = e.clientHeight;
  return [
    t,
    n,
    r
  ];
}, x1 = function(e) {
  var t = e.scrollLeft, n = e.scrollWidth, r = e.clientWidth;
  return [
    t,
    n,
    r
  ];
}, Mm = function(e, t) {
  return e === "v" ? y1(t) : b1(t);
}, Rm = function(e, t) {
  return e === "v" ? v1(t) : x1(t);
}, w1 = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, _1 = function(e, t, n, r, a) {
  var o = w1(e, window.getComputedStyle(t).direction), s = o * r, l = n.target, f = t.contains(l), u = !1, d = s > 0, i = 0, c = 0;
  do {
    if (!l)
      break;
    var p = Rm(e, l), g = p[0], m = p[1], h = p[2], b = m - h - o * g;
    (g || b) && Mm(e, l) && (i += b, c += g);
    var _ = l.parentNode;
    l = _ && _.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? _.host : _;
  } while (
    // portaled content
    !f && l !== document.body || // self content
    f && (t.contains(l) || t === l)
  );
  return (d && Math.abs(i) < 1 || !d && Math.abs(c) < 1) && (u = !0), u;
}, Ma = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, ju = function(e) {
  return [e.deltaX, e.deltaY];
}, Mu = function(e) {
  return e && "current" in e ? e.current : e;
}, k1 = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, A1 = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, O1 = 0, Un = [];
function S1(e) {
  var t = C.useRef([]), n = C.useRef([0, 0]), r = C.useRef(), a = C.useState(O1++)[0], o = C.useState($m)[0], s = C.useRef(e);
  C.useEffect(function() {
    s.current = e;
  }, [e]), C.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(a));
      var m = Bv([e.lockRef.current], (e.shards || []).map(Mu)).filter(Boolean);
      return m.forEach(function(h) {
        return h.classList.add("allow-interactivity-".concat(a));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(a)), m.forEach(function(h) {
          return h.classList.remove("allow-interactivity-".concat(a));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var l = C.useCallback(function(m, h) {
    if ("touches" in m && m.touches.length === 2 || m.type === "wheel" && m.ctrlKey)
      return !s.current.allowPinchZoom;
    var b = Ma(m), _ = n.current, k = "deltaX" in m ? m.deltaX : _[0] - b[0], A = "deltaY" in m ? m.deltaY : _[1] - b[1], v, H = m.target, F = Math.abs(k) > Math.abs(A) ? "h" : "v";
    if ("touches" in m && F === "h" && H.type === "range")
      return !1;
    var Q = $u(F, H);
    if (!Q)
      return !0;
    if (Q ? v = F : (v = F === "v" ? "h" : "v", Q = $u(F, H)), !Q)
      return !1;
    if (!r.current && "changedTouches" in m && (k || A) && (r.current = v), !v)
      return !0;
    var B = r.current || v;
    return _1(B, h, m, B === "h" ? k : A);
  }, []), f = C.useCallback(function(m) {
    var h = m;
    if (!(!Un.length || Un[Un.length - 1] !== o)) {
      var b = "deltaY" in h ? ju(h) : Ma(h), _ = t.current.filter(function(v) {
        return v.name === h.type && (v.target === h.target || h.target === v.shadowParent) && k1(v.delta, b);
      })[0];
      if (_ && _.should) {
        h.cancelable && h.preventDefault();
        return;
      }
      if (!_) {
        var k = (s.current.shards || []).map(Mu).filter(Boolean).filter(function(v) {
          return v.contains(h.target);
        }), A = k.length > 0 ? l(h, k[0]) : !s.current.noIsolation;
        A && h.cancelable && h.preventDefault();
      }
    }
  }, []), u = C.useCallback(function(m, h, b, _) {
    var k = { name: m, delta: h, target: b, should: _, shadowParent: E1(b) };
    t.current.push(k), setTimeout(function() {
      t.current = t.current.filter(function(A) {
        return A !== k;
      });
    }, 1);
  }, []), d = C.useCallback(function(m) {
    n.current = Ma(m), r.current = void 0;
  }, []), i = C.useCallback(function(m) {
    u(m.type, ju(m), m.target, l(m, e.lockRef.current));
  }, []), c = C.useCallback(function(m) {
    u(m.type, Ma(m), m.target, l(m, e.lockRef.current));
  }, []);
  C.useEffect(function() {
    return Un.push(o), e.setCallbacks({
      onScrollCapture: i,
      onWheelCapture: i,
      onTouchMoveCapture: c
    }), document.addEventListener("wheel", f, Yn), document.addEventListener("touchmove", f, Yn), document.addEventListener("touchstart", d, Yn), function() {
      Un = Un.filter(function(m) {
        return m !== o;
      }), document.removeEventListener("wheel", f, Yn), document.removeEventListener("touchmove", f, Yn), document.removeEventListener("touchstart", d, Yn);
    };
  }, []);
  var p = e.removeScrollBar, g = e.inert;
  return C.createElement(
    C.Fragment,
    null,
    g ? C.createElement(o, { styles: A1(a) }) : null,
    p ? C.createElement(h1, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function E1(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const P1 = n1(Im, S1);
var zm = C.forwardRef(function(e, t) {
  return C.createElement(To, yt({}, e, { ref: t, sideCar: P1 }));
});
zm.classNames = To.classNames;
var C1 = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, Hn = /* @__PURE__ */ new WeakMap(), Ra = /* @__PURE__ */ new WeakMap(), za = {}, gi = 0, Dm = function(e) {
  return e && (e.host || Dm(e.parentNode));
}, N1 = function(e, t) {
  return t.map(function(n) {
    if (e.contains(n))
      return n;
    var r = Dm(n);
    return r && e.contains(r) ? r : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(n) {
    return !!n;
  });
}, T1 = function(e, t, n, r) {
  var a = N1(t, Array.isArray(e) ? e : [e]);
  za[n] || (za[n] = /* @__PURE__ */ new WeakMap());
  var o = za[n], s = [], l = /* @__PURE__ */ new Set(), f = new Set(a), u = function(i) {
    !i || l.has(i) || (l.add(i), u(i.parentNode));
  };
  a.forEach(u);
  var d = function(i) {
    !i || f.has(i) || Array.prototype.forEach.call(i.children, function(c) {
      if (l.has(c))
        d(c);
      else
        try {
          var p = c.getAttribute(r), g = p !== null && p !== "false", m = (Hn.get(c) || 0) + 1, h = (o.get(c) || 0) + 1;
          Hn.set(c, m), o.set(c, h), s.push(c), m === 1 && g && Ra.set(c, !0), h === 1 && c.setAttribute(n, "true"), g || c.setAttribute(r, "true");
        } catch (b) {
          console.error("aria-hidden: cannot operate on ", c, b);
        }
    });
  };
  return d(t), l.clear(), gi++, function() {
    s.forEach(function(i) {
      var c = Hn.get(i) - 1, p = o.get(i) - 1;
      Hn.set(i, c), o.set(i, p), c || (Ra.has(i) || i.removeAttribute(r), Ra.delete(i)), p || i.removeAttribute(n);
    }), gi--, gi || (Hn = /* @__PURE__ */ new WeakMap(), Hn = /* @__PURE__ */ new WeakMap(), Ra = /* @__PURE__ */ new WeakMap(), za = {});
  };
}, I1 = function(e, t, n) {
  n === void 0 && (n = "data-aria-hidden");
  var r = Array.from(Array.isArray(e) ? e : [e]), a = C1(e);
  return a ? (r.push.apply(r, Array.from(a.querySelectorAll("[aria-live], script"))), T1(r, a, n, "aria-hidden")) : function() {
    return null;
  };
}, Io = "Dialog", [Fm, UP] = dv(Io), [$1, ct] = Fm(Io), Lm = (e) => {
  const {
    __scopeDialog: t,
    children: n,
    open: r,
    defaultOpen: a,
    onOpenChange: o,
    modal: s = !0
  } = e, l = C.useRef(null), f = C.useRef(null), [u, d] = yv({
    prop: r,
    defaultProp: a ?? !1,
    onChange: o,
    caller: Io
  });
  return /* @__PURE__ */ G(
    $1,
    {
      scope: t,
      triggerRef: l,
      contentRef: f,
      contentId: ci(),
      titleId: ci(),
      descriptionId: ci(),
      open: u,
      onOpenChange: d,
      onOpenToggle: C.useCallback(() => d((i) => !i), [d]),
      modal: s,
      children: n
    }
  );
};
Lm.displayName = Io;
var Wm = "DialogTrigger", j1 = C.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = ct(Wm, n), o = Wn(t, a.triggerRef);
    return /* @__PURE__ */ G(
      Et.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": a.open,
        "aria-controls": a.contentId,
        "data-state": rc(a.open),
        ...r,
        ref: o,
        onClick: fn(e.onClick, a.onOpenToggle)
      }
    );
  }
);
j1.displayName = Wm;
var tc = "DialogPortal", [M1, Vm] = Fm(tc, {
  forceMount: void 0
}), Ym = (e) => {
  const { __scopeDialog: t, forceMount: n, children: r, container: a } = e, o = ct(tc, t);
  return /* @__PURE__ */ G(M1, { scope: t, forceMount: n, children: C.Children.map(r, (s) => /* @__PURE__ */ G(No, { present: n || o.open, children: /* @__PURE__ */ G(Cm, { asChild: !0, container: a, children: s }) })) });
};
Ym.displayName = tc;
var fo = "DialogOverlay", Um = C.forwardRef(
  (e, t) => {
    const n = Vm(fo, e.__scopeDialog), { forceMount: r = n.forceMount, ...a } = e, o = ct(fo, e.__scopeDialog);
    return o.modal ? /* @__PURE__ */ G(No, { present: r || o.open, children: /* @__PURE__ */ G(z1, { ...a, ref: t }) }) : null;
  }
);
Um.displayName = fo;
var R1 = /* @__PURE__ */ km("DialogOverlay.RemoveScroll"), z1 = C.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = ct(fo, n);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ G(zm, { as: R1, allowPinchZoom: !0, shards: [a.contentRef], children: /* @__PURE__ */ G(
        Et.div,
        {
          "data-state": rc(a.open),
          ...r,
          ref: t,
          style: { pointerEvents: "auto", ...r.style }
        }
      ) })
    );
  }
), Tn = "DialogContent", Hm = C.forwardRef(
  (e, t) => {
    const n = Vm(Tn, e.__scopeDialog), { forceMount: r = n.forceMount, ...a } = e, o = ct(Tn, e.__scopeDialog);
    return /* @__PURE__ */ G(No, { present: r || o.open, children: o.modal ? /* @__PURE__ */ G(D1, { ...a, ref: t }) : /* @__PURE__ */ G(F1, { ...a, ref: t }) });
  }
);
Hm.displayName = Tn;
var D1 = C.forwardRef(
  (e, t) => {
    const n = ct(Tn, e.__scopeDialog), r = C.useRef(null), a = Wn(t, n.contentRef, r);
    return C.useEffect(() => {
      const o = r.current;
      if (o) return I1(o);
    }, []), /* @__PURE__ */ G(
      Gm,
      {
        ...e,
        ref: a,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: fn(e.onCloseAutoFocus, (o) => {
          var s;
          o.preventDefault(), (s = n.triggerRef.current) == null || s.focus();
        }),
        onPointerDownOutside: fn(e.onPointerDownOutside, (o) => {
          const s = o.detail.originalEvent, l = s.button === 0 && s.ctrlKey === !0;
          (s.button === 2 || l) && o.preventDefault();
        }),
        onFocusOutside: fn(
          e.onFocusOutside,
          (o) => o.preventDefault()
        )
      }
    );
  }
), F1 = C.forwardRef(
  (e, t) => {
    const n = ct(Tn, e.__scopeDialog), r = C.useRef(!1), a = C.useRef(!1);
    return /* @__PURE__ */ G(
      Gm,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (o) => {
          var s, l;
          (s = e.onCloseAutoFocus) == null || s.call(e, o), o.defaultPrevented || (r.current || (l = n.triggerRef.current) == null || l.focus(), o.preventDefault()), r.current = !1, a.current = !1;
        },
        onInteractOutside: (o) => {
          var s, l;
          (s = e.onInteractOutside) == null || s.call(e, o), o.defaultPrevented || (r.current = !0, o.detail.originalEvent.type === "pointerdown" && (a.current = !0));
          const f = o.target;
          (l = n.triggerRef.current) != null && l.contains(f) && o.preventDefault(), o.detail.originalEvent.type === "focusin" && a.current && o.preventDefault();
        }
      }
    );
  }
), Gm = C.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: a, onCloseAutoFocus: o, ...s } = e, l = ct(Tn, n), f = C.useRef(null), u = Wn(t, f);
    return Gv(), /* @__PURE__ */ He(ft, { children: [
      /* @__PURE__ */ G(
        Em,
        {
          asChild: !0,
          loop: !0,
          trapped: r,
          onMountAutoFocus: a,
          onUnmountAutoFocus: o,
          children: /* @__PURE__ */ G(
            Om,
            {
              role: "dialog",
              id: l.contentId,
              "aria-describedby": l.descriptionId,
              "aria-labelledby": l.titleId,
              "data-state": rc(l.open),
              ...s,
              ref: u,
              onDismiss: () => l.onOpenChange(!1)
            }
          )
        }
      ),
      /* @__PURE__ */ He(ft, { children: [
        /* @__PURE__ */ G(W1, { titleId: l.titleId }),
        /* @__PURE__ */ G(Y1, { contentRef: f, descriptionId: l.descriptionId })
      ] })
    ] });
  }
), nc = "DialogTitle", Bm = C.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = ct(nc, n);
    return /* @__PURE__ */ G(Et.h2, { id: a.titleId, ...r, ref: t });
  }
);
Bm.displayName = nc;
var qm = "DialogDescription", Xm = C.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = ct(qm, n);
    return /* @__PURE__ */ G(Et.p, { id: a.descriptionId, ...r, ref: t });
  }
);
Xm.displayName = qm;
var Km = "DialogClose", L1 = C.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = ct(Km, n);
    return /* @__PURE__ */ G(
      Et.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: fn(e.onClick, () => a.onOpenChange(!1))
      }
    );
  }
);
L1.displayName = Km;
function rc(e) {
  return e ? "open" : "closed";
}
var Qm = "DialogTitleWarning", [HP, Jm] = fv(Qm, {
  contentName: Tn,
  titleName: nc,
  docsSlug: "dialog"
}), W1 = ({ titleId: e }) => {
  const t = Jm(Qm), n = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return C.useEffect(() => {
    e && (document.getElementById(e) || console.error(n));
  }, [n, e]), null;
}, V1 = "DialogDescriptionWarning", Y1 = ({ contentRef: e, descriptionId: t }) => {
  const n = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Jm(V1).contentName}}.`;
  return C.useEffect(() => {
    var r;
    const a = (r = e.current) == null ? void 0 : r.getAttribute("aria-describedby");
    t && a && (document.getElementById(t) || console.warn(n));
  }, [n, e, t]), null;
}, U1 = Lm, H1 = Ym, G1 = Um, B1 = Hm, Ru = Bm, q1 = Xm;
const ac = "-", X1 = (e) => {
  const t = Q1(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(ac);
      return o[0] === "" && o.length !== 1 && o.shift(), Zm(o, t) || K1(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const s = n[a] || [];
      return o && r[a] ? [...s, ...r[a]] : s;
    }
  };
}, Zm = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], a = t.nextPart.get(r), o = a ? Zm(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const s = e.join(ac);
  return (n = t.validators.find(({
    validator: l
  }) => l(s))) == null ? void 0 : n.classGroupId;
}, zu = /^\[(.+)\]$/, K1 = (e) => {
  if (zu.test(e)) {
    const t = zu.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, Q1 = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Z1(Object.entries(e.classGroups), n).forEach(([a, o]) => {
    _s(o, r, a, t);
  }), r;
}, _s = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : Du(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (J1(a)) {
        _s(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, s]) => {
      _s(s, Du(t, o), n, r);
    });
  });
}, Du = (e, t) => {
  let n = e;
  return t.split(ac).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, J1 = (e) => e.isThemeGetter, Z1 = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([s, l]) => [t + s, l])) : o);
  return [n, a];
}) : e, e0 = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const a = (o, s) => {
    n.set(o, s), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let s = n.get(o);
      if (s !== void 0)
        return s;
      if ((s = r.get(o)) !== void 0)
        return a(o, s), s;
    },
    set(o, s) {
      n.has(o) ? n.set(o, s) : a(o, s);
    }
  };
}, eh = "!", t0 = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, s = (l) => {
    const f = [];
    let u = 0, d = 0, i;
    for (let h = 0; h < l.length; h++) {
      let b = l[h];
      if (u === 0) {
        if (b === a && (r || l.slice(h, h + o) === t)) {
          f.push(l.slice(d, h)), d = h + o;
          continue;
        }
        if (b === "/") {
          i = h;
          continue;
        }
      }
      b === "[" ? u++ : b === "]" && u--;
    }
    const c = f.length === 0 ? l : l.substring(d), p = c.startsWith(eh), g = p ? c.substring(1) : c, m = i && i > d ? i - d : void 0;
    return {
      modifiers: f,
      hasImportantModifier: p,
      baseClassName: g,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (l) => n({
    className: l,
    parseClassName: s
  }) : s;
}, n0 = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, r0 = (e) => ({
  cache: e0(e.cacheSize),
  parseClassName: t0(e),
  ...X1(e)
}), a0 = /\s+/, o0 = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], s = e.trim().split(a0);
  let l = "";
  for (let f = s.length - 1; f >= 0; f -= 1) {
    const u = s[f], {
      modifiers: d,
      hasImportantModifier: i,
      baseClassName: c,
      maybePostfixModifierPosition: p
    } = n(u);
    let g = !!p, m = r(g ? c.substring(0, p) : c);
    if (!m) {
      if (!g) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      if (m = r(c), !m) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      g = !1;
    }
    const h = n0(d).join(":"), b = i ? h + eh : h, _ = b + m;
    if (o.includes(_))
      continue;
    o.push(_);
    const k = a(m, g);
    for (let A = 0; A < k.length; ++A) {
      const v = k[A];
      o.push(b + v);
    }
    l = u + (l.length > 0 ? " " + l : l);
  }
  return l;
};
function i0() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = th(t)) && (r && (r += " "), r += n);
  return r;
}
const th = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = th(e[r])) && (n && (n += " "), n += t);
  return n;
};
function s0(e, ...t) {
  let n, r, a, o = s;
  function s(f) {
    const u = t.reduce((d, i) => i(d), e());
    return n = r0(u), r = n.cache.get, a = n.cache.set, o = l, l(f);
  }
  function l(f) {
    const u = r(f);
    if (u)
      return u;
    const d = o0(f, n);
    return a(f, d), d;
  }
  return function() {
    return o(i0.apply(null, arguments));
  };
}
const Ce = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, nh = /^\[(?:([a-z-]+):)?(.+)\]$/i, l0 = /^\d+\/\d+$/, c0 = /* @__PURE__ */ new Set(["px", "full", "screen"]), u0 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, f0 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, d0 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, p0 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, m0 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Pt = (e) => ar(e) || c0.has(e) || l0.test(e), qt = (e) => br(e, "length", _0), ar = (e) => !!e && !Number.isNaN(Number(e)), yi = (e) => br(e, "number", ar), Sr = (e) => !!e && Number.isInteger(Number(e)), h0 = (e) => e.endsWith("%") && ar(e.slice(0, -1)), ue = (e) => nh.test(e), Xt = (e) => u0.test(e), g0 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), y0 = (e) => br(e, g0, rh), b0 = (e) => br(e, "position", rh), v0 = /* @__PURE__ */ new Set(["image", "url"]), x0 = (e) => br(e, v0, A0), w0 = (e) => br(e, "", k0), Er = () => !0, br = (e, t, n) => {
  const r = nh.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, _0 = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  f0.test(e) && !d0.test(e)
), rh = () => !1, k0 = (e) => p0.test(e), A0 = (e) => m0.test(e), O0 = () => {
  const e = Ce("colors"), t = Ce("spacing"), n = Ce("blur"), r = Ce("brightness"), a = Ce("borderColor"), o = Ce("borderRadius"), s = Ce("borderSpacing"), l = Ce("borderWidth"), f = Ce("contrast"), u = Ce("grayscale"), d = Ce("hueRotate"), i = Ce("invert"), c = Ce("gap"), p = Ce("gradientColorStops"), g = Ce("gradientColorStopPositions"), m = Ce("inset"), h = Ce("margin"), b = Ce("opacity"), _ = Ce("padding"), k = Ce("saturate"), A = Ce("scale"), v = Ce("sepia"), H = Ce("skew"), F = Ce("space"), Q = Ce("translate"), B = () => ["auto", "contain", "none"], ie = () => ["auto", "hidden", "clip", "visible", "scroll"], ae = () => ["auto", ue, t], R = () => [ue, t], le = () => ["", Pt, qt], D = () => ["auto", ar, ue], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], z = () => ["solid", "dashed", "dotted", "double", "none"], K = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], X = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], oe = () => ["", "0", ue], y = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [ar, ue];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Er],
      spacing: [Pt, qt],
      blur: ["none", "", Xt, ue],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Xt, ue],
      borderSpacing: R(),
      borderWidth: le(),
      contrast: x(),
      grayscale: oe(),
      hueRotate: x(),
      invert: oe(),
      gap: R(),
      gradientColorStops: [e],
      gradientColorStopPositions: [h0, qt],
      inset: ae(),
      margin: ae(),
      opacity: x(),
      padding: R(),
      saturate: x(),
      scale: x(),
      sepia: oe(),
      skew: x(),
      space: R(),
      translate: R()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", ue]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [Xt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": y()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": y()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...M(), ue]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ie()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ie()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ie()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: B()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": B()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": B()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [m]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [m]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [m]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [m]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [m]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [m]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [m]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [m]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [m]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", Sr, ue]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ae()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", ue]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: oe()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: oe()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Sr, ue]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Er]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Sr, ue]
        }, ue]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Er]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Sr, ue]
        }, ue]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", ue]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", ue]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [c]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [c]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [c]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...X()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...X(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...X(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [_]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [_]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [_]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [_]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [_]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [_]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [_]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [_]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [_]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [h]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [h]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [h]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [h]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [h]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [h]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [h]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [h]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [h]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [F]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [F]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", ue, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [ue, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [ue, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Xt]
        }, Xt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [ue, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [ue, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [ue, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [ue, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Xt, qt]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", yi]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Er]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", ue]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", ar, yi]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Pt, ue]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", ue]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", ue]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [b]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [b]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...z(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Pt, qt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Pt, ue]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: R()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", ue]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", ue]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [b]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...M(), b0]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", y0]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, x0]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [g]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [g]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [g]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [p]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [p]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [o]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [o]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [o]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [o]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [o]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [o]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [o]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [o]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [o]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [o]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [o]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [o]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [o]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [o]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [o]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [l]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [l]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [l]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [l]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [l]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [l]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [l]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [l]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [l]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [b]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...z(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [l]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [l]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [b]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: z()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [a]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [a]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [a]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [a]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [a]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [a]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [a]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [a]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [a]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [a]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...z()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Pt, ue]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Pt, qt]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: le()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [b]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Pt, qt]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", Xt, w0]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Er]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [b]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...K(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": K()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [n]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [f]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Xt, ue]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [u]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [d]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [i]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [k]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [v]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [n]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [f]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [d]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [i]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [b]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [k]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [v]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [s]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [s]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [s]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", ue]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: x()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", ue]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: x()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", ue]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [A]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [A]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [A]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Sr, ue]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Q]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Q]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [H]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [H]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", ue]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", ue]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": R()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": R()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": R()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": R()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": R()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": R()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": R()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": R()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": R()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": R()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": R()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": R()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": R()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": R()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": R()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": R()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": R()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": R()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", ue]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [Pt, qt, yi]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, Yr = /* @__PURE__ */ s0(O0);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function S0(e, t, n) {
  return (t = P0(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Fu(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function L(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Fu(Object(n), !0).forEach(function(r) {
      S0(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Fu(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function E0(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function P0(e) {
  var t = E0(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Lu = () => {
};
let oc = {}, ah = {}, oh = null, ih = {
  mark: Lu,
  measure: Lu
};
try {
  typeof window < "u" && (oc = window), typeof document < "u" && (ah = document), typeof MutationObserver < "u" && (oh = MutationObserver), typeof performance < "u" && (ih = performance);
} catch {
}
const {
  userAgent: Wu = ""
} = oc.navigator || {}, pn = oc, Ie = ah, Vu = oh, Da = ih;
pn.document;
const Ut = !!Ie.documentElement && !!Ie.head && typeof Ie.addEventListener == "function" && typeof Ie.createElement == "function", sh = ~Wu.indexOf("MSIE") || ~Wu.indexOf("Trident/");
var C0 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, N0 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, lh = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, T0 = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ch = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Le = "classic", $o = "duotone", I0 = "sharp", $0 = "sharp-duotone", uh = [Le, $o, I0, $0], j0 = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, M0 = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, R0 = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), z0 = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
}, D0 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Yu = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, F0 = ["kit"], L0 = {
  kit: {
    "fa-kit": "fak"
  }
}, W0 = ["fak", "fakd"], V0 = {
  kit: {
    fak: "fa-kit"
  }
}, Uu = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Fa = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Y0 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], U0 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], H0 = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, G0 = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, B0 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, ks = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, q0 = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], As = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Y0, ...q0], X0 = ["solid", "regular", "light", "thin", "duotone", "brands"], fh = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], K0 = fh.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), Q0 = [...Object.keys(B0), ...X0, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Fa.GROUP, Fa.SWAP_OPACITY, Fa.PRIMARY, Fa.SECONDARY].concat(fh.map((e) => "".concat(e, "x"))).concat(K0.map((e) => "w-".concat(e))), J0 = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const Mt = "___FONT_AWESOME___", Os = 16, dh = "fa", ph = "svg-inline--fa", In = "data-fa-i2svg", Ss = "data-fa-pseudo-element", Z0 = "data-fa-pseudo-element-pending", ic = "data-prefix", sc = "data-icon", Hu = "fontawesome-i2svg", ex = "async", tx = ["HTML", "HEAD", "STYLE", "SCRIPT"], mh = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function _a(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Le];
    }
  });
}
const hh = L({}, lh);
hh[Le] = L(L(L(L({}, {
  "fa-duotone": "duotone"
}), lh[Le]), Yu.kit), Yu["kit-duotone"]);
const nx = _a(hh), Es = L({}, z0);
Es[Le] = L(L(L(L({}, {
  duotone: "fad"
}), Es[Le]), Uu.kit), Uu["kit-duotone"]);
const Gu = _a(Es), Ps = L({}, ks);
Ps[Le] = L(L({}, Ps[Le]), V0.kit);
const lc = _a(Ps), Cs = L({}, G0);
Cs[Le] = L(L({}, Cs[Le]), L0.kit);
_a(Cs);
const rx = C0, gh = "fa-layers-text", ax = N0, ox = L({}, j0);
_a(ox);
const ix = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], bi = T0, sx = [...F0, ...Q0], Ur = pn.FontAwesomeConfig || {};
function lx(e) {
  var t = Ie.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function cx(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ie && typeof Ie.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = cx(lx(t));
  r != null && (Ur[n] = r);
});
const yh = {
  styleDefault: "solid",
  familyDefault: Le,
  cssPrefix: dh,
  replacementClass: ph,
  autoReplaceSvg: !0,
  autoAddCss: !0,
  autoA11y: !0,
  searchPseudoElements: !1,
  observeMutations: !0,
  mutateApproach: "async",
  keepOriginalSource: !0,
  measurePerformance: !1,
  showMissingIcons: !0
};
Ur.familyPrefix && (Ur.cssPrefix = Ur.familyPrefix);
const pr = L(L({}, yh), Ur);
pr.autoReplaceSvg || (pr.observeMutations = !1);
const J = {};
Object.keys(yh).forEach((e) => {
  Object.defineProperty(J, e, {
    enumerable: !0,
    set: function(t) {
      pr[e] = t, Hr.forEach((n) => n(J));
    },
    get: function() {
      return pr[e];
    }
  });
});
Object.defineProperty(J, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    pr.cssPrefix = e, Hr.forEach((t) => t(J));
  },
  get: function() {
    return pr.cssPrefix;
  }
});
pn.FontAwesomeConfig = J;
const Hr = [];
function ux(e) {
  return Hr.push(e), () => {
    Hr.splice(Hr.indexOf(e), 1);
  };
}
const Kt = Os, bt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function fx(e) {
  if (!e || !Ut)
    return;
  const t = Ie.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = Ie.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], s = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(s) > -1 && (r = o);
  }
  return Ie.head.insertBefore(t, r), e;
}
const dx = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function oa() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += dx[Math.random() * 62 | 0];
  return t;
}
function vr(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function cc(e) {
  return e.classList ? vr(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function bh(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function px(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(bh(e[n]), '" '), "").trim();
}
function jo(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function uc(e) {
  return e.size !== bt.size || e.x !== bt.x || e.y !== bt.y || e.rotate !== bt.rotate || e.flipX || e.flipY;
}
function mx(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), s = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), l = "rotate(".concat(t.rotate, " 0 0)"), f = {
    transform: "".concat(o, " ").concat(s, " ").concat(l)
  }, u = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: f,
    path: u
  };
}
function hx(e) {
  let {
    transform: t,
    width: n = Os,
    height: r = Os,
    startCentered: a = !1
  } = e, o = "";
  return a && sh ? o += "translate(".concat(t.x / Kt - n / 2, "em, ").concat(t.y / Kt - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / Kt, "em), calc(-50% + ").concat(t.y / Kt, "em)) ") : o += "translate(".concat(t.x / Kt, "em, ").concat(t.y / Kt, "em) "), o += "scale(".concat(t.size / Kt * (t.flipX ? -1 : 1), ", ").concat(t.size / Kt * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var gx = `:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;
function vh() {
  const e = dh, t = ph, n = J.cssPrefix, r = J.replacementClass;
  let a = gx;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), s = new RegExp("\\--".concat(e, "\\-"), "g"), l = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(s, "--".concat(n, "-")).replace(l, ".".concat(r));
  }
  return a;
}
let Bu = !1;
function vi() {
  J.autoAddCss && !Bu && (fx(vh()), Bu = !0);
}
var yx = {
  mixout() {
    return {
      dom: {
        css: vh,
        insertCss: vi
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        vi();
      },
      beforeI2svg() {
        vi();
      }
    };
  }
};
const Rt = pn || {};
Rt[Mt] || (Rt[Mt] = {});
Rt[Mt].styles || (Rt[Mt].styles = {});
Rt[Mt].hooks || (Rt[Mt].hooks = {});
Rt[Mt].shims || (Rt[Mt].shims = []);
var vt = Rt[Mt];
const xh = [], wh = function() {
  Ie.removeEventListener("DOMContentLoaded", wh), po = 1, xh.map((e) => e());
};
let po = !1;
Ut && (po = (Ie.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ie.readyState), po || Ie.addEventListener("DOMContentLoaded", wh));
function bx(e) {
  Ut && (po ? setTimeout(e, 0) : xh.push(e));
}
function ka(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? bh(e) : "<".concat(t, " ").concat(px(n), ">").concat(r.map(ka).join(""), "</").concat(t, ">");
}
function qu(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var xi = function(e, t, n, r) {
  var a = Object.keys(e), o = a.length, s = t, l, f, u;
  for (n === void 0 ? (l = 1, u = e[a[0]]) : (l = 0, u = n); l < o; l++)
    f = a[l], u = s(u, e[f], f, e);
  return u;
};
function vx(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const a = e.charCodeAt(n++);
    if (a >= 55296 && a <= 56319 && n < r) {
      const o = e.charCodeAt(n++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), n--);
    } else
      t.push(a);
  }
  return t;
}
function _h(e) {
  const t = vx(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function xx(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function Xu(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Ns(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = Xu(t);
  typeof vt.hooks.addPack == "function" && !r ? vt.hooks.addPack(e, Xu(t)) : vt.styles[e] = L(L({}, vt.styles[e] || {}), a), e === "fas" && Ns("fa", t);
}
const {
  styles: ia,
  shims: wx
} = vt, kh = Object.keys(lc), _x = kh.reduce((e, t) => (e[t] = Object.keys(lc[t]), e), {});
let fc = null, Ah = {}, Oh = {}, Sh = {}, Eh = {}, Ph = {};
function kx(e) {
  return ~sx.indexOf(e);
}
function Ax(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !kx(a) ? a : null;
}
const Ch = () => {
  const e = (r) => xi(ia, (a, o, s) => (a[s] = xi(o, r, {}), a), {});
  Ah = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), Oh = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), Ph = e((r, a, o) => {
    const s = a[2];
    return r[o] = o, s.forEach((l) => {
      r[l] = o;
    }), r;
  });
  const t = "far" in ia || J.autoFetchSvg, n = xi(wx, (r, a) => {
    const o = a[0];
    let s = a[1];
    const l = a[2];
    return s === "far" && !t && (s = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: s,
      iconName: l
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: s,
      iconName: l
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  Sh = n.names, Eh = n.unicodes, fc = Mo(J.styleDefault, {
    family: J.familyDefault
  });
};
ux((e) => {
  fc = Mo(e.styleDefault, {
    family: J.familyDefault
  });
});
Ch();
function dc(e, t) {
  return (Ah[e] || {})[t];
}
function Ox(e, t) {
  return (Oh[e] || {})[t];
}
function En(e, t) {
  return (Ph[e] || {})[t];
}
function Nh(e) {
  return Sh[e] || {
    prefix: null,
    iconName: null
  };
}
function Sx(e) {
  const t = Eh[e], n = dc("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function mn() {
  return fc;
}
const Th = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Ex(e) {
  let t = Le;
  const n = kh.reduce((r, a) => (r[a] = "".concat(J.cssPrefix, "-").concat(a), r), {});
  return uh.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => _x[r].includes(a))) && (t = r);
  }), t;
}
function Mo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Le
  } = t, r = nx[n][e];
  if (n === $o && !e)
    return "fad";
  const a = Gu[n][e] || Gu[n][r], o = e in vt.styles ? e : null;
  return a || o || null;
}
function Px(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = Ax(J.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Ku(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Ro(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = As.concat(U0), o = Ku(e.filter((i) => a.includes(i))), s = Ku(e.filter((i) => !As.includes(i))), l = o.filter((i) => (r = i, !ch.includes(i))), [f = null] = l, u = Ex(o), d = L(L({}, Px(s)), {}, {
    prefix: Mo(f, {
      family: u
    })
  });
  return L(L(L({}, d), Ix({
    values: e,
    family: u,
    styles: ia,
    config: J,
    canonical: d,
    givenPrefix: r
  })), Cx(n, r, d));
}
function Cx(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? Nh(a) : {}, s = En(r, a);
  return a = o.iconName || s || a, r = o.prefix || r, r === "far" && !ia.far && ia.fas && !J.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const Nx = uh.filter((e) => e !== Le || e !== $o), Tx = Object.keys(ks).filter((e) => e !== Le).map((e) => Object.keys(ks[e])).flat();
function Ix(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: s = {}
  } = e, l = n === $o, f = t.includes("fa-duotone") || t.includes("fad"), u = s.familyDefault === "duotone", d = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!l && (f || u || d) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Nx.includes(n) && (Object.keys(o).find((i) => Tx.includes(i)) || s.autoFetchSvg)) {
    const i = R0.get(n).defaultShortPrefixId;
    r.prefix = i, r.iconName = En(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = mn() || "fas"), r;
}
class $x {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = L(L({}, this.definitions[o] || {}), a[o]), Ns(o, a[o]);
      const s = lc[Le][o];
      s && Ns(s, a[o]), Ch();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((a) => {
      const {
        prefix: o,
        iconName: s,
        icon: l
      } = r[a], f = l[2];
      t[o] || (t[o] = {}), f.length > 0 && f.forEach((u) => {
        typeof u == "string" && (t[o][u] = l);
      }), t[o][s] = l;
    }), t;
  }
}
let Qu = [], qn = {};
const or = {}, jx = Object.keys(or);
function Mx(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Qu = e, qn = {}, Object.keys(or).forEach((r) => {
    jx.indexOf(r) === -1 && delete or[r];
  }), Qu.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((s) => {
        n[o] || (n[o] = {}), n[o][s] = a[o][s];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((s) => {
        qn[s] || (qn[s] = []), qn[s].push(o[s]);
      });
    }
    r.provides && r.provides(or);
  }), n;
}
function Ts(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (qn[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...r]);
  }), t;
}
function $n(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (qn[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function hn() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return or[e] ? or[e].apply(null, t) : void 0;
}
function Is(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || mn();
  if (t)
    return t = En(n, t) || t, qu(Ih.definitions, n, t) || qu(vt.styles, n, t);
}
const Ih = new $x(), Rx = () => {
  J.autoReplaceSvg = !1, J.observeMutations = !1, $n("noAuto");
}, zx = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Ut ? ($n("beforeI2svg", e), hn("pseudoElements2svg", e), hn("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    J.autoReplaceSvg === !1 && (J.autoReplaceSvg = !0), J.observeMutations = !0, bx(() => {
      Fx({
        autoReplaceSvgRoot: t
      }), $n("watch", e);
    });
  }
}, Dx = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: En(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Mo(e[0]);
      return {
        prefix: n,
        iconName: En(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(J.cssPrefix, "-")) > -1 || e.match(rx))) {
      const t = Ro(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || mn(),
        iconName: En(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = mn();
      return {
        prefix: t,
        iconName: En(t, e) || e
      };
    }
  }
}, Ke = {
  noAuto: Rx,
  config: J,
  dom: zx,
  parse: Dx,
  library: Ih,
  findIconDefinition: Is,
  toHtml: ka
}, Fx = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ie
  } = e;
  (Object.keys(vt.styles).length > 0 || J.autoFetchSvg) && Ut && J.autoReplaceSvg && Ke.dom.i2svg({
    node: t
  });
};
function zo(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => ka(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Ut) return;
      const n = Ie.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function Lx(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: s
  } = e;
  if (uc(s) && n.found && !r.found) {
    const {
      width: l,
      height: f
    } = n, u = {
      x: l / f / 2,
      y: 0.5
    };
    a.style = jo(L(L({}, o), {}, {
      "transform-origin": "".concat(u.x + s.x / 16, "em ").concat(u.y + s.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function Wx(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const s = o === !0 ? "".concat(t, "-").concat(J.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: L(L({}, a), {}, {
        id: s
      }),
      children: r
    }]
  }];
}
function pc(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: s,
    title: l,
    maskId: f,
    titleId: u,
    extra: d,
    watchable: i = !1
  } = e, {
    width: c,
    height: p
  } = n.found ? n : t, g = W0.includes(r), m = [J.replacementClass, a ? "".concat(J.cssPrefix, "-").concat(a) : ""].filter((v) => d.classes.indexOf(v) === -1).filter((v) => v !== "" || !!v).concat(d.classes).join(" ");
  let h = {
    children: [],
    attributes: L(L({}, d.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: m,
      role: d.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(c, " ").concat(p)
    })
  };
  const b = g && !~d.classes.indexOf("fa-fw") ? {
    width: "".concat(c / p * 16 * 0.0625, "em")
  } : {};
  i && (h.attributes[In] = ""), l && (h.children.push({
    tag: "title",
    attributes: {
      id: h.attributes["aria-labelledby"] || "title-".concat(u || oa())
    },
    children: [l]
  }), delete h.attributes.title);
  const _ = L(L({}, h), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: f,
    transform: o,
    symbol: s,
    styles: L(L({}, b), d.styles)
  }), {
    children: k,
    attributes: A
  } = n.found && t.found ? hn("generateAbstractMask", _) || {
    children: [],
    attributes: {}
  } : hn("generateAbstractIcon", _) || {
    children: [],
    attributes: {}
  };
  return _.children = k, _.attributes = A, s ? Wx(_) : Lx(_);
}
function Ju(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: s,
    watchable: l = !1
  } = e, f = L(L(L({}, s.attributes), o ? {
    title: o
  } : {}), {}, {
    class: s.classes.join(" ")
  });
  l && (f[In] = "");
  const u = L({}, s.styles);
  uc(a) && (u.transform = hx({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), u["-webkit-transform"] = u.transform);
  const d = jo(u);
  d.length > 0 && (f.style = d);
  const i = [];
  return i.push({
    tag: "span",
    attributes: f,
    children: [t]
  }), o && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), i;
}
function Vx(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = L(L(L({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = jo(r.styles);
  o.length > 0 && (a.style = o);
  const s = [];
  return s.push({
    tag: "span",
    attributes: a,
    children: [t]
  }), n && s.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), s;
}
const {
  styles: wi
} = vt;
function $s(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(J.cssPrefix, "-").concat(bi.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(J.cssPrefix, "-").concat(bi.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(J.cssPrefix, "-").concat(bi.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: a
  };
}
const Yx = {
  found: !1,
  width: 512,
  height: 512
};
function Ux(e, t) {
  !mh && !J.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function js(e, t) {
  let n = t;
  return t === "fa" && J.styleDefault !== null && (t = mn()), new Promise((r, a) => {
    if (n === "fa") {
      const o = Nh(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && wi[t] && wi[t][e]) {
      const o = wi[t][e];
      return r($s(o));
    }
    Ux(e, t), r(L(L({}, Yx), {}, {
      icon: J.showMissingIcons && e ? hn("missingIconAbstract") || {} : {}
    }));
  });
}
const Zu = () => {
}, Ms = J.measurePerformance && Da && Da.mark && Da.measure ? Da : {
  mark: Zu,
  measure: Zu
}, zr = 'FA "6.7.2"', Hx = (e) => (Ms.mark("".concat(zr, " ").concat(e, " begins")), () => $h(e)), $h = (e) => {
  Ms.mark("".concat(zr, " ").concat(e, " ends")), Ms.measure("".concat(zr, " ").concat(e), "".concat(zr, " ").concat(e, " begins"), "".concat(zr, " ").concat(e, " ends"));
};
var mc = {
  begin: Hx,
  end: $h
};
const eo = () => {
};
function ef(e) {
  return typeof (e.getAttribute ? e.getAttribute(In) : null) == "string";
}
function Gx(e) {
  const t = e.getAttribute ? e.getAttribute(ic) : null, n = e.getAttribute ? e.getAttribute(sc) : null;
  return t && n;
}
function Bx(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(J.replacementClass);
}
function qx() {
  return J.autoReplaceSvg === !0 ? to.replace : to[J.autoReplaceSvg] || to.replace;
}
function Xx(e) {
  return Ie.createElementNS("http://www.w3.org/2000/svg", e);
}
function Kx(e) {
  return Ie.createElement(e);
}
function jh(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? Xx : Kx
  } = t;
  if (typeof e == "string")
    return Ie.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(jh(a, {
      ceFn: n
    }));
  }), r;
}
function Qx(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const to = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(jh(n), t);
      }), t.getAttribute(In) === null && J.keepOriginalSource) {
        let n = Ie.createComment(Qx(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~cc(t).indexOf(J.replacementClass))
      return to.replace(e);
    const r = new RegExp("".concat(J.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((s, l) => (l === J.replacementClass || l.match(r) ? s.toSvg.push(l) : s.toNode.push(l), s), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => ka(o)).join(`
`);
    t.setAttribute(In, ""), t.innerHTML = a;
  }
};
function tf(e) {
  e();
}
function Mh(e, t) {
  const n = typeof t == "function" ? t : eo;
  if (e.length === 0)
    n();
  else {
    let r = tf;
    J.mutateApproach === ex && (r = pn.requestAnimationFrame || tf), r(() => {
      const a = qx(), o = mc.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let hc = !1;
function Rh() {
  hc = !0;
}
function Rs() {
  hc = !1;
}
let mo = null;
function nf(e) {
  if (!Vu || !J.observeMutations)
    return;
  const {
    treeCallback: t = eo,
    nodeCallback: n = eo,
    pseudoElementsCallback: r = eo,
    observeMutationsRoot: a = Ie
  } = e;
  mo = new Vu((o) => {
    if (hc) return;
    const s = mn();
    vr(o).forEach((l) => {
      if (l.type === "childList" && l.addedNodes.length > 0 && !ef(l.addedNodes[0]) && (J.searchPseudoElements && r(l.target), t(l.target)), l.type === "attributes" && l.target.parentNode && J.searchPseudoElements && r(l.target.parentNode), l.type === "attributes" && ef(l.target) && ~ix.indexOf(l.attributeName))
        if (l.attributeName === "class" && Gx(l.target)) {
          const {
            prefix: f,
            iconName: u
          } = Ro(cc(l.target));
          l.target.setAttribute(ic, f || s), u && l.target.setAttribute(sc, u);
        } else Bx(l.target) && n(l.target);
    });
  }), Ut && mo.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Jx() {
  mo && mo.disconnect();
}
function Zx(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), s = o[0], l = o.slice(1);
    return s && l.length > 0 && (r[s] = l.join(":").trim()), r;
  }, {})), n;
}
function ew(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = Ro(cc(e));
  return a.prefix || (a.prefix = mn()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = Ox(a.prefix, e.innerText) || dc(a.prefix, _h(e.innerText))), !a.iconName && J.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function tw(e) {
  const t = vr(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return J.autoA11y && (n ? t["aria-labelledby"] = "".concat(J.replacementClass, "-title-").concat(r || oa()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function nw() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: bt,
    symbol: !1,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function rf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = ew(e), o = tw(e), s = Ts("parseNodeAttributes", {}, e);
  let l = t.styleParser ? Zx(e) : [];
  return L({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: bt,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: l,
      attributes: o
    }
  }, s);
}
const {
  styles: rw
} = vt;
function zh(e) {
  const t = J.autoReplaceSvg === "nest" ? rf(e, {
    styleParser: !1
  }) : rf(e);
  return ~t.extra.classes.indexOf(gh) ? hn("generateLayersText", e, t) : hn("generateSvgReplacementMutation", e, t);
}
function aw() {
  return [...D0, ...As];
}
function af(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Ut) return Promise.resolve();
  const n = Ie.documentElement.classList, r = (d) => n.add("".concat(Hu, "-").concat(d)), a = (d) => n.remove("".concat(Hu, "-").concat(d)), o = J.autoFetchSvg ? aw() : ch.concat(Object.keys(rw));
  o.includes("fa") || o.push("fa");
  const s = [".".concat(gh, ":not([").concat(In, "])")].concat(o.map((d) => ".".concat(d, ":not([").concat(In, "])"))).join(", ");
  if (s.length === 0)
    return Promise.resolve();
  let l = [];
  try {
    l = vr(e.querySelectorAll(s));
  } catch {
  }
  if (l.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const f = mc.begin("onTree"), u = l.reduce((d, i) => {
    try {
      const c = zh(i);
      c && d.push(c);
    } catch (c) {
      mh || c.name === "MissingIcon" && console.error(c);
    }
    return d;
  }, []);
  return new Promise((d, i) => {
    Promise.all(u).then((c) => {
      Mh(c, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), f(), d();
      });
    }).catch((c) => {
      f(), i(c);
    });
  });
}
function ow(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  zh(e).then((n) => {
    n && Mh([n], t);
  });
}
function iw(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Is(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Is(a || {})), e(r, L(L({}, n), {}, {
      mask: a
    }));
  };
}
const sw = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = bt,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: s = null,
    titleId: l = null,
    classes: f = [],
    attributes: u = {},
    styles: d = {}
  } = t;
  if (!e) return;
  const {
    prefix: i,
    iconName: c,
    icon: p
  } = e;
  return zo(L({
    type: "icon"
  }, e), () => ($n("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), J.autoA11y && (s ? u["aria-labelledby"] = "".concat(J.replacementClass, "-title-").concat(l || oa()) : (u["aria-hidden"] = "true", u.focusable = "false")), pc({
    icons: {
      main: $s(p),
      mask: a ? $s(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: i,
    iconName: c,
    transform: L(L({}, bt), n),
    symbol: r,
    title: s,
    maskId: o,
    titleId: l,
    extra: {
      attributes: u,
      styles: d,
      classes: f
    }
  })));
};
var lw = {
  mixout() {
    return {
      icon: iw(sw)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = af, e.nodeCallback = ow, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = Ie,
        callback: r = () => {
        }
      } = t;
      return af(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: s,
        transform: l,
        symbol: f,
        mask: u,
        maskId: d,
        extra: i
      } = n;
      return new Promise((c, p) => {
        Promise.all([js(r, s), u.iconName ? js(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((g) => {
          let [m, h] = g;
          c([t, pc({
            icons: {
              main: m,
              mask: h
            },
            prefix: s,
            iconName: r,
            transform: l,
            symbol: f,
            maskId: d,
            title: a,
            titleId: o,
            extra: i,
            watchable: !0
          })]);
        }).catch(p);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: s
      } = t;
      const l = jo(s);
      l.length > 0 && (r.style = l);
      let f;
      return uc(o) && (f = hn("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(f || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, cw = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return zo({
          type: "layer"
        }, () => {
          $n("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              r = r.concat(o.abstract);
            }) : r = r.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(J.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, uw = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return zo({
          type: "counter",
          content: e
        }, () => ($n("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Vx({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(J.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, fw = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = bt,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: s = {}
        } = t;
        return zo({
          type: "text",
          content: e
        }, () => ($n("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Ju({
          content: e,
          transform: L(L({}, bt), n),
          title: r,
          extra: {
            attributes: o,
            styles: s,
            classes: ["".concat(J.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: a,
        extra: o
      } = n;
      let s = null, l = null;
      if (sh) {
        const f = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        s = u.width / f, l = u.height / f;
      }
      return J.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Ju({
        content: t.innerHTML,
        width: s,
        height: l,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const dw = new RegExp('"', "ug"), of = [1105920, 1112319], sf = L(L(L(L({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), M0), J0), H0), zs = Object.keys(sf).reduce((e, t) => (e[t.toLowerCase()] = sf[t], e), {}), pw = Object.keys(zs).reduce((e, t) => {
  const n = zs[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function mw(e) {
  const t = e.replace(dw, ""), n = xx(t, 0), r = n >= of[0] && n <= of[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: _h(a ? t[0] : t),
    isSecondary: r || a
  };
}
function hw(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (zs[n] || {})[a] || pw[n];
}
function lf(e, t) {
  const n = "".concat(Z0).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const o = vr(e.children).filter((i) => i.getAttribute(Ss) === t)[0], s = pn.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), f = l.match(ax), u = s.getPropertyValue("font-weight"), d = s.getPropertyValue("content");
    if (o && !f)
      return e.removeChild(o), r();
    if (f && d !== "none" && d !== "") {
      const i = s.getPropertyValue("content");
      let c = hw(l, u);
      const {
        value: p,
        isSecondary: g
      } = mw(i), m = f[0].startsWith("FontAwesome");
      let h = dc(c, p), b = h;
      if (m) {
        const _ = Sx(p);
        _.iconName && _.prefix && (h = _.iconName, c = _.prefix);
      }
      if (h && !g && (!o || o.getAttribute(ic) !== c || o.getAttribute(sc) !== b)) {
        e.setAttribute(n, b), o && e.removeChild(o);
        const _ = nw(), {
          extra: k
        } = _;
        k.attributes[Ss] = t, js(h, c).then((A) => {
          const v = pc(L(L({}, _), {}, {
            icons: {
              main: A,
              mask: Th()
            },
            prefix: c,
            iconName: b,
            extra: k,
            watchable: !0
          })), H = Ie.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(H, e.firstChild) : e.appendChild(H), H.outerHTML = v.map((F) => ka(F)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function gw(e) {
  return Promise.all([lf(e, "::before"), lf(e, "::after")]);
}
function yw(e) {
  return e.parentNode !== document.head && !~tx.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Ss) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function cf(e) {
  if (Ut)
    return new Promise((t, n) => {
      const r = vr(e.querySelectorAll("*")).filter(yw).map(gw), a = mc.begin("searchPseudoElements");
      Rh(), Promise.all(r).then(() => {
        a(), Rs(), t();
      }).catch(() => {
        a(), Rs(), n();
      });
    });
}
var bw = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = cf, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = Ie
      } = t;
      J.searchPseudoElements && cf(n);
    };
  }
};
let uf = !1;
var vw = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Rh(), uf = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        nf(Ts("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Jx();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        uf ? Rs() : nf(Ts("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const ff = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const a = r.toLowerCase().split("-"), o = a[0];
    let s = a.slice(1).join("-");
    if (o && s === "h")
      return n.flipX = !0, n;
    if (o && s === "v")
      return n.flipY = !0, n;
    if (s = parseFloat(s), isNaN(s))
      return n;
    switch (o) {
      case "grow":
        n.size = n.size + s;
        break;
      case "shrink":
        n.size = n.size - s;
        break;
      case "left":
        n.x = n.x - s;
        break;
      case "right":
        n.x = n.x + s;
        break;
      case "up":
        n.y = n.y - s;
        break;
      case "down":
        n.y = n.y + s;
        break;
      case "rotate":
        n.rotate = n.rotate + s;
        break;
    }
    return n;
  }, t);
};
var xw = {
  mixout() {
    return {
      parse: {
        transform: (e) => ff(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = ff(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: a,
        iconWidth: o
      } = t;
      const s = {
        transform: "translate(".concat(a / 2, " 256)")
      }, l = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), f = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), u = "rotate(".concat(r.rotate, " 0 0)"), d = {
        transform: "".concat(l, " ").concat(f, " ").concat(u)
      }, i = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, c = {
        outer: s,
        inner: d,
        path: i
      };
      return {
        tag: "g",
        attributes: L({}, c.outer),
        children: [{
          tag: "g",
          attributes: L({}, c.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: L(L({}, n.icon.attributes), c.path)
          }]
        }]
      };
    };
  }
};
const _i = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function df(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function ww(e) {
  return e.tag === "g" ? e.children : [e];
}
var _w = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Ro(n.split(" ").map((a) => a.trim())) : Th();
        return r.prefix || (r.prefix = mn()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        mask: o,
        maskId: s,
        transform: l
      } = t;
      const {
        width: f,
        icon: u
      } = a, {
        width: d,
        icon: i
      } = o, c = mx({
        transform: l,
        containerWidth: d,
        iconWidth: f
      }), p = {
        tag: "rect",
        attributes: L(L({}, _i), {}, {
          fill: "white"
        })
      }, g = u.children ? {
        children: u.children.map(df)
      } : {}, m = {
        tag: "g",
        attributes: L({}, c.inner),
        children: [df(L({
          tag: u.tag,
          attributes: L(L({}, u.attributes), c.path)
        }, g))]
      }, h = {
        tag: "g",
        attributes: L({}, c.outer),
        children: [m]
      }, b = "mask-".concat(s || oa()), _ = "clip-".concat(s || oa()), k = {
        tag: "mask",
        attributes: L(L({}, _i), {}, {
          id: b,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, h]
      }, A = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: _
          },
          children: ww(i)
        }, k]
      };
      return n.push(A, {
        tag: "rect",
        attributes: L({
          fill: "currentColor",
          "clip-path": "url(#".concat(_, ")"),
          mask: "url(#".concat(b, ")")
        }, _i)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, kw = {
  provides(e) {
    let t = !1;
    pn.matchMedia && (t = pn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: L(L({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = L(L({}, a), {}, {
        attributeName: "opacity"
      }), s = {
        tag: "circle",
        attributes: L(L({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || s.children.push({
        tag: "animate",
        attributes: L(L({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: L(L({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(s), n.push({
        tag: "path",
        attributes: L(L({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: L(L({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: L(L({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: L(L({}, o), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: n
      };
    };
  }
}, Aw = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Ow = [yx, lw, cw, uw, fw, bw, vw, xw, _w, kw, Aw];
Mx(Ow, {
  mixoutsTo: Ke
});
Ke.noAuto;
Ke.config;
Ke.library;
Ke.dom;
const Ds = Ke.parse;
Ke.findIconDefinition;
Ke.toHtml;
const Sw = Ke.icon;
Ke.layer;
Ke.text;
Ke.counter;
function Ew(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var La = { exports: {} }, ki = { exports: {} }, ve = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var pf;
function Pw() {
  if (pf) return ve;
  pf = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
  function k(v) {
    if (typeof v == "object" && v !== null) {
      var H = v.$$typeof;
      switch (H) {
        case t:
          switch (v = v.type, v) {
            case f:
            case u:
            case r:
            case o:
            case a:
            case i:
              return v;
            default:
              switch (v = v && v.$$typeof, v) {
                case l:
                case d:
                case g:
                case p:
                case s:
                  return v;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function A(v) {
    return k(v) === u;
  }
  return ve.AsyncMode = f, ve.ConcurrentMode = u, ve.ContextConsumer = l, ve.ContextProvider = s, ve.Element = t, ve.ForwardRef = d, ve.Fragment = r, ve.Lazy = g, ve.Memo = p, ve.Portal = n, ve.Profiler = o, ve.StrictMode = a, ve.Suspense = i, ve.isAsyncMode = function(v) {
    return A(v) || k(v) === f;
  }, ve.isConcurrentMode = A, ve.isContextConsumer = function(v) {
    return k(v) === l;
  }, ve.isContextProvider = function(v) {
    return k(v) === s;
  }, ve.isElement = function(v) {
    return typeof v == "object" && v !== null && v.$$typeof === t;
  }, ve.isForwardRef = function(v) {
    return k(v) === d;
  }, ve.isFragment = function(v) {
    return k(v) === r;
  }, ve.isLazy = function(v) {
    return k(v) === g;
  }, ve.isMemo = function(v) {
    return k(v) === p;
  }, ve.isPortal = function(v) {
    return k(v) === n;
  }, ve.isProfiler = function(v) {
    return k(v) === o;
  }, ve.isStrictMode = function(v) {
    return k(v) === a;
  }, ve.isSuspense = function(v) {
    return k(v) === i;
  }, ve.isValidElementType = function(v) {
    return typeof v == "string" || typeof v == "function" || v === r || v === u || v === o || v === a || v === i || v === c || typeof v == "object" && v !== null && (v.$$typeof === g || v.$$typeof === p || v.$$typeof === s || v.$$typeof === l || v.$$typeof === d || v.$$typeof === h || v.$$typeof === b || v.$$typeof === _ || v.$$typeof === m);
  }, ve.typeOf = k, ve;
}
var Ae = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var mf;
function Cw() {
  return mf || (mf = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
    function k(w) {
      return typeof w == "string" || typeof w == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      w === r || w === u || w === o || w === a || w === i || w === c || typeof w == "object" && w !== null && (w.$$typeof === g || w.$$typeof === p || w.$$typeof === s || w.$$typeof === l || w.$$typeof === d || w.$$typeof === h || w.$$typeof === b || w.$$typeof === _ || w.$$typeof === m);
    }
    function A(w) {
      if (typeof w == "object" && w !== null) {
        var ce = w.$$typeof;
        switch (ce) {
          case t:
            var Ee = w.type;
            switch (Ee) {
              case f:
              case u:
              case r:
              case o:
              case a:
              case i:
                return Ee;
              default:
                var Ue = Ee && Ee.$$typeof;
                switch (Ue) {
                  case l:
                  case d:
                  case g:
                  case p:
                  case s:
                    return Ue;
                  default:
                    return ce;
                }
            }
          case n:
            return ce;
        }
      }
    }
    var v = f, H = u, F = l, Q = s, B = t, ie = d, ae = r, R = g, le = p, D = n, M = o, z = a, K = i, X = !1;
    function oe(w) {
      return X || (X = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), y(w) || A(w) === f;
    }
    function y(w) {
      return A(w) === u;
    }
    function x(w) {
      return A(w) === l;
    }
    function P(w) {
      return A(w) === s;
    }
    function N(w) {
      return typeof w == "object" && w !== null && w.$$typeof === t;
    }
    function O(w) {
      return A(w) === d;
    }
    function T(w) {
      return A(w) === r;
    }
    function S(w) {
      return A(w) === g;
    }
    function E(w) {
      return A(w) === p;
    }
    function $(w) {
      return A(w) === n;
    }
    function I(w) {
      return A(w) === o;
    }
    function j(w) {
      return A(w) === a;
    }
    function q(w) {
      return A(w) === i;
    }
    Ae.AsyncMode = v, Ae.ConcurrentMode = H, Ae.ContextConsumer = F, Ae.ContextProvider = Q, Ae.Element = B, Ae.ForwardRef = ie, Ae.Fragment = ae, Ae.Lazy = R, Ae.Memo = le, Ae.Portal = D, Ae.Profiler = M, Ae.StrictMode = z, Ae.Suspense = K, Ae.isAsyncMode = oe, Ae.isConcurrentMode = y, Ae.isContextConsumer = x, Ae.isContextProvider = P, Ae.isElement = N, Ae.isForwardRef = O, Ae.isFragment = T, Ae.isLazy = S, Ae.isMemo = E, Ae.isPortal = $, Ae.isProfiler = I, Ae.isStrictMode = j, Ae.isSuspense = q, Ae.isValidElementType = k, Ae.typeOf = A;
  }()), Ae;
}
var hf;
function Dh() {
  return hf || (hf = 1, process.env.NODE_ENV === "production" ? ki.exports = Pw() : ki.exports = Cw()), ki.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Ai, gf;
function Nw() {
  if (gf) return Ai;
  gf = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(o) {
    if (o == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(o);
  }
  function a() {
    try {
      if (!Object.assign)
        return !1;
      var o = new String("abc");
      if (o[5] = "de", Object.getOwnPropertyNames(o)[0] === "5")
        return !1;
      for (var s = {}, l = 0; l < 10; l++)
        s["_" + String.fromCharCode(l)] = l;
      var f = Object.getOwnPropertyNames(s).map(function(d) {
        return s[d];
      });
      if (f.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(d) {
        u[d] = d;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Ai = a() ? Object.assign : function(o, s) {
    for (var l, f = r(o), u, d = 1; d < arguments.length; d++) {
      l = Object(arguments[d]);
      for (var i in l)
        t.call(l, i) && (f[i] = l[i]);
      if (e) {
        u = e(l);
        for (var c = 0; c < u.length; c++)
          n.call(l, u[c]) && (f[u[c]] = l[u[c]]);
      }
    }
    return f;
  }, Ai;
}
var Oi, yf;
function gc() {
  if (yf) return Oi;
  yf = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Oi = e, Oi;
}
var bf, vf;
function Fh() {
  return vf || (vf = 1, bf = Function.call.bind(Object.prototype.hasOwnProperty)), bf;
}
var Si, xf;
function Tw() {
  if (xf) return Si;
  xf = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ gc(), n = {}, r = /* @__PURE__ */ Fh();
    e = function(o) {
      var s = "Warning: " + o;
      typeof console < "u" && console.error(s);
      try {
        throw new Error(s);
      } catch {
      }
    };
  }
  function a(o, s, l, f, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var d in o)
        if (r(o, d)) {
          var i;
          try {
            if (typeof o[d] != "function") {
              var c = Error(
                (f || "React class") + ": " + l + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw c.name = "Invariant Violation", c;
            }
            i = o[d](s, d, f, l, null, t);
          } catch (g) {
            i = g;
          }
          if (i && !(i instanceof Error) && e(
            (f || "React class") + ": type specification of " + l + " `" + d + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof i + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), i instanceof Error && !(i.message in n)) {
            n[i.message] = !0;
            var p = u ? u() : "";
            e(
              "Failed " + l + " type: " + i.message + (p ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Si = a, Si;
}
var Ei, wf;
function Iw() {
  if (wf) return Ei;
  wf = 1;
  var e = Dh(), t = Nw(), n = /* @__PURE__ */ gc(), r = /* @__PURE__ */ Fh(), a = /* @__PURE__ */ Tw(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(l) {
    var f = "Warning: " + l;
    typeof console < "u" && console.error(f);
    try {
      throw new Error(f);
    } catch {
    }
  });
  function s() {
    return null;
  }
  return Ei = function(l, f) {
    var u = typeof Symbol == "function" && Symbol.iterator, d = "@@iterator";
    function i(y) {
      var x = y && (u && y[u] || y[d]);
      if (typeof x == "function")
        return x;
    }
    var c = "<<anonymous>>", p = {
      array: b("array"),
      bigint: b("bigint"),
      bool: b("boolean"),
      func: b("function"),
      number: b("number"),
      object: b("object"),
      string: b("string"),
      symbol: b("symbol"),
      any: _(),
      arrayOf: k,
      element: A(),
      elementType: v(),
      instanceOf: H,
      node: ie(),
      objectOf: Q,
      oneOf: F,
      oneOfType: B,
      shape: R,
      exact: le
    };
    function g(y, x) {
      return y === x ? y !== 0 || 1 / y === 1 / x : y !== y && x !== x;
    }
    function m(y, x) {
      this.message = y, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function h(y) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, P = 0;
      function N(T, S, E, $, I, j, q) {
        if ($ = $ || c, j = j || E, q !== n) {
          if (f) {
            var w = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw w.name = "Invariant Violation", w;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ce = $ + ":" + E;
            !x[ce] && // Avoid spamming the console because they are often not actionable except for lib authors
            P < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + j + "` prop on `" + $ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[ce] = !0, P++);
          }
        }
        return S[E] == null ? T ? S[E] === null ? new m("The " + I + " `" + j + "` is marked as required " + ("in `" + $ + "`, but its value is `null`.")) : new m("The " + I + " `" + j + "` is marked as required in " + ("`" + $ + "`, but its value is `undefined`.")) : null : y(S, E, $, I, j);
      }
      var O = N.bind(null, !1);
      return O.isRequired = N.bind(null, !0), O;
    }
    function b(y) {
      function x(P, N, O, T, S, E) {
        var $ = P[N], I = z($);
        if (I !== y) {
          var j = K($);
          return new m(
            "Invalid " + T + " `" + S + "` of type " + ("`" + j + "` supplied to `" + O + "`, expected ") + ("`" + y + "`."),
            { expectedType: y }
          );
        }
        return null;
      }
      return h(x);
    }
    function _() {
      return h(s);
    }
    function k(y) {
      function x(P, N, O, T, S) {
        if (typeof y != "function")
          return new m("Property `" + S + "` of component `" + O + "` has invalid PropType notation inside arrayOf.");
        var E = P[N];
        if (!Array.isArray(E)) {
          var $ = z(E);
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected an array."));
        }
        for (var I = 0; I < E.length; I++) {
          var j = y(E, I, O, T, S + "[" + I + "]", n);
          if (j instanceof Error)
            return j;
        }
        return null;
      }
      return h(x);
    }
    function A() {
      function y(x, P, N, O, T) {
        var S = x[P];
        if (!l(S)) {
          var E = z(S);
          return new m("Invalid " + O + " `" + T + "` of type " + ("`" + E + "` supplied to `" + N + "`, expected a single ReactElement."));
        }
        return null;
      }
      return h(y);
    }
    function v() {
      function y(x, P, N, O, T) {
        var S = x[P];
        if (!e.isValidElementType(S)) {
          var E = z(S);
          return new m("Invalid " + O + " `" + T + "` of type " + ("`" + E + "` supplied to `" + N + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return h(y);
    }
    function H(y) {
      function x(P, N, O, T, S) {
        if (!(P[N] instanceof y)) {
          var E = y.name || c, $ = oe(P[N]);
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected ") + ("instance of `" + E + "`."));
        }
        return null;
      }
      return h(x);
    }
    function F(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), s;
      function x(P, N, O, T, S) {
        for (var E = P[N], $ = 0; $ < y.length; $++)
          if (g(E, y[$]))
            return null;
        var I = JSON.stringify(y, function(j, q) {
          var w = K(q);
          return w === "symbol" ? String(q) : q;
        });
        return new m("Invalid " + T + " `" + S + "` of value `" + String(E) + "` " + ("supplied to `" + O + "`, expected one of " + I + "."));
      }
      return h(x);
    }
    function Q(y) {
      function x(P, N, O, T, S) {
        if (typeof y != "function")
          return new m("Property `" + S + "` of component `" + O + "` has invalid PropType notation inside objectOf.");
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected an object."));
        for (var I in E)
          if (r(E, I)) {
            var j = y(E, I, O, T, S + "." + I, n);
            if (j instanceof Error)
              return j;
          }
        return null;
      }
      return h(x);
    }
    function B(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), s;
      for (var x = 0; x < y.length; x++) {
        var P = y[x];
        if (typeof P != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + X(P) + " at index " + x + "."
          ), s;
      }
      function N(O, T, S, E, $) {
        for (var I = [], j = 0; j < y.length; j++) {
          var q = y[j], w = q(O, T, S, E, $, n);
          if (w == null)
            return null;
          w.data && r(w.data, "expectedType") && I.push(w.data.expectedType);
        }
        var ce = I.length > 0 ? ", expected one of type [" + I.join(", ") + "]" : "";
        return new m("Invalid " + E + " `" + $ + "` supplied to " + ("`" + S + "`" + ce + "."));
      }
      return h(N);
    }
    function ie() {
      function y(x, P, N, O, T) {
        return D(x[P]) ? null : new m("Invalid " + O + " `" + T + "` supplied to " + ("`" + N + "`, expected a ReactNode."));
      }
      return h(y);
    }
    function ae(y, x, P, N, O) {
      return new m(
        (y || "React class") + ": " + x + " type `" + P + "." + N + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + O + "`."
      );
    }
    function R(y) {
      function x(P, N, O, T, S) {
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type `" + $ + "` " + ("supplied to `" + O + "`, expected `object`."));
        for (var I in y) {
          var j = y[I];
          if (typeof j != "function")
            return ae(O, T, S, I, K(j));
          var q = j(E, I, O, T, S + "." + I, n);
          if (q)
            return q;
        }
        return null;
      }
      return h(x);
    }
    function le(y) {
      function x(P, N, O, T, S) {
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type `" + $ + "` " + ("supplied to `" + O + "`, expected `object`."));
        var I = t({}, P[N], y);
        for (var j in I) {
          var q = y[j];
          if (r(y, j) && typeof q != "function")
            return ae(O, T, S, j, K(q));
          if (!q)
            return new m(
              "Invalid " + T + " `" + S + "` key `" + j + "` supplied to `" + O + "`.\nBad object: " + JSON.stringify(P[N], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(y), null, "  ")
            );
          var w = q(E, j, O, T, S + "." + j, n);
          if (w)
            return w;
        }
        return null;
      }
      return h(x);
    }
    function D(y) {
      switch (typeof y) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !y;
        case "object":
          if (Array.isArray(y))
            return y.every(D);
          if (y === null || l(y))
            return !0;
          var x = i(y);
          if (x) {
            var P = x.call(y), N;
            if (x !== y.entries) {
              for (; !(N = P.next()).done; )
                if (!D(N.value))
                  return !1;
            } else
              for (; !(N = P.next()).done; ) {
                var O = N.value;
                if (O && !D(O[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function M(y, x) {
      return y === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function z(y) {
      var x = typeof y;
      return Array.isArray(y) ? "array" : y instanceof RegExp ? "object" : M(x, y) ? "symbol" : x;
    }
    function K(y) {
      if (typeof y > "u" || y === null)
        return "" + y;
      var x = z(y);
      if (x === "object") {
        if (y instanceof Date)
          return "date";
        if (y instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function X(y) {
      var x = K(y);
      switch (x) {
        case "array":
        case "object":
          return "an " + x;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + x;
        default:
          return x;
      }
    }
    function oe(y) {
      return !y.constructor || !y.constructor.name ? c : y.constructor.name;
    }
    return p.checkPropTypes = a, p.resetWarningCache = a.resetWarningCache, p.PropTypes = p, p;
  }, Ei;
}
var Pi, _f;
function $w() {
  if (_f) return Pi;
  _f = 1;
  var e = /* @__PURE__ */ gc();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Pi = function() {
    function r(s, l, f, u, d, i) {
      if (i !== e) {
        var c = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw c.name = "Invariant Violation", c;
      }
    }
    r.isRequired = r;
    function a() {
      return r;
    }
    var o = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: a,
      element: r,
      elementType: r,
      instanceOf: a,
      node: r,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, Pi;
}
var kf;
function jw() {
  if (kf) return La.exports;
  if (kf = 1, process.env.NODE_ENV !== "production") {
    var e = Dh(), t = !0;
    La.exports = /* @__PURE__ */ Iw()(e.isElement, t);
  } else
    La.exports = /* @__PURE__ */ $w()();
  return La.exports;
}
var Mw = /* @__PURE__ */ jw();
const me = /* @__PURE__ */ Ew(Mw);
function Af(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function pt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Af(Object(n), !0).forEach(function(r) {
      Xn(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Af(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function ho(e) {
  "@babel/helpers - typeof";
  return ho = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ho(e);
}
function Xn(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Rw(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function zw(e, t) {
  if (e == null) return {};
  var n = Rw(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Fs(e) {
  return Dw(e) || Fw(e) || Lw(e) || Ww();
}
function Dw(e) {
  if (Array.isArray(e)) return Ls(e);
}
function Fw(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Lw(e, t) {
  if (e) {
    if (typeof e == "string") return Ls(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Ls(e, t);
  }
}
function Ls(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Ww() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Vw(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, s = e.shake, l = e.flash, f = e.spin, u = e.spinPulse, d = e.spinReverse, i = e.pulse, c = e.fixedWidth, p = e.inverse, g = e.border, m = e.listItem, h = e.flip, b = e.size, _ = e.rotation, k = e.pull, A = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": s,
    "fa-flash": l,
    "fa-spin": f,
    "fa-spin-reverse": d,
    "fa-spin-pulse": u,
    "fa-pulse": i,
    "fa-fw": c,
    "fa-inverse": p,
    "fa-border": g,
    "fa-li": m,
    "fa-flip": h === !0,
    "fa-flip-horizontal": h === "horizontal" || h === "both",
    "fa-flip-vertical": h === "vertical" || h === "both"
  }, Xn(t, "fa-".concat(b), typeof b < "u" && b !== null), Xn(t, "fa-rotate-".concat(_), typeof _ < "u" && _ !== null && _ !== 0), Xn(t, "fa-pull-".concat(k), typeof k < "u" && k !== null), Xn(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(A).map(function(v) {
    return A[v] ? v : null;
  }).filter(function(v) {
    return v;
  });
}
function Yw(e) {
  return e = e - 0, e === e;
}
function Lh(e) {
  return Yw(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Uw = ["style"];
function Hw(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Gw(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Lh(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[Hw(a)] = o : t[a] = o, t;
  }, {});
}
function Wh(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(f) {
    return Wh(e, f);
  }), a = Object.keys(t.attributes || {}).reduce(function(f, u) {
    var d = t.attributes[u];
    switch (u) {
      case "class":
        f.attrs.className = d, delete t.attributes.class;
        break;
      case "style":
        f.attrs.style = Gw(d);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? f.attrs[u.toLowerCase()] = d : f.attrs[Lh(u)] = d;
    }
    return f;
  }, {
    attrs: {}
  }), o = n.style, s = o === void 0 ? {} : o, l = zw(n, Uw);
  return a.attrs.style = pt(pt({}, a.attrs.style), s), e.apply(void 0, [t.tag, pt(pt({}, a.attrs), l)].concat(Fs(r)));
}
var Vh = !1;
try {
  Vh = process.env.NODE_ENV === "production";
} catch {
}
function Bw() {
  if (!Vh && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Of(e) {
  if (e && ho(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Ds.icon)
    return Ds.icon(e);
  if (e === null)
    return null;
  if (e && ho(e) === "object" && e.prefix && e.iconName)
    return e;
  if (Array.isArray(e) && e.length === 2)
    return {
      prefix: e[0],
      iconName: e[1]
    };
  if (typeof e == "string")
    return {
      prefix: "fas",
      iconName: e
    };
}
function Ci(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Xn({}, e, t) : {};
}
var Sf = {
  border: !1,
  className: "",
  mask: null,
  maskId: null,
  fixedWidth: !1,
  inverse: !1,
  flip: !1,
  icon: null,
  listItem: !1,
  pull: null,
  pulse: !1,
  rotation: null,
  size: null,
  spin: !1,
  spinPulse: !1,
  spinReverse: !1,
  beat: !1,
  fade: !1,
  beatFade: !1,
  bounce: !1,
  shake: !1,
  symbol: !1,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: !1
}, sa = /* @__PURE__ */ On.forwardRef(function(e, t) {
  var n = pt(pt({}, Sf), e), r = n.icon, a = n.mask, o = n.symbol, s = n.className, l = n.title, f = n.titleId, u = n.maskId, d = Of(r), i = Ci("classes", [].concat(Fs(Vw(n)), Fs((s || "").split(" ")))), c = Ci("transform", typeof n.transform == "string" ? Ds.transform(n.transform) : n.transform), p = Ci("mask", Of(a)), g = Sw(d, pt(pt(pt(pt({}, i), c), p), {}, {
    symbol: o,
    title: l,
    titleId: f,
    maskId: u
  }));
  if (!g)
    return Bw("Could not find icon", d), null;
  var m = g.abstract, h = {
    ref: t
  };
  return Object.keys(n).forEach(function(b) {
    Sf.hasOwnProperty(b) || (h[b] = n[b]);
  }), qw(m[0], h);
});
sa.displayName = "FontAwesomeIcon";
sa.propTypes = {
  beat: me.bool,
  border: me.bool,
  beatFade: me.bool,
  bounce: me.bool,
  className: me.string,
  fade: me.bool,
  flash: me.bool,
  mask: me.oneOfType([me.object, me.array, me.string]),
  maskId: me.string,
  fixedWidth: me.bool,
  inverse: me.bool,
  flip: me.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: me.oneOfType([me.object, me.array, me.string]),
  listItem: me.bool,
  pull: me.oneOf(["right", "left"]),
  pulse: me.bool,
  rotation: me.oneOf([0, 90, 180, 270]),
  shake: me.bool,
  size: me.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: me.bool,
  spinPulse: me.bool,
  spinReverse: me.bool,
  symbol: me.oneOfType([me.bool, me.string]),
  title: me.string,
  titleId: me.string,
  transform: me.oneOfType([me.string, me.object]),
  swapOpacity: me.bool
};
var qw = Wh.bind(null, On.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Xw = {
  prefix: "fas",
  iconName: "xmark",
  icon: [384, 512, [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"], "f00d", "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Kw(e, t, n) {
  return (t = Jw(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Ef(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function W(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ef(Object(n), !0).forEach(function(r) {
      Kw(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ef(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Qw(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Jw(e) {
  var t = Qw(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Pf = () => {
};
let yc = {}, Yh = {}, Uh = null, Hh = {
  mark: Pf,
  measure: Pf
};
try {
  typeof window < "u" && (yc = window), typeof document < "u" && (Yh = document), typeof MutationObserver < "u" && (Uh = MutationObserver), typeof performance < "u" && (Hh = performance);
} catch {
}
const {
  userAgent: Cf = ""
} = yc.navigator || {}, gn = yc, $e = Yh, Nf = Uh, Wa = Hh;
gn.document;
const Ht = !!$e.documentElement && !!$e.head && typeof $e.addEventListener == "function" && typeof $e.createElement == "function", Gh = ~Cf.indexOf("MSIE") || ~Cf.indexOf("Trident/");
var Zw = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, e2 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Bh = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, t2 = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, qh = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], We = "classic", Do = "duotone", n2 = "sharp", r2 = "sharp-duotone", Xh = [We, Do, n2, r2], a2 = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, o2 = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, i2 = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), s2 = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
}, l2 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Tf = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, c2 = ["kit"], u2 = {
  kit: {
    "fa-kit": "fak"
  }
}, f2 = ["fak", "fakd"], d2 = {
  kit: {
    fak: "fa-kit"
  }
}, If = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Va = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, p2 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], m2 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], h2 = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, g2 = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, y2 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Ws = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, b2 = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Vs = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...p2, ...b2], v2 = ["solid", "regular", "light", "thin", "duotone", "brands"], Kh = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], x2 = Kh.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), w2 = [...Object.keys(y2), ...v2, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Va.GROUP, Va.SWAP_OPACITY, Va.PRIMARY, Va.SECONDARY].concat(Kh.map((e) => "".concat(e, "x"))).concat(x2.map((e) => "w-".concat(e))), _2 = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const zt = "___FONT_AWESOME___", Ys = 16, Qh = "fa", Jh = "svg-inline--fa", jn = "data-fa-i2svg", Us = "data-fa-pseudo-element", k2 = "data-fa-pseudo-element-pending", bc = "data-prefix", vc = "data-icon", $f = "fontawesome-i2svg", A2 = "async", O2 = ["HTML", "HEAD", "STYLE", "SCRIPT"], Zh = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Aa(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[We];
    }
  });
}
const eg = W({}, Bh);
eg[We] = W(W(W(W({}, {
  "fa-duotone": "duotone"
}), Bh[We]), Tf.kit), Tf["kit-duotone"]);
const S2 = Aa(eg), Hs = W({}, s2);
Hs[We] = W(W(W(W({}, {
  duotone: "fad"
}), Hs[We]), If.kit), If["kit-duotone"]);
const jf = Aa(Hs), Gs = W({}, Ws);
Gs[We] = W(W({}, Gs[We]), d2.kit);
const xc = Aa(Gs), Bs = W({}, g2);
Bs[We] = W(W({}, Bs[We]), u2.kit);
Aa(Bs);
const E2 = Zw, tg = "fa-layers-text", P2 = e2, C2 = W({}, a2);
Aa(C2);
const N2 = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ni = t2, T2 = [...c2, ...w2], Gr = gn.FontAwesomeConfig || {};
function I2(e) {
  var t = $e.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function $2(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
$e && typeof $e.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = $2(I2(t));
  r != null && (Gr[n] = r);
});
const ng = {
  styleDefault: "solid",
  familyDefault: We,
  cssPrefix: Qh,
  replacementClass: Jh,
  autoReplaceSvg: !0,
  autoAddCss: !0,
  autoA11y: !0,
  searchPseudoElements: !1,
  observeMutations: !0,
  mutateApproach: "async",
  keepOriginalSource: !0,
  measurePerformance: !1,
  showMissingIcons: !0
};
Gr.familyPrefix && (Gr.cssPrefix = Gr.familyPrefix);
const mr = W(W({}, ng), Gr);
mr.autoReplaceSvg || (mr.observeMutations = !1);
const Z = {};
Object.keys(ng).forEach((e) => {
  Object.defineProperty(Z, e, {
    enumerable: !0,
    set: function(t) {
      mr[e] = t, Br.forEach((n) => n(Z));
    },
    get: function() {
      return mr[e];
    }
  });
});
Object.defineProperty(Z, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    mr.cssPrefix = e, Br.forEach((t) => t(Z));
  },
  get: function() {
    return mr.cssPrefix;
  }
});
gn.FontAwesomeConfig = Z;
const Br = [];
function j2(e) {
  return Br.push(e), () => {
    Br.splice(Br.indexOf(e), 1);
  };
}
const Qt = Ys, xt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function M2(e) {
  if (!e || !Ht)
    return;
  const t = $e.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = $e.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], s = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(s) > -1 && (r = o);
  }
  return $e.head.insertBefore(t, r), e;
}
const R2 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function la() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += R2[Math.random() * 62 | 0];
  return t;
}
function xr(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function wc(e) {
  return e.classList ? xr(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function rg(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function z2(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(rg(e[n]), '" '), "").trim();
}
function Fo(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function _c(e) {
  return e.size !== xt.size || e.x !== xt.x || e.y !== xt.y || e.rotate !== xt.rotate || e.flipX || e.flipY;
}
function D2(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), s = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), l = "rotate(".concat(t.rotate, " 0 0)"), f = {
    transform: "".concat(o, " ").concat(s, " ").concat(l)
  }, u = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: f,
    path: u
  };
}
function F2(e) {
  let {
    transform: t,
    width: n = Ys,
    height: r = Ys,
    startCentered: a = !1
  } = e, o = "";
  return a && Gh ? o += "translate(".concat(t.x / Qt - n / 2, "em, ").concat(t.y / Qt - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / Qt, "em), calc(-50% + ").concat(t.y / Qt, "em)) ") : o += "translate(".concat(t.x / Qt, "em, ").concat(t.y / Qt, "em) "), o += "scale(".concat(t.size / Qt * (t.flipX ? -1 : 1), ", ").concat(t.size / Qt * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var L2 = `:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;
function ag() {
  const e = Qh, t = Jh, n = Z.cssPrefix, r = Z.replacementClass;
  let a = L2;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), s = new RegExp("\\--".concat(e, "\\-"), "g"), l = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(s, "--".concat(n, "-")).replace(l, ".".concat(r));
  }
  return a;
}
let Mf = !1;
function Ti() {
  Z.autoAddCss && !Mf && (M2(ag()), Mf = !0);
}
var W2 = {
  mixout() {
    return {
      dom: {
        css: ag,
        insertCss: Ti
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Ti();
      },
      beforeI2svg() {
        Ti();
      }
    };
  }
};
const Dt = gn || {};
Dt[zt] || (Dt[zt] = {});
Dt[zt].styles || (Dt[zt].styles = {});
Dt[zt].hooks || (Dt[zt].hooks = {});
Dt[zt].shims || (Dt[zt].shims = []);
var wt = Dt[zt];
const og = [], ig = function() {
  $e.removeEventListener("DOMContentLoaded", ig), go = 1, og.map((e) => e());
};
let go = !1;
Ht && (go = ($e.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test($e.readyState), go || $e.addEventListener("DOMContentLoaded", ig));
function V2(e) {
  Ht && (go ? setTimeout(e, 0) : og.push(e));
}
function Oa(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? rg(e) : "<".concat(t, " ").concat(z2(n), ">").concat(r.map(Oa).join(""), "</").concat(t, ">");
}
function Rf(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Ii = function(e, t, n, r) {
  var a = Object.keys(e), o = a.length, s = t, l, f, u;
  for (n === void 0 ? (l = 1, u = e[a[0]]) : (l = 0, u = n); l < o; l++)
    f = a[l], u = s(u, e[f], f, e);
  return u;
};
function Y2(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const a = e.charCodeAt(n++);
    if (a >= 55296 && a <= 56319 && n < r) {
      const o = e.charCodeAt(n++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), n--);
    } else
      t.push(a);
  }
  return t;
}
function sg(e) {
  const t = Y2(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function U2(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function zf(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function qs(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = zf(t);
  typeof wt.hooks.addPack == "function" && !r ? wt.hooks.addPack(e, zf(t)) : wt.styles[e] = W(W({}, wt.styles[e] || {}), a), e === "fas" && qs("fa", t);
}
const {
  styles: ca,
  shims: H2
} = wt, lg = Object.keys(xc), G2 = lg.reduce((e, t) => (e[t] = Object.keys(xc[t]), e), {});
let kc = null, cg = {}, ug = {}, fg = {}, dg = {}, pg = {};
function B2(e) {
  return ~T2.indexOf(e);
}
function q2(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !B2(a) ? a : null;
}
const mg = () => {
  const e = (r) => Ii(ca, (a, o, s) => (a[s] = Ii(o, r, {}), a), {});
  cg = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), ug = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), pg = e((r, a, o) => {
    const s = a[2];
    return r[o] = o, s.forEach((l) => {
      r[l] = o;
    }), r;
  });
  const t = "far" in ca || Z.autoFetchSvg, n = Ii(H2, (r, a) => {
    const o = a[0];
    let s = a[1];
    const l = a[2];
    return s === "far" && !t && (s = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: s,
      iconName: l
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: s,
      iconName: l
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  fg = n.names, dg = n.unicodes, kc = Lo(Z.styleDefault, {
    family: Z.familyDefault
  });
};
j2((e) => {
  kc = Lo(e.styleDefault, {
    family: Z.familyDefault
  });
});
mg();
function Ac(e, t) {
  return (cg[e] || {})[t];
}
function X2(e, t) {
  return (ug[e] || {})[t];
}
function Pn(e, t) {
  return (pg[e] || {})[t];
}
function hg(e) {
  return fg[e] || {
    prefix: null,
    iconName: null
  };
}
function K2(e) {
  const t = dg[e], n = Ac("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function yn() {
  return kc;
}
const gg = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Q2(e) {
  let t = We;
  const n = lg.reduce((r, a) => (r[a] = "".concat(Z.cssPrefix, "-").concat(a), r), {});
  return Xh.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => G2[r].includes(a))) && (t = r);
  }), t;
}
function Lo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = We
  } = t, r = S2[n][e];
  if (n === Do && !e)
    return "fad";
  const a = jf[n][e] || jf[n][r], o = e in wt.styles ? e : null;
  return a || o || null;
}
function J2(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = q2(Z.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Df(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Wo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = Vs.concat(m2), o = Df(e.filter((i) => a.includes(i))), s = Df(e.filter((i) => !Vs.includes(i))), l = o.filter((i) => (r = i, !qh.includes(i))), [f = null] = l, u = Q2(o), d = W(W({}, J2(s)), {}, {
    prefix: Lo(f, {
      family: u
    })
  });
  return W(W(W({}, d), n_({
    values: e,
    family: u,
    styles: ca,
    config: Z,
    canonical: d,
    givenPrefix: r
  })), Z2(n, r, d));
}
function Z2(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? hg(a) : {}, s = Pn(r, a);
  return a = o.iconName || s || a, r = o.prefix || r, r === "far" && !ca.far && ca.fas && !Z.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const e_ = Xh.filter((e) => e !== We || e !== Do), t_ = Object.keys(Ws).filter((e) => e !== We).map((e) => Object.keys(Ws[e])).flat();
function n_(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: s = {}
  } = e, l = n === Do, f = t.includes("fa-duotone") || t.includes("fad"), u = s.familyDefault === "duotone", d = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!l && (f || u || d) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && e_.includes(n) && (Object.keys(o).find((i) => t_.includes(i)) || s.autoFetchSvg)) {
    const i = i2.get(n).defaultShortPrefixId;
    r.prefix = i, r.iconName = Pn(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = yn() || "fas"), r;
}
class r_ {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = W(W({}, this.definitions[o] || {}), a[o]), qs(o, a[o]);
      const s = xc[We][o];
      s && qs(s, a[o]), mg();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((a) => {
      const {
        prefix: o,
        iconName: s,
        icon: l
      } = r[a], f = l[2];
      t[o] || (t[o] = {}), f.length > 0 && f.forEach((u) => {
        typeof u == "string" && (t[o][u] = l);
      }), t[o][s] = l;
    }), t;
  }
}
let Ff = [], Kn = {};
const ir = {}, a_ = Object.keys(ir);
function o_(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Ff = e, Kn = {}, Object.keys(ir).forEach((r) => {
    a_.indexOf(r) === -1 && delete ir[r];
  }), Ff.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((s) => {
        n[o] || (n[o] = {}), n[o][s] = a[o][s];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((s) => {
        Kn[s] || (Kn[s] = []), Kn[s].push(o[s]);
      });
    }
    r.provides && r.provides(ir);
  }), n;
}
function Xs(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Kn[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...r]);
  }), t;
}
function Mn(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Kn[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function bn() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return ir[e] ? ir[e].apply(null, t) : void 0;
}
function Ks(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || yn();
  if (t)
    return t = Pn(n, t) || t, Rf(yg.definitions, n, t) || Rf(wt.styles, n, t);
}
const yg = new r_(), i_ = () => {
  Z.autoReplaceSvg = !1, Z.observeMutations = !1, Mn("noAuto");
}, s_ = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Ht ? (Mn("beforeI2svg", e), bn("pseudoElements2svg", e), bn("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    Z.autoReplaceSvg === !1 && (Z.autoReplaceSvg = !0), Z.observeMutations = !0, V2(() => {
      c_({
        autoReplaceSvgRoot: t
      }), Mn("watch", e);
    });
  }
}, l_ = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Pn(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Lo(e[0]);
      return {
        prefix: n,
        iconName: Pn(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(Z.cssPrefix, "-")) > -1 || e.match(E2))) {
      const t = Wo(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || yn(),
        iconName: Pn(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = yn();
      return {
        prefix: t,
        iconName: Pn(t, e) || e
      };
    }
  }
}, Qe = {
  noAuto: i_,
  config: Z,
  dom: s_,
  parse: l_,
  library: yg,
  findIconDefinition: Ks,
  toHtml: Oa
}, c_ = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = $e
  } = e;
  (Object.keys(wt.styles).length > 0 || Z.autoFetchSvg) && Ht && Z.autoReplaceSvg && Qe.dom.i2svg({
    node: t
  });
};
function Vo(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Oa(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Ht) return;
      const n = $e.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function u_(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: s
  } = e;
  if (_c(s) && n.found && !r.found) {
    const {
      width: l,
      height: f
    } = n, u = {
      x: l / f / 2,
      y: 0.5
    };
    a.style = Fo(W(W({}, o), {}, {
      "transform-origin": "".concat(u.x + s.x / 16, "em ").concat(u.y + s.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function f_(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const s = o === !0 ? "".concat(t, "-").concat(Z.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: W(W({}, a), {}, {
        id: s
      }),
      children: r
    }]
  }];
}
function Oc(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: s,
    title: l,
    maskId: f,
    titleId: u,
    extra: d,
    watchable: i = !1
  } = e, {
    width: c,
    height: p
  } = n.found ? n : t, g = f2.includes(r), m = [Z.replacementClass, a ? "".concat(Z.cssPrefix, "-").concat(a) : ""].filter((v) => d.classes.indexOf(v) === -1).filter((v) => v !== "" || !!v).concat(d.classes).join(" ");
  let h = {
    children: [],
    attributes: W(W({}, d.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: m,
      role: d.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(c, " ").concat(p)
    })
  };
  const b = g && !~d.classes.indexOf("fa-fw") ? {
    width: "".concat(c / p * 16 * 0.0625, "em")
  } : {};
  i && (h.attributes[jn] = ""), l && (h.children.push({
    tag: "title",
    attributes: {
      id: h.attributes["aria-labelledby"] || "title-".concat(u || la())
    },
    children: [l]
  }), delete h.attributes.title);
  const _ = W(W({}, h), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: f,
    transform: o,
    symbol: s,
    styles: W(W({}, b), d.styles)
  }), {
    children: k,
    attributes: A
  } = n.found && t.found ? bn("generateAbstractMask", _) || {
    children: [],
    attributes: {}
  } : bn("generateAbstractIcon", _) || {
    children: [],
    attributes: {}
  };
  return _.children = k, _.attributes = A, s ? f_(_) : u_(_);
}
function Lf(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: s,
    watchable: l = !1
  } = e, f = W(W(W({}, s.attributes), o ? {
    title: o
  } : {}), {}, {
    class: s.classes.join(" ")
  });
  l && (f[jn] = "");
  const u = W({}, s.styles);
  _c(a) && (u.transform = F2({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), u["-webkit-transform"] = u.transform);
  const d = Fo(u);
  d.length > 0 && (f.style = d);
  const i = [];
  return i.push({
    tag: "span",
    attributes: f,
    children: [t]
  }), o && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), i;
}
function d_(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = W(W(W({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = Fo(r.styles);
  o.length > 0 && (a.style = o);
  const s = [];
  return s.push({
    tag: "span",
    attributes: a,
    children: [t]
  }), n && s.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), s;
}
const {
  styles: $i
} = wt;
function Qs(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(Z.cssPrefix, "-").concat(Ni.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(Z.cssPrefix, "-").concat(Ni.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(Z.cssPrefix, "-").concat(Ni.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: a
  };
}
const p_ = {
  found: !1,
  width: 512,
  height: 512
};
function m_(e, t) {
  !Zh && !Z.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Js(e, t) {
  let n = t;
  return t === "fa" && Z.styleDefault !== null && (t = yn()), new Promise((r, a) => {
    if (n === "fa") {
      const o = hg(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && $i[t] && $i[t][e]) {
      const o = $i[t][e];
      return r(Qs(o));
    }
    m_(e, t), r(W(W({}, p_), {}, {
      icon: Z.showMissingIcons && e ? bn("missingIconAbstract") || {} : {}
    }));
  });
}
const Wf = () => {
}, Zs = Z.measurePerformance && Wa && Wa.mark && Wa.measure ? Wa : {
  mark: Wf,
  measure: Wf
}, Dr = 'FA "6.7.2"', h_ = (e) => (Zs.mark("".concat(Dr, " ").concat(e, " begins")), () => bg(e)), bg = (e) => {
  Zs.mark("".concat(Dr, " ").concat(e, " ends")), Zs.measure("".concat(Dr, " ").concat(e), "".concat(Dr, " ").concat(e, " begins"), "".concat(Dr, " ").concat(e, " ends"));
};
var Sc = {
  begin: h_,
  end: bg
};
const no = () => {
};
function Vf(e) {
  return typeof (e.getAttribute ? e.getAttribute(jn) : null) == "string";
}
function g_(e) {
  const t = e.getAttribute ? e.getAttribute(bc) : null, n = e.getAttribute ? e.getAttribute(vc) : null;
  return t && n;
}
function y_(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(Z.replacementClass);
}
function b_() {
  return Z.autoReplaceSvg === !0 ? ro.replace : ro[Z.autoReplaceSvg] || ro.replace;
}
function v_(e) {
  return $e.createElementNS("http://www.w3.org/2000/svg", e);
}
function x_(e) {
  return $e.createElement(e);
}
function vg(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? v_ : x_
  } = t;
  if (typeof e == "string")
    return $e.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(vg(a, {
      ceFn: n
    }));
  }), r;
}
function w_(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const ro = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(vg(n), t);
      }), t.getAttribute(jn) === null && Z.keepOriginalSource) {
        let n = $e.createComment(w_(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~wc(t).indexOf(Z.replacementClass))
      return ro.replace(e);
    const r = new RegExp("".concat(Z.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((s, l) => (l === Z.replacementClass || l.match(r) ? s.toSvg.push(l) : s.toNode.push(l), s), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => Oa(o)).join(`
`);
    t.setAttribute(jn, ""), t.innerHTML = a;
  }
};
function Yf(e) {
  e();
}
function xg(e, t) {
  const n = typeof t == "function" ? t : no;
  if (e.length === 0)
    n();
  else {
    let r = Yf;
    Z.mutateApproach === A2 && (r = gn.requestAnimationFrame || Yf), r(() => {
      const a = b_(), o = Sc.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let Ec = !1;
function wg() {
  Ec = !0;
}
function el() {
  Ec = !1;
}
let yo = null;
function Uf(e) {
  if (!Nf || !Z.observeMutations)
    return;
  const {
    treeCallback: t = no,
    nodeCallback: n = no,
    pseudoElementsCallback: r = no,
    observeMutationsRoot: a = $e
  } = e;
  yo = new Nf((o) => {
    if (Ec) return;
    const s = yn();
    xr(o).forEach((l) => {
      if (l.type === "childList" && l.addedNodes.length > 0 && !Vf(l.addedNodes[0]) && (Z.searchPseudoElements && r(l.target), t(l.target)), l.type === "attributes" && l.target.parentNode && Z.searchPseudoElements && r(l.target.parentNode), l.type === "attributes" && Vf(l.target) && ~N2.indexOf(l.attributeName))
        if (l.attributeName === "class" && g_(l.target)) {
          const {
            prefix: f,
            iconName: u
          } = Wo(wc(l.target));
          l.target.setAttribute(bc, f || s), u && l.target.setAttribute(vc, u);
        } else y_(l.target) && n(l.target);
    });
  }), Ht && yo.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function __() {
  yo && yo.disconnect();
}
function k_(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), s = o[0], l = o.slice(1);
    return s && l.length > 0 && (r[s] = l.join(":").trim()), r;
  }, {})), n;
}
function A_(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = Wo(wc(e));
  return a.prefix || (a.prefix = yn()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = X2(a.prefix, e.innerText) || Ac(a.prefix, sg(e.innerText))), !a.iconName && Z.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function O_(e) {
  const t = xr(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return Z.autoA11y && (n ? t["aria-labelledby"] = "".concat(Z.replacementClass, "-title-").concat(r || la()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function S_() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: xt,
    symbol: !1,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function Hf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = A_(e), o = O_(e), s = Xs("parseNodeAttributes", {}, e);
  let l = t.styleParser ? k_(e) : [];
  return W({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: xt,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: l,
      attributes: o
    }
  }, s);
}
const {
  styles: E_
} = wt;
function _g(e) {
  const t = Z.autoReplaceSvg === "nest" ? Hf(e, {
    styleParser: !1
  }) : Hf(e);
  return ~t.extra.classes.indexOf(tg) ? bn("generateLayersText", e, t) : bn("generateSvgReplacementMutation", e, t);
}
function P_() {
  return [...l2, ...Vs];
}
function Gf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Ht) return Promise.resolve();
  const n = $e.documentElement.classList, r = (d) => n.add("".concat($f, "-").concat(d)), a = (d) => n.remove("".concat($f, "-").concat(d)), o = Z.autoFetchSvg ? P_() : qh.concat(Object.keys(E_));
  o.includes("fa") || o.push("fa");
  const s = [".".concat(tg, ":not([").concat(jn, "])")].concat(o.map((d) => ".".concat(d, ":not([").concat(jn, "])"))).join(", ");
  if (s.length === 0)
    return Promise.resolve();
  let l = [];
  try {
    l = xr(e.querySelectorAll(s));
  } catch {
  }
  if (l.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const f = Sc.begin("onTree"), u = l.reduce((d, i) => {
    try {
      const c = _g(i);
      c && d.push(c);
    } catch (c) {
      Zh || c.name === "MissingIcon" && console.error(c);
    }
    return d;
  }, []);
  return new Promise((d, i) => {
    Promise.all(u).then((c) => {
      xg(c, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), f(), d();
      });
    }).catch((c) => {
      f(), i(c);
    });
  });
}
function C_(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  _g(e).then((n) => {
    n && xg([n], t);
  });
}
function N_(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Ks(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Ks(a || {})), e(r, W(W({}, n), {}, {
      mask: a
    }));
  };
}
const T_ = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = xt,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: s = null,
    titleId: l = null,
    classes: f = [],
    attributes: u = {},
    styles: d = {}
  } = t;
  if (!e) return;
  const {
    prefix: i,
    iconName: c,
    icon: p
  } = e;
  return Vo(W({
    type: "icon"
  }, e), () => (Mn("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), Z.autoA11y && (s ? u["aria-labelledby"] = "".concat(Z.replacementClass, "-title-").concat(l || la()) : (u["aria-hidden"] = "true", u.focusable = "false")), Oc({
    icons: {
      main: Qs(p),
      mask: a ? Qs(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: i,
    iconName: c,
    transform: W(W({}, xt), n),
    symbol: r,
    title: s,
    maskId: o,
    titleId: l,
    extra: {
      attributes: u,
      styles: d,
      classes: f
    }
  })));
};
var I_ = {
  mixout() {
    return {
      icon: N_(T_)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Gf, e.nodeCallback = C_, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = $e,
        callback: r = () => {
        }
      } = t;
      return Gf(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: s,
        transform: l,
        symbol: f,
        mask: u,
        maskId: d,
        extra: i
      } = n;
      return new Promise((c, p) => {
        Promise.all([Js(r, s), u.iconName ? Js(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((g) => {
          let [m, h] = g;
          c([t, Oc({
            icons: {
              main: m,
              mask: h
            },
            prefix: s,
            iconName: r,
            transform: l,
            symbol: f,
            maskId: d,
            title: a,
            titleId: o,
            extra: i,
            watchable: !0
          })]);
        }).catch(p);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: s
      } = t;
      const l = Fo(s);
      l.length > 0 && (r.style = l);
      let f;
      return _c(o) && (f = bn("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(f || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, $_ = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Vo({
          type: "layer"
        }, () => {
          Mn("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              r = r.concat(o.abstract);
            }) : r = r.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(Z.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, j_ = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return Vo({
          type: "counter",
          content: e
        }, () => (Mn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), d_({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(Z.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, M_ = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = xt,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: s = {}
        } = t;
        return Vo({
          type: "text",
          content: e
        }, () => (Mn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Lf({
          content: e,
          transform: W(W({}, xt), n),
          title: r,
          extra: {
            attributes: o,
            styles: s,
            classes: ["".concat(Z.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: a,
        extra: o
      } = n;
      let s = null, l = null;
      if (Gh) {
        const f = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        s = u.width / f, l = u.height / f;
      }
      return Z.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Lf({
        content: t.innerHTML,
        width: s,
        height: l,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const R_ = new RegExp('"', "ug"), Bf = [1105920, 1112319], qf = W(W(W(W({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), o2), _2), h2), tl = Object.keys(qf).reduce((e, t) => (e[t.toLowerCase()] = qf[t], e), {}), z_ = Object.keys(tl).reduce((e, t) => {
  const n = tl[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function D_(e) {
  const t = e.replace(R_, ""), n = U2(t, 0), r = n >= Bf[0] && n <= Bf[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: sg(a ? t[0] : t),
    isSecondary: r || a
  };
}
function F_(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (tl[n] || {})[a] || z_[n];
}
function Xf(e, t) {
  const n = "".concat(k2).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const o = xr(e.children).filter((i) => i.getAttribute(Us) === t)[0], s = gn.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), f = l.match(P2), u = s.getPropertyValue("font-weight"), d = s.getPropertyValue("content");
    if (o && !f)
      return e.removeChild(o), r();
    if (f && d !== "none" && d !== "") {
      const i = s.getPropertyValue("content");
      let c = F_(l, u);
      const {
        value: p,
        isSecondary: g
      } = D_(i), m = f[0].startsWith("FontAwesome");
      let h = Ac(c, p), b = h;
      if (m) {
        const _ = K2(p);
        _.iconName && _.prefix && (h = _.iconName, c = _.prefix);
      }
      if (h && !g && (!o || o.getAttribute(bc) !== c || o.getAttribute(vc) !== b)) {
        e.setAttribute(n, b), o && e.removeChild(o);
        const _ = S_(), {
          extra: k
        } = _;
        k.attributes[Us] = t, Js(h, c).then((A) => {
          const v = Oc(W(W({}, _), {}, {
            icons: {
              main: A,
              mask: gg()
            },
            prefix: c,
            iconName: b,
            extra: k,
            watchable: !0
          })), H = $e.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(H, e.firstChild) : e.appendChild(H), H.outerHTML = v.map((F) => Oa(F)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function L_(e) {
  return Promise.all([Xf(e, "::before"), Xf(e, "::after")]);
}
function W_(e) {
  return e.parentNode !== document.head && !~O2.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Us) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Kf(e) {
  if (Ht)
    return new Promise((t, n) => {
      const r = xr(e.querySelectorAll("*")).filter(W_).map(L_), a = Sc.begin("searchPseudoElements");
      wg(), Promise.all(r).then(() => {
        a(), el(), t();
      }).catch(() => {
        a(), el(), n();
      });
    });
}
var V_ = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Kf, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = $e
      } = t;
      Z.searchPseudoElements && Kf(n);
    };
  }
};
let Qf = !1;
var Y_ = {
  mixout() {
    return {
      dom: {
        unwatch() {
          wg(), Qf = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Uf(Xs("mutationObserverCallbacks", {}));
      },
      noAuto() {
        __();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Qf ? el() : Uf(Xs("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Jf = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const a = r.toLowerCase().split("-"), o = a[0];
    let s = a.slice(1).join("-");
    if (o && s === "h")
      return n.flipX = !0, n;
    if (o && s === "v")
      return n.flipY = !0, n;
    if (s = parseFloat(s), isNaN(s))
      return n;
    switch (o) {
      case "grow":
        n.size = n.size + s;
        break;
      case "shrink":
        n.size = n.size - s;
        break;
      case "left":
        n.x = n.x - s;
        break;
      case "right":
        n.x = n.x + s;
        break;
      case "up":
        n.y = n.y - s;
        break;
      case "down":
        n.y = n.y + s;
        break;
      case "rotate":
        n.rotate = n.rotate + s;
        break;
    }
    return n;
  }, t);
};
var U_ = {
  mixout() {
    return {
      parse: {
        transform: (e) => Jf(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Jf(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: a,
        iconWidth: o
      } = t;
      const s = {
        transform: "translate(".concat(a / 2, " 256)")
      }, l = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), f = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), u = "rotate(".concat(r.rotate, " 0 0)"), d = {
        transform: "".concat(l, " ").concat(f, " ").concat(u)
      }, i = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, c = {
        outer: s,
        inner: d,
        path: i
      };
      return {
        tag: "g",
        attributes: W({}, c.outer),
        children: [{
          tag: "g",
          attributes: W({}, c.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: W(W({}, n.icon.attributes), c.path)
          }]
        }]
      };
    };
  }
};
const ji = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Zf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function H_(e) {
  return e.tag === "g" ? e.children : [e];
}
var G_ = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Wo(n.split(" ").map((a) => a.trim())) : gg();
        return r.prefix || (r.prefix = yn()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        mask: o,
        maskId: s,
        transform: l
      } = t;
      const {
        width: f,
        icon: u
      } = a, {
        width: d,
        icon: i
      } = o, c = D2({
        transform: l,
        containerWidth: d,
        iconWidth: f
      }), p = {
        tag: "rect",
        attributes: W(W({}, ji), {}, {
          fill: "white"
        })
      }, g = u.children ? {
        children: u.children.map(Zf)
      } : {}, m = {
        tag: "g",
        attributes: W({}, c.inner),
        children: [Zf(W({
          tag: u.tag,
          attributes: W(W({}, u.attributes), c.path)
        }, g))]
      }, h = {
        tag: "g",
        attributes: W({}, c.outer),
        children: [m]
      }, b = "mask-".concat(s || la()), _ = "clip-".concat(s || la()), k = {
        tag: "mask",
        attributes: W(W({}, ji), {}, {
          id: b,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, h]
      }, A = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: _
          },
          children: H_(i)
        }, k]
      };
      return n.push(A, {
        tag: "rect",
        attributes: W({
          fill: "currentColor",
          "clip-path": "url(#".concat(_, ")"),
          mask: "url(#".concat(b, ")")
        }, ji)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, B_ = {
  provides(e) {
    let t = !1;
    gn.matchMedia && (t = gn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: W(W({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = W(W({}, a), {}, {
        attributeName: "opacity"
      }), s = {
        tag: "circle",
        attributes: W(W({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || s.children.push({
        tag: "animate",
        attributes: W(W({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: W(W({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(s), n.push({
        tag: "path",
        attributes: W(W({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: W(W({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: W(W({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: W(W({}, o), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: n
      };
    };
  }
}, q_ = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, X_ = [W2, I_, $_, j_, M_, V_, Y_, U_, G_, B_, q_];
o_(X_, {
  mixoutsTo: Qe
});
Qe.noAuto;
Qe.config;
Qe.library;
Qe.dom;
const nl = Qe.parse;
Qe.findIconDefinition;
Qe.toHtml;
const K_ = Qe.icon;
Qe.layer;
Qe.text;
Qe.counter;
function Q_(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Ya = { exports: {} }, Mi = { exports: {} }, xe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ed;
function J_() {
  if (ed) return xe;
  ed = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
  function k(v) {
    if (typeof v == "object" && v !== null) {
      var H = v.$$typeof;
      switch (H) {
        case t:
          switch (v = v.type, v) {
            case f:
            case u:
            case r:
            case o:
            case a:
            case i:
              return v;
            default:
              switch (v = v && v.$$typeof, v) {
                case l:
                case d:
                case g:
                case p:
                case s:
                  return v;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function A(v) {
    return k(v) === u;
  }
  return xe.AsyncMode = f, xe.ConcurrentMode = u, xe.ContextConsumer = l, xe.ContextProvider = s, xe.Element = t, xe.ForwardRef = d, xe.Fragment = r, xe.Lazy = g, xe.Memo = p, xe.Portal = n, xe.Profiler = o, xe.StrictMode = a, xe.Suspense = i, xe.isAsyncMode = function(v) {
    return A(v) || k(v) === f;
  }, xe.isConcurrentMode = A, xe.isContextConsumer = function(v) {
    return k(v) === l;
  }, xe.isContextProvider = function(v) {
    return k(v) === s;
  }, xe.isElement = function(v) {
    return typeof v == "object" && v !== null && v.$$typeof === t;
  }, xe.isForwardRef = function(v) {
    return k(v) === d;
  }, xe.isFragment = function(v) {
    return k(v) === r;
  }, xe.isLazy = function(v) {
    return k(v) === g;
  }, xe.isMemo = function(v) {
    return k(v) === p;
  }, xe.isPortal = function(v) {
    return k(v) === n;
  }, xe.isProfiler = function(v) {
    return k(v) === o;
  }, xe.isStrictMode = function(v) {
    return k(v) === a;
  }, xe.isSuspense = function(v) {
    return k(v) === i;
  }, xe.isValidElementType = function(v) {
    return typeof v == "string" || typeof v == "function" || v === r || v === u || v === o || v === a || v === i || v === c || typeof v == "object" && v !== null && (v.$$typeof === g || v.$$typeof === p || v.$$typeof === s || v.$$typeof === l || v.$$typeof === d || v.$$typeof === h || v.$$typeof === b || v.$$typeof === _ || v.$$typeof === m);
  }, xe.typeOf = k, xe;
}
var Oe = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var td;
function Z_() {
  return td || (td = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
    function k(w) {
      return typeof w == "string" || typeof w == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      w === r || w === u || w === o || w === a || w === i || w === c || typeof w == "object" && w !== null && (w.$$typeof === g || w.$$typeof === p || w.$$typeof === s || w.$$typeof === l || w.$$typeof === d || w.$$typeof === h || w.$$typeof === b || w.$$typeof === _ || w.$$typeof === m);
    }
    function A(w) {
      if (typeof w == "object" && w !== null) {
        var ce = w.$$typeof;
        switch (ce) {
          case t:
            var Ee = w.type;
            switch (Ee) {
              case f:
              case u:
              case r:
              case o:
              case a:
              case i:
                return Ee;
              default:
                var Ue = Ee && Ee.$$typeof;
                switch (Ue) {
                  case l:
                  case d:
                  case g:
                  case p:
                  case s:
                    return Ue;
                  default:
                    return ce;
                }
            }
          case n:
            return ce;
        }
      }
    }
    var v = f, H = u, F = l, Q = s, B = t, ie = d, ae = r, R = g, le = p, D = n, M = o, z = a, K = i, X = !1;
    function oe(w) {
      return X || (X = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), y(w) || A(w) === f;
    }
    function y(w) {
      return A(w) === u;
    }
    function x(w) {
      return A(w) === l;
    }
    function P(w) {
      return A(w) === s;
    }
    function N(w) {
      return typeof w == "object" && w !== null && w.$$typeof === t;
    }
    function O(w) {
      return A(w) === d;
    }
    function T(w) {
      return A(w) === r;
    }
    function S(w) {
      return A(w) === g;
    }
    function E(w) {
      return A(w) === p;
    }
    function $(w) {
      return A(w) === n;
    }
    function I(w) {
      return A(w) === o;
    }
    function j(w) {
      return A(w) === a;
    }
    function q(w) {
      return A(w) === i;
    }
    Oe.AsyncMode = v, Oe.ConcurrentMode = H, Oe.ContextConsumer = F, Oe.ContextProvider = Q, Oe.Element = B, Oe.ForwardRef = ie, Oe.Fragment = ae, Oe.Lazy = R, Oe.Memo = le, Oe.Portal = D, Oe.Profiler = M, Oe.StrictMode = z, Oe.Suspense = K, Oe.isAsyncMode = oe, Oe.isConcurrentMode = y, Oe.isContextConsumer = x, Oe.isContextProvider = P, Oe.isElement = N, Oe.isForwardRef = O, Oe.isFragment = T, Oe.isLazy = S, Oe.isMemo = E, Oe.isPortal = $, Oe.isProfiler = I, Oe.isStrictMode = j, Oe.isSuspense = q, Oe.isValidElementType = k, Oe.typeOf = A;
  }()), Oe;
}
var nd;
function kg() {
  return nd || (nd = 1, process.env.NODE_ENV === "production" ? Mi.exports = J_() : Mi.exports = Z_()), Mi.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Ri, rd;
function ek() {
  if (rd) return Ri;
  rd = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(o) {
    if (o == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(o);
  }
  function a() {
    try {
      if (!Object.assign)
        return !1;
      var o = new String("abc");
      if (o[5] = "de", Object.getOwnPropertyNames(o)[0] === "5")
        return !1;
      for (var s = {}, l = 0; l < 10; l++)
        s["_" + String.fromCharCode(l)] = l;
      var f = Object.getOwnPropertyNames(s).map(function(d) {
        return s[d];
      });
      if (f.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(d) {
        u[d] = d;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Ri = a() ? Object.assign : function(o, s) {
    for (var l, f = r(o), u, d = 1; d < arguments.length; d++) {
      l = Object(arguments[d]);
      for (var i in l)
        t.call(l, i) && (f[i] = l[i]);
      if (e) {
        u = e(l);
        for (var c = 0; c < u.length; c++)
          n.call(l, u[c]) && (f[u[c]] = l[u[c]]);
      }
    }
    return f;
  }, Ri;
}
var zi, ad;
function Pc() {
  if (ad) return zi;
  ad = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return zi = e, zi;
}
var od, id;
function Ag() {
  return id || (id = 1, od = Function.call.bind(Object.prototype.hasOwnProperty)), od;
}
var Di, sd;
function tk() {
  if (sd) return Di;
  sd = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Pc(), n = {}, r = /* @__PURE__ */ Ag();
    e = function(o) {
      var s = "Warning: " + o;
      typeof console < "u" && console.error(s);
      try {
        throw new Error(s);
      } catch {
      }
    };
  }
  function a(o, s, l, f, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var d in o)
        if (r(o, d)) {
          var i;
          try {
            if (typeof o[d] != "function") {
              var c = Error(
                (f || "React class") + ": " + l + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw c.name = "Invariant Violation", c;
            }
            i = o[d](s, d, f, l, null, t);
          } catch (g) {
            i = g;
          }
          if (i && !(i instanceof Error) && e(
            (f || "React class") + ": type specification of " + l + " `" + d + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof i + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), i instanceof Error && !(i.message in n)) {
            n[i.message] = !0;
            var p = u ? u() : "";
            e(
              "Failed " + l + " type: " + i.message + (p ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Di = a, Di;
}
var Fi, ld;
function nk() {
  if (ld) return Fi;
  ld = 1;
  var e = kg(), t = ek(), n = /* @__PURE__ */ Pc(), r = /* @__PURE__ */ Ag(), a = /* @__PURE__ */ tk(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(l) {
    var f = "Warning: " + l;
    typeof console < "u" && console.error(f);
    try {
      throw new Error(f);
    } catch {
    }
  });
  function s() {
    return null;
  }
  return Fi = function(l, f) {
    var u = typeof Symbol == "function" && Symbol.iterator, d = "@@iterator";
    function i(y) {
      var x = y && (u && y[u] || y[d]);
      if (typeof x == "function")
        return x;
    }
    var c = "<<anonymous>>", p = {
      array: b("array"),
      bigint: b("bigint"),
      bool: b("boolean"),
      func: b("function"),
      number: b("number"),
      object: b("object"),
      string: b("string"),
      symbol: b("symbol"),
      any: _(),
      arrayOf: k,
      element: A(),
      elementType: v(),
      instanceOf: H,
      node: ie(),
      objectOf: Q,
      oneOf: F,
      oneOfType: B,
      shape: R,
      exact: le
    };
    function g(y, x) {
      return y === x ? y !== 0 || 1 / y === 1 / x : y !== y && x !== x;
    }
    function m(y, x) {
      this.message = y, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function h(y) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, P = 0;
      function N(T, S, E, $, I, j, q) {
        if ($ = $ || c, j = j || E, q !== n) {
          if (f) {
            var w = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw w.name = "Invariant Violation", w;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ce = $ + ":" + E;
            !x[ce] && // Avoid spamming the console because they are often not actionable except for lib authors
            P < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + j + "` prop on `" + $ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[ce] = !0, P++);
          }
        }
        return S[E] == null ? T ? S[E] === null ? new m("The " + I + " `" + j + "` is marked as required " + ("in `" + $ + "`, but its value is `null`.")) : new m("The " + I + " `" + j + "` is marked as required in " + ("`" + $ + "`, but its value is `undefined`.")) : null : y(S, E, $, I, j);
      }
      var O = N.bind(null, !1);
      return O.isRequired = N.bind(null, !0), O;
    }
    function b(y) {
      function x(P, N, O, T, S, E) {
        var $ = P[N], I = z($);
        if (I !== y) {
          var j = K($);
          return new m(
            "Invalid " + T + " `" + S + "` of type " + ("`" + j + "` supplied to `" + O + "`, expected ") + ("`" + y + "`."),
            { expectedType: y }
          );
        }
        return null;
      }
      return h(x);
    }
    function _() {
      return h(s);
    }
    function k(y) {
      function x(P, N, O, T, S) {
        if (typeof y != "function")
          return new m("Property `" + S + "` of component `" + O + "` has invalid PropType notation inside arrayOf.");
        var E = P[N];
        if (!Array.isArray(E)) {
          var $ = z(E);
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected an array."));
        }
        for (var I = 0; I < E.length; I++) {
          var j = y(E, I, O, T, S + "[" + I + "]", n);
          if (j instanceof Error)
            return j;
        }
        return null;
      }
      return h(x);
    }
    function A() {
      function y(x, P, N, O, T) {
        var S = x[P];
        if (!l(S)) {
          var E = z(S);
          return new m("Invalid " + O + " `" + T + "` of type " + ("`" + E + "` supplied to `" + N + "`, expected a single ReactElement."));
        }
        return null;
      }
      return h(y);
    }
    function v() {
      function y(x, P, N, O, T) {
        var S = x[P];
        if (!e.isValidElementType(S)) {
          var E = z(S);
          return new m("Invalid " + O + " `" + T + "` of type " + ("`" + E + "` supplied to `" + N + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return h(y);
    }
    function H(y) {
      function x(P, N, O, T, S) {
        if (!(P[N] instanceof y)) {
          var E = y.name || c, $ = oe(P[N]);
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected ") + ("instance of `" + E + "`."));
        }
        return null;
      }
      return h(x);
    }
    function F(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), s;
      function x(P, N, O, T, S) {
        for (var E = P[N], $ = 0; $ < y.length; $++)
          if (g(E, y[$]))
            return null;
        var I = JSON.stringify(y, function(j, q) {
          var w = K(q);
          return w === "symbol" ? String(q) : q;
        });
        return new m("Invalid " + T + " `" + S + "` of value `" + String(E) + "` " + ("supplied to `" + O + "`, expected one of " + I + "."));
      }
      return h(x);
    }
    function Q(y) {
      function x(P, N, O, T, S) {
        if (typeof y != "function")
          return new m("Property `" + S + "` of component `" + O + "` has invalid PropType notation inside objectOf.");
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected an object."));
        for (var I in E)
          if (r(E, I)) {
            var j = y(E, I, O, T, S + "." + I, n);
            if (j instanceof Error)
              return j;
          }
        return null;
      }
      return h(x);
    }
    function B(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), s;
      for (var x = 0; x < y.length; x++) {
        var P = y[x];
        if (typeof P != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + X(P) + " at index " + x + "."
          ), s;
      }
      function N(O, T, S, E, $) {
        for (var I = [], j = 0; j < y.length; j++) {
          var q = y[j], w = q(O, T, S, E, $, n);
          if (w == null)
            return null;
          w.data && r(w.data, "expectedType") && I.push(w.data.expectedType);
        }
        var ce = I.length > 0 ? ", expected one of type [" + I.join(", ") + "]" : "";
        return new m("Invalid " + E + " `" + $ + "` supplied to " + ("`" + S + "`" + ce + "."));
      }
      return h(N);
    }
    function ie() {
      function y(x, P, N, O, T) {
        return D(x[P]) ? null : new m("Invalid " + O + " `" + T + "` supplied to " + ("`" + N + "`, expected a ReactNode."));
      }
      return h(y);
    }
    function ae(y, x, P, N, O) {
      return new m(
        (y || "React class") + ": " + x + " type `" + P + "." + N + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + O + "`."
      );
    }
    function R(y) {
      function x(P, N, O, T, S) {
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type `" + $ + "` " + ("supplied to `" + O + "`, expected `object`."));
        for (var I in y) {
          var j = y[I];
          if (typeof j != "function")
            return ae(O, T, S, I, K(j));
          var q = j(E, I, O, T, S + "." + I, n);
          if (q)
            return q;
        }
        return null;
      }
      return h(x);
    }
    function le(y) {
      function x(P, N, O, T, S) {
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type `" + $ + "` " + ("supplied to `" + O + "`, expected `object`."));
        var I = t({}, P[N], y);
        for (var j in I) {
          var q = y[j];
          if (r(y, j) && typeof q != "function")
            return ae(O, T, S, j, K(q));
          if (!q)
            return new m(
              "Invalid " + T + " `" + S + "` key `" + j + "` supplied to `" + O + "`.\nBad object: " + JSON.stringify(P[N], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(y), null, "  ")
            );
          var w = q(E, j, O, T, S + "." + j, n);
          if (w)
            return w;
        }
        return null;
      }
      return h(x);
    }
    function D(y) {
      switch (typeof y) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !y;
        case "object":
          if (Array.isArray(y))
            return y.every(D);
          if (y === null || l(y))
            return !0;
          var x = i(y);
          if (x) {
            var P = x.call(y), N;
            if (x !== y.entries) {
              for (; !(N = P.next()).done; )
                if (!D(N.value))
                  return !1;
            } else
              for (; !(N = P.next()).done; ) {
                var O = N.value;
                if (O && !D(O[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function M(y, x) {
      return y === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function z(y) {
      var x = typeof y;
      return Array.isArray(y) ? "array" : y instanceof RegExp ? "object" : M(x, y) ? "symbol" : x;
    }
    function K(y) {
      if (typeof y > "u" || y === null)
        return "" + y;
      var x = z(y);
      if (x === "object") {
        if (y instanceof Date)
          return "date";
        if (y instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function X(y) {
      var x = K(y);
      switch (x) {
        case "array":
        case "object":
          return "an " + x;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + x;
        default:
          return x;
      }
    }
    function oe(y) {
      return !y.constructor || !y.constructor.name ? c : y.constructor.name;
    }
    return p.checkPropTypes = a, p.resetWarningCache = a.resetWarningCache, p.PropTypes = p, p;
  }, Fi;
}
var Li, cd;
function rk() {
  if (cd) return Li;
  cd = 1;
  var e = /* @__PURE__ */ Pc();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Li = function() {
    function r(s, l, f, u, d, i) {
      if (i !== e) {
        var c = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw c.name = "Invariant Violation", c;
      }
    }
    r.isRequired = r;
    function a() {
      return r;
    }
    var o = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: a,
      element: r,
      elementType: r,
      instanceOf: a,
      node: r,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, Li;
}
var ud;
function ak() {
  if (ud) return Ya.exports;
  if (ud = 1, process.env.NODE_ENV !== "production") {
    var e = kg(), t = !0;
    Ya.exports = /* @__PURE__ */ nk()(e.isElement, t);
  } else
    Ya.exports = /* @__PURE__ */ rk()();
  return Ya.exports;
}
var ok = /* @__PURE__ */ ak();
const he = /* @__PURE__ */ Q_(ok);
function fd(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function mt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? fd(Object(n), !0).forEach(function(r) {
      Qn(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : fd(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function bo(e) {
  "@babel/helpers - typeof";
  return bo = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, bo(e);
}
function Qn(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function ik(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function sk(e, t) {
  if (e == null) return {};
  var n = ik(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function rl(e) {
  return lk(e) || ck(e) || uk(e) || fk();
}
function lk(e) {
  if (Array.isArray(e)) return al(e);
}
function ck(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function uk(e, t) {
  if (e) {
    if (typeof e == "string") return al(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return al(e, t);
  }
}
function al(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function fk() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function dk(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, s = e.shake, l = e.flash, f = e.spin, u = e.spinPulse, d = e.spinReverse, i = e.pulse, c = e.fixedWidth, p = e.inverse, g = e.border, m = e.listItem, h = e.flip, b = e.size, _ = e.rotation, k = e.pull, A = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": s,
    "fa-flash": l,
    "fa-spin": f,
    "fa-spin-reverse": d,
    "fa-spin-pulse": u,
    "fa-pulse": i,
    "fa-fw": c,
    "fa-inverse": p,
    "fa-border": g,
    "fa-li": m,
    "fa-flip": h === !0,
    "fa-flip-horizontal": h === "horizontal" || h === "both",
    "fa-flip-vertical": h === "vertical" || h === "both"
  }, Qn(t, "fa-".concat(b), typeof b < "u" && b !== null), Qn(t, "fa-rotate-".concat(_), typeof _ < "u" && _ !== null && _ !== 0), Qn(t, "fa-pull-".concat(k), typeof k < "u" && k !== null), Qn(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(A).map(function(v) {
    return A[v] ? v : null;
  }).filter(function(v) {
    return v;
  });
}
function pk(e) {
  return e = e - 0, e === e;
}
function Og(e) {
  return pk(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var mk = ["style"];
function hk(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function gk(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Og(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[hk(a)] = o : t[a] = o, t;
  }, {});
}
function Sg(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(f) {
    return Sg(e, f);
  }), a = Object.keys(t.attributes || {}).reduce(function(f, u) {
    var d = t.attributes[u];
    switch (u) {
      case "class":
        f.attrs.className = d, delete t.attributes.class;
        break;
      case "style":
        f.attrs.style = gk(d);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? f.attrs[u.toLowerCase()] = d : f.attrs[Og(u)] = d;
    }
    return f;
  }, {
    attrs: {}
  }), o = n.style, s = o === void 0 ? {} : o, l = sk(n, mk);
  return a.attrs.style = mt(mt({}, a.attrs.style), s), e.apply(void 0, [t.tag, mt(mt({}, a.attrs), l)].concat(rl(r)));
}
var Eg = !1;
try {
  Eg = process.env.NODE_ENV === "production";
} catch {
}
function yk() {
  if (!Eg && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function dd(e) {
  if (e && bo(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (nl.icon)
    return nl.icon(e);
  if (e === null)
    return null;
  if (e && bo(e) === "object" && e.prefix && e.iconName)
    return e;
  if (Array.isArray(e) && e.length === 2)
    return {
      prefix: e[0],
      iconName: e[1]
    };
  if (typeof e == "string")
    return {
      prefix: "fas",
      iconName: e
    };
}
function Wi(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Qn({}, e, t) : {};
}
var pd = {
  border: !1,
  className: "",
  mask: null,
  maskId: null,
  fixedWidth: !1,
  inverse: !1,
  flip: !1,
  icon: null,
  listItem: !1,
  pull: null,
  pulse: !1,
  rotation: null,
  size: null,
  spin: !1,
  spinPulse: !1,
  spinReverse: !1,
  beat: !1,
  fade: !1,
  beatFade: !1,
  bounce: !1,
  shake: !1,
  symbol: !1,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: !1
}, Cc = /* @__PURE__ */ On.forwardRef(function(e, t) {
  var n = mt(mt({}, pd), e), r = n.icon, a = n.mask, o = n.symbol, s = n.className, l = n.title, f = n.titleId, u = n.maskId, d = dd(r), i = Wi("classes", [].concat(rl(dk(n)), rl((s || "").split(" ")))), c = Wi("transform", typeof n.transform == "string" ? nl.transform(n.transform) : n.transform), p = Wi("mask", dd(a)), g = K_(d, mt(mt(mt(mt({}, i), c), p), {}, {
    symbol: o,
    title: l,
    titleId: f,
    maskId: u
  }));
  if (!g)
    return yk("Could not find icon", d), null;
  var m = g.abstract, h = {
    ref: t
  };
  return Object.keys(n).forEach(function(b) {
    pd.hasOwnProperty(b) || (h[b] = n[b]);
  }), bk(m[0], h);
});
Cc.displayName = "FontAwesomeIcon";
Cc.propTypes = {
  beat: he.bool,
  border: he.bool,
  beatFade: he.bool,
  bounce: he.bool,
  className: he.string,
  fade: he.bool,
  flash: he.bool,
  mask: he.oneOfType([he.object, he.array, he.string]),
  maskId: he.string,
  fixedWidth: he.bool,
  inverse: he.bool,
  flip: he.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: he.oneOfType([he.object, he.array, he.string]),
  listItem: he.bool,
  pull: he.oneOf(["right", "left"]),
  pulse: he.bool,
  rotation: he.oneOf([0, 90, 180, 270]),
  shake: he.bool,
  size: he.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: he.bool,
  spinPulse: he.bool,
  spinReverse: he.bool,
  symbol: he.oneOfType([he.bool, he.string]),
  title: he.string,
  titleId: he.string,
  transform: he.oneOfType([he.string, he.object]),
  swapOpacity: he.bool
};
var bk = Sg.bind(null, On.createElement);
const Nc = "-", vk = (e) => {
  const t = wk(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(Nc);
      return o[0] === "" && o.length !== 1 && o.shift(), Pg(o, t) || xk(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const s = n[a] || [];
      return o && r[a] ? [...s, ...r[a]] : s;
    }
  };
}, Pg = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], a = t.nextPart.get(r), o = a ? Pg(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const s = e.join(Nc);
  return (n = t.validators.find(({
    validator: l
  }) => l(s))) == null ? void 0 : n.classGroupId;
}, md = /^\[(.+)\]$/, xk = (e) => {
  if (md.test(e)) {
    const t = md.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, wk = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return kk(Object.entries(e.classGroups), n).forEach(([a, o]) => {
    ol(o, r, a, t);
  }), r;
}, ol = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : hd(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (_k(a)) {
        ol(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, s]) => {
      ol(s, hd(t, o), n, r);
    });
  });
}, hd = (e, t) => {
  let n = e;
  return t.split(Nc).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, _k = (e) => e.isThemeGetter, kk = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([s, l]) => [t + s, l])) : o);
  return [n, a];
}) : e, Ak = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const a = (o, s) => {
    n.set(o, s), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let s = n.get(o);
      if (s !== void 0)
        return s;
      if ((s = r.get(o)) !== void 0)
        return a(o, s), s;
    },
    set(o, s) {
      n.has(o) ? n.set(o, s) : a(o, s);
    }
  };
}, Cg = "!", Ok = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, s = (l) => {
    const f = [];
    let u = 0, d = 0, i;
    for (let h = 0; h < l.length; h++) {
      let b = l[h];
      if (u === 0) {
        if (b === a && (r || l.slice(h, h + o) === t)) {
          f.push(l.slice(d, h)), d = h + o;
          continue;
        }
        if (b === "/") {
          i = h;
          continue;
        }
      }
      b === "[" ? u++ : b === "]" && u--;
    }
    const c = f.length === 0 ? l : l.substring(d), p = c.startsWith(Cg), g = p ? c.substring(1) : c, m = i && i > d ? i - d : void 0;
    return {
      modifiers: f,
      hasImportantModifier: p,
      baseClassName: g,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (l) => n({
    className: l,
    parseClassName: s
  }) : s;
}, Sk = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, Ek = (e) => ({
  cache: Ak(e.cacheSize),
  parseClassName: Ok(e),
  ...vk(e)
}), Pk = /\s+/, Ck = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], s = e.trim().split(Pk);
  let l = "";
  for (let f = s.length - 1; f >= 0; f -= 1) {
    const u = s[f], {
      modifiers: d,
      hasImportantModifier: i,
      baseClassName: c,
      maybePostfixModifierPosition: p
    } = n(u);
    let g = !!p, m = r(g ? c.substring(0, p) : c);
    if (!m) {
      if (!g) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      if (m = r(c), !m) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      g = !1;
    }
    const h = Sk(d).join(":"), b = i ? h + Cg : h, _ = b + m;
    if (o.includes(_))
      continue;
    o.push(_);
    const k = a(m, g);
    for (let A = 0; A < k.length; ++A) {
      const v = k[A];
      o.push(b + v);
    }
    l = u + (l.length > 0 ? " " + l : l);
  }
  return l;
};
function Nk() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Ng(t)) && (r && (r += " "), r += n);
  return r;
}
const Ng = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Ng(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Tk(e, ...t) {
  let n, r, a, o = s;
  function s(f) {
    const u = t.reduce((d, i) => i(d), e());
    return n = Ek(u), r = n.cache.get, a = n.cache.set, o = l, l(f);
  }
  function l(f) {
    const u = r(f);
    if (u)
      return u;
    const d = Ck(f, n);
    return a(f, d), d;
  }
  return function() {
    return o(Nk.apply(null, arguments));
  };
}
const Ne = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Tg = /^\[(?:([a-z-]+):)?(.+)\]$/i, Ik = /^\d+\/\d+$/, $k = /* @__PURE__ */ new Set(["px", "full", "screen"]), jk = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Mk = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Rk = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, zk = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Dk = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ct = (e) => sr(e) || $k.has(e) || Ik.test(e), Jt = (e) => wr(e, "length", Gk), sr = (e) => !!e && !Number.isNaN(Number(e)), Vi = (e) => wr(e, "number", sr), Pr = (e) => !!e && Number.isInteger(Number(e)), Fk = (e) => e.endsWith("%") && sr(e.slice(0, -1)), fe = (e) => Tg.test(e), Zt = (e) => jk.test(e), Lk = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Wk = (e) => wr(e, Lk, Ig), Vk = (e) => wr(e, "position", Ig), Yk = /* @__PURE__ */ new Set(["image", "url"]), Uk = (e) => wr(e, Yk, qk), Hk = (e) => wr(e, "", Bk), Cr = () => !0, wr = (e, t, n) => {
  const r = Tg.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Gk = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Mk.test(e) && !Rk.test(e)
), Ig = () => !1, Bk = (e) => zk.test(e), qk = (e) => Dk.test(e), Xk = () => {
  const e = Ne("colors"), t = Ne("spacing"), n = Ne("blur"), r = Ne("brightness"), a = Ne("borderColor"), o = Ne("borderRadius"), s = Ne("borderSpacing"), l = Ne("borderWidth"), f = Ne("contrast"), u = Ne("grayscale"), d = Ne("hueRotate"), i = Ne("invert"), c = Ne("gap"), p = Ne("gradientColorStops"), g = Ne("gradientColorStopPositions"), m = Ne("inset"), h = Ne("margin"), b = Ne("opacity"), _ = Ne("padding"), k = Ne("saturate"), A = Ne("scale"), v = Ne("sepia"), H = Ne("skew"), F = Ne("space"), Q = Ne("translate"), B = () => ["auto", "contain", "none"], ie = () => ["auto", "hidden", "clip", "visible", "scroll"], ae = () => ["auto", fe, t], R = () => [fe, t], le = () => ["", Ct, Jt], D = () => ["auto", sr, fe], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], z = () => ["solid", "dashed", "dotted", "double", "none"], K = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], X = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], oe = () => ["", "0", fe], y = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [sr, fe];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Cr],
      spacing: [Ct, Jt],
      blur: ["none", "", Zt, fe],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Zt, fe],
      borderSpacing: R(),
      borderWidth: le(),
      contrast: x(),
      grayscale: oe(),
      hueRotate: x(),
      invert: oe(),
      gap: R(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Fk, Jt],
      inset: ae(),
      margin: ae(),
      opacity: x(),
      padding: R(),
      saturate: x(),
      scale: x(),
      sepia: oe(),
      skew: x(),
      space: R(),
      translate: R()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", fe]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [Zt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": y()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": y()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...M(), fe]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ie()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ie()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ie()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: B()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": B()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": B()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [m]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [m]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [m]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [m]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [m]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [m]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [m]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [m]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [m]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", Pr, fe]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ae()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", fe]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: oe()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: oe()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Pr, fe]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Cr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Pr, fe]
        }, fe]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Cr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Pr, fe]
        }, fe]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", fe]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", fe]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [c]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [c]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [c]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...X()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...X(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...X(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [_]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [_]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [_]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [_]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [_]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [_]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [_]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [_]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [_]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [h]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [h]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [h]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [h]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [h]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [h]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [h]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [h]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [h]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [F]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [F]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", fe, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [fe, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [fe, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Zt]
        }, Zt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [fe, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [fe, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [fe, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [fe, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Zt, Jt]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Vi]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Cr]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", fe]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", sr, Vi]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ct, fe]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", fe]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", fe]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [b]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [b]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...z(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ct, Jt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ct, fe]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: R()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", fe]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", fe]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [b]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...M(), Vk]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", Wk]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Uk]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [g]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [g]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [g]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [p]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [p]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [o]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [o]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [o]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [o]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [o]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [o]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [o]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [o]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [o]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [o]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [o]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [o]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [o]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [o]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [o]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [l]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [l]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [l]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [l]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [l]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [l]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [l]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [l]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [l]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [b]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...z(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [l]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [l]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [b]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: z()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [a]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [a]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [a]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [a]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [a]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [a]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [a]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [a]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [a]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [a]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...z()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ct, fe]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ct, Jt]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: le()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [b]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Ct, Jt]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", Zt, Hk]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Cr]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [b]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...K(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": K()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [n]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [f]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Zt, fe]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [u]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [d]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [i]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [k]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [v]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [n]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [f]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [d]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [i]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [b]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [k]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [v]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [s]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [s]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [s]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", fe]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: x()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", fe]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: x()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", fe]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [A]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [A]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [A]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Pr, fe]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Q]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Q]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [H]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [H]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", fe]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", fe]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": R()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": R()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": R()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": R()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": R()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": R()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": R()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": R()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": R()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": R()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": R()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": R()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": R()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": R()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": R()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": R()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": R()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": R()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", fe]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [Ct, Jt, Vi]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, Kk = /* @__PURE__ */ Tk(Xk), Qk = ({
  onClick: e,
  className: t,
  size: n = "md"
}) => /* @__PURE__ */ G(
  "button",
  {
    onClick: e,
    className: Kk(
      "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
      {
        sm: "h-5 w-5 text-sm",
        md: "h-7 w-7 text-md",
        lg: "h-9 w-9 text-xl"
      }[n],
      t
    ),
    children: /* @__PURE__ */ G(Cc, { icon: Xw })
  }
);
var Tc = Ea(), se = (e) => Sa(e, Tc), Ic = Ea();
se.write = (e) => Sa(e, Ic);
var Yo = Ea();
se.onStart = (e) => Sa(e, Yo);
var $c = Ea();
se.onFrame = (e) => Sa(e, $c);
var jc = Ea();
se.onFinish = (e) => Sa(e, jc);
var lr = [];
se.setTimeout = (e, t) => {
  const n = se.now() + t, r = () => {
    const o = lr.findIndex((s) => s.cancel == r);
    ~o && lr.splice(o, 1), un -= ~o ? 1 : 0;
  }, a = { time: n, handler: e, cancel: r };
  return lr.splice($g(n), 0, a), un += 1, jg(), a;
};
var $g = (e) => ~(~lr.findIndex((t) => t.time > e) || ~lr.length);
se.cancel = (e) => {
  Yo.delete(e), $c.delete(e), jc.delete(e), Tc.delete(e), Ic.delete(e);
};
se.sync = (e) => {
  il = !0, se.batchedUpdates(e), il = !1;
};
se.throttle = (e) => {
  let t;
  function n() {
    try {
      e(...t);
    } finally {
      t = null;
    }
  }
  function r(...a) {
    t = a, se.onStart(n);
  }
  return r.handler = e, r.cancel = () => {
    Yo.delete(n), t = null;
  }, r;
};
var Mc = typeof window < "u" ? window.requestAnimationFrame : (
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  () => {
  }
);
se.use = (e) => Mc = e;
se.now = typeof performance < "u" ? () => performance.now() : Date.now;
se.batchedUpdates = (e) => e();
se.catch = console.error;
se.frameLoop = "always";
se.advance = () => {
  se.frameLoop !== "demand" ? console.warn(
    "Cannot call the manual advancement of rafz whilst frameLoop is not set as demand"
  ) : Rg();
};
var cn = -1, un = 0, il = !1;
function Sa(e, t) {
  il ? (t.delete(e), e(0)) : (t.add(e), jg());
}
function jg() {
  cn < 0 && (cn = 0, se.frameLoop !== "demand" && Mc(Mg));
}
function Jk() {
  cn = -1;
}
function Mg() {
  ~cn && (Mc(Mg), se.batchedUpdates(Rg));
}
function Rg() {
  const e = cn;
  cn = se.now();
  const t = $g(cn);
  if (t && (zg(lr.splice(0, t), (n) => n.handler()), un -= t), !un) {
    Jk();
    return;
  }
  Yo.flush(), Tc.flush(e ? Math.min(64, cn - e) : 16.667), $c.flush(), Ic.flush(), jc.flush();
}
function Ea() {
  let e = /* @__PURE__ */ new Set(), t = e;
  return {
    add(n) {
      un += t == e && !e.has(n) ? 1 : 0, e.add(n);
    },
    delete(n) {
      return un -= t == e && e.has(n) ? 1 : 0, e.delete(n);
    },
    flush(n) {
      t.size && (e = /* @__PURE__ */ new Set(), un -= t.size, zg(t, (r) => r(n) && e.add(r)), un += e.size, t = e);
    }
  };
}
function zg(e, t) {
  e.forEach((n) => {
    try {
      t(n);
    } catch (r) {
      se.catch(r);
    }
  });
}
var Zk = Object.defineProperty, eA = (e, t) => {
  for (var n in t)
    Zk(e, n, { get: t[n], enumerable: !0 });
}, lt = {};
eA(lt, {
  assign: () => nA,
  colors: () => dn,
  createStringInterpolator: () => zc,
  skipAnimation: () => Fg,
  to: () => Dg,
  willAdvance: () => Dc
});
function sl() {
}
var tA = (e, t, n) => Object.defineProperty(e, t, { value: n, writable: !0, configurable: !0 }), U = {
  arr: Array.isArray,
  obj: (e) => !!e && e.constructor.name === "Object",
  fun: (e) => typeof e == "function",
  str: (e) => typeof e == "string",
  num: (e) => typeof e == "number",
  und: (e) => e === void 0
};
function $t(e, t) {
  if (U.arr(e)) {
    if (!U.arr(t) || e.length !== t.length) return !1;
    for (let n = 0; n < e.length; n++)
      if (e[n] !== t[n]) return !1;
    return !0;
  }
  return e === t;
}
var pe = (e, t) => e.forEach(t);
function St(e, t, n) {
  if (U.arr(e)) {
    for (let r = 0; r < e.length; r++)
      t.call(n, e[r], `${r}`);
    return;
  }
  for (const r in e)
    e.hasOwnProperty(r) && t.call(n, e[r], r);
}
var Ge = (e) => U.und(e) ? [] : U.arr(e) ? e : [e];
function qr(e, t) {
  if (e.size) {
    const n = Array.from(e);
    e.clear(), pe(n, t);
  }
}
var Fr = (e, ...t) => qr(e, (n) => n(...t)), Rc = () => typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), zc, Dg, dn = null, Fg = !1, Dc = sl, nA = (e) => {
  e.to && (Dg = e.to), e.now && (se.now = e.now), e.colors !== void 0 && (dn = e.colors), e.skipAnimation != null && (Fg = e.skipAnimation), e.createStringInterpolator && (zc = e.createStringInterpolator), e.requestAnimationFrame && se.use(e.requestAnimationFrame), e.batchedUpdates && (se.batchedUpdates = e.batchedUpdates), e.willAdvance && (Dc = e.willAdvance), e.frameLoop && (se.frameLoop = e.frameLoop);
}, Xr = /* @__PURE__ */ new Set(), ot = [], Yi = [], vo = 0, Uo = {
  get idle() {
    return !Xr.size && !ot.length;
  },
  /** Advance the given animation on every frame until idle. */
  start(e) {
    vo > e.priority ? (Xr.add(e), se.onStart(rA)) : (Lg(e), se(ll));
  },
  /** Advance all animations by the given time. */
  advance: ll,
  /** Call this when an animation's priority changes. */
  sort(e) {
    if (vo)
      se.onFrame(() => Uo.sort(e));
    else {
      const t = ot.indexOf(e);
      ~t && (ot.splice(t, 1), Wg(e));
    }
  },
  /**
   * Clear all animations. For testing purposes.
   *
   * ☠️ Never call this from within the frameloop.
   */
  clear() {
    ot = [], Xr.clear();
  }
};
function rA() {
  Xr.forEach(Lg), Xr.clear(), se(ll);
}
function Lg(e) {
  ot.includes(e) || Wg(e);
}
function Wg(e) {
  ot.splice(
    aA(ot, (t) => t.priority > e.priority),
    0,
    e
  );
}
function ll(e) {
  const t = Yi;
  for (let n = 0; n < ot.length; n++) {
    const r = ot[n];
    vo = r.priority, r.idle || (Dc(r), r.advance(e), r.idle || t.push(r));
  }
  return vo = 0, Yi = ot, Yi.length = 0, ot = t, ot.length > 0;
}
function aA(e, t) {
  const n = e.findIndex(t);
  return n < 0 ? e.length : n;
}
var oA = {
  transparent: 0,
  aliceblue: 4042850303,
  antiquewhite: 4209760255,
  aqua: 16777215,
  aquamarine: 2147472639,
  azure: 4043309055,
  beige: 4126530815,
  bisque: 4293182719,
  black: 255,
  blanchedalmond: 4293643775,
  blue: 65535,
  blueviolet: 2318131967,
  brown: 2771004159,
  burlywood: 3736635391,
  burntsienna: 3934150143,
  cadetblue: 1604231423,
  chartreuse: 2147418367,
  chocolate: 3530104575,
  coral: 4286533887,
  cornflowerblue: 1687547391,
  cornsilk: 4294499583,
  crimson: 3692313855,
  cyan: 16777215,
  darkblue: 35839,
  darkcyan: 9145343,
  darkgoldenrod: 3095792639,
  darkgray: 2846468607,
  darkgreen: 6553855,
  darkgrey: 2846468607,
  darkkhaki: 3182914559,
  darkmagenta: 2332068863,
  darkolivegreen: 1433087999,
  darkorange: 4287365375,
  darkorchid: 2570243327,
  darkred: 2332033279,
  darksalmon: 3918953215,
  darkseagreen: 2411499519,
  darkslateblue: 1211993087,
  darkslategray: 793726975,
  darkslategrey: 793726975,
  darkturquoise: 13554175,
  darkviolet: 2483082239,
  deeppink: 4279538687,
  deepskyblue: 12582911,
  dimgray: 1768516095,
  dimgrey: 1768516095,
  dodgerblue: 512819199,
  firebrick: 2988581631,
  floralwhite: 4294635775,
  forestgreen: 579543807,
  fuchsia: 4278255615,
  gainsboro: 3705462015,
  ghostwhite: 4177068031,
  gold: 4292280575,
  goldenrod: 3668254975,
  gray: 2155905279,
  green: 8388863,
  greenyellow: 2919182335,
  grey: 2155905279,
  honeydew: 4043305215,
  hotpink: 4285117695,
  indianred: 3445382399,
  indigo: 1258324735,
  ivory: 4294963455,
  khaki: 4041641215,
  lavender: 3873897215,
  lavenderblush: 4293981695,
  lawngreen: 2096890111,
  lemonchiffon: 4294626815,
  lightblue: 2916673279,
  lightcoral: 4034953471,
  lightcyan: 3774873599,
  lightgoldenrodyellow: 4210742015,
  lightgray: 3553874943,
  lightgreen: 2431553791,
  lightgrey: 3553874943,
  lightpink: 4290167295,
  lightsalmon: 4288707327,
  lightseagreen: 548580095,
  lightskyblue: 2278488831,
  lightslategray: 2005441023,
  lightslategrey: 2005441023,
  lightsteelblue: 2965692159,
  lightyellow: 4294959359,
  lime: 16711935,
  limegreen: 852308735,
  linen: 4210091775,
  magenta: 4278255615,
  maroon: 2147483903,
  mediumaquamarine: 1724754687,
  mediumblue: 52735,
  mediumorchid: 3126187007,
  mediumpurple: 2473647103,
  mediumseagreen: 1018393087,
  mediumslateblue: 2070474495,
  mediumspringgreen: 16423679,
  mediumturquoise: 1221709055,
  mediumvioletred: 3340076543,
  midnightblue: 421097727,
  mintcream: 4127193855,
  mistyrose: 4293190143,
  moccasin: 4293178879,
  navajowhite: 4292783615,
  navy: 33023,
  oldlace: 4260751103,
  olive: 2155872511,
  olivedrab: 1804477439,
  orange: 4289003775,
  orangered: 4282712319,
  orchid: 3664828159,
  palegoldenrod: 4008225535,
  palegreen: 2566625535,
  paleturquoise: 2951671551,
  palevioletred: 3681588223,
  papayawhip: 4293907967,
  peachpuff: 4292524543,
  peru: 3448061951,
  pink: 4290825215,
  plum: 3718307327,
  powderblue: 2967529215,
  purple: 2147516671,
  rebeccapurple: 1714657791,
  red: 4278190335,
  rosybrown: 3163525119,
  royalblue: 1097458175,
  saddlebrown: 2336560127,
  salmon: 4202722047,
  sandybrown: 4104413439,
  seagreen: 780883967,
  seashell: 4294307583,
  sienna: 2689740287,
  silver: 3233857791,
  skyblue: 2278484991,
  slateblue: 1784335871,
  slategray: 1887473919,
  slategrey: 1887473919,
  snow: 4294638335,
  springgreen: 16744447,
  steelblue: 1182971135,
  tan: 3535047935,
  teal: 8421631,
  thistle: 3636451583,
  tomato: 4284696575,
  turquoise: 1088475391,
  violet: 4001558271,
  wheat: 4125012991,
  white: 4294967295,
  whitesmoke: 4126537215,
  yellow: 4294902015,
  yellowgreen: 2597139199
}, st = "[-+]?\\d*\\.?\\d+", xo = st + "%";
function Ho(...e) {
  return "\\(\\s*(" + e.join(")\\s*,\\s*(") + ")\\s*\\)";
}
var iA = new RegExp("rgb" + Ho(st, st, st)), sA = new RegExp("rgba" + Ho(st, st, st, st)), lA = new RegExp("hsl" + Ho(st, xo, xo)), cA = new RegExp(
  "hsla" + Ho(st, xo, xo, st)
), uA = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, fA = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, dA = /^#([0-9a-fA-F]{6})$/, pA = /^#([0-9a-fA-F]{8})$/;
function mA(e) {
  let t;
  return typeof e == "number" ? e >>> 0 === e && e >= 0 && e <= 4294967295 ? e : null : (t = dA.exec(e)) ? parseInt(t[1] + "ff", 16) >>> 0 : dn && dn[e] !== void 0 ? dn[e] : (t = iA.exec(e)) ? (Gn(t[1]) << 24 | // r
  Gn(t[2]) << 16 | // g
  Gn(t[3]) << 8 | // b
  255) >>> // a
  0 : (t = sA.exec(e)) ? (Gn(t[1]) << 24 | // r
  Gn(t[2]) << 16 | // g
  Gn(t[3]) << 8 | // b
  bd(t[4])) >>> // a
  0 : (t = uA.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    "ff",
    // a
    16
  ) >>> 0 : (t = pA.exec(e)) ? parseInt(t[1], 16) >>> 0 : (t = fA.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    t[4] + t[4],
    // a
    16
  ) >>> 0 : (t = lA.exec(e)) ? (gd(
    yd(t[1]),
    // h
    Ua(t[2]),
    // s
    Ua(t[3])
    // l
  ) | 255) >>> // a
  0 : (t = cA.exec(e)) ? (gd(
    yd(t[1]),
    // h
    Ua(t[2]),
    // s
    Ua(t[3])
    // l
  ) | bd(t[4])) >>> // a
  0 : null;
}
function Ui(e, t, n) {
  return n < 0 && (n += 1), n > 1 && (n -= 1), n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function gd(e, t, n) {
  const r = n < 0.5 ? n * (1 + t) : n + t - n * t, a = 2 * n - r, o = Ui(a, r, e + 1 / 3), s = Ui(a, r, e), l = Ui(a, r, e - 1 / 3);
  return Math.round(o * 255) << 24 | Math.round(s * 255) << 16 | Math.round(l * 255) << 8;
}
function Gn(e) {
  const t = parseInt(e, 10);
  return t < 0 ? 0 : t > 255 ? 255 : t;
}
function yd(e) {
  return (parseFloat(e) % 360 + 360) % 360 / 360;
}
function bd(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 1 ? 255 : Math.round(t * 255);
}
function Ua(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 100 ? 1 : t / 100;
}
function vd(e) {
  let t = mA(e);
  if (t === null) return e;
  t = t || 0;
  const n = (t & 4278190080) >>> 24, r = (t & 16711680) >>> 16, a = (t & 65280) >>> 8, o = (t & 255) / 255;
  return `rgba(${n}, ${r}, ${a}, ${o})`;
}
var ua = (e, t, n) => {
  if (U.fun(e))
    return e;
  if (U.arr(e))
    return ua({
      range: e,
      output: t,
      extrapolate: n
    });
  if (U.str(e.output[0]))
    return zc(e);
  const r = e, a = r.output, o = r.range || [0, 1], s = r.extrapolateLeft || r.extrapolate || "extend", l = r.extrapolateRight || r.extrapolate || "extend", f = r.easing || ((u) => u);
  return (u) => {
    const d = gA(u, o);
    return hA(
      u,
      o[d],
      o[d + 1],
      a[d],
      a[d + 1],
      f,
      s,
      l,
      r.map
    );
  };
};
function hA(e, t, n, r, a, o, s, l, f) {
  let u = f ? f(e) : e;
  if (u < t) {
    if (s === "identity") return u;
    s === "clamp" && (u = t);
  }
  if (u > n) {
    if (l === "identity") return u;
    l === "clamp" && (u = n);
  }
  return r === a ? r : t === n ? e <= t ? r : a : (t === -1 / 0 ? u = -u : n === 1 / 0 ? u = u - t : u = (u - t) / (n - t), u = o(u), r === -1 / 0 ? u = -u : a === 1 / 0 ? u = u + r : u = u * (a - r) + r, u);
}
function gA(e, t) {
  for (var n = 1; n < t.length - 1 && !(t[n] >= e); ++n)
    ;
  return n - 1;
}
var yA = {
  linear: (e) => e
}, fa = Symbol.for("FluidValue.get"), hr = Symbol.for("FluidValue.observers"), at = (e) => !!(e && e[fa]), qe = (e) => e && e[fa] ? e[fa]() : e, xd = (e) => e[hr] || null;
function bA(e, t) {
  e.eventObserved ? e.eventObserved(t) : e(t);
}
function da(e, t) {
  const n = e[hr];
  n && n.forEach((r) => {
    bA(r, t);
  });
}
var Vg = class {
  constructor(e) {
    if (!e && !(e = this.get))
      throw Error("Unknown getter");
    vA(this, e);
  }
}, vA = (e, t) => Yg(e, fa, t);
function _r(e, t) {
  if (e[fa]) {
    let n = e[hr];
    n || Yg(e, hr, n = /* @__PURE__ */ new Set()), n.has(t) || (n.add(t), e.observerAdded && e.observerAdded(n.size, t));
  }
  return t;
}
function pa(e, t) {
  const n = e[hr];
  if (n && n.has(t)) {
    const r = n.size - 1;
    r ? n.delete(t) : e[hr] = null, e.observerRemoved && e.observerRemoved(r, t);
  }
}
var Yg = (e, t, n) => Object.defineProperty(e, t, {
  value: n,
  writable: !0,
  configurable: !0
}), ao = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, xA = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi, wd = new RegExp(`(${ao.source})(%|[a-z]+)`, "i"), wA = /rgba\(([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+)\)/gi, Go = /var\((--[a-zA-Z0-9-_]+),? ?([a-zA-Z0-9 ()%#.,-]+)?\)/, Ug = (e) => {
  const [t, n] = _A(e);
  if (!t || Rc())
    return e;
  const r = window.getComputedStyle(document.documentElement).getPropertyValue(t);
  return r ? r.trim() : n && n.startsWith("--") ? window.getComputedStyle(document.documentElement).getPropertyValue(n) || e : n && Go.test(n) ? Ug(n) : n || e;
}, _A = (e) => {
  const t = Go.exec(e);
  if (!t) return [,];
  const [, n, r] = t;
  return [n, r];
}, Hi, kA = (e, t, n, r, a) => `rgba(${Math.round(t)}, ${Math.round(n)}, ${Math.round(r)}, ${a})`, Hg = (e) => {
  Hi || (Hi = dn ? (
    // match color names, ignore partial matches
    new RegExp(`(${Object.keys(dn).join("|")})(?!\\w)`, "g")
  ) : (
    // never match
    /^\b$/
  ));
  const t = e.output.map((a) => qe(a).replace(Go, Ug).replace(xA, vd).replace(Hi, vd)), n = t.map((a) => a.match(ao).map(Number)), r = n[0].map(
    (a, o) => n.map((s) => {
      if (!(o in s))
        throw Error('The arity of each "output" value must be equal');
      return s[o];
    })
  ).map(
    (a) => ua({ ...e, output: a })
  );
  return (a) => {
    var o;
    const s = !wd.test(t[0]) && ((o = t.find((f) => wd.test(f))) == null ? void 0 : o.replace(ao, ""));
    let l = 0;
    return t[0].replace(
      ao,
      () => `${r[l++](a)}${s || ""}`
    ).replace(wA, kA);
  };
}, Fc = "react-spring: ", Gg = (e) => {
  const t = e;
  let n = !1;
  if (typeof t != "function")
    throw new TypeError(`${Fc}once requires a function parameter`);
  return (...r) => {
    n || (t(...r), n = !0);
  };
}, AA = Gg(console.warn);
function OA() {
  AA(
    `${Fc}The "interpolate" function is deprecated in v9 (use "to" instead)`
  );
}
var SA = Gg(console.warn);
function EA() {
  SA(
    `${Fc}Directly calling start instead of using the api object is deprecated in v9 (use ".start" instead), this will be removed in later 0.X.0 versions`
  );
}
function Bo(e) {
  return U.str(e) && (e[0] == "#" || /\d/.test(e) || // Do not identify a CSS variable as an AnimatedString if its SSR
  !Rc() && Go.test(e) || e in (dn || {}));
}
var Jn = Rc() ? Fe : ov, PA = () => {
  const e = De(!1);
  return Jn(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
};
function Bg() {
  const e = dt()[1], t = PA();
  return () => {
    t.current && e(Math.random());
  };
}
var qg = (e) => Fe(e, CA), CA = [];
function NA(e) {
  const t = De(void 0);
  return Fe(() => {
    t.current = e;
  }), t.current;
}
var ma = Symbol.for("Animated:node"), TA = (e) => !!e && e[ma] === e, ut = (e) => e && e[ma], Lc = (e, t) => tA(e, ma, t), qo = (e) => e && e[ma] && e[ma].getPayload(), Xg = class {
  constructor() {
    Lc(this, this);
  }
  /** Get every `AnimatedValue` used by this node. */
  getPayload() {
    return this.payload || [];
  }
}, Xo = class Kg extends Xg {
  constructor(t) {
    super(), this._value = t, this.done = !0, this.durationProgress = 0, U.num(this._value) && (this.lastPosition = this._value);
  }
  /** @internal */
  static create(t) {
    return new Kg(t);
  }
  getPayload() {
    return [this];
  }
  getValue() {
    return this._value;
  }
  setValue(t, n) {
    return U.num(t) && (this.lastPosition = t, n && (t = Math.round(t / n) * n, this.done && (this.lastPosition = t))), this._value === t ? !1 : (this._value = t, !0);
  }
  reset() {
    const { done: t } = this;
    this.done = !1, U.num(this._value) && (this.elapsedTime = 0, this.durationProgress = 0, this.lastPosition = this._value, t && (this.lastVelocity = null), this.v0 = null);
  }
}, wo = class Qg extends Xo {
  constructor(t) {
    super(0), this._string = null, this._toString = ua({
      output: [t, t]
    });
  }
  /** @internal */
  static create(t) {
    return new Qg(t);
  }
  getValue() {
    return this._string ?? (this._string = this._toString(this._value));
  }
  setValue(t) {
    if (U.str(t)) {
      if (t == this._string)
        return !1;
      this._string = t, this._value = 1;
    } else if (super.setValue(t))
      this._string = null;
    else
      return !1;
    return !0;
  }
  reset(t) {
    t && (this._toString = ua({
      output: [this.getValue(), t]
    })), this._value = 0, super.reset();
  }
}, _o = { dependencies: null }, Ko = class extends Xg {
  constructor(t) {
    super(), this.source = t, this.setValue(t);
  }
  getValue(t) {
    const n = {};
    return St(this.source, (r, a) => {
      TA(r) ? n[a] = r.getValue(t) : at(r) ? n[a] = qe(r) : t || (n[a] = r);
    }), n;
  }
  /** Replace the raw object data */
  setValue(t) {
    this.source = t, this.payload = this._makePayload(t);
  }
  reset() {
    this.payload && pe(this.payload, (t) => t.reset());
  }
  /** Create a payload set. */
  _makePayload(t) {
    if (t) {
      const n = /* @__PURE__ */ new Set();
      return St(t, this._addToPayload, n), Array.from(n);
    }
  }
  /** Add to a payload set. */
  _addToPayload(t) {
    _o.dependencies && at(t) && _o.dependencies.add(t);
    const n = qo(t);
    n && pe(n, (r) => this.add(r));
  }
}, IA = class Jg extends Ko {
  constructor(t) {
    super(t);
  }
  /** @internal */
  static create(t) {
    return new Jg(t);
  }
  getValue() {
    return this.source.map((t) => t.getValue());
  }
  setValue(t) {
    const n = this.getPayload();
    return t.length == n.length ? n.map((r, a) => r.setValue(t[a])).some(Boolean) : (super.setValue(t.map($A)), !0);
  }
};
function $A(e) {
  return (Bo(e) ? wo : Xo).create(e);
}
function cl(e) {
  const t = ut(e);
  return t ? t.constructor : U.arr(e) ? IA : Bo(e) ? wo : Xo;
}
var _d = (e, t) => {
  const n = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !U.fun(e) || e.prototype && e.prototype.isReactComponent
  );
  return iv((r, a) => {
    const o = De(null), s = n && // eslint-disable-next-line react-hooks/rules-of-hooks
    sv(
      (g) => {
        o.current = RA(a, g);
      },
      [a]
    ), [l, f] = MA(r, t), u = Bg(), d = () => {
      const g = o.current;
      n && !g || (g ? t.applyAnimatedValues(g, l.getValue(!0)) : !1) === !1 && u();
    }, i = new jA(d, f), c = De(void 0);
    Jn(() => (c.current = i, pe(f, (g) => _r(g, i)), () => {
      c.current && (pe(
        c.current.deps,
        (g) => pa(g, c.current)
      ), se.cancel(c.current.update));
    })), Fe(d, []), qg(() => () => {
      const g = c.current;
      pe(g.deps, (m) => pa(m, g));
    });
    const p = t.getComponentProps(l.getValue());
    return /* @__PURE__ */ C.createElement(e, { ...p, ref: s });
  });
}, jA = class {
  constructor(e, t) {
    this.update = e, this.deps = t;
  }
  eventObserved(e) {
    e.type == "change" && se.write(this.update);
  }
};
function MA(e, t) {
  const n = /* @__PURE__ */ new Set();
  return _o.dependencies = n, e.style && (e = {
    ...e,
    style: t.createAnimatedStyle(e.style)
  }), e = new Ko(e), _o.dependencies = null, [e, n];
}
function RA(e, t) {
  return e && (U.fun(e) ? e(t) : e.current = t), t;
}
var kd = Symbol.for("AnimatedComponent"), zA = (e, {
  applyAnimatedValues: t = () => !1,
  createAnimatedStyle: n = (a) => new Ko(a),
  getComponentProps: r = (a) => a
} = {}) => {
  const a = {
    applyAnimatedValues: t,
    createAnimatedStyle: n,
    getComponentProps: r
  }, o = (s) => {
    const l = Ad(s) || "Anonymous";
    return U.str(s) ? s = o[s] || (o[s] = _d(s, a)) : s = s[kd] || (s[kd] = _d(s, a)), s.displayName = `Animated(${l})`, s;
  };
  return St(e, (s, l) => {
    U.arr(e) && (l = Ad(s)), o[l] = o(s);
  }), {
    animated: o
  };
}, Ad = (e) => U.str(e) ? e : e && U.str(e.displayName) ? e.displayName : U.fun(e) && e.name || null;
function Xe(e, ...t) {
  return U.fun(e) ? e(...t) : e;
}
var Kr = (e, t) => e === !0 || !!(t && e && (U.fun(e) ? e(t) : Ge(e).includes(t))), Zg = (e, t) => U.obj(e) ? t && e[t] : e, ey = (e, t) => e.default === !0 ? e[t] : e.default ? e.default[t] : void 0, DA = (e) => e, Wc = (e, t = DA) => {
  let n = FA;
  e.default && e.default !== !0 && (e = e.default, n = Object.keys(e));
  const r = {};
  for (const a of n) {
    const o = t(e[a], a);
    U.und(o) || (r[a] = o);
  }
  return r;
}, FA = [
  "config",
  "onProps",
  "onStart",
  "onChange",
  "onPause",
  "onResume",
  "onRest"
], LA = {
  config: 1,
  from: 1,
  to: 1,
  ref: 1,
  loop: 1,
  reset: 1,
  pause: 1,
  cancel: 1,
  reverse: 1,
  immediate: 1,
  default: 1,
  delay: 1,
  onProps: 1,
  onStart: 1,
  onChange: 1,
  onPause: 1,
  onResume: 1,
  onRest: 1,
  onResolve: 1,
  // Transition props
  items: 1,
  trail: 1,
  sort: 1,
  expires: 1,
  initial: 1,
  enter: 1,
  update: 1,
  leave: 1,
  children: 1,
  onDestroyed: 1,
  // Internal props
  keys: 1,
  callId: 1,
  parentId: 1
};
function WA(e) {
  const t = {};
  let n = 0;
  if (St(e, (r, a) => {
    LA[a] || (t[a] = r, n++);
  }), n)
    return t;
}
function Vc(e) {
  const t = WA(e);
  if (t) {
    const n = { to: t };
    return St(e, (r, a) => a in t || (n[a] = r)), n;
  }
  return { ...e };
}
function ha(e) {
  return e = qe(e), U.arr(e) ? e.map(ha) : Bo(e) ? lt.createStringInterpolator({
    range: [0, 1],
    output: [e, e]
  })(1) : e;
}
function VA(e) {
  for (const t in e) return !0;
  return !1;
}
function ul(e) {
  return U.fun(e) || U.arr(e) && U.obj(e[0]);
}
function Od(e, t) {
  var n;
  (n = e.ref) == null || n.delete(e), t == null || t.delete(e);
}
function YA(e, t) {
  var n;
  t && e.ref !== t && ((n = e.ref) == null || n.delete(e), t.add(e), e.ref = t);
}
var UA = {
  default: { tension: 170, friction: 26 }
}, fl = {
  ...UA.default,
  mass: 1,
  damping: 1,
  easing: yA.linear,
  clamp: !1
}, HA = class {
  constructor() {
    this.velocity = 0, Object.assign(this, fl);
  }
};
function GA(e, t, n) {
  n && (n = { ...n }, Sd(n, t), t = { ...n, ...t }), Sd(e, t), Object.assign(e, t);
  for (const s in fl)
    e[s] == null && (e[s] = fl[s]);
  let { frequency: r, damping: a } = e;
  const { mass: o } = e;
  return U.und(r) || (r < 0.01 && (r = 0.01), a < 0 && (a = 0), e.tension = Math.pow(2 * Math.PI / r, 2) * o, e.friction = 4 * Math.PI * a * o / r), e;
}
function Sd(e, t) {
  if (!U.und(t.decay))
    e.duration = void 0;
  else {
    const n = !U.und(t.tension) || !U.und(t.friction);
    (n || !U.und(t.frequency) || !U.und(t.damping) || !U.und(t.mass)) && (e.duration = void 0, e.decay = void 0), n && (e.frequency = void 0);
  }
}
var Ed = [], BA = class {
  constructor() {
    this.changed = !1, this.values = Ed, this.toValues = null, this.fromValues = Ed, this.config = new HA(), this.immediate = !1;
  }
};
function ty(e, { key: t, props: n, defaultProps: r, state: a, actions: o }) {
  return new Promise((s, l) => {
    let f, u, d = Kr(n.cancel ?? (r == null ? void 0 : r.cancel), t);
    if (d)
      p();
    else {
      U.und(n.pause) || (a.paused = Kr(n.pause, t));
      let g = r == null ? void 0 : r.pause;
      g !== !0 && (g = a.paused || Kr(g, t)), f = Xe(n.delay || 0, t), g ? (a.resumeQueue.add(c), o.pause()) : (o.resume(), c());
    }
    function i() {
      a.resumeQueue.add(c), a.timeouts.delete(u), u.cancel(), f = u.time - se.now();
    }
    function c() {
      f > 0 && !lt.skipAnimation ? (a.delayed = !0, u = se.setTimeout(p, f), a.pauseQueue.add(i), a.timeouts.add(u)) : p();
    }
    function p() {
      a.delayed && (a.delayed = !1), a.pauseQueue.delete(i), a.timeouts.delete(u), e <= (a.cancelId || 0) && (d = !0);
      try {
        o.start({ ...n, callId: e, cancel: d }, s);
      } catch (g) {
        l(g);
      }
    }
  });
}
var Yc = (e, t) => t.length == 1 ? t[0] : t.some((n) => n.cancelled) ? cr(e.get()) : t.every((n) => n.noop) ? ny(e.get()) : it(
  e.get(),
  t.every((n) => n.finished)
), ny = (e) => ({
  value: e,
  noop: !0,
  finished: !0,
  cancelled: !1
}), it = (e, t, n = !1) => ({
  value: e,
  finished: t,
  cancelled: n
}), cr = (e) => ({
  value: e,
  cancelled: !0,
  finished: !1
});
function ry(e, t, n, r) {
  const { callId: a, parentId: o, onRest: s } = t, { asyncTo: l, promise: f } = n;
  return !o && e === l && !t.reset ? f : n.promise = (async () => {
    n.asyncId = a, n.asyncTo = e;
    const u = Wc(
      t,
      (h, b) => (
        // The `onRest` prop is only called when the `runAsync` promise is resolved.
        b === "onRest" ? void 0 : h
      )
    );
    let d, i;
    const c = new Promise(
      (h, b) => (d = h, i = b)
    ), p = (h) => {
      const b = (
        // The `cancel` prop or `stop` method was used.
        a <= (n.cancelId || 0) && cr(r) || // The async `to` prop was replaced.
        a !== n.asyncId && it(r, !1)
      );
      if (b)
        throw h.result = b, i(h), h;
    }, g = (h, b) => {
      const _ = new Pd(), k = new Cd();
      return (async () => {
        if (lt.skipAnimation)
          throw ga(n), k.result = it(r, !1), i(k), k;
        p(_);
        const A = U.obj(h) ? { ...h } : { ...b, to: h };
        A.parentId = a, St(u, (H, F) => {
          U.und(A[F]) && (A[F] = H);
        });
        const v = await r.start(A);
        return p(_), n.paused && await new Promise((H) => {
          n.resumeQueue.add(H);
        }), v;
      })();
    };
    let m;
    if (lt.skipAnimation)
      return ga(n), it(r, !1);
    try {
      let h;
      U.arr(e) ? h = (async (b) => {
        for (const _ of b)
          await g(_);
      })(e) : h = Promise.resolve(e(g, r.stop.bind(r))), await Promise.all([h.then(d), c]), m = it(r.get(), !0, !1);
    } catch (h) {
      if (h instanceof Pd)
        m = h.result;
      else if (h instanceof Cd)
        m = h.result;
      else
        throw h;
    } finally {
      a == n.asyncId && (n.asyncId = o, n.asyncTo = o ? l : void 0, n.promise = o ? f : void 0);
    }
    return U.fun(s) && se.batchedUpdates(() => {
      s(m, r, r.item);
    }), m;
  })();
}
function ga(e, t) {
  qr(e.timeouts, (n) => n.cancel()), e.pauseQueue.clear(), e.resumeQueue.clear(), e.asyncId = e.asyncTo = e.promise = void 0, t && (e.cancelId = t);
}
var Pd = class extends Error {
  constructor() {
    super(
      "An async animation has been interrupted. You see this error because you forgot to use `await` or `.catch(...)` on its returned promise."
    );
  }
}, Cd = class extends Error {
  constructor() {
    super("SkipAnimationSignal");
  }
}, dl = (e) => e instanceof Uc, qA = 1, Uc = class extends Vg {
  constructor() {
    super(...arguments), this.id = qA++, this._priority = 0;
  }
  get priority() {
    return this._priority;
  }
  set priority(t) {
    this._priority != t && (this._priority = t, this._onPriorityChange(t));
  }
  /** Get the current value */
  get() {
    const t = ut(this);
    return t && t.getValue();
  }
  /** Create a spring that maps our value to another value */
  to(...t) {
    return lt.to(this, t);
  }
  /** @deprecated Use the `to` method instead. */
  interpolate(...t) {
    return OA(), lt.to(this, t);
  }
  toJSON() {
    return this.get();
  }
  observerAdded(t) {
    t == 1 && this._attach();
  }
  observerRemoved(t) {
    t == 0 && this._detach();
  }
  /** Called when the first child is added. */
  _attach() {
  }
  /** Called when the last child is removed. */
  _detach() {
  }
  /** Tell our children about our new value */
  _onChange(t, n = !1) {
    da(this, {
      type: "change",
      parent: this,
      value: t,
      idle: n
    });
  }
  /** Tell our children about our new priority */
  _onPriorityChange(t) {
    this.idle || Uo.sort(this), da(this, {
      type: "priority",
      parent: this,
      priority: t
    });
  }
}, Rn = Symbol.for("SpringPhase"), ay = 1, oy = 2, iy = 4, Gi = (e) => (e[Rn] & ay) > 0, en = (e) => (e[Rn] & oy) > 0, Nr = (e) => (e[Rn] & iy) > 0, Nd = (e, t) => t ? e[Rn] |= oy | ay : e[Rn] &= -3, Td = (e, t) => t ? e[Rn] |= iy : e[Rn] &= -5, XA = class extends Uc {
  constructor(e, t) {
    if (super(), this.animation = new BA(), this.defaultProps = {}, this._state = {
      paused: !1,
      delayed: !1,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    }, this._pendingCalls = /* @__PURE__ */ new Set(), this._lastCallId = 0, this._lastToId = 0, this._memoizedDuration = 0, !U.und(e) || !U.und(t)) {
      const n = U.obj(e) ? { ...e } : { ...t, from: e };
      U.und(n.default) && (n.default = !0), this.start(n);
    }
  }
  /** Equals true when not advancing on each frame. */
  get idle() {
    return !(en(this) || this._state.asyncTo) || Nr(this);
  }
  get goal() {
    return qe(this.animation.to);
  }
  get velocity() {
    const e = ut(this);
    return e instanceof Xo ? e.lastVelocity || 0 : e.getPayload().map((t) => t.lastVelocity || 0);
  }
  /**
   * When true, this value has been animated at least once.
   */
  get hasAnimated() {
    return Gi(this);
  }
  /**
   * When true, this value has an unfinished animation,
   * which is either active or paused.
   */
  get isAnimating() {
    return en(this);
  }
  /**
   * When true, all current and future animations are paused.
   */
  get isPaused() {
    return Nr(this);
  }
  /**
   *
   *
   */
  get isDelayed() {
    return this._state.delayed;
  }
  /** Advance the current animation by a number of milliseconds */
  advance(e) {
    let t = !0, n = !1;
    const r = this.animation;
    let { toValues: a } = r;
    const { config: o } = r, s = qo(r.to);
    !s && at(r.to) && (a = Ge(qe(r.to))), r.values.forEach((u, d) => {
      if (u.done) return;
      const i = (
        // Animated strings always go from 0 to 1.
        u.constructor == wo ? 1 : s ? s[d].lastPosition : a[d]
      );
      let c = r.immediate, p = i;
      if (!c) {
        if (p = u.lastPosition, o.tension <= 0) {
          u.done = !0;
          return;
        }
        let g = u.elapsedTime += e;
        const m = r.fromValues[d], h = u.v0 != null ? u.v0 : u.v0 = U.arr(o.velocity) ? o.velocity[d] : o.velocity;
        let b;
        const _ = o.precision || (m == i ? 5e-3 : Math.min(1, Math.abs(i - m) * 1e-3));
        if (U.und(o.duration))
          if (o.decay) {
            const k = o.decay === !0 ? 0.998 : o.decay, A = Math.exp(-(1 - k) * g);
            p = m + h / (1 - k) * (1 - A), c = Math.abs(u.lastPosition - p) <= _, b = h * A;
          } else {
            b = u.lastVelocity == null ? h : u.lastVelocity;
            const k = o.restVelocity || _ / 10, A = o.clamp ? 0 : o.bounce, v = !U.und(A), H = m == i ? u.v0 > 0 : m < i;
            let F, Q = !1;
            const B = 1, ie = Math.ceil(e / B);
            for (let ae = 0; ae < ie && (F = Math.abs(b) > k, !(!F && (c = Math.abs(i - p) <= _, c))); ++ae) {
              v && (Q = p == i || p > i == H, Q && (b = -b * A, p = i));
              const R = -o.tension * 1e-6 * (p - i), le = -o.friction * 1e-3 * b, D = (R + le) / o.mass;
              b = b + D * B, p = p + b * B;
            }
          }
        else {
          let k = 1;
          o.duration > 0 && (this._memoizedDuration !== o.duration && (this._memoizedDuration = o.duration, u.durationProgress > 0 && (u.elapsedTime = o.duration * u.durationProgress, g = u.elapsedTime += e)), k = (o.progress || 0) + g / this._memoizedDuration, k = k > 1 ? 1 : k < 0 ? 0 : k, u.durationProgress = k), p = m + o.easing(k) * (i - m), b = (p - u.lastPosition) / e, c = k == 1;
        }
        u.lastVelocity = b, Number.isNaN(p) && (console.warn("Got NaN while animating:", this), c = !0);
      }
      s && !s[d].done && (c = !1), c ? u.done = !0 : t = !1, u.setValue(p, o.round) && (n = !0);
    });
    const l = ut(this), f = l.getValue();
    if (t) {
      const u = qe(r.to);
      (f !== u || n) && !o.decay ? (l.setValue(u), this._onChange(u)) : n && o.decay && this._onChange(f), this._stop();
    } else n && this._onChange(f);
  }
  /** Set the current value, while stopping the current animation */
  set(e) {
    return se.batchedUpdates(() => {
      this._stop(), this._focus(e), this._set(e);
    }), this;
  }
  /**
   * Freeze the active animation in time, as well as any updates merged
   * before `resume` is called.
   */
  pause() {
    this._update({ pause: !0 });
  }
  /** Resume the animation if paused. */
  resume() {
    this._update({ pause: !1 });
  }
  /** Skip to the end of the current animation. */
  finish() {
    if (en(this)) {
      const { to: e, config: t } = this.animation;
      se.batchedUpdates(() => {
        this._onStart(), t.decay || this._set(e, !1), this._stop();
      });
    }
    return this;
  }
  /** Push props into the pending queue. */
  update(e) {
    return (this.queue || (this.queue = [])).push(e), this;
  }
  start(e, t) {
    let n;
    return U.und(e) ? (n = this.queue || [], this.queue = []) : n = [U.obj(e) ? e : { ...t, to: e }], Promise.all(
      n.map((r) => this._update(r))
    ).then((r) => Yc(this, r));
  }
  /**
   * Stop the current animation, and cancel any delayed updates.
   *
   * Pass `true` to call `onRest` with `cancelled: true`.
   */
  stop(e) {
    const { to: t } = this.animation;
    return this._focus(this.get()), ga(this._state, e && this._lastCallId), se.batchedUpdates(() => this._stop(t, e)), this;
  }
  /** Restart the animation. */
  reset() {
    this._update({ reset: !0 });
  }
  /** @internal */
  eventObserved(e) {
    e.type == "change" ? this._start() : e.type == "priority" && (this.priority = e.priority + 1);
  }
  /**
   * Parse the `to` and `from` range from the given `props` object.
   *
   * This also ensures the initial value is available to animated components
   * during the render phase.
   */
  _prepareNode(e) {
    const t = this.key || "";
    let { to: n, from: r } = e;
    n = U.obj(n) ? n[t] : n, (n == null || ul(n)) && (n = void 0), r = U.obj(r) ? r[t] : r, r == null && (r = void 0);
    const a = { to: n, from: r };
    return Gi(this) || (e.reverse && ([n, r] = [r, n]), r = qe(r), U.und(r) ? ut(this) || this._set(n) : this._set(r)), a;
  }
  /** Every update is processed by this method before merging. */
  _update({ ...e }, t) {
    const { key: n, defaultProps: r } = this;
    e.default && Object.assign(
      r,
      Wc(
        e,
        (s, l) => /^on/.test(l) ? Zg(s, n) : s
      )
    ), $d(this, e, "onProps"), Ir(this, "onProps", e, this);
    const a = this._prepareNode(e);
    if (Object.isFrozen(this))
      throw Error(
        "Cannot animate a `SpringValue` object that is frozen. Did you forget to pass your component to `animated(...)` before animating its props?"
      );
    const o = this._state;
    return ty(++this._lastCallId, {
      key: n,
      props: e,
      defaultProps: r,
      state: o,
      actions: {
        pause: () => {
          Nr(this) || (Td(this, !0), Fr(o.pauseQueue), Ir(
            this,
            "onPause",
            it(this, Tr(this, this.animation.to)),
            this
          ));
        },
        resume: () => {
          Nr(this) && (Td(this, !1), en(this) && this._resume(), Fr(o.resumeQueue), Ir(
            this,
            "onResume",
            it(this, Tr(this, this.animation.to)),
            this
          ));
        },
        start: this._merge.bind(this, a)
      }
    }).then((s) => {
      if (e.loop && s.finished && !(t && s.noop)) {
        const l = sy(e);
        if (l)
          return this._update(l, !0);
      }
      return s;
    });
  }
  /** Merge props into the current animation */
  _merge(e, t, n) {
    if (t.cancel)
      return this.stop(!0), n(cr(this));
    const r = !U.und(e.to), a = !U.und(e.from);
    if (r || a)
      if (t.callId > this._lastToId)
        this._lastToId = t.callId;
      else
        return n(cr(this));
    const { key: o, defaultProps: s, animation: l } = this, { to: f, from: u } = l;
    let { to: d = f, from: i = u } = e;
    a && !r && (!t.default || U.und(d)) && (d = i), t.reverse && ([d, i] = [i, d]);
    const c = !$t(i, u);
    c && (l.from = i), i = qe(i);
    const p = !$t(d, f);
    p && this._focus(d);
    const g = ul(t.to), { config: m } = l, { decay: h, velocity: b } = m;
    (r || a) && (m.velocity = 0), t.config && !g && GA(
      m,
      Xe(t.config, o),
      // Avoid calling the same "config" prop twice.
      t.config !== s.config ? Xe(s.config, o) : void 0
    );
    let _ = ut(this);
    if (!_ || U.und(d))
      return n(it(this, !0));
    const k = (
      // When `reset` is undefined, the `from` prop implies `reset: true`,
      // except for declarative updates. When `reset` is defined, there
      // must exist a value to animate from.
      U.und(t.reset) ? a && !t.default : !U.und(i) && Kr(t.reset, o)
    ), A = k ? i : this.get(), v = ha(d), H = U.num(v) || U.arr(v) || Bo(v), F = !g && (!H || Kr(s.immediate || t.immediate, o));
    if (p) {
      const ae = cl(d);
      if (ae !== _.constructor)
        if (F)
          _ = this._set(v);
        else
          throw Error(
            `Cannot animate between ${_.constructor.name} and ${ae.name}, as the "to" prop suggests`
          );
    }
    const Q = _.constructor;
    let B = at(d), ie = !1;
    if (!B) {
      const ae = k || !Gi(this) && c;
      (p || ae) && (ie = $t(ha(A), v), B = !ie), (!$t(l.immediate, F) && !F || !$t(m.decay, h) || !$t(m.velocity, b)) && (B = !0);
    }
    if (ie && en(this) && (l.changed && !k ? B = !0 : B || this._stop(f)), !g && ((B || at(f)) && (l.values = _.getPayload(), l.toValues = at(d) ? null : Q == wo ? [1] : Ge(v)), l.immediate != F && (l.immediate = F, !F && !k && this._set(f)), B)) {
      const { onRest: ae } = l;
      pe(KA, (le) => $d(this, t, le));
      const R = it(this, Tr(this, f));
      Fr(this._pendingCalls, R), this._pendingCalls.add(n), l.changed && se.batchedUpdates(() => {
        var le;
        l.changed = !k, ae == null || ae(R, this), k ? Xe(s.onRest, R) : (le = l.onStart) == null || le.call(l, R, this);
      });
    }
    k && this._set(A), g ? n(ry(t.to, t, this._state, this)) : B ? this._start() : en(this) && !p ? this._pendingCalls.add(n) : n(ny(A));
  }
  /** Update the `animation.to` value, which might be a `FluidValue` */
  _focus(e) {
    const t = this.animation;
    e !== t.to && (xd(this) && this._detach(), t.to = e, xd(this) && this._attach());
  }
  _attach() {
    let e = 0;
    const { to: t } = this.animation;
    at(t) && (_r(t, this), dl(t) && (e = t.priority + 1)), this.priority = e;
  }
  _detach() {
    const { to: e } = this.animation;
    at(e) && pa(e, this);
  }
  /**
   * Update the current value from outside the frameloop,
   * and return the `Animated` node.
   */
  _set(e, t = !0) {
    const n = qe(e);
    if (!U.und(n)) {
      const r = ut(this);
      if (!r || !$t(n, r.getValue())) {
        const a = cl(n);
        !r || r.constructor != a ? Lc(this, a.create(n)) : r.setValue(n), r && se.batchedUpdates(() => {
          this._onChange(n, t);
        });
      }
    }
    return ut(this);
  }
  _onStart() {
    const e = this.animation;
    e.changed || (e.changed = !0, Ir(
      this,
      "onStart",
      it(this, Tr(this, e.to)),
      this
    ));
  }
  _onChange(e, t) {
    t || (this._onStart(), Xe(this.animation.onChange, e, this)), Xe(this.defaultProps.onChange, e, this), super._onChange(e, t);
  }
  // This method resets the animation state (even if already animating) to
  // ensure the latest from/to range is used, and it also ensures this spring
  // is added to the frameloop.
  _start() {
    const e = this.animation;
    ut(this).reset(qe(e.to)), e.immediate || (e.fromValues = e.values.map((t) => t.lastPosition)), en(this) || (Nd(this, !0), Nr(this) || this._resume());
  }
  _resume() {
    lt.skipAnimation ? this.finish() : Uo.start(this);
  }
  /**
   * Exit the frameloop and notify `onRest` listeners.
   *
   * Always wrap `_stop` calls with `batchedUpdates`.
   */
  _stop(e, t) {
    if (en(this)) {
      Nd(this, !1);
      const n = this.animation;
      pe(n.values, (a) => {
        a.done = !0;
      }), n.toValues && (n.onChange = n.onPause = n.onResume = void 0), da(this, {
        type: "idle",
        parent: this
      });
      const r = t ? cr(this.get()) : it(this.get(), Tr(this, e ?? n.to));
      Fr(this._pendingCalls, r), n.changed && (n.changed = !1, Ir(this, "onRest", r, this));
    }
  }
};
function Tr(e, t) {
  const n = ha(t), r = ha(e.get());
  return $t(r, n);
}
function sy(e, t = e.loop, n = e.to) {
  const r = Xe(t);
  if (r) {
    const a = r !== !0 && Vc(r), o = (a || e).reverse, s = !a || a.reset;
    return ko({
      ...e,
      loop: t,
      // Avoid updating default props when looping.
      default: !1,
      // Never loop the `pause` prop.
      pause: void 0,
      // For the "reverse" prop to loop as expected, the "to" prop
      // must be undefined. The "reverse" prop is ignored when the
      // "to" prop is an array or function.
      to: !o || ul(n) ? n : void 0,
      // Ignore the "from" prop except on reset.
      from: s ? e.from : void 0,
      reset: s,
      // The "loop" prop can return a "useSpring" props object to
      // override any of the original props.
      ...a
    });
  }
}
function ko(e) {
  const { to: t, from: n } = e = Vc(e), r = /* @__PURE__ */ new Set();
  return U.obj(t) && Id(t, r), U.obj(n) && Id(n, r), e.keys = r.size ? Array.from(r) : null, e;
}
function Id(e, t) {
  St(e, (n, r) => n != null && t.add(r));
}
var KA = [
  "onStart",
  "onRest",
  "onChange",
  "onPause",
  "onResume"
];
function $d(e, t, n) {
  e.animation[n] = t[n] !== ey(t, n) ? Zg(t[n], e.key) : void 0;
}
function Ir(e, t, ...n) {
  var r, a, o, s;
  (a = (r = e.animation)[t]) == null || a.call(r, ...n), (s = (o = e.defaultProps)[t]) == null || s.call(o, ...n);
}
var QA = ["onStart", "onChange", "onRest"], JA = 1, ZA = class {
  constructor(e, t) {
    this.id = JA++, this.springs = {}, this.queue = [], this._lastAsyncId = 0, this._active = /* @__PURE__ */ new Set(), this._changed = /* @__PURE__ */ new Set(), this._started = !1, this._state = {
      paused: !1,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    }, this._events = {
      onStart: /* @__PURE__ */ new Map(),
      onChange: /* @__PURE__ */ new Map(),
      onRest: /* @__PURE__ */ new Map()
    }, this._onFrame = this._onFrame.bind(this), t && (this._flush = t), e && this.start({ default: !0, ...e });
  }
  /**
   * Equals `true` when no spring values are in the frameloop, and
   * no async animation is currently active.
   */
  get idle() {
    return !this._state.asyncTo && Object.values(this.springs).every((e) => e.idle && !e.isDelayed && !e.isPaused);
  }
  get item() {
    return this._item;
  }
  set item(e) {
    this._item = e;
  }
  /** Get the current values of our springs */
  get() {
    const e = {};
    return this.each((t, n) => e[n] = t.get()), e;
  }
  /** Set the current values without animating. */
  set(e) {
    for (const t in e) {
      const n = e[t];
      U.und(n) || this.springs[t].set(n);
    }
  }
  /** Push an update onto the queue of each value. */
  update(e) {
    return e && this.queue.push(ko(e)), this;
  }
  /**
   * Start the queued animations for every spring, and resolve the returned
   * promise once all queued animations have finished or been cancelled.
   *
   * When you pass a queue (instead of nothing), that queue is used instead of
   * the queued animations added with the `update` method, which are left alone.
   */
  start(e) {
    let { queue: t } = this;
    return e ? t = Ge(e).map(ko) : this.queue = [], this._flush ? this._flush(this, t) : (fy(this, t), e5(this, t));
  }
  /** @internal */
  stop(e, t) {
    if (e !== !!e && (t = e), t) {
      const n = this.springs;
      pe(Ge(t), (r) => n[r].stop(!!e));
    } else
      ga(this._state, this._lastAsyncId), this.each((n) => n.stop(!!e));
    return this;
  }
  /** Freeze the active animation in time */
  pause(e) {
    if (U.und(e))
      this.start({ pause: !0 });
    else {
      const t = this.springs;
      pe(Ge(e), (n) => t[n].pause());
    }
    return this;
  }
  /** Resume the animation if paused. */
  resume(e) {
    if (U.und(e))
      this.start({ pause: !1 });
    else {
      const t = this.springs;
      pe(Ge(e), (n) => t[n].resume());
    }
    return this;
  }
  /** Call a function once per spring value */
  each(e) {
    St(this.springs, e);
  }
  /** @internal Called at the end of every animation frame */
  _onFrame() {
    const { onStart: e, onChange: t, onRest: n } = this._events, r = this._active.size > 0, a = this._changed.size > 0;
    (r && !this._started || a && !this._started) && (this._started = !0, qr(e, ([l, f]) => {
      f.value = this.get(), l(f, this, this._item);
    }));
    const o = !r && this._started, s = a || o && n.size ? this.get() : null;
    a && t.size && qr(t, ([l, f]) => {
      f.value = s, l(f, this, this._item);
    }), o && (this._started = !1, qr(n, ([l, f]) => {
      f.value = s, l(f, this, this._item);
    }));
  }
  /** @internal */
  eventObserved(e) {
    if (e.type == "change")
      this._changed.add(e.parent), e.idle || this._active.add(e.parent);
    else if (e.type == "idle")
      this._active.delete(e.parent);
    else return;
    se.onFrame(this._onFrame);
  }
};
function e5(e, t) {
  return Promise.all(t.map((n) => ly(e, n))).then(
    (n) => Yc(e, n)
  );
}
async function ly(e, t, n) {
  const { keys: r, to: a, from: o, loop: s, onRest: l, onResolve: f } = t, u = U.obj(t.default) && t.default;
  s && (t.loop = !1), a === !1 && (t.to = null), o === !1 && (t.from = null);
  const d = U.arr(a) || U.fun(a) ? a : void 0;
  d ? (t.to = void 0, t.onRest = void 0, u && (u.onRest = void 0)) : pe(QA, (m) => {
    const h = t[m];
    if (U.fun(h)) {
      const b = e._events[m];
      t[m] = ({ finished: _, cancelled: k }) => {
        const A = b.get(h);
        A ? (_ || (A.finished = !1), k && (A.cancelled = !0)) : b.set(h, {
          value: null,
          finished: _ || !1,
          cancelled: k || !1
        });
      }, u && (u[m] = t[m]);
    }
  });
  const i = e._state;
  t.pause === !i.paused ? (i.paused = t.pause, Fr(t.pause ? i.pauseQueue : i.resumeQueue)) : i.paused && (t.pause = !0);
  const c = (r || Object.keys(e.springs)).map(
    (m) => e.springs[m].start(t)
  ), p = t.cancel === !0 || ey(t, "cancel") === !0;
  (d || p && i.asyncId) && c.push(
    ty(++e._lastAsyncId, {
      props: t,
      state: i,
      actions: {
        pause: sl,
        resume: sl,
        start(m, h) {
          p ? (ga(i, e._lastAsyncId), h(cr(e))) : (m.onRest = l, h(
            ry(
              d,
              m,
              i,
              e
            )
          ));
        }
      }
    })
  ), i.paused && await new Promise((m) => {
    i.resumeQueue.add(m);
  });
  const g = Yc(e, await Promise.all(c));
  if (s && g.finished && !(n && g.noop)) {
    const m = sy(t, s, a);
    if (m)
      return fy(e, [m]), ly(e, m, !0);
  }
  return f && se.batchedUpdates(() => f(g, e, e.item)), g;
}
function t5(e, t) {
  const n = { ...e.springs };
  return t && pe(Ge(t), (r) => {
    U.und(r.keys) && (r = ko(r)), U.obj(r.to) || (r = { ...r, to: void 0 }), uy(n, r, (a) => cy(a));
  }), n5(e, n), n;
}
function n5(e, t) {
  St(t, (n, r) => {
    e.springs[r] || (e.springs[r] = n, _r(n, e));
  });
}
function cy(e, t) {
  const n = new XA();
  return n.key = e, t && _r(n, t), n;
}
function uy(e, t, n) {
  t.keys && pe(t.keys, (r) => {
    (e[r] || (e[r] = n(r)))._prepareNode(t);
  });
}
function fy(e, t) {
  pe(t, (n) => {
    uy(e.springs, n, (r) => cy(r, e));
  });
}
var r5 = C.createContext({
  pause: !1,
  immediate: !1
}), a5 = () => {
  const e = [], t = function(r) {
    EA();
    const a = [];
    return pe(e, (o, s) => {
      if (U.und(r))
        a.push(o.start());
      else {
        const l = n(r, o, s);
        l && a.push(o.start(l));
      }
    }), a;
  };
  t.current = e, t.add = function(r) {
    e.includes(r) || e.push(r);
  }, t.delete = function(r) {
    const a = e.indexOf(r);
    ~a && e.splice(a, 1);
  }, t.pause = function() {
    return pe(e, (r) => r.pause(...arguments)), this;
  }, t.resume = function() {
    return pe(e, (r) => r.resume(...arguments)), this;
  }, t.set = function(r) {
    pe(e, (a, o) => {
      const s = U.fun(r) ? r(o, a) : r;
      s && a.set(s);
    });
  }, t.start = function(r) {
    const a = [];
    return pe(e, (o, s) => {
      if (U.und(r))
        a.push(o.start());
      else {
        const l = this._getProps(r, o, s);
        l && a.push(o.start(l));
      }
    }), a;
  }, t.stop = function() {
    return pe(e, (r) => r.stop(...arguments)), this;
  }, t.update = function(r) {
    return pe(e, (a, o) => a.update(this._getProps(r, a, o))), this;
  };
  const n = function(r, a, o) {
    return U.fun(r) ? r(o, a) : r;
  };
  return t._getProps = n, t;
};
function jd(e, t, n) {
  const r = U.fun(t) && t, {
    reset: a,
    sort: o,
    trail: s = 0,
    expires: l = !0,
    exitBeforeEnter: f = !1,
    onDestroyed: u,
    ref: d,
    config: i
  } = r ? r() : t, c = av(
    () => r || arguments.length == 3 ? a5() : void 0,
    []
  ), p = Ge(e), g = [], m = De(null), h = a ? null : m.current;
  Jn(() => {
    m.current = g;
  }), qg(() => (pe(g, (D) => {
    c == null || c.add(D.ctrl), D.ctrl.ref = c;
  }), () => {
    pe(m.current, (D) => {
      D.expired && clearTimeout(D.expirationId), Od(D.ctrl, c), D.ctrl.stop(!0);
    });
  }));
  const b = i5(p, r ? r() : t, h), _ = a && m.current || [];
  Jn(
    () => pe(_, ({ ctrl: D, item: M, key: z }) => {
      Od(D, c), Xe(u, M, z);
    })
  );
  const k = [];
  if (h && pe(h, (D, M) => {
    D.expired ? (clearTimeout(D.expirationId), _.push(D)) : (M = k[M] = b.indexOf(D.key), ~M && (g[M] = D));
  }), pe(p, (D, M) => {
    g[M] || (g[M] = {
      key: b[M],
      item: D,
      phase: "mount",
      ctrl: new ZA()
    }, g[M].ctrl.item = D);
  }), k.length) {
    let D = -1;
    const { leave: M } = r ? r() : t;
    pe(k, (z, K) => {
      const X = h[K];
      ~z ? (D = g.indexOf(X), g[D] = { ...X, item: p[z] }) : M && g.splice(++D, 0, X);
    });
  }
  U.fun(o) && g.sort((D, M) => o(D.item, M.item));
  let A = -s;
  const v = Bg(), H = Wc(t), F = /* @__PURE__ */ new Map(), Q = De(/* @__PURE__ */ new Map()), B = De(!1);
  pe(g, (D, M) => {
    const z = D.key, K = D.phase, X = r ? r() : t;
    let oe, y;
    const x = Xe(X.delay || 0, z);
    if (K == "mount")
      oe = X.enter, y = "enter";
    else {
      const T = b.indexOf(z) < 0;
      if (K != "leave")
        if (T)
          oe = X.leave, y = "leave";
        else if (oe = X.update)
          y = "update";
        else return;
      else if (!T)
        oe = X.enter, y = "enter";
      else return;
    }
    if (oe = Xe(oe, D.item, M), oe = U.obj(oe) ? Vc(oe) : { to: oe }, !oe.config) {
      const T = i || H.config;
      oe.config = Xe(T, D.item, M, y);
    }
    A += s;
    const P = {
      ...H,
      // we need to add our props.delay value you here.
      delay: x + A,
      ref: d,
      immediate: X.immediate,
      // This prevents implied resets.
      reset: !1,
      // Merge any phase-specific props.
      ...oe
    };
    if (y == "enter" && U.und(P.from)) {
      const T = r ? r() : t, S = U.und(T.initial) || h ? T.from : T.initial;
      P.from = Xe(S, D.item, M);
    }
    const { onResolve: N } = P;
    P.onResolve = (T) => {
      Xe(N, T);
      const S = m.current, E = S.find(($) => $.key === z);
      if (E && !(T.cancelled && E.phase != "update") && E.ctrl.idle) {
        const $ = S.every((I) => I.ctrl.idle);
        if (E.phase == "leave") {
          const I = Xe(l, E.item);
          if (I !== !1) {
            const j = I === !0 ? 0 : I;
            if (E.expired = !0, !$ && j > 0) {
              j <= 2147483647 && (E.expirationId = setTimeout(v, j));
              return;
            }
          }
        }
        $ && S.some((I) => I.expired) && (Q.current.delete(E), f && (B.current = !0), v());
      }
    };
    const O = t5(D.ctrl, P);
    y === "leave" && f ? Q.current.set(D, { phase: y, springs: O, payload: P }) : F.set(D, { phase: y, springs: O, payload: P });
  });
  const ie = wm(r5), ae = NA(ie), R = ie !== ae && VA(ie);
  Jn(() => {
    R && pe(g, (D) => {
      D.ctrl.start({ default: ie });
    });
  }, [ie]), pe(F, (D, M) => {
    if (Q.current.size) {
      const z = g.findIndex((K) => K.key === M.key);
      g.splice(z, 1);
    }
  }), Jn(
    () => {
      pe(
        Q.current.size ? Q.current : F,
        ({ phase: D, payload: M }, z) => {
          const { ctrl: K } = z;
          z.phase = D, c == null || c.add(K), R && D == "enter" && K.start({ default: ie }), M && (YA(K, M.ref), (K.ref || c) && !B.current ? K.update(M) : (K.start(M), B.current && (B.current = !1)));
        }
      );
    },
    a ? void 0 : n
  );
  const le = (D) => /* @__PURE__ */ C.createElement(C.Fragment, null, g.map((M, z) => {
    const { springs: K } = F.get(M) || M.ctrl, X = D({ ...K }, M.item, M, z);
    return X && X.type ? /* @__PURE__ */ C.createElement(
      X.type,
      {
        ...X.props,
        key: U.str(M.key) || U.num(M.key) ? M.key : M.ctrl.id,
        ref: X.ref
      }
    ) : X;
  }));
  return c ? [le, c] : le;
}
var o5 = 1;
function i5(e, { key: t, keys: n = t }, r) {
  if (n === null) {
    const a = /* @__PURE__ */ new Set();
    return e.map((o) => {
      const s = r && r.find(
        (l) => l.item === o && l.phase !== "leave" && !a.has(l)
      );
      return s ? (a.add(s), s.key) : o5++;
    });
  }
  return U.und(n) ? e : U.fun(n) ? e.map(n) : Ge(n);
}
var s5 = class extends Uc {
  constructor(e, t) {
    super(), this.source = e, this.idle = !0, this._active = /* @__PURE__ */ new Set(), this.calc = ua(...t);
    const n = this._get(), r = cl(n);
    Lc(this, r.create(n));
  }
  advance(e) {
    const t = this._get(), n = this.get();
    $t(t, n) || (ut(this).setValue(t), this._onChange(t, this.idle)), !this.idle && Md(this._active) && Bi(this);
  }
  _get() {
    const e = U.arr(this.source) ? this.source.map(qe) : Ge(qe(this.source));
    return this.calc(...e);
  }
  _start() {
    this.idle && !Md(this._active) && (this.idle = !1, pe(qo(this), (e) => {
      e.done = !1;
    }), lt.skipAnimation ? (se.batchedUpdates(() => this.advance()), Bi(this)) : Uo.start(this));
  }
  // Observe our sources only when we're observed.
  _attach() {
    let e = 1;
    pe(Ge(this.source), (t) => {
      at(t) && _r(t, this), dl(t) && (t.idle || this._active.add(t), e = Math.max(e, t.priority + 1));
    }), this.priority = e, this._start();
  }
  // Stop observing our sources once we have no observers.
  _detach() {
    pe(Ge(this.source), (e) => {
      at(e) && pa(e, this);
    }), this._active.clear(), Bi(this);
  }
  /** @internal */
  eventObserved(e) {
    e.type == "change" ? e.idle ? this.advance() : (this._active.add(e.parent), this._start()) : e.type == "idle" ? this._active.delete(e.parent) : e.type == "priority" && (this.priority = Ge(this.source).reduce(
      (t, n) => Math.max(t, (dl(n) ? n.priority : 0) + 1),
      0
    ));
  }
};
function l5(e) {
  return e.idle !== !1;
}
function Md(e) {
  return !e.size || Array.from(e).every(l5);
}
function Bi(e) {
  e.idle || (e.idle = !0, pe(qo(e), (t) => {
    t.done = !0;
  }), da(e, {
    type: "idle",
    parent: e
  }));
}
lt.assign({
  createStringInterpolator: Hg,
  to: (e, t) => new s5(e, t)
});
var dy = /^--/;
function c5(e, t) {
  return t == null || typeof t == "boolean" || t === "" ? "" : typeof t == "number" && t !== 0 && !dy.test(e) && !(Qr.hasOwnProperty(e) && Qr[e]) ? t + "px" : ("" + t).trim();
}
var Rd = {};
function u5(e, t) {
  if (!e.nodeType || !e.setAttribute)
    return !1;
  const n = e.nodeName === "filter" || e.parentNode && e.parentNode.nodeName === "filter", {
    className: r,
    style: a,
    children: o,
    scrollTop: s,
    scrollLeft: l,
    viewBox: f,
    ...u
  } = t, d = Object.values(u), i = Object.keys(u).map(
    (c) => n || e.hasAttribute(c) ? c : Rd[c] || (Rd[c] = c.replace(
      /([A-Z])/g,
      // Attributes are written in dash case
      (p) => "-" + p.toLowerCase()
    ))
  );
  o !== void 0 && (e.textContent = o);
  for (const c in a)
    if (a.hasOwnProperty(c)) {
      const p = c5(c, a[c]);
      dy.test(c) ? e.style.setProperty(c, p) : e.style[c] = p;
    }
  i.forEach((c, p) => {
    e.setAttribute(c, d[p]);
  }), r !== void 0 && (e.className = r), s !== void 0 && (e.scrollTop = s), l !== void 0 && (e.scrollLeft = l), f !== void 0 && e.setAttribute("viewBox", f);
}
var Qr = {
  animationIterationCount: !0,
  borderImageOutset: !0,
  borderImageSlice: !0,
  borderImageWidth: !0,
  boxFlex: !0,
  boxFlexGroup: !0,
  boxOrdinalGroup: !0,
  columnCount: !0,
  columns: !0,
  flex: !0,
  flexGrow: !0,
  flexPositive: !0,
  flexShrink: !0,
  flexNegative: !0,
  flexOrder: !0,
  gridRow: !0,
  gridRowEnd: !0,
  gridRowSpan: !0,
  gridRowStart: !0,
  gridColumn: !0,
  gridColumnEnd: !0,
  gridColumnSpan: !0,
  gridColumnStart: !0,
  fontWeight: !0,
  lineClamp: !0,
  lineHeight: !0,
  opacity: !0,
  order: !0,
  orphans: !0,
  tabSize: !0,
  widows: !0,
  zIndex: !0,
  zoom: !0,
  // SVG-related properties
  fillOpacity: !0,
  floodOpacity: !0,
  stopOpacity: !0,
  strokeDasharray: !0,
  strokeDashoffset: !0,
  strokeMiterlimit: !0,
  strokeOpacity: !0,
  strokeWidth: !0
}, f5 = (e, t) => e + t.charAt(0).toUpperCase() + t.substring(1), d5 = ["Webkit", "Ms", "Moz", "O"];
Qr = Object.keys(Qr).reduce((e, t) => (d5.forEach((n) => e[f5(n, t)] = e[t]), e), Qr);
var p5 = /^(matrix|translate|scale|rotate|skew)/, m5 = /^(translate)/, h5 = /^(rotate|skew)/, qi = (e, t) => U.num(e) && e !== 0 ? e + t : e, oo = (e, t) => U.arr(e) ? e.every((n) => oo(n, t)) : U.num(e) ? e === t : parseFloat(e) === t, g5 = class extends Ko {
  constructor({ x: e, y: t, z: n, ...r }) {
    const a = [], o = [];
    (e || t || n) && (a.push([e || 0, t || 0, n || 0]), o.push((s) => [
      `translate3d(${s.map((l) => qi(l, "px")).join(",")})`,
      // prettier-ignore
      oo(s, 0)
    ])), St(r, (s, l) => {
      if (l === "transform")
        a.push([s || ""]), o.push((f) => [f, f === ""]);
      else if (p5.test(l)) {
        if (delete r[l], U.und(s)) return;
        const f = m5.test(l) ? "px" : h5.test(l) ? "deg" : "";
        a.push(Ge(s)), o.push(
          l === "rotate3d" ? ([u, d, i, c]) => [
            `rotate3d(${u},${d},${i},${qi(c, f)})`,
            oo(c, 0)
          ] : (u) => [
            `${l}(${u.map((d) => qi(d, f)).join(",")})`,
            oo(u, l.startsWith("scale") ? 1 : 0)
          ]
        );
      }
    }), a.length && (r.transform = new y5(a, o)), super(r);
  }
}, y5 = class extends Vg {
  constructor(e, t) {
    super(), this.inputs = e, this.transforms = t, this._value = null;
  }
  get() {
    return this._value || (this._value = this._get());
  }
  _get() {
    let e = "", t = !0;
    return pe(this.inputs, (n, r) => {
      const a = qe(n[0]), [o, s] = this.transforms[r](
        U.arr(a) ? a : n.map(qe)
      );
      e += " " + o, t = t && s;
    }), t ? "none" : e;
  }
  // Start observing our inputs once we have an observer.
  observerAdded(e) {
    e == 1 && pe(
      this.inputs,
      (t) => pe(
        t,
        (n) => at(n) && _r(n, this)
      )
    );
  }
  // Stop observing our inputs once we have no observers.
  observerRemoved(e) {
    e == 0 && pe(
      this.inputs,
      (t) => pe(
        t,
        (n) => at(n) && pa(n, this)
      )
    );
  }
  eventObserved(e) {
    e.type == "change" && (this._value = null), da(this, e);
  }
}, b5 = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  // SVG
  "circle",
  "clipPath",
  "defs",
  "ellipse",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "mask",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "text",
  "tspan"
];
lt.assign({
  batchedUpdates: uv,
  createStringInterpolator: Hg,
  colors: oA
});
var v5 = zA(b5, {
  applyAnimatedValues: u5,
  createAnimatedStyle: (e) => new g5(e),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentProps: ({ scrollTop: e, scrollLeft: t, ...n }) => n
}), py = v5.animated;
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const x5 = {
  prefix: "fas",
  iconName: "down-left-and-up-right-to-center",
  icon: [512, 512, ["compress-alt"], "f422", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8l-144 0c-13.3 0-24-10.7-24-24l0-144c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272l144 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z"]
}, w5 = {
  prefix: "fas",
  iconName: "up-right-and-down-left-from-center",
  icon: [512, 512, ["expand-alt"], "f424", "M344 0L488 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512L24 512c-13.3 0-24-10.7-24-24L0 344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"]
};
var pl = /* @__PURE__ */ ((e) => (e[e.NONE = 0] = "NONE", e[e.INPUT = 1] = "INPUT", e[e.PANEL = 2] = "PANEL", e[e.DIALOGUE = 3] = "DIALOGUE", e))(pl || {}), _5 = Object.freeze({
  // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
  position: "absolute",
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  wordWrap: "normal"
}), k5 = "VisuallyHidden", my = C.forwardRef(
  (e, t) => /* @__PURE__ */ G(
    Et.span,
    {
      ...e,
      ref: t,
      style: { ..._5, ...e.style }
    }
  )
);
my.displayName = k5;
var zd = my;
const ya = [], A5 = (e) => {
  ya.push(e);
}, O5 = (e) => {
  const t = ya.findIndex((n) => n.id === e);
  t !== -1 && ya.splice(t, 1);
}, S5 = (e, t) => {
  const n = ya.find((r) => r.id === e);
  n && Object.assign(n, t);
}, E5 = () => ya.filter((e) => e.closeOnEsc).sort((e, t) => t.zIndex - e.zIndex)[0];
typeof window < "u" && !window.__modalEscListenerInstalled && (window.__modalEscListenerInstalled = !0, window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" && e.key !== "Esc") return;
  const t = E5();
  t && (e.preventDefault(), t.onClose());
}));
let $r = 70;
const P5 = ({
  styles: e,
  backdropClassName: t,
  disableHotkeyInput: n,
  enableHotkeyInput: r
}) => (Fe(() => (n(pl.DIALOGUE), () => {
  r(pl.DIALOGUE);
}), [n, r]), /* @__PURE__ */ G(G1, { forceMount: !0, asChild: !0, children: /* @__PURE__ */ G(
  py.div,
  {
    className: Yr("fixed inset-0 z-[69]", t),
    style: {
      opacity: e.opacity,
      pointerEvents: "none",
      background: "radial-gradient(800px 400px at 10% -10%, rgba(45,129,255,0.10), transparent), radial-gradient(600px 320px at 110% 110%, rgba(28,182,190,0.10), transparent), rgba(0,0,0,0.60)"
    }
  }
) })), ml = ({ children: e }) => /* @__PURE__ */ G(ft, { children: e }), hy = rv(
  void 0
), Hc = ({ className: e, size: t = "md" }) => {
  const n = wm(hy);
  if (!n) return null;
  const { expanded: r, toggleExpanded: a } = n;
  return /* @__PURE__ */ G(
    "button",
    {
      type: "button",
      "aria-label": r ? "Restore modal size" : "Expand modal",
      onClick: a,
      className: Yr(
        "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
        {
          sm: "h-5 w-5 text-sm",
          md: "h-7 w-7 text-md",
          lg: "h-9 w-9 text-xl"
        }[t],
        "relative z-[70]",
        e
      ),
      children: /* @__PURE__ */ G(
        sa,
        {
          icon: r ? x5 : w5
        }
      )
    }
  );
};
Hc.displayName = "ModalExpandButton";
const Pa = ({
  isOpen: e,
  title: t,
  titleIcon: n,
  onTitleIconClick: r,
  onClose: a,
  enableHotkeyInput: o = () => {
  },
  disableHotkeyInput: s = () => {
  },
  className: l,
  backdropClassName: f,
  width: u,
  children: d,
  childPadding: i = !0,
  titleIconClassName: c,
  showClose: p = !0,
  draggable: g = !1,
  resizable: m = !1,
  initialPosition: h,
  closeOnOutsideClick: b = !0,
  closeOnEsc: _ = !0,
  allowBackgroundInteraction: k = !1,
  expandable: A = !1,
  accessibleTitle: v,
  accessibleDescription: H
}) => {
  const [F, Q] = dt(
    null
  ), [B, ie] = dt(!1), [ae, R] = dt(!1), le = De({ x: 0, y: 0 }), D = De({ x: 0, y: 0 }), M = De(null), z = De(null), K = De(null), [X, oe] = dt(() => ++$r), [y, x] = dt(!1), P = De(null), N = jd(e, {
    from: {
      opacity: 0,
      transform: "scale(0.95) translateY(-10px)"
    },
    enter: {
      opacity: 1,
      transform: "scale(1) translateY(0px)"
    },
    leave: {
      opacity: 0,
      transform: "scale(0.95) translateY(10px)"
    },
    config: {
      tension: 300,
      friction: 30,
      mass: 0.8
    }
  }), O = jd(e, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      tension: 280,
      friction: 25
    }
  });
  Fe(() => {
    y ? (z.current && (P.current = { ...z.current }), Q({ x: 0, y: 0 }), z.current = { x: 0, y: 0 }, M.current && (M.current.style.left = "0px", M.current.style.top = "0px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(X))) : P.current && (Q({ ...P.current }), z.current = { ...P.current }, M.current && (M.current.style.left = P.current.x + "px", M.current.style.top = P.current.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(X)));
  }, [y, X]);
  const T = () => x((ne) => !ne);
  Fe(() => {
    e ? K.current ? (Q({ ...K.current }), z.current = { ...K.current }, M.current && (M.current.style.left = K.current.x + "px", M.current.style.top = K.current.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(X))) : h && (Q({ ...h }), z.current = { ...h }, M.current && (M.current.style.left = h.x + "px", M.current.style.top = h.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(X))) : z.current && (K.current = { ...z.current });
  }, [e, X]), Fe(() => {
    if (!B) return;
    let ne = null;
    const re = (et) => {
      if (!M.current) return;
      const tt = et.clientX - D.current.x, Pe = et.clientY - D.current.y, Re = le.current.x + tt, ze = le.current.y + Pe, nt = M.current, { width: rt, height: Vn } = nt.getBoundingClientRect(), bu = window.innerWidth, vu = window.innerHeight, xu = 450, Qb = -450, Jb = 0, Zb = bu - rt + xu, ev = vu - Vn + xu, tv = Math.max(Qb, Math.min(Re, Zb)), nv = Math.max(Jb, Math.min(ze, ev));
      z.current = { x: tv, y: nv }, M.current && (ne && cancelAnimationFrame(ne), ne = requestAnimationFrame(() => {
        M.current && z.current && (M.current.style.left = z.current.x + "px", M.current.style.top = z.current.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(X));
      }));
    }, be = () => {
      ie(!1), z.current && Q({ ...z.current });
    };
    return window.addEventListener("mousemove", re), window.addEventListener("mouseup", be), () => {
      window.removeEventListener("mousemove", re), window.removeEventListener("mouseup", be), ne && cancelAnimationFrame(ne);
    };
  }, [B, X]);
  const S = (ne) => {
    var re, be;
    if (!M.current) return;
    y && x(!1), ne.preventDefault(), ne.stopPropagation();
    const et = M.current, { width: tt, height: Pe } = et.getBoundingClientRect(), Re = window.innerWidth, ze = window.innerHeight;
    let nt = ((re = z.current) == null ? void 0 : re.x) ?? (F == null ? void 0 : F.x), rt = ((be = z.current) == null ? void 0 : be.y) ?? (F == null ? void 0 : F.y);
    (nt === void 0 || rt === void 0) && (h ? (nt = h.x, rt = h.y) : (nt = (Re - tt) / 2, rt = (ze - Pe) / 2)), le.current = { x: nt, y: rt }, D.current = { x: ne.clientX, y: ne.clientY }, ie(!0), !F && !z.current && (Q({ x: nt, y: rt }), z.current = { x: nt, y: rt }, M.current && (M.current.style.left = nt + "px", M.current.style.top = rt + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(X)));
  };
  let E = d;
  if (g) {
    let ne = !1;
    E = Array.isArray(d) ? d.map((re) => {
      if (!ne && wu(re) && (re.type === ml || re.type.displayName === "ModalDragHandle")) {
        ne = !0;
        const be = re;
        return _u(be, {
          children: /* @__PURE__ */ G(
            "div",
            {
              style: { cursor: "move", userSelect: "none" },
              onMouseDown: S,
              children: be.props.children
            }
          )
        });
      }
      return re;
    }) : wu(d) && (d.type === ml || d.type.displayName === "ModalDragHandle") ? (() => {
      const re = d;
      return _u(re, {
        children: /* @__PURE__ */ G(
          "div",
          {
            style: { cursor: "move", userSelect: "none" },
            onMouseDown: S,
            children: re.props.children
          }
        )
      });
    })() : d;
  }
  const $ = De(null), I = De(null), j = (ne, re) => {
    if (!M.current || (ne.preventDefault(), ne.stopPropagation(), y)) return;
    const be = M.current.getBoundingClientRect();
    $.current = re, I.current = {
      mouseX: ne.clientX,
      mouseY: ne.clientY,
      width: be.width,
      height: be.height,
      x: be.left,
      y: be.top
    }, R(!0);
  };
  Fe(() => {
    if (!ae) return;
    let ne = null;
    const re = (et) => {
      if (!M.current || !I.current || !$.current)
        return;
      const tt = et.clientX - I.current.mouseX, Pe = et.clientY - I.current.mouseY;
      let Re = I.current.width, ze = I.current.height, nt = I.current.x, rt = I.current.y;
      const Vn = $.current;
      Vn.includes("right") && (Re = I.current.width + tt), Vn.includes("left") && (Re = I.current.width - tt, nt = I.current.x + tt), Vn.includes("bottom") && (ze = I.current.height + Pe), Vn.includes("top") && (ze = I.current.height - Pe, rt = I.current.y + Pe), Re = Math.max(320, Re), ze = Math.max(240, ze), z.current = { x: nt, y: rt }, Ee.current = { width: Re, height: ze }, ne && cancelAnimationFrame(ne), ne = requestAnimationFrame(() => {
        M.current && z.current && (M.current.style.width = Re + "px", M.current.style.height = ze + "px", M.current.style.left = z.current.x + "px", M.current.style.top = z.current.y + "px", M.current.style.margin = "0", M.current.style.position = "fixed", M.current.style.zIndex = String(X));
      });
    }, be = () => {
      R(!1), z.current && Q({ ...z.current }), Ee.current && ce({ ...Ee.current });
    };
    return window.addEventListener("mousemove", re), window.addEventListener("mouseup", be), () => {
      window.removeEventListener("mousemove", re), window.removeEventListener("mouseup", be), ne && cancelAnimationFrame(ne);
    };
  }, [ae, X]);
  const q = () => {
    if (!m || y) return null;
    const ne = "absolute z-[75] bg-transparent select-none", re = 5, be = 2, et = [
      { dir: "top", className: `top-0 left-0 w-full h-${be}` },
      { dir: "bottom", className: `bottom-0 left-0 w-full h-${be}` },
      { dir: "left", className: `left-0 top-0 h-full w-${be}` },
      { dir: "right", className: `right-0 top-0 h-full w-${be}` },
      {
        dir: "top-left",
        className: `top-0 left-0 w-${re} h-${re}`
      },
      {
        dir: "top-right",
        className: `top-0 right-0 w-${re} h-${re}`
      },
      {
        dir: "bottom-left",
        className: `bottom-0 left-0 w-${re} h-${re}`
      },
      {
        dir: "bottom-right",
        className: `bottom-0 right-0 w-${re} h-${re}`
      }
    ], tt = {
      top: "n-resize",
      bottom: "s-resize",
      left: "w-resize",
      right: "e-resize",
      "top-left": "nw-resize",
      "top-right": "ne-resize",
      "bottom-left": "sw-resize",
      "bottom-right": "se-resize"
    };
    return et.map((Pe) => /* @__PURE__ */ G(
      "div",
      {
        className: `${ne} ${Pe.className}`,
        style: { cursor: tt[Pe.dir] },
        onMouseDown: (Re) => j(Re, Pe.dir)
      },
      Pe.dir
    ));
  }, [w, ce] = dt(
    null
  ), Ee = De(null), Ue = De(null);
  Fe(() => {
    if (e && !w && M.current && m) {
      const { width: ne, height: re } = M.current.getBoundingClientRect();
      ce({ width: ne, height: re }), Ee.current = { width: ne, height: re };
    }
  }, [e, w, m]), Fe(() => {
    if (m) {
      if (!e)
        Ee.current && (Ue.current = { ...Ee.current });
      else if (Ue.current && M.current) {
        const { width: ne, height: re } = Ue.current;
        M.current.style.width = ne + "px", M.current.style.height = re + "px", ce({ width: ne, height: re }), Ee.current = { width: ne, height: re };
      }
    }
  }, [e, m]), Fe(() => {
    const ne = () => {
      M.current && X < $r && ($r += 1, oe($r), M.current.style.zIndex = String($r));
    }, re = M.current;
    return re && re.addEventListener("mousedown", ne), () => {
      re && re.removeEventListener("mousedown", ne);
    };
  }, [X]), Fe(() => {
    if (!e || k) return;
    const ne = (re) => {
      if (re.key === "Escape" || re.key === "Esc") return;
      const be = re.target;
      be && (be.closest(
        '[role="dialog"], [role="menu"], [role="listbox"], [data-headlessui-portal]'
      ) || be.matches("input, textarea, select, button, [contenteditable]")) || re.stopPropagation();
    };
    return window.addEventListener("keydown", ne, !0), () => {
      window.removeEventListener("keydown", ne, !0);
    };
  }, [e, k]), Fe(() => {
    if (!k) return;
    const ne = M.current;
    if (!ne) return;
    const re = (Pe) => {
      Pe && (Pe.hasAttribute("inert") && Pe.removeAttribute("inert"), Pe.inert && (Pe.inert = !1), Pe.getAttribute("aria-hidden") === "true" && Pe.removeAttribute("aria-hidden"));
    };
    let be = ne;
    for (; be; )
      re(be), be = be.parentElement;
    const et = new MutationObserver((Pe) => {
      Pe.forEach((Re) => {
        if (Re.type === "attributes" && Re.attributeName === "inert" && Re.target instanceof HTMLElement) {
          const ze = Re.target;
          (ze === ne || ne.contains(ze)) && re(ze);
        }
      });
    });
    et.observe(ne, {
      attributes: !0,
      subtree: !1,
      attributeFilter: ["inert"]
    }), document.querySelectorAll(
      "[data-radix-portal][inert], [data-headlessui-portal][inert]"
    ).forEach((Pe) => Pe.removeAttribute("inert"));
    const tt = new MutationObserver((Pe) => {
      Pe.forEach((Re) => {
        if (Re.type === "attributes" && Re.attributeName === "inert" && Re.target.hasAttribute("inert")) {
          const ze = Re.target;
          (ze.hasAttribute("data-radix-portal") || ze.hasAttribute("data-headlessui-portal")) && re(ze);
        }
      });
    });
    return tt.observe(document.body, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["inert"]
    }), () => {
      et.disconnect(), tt.disconnect();
    };
  }, [k]);
  const li = De(Math.floor(Math.random() * 1e9));
  Fe(() => {
    if (e)
      return A5({
        id: li.current,
        zIndex: X,
        onClose: a,
        closeOnEsc: _
      }), () => {
        O5(li.current);
      };
  }, [e]), Fe(() => {
    e && S5(li.current, { zIndex: X, onClose: a, closeOnEsc: _ });
  }, [e, X, a, _]);
  const Kb = () => y ? {
    position: "fixed",
    left: 0,
    top: 0,
    margin: 0,
    zIndex: X,
    width: "100vw",
    height: "100vh",
    ...k ? { pointerEvents: "auto" } : {}
  } : !g || !F ? {
    ...m && w ? { width: w.width, height: w.height } : {},
    ...k ? { pointerEvents: "auto" } : {}
  } : {
    position: "fixed",
    left: F.x,
    top: F.y,
    margin: 0,
    zIndex: X,
    ...m && w ? { width: w.width, height: w.height } : {},
    ...k ? { pointerEvents: "auto" } : {}
  };
  return /* @__PURE__ */ G(
    U1,
    {
      open: e,
      onOpenChange: (ne) => !ne && b && a(),
      modal: !k,
      children: /* @__PURE__ */ G(H1, { children: /* @__PURE__ */ He(
        "div",
        {
          className: "fixed inset-0 z-[70]",
          style: k ? { pointerEvents: "none" } : void 0,
          children: [
            !k && O(
              (ne, re) => re ? /* @__PURE__ */ G(
                P5,
                {
                  styles: ne,
                  backdropClassName: f,
                  disableHotkeyInput: s,
                  enableHotkeyInput: o
                },
                "backdrop"
              ) : null
            ),
            k && /* @__PURE__ */ G(
              "div",
              {
                className: Yr("fixed inset-0 z-[69]", f),
                style: { pointerEvents: "none" }
              }
            ),
            /* @__PURE__ */ G(hy.Provider, { value: { expanded: y, toggleExpanded: T }, children: /* @__PURE__ */ G(
              "div",
              {
                className: "flex min-h-full items-center justify-center p-4 text-center",
                style: k ? { pointerEvents: "none" } : void 0,
                children: N((ne, re) => re ? /* @__PURE__ */ G(
                  B1,
                  {
                    forceMount: !0,
                    asChild: !0,
                    ...H ? {} : { "aria-describedby": void 0 },
                    onPointerDownOutside: (be) => {
                      (!b || k) && be.preventDefault();
                    },
                    onEscapeKeyDown: (be) => {
                      _ || be.preventDefault();
                    },
                    onInteractOutside: (be) => {
                      k && be.preventDefault();
                    },
                    children: /* @__PURE__ */ He(
                      py.div,
                      {
                        className: Yr(
                          "w-full max-w-lg rounded-xl relative border border-ui-panel-border bg-ui-modal text-left align-middle shadow-2xl z-[70]",
                          i && !y ? "p-4" : "",
                          l,
                          "!transition-none",
                          // Always disable CSS transitions for spring animations
                          y && "w-screen h-screen max-w-screen max-h-screen rounded-none"
                        ),
                        ref: M,
                        style: {
                          ...Kb(),
                          opacity: ne.opacity,
                          transform: ne.transform,
                          transformOrigin: "center center",
                          willChange: "transform, opacity"
                          // Optimize for animations
                        },
                        children: [
                          /* @__PURE__ */ He("div", { className: "w-full h-full", children: [
                            H && /* @__PURE__ */ G(zd, { asChild: !0, children: /* @__PURE__ */ G(q1, { children: H }) }),
                            t ? /* @__PURE__ */ G(
                              Ru,
                              {
                                className: Yr(
                                  "mb-4 flex justify-between pb-0 text-xl font-bold text-base-fg"
                                ),
                                children: /* @__PURE__ */ G(ft, { children: r ? /* @__PURE__ */ He(
                                  "button",
                                  {
                                    className: "flex items-center gap-3",
                                    onClick: r,
                                    children: [
                                      n && /* @__PURE__ */ G(
                                        sa,
                                        {
                                          icon: n,
                                          className: c
                                        }
                                      ),
                                      t
                                    ]
                                  }
                                ) : /* @__PURE__ */ He("div", { className: "flex items-center gap-3", children: [
                                  n && /* @__PURE__ */ G(
                                    sa,
                                    {
                                      icon: n,
                                      className: c
                                    }
                                  ),
                                  t
                                ] }) })
                              }
                            ) : /* @__PURE__ */ G(zd, { asChild: !0, children: /* @__PURE__ */ G(Ru, { children: v ?? "Dialog" }) }),
                            /* @__PURE__ */ G("div", { className: "h-full".trim(), children: E }),
                            q()
                          ] }),
                          (p || A) && /* @__PURE__ */ He("div", { className: "absolute top-0 right-0 m-2.5 z-[80] flex items-center gap-2", children: [
                            A && /* @__PURE__ */ G(Pa.ExpandButton, {}),
                            p && /* @__PURE__ */ G(Qk, { onClick: a })
                          ] })
                        ]
                      }
                    )
                  }
                ) : null)
              }
            ) })
          ]
        }
      ) })
    }
  );
};
Pa.DragHandle = ml;
Pa.DragHandle.displayName = "ModalDragHandle";
Pa.ExpandButton = Hc;
Hc.displayName = "ModalExpandButton";
async function Dd(e, t = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(e, t, n);
}
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function C5(e, t, n) {
  return (t = T5(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Fd(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function V(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Fd(Object(n), !0).forEach(function(r) {
      C5(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Fd(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function N5(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function T5(e) {
  var t = N5(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Ld = () => {
};
let Gc = {}, gy = {}, yy = null, by = {
  mark: Ld,
  measure: Ld
};
try {
  typeof window < "u" && (Gc = window), typeof document < "u" && (gy = document), typeof MutationObserver < "u" && (yy = MutationObserver), typeof performance < "u" && (by = performance);
} catch {
}
const {
  userAgent: Wd = ""
} = Gc.navigator || {}, vn = Gc, je = gy, Vd = yy, Ha = by;
vn.document;
const Gt = !!je.documentElement && !!je.head && typeof je.addEventListener == "function" && typeof je.createElement == "function", vy = ~Wd.indexOf("MSIE") || ~Wd.indexOf("Trident/");
var I5 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, $5 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, xy = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, j5 = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, wy = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ve = "classic", Qo = "duotone", M5 = "sharp", R5 = "sharp-duotone", _y = [Ve, Qo, M5, R5], z5 = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, D5 = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, F5 = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), L5 = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
}, W5 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Yd = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, V5 = ["kit"], Y5 = {
  kit: {
    "fa-kit": "fak"
  }
}, U5 = ["fak", "fakd"], H5 = {
  kit: {
    fak: "fa-kit"
  }
}, Ud = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Ga = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, G5 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], B5 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], q5 = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, X5 = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, K5 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, hl = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, Q5 = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], gl = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...G5, ...Q5], J5 = ["solid", "regular", "light", "thin", "duotone", "brands"], ky = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Z5 = ky.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), eO = [...Object.keys(K5), ...J5, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ga.GROUP, Ga.SWAP_OPACITY, Ga.PRIMARY, Ga.SECONDARY].concat(ky.map((e) => "".concat(e, "x"))).concat(Z5.map((e) => "w-".concat(e))), tO = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const Ft = "___FONT_AWESOME___", yl = 16, Ay = "fa", Oy = "svg-inline--fa", zn = "data-fa-i2svg", bl = "data-fa-pseudo-element", nO = "data-fa-pseudo-element-pending", Bc = "data-prefix", qc = "data-icon", Hd = "fontawesome-i2svg", rO = "async", aO = ["HTML", "HEAD", "STYLE", "SCRIPT"], Sy = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Ca(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Ve];
    }
  });
}
const Ey = V({}, xy);
Ey[Ve] = V(V(V(V({}, {
  "fa-duotone": "duotone"
}), xy[Ve]), Yd.kit), Yd["kit-duotone"]);
const oO = Ca(Ey), vl = V({}, L5);
vl[Ve] = V(V(V(V({}, {
  duotone: "fad"
}), vl[Ve]), Ud.kit), Ud["kit-duotone"]);
const Gd = Ca(vl), xl = V({}, hl);
xl[Ve] = V(V({}, xl[Ve]), H5.kit);
const Xc = Ca(xl), wl = V({}, X5);
wl[Ve] = V(V({}, wl[Ve]), Y5.kit);
Ca(wl);
const iO = I5, Py = "fa-layers-text", sO = $5, lO = V({}, z5);
Ca(lO);
const cO = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Xi = j5, uO = [...V5, ...eO], Jr = vn.FontAwesomeConfig || {};
function fO(e) {
  var t = je.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function dO(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
je && typeof je.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const a = dO(fO(n));
  a != null && (Jr[r] = a);
});
const Cy = {
  styleDefault: "solid",
  familyDefault: Ve,
  cssPrefix: Ay,
  replacementClass: Oy,
  autoReplaceSvg: !0,
  autoAddCss: !0,
  autoA11y: !0,
  searchPseudoElements: !1,
  observeMutations: !0,
  mutateApproach: "async",
  keepOriginalSource: !0,
  measurePerformance: !1,
  showMissingIcons: !0
};
Jr.familyPrefix && (Jr.cssPrefix = Jr.familyPrefix);
const gr = V(V({}, Cy), Jr);
gr.autoReplaceSvg || (gr.observeMutations = !1);
const ee = {};
Object.keys(Cy).forEach((e) => {
  Object.defineProperty(ee, e, {
    enumerable: !0,
    set: function(t) {
      gr[e] = t, Zr.forEach((n) => n(ee));
    },
    get: function() {
      return gr[e];
    }
  });
});
Object.defineProperty(ee, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    gr.cssPrefix = e, Zr.forEach((t) => t(ee));
  },
  get: function() {
    return gr.cssPrefix;
  }
});
vn.FontAwesomeConfig = ee;
const Zr = [];
function pO(e) {
  return Zr.push(e), () => {
    Zr.splice(Zr.indexOf(e), 1);
  };
}
const tn = yl, _t = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function mO(e) {
  if (!e || !Gt)
    return;
  const t = je.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = je.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], s = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(s) > -1 && (r = o);
  }
  return je.head.insertBefore(t, r), e;
}
const hO = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function ba() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += hO[Math.random() * 62 | 0];
  return t;
}
function kr(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Kc(e) {
  return e.classList ? kr(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Ny(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function gO(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Ny(e[n]), '" '), "").trim();
}
function Jo(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Qc(e) {
  return e.size !== _t.size || e.x !== _t.x || e.y !== _t.y || e.rotate !== _t.rotate || e.flipX || e.flipY;
}
function yO(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), s = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), l = "rotate(".concat(t.rotate, " 0 0)"), f = {
    transform: "".concat(o, " ").concat(s, " ").concat(l)
  }, u = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: f,
    path: u
  };
}
function bO(e) {
  let {
    transform: t,
    width: n = yl,
    height: r = yl,
    startCentered: a = !1
  } = e, o = "";
  return a && vy ? o += "translate(".concat(t.x / tn - n / 2, "em, ").concat(t.y / tn - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / tn, "em), calc(-50% + ").concat(t.y / tn, "em)) ") : o += "translate(".concat(t.x / tn, "em, ").concat(t.y / tn, "em) "), o += "scale(".concat(t.size / tn * (t.flipX ? -1 : 1), ", ").concat(t.size / tn * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var vO = `:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;
function Ty() {
  const e = Ay, t = Oy, n = ee.cssPrefix, r = ee.replacementClass;
  let a = vO;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), s = new RegExp("\\--".concat(e, "\\-"), "g"), l = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(s, "--".concat(n, "-")).replace(l, ".".concat(r));
  }
  return a;
}
let Bd = !1;
function Ki() {
  ee.autoAddCss && !Bd && (mO(Ty()), Bd = !0);
}
var xO = {
  mixout() {
    return {
      dom: {
        css: Ty,
        insertCss: Ki
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Ki();
      },
      beforeI2svg() {
        Ki();
      }
    };
  }
};
const Lt = vn || {};
Lt[Ft] || (Lt[Ft] = {});
Lt[Ft].styles || (Lt[Ft].styles = {});
Lt[Ft].hooks || (Lt[Ft].hooks = {});
Lt[Ft].shims || (Lt[Ft].shims = []);
var kt = Lt[Ft];
const Iy = [], $y = function() {
  je.removeEventListener("DOMContentLoaded", $y), Ao = 1, Iy.map((e) => e());
};
let Ao = !1;
Gt && (Ao = (je.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(je.readyState), Ao || je.addEventListener("DOMContentLoaded", $y));
function wO(e) {
  Gt && (Ao ? setTimeout(e, 0) : Iy.push(e));
}
function Na(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Ny(e) : "<".concat(t, " ").concat(gO(n), ">").concat(r.map(Na).join(""), "</").concat(t, ">");
}
function qd(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Qi = function(t, n, r, a) {
  var o = Object.keys(t), s = o.length, l = n, f, u, d;
  for (r === void 0 ? (f = 1, d = t[o[0]]) : (f = 0, d = r); f < s; f++)
    u = o[f], d = l(d, t[u], u, t);
  return d;
};
function _O(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const a = e.charCodeAt(n++);
    if (a >= 55296 && a <= 56319 && n < r) {
      const o = e.charCodeAt(n++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), n--);
    } else
      t.push(a);
  }
  return t;
}
function _l(e) {
  const t = _O(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function kO(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function Xd(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function kl(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = Xd(t);
  typeof kt.hooks.addPack == "function" && !r ? kt.hooks.addPack(e, Xd(t)) : kt.styles[e] = V(V({}, kt.styles[e] || {}), a), e === "fas" && kl("fa", t);
}
const {
  styles: va,
  shims: AO
} = kt, jy = Object.keys(Xc), OO = jy.reduce((e, t) => (e[t] = Object.keys(Xc[t]), e), {});
let Jc = null, My = {}, Ry = {}, zy = {}, Dy = {}, Fy = {};
function SO(e) {
  return ~uO.indexOf(e);
}
function EO(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !SO(a) ? a : null;
}
const Ly = () => {
  const e = (r) => Qi(va, (a, o, s) => (a[s] = Qi(o, r, {}), a), {});
  My = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((l) => typeof l == "number").forEach((l) => {
    r[l.toString(16)] = o;
  }), r)), Ry = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((l) => typeof l == "string").forEach((l) => {
    r[l] = o;
  }), r)), Fy = e((r, a, o) => {
    const s = a[2];
    return r[o] = o, s.forEach((l) => {
      r[l] = o;
    }), r;
  });
  const t = "far" in va || ee.autoFetchSvg, n = Qi(AO, (r, a) => {
    const o = a[0];
    let s = a[1];
    const l = a[2];
    return s === "far" && !t && (s = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: s,
      iconName: l
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: s,
      iconName: l
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  zy = n.names, Dy = n.unicodes, Jc = Zo(ee.styleDefault, {
    family: ee.familyDefault
  });
};
pO((e) => {
  Jc = Zo(e.styleDefault, {
    family: ee.familyDefault
  });
});
Ly();
function Zc(e, t) {
  return (My[e] || {})[t];
}
function PO(e, t) {
  return (Ry[e] || {})[t];
}
function Cn(e, t) {
  return (Fy[e] || {})[t];
}
function Wy(e) {
  return zy[e] || {
    prefix: null,
    iconName: null
  };
}
function CO(e) {
  const t = Dy[e], n = Zc("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function xn() {
  return Jc;
}
const Vy = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function NO(e) {
  let t = Ve;
  const n = jy.reduce((r, a) => (r[a] = "".concat(ee.cssPrefix, "-").concat(a), r), {});
  return _y.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => OO[r].includes(a))) && (t = r);
  }), t;
}
function Zo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Ve
  } = t, r = oO[n][e];
  if (n === Qo && !e)
    return "fad";
  const a = Gd[n][e] || Gd[n][r], o = e in kt.styles ? e : null;
  return a || o || null;
}
function TO(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = EO(ee.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Kd(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function ei(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = gl.concat(B5), o = Kd(e.filter((i) => a.includes(i))), s = Kd(e.filter((i) => !gl.includes(i))), l = o.filter((i) => (r = i, !wy.includes(i))), [f = null] = l, u = NO(o), d = V(V({}, TO(s)), {}, {
    prefix: Zo(f, {
      family: u
    })
  });
  return V(V(V({}, d), MO({
    values: e,
    family: u,
    styles: va,
    config: ee,
    canonical: d,
    givenPrefix: r
  })), IO(n, r, d));
}
function IO(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? Wy(a) : {}, s = Cn(r, a);
  return a = o.iconName || s || a, r = o.prefix || r, r === "far" && !va.far && va.fas && !ee.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const $O = _y.filter((e) => e !== Ve || e !== Qo), jO = Object.keys(hl).filter((e) => e !== Ve).map((e) => Object.keys(hl[e])).flat();
function MO(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: s = {}
  } = e, l = n === Qo, f = t.includes("fa-duotone") || t.includes("fad"), u = s.familyDefault === "duotone", d = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!l && (f || u || d) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && $O.includes(n) && (Object.keys(o).find((c) => jO.includes(c)) || s.autoFetchSvg)) {
    const c = F5.get(n).defaultShortPrefixId;
    r.prefix = c, r.iconName = Cn(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = xn() || "fas"), r;
}
class RO {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = V(V({}, this.definitions[o] || {}), a[o]), kl(o, a[o]);
      const s = Xc[Ve][o];
      s && kl(s, a[o]), Ly();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((a) => {
      const {
        prefix: o,
        iconName: s,
        icon: l
      } = r[a], f = l[2];
      t[o] || (t[o] = {}), f.length > 0 && f.forEach((u) => {
        typeof u == "string" && (t[o][u] = l);
      }), t[o][s] = l;
    }), t;
  }
}
let Qd = [], Zn = {};
const ur = {}, zO = Object.keys(ur);
function DO(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Qd = e, Zn = {}, Object.keys(ur).forEach((r) => {
    zO.indexOf(r) === -1 && delete ur[r];
  }), Qd.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((s) => {
        n[o] || (n[o] = {}), n[o][s] = a[o][s];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((s) => {
        Zn[s] || (Zn[s] = []), Zn[s].push(o[s]);
      });
    }
    r.provides && r.provides(ur);
  }), n;
}
function Al(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Zn[e] || []).forEach((s) => {
    t = s.apply(null, [t, ...r]);
  }), t;
}
function Dn(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Zn[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function wn() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return ur[e] ? ur[e].apply(null, t) : void 0;
}
function Ol(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || xn();
  if (t)
    return t = Cn(n, t) || t, qd(Yy.definitions, n, t) || qd(kt.styles, n, t);
}
const Yy = new RO(), FO = () => {
  ee.autoReplaceSvg = !1, ee.observeMutations = !1, Dn("noAuto");
}, LO = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Gt ? (Dn("beforeI2svg", e), wn("pseudoElements2svg", e), wn("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    ee.autoReplaceSvg === !1 && (ee.autoReplaceSvg = !0), ee.observeMutations = !0, wO(() => {
      VO({
        autoReplaceSvgRoot: t
      }), Dn("watch", e);
    });
  }
}, WO = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Cn(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Zo(e[0]);
      return {
        prefix: n,
        iconName: Cn(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(ee.cssPrefix, "-")) > -1 || e.match(iO))) {
      const t = ei(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || xn(),
        iconName: Cn(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = xn();
      return {
        prefix: t,
        iconName: Cn(t, e) || e
      };
    }
  }
}, Je = {
  noAuto: FO,
  config: ee,
  dom: LO,
  parse: WO,
  library: Yy,
  findIconDefinition: Ol,
  toHtml: Na
}, VO = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = je
  } = e;
  (Object.keys(kt.styles).length > 0 || ee.autoFetchSvg) && Gt && ee.autoReplaceSvg && Je.dom.i2svg({
    node: t
  });
};
function ti(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Na(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Gt) return;
      const n = je.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function YO(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: s
  } = e;
  if (Qc(s) && n.found && !r.found) {
    const {
      width: l,
      height: f
    } = n, u = {
      x: l / f / 2,
      y: 0.5
    };
    a.style = Jo(V(V({}, o), {}, {
      "transform-origin": "".concat(u.x + s.x / 16, "em ").concat(u.y + s.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function UO(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const s = o === !0 ? "".concat(t, "-").concat(ee.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: V(V({}, a), {}, {
        id: s
      }),
      children: r
    }]
  }];
}
function eu(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: s,
    title: l,
    maskId: f,
    titleId: u,
    extra: d,
    watchable: i = !1
  } = e, {
    width: c,
    height: p
  } = n.found ? n : t, g = U5.includes(r), m = [ee.replacementClass, a ? "".concat(ee.cssPrefix, "-").concat(a) : ""].filter((v) => d.classes.indexOf(v) === -1).filter((v) => v !== "" || !!v).concat(d.classes).join(" ");
  let h = {
    children: [],
    attributes: V(V({}, d.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: m,
      role: d.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(c, " ").concat(p)
    })
  };
  const b = g && !~d.classes.indexOf("fa-fw") ? {
    width: "".concat(c / p * 16 * 0.0625, "em")
  } : {};
  i && (h.attributes[zn] = ""), l && (h.children.push({
    tag: "title",
    attributes: {
      id: h.attributes["aria-labelledby"] || "title-".concat(u || ba())
    },
    children: [l]
  }), delete h.attributes.title);
  const _ = V(V({}, h), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: f,
    transform: o,
    symbol: s,
    styles: V(V({}, b), d.styles)
  }), {
    children: k,
    attributes: A
  } = n.found && t.found ? wn("generateAbstractMask", _) || {
    children: [],
    attributes: {}
  } : wn("generateAbstractIcon", _) || {
    children: [],
    attributes: {}
  };
  return _.children = k, _.attributes = A, s ? UO(_) : YO(_);
}
function Jd(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: s,
    watchable: l = !1
  } = e, f = V(V(V({}, s.attributes), o ? {
    title: o
  } : {}), {}, {
    class: s.classes.join(" ")
  });
  l && (f[zn] = "");
  const u = V({}, s.styles);
  Qc(a) && (u.transform = bO({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), u["-webkit-transform"] = u.transform);
  const d = Jo(u);
  d.length > 0 && (f.style = d);
  const i = [];
  return i.push({
    tag: "span",
    attributes: f,
    children: [t]
  }), o && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), i;
}
function HO(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = V(V(V({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = Jo(r.styles);
  o.length > 0 && (a.style = o);
  const s = [];
  return s.push({
    tag: "span",
    attributes: a,
    children: [t]
  }), n && s.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), s;
}
const {
  styles: Ji
} = kt;
function Sl(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(ee.cssPrefix, "-").concat(Xi.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(ee.cssPrefix, "-").concat(Xi.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(ee.cssPrefix, "-").concat(Xi.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: a
  };
}
const GO = {
  found: !1,
  width: 512,
  height: 512
};
function BO(e, t) {
  !Sy && !ee.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function El(e, t) {
  let n = t;
  return t === "fa" && ee.styleDefault !== null && (t = xn()), new Promise((r, a) => {
    if (n === "fa") {
      const o = Wy(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && Ji[t] && Ji[t][e]) {
      const o = Ji[t][e];
      return r(Sl(o));
    }
    BO(e, t), r(V(V({}, GO), {}, {
      icon: ee.showMissingIcons && e ? wn("missingIconAbstract") || {} : {}
    }));
  });
}
const Zd = () => {
}, Pl = ee.measurePerformance && Ha && Ha.mark && Ha.measure ? Ha : {
  mark: Zd,
  measure: Zd
}, Lr = 'FA "6.7.2"', qO = (e) => (Pl.mark("".concat(Lr, " ").concat(e, " begins")), () => Uy(e)), Uy = (e) => {
  Pl.mark("".concat(Lr, " ").concat(e, " ends")), Pl.measure("".concat(Lr, " ").concat(e), "".concat(Lr, " ").concat(e, " begins"), "".concat(Lr, " ").concat(e, " ends"));
};
var tu = {
  begin: qO,
  end: Uy
};
const io = () => {
};
function ep(e) {
  return typeof (e.getAttribute ? e.getAttribute(zn) : null) == "string";
}
function XO(e) {
  const t = e.getAttribute ? e.getAttribute(Bc) : null, n = e.getAttribute ? e.getAttribute(qc) : null;
  return t && n;
}
function KO(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(ee.replacementClass);
}
function QO() {
  return ee.autoReplaceSvg === !0 ? so.replace : so[ee.autoReplaceSvg] || so.replace;
}
function JO(e) {
  return je.createElementNS("http://www.w3.org/2000/svg", e);
}
function ZO(e) {
  return je.createElement(e);
}
function Hy(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? JO : ZO
  } = t;
  if (typeof e == "string")
    return je.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(Hy(o, {
      ceFn: n
    }));
  }), r;
}
function eS(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const so = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Hy(n), t);
      }), t.getAttribute(zn) === null && ee.keepOriginalSource) {
        let n = je.createComment(eS(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Kc(t).indexOf(ee.replacementClass))
      return so.replace(e);
    const r = new RegExp("".concat(ee.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((s, l) => (l === ee.replacementClass || l.match(r) ? s.toSvg.push(l) : s.toNode.push(l), s), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => Na(o)).join(`
`);
    t.setAttribute(zn, ""), t.innerHTML = a;
  }
};
function tp(e) {
  e();
}
function Gy(e, t) {
  const n = typeof t == "function" ? t : io;
  if (e.length === 0)
    n();
  else {
    let r = tp;
    ee.mutateApproach === rO && (r = vn.requestAnimationFrame || tp), r(() => {
      const a = QO(), o = tu.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let nu = !1;
function By() {
  nu = !0;
}
function Cl() {
  nu = !1;
}
let Oo = null;
function np(e) {
  if (!Vd || !ee.observeMutations)
    return;
  const {
    treeCallback: t = io,
    nodeCallback: n = io,
    pseudoElementsCallback: r = io,
    observeMutationsRoot: a = je
  } = e;
  Oo = new Vd((o) => {
    if (nu) return;
    const s = xn();
    kr(o).forEach((l) => {
      if (l.type === "childList" && l.addedNodes.length > 0 && !ep(l.addedNodes[0]) && (ee.searchPseudoElements && r(l.target), t(l.target)), l.type === "attributes" && l.target.parentNode && ee.searchPseudoElements && r(l.target.parentNode), l.type === "attributes" && ep(l.target) && ~cO.indexOf(l.attributeName))
        if (l.attributeName === "class" && XO(l.target)) {
          const {
            prefix: f,
            iconName: u
          } = ei(Kc(l.target));
          l.target.setAttribute(Bc, f || s), u && l.target.setAttribute(qc, u);
        } else KO(l.target) && n(l.target);
    });
  }), Gt && Oo.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function tS() {
  Oo && Oo.disconnect();
}
function nS(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), s = o[0], l = o.slice(1);
    return s && l.length > 0 && (r[s] = l.join(":").trim()), r;
  }, {})), n;
}
function rS(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = ei(Kc(e));
  return a.prefix || (a.prefix = xn()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = PO(a.prefix, e.innerText) || Zc(a.prefix, _l(e.innerText))), !a.iconName && ee.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function aS(e) {
  const t = kr(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return ee.autoA11y && (n ? t["aria-labelledby"] = "".concat(ee.replacementClass, "-title-").concat(r || ba()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function oS() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: _t,
    symbol: !1,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function rp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = rS(e), o = aS(e), s = Al("parseNodeAttributes", {}, e);
  let l = t.styleParser ? nS(e) : [];
  return V({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: _t,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: l,
      attributes: o
    }
  }, s);
}
const {
  styles: iS
} = kt;
function qy(e) {
  const t = ee.autoReplaceSvg === "nest" ? rp(e, {
    styleParser: !1
  }) : rp(e);
  return ~t.extra.classes.indexOf(Py) ? wn("generateLayersText", e, t) : wn("generateSvgReplacementMutation", e, t);
}
function sS() {
  return [...W5, ...gl];
}
function ap(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Gt) return Promise.resolve();
  const n = je.documentElement.classList, r = (d) => n.add("".concat(Hd, "-").concat(d)), a = (d) => n.remove("".concat(Hd, "-").concat(d)), o = ee.autoFetchSvg ? sS() : wy.concat(Object.keys(iS));
  o.includes("fa") || o.push("fa");
  const s = [".".concat(Py, ":not([").concat(zn, "])")].concat(o.map((d) => ".".concat(d, ":not([").concat(zn, "])"))).join(", ");
  if (s.length === 0)
    return Promise.resolve();
  let l = [];
  try {
    l = kr(e.querySelectorAll(s));
  } catch {
  }
  if (l.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const f = tu.begin("onTree"), u = l.reduce((d, i) => {
    try {
      const c = qy(i);
      c && d.push(c);
    } catch (c) {
      Sy || c.name === "MissingIcon" && console.error(c);
    }
    return d;
  }, []);
  return new Promise((d, i) => {
    Promise.all(u).then((c) => {
      Gy(c, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), f(), d();
      });
    }).catch((c) => {
      f(), i(c);
    });
  });
}
function lS(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  qy(e).then((n) => {
    n && Gy([n], t);
  });
}
function cS(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Ol(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Ol(a || {})), e(r, V(V({}, n), {}, {
      mask: a
    }));
  };
}
const uS = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = _t,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: s = null,
    titleId: l = null,
    classes: f = [],
    attributes: u = {},
    styles: d = {}
  } = t;
  if (!e) return;
  const {
    prefix: i,
    iconName: c,
    icon: p
  } = e;
  return ti(V({
    type: "icon"
  }, e), () => (Dn("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), ee.autoA11y && (s ? u["aria-labelledby"] = "".concat(ee.replacementClass, "-title-").concat(l || ba()) : (u["aria-hidden"] = "true", u.focusable = "false")), eu({
    icons: {
      main: Sl(p),
      mask: a ? Sl(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: i,
    iconName: c,
    transform: V(V({}, _t), n),
    symbol: r,
    title: s,
    maskId: o,
    titleId: l,
    extra: {
      attributes: u,
      styles: d,
      classes: f
    }
  })));
};
var fS = {
  mixout() {
    return {
      icon: cS(uS)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = ap, e.nodeCallback = lS, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = je,
        callback: r = () => {
        }
      } = t;
      return ap(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: s,
        transform: l,
        symbol: f,
        mask: u,
        maskId: d,
        extra: i
      } = n;
      return new Promise((c, p) => {
        Promise.all([El(r, s), u.iconName ? El(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((g) => {
          let [m, h] = g;
          c([t, eu({
            icons: {
              main: m,
              mask: h
            },
            prefix: s,
            iconName: r,
            transform: l,
            symbol: f,
            maskId: d,
            title: a,
            titleId: o,
            extra: i,
            watchable: !0
          })]);
        }).catch(p);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: s
      } = t;
      const l = Jo(s);
      l.length > 0 && (r.style = l);
      let f;
      return Qc(o) && (f = wn("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(f || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, dS = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return ti({
          type: "layer"
        }, () => {
          Dn("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              r = r.concat(o.abstract);
            }) : r = r.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(ee.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, pS = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return ti({
          type: "counter",
          content: e
        }, () => (Dn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), HO({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(ee.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, mS = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = _t,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: s = {}
        } = t;
        return ti({
          type: "text",
          content: e
        }, () => (Dn("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Jd({
          content: e,
          transform: V(V({}, _t), n),
          title: r,
          extra: {
            attributes: o,
            styles: s,
            classes: ["".concat(ee.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: a,
        extra: o
      } = n;
      let s = null, l = null;
      if (vy) {
        const f = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        s = u.width / f, l = u.height / f;
      }
      return ee.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Jd({
        content: t.innerHTML,
        width: s,
        height: l,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const hS = new RegExp('"', "ug"), op = [1105920, 1112319], ip = V(V(V(V({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), D5), tO), q5), Nl = Object.keys(ip).reduce((e, t) => (e[t.toLowerCase()] = ip[t], e), {}), gS = Object.keys(Nl).reduce((e, t) => {
  const n = Nl[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function yS(e) {
  const t = e.replace(hS, ""), n = kO(t, 0), r = n >= op[0] && n <= op[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: _l(a ? t[0] : t),
    isSecondary: r || a
  };
}
function bS(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (Nl[n] || {})[a] || gS[n];
}
function sp(e, t) {
  const n = "".concat(nO).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const s = kr(e.children).filter((c) => c.getAttribute(bl) === t)[0], l = vn.getComputedStyle(e, t), f = l.getPropertyValue("font-family"), u = f.match(sO), d = l.getPropertyValue("font-weight"), i = l.getPropertyValue("content");
    if (s && !u)
      return e.removeChild(s), r();
    if (u && i !== "none" && i !== "") {
      const c = l.getPropertyValue("content");
      let p = bS(f, d);
      const {
        value: g,
        isSecondary: m
      } = yS(c), h = u[0].startsWith("FontAwesome");
      let b = Zc(p, g), _ = b;
      if (h) {
        const k = CO(g);
        k.iconName && k.prefix && (b = k.iconName, p = k.prefix);
      }
      if (b && !m && (!s || s.getAttribute(Bc) !== p || s.getAttribute(qc) !== _)) {
        e.setAttribute(n, _), s && e.removeChild(s);
        const k = oS(), {
          extra: A
        } = k;
        A.attributes[bl] = t, El(b, p).then((v) => {
          const H = eu(V(V({}, k), {}, {
            icons: {
              main: v,
              mask: Vy()
            },
            prefix: p,
            iconName: _,
            extra: A,
            watchable: !0
          })), F = je.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(F, e.firstChild) : e.appendChild(F), F.outerHTML = H.map((Q) => Na(Q)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function vS(e) {
  return Promise.all([sp(e, "::before"), sp(e, "::after")]);
}
function xS(e) {
  return e.parentNode !== document.head && !~aO.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(bl) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function lp(e) {
  if (Gt)
    return new Promise((t, n) => {
      const r = kr(e.querySelectorAll("*")).filter(xS).map(vS), a = tu.begin("searchPseudoElements");
      By(), Promise.all(r).then(() => {
        a(), Cl(), t();
      }).catch(() => {
        a(), Cl(), n();
      });
    });
}
var wS = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = lp, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = je
      } = t;
      ee.searchPseudoElements && lp(n);
    };
  }
};
let cp = !1;
var _S = {
  mixout() {
    return {
      dom: {
        unwatch() {
          By(), cp = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        np(Al("mutationObserverCallbacks", {}));
      },
      noAuto() {
        tS();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        cp ? Cl() : np(Al("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const up = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const a = r.toLowerCase().split("-"), o = a[0];
    let s = a.slice(1).join("-");
    if (o && s === "h")
      return n.flipX = !0, n;
    if (o && s === "v")
      return n.flipY = !0, n;
    if (s = parseFloat(s), isNaN(s))
      return n;
    switch (o) {
      case "grow":
        n.size = n.size + s;
        break;
      case "shrink":
        n.size = n.size - s;
        break;
      case "left":
        n.x = n.x - s;
        break;
      case "right":
        n.x = n.x + s;
        break;
      case "up":
        n.y = n.y - s;
        break;
      case "down":
        n.y = n.y + s;
        break;
      case "rotate":
        n.rotate = n.rotate + s;
        break;
    }
    return n;
  }, t);
};
var kS = {
  mixout() {
    return {
      parse: {
        transform: (e) => up(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = up(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: a,
        iconWidth: o
      } = t;
      const s = {
        transform: "translate(".concat(a / 2, " 256)")
      }, l = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), f = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), u = "rotate(".concat(r.rotate, " 0 0)"), d = {
        transform: "".concat(l, " ").concat(f, " ").concat(u)
      }, i = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, c = {
        outer: s,
        inner: d,
        path: i
      };
      return {
        tag: "g",
        attributes: V({}, c.outer),
        children: [{
          tag: "g",
          attributes: V({}, c.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: V(V({}, n.icon.attributes), c.path)
          }]
        }]
      };
    };
  }
};
const Zi = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function fp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function AS(e) {
  return e.tag === "g" ? e.children : [e];
}
var OS = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? ei(n.split(" ").map((a) => a.trim())) : Vy();
        return r.prefix || (r.prefix = xn()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        mask: o,
        maskId: s,
        transform: l
      } = t;
      const {
        width: f,
        icon: u
      } = a, {
        width: d,
        icon: i
      } = o, c = yO({
        transform: l,
        containerWidth: d,
        iconWidth: f
      }), p = {
        tag: "rect",
        attributes: V(V({}, Zi), {}, {
          fill: "white"
        })
      }, g = u.children ? {
        children: u.children.map(fp)
      } : {}, m = {
        tag: "g",
        attributes: V({}, c.inner),
        children: [fp(V({
          tag: u.tag,
          attributes: V(V({}, u.attributes), c.path)
        }, g))]
      }, h = {
        tag: "g",
        attributes: V({}, c.outer),
        children: [m]
      }, b = "mask-".concat(s || ba()), _ = "clip-".concat(s || ba()), k = {
        tag: "mask",
        attributes: V(V({}, Zi), {}, {
          id: b,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, h]
      }, A = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: _
          },
          children: AS(i)
        }, k]
      };
      return n.push(A, {
        tag: "rect",
        attributes: V({
          fill: "currentColor",
          "clip-path": "url(#".concat(_, ")"),
          mask: "url(#".concat(b, ")")
        }, Zi)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, SS = {
  provides(e) {
    let t = !1;
    vn.matchMedia && (t = vn.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: V(V({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = V(V({}, a), {}, {
        attributeName: "opacity"
      }), s = {
        tag: "circle",
        attributes: V(V({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || s.children.push({
        tag: "animate",
        attributes: V(V({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: V(V({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(s), n.push({
        tag: "path",
        attributes: V(V({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: V(V({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: V(V({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: V(V({}, o), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: n
      };
    };
  }
}, ES = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, PS = [xO, fS, dS, pS, mS, wS, _S, kS, OS, SS, ES];
DO(PS, {
  mixoutsTo: Je
});
Je.noAuto;
Je.config;
Je.library;
Je.dom;
const Tl = Je.parse;
Je.findIconDefinition;
Je.toHtml;
const CS = Je.icon;
Je.layer;
Je.text;
Je.counter;
function NS(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Ba = { exports: {} }, qa = { exports: {} }, we = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var dp;
function TS() {
  if (dp) return we;
  dp = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
  function k(v) {
    if (typeof v == "object" && v !== null) {
      var H = v.$$typeof;
      switch (H) {
        case t:
          switch (v = v.type, v) {
            case f:
            case u:
            case r:
            case o:
            case a:
            case i:
              return v;
            default:
              switch (v = v && v.$$typeof, v) {
                case l:
                case d:
                case g:
                case p:
                case s:
                  return v;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function A(v) {
    return k(v) === u;
  }
  return we.AsyncMode = f, we.ConcurrentMode = u, we.ContextConsumer = l, we.ContextProvider = s, we.Element = t, we.ForwardRef = d, we.Fragment = r, we.Lazy = g, we.Memo = p, we.Portal = n, we.Profiler = o, we.StrictMode = a, we.Suspense = i, we.isAsyncMode = function(v) {
    return A(v) || k(v) === f;
  }, we.isConcurrentMode = A, we.isContextConsumer = function(v) {
    return k(v) === l;
  }, we.isContextProvider = function(v) {
    return k(v) === s;
  }, we.isElement = function(v) {
    return typeof v == "object" && v !== null && v.$$typeof === t;
  }, we.isForwardRef = function(v) {
    return k(v) === d;
  }, we.isFragment = function(v) {
    return k(v) === r;
  }, we.isLazy = function(v) {
    return k(v) === g;
  }, we.isMemo = function(v) {
    return k(v) === p;
  }, we.isPortal = function(v) {
    return k(v) === n;
  }, we.isProfiler = function(v) {
    return k(v) === o;
  }, we.isStrictMode = function(v) {
    return k(v) === a;
  }, we.isSuspense = function(v) {
    return k(v) === i;
  }, we.isValidElementType = function(v) {
    return typeof v == "string" || typeof v == "function" || v === r || v === u || v === o || v === a || v === i || v === c || typeof v == "object" && v !== null && (v.$$typeof === g || v.$$typeof === p || v.$$typeof === s || v.$$typeof === l || v.$$typeof === d || v.$$typeof === h || v.$$typeof === b || v.$$typeof === _ || v.$$typeof === m);
  }, we.typeOf = k, we;
}
var _e = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var pp;
function IS() {
  return pp || (pp = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
    function k(w) {
      return typeof w == "string" || typeof w == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      w === r || w === u || w === o || w === a || w === i || w === c || typeof w == "object" && w !== null && (w.$$typeof === g || w.$$typeof === p || w.$$typeof === s || w.$$typeof === l || w.$$typeof === d || w.$$typeof === h || w.$$typeof === b || w.$$typeof === _ || w.$$typeof === m);
    }
    function A(w) {
      if (typeof w == "object" && w !== null) {
        var ce = w.$$typeof;
        switch (ce) {
          case t:
            var Ee = w.type;
            switch (Ee) {
              case f:
              case u:
              case r:
              case o:
              case a:
              case i:
                return Ee;
              default:
                var Ue = Ee && Ee.$$typeof;
                switch (Ue) {
                  case l:
                  case d:
                  case g:
                  case p:
                  case s:
                    return Ue;
                  default:
                    return ce;
                }
            }
          case n:
            return ce;
        }
      }
    }
    var v = f, H = u, F = l, Q = s, B = t, ie = d, ae = r, R = g, le = p, D = n, M = o, z = a, K = i, X = !1;
    function oe(w) {
      return X || (X = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), y(w) || A(w) === f;
    }
    function y(w) {
      return A(w) === u;
    }
    function x(w) {
      return A(w) === l;
    }
    function P(w) {
      return A(w) === s;
    }
    function N(w) {
      return typeof w == "object" && w !== null && w.$$typeof === t;
    }
    function O(w) {
      return A(w) === d;
    }
    function T(w) {
      return A(w) === r;
    }
    function S(w) {
      return A(w) === g;
    }
    function E(w) {
      return A(w) === p;
    }
    function $(w) {
      return A(w) === n;
    }
    function I(w) {
      return A(w) === o;
    }
    function j(w) {
      return A(w) === a;
    }
    function q(w) {
      return A(w) === i;
    }
    _e.AsyncMode = v, _e.ConcurrentMode = H, _e.ContextConsumer = F, _e.ContextProvider = Q, _e.Element = B, _e.ForwardRef = ie, _e.Fragment = ae, _e.Lazy = R, _e.Memo = le, _e.Portal = D, _e.Profiler = M, _e.StrictMode = z, _e.Suspense = K, _e.isAsyncMode = oe, _e.isConcurrentMode = y, _e.isContextConsumer = x, _e.isContextProvider = P, _e.isElement = N, _e.isForwardRef = O, _e.isFragment = T, _e.isLazy = S, _e.isMemo = E, _e.isPortal = $, _e.isProfiler = I, _e.isStrictMode = j, _e.isSuspense = q, _e.isValidElementType = k, _e.typeOf = A;
  }()), _e;
}
var mp;
function Xy() {
  return mp || (mp = 1, process.env.NODE_ENV === "production" ? qa.exports = TS() : qa.exports = IS()), qa.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var es, hp;
function $S() {
  if (hp) return es;
  hp = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(o) {
    if (o == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(o);
  }
  function a() {
    try {
      if (!Object.assign)
        return !1;
      var o = new String("abc");
      if (o[5] = "de", Object.getOwnPropertyNames(o)[0] === "5")
        return !1;
      for (var s = {}, l = 0; l < 10; l++)
        s["_" + String.fromCharCode(l)] = l;
      var f = Object.getOwnPropertyNames(s).map(function(d) {
        return s[d];
      });
      if (f.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(d) {
        u[d] = d;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return es = a() ? Object.assign : function(o, s) {
    for (var l, f = r(o), u, d = 1; d < arguments.length; d++) {
      l = Object(arguments[d]);
      for (var i in l)
        t.call(l, i) && (f[i] = l[i]);
      if (e) {
        u = e(l);
        for (var c = 0; c < u.length; c++)
          n.call(l, u[c]) && (f[u[c]] = l[u[c]]);
      }
    }
    return f;
  }, es;
}
var ts, gp;
function ru() {
  if (gp) return ts;
  gp = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ts = e, ts;
}
var ns, yp;
function Ky() {
  return yp || (yp = 1, ns = Function.call.bind(Object.prototype.hasOwnProperty)), ns;
}
var rs, bp;
function jS() {
  if (bp) return rs;
  bp = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ ru(), n = {}, r = /* @__PURE__ */ Ky();
    e = function(o) {
      var s = "Warning: " + o;
      typeof console < "u" && console.error(s);
      try {
        throw new Error(s);
      } catch {
      }
    };
  }
  function a(o, s, l, f, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var d in o)
        if (r(o, d)) {
          var i;
          try {
            if (typeof o[d] != "function") {
              var c = Error(
                (f || "React class") + ": " + l + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw c.name = "Invariant Violation", c;
            }
            i = o[d](s, d, f, l, null, t);
          } catch (g) {
            i = g;
          }
          if (i && !(i instanceof Error) && e(
            (f || "React class") + ": type specification of " + l + " `" + d + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof i + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), i instanceof Error && !(i.message in n)) {
            n[i.message] = !0;
            var p = u ? u() : "";
            e(
              "Failed " + l + " type: " + i.message + (p ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, rs = a, rs;
}
var as, vp;
function MS() {
  if (vp) return as;
  vp = 1;
  var e = Xy(), t = $S(), n = /* @__PURE__ */ ru(), r = /* @__PURE__ */ Ky(), a = /* @__PURE__ */ jS(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(l) {
    var f = "Warning: " + l;
    typeof console < "u" && console.error(f);
    try {
      throw new Error(f);
    } catch {
    }
  });
  function s() {
    return null;
  }
  return as = function(l, f) {
    var u = typeof Symbol == "function" && Symbol.iterator, d = "@@iterator";
    function i(y) {
      var x = y && (u && y[u] || y[d]);
      if (typeof x == "function")
        return x;
    }
    var c = "<<anonymous>>", p = {
      array: b("array"),
      bigint: b("bigint"),
      bool: b("boolean"),
      func: b("function"),
      number: b("number"),
      object: b("object"),
      string: b("string"),
      symbol: b("symbol"),
      any: _(),
      arrayOf: k,
      element: A(),
      elementType: v(),
      instanceOf: H,
      node: ie(),
      objectOf: Q,
      oneOf: F,
      oneOfType: B,
      shape: R,
      exact: le
    };
    function g(y, x) {
      return y === x ? y !== 0 || 1 / y === 1 / x : y !== y && x !== x;
    }
    function m(y, x) {
      this.message = y, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function h(y) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, P = 0;
      function N(T, S, E, $, I, j, q) {
        if ($ = $ || c, j = j || E, q !== n) {
          if (f) {
            var w = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw w.name = "Invariant Violation", w;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ce = $ + ":" + E;
            !x[ce] && // Avoid spamming the console because they are often not actionable except for lib authors
            P < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + j + "` prop on `" + $ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[ce] = !0, P++);
          }
        }
        return S[E] == null ? T ? S[E] === null ? new m("The " + I + " `" + j + "` is marked as required " + ("in `" + $ + "`, but its value is `null`.")) : new m("The " + I + " `" + j + "` is marked as required in " + ("`" + $ + "`, but its value is `undefined`.")) : null : y(S, E, $, I, j);
      }
      var O = N.bind(null, !1);
      return O.isRequired = N.bind(null, !0), O;
    }
    function b(y) {
      function x(P, N, O, T, S, E) {
        var $ = P[N], I = z($);
        if (I !== y) {
          var j = K($);
          return new m(
            "Invalid " + T + " `" + S + "` of type " + ("`" + j + "` supplied to `" + O + "`, expected ") + ("`" + y + "`."),
            { expectedType: y }
          );
        }
        return null;
      }
      return h(x);
    }
    function _() {
      return h(s);
    }
    function k(y) {
      function x(P, N, O, T, S) {
        if (typeof y != "function")
          return new m("Property `" + S + "` of component `" + O + "` has invalid PropType notation inside arrayOf.");
        var E = P[N];
        if (!Array.isArray(E)) {
          var $ = z(E);
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected an array."));
        }
        for (var I = 0; I < E.length; I++) {
          var j = y(E, I, O, T, S + "[" + I + "]", n);
          if (j instanceof Error)
            return j;
        }
        return null;
      }
      return h(x);
    }
    function A() {
      function y(x, P, N, O, T) {
        var S = x[P];
        if (!l(S)) {
          var E = z(S);
          return new m("Invalid " + O + " `" + T + "` of type " + ("`" + E + "` supplied to `" + N + "`, expected a single ReactElement."));
        }
        return null;
      }
      return h(y);
    }
    function v() {
      function y(x, P, N, O, T) {
        var S = x[P];
        if (!e.isValidElementType(S)) {
          var E = z(S);
          return new m("Invalid " + O + " `" + T + "` of type " + ("`" + E + "` supplied to `" + N + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return h(y);
    }
    function H(y) {
      function x(P, N, O, T, S) {
        if (!(P[N] instanceof y)) {
          var E = y.name || c, $ = oe(P[N]);
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected ") + ("instance of `" + E + "`."));
        }
        return null;
      }
      return h(x);
    }
    function F(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), s;
      function x(P, N, O, T, S) {
        for (var E = P[N], $ = 0; $ < y.length; $++)
          if (g(E, y[$]))
            return null;
        var I = JSON.stringify(y, function(q, w) {
          var ce = K(w);
          return ce === "symbol" ? String(w) : w;
        });
        return new m("Invalid " + T + " `" + S + "` of value `" + String(E) + "` " + ("supplied to `" + O + "`, expected one of " + I + "."));
      }
      return h(x);
    }
    function Q(y) {
      function x(P, N, O, T, S) {
        if (typeof y != "function")
          return new m("Property `" + S + "` of component `" + O + "` has invalid PropType notation inside objectOf.");
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected an object."));
        for (var I in E)
          if (r(E, I)) {
            var j = y(E, I, O, T, S + "." + I, n);
            if (j instanceof Error)
              return j;
          }
        return null;
      }
      return h(x);
    }
    function B(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), s;
      for (var x = 0; x < y.length; x++) {
        var P = y[x];
        if (typeof P != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + X(P) + " at index " + x + "."
          ), s;
      }
      function N(O, T, S, E, $) {
        for (var I = [], j = 0; j < y.length; j++) {
          var q = y[j], w = q(O, T, S, E, $, n);
          if (w == null)
            return null;
          w.data && r(w.data, "expectedType") && I.push(w.data.expectedType);
        }
        var ce = I.length > 0 ? ", expected one of type [" + I.join(", ") + "]" : "";
        return new m("Invalid " + E + " `" + $ + "` supplied to " + ("`" + S + "`" + ce + "."));
      }
      return h(N);
    }
    function ie() {
      function y(x, P, N, O, T) {
        return D(x[P]) ? null : new m("Invalid " + O + " `" + T + "` supplied to " + ("`" + N + "`, expected a ReactNode."));
      }
      return h(y);
    }
    function ae(y, x, P, N, O) {
      return new m(
        (y || "React class") + ": " + x + " type `" + P + "." + N + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + O + "`."
      );
    }
    function R(y) {
      function x(P, N, O, T, S) {
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type `" + $ + "` " + ("supplied to `" + O + "`, expected `object`."));
        for (var I in y) {
          var j = y[I];
          if (typeof j != "function")
            return ae(O, T, S, I, K(j));
          var q = j(E, I, O, T, S + "." + I, n);
          if (q)
            return q;
        }
        return null;
      }
      return h(x);
    }
    function le(y) {
      function x(P, N, O, T, S) {
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type `" + $ + "` " + ("supplied to `" + O + "`, expected `object`."));
        var I = t({}, P[N], y);
        for (var j in I) {
          var q = y[j];
          if (r(y, j) && typeof q != "function")
            return ae(O, T, S, j, K(q));
          if (!q)
            return new m(
              "Invalid " + T + " `" + S + "` key `" + j + "` supplied to `" + O + "`.\nBad object: " + JSON.stringify(P[N], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(y), null, "  ")
            );
          var w = q(E, j, O, T, S + "." + j, n);
          if (w)
            return w;
        }
        return null;
      }
      return h(x);
    }
    function D(y) {
      switch (typeof y) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !y;
        case "object":
          if (Array.isArray(y))
            return y.every(D);
          if (y === null || l(y))
            return !0;
          var x = i(y);
          if (x) {
            var P = x.call(y), N;
            if (x !== y.entries) {
              for (; !(N = P.next()).done; )
                if (!D(N.value))
                  return !1;
            } else
              for (; !(N = P.next()).done; ) {
                var O = N.value;
                if (O && !D(O[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function M(y, x) {
      return y === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function z(y) {
      var x = typeof y;
      return Array.isArray(y) ? "array" : y instanceof RegExp ? "object" : M(x, y) ? "symbol" : x;
    }
    function K(y) {
      if (typeof y > "u" || y === null)
        return "" + y;
      var x = z(y);
      if (x === "object") {
        if (y instanceof Date)
          return "date";
        if (y instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function X(y) {
      var x = K(y);
      switch (x) {
        case "array":
        case "object":
          return "an " + x;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + x;
        default:
          return x;
      }
    }
    function oe(y) {
      return !y.constructor || !y.constructor.name ? c : y.constructor.name;
    }
    return p.checkPropTypes = a, p.resetWarningCache = a.resetWarningCache, p.PropTypes = p, p;
  }, as;
}
var os, xp;
function RS() {
  if (xp) return os;
  xp = 1;
  var e = /* @__PURE__ */ ru();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, os = function() {
    function r(s, l, f, u, d, i) {
      if (i !== e) {
        var c = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw c.name = "Invariant Violation", c;
      }
    }
    r.isRequired = r;
    function a() {
      return r;
    }
    var o = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: a,
      element: r,
      elementType: r,
      instanceOf: a,
      node: r,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, os;
}
var wp;
function zS() {
  if (wp) return Ba.exports;
  if (wp = 1, process.env.NODE_ENV !== "production") {
    var e = Xy(), t = !0;
    Ba.exports = /* @__PURE__ */ MS()(e.isElement, t);
  } else
    Ba.exports = /* @__PURE__ */ RS()();
  return Ba.exports;
}
var DS = /* @__PURE__ */ zS();
const ge = /* @__PURE__ */ NS(DS);
function _p(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function ht(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? _p(Object(n), !0).forEach(function(r) {
      er(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : _p(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function So(e) {
  "@babel/helpers - typeof";
  return So = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, So(e);
}
function er(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function FS(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function LS(e, t) {
  if (e == null) return {};
  var n = FS(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Il(e) {
  return WS(e) || VS(e) || YS(e) || US();
}
function WS(e) {
  if (Array.isArray(e)) return $l(e);
}
function VS(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function YS(e, t) {
  if (e) {
    if (typeof e == "string") return $l(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return $l(e, t);
  }
}
function $l(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function US() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function HS(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, s = e.shake, l = e.flash, f = e.spin, u = e.spinPulse, d = e.spinReverse, i = e.pulse, c = e.fixedWidth, p = e.inverse, g = e.border, m = e.listItem, h = e.flip, b = e.size, _ = e.rotation, k = e.pull, A = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": s,
    "fa-flash": l,
    "fa-spin": f,
    "fa-spin-reverse": d,
    "fa-spin-pulse": u,
    "fa-pulse": i,
    "fa-fw": c,
    "fa-inverse": p,
    "fa-border": g,
    "fa-li": m,
    "fa-flip": h === !0,
    "fa-flip-horizontal": h === "horizontal" || h === "both",
    "fa-flip-vertical": h === "vertical" || h === "both"
  }, er(t, "fa-".concat(b), typeof b < "u" && b !== null), er(t, "fa-rotate-".concat(_), typeof _ < "u" && _ !== null && _ !== 0), er(t, "fa-pull-".concat(k), typeof k < "u" && k !== null), er(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(A).map(function(v) {
    return A[v] ? v : null;
  }).filter(function(v) {
    return v;
  });
}
function GS(e) {
  return e = e - 0, e === e;
}
function Qy(e) {
  return GS(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var BS = ["style"];
function qS(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function XS(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Qy(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[qS(a)] = o : t[a] = o, t;
  }, {});
}
function Jy(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(f) {
    return Jy(e, f);
  }), a = Object.keys(t.attributes || {}).reduce(function(f, u) {
    var d = t.attributes[u];
    switch (u) {
      case "class":
        f.attrs.className = d, delete t.attributes.class;
        break;
      case "style":
        f.attrs.style = XS(d);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? f.attrs[u.toLowerCase()] = d : f.attrs[Qy(u)] = d;
    }
    return f;
  }, {
    attrs: {}
  }), o = n.style, s = o === void 0 ? {} : o, l = LS(n, BS);
  return a.attrs.style = ht(ht({}, a.attrs.style), s), e.apply(void 0, [t.tag, ht(ht({}, a.attrs), l)].concat(Il(r)));
}
var Zy = !1;
try {
  Zy = process.env.NODE_ENV === "production";
} catch {
}
function KS() {
  if (!Zy && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function kp(e) {
  if (e && So(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Tl.icon)
    return Tl.icon(e);
  if (e === null)
    return null;
  if (e && So(e) === "object" && e.prefix && e.iconName)
    return e;
  if (Array.isArray(e) && e.length === 2)
    return {
      prefix: e[0],
      iconName: e[1]
    };
  if (typeof e == "string")
    return {
      prefix: "fas",
      iconName: e
    };
}
function is(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? er({}, e, t) : {};
}
var Ap = {
  border: !1,
  className: "",
  mask: null,
  maskId: null,
  fixedWidth: !1,
  inverse: !1,
  flip: !1,
  icon: null,
  listItem: !1,
  pull: null,
  pulse: !1,
  rotation: null,
  size: null,
  spin: !1,
  spinPulse: !1,
  spinReverse: !1,
  beat: !1,
  fade: !1,
  beatFade: !1,
  bounce: !1,
  shake: !1,
  symbol: !1,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: !1
}, au = /* @__PURE__ */ On.forwardRef(function(e, t) {
  var n = ht(ht({}, Ap), e), r = n.icon, a = n.mask, o = n.symbol, s = n.className, l = n.title, f = n.titleId, u = n.maskId, d = kp(r), i = is("classes", [].concat(Il(HS(n)), Il((s || "").split(" ")))), c = is("transform", typeof n.transform == "string" ? Tl.transform(n.transform) : n.transform), p = is("mask", kp(a)), g = CS(d, ht(ht(ht(ht({}, i), c), p), {}, {
    symbol: o,
    title: l,
    titleId: f,
    maskId: u
  }));
  if (!g)
    return KS("Could not find icon", d), null;
  var m = g.abstract, h = {
    ref: t
  };
  return Object.keys(n).forEach(function(b) {
    Ap.hasOwnProperty(b) || (h[b] = n[b]);
  }), QS(m[0], h);
});
au.displayName = "FontAwesomeIcon";
au.propTypes = {
  beat: ge.bool,
  border: ge.bool,
  beatFade: ge.bool,
  bounce: ge.bool,
  className: ge.string,
  fade: ge.bool,
  flash: ge.bool,
  mask: ge.oneOfType([ge.object, ge.array, ge.string]),
  maskId: ge.string,
  fixedWidth: ge.bool,
  inverse: ge.bool,
  flip: ge.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: ge.oneOfType([ge.object, ge.array, ge.string]),
  listItem: ge.bool,
  pull: ge.oneOf(["right", "left"]),
  pulse: ge.bool,
  rotation: ge.oneOf([0, 90, 180, 270]),
  shake: ge.bool,
  size: ge.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: ge.bool,
  spinPulse: ge.bool,
  spinReverse: ge.bool,
  symbol: ge.oneOfType([ge.bool, ge.string]),
  title: ge.string,
  titleId: ge.string,
  transform: ge.oneOfType([ge.string, ge.object]),
  swapOpacity: ge.bool
};
var QS = Jy.bind(null, On.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const JS = {
  prefix: "fas",
  iconName: "wand-magic-sparkles",
  icon: [576, 512, ["magic-wand-sparkles"], "e2ca", "M234.7 42.7L197 56.8c-3 1.1-5 4-5 7.2s2 6.1 5 7.2l37.7 14.1L248.8 123c1.1 3 4 5 7.2 5s6.1-2 7.2-5l14.1-37.7L315 71.2c3-1.1 5-4 5-7.2s-2-6.1-5-7.2L277.3 42.7 263.2 5c-1.1-3-4-5-7.2-5s-6.1 2-7.2 5L234.7 42.7zM46.1 395.4c-18.7 18.7-18.7 49.1 0 67.9l34.6 34.6c18.7 18.7 49.1 18.7 67.9 0L529.9 116.5c18.7-18.7 18.7-49.1 0-67.9L495.3 14.1c-18.7-18.7-49.1-18.7-67.9 0L46.1 395.4zM484.6 82.6l-105 105-23.3-23.3 105-105 23.3 23.3zM7.5 117.2C3 118.9 0 123.2 0 128s3 9.1 7.5 10.8L64 160l21.2 56.5c1.7 4.5 6 7.5 10.8 7.5s9.1-3 10.8-7.5L128 160l56.5-21.2c4.5-1.7 7.5-6 7.5-10.8s-3-9.1-7.5-10.8L128 96 106.8 39.5C105.1 35 100.8 32 96 32s-9.1 3-10.8 7.5L64 96 7.5 117.2zm352 256c-4.5 1.7-7.5 6-7.5 10.8s3 9.1 7.5 10.8L416 416l21.2 56.5c1.7 4.5 6 7.5 10.8 7.5s9.1-3 10.8-7.5L480 416l56.5-21.2c4.5-1.7 7.5-6 7.5-10.8s-3-9.1-7.5-10.8L480 352l-21.2-56.5c-1.7-4.5-6-7.5-10.8-7.5s-9.1 3-10.8 7.5L416 352l-56.5 21.2z"]
}, ZS = JS, e4 = {
  prefix: "fas",
  iconName: "arrow-right",
  icon: [448, 512, [8594], "f061", "M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function t4(e, t, n) {
  return (t = r4(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Op(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Y(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Op(Object(n), !0).forEach(function(r) {
      t4(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Op(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function n4(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function r4(e) {
  var t = n4(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Sp = () => {
};
let ou = {}, eb = {}, tb = null, nb = {
  mark: Sp,
  measure: Sp
};
try {
  typeof window < "u" && (ou = window), typeof document < "u" && (eb = document), typeof MutationObserver < "u" && (tb = MutationObserver), typeof performance < "u" && (nb = performance);
} catch {
}
const {
  userAgent: Ep = ""
} = ou.navigator || {}, _n = ou, Me = eb, Pp = tb, Xa = nb;
_n.document;
const Bt = !!Me.documentElement && !!Me.head && typeof Me.addEventListener == "function" && typeof Me.createElement == "function", rb = ~Ep.indexOf("MSIE") || ~Ep.indexOf("Trident/");
var a4 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, o4 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, ab = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, i4 = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ob = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ye = "classic", ni = "duotone", s4 = "sharp", l4 = "sharp-duotone", ib = [Ye, ni, s4, l4], c4 = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, u4 = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
}, f4 = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), d4 = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
}, p4 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Cp = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, m4 = ["kit"], h4 = {
  kit: {
    "fa-kit": "fak"
  }
}, g4 = ["fak", "fakd"], y4 = {
  kit: {
    fak: "fa-kit"
  }
}, Np = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Ka = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, b4 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], v4 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], x4 = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, w4 = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, _4 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, jl = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, k4 = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Ml = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...b4, ...k4], A4 = ["solid", "regular", "light", "thin", "duotone", "brands"], sb = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], O4 = sb.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), S4 = [...Object.keys(_4), ...A4, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ka.GROUP, Ka.SWAP_OPACITY, Ka.PRIMARY, Ka.SECONDARY].concat(sb.map((e) => "".concat(e, "x"))).concat(O4.map((e) => "w-".concat(e))), E4 = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const Wt = "___FONT_AWESOME___", Rl = 16, lb = "fa", cb = "svg-inline--fa", Fn = "data-fa-i2svg", zl = "data-fa-pseudo-element", P4 = "data-fa-pseudo-element-pending", iu = "data-prefix", su = "data-icon", Tp = "fontawesome-i2svg", C4 = "async", N4 = ["HTML", "HEAD", "STYLE", "SCRIPT"], ub = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Ta(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Ye];
    }
  });
}
const fb = Y({}, ab);
fb[Ye] = Y(Y(Y(Y({}, {
  "fa-duotone": "duotone"
}), ab[Ye]), Cp.kit), Cp["kit-duotone"]);
const T4 = Ta(fb), Dl = Y({}, d4);
Dl[Ye] = Y(Y(Y(Y({}, {
  duotone: "fad"
}), Dl[Ye]), Np.kit), Np["kit-duotone"]);
const Ip = Ta(Dl), Fl = Y({}, jl);
Fl[Ye] = Y(Y({}, Fl[Ye]), y4.kit);
const lu = Ta(Fl), Ll = Y({}, w4);
Ll[Ye] = Y(Y({}, Ll[Ye]), h4.kit);
Ta(Ll);
const I4 = a4, db = "fa-layers-text", $4 = o4, j4 = Y({}, c4);
Ta(j4);
const M4 = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], ss = i4, R4 = [...m4, ...S4], ea = _n.FontAwesomeConfig || {};
function z4(e) {
  var t = Me.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function D4(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Me && typeof Me.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = D4(z4(t));
  r != null && (ea[n] = r);
});
const pb = {
  styleDefault: "solid",
  familyDefault: Ye,
  cssPrefix: lb,
  replacementClass: cb,
  autoReplaceSvg: !0,
  autoAddCss: !0,
  autoA11y: !0,
  searchPseudoElements: !1,
  observeMutations: !0,
  mutateApproach: "async",
  keepOriginalSource: !0,
  measurePerformance: !1,
  showMissingIcons: !0
};
ea.familyPrefix && (ea.cssPrefix = ea.familyPrefix);
const yr = Y(Y({}, pb), ea);
yr.autoReplaceSvg || (yr.observeMutations = !1);
const te = {};
Object.keys(pb).forEach((e) => {
  Object.defineProperty(te, e, {
    enumerable: !0,
    set: function(t) {
      yr[e] = t, ta.forEach((n) => n(te));
    },
    get: function() {
      return yr[e];
    }
  });
});
Object.defineProperty(te, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    yr.cssPrefix = e, ta.forEach((t) => t(te));
  },
  get: function() {
    return yr.cssPrefix;
  }
});
_n.FontAwesomeConfig = te;
const ta = [];
function F4(e) {
  return ta.push(e), () => {
    ta.splice(ta.indexOf(e), 1);
  };
}
const nn = Rl, At = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function L4(e) {
  if (!e || !Bt)
    return;
  const t = Me.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = Me.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], s = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(s) > -1 && (r = o);
  }
  return Me.head.insertBefore(t, r), e;
}
const W4 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function xa() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += W4[Math.random() * 62 | 0];
  return t;
}
function Ar(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function cu(e) {
  return e.classList ? Ar(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function mb(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function V4(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(mb(e[n]), '" '), "").trim();
}
function ri(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function uu(e) {
  return e.size !== At.size || e.x !== At.x || e.y !== At.y || e.rotate !== At.rotate || e.flipX || e.flipY;
}
function Y4(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), s = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), l = "rotate(".concat(t.rotate, " 0 0)"), f = {
    transform: "".concat(o, " ").concat(s, " ").concat(l)
  }, u = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: f,
    path: u
  };
}
function U4(e) {
  let {
    transform: t,
    width: n = Rl,
    height: r = Rl,
    startCentered: a = !1
  } = e, o = "";
  return a && rb ? o += "translate(".concat(t.x / nn - n / 2, "em, ").concat(t.y / nn - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / nn, "em), calc(-50% + ").concat(t.y / nn, "em)) ") : o += "translate(".concat(t.x / nn, "em, ").concat(t.y / nn, "em) "), o += "scale(".concat(t.size / nn * (t.flipX ? -1 : 1), ", ").concat(t.size / nn * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var H4 = `:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;
function hb() {
  const e = lb, t = cb, n = te.cssPrefix, r = te.replacementClass;
  let a = H4;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), s = new RegExp("\\--".concat(e, "\\-"), "g"), l = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(s, "--".concat(n, "-")).replace(l, ".".concat(r));
  }
  return a;
}
let $p = !1;
function ls() {
  te.autoAddCss && !$p && (L4(hb()), $p = !0);
}
var G4 = {
  mixout() {
    return {
      dom: {
        css: hb,
        insertCss: ls
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        ls();
      },
      beforeI2svg() {
        ls();
      }
    };
  }
};
const Vt = _n || {};
Vt[Wt] || (Vt[Wt] = {});
Vt[Wt].styles || (Vt[Wt].styles = {});
Vt[Wt].hooks || (Vt[Wt].hooks = {});
Vt[Wt].shims || (Vt[Wt].shims = []);
var Ot = Vt[Wt];
const gb = [], yb = function() {
  Me.removeEventListener("DOMContentLoaded", yb), Eo = 1, gb.map((e) => e());
};
let Eo = !1;
Bt && (Eo = (Me.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Me.readyState), Eo || Me.addEventListener("DOMContentLoaded", yb));
function B4(e) {
  Bt && (Eo ? setTimeout(e, 0) : gb.push(e));
}
function Ia(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? mb(e) : "<".concat(t, " ").concat(V4(n), ">").concat(r.map(Ia).join(""), "</").concat(t, ">");
}
function jp(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var cs = function(e, t, n, r) {
  var a = Object.keys(e), o = a.length, s = t, l, f, u;
  for (n === void 0 ? (l = 1, u = e[a[0]]) : (l = 0, u = n); l < o; l++)
    f = a[l], u = s(u, e[f], f, e);
  return u;
};
function q4(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const a = e.charCodeAt(n++);
    if (a >= 55296 && a <= 56319 && n < r) {
      const o = e.charCodeAt(n++);
      (o & 64512) == 56320 ? t.push(((a & 1023) << 10) + (o & 1023) + 65536) : (t.push(a), n--);
    } else
      t.push(a);
  }
  return t;
}
function bb(e) {
  const t = q4(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function X4(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function Mp(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Wl(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = Mp(t);
  typeof Ot.hooks.addPack == "function" && !r ? Ot.hooks.addPack(e, Mp(t)) : Ot.styles[e] = Y(Y({}, Ot.styles[e] || {}), a), e === "fas" && Wl("fa", t);
}
const {
  styles: wa,
  shims: K4
} = Ot, vb = Object.keys(lu), Q4 = vb.reduce((e, t) => (e[t] = Object.keys(lu[t]), e), {});
let fu = null, xb = {}, wb = {}, _b = {}, kb = {}, Ab = {};
function J4(e) {
  return ~R4.indexOf(e);
}
function Z4(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !J4(a) ? a : null;
}
const Ob = () => {
  const e = (r) => cs(wa, (a, o, s) => (a[s] = cs(o, r, {}), a), {});
  xb = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), wb = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), Ab = e((r, a, o) => {
    const s = a[2];
    return r[o] = o, s.forEach((l) => {
      r[l] = o;
    }), r;
  });
  const t = "far" in wa || te.autoFetchSvg, n = cs(K4, (r, a) => {
    const o = a[0];
    let s = a[1];
    const l = a[2];
    return s === "far" && !t && (s = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: s,
      iconName: l
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: s,
      iconName: l
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  _b = n.names, kb = n.unicodes, fu = ai(te.styleDefault, {
    family: te.familyDefault
  });
};
F4((e) => {
  fu = ai(e.styleDefault, {
    family: te.familyDefault
  });
});
Ob();
function du(e, t) {
  return (xb[e] || {})[t];
}
function e3(e, t) {
  return (wb[e] || {})[t];
}
function Nn(e, t) {
  return (Ab[e] || {})[t];
}
function Sb(e) {
  return _b[e] || {
    prefix: null,
    iconName: null
  };
}
function t3(e) {
  const t = kb[e], n = du("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function kn() {
  return fu;
}
const Eb = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function n3(e) {
  let t = Ye;
  const n = vb.reduce((r, a) => (r[a] = "".concat(te.cssPrefix, "-").concat(a), r), {});
  return ib.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => Q4[r].includes(a))) && (t = r);
  }), t;
}
function ai(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Ye
  } = t, r = T4[n][e];
  if (n === ni && !e)
    return "fad";
  const a = Ip[n][e] || Ip[n][r], o = e in Ot.styles ? e : null;
  return a || o || null;
}
function r3(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = Z4(te.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Rp(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function oi(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = Ml.concat(v4), o = Rp(e.filter((i) => a.includes(i))), s = Rp(e.filter((i) => !Ml.includes(i))), l = o.filter((i) => (r = i, !ob.includes(i))), [f = null] = l, u = n3(o), d = Y(Y({}, r3(s)), {}, {
    prefix: ai(f, {
      family: u
    })
  });
  return Y(Y(Y({}, d), s3({
    values: e,
    family: u,
    styles: wa,
    config: te,
    canonical: d,
    givenPrefix: r
  })), a3(n, r, d));
}
function a3(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? Sb(a) : {}, s = Nn(r, a);
  return a = o.iconName || s || a, r = o.prefix || r, r === "far" && !wa.far && wa.fas && !te.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const o3 = ib.filter((e) => e !== Ye || e !== ni), i3 = Object.keys(jl).filter((e) => e !== Ye).map((e) => Object.keys(jl[e])).flat();
function s3(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: s = {}
  } = e, l = n === ni, f = t.includes("fa-duotone") || t.includes("fad"), u = s.familyDefault === "duotone", d = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!l && (f || u || d) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && o3.includes(n) && (Object.keys(o).find((i) => i3.includes(i)) || s.autoFetchSvg)) {
    const i = f4.get(n).defaultShortPrefixId;
    r.prefix = i, r.iconName = Nn(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = kn() || "fas"), r;
}
class l3 {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = Y(Y({}, this.definitions[o] || {}), a[o]), Wl(o, a[o]);
      const s = lu[Ye][o];
      s && Wl(s, a[o]), Ob();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((a) => {
      const {
        prefix: o,
        iconName: s,
        icon: l
      } = r[a], f = l[2];
      t[o] || (t[o] = {}), f.length > 0 && f.forEach((u) => {
        typeof u == "string" && (t[o][u] = l);
      }), t[o][s] = l;
    }), t;
  }
}
let zp = [], tr = {};
const fr = {}, c3 = Object.keys(fr);
function u3(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return zp = e, tr = {}, Object.keys(fr).forEach((r) => {
    c3.indexOf(r) === -1 && delete fr[r];
  }), zp.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((s) => {
        n[o] || (n[o] = {}), n[o][s] = a[o][s];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((s) => {
        tr[s] || (tr[s] = []), tr[s].push(o[s]);
      });
    }
    r.provides && r.provides(fr);
  }), n;
}
function Vl(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (tr[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...r]);
  }), t;
}
function Ln(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (tr[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function An() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return fr[e] ? fr[e].apply(null, t) : void 0;
}
function Yl(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || kn();
  if (t)
    return t = Nn(n, t) || t, jp(Pb.definitions, n, t) || jp(Ot.styles, n, t);
}
const Pb = new l3(), f3 = () => {
  te.autoReplaceSvg = !1, te.observeMutations = !1, Ln("noAuto");
}, d3 = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return Bt ? (Ln("beforeI2svg", e), An("pseudoElements2svg", e), An("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    te.autoReplaceSvg === !1 && (te.autoReplaceSvg = !0), te.observeMutations = !0, B4(() => {
      m3({
        autoReplaceSvgRoot: t
      }), Ln("watch", e);
    });
  }
}, p3 = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Nn(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = ai(e[0]);
      return {
        prefix: n,
        iconName: Nn(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(te.cssPrefix, "-")) > -1 || e.match(I4))) {
      const t = oi(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || kn(),
        iconName: Nn(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = kn();
      return {
        prefix: t,
        iconName: Nn(t, e) || e
      };
    }
  }
}, Ze = {
  noAuto: f3,
  config: te,
  dom: d3,
  parse: p3,
  library: Pb,
  findIconDefinition: Yl,
  toHtml: Ia
}, m3 = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Me
  } = e;
  (Object.keys(Ot.styles).length > 0 || te.autoFetchSvg) && Bt && te.autoReplaceSvg && Ze.dom.i2svg({
    node: t
  });
};
function ii(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Ia(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!Bt) return;
      const n = Me.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function h3(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: s
  } = e;
  if (uu(s) && n.found && !r.found) {
    const {
      width: l,
      height: f
    } = n, u = {
      x: l / f / 2,
      y: 0.5
    };
    a.style = ri(Y(Y({}, o), {}, {
      "transform-origin": "".concat(u.x + s.x / 16, "em ").concat(u.y + s.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function g3(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const s = o === !0 ? "".concat(t, "-").concat(te.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: Y(Y({}, a), {}, {
        id: s
      }),
      children: r
    }]
  }];
}
function pu(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: s,
    title: l,
    maskId: f,
    titleId: u,
    extra: d,
    watchable: i = !1
  } = e, {
    width: c,
    height: p
  } = n.found ? n : t, g = g4.includes(r), m = [te.replacementClass, a ? "".concat(te.cssPrefix, "-").concat(a) : ""].filter((v) => d.classes.indexOf(v) === -1).filter((v) => v !== "" || !!v).concat(d.classes).join(" ");
  let h = {
    children: [],
    attributes: Y(Y({}, d.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: m,
      role: d.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(c, " ").concat(p)
    })
  };
  const b = g && !~d.classes.indexOf("fa-fw") ? {
    width: "".concat(c / p * 16 * 0.0625, "em")
  } : {};
  i && (h.attributes[Fn] = ""), l && (h.children.push({
    tag: "title",
    attributes: {
      id: h.attributes["aria-labelledby"] || "title-".concat(u || xa())
    },
    children: [l]
  }), delete h.attributes.title);
  const _ = Y(Y({}, h), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: f,
    transform: o,
    symbol: s,
    styles: Y(Y({}, b), d.styles)
  }), {
    children: k,
    attributes: A
  } = n.found && t.found ? An("generateAbstractMask", _) || {
    children: [],
    attributes: {}
  } : An("generateAbstractIcon", _) || {
    children: [],
    attributes: {}
  };
  return _.children = k, _.attributes = A, s ? g3(_) : h3(_);
}
function Dp(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: s,
    watchable: l = !1
  } = e, f = Y(Y(Y({}, s.attributes), o ? {
    title: o
  } : {}), {}, {
    class: s.classes.join(" ")
  });
  l && (f[Fn] = "");
  const u = Y({}, s.styles);
  uu(a) && (u.transform = U4({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), u["-webkit-transform"] = u.transform);
  const d = ri(u);
  d.length > 0 && (f.style = d);
  const i = [];
  return i.push({
    tag: "span",
    attributes: f,
    children: [t]
  }), o && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), i;
}
function y3(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = Y(Y(Y({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = ri(r.styles);
  o.length > 0 && (a.style = o);
  const s = [];
  return s.push({
    tag: "span",
    attributes: a,
    children: [t]
  }), n && s.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), s;
}
const {
  styles: us
} = Ot;
function Ul(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(te.cssPrefix, "-").concat(ss.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(te.cssPrefix, "-").concat(ss.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(te.cssPrefix, "-").concat(ss.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : a = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: a
  };
}
const b3 = {
  found: !1,
  width: 512,
  height: 512
};
function v3(e, t) {
  !ub && !te.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Hl(e, t) {
  let n = t;
  return t === "fa" && te.styleDefault !== null && (t = kn()), new Promise((r, a) => {
    if (n === "fa") {
      const o = Sb(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && us[t] && us[t][e]) {
      const o = us[t][e];
      return r(Ul(o));
    }
    v3(e, t), r(Y(Y({}, b3), {}, {
      icon: te.showMissingIcons && e ? An("missingIconAbstract") || {} : {}
    }));
  });
}
const Fp = () => {
}, Gl = te.measurePerformance && Xa && Xa.mark && Xa.measure ? Xa : {
  mark: Fp,
  measure: Fp
}, Wr = 'FA "6.7.2"', x3 = (e) => (Gl.mark("".concat(Wr, " ").concat(e, " begins")), () => Cb(e)), Cb = (e) => {
  Gl.mark("".concat(Wr, " ").concat(e, " ends")), Gl.measure("".concat(Wr, " ").concat(e), "".concat(Wr, " ").concat(e, " begins"), "".concat(Wr, " ").concat(e, " ends"));
};
var mu = {
  begin: x3,
  end: Cb
};
const lo = () => {
};
function Lp(e) {
  return typeof (e.getAttribute ? e.getAttribute(Fn) : null) == "string";
}
function w3(e) {
  const t = e.getAttribute ? e.getAttribute(iu) : null, n = e.getAttribute ? e.getAttribute(su) : null;
  return t && n;
}
function _3(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(te.replacementClass);
}
function k3() {
  return te.autoReplaceSvg === !0 ? co.replace : co[te.autoReplaceSvg] || co.replace;
}
function A3(e) {
  return Me.createElementNS("http://www.w3.org/2000/svg", e);
}
function O3(e) {
  return Me.createElement(e);
}
function Nb(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? A3 : O3
  } = t;
  if (typeof e == "string")
    return Me.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(Nb(a, {
      ceFn: n
    }));
  }), r;
}
function S3(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const co = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Nb(n), t);
      }), t.getAttribute(Fn) === null && te.keepOriginalSource) {
        let n = Me.createComment(S3(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~cu(t).indexOf(te.replacementClass))
      return co.replace(e);
    const r = new RegExp("".concat(te.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((s, l) => (l === te.replacementClass || l.match(r) ? s.toSvg.push(l) : s.toNode.push(l), s), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => Ia(o)).join(`
`);
    t.setAttribute(Fn, ""), t.innerHTML = a;
  }
};
function Wp(e) {
  e();
}
function Tb(e, t) {
  const n = typeof t == "function" ? t : lo;
  if (e.length === 0)
    n();
  else {
    let r = Wp;
    te.mutateApproach === C4 && (r = _n.requestAnimationFrame || Wp), r(() => {
      const a = k3(), o = mu.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let hu = !1;
function Ib() {
  hu = !0;
}
function Bl() {
  hu = !1;
}
let Po = null;
function Vp(e) {
  if (!Pp || !te.observeMutations)
    return;
  const {
    treeCallback: t = lo,
    nodeCallback: n = lo,
    pseudoElementsCallback: r = lo,
    observeMutationsRoot: a = Me
  } = e;
  Po = new Pp((o) => {
    if (hu) return;
    const s = kn();
    Ar(o).forEach((l) => {
      if (l.type === "childList" && l.addedNodes.length > 0 && !Lp(l.addedNodes[0]) && (te.searchPseudoElements && r(l.target), t(l.target)), l.type === "attributes" && l.target.parentNode && te.searchPseudoElements && r(l.target.parentNode), l.type === "attributes" && Lp(l.target) && ~M4.indexOf(l.attributeName))
        if (l.attributeName === "class" && w3(l.target)) {
          const {
            prefix: f,
            iconName: u
          } = oi(cu(l.target));
          l.target.setAttribute(iu, f || s), u && l.target.setAttribute(su, u);
        } else _3(l.target) && n(l.target);
    });
  }), Bt && Po.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function E3() {
  Po && Po.disconnect();
}
function P3(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), s = o[0], l = o.slice(1);
    return s && l.length > 0 && (r[s] = l.join(":").trim()), r;
  }, {})), n;
}
function C3(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = oi(cu(e));
  return a.prefix || (a.prefix = kn()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = e3(a.prefix, e.innerText) || du(a.prefix, bb(e.innerText))), !a.iconName && te.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function N3(e) {
  const t = Ar(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return te.autoA11y && (n ? t["aria-labelledby"] = "".concat(te.replacementClass, "-title-").concat(r || xa()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function T3() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: At,
    symbol: !1,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function Yp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = C3(e), o = N3(e), s = Vl("parseNodeAttributes", {}, e);
  let l = t.styleParser ? P3(e) : [];
  return Y({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: At,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: l,
      attributes: o
    }
  }, s);
}
const {
  styles: I3
} = Ot;
function $b(e) {
  const t = te.autoReplaceSvg === "nest" ? Yp(e, {
    styleParser: !1
  }) : Yp(e);
  return ~t.extra.classes.indexOf(db) ? An("generateLayersText", e, t) : An("generateSvgReplacementMutation", e, t);
}
function $3() {
  return [...p4, ...Ml];
}
function Up(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!Bt) return Promise.resolve();
  const n = Me.documentElement.classList, r = (d) => n.add("".concat(Tp, "-").concat(d)), a = (d) => n.remove("".concat(Tp, "-").concat(d)), o = te.autoFetchSvg ? $3() : ob.concat(Object.keys(I3));
  o.includes("fa") || o.push("fa");
  const s = [".".concat(db, ":not([").concat(Fn, "])")].concat(o.map((d) => ".".concat(d, ":not([").concat(Fn, "])"))).join(", ");
  if (s.length === 0)
    return Promise.resolve();
  let l = [];
  try {
    l = Ar(e.querySelectorAll(s));
  } catch {
  }
  if (l.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const f = mu.begin("onTree"), u = l.reduce((d, i) => {
    try {
      const c = $b(i);
      c && d.push(c);
    } catch (c) {
      ub || c.name === "MissingIcon" && console.error(c);
    }
    return d;
  }, []);
  return new Promise((d, i) => {
    Promise.all(u).then((c) => {
      Tb(c, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), f(), d();
      });
    }).catch((c) => {
      f(), i(c);
    });
  });
}
function j3(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  $b(e).then((n) => {
    n && Tb([n], t);
  });
}
function M3(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Yl(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Yl(a || {})), e(r, Y(Y({}, n), {}, {
      mask: a
    }));
  };
}
const R3 = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = At,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: s = null,
    titleId: l = null,
    classes: f = [],
    attributes: u = {},
    styles: d = {}
  } = t;
  if (!e) return;
  const {
    prefix: i,
    iconName: c,
    icon: p
  } = e;
  return ii(Y({
    type: "icon"
  }, e), () => (Ln("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), te.autoA11y && (s ? u["aria-labelledby"] = "".concat(te.replacementClass, "-title-").concat(l || xa()) : (u["aria-hidden"] = "true", u.focusable = "false")), pu({
    icons: {
      main: Ul(p),
      mask: a ? Ul(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: i,
    iconName: c,
    transform: Y(Y({}, At), n),
    symbol: r,
    title: s,
    maskId: o,
    titleId: l,
    extra: {
      attributes: u,
      styles: d,
      classes: f
    }
  })));
};
var z3 = {
  mixout() {
    return {
      icon: M3(R3)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Up, e.nodeCallback = j3, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = Me,
        callback: r = () => {
        }
      } = t;
      return Up(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: s,
        transform: l,
        symbol: f,
        mask: u,
        maskId: d,
        extra: i
      } = n;
      return new Promise((c, p) => {
        Promise.all([Hl(r, s), u.iconName ? Hl(u.iconName, u.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((g) => {
          let [m, h] = g;
          c([t, pu({
            icons: {
              main: m,
              mask: h
            },
            prefix: s,
            iconName: r,
            transform: l,
            symbol: f,
            maskId: d,
            title: a,
            titleId: o,
            extra: i,
            watchable: !0
          })]);
        }).catch(p);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: s
      } = t;
      const l = ri(s);
      l.length > 0 && (r.style = l);
      let f;
      return uu(o) && (f = An("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(f || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, D3 = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return ii({
          type: "layer"
        }, () => {
          Ln("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((a) => {
            Array.isArray(a) ? a.map((o) => {
              r = r.concat(o.abstract);
            }) : r = r.concat(a.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(te.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, F3 = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: a = {},
          styles: o = {}
        } = t;
        return ii({
          type: "counter",
          content: e
        }, () => (Ln("beforeDOMElementCreation", {
          content: e,
          params: t
        }), y3({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(te.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, L3 = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = At,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: s = {}
        } = t;
        return ii({
          type: "text",
          content: e
        }, () => (Ln("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Dp({
          content: e,
          transform: Y(Y({}, At), n),
          title: r,
          extra: {
            attributes: o,
            styles: s,
            classes: ["".concat(te.cssPrefix, "-layers-text"), ...a]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: a,
        extra: o
      } = n;
      let s = null, l = null;
      if (rb) {
        const f = parseInt(getComputedStyle(t).fontSize, 10), u = t.getBoundingClientRect();
        s = u.width / f, l = u.height / f;
      }
      return te.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Dp({
        content: t.innerHTML,
        width: s,
        height: l,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const W3 = new RegExp('"', "ug"), Hp = [1105920, 1112319], Gp = Y(Y(Y(Y({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), u4), E4), x4), ql = Object.keys(Gp).reduce((e, t) => (e[t.toLowerCase()] = Gp[t], e), {}), V3 = Object.keys(ql).reduce((e, t) => {
  const n = ql[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function Y3(e) {
  const t = e.replace(W3, ""), n = X4(t, 0), r = n >= Hp[0] && n <= Hp[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: bb(a ? t[0] : t),
    isSecondary: r || a
  };
}
function U3(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (ql[n] || {})[a] || V3[n];
}
function Bp(e, t) {
  const n = "".concat(P4).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const o = Ar(e.children).filter((i) => i.getAttribute(zl) === t)[0], s = _n.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), f = l.match($4), u = s.getPropertyValue("font-weight"), d = s.getPropertyValue("content");
    if (o && !f)
      return e.removeChild(o), r();
    if (f && d !== "none" && d !== "") {
      const i = s.getPropertyValue("content");
      let c = U3(l, u);
      const {
        value: p,
        isSecondary: g
      } = Y3(i), m = f[0].startsWith("FontAwesome");
      let h = du(c, p), b = h;
      if (m) {
        const _ = t3(p);
        _.iconName && _.prefix && (h = _.iconName, c = _.prefix);
      }
      if (h && !g && (!o || o.getAttribute(iu) !== c || o.getAttribute(su) !== b)) {
        e.setAttribute(n, b), o && e.removeChild(o);
        const _ = T3(), {
          extra: k
        } = _;
        k.attributes[zl] = t, Hl(h, c).then((A) => {
          const v = pu(Y(Y({}, _), {}, {
            icons: {
              main: A,
              mask: Eb()
            },
            prefix: c,
            iconName: b,
            extra: k,
            watchable: !0
          })), H = Me.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(H, e.firstChild) : e.appendChild(H), H.outerHTML = v.map((F) => Ia(F)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function H3(e) {
  return Promise.all([Bp(e, "::before"), Bp(e, "::after")]);
}
function G3(e) {
  return e.parentNode !== document.head && !~N4.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(zl) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function qp(e) {
  if (Bt)
    return new Promise((t, n) => {
      const r = Ar(e.querySelectorAll("*")).filter(G3).map(H3), a = mu.begin("searchPseudoElements");
      Ib(), Promise.all(r).then(() => {
        a(), Bl(), t();
      }).catch(() => {
        a(), Bl(), n();
      });
    });
}
var B3 = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = qp, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = Me
      } = t;
      te.searchPseudoElements && qp(n);
    };
  }
};
let Xp = !1;
var q3 = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Ib(), Xp = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Vp(Vl("mutationObserverCallbacks", {}));
      },
      noAuto() {
        E3();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Xp ? Bl() : Vp(Vl("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Kp = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const a = r.toLowerCase().split("-"), o = a[0];
    let s = a.slice(1).join("-");
    if (o && s === "h")
      return n.flipX = !0, n;
    if (o && s === "v")
      return n.flipY = !0, n;
    if (s = parseFloat(s), isNaN(s))
      return n;
    switch (o) {
      case "grow":
        n.size = n.size + s;
        break;
      case "shrink":
        n.size = n.size - s;
        break;
      case "left":
        n.x = n.x - s;
        break;
      case "right":
        n.x = n.x + s;
        break;
      case "up":
        n.y = n.y - s;
        break;
      case "down":
        n.y = n.y + s;
        break;
      case "rotate":
        n.rotate = n.rotate + s;
        break;
    }
    return n;
  }, t);
};
var X3 = {
  mixout() {
    return {
      parse: {
        transform: (e) => Kp(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Kp(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: a,
        iconWidth: o
      } = t;
      const s = {
        transform: "translate(".concat(a / 2, " 256)")
      }, l = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), f = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), u = "rotate(".concat(r.rotate, " 0 0)"), d = {
        transform: "".concat(l, " ").concat(f, " ").concat(u)
      }, i = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, c = {
        outer: s,
        inner: d,
        path: i
      };
      return {
        tag: "g",
        attributes: Y({}, c.outer),
        children: [{
          tag: "g",
          attributes: Y({}, c.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: Y(Y({}, n.icon.attributes), c.path)
          }]
        }]
      };
    };
  }
};
const fs = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Qp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function K3(e) {
  return e.tag === "g" ? e.children : [e];
}
var Q3 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? oi(n.split(" ").map((a) => a.trim())) : Eb();
        return r.prefix || (r.prefix = kn()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        mask: o,
        maskId: s,
        transform: l
      } = t;
      const {
        width: f,
        icon: u
      } = a, {
        width: d,
        icon: i
      } = o, c = Y4({
        transform: l,
        containerWidth: d,
        iconWidth: f
      }), p = {
        tag: "rect",
        attributes: Y(Y({}, fs), {}, {
          fill: "white"
        })
      }, g = u.children ? {
        children: u.children.map(Qp)
      } : {}, m = {
        tag: "g",
        attributes: Y({}, c.inner),
        children: [Qp(Y({
          tag: u.tag,
          attributes: Y(Y({}, u.attributes), c.path)
        }, g))]
      }, h = {
        tag: "g",
        attributes: Y({}, c.outer),
        children: [m]
      }, b = "mask-".concat(s || xa()), _ = "clip-".concat(s || xa()), k = {
        tag: "mask",
        attributes: Y(Y({}, fs), {}, {
          id: b,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [p, h]
      }, A = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: _
          },
          children: K3(i)
        }, k]
      };
      return n.push(A, {
        tag: "rect",
        attributes: Y({
          fill: "currentColor",
          "clip-path": "url(#".concat(_, ")"),
          mask: "url(#".concat(b, ")")
        }, fs)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, J3 = {
  provides(e) {
    let t = !1;
    _n.matchMedia && (t = _n.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: Y(Y({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = Y(Y({}, a), {}, {
        attributeName: "opacity"
      }), s = {
        tag: "circle",
        attributes: Y(Y({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || s.children.push({
        tag: "animate",
        attributes: Y(Y({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: Y(Y({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(s), n.push({
        tag: "path",
        attributes: Y(Y({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: Y(Y({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: Y(Y({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: Y(Y({}, o), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: n
      };
    };
  }
}, Z3 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, eE = [G4, z3, D3, F3, L3, B3, q3, X3, Q3, J3, Z3];
u3(eE, {
  mixoutsTo: Ze
});
Ze.noAuto;
Ze.config;
Ze.library;
Ze.dom;
const Xl = Ze.parse;
Ze.findIconDefinition;
Ze.toHtml;
const tE = Ze.icon;
Ze.layer;
Ze.text;
Ze.counter;
function nE(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Qa = { exports: {} }, ds = { exports: {} }, ke = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Jp;
function rE() {
  if (Jp) return ke;
  Jp = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
  function k(v) {
    if (typeof v == "object" && v !== null) {
      var H = v.$$typeof;
      switch (H) {
        case t:
          switch (v = v.type, v) {
            case f:
            case u:
            case r:
            case o:
            case a:
            case i:
              return v;
            default:
              switch (v = v && v.$$typeof, v) {
                case l:
                case d:
                case g:
                case p:
                case s:
                  return v;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function A(v) {
    return k(v) === u;
  }
  return ke.AsyncMode = f, ke.ConcurrentMode = u, ke.ContextConsumer = l, ke.ContextProvider = s, ke.Element = t, ke.ForwardRef = d, ke.Fragment = r, ke.Lazy = g, ke.Memo = p, ke.Portal = n, ke.Profiler = o, ke.StrictMode = a, ke.Suspense = i, ke.isAsyncMode = function(v) {
    return A(v) || k(v) === f;
  }, ke.isConcurrentMode = A, ke.isContextConsumer = function(v) {
    return k(v) === l;
  }, ke.isContextProvider = function(v) {
    return k(v) === s;
  }, ke.isElement = function(v) {
    return typeof v == "object" && v !== null && v.$$typeof === t;
  }, ke.isForwardRef = function(v) {
    return k(v) === d;
  }, ke.isFragment = function(v) {
    return k(v) === r;
  }, ke.isLazy = function(v) {
    return k(v) === g;
  }, ke.isMemo = function(v) {
    return k(v) === p;
  }, ke.isPortal = function(v) {
    return k(v) === n;
  }, ke.isProfiler = function(v) {
    return k(v) === o;
  }, ke.isStrictMode = function(v) {
    return k(v) === a;
  }, ke.isSuspense = function(v) {
    return k(v) === i;
  }, ke.isValidElementType = function(v) {
    return typeof v == "string" || typeof v == "function" || v === r || v === u || v === o || v === a || v === i || v === c || typeof v == "object" && v !== null && (v.$$typeof === g || v.$$typeof === p || v.$$typeof === s || v.$$typeof === l || v.$$typeof === d || v.$$typeof === h || v.$$typeof === b || v.$$typeof === _ || v.$$typeof === m);
  }, ke.typeOf = k, ke;
}
var Se = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Zp;
function aE() {
  return Zp || (Zp = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, u = e ? Symbol.for("react.concurrent_mode") : 60111, d = e ? Symbol.for("react.forward_ref") : 60112, i = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, g = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, h = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
    function k(w) {
      return typeof w == "string" || typeof w == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      w === r || w === u || w === o || w === a || w === i || w === c || typeof w == "object" && w !== null && (w.$$typeof === g || w.$$typeof === p || w.$$typeof === s || w.$$typeof === l || w.$$typeof === d || w.$$typeof === h || w.$$typeof === b || w.$$typeof === _ || w.$$typeof === m);
    }
    function A(w) {
      if (typeof w == "object" && w !== null) {
        var ce = w.$$typeof;
        switch (ce) {
          case t:
            var Ee = w.type;
            switch (Ee) {
              case f:
              case u:
              case r:
              case o:
              case a:
              case i:
                return Ee;
              default:
                var Ue = Ee && Ee.$$typeof;
                switch (Ue) {
                  case l:
                  case d:
                  case g:
                  case p:
                  case s:
                    return Ue;
                  default:
                    return ce;
                }
            }
          case n:
            return ce;
        }
      }
    }
    var v = f, H = u, F = l, Q = s, B = t, ie = d, ae = r, R = g, le = p, D = n, M = o, z = a, K = i, X = !1;
    function oe(w) {
      return X || (X = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), y(w) || A(w) === f;
    }
    function y(w) {
      return A(w) === u;
    }
    function x(w) {
      return A(w) === l;
    }
    function P(w) {
      return A(w) === s;
    }
    function N(w) {
      return typeof w == "object" && w !== null && w.$$typeof === t;
    }
    function O(w) {
      return A(w) === d;
    }
    function T(w) {
      return A(w) === r;
    }
    function S(w) {
      return A(w) === g;
    }
    function E(w) {
      return A(w) === p;
    }
    function $(w) {
      return A(w) === n;
    }
    function I(w) {
      return A(w) === o;
    }
    function j(w) {
      return A(w) === a;
    }
    function q(w) {
      return A(w) === i;
    }
    Se.AsyncMode = v, Se.ConcurrentMode = H, Se.ContextConsumer = F, Se.ContextProvider = Q, Se.Element = B, Se.ForwardRef = ie, Se.Fragment = ae, Se.Lazy = R, Se.Memo = le, Se.Portal = D, Se.Profiler = M, Se.StrictMode = z, Se.Suspense = K, Se.isAsyncMode = oe, Se.isConcurrentMode = y, Se.isContextConsumer = x, Se.isContextProvider = P, Se.isElement = N, Se.isForwardRef = O, Se.isFragment = T, Se.isLazy = S, Se.isMemo = E, Se.isPortal = $, Se.isProfiler = I, Se.isStrictMode = j, Se.isSuspense = q, Se.isValidElementType = k, Se.typeOf = A;
  }()), Se;
}
var em;
function jb() {
  return em || (em = 1, process.env.NODE_ENV === "production" ? ds.exports = rE() : ds.exports = aE()), ds.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var ps, tm;
function oE() {
  if (tm) return ps;
  tm = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(o) {
    if (o == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(o);
  }
  function a() {
    try {
      if (!Object.assign)
        return !1;
      var o = new String("abc");
      if (o[5] = "de", Object.getOwnPropertyNames(o)[0] === "5")
        return !1;
      for (var s = {}, l = 0; l < 10; l++)
        s["_" + String.fromCharCode(l)] = l;
      var f = Object.getOwnPropertyNames(s).map(function(d) {
        return s[d];
      });
      if (f.join("") !== "0123456789")
        return !1;
      var u = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(d) {
        u[d] = d;
      }), Object.keys(Object.assign({}, u)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return ps = a() ? Object.assign : function(o, s) {
    for (var l, f = r(o), u, d = 1; d < arguments.length; d++) {
      l = Object(arguments[d]);
      for (var i in l)
        t.call(l, i) && (f[i] = l[i]);
      if (e) {
        u = e(l);
        for (var c = 0; c < u.length; c++)
          n.call(l, u[c]) && (f[u[c]] = l[u[c]]);
      }
    }
    return f;
  }, ps;
}
var ms, nm;
function gu() {
  if (nm) return ms;
  nm = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ms = e, ms;
}
var rm, am;
function Mb() {
  return am || (am = 1, rm = Function.call.bind(Object.prototype.hasOwnProperty)), rm;
}
var hs, om;
function iE() {
  if (om) return hs;
  om = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ gu(), n = {}, r = /* @__PURE__ */ Mb();
    e = function(o) {
      var s = "Warning: " + o;
      typeof console < "u" && console.error(s);
      try {
        throw new Error(s);
      } catch {
      }
    };
  }
  function a(o, s, l, f, u) {
    if (process.env.NODE_ENV !== "production") {
      for (var d in o)
        if (r(o, d)) {
          var i;
          try {
            if (typeof o[d] != "function") {
              var c = Error(
                (f || "React class") + ": " + l + " type `" + d + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[d] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw c.name = "Invariant Violation", c;
            }
            i = o[d](s, d, f, l, null, t);
          } catch (g) {
            i = g;
          }
          if (i && !(i instanceof Error) && e(
            (f || "React class") + ": type specification of " + l + " `" + d + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof i + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), i instanceof Error && !(i.message in n)) {
            n[i.message] = !0;
            var p = u ? u() : "";
            e(
              "Failed " + l + " type: " + i.message + (p ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, hs = a, hs;
}
var gs, im;
function sE() {
  if (im) return gs;
  im = 1;
  var e = jb(), t = oE(), n = /* @__PURE__ */ gu(), r = /* @__PURE__ */ Mb(), a = /* @__PURE__ */ iE(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(l) {
    var f = "Warning: " + l;
    typeof console < "u" && console.error(f);
    try {
      throw new Error(f);
    } catch {
    }
  });
  function s() {
    return null;
  }
  return gs = function(l, f) {
    var u = typeof Symbol == "function" && Symbol.iterator, d = "@@iterator";
    function i(y) {
      var x = y && (u && y[u] || y[d]);
      if (typeof x == "function")
        return x;
    }
    var c = "<<anonymous>>", p = {
      array: b("array"),
      bigint: b("bigint"),
      bool: b("boolean"),
      func: b("function"),
      number: b("number"),
      object: b("object"),
      string: b("string"),
      symbol: b("symbol"),
      any: _(),
      arrayOf: k,
      element: A(),
      elementType: v(),
      instanceOf: H,
      node: ie(),
      objectOf: Q,
      oneOf: F,
      oneOfType: B,
      shape: R,
      exact: le
    };
    function g(y, x) {
      return y === x ? y !== 0 || 1 / y === 1 / x : y !== y && x !== x;
    }
    function m(y, x) {
      this.message = y, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function h(y) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, P = 0;
      function N(T, S, E, $, I, j, q) {
        if ($ = $ || c, j = j || E, q !== n) {
          if (f) {
            var w = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw w.name = "Invariant Violation", w;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ce = $ + ":" + E;
            !x[ce] && // Avoid spamming the console because they are often not actionable except for lib authors
            P < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + j + "` prop on `" + $ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[ce] = !0, P++);
          }
        }
        return S[E] == null ? T ? S[E] === null ? new m("The " + I + " `" + j + "` is marked as required " + ("in `" + $ + "`, but its value is `null`.")) : new m("The " + I + " `" + j + "` is marked as required in " + ("`" + $ + "`, but its value is `undefined`.")) : null : y(S, E, $, I, j);
      }
      var O = N.bind(null, !1);
      return O.isRequired = N.bind(null, !0), O;
    }
    function b(y) {
      function x(P, N, O, T, S, E) {
        var $ = P[N], I = z($);
        if (I !== y) {
          var j = K($);
          return new m(
            "Invalid " + T + " `" + S + "` of type " + ("`" + j + "` supplied to `" + O + "`, expected ") + ("`" + y + "`."),
            { expectedType: y }
          );
        }
        return null;
      }
      return h(x);
    }
    function _() {
      return h(s);
    }
    function k(y) {
      function x(P, N, O, T, S) {
        if (typeof y != "function")
          return new m("Property `" + S + "` of component `" + O + "` has invalid PropType notation inside arrayOf.");
        var E = P[N];
        if (!Array.isArray(E)) {
          var $ = z(E);
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected an array."));
        }
        for (var I = 0; I < E.length; I++) {
          var j = y(E, I, O, T, S + "[" + I + "]", n);
          if (j instanceof Error)
            return j;
        }
        return null;
      }
      return h(x);
    }
    function A() {
      function y(x, P, N, O, T) {
        var S = x[P];
        if (!l(S)) {
          var E = z(S);
          return new m("Invalid " + O + " `" + T + "` of type " + ("`" + E + "` supplied to `" + N + "`, expected a single ReactElement."));
        }
        return null;
      }
      return h(y);
    }
    function v() {
      function y(x, P, N, O, T) {
        var S = x[P];
        if (!e.isValidElementType(S)) {
          var E = z(S);
          return new m("Invalid " + O + " `" + T + "` of type " + ("`" + E + "` supplied to `" + N + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return h(y);
    }
    function H(y) {
      function x(P, N, O, T, S) {
        if (!(P[N] instanceof y)) {
          var E = y.name || c, $ = oe(P[N]);
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected ") + ("instance of `" + E + "`."));
        }
        return null;
      }
      return h(x);
    }
    function F(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), s;
      function x(P, N, O, T, S) {
        for (var E = P[N], $ = 0; $ < y.length; $++)
          if (g(E, y[$]))
            return null;
        var I = JSON.stringify(y, function(j, q) {
          var w = K(q);
          return w === "symbol" ? String(q) : q;
        });
        return new m("Invalid " + T + " `" + S + "` of value `" + String(E) + "` " + ("supplied to `" + O + "`, expected one of " + I + "."));
      }
      return h(x);
    }
    function Q(y) {
      function x(P, N, O, T, S) {
        if (typeof y != "function")
          return new m("Property `" + S + "` of component `" + O + "` has invalid PropType notation inside objectOf.");
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type " + ("`" + $ + "` supplied to `" + O + "`, expected an object."));
        for (var I in E)
          if (r(E, I)) {
            var j = y(E, I, O, T, S + "." + I, n);
            if (j instanceof Error)
              return j;
          }
        return null;
      }
      return h(x);
    }
    function B(y) {
      if (!Array.isArray(y))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), s;
      for (var x = 0; x < y.length; x++) {
        var P = y[x];
        if (typeof P != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + X(P) + " at index " + x + "."
          ), s;
      }
      function N(O, T, S, E, $) {
        for (var I = [], j = 0; j < y.length; j++) {
          var q = y[j], w = q(O, T, S, E, $, n);
          if (w == null)
            return null;
          w.data && r(w.data, "expectedType") && I.push(w.data.expectedType);
        }
        var ce = I.length > 0 ? ", expected one of type [" + I.join(", ") + "]" : "";
        return new m("Invalid " + E + " `" + $ + "` supplied to " + ("`" + S + "`" + ce + "."));
      }
      return h(N);
    }
    function ie() {
      function y(x, P, N, O, T) {
        return D(x[P]) ? null : new m("Invalid " + O + " `" + T + "` supplied to " + ("`" + N + "`, expected a ReactNode."));
      }
      return h(y);
    }
    function ae(y, x, P, N, O) {
      return new m(
        (y || "React class") + ": " + x + " type `" + P + "." + N + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + O + "`."
      );
    }
    function R(y) {
      function x(P, N, O, T, S) {
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type `" + $ + "` " + ("supplied to `" + O + "`, expected `object`."));
        for (var I in y) {
          var j = y[I];
          if (typeof j != "function")
            return ae(O, T, S, I, K(j));
          var q = j(E, I, O, T, S + "." + I, n);
          if (q)
            return q;
        }
        return null;
      }
      return h(x);
    }
    function le(y) {
      function x(P, N, O, T, S) {
        var E = P[N], $ = z(E);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + S + "` of type `" + $ + "` " + ("supplied to `" + O + "`, expected `object`."));
        var I = t({}, P[N], y);
        for (var j in I) {
          var q = y[j];
          if (r(y, j) && typeof q != "function")
            return ae(O, T, S, j, K(q));
          if (!q)
            return new m(
              "Invalid " + T + " `" + S + "` key `" + j + "` supplied to `" + O + "`.\nBad object: " + JSON.stringify(P[N], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(y), null, "  ")
            );
          var w = q(E, j, O, T, S + "." + j, n);
          if (w)
            return w;
        }
        return null;
      }
      return h(x);
    }
    function D(y) {
      switch (typeof y) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !y;
        case "object":
          if (Array.isArray(y))
            return y.every(D);
          if (y === null || l(y))
            return !0;
          var x = i(y);
          if (x) {
            var P = x.call(y), N;
            if (x !== y.entries) {
              for (; !(N = P.next()).done; )
                if (!D(N.value))
                  return !1;
            } else
              for (; !(N = P.next()).done; ) {
                var O = N.value;
                if (O && !D(O[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function M(y, x) {
      return y === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function z(y) {
      var x = typeof y;
      return Array.isArray(y) ? "array" : y instanceof RegExp ? "object" : M(x, y) ? "symbol" : x;
    }
    function K(y) {
      if (typeof y > "u" || y === null)
        return "" + y;
      var x = z(y);
      if (x === "object") {
        if (y instanceof Date)
          return "date";
        if (y instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function X(y) {
      var x = K(y);
      switch (x) {
        case "array":
        case "object":
          return "an " + x;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + x;
        default:
          return x;
      }
    }
    function oe(y) {
      return !y.constructor || !y.constructor.name ? c : y.constructor.name;
    }
    return p.checkPropTypes = a, p.resetWarningCache = a.resetWarningCache, p.PropTypes = p, p;
  }, gs;
}
var ys, sm;
function lE() {
  if (sm) return ys;
  sm = 1;
  var e = /* @__PURE__ */ gu();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, ys = function() {
    function r(s, l, f, u, d, i) {
      if (i !== e) {
        var c = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw c.name = "Invariant Violation", c;
      }
    }
    r.isRequired = r;
    function a() {
      return r;
    }
    var o = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: a,
      element: r,
      elementType: r,
      instanceOf: a,
      node: r,
      objectOf: a,
      oneOf: a,
      oneOfType: a,
      shape: a,
      exact: a,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, ys;
}
var lm;
function cE() {
  if (lm) return Qa.exports;
  if (lm = 1, process.env.NODE_ENV !== "production") {
    var e = jb(), t = !0;
    Qa.exports = /* @__PURE__ */ sE()(e.isElement, t);
  } else
    Qa.exports = /* @__PURE__ */ lE()();
  return Qa.exports;
}
var uE = /* @__PURE__ */ cE();
const ye = /* @__PURE__ */ nE(uE);
function cm(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function gt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? cm(Object(n), !0).forEach(function(r) {
      nr(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : cm(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Co(e) {
  "@babel/helpers - typeof";
  return Co = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Co(e);
}
function nr(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function fE(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function dE(e, t) {
  if (e == null) return {};
  var n = fE(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Kl(e) {
  return pE(e) || mE(e) || hE(e) || gE();
}
function pE(e) {
  if (Array.isArray(e)) return Ql(e);
}
function mE(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function hE(e, t) {
  if (e) {
    if (typeof e == "string") return Ql(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Ql(e, t);
  }
}
function Ql(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function gE() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function yE(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, s = e.shake, l = e.flash, f = e.spin, u = e.spinPulse, d = e.spinReverse, i = e.pulse, c = e.fixedWidth, p = e.inverse, g = e.border, m = e.listItem, h = e.flip, b = e.size, _ = e.rotation, k = e.pull, A = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": s,
    "fa-flash": l,
    "fa-spin": f,
    "fa-spin-reverse": d,
    "fa-spin-pulse": u,
    "fa-pulse": i,
    "fa-fw": c,
    "fa-inverse": p,
    "fa-border": g,
    "fa-li": m,
    "fa-flip": h === !0,
    "fa-flip-horizontal": h === "horizontal" || h === "both",
    "fa-flip-vertical": h === "vertical" || h === "both"
  }, nr(t, "fa-".concat(b), typeof b < "u" && b !== null), nr(t, "fa-rotate-".concat(_), typeof _ < "u" && _ !== null && _ !== 0), nr(t, "fa-pull-".concat(k), typeof k < "u" && k !== null), nr(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(A).map(function(v) {
    return A[v] ? v : null;
  }).filter(function(v) {
    return v;
  });
}
function bE(e) {
  return e = e - 0, e === e;
}
function Rb(e) {
  return bE(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var vE = ["style"];
function xE(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function wE(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Rb(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[xE(a)] = o : t[a] = o, t;
  }, {});
}
function zb(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(f) {
    return zb(e, f);
  }), a = Object.keys(t.attributes || {}).reduce(function(f, u) {
    var d = t.attributes[u];
    switch (u) {
      case "class":
        f.attrs.className = d, delete t.attributes.class;
        break;
      case "style":
        f.attrs.style = wE(d);
        break;
      default:
        u.indexOf("aria-") === 0 || u.indexOf("data-") === 0 ? f.attrs[u.toLowerCase()] = d : f.attrs[Rb(u)] = d;
    }
    return f;
  }, {
    attrs: {}
  }), o = n.style, s = o === void 0 ? {} : o, l = dE(n, vE);
  return a.attrs.style = gt(gt({}, a.attrs.style), s), e.apply(void 0, [t.tag, gt(gt({}, a.attrs), l)].concat(Kl(r)));
}
var Db = !1;
try {
  Db = process.env.NODE_ENV === "production";
} catch {
}
function _E() {
  if (!Db && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function um(e) {
  if (e && Co(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Xl.icon)
    return Xl.icon(e);
  if (e === null)
    return null;
  if (e && Co(e) === "object" && e.prefix && e.iconName)
    return e;
  if (Array.isArray(e) && e.length === 2)
    return {
      prefix: e[0],
      iconName: e[1]
    };
  if (typeof e == "string")
    return {
      prefix: "fas",
      iconName: e
    };
}
function bs(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? nr({}, e, t) : {};
}
var fm = {
  border: !1,
  className: "",
  mask: null,
  maskId: null,
  fixedWidth: !1,
  inverse: !1,
  flip: !1,
  icon: null,
  listItem: !1,
  pull: null,
  pulse: !1,
  rotation: null,
  size: null,
  spin: !1,
  spinPulse: !1,
  spinReverse: !1,
  beat: !1,
  fade: !1,
  beatFade: !1,
  bounce: !1,
  shake: !1,
  symbol: !1,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: !1
}, Be = /* @__PURE__ */ On.forwardRef(function(e, t) {
  var n = gt(gt({}, fm), e), r = n.icon, a = n.mask, o = n.symbol, s = n.className, l = n.title, f = n.titleId, u = n.maskId, d = um(r), i = bs("classes", [].concat(Kl(yE(n)), Kl((s || "").split(" ")))), c = bs("transform", typeof n.transform == "string" ? Xl.transform(n.transform) : n.transform), p = bs("mask", um(a)), g = tE(d, gt(gt(gt(gt({}, i), c), p), {}, {
    symbol: o,
    title: l,
    titleId: f,
    maskId: u
  }));
  if (!g)
    return _E("Could not find icon", d), null;
  var m = g.abstract, h = {
    ref: t
  };
  return Object.keys(n).forEach(function(b) {
    fm.hasOwnProperty(b) || (h[b] = n[b]);
  }), kE(m[0], h);
});
Be.displayName = "FontAwesomeIcon";
Be.propTypes = {
  beat: ye.bool,
  border: ye.bool,
  beatFade: ye.bool,
  bounce: ye.bool,
  className: ye.string,
  fade: ye.bool,
  flash: ye.bool,
  mask: ye.oneOfType([ye.object, ye.array, ye.string]),
  maskId: ye.string,
  fixedWidth: ye.bool,
  inverse: ye.bool,
  flip: ye.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: ye.oneOfType([ye.object, ye.array, ye.string]),
  listItem: ye.bool,
  pull: ye.oneOf(["right", "left"]),
  pulse: ye.bool,
  rotation: ye.oneOf([0, 90, 180, 270]),
  shake: ye.bool,
  size: ye.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: ye.bool,
  spinPulse: ye.bool,
  spinReverse: ye.bool,
  symbol: ye.oneOfType([ye.bool, ye.string]),
  title: ye.string,
  titleId: ye.string,
  transform: ye.oneOfType([ye.string, ye.object]),
  swapOpacity: ye.bool
};
var kE = zb.bind(null, On.createElement);
const yu = "-", AE = (e) => {
  const t = SE(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(yu);
      return o[0] === "" && o.length !== 1 && o.shift(), Fb(o, t) || OE(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const s = n[a] || [];
      return o && r[a] ? [...s, ...r[a]] : s;
    }
  };
}, Fb = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], a = t.nextPart.get(r), o = a ? Fb(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const s = e.join(yu);
  return (n = t.validators.find(({
    validator: l
  }) => l(s))) == null ? void 0 : n.classGroupId;
}, dm = /^\[(.+)\]$/, OE = (e) => {
  if (dm.test(e)) {
    const t = dm.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, SE = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return PE(Object.entries(e.classGroups), n).forEach(([a, o]) => {
    Jl(o, r, a, t);
  }), r;
}, Jl = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : pm(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (EE(a)) {
        Jl(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, s]) => {
      Jl(s, pm(t, o), n, r);
    });
  });
}, pm = (e, t) => {
  let n = e;
  return t.split(yu).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, EE = (e) => e.isThemeGetter, PE = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([s, l]) => [t + s, l])) : o);
  return [n, a];
}) : e, CE = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const a = (o, s) => {
    n.set(o, s), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let s = n.get(o);
      if (s !== void 0)
        return s;
      if ((s = r.get(o)) !== void 0)
        return a(o, s), s;
    },
    set(o, s) {
      n.has(o) ? n.set(o, s) : a(o, s);
    }
  };
}, Lb = "!", NE = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, s = (l) => {
    const f = [];
    let u = 0, d = 0, i;
    for (let h = 0; h < l.length; h++) {
      let b = l[h];
      if (u === 0) {
        if (b === a && (r || l.slice(h, h + o) === t)) {
          f.push(l.slice(d, h)), d = h + o;
          continue;
        }
        if (b === "/") {
          i = h;
          continue;
        }
      }
      b === "[" ? u++ : b === "]" && u--;
    }
    const c = f.length === 0 ? l : l.substring(d), p = c.startsWith(Lb), g = p ? c.substring(1) : c, m = i && i > d ? i - d : void 0;
    return {
      modifiers: f,
      hasImportantModifier: p,
      baseClassName: g,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (l) => n({
    className: l,
    parseClassName: s
  }) : s;
}, TE = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, IE = (e) => ({
  cache: CE(e.cacheSize),
  parseClassName: NE(e),
  ...AE(e)
}), $E = /\s+/, jE = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], s = e.trim().split($E);
  let l = "";
  for (let f = s.length - 1; f >= 0; f -= 1) {
    const u = s[f], {
      modifiers: d,
      hasImportantModifier: i,
      baseClassName: c,
      maybePostfixModifierPosition: p
    } = n(u);
    let g = !!p, m = r(g ? c.substring(0, p) : c);
    if (!m) {
      if (!g) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      if (m = r(c), !m) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      g = !1;
    }
    const h = TE(d).join(":"), b = i ? h + Lb : h, _ = b + m;
    if (o.includes(_))
      continue;
    o.push(_);
    const k = a(m, g);
    for (let A = 0; A < k.length; ++A) {
      const v = k[A];
      o.push(b + v);
    }
    l = u + (l.length > 0 ? " " + l : l);
  }
  return l;
};
function ME() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Wb(t)) && (r && (r += " "), r += n);
  return r;
}
const Wb = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Wb(e[r])) && (n && (n += " "), n += t);
  return n;
};
function RE(e, ...t) {
  let n, r, a, o = s;
  function s(f) {
    const u = t.reduce((d, i) => i(d), e());
    return n = IE(u), r = n.cache.get, a = n.cache.set, o = l, l(f);
  }
  function l(f) {
    const u = r(f);
    if (u)
      return u;
    const d = jE(f, n);
    return a(f, d), d;
  }
  return function() {
    return o(ME.apply(null, arguments));
  };
}
const Te = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Vb = /^\[(?:([a-z-]+):)?(.+)\]$/i, zE = /^\d+\/\d+$/, DE = /* @__PURE__ */ new Set(["px", "full", "screen"]), FE = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, LE = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, WE = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, VE = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, YE = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Nt = (e) => dr(e) || DE.has(e) || zE.test(e), rn = (e) => Or(e, "length", QE), dr = (e) => !!e && !Number.isNaN(Number(e)), vs = (e) => Or(e, "number", dr), jr = (e) => !!e && Number.isInteger(Number(e)), UE = (e) => e.endsWith("%") && dr(e.slice(0, -1)), de = (e) => Vb.test(e), an = (e) => FE.test(e), HE = /* @__PURE__ */ new Set(["length", "size", "percentage"]), GE = (e) => Or(e, HE, Yb), BE = (e) => Or(e, "position", Yb), qE = /* @__PURE__ */ new Set(["image", "url"]), XE = (e) => Or(e, qE, ZE), KE = (e) => Or(e, "", JE), Mr = () => !0, Or = (e, t, n) => {
  const r = Vb.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, QE = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  LE.test(e) && !WE.test(e)
), Yb = () => !1, JE = (e) => VE.test(e), ZE = (e) => YE.test(e), eP = () => {
  const e = Te("colors"), t = Te("spacing"), n = Te("blur"), r = Te("brightness"), a = Te("borderColor"), o = Te("borderRadius"), s = Te("borderSpacing"), l = Te("borderWidth"), f = Te("contrast"), u = Te("grayscale"), d = Te("hueRotate"), i = Te("invert"), c = Te("gap"), p = Te("gradientColorStops"), g = Te("gradientColorStopPositions"), m = Te("inset"), h = Te("margin"), b = Te("opacity"), _ = Te("padding"), k = Te("saturate"), A = Te("scale"), v = Te("sepia"), H = Te("skew"), F = Te("space"), Q = Te("translate"), B = () => ["auto", "contain", "none"], ie = () => ["auto", "hidden", "clip", "visible", "scroll"], ae = () => ["auto", de, t], R = () => [de, t], le = () => ["", Nt, rn], D = () => ["auto", dr, de], M = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], z = () => ["solid", "dashed", "dotted", "double", "none"], K = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], X = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], oe = () => ["", "0", de], y = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [dr, de];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Mr],
      spacing: [Nt, rn],
      blur: ["none", "", an, de],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", an, de],
      borderSpacing: R(),
      borderWidth: le(),
      contrast: x(),
      grayscale: oe(),
      hueRotate: x(),
      invert: oe(),
      gap: R(),
      gradientColorStops: [e],
      gradientColorStopPositions: [UE, rn],
      inset: ae(),
      margin: ae(),
      opacity: x(),
      padding: R(),
      saturate: x(),
      scale: x(),
      sepia: oe(),
      skew: x(),
      space: R(),
      translate: R()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", de]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [an]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": y()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": y()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: [...M(), de]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ie()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ie()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ie()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: B()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": B()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": B()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: [m]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [m]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [m]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [m]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [m]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [m]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [m]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [m]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [m]
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: ["auto", jr, de]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ae()
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["wrap", "wrap-reverse", "nowrap"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: ["1", "auto", "initial", "none", de]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: oe()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: oe()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", jr, de]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Mr]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", jr, de]
        }, de]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": D()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": D()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Mr]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [jr, de]
        }, de]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": D()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": D()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": ["auto", "min", "max", "fr", de]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", de]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [c]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [c]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [c]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...X()]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": ["start", "end", "center", "stretch"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", "start", "end", "center", "stretch"]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...X(), "baseline"]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", "start", "end", "center", "stretch", "baseline"]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": [...X(), "baseline"]
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": ["start", "end", "center", "baseline", "stretch"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", "start", "end", "center", "stretch"]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: [_]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [_]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [_]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [_]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [_]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [_]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [_]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [_]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [_]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [h]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [h]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [h]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [h]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [h]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [h]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [h]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [h]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [h]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [F]
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */
      "space-y": [{
        "space-y": [F]
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */
      "space-y-reverse": ["space-y-reverse"],
      // Sizing
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", de, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [de, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [de, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [an]
        }, an]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [de, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [de, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [de, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [de, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", an, rn]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", vs]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Mr]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", de]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", dr, vs]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Nt, de]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", de]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", de]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: [e]
      }],
      /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */
      "placeholder-opacity": [{
        "placeholder-opacity": [b]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: [e]
      }],
      /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */
      "text-opacity": [{
        "text-opacity": [b]
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...z(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Nt, rn]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Nt, de]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: [e]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: R()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", de]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", de]
      }],
      // Backgrounds
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */
      "bg-opacity": [{
        "bg-opacity": [b]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: [...M(), BE]
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: ["no-repeat", {
          repeat: ["", "x", "y", "round", "space"]
        }]
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: ["auto", "cover", "contain", GE]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, XE]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: [e]
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: [g]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [g]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [g]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [p]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [p]
      }],
      // Borders
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: [o]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [o]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [o]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [o]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [o]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [o]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [o]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [o]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [o]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [o]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [o]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [o]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [o]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [o]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [o]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [l]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [l]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [l]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [l]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [l]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [l]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [l]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [l]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [l]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [b]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...z(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [l]
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y": [{
        "divide-y": [l]
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */
      "divide-opacity": [{
        "divide-opacity": [b]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: z()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [a]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [a]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [a]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [a]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [a]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [a]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [a]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [a]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [a]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [a]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...z()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Nt, de]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Nt, rn]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: [e]
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w": [{
        ring: le()
      }],
      /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */
      "ring-color": [{
        ring: [e]
      }],
      /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */
      "ring-opacity": [{
        "ring-opacity": [b]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Nt, rn]
      }],
      /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */
      "ring-offset-color": [{
        "ring-offset": [e]
      }],
      // Effects
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: ["", "inner", "none", an, KE]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Mr]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [b]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...K(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": K()
      }],
      // Filters
      /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: ["", "none"]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: [n]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [r]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [f]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", an, de]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [u]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [d]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [i]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [k]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [v]
      }],
      /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": ["", "none"]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": [n]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [r]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [f]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [u]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [d]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [i]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [b]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [k]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [v]
      }],
      // Tables
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": [s]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [s]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [s]
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // Transitions and Animation
      /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", de]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: x()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", de]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: x()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", de]
      }],
      // Transforms
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: ["", "gpu", "none"]
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: [A]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [A]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [A]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [jr, de]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [Q]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [Q]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [H]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [H]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", de]
      }],
      // Interactivity
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: ["auto", e]
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", de]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: [e]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["none", "auto"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "y", "x", ""]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": R()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": R()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": R()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": R()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": R()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": R()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": R()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": R()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": R()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": R()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": R()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": R()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": R()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": R()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": R()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": R()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": R()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": R()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", de]
      }],
      // SVG
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: [e, "none"]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [Nt, rn, vs]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: [e, "none"]
      }],
      // Accessibility
      /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    }
  };
}, mm = /* @__PURE__ */ RE(eP);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Bn = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, tP = ({
  icon: e,
  iconClassName: t,
  children: n,
  className: r,
  htmlFor: a,
  variant: o = "primary",
  disabled: s,
  iconFlip: l = !1,
  loading: f,
  as: u = "button",
  href: d,
  target: i,
  ...c
}) => {
  function p(h) {
    switch (h) {
      case "secondary":
        return "i-am-a-unique-string bg-ui-controls text-base-fg border border-ui-controls-border hover:bg-ui-controls/80 focus-visible:outline-secondary";
      case "action":
        return "bg-ui-controls text-base-fg border border-ui-controls-border hover:bg-ui-controls/80 focus-visible:outline-action";
      case "destructive":
        return "bg-red hover:bg-red/90 text-white focus-visible:outline-red";
      case "ghost":
        return "bg-transparent text-base-fg border border-ui-controls-border/70 hover:bg-ui-controls/30 focus-visible:outline-primary-600";
      case "primary":
      default:
        return "bg-primary hover:bg-primary-400 text-white focus-visible:outline-primary-600";
    }
  }
  const g = mm(
    s || f ? "opacity-50 pointer-events-none" : ""
  ), m = mm(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    p(o),
    r,
    g
  );
  return a ? /* @__PURE__ */ He("label", { className: m, htmlFor: a, style: c.style, children: [
    f && !l ? /* @__PURE__ */ G(Be, { icon: Bn, className: "animate-spin" }) : /* @__PURE__ */ G(ft, { children: e && !l ? /* @__PURE__ */ G(Be, { icon: e, className: t }) : null }),
    n,
    f && l ? /* @__PURE__ */ G(Be, { icon: Bn, className: "animate-spin" }) : /* @__PURE__ */ G(ft, { children: e && l ? /* @__PURE__ */ G(Be, { icon: e, className: t }) : null })
  ] }) : u === "link" && d ? /* @__PURE__ */ He(
    "a",
    {
      href: d,
      className: m,
      style: c.style,
      ...c,
      target: i,
      children: [
        f && !l ? /* @__PURE__ */ G(Be, { icon: Bn, className: "animate-spin" }) : /* @__PURE__ */ G(ft, { children: e && !l ? /* @__PURE__ */ G(Be, { icon: e, className: t }) : null }),
        n,
        f && l ? /* @__PURE__ */ G(Be, { icon: Bn, className: "animate-spin" }) : /* @__PURE__ */ G(ft, { children: e && l ? /* @__PURE__ */ G(Be, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ He(
    "button",
    {
      className: m,
      disabled: s || f,
      ...c,
      htmlFor: a,
      children: [
        f && !l ? /* @__PURE__ */ G(Be, { icon: Bn, className: "animate-spin" }) : /* @__PURE__ */ G(ft, { children: e && !l ? /* @__PURE__ */ G(Be, { icon: e, className: t }) : null }),
        n,
        f && l ? /* @__PURE__ */ G(Be, { icon: Bn, className: "animate-spin" }) : /* @__PURE__ */ G(ft, { children: e && l ? /* @__PURE__ */ G(Be, { icon: e, className: t }) : null })
      ]
    }
  );
};
var uo = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(uo || {});
uo.FEATURED, uo.MINE, uo.BOOKMARKED;
function nP(e, t = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(e, t);
}
async function Ub(e, t = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(e, t, n);
}
var hm;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(hm || (hm = {}));
async function rP(e, t) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e, t), await Ub("plugin:event|unlisten", {
    event: e,
    eventId: t
  });
}
async function aP(e, t, n) {
  var r;
  const a = (r = void 0) !== null && r !== void 0 ? r : { kind: "Any" };
  return Ub("plugin:event|listen", {
    event: e,
    target: a,
    handler: nP(t)
  }).then((o) => async () => rP(e, o));
}
const oP = "show_provider_login_modal_event", iP = (e) => {
  Fe(() => {
    let t = !1, n;
    return (async () => (n = aP(oP, async (r) => {
      await e(r.payload.data);
    }), t && n.then((r) => r())))(), () => {
      t = !0, n.then((r) => r());
    };
  }, []);
};
var Hb = (e) => {
  throw TypeError(e);
}, Gb = (e, t, n) => t.has(e) || Hb("Cannot " + n), on = (e, t, n) => (Gb(e, t, "read from private field"), n ? n.call(e) : t.get(e)), Bb = (e, t, n) => t.has(e) ? Hb("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), gm = (e, t, n, r) => (Gb(e, t, "write to private field"), t.set(e, n), n), Rr = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, ym = {};
/*!
 *  howler.js v2.2.4
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */
var bm;
function sP() {
  return bm || (bm = 1, function(e) {
    (function() {
      var t = function() {
        this.init();
      };
      t.prototype = {
        /**
         * Initialize the global Howler object.
         * @return {Howler}
         */
        init: function() {
          var i = this || n;
          return i._counter = 1e3, i._html5AudioPool = [], i.html5PoolSize = 10, i._codecs = {}, i._howls = [], i._muted = !1, i._volume = 1, i._canPlayEvent = "canplaythrough", i._navigator = typeof window < "u" && window.navigator ? window.navigator : null, i.masterGain = null, i.noAudio = !1, i.usingWebAudio = !0, i.autoSuspend = !0, i.ctx = null, i.autoUnlock = !0, i._setup(), i;
        },
        /**
         * Get/set the global volume for all sounds.
         * @param  {Float} vol Volume from 0.0 to 1.0.
         * @return {Howler/Float}     Returns self or current volume.
         */
        volume: function(i) {
          var c = this || n;
          if (i = parseFloat(i), c.ctx || d(), typeof i < "u" && i >= 0 && i <= 1) {
            if (c._volume = i, c._muted)
              return c;
            c.usingWebAudio && c.masterGain.gain.setValueAtTime(i, n.ctx.currentTime);
            for (var p = 0; p < c._howls.length; p++)
              if (!c._howls[p]._webAudio)
                for (var g = c._howls[p]._getSoundIds(), m = 0; m < g.length; m++) {
                  var h = c._howls[p]._soundById(g[m]);
                  h && h._node && (h._node.volume = h._volume * i);
                }
            return c;
          }
          return c._volume;
        },
        /**
         * Handle muting and unmuting globally.
         * @param  {Boolean} muted Is muted or not.
         */
        mute: function(i) {
          var c = this || n;
          c.ctx || d(), c._muted = i, c.usingWebAudio && c.masterGain.gain.setValueAtTime(i ? 0 : c._volume, n.ctx.currentTime);
          for (var p = 0; p < c._howls.length; p++)
            if (!c._howls[p]._webAudio)
              for (var g = c._howls[p]._getSoundIds(), m = 0; m < g.length; m++) {
                var h = c._howls[p]._soundById(g[m]);
                h && h._node && (h._node.muted = i ? !0 : h._muted);
              }
          return c;
        },
        /**
         * Handle stopping all sounds globally.
         */
        stop: function() {
          for (var i = this || n, c = 0; c < i._howls.length; c++)
            i._howls[c].stop();
          return i;
        },
        /**
         * Unload and destroy all currently loaded Howl objects.
         * @return {Howler}
         */
        unload: function() {
          for (var i = this || n, c = i._howls.length - 1; c >= 0; c--)
            i._howls[c].unload();
          return i.usingWebAudio && i.ctx && typeof i.ctx.close < "u" && (i.ctx.close(), i.ctx = null, d()), i;
        },
        /**
         * Check for codec support of specific extension.
         * @param  {String} ext Audio file extention.
         * @return {Boolean}
         */
        codecs: function(i) {
          return (this || n)._codecs[i.replace(/^x-/, "")];
        },
        /**
         * Setup various state values for global tracking.
         * @return {Howler}
         */
        _setup: function() {
          var i = this || n;
          if (i.state = i.ctx && i.ctx.state || "suspended", i._autoSuspend(), !i.usingWebAudio)
            if (typeof Audio < "u")
              try {
                var c = new Audio();
                typeof c.oncanplaythrough > "u" && (i._canPlayEvent = "canplay");
              } catch {
                i.noAudio = !0;
              }
            else
              i.noAudio = !0;
          try {
            var c = new Audio();
            c.muted && (i.noAudio = !0);
          } catch {
          }
          return i.noAudio || i._setupCodecs(), i;
        },
        /**
         * Check for browser support for various codecs and cache the results.
         * @return {Howler}
         */
        _setupCodecs: function() {
          var i = this || n, c = null;
          try {
            c = typeof Audio < "u" ? new Audio() : null;
          } catch {
            return i;
          }
          if (!c || typeof c.canPlayType != "function")
            return i;
          var p = c.canPlayType("audio/mpeg;").replace(/^no$/, ""), g = i._navigator ? i._navigator.userAgent : "", m = g.match(/OPR\/(\d+)/g), h = m && parseInt(m[0].split("/")[1], 10) < 33, b = g.indexOf("Safari") !== -1 && g.indexOf("Chrome") === -1, _ = g.match(/Version\/(.*?) /), k = b && _ && parseInt(_[1], 10) < 15;
          return i._codecs = {
            mp3: !!(!h && (p || c.canPlayType("audio/mp3;").replace(/^no$/, ""))),
            mpeg: !!p,
            opus: !!c.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
            ogg: !!c.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            oga: !!c.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            wav: !!(c.canPlayType('audio/wav; codecs="1"') || c.canPlayType("audio/wav")).replace(/^no$/, ""),
            aac: !!c.canPlayType("audio/aac;").replace(/^no$/, ""),
            caf: !!c.canPlayType("audio/x-caf;").replace(/^no$/, ""),
            m4a: !!(c.canPlayType("audio/x-m4a;") || c.canPlayType("audio/m4a;") || c.canPlayType("audio/aac;")).replace(/^no$/, ""),
            m4b: !!(c.canPlayType("audio/x-m4b;") || c.canPlayType("audio/m4b;") || c.canPlayType("audio/aac;")).replace(/^no$/, ""),
            mp4: !!(c.canPlayType("audio/x-mp4;") || c.canPlayType("audio/mp4;") || c.canPlayType("audio/aac;")).replace(/^no$/, ""),
            weba: !!(!k && c.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            webm: !!(!k && c.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            dolby: !!c.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ""),
            flac: !!(c.canPlayType("audio/x-flac;") || c.canPlayType("audio/flac;")).replace(/^no$/, "")
          }, i;
        },
        /**
         * Some browsers/devices will only allow audio to be played after a user interaction.
         * Attempt to automatically unlock audio on the first user interaction.
         * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
         * @return {Howler}
         */
        _unlockAudio: function() {
          var i = this || n;
          if (!(i._audioUnlocked || !i.ctx)) {
            i._audioUnlocked = !1, i.autoUnlock = !1, !i._mobileUnloaded && i.ctx.sampleRate !== 44100 && (i._mobileUnloaded = !0, i.unload()), i._scratchBuffer = i.ctx.createBuffer(1, 1, 22050);
            var c = function(p) {
              for (; i._html5AudioPool.length < i.html5PoolSize; )
                try {
                  var g = new Audio();
                  g._unlocked = !0, i._releaseHtml5Audio(g);
                } catch {
                  i.noAudio = !0;
                  break;
                }
              for (var m = 0; m < i._howls.length; m++)
                if (!i._howls[m]._webAudio)
                  for (var h = i._howls[m]._getSoundIds(), b = 0; b < h.length; b++) {
                    var _ = i._howls[m]._soundById(h[b]);
                    _ && _._node && !_._node._unlocked && (_._node._unlocked = !0, _._node.load());
                  }
              i._autoResume();
              var k = i.ctx.createBufferSource();
              k.buffer = i._scratchBuffer, k.connect(i.ctx.destination), typeof k.start > "u" ? k.noteOn(0) : k.start(0), typeof i.ctx.resume == "function" && i.ctx.resume(), k.onended = function() {
                k.disconnect(0), i._audioUnlocked = !0, document.removeEventListener("touchstart", c, !0), document.removeEventListener("touchend", c, !0), document.removeEventListener("click", c, !0), document.removeEventListener("keydown", c, !0);
                for (var A = 0; A < i._howls.length; A++)
                  i._howls[A]._emit("unlock");
              };
            };
            return document.addEventListener("touchstart", c, !0), document.addEventListener("touchend", c, !0), document.addEventListener("click", c, !0), document.addEventListener("keydown", c, !0), i;
          }
        },
        /**
         * Get an unlocked HTML5 Audio object from the pool. If none are left,
         * return a new Audio object and throw a warning.
         * @return {Audio} HTML5 Audio object.
         */
        _obtainHtml5Audio: function() {
          var i = this || n;
          if (i._html5AudioPool.length)
            return i._html5AudioPool.pop();
          var c = new Audio().play();
          return c && typeof Promise < "u" && (c instanceof Promise || typeof c.then == "function") && c.catch(function() {
            console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.");
          }), new Audio();
        },
        /**
         * Return an activated HTML5 Audio object to the pool.
         * @return {Howler}
         */
        _releaseHtml5Audio: function(i) {
          var c = this || n;
          return i._unlocked && c._html5AudioPool.push(i), c;
        },
        /**
         * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
         * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
         * @return {Howler}
         */
        _autoSuspend: function() {
          var i = this;
          if (!(!i.autoSuspend || !i.ctx || typeof i.ctx.suspend > "u" || !n.usingWebAudio)) {
            for (var c = 0; c < i._howls.length; c++)
              if (i._howls[c]._webAudio) {
                for (var p = 0; p < i._howls[c]._sounds.length; p++)
                  if (!i._howls[c]._sounds[p]._paused)
                    return i;
              }
            return i._suspendTimer && clearTimeout(i._suspendTimer), i._suspendTimer = setTimeout(function() {
              if (i.autoSuspend) {
                i._suspendTimer = null, i.state = "suspending";
                var g = function() {
                  i.state = "suspended", i._resumeAfterSuspend && (delete i._resumeAfterSuspend, i._autoResume());
                };
                i.ctx.suspend().then(g, g);
              }
            }, 3e4), i;
          }
        },
        /**
         * Automatically resume the Web Audio AudioContext when a new sound is played.
         * @return {Howler}
         */
        _autoResume: function() {
          var i = this;
          if (!(!i.ctx || typeof i.ctx.resume > "u" || !n.usingWebAudio))
            return i.state === "running" && i.ctx.state !== "interrupted" && i._suspendTimer ? (clearTimeout(i._suspendTimer), i._suspendTimer = null) : i.state === "suspended" || i.state === "running" && i.ctx.state === "interrupted" ? (i.ctx.resume().then(function() {
              i.state = "running";
              for (var c = 0; c < i._howls.length; c++)
                i._howls[c]._emit("resume");
            }), i._suspendTimer && (clearTimeout(i._suspendTimer), i._suspendTimer = null)) : i.state === "suspending" && (i._resumeAfterSuspend = !0), i;
        }
      };
      var n = new t(), r = function(i) {
        var c = this;
        if (!i.src || i.src.length === 0) {
          console.error("An array of source files must be passed with any new Howl.");
          return;
        }
        c.init(i);
      };
      r.prototype = {
        /**
         * Initialize a new Howl group object.
         * @param  {Object} o Passed in properties for this group.
         * @return {Howl}
         */
        init: function(i) {
          var c = this;
          return n.ctx || d(), c._autoplay = i.autoplay || !1, c._format = typeof i.format != "string" ? i.format : [i.format], c._html5 = i.html5 || !1, c._muted = i.mute || !1, c._loop = i.loop || !1, c._pool = i.pool || 5, c._preload = typeof i.preload == "boolean" || i.preload === "metadata" ? i.preload : !0, c._rate = i.rate || 1, c._sprite = i.sprite || {}, c._src = typeof i.src != "string" ? i.src : [i.src], c._volume = i.volume !== void 0 ? i.volume : 1, c._xhr = {
            method: i.xhr && i.xhr.method ? i.xhr.method : "GET",
            headers: i.xhr && i.xhr.headers ? i.xhr.headers : null,
            withCredentials: i.xhr && i.xhr.withCredentials ? i.xhr.withCredentials : !1
          }, c._duration = 0, c._state = "unloaded", c._sounds = [], c._endTimers = {}, c._queue = [], c._playLock = !1, c._onend = i.onend ? [{ fn: i.onend }] : [], c._onfade = i.onfade ? [{ fn: i.onfade }] : [], c._onload = i.onload ? [{ fn: i.onload }] : [], c._onloaderror = i.onloaderror ? [{ fn: i.onloaderror }] : [], c._onplayerror = i.onplayerror ? [{ fn: i.onplayerror }] : [], c._onpause = i.onpause ? [{ fn: i.onpause }] : [], c._onplay = i.onplay ? [{ fn: i.onplay }] : [], c._onstop = i.onstop ? [{ fn: i.onstop }] : [], c._onmute = i.onmute ? [{ fn: i.onmute }] : [], c._onvolume = i.onvolume ? [{ fn: i.onvolume }] : [], c._onrate = i.onrate ? [{ fn: i.onrate }] : [], c._onseek = i.onseek ? [{ fn: i.onseek }] : [], c._onunlock = i.onunlock ? [{ fn: i.onunlock }] : [], c._onresume = [], c._webAudio = n.usingWebAudio && !c._html5, typeof n.ctx < "u" && n.ctx && n.autoUnlock && n._unlockAudio(), n._howls.push(c), c._autoplay && c._queue.push({
            event: "play",
            action: function() {
              c.play();
            }
          }), c._preload && c._preload !== "none" && c.load(), c;
        },
        /**
         * Load the audio file.
         * @return {Howler}
         */
        load: function() {
          var i = this, c = null;
          if (n.noAudio) {
            i._emit("loaderror", null, "No audio support.");
            return;
          }
          typeof i._src == "string" && (i._src = [i._src]);
          for (var p = 0; p < i._src.length; p++) {
            var g, m;
            if (i._format && i._format[p])
              g = i._format[p];
            else {
              if (m = i._src[p], typeof m != "string") {
                i._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                continue;
              }
              g = /^data:audio\/([^;,]+);/i.exec(m), g || (g = /\.([^.]+)$/.exec(m.split("?", 1)[0])), g && (g = g[1].toLowerCase());
            }
            if (g || console.warn('No file extension was found. Consider using the "format" property or specify an extension.'), g && n.codecs(g)) {
              c = i._src[p];
              break;
            }
          }
          if (!c) {
            i._emit("loaderror", null, "No codec support for selected audio sources.");
            return;
          }
          return i._src = c, i._state = "loading", window.location.protocol === "https:" && c.slice(0, 5) === "http:" && (i._html5 = !0, i._webAudio = !1), new a(i), i._webAudio && s(i), i;
        },
        /**
         * Play a sound or resume previous playback.
         * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Number}          Sound ID.
         */
        play: function(i, c) {
          var p = this, g = null;
          if (typeof i == "number")
            g = i, i = null;
          else {
            if (typeof i == "string" && p._state === "loaded" && !p._sprite[i])
              return null;
            if (typeof i > "u" && (i = "__default", !p._playLock)) {
              for (var m = 0, h = 0; h < p._sounds.length; h++)
                p._sounds[h]._paused && !p._sounds[h]._ended && (m++, g = p._sounds[h]._id);
              m === 1 ? i = null : g = null;
            }
          }
          var b = g ? p._soundById(g) : p._inactiveSound();
          if (!b)
            return null;
          if (g && !i && (i = b._sprite || "__default"), p._state !== "loaded") {
            b._sprite = i, b._ended = !1;
            var _ = b._id;
            return p._queue.push({
              event: "play",
              action: function() {
                p.play(_);
              }
            }), _;
          }
          if (g && !b._paused)
            return c || p._loadQueue("play"), b._id;
          p._webAudio && n._autoResume();
          var k = Math.max(0, b._seek > 0 ? b._seek : p._sprite[i][0] / 1e3), A = Math.max(0, (p._sprite[i][0] + p._sprite[i][1]) / 1e3 - k), v = A * 1e3 / Math.abs(b._rate), H = p._sprite[i][0] / 1e3, F = (p._sprite[i][0] + p._sprite[i][1]) / 1e3;
          b._sprite = i, b._ended = !1;
          var Q = function() {
            b._paused = !1, b._seek = k, b._start = H, b._stop = F, b._loop = !!(b._loop || p._sprite[i][2]);
          };
          if (k >= F) {
            p._ended(b);
            return;
          }
          var B = b._node;
          if (p._webAudio) {
            var ie = function() {
              p._playLock = !1, Q(), p._refreshBuffer(b);
              var D = b._muted || p._muted ? 0 : b._volume;
              B.gain.setValueAtTime(D, n.ctx.currentTime), b._playStart = n.ctx.currentTime, typeof B.bufferSource.start > "u" ? b._loop ? B.bufferSource.noteGrainOn(0, k, 86400) : B.bufferSource.noteGrainOn(0, k, A) : b._loop ? B.bufferSource.start(0, k, 86400) : B.bufferSource.start(0, k, A), v !== 1 / 0 && (p._endTimers[b._id] = setTimeout(p._ended.bind(p, b), v)), c || setTimeout(function() {
                p._emit("play", b._id), p._loadQueue();
              }, 0);
            };
            n.state === "running" && n.ctx.state !== "interrupted" ? ie() : (p._playLock = !0, p.once("resume", ie), p._clearTimer(b._id));
          } else {
            var ae = function() {
              B.currentTime = k, B.muted = b._muted || p._muted || n._muted || B.muted, B.volume = b._volume * n.volume(), B.playbackRate = b._rate;
              try {
                var D = B.play();
                if (D && typeof Promise < "u" && (D instanceof Promise || typeof D.then == "function") ? (p._playLock = !0, Q(), D.then(function() {
                  p._playLock = !1, B._unlocked = !0, c ? p._loadQueue() : p._emit("play", b._id);
                }).catch(function() {
                  p._playLock = !1, p._emit("playerror", b._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."), b._ended = !0, b._paused = !0;
                })) : c || (p._playLock = !1, Q(), p._emit("play", b._id)), B.playbackRate = b._rate, B.paused) {
                  p._emit("playerror", b._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");
                  return;
                }
                i !== "__default" || b._loop ? p._endTimers[b._id] = setTimeout(p._ended.bind(p, b), v) : (p._endTimers[b._id] = function() {
                  p._ended(b), B.removeEventListener("ended", p._endTimers[b._id], !1);
                }, B.addEventListener("ended", p._endTimers[b._id], !1));
              } catch (M) {
                p._emit("playerror", b._id, M);
              }
            };
            B.src === "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" && (B.src = p._src, B.load());
            var R = window && window.ejecta || !B.readyState && n._navigator.isCocoonJS;
            if (B.readyState >= 3 || R)
              ae();
            else {
              p._playLock = !0, p._state = "loading";
              var le = function() {
                p._state = "loaded", ae(), B.removeEventListener(n._canPlayEvent, le, !1);
              };
              B.addEventListener(n._canPlayEvent, le, !1), p._clearTimer(b._id);
            }
          }
          return b._id;
        },
        /**
         * Pause playback and save current position.
         * @param  {Number} id The sound ID (empty to pause all in group).
         * @return {Howl}
         */
        pause: function(i) {
          var c = this;
          if (c._state !== "loaded" || c._playLock)
            return c._queue.push({
              event: "pause",
              action: function() {
                c.pause(i);
              }
            }), c;
          for (var p = c._getSoundIds(i), g = 0; g < p.length; g++) {
            c._clearTimer(p[g]);
            var m = c._soundById(p[g]);
            if (m && !m._paused && (m._seek = c.seek(p[g]), m._rateSeek = 0, m._paused = !0, c._stopFade(p[g]), m._node))
              if (c._webAudio) {
                if (!m._node.bufferSource)
                  continue;
                typeof m._node.bufferSource.stop > "u" ? m._node.bufferSource.noteOff(0) : m._node.bufferSource.stop(0), c._cleanBuffer(m._node);
              } else (!isNaN(m._node.duration) || m._node.duration === 1 / 0) && m._node.pause();
            arguments[1] || c._emit("pause", m ? m._id : null);
          }
          return c;
        },
        /**
         * Stop playback and reset to start.
         * @param  {Number} id The sound ID (empty to stop all in group).
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Howl}
         */
        stop: function(i, c) {
          var p = this;
          if (p._state !== "loaded" || p._playLock)
            return p._queue.push({
              event: "stop",
              action: function() {
                p.stop(i);
              }
            }), p;
          for (var g = p._getSoundIds(i), m = 0; m < g.length; m++) {
            p._clearTimer(g[m]);
            var h = p._soundById(g[m]);
            h && (h._seek = h._start || 0, h._rateSeek = 0, h._paused = !0, h._ended = !0, p._stopFade(g[m]), h._node && (p._webAudio ? h._node.bufferSource && (typeof h._node.bufferSource.stop > "u" ? h._node.bufferSource.noteOff(0) : h._node.bufferSource.stop(0), p._cleanBuffer(h._node)) : (!isNaN(h._node.duration) || h._node.duration === 1 / 0) && (h._node.currentTime = h._start || 0, h._node.pause(), h._node.duration === 1 / 0 && p._clearSound(h._node))), c || p._emit("stop", h._id));
          }
          return p;
        },
        /**
         * Mute/unmute a single sound or all sounds in this Howl group.
         * @param  {Boolean} muted Set to true to mute and false to unmute.
         * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
         * @return {Howl}
         */
        mute: function(i, c) {
          var p = this;
          if (p._state !== "loaded" || p._playLock)
            return p._queue.push({
              event: "mute",
              action: function() {
                p.mute(i, c);
              }
            }), p;
          if (typeof c > "u")
            if (typeof i == "boolean")
              p._muted = i;
            else
              return p._muted;
          for (var g = p._getSoundIds(c), m = 0; m < g.length; m++) {
            var h = p._soundById(g[m]);
            h && (h._muted = i, h._interval && p._stopFade(h._id), p._webAudio && h._node ? h._node.gain.setValueAtTime(i ? 0 : h._volume, n.ctx.currentTime) : h._node && (h._node.muted = n._muted ? !0 : i), p._emit("mute", h._id));
          }
          return p;
        },
        /**
         * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
         *   volume() -> Returns the group's volume value.
         *   volume(id) -> Returns the sound id's current volume.
         *   volume(vol) -> Sets the volume of all sounds in this Howl group.
         *   volume(vol, id) -> Sets the volume of passed sound id.
         * @return {Howl/Number} Returns self or current volume.
         */
        volume: function() {
          var i = this, c = arguments, p, g;
          if (c.length === 0)
            return i._volume;
          if (c.length === 1 || c.length === 2 && typeof c[1] > "u") {
            var m = i._getSoundIds(), h = m.indexOf(c[0]);
            h >= 0 ? g = parseInt(c[0], 10) : p = parseFloat(c[0]);
          } else c.length >= 2 && (p = parseFloat(c[0]), g = parseInt(c[1], 10));
          var b;
          if (typeof p < "u" && p >= 0 && p <= 1) {
            if (i._state !== "loaded" || i._playLock)
              return i._queue.push({
                event: "volume",
                action: function() {
                  i.volume.apply(i, c);
                }
              }), i;
            typeof g > "u" && (i._volume = p), g = i._getSoundIds(g);
            for (var _ = 0; _ < g.length; _++)
              b = i._soundById(g[_]), b && (b._volume = p, c[2] || i._stopFade(g[_]), i._webAudio && b._node && !b._muted ? b._node.gain.setValueAtTime(p, n.ctx.currentTime) : b._node && !b._muted && (b._node.volume = p * n.volume()), i._emit("volume", b._id));
          } else
            return b = g ? i._soundById(g) : i._sounds[0], b ? b._volume : 0;
          return i;
        },
        /**
         * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id (omit to fade all sounds).
         * @return {Howl}
         */
        fade: function(i, c, p, g) {
          var m = this;
          if (m._state !== "loaded" || m._playLock)
            return m._queue.push({
              event: "fade",
              action: function() {
                m.fade(i, c, p, g);
              }
            }), m;
          i = Math.min(Math.max(0, parseFloat(i)), 1), c = Math.min(Math.max(0, parseFloat(c)), 1), p = parseFloat(p), m.volume(i, g);
          for (var h = m._getSoundIds(g), b = 0; b < h.length; b++) {
            var _ = m._soundById(h[b]);
            if (_) {
              if (g || m._stopFade(h[b]), m._webAudio && !_._muted) {
                var k = n.ctx.currentTime, A = k + p / 1e3;
                _._volume = i, _._node.gain.setValueAtTime(i, k), _._node.gain.linearRampToValueAtTime(c, A);
              }
              m._startFadeInterval(_, i, c, p, h[b], typeof g > "u");
            }
          }
          return m;
        },
        /**
         * Starts the internal interval to fade a sound.
         * @param  {Object} sound Reference to sound to fade.
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id to fade.
         * @param  {Boolean} isGroup   If true, set the volume on the group.
         */
        _startFadeInterval: function(i, c, p, g, m, h) {
          var b = this, _ = c, k = p - c, A = Math.abs(k / 0.01), v = Math.max(4, A > 0 ? g / A : g), H = Date.now();
          i._fadeTo = p, i._interval = setInterval(function() {
            var F = (Date.now() - H) / g;
            H = Date.now(), _ += k * F, _ = Math.round(_ * 100) / 100, k < 0 ? _ = Math.max(p, _) : _ = Math.min(p, _), b._webAudio ? i._volume = _ : b.volume(_, i._id, !0), h && (b._volume = _), (p < c && _ <= p || p > c && _ >= p) && (clearInterval(i._interval), i._interval = null, i._fadeTo = null, b.volume(p, i._id), b._emit("fade", i._id));
          }, v);
        },
        /**
         * Internal method that stops the currently playing fade when
         * a new fade starts, volume is changed or the sound is stopped.
         * @param  {Number} id The sound id.
         * @return {Howl}
         */
        _stopFade: function(i) {
          var c = this, p = c._soundById(i);
          return p && p._interval && (c._webAudio && p._node.gain.cancelScheduledValues(n.ctx.currentTime), clearInterval(p._interval), p._interval = null, c.volume(p._fadeTo, i), p._fadeTo = null, c._emit("fade", i)), c;
        },
        /**
         * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
         *   loop() -> Returns the group's loop value.
         *   loop(id) -> Returns the sound id's loop value.
         *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
         *   loop(loop, id) -> Sets the loop value of passed sound id.
         * @return {Howl/Boolean} Returns self or current loop value.
         */
        loop: function() {
          var i = this, c = arguments, p, g, m;
          if (c.length === 0)
            return i._loop;
          if (c.length === 1)
            if (typeof c[0] == "boolean")
              p = c[0], i._loop = p;
            else
              return m = i._soundById(parseInt(c[0], 10)), m ? m._loop : !1;
          else c.length === 2 && (p = c[0], g = parseInt(c[1], 10));
          for (var h = i._getSoundIds(g), b = 0; b < h.length; b++)
            m = i._soundById(h[b]), m && (m._loop = p, i._webAudio && m._node && m._node.bufferSource && (m._node.bufferSource.loop = p, p && (m._node.bufferSource.loopStart = m._start || 0, m._node.bufferSource.loopEnd = m._stop, i.playing(h[b]) && (i.pause(h[b], !0), i.play(h[b], !0)))));
          return i;
        },
        /**
         * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   rate() -> Returns the first sound node's current playback rate.
         *   rate(id) -> Returns the sound id's current playback rate.
         *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
         *   rate(rate, id) -> Sets the playback rate of passed sound id.
         * @return {Howl/Number} Returns self or the current playback rate.
         */
        rate: function() {
          var i = this, c = arguments, p, g;
          if (c.length === 0)
            g = i._sounds[0]._id;
          else if (c.length === 1) {
            var m = i._getSoundIds(), h = m.indexOf(c[0]);
            h >= 0 ? g = parseInt(c[0], 10) : p = parseFloat(c[0]);
          } else c.length === 2 && (p = parseFloat(c[0]), g = parseInt(c[1], 10));
          var b;
          if (typeof p == "number") {
            if (i._state !== "loaded" || i._playLock)
              return i._queue.push({
                event: "rate",
                action: function() {
                  i.rate.apply(i, c);
                }
              }), i;
            typeof g > "u" && (i._rate = p), g = i._getSoundIds(g);
            for (var _ = 0; _ < g.length; _++)
              if (b = i._soundById(g[_]), b) {
                i.playing(g[_]) && (b._rateSeek = i.seek(g[_]), b._playStart = i._webAudio ? n.ctx.currentTime : b._playStart), b._rate = p, i._webAudio && b._node && b._node.bufferSource ? b._node.bufferSource.playbackRate.setValueAtTime(p, n.ctx.currentTime) : b._node && (b._node.playbackRate = p);
                var k = i.seek(g[_]), A = (i._sprite[b._sprite][0] + i._sprite[b._sprite][1]) / 1e3 - k, v = A * 1e3 / Math.abs(b._rate);
                (i._endTimers[g[_]] || !b._paused) && (i._clearTimer(g[_]), i._endTimers[g[_]] = setTimeout(i._ended.bind(i, b), v)), i._emit("rate", b._id);
              }
          } else
            return b = i._soundById(g), b ? b._rate : i._rate;
          return i;
        },
        /**
         * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   seek() -> Returns the first sound node's current seek position.
         *   seek(id) -> Returns the sound id's current seek position.
         *   seek(seek) -> Sets the seek position of the first sound node.
         *   seek(seek, id) -> Sets the seek position of passed sound id.
         * @return {Howl/Number} Returns self or the current seek position.
         */
        seek: function() {
          var i = this, c = arguments, p, g;
          if (c.length === 0)
            i._sounds.length && (g = i._sounds[0]._id);
          else if (c.length === 1) {
            var m = i._getSoundIds(), h = m.indexOf(c[0]);
            h >= 0 ? g = parseInt(c[0], 10) : i._sounds.length && (g = i._sounds[0]._id, p = parseFloat(c[0]));
          } else c.length === 2 && (p = parseFloat(c[0]), g = parseInt(c[1], 10));
          if (typeof g > "u")
            return 0;
          if (typeof p == "number" && (i._state !== "loaded" || i._playLock))
            return i._queue.push({
              event: "seek",
              action: function() {
                i.seek.apply(i, c);
              }
            }), i;
          var b = i._soundById(g);
          if (b)
            if (typeof p == "number" && p >= 0) {
              var _ = i.playing(g);
              _ && i.pause(g, !0), b._seek = p, b._ended = !1, i._clearTimer(g), !i._webAudio && b._node && !isNaN(b._node.duration) && (b._node.currentTime = p);
              var k = function() {
                _ && i.play(g, !0), i._emit("seek", g);
              };
              if (_ && !i._webAudio) {
                var A = function() {
                  i._playLock ? setTimeout(A, 0) : k();
                };
                setTimeout(A, 0);
              } else
                k();
            } else if (i._webAudio) {
              var v = i.playing(g) ? n.ctx.currentTime - b._playStart : 0, H = b._rateSeek ? b._rateSeek - b._seek : 0;
              return b._seek + (H + v * Math.abs(b._rate));
            } else
              return b._node.currentTime;
          return i;
        },
        /**
         * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
         * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
         * @return {Boolean} True if playing and false if not.
         */
        playing: function(i) {
          var c = this;
          if (typeof i == "number") {
            var p = c._soundById(i);
            return p ? !p._paused : !1;
          }
          for (var g = 0; g < c._sounds.length; g++)
            if (!c._sounds[g]._paused)
              return !0;
          return !1;
        },
        /**
         * Get the duration of this sound. Passing a sound id will return the sprite duration.
         * @param  {Number} id The sound id to check. If none is passed, return full source duration.
         * @return {Number} Audio duration in seconds.
         */
        duration: function(i) {
          var c = this, p = c._duration, g = c._soundById(i);
          return g && (p = c._sprite[g._sprite][1] / 1e3), p;
        },
        /**
         * Returns the current loaded state of this Howl.
         * @return {String} 'unloaded', 'loading', 'loaded'
         */
        state: function() {
          return this._state;
        },
        /**
         * Unload and destroy the current Howl object.
         * This will immediately stop all sound instances attached to this group.
         */
        unload: function() {
          for (var i = this, c = i._sounds, p = 0; p < c.length; p++)
            c[p]._paused || i.stop(c[p]._id), i._webAudio || (i._clearSound(c[p]._node), c[p]._node.removeEventListener("error", c[p]._errorFn, !1), c[p]._node.removeEventListener(n._canPlayEvent, c[p]._loadFn, !1), c[p]._node.removeEventListener("ended", c[p]._endFn, !1), n._releaseHtml5Audio(c[p]._node)), delete c[p]._node, i._clearTimer(c[p]._id);
          var g = n._howls.indexOf(i);
          g >= 0 && n._howls.splice(g, 1);
          var m = !0;
          for (p = 0; p < n._howls.length; p++)
            if (n._howls[p]._src === i._src || i._src.indexOf(n._howls[p]._src) >= 0) {
              m = !1;
              break;
            }
          return o && m && delete o[i._src], n.noAudio = !1, i._state = "unloaded", i._sounds = [], i = null, null;
        },
        /**
         * Listen to a custom event.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
         * @return {Howl}
         */
        on: function(i, c, p, g) {
          var m = this, h = m["_on" + i];
          return typeof c == "function" && h.push(g ? { id: p, fn: c, once: g } : { id: p, fn: c }), m;
        },
        /**
         * Remove a custom event. Call without parameters to remove all events.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to remove. Leave empty to remove all.
         * @param  {Number}   id    (optional) Only remove events for this sound.
         * @return {Howl}
         */
        off: function(i, c, p) {
          var g = this, m = g["_on" + i], h = 0;
          if (typeof c == "number" && (p = c, c = null), c || p)
            for (h = 0; h < m.length; h++) {
              var b = p === m[h].id;
              if (c === m[h].fn && b || !c && b) {
                m.splice(h, 1);
                break;
              }
            }
          else if (i)
            g["_on" + i] = [];
          else {
            var _ = Object.keys(g);
            for (h = 0; h < _.length; h++)
              _[h].indexOf("_on") === 0 && Array.isArray(g[_[h]]) && (g[_[h]] = []);
          }
          return g;
        },
        /**
         * Listen to a custom event and remove it once fired.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @return {Howl}
         */
        once: function(i, c, p) {
          var g = this;
          return g.on(i, c, p, 1), g;
        },
        /**
         * Emit all events of a specific type and pass the sound id.
         * @param  {String} event Event name.
         * @param  {Number} id    Sound ID.
         * @param  {Number} msg   Message to go with event.
         * @return {Howl}
         */
        _emit: function(i, c, p) {
          for (var g = this, m = g["_on" + i], h = m.length - 1; h >= 0; h--)
            (!m[h].id || m[h].id === c || i === "load") && (setTimeout((function(b) {
              b.call(this, c, p);
            }).bind(g, m[h].fn), 0), m[h].once && g.off(i, m[h].fn, m[h].id));
          return g._loadQueue(i), g;
        },
        /**
         * Queue of actions initiated before the sound has loaded.
         * These will be called in sequence, with the next only firing
         * after the previous has finished executing (even if async like play).
         * @return {Howl}
         */
        _loadQueue: function(i) {
          var c = this;
          if (c._queue.length > 0) {
            var p = c._queue[0];
            p.event === i && (c._queue.shift(), c._loadQueue()), i || p.action();
          }
          return c;
        },
        /**
         * Fired when playback ends at the end of the duration.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _ended: function(i) {
          var c = this, p = i._sprite;
          if (!c._webAudio && i._node && !i._node.paused && !i._node.ended && i._node.currentTime < i._stop)
            return setTimeout(c._ended.bind(c, i), 100), c;
          var g = !!(i._loop || c._sprite[p][2]);
          if (c._emit("end", i._id), !c._webAudio && g && c.stop(i._id, !0).play(i._id), c._webAudio && g) {
            c._emit("play", i._id), i._seek = i._start || 0, i._rateSeek = 0, i._playStart = n.ctx.currentTime;
            var m = (i._stop - i._start) * 1e3 / Math.abs(i._rate);
            c._endTimers[i._id] = setTimeout(c._ended.bind(c, i), m);
          }
          return c._webAudio && !g && (i._paused = !0, i._ended = !0, i._seek = i._start || 0, i._rateSeek = 0, c._clearTimer(i._id), c._cleanBuffer(i._node), n._autoSuspend()), !c._webAudio && !g && c.stop(i._id, !0), c;
        },
        /**
         * Clear the end timer for a sound playback.
         * @param  {Number} id The sound ID.
         * @return {Howl}
         */
        _clearTimer: function(i) {
          var c = this;
          if (c._endTimers[i]) {
            if (typeof c._endTimers[i] != "function")
              clearTimeout(c._endTimers[i]);
            else {
              var p = c._soundById(i);
              p && p._node && p._node.removeEventListener("ended", c._endTimers[i], !1);
            }
            delete c._endTimers[i];
          }
          return c;
        },
        /**
         * Return the sound identified by this ID, or return null.
         * @param  {Number} id Sound ID
         * @return {Object}    Sound object or null.
         */
        _soundById: function(i) {
          for (var c = this, p = 0; p < c._sounds.length; p++)
            if (i === c._sounds[p]._id)
              return c._sounds[p];
          return null;
        },
        /**
         * Return an inactive sound from the pool or create a new one.
         * @return {Sound} Sound playback object.
         */
        _inactiveSound: function() {
          var i = this;
          i._drain();
          for (var c = 0; c < i._sounds.length; c++)
            if (i._sounds[c]._ended)
              return i._sounds[c].reset();
          return new a(i);
        },
        /**
         * Drain excess inactive sounds from the pool.
         */
        _drain: function() {
          var i = this, c = i._pool, p = 0, g = 0;
          if (!(i._sounds.length < c)) {
            for (g = 0; g < i._sounds.length; g++)
              i._sounds[g]._ended && p++;
            for (g = i._sounds.length - 1; g >= 0; g--) {
              if (p <= c)
                return;
              i._sounds[g]._ended && (i._webAudio && i._sounds[g]._node && i._sounds[g]._node.disconnect(0), i._sounds.splice(g, 1), p--);
            }
          }
        },
        /**
         * Get all ID's from the sounds pool.
         * @param  {Number} id Only return one ID if one is passed.
         * @return {Array}    Array of IDs.
         */
        _getSoundIds: function(i) {
          var c = this;
          if (typeof i > "u") {
            for (var p = [], g = 0; g < c._sounds.length; g++)
              p.push(c._sounds[g]._id);
            return p;
          } else
            return [i];
        },
        /**
         * Load the sound back into the buffer source.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _refreshBuffer: function(i) {
          var c = this;
          return i._node.bufferSource = n.ctx.createBufferSource(), i._node.bufferSource.buffer = o[c._src], i._panner ? i._node.bufferSource.connect(i._panner) : i._node.bufferSource.connect(i._node), i._node.bufferSource.loop = i._loop, i._loop && (i._node.bufferSource.loopStart = i._start || 0, i._node.bufferSource.loopEnd = i._stop || 0), i._node.bufferSource.playbackRate.setValueAtTime(i._rate, n.ctx.currentTime), c;
        },
        /**
         * Prevent memory leaks by cleaning up the buffer source after playback.
         * @param  {Object} node Sound's audio node containing the buffer source.
         * @return {Howl}
         */
        _cleanBuffer: function(i) {
          var c = this, p = n._navigator && n._navigator.vendor.indexOf("Apple") >= 0;
          if (!i.bufferSource)
            return c;
          if (n._scratchBuffer && i.bufferSource && (i.bufferSource.onended = null, i.bufferSource.disconnect(0), p))
            try {
              i.bufferSource.buffer = n._scratchBuffer;
            } catch {
            }
          return i.bufferSource = null, c;
        },
        /**
         * Set the source to a 0-second silence to stop any downloading (except in IE).
         * @param  {Object} node Audio node to clear.
         */
        _clearSound: function(i) {
          var c = /MSIE |Trident\//.test(n._navigator && n._navigator.userAgent);
          c || (i.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        }
      };
      var a = function(i) {
        this._parent = i, this.init();
      };
      a.prototype = {
        /**
         * Initialize a new Sound object.
         * @return {Sound}
         */
        init: function() {
          var i = this, c = i._parent;
          return i._muted = c._muted, i._loop = c._loop, i._volume = c._volume, i._rate = c._rate, i._seek = 0, i._paused = !0, i._ended = !0, i._sprite = "__default", i._id = ++n._counter, c._sounds.push(i), i.create(), i;
        },
        /**
         * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
         * @return {Sound}
         */
        create: function() {
          var i = this, c = i._parent, p = n._muted || i._muted || i._parent._muted ? 0 : i._volume;
          return c._webAudio ? (i._node = typeof n.ctx.createGain > "u" ? n.ctx.createGainNode() : n.ctx.createGain(), i._node.gain.setValueAtTime(p, n.ctx.currentTime), i._node.paused = !0, i._node.connect(n.masterGain)) : n.noAudio || (i._node = n._obtainHtml5Audio(), i._errorFn = i._errorListener.bind(i), i._node.addEventListener("error", i._errorFn, !1), i._loadFn = i._loadListener.bind(i), i._node.addEventListener(n._canPlayEvent, i._loadFn, !1), i._endFn = i._endListener.bind(i), i._node.addEventListener("ended", i._endFn, !1), i._node.src = c._src, i._node.preload = c._preload === !0 ? "auto" : c._preload, i._node.volume = p * n.volume(), i._node.load()), i;
        },
        /**
         * Reset the parameters of this sound to the original state (for recycle).
         * @return {Sound}
         */
        reset: function() {
          var i = this, c = i._parent;
          return i._muted = c._muted, i._loop = c._loop, i._volume = c._volume, i._rate = c._rate, i._seek = 0, i._rateSeek = 0, i._paused = !0, i._ended = !0, i._sprite = "__default", i._id = ++n._counter, i;
        },
        /**
         * HTML5 Audio error listener callback.
         */
        _errorListener: function() {
          var i = this;
          i._parent._emit("loaderror", i._id, i._node.error ? i._node.error.code : 0), i._node.removeEventListener("error", i._errorFn, !1);
        },
        /**
         * HTML5 Audio canplaythrough listener callback.
         */
        _loadListener: function() {
          var i = this, c = i._parent;
          c._duration = Math.ceil(i._node.duration * 10) / 10, Object.keys(c._sprite).length === 0 && (c._sprite = { __default: [0, c._duration * 1e3] }), c._state !== "loaded" && (c._state = "loaded", c._emit("load"), c._loadQueue()), i._node.removeEventListener(n._canPlayEvent, i._loadFn, !1);
        },
        /**
         * HTML5 Audio ended listener callback.
         */
        _endListener: function() {
          var i = this, c = i._parent;
          c._duration === 1 / 0 && (c._duration = Math.ceil(i._node.duration * 10) / 10, c._sprite.__default[1] === 1 / 0 && (c._sprite.__default[1] = c._duration * 1e3), c._ended(i)), i._node.removeEventListener("ended", i._endFn, !1);
        }
      };
      var o = {}, s = function(i) {
        var c = i._src;
        if (o[c]) {
          i._duration = o[c].duration, u(i);
          return;
        }
        if (/^data:[^;]+;base64,/.test(c)) {
          for (var p = atob(c.split(",")[1]), g = new Uint8Array(p.length), m = 0; m < p.length; ++m)
            g[m] = p.charCodeAt(m);
          f(g.buffer, i);
        } else {
          var h = new XMLHttpRequest();
          h.open(i._xhr.method, c, !0), h.withCredentials = i._xhr.withCredentials, h.responseType = "arraybuffer", i._xhr.headers && Object.keys(i._xhr.headers).forEach(function(b) {
            h.setRequestHeader(b, i._xhr.headers[b]);
          }), h.onload = function() {
            var b = (h.status + "")[0];
            if (b !== "0" && b !== "2" && b !== "3") {
              i._emit("loaderror", null, "Failed loading audio file with status: " + h.status + ".");
              return;
            }
            f(h.response, i);
          }, h.onerror = function() {
            i._webAudio && (i._html5 = !0, i._webAudio = !1, i._sounds = [], delete o[c], i.load());
          }, l(h);
        }
      }, l = function(i) {
        try {
          i.send();
        } catch {
          i.onerror();
        }
      }, f = function(i, c) {
        var p = function() {
          c._emit("loaderror", null, "Decoding audio data failed.");
        }, g = function(m) {
          m && c._sounds.length > 0 ? (o[c._src] = m, u(c, m)) : p();
        };
        typeof Promise < "u" && n.ctx.decodeAudioData.length === 1 ? n.ctx.decodeAudioData(i).then(g).catch(p) : n.ctx.decodeAudioData(i, g, p);
      }, u = function(i, c) {
        c && !i._duration && (i._duration = c.duration), Object.keys(i._sprite).length === 0 && (i._sprite = { __default: [0, i._duration * 1e3] }), i._state !== "loaded" && (i._state = "loaded", i._emit("load"), i._loadQueue());
      }, d = function() {
        if (n.usingWebAudio) {
          try {
            typeof AudioContext < "u" ? n.ctx = new AudioContext() : typeof webkitAudioContext < "u" ? n.ctx = new webkitAudioContext() : n.usingWebAudio = !1;
          } catch {
            n.usingWebAudio = !1;
          }
          n.ctx || (n.usingWebAudio = !1);
          var i = /iP(hone|od|ad)/.test(n._navigator && n._navigator.platform), c = n._navigator && n._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/), p = c ? parseInt(c[1], 10) : null;
          if (i && p && p < 9) {
            var g = /safari/.test(n._navigator && n._navigator.userAgent.toLowerCase());
            n._navigator && !g && (n.usingWebAudio = !1);
          }
          n.usingWebAudio && (n.masterGain = typeof n.ctx.createGain > "u" ? n.ctx.createGainNode() : n.ctx.createGain(), n.masterGain.gain.setValueAtTime(n._muted ? 0 : n._volume, n.ctx.currentTime), n.masterGain.connect(n.ctx.destination)), n._setup();
        }
      };
      e.Howler = n, e.Howl = r, typeof Rr < "u" ? (Rr.HowlerGlobal = t, Rr.Howler = n, Rr.Howl = r, Rr.Sound = a) : typeof window < "u" && (window.HowlerGlobal = t, window.Howler = n, window.Howl = r, window.Sound = a);
    })();
    /*!
     *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
     *  
     *  howler.js v2.2.4
     *  howlerjs.com
     *
     *  (c) 2013-2020, James Simpson of GoldFire Studios
     *  goldfirestudios.com
     *
     *  MIT License
     */
    (function() {
      HowlerGlobal.prototype._pos = [0, 0, 0], HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0], HowlerGlobal.prototype.stereo = function(n) {
        var r = this;
        if (!r.ctx || !r.ctx.listener)
          return r;
        for (var a = r._howls.length - 1; a >= 0; a--)
          r._howls[a].stereo(n);
        return r;
      }, HowlerGlobal.prototype.pos = function(n, r, a) {
        var o = this;
        if (!o.ctx || !o.ctx.listener)
          return o;
        if (r = typeof r != "number" ? o._pos[1] : r, a = typeof a != "number" ? o._pos[2] : a, typeof n == "number")
          o._pos = [n, r, a], typeof o.ctx.listener.positionX < "u" ? (o.ctx.listener.positionX.setTargetAtTime(o._pos[0], Howler.ctx.currentTime, 0.1), o.ctx.listener.positionY.setTargetAtTime(o._pos[1], Howler.ctx.currentTime, 0.1), o.ctx.listener.positionZ.setTargetAtTime(o._pos[2], Howler.ctx.currentTime, 0.1)) : o.ctx.listener.setPosition(o._pos[0], o._pos[1], o._pos[2]);
        else
          return o._pos;
        return o;
      }, HowlerGlobal.prototype.orientation = function(n, r, a, o, s, l) {
        var f = this;
        if (!f.ctx || !f.ctx.listener)
          return f;
        var u = f._orientation;
        if (r = typeof r != "number" ? u[1] : r, a = typeof a != "number" ? u[2] : a, o = typeof o != "number" ? u[3] : o, s = typeof s != "number" ? u[4] : s, l = typeof l != "number" ? u[5] : l, typeof n == "number")
          f._orientation = [n, r, a, o, s, l], typeof f.ctx.listener.forwardX < "u" ? (f.ctx.listener.forwardX.setTargetAtTime(n, Howler.ctx.currentTime, 0.1), f.ctx.listener.forwardY.setTargetAtTime(r, Howler.ctx.currentTime, 0.1), f.ctx.listener.forwardZ.setTargetAtTime(a, Howler.ctx.currentTime, 0.1), f.ctx.listener.upX.setTargetAtTime(o, Howler.ctx.currentTime, 0.1), f.ctx.listener.upY.setTargetAtTime(s, Howler.ctx.currentTime, 0.1), f.ctx.listener.upZ.setTargetAtTime(l, Howler.ctx.currentTime, 0.1)) : f.ctx.listener.setOrientation(n, r, a, o, s, l);
        else
          return u;
        return f;
      }, Howl.prototype.init = /* @__PURE__ */ function(n) {
        return function(r) {
          var a = this;
          return a._orientation = r.orientation || [1, 0, 0], a._stereo = r.stereo || null, a._pos = r.pos || null, a._pannerAttr = {
            coneInnerAngle: typeof r.coneInnerAngle < "u" ? r.coneInnerAngle : 360,
            coneOuterAngle: typeof r.coneOuterAngle < "u" ? r.coneOuterAngle : 360,
            coneOuterGain: typeof r.coneOuterGain < "u" ? r.coneOuterGain : 0,
            distanceModel: typeof r.distanceModel < "u" ? r.distanceModel : "inverse",
            maxDistance: typeof r.maxDistance < "u" ? r.maxDistance : 1e4,
            panningModel: typeof r.panningModel < "u" ? r.panningModel : "HRTF",
            refDistance: typeof r.refDistance < "u" ? r.refDistance : 1,
            rolloffFactor: typeof r.rolloffFactor < "u" ? r.rolloffFactor : 1
          }, a._onstereo = r.onstereo ? [{ fn: r.onstereo }] : [], a._onpos = r.onpos ? [{ fn: r.onpos }] : [], a._onorientation = r.onorientation ? [{ fn: r.onorientation }] : [], n.call(this, r);
        };
      }(Howl.prototype.init), Howl.prototype.stereo = function(n, r) {
        var a = this;
        if (!a._webAudio)
          return a;
        if (a._state !== "loaded")
          return a._queue.push({
            event: "stereo",
            action: function() {
              a.stereo(n, r);
            }
          }), a;
        var o = typeof Howler.ctx.createStereoPanner > "u" ? "spatial" : "stereo";
        if (typeof r > "u")
          if (typeof n == "number")
            a._stereo = n, a._pos = [n, 0, 0];
          else
            return a._stereo;
        for (var s = a._getSoundIds(r), l = 0; l < s.length; l++) {
          var f = a._soundById(s[l]);
          if (f)
            if (typeof n == "number")
              f._stereo = n, f._pos = [n, 0, 0], f._node && (f._pannerAttr.panningModel = "equalpower", (!f._panner || !f._panner.pan) && t(f, o), o === "spatial" ? typeof f._panner.positionX < "u" ? (f._panner.positionX.setValueAtTime(n, Howler.ctx.currentTime), f._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime), f._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime)) : f._panner.setPosition(n, 0, 0) : f._panner.pan.setValueAtTime(n, Howler.ctx.currentTime)), a._emit("stereo", f._id);
            else
              return f._stereo;
        }
        return a;
      }, Howl.prototype.pos = function(n, r, a, o) {
        var s = this;
        if (!s._webAudio)
          return s;
        if (s._state !== "loaded")
          return s._queue.push({
            event: "pos",
            action: function() {
              s.pos(n, r, a, o);
            }
          }), s;
        if (r = typeof r != "number" ? 0 : r, a = typeof a != "number" ? -0.5 : a, typeof o > "u")
          if (typeof n == "number")
            s._pos = [n, r, a];
          else
            return s._pos;
        for (var l = s._getSoundIds(o), f = 0; f < l.length; f++) {
          var u = s._soundById(l[f]);
          if (u)
            if (typeof n == "number")
              u._pos = [n, r, a], u._node && ((!u._panner || u._panner.pan) && t(u, "spatial"), typeof u._panner.positionX < "u" ? (u._panner.positionX.setValueAtTime(n, Howler.ctx.currentTime), u._panner.positionY.setValueAtTime(r, Howler.ctx.currentTime), u._panner.positionZ.setValueAtTime(a, Howler.ctx.currentTime)) : u._panner.setPosition(n, r, a)), s._emit("pos", u._id);
            else
              return u._pos;
        }
        return s;
      }, Howl.prototype.orientation = function(n, r, a, o) {
        var s = this;
        if (!s._webAudio)
          return s;
        if (s._state !== "loaded")
          return s._queue.push({
            event: "orientation",
            action: function() {
              s.orientation(n, r, a, o);
            }
          }), s;
        if (r = typeof r != "number" ? s._orientation[1] : r, a = typeof a != "number" ? s._orientation[2] : a, typeof o > "u")
          if (typeof n == "number")
            s._orientation = [n, r, a];
          else
            return s._orientation;
        for (var l = s._getSoundIds(o), f = 0; f < l.length; f++) {
          var u = s._soundById(l[f]);
          if (u)
            if (typeof n == "number")
              u._orientation = [n, r, a], u._node && (u._panner || (u._pos || (u._pos = s._pos || [0, 0, -0.5]), t(u, "spatial")), typeof u._panner.orientationX < "u" ? (u._panner.orientationX.setValueAtTime(n, Howler.ctx.currentTime), u._panner.orientationY.setValueAtTime(r, Howler.ctx.currentTime), u._panner.orientationZ.setValueAtTime(a, Howler.ctx.currentTime)) : u._panner.setOrientation(n, r, a)), s._emit("orientation", u._id);
            else
              return u._orientation;
        }
        return s;
      }, Howl.prototype.pannerAttr = function() {
        var n = this, r = arguments, a, o, s;
        if (!n._webAudio)
          return n;
        if (r.length === 0)
          return n._pannerAttr;
        if (r.length === 1)
          if (typeof r[0] == "object")
            a = r[0], typeof o > "u" && (a.pannerAttr || (a.pannerAttr = {
              coneInnerAngle: a.coneInnerAngle,
              coneOuterAngle: a.coneOuterAngle,
              coneOuterGain: a.coneOuterGain,
              distanceModel: a.distanceModel,
              maxDistance: a.maxDistance,
              refDistance: a.refDistance,
              rolloffFactor: a.rolloffFactor,
              panningModel: a.panningModel
            }), n._pannerAttr = {
              coneInnerAngle: typeof a.pannerAttr.coneInnerAngle < "u" ? a.pannerAttr.coneInnerAngle : n._coneInnerAngle,
              coneOuterAngle: typeof a.pannerAttr.coneOuterAngle < "u" ? a.pannerAttr.coneOuterAngle : n._coneOuterAngle,
              coneOuterGain: typeof a.pannerAttr.coneOuterGain < "u" ? a.pannerAttr.coneOuterGain : n._coneOuterGain,
              distanceModel: typeof a.pannerAttr.distanceModel < "u" ? a.pannerAttr.distanceModel : n._distanceModel,
              maxDistance: typeof a.pannerAttr.maxDistance < "u" ? a.pannerAttr.maxDistance : n._maxDistance,
              refDistance: typeof a.pannerAttr.refDistance < "u" ? a.pannerAttr.refDistance : n._refDistance,
              rolloffFactor: typeof a.pannerAttr.rolloffFactor < "u" ? a.pannerAttr.rolloffFactor : n._rolloffFactor,
              panningModel: typeof a.pannerAttr.panningModel < "u" ? a.pannerAttr.panningModel : n._panningModel
            });
          else
            return s = n._soundById(parseInt(r[0], 10)), s ? s._pannerAttr : n._pannerAttr;
        else r.length === 2 && (a = r[0], o = parseInt(r[1], 10));
        for (var l = n._getSoundIds(o), f = 0; f < l.length; f++)
          if (s = n._soundById(l[f]), s) {
            var u = s._pannerAttr;
            u = {
              coneInnerAngle: typeof a.coneInnerAngle < "u" ? a.coneInnerAngle : u.coneInnerAngle,
              coneOuterAngle: typeof a.coneOuterAngle < "u" ? a.coneOuterAngle : u.coneOuterAngle,
              coneOuterGain: typeof a.coneOuterGain < "u" ? a.coneOuterGain : u.coneOuterGain,
              distanceModel: typeof a.distanceModel < "u" ? a.distanceModel : u.distanceModel,
              maxDistance: typeof a.maxDistance < "u" ? a.maxDistance : u.maxDistance,
              refDistance: typeof a.refDistance < "u" ? a.refDistance : u.refDistance,
              rolloffFactor: typeof a.rolloffFactor < "u" ? a.rolloffFactor : u.rolloffFactor,
              panningModel: typeof a.panningModel < "u" ? a.panningModel : u.panningModel
            };
            var d = s._panner;
            d || (s._pos || (s._pos = n._pos || [0, 0, -0.5]), t(s, "spatial"), d = s._panner), d.coneInnerAngle = u.coneInnerAngle, d.coneOuterAngle = u.coneOuterAngle, d.coneOuterGain = u.coneOuterGain, d.distanceModel = u.distanceModel, d.maxDistance = u.maxDistance, d.refDistance = u.refDistance, d.rolloffFactor = u.rolloffFactor, d.panningModel = u.panningModel;
          }
        return n;
      }, Sound.prototype.init = /* @__PURE__ */ function(n) {
        return function() {
          var r = this, a = r._parent;
          r._orientation = a._orientation, r._stereo = a._stereo, r._pos = a._pos, r._pannerAttr = a._pannerAttr, n.call(this), r._stereo ? a.stereo(r._stereo) : r._pos && a.pos(r._pos[0], r._pos[1], r._pos[2], r._id);
        };
      }(Sound.prototype.init), Sound.prototype.reset = /* @__PURE__ */ function(n) {
        return function() {
          var r = this, a = r._parent;
          return r._orientation = a._orientation, r._stereo = a._stereo, r._pos = a._pos, r._pannerAttr = a._pannerAttr, r._stereo ? a.stereo(r._stereo) : r._pos ? a.pos(r._pos[0], r._pos[1], r._pos[2], r._id) : r._panner && (r._panner.disconnect(0), r._panner = void 0, a._refreshBuffer(r)), n.call(this);
        };
      }(Sound.prototype.reset);
      var t = function(n, r) {
        r = r || "spatial", r === "spatial" ? (n._panner = Howler.ctx.createPanner(), n._panner.coneInnerAngle = n._pannerAttr.coneInnerAngle, n._panner.coneOuterAngle = n._pannerAttr.coneOuterAngle, n._panner.coneOuterGain = n._pannerAttr.coneOuterGain, n._panner.distanceModel = n._pannerAttr.distanceModel, n._panner.maxDistance = n._pannerAttr.maxDistance, n._panner.refDistance = n._pannerAttr.refDistance, n._panner.rolloffFactor = n._pannerAttr.rolloffFactor, n._panner.panningModel = n._pannerAttr.panningModel, typeof n._panner.positionX < "u" ? (n._panner.positionX.setValueAtTime(n._pos[0], Howler.ctx.currentTime), n._panner.positionY.setValueAtTime(n._pos[1], Howler.ctx.currentTime), n._panner.positionZ.setValueAtTime(n._pos[2], Howler.ctx.currentTime)) : n._panner.setPosition(n._pos[0], n._pos[1], n._pos[2]), typeof n._panner.orientationX < "u" ? (n._panner.orientationX.setValueAtTime(n._orientation[0], Howler.ctx.currentTime), n._panner.orientationY.setValueAtTime(n._orientation[1], Howler.ctx.currentTime), n._panner.orientationZ.setValueAtTime(n._orientation[2], Howler.ctx.currentTime)) : n._panner.setOrientation(n._orientation[0], n._orientation[1], n._orientation[2])) : (n._panner = Howler.ctx.createStereoPanner(), n._panner.pan.setValueAtTime(n._stereo, Howler.ctx.currentTime)), n._panner.connect(n._node), n._paused || n._parent.pause(n._id, !0).play(n._id, !0);
      };
    })();
  }(ym)), ym;
}
sP();
var na, It;
const lP = class Vr {
  constructor() {
    Bb(this, It), gm(this, It, /* @__PURE__ */ new Map());
  }
  static getInstance() {
    return on(Vr, na) === void 0 && gm(Vr, na, new Vr()), on(Vr, na);
  }
  hasSound(t) {
    return on(this, It).has(t);
  }
  setSound(t, n) {
    on(this, It).set(t, n);
  }
  setSoundOnce(t, n) {
    on(this, It).has(t) || on(this, It).set(t, n);
  }
  getSound(t) {
    return on(this, It).get(t);
  }
  playSound(t) {
    var n;
    (n = on(this, It).get(t)) == null || n.play();
  }
};
na = /* @__PURE__ */ new WeakMap(), It = /* @__PURE__ */ new WeakMap(), Bb(lP, na);
var vm;
(function(e) {
  e.WINDOW_RESIZED = "tauri://resize", e.WINDOW_MOVED = "tauri://move", e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", e.WINDOW_DESTROYED = "tauri://destroyed", e.WINDOW_FOCUS = "tauri://focus", e.WINDOW_BLUR = "tauri://blur", e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", e.WINDOW_THEME_CHANGED = "tauri://theme-changed", e.WINDOW_CREATED = "tauri://window-created", e.WEBVIEW_CREATED = "tauri://webview-created", e.DRAG_ENTER = "tauri://drag-enter", e.DRAG_OVER = "tauri://drag-over", e.DRAG_DROP = "tauri://drag-drop", e.DRAG_LEAVE = "tauri://drag-leave";
})(vm || (vm = {}));
let cP = { data: "" }, uP = (e) => typeof window == "object" ? ((e ? e.querySelector("#_goober") : window._goober) || Object.assign((e || document.head).appendChild(document.createElement("style")), { innerHTML: " ", id: "_goober" })).firstChild : e || cP, fP = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g, dP = /\/\*[^]*?\*\/|  +/g, xm = /\n+/g, ln = (e, t) => {
  let n = "", r = "", a = "";
  for (let o in e) {
    let s = e[o];
    o[0] == "@" ? o[1] == "i" ? n = o + " " + s + ";" : r += o[1] == "f" ? ln(s, o) : o + "{" + ln(s, o[1] == "k" ? "" : t) + "}" : typeof s == "object" ? r += ln(s, t ? t.replace(/([^,])+/g, (l) => o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g, (f) => /&/.test(f) ? f.replace(/&/g, l) : l ? l + " " + f : f)) : o) : s != null && (o = /^--/.test(o) ? o : o.replace(/[A-Z]/g, "-$&").toLowerCase(), a += ln.p ? ln.p(o, s) : o + ":" + s + ";");
  }
  return n + (t && a ? t + "{" + a + "}" : a) + r;
}, Tt = {}, qb = (e) => {
  if (typeof e == "object") {
    let t = "";
    for (let n in e) t += n + qb(e[n]);
    return t;
  }
  return e;
}, pP = (e, t, n, r, a) => {
  let o = qb(e), s = Tt[o] || (Tt[o] = ((f) => {
    let u = 0, d = 11;
    for (; u < f.length; ) d = 101 * d + f.charCodeAt(u++) >>> 0;
    return "go" + d;
  })(o));
  if (!Tt[s]) {
    let f = o !== e ? e : ((u) => {
      let d, i, c = [{}];
      for (; d = fP.exec(u.replace(dP, "")); ) d[4] ? c.shift() : d[3] ? (i = d[3].replace(xm, " ").trim(), c.unshift(c[0][i] = c[0][i] || {})) : c[0][d[1]] = d[2].replace(xm, " ").trim();
      return c[0];
    })(e);
    Tt[s] = ln(a ? { ["@keyframes " + s]: f } : f, n ? "" : "." + s);
  }
  let l = n && Tt.g ? Tt.g : null;
  return n && (Tt.g = Tt[s]), ((f, u, d, i) => {
    i ? u.data = u.data.replace(i, f) : u.data.indexOf(f) === -1 && (u.data = d ? f + u.data : u.data + f);
  })(Tt[s], t, r, l), s;
}, mP = (e, t, n) => e.reduce((r, a, o) => {
  let s = t[o];
  if (s && s.call) {
    let l = s(n), f = l && l.props && l.props.className || /^go/.test(l) && l;
    s = f ? "." + f : l && typeof l == "object" ? l.props ? "" : ln(l, "") : l === !1 ? "" : l;
  }
  return r + a + (s ?? "");
}, "");
function si(e) {
  let t = this || {}, n = e.call ? e(t.p) : e;
  return pP(n.unshift ? n.raw ? mP(n, [].slice.call(arguments, 1), t.p) : n.reduce((r, a) => Object.assign(r, a && a.call ? a(t.p) : a), {}) : n, uP(t.target), t.g, t.o, t.k);
}
let Xb, Zl, ec;
si.bind({ g: 1 });
let Yt = si.bind({ k: 1 });
function hP(e, t, n, r) {
  ln.p = t, Xb = e, Zl = n, ec = r;
}
function Sn(e, t) {
  let n = this || {};
  return function() {
    let r = arguments;
    function a(o, s) {
      let l = Object.assign({}, o), f = l.className || a.className;
      n.p = Object.assign({ theme: Zl && Zl() }, l), n.o = / *go\d+/.test(f), l.className = si.apply(n, r) + (f ? " " + f : "");
      let u = e;
      return e[0] && (u = l.as || e, delete l.as), ec && u[0] && ec(l), Xb(u, l);
    }
    return a;
  };
}
var gP = (e) => typeof e == "function", yP = (e, t) => gP(e) ? e(t) : e, bP = /* @__PURE__ */ (() => {
  let e;
  return () => {
    if (e === void 0 && typeof window < "u") {
      let t = matchMedia("(prefers-reduced-motion: reduce)");
      e = !t || t.matches;
    }
    return e;
  };
})(), vP = Yt`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`, xP = Yt`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`, wP = Yt`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`, _P = Sn("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${vP} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${xP} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${(e) => e.secondary || "#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${wP} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`, kP = Yt`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`, AP = Sn("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(e) => e.secondary || "#e0e0e0"};
  border-right-color: ${(e) => e.primary || "#616161"};
  animation: ${kP} 1s linear infinite;
`, OP = Yt`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`, SP = Yt`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`, EP = Sn("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e) => e.primary || "#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${OP} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${SP} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${(e) => e.secondary || "#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`, PP = Sn("div")`
  position: absolute;
`, CP = Sn("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`, NP = Yt`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`, TP = Sn("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${NP} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`, IP = ({ toast: e }) => {
  let { icon: t, type: n, iconTheme: r } = e;
  return t !== void 0 ? typeof t == "string" ? C.createElement(TP, null, t) : t : n === "blank" ? null : C.createElement(CP, null, C.createElement(AP, { ...r }), n !== "loading" && C.createElement(PP, null, n === "error" ? C.createElement(_P, { ...r }) : C.createElement(EP, { ...r })));
}, $P = (e) => `
0% {transform: translate3d(0,${e * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`, jP = (e) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e * -150}%,-1px) scale(.6); opacity:0;}
`, MP = "0%{opacity:0;} 100%{opacity:1;}", RP = "0%{opacity:1;} 100%{opacity:0;}", zP = Sn("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`, DP = Sn("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`, FP = (e, t) => {
  let n = e.includes("top") ? 1 : -1, [r, a] = bP() ? [MP, RP] : [$P(n), jP(n)];
  return { animation: t ? `${Yt(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${Yt(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)` };
};
C.memo(({ toast: e, position: t, style: n, children: r }) => {
  let a = e.height ? FP(e.position || t || "top-center", e.visible) : { opacity: 0 }, o = C.createElement(IP, { toast: e }), s = C.createElement(DP, { ...e.ariaProps }, yP(e.message, e));
  return C.createElement(zP, { className: e.className, style: { ...a, ...n, ...e.style } }, typeof r == "function" ? r({ icon: o, message: s }) : C.createElement(C.Fragment, null, o, s));
});
hP(C.createElement);
si`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;
var jt = /* @__PURE__ */ ((e) => (e.Artcraft = "artcraft", e.Fal = "fal", e.Midjourney = "midjourney", e.Sora = "sora", e))(jt || {});
function qP({}) {
  const [e, t] = dt(!1), [n, r] = dt(jt.Artcraft);
  iP(async (d) => {
    console.log("Show provider login modal event received from Tauri:", d), r(d.provider), t(!0);
  });
  const a = LP(n), o = `Set up ${a}`, s = `Add your ${a} account to ArtCraft!`, l = `You can add your ${a} account to ArtCraft by simply logging in. Use your credits and account directly within Artcraft. You can add all of your AI accounts to Artcraft to use them all in one place and build the ultimate AI art tool.`, f = `Set up ${a}`, u = async () => {
    switch (n) {
      case jt.Midjourney:
        await Dd("midjourney_open_login_command");
        break;
      case jt.Sora:
        await Dd("open_sora_login_command");
        break;
      case jt.Fal:
        break;
    }
    t(!1);
  };
  return /* @__PURE__ */ G(
    Pa,
    {
      isOpen: e,
      onClose: () => {
        t(!1);
      },
      className: "max-w-2xl max-h-[500px] p-6",
      showClose: !0,
      children: /* @__PURE__ */ He("div", { className: "flex flex-col items-center justify-center gap-6", children: [
        /* @__PURE__ */ He("div", { className: "flex flex-col items-center gap-3", children: [
          /* @__PURE__ */ G("br", {}),
          /* @__PURE__ */ He("h1", { className: "text-3xl font-bold", children: [
            /* @__PURE__ */ G(
              au,
              {
                icon: ZS,
                className: "mr-3 text-[24px]"
              }
            ),
            o
          ] }),
          /* @__PURE__ */ He("div", { className: "text-center", children: [
            /* @__PURE__ */ G("p", { className: "text-lg font-medium text-white/80", children: s }),
            /* @__PURE__ */ G("br", {}),
            /* @__PURE__ */ G("p", { className: "text-white/60", children: l }),
            /* @__PURE__ */ G("br", {})
          ] })
        ] }),
        /* @__PURE__ */ G(
          tP,
          {
            className: "font-semibold",
            icon: e4,
            iconFlip: !0,
            onClick: () => {
              u();
            },
            children: f
          }
        )
      ] })
    }
  );
}
function LP(e) {
  switch (e) {
    case jt.Sora:
      return "Sora";
    case jt.Fal:
      return "Fal";
    case jt.Midjourney:
      return "Midjourney";
    case jt.Artcraft:
    default:
      return "Artcraft";
  }
}
export {
  qP as ProviderSetupModal
};
