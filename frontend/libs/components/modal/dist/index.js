import { jsx as V, jsxs as gt, Fragment as br } from "react/jsx-runtime";
import * as S from "react";
import Ir, { useState as yt, useEffect as Ae, useLayoutEffect as Xf, useRef as Ee, forwardRef as Kf, useCallback as Qf, useMemo as Zf, useContext as ql, createContext as Jf, isValidElement as Ni, cloneElement as Ri } from "react";
import * as ed from "react-dom";
import td, { unstable_batchedUpdates as nd } from "react-dom";
function xt(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function(a) {
    if (e == null || e(a), n === !1 || !a.defaultPrevented)
      return t == null ? void 0 : t(a);
  };
}
function Mi(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function Hl(...e) {
  return (t) => {
    let n = !1;
    const r = e.map((a) => {
      const o = Mi(a, t);
      return !n && typeof o == "function" && (n = !0), o;
    });
    if (n)
      return () => {
        for (let a = 0; a < r.length; a++) {
          const o = r[a];
          typeof o == "function" ? o() : Mi(e[a], null);
        }
      };
  };
}
function jt(...e) {
  return S.useCallback(Hl(...e), e);
}
function rd(e, t) {
  const n = S.createContext(t), r = (o) => {
    const { children: i, ...s } = o, c = S.useMemo(() => s, Object.values(s));
    return /* @__PURE__ */ V(n.Provider, { value: c, children: i });
  };
  r.displayName = e + "Provider";
  function a(o) {
    const i = S.useContext(n);
    if (i) return i;
    if (t !== void 0) return t;
    throw new Error(`\`${o}\` must be used within \`${e}\``);
  }
  return [r, a];
}
function ad(e, t = []) {
  let n = [];
  function r(o, i) {
    const s = S.createContext(i), c = n.length;
    n = [...n, i];
    const l = (f) => {
      var b;
      const { scope: d, children: y, ...v } = f, m = ((b = d == null ? void 0 : d[e]) == null ? void 0 : b[c]) || s, p = S.useMemo(() => v, Object.values(v));
      return /* @__PURE__ */ V(m.Provider, { value: p, children: y });
    };
    l.displayName = o + "Provider";
    function u(f, d) {
      var m;
      const y = ((m = d == null ? void 0 : d[e]) == null ? void 0 : m[c]) || s, v = S.useContext(y);
      if (v) return v;
      if (i !== void 0) return i;
      throw new Error(`\`${f}\` must be used within \`${o}\``);
    }
    return [l, u];
  }
  const a = () => {
    const o = n.map((i) => S.createContext(i));
    return function(s) {
      const c = (s == null ? void 0 : s[e]) || o;
      return S.useMemo(
        () => ({ [`__scope${e}`]: { ...s, [e]: c } }),
        [s, c]
      );
    };
  };
  return a.scopeName = e, [r, od(a, ...t)];
}
function od(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const r = e.map((a) => ({
      useScope: a(),
      scopeName: a.scopeName
    }));
    return function(o) {
      const i = r.reduce((s, { useScope: c, scopeName: l }) => {
        const f = c(o)[`__scope${l}`];
        return { ...s, ...f };
      }, {});
      return S.useMemo(() => ({ [`__scope${t.scopeName}`]: i }), [i]);
    };
  };
  return n.scopeName = t.scopeName, n;
}
var _n = globalThis != null && globalThis.document ? S.useLayoutEffect : () => {
}, id = S[" useId ".trim().toString()] || (() => {
}), sd = 0;
function ra(e) {
  const [t, n] = S.useState(id());
  return _n(() => {
    n((r) => r ?? String(sd++));
  }, [e]), e || (t ? `radix-${t}` : "");
}
var ld = S[" useInsertionEffect ".trim().toString()] || _n;
function cd({
  prop: e,
  defaultProp: t,
  onChange: n = () => {
  },
  caller: r
}) {
  const [a, o, i] = ud({
    defaultProp: t,
    onChange: n
  }), s = e !== void 0, c = s ? e : a;
  {
    const u = S.useRef(e !== void 0);
    S.useEffect(() => {
      const f = u.current;
      f !== s && console.warn(
        `${r} is changing from ${f ? "controlled" : "uncontrolled"} to ${s ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), u.current = s;
    }, [s, r]);
  }
  const l = S.useCallback(
    (u) => {
      var f;
      if (s) {
        const d = fd(u) ? u(e) : u;
        d !== e && ((f = i.current) == null || f.call(i, d));
      } else
        o(u);
    },
    [s, e, o, i]
  );
  return [c, l];
}
function ud({
  defaultProp: e,
  onChange: t
}) {
  const [n, r] = S.useState(e), a = S.useRef(n), o = S.useRef(t);
  return ld(() => {
    o.current = t;
  }, [t]), S.useEffect(() => {
    var i;
    a.current !== n && ((i = o.current) == null || i.call(o, n), a.current = n);
  }, [n, a]), [n, r, o];
}
function fd(e) {
  return typeof e == "function";
}
// @__NO_SIDE_EFFECTS__
function Xl(e) {
  const t = /* @__PURE__ */ dd(e), n = S.forwardRef((r, a) => {
    const { children: o, ...i } = r, s = S.Children.toArray(o), c = s.find(pd);
    if (c) {
      const l = c.props.children, u = s.map((f) => f === c ? S.Children.count(l) > 1 ? S.Children.only(null) : S.isValidElement(l) ? l.props.children : null : f);
      return /* @__PURE__ */ V(t, { ...i, ref: a, children: S.isValidElement(l) ? S.cloneElement(l, void 0, u) : null });
    }
    return /* @__PURE__ */ V(t, { ...i, ref: a, children: o });
  });
  return n.displayName = `${e}.Slot`, n;
}
// @__NO_SIDE_EFFECTS__
function dd(e) {
  const t = S.forwardRef((n, r) => {
    const { children: a, ...o } = n;
    if (S.isValidElement(a)) {
      const i = gd(a), s = hd(o, a.props);
      return a.type !== S.Fragment && (s.ref = r ? Hl(r, i) : i), S.cloneElement(a, s);
    }
    return S.Children.count(a) > 1 ? S.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var md = Symbol("radix.slottable");
function pd(e) {
  return S.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === md;
}
function hd(e, t) {
  const n = { ...t };
  for (const r in t) {
    const a = e[r], o = t[r];
    /^on[A-Z]/.test(r) ? a && o ? n[r] = (...s) => {
      const c = o(...s);
      return a(...s), c;
    } : a && (n[r] = a) : r === "style" ? n[r] = { ...a, ...o } : r === "className" && (n[r] = [a, o].filter(Boolean).join(" "));
  }
  return { ...e, ...n };
}
function gd(e) {
  var r, a;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (a = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : a.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
var yd = [
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
], Qe = yd.reduce((e, t) => {
  const n = /* @__PURE__ */ Xl(`Primitive.${t}`), r = S.forwardRef((a, o) => {
    const { asChild: i, ...s } = a, c = i ? n : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ V(c, { ...s, ref: o });
  });
  return r.displayName = `Primitive.${t}`, { ...e, [t]: r };
}, {});
function bd(e, t) {
  e && ed.flushSync(() => e.dispatchEvent(t));
}
function In(e) {
  const t = S.useRef(e);
  return S.useEffect(() => {
    t.current = e;
  }), S.useMemo(() => (...n) => {
    var r;
    return (r = t.current) == null ? void 0 : r.call(t, ...n);
  }, []);
}
function vd(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = In(e);
  S.useEffect(() => {
    const r = (a) => {
      a.key === "Escape" && n(a);
    };
    return t.addEventListener("keydown", r, { capture: !0 }), () => t.removeEventListener("keydown", r, { capture: !0 });
  }, [n, t]);
}
var xd = "DismissableLayer", Va = "dismissableLayer.update", wd = "dismissableLayer.pointerDownOutside", Ed = "dismissableLayer.focusOutside", Fi, Kl = S.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), Ql = S.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: n = !1,
      onEscapeKeyDown: r,
      onPointerDownOutside: a,
      onFocusOutside: o,
      onInteractOutside: i,
      onDismiss: s,
      ...c
    } = e, l = S.useContext(Kl), [u, f] = S.useState(null), d = (u == null ? void 0 : u.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, y] = S.useState({}), v = jt(t, (j) => f(j)), m = Array.from(l.layers), [p] = [...l.layersWithOutsidePointerEventsDisabled].slice(-1), b = m.indexOf(p), A = u ? m.indexOf(u) : -1, w = l.layersWithOutsidePointerEventsDisabled.size > 0, P = A >= b, h = Pd((j) => {
      const K = j.target, J = [...l.branches].some((oe) => oe.contains(K));
      !P || J || (a == null || a(j), i == null || i(j), j.defaultPrevented || s == null || s());
    }, d), H = kd((j) => {
      const K = j.target;
      [...l.branches].some((oe) => oe.contains(K)) || (o == null || o(j), i == null || i(j), j.defaultPrevented || s == null || s());
    }, d);
    return vd((j) => {
      A === l.layers.size - 1 && (r == null || r(j), !j.defaultPrevented && s && (j.preventDefault(), s()));
    }, d), S.useEffect(() => {
      if (u)
        return n && (l.layersWithOutsidePointerEventsDisabled.size === 0 && (Fi = d.body.style.pointerEvents, d.body.style.pointerEvents = "none"), l.layersWithOutsidePointerEventsDisabled.add(u)), l.layers.add(u), Di(), () => {
          n && l.layersWithOutsidePointerEventsDisabled.size === 1 && (d.body.style.pointerEvents = Fi);
        };
    }, [u, d, n, l]), S.useEffect(() => () => {
      u && (l.layers.delete(u), l.layersWithOutsidePointerEventsDisabled.delete(u), Di());
    }, [u, l]), S.useEffect(() => {
      const j = () => y({});
      return document.addEventListener(Va, j), () => document.removeEventListener(Va, j);
    }, []), /* @__PURE__ */ V(
      Qe.div,
      {
        ...c,
        ref: v,
        style: {
          pointerEvents: w ? P ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: xt(e.onFocusCapture, H.onFocusCapture),
        onBlurCapture: xt(e.onBlurCapture, H.onBlurCapture),
        onPointerDownCapture: xt(
          e.onPointerDownCapture,
          h.onPointerDownCapture
        )
      }
    );
  }
);
Ql.displayName = xd;
var Sd = "DismissableLayerBranch", Ad = S.forwardRef((e, t) => {
  const n = S.useContext(Kl), r = S.useRef(null), a = jt(t, r);
  return S.useEffect(() => {
    const o = r.current;
    if (o)
      return n.branches.add(o), () => {
        n.branches.delete(o);
      };
  }, [n.branches]), /* @__PURE__ */ V(Qe.div, { ...e, ref: a });
});
Ad.displayName = Sd;
function Pd(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = In(e), r = S.useRef(!1), a = S.useRef(() => {
  });
  return S.useEffect(() => {
    const o = (s) => {
      if (s.target && !r.current) {
        let c = function() {
          Zl(
            wd,
            n,
            l,
            { discrete: !0 }
          );
        };
        const l = { originalEvent: s };
        s.pointerType === "touch" ? (t.removeEventListener("click", a.current), a.current = c, t.addEventListener("click", a.current, { once: !0 })) : c();
      } else
        t.removeEventListener("click", a.current);
      r.current = !1;
    }, i = window.setTimeout(() => {
      t.addEventListener("pointerdown", o);
    }, 0);
    return () => {
      window.clearTimeout(i), t.removeEventListener("pointerdown", o), t.removeEventListener("click", a.current);
    };
  }, [t, n]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => r.current = !0
  };
}
function kd(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = In(e), r = S.useRef(!1);
  return S.useEffect(() => {
    const a = (o) => {
      o.target && !r.current && Zl(Ed, n, { originalEvent: o }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", a), () => t.removeEventListener("focusin", a);
  }, [t, n]), {
    onFocusCapture: () => r.current = !0,
    onBlurCapture: () => r.current = !1
  };
}
function Di() {
  const e = new CustomEvent(Va);
  document.dispatchEvent(e);
}
function Zl(e, t, n, { discrete: r }) {
  const a = n.originalEvent.target, o = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && a.addEventListener(e, t, { once: !0 }), r ? bd(a, o) : a.dispatchEvent(o);
}
var aa = "focusScope.autoFocusOnMount", oa = "focusScope.autoFocusOnUnmount", ji = { bubbles: !1, cancelable: !0 }, Od = "FocusScope", Jl = S.forwardRef((e, t) => {
  const {
    loop: n = !1,
    trapped: r = !1,
    onMountAutoFocus: a,
    onUnmountAutoFocus: o,
    ...i
  } = e, [s, c] = S.useState(null), l = In(a), u = In(o), f = S.useRef(null), d = jt(t, (m) => c(m)), y = S.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  S.useEffect(() => {
    if (r) {
      let m = function(w) {
        if (y.paused || !s) return;
        const P = w.target;
        s.contains(P) ? f.current = P : ht(f.current, { select: !0 });
      }, p = function(w) {
        if (y.paused || !s) return;
        const P = w.relatedTarget;
        P !== null && (s.contains(P) || ht(f.current, { select: !0 }));
      }, b = function(w) {
        if (document.activeElement === document.body)
          for (const h of w)
            h.removedNodes.length > 0 && ht(s);
      };
      document.addEventListener("focusin", m), document.addEventListener("focusout", p);
      const A = new MutationObserver(b);
      return s && A.observe(s, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", m), document.removeEventListener("focusout", p), A.disconnect();
      };
    }
  }, [r, s, y.paused]), S.useEffect(() => {
    if (s) {
      Li.add(y);
      const m = document.activeElement;
      if (!s.contains(m)) {
        const b = new CustomEvent(aa, ji);
        s.addEventListener(aa, l), s.dispatchEvent(b), b.defaultPrevented || (Cd(Rd(ec(s)), { select: !0 }), document.activeElement === m && ht(s));
      }
      return () => {
        s.removeEventListener(aa, l), setTimeout(() => {
          const b = new CustomEvent(oa, ji);
          s.addEventListener(oa, u), s.dispatchEvent(b), b.defaultPrevented || ht(m ?? document.body, { select: !0 }), s.removeEventListener(oa, u), Li.remove(y);
        }, 0);
      };
    }
  }, [s, l, u, y]);
  const v = S.useCallback(
    (m) => {
      if (!n && !r || y.paused) return;
      const p = m.key === "Tab" && !m.altKey && !m.ctrlKey && !m.metaKey, b = document.activeElement;
      if (p && b) {
        const A = m.currentTarget, [w, P] = Td(A);
        w && P ? !m.shiftKey && b === P ? (m.preventDefault(), n && ht(w, { select: !0 })) : m.shiftKey && b === w && (m.preventDefault(), n && ht(P, { select: !0 })) : b === A && m.preventDefault();
      }
    },
    [n, r, y.paused]
  );
  return /* @__PURE__ */ V(Qe.div, { tabIndex: -1, ...i, ref: d, onKeyDown: v });
});
Jl.displayName = Od;
function Cd(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const r of e)
    if (ht(r, { select: t }), document.activeElement !== n) return;
}
function Td(e) {
  const t = ec(e), n = zi(t, e), r = zi(t.reverse(), e);
  return [n, r];
}
function ec(e) {
  const t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (r) => {
      const a = r.tagName === "INPUT" && r.type === "hidden";
      return r.disabled || r.hidden || a ? NodeFilter.FILTER_SKIP : r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function zi(e, t) {
  for (const n of e)
    if (!_d(n, { upTo: t })) return n;
}
function _d(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function Id(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function ht(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && Id(e) && t && e.select();
  }
}
var Li = Nd();
function Nd() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && (n == null || n.pause()), e = $i(e, t), e.unshift(t);
    },
    remove(t) {
      var n;
      e = $i(e, t), (n = e[0]) == null || n.resume();
    }
  };
}
function $i(e, t) {
  const n = [...e], r = n.indexOf(t);
  return r !== -1 && n.splice(r, 1), n;
}
function Rd(e) {
  return e.filter((t) => t.tagName !== "A");
}
var Md = "Portal", tc = S.forwardRef((e, t) => {
  var s;
  const { container: n, ...r } = e, [a, o] = S.useState(!1);
  _n(() => o(!0), []);
  const i = n || a && ((s = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : s.body);
  return i ? td.createPortal(/* @__PURE__ */ V(Qe.div, { ...r, ref: t }), i) : null;
});
tc.displayName = Md;
function Fd(e, t) {
  return S.useReducer((n, r) => t[n][r] ?? n, e);
}
var Nr = (e) => {
  const { present: t, children: n } = e, r = Dd(t), a = typeof n == "function" ? n({ present: r.isPresent }) : S.Children.only(n), o = jt(r.ref, jd(a));
  return typeof n == "function" || r.isPresent ? S.cloneElement(a, { ref: o }) : null;
};
Nr.displayName = "Presence";
function Dd(e) {
  const [t, n] = S.useState(), r = S.useRef(null), a = S.useRef(e), o = S.useRef("none"), i = e ? "mounted" : "unmounted", [s, c] = Fd(i, {
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
  return S.useEffect(() => {
    const l = Qn(r.current);
    o.current = s === "mounted" ? l : "none";
  }, [s]), _n(() => {
    const l = r.current, u = a.current;
    if (u !== e) {
      const d = o.current, y = Qn(l);
      e ? c("MOUNT") : y === "none" || (l == null ? void 0 : l.display) === "none" ? c("UNMOUNT") : c(u && d !== y ? "ANIMATION_OUT" : "UNMOUNT"), a.current = e;
    }
  }, [e, c]), _n(() => {
    if (t) {
      let l;
      const u = t.ownerDocument.defaultView ?? window, f = (y) => {
        const m = Qn(r.current).includes(y.animationName);
        if (y.target === t && m && (c("ANIMATION_END"), !a.current)) {
          const p = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", l = u.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = p);
          });
        }
      }, d = (y) => {
        y.target === t && (o.current = Qn(r.current));
      };
      return t.addEventListener("animationstart", d), t.addEventListener("animationcancel", f), t.addEventListener("animationend", f), () => {
        u.clearTimeout(l), t.removeEventListener("animationstart", d), t.removeEventListener("animationcancel", f), t.removeEventListener("animationend", f);
      };
    } else
      c("ANIMATION_END");
  }, [t, c]), {
    isPresent: ["mounted", "unmountSuspended"].includes(s),
    ref: S.useCallback((l) => {
      r.current = l ? getComputedStyle(l) : null, n(l);
    }, [])
  };
}
function Qn(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function jd(e) {
  var r, a;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get, n = t && "isReactWarning" in t && t.isReactWarning;
  return n ? e.ref : (t = (a = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : a.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
var ia = 0;
function zd() {
  S.useEffect(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? Wi()), document.body.insertAdjacentElement("beforeend", e[1] ?? Wi()), ia++, () => {
      ia === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), ia--;
    };
  }, []);
}
function Wi() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var Ge = function() {
  return Ge = Object.assign || function(t) {
    for (var n, r = 1, a = arguments.length; r < a; r++) {
      n = arguments[r];
      for (var o in n) Object.prototype.hasOwnProperty.call(n, o) && (t[o] = n[o]);
    }
    return t;
  }, Ge.apply(this, arguments);
};
function nc(e, t) {
  var n = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var a = 0, r = Object.getOwnPropertySymbols(e); a < r.length; a++)
      t.indexOf(r[a]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[a]) && (n[r[a]] = e[r[a]]);
  return n;
}
function Ld(e, t, n) {
  if (n || arguments.length === 2) for (var r = 0, a = t.length, o; r < a; r++)
    (o || !(r in t)) && (o || (o = Array.prototype.slice.call(t, 0, r)), o[r] = t[r]);
  return e.concat(o || Array.prototype.slice.call(t));
}
var ur = "right-scroll-bar-position", fr = "width-before-scroll-bar", $d = "with-scroll-bars-hidden", Wd = "--removed-body-scroll-bar-size";
function sa(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function Ud(e, t) {
  var n = yt(function() {
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
var Vd = typeof window < "u" ? S.useLayoutEffect : S.useEffect, Ui = /* @__PURE__ */ new WeakMap();
function Yd(e, t) {
  var n = Ud(null, function(r) {
    return e.forEach(function(a) {
      return sa(a, r);
    });
  });
  return Vd(function() {
    var r = Ui.get(n);
    if (r) {
      var a = new Set(r), o = new Set(e), i = n.current;
      a.forEach(function(s) {
        o.has(s) || sa(s, null);
      }), o.forEach(function(s) {
        a.has(s) || sa(s, i);
      });
    }
    Ui.set(n, e);
  }, [e]), n;
}
function Gd(e) {
  return e;
}
function Bd(e, t) {
  t === void 0 && (t = Gd);
  var n = [], r = !1, a = {
    read: function() {
      if (r)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return n.length ? n[n.length - 1] : e;
    },
    useMedium: function(o) {
      var i = t(o, r);
      return n.push(i), function() {
        n = n.filter(function(s) {
          return s !== i;
        });
      };
    },
    assignSyncMedium: function(o) {
      for (r = !0; n.length; ) {
        var i = n;
        n = [], i.forEach(o);
      }
      n = {
        push: function(s) {
          return o(s);
        },
        filter: function() {
          return n;
        }
      };
    },
    assignMedium: function(o) {
      r = !0;
      var i = [];
      if (n.length) {
        var s = n;
        n = [], s.forEach(o), i = n;
      }
      var c = function() {
        var u = i;
        i = [], u.forEach(o);
      }, l = function() {
        return Promise.resolve().then(c);
      };
      l(), n = {
        push: function(u) {
          i.push(u), l();
        },
        filter: function(u) {
          return i = i.filter(u), n;
        }
      };
    }
  };
  return a;
}
function qd(e) {
  e === void 0 && (e = {});
  var t = Bd(null);
  return t.options = Ge({ async: !0, ssr: !1 }, e), t;
}
var rc = function(e) {
  var t = e.sideCar, n = nc(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var r = t.read();
  if (!r)
    throw new Error("Sidecar medium not found");
  return S.createElement(r, Ge({}, n));
};
rc.isSideCarExport = !0;
function Hd(e, t) {
  return e.useMedium(t), rc;
}
var ac = qd(), la = function() {
}, Rr = S.forwardRef(function(e, t) {
  var n = S.useRef(null), r = S.useState({
    onScrollCapture: la,
    onWheelCapture: la,
    onTouchMoveCapture: la
  }), a = r[0], o = r[1], i = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, f = e.shards, d = e.sideCar, y = e.noRelative, v = e.noIsolation, m = e.inert, p = e.allowPinchZoom, b = e.as, A = b === void 0 ? "div" : b, w = e.gapMode, P = nc(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), h = d, H = Yd([n, t]), j = Ge(Ge({}, P), a);
  return S.createElement(
    S.Fragment,
    null,
    u && S.createElement(h, { sideCar: ac, removeScrollBar: l, shards: f, noRelative: y, noIsolation: v, inert: m, setCallbacks: o, allowPinchZoom: !!p, lockRef: n, gapMode: w }),
    i ? S.cloneElement(S.Children.only(s), Ge(Ge({}, j), { ref: H })) : S.createElement(A, Ge({}, j, { className: c, ref: H }), s)
  );
});
Rr.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
Rr.classNames = {
  fullWidth: fr,
  zeroRight: ur
};
var Xd = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function Kd() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = Xd();
  return t && e.setAttribute("nonce", t), e;
}
function Qd(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function Zd(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var Jd = function() {
  var e = 0, t = null;
  return {
    add: function(n) {
      e == 0 && (t = Kd()) && (Qd(t, n), Zd(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, em = function() {
  var e = Jd();
  return function(t, n) {
    S.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && n]);
  };
}, oc = function() {
  var e = em(), t = function(n) {
    var r = n.styles, a = n.dynamic;
    return e(r, a), null;
  };
  return t;
}, tm = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, ca = function(e) {
  return parseInt(e || "", 10) || 0;
}, nm = function(e) {
  var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], a = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [ca(n), ca(r), ca(a)];
}, rm = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return tm;
  var t = nm(e), n = document.documentElement.clientWidth, r = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, r - n + t[2] - t[0])
  };
}, am = oc(), Ht = "data-scroll-locked", om = function(e, t, n, r) {
  var a = e.left, o = e.top, i = e.right, s = e.gap;
  return n === void 0 && (n = "margin"), `
  .`.concat($d, ` {
   overflow: hidden `).concat(r, `;
   padding-right: `).concat(s, "px ").concat(r, `;
  }
  body[`).concat(Ht, `] {
    overflow: hidden `).concat(r, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(r, ";"),
    n === "margin" && `
    padding-left: `.concat(a, `px;
    padding-top: `).concat(o, `px;
    padding-right: `).concat(i, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(s, "px ").concat(r, `;
    `),
    n === "padding" && "padding-right: ".concat(s, "px ").concat(r, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(ur, ` {
    right: `).concat(s, "px ").concat(r, `;
  }
  
  .`).concat(fr, ` {
    margin-right: `).concat(s, "px ").concat(r, `;
  }
  
  .`).concat(ur, " .").concat(ur, ` {
    right: 0 `).concat(r, `;
  }
  
  .`).concat(fr, " .").concat(fr, ` {
    margin-right: 0 `).concat(r, `;
  }
  
  body[`).concat(Ht, `] {
    `).concat(Wd, ": ").concat(s, `px;
  }
`);
}, Vi = function() {
  var e = parseInt(document.body.getAttribute(Ht) || "0", 10);
  return isFinite(e) ? e : 0;
}, im = function() {
  S.useEffect(function() {
    return document.body.setAttribute(Ht, (Vi() + 1).toString()), function() {
      var e = Vi() - 1;
      e <= 0 ? document.body.removeAttribute(Ht) : document.body.setAttribute(Ht, e.toString());
    };
  }, []);
}, sm = function(e) {
  var t = e.noRelative, n = e.noImportant, r = e.gapMode, a = r === void 0 ? "margin" : r;
  im();
  var o = S.useMemo(function() {
    return rm(a);
  }, [a]);
  return S.createElement(am, { styles: om(o, !t, a, n ? "" : "!important") });
}, Ya = !1;
if (typeof window < "u")
  try {
    var Zn = Object.defineProperty({}, "passive", {
      get: function() {
        return Ya = !0, !0;
      }
    });
    window.addEventListener("test", Zn, Zn), window.removeEventListener("test", Zn, Zn);
  } catch {
    Ya = !1;
  }
var Lt = Ya ? { passive: !1 } : !1, lm = function(e) {
  return e.tagName === "TEXTAREA";
}, ic = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var n = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    n[t] !== "hidden" && // contains scroll inside self
    !(n.overflowY === n.overflowX && !lm(e) && n[t] === "visible")
  );
}, cm = function(e) {
  return ic(e, "overflowY");
}, um = function(e) {
  return ic(e, "overflowX");
}, Yi = function(e, t) {
  var n = t.ownerDocument, r = t;
  do {
    typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host);
    var a = sc(e, r);
    if (a) {
      var o = lc(e, r), i = o[1], s = o[2];
      if (i > s)
        return !0;
    }
    r = r.parentNode;
  } while (r && r !== n.body);
  return !1;
}, fm = function(e) {
  var t = e.scrollTop, n = e.scrollHeight, r = e.clientHeight;
  return [
    t,
    n,
    r
  ];
}, dm = function(e) {
  var t = e.scrollLeft, n = e.scrollWidth, r = e.clientWidth;
  return [
    t,
    n,
    r
  ];
}, sc = function(e, t) {
  return e === "v" ? cm(t) : um(t);
}, lc = function(e, t) {
  return e === "v" ? fm(t) : dm(t);
}, mm = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, pm = function(e, t, n, r, a) {
  var o = mm(e, window.getComputedStyle(t).direction), i = o * r, s = n.target, c = t.contains(s), l = !1, u = i > 0, f = 0, d = 0;
  do {
    if (!s)
      break;
    var y = lc(e, s), v = y[0], m = y[1], p = y[2], b = m - p - o * v;
    (v || b) && sc(e, s) && (f += b, d += v);
    var A = s.parentNode;
    s = A && A.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? A.host : A;
  } while (
    // portaled content
    !c && s !== document.body || // self content
    c && (t.contains(s) || t === s)
  );
  return (u && Math.abs(f) < 1 || !u && Math.abs(d) < 1) && (l = !0), l;
}, Jn = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Gi = function(e) {
  return [e.deltaX, e.deltaY];
}, Bi = function(e) {
  return e && "current" in e ? e.current : e;
}, hm = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, gm = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, ym = 0, $t = [];
function bm(e) {
  var t = S.useRef([]), n = S.useRef([0, 0]), r = S.useRef(), a = S.useState(ym++)[0], o = S.useState(oc)[0], i = S.useRef(e);
  S.useEffect(function() {
    i.current = e;
  }, [e]), S.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(a));
      var m = Ld([e.lockRef.current], (e.shards || []).map(Bi), !0).filter(Boolean);
      return m.forEach(function(p) {
        return p.classList.add("allow-interactivity-".concat(a));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(a)), m.forEach(function(p) {
          return p.classList.remove("allow-interactivity-".concat(a));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var s = S.useCallback(function(m, p) {
    if ("touches" in m && m.touches.length === 2 || m.type === "wheel" && m.ctrlKey)
      return !i.current.allowPinchZoom;
    var b = Jn(m), A = n.current, w = "deltaX" in m ? m.deltaX : A[0] - b[0], P = "deltaY" in m ? m.deltaY : A[1] - b[1], h, H = m.target, j = Math.abs(w) > Math.abs(P) ? "h" : "v";
    if ("touches" in m && j === "h" && H.type === "range")
      return !1;
    var K = Yi(j, H);
    if (!K)
      return !0;
    if (K ? h = j : (h = j === "v" ? "h" : "v", K = Yi(j, H)), !K)
      return !1;
    if (!r.current && "changedTouches" in m && (w || P) && (r.current = h), !h)
      return !0;
    var J = r.current || h;
    return pm(J, p, m, J === "h" ? w : P);
  }, []), c = S.useCallback(function(m) {
    var p = m;
    if (!(!$t.length || $t[$t.length - 1] !== o)) {
      var b = "deltaY" in p ? Gi(p) : Jn(p), A = t.current.filter(function(h) {
        return h.name === p.type && (h.target === p.target || p.target === h.shadowParent) && hm(h.delta, b);
      })[0];
      if (A && A.should) {
        p.cancelable && p.preventDefault();
        return;
      }
      if (!A) {
        var w = (i.current.shards || []).map(Bi).filter(Boolean).filter(function(h) {
          return h.contains(p.target);
        }), P = w.length > 0 ? s(p, w[0]) : !i.current.noIsolation;
        P && p.cancelable && p.preventDefault();
      }
    }
  }, []), l = S.useCallback(function(m, p, b, A) {
    var w = { name: m, delta: p, target: b, should: A, shadowParent: vm(b) };
    t.current.push(w), setTimeout(function() {
      t.current = t.current.filter(function(P) {
        return P !== w;
      });
    }, 1);
  }, []), u = S.useCallback(function(m) {
    n.current = Jn(m), r.current = void 0;
  }, []), f = S.useCallback(function(m) {
    l(m.type, Gi(m), m.target, s(m, e.lockRef.current));
  }, []), d = S.useCallback(function(m) {
    l(m.type, Jn(m), m.target, s(m, e.lockRef.current));
  }, []);
  S.useEffect(function() {
    return $t.push(o), e.setCallbacks({
      onScrollCapture: f,
      onWheelCapture: f,
      onTouchMoveCapture: d
    }), document.addEventListener("wheel", c, Lt), document.addEventListener("touchmove", c, Lt), document.addEventListener("touchstart", u, Lt), function() {
      $t = $t.filter(function(m) {
        return m !== o;
      }), document.removeEventListener("wheel", c, Lt), document.removeEventListener("touchmove", c, Lt), document.removeEventListener("touchstart", u, Lt);
    };
  }, []);
  var y = e.removeScrollBar, v = e.inert;
  return S.createElement(
    S.Fragment,
    null,
    v ? S.createElement(o, { styles: gm(a) }) : null,
    y ? S.createElement(sm, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function vm(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const xm = Hd(ac, bm);
var cc = S.forwardRef(function(e, t) {
  return S.createElement(Rr, Ge({}, e, { ref: t, sideCar: xm }));
});
cc.classNames = Rr.classNames;
var wm = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, Wt = /* @__PURE__ */ new WeakMap(), er = /* @__PURE__ */ new WeakMap(), tr = {}, ua = 0, uc = function(e) {
  return e && (e.host || uc(e.parentNode));
}, Em = function(e, t) {
  return t.map(function(n) {
    if (e.contains(n))
      return n;
    var r = uc(n);
    return r && e.contains(r) ? r : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(n) {
    return !!n;
  });
}, Sm = function(e, t, n, r) {
  var a = Em(t, Array.isArray(e) ? e : [e]);
  tr[n] || (tr[n] = /* @__PURE__ */ new WeakMap());
  var o = tr[n], i = [], s = /* @__PURE__ */ new Set(), c = new Set(a), l = function(f) {
    !f || s.has(f) || (s.add(f), l(f.parentNode));
  };
  a.forEach(l);
  var u = function(f) {
    !f || c.has(f) || Array.prototype.forEach.call(f.children, function(d) {
      if (s.has(d))
        u(d);
      else
        try {
          var y = d.getAttribute(r), v = y !== null && y !== "false", m = (Wt.get(d) || 0) + 1, p = (o.get(d) || 0) + 1;
          Wt.set(d, m), o.set(d, p), i.push(d), m === 1 && v && er.set(d, !0), p === 1 && d.setAttribute(n, "true"), v || d.setAttribute(r, "true");
        } catch (b) {
          console.error("aria-hidden: cannot operate on ", d, b);
        }
    });
  };
  return u(t), s.clear(), ua++, function() {
    i.forEach(function(f) {
      var d = Wt.get(f) - 1, y = o.get(f) - 1;
      Wt.set(f, d), o.set(f, y), d || (er.has(f) || f.removeAttribute(r), er.delete(f)), y || f.removeAttribute(n);
    }), ua--, ua || (Wt = /* @__PURE__ */ new WeakMap(), Wt = /* @__PURE__ */ new WeakMap(), er = /* @__PURE__ */ new WeakMap(), tr = {});
  };
}, Am = function(e, t, n) {
  n === void 0 && (n = "data-aria-hidden");
  var r = Array.from(Array.isArray(e) ? e : [e]), a = wm(e);
  return a ? (r.push.apply(r, Array.from(a.querySelectorAll("[aria-live], script"))), Sm(r, a, n, "aria-hidden")) : function() {
    return null;
  };
}, Mr = "Dialog", [fc, A1] = ad(Mr), [Pm, $e] = fc(Mr), dc = (e) => {
  const {
    __scopeDialog: t,
    children: n,
    open: r,
    defaultOpen: a,
    onOpenChange: o,
    modal: i = !0
  } = e, s = S.useRef(null), c = S.useRef(null), [l, u] = cd({
    prop: r,
    defaultProp: a ?? !1,
    onChange: o,
    caller: Mr
  });
  return /* @__PURE__ */ V(
    Pm,
    {
      scope: t,
      triggerRef: s,
      contentRef: c,
      contentId: ra(),
      titleId: ra(),
      descriptionId: ra(),
      open: l,
      onOpenChange: u,
      onOpenToggle: S.useCallback(() => u((f) => !f), [u]),
      modal: i,
      children: n
    }
  );
};
dc.displayName = Mr;
var mc = "DialogTrigger", km = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = $e(mc, n), o = jt(t, a.triggerRef);
    return /* @__PURE__ */ V(
      Qe.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": a.open,
        "aria-controls": a.contentId,
        "data-state": Uo(a.open),
        ...r,
        ref: o,
        onClick: xt(e.onClick, a.onOpenToggle)
      }
    );
  }
);
km.displayName = mc;
var $o = "DialogPortal", [Om, pc] = fc($o, {
  forceMount: void 0
}), hc = (e) => {
  const { __scopeDialog: t, forceMount: n, children: r, container: a } = e, o = $e($o, t);
  return /* @__PURE__ */ V(Om, { scope: t, forceMount: n, children: S.Children.map(r, (i) => /* @__PURE__ */ V(Nr, { present: n || o.open, children: /* @__PURE__ */ V(tc, { asChild: !0, container: a, children: i }) })) });
};
hc.displayName = $o;
var vr = "DialogOverlay", gc = S.forwardRef(
  (e, t) => {
    const n = pc(vr, e.__scopeDialog), { forceMount: r = n.forceMount, ...a } = e, o = $e(vr, e.__scopeDialog);
    return o.modal ? /* @__PURE__ */ V(Nr, { present: r || o.open, children: /* @__PURE__ */ V(Tm, { ...a, ref: t }) }) : null;
  }
);
gc.displayName = vr;
var Cm = /* @__PURE__ */ Xl("DialogOverlay.RemoveScroll"), Tm = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = $e(vr, n);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ V(cc, { as: Cm, allowPinchZoom: !0, shards: [a.contentRef], children: /* @__PURE__ */ V(
        Qe.div,
        {
          "data-state": Uo(a.open),
          ...r,
          ref: t,
          style: { pointerEvents: "auto", ...r.style }
        }
      ) })
    );
  }
), It = "DialogContent", yc = S.forwardRef(
  (e, t) => {
    const n = pc(It, e.__scopeDialog), { forceMount: r = n.forceMount, ...a } = e, o = $e(It, e.__scopeDialog);
    return /* @__PURE__ */ V(Nr, { present: r || o.open, children: o.modal ? /* @__PURE__ */ V(_m, { ...a, ref: t }) : /* @__PURE__ */ V(Im, { ...a, ref: t }) });
  }
);
yc.displayName = It;
var _m = S.forwardRef(
  (e, t) => {
    const n = $e(It, e.__scopeDialog), r = S.useRef(null), a = jt(t, n.contentRef, r);
    return S.useEffect(() => {
      const o = r.current;
      if (o) return Am(o);
    }, []), /* @__PURE__ */ V(
      bc,
      {
        ...e,
        ref: a,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: xt(e.onCloseAutoFocus, (o) => {
          var i;
          o.preventDefault(), (i = n.triggerRef.current) == null || i.focus();
        }),
        onPointerDownOutside: xt(e.onPointerDownOutside, (o) => {
          const i = o.detail.originalEvent, s = i.button === 0 && i.ctrlKey === !0;
          (i.button === 2 || s) && o.preventDefault();
        }),
        onFocusOutside: xt(
          e.onFocusOutside,
          (o) => o.preventDefault()
        )
      }
    );
  }
), Im = S.forwardRef(
  (e, t) => {
    const n = $e(It, e.__scopeDialog), r = S.useRef(!1), a = S.useRef(!1);
    return /* @__PURE__ */ V(
      bc,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (o) => {
          var i, s;
          (i = e.onCloseAutoFocus) == null || i.call(e, o), o.defaultPrevented || (r.current || (s = n.triggerRef.current) == null || s.focus(), o.preventDefault()), r.current = !1, a.current = !1;
        },
        onInteractOutside: (o) => {
          var c, l;
          (c = e.onInteractOutside) == null || c.call(e, o), o.defaultPrevented || (r.current = !0, o.detail.originalEvent.type === "pointerdown" && (a.current = !0));
          const i = o.target;
          ((l = n.triggerRef.current) == null ? void 0 : l.contains(i)) && o.preventDefault(), o.detail.originalEvent.type === "focusin" && a.current && o.preventDefault();
        }
      }
    );
  }
), bc = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: a, onCloseAutoFocus: o, ...i } = e, s = $e(It, n), c = S.useRef(null), l = jt(t, c);
    return zd(), /* @__PURE__ */ gt(br, { children: [
      /* @__PURE__ */ V(
        Jl,
        {
          asChild: !0,
          loop: !0,
          trapped: r,
          onMountAutoFocus: a,
          onUnmountAutoFocus: o,
          children: /* @__PURE__ */ V(
            Ql,
            {
              role: "dialog",
              id: s.contentId,
              "aria-describedby": s.descriptionId,
              "aria-labelledby": s.titleId,
              "data-state": Uo(s.open),
              ...i,
              ref: l,
              onDismiss: () => s.onOpenChange(!1)
            }
          )
        }
      ),
      /* @__PURE__ */ gt(br, { children: [
        /* @__PURE__ */ V(Rm, { titleId: s.titleId }),
        /* @__PURE__ */ V(Fm, { contentRef: c, descriptionId: s.descriptionId })
      ] })
    ] });
  }
), Wo = "DialogTitle", vc = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = $e(Wo, n);
    return /* @__PURE__ */ V(Qe.h2, { id: a.titleId, ...r, ref: t });
  }
);
vc.displayName = Wo;
var xc = "DialogDescription", wc = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = $e(xc, n);
    return /* @__PURE__ */ V(Qe.p, { id: a.descriptionId, ...r, ref: t });
  }
);
wc.displayName = xc;
var Ec = "DialogClose", Nm = S.forwardRef(
  (e, t) => {
    const { __scopeDialog: n, ...r } = e, a = $e(Ec, n);
    return /* @__PURE__ */ V(
      Qe.button,
      {
        type: "button",
        ...r,
        ref: t,
        onClick: xt(e.onClick, () => a.onOpenChange(!1))
      }
    );
  }
);
Nm.displayName = Ec;
function Uo(e) {
  return e ? "open" : "closed";
}
var Sc = "DialogTitleWarning", [P1, Ac] = rd(Sc, {
  contentName: It,
  titleName: Wo,
  docsSlug: "dialog"
}), Rm = ({ titleId: e }) => {
  const t = Ac(Sc), n = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return S.useEffect(() => {
    e && (document.getElementById(e) || console.error(n));
  }, [n, e]), null;
}, Mm = "DialogDescriptionWarning", Fm = ({ contentRef: e, descriptionId: t }) => {
  const r = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Ac(Mm).contentName}}.`;
  return S.useEffect(() => {
    var o;
    const a = (o = e.current) == null ? void 0 : o.getAttribute("aria-describedby");
    t && a && (document.getElementById(t) || console.warn(r));
  }, [r, e, t]), null;
}, Dm = dc, jm = hc, zm = gc, Lm = yc, qi = vc, $m = wc;
const Vo = "-", Wm = (e) => {
  const t = Vm(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(Vo);
      return s[0] === "" && s.length !== 1 && s.shift(), Pc(s, t) || Um(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const c = n[i] || [];
      return s && r[i] ? [...c, ...r[i]] : c;
    }
  };
}, Pc = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), a = r ? Pc(e.slice(1), r) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const o = e.join(Vo);
  return (i = t.validators.find(({
    validator: s
  }) => s(o))) == null ? void 0 : i.classGroupId;
}, Hi = /^\[(.+)\]$/, Um = (e) => {
  if (Hi.test(e)) {
    const t = Hi.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, Vm = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Gm(Object.entries(e.classGroups), n).forEach(([o, i]) => {
    Ga(i, r, o, t);
  }), r;
}, Ga = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : Xi(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (Ym(a)) {
        Ga(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      Ga(i, Xi(t, o), n, r);
    });
  });
}, Xi = (e, t) => {
  let n = e;
  return t.split(Vo).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, Ym = (e) => e.isThemeGetter, Gm = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [n, a];
}) : e, Bm = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const a = (o, i) => {
    n.set(o, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let i = n.get(o);
      if (i !== void 0)
        return i;
      if ((i = r.get(o)) !== void 0)
        return a(o, i), i;
    },
    set(o, i) {
      n.has(o) ? n.set(o, i) : a(o, i);
    }
  };
}, kc = "!", qm = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let p = 0; p < s.length; p++) {
      let b = s[p];
      if (l === 0) {
        if (b === a && (r || s.slice(p, p + o) === t)) {
          c.push(s.slice(u, p)), u = p + o;
          continue;
        }
        if (b === "/") {
          f = p;
          continue;
        }
      }
      b === "[" ? l++ : b === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), y = d.startsWith(kc), v = y ? d.substring(1) : d, m = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: y,
      baseClassName: v,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, Hm = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, Xm = (e) => ({
  cache: Bm(e.cacheSize),
  parseClassName: qm(e),
  ...Wm(e)
}), Km = /\s+/, Qm = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(Km);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: y
    } = n(l);
    let v = !!y, m = r(v ? d.substring(0, y) : d);
    if (!m) {
      if (!v) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (m = r(d), !m) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      v = !1;
    }
    const p = Hm(u).join(":"), b = f ? p + kc : p, A = b + m;
    if (o.includes(A))
      continue;
    o.push(A);
    const w = a(m, v);
    for (let P = 0; P < w.length; ++P) {
      const h = w[P];
      o.push(b + h);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Zm() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Oc(t)) && (r && (r += " "), r += n);
  return r;
}
const Oc = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Oc(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Jm(e, ...t) {
  let n, r, a, o = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return n = Xm(l), r = n.cache.get, a = n.cache.set, o = s, s(c);
  }
  function s(c) {
    const l = r(c);
    if (l)
      return l;
    const u = Qm(c, n);
    return a(c, u), u;
  }
  return function() {
    return o(Zm.apply(null, arguments));
  };
}
const ye = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Cc = /^\[(?:([a-z-]+):)?(.+)\]$/i, ep = /^\d+\/\d+$/, tp = /* @__PURE__ */ new Set(["px", "full", "screen"]), np = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, rp = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, ap = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, op = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, ip = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Je = (e) => Xt(e) || tp.has(e) || ep.test(e), lt = (e) => an(e, "length", pp), Xt = (e) => !!e && !Number.isNaN(Number(e)), fa = (e) => an(e, "number", Xt), un = (e) => !!e && Number.isInteger(Number(e)), sp = (e) => e.endsWith("%") && Xt(e.slice(0, -1)), ee = (e) => Cc.test(e), ct = (e) => np.test(e), lp = /* @__PURE__ */ new Set(["length", "size", "percentage"]), cp = (e) => an(e, lp, Tc), up = (e) => an(e, "position", Tc), fp = /* @__PURE__ */ new Set(["image", "url"]), dp = (e) => an(e, fp, gp), mp = (e) => an(e, "", hp), fn = () => !0, an = (e, t, n) => {
  const r = Cc.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, pp = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  rp.test(e) && !ap.test(e)
), Tc = () => !1, hp = (e) => op.test(e), gp = (e) => ip.test(e), yp = () => {
  const e = ye("colors"), t = ye("spacing"), n = ye("blur"), r = ye("brightness"), a = ye("borderColor"), o = ye("borderRadius"), i = ye("borderSpacing"), s = ye("borderWidth"), c = ye("contrast"), l = ye("grayscale"), u = ye("hueRotate"), f = ye("invert"), d = ye("gap"), y = ye("gradientColorStops"), v = ye("gradientColorStopPositions"), m = ye("inset"), p = ye("margin"), b = ye("opacity"), A = ye("padding"), w = ye("saturate"), P = ye("scale"), h = ye("sepia"), H = ye("skew"), j = ye("space"), K = ye("translate"), J = () => ["auto", "contain", "none"], oe = () => ["auto", "hidden", "clip", "visible", "scroll"], le = () => ["auto", ee, t], U = () => [ee, t], ge = () => ["", Je, lt], $ = () => ["auto", Xt, ee], k = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], L = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], ie = () => ["", "0", ee], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [Xt, ee];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [fn],
      spacing: [Je, lt],
      blur: ["none", "", ct, ee],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", ct, ee],
      borderSpacing: U(),
      borderWidth: ge(),
      contrast: x(),
      grayscale: ie(),
      hueRotate: x(),
      invert: ie(),
      gap: U(),
      gradientColorStops: [e],
      gradientColorStopPositions: [sp, lt],
      inset: le(),
      margin: le(),
      opacity: x(),
      padding: U(),
      saturate: x(),
      scale: x(),
      sepia: ie(),
      skew: x(),
      space: U(),
      translate: U()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", ee]
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
        columns: [ct]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": g()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": g()
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
        object: [...k(), ee]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: oe()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": oe()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": oe()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: J()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": J()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": J()
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
        z: ["auto", un, ee]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: le()
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
        flex: ["1", "auto", "initial", "none", ee]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: ie()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: ie()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", un, ee]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [fn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", un, ee]
        }, ee]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": $()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": $()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [fn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [un, ee]
        }, ee]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": $()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": $()
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
        "auto-cols": ["auto", "min", "max", "fr", ee]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", ee]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [d]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [d]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [d]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...B()]
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
        content: ["normal", ...B(), "baseline"]
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
        "place-content": [...B(), "baseline"]
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
        p: [A]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [A]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [A]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [A]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [A]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [A]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [A]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [A]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [A]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [p]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [p]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [p]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [p]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [p]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [p]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [p]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [p]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [p]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [j]
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
        "space-y": [j]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", ee, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [ee, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [ee, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [ct]
        }, ct]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [ee, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [ee, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [ee, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [ee, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", ct, lt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", fa]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [fn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", ee]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Xt, fa]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Je, ee]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", ee]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", ee]
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
        decoration: [...L(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Je, lt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Je, ee]
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
        indent: U()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", ee]
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
        content: ["none", ee]
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
        bg: [...k(), up]
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
        bg: ["auto", "cover", "contain", cp]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, dp]
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
        from: [v]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [v]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [v]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [y]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [y]
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
        border: [s]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [s]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [s]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [s]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [s]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [s]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [s]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [s]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [s]
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
        border: [...L(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [s]
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
        "divide-y": [s]
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
        divide: L()
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
        outline: ["", ...L()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Je, ee]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Je, lt]
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
        ring: ge()
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
        "ring-offset": [Je, lt]
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
        shadow: ["", "inner", "none", ct, mp]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [fn]
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
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
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
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", ct, ee]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [u]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [f]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [w]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [h]
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
        "backdrop-contrast": [c]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [u]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [f]
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
        "backdrop-saturate": [w]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [h]
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
        "border-spacing": [i]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [i]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [i]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", ee]
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
        ease: ["linear", "in", "out", "in-out", ee]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", ee]
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
        scale: [P]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [P]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [P]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [un, ee]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [K]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [K]
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
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", ee]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", ee]
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
        "scroll-m": U()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": U()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": U()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": U()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": U()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": U()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": U()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": U()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": U()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": U()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": U()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": U()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": U()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": U()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": U()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": U()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": U()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": U()
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
        "will-change": ["auto", "scroll", "contents", "transform", ee]
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
        stroke: [Je, lt, fa]
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
}, wn = /* @__PURE__ */ Jm(yp);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function bp(e, t, n) {
  return (t = xp(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Ki(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function O(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ki(Object(n), !0).forEach(function(r) {
      bp(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ki(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function vp(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function xp(e) {
  var t = vp(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Qi = () => {
};
let Yo = {}, _c = {}, Ic = null, Nc = {
  mark: Qi,
  measure: Qi
};
try {
  typeof window < "u" && (Yo = window), typeof document < "u" && (_c = document), typeof MutationObserver < "u" && (Ic = MutationObserver), typeof performance < "u" && (Nc = performance);
} catch {
}
const {
  userAgent: Zi = ""
} = Yo.navigator || {}, Et = Yo, ve = _c, Ji = Ic, nr = Nc;
Et.document;
const it = !!ve.documentElement && !!ve.head && typeof ve.addEventListener == "function" && typeof ve.createElement == "function", Rc = ~Zi.indexOf("MSIE") || ~Zi.indexOf("Trident/");
var wp = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Ep = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Mc = {
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
}, Sp = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Fc = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Pe = "classic", Fr = "duotone", Ap = "sharp", Pp = "sharp-duotone", Dc = [Pe, Fr, Ap, Pp], kp = {
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
}, Op = {
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
}, Cp = /* @__PURE__ */ new Map([["classic", {
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
}]]), Tp = {
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
}, _p = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], es = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Ip = ["kit"], Np = {
  kit: {
    "fa-kit": "fak"
  }
}, Rp = ["fak", "fakd"], Mp = {
  kit: {
    fak: "fa-kit"
  }
}, ts = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, rr = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Fp = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Dp = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], jp = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, zp = {
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
}, Lp = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Ba = {
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
}, $p = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], qa = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Fp, ...$p], Wp = ["solid", "regular", "light", "thin", "duotone", "brands"], jc = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Up = jc.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), Vp = [...Object.keys(Lp), ...Wp, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", rr.GROUP, rr.SWAP_OPACITY, rr.PRIMARY, rr.SECONDARY].concat(jc.map((e) => "".concat(e, "x"))).concat(Up.map((e) => "w-".concat(e))), Yp = {
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
const nt = "___FONT_AWESOME___", Ha = 16, zc = "fa", Lc = "svg-inline--fa", Nt = "data-fa-i2svg", Xa = "data-fa-pseudo-element", Gp = "data-fa-pseudo-element-pending", Go = "data-prefix", Bo = "data-icon", ns = "fontawesome-i2svg", Bp = "async", qp = ["HTML", "HEAD", "STYLE", "SCRIPT"], $c = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Gn(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Pe];
    }
  });
}
const Wc = O({}, Mc);
Wc[Pe] = O(O(O(O({}, {
  "fa-duotone": "duotone"
}), Mc[Pe]), es.kit), es["kit-duotone"]);
const Hp = Gn(Wc), Ka = O({}, Tp);
Ka[Pe] = O(O(O(O({}, {
  duotone: "fad"
}), Ka[Pe]), ts.kit), ts["kit-duotone"]);
const rs = Gn(Ka), Qa = O({}, Ba);
Qa[Pe] = O(O({}, Qa[Pe]), Mp.kit);
const qo = Gn(Qa), Za = O({}, zp);
Za[Pe] = O(O({}, Za[Pe]), Np.kit);
Gn(Za);
const Xp = wp, Uc = "fa-layers-text", Kp = Ep, Qp = O({}, kp);
Gn(Qp);
const Zp = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], da = Sp, Jp = [...Ip, ...Vp], En = Et.FontAwesomeConfig || {};
function eh(e) {
  var t = ve.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function th(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
ve && typeof ve.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const a = th(eh(n));
  a != null && (En[r] = a);
});
const Vc = {
  styleDefault: "solid",
  familyDefault: Pe,
  cssPrefix: zc,
  replacementClass: Lc,
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
En.familyPrefix && (En.cssPrefix = En.familyPrefix);
const tn = O(O({}, Vc), En);
tn.autoReplaceSvg || (tn.observeMutations = !1);
const Y = {};
Object.keys(Vc).forEach((e) => {
  Object.defineProperty(Y, e, {
    enumerable: !0,
    set: function(t) {
      tn[e] = t, Sn.forEach((n) => n(Y));
    },
    get: function() {
      return tn[e];
    }
  });
});
Object.defineProperty(Y, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    tn.cssPrefix = e, Sn.forEach((t) => t(Y));
  },
  get: function() {
    return tn.cssPrefix;
  }
});
Et.FontAwesomeConfig = Y;
const Sn = [];
function nh(e) {
  return Sn.push(e), () => {
    Sn.splice(Sn.indexOf(e), 1);
  };
}
const ut = Ha, Be = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function rh(e) {
  if (!e || !it)
    return;
  const t = ve.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = ve.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return ve.head.insertBefore(t, r), e;
}
const ah = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Nn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += ah[Math.random() * 62 | 0];
  return t;
}
function on(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Ho(e) {
  return e.classList ? on(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Yc(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function oh(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Yc(e[n]), '" '), "").trim();
}
function Dr(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Xo(e) {
  return e.size !== Be.size || e.x !== Be.x || e.y !== Be.y || e.rotate !== Be.rotate || e.flipX || e.flipY;
}
function ih(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: c,
    path: l
  };
}
function sh(e) {
  let {
    transform: t,
    width: n = Ha,
    height: r = Ha,
    startCentered: a = !1
  } = e, o = "";
  return a && Rc ? o += "translate(".concat(t.x / ut - n / 2, "em, ").concat(t.y / ut - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / ut, "em), calc(-50% + ").concat(t.y / ut, "em)) ") : o += "translate(".concat(t.x / ut, "em, ").concat(t.y / ut, "em) "), o += "scale(".concat(t.size / ut * (t.flipX ? -1 : 1), ", ").concat(t.size / ut * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var lh = `:root, :host {
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
function Gc() {
  const e = zc, t = Lc, n = Y.cssPrefix, r = Y.replacementClass;
  let a = lh;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let as = !1;
function ma() {
  Y.autoAddCss && !as && (rh(Gc()), as = !0);
}
var ch = {
  mixout() {
    return {
      dom: {
        css: Gc,
        insertCss: ma
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        ma();
      },
      beforeI2svg() {
        ma();
      }
    };
  }
};
const rt = Et || {};
rt[nt] || (rt[nt] = {});
rt[nt].styles || (rt[nt].styles = {});
rt[nt].hooks || (rt[nt].hooks = {});
rt[nt].shims || (rt[nt].shims = []);
var qe = rt[nt];
const Bc = [], qc = function() {
  ve.removeEventListener("DOMContentLoaded", qc), xr = 1, Bc.map((e) => e());
};
let xr = !1;
it && (xr = (ve.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(ve.readyState), xr || ve.addEventListener("DOMContentLoaded", qc));
function uh(e) {
  it && (xr ? setTimeout(e, 0) : Bc.push(e));
}
function Bn(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Yc(e) : "<".concat(t, " ").concat(oh(n), ">").concat(r.map(Bn).join(""), "</").concat(t, ">");
}
function os(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var pa = function(t, n, r, a) {
  var o = Object.keys(t), i = o.length, s = n, c, l, u;
  for (r === void 0 ? (c = 1, u = t[o[0]]) : (c = 0, u = r); c < i; c++)
    l = o[c], u = s(u, t[l], l, t);
  return u;
};
function fh(e) {
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
function Ja(e) {
  const t = fh(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function dh(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function is(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function eo(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = is(t);
  typeof qe.hooks.addPack == "function" && !r ? qe.hooks.addPack(e, is(t)) : qe.styles[e] = O(O({}, qe.styles[e] || {}), a), e === "fas" && eo("fa", t);
}
const {
  styles: Rn,
  shims: mh
} = qe, Hc = Object.keys(qo), ph = Hc.reduce((e, t) => (e[t] = Object.keys(qo[t]), e), {});
let Ko = null, Xc = {}, Kc = {}, Qc = {}, Zc = {}, Jc = {};
function hh(e) {
  return ~Jp.indexOf(e);
}
function gh(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !hh(a) ? a : null;
}
const eu = () => {
  const e = (r) => pa(Rn, (a, o, i) => (a[i] = pa(o, r, {}), a), {});
  Xc = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), Kc = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), Jc = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in Rn || Y.autoFetchSvg, n = pa(mh, (r, a) => {
    const o = a[0];
    let i = a[1];
    const s = a[2];
    return i === "far" && !t && (i = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: i,
      iconName: s
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  Qc = n.names, Zc = n.unicodes, Ko = jr(Y.styleDefault, {
    family: Y.familyDefault
  });
};
nh((e) => {
  Ko = jr(e.styleDefault, {
    family: Y.familyDefault
  });
});
eu();
function Qo(e, t) {
  return (Xc[e] || {})[t];
}
function yh(e, t) {
  return (Kc[e] || {})[t];
}
function Tt(e, t) {
  return (Jc[e] || {})[t];
}
function tu(e) {
  return Qc[e] || {
    prefix: null,
    iconName: null
  };
}
function bh(e) {
  const t = Zc[e], n = Qo("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function St() {
  return Ko;
}
const nu = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function vh(e) {
  let t = Pe;
  const n = Hc.reduce((r, a) => (r[a] = "".concat(Y.cssPrefix, "-").concat(a), r), {});
  return Dc.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => ph[r].includes(a))) && (t = r);
  }), t;
}
function jr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Pe
  } = t, r = Hp[n][e];
  if (n === Fr && !e)
    return "fad";
  const a = rs[n][e] || rs[n][r], o = e in qe.styles ? e : null;
  return a || o || null;
}
function xh(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = gh(Y.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function ss(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function zr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = qa.concat(Dp), o = ss(e.filter((f) => a.includes(f))), i = ss(e.filter((f) => !qa.includes(f))), s = o.filter((f) => (r = f, !Fc.includes(f))), [c = null] = s, l = vh(o), u = O(O({}, xh(i)), {}, {
    prefix: jr(c, {
      family: l
    })
  });
  return O(O(O({}, u), Ah({
    values: e,
    family: l,
    styles: Rn,
    config: Y,
    canonical: u,
    givenPrefix: r
  })), wh(n, r, u));
}
function wh(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? tu(a) : {}, i = Tt(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !Rn.far && Rn.fas && !Y.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const Eh = Dc.filter((e) => e !== Pe || e !== Fr), Sh = Object.keys(Ba).filter((e) => e !== Pe).map((e) => Object.keys(Ba[e])).flat();
function Ah(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === Fr, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (c || l || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Eh.includes(n) && (Object.keys(o).find((d) => Sh.includes(d)) || i.autoFetchSvg)) {
    const d = Cp.get(n).defaultShortPrefixId;
    r.prefix = d, r.iconName = Tt(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = St() || "fas"), r;
}
class Ph {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = O(O({}, this.definitions[o] || {}), a[o]), eo(o, a[o]);
      const i = qo[Pe][o];
      i && eo(i, a[o]), eu();
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
        iconName: i,
        icon: s
      } = r[a], c = s[2];
      t[o] || (t[o] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[o][l] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let ls = [], Vt = {};
const Kt = {}, kh = Object.keys(Kt);
function Oh(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return ls = e, Vt = {}, Object.keys(Kt).forEach((r) => {
    kh.indexOf(r) === -1 && delete Kt[r];
  }), ls.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        Vt[i] || (Vt[i] = []), Vt[i].push(o[i]);
      });
    }
    r.provides && r.provides(Kt);
  }), n;
}
function to(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Vt[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function Rt(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Vt[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function At() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Kt[e] ? Kt[e].apply(null, t) : void 0;
}
function no(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || St();
  if (t)
    return t = Tt(n, t) || t, os(ru.definitions, n, t) || os(qe.styles, n, t);
}
const ru = new Ph(), Ch = () => {
  Y.autoReplaceSvg = !1, Y.observeMutations = !1, Rt("noAuto");
}, Th = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return it ? (Rt("beforeI2svg", e), At("pseudoElements2svg", e), At("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    Y.autoReplaceSvg === !1 && (Y.autoReplaceSvg = !0), Y.observeMutations = !0, uh(() => {
      Ih({
        autoReplaceSvgRoot: t
      }), Rt("watch", e);
    });
  }
}, _h = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Tt(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = jr(e[0]);
      return {
        prefix: n,
        iconName: Tt(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(Y.cssPrefix, "-")) > -1 || e.match(Xp))) {
      const t = zr(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || St(),
        iconName: Tt(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = St();
      return {
        prefix: t,
        iconName: Tt(t, e) || e
      };
    }
  }
}, Re = {
  noAuto: Ch,
  config: Y,
  dom: Th,
  parse: _h,
  library: ru,
  findIconDefinition: no,
  toHtml: Bn
}, Ih = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = ve
  } = e;
  (Object.keys(qe.styles).length > 0 || Y.autoFetchSvg) && it && Y.autoReplaceSvg && Re.dom.i2svg({
    node: t
  });
};
function Lr(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Bn(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!it) return;
      const n = ve.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function Nh(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (Xo(i) && n.found && !r.found) {
    const {
      width: s,
      height: c
    } = n, l = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = Dr(O(O({}, o), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function Rh(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(Y.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: O(O({}, a), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Zo(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: y
  } = n.found ? n : t, v = Rp.includes(r), m = [Y.replacementClass, a ? "".concat(Y.cssPrefix, "-").concat(a) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let p = {
    children: [],
    attributes: O(O({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: m,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(y)
    })
  };
  const b = v && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / y * 16 * 0.0625, "em")
  } : {};
  f && (p.attributes[Nt] = ""), s && (p.children.push({
    tag: "title",
    attributes: {
      id: p.attributes["aria-labelledby"] || "title-".concat(l || Nn())
    },
    children: [s]
  }), delete p.attributes.title);
  const A = O(O({}, p), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: c,
    transform: o,
    symbol: i,
    styles: O(O({}, b), u.styles)
  }), {
    children: w,
    attributes: P
  } = n.found && t.found ? At("generateAbstractMask", A) || {
    children: [],
    attributes: {}
  } : At("generateAbstractIcon", A) || {
    children: [],
    attributes: {}
  };
  return A.children = w, A.attributes = P, i ? Rh(A) : Nh(A);
}
function cs(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = O(O(O({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[Nt] = "");
  const l = O({}, i.styles);
  Xo(a) && (l.transform = sh({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), l["-webkit-transform"] = l.transform);
  const u = Dr(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), f;
}
function Mh(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = O(O(O({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = Dr(r.styles);
  o.length > 0 && (a.style = o);
  const i = [];
  return i.push({
    tag: "span",
    attributes: a,
    children: [t]
  }), n && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), i;
}
const {
  styles: ha
} = qe;
function ro(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(Y.cssPrefix, "-").concat(da.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(Y.cssPrefix, "-").concat(da.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(Y.cssPrefix, "-").concat(da.PRIMARY),
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
const Fh = {
  found: !1,
  width: 512,
  height: 512
};
function Dh(e, t) {
  !$c && !Y.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function ao(e, t) {
  let n = t;
  return t === "fa" && Y.styleDefault !== null && (t = St()), new Promise((r, a) => {
    if (n === "fa") {
      const o = tu(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && ha[t] && ha[t][e]) {
      const o = ha[t][e];
      return r(ro(o));
    }
    Dh(e, t), r(O(O({}, Fh), {}, {
      icon: Y.showMissingIcons && e ? At("missingIconAbstract") || {} : {}
    }));
  });
}
const us = () => {
}, oo = Y.measurePerformance && nr && nr.mark && nr.measure ? nr : {
  mark: us,
  measure: us
}, bn = 'FA "6.7.2"', jh = (e) => (oo.mark("".concat(bn, " ").concat(e, " begins")), () => au(e)), au = (e) => {
  oo.mark("".concat(bn, " ").concat(e, " ends")), oo.measure("".concat(bn, " ").concat(e), "".concat(bn, " ").concat(e, " begins"), "".concat(bn, " ").concat(e, " ends"));
};
var Jo = {
  begin: jh,
  end: au
};
const dr = () => {
};
function fs(e) {
  return typeof (e.getAttribute ? e.getAttribute(Nt) : null) == "string";
}
function zh(e) {
  const t = e.getAttribute ? e.getAttribute(Go) : null, n = e.getAttribute ? e.getAttribute(Bo) : null;
  return t && n;
}
function Lh(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(Y.replacementClass);
}
function $h() {
  return Y.autoReplaceSvg === !0 ? mr.replace : mr[Y.autoReplaceSvg] || mr.replace;
}
function Wh(e) {
  return ve.createElementNS("http://www.w3.org/2000/svg", e);
}
function Uh(e) {
  return ve.createElement(e);
}
function ou(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? Wh : Uh
  } = t;
  if (typeof e == "string")
    return ve.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(ou(o, {
      ceFn: n
    }));
  }), r;
}
function Vh(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const mr = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(ou(n), t);
      }), t.getAttribute(Nt) === null && Y.keepOriginalSource) {
        let n = ve.createComment(Vh(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Ho(t).indexOf(Y.replacementClass))
      return mr.replace(e);
    const r = new RegExp("".concat(Y.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === Y.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => Bn(o)).join(`
`);
    t.setAttribute(Nt, ""), t.innerHTML = a;
  }
};
function ds(e) {
  e();
}
function iu(e, t) {
  const n = typeof t == "function" ? t : dr;
  if (e.length === 0)
    n();
  else {
    let r = ds;
    Y.mutateApproach === Bp && (r = Et.requestAnimationFrame || ds), r(() => {
      const a = $h(), o = Jo.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let ei = !1;
function su() {
  ei = !0;
}
function io() {
  ei = !1;
}
let wr = null;
function ms(e) {
  if (!Ji || !Y.observeMutations)
    return;
  const {
    treeCallback: t = dr,
    nodeCallback: n = dr,
    pseudoElementsCallback: r = dr,
    observeMutationsRoot: a = ve
  } = e;
  wr = new Ji((o) => {
    if (ei) return;
    const i = St();
    on(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !fs(s.addedNodes[0]) && (Y.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && Y.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && fs(s.target) && ~Zp.indexOf(s.attributeName))
        if (s.attributeName === "class" && zh(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = zr(Ho(s.target));
          s.target.setAttribute(Go, c || i), l && s.target.setAttribute(Bo, l);
        } else Lh(s.target) && n(s.target);
    });
  }), it && wr.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Yh() {
  wr && wr.disconnect();
}
function Gh(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function Bh(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = zr(Ho(e));
  return a.prefix || (a.prefix = St()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = yh(a.prefix, e.innerText) || Qo(a.prefix, Ja(e.innerText))), !a.iconName && Y.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function qh(e) {
  const t = on(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return Y.autoA11y && (n ? t["aria-labelledby"] = "".concat(Y.replacementClass, "-title-").concat(r || Nn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Hh() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Be,
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
function ps(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = Bh(e), o = qh(e), i = to("parseNodeAttributes", {}, e);
  let s = t.styleParser ? Gh(e) : [];
  return O({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Be,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: s,
      attributes: o
    }
  }, i);
}
const {
  styles: Xh
} = qe;
function lu(e) {
  const t = Y.autoReplaceSvg === "nest" ? ps(e, {
    styleParser: !1
  }) : ps(e);
  return ~t.extra.classes.indexOf(Uc) ? At("generateLayersText", e, t) : At("generateSvgReplacementMutation", e, t);
}
function Kh() {
  return [..._p, ...qa];
}
function hs(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!it) return Promise.resolve();
  const n = ve.documentElement.classList, r = (u) => n.add("".concat(ns, "-").concat(u)), a = (u) => n.remove("".concat(ns, "-").concat(u)), o = Y.autoFetchSvg ? Kh() : Fc.concat(Object.keys(Xh));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(Uc, ":not([").concat(Nt, "])")].concat(o.map((u) => ".".concat(u, ":not([").concat(Nt, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = on(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const c = Jo.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = lu(f);
      d && u.push(d);
    } catch (d) {
      $c || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      iu(d, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function Qh(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  lu(e).then((n) => {
    n && iu([n], t);
  });
}
function Zh(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : no(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : no(a || {})), e(r, O(O({}, n), {}, {
      mask: a
    }));
  };
}
const Jh = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Be,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: y
  } = e;
  return Lr(O({
    type: "icon"
  }, e), () => (Rt("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), Y.autoA11y && (i ? l["aria-labelledby"] = "".concat(Y.replacementClass, "-title-").concat(s || Nn()) : (l["aria-hidden"] = "true", l.focusable = "false")), Zo({
    icons: {
      main: ro(y),
      mask: a ? ro(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: O(O({}, Be), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var eg = {
  mixout() {
    return {
      icon: Zh(Jh)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = hs, e.nodeCallback = Qh, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = ve,
        callback: r = () => {
        }
      } = t;
      return hs(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = n;
      return new Promise((d, y) => {
        Promise.all([ao(r, i), l.iconName ? ao(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((v) => {
          let [m, p] = v;
          d([t, Zo({
            icons: {
              main: m,
              mask: p
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: c,
            maskId: u,
            title: a,
            titleId: o,
            extra: f,
            watchable: !0
          })]);
        }).catch(y);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = Dr(i);
      s.length > 0 && (r.style = s);
      let c;
      return Xo(o) && (c = At("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(c || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, tg = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Lr({
          type: "layer"
        }, () => {
          Rt("beforeDOMElementCreation", {
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
              class: ["".concat(Y.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, ng = {
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
        return Lr({
          type: "counter",
          content: e
        }, () => (Rt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Mh({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(Y.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, rg = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Be,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return Lr({
          type: "text",
          content: e
        }, () => (Rt("beforeDOMElementCreation", {
          content: e,
          params: t
        }), cs({
          content: e,
          transform: O(O({}, Be), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(Y.cssPrefix, "-layers-text"), ...a]
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
      let i = null, s = null;
      if (Rc) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return Y.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, cs({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const ag = new RegExp('"', "ug"), gs = [1105920, 1112319], ys = O(O(O(O({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Op), Yp), jp), so = Object.keys(ys).reduce((e, t) => (e[t.toLowerCase()] = ys[t], e), {}), og = Object.keys(so).reduce((e, t) => {
  const n = so[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function ig(e) {
  const t = e.replace(ag, ""), n = dh(t, 0), r = n >= gs[0] && n <= gs[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Ja(a ? t[0] : t),
    isSecondary: r || a
  };
}
function sg(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (so[n] || {})[a] || og[n];
}
function bs(e, t) {
  const n = "".concat(Gp).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = on(e.children).filter((d) => d.getAttribute(Xa) === t)[0], s = Et.getComputedStyle(e, t), c = s.getPropertyValue("font-family"), l = c.match(Kp), u = s.getPropertyValue("font-weight"), f = s.getPropertyValue("content");
    if (i && !l)
      return e.removeChild(i), r();
    if (l && f !== "none" && f !== "") {
      const d = s.getPropertyValue("content");
      let y = sg(c, u);
      const {
        value: v,
        isSecondary: m
      } = ig(d), p = l[0].startsWith("FontAwesome");
      let b = Qo(y, v), A = b;
      if (p) {
        const w = bh(v);
        w.iconName && w.prefix && (b = w.iconName, y = w.prefix);
      }
      if (b && !m && (!i || i.getAttribute(Go) !== y || i.getAttribute(Bo) !== A)) {
        e.setAttribute(n, A), i && e.removeChild(i);
        const w = Hh(), {
          extra: P
        } = w;
        P.attributes[Xa] = t, ao(b, y).then((h) => {
          const H = Zo(O(O({}, w), {}, {
            icons: {
              main: h,
              mask: nu()
            },
            prefix: y,
            iconName: A,
            extra: P,
            watchable: !0
          })), j = ve.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(j, e.firstChild) : e.appendChild(j), j.outerHTML = H.map((K) => Bn(K)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function lg(e) {
  return Promise.all([bs(e, "::before"), bs(e, "::after")]);
}
function cg(e) {
  return e.parentNode !== document.head && !~qp.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Xa) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function vs(e) {
  if (it)
    return new Promise((t, n) => {
      const r = on(e.querySelectorAll("*")).filter(cg).map(lg), a = Jo.begin("searchPseudoElements");
      su(), Promise.all(r).then(() => {
        a(), io(), t();
      }).catch(() => {
        a(), io(), n();
      });
    });
}
var ug = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = vs, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = ve
      } = t;
      Y.searchPseudoElements && vs(n);
    };
  }
};
let xs = !1;
var fg = {
  mixout() {
    return {
      dom: {
        unwatch() {
          su(), xs = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        ms(to("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Yh();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        xs ? io() : ms(to("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const ws = (e) => {
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
    let i = a.slice(1).join("-");
    if (o && i === "h")
      return n.flipX = !0, n;
    if (o && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (o) {
      case "grow":
        n.size = n.size + i;
        break;
      case "shrink":
        n.size = n.size - i;
        break;
      case "left":
        n.x = n.x - i;
        break;
      case "right":
        n.x = n.x + i;
        break;
      case "up":
        n.y = n.y - i;
        break;
      case "down":
        n.y = n.y + i;
        break;
      case "rotate":
        n.rotate = n.rotate + i;
        break;
    }
    return n;
  }, t);
};
var dg = {
  mixout() {
    return {
      parse: {
        transform: (e) => ws(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = ws(n)), e;
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
      const i = {
        transform: "translate(".concat(a / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), c = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), l = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, f = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: O({}, d.outer),
        children: [{
          tag: "g",
          attributes: O({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: O(O({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const ga = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Es(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function mg(e) {
  return e.tag === "g" ? e.children : [e];
}
var pg = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? zr(n.split(" ").map((a) => a.trim())) : nu();
        return r.prefix || (r.prefix = St()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = a, {
        width: u,
        icon: f
      } = o, d = ih({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), y = {
        tag: "rect",
        attributes: O(O({}, ga), {}, {
          fill: "white"
        })
      }, v = l.children ? {
        children: l.children.map(Es)
      } : {}, m = {
        tag: "g",
        attributes: O({}, d.inner),
        children: [Es(O({
          tag: l.tag,
          attributes: O(O({}, l.attributes), d.path)
        }, v))]
      }, p = {
        tag: "g",
        attributes: O({}, d.outer),
        children: [m]
      }, b = "mask-".concat(i || Nn()), A = "clip-".concat(i || Nn()), w = {
        tag: "mask",
        attributes: O(O({}, ga), {}, {
          id: b,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [y, p]
      }, P = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: A
          },
          children: mg(f)
        }, w]
      };
      return n.push(P, {
        tag: "rect",
        attributes: O({
          fill: "currentColor",
          "clip-path": "url(#".concat(A, ")"),
          mask: "url(#".concat(b, ")")
        }, ga)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, hg = {
  provides(e) {
    let t = !1;
    Et.matchMedia && (t = Et.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: O(O({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = O(O({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: O(O({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: O(O({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: O(O({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: O(O({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: O(O({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: O(O({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: O(O({}, o), {}, {
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
}, gg = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, yg = [ch, eg, tg, ng, rg, ug, fg, dg, pg, hg, gg];
Oh(yg, {
  mixoutsTo: Re
});
Re.noAuto;
Re.config;
Re.library;
Re.dom;
const lo = Re.parse;
Re.findIconDefinition;
Re.toHtml;
const bg = Re.icon;
Re.layer;
Re.text;
Re.counter;
function vg(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ar = { exports: {} }, or = { exports: {} }, fe = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ss;
function xg() {
  if (Ss) return fe;
  Ss = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, y = e ? Symbol.for("react.memo") : 60115, v = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, p = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, A = e ? Symbol.for("react.scope") : 60119;
  function w(h) {
    if (typeof h == "object" && h !== null) {
      var H = h.$$typeof;
      switch (H) {
        case t:
          switch (h = h.type, h) {
            case c:
            case l:
            case r:
            case o:
            case a:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case v:
                case y:
                case i:
                  return h;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function P(h) {
    return w(h) === l;
  }
  return fe.AsyncMode = c, fe.ConcurrentMode = l, fe.ContextConsumer = s, fe.ContextProvider = i, fe.Element = t, fe.ForwardRef = u, fe.Fragment = r, fe.Lazy = v, fe.Memo = y, fe.Portal = n, fe.Profiler = o, fe.StrictMode = a, fe.Suspense = f, fe.isAsyncMode = function(h) {
    return P(h) || w(h) === c;
  }, fe.isConcurrentMode = P, fe.isContextConsumer = function(h) {
    return w(h) === s;
  }, fe.isContextProvider = function(h) {
    return w(h) === i;
  }, fe.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, fe.isForwardRef = function(h) {
    return w(h) === u;
  }, fe.isFragment = function(h) {
    return w(h) === r;
  }, fe.isLazy = function(h) {
    return w(h) === v;
  }, fe.isMemo = function(h) {
    return w(h) === y;
  }, fe.isPortal = function(h) {
    return w(h) === n;
  }, fe.isProfiler = function(h) {
    return w(h) === o;
  }, fe.isStrictMode = function(h) {
    return w(h) === a;
  }, fe.isSuspense = function(h) {
    return w(h) === f;
  }, fe.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === l || h === o || h === a || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === v || h.$$typeof === y || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === p || h.$$typeof === b || h.$$typeof === A || h.$$typeof === m);
  }, fe.typeOf = w, fe;
}
var de = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var As;
function wg() {
  return As || (As = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, y = e ? Symbol.for("react.memo") : 60115, v = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, p = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, A = e ? Symbol.for("react.scope") : 60119;
    function w(E) {
      return typeof E == "string" || typeof E == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      E === r || E === l || E === o || E === a || E === f || E === d || typeof E == "object" && E !== null && (E.$$typeof === v || E.$$typeof === y || E.$$typeof === i || E.$$typeof === s || E.$$typeof === u || E.$$typeof === p || E.$$typeof === b || E.$$typeof === A || E.$$typeof === m);
    }
    function P(E) {
      if (typeof E == "object" && E !== null) {
        var we = E.$$typeof;
        switch (we) {
          case t:
            var Se = E.type;
            switch (Se) {
              case c:
              case l:
              case r:
              case o:
              case a:
              case f:
                return Se;
              default:
                var Ze = Se && Se.$$typeof;
                switch (Ze) {
                  case s:
                  case u:
                  case v:
                  case y:
                  case i:
                    return Ze;
                  default:
                    return we;
                }
            }
          case n:
            return we;
        }
      }
    }
    var h = c, H = l, j = s, K = i, J = t, oe = u, le = r, U = v, ge = y, $ = n, k = o, L = a, Q = f, B = !1;
    function ie(E) {
      return B || (B = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(E) || P(E) === c;
    }
    function g(E) {
      return P(E) === l;
    }
    function x(E) {
      return P(E) === s;
    }
    function _(E) {
      return P(E) === i;
    }
    function D(E) {
      return typeof E == "object" && E !== null && E.$$typeof === t;
    }
    function I(E) {
      return P(E) === u;
    }
    function F(E) {
      return P(E) === r;
    }
    function R(E) {
      return P(E) === v;
    }
    function N(E) {
      return P(E) === y;
    }
    function z(E) {
      return P(E) === n;
    }
    function M(E) {
      return P(E) === o;
    }
    function W(E) {
      return P(E) === a;
    }
    function ce(E) {
      return P(E) === f;
    }
    de.AsyncMode = h, de.ConcurrentMode = H, de.ContextConsumer = j, de.ContextProvider = K, de.Element = J, de.ForwardRef = oe, de.Fragment = le, de.Lazy = U, de.Memo = ge, de.Portal = $, de.Profiler = k, de.StrictMode = L, de.Suspense = Q, de.isAsyncMode = ie, de.isConcurrentMode = g, de.isContextConsumer = x, de.isContextProvider = _, de.isElement = D, de.isForwardRef = I, de.isFragment = F, de.isLazy = R, de.isMemo = N, de.isPortal = z, de.isProfiler = M, de.isStrictMode = W, de.isSuspense = ce, de.isValidElementType = w, de.typeOf = P;
  }()), de;
}
var Ps;
function cu() {
  return Ps || (Ps = 1, process.env.NODE_ENV === "production" ? or.exports = xg() : or.exports = wg()), or.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var ya, ks;
function Eg() {
  if (ks) return ya;
  ks = 1;
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
      for (var i = {}, s = 0; s < 10; s++)
        i["_" + String.fromCharCode(s)] = s;
      var c = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        l[u] = u;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return ya = a() ? Object.assign : function(o, i) {
    for (var s, c = r(o), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          n.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, ya;
}
var ba, Os;
function ti() {
  if (Os) return ba;
  Os = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ba = e, ba;
}
var va, Cs;
function uu() {
  return Cs || (Cs = 1, va = Function.call.bind(Object.prototype.hasOwnProperty)), va;
}
var xa, Ts;
function Sg() {
  if (Ts) return xa;
  Ts = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ ti(), n = {}, r = /* @__PURE__ */ uu();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in o)
        if (r(o, u)) {
          var f;
          try {
            if (typeof o[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = o[u](i, u, c, s, null, t);
          } catch (v) {
            f = v;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in n)) {
            n[f.message] = !0;
            var y = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (y ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, xa = a, xa;
}
var wa, _s;
function Ag() {
  if (_s) return wa;
  _s = 1;
  var e = cu(), t = Eg(), n = /* @__PURE__ */ ti(), r = /* @__PURE__ */ uu(), a = /* @__PURE__ */ Sg(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(s) {
    var c = "Warning: " + s;
    typeof console < "u" && console.error(c);
    try {
      throw new Error(c);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return wa = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(g) {
      var x = g && (l && g[l] || g[u]);
      if (typeof x == "function")
        return x;
    }
    var d = "<<anonymous>>", y = {
      array: b("array"),
      bigint: b("bigint"),
      bool: b("boolean"),
      func: b("function"),
      number: b("number"),
      object: b("object"),
      string: b("string"),
      symbol: b("symbol"),
      any: A(),
      arrayOf: w,
      element: P(),
      elementType: h(),
      instanceOf: H,
      node: oe(),
      objectOf: K,
      oneOf: j,
      oneOfType: J,
      shape: U,
      exact: ge
    };
    function v(g, x) {
      return g === x ? g !== 0 || 1 / g === 1 / x : g !== g && x !== x;
    }
    function m(g, x) {
      this.message = g, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function p(g) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, _ = 0;
      function D(F, R, N, z, M, W, ce) {
        if (z = z || d, W = W || N, ce !== n) {
          if (c) {
            var E = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw E.name = "Invariant Violation", E;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var we = z + ":" + N;
            !x[we] && // Avoid spamming the console because they are often not actionable except for lib authors
            _ < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + W + "` prop on `" + z + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[we] = !0, _++);
          }
        }
        return R[N] == null ? F ? R[N] === null ? new m("The " + M + " `" + W + "` is marked as required " + ("in `" + z + "`, but its value is `null`.")) : new m("The " + M + " `" + W + "` is marked as required in " + ("`" + z + "`, but its value is `undefined`.")) : null : g(R, N, z, M, W);
      }
      var I = D.bind(null, !1);
      return I.isRequired = D.bind(null, !0), I;
    }
    function b(g) {
      function x(_, D, I, F, R, N) {
        var z = _[D], M = L(z);
        if (M !== g) {
          var W = Q(z);
          return new m(
            "Invalid " + F + " `" + R + "` of type " + ("`" + W + "` supplied to `" + I + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return p(x);
    }
    function A() {
      return p(i);
    }
    function w(g) {
      function x(_, D, I, F, R) {
        if (typeof g != "function")
          return new m("Property `" + R + "` of component `" + I + "` has invalid PropType notation inside arrayOf.");
        var N = _[D];
        if (!Array.isArray(N)) {
          var z = L(N);
          return new m("Invalid " + F + " `" + R + "` of type " + ("`" + z + "` supplied to `" + I + "`, expected an array."));
        }
        for (var M = 0; M < N.length; M++) {
          var W = g(N, M, I, F, R + "[" + M + "]", n);
          if (W instanceof Error)
            return W;
        }
        return null;
      }
      return p(x);
    }
    function P() {
      function g(x, _, D, I, F) {
        var R = x[_];
        if (!s(R)) {
          var N = L(R);
          return new m("Invalid " + I + " `" + F + "` of type " + ("`" + N + "` supplied to `" + D + "`, expected a single ReactElement."));
        }
        return null;
      }
      return p(g);
    }
    function h() {
      function g(x, _, D, I, F) {
        var R = x[_];
        if (!e.isValidElementType(R)) {
          var N = L(R);
          return new m("Invalid " + I + " `" + F + "` of type " + ("`" + N + "` supplied to `" + D + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return p(g);
    }
    function H(g) {
      function x(_, D, I, F, R) {
        if (!(_[D] instanceof g)) {
          var N = g.name || d, z = ie(_[D]);
          return new m("Invalid " + F + " `" + R + "` of type " + ("`" + z + "` supplied to `" + I + "`, expected ") + ("instance of `" + N + "`."));
        }
        return null;
      }
      return p(x);
    }
    function j(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function x(_, D, I, F, R) {
        for (var N = _[D], z = 0; z < g.length; z++)
          if (v(N, g[z]))
            return null;
        var M = JSON.stringify(g, function(ce, E) {
          var we = Q(E);
          return we === "symbol" ? String(E) : E;
        });
        return new m("Invalid " + F + " `" + R + "` of value `" + String(N) + "` " + ("supplied to `" + I + "`, expected one of " + M + "."));
      }
      return p(x);
    }
    function K(g) {
      function x(_, D, I, F, R) {
        if (typeof g != "function")
          return new m("Property `" + R + "` of component `" + I + "` has invalid PropType notation inside objectOf.");
        var N = _[D], z = L(N);
        if (z !== "object")
          return new m("Invalid " + F + " `" + R + "` of type " + ("`" + z + "` supplied to `" + I + "`, expected an object."));
        for (var M in N)
          if (r(N, M)) {
            var W = g(N, M, I, F, R + "." + M, n);
            if (W instanceof Error)
              return W;
          }
        return null;
      }
      return p(x);
    }
    function J(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var x = 0; x < g.length; x++) {
        var _ = g[x];
        if (typeof _ != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + B(_) + " at index " + x + "."
          ), i;
      }
      function D(I, F, R, N, z) {
        for (var M = [], W = 0; W < g.length; W++) {
          var ce = g[W], E = ce(I, F, R, N, z, n);
          if (E == null)
            return null;
          E.data && r(E.data, "expectedType") && M.push(E.data.expectedType);
        }
        var we = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new m("Invalid " + N + " `" + z + "` supplied to " + ("`" + R + "`" + we + "."));
      }
      return p(D);
    }
    function oe() {
      function g(x, _, D, I, F) {
        return $(x[_]) ? null : new m("Invalid " + I + " `" + F + "` supplied to " + ("`" + D + "`, expected a ReactNode."));
      }
      return p(g);
    }
    function le(g, x, _, D, I) {
      return new m(
        (g || "React class") + ": " + x + " type `" + _ + "." + D + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + I + "`."
      );
    }
    function U(g) {
      function x(_, D, I, F, R) {
        var N = _[D], z = L(N);
        if (z !== "object")
          return new m("Invalid " + F + " `" + R + "` of type `" + z + "` " + ("supplied to `" + I + "`, expected `object`."));
        for (var M in g) {
          var W = g[M];
          if (typeof W != "function")
            return le(I, F, R, M, Q(W));
          var ce = W(N, M, I, F, R + "." + M, n);
          if (ce)
            return ce;
        }
        return null;
      }
      return p(x);
    }
    function ge(g) {
      function x(_, D, I, F, R) {
        var N = _[D], z = L(N);
        if (z !== "object")
          return new m("Invalid " + F + " `" + R + "` of type `" + z + "` " + ("supplied to `" + I + "`, expected `object`."));
        var M = t({}, _[D], g);
        for (var W in M) {
          var ce = g[W];
          if (r(g, W) && typeof ce != "function")
            return le(I, F, R, W, Q(ce));
          if (!ce)
            return new m(
              "Invalid " + F + " `" + R + "` key `" + W + "` supplied to `" + I + "`.\nBad object: " + JSON.stringify(_[D], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var E = ce(N, W, I, F, R + "." + W, n);
          if (E)
            return E;
        }
        return null;
      }
      return p(x);
    }
    function $(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every($);
          if (g === null || s(g))
            return !0;
          var x = f(g);
          if (x) {
            var _ = x.call(g), D;
            if (x !== g.entries) {
              for (; !(D = _.next()).done; )
                if (!$(D.value))
                  return !1;
            } else
              for (; !(D = _.next()).done; ) {
                var I = D.value;
                if (I && !$(I[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function k(g, x) {
      return g === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function L(g) {
      var x = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : k(x, g) ? "symbol" : x;
    }
    function Q(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var x = L(g);
      if (x === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function B(g) {
      var x = Q(g);
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
    function ie(g) {
      return !g.constructor || !g.constructor.name ? d : g.constructor.name;
    }
    return y.checkPropTypes = a, y.resetWarningCache = a.resetWarningCache, y.PropTypes = y, y;
  }, wa;
}
var Ea, Is;
function Pg() {
  if (Is) return Ea;
  Is = 1;
  var e = /* @__PURE__ */ ti();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Ea = function() {
    function r(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
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
  }, Ea;
}
var Ns;
function kg() {
  if (Ns) return ar.exports;
  if (Ns = 1, process.env.NODE_ENV !== "production") {
    var e = cu(), t = !0;
    ar.exports = /* @__PURE__ */ Ag()(e.isElement, t);
  } else
    ar.exports = /* @__PURE__ */ Pg()();
  return ar.exports;
}
var Og = /* @__PURE__ */ kg();
const re = /* @__PURE__ */ vg(Og);
function Rs(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Ve(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Rs(Object(n), !0).forEach(function(r) {
      Yt(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Rs(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Er(e) {
  "@babel/helpers - typeof";
  return Er = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Er(e);
}
function Yt(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Cg(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function Tg(e, t) {
  if (e == null) return {};
  var n = Cg(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function co(e) {
  return _g(e) || Ig(e) || Ng(e) || Rg();
}
function _g(e) {
  if (Array.isArray(e)) return uo(e);
}
function Ig(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Ng(e, t) {
  if (e) {
    if (typeof e == "string") return uo(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return uo(e, t);
  }
}
function uo(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Rg() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Mg(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, y = e.inverse, v = e.border, m = e.listItem, p = e.flip, b = e.size, A = e.rotation, w = e.pull, P = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": y,
    "fa-border": v,
    "fa-li": m,
    "fa-flip": p === !0,
    "fa-flip-horizontal": p === "horizontal" || p === "both",
    "fa-flip-vertical": p === "vertical" || p === "both"
  }, Yt(t, "fa-".concat(b), typeof b < "u" && b !== null), Yt(t, "fa-rotate-".concat(A), typeof A < "u" && A !== null && A !== 0), Yt(t, "fa-pull-".concat(w), typeof w < "u" && w !== null), Yt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(P).map(function(h) {
    return P[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function Fg(e) {
  return e = e - 0, e === e;
}
function fu(e) {
  return Fg(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Dg = ["style"];
function jg(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function zg(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = fu(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[jg(a)] = o : t[a] = o, t;
  }, {});
}
function du(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(c) {
    return du(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = zg(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[fu(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = Tg(n, Dg);
  return a.attrs.style = Ve(Ve({}, a.attrs.style), i), e.apply(void 0, [t.tag, Ve(Ve({}, a.attrs), s)].concat(co(r)));
}
var mu = !1;
try {
  mu = process.env.NODE_ENV === "production";
} catch {
}
function Lg() {
  if (!mu && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Ms(e) {
  if (e && Er(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (lo.icon)
    return lo.icon(e);
  if (e === null)
    return null;
  if (e && Er(e) === "object" && e.prefix && e.iconName)
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
function Sa(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Yt({}, e, t) : {};
}
var Fs = {
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
}, Mn = /* @__PURE__ */ Ir.forwardRef(function(e, t) {
  var n = Ve(Ve({}, Fs), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, c = n.titleId, l = n.maskId, u = Ms(r), f = Sa("classes", [].concat(co(Mg(n)), co((i || "").split(" ")))), d = Sa("transform", typeof n.transform == "string" ? lo.transform(n.transform) : n.transform), y = Sa("mask", Ms(a)), v = bg(u, Ve(Ve(Ve(Ve({}, f), d), y), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!v)
    return Lg("Could not find icon", u), null;
  var m = v.abstract, p = {
    ref: t
  };
  return Object.keys(n).forEach(function(b) {
    Fs.hasOwnProperty(b) || (p[b] = n[b]);
  }), $g(m[0], p);
});
Mn.displayName = "FontAwesomeIcon";
Mn.propTypes = {
  beat: re.bool,
  border: re.bool,
  beatFade: re.bool,
  bounce: re.bool,
  className: re.string,
  fade: re.bool,
  flash: re.bool,
  mask: re.oneOfType([re.object, re.array, re.string]),
  maskId: re.string,
  fixedWidth: re.bool,
  inverse: re.bool,
  flip: re.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: re.oneOfType([re.object, re.array, re.string]),
  listItem: re.bool,
  pull: re.oneOf(["right", "left"]),
  pulse: re.bool,
  rotation: re.oneOf([0, 90, 180, 270]),
  shake: re.bool,
  size: re.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: re.bool,
  spinPulse: re.bool,
  spinReverse: re.bool,
  symbol: re.oneOfType([re.bool, re.string]),
  title: re.string,
  titleId: re.string,
  transform: re.oneOfType([re.string, re.object]),
  swapOpacity: re.bool
};
var $g = du.bind(null, Ir.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Wg = {
  prefix: "fas",
  iconName: "xmark",
  icon: [384, 512, [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"], "f00d", "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Ug(e, t, n) {
  return (t = Yg(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Ds(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function C(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ds(Object(n), !0).forEach(function(r) {
      Ug(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ds(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Vg(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Yg(e) {
  var t = Vg(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const js = () => {
};
let ni = {}, pu = {}, hu = null, gu = {
  mark: js,
  measure: js
};
try {
  typeof window < "u" && (ni = window), typeof document < "u" && (pu = document), typeof MutationObserver < "u" && (hu = MutationObserver), typeof performance < "u" && (gu = performance);
} catch {
}
const {
  userAgent: zs = ""
} = ni.navigator || {}, Pt = ni, xe = pu, Ls = hu, ir = gu;
Pt.document;
const st = !!xe.documentElement && !!xe.head && typeof xe.addEventListener == "function" && typeof xe.createElement == "function", yu = ~zs.indexOf("MSIE") || ~zs.indexOf("Trident/");
var Gg = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Bg = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, bu = {
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
}, qg = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, vu = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], ke = "classic", $r = "duotone", Hg = "sharp", Xg = "sharp-duotone", xu = [ke, $r, Hg, Xg], Kg = {
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
}, Qg = {
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
}, Zg = /* @__PURE__ */ new Map([["classic", {
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
}]]), Jg = {
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
}, ey = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], $s = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, ty = ["kit"], ny = {
  kit: {
    "fa-kit": "fak"
  }
}, ry = ["fak", "fakd"], ay = {
  kit: {
    fak: "fa-kit"
  }
}, Ws = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, sr = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, oy = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], iy = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], sy = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, ly = {
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
}, cy = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, fo = {
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
}, uy = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], mo = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...oy, ...uy], fy = ["solid", "regular", "light", "thin", "duotone", "brands"], wu = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dy = wu.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), my = [...Object.keys(cy), ...fy, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", sr.GROUP, sr.SWAP_OPACITY, sr.PRIMARY, sr.SECONDARY].concat(wu.map((e) => "".concat(e, "x"))).concat(dy.map((e) => "w-".concat(e))), py = {
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
const at = "___FONT_AWESOME___", po = 16, Eu = "fa", Su = "svg-inline--fa", Mt = "data-fa-i2svg", ho = "data-fa-pseudo-element", hy = "data-fa-pseudo-element-pending", ri = "data-prefix", ai = "data-icon", Us = "fontawesome-i2svg", gy = "async", yy = ["HTML", "HEAD", "STYLE", "SCRIPT"], Au = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function qn(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[ke];
    }
  });
}
const Pu = C({}, bu);
Pu[ke] = C(C(C(C({}, {
  "fa-duotone": "duotone"
}), bu[ke]), $s.kit), $s["kit-duotone"]);
const by = qn(Pu), go = C({}, Jg);
go[ke] = C(C(C(C({}, {
  duotone: "fad"
}), go[ke]), Ws.kit), Ws["kit-duotone"]);
const Vs = qn(go), yo = C({}, fo);
yo[ke] = C(C({}, yo[ke]), ay.kit);
const oi = qn(yo), bo = C({}, ly);
bo[ke] = C(C({}, bo[ke]), ny.kit);
qn(bo);
const vy = Gg, ku = "fa-layers-text", xy = Bg, wy = C({}, Kg);
qn(wy);
const Ey = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Aa = qg, Sy = [...ty, ...my], An = Pt.FontAwesomeConfig || {};
function Ay(e) {
  var t = xe.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Py(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
xe && typeof xe.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, n] = e;
  const r = Py(Ay(t));
  r != null && (An[n] = r);
});
const Ou = {
  styleDefault: "solid",
  familyDefault: ke,
  cssPrefix: Eu,
  replacementClass: Su,
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
An.familyPrefix && (An.cssPrefix = An.familyPrefix);
const nn = C(C({}, Ou), An);
nn.autoReplaceSvg || (nn.observeMutations = !1);
const G = {};
Object.keys(Ou).forEach((e) => {
  Object.defineProperty(G, e, {
    enumerable: !0,
    set: function(t) {
      nn[e] = t, Pn.forEach((n) => n(G));
    },
    get: function() {
      return nn[e];
    }
  });
});
Object.defineProperty(G, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    nn.cssPrefix = e, Pn.forEach((t) => t(G));
  },
  get: function() {
    return nn.cssPrefix;
  }
});
Pt.FontAwesomeConfig = G;
const Pn = [];
function ky(e) {
  return Pn.push(e), () => {
    Pn.splice(Pn.indexOf(e), 1);
  };
}
const ft = po, He = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Oy(e) {
  if (!e || !st)
    return;
  const t = xe.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = xe.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return xe.head.insertBefore(t, r), e;
}
const Cy = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Fn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Cy[Math.random() * 62 | 0];
  return t;
}
function sn(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function ii(e) {
  return e.classList ? sn(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Cu(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Ty(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Cu(e[n]), '" '), "").trim();
}
function Wr(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function si(e) {
  return e.size !== He.size || e.x !== He.x || e.y !== He.y || e.rotate !== He.rotate || e.flipX || e.flipY;
}
function _y(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: c,
    path: l
  };
}
function Iy(e) {
  let {
    transform: t,
    width: n = po,
    height: r = po,
    startCentered: a = !1
  } = e, o = "";
  return a && yu ? o += "translate(".concat(t.x / ft - n / 2, "em, ").concat(t.y / ft - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / ft, "em), calc(-50% + ").concat(t.y / ft, "em)) ") : o += "translate(".concat(t.x / ft, "em, ").concat(t.y / ft, "em) "), o += "scale(".concat(t.size / ft * (t.flipX ? -1 : 1), ", ").concat(t.size / ft * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Ny = `:root, :host {
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
function Tu() {
  const e = Eu, t = Su, n = G.cssPrefix, r = G.replacementClass;
  let a = Ny;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let Ys = !1;
function Pa() {
  G.autoAddCss && !Ys && (Oy(Tu()), Ys = !0);
}
var Ry = {
  mixout() {
    return {
      dom: {
        css: Tu,
        insertCss: Pa
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Pa();
      },
      beforeI2svg() {
        Pa();
      }
    };
  }
};
const ot = Pt || {};
ot[at] || (ot[at] = {});
ot[at].styles || (ot[at].styles = {});
ot[at].hooks || (ot[at].hooks = {});
ot[at].shims || (ot[at].shims = []);
var Xe = ot[at];
const _u = [], Iu = function() {
  xe.removeEventListener("DOMContentLoaded", Iu), Sr = 1, _u.map((e) => e());
};
let Sr = !1;
st && (Sr = (xe.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(xe.readyState), Sr || xe.addEventListener("DOMContentLoaded", Iu));
function My(e) {
  st && (Sr ? setTimeout(e, 0) : _u.push(e));
}
function Hn(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Cu(e) : "<".concat(t, " ").concat(Ty(n), ">").concat(r.map(Hn).join(""), "</").concat(t, ">");
}
function Gs(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var ka = function(e, t, n, r) {
  var a = Object.keys(e), o = a.length, i = t, s, c, l;
  for (n === void 0 ? (s = 1, l = e[a[0]]) : (s = 0, l = n); s < o; s++)
    c = a[s], l = i(l, e[c], c, e);
  return l;
};
function Fy(e) {
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
function Nu(e) {
  const t = Fy(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Dy(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function Bs(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function vo(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = Bs(t);
  typeof Xe.hooks.addPack == "function" && !r ? Xe.hooks.addPack(e, Bs(t)) : Xe.styles[e] = C(C({}, Xe.styles[e] || {}), a), e === "fas" && vo("fa", t);
}
const {
  styles: Dn,
  shims: jy
} = Xe, Ru = Object.keys(oi), zy = Ru.reduce((e, t) => (e[t] = Object.keys(oi[t]), e), {});
let li = null, Mu = {}, Fu = {}, Du = {}, ju = {}, zu = {};
function Ly(e) {
  return ~Sy.indexOf(e);
}
function $y(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !Ly(a) ? a : null;
}
const Lu = () => {
  const e = (r) => ka(Dn, (a, o, i) => (a[i] = ka(o, r, {}), a), {});
  Mu = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = o;
  }), r)), Fu = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = o;
  }), r)), zu = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in Dn || G.autoFetchSvg, n = ka(jy, (r, a) => {
    const o = a[0];
    let i = a[1];
    const s = a[2];
    return i === "far" && !t && (i = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: i,
      iconName: s
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  Du = n.names, ju = n.unicodes, li = Ur(G.styleDefault, {
    family: G.familyDefault
  });
};
ky((e) => {
  li = Ur(e.styleDefault, {
    family: G.familyDefault
  });
});
Lu();
function ci(e, t) {
  return (Mu[e] || {})[t];
}
function Wy(e, t) {
  return (Fu[e] || {})[t];
}
function _t(e, t) {
  return (zu[e] || {})[t];
}
function $u(e) {
  return Du[e] || {
    prefix: null,
    iconName: null
  };
}
function Uy(e) {
  const t = ju[e], n = ci("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function kt() {
  return li;
}
const Wu = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Vy(e) {
  let t = ke;
  const n = Ru.reduce((r, a) => (r[a] = "".concat(G.cssPrefix, "-").concat(a), r), {});
  return xu.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => zy[r].includes(a))) && (t = r);
  }), t;
}
function Ur(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = ke
  } = t, r = by[n][e];
  if (n === $r && !e)
    return "fad";
  const a = Vs[n][e] || Vs[n][r], o = e in Xe.styles ? e : null;
  return a || o || null;
}
function Yy(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = $y(G.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function qs(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Vr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = mo.concat(iy), o = qs(e.filter((f) => a.includes(f))), i = qs(e.filter((f) => !mo.includes(f))), s = o.filter((f) => (r = f, !vu.includes(f))), [c = null] = s, l = Vy(o), u = C(C({}, Yy(i)), {}, {
    prefix: Ur(c, {
      family: l
    })
  });
  return C(C(C({}, u), Hy({
    values: e,
    family: l,
    styles: Dn,
    config: G,
    canonical: u,
    givenPrefix: r
  })), Gy(n, r, u));
}
function Gy(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? $u(a) : {}, i = _t(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !Dn.far && Dn.fas && !G.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const By = xu.filter((e) => e !== ke || e !== $r), qy = Object.keys(fo).filter((e) => e !== ke).map((e) => Object.keys(fo[e])).flat();
function Hy(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === $r, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (c || l || u) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && By.includes(n) && (Object.keys(o).find((f) => qy.includes(f)) || i.autoFetchSvg)) {
    const f = Zg.get(n).defaultShortPrefixId;
    r.prefix = f, r.iconName = _t(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = kt() || "fas"), r;
}
class Xy {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = C(C({}, this.definitions[o] || {}), a[o]), vo(o, a[o]);
      const i = oi[ke][o];
      i && vo(i, a[o]), Lu();
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
        iconName: i,
        icon: s
      } = r[a], c = s[2];
      t[o] || (t[o] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[o][l] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let Hs = [], Gt = {};
const Qt = {}, Ky = Object.keys(Qt);
function Qy(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Hs = e, Gt = {}, Object.keys(Qt).forEach((r) => {
    Ky.indexOf(r) === -1 && delete Qt[r];
  }), Hs.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        Gt[i] || (Gt[i] = []), Gt[i].push(o[i]);
      });
    }
    r.provides && r.provides(Qt);
  }), n;
}
function xo(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Gt[e] || []).forEach((o) => {
    t = o.apply(null, [t, ...r]);
  }), t;
}
function Ft(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Gt[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function Ot() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Qt[e] ? Qt[e].apply(null, t) : void 0;
}
function wo(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || kt();
  if (t)
    return t = _t(n, t) || t, Gs(Uu.definitions, n, t) || Gs(Xe.styles, n, t);
}
const Uu = new Xy(), Zy = () => {
  G.autoReplaceSvg = !1, G.observeMutations = !1, Ft("noAuto");
}, Jy = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return st ? (Ft("beforeI2svg", e), Ot("pseudoElements2svg", e), Ot("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    G.autoReplaceSvg === !1 && (G.autoReplaceSvg = !0), G.observeMutations = !0, My(() => {
      tb({
        autoReplaceSvgRoot: t
      }), Ft("watch", e);
    });
  }
}, eb = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: _t(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Ur(e[0]);
      return {
        prefix: n,
        iconName: _t(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(G.cssPrefix, "-")) > -1 || e.match(vy))) {
      const t = Vr(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || kt(),
        iconName: _t(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = kt();
      return {
        prefix: t,
        iconName: _t(t, e) || e
      };
    }
  }
}, Me = {
  noAuto: Zy,
  config: G,
  dom: Jy,
  parse: eb,
  library: Uu,
  findIconDefinition: wo,
  toHtml: Hn
}, tb = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = xe
  } = e;
  (Object.keys(Xe.styles).length > 0 || G.autoFetchSvg) && st && G.autoReplaceSvg && Me.dom.i2svg({
    node: t
  });
};
function Yr(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => Hn(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!st) return;
      const n = xe.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function nb(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (si(i) && n.found && !r.found) {
    const {
      width: s,
      height: c
    } = n, l = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = Wr(C(C({}, o), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function rb(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(G.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: C(C({}, a), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function ui(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: y
  } = n.found ? n : t, v = ry.includes(r), m = [G.replacementClass, a ? "".concat(G.cssPrefix, "-").concat(a) : ""].filter((h) => u.classes.indexOf(h) === -1).filter((h) => h !== "" || !!h).concat(u.classes).join(" ");
  let p = {
    children: [],
    attributes: C(C({}, u.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: m,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(y)
    })
  };
  const b = v && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / y * 16 * 0.0625, "em")
  } : {};
  f && (p.attributes[Mt] = ""), s && (p.children.push({
    tag: "title",
    attributes: {
      id: p.attributes["aria-labelledby"] || "title-".concat(l || Fn())
    },
    children: [s]
  }), delete p.attributes.title);
  const A = C(C({}, p), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: c,
    transform: o,
    symbol: i,
    styles: C(C({}, b), u.styles)
  }), {
    children: w,
    attributes: P
  } = n.found && t.found ? Ot("generateAbstractMask", A) || {
    children: [],
    attributes: {}
  } : Ot("generateAbstractIcon", A) || {
    children: [],
    attributes: {}
  };
  return A.children = w, A.attributes = P, i ? rb(A) : nb(A);
}
function Xs(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = C(C(C({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[Mt] = "");
  const l = C({}, i.styles);
  si(a) && (l.transform = Iy({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), l["-webkit-transform"] = l.transform);
  const u = Wr(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), f;
}
function ab(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = C(C(C({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = Wr(r.styles);
  o.length > 0 && (a.style = o);
  const i = [];
  return i.push({
    tag: "span",
    attributes: a,
    children: [t]
  }), n && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [n]
  }), i;
}
const {
  styles: Oa
} = Xe;
function Eo(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(G.cssPrefix, "-").concat(Aa.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(G.cssPrefix, "-").concat(Aa.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(G.cssPrefix, "-").concat(Aa.PRIMARY),
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
const ob = {
  found: !1,
  width: 512,
  height: 512
};
function ib(e, t) {
  !Au && !G.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function So(e, t) {
  let n = t;
  return t === "fa" && G.styleDefault !== null && (t = kt()), new Promise((r, a) => {
    if (n === "fa") {
      const o = $u(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && Oa[t] && Oa[t][e]) {
      const o = Oa[t][e];
      return r(Eo(o));
    }
    ib(e, t), r(C(C({}, ob), {}, {
      icon: G.showMissingIcons && e ? Ot("missingIconAbstract") || {} : {}
    }));
  });
}
const Ks = () => {
}, Ao = G.measurePerformance && ir && ir.mark && ir.measure ? ir : {
  mark: Ks,
  measure: Ks
}, vn = 'FA "6.7.2"', sb = (e) => (Ao.mark("".concat(vn, " ").concat(e, " begins")), () => Vu(e)), Vu = (e) => {
  Ao.mark("".concat(vn, " ").concat(e, " ends")), Ao.measure("".concat(vn, " ").concat(e), "".concat(vn, " ").concat(e, " begins"), "".concat(vn, " ").concat(e, " ends"));
};
var fi = {
  begin: sb,
  end: Vu
};
const pr = () => {
};
function Qs(e) {
  return typeof (e.getAttribute ? e.getAttribute(Mt) : null) == "string";
}
function lb(e) {
  const t = e.getAttribute ? e.getAttribute(ri) : null, n = e.getAttribute ? e.getAttribute(ai) : null;
  return t && n;
}
function cb(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(G.replacementClass);
}
function ub() {
  return G.autoReplaceSvg === !0 ? hr.replace : hr[G.autoReplaceSvg] || hr.replace;
}
function fb(e) {
  return xe.createElementNS("http://www.w3.org/2000/svg", e);
}
function db(e) {
  return xe.createElement(e);
}
function Yu(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? fb : db
  } = t;
  if (typeof e == "string")
    return xe.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(Yu(a, {
      ceFn: n
    }));
  }), r;
}
function mb(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const hr = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(Yu(n), t);
      }), t.getAttribute(Mt) === null && G.keepOriginalSource) {
        let n = xe.createComment(mb(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~ii(t).indexOf(G.replacementClass))
      return hr.replace(e);
    const r = new RegExp("".concat(G.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === G.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => Hn(o)).join(`
`);
    t.setAttribute(Mt, ""), t.innerHTML = a;
  }
};
function Zs(e) {
  e();
}
function Gu(e, t) {
  const n = typeof t == "function" ? t : pr;
  if (e.length === 0)
    n();
  else {
    let r = Zs;
    G.mutateApproach === gy && (r = Pt.requestAnimationFrame || Zs), r(() => {
      const a = ub(), o = fi.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let di = !1;
function Bu() {
  di = !0;
}
function Po() {
  di = !1;
}
let Ar = null;
function Js(e) {
  if (!Ls || !G.observeMutations)
    return;
  const {
    treeCallback: t = pr,
    nodeCallback: n = pr,
    pseudoElementsCallback: r = pr,
    observeMutationsRoot: a = xe
  } = e;
  Ar = new Ls((o) => {
    if (di) return;
    const i = kt();
    sn(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Qs(s.addedNodes[0]) && (G.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && G.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Qs(s.target) && ~Ey.indexOf(s.attributeName))
        if (s.attributeName === "class" && lb(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = Vr(ii(s.target));
          s.target.setAttribute(ri, c || i), l && s.target.setAttribute(ai, l);
        } else cb(s.target) && n(s.target);
    });
  }), st && Ar.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function pb() {
  Ar && Ar.disconnect();
}
function hb(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function gb(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = Vr(ii(e));
  return a.prefix || (a.prefix = kt()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = Wy(a.prefix, e.innerText) || ci(a.prefix, Nu(e.innerText))), !a.iconName && G.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function yb(e) {
  const t = sn(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return G.autoA11y && (n ? t["aria-labelledby"] = "".concat(G.replacementClass, "-title-").concat(r || Fn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function bb() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: He,
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
function el(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = gb(e), o = yb(e), i = xo("parseNodeAttributes", {}, e);
  let s = t.styleParser ? hb(e) : [];
  return C({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: He,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: s,
      attributes: o
    }
  }, i);
}
const {
  styles: vb
} = Xe;
function qu(e) {
  const t = G.autoReplaceSvg === "nest" ? el(e, {
    styleParser: !1
  }) : el(e);
  return ~t.extra.classes.indexOf(ku) ? Ot("generateLayersText", e, t) : Ot("generateSvgReplacementMutation", e, t);
}
function xb() {
  return [...ey, ...mo];
}
function tl(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!st) return Promise.resolve();
  const n = xe.documentElement.classList, r = (u) => n.add("".concat(Us, "-").concat(u)), a = (u) => n.remove("".concat(Us, "-").concat(u)), o = G.autoFetchSvg ? xb() : vu.concat(Object.keys(vb));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(ku, ":not([").concat(Mt, "])")].concat(o.map((u) => ".".concat(u, ":not([").concat(Mt, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = sn(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const c = fi.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = qu(f);
      d && u.push(d);
    } catch (d) {
      Au || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      Gu(d, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function wb(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  qu(e).then((n) => {
    n && Gu([n], t);
  });
}
function Eb(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : wo(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : wo(a || {})), e(r, C(C({}, n), {}, {
      mask: a
    }));
  };
}
const Sb = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = He,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: f,
    iconName: d,
    icon: y
  } = e;
  return Yr(C({
    type: "icon"
  }, e), () => (Ft("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), G.autoA11y && (i ? l["aria-labelledby"] = "".concat(G.replacementClass, "-title-").concat(s || Fn()) : (l["aria-hidden"] = "true", l.focusable = "false")), ui({
    icons: {
      main: Eo(y),
      mask: a ? Eo(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: C(C({}, He), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var Ab = {
  mixout() {
    return {
      icon: Eb(Sb)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = tl, e.nodeCallback = wb, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = xe,
        callback: r = () => {
        }
      } = t;
      return tl(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = n;
      return new Promise((d, y) => {
        Promise.all([So(r, i), l.iconName ? So(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((v) => {
          let [m, p] = v;
          d([t, ui({
            icons: {
              main: m,
              mask: p
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: c,
            maskId: u,
            title: a,
            titleId: o,
            extra: f,
            watchable: !0
          })]);
        }).catch(y);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = Wr(i);
      s.length > 0 && (r.style = s);
      let c;
      return si(o) && (c = Ot("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(c || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, Pb = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Yr({
          type: "layer"
        }, () => {
          Ft("beforeDOMElementCreation", {
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
              class: ["".concat(G.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, kb = {
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
        return Yr({
          type: "counter",
          content: e
        }, () => (Ft("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ab({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(G.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, Ob = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = He,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return Yr({
          type: "text",
          content: e
        }, () => (Ft("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Xs({
          content: e,
          transform: C(C({}, He), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(G.cssPrefix, "-layers-text"), ...a]
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
      let i = null, s = null;
      if (yu) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return G.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Xs({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const Cb = new RegExp('"', "ug"), nl = [1105920, 1112319], rl = C(C(C(C({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Qg), py), sy), ko = Object.keys(rl).reduce((e, t) => (e[t.toLowerCase()] = rl[t], e), {}), Tb = Object.keys(ko).reduce((e, t) => {
  const n = ko[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function _b(e) {
  const t = e.replace(Cb, ""), n = Dy(t, 0), r = n >= nl[0] && n <= nl[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Nu(a ? t[0] : t),
    isSecondary: r || a
  };
}
function Ib(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (ko[n] || {})[a] || Tb[n];
}
function al(e, t) {
  const n = "".concat(hy).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const o = sn(e.children).filter((f) => f.getAttribute(ho) === t)[0], i = Pt.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(xy), l = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (o && !c)
      return e.removeChild(o), r();
    if (c && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = Ib(s, l);
      const {
        value: y,
        isSecondary: v
      } = _b(f), m = c[0].startsWith("FontAwesome");
      let p = ci(d, y), b = p;
      if (m) {
        const A = Uy(y);
        A.iconName && A.prefix && (p = A.iconName, d = A.prefix);
      }
      if (p && !v && (!o || o.getAttribute(ri) !== d || o.getAttribute(ai) !== b)) {
        e.setAttribute(n, b), o && e.removeChild(o);
        const A = bb(), {
          extra: w
        } = A;
        w.attributes[ho] = t, So(p, d).then((P) => {
          const h = ui(C(C({}, A), {}, {
            icons: {
              main: P,
              mask: Wu()
            },
            prefix: d,
            iconName: b,
            extra: w,
            watchable: !0
          })), H = xe.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(H, e.firstChild) : e.appendChild(H), H.outerHTML = h.map((j) => Hn(j)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function Nb(e) {
  return Promise.all([al(e, "::before"), al(e, "::after")]);
}
function Rb(e) {
  return e.parentNode !== document.head && !~yy.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(ho) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function ol(e) {
  if (st)
    return new Promise((t, n) => {
      const r = sn(e.querySelectorAll("*")).filter(Rb).map(Nb), a = fi.begin("searchPseudoElements");
      Bu(), Promise.all(r).then(() => {
        a(), Po(), t();
      }).catch(() => {
        a(), Po(), n();
      });
    });
}
var Mb = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = ol, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = xe
      } = t;
      G.searchPseudoElements && ol(n);
    };
  }
};
let il = !1;
var Fb = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Bu(), il = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Js(xo("mutationObserverCallbacks", {}));
      },
      noAuto() {
        pb();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        il ? Po() : Js(xo("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const sl = (e) => {
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
    let i = a.slice(1).join("-");
    if (o && i === "h")
      return n.flipX = !0, n;
    if (o && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (o) {
      case "grow":
        n.size = n.size + i;
        break;
      case "shrink":
        n.size = n.size - i;
        break;
      case "left":
        n.x = n.x - i;
        break;
      case "right":
        n.x = n.x + i;
        break;
      case "up":
        n.y = n.y - i;
        break;
      case "down":
        n.y = n.y + i;
        break;
      case "rotate":
        n.rotate = n.rotate + i;
        break;
    }
    return n;
  }, t);
};
var Db = {
  mixout() {
    return {
      parse: {
        transform: (e) => sl(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = sl(n)), e;
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
      const i = {
        transform: "translate(".concat(a / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), c = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), l = "rotate(".concat(r.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, f = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: C({}, d.outer),
        children: [{
          tag: "g",
          attributes: C({}, d.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: C(C({}, n.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Ca = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function ll(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function jb(e) {
  return e.tag === "g" ? e.children : [e];
}
var zb = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Vr(n.split(" ").map((a) => a.trim())) : Wu();
        return r.prefix || (r.prefix = kt()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = a, {
        width: u,
        icon: f
      } = o, d = _y({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), y = {
        tag: "rect",
        attributes: C(C({}, Ca), {}, {
          fill: "white"
        })
      }, v = l.children ? {
        children: l.children.map(ll)
      } : {}, m = {
        tag: "g",
        attributes: C({}, d.inner),
        children: [ll(C({
          tag: l.tag,
          attributes: C(C({}, l.attributes), d.path)
        }, v))]
      }, p = {
        tag: "g",
        attributes: C({}, d.outer),
        children: [m]
      }, b = "mask-".concat(i || Fn()), A = "clip-".concat(i || Fn()), w = {
        tag: "mask",
        attributes: C(C({}, Ca), {}, {
          id: b,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [y, p]
      }, P = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: A
          },
          children: jb(f)
        }, w]
      };
      return n.push(P, {
        tag: "rect",
        attributes: C({
          fill: "currentColor",
          "clip-path": "url(#".concat(A, ")"),
          mask: "url(#".concat(b, ")")
        }, Ca)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Lb = {
  provides(e) {
    let t = !1;
    Pt.matchMedia && (t = Pt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: C(C({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = C(C({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: C(C({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: C(C({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: C(C({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: C(C({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: C(C({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: C(C({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: C(C({}, o), {}, {
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
}, $b = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Wb = [Ry, Ab, Pb, kb, Ob, Mb, Fb, Db, zb, Lb, $b];
Qy(Wb, {
  mixoutsTo: Me
});
Me.noAuto;
Me.config;
Me.library;
Me.dom;
const Oo = Me.parse;
Me.findIconDefinition;
Me.toHtml;
const Ub = Me.icon;
Me.layer;
Me.text;
Me.counter;
function Vb(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var lr = { exports: {} }, Ta = { exports: {} }, me = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var cl;
function Yb() {
  if (cl) return me;
  cl = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, y = e ? Symbol.for("react.memo") : 60115, v = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, p = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, A = e ? Symbol.for("react.scope") : 60119;
  function w(h) {
    if (typeof h == "object" && h !== null) {
      var H = h.$$typeof;
      switch (H) {
        case t:
          switch (h = h.type, h) {
            case c:
            case l:
            case r:
            case o:
            case a:
            case f:
              return h;
            default:
              switch (h = h && h.$$typeof, h) {
                case s:
                case u:
                case v:
                case y:
                case i:
                  return h;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function P(h) {
    return w(h) === l;
  }
  return me.AsyncMode = c, me.ConcurrentMode = l, me.ContextConsumer = s, me.ContextProvider = i, me.Element = t, me.ForwardRef = u, me.Fragment = r, me.Lazy = v, me.Memo = y, me.Portal = n, me.Profiler = o, me.StrictMode = a, me.Suspense = f, me.isAsyncMode = function(h) {
    return P(h) || w(h) === c;
  }, me.isConcurrentMode = P, me.isContextConsumer = function(h) {
    return w(h) === s;
  }, me.isContextProvider = function(h) {
    return w(h) === i;
  }, me.isElement = function(h) {
    return typeof h == "object" && h !== null && h.$$typeof === t;
  }, me.isForwardRef = function(h) {
    return w(h) === u;
  }, me.isFragment = function(h) {
    return w(h) === r;
  }, me.isLazy = function(h) {
    return w(h) === v;
  }, me.isMemo = function(h) {
    return w(h) === y;
  }, me.isPortal = function(h) {
    return w(h) === n;
  }, me.isProfiler = function(h) {
    return w(h) === o;
  }, me.isStrictMode = function(h) {
    return w(h) === a;
  }, me.isSuspense = function(h) {
    return w(h) === f;
  }, me.isValidElementType = function(h) {
    return typeof h == "string" || typeof h == "function" || h === r || h === l || h === o || h === a || h === f || h === d || typeof h == "object" && h !== null && (h.$$typeof === v || h.$$typeof === y || h.$$typeof === i || h.$$typeof === s || h.$$typeof === u || h.$$typeof === p || h.$$typeof === b || h.$$typeof === A || h.$$typeof === m);
  }, me.typeOf = w, me;
}
var pe = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ul;
function Gb() {
  return ul || (ul = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, y = e ? Symbol.for("react.memo") : 60115, v = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, p = e ? Symbol.for("react.fundamental") : 60117, b = e ? Symbol.for("react.responder") : 60118, A = e ? Symbol.for("react.scope") : 60119;
    function w(E) {
      return typeof E == "string" || typeof E == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      E === r || E === l || E === o || E === a || E === f || E === d || typeof E == "object" && E !== null && (E.$$typeof === v || E.$$typeof === y || E.$$typeof === i || E.$$typeof === s || E.$$typeof === u || E.$$typeof === p || E.$$typeof === b || E.$$typeof === A || E.$$typeof === m);
    }
    function P(E) {
      if (typeof E == "object" && E !== null) {
        var we = E.$$typeof;
        switch (we) {
          case t:
            var Se = E.type;
            switch (Se) {
              case c:
              case l:
              case r:
              case o:
              case a:
              case f:
                return Se;
              default:
                var Ze = Se && Se.$$typeof;
                switch (Ze) {
                  case s:
                  case u:
                  case v:
                  case y:
                  case i:
                    return Ze;
                  default:
                    return we;
                }
            }
          case n:
            return we;
        }
      }
    }
    var h = c, H = l, j = s, K = i, J = t, oe = u, le = r, U = v, ge = y, $ = n, k = o, L = a, Q = f, B = !1;
    function ie(E) {
      return B || (B = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), g(E) || P(E) === c;
    }
    function g(E) {
      return P(E) === l;
    }
    function x(E) {
      return P(E) === s;
    }
    function _(E) {
      return P(E) === i;
    }
    function D(E) {
      return typeof E == "object" && E !== null && E.$$typeof === t;
    }
    function I(E) {
      return P(E) === u;
    }
    function F(E) {
      return P(E) === r;
    }
    function R(E) {
      return P(E) === v;
    }
    function N(E) {
      return P(E) === y;
    }
    function z(E) {
      return P(E) === n;
    }
    function M(E) {
      return P(E) === o;
    }
    function W(E) {
      return P(E) === a;
    }
    function ce(E) {
      return P(E) === f;
    }
    pe.AsyncMode = h, pe.ConcurrentMode = H, pe.ContextConsumer = j, pe.ContextProvider = K, pe.Element = J, pe.ForwardRef = oe, pe.Fragment = le, pe.Lazy = U, pe.Memo = ge, pe.Portal = $, pe.Profiler = k, pe.StrictMode = L, pe.Suspense = Q, pe.isAsyncMode = ie, pe.isConcurrentMode = g, pe.isContextConsumer = x, pe.isContextProvider = _, pe.isElement = D, pe.isForwardRef = I, pe.isFragment = F, pe.isLazy = R, pe.isMemo = N, pe.isPortal = z, pe.isProfiler = M, pe.isStrictMode = W, pe.isSuspense = ce, pe.isValidElementType = w, pe.typeOf = P;
  }()), pe;
}
var fl;
function Hu() {
  return fl || (fl = 1, process.env.NODE_ENV === "production" ? Ta.exports = Yb() : Ta.exports = Gb()), Ta.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var _a, dl;
function Bb() {
  if (dl) return _a;
  dl = 1;
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
      for (var i = {}, s = 0; s < 10; s++)
        i["_" + String.fromCharCode(s)] = s;
      var c = Object.getOwnPropertyNames(i).map(function(u) {
        return i[u];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        l[u] = u;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return _a = a() ? Object.assign : function(o, i) {
    for (var s, c = r(o), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          n.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, _a;
}
var Ia, ml;
function mi() {
  if (ml) return Ia;
  ml = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Ia = e, Ia;
}
var pl, hl;
function Xu() {
  return hl || (hl = 1, pl = Function.call.bind(Object.prototype.hasOwnProperty)), pl;
}
var Na, gl;
function qb() {
  if (gl) return Na;
  gl = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ mi(), n = {}, r = /* @__PURE__ */ Xu();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in o)
        if (r(o, u)) {
          var f;
          try {
            if (typeof o[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = o[u](i, u, c, s, null, t);
          } catch (v) {
            f = v;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in n)) {
            n[f.message] = !0;
            var y = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (y ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Na = a, Na;
}
var Ra, yl;
function Hb() {
  if (yl) return Ra;
  yl = 1;
  var e = Hu(), t = Bb(), n = /* @__PURE__ */ mi(), r = /* @__PURE__ */ Xu(), a = /* @__PURE__ */ qb(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(s) {
    var c = "Warning: " + s;
    typeof console < "u" && console.error(c);
    try {
      throw new Error(c);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return Ra = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(g) {
      var x = g && (l && g[l] || g[u]);
      if (typeof x == "function")
        return x;
    }
    var d = "<<anonymous>>", y = {
      array: b("array"),
      bigint: b("bigint"),
      bool: b("boolean"),
      func: b("function"),
      number: b("number"),
      object: b("object"),
      string: b("string"),
      symbol: b("symbol"),
      any: A(),
      arrayOf: w,
      element: P(),
      elementType: h(),
      instanceOf: H,
      node: oe(),
      objectOf: K,
      oneOf: j,
      oneOfType: J,
      shape: U,
      exact: ge
    };
    function v(g, x) {
      return g === x ? g !== 0 || 1 / g === 1 / x : g !== g && x !== x;
    }
    function m(g, x) {
      this.message = g, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function p(g) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, _ = 0;
      function D(F, R, N, z, M, W, ce) {
        if (z = z || d, W = W || N, ce !== n) {
          if (c) {
            var E = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw E.name = "Invariant Violation", E;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var we = z + ":" + N;
            !x[we] && // Avoid spamming the console because they are often not actionable except for lib authors
            _ < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + W + "` prop on `" + z + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[we] = !0, _++);
          }
        }
        return R[N] == null ? F ? R[N] === null ? new m("The " + M + " `" + W + "` is marked as required " + ("in `" + z + "`, but its value is `null`.")) : new m("The " + M + " `" + W + "` is marked as required in " + ("`" + z + "`, but its value is `undefined`.")) : null : g(R, N, z, M, W);
      }
      var I = D.bind(null, !1);
      return I.isRequired = D.bind(null, !0), I;
    }
    function b(g) {
      function x(_, D, I, F, R, N) {
        var z = _[D], M = L(z);
        if (M !== g) {
          var W = Q(z);
          return new m(
            "Invalid " + F + " `" + R + "` of type " + ("`" + W + "` supplied to `" + I + "`, expected ") + ("`" + g + "`."),
            { expectedType: g }
          );
        }
        return null;
      }
      return p(x);
    }
    function A() {
      return p(i);
    }
    function w(g) {
      function x(_, D, I, F, R) {
        if (typeof g != "function")
          return new m("Property `" + R + "` of component `" + I + "` has invalid PropType notation inside arrayOf.");
        var N = _[D];
        if (!Array.isArray(N)) {
          var z = L(N);
          return new m("Invalid " + F + " `" + R + "` of type " + ("`" + z + "` supplied to `" + I + "`, expected an array."));
        }
        for (var M = 0; M < N.length; M++) {
          var W = g(N, M, I, F, R + "[" + M + "]", n);
          if (W instanceof Error)
            return W;
        }
        return null;
      }
      return p(x);
    }
    function P() {
      function g(x, _, D, I, F) {
        var R = x[_];
        if (!s(R)) {
          var N = L(R);
          return new m("Invalid " + I + " `" + F + "` of type " + ("`" + N + "` supplied to `" + D + "`, expected a single ReactElement."));
        }
        return null;
      }
      return p(g);
    }
    function h() {
      function g(x, _, D, I, F) {
        var R = x[_];
        if (!e.isValidElementType(R)) {
          var N = L(R);
          return new m("Invalid " + I + " `" + F + "` of type " + ("`" + N + "` supplied to `" + D + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return p(g);
    }
    function H(g) {
      function x(_, D, I, F, R) {
        if (!(_[D] instanceof g)) {
          var N = g.name || d, z = ie(_[D]);
          return new m("Invalid " + F + " `" + R + "` of type " + ("`" + z + "` supplied to `" + I + "`, expected ") + ("instance of `" + N + "`."));
        }
        return null;
      }
      return p(x);
    }
    function j(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function x(_, D, I, F, R) {
        for (var N = _[D], z = 0; z < g.length; z++)
          if (v(N, g[z]))
            return null;
        var M = JSON.stringify(g, function(W, ce) {
          var E = Q(ce);
          return E === "symbol" ? String(ce) : ce;
        });
        return new m("Invalid " + F + " `" + R + "` of value `" + String(N) + "` " + ("supplied to `" + I + "`, expected one of " + M + "."));
      }
      return p(x);
    }
    function K(g) {
      function x(_, D, I, F, R) {
        if (typeof g != "function")
          return new m("Property `" + R + "` of component `" + I + "` has invalid PropType notation inside objectOf.");
        var N = _[D], z = L(N);
        if (z !== "object")
          return new m("Invalid " + F + " `" + R + "` of type " + ("`" + z + "` supplied to `" + I + "`, expected an object."));
        for (var M in N)
          if (r(N, M)) {
            var W = g(N, M, I, F, R + "." + M, n);
            if (W instanceof Error)
              return W;
          }
        return null;
      }
      return p(x);
    }
    function J(g) {
      if (!Array.isArray(g))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var x = 0; x < g.length; x++) {
        var _ = g[x];
        if (typeof _ != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + B(_) + " at index " + x + "."
          ), i;
      }
      function D(I, F, R, N, z) {
        for (var M = [], W = 0; W < g.length; W++) {
          var ce = g[W], E = ce(I, F, R, N, z, n);
          if (E == null)
            return null;
          E.data && r(E.data, "expectedType") && M.push(E.data.expectedType);
        }
        var we = M.length > 0 ? ", expected one of type [" + M.join(", ") + "]" : "";
        return new m("Invalid " + N + " `" + z + "` supplied to " + ("`" + R + "`" + we + "."));
      }
      return p(D);
    }
    function oe() {
      function g(x, _, D, I, F) {
        return $(x[_]) ? null : new m("Invalid " + I + " `" + F + "` supplied to " + ("`" + D + "`, expected a ReactNode."));
      }
      return p(g);
    }
    function le(g, x, _, D, I) {
      return new m(
        (g || "React class") + ": " + x + " type `" + _ + "." + D + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + I + "`."
      );
    }
    function U(g) {
      function x(_, D, I, F, R) {
        var N = _[D], z = L(N);
        if (z !== "object")
          return new m("Invalid " + F + " `" + R + "` of type `" + z + "` " + ("supplied to `" + I + "`, expected `object`."));
        for (var M in g) {
          var W = g[M];
          if (typeof W != "function")
            return le(I, F, R, M, Q(W));
          var ce = W(N, M, I, F, R + "." + M, n);
          if (ce)
            return ce;
        }
        return null;
      }
      return p(x);
    }
    function ge(g) {
      function x(_, D, I, F, R) {
        var N = _[D], z = L(N);
        if (z !== "object")
          return new m("Invalid " + F + " `" + R + "` of type `" + z + "` " + ("supplied to `" + I + "`, expected `object`."));
        var M = t({}, _[D], g);
        for (var W in M) {
          var ce = g[W];
          if (r(g, W) && typeof ce != "function")
            return le(I, F, R, W, Q(ce));
          if (!ce)
            return new m(
              "Invalid " + F + " `" + R + "` key `" + W + "` supplied to `" + I + "`.\nBad object: " + JSON.stringify(_[D], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(g), null, "  ")
            );
          var E = ce(N, W, I, F, R + "." + W, n);
          if (E)
            return E;
        }
        return null;
      }
      return p(x);
    }
    function $(g) {
      switch (typeof g) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !g;
        case "object":
          if (Array.isArray(g))
            return g.every($);
          if (g === null || s(g))
            return !0;
          var x = f(g);
          if (x) {
            var _ = x.call(g), D;
            if (x !== g.entries) {
              for (; !(D = _.next()).done; )
                if (!$(D.value))
                  return !1;
            } else
              for (; !(D = _.next()).done; ) {
                var I = D.value;
                if (I && !$(I[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function k(g, x) {
      return g === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function L(g) {
      var x = typeof g;
      return Array.isArray(g) ? "array" : g instanceof RegExp ? "object" : k(x, g) ? "symbol" : x;
    }
    function Q(g) {
      if (typeof g > "u" || g === null)
        return "" + g;
      var x = L(g);
      if (x === "object") {
        if (g instanceof Date)
          return "date";
        if (g instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function B(g) {
      var x = Q(g);
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
    function ie(g) {
      return !g.constructor || !g.constructor.name ? d : g.constructor.name;
    }
    return y.checkPropTypes = a, y.resetWarningCache = a.resetWarningCache, y.PropTypes = y, y;
  }, Ra;
}
var Ma, bl;
function Xb() {
  if (bl) return Ma;
  bl = 1;
  var e = /* @__PURE__ */ mi();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Ma = function() {
    function r(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
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
  }, Ma;
}
var vl;
function Kb() {
  if (vl) return lr.exports;
  if (vl = 1, process.env.NODE_ENV !== "production") {
    var e = Hu(), t = !0;
    lr.exports = /* @__PURE__ */ Hb()(e.isElement, t);
  } else
    lr.exports = /* @__PURE__ */ Xb()();
  return lr.exports;
}
var Qb = /* @__PURE__ */ Kb();
const ae = /* @__PURE__ */ Vb(Qb);
function xl(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Ye(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? xl(Object(n), !0).forEach(function(r) {
      Bt(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : xl(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Pr(e) {
  "@babel/helpers - typeof";
  return Pr = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Pr(e);
}
function Bt(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Zb(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function Jb(e, t) {
  if (e == null) return {};
  var n = Zb(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Co(e) {
  return ev(e) || tv(e) || nv(e) || rv();
}
function ev(e) {
  if (Array.isArray(e)) return To(e);
}
function tv(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function nv(e, t) {
  if (e) {
    if (typeof e == "string") return To(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return To(e, t);
  }
}
function To(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function rv() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function av(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, y = e.inverse, v = e.border, m = e.listItem, p = e.flip, b = e.size, A = e.rotation, w = e.pull, P = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": y,
    "fa-border": v,
    "fa-li": m,
    "fa-flip": p === !0,
    "fa-flip-horizontal": p === "horizontal" || p === "both",
    "fa-flip-vertical": p === "vertical" || p === "both"
  }, Bt(t, "fa-".concat(b), typeof b < "u" && b !== null), Bt(t, "fa-rotate-".concat(A), typeof A < "u" && A !== null && A !== 0), Bt(t, "fa-pull-".concat(w), typeof w < "u" && w !== null), Bt(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(P).map(function(h) {
    return P[h] ? h : null;
  }).filter(function(h) {
    return h;
  });
}
function ov(e) {
  return e = e - 0, e === e;
}
function Ku(e) {
  return ov(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var iv = ["style"];
function sv(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function lv(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Ku(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[sv(a)] = o : t[a] = o, t;
  }, {});
}
function Qu(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(c) {
    return Qu(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = lv(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[Ku(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = Jb(n, iv);
  return a.attrs.style = Ye(Ye({}, a.attrs.style), i), e.apply(void 0, [t.tag, Ye(Ye({}, a.attrs), s)].concat(Co(r)));
}
var Zu = !1;
try {
  Zu = process.env.NODE_ENV === "production";
} catch {
}
function cv() {
  if (!Zu && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function wl(e) {
  if (e && Pr(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Oo.icon)
    return Oo.icon(e);
  if (e === null)
    return null;
  if (e && Pr(e) === "object" && e.prefix && e.iconName)
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
function Fa(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Bt({}, e, t) : {};
}
var El = {
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
}, pi = /* @__PURE__ */ Ir.forwardRef(function(e, t) {
  var n = Ye(Ye({}, El), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, c = n.titleId, l = n.maskId, u = wl(r), f = Fa("classes", [].concat(Co(av(n)), Co((i || "").split(" ")))), d = Fa("transform", typeof n.transform == "string" ? Oo.transform(n.transform) : n.transform), y = Fa("mask", wl(a)), v = Ub(u, Ye(Ye(Ye(Ye({}, f), d), y), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!v)
    return cv("Could not find icon", u), null;
  var m = v.abstract, p = {
    ref: t
  };
  return Object.keys(n).forEach(function(b) {
    El.hasOwnProperty(b) || (p[b] = n[b]);
  }), uv(m[0], p);
});
pi.displayName = "FontAwesomeIcon";
pi.propTypes = {
  beat: ae.bool,
  border: ae.bool,
  beatFade: ae.bool,
  bounce: ae.bool,
  className: ae.string,
  fade: ae.bool,
  flash: ae.bool,
  mask: ae.oneOfType([ae.object, ae.array, ae.string]),
  maskId: ae.string,
  fixedWidth: ae.bool,
  inverse: ae.bool,
  flip: ae.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: ae.oneOfType([ae.object, ae.array, ae.string]),
  listItem: ae.bool,
  pull: ae.oneOf(["right", "left"]),
  pulse: ae.bool,
  rotation: ae.oneOf([0, 90, 180, 270]),
  shake: ae.bool,
  size: ae.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: ae.bool,
  spinPulse: ae.bool,
  spinReverse: ae.bool,
  symbol: ae.oneOfType([ae.bool, ae.string]),
  title: ae.string,
  titleId: ae.string,
  transform: ae.oneOfType([ae.string, ae.object]),
  swapOpacity: ae.bool
};
var uv = Qu.bind(null, Ir.createElement);
const hi = "-", fv = (e) => {
  const t = mv(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (a) => {
      const o = a.split(hi);
      return o[0] === "" && o.length !== 1 && o.shift(), Ju(o, t) || dv(a);
    },
    getConflictingClassGroupIds: (a, o) => {
      const i = n[a] || [];
      return o && r[a] ? [...i, ...r[a]] : i;
    }
  };
}, Ju = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], a = t.nextPart.get(r), o = a ? Ju(e.slice(1), a) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const i = e.join(hi);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, Sl = /^\[(.+)\]$/, dv = (e) => {
  if (Sl.test(e)) {
    const t = Sl.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, mv = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return hv(Object.entries(e.classGroups), n).forEach(([a, o]) => {
    _o(o, r, a, t);
  }), r;
}, _o = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : Al(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (pv(a)) {
        _o(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      _o(i, Al(t, o), n, r);
    });
  });
}, Al = (e, t) => {
  let n = e;
  return t.split(hi).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, pv = (e) => e.isThemeGetter, hv = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [n, a];
}) : e, gv = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const a = (o, i) => {
    n.set(o, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(o) {
      let i = n.get(o);
      if (i !== void 0)
        return i;
      if ((i = r.get(o)) !== void 0)
        return a(o, i), i;
    },
    set(o, i) {
      n.has(o) ? n.set(o, i) : a(o, i);
    }
  };
}, ef = "!", yv = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let p = 0; p < s.length; p++) {
      let b = s[p];
      if (l === 0) {
        if (b === a && (r || s.slice(p, p + o) === t)) {
          c.push(s.slice(u, p)), u = p + o;
          continue;
        }
        if (b === "/") {
          f = p;
          continue;
        }
      }
      b === "[" ? l++ : b === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), y = d.startsWith(ef), v = y ? d.substring(1) : d, m = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: y,
      baseClassName: v,
      maybePostfixModifierPosition: m
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, bv = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, vv = (e) => ({
  cache: gv(e.cacheSize),
  parseClassName: yv(e),
  ...fv(e)
}), xv = /\s+/, wv = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(xv);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: y
    } = n(l);
    let v = !!y, m = r(v ? d.substring(0, y) : d);
    if (!m) {
      if (!v) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (m = r(d), !m) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      v = !1;
    }
    const p = bv(u).join(":"), b = f ? p + ef : p, A = b + m;
    if (o.includes(A))
      continue;
    o.push(A);
    const w = a(m, v);
    for (let P = 0; P < w.length; ++P) {
      const h = w[P];
      o.push(b + h);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Ev() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = tf(t)) && (r && (r += " "), r += n);
  return r;
}
const tf = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = tf(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Sv(e, ...t) {
  let n, r, a, o = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return n = vv(l), r = n.cache.get, a = n.cache.set, o = s, s(c);
  }
  function s(c) {
    const l = r(c);
    if (l)
      return l;
    const u = wv(c, n);
    return a(c, u), u;
  }
  return function() {
    return o(Ev.apply(null, arguments));
  };
}
const be = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, nf = /^\[(?:([a-z-]+):)?(.+)\]$/i, Av = /^\d+\/\d+$/, Pv = /* @__PURE__ */ new Set(["px", "full", "screen"]), kv = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Ov = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Cv = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Tv = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, _v = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, et = (e) => Zt(e) || Pv.has(e) || Av.test(e), dt = (e) => ln(e, "length", zv), Zt = (e) => !!e && !Number.isNaN(Number(e)), Da = (e) => ln(e, "number", Zt), dn = (e) => !!e && Number.isInteger(Number(e)), Iv = (e) => e.endsWith("%") && Zt(e.slice(0, -1)), te = (e) => nf.test(e), mt = (e) => kv.test(e), Nv = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Rv = (e) => ln(e, Nv, rf), Mv = (e) => ln(e, "position", rf), Fv = /* @__PURE__ */ new Set(["image", "url"]), Dv = (e) => ln(e, Fv, $v), jv = (e) => ln(e, "", Lv), mn = () => !0, ln = (e, t, n) => {
  const r = nf.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, zv = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Ov.test(e) && !Cv.test(e)
), rf = () => !1, Lv = (e) => Tv.test(e), $v = (e) => _v.test(e), Wv = () => {
  const e = be("colors"), t = be("spacing"), n = be("blur"), r = be("brightness"), a = be("borderColor"), o = be("borderRadius"), i = be("borderSpacing"), s = be("borderWidth"), c = be("contrast"), l = be("grayscale"), u = be("hueRotate"), f = be("invert"), d = be("gap"), y = be("gradientColorStops"), v = be("gradientColorStopPositions"), m = be("inset"), p = be("margin"), b = be("opacity"), A = be("padding"), w = be("saturate"), P = be("scale"), h = be("sepia"), H = be("skew"), j = be("space"), K = be("translate"), J = () => ["auto", "contain", "none"], oe = () => ["auto", "hidden", "clip", "visible", "scroll"], le = () => ["auto", te, t], U = () => [te, t], ge = () => ["", et, dt], $ = () => ["auto", Zt, te], k = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], L = () => ["solid", "dashed", "dotted", "double", "none"], Q = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], B = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], ie = () => ["", "0", te], g = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [Zt, te];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [mn],
      spacing: [et, dt],
      blur: ["none", "", mt, te],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", mt, te],
      borderSpacing: U(),
      borderWidth: ge(),
      contrast: x(),
      grayscale: ie(),
      hueRotate: x(),
      invert: ie(),
      gap: U(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Iv, dt],
      inset: le(),
      margin: le(),
      opacity: x(),
      padding: U(),
      saturate: x(),
      scale: x(),
      sepia: ie(),
      skew: x(),
      space: U(),
      translate: U()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", te]
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
        columns: [mt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": g()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": g()
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
        object: [...k(), te]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: oe()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": oe()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": oe()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: J()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": J()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": J()
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
        z: ["auto", dn, te]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: le()
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
        flex: ["1", "auto", "initial", "none", te]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: ie()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: ie()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", dn, te]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [mn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", dn, te]
        }, te]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": $()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": $()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [mn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [dn, te]
        }, te]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": $()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": $()
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
        "auto-cols": ["auto", "min", "max", "fr", te]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", te]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [d]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [d]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [d]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...B()]
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
        content: ["normal", ...B(), "baseline"]
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
        "place-content": [...B(), "baseline"]
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
        p: [A]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [A]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [A]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [A]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [A]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [A]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [A]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [A]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [A]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [p]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [p]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [p]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [p]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [p]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [p]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [p]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [p]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [p]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [j]
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
        "space-y": [j]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", te, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [te, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [te, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [mt]
        }, mt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [te, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [te, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [te, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [te, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", mt, dt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Da]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [mn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", te]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Zt, Da]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", et, te]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", te]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", te]
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
        decoration: [...L(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", et, dt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", et, te]
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
        indent: U()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", te]
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
        content: ["none", te]
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
        bg: [...k(), Mv]
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
        bg: ["auto", "cover", "contain", Rv]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Dv]
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
        from: [v]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [v]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [v]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [y]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [y]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [y]
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
        border: [s]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [s]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [s]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [s]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [s]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [s]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [s]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [s]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [s]
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
        border: [...L(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [s]
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
        "divide-y": [s]
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
        divide: L()
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
        outline: ["", ...L()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [et, te]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [et, dt]
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
        ring: ge()
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
        "ring-offset": [et, dt]
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
        shadow: ["", "inner", "none", mt, jv]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [mn]
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
        "mix-blend": [...Q(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Q()
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
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", mt, te]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [l]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [u]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [f]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [w]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [h]
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
        "backdrop-contrast": [c]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [l]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [u]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [f]
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
        "backdrop-saturate": [w]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [h]
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
        "border-spacing": [i]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [i]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [i]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", te]
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
        ease: ["linear", "in", "out", "in-out", te]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", te]
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
        scale: [P]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [P]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [P]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [dn, te]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [K]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [K]
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
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", te]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", te]
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
        "scroll-m": U()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": U()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": U()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": U()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": U()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": U()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": U()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": U()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": U()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": U()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": U()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": U()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": U()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": U()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": U()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": U()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": U()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": U()
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
        "will-change": ["auto", "scroll", "contents", "transform", te]
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
        stroke: [et, dt, Da]
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
}, Uv = /* @__PURE__ */ Sv(Wv), Vv = ({
  onClick: e,
  className: t,
  size: n = "md"
}) => /* @__PURE__ */ V(
  "button",
  {
    onClick: e,
    className: Uv(
      "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
      {
        sm: "h-5 w-5 text-sm",
        md: "h-7 w-7 text-md",
        lg: "h-9 w-9 text-xl"
      }[n],
      t
    ),
    children: /* @__PURE__ */ V(pi, { icon: Wg })
  }
);
var gi = Kn(), Z = (e) => Xn(e, gi), yi = Kn();
Z.write = (e) => Xn(e, yi);
var Gr = Kn();
Z.onStart = (e) => Xn(e, Gr);
var bi = Kn();
Z.onFrame = (e) => Xn(e, bi);
var vi = Kn();
Z.onFinish = (e) => Xn(e, vi);
var Jt = [];
Z.setTimeout = (e, t) => {
  const n = Z.now() + t, r = () => {
    const o = Jt.findIndex((i) => i.cancel == r);
    ~o && Jt.splice(o, 1), vt -= ~o ? 1 : 0;
  }, a = { time: n, handler: e, cancel: r };
  return Jt.splice(af(n), 0, a), vt += 1, of(), a;
};
var af = (e) => ~(~Jt.findIndex((t) => t.time > e) || ~Jt.length);
Z.cancel = (e) => {
  Gr.delete(e), bi.delete(e), vi.delete(e), gi.delete(e), yi.delete(e);
};
Z.sync = (e) => {
  Io = !0, Z.batchedUpdates(e), Io = !1;
};
Z.throttle = (e) => {
  let t;
  function n() {
    try {
      e(...t);
    } finally {
      t = null;
    }
  }
  function r(...a) {
    t = a, Z.onStart(n);
  }
  return r.handler = e, r.cancel = () => {
    Gr.delete(n), t = null;
  }, r;
};
var xi = typeof window < "u" ? window.requestAnimationFrame : (
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  () => {
  }
);
Z.use = (e) => xi = e;
Z.now = typeof performance < "u" ? () => performance.now() : Date.now;
Z.batchedUpdates = (e) => e();
Z.catch = console.error;
Z.frameLoop = "always";
Z.advance = () => {
  Z.frameLoop !== "demand" ? console.warn(
    "Cannot call the manual advancement of rafz whilst frameLoop is not set as demand"
  ) : lf();
};
var bt = -1, vt = 0, Io = !1;
function Xn(e, t) {
  Io ? (t.delete(e), e(0)) : (t.add(e), of());
}
function of() {
  bt < 0 && (bt = 0, Z.frameLoop !== "demand" && xi(sf));
}
function Yv() {
  bt = -1;
}
function sf() {
  ~bt && (xi(sf), Z.batchedUpdates(lf));
}
function lf() {
  const e = bt;
  bt = Z.now();
  const t = af(bt);
  if (t && (cf(Jt.splice(0, t), (n) => n.handler()), vt -= t), !vt) {
    Yv();
    return;
  }
  Gr.flush(), gi.flush(e ? Math.min(64, bt - e) : 16.667), bi.flush(), yi.flush(), vi.flush();
}
function Kn() {
  let e = /* @__PURE__ */ new Set(), t = e;
  return {
    add(n) {
      vt += t == e && !e.has(n) ? 1 : 0, e.add(n);
    },
    delete(n) {
      return vt -= t == e && e.has(n) ? 1 : 0, e.delete(n);
    },
    flush(n) {
      t.size && (e = /* @__PURE__ */ new Set(), vt -= t.size, cf(t, (r) => r(n) && e.add(r)), vt += e.size, t = e);
    }
  };
}
function cf(e, t) {
  e.forEach((n) => {
    try {
      t(n);
    } catch (r) {
      Z.catch(r);
    }
  });
}
var Gv = Object.defineProperty, Bv = (e, t) => {
  for (var n in t)
    Gv(e, n, { get: t[n], enumerable: !0 });
}, Le = {};
Bv(Le, {
  assign: () => Hv,
  colors: () => wt,
  createStringInterpolator: () => Ei,
  skipAnimation: () => ff,
  to: () => uf,
  willAdvance: () => Si
});
function No() {
}
var qv = (e, t, n) => Object.defineProperty(e, t, { value: n, writable: !0, configurable: !0 }), T = {
  arr: Array.isArray,
  obj: (e) => !!e && e.constructor.name === "Object",
  fun: (e) => typeof e == "function",
  str: (e) => typeof e == "string",
  num: (e) => typeof e == "number",
  und: (e) => e === void 0
};
function tt(e, t) {
  if (T.arr(e)) {
    if (!T.arr(t) || e.length !== t.length) return !1;
    for (let n = 0; n < e.length; n++)
      if (e[n] !== t[n]) return !1;
    return !0;
  }
  return e === t;
}
var ne = (e, t) => e.forEach(t);
function Ke(e, t, n) {
  if (T.arr(e)) {
    for (let r = 0; r < e.length; r++)
      t.call(n, e[r], `${r}`);
    return;
  }
  for (const r in e)
    e.hasOwnProperty(r) && t.call(n, e[r], r);
}
var Te = (e) => T.und(e) ? [] : T.arr(e) ? e : [e];
function kn(e, t) {
  if (e.size) {
    const n = Array.from(e);
    e.clear(), ne(n, t);
  }
}
var xn = (e, ...t) => kn(e, (n) => n(...t)), wi = () => typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), Ei, uf, wt = null, ff = !1, Si = No, Hv = (e) => {
  e.to && (uf = e.to), e.now && (Z.now = e.now), e.colors !== void 0 && (wt = e.colors), e.skipAnimation != null && (ff = e.skipAnimation), e.createStringInterpolator && (Ei = e.createStringInterpolator), e.requestAnimationFrame && Z.use(e.requestAnimationFrame), e.batchedUpdates && (Z.batchedUpdates = e.batchedUpdates), e.willAdvance && (Si = e.willAdvance), e.frameLoop && (Z.frameLoop = e.frameLoop);
}, On = /* @__PURE__ */ new Set(), De = [], ja = [], kr = 0, Br = {
  get idle() {
    return !On.size && !De.length;
  },
  /** Advance the given animation on every frame until idle. */
  start(e) {
    kr > e.priority ? (On.add(e), Z.onStart(Xv)) : (df(e), Z(Ro));
  },
  /** Advance all animations by the given time. */
  advance: Ro,
  /** Call this when an animation's priority changes. */
  sort(e) {
    if (kr)
      Z.onFrame(() => Br.sort(e));
    else {
      const t = De.indexOf(e);
      ~t && (De.splice(t, 1), mf(e));
    }
  },
  /**
   * Clear all animations. For testing purposes.
   *
   * ☠️ Never call this from within the frameloop.
   */
  clear() {
    De = [], On.clear();
  }
};
function Xv() {
  On.forEach(df), On.clear(), Z(Ro);
}
function df(e) {
  De.includes(e) || mf(e);
}
function mf(e) {
  De.splice(
    Kv(De, (t) => t.priority > e.priority),
    0,
    e
  );
}
function Ro(e) {
  const t = ja;
  for (let n = 0; n < De.length; n++) {
    const r = De[n];
    kr = r.priority, r.idle || (Si(r), r.advance(e), r.idle || t.push(r));
  }
  return kr = 0, ja = De, ja.length = 0, De = t, De.length > 0;
}
function Kv(e, t) {
  const n = e.findIndex(t);
  return n < 0 ? e.length : n;
}
var Qv = {
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
}, ze = "[-+]?\\d*\\.?\\d+", Or = ze + "%";
function qr(...e) {
  return "\\(\\s*(" + e.join(")\\s*,\\s*(") + ")\\s*\\)";
}
var Zv = new RegExp("rgb" + qr(ze, ze, ze)), Jv = new RegExp("rgba" + qr(ze, ze, ze, ze)), e0 = new RegExp("hsl" + qr(ze, Or, Or)), t0 = new RegExp(
  "hsla" + qr(ze, Or, Or, ze)
), n0 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, r0 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, a0 = /^#([0-9a-fA-F]{6})$/, o0 = /^#([0-9a-fA-F]{8})$/;
function i0(e) {
  let t;
  return typeof e == "number" ? e >>> 0 === e && e >= 0 && e <= 4294967295 ? e : null : (t = a0.exec(e)) ? parseInt(t[1] + "ff", 16) >>> 0 : wt && wt[e] !== void 0 ? wt[e] : (t = Zv.exec(e)) ? (Ut(t[1]) << 24 | // r
  Ut(t[2]) << 16 | // g
  Ut(t[3]) << 8 | // b
  255) >>> // a
  0 : (t = Jv.exec(e)) ? (Ut(t[1]) << 24 | // r
  Ut(t[2]) << 16 | // g
  Ut(t[3]) << 8 | // b
  Ol(t[4])) >>> // a
  0 : (t = n0.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    "ff",
    // a
    16
  ) >>> 0 : (t = o0.exec(e)) ? parseInt(t[1], 16) >>> 0 : (t = r0.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    t[4] + t[4],
    // a
    16
  ) >>> 0 : (t = e0.exec(e)) ? (Pl(
    kl(t[1]),
    // h
    cr(t[2]),
    // s
    cr(t[3])
    // l
  ) | 255) >>> // a
  0 : (t = t0.exec(e)) ? (Pl(
    kl(t[1]),
    // h
    cr(t[2]),
    // s
    cr(t[3])
    // l
  ) | Ol(t[4])) >>> // a
  0 : null;
}
function za(e, t, n) {
  return n < 0 && (n += 1), n > 1 && (n -= 1), n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function Pl(e, t, n) {
  const r = n < 0.5 ? n * (1 + t) : n + t - n * t, a = 2 * n - r, o = za(a, r, e + 1 / 3), i = za(a, r, e), s = za(a, r, e - 1 / 3);
  return Math.round(o * 255) << 24 | Math.round(i * 255) << 16 | Math.round(s * 255) << 8;
}
function Ut(e) {
  const t = parseInt(e, 10);
  return t < 0 ? 0 : t > 255 ? 255 : t;
}
function kl(e) {
  return (parseFloat(e) % 360 + 360) % 360 / 360;
}
function Ol(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 1 ? 255 : Math.round(t * 255);
}
function cr(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 100 ? 1 : t / 100;
}
function Cl(e) {
  let t = i0(e);
  if (t === null) return e;
  t = t || 0;
  const n = (t & 4278190080) >>> 24, r = (t & 16711680) >>> 16, a = (t & 65280) >>> 8, o = (t & 255) / 255;
  return `rgba(${n}, ${r}, ${a}, ${o})`;
}
var jn = (e, t, n) => {
  if (T.fun(e))
    return e;
  if (T.arr(e))
    return jn({
      range: e,
      output: t,
      extrapolate: n
    });
  if (T.str(e.output[0]))
    return Ei(e);
  const r = e, a = r.output, o = r.range || [0, 1], i = r.extrapolateLeft || r.extrapolate || "extend", s = r.extrapolateRight || r.extrapolate || "extend", c = r.easing || ((l) => l);
  return (l) => {
    const u = l0(l, o);
    return s0(
      l,
      o[u],
      o[u + 1],
      a[u],
      a[u + 1],
      c,
      i,
      s,
      r.map
    );
  };
};
function s0(e, t, n, r, a, o, i, s, c) {
  let l = c ? c(e) : e;
  if (l < t) {
    if (i === "identity") return l;
    i === "clamp" && (l = t);
  }
  if (l > n) {
    if (s === "identity") return l;
    s === "clamp" && (l = n);
  }
  return r === a ? r : t === n ? e <= t ? r : a : (t === -1 / 0 ? l = -l : n === 1 / 0 ? l = l - t : l = (l - t) / (n - t), l = o(l), r === -1 / 0 ? l = -l : a === 1 / 0 ? l = l + r : l = l * (a - r) + r, l);
}
function l0(e, t) {
  for (var n = 1; n < t.length - 1 && !(t[n] >= e); ++n)
    ;
  return n - 1;
}
var c0 = {
  linear: (e) => e
}, zn = Symbol.for("FluidValue.get"), rn = Symbol.for("FluidValue.observers"), Fe = (e) => !!(e && e[zn]), _e = (e) => e && e[zn] ? e[zn]() : e, Tl = (e) => e[rn] || null;
function u0(e, t) {
  e.eventObserved ? e.eventObserved(t) : e(t);
}
function Ln(e, t) {
  const n = e[rn];
  n && n.forEach((r) => {
    u0(r, t);
  });
}
var pf = class {
  constructor(e) {
    if (!e && !(e = this.get))
      throw Error("Unknown getter");
    f0(this, e);
  }
}, f0 = (e, t) => hf(e, zn, t);
function cn(e, t) {
  if (e[zn]) {
    let n = e[rn];
    n || hf(e, rn, n = /* @__PURE__ */ new Set()), n.has(t) || (n.add(t), e.observerAdded && e.observerAdded(n.size, t));
  }
  return t;
}
function $n(e, t) {
  const n = e[rn];
  if (n && n.has(t)) {
    const r = n.size - 1;
    r ? n.delete(t) : e[rn] = null, e.observerRemoved && e.observerRemoved(r, t);
  }
}
var hf = (e, t, n) => Object.defineProperty(e, t, {
  value: n,
  writable: !0,
  configurable: !0
}), gr = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, d0 = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi, _l = new RegExp(`(${gr.source})(%|[a-z]+)`, "i"), m0 = /rgba\(([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+)\)/gi, Hr = /var\((--[a-zA-Z0-9-_]+),? ?([a-zA-Z0-9 ()%#.,-]+)?\)/, gf = (e) => {
  const [t, n] = p0(e);
  if (!t || wi())
    return e;
  const r = window.getComputedStyle(document.documentElement).getPropertyValue(t);
  if (r)
    return r.trim();
  if (n && n.startsWith("--")) {
    const a = window.getComputedStyle(document.documentElement).getPropertyValue(n);
    return a || e;
  } else {
    if (n && Hr.test(n))
      return gf(n);
    if (n)
      return n;
  }
  return e;
}, p0 = (e) => {
  const t = Hr.exec(e);
  if (!t) return [,];
  const [, n, r] = t;
  return [n, r];
}, La, h0 = (e, t, n, r, a) => `rgba(${Math.round(t)}, ${Math.round(n)}, ${Math.round(r)}, ${a})`, yf = (e) => {
  La || (La = wt ? (
    // match color names, ignore partial matches
    new RegExp(`(${Object.keys(wt).join("|")})(?!\\w)`, "g")
  ) : (
    // never match
    /^\b$/
  ));
  const t = e.output.map((o) => _e(o).replace(Hr, gf).replace(d0, Cl).replace(La, Cl)), n = t.map((o) => o.match(gr).map(Number)), a = n[0].map(
    (o, i) => n.map((s) => {
      if (!(i in s))
        throw Error('The arity of each "output" value must be equal');
      return s[i];
    })
  ).map(
    (o) => jn({ ...e, output: o })
  );
  return (o) => {
    var c;
    const i = !_l.test(t[0]) && ((c = t.find((l) => _l.test(l))) == null ? void 0 : c.replace(gr, ""));
    let s = 0;
    return t[0].replace(
      gr,
      () => `${a[s++](o)}${i || ""}`
    ).replace(m0, h0);
  };
}, Ai = "react-spring: ", bf = (e) => {
  const t = e;
  let n = !1;
  if (typeof t != "function")
    throw new TypeError(`${Ai}once requires a function parameter`);
  return (...r) => {
    n || (t(...r), n = !0);
  };
}, g0 = bf(console.warn);
function y0() {
  g0(
    `${Ai}The "interpolate" function is deprecated in v9 (use "to" instead)`
  );
}
var b0 = bf(console.warn);
function v0() {
  b0(
    `${Ai}Directly calling start instead of using the api object is deprecated in v9 (use ".start" instead), this will be removed in later 0.X.0 versions`
  );
}
function Xr(e) {
  return T.str(e) && (e[0] == "#" || /\d/.test(e) || // Do not identify a CSS variable as an AnimatedString if its SSR
  !wi() && Hr.test(e) || e in (wt || {}));
}
var qt = wi() ? Ae : Xf, x0 = () => {
  const e = Ee(!1);
  return qt(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
};
function vf() {
  const e = yt()[1], t = x0();
  return () => {
    t.current && e(Math.random());
  };
}
var xf = (e) => Ae(e, w0), w0 = [];
function E0(e) {
  const t = Ee(void 0);
  return Ae(() => {
    t.current = e;
  }), t.current;
}
var Wn = Symbol.for("Animated:node"), S0 = (e) => !!e && e[Wn] === e, Ue = (e) => e && e[Wn], Pi = (e, t) => qv(e, Wn, t), Kr = (e) => e && e[Wn] && e[Wn].getPayload(), wf = class {
  constructor() {
    Pi(this, this);
  }
  /** Get every `AnimatedValue` used by this node. */
  getPayload() {
    return this.payload || [];
  }
}, Qr = class Ef extends wf {
  constructor(t) {
    super(), this._value = t, this.done = !0, this.durationProgress = 0, T.num(this._value) && (this.lastPosition = this._value);
  }
  /** @internal */
  static create(t) {
    return new Ef(t);
  }
  getPayload() {
    return [this];
  }
  getValue() {
    return this._value;
  }
  setValue(t, n) {
    return T.num(t) && (this.lastPosition = t, n && (t = Math.round(t / n) * n, this.done && (this.lastPosition = t))), this._value === t ? !1 : (this._value = t, !0);
  }
  reset() {
    const { done: t } = this;
    this.done = !1, T.num(this._value) && (this.elapsedTime = 0, this.durationProgress = 0, this.lastPosition = this._value, t && (this.lastVelocity = null), this.v0 = null);
  }
}, Cr = class Sf extends Qr {
  constructor(t) {
    super(0), this._string = null, this._toString = jn({
      output: [t, t]
    });
  }
  /** @internal */
  static create(t) {
    return new Sf(t);
  }
  getValue() {
    const t = this._string;
    return t ?? (this._string = this._toString(this._value));
  }
  setValue(t) {
    if (T.str(t)) {
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
    t && (this._toString = jn({
      output: [this.getValue(), t]
    })), this._value = 0, super.reset();
  }
}, Tr = { dependencies: null }, Zr = class extends wf {
  constructor(e) {
    super(), this.source = e, this.setValue(e);
  }
  getValue(e) {
    const t = {};
    return Ke(this.source, (n, r) => {
      S0(n) ? t[r] = n.getValue(e) : Fe(n) ? t[r] = _e(n) : e || (t[r] = n);
    }), t;
  }
  /** Replace the raw object data */
  setValue(e) {
    this.source = e, this.payload = this._makePayload(e);
  }
  reset() {
    this.payload && ne(this.payload, (e) => e.reset());
  }
  /** Create a payload set. */
  _makePayload(e) {
    if (e) {
      const t = /* @__PURE__ */ new Set();
      return Ke(e, this._addToPayload, t), Array.from(t);
    }
  }
  /** Add to a payload set. */
  _addToPayload(e) {
    Tr.dependencies && Fe(e) && Tr.dependencies.add(e);
    const t = Kr(e);
    t && ne(t, (n) => this.add(n));
  }
}, A0 = class Af extends Zr {
  constructor(t) {
    super(t);
  }
  /** @internal */
  static create(t) {
    return new Af(t);
  }
  getValue() {
    return this.source.map((t) => t.getValue());
  }
  setValue(t) {
    const n = this.getPayload();
    return t.length == n.length ? n.map((r, a) => r.setValue(t[a])).some(Boolean) : (super.setValue(t.map(P0)), !0);
  }
};
function P0(e) {
  return (Xr(e) ? Cr : Qr).create(e);
}
function Mo(e) {
  const t = Ue(e);
  return t ? t.constructor : T.arr(e) ? A0 : Xr(e) ? Cr : Qr;
}
var Il = (e, t) => {
  const n = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !T.fun(e) || e.prototype && e.prototype.isReactComponent
  );
  return Kf((r, a) => {
    const o = Ee(null), i = n && // eslint-disable-next-line react-hooks/rules-of-hooks
    Qf(
      (v) => {
        o.current = C0(a, v);
      },
      [a]
    ), [s, c] = O0(r, t), l = vf(), u = () => {
      const v = o.current;
      if (n && !v)
        return;
      (v ? t.applyAnimatedValues(v, s.getValue(!0)) : !1) === !1 && l();
    }, f = new k0(u, c), d = Ee(void 0);
    qt(() => (d.current = f, ne(c, (v) => cn(v, f)), () => {
      d.current && (ne(
        d.current.deps,
        (v) => $n(v, d.current)
      ), Z.cancel(d.current.update));
    })), Ae(u, []), xf(() => () => {
      const v = d.current;
      ne(v.deps, (m) => $n(m, v));
    });
    const y = t.getComponentProps(s.getValue());
    return /* @__PURE__ */ S.createElement(e, { ...y, ref: i });
  });
}, k0 = class {
  constructor(e, t) {
    this.update = e, this.deps = t;
  }
  eventObserved(e) {
    e.type == "change" && Z.write(this.update);
  }
};
function O0(e, t) {
  const n = /* @__PURE__ */ new Set();
  return Tr.dependencies = n, e.style && (e = {
    ...e,
    style: t.createAnimatedStyle(e.style)
  }), e = new Zr(e), Tr.dependencies = null, [e, n];
}
function C0(e, t) {
  return e && (T.fun(e) ? e(t) : e.current = t), t;
}
var Nl = Symbol.for("AnimatedComponent"), T0 = (e, {
  applyAnimatedValues: t = () => !1,
  createAnimatedStyle: n = (a) => new Zr(a),
  getComponentProps: r = (a) => a
} = {}) => {
  const a = {
    applyAnimatedValues: t,
    createAnimatedStyle: n,
    getComponentProps: r
  }, o = (i) => {
    const s = Rl(i) || "Anonymous";
    return T.str(i) ? i = o[i] || (o[i] = Il(i, a)) : i = i[Nl] || (i[Nl] = Il(i, a)), i.displayName = `Animated(${s})`, i;
  };
  return Ke(e, (i, s) => {
    T.arr(e) && (s = Rl(i)), o[s] = o(i);
  }), {
    animated: o
  };
}, Rl = (e) => T.str(e) ? e : e && T.str(e.displayName) ? e.displayName : T.fun(e) && e.name || null;
function Ie(e, ...t) {
  return T.fun(e) ? e(...t) : e;
}
var Cn = (e, t) => e === !0 || !!(t && e && (T.fun(e) ? e(t) : Te(e).includes(t))), Pf = (e, t) => T.obj(e) ? t && e[t] : e, kf = (e, t) => e.default === !0 ? e[t] : e.default ? e.default[t] : void 0, _0 = (e) => e, ki = (e, t = _0) => {
  let n = I0;
  e.default && e.default !== !0 && (e = e.default, n = Object.keys(e));
  const r = {};
  for (const a of n) {
    const o = t(e[a], a);
    T.und(o) || (r[a] = o);
  }
  return r;
}, I0 = [
  "config",
  "onProps",
  "onStart",
  "onChange",
  "onPause",
  "onResume",
  "onRest"
], N0 = {
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
function R0(e) {
  const t = {};
  let n = 0;
  if (Ke(e, (r, a) => {
    N0[a] || (t[a] = r, n++);
  }), n)
    return t;
}
function Oi(e) {
  const t = R0(e);
  if (t) {
    const n = { to: t };
    return Ke(e, (r, a) => a in t || (n[a] = r)), n;
  }
  return { ...e };
}
function Un(e) {
  return e = _e(e), T.arr(e) ? e.map(Un) : Xr(e) ? Le.createStringInterpolator({
    range: [0, 1],
    output: [e, e]
  })(1) : e;
}
function M0(e) {
  for (const t in e) return !0;
  return !1;
}
function Fo(e) {
  return T.fun(e) || T.arr(e) && T.obj(e[0]);
}
function Ml(e, t) {
  var n;
  (n = e.ref) == null || n.delete(e), t == null || t.delete(e);
}
function F0(e, t) {
  var n;
  t && e.ref !== t && ((n = e.ref) == null || n.delete(e), t.add(e), e.ref = t);
}
var D0 = {
  default: { tension: 170, friction: 26 }
}, Do = {
  ...D0.default,
  mass: 1,
  damping: 1,
  easing: c0.linear,
  clamp: !1
}, j0 = class {
  constructor() {
    this.velocity = 0, Object.assign(this, Do);
  }
};
function z0(e, t, n) {
  n && (n = { ...n }, Fl(n, t), t = { ...n, ...t }), Fl(e, t), Object.assign(e, t);
  for (const i in Do)
    e[i] == null && (e[i] = Do[i]);
  let { frequency: r, damping: a } = e;
  const { mass: o } = e;
  return T.und(r) || (r < 0.01 && (r = 0.01), a < 0 && (a = 0), e.tension = Math.pow(2 * Math.PI / r, 2) * o, e.friction = 4 * Math.PI * a * o / r), e;
}
function Fl(e, t) {
  if (!T.und(t.decay))
    e.duration = void 0;
  else {
    const n = !T.und(t.tension) || !T.und(t.friction);
    (n || !T.und(t.frequency) || !T.und(t.damping) || !T.und(t.mass)) && (e.duration = void 0, e.decay = void 0), n && (e.frequency = void 0);
  }
}
var Dl = [], L0 = class {
  constructor() {
    this.changed = !1, this.values = Dl, this.toValues = null, this.fromValues = Dl, this.config = new j0(), this.immediate = !1;
  }
};
function Of(e, { key: t, props: n, defaultProps: r, state: a, actions: o }) {
  return new Promise((i, s) => {
    let c, l, u = Cn(n.cancel ?? (r == null ? void 0 : r.cancel), t);
    if (u)
      y();
    else {
      T.und(n.pause) || (a.paused = Cn(n.pause, t));
      let v = r == null ? void 0 : r.pause;
      v !== !0 && (v = a.paused || Cn(v, t)), c = Ie(n.delay || 0, t), v ? (a.resumeQueue.add(d), o.pause()) : (o.resume(), d());
    }
    function f() {
      a.resumeQueue.add(d), a.timeouts.delete(l), l.cancel(), c = l.time - Z.now();
    }
    function d() {
      c > 0 && !Le.skipAnimation ? (a.delayed = !0, l = Z.setTimeout(y, c), a.pauseQueue.add(f), a.timeouts.add(l)) : y();
    }
    function y() {
      a.delayed && (a.delayed = !1), a.pauseQueue.delete(f), a.timeouts.delete(l), e <= (a.cancelId || 0) && (u = !0);
      try {
        o.start({ ...n, callId: e, cancel: u }, i);
      } catch (v) {
        s(v);
      }
    }
  });
}
var Ci = (e, t) => t.length == 1 ? t[0] : t.some((n) => n.cancelled) ? en(e.get()) : t.every((n) => n.noop) ? Cf(e.get()) : je(
  e.get(),
  t.every((n) => n.finished)
), Cf = (e) => ({
  value: e,
  noop: !0,
  finished: !0,
  cancelled: !1
}), je = (e, t, n = !1) => ({
  value: e,
  finished: t,
  cancelled: n
}), en = (e) => ({
  value: e,
  cancelled: !0,
  finished: !1
});
function Tf(e, t, n, r) {
  const { callId: a, parentId: o, onRest: i } = t, { asyncTo: s, promise: c } = n;
  return !o && e === s && !t.reset ? c : n.promise = (async () => {
    n.asyncId = a, n.asyncTo = e;
    const l = ki(
      t,
      (p, b) => (
        // The `onRest` prop is only called when the `runAsync` promise is resolved.
        b === "onRest" ? void 0 : p
      )
    );
    let u, f;
    const d = new Promise(
      (p, b) => (u = p, f = b)
    ), y = (p) => {
      const b = (
        // The `cancel` prop or `stop` method was used.
        a <= (n.cancelId || 0) && en(r) || // The async `to` prop was replaced.
        a !== n.asyncId && je(r, !1)
      );
      if (b)
        throw p.result = b, f(p), p;
    }, v = (p, b) => {
      const A = new jl(), w = new zl();
      return (async () => {
        if (Le.skipAnimation)
          throw Vn(n), w.result = je(r, !1), f(w), w;
        y(A);
        const P = T.obj(p) ? { ...p } : { ...b, to: p };
        P.parentId = a, Ke(l, (H, j) => {
          T.und(P[j]) && (P[j] = H);
        });
        const h = await r.start(P);
        return y(A), n.paused && await new Promise((H) => {
          n.resumeQueue.add(H);
        }), h;
      })();
    };
    let m;
    if (Le.skipAnimation)
      return Vn(n), je(r, !1);
    try {
      let p;
      T.arr(e) ? p = (async (b) => {
        for (const A of b)
          await v(A);
      })(e) : p = Promise.resolve(e(v, r.stop.bind(r))), await Promise.all([p.then(u), d]), m = je(r.get(), !0, !1);
    } catch (p) {
      if (p instanceof jl)
        m = p.result;
      else if (p instanceof zl)
        m = p.result;
      else
        throw p;
    } finally {
      a == n.asyncId && (n.asyncId = o, n.asyncTo = o ? s : void 0, n.promise = o ? c : void 0);
    }
    return T.fun(i) && Z.batchedUpdates(() => {
      i(m, r, r.item);
    }), m;
  })();
}
function Vn(e, t) {
  kn(e.timeouts, (n) => n.cancel()), e.pauseQueue.clear(), e.resumeQueue.clear(), e.asyncId = e.asyncTo = e.promise = void 0, t && (e.cancelId = t);
}
var jl = class extends Error {
  constructor() {
    super(
      "An async animation has been interrupted. You see this error because you forgot to use `await` or `.catch(...)` on its returned promise."
    );
  }
}, zl = class extends Error {
  constructor() {
    super("SkipAnimationSignal");
  }
}, jo = (e) => e instanceof Ti, $0 = 1, Ti = class extends pf {
  constructor() {
    super(...arguments), this.id = $0++, this._priority = 0;
  }
  get priority() {
    return this._priority;
  }
  set priority(e) {
    this._priority != e && (this._priority = e, this._onPriorityChange(e));
  }
  /** Get the current value */
  get() {
    const e = Ue(this);
    return e && e.getValue();
  }
  /** Create a spring that maps our value to another value */
  to(...e) {
    return Le.to(this, e);
  }
  /** @deprecated Use the `to` method instead. */
  interpolate(...e) {
    return y0(), Le.to(this, e);
  }
  toJSON() {
    return this.get();
  }
  observerAdded(e) {
    e == 1 && this._attach();
  }
  observerRemoved(e) {
    e == 0 && this._detach();
  }
  /** Called when the first child is added. */
  _attach() {
  }
  /** Called when the last child is removed. */
  _detach() {
  }
  /** Tell our children about our new value */
  _onChange(e, t = !1) {
    Ln(this, {
      type: "change",
      parent: this,
      value: e,
      idle: t
    });
  }
  /** Tell our children about our new priority */
  _onPriorityChange(e) {
    this.idle || Br.sort(this), Ln(this, {
      type: "priority",
      parent: this,
      priority: e
    });
  }
}, Dt = Symbol.for("SpringPhase"), _f = 1, If = 2, Nf = 4, $a = (e) => (e[Dt] & _f) > 0, pt = (e) => (e[Dt] & If) > 0, pn = (e) => (e[Dt] & Nf) > 0, Ll = (e, t) => t ? e[Dt] |= If | _f : e[Dt] &= -3, $l = (e, t) => t ? e[Dt] |= Nf : e[Dt] &= -5, W0 = class extends Ti {
  constructor(e, t) {
    if (super(), this.animation = new L0(), this.defaultProps = {}, this._state = {
      paused: !1,
      delayed: !1,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    }, this._pendingCalls = /* @__PURE__ */ new Set(), this._lastCallId = 0, this._lastToId = 0, this._memoizedDuration = 0, !T.und(e) || !T.und(t)) {
      const n = T.obj(e) ? { ...e } : { ...t, from: e };
      T.und(n.default) && (n.default = !0), this.start(n);
    }
  }
  /** Equals true when not advancing on each frame. */
  get idle() {
    return !(pt(this) || this._state.asyncTo) || pn(this);
  }
  get goal() {
    return _e(this.animation.to);
  }
  get velocity() {
    const e = Ue(this);
    return e instanceof Qr ? e.lastVelocity || 0 : e.getPayload().map((t) => t.lastVelocity || 0);
  }
  /**
   * When true, this value has been animated at least once.
   */
  get hasAnimated() {
    return $a(this);
  }
  /**
   * When true, this value has an unfinished animation,
   * which is either active or paused.
   */
  get isAnimating() {
    return pt(this);
  }
  /**
   * When true, all current and future animations are paused.
   */
  get isPaused() {
    return pn(this);
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
    const { config: o } = r, i = Kr(r.to);
    !i && Fe(r.to) && (a = Te(_e(r.to))), r.values.forEach((l, u) => {
      if (l.done) return;
      const f = (
        // Animated strings always go from 0 to 1.
        l.constructor == Cr ? 1 : i ? i[u].lastPosition : a[u]
      );
      let d = r.immediate, y = f;
      if (!d) {
        if (y = l.lastPosition, o.tension <= 0) {
          l.done = !0;
          return;
        }
        let v = l.elapsedTime += e;
        const m = r.fromValues[u], p = l.v0 != null ? l.v0 : l.v0 = T.arr(o.velocity) ? o.velocity[u] : o.velocity;
        let b;
        const A = o.precision || (m == f ? 5e-3 : Math.min(1, Math.abs(f - m) * 1e-3));
        if (T.und(o.duration))
          if (o.decay) {
            const w = o.decay === !0 ? 0.998 : o.decay, P = Math.exp(-(1 - w) * v);
            y = m + p / (1 - w) * (1 - P), d = Math.abs(l.lastPosition - y) <= A, b = p * P;
          } else {
            b = l.lastVelocity == null ? p : l.lastVelocity;
            const w = o.restVelocity || A / 10, P = o.clamp ? 0 : o.bounce, h = !T.und(P), H = m == f ? l.v0 > 0 : m < f;
            let j, K = !1;
            const J = 1, oe = Math.ceil(e / J);
            for (let le = 0; le < oe && (j = Math.abs(b) > w, !(!j && (d = Math.abs(f - y) <= A, d))); ++le) {
              h && (K = y == f || y > f == H, K && (b = -b * P, y = f));
              const U = -o.tension * 1e-6 * (y - f), ge = -o.friction * 1e-3 * b, $ = (U + ge) / o.mass;
              b = b + $ * J, y = y + b * J;
            }
          }
        else {
          let w = 1;
          o.duration > 0 && (this._memoizedDuration !== o.duration && (this._memoizedDuration = o.duration, l.durationProgress > 0 && (l.elapsedTime = o.duration * l.durationProgress, v = l.elapsedTime += e)), w = (o.progress || 0) + v / this._memoizedDuration, w = w > 1 ? 1 : w < 0 ? 0 : w, l.durationProgress = w), y = m + o.easing(w) * (f - m), b = (y - l.lastPosition) / e, d = w == 1;
        }
        l.lastVelocity = b, Number.isNaN(y) && (console.warn("Got NaN while animating:", this), d = !0);
      }
      i && !i[u].done && (d = !1), d ? l.done = !0 : t = !1, l.setValue(y, o.round) && (n = !0);
    });
    const s = Ue(this), c = s.getValue();
    if (t) {
      const l = _e(r.to);
      (c !== l || n) && !o.decay ? (s.setValue(l), this._onChange(l)) : n && o.decay && this._onChange(c), this._stop();
    } else n && this._onChange(c);
  }
  /** Set the current value, while stopping the current animation */
  set(e) {
    return Z.batchedUpdates(() => {
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
    if (pt(this)) {
      const { to: e, config: t } = this.animation;
      Z.batchedUpdates(() => {
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
    return T.und(e) ? (n = this.queue || [], this.queue = []) : n = [T.obj(e) ? e : { ...t, to: e }], Promise.all(
      n.map((r) => this._update(r))
    ).then((r) => Ci(this, r));
  }
  /**
   * Stop the current animation, and cancel any delayed updates.
   *
   * Pass `true` to call `onRest` with `cancelled: true`.
   */
  stop(e) {
    const { to: t } = this.animation;
    return this._focus(this.get()), Vn(this._state, e && this._lastCallId), Z.batchedUpdates(() => this._stop(t, e)), this;
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
    n = T.obj(n) ? n[t] : n, (n == null || Fo(n)) && (n = void 0), r = T.obj(r) ? r[t] : r, r == null && (r = void 0);
    const a = { to: n, from: r };
    return $a(this) || (e.reverse && ([n, r] = [r, n]), r = _e(r), T.und(r) ? Ue(this) || this._set(n) : this._set(r)), a;
  }
  /** Every update is processed by this method before merging. */
  _update({ ...e }, t) {
    const { key: n, defaultProps: r } = this;
    e.default && Object.assign(
      r,
      ki(
        e,
        (i, s) => /^on/.test(s) ? Pf(i, n) : i
      )
    ), Ul(this, e, "onProps"), gn(this, "onProps", e, this);
    const a = this._prepareNode(e);
    if (Object.isFrozen(this))
      throw Error(
        "Cannot animate a `SpringValue` object that is frozen. Did you forget to pass your component to `animated(...)` before animating its props?"
      );
    const o = this._state;
    return Of(++this._lastCallId, {
      key: n,
      props: e,
      defaultProps: r,
      state: o,
      actions: {
        pause: () => {
          pn(this) || ($l(this, !0), xn(o.pauseQueue), gn(
            this,
            "onPause",
            je(this, hn(this, this.animation.to)),
            this
          ));
        },
        resume: () => {
          pn(this) && ($l(this, !1), pt(this) && this._resume(), xn(o.resumeQueue), gn(
            this,
            "onResume",
            je(this, hn(this, this.animation.to)),
            this
          ));
        },
        start: this._merge.bind(this, a)
      }
    }).then((i) => {
      if (e.loop && i.finished && !(t && i.noop)) {
        const s = Rf(e);
        if (s)
          return this._update(s, !0);
      }
      return i;
    });
  }
  /** Merge props into the current animation */
  _merge(e, t, n) {
    if (t.cancel)
      return this.stop(!0), n(en(this));
    const r = !T.und(e.to), a = !T.und(e.from);
    if (r || a)
      if (t.callId > this._lastToId)
        this._lastToId = t.callId;
      else
        return n(en(this));
    const { key: o, defaultProps: i, animation: s } = this, { to: c, from: l } = s;
    let { to: u = c, from: f = l } = e;
    a && !r && (!t.default || T.und(u)) && (u = f), t.reverse && ([u, f] = [f, u]);
    const d = !tt(f, l);
    d && (s.from = f), f = _e(f);
    const y = !tt(u, c);
    y && this._focus(u);
    const v = Fo(t.to), { config: m } = s, { decay: p, velocity: b } = m;
    (r || a) && (m.velocity = 0), t.config && !v && z0(
      m,
      Ie(t.config, o),
      // Avoid calling the same "config" prop twice.
      t.config !== i.config ? Ie(i.config, o) : void 0
    );
    let A = Ue(this);
    if (!A || T.und(u))
      return n(je(this, !0));
    const w = (
      // When `reset` is undefined, the `from` prop implies `reset: true`,
      // except for declarative updates. When `reset` is defined, there
      // must exist a value to animate from.
      T.und(t.reset) ? a && !t.default : !T.und(f) && Cn(t.reset, o)
    ), P = w ? f : this.get(), h = Un(u), H = T.num(h) || T.arr(h) || Xr(h), j = !v && (!H || Cn(i.immediate || t.immediate, o));
    if (y) {
      const le = Mo(u);
      if (le !== A.constructor)
        if (j)
          A = this._set(h);
        else
          throw Error(
            `Cannot animate between ${A.constructor.name} and ${le.name}, as the "to" prop suggests`
          );
    }
    const K = A.constructor;
    let J = Fe(u), oe = !1;
    if (!J) {
      const le = w || !$a(this) && d;
      (y || le) && (oe = tt(Un(P), h), J = !oe), (!tt(s.immediate, j) && !j || !tt(m.decay, p) || !tt(m.velocity, b)) && (J = !0);
    }
    if (oe && pt(this) && (s.changed && !w ? J = !0 : J || this._stop(c)), !v && ((J || Fe(c)) && (s.values = A.getPayload(), s.toValues = Fe(u) ? null : K == Cr ? [1] : Te(h)), s.immediate != j && (s.immediate = j, !j && !w && this._set(c)), J)) {
      const { onRest: le } = s;
      ne(U0, (ge) => Ul(this, t, ge));
      const U = je(this, hn(this, c));
      xn(this._pendingCalls, U), this._pendingCalls.add(n), s.changed && Z.batchedUpdates(() => {
        var ge;
        s.changed = !w, le == null || le(U, this), w ? Ie(i.onRest, U) : (ge = s.onStart) == null || ge.call(s, U, this);
      });
    }
    w && this._set(P), v ? n(Tf(t.to, t, this._state, this)) : J ? this._start() : pt(this) && !y ? this._pendingCalls.add(n) : n(Cf(P));
  }
  /** Update the `animation.to` value, which might be a `FluidValue` */
  _focus(e) {
    const t = this.animation;
    e !== t.to && (Tl(this) && this._detach(), t.to = e, Tl(this) && this._attach());
  }
  _attach() {
    let e = 0;
    const { to: t } = this.animation;
    Fe(t) && (cn(t, this), jo(t) && (e = t.priority + 1)), this.priority = e;
  }
  _detach() {
    const { to: e } = this.animation;
    Fe(e) && $n(e, this);
  }
  /**
   * Update the current value from outside the frameloop,
   * and return the `Animated` node.
   */
  _set(e, t = !0) {
    const n = _e(e);
    if (!T.und(n)) {
      const r = Ue(this);
      if (!r || !tt(n, r.getValue())) {
        const a = Mo(n);
        !r || r.constructor != a ? Pi(this, a.create(n)) : r.setValue(n), r && Z.batchedUpdates(() => {
          this._onChange(n, t);
        });
      }
    }
    return Ue(this);
  }
  _onStart() {
    const e = this.animation;
    e.changed || (e.changed = !0, gn(
      this,
      "onStart",
      je(this, hn(this, e.to)),
      this
    ));
  }
  _onChange(e, t) {
    t || (this._onStart(), Ie(this.animation.onChange, e, this)), Ie(this.defaultProps.onChange, e, this), super._onChange(e, t);
  }
  // This method resets the animation state (even if already animating) to
  // ensure the latest from/to range is used, and it also ensures this spring
  // is added to the frameloop.
  _start() {
    const e = this.animation;
    Ue(this).reset(_e(e.to)), e.immediate || (e.fromValues = e.values.map((t) => t.lastPosition)), pt(this) || (Ll(this, !0), pn(this) || this._resume());
  }
  _resume() {
    Le.skipAnimation ? this.finish() : Br.start(this);
  }
  /**
   * Exit the frameloop and notify `onRest` listeners.
   *
   * Always wrap `_stop` calls with `batchedUpdates`.
   */
  _stop(e, t) {
    if (pt(this)) {
      Ll(this, !1);
      const n = this.animation;
      ne(n.values, (a) => {
        a.done = !0;
      }), n.toValues && (n.onChange = n.onPause = n.onResume = void 0), Ln(this, {
        type: "idle",
        parent: this
      });
      const r = t ? en(this.get()) : je(this.get(), hn(this, e ?? n.to));
      xn(this._pendingCalls, r), n.changed && (n.changed = !1, gn(this, "onRest", r, this));
    }
  }
};
function hn(e, t) {
  const n = Un(t), r = Un(e.get());
  return tt(r, n);
}
function Rf(e, t = e.loop, n = e.to) {
  const r = Ie(t);
  if (r) {
    const a = r !== !0 && Oi(r), o = (a || e).reverse, i = !a || a.reset;
    return _r({
      ...e,
      loop: t,
      // Avoid updating default props when looping.
      default: !1,
      // Never loop the `pause` prop.
      pause: void 0,
      // For the "reverse" prop to loop as expected, the "to" prop
      // must be undefined. The "reverse" prop is ignored when the
      // "to" prop is an array or function.
      to: !o || Fo(n) ? n : void 0,
      // Ignore the "from" prop except on reset.
      from: i ? e.from : void 0,
      reset: i,
      // The "loop" prop can return a "useSpring" props object to
      // override any of the original props.
      ...a
    });
  }
}
function _r(e) {
  const { to: t, from: n } = e = Oi(e), r = /* @__PURE__ */ new Set();
  return T.obj(t) && Wl(t, r), T.obj(n) && Wl(n, r), e.keys = r.size ? Array.from(r) : null, e;
}
function Wl(e, t) {
  Ke(e, (n, r) => n != null && t.add(r));
}
var U0 = [
  "onStart",
  "onRest",
  "onChange",
  "onPause",
  "onResume"
];
function Ul(e, t, n) {
  e.animation[n] = t[n] !== kf(t, n) ? Pf(t[n], e.key) : void 0;
}
function gn(e, t, ...n) {
  var r, a, o, i;
  (a = (r = e.animation)[t]) == null || a.call(r, ...n), (i = (o = e.defaultProps)[t]) == null || i.call(o, ...n);
}
var V0 = ["onStart", "onChange", "onRest"], Y0 = 1, G0 = class {
  constructor(e, t) {
    this.id = Y0++, this.springs = {}, this.queue = [], this._lastAsyncId = 0, this._active = /* @__PURE__ */ new Set(), this._changed = /* @__PURE__ */ new Set(), this._started = !1, this._state = {
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
      T.und(n) || this.springs[t].set(n);
    }
  }
  /** Push an update onto the queue of each value. */
  update(e) {
    return e && this.queue.push(_r(e)), this;
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
    return e ? t = Te(e).map(_r) : this.queue = [], this._flush ? this._flush(this, t) : (jf(this, t), B0(this, t));
  }
  /** @internal */
  stop(e, t) {
    if (e !== !!e && (t = e), t) {
      const n = this.springs;
      ne(Te(t), (r) => n[r].stop(!!e));
    } else
      Vn(this._state, this._lastAsyncId), this.each((n) => n.stop(!!e));
    return this;
  }
  /** Freeze the active animation in time */
  pause(e) {
    if (T.und(e))
      this.start({ pause: !0 });
    else {
      const t = this.springs;
      ne(Te(e), (n) => t[n].pause());
    }
    return this;
  }
  /** Resume the animation if paused. */
  resume(e) {
    if (T.und(e))
      this.start({ pause: !1 });
    else {
      const t = this.springs;
      ne(Te(e), (n) => t[n].resume());
    }
    return this;
  }
  /** Call a function once per spring value */
  each(e) {
    Ke(this.springs, e);
  }
  /** @internal Called at the end of every animation frame */
  _onFrame() {
    const { onStart: e, onChange: t, onRest: n } = this._events, r = this._active.size > 0, a = this._changed.size > 0;
    (r && !this._started || a && !this._started) && (this._started = !0, kn(e, ([s, c]) => {
      c.value = this.get(), s(c, this, this._item);
    }));
    const o = !r && this._started, i = a || o && n.size ? this.get() : null;
    a && t.size && kn(t, ([s, c]) => {
      c.value = i, s(c, this, this._item);
    }), o && (this._started = !1, kn(n, ([s, c]) => {
      c.value = i, s(c, this, this._item);
    }));
  }
  /** @internal */
  eventObserved(e) {
    if (e.type == "change")
      this._changed.add(e.parent), e.idle || this._active.add(e.parent);
    else if (e.type == "idle")
      this._active.delete(e.parent);
    else return;
    Z.onFrame(this._onFrame);
  }
};
function B0(e, t) {
  return Promise.all(t.map((n) => Mf(e, n))).then(
    (n) => Ci(e, n)
  );
}
async function Mf(e, t, n) {
  const { keys: r, to: a, from: o, loop: i, onRest: s, onResolve: c } = t, l = T.obj(t.default) && t.default;
  i && (t.loop = !1), a === !1 && (t.to = null), o === !1 && (t.from = null);
  const u = T.arr(a) || T.fun(a) ? a : void 0;
  u ? (t.to = void 0, t.onRest = void 0, l && (l.onRest = void 0)) : ne(V0, (m) => {
    const p = t[m];
    if (T.fun(p)) {
      const b = e._events[m];
      t[m] = ({ finished: A, cancelled: w }) => {
        const P = b.get(p);
        P ? (A || (P.finished = !1), w && (P.cancelled = !0)) : b.set(p, {
          value: null,
          finished: A || !1,
          cancelled: w || !1
        });
      }, l && (l[m] = t[m]);
    }
  });
  const f = e._state;
  t.pause === !f.paused ? (f.paused = t.pause, xn(t.pause ? f.pauseQueue : f.resumeQueue)) : f.paused && (t.pause = !0);
  const d = (r || Object.keys(e.springs)).map(
    (m) => e.springs[m].start(t)
  ), y = t.cancel === !0 || kf(t, "cancel") === !0;
  (u || y && f.asyncId) && d.push(
    Of(++e._lastAsyncId, {
      props: t,
      state: f,
      actions: {
        pause: No,
        resume: No,
        start(m, p) {
          y ? (Vn(f, e._lastAsyncId), p(en(e))) : (m.onRest = s, p(
            Tf(
              u,
              m,
              f,
              e
            )
          ));
        }
      }
    })
  ), f.paused && await new Promise((m) => {
    f.resumeQueue.add(m);
  });
  const v = Ci(e, await Promise.all(d));
  if (i && v.finished && !(n && v.noop)) {
    const m = Rf(t, i, a);
    if (m)
      return jf(e, [m]), Mf(e, m, !0);
  }
  return c && Z.batchedUpdates(() => c(v, e, e.item)), v;
}
function q0(e, t) {
  const n = { ...e.springs };
  return t && ne(Te(t), (r) => {
    T.und(r.keys) && (r = _r(r)), T.obj(r.to) || (r = { ...r, to: void 0 }), Df(n, r, (a) => Ff(a));
  }), H0(e, n), n;
}
function H0(e, t) {
  Ke(t, (n, r) => {
    e.springs[r] || (e.springs[r] = n, cn(n, e));
  });
}
function Ff(e, t) {
  const n = new W0();
  return n.key = e, t && cn(n, t), n;
}
function Df(e, t, n) {
  t.keys && ne(t.keys, (r) => {
    (e[r] || (e[r] = n(r)))._prepareNode(t);
  });
}
function jf(e, t) {
  ne(t, (n) => {
    Df(e.springs, n, (r) => Ff(r, e));
  });
}
var X0 = S.createContext({
  pause: !1,
  immediate: !1
}), K0 = () => {
  const e = [], t = function(r) {
    v0();
    const a = [];
    return ne(e, (o, i) => {
      if (T.und(r))
        a.push(o.start());
      else {
        const s = n(r, o, i);
        s && a.push(o.start(s));
      }
    }), a;
  };
  t.current = e, t.add = function(r) {
    e.includes(r) || e.push(r);
  }, t.delete = function(r) {
    const a = e.indexOf(r);
    ~a && e.splice(a, 1);
  }, t.pause = function() {
    return ne(e, (r) => r.pause(...arguments)), this;
  }, t.resume = function() {
    return ne(e, (r) => r.resume(...arguments)), this;
  }, t.set = function(r) {
    ne(e, (a, o) => {
      const i = T.fun(r) ? r(o, a) : r;
      i && a.set(i);
    });
  }, t.start = function(r) {
    const a = [];
    return ne(e, (o, i) => {
      if (T.und(r))
        a.push(o.start());
      else {
        const s = this._getProps(r, o, i);
        s && a.push(o.start(s));
      }
    }), a;
  }, t.stop = function() {
    return ne(e, (r) => r.stop(...arguments)), this;
  }, t.update = function(r) {
    return ne(e, (a, o) => a.update(this._getProps(r, a, o))), this;
  };
  const n = function(r, a, o) {
    return T.fun(r) ? r(o, a) : r;
  };
  return t._getProps = n, t;
};
function Vl(e, t, n) {
  const r = T.fun(t) && t, {
    reset: a,
    sort: o,
    trail: i = 0,
    expires: s = !0,
    exitBeforeEnter: c = !1,
    onDestroyed: l,
    ref: u,
    config: f
  } = r ? r() : t, d = Zf(
    () => r || arguments.length == 3 ? K0() : void 0,
    []
  ), y = Te(e), v = [], m = Ee(null), p = a ? null : m.current;
  qt(() => {
    m.current = v;
  }), xf(() => (ne(v, ($) => {
    d == null || d.add($.ctrl), $.ctrl.ref = d;
  }), () => {
    ne(m.current, ($) => {
      $.expired && clearTimeout($.expirationId), Ml($.ctrl, d), $.ctrl.stop(!0);
    });
  }));
  const b = Z0(y, r ? r() : t, p), A = a && m.current || [];
  qt(
    () => ne(A, ({ ctrl: $, item: k, key: L }) => {
      Ml($, d), Ie(l, k, L);
    })
  );
  const w = [];
  if (p && ne(p, ($, k) => {
    $.expired ? (clearTimeout($.expirationId), A.push($)) : (k = w[k] = b.indexOf($.key), ~k && (v[k] = $));
  }), ne(y, ($, k) => {
    v[k] || (v[k] = {
      key: b[k],
      item: $,
      phase: "mount",
      ctrl: new G0()
    }, v[k].ctrl.item = $);
  }), w.length) {
    let $ = -1;
    const { leave: k } = r ? r() : t;
    ne(w, (L, Q) => {
      const B = p[Q];
      ~L ? ($ = v.indexOf(B), v[$] = { ...B, item: y[L] }) : k && v.splice(++$, 0, B);
    });
  }
  T.fun(o) && v.sort(($, k) => o($.item, k.item));
  let P = -i;
  const h = vf(), H = ki(t), j = /* @__PURE__ */ new Map(), K = Ee(/* @__PURE__ */ new Map()), J = Ee(!1);
  ne(v, ($, k) => {
    const L = $.key, Q = $.phase, B = r ? r() : t;
    let ie, g;
    const x = Ie(B.delay || 0, L);
    if (Q == "mount")
      ie = B.enter, g = "enter";
    else {
      const F = b.indexOf(L) < 0;
      if (Q != "leave")
        if (F)
          ie = B.leave, g = "leave";
        else if (ie = B.update)
          g = "update";
        else return;
      else if (!F)
        ie = B.enter, g = "enter";
      else return;
    }
    if (ie = Ie(ie, $.item, k), ie = T.obj(ie) ? Oi(ie) : { to: ie }, !ie.config) {
      const F = f || H.config;
      ie.config = Ie(F, $.item, k, g);
    }
    P += i;
    const _ = {
      ...H,
      // we need to add our props.delay value you here.
      delay: x + P,
      ref: u,
      immediate: B.immediate,
      // This prevents implied resets.
      reset: !1,
      // Merge any phase-specific props.
      ...ie
    };
    if (g == "enter" && T.und(_.from)) {
      const F = r ? r() : t, R = T.und(F.initial) || p ? F.from : F.initial;
      _.from = Ie(R, $.item, k);
    }
    const { onResolve: D } = _;
    _.onResolve = (F) => {
      Ie(D, F);
      const R = m.current, N = R.find((z) => z.key === L);
      if (N && !(F.cancelled && N.phase != "update") && N.ctrl.idle) {
        const z = R.every((M) => M.ctrl.idle);
        if (N.phase == "leave") {
          const M = Ie(s, N.item);
          if (M !== !1) {
            const W = M === !0 ? 0 : M;
            if (N.expired = !0, !z && W > 0) {
              W <= 2147483647 && (N.expirationId = setTimeout(h, W));
              return;
            }
          }
        }
        z && R.some((M) => M.expired) && (K.current.delete(N), c && (J.current = !0), h());
      }
    };
    const I = q0($.ctrl, _);
    g === "leave" && c ? K.current.set($, { phase: g, springs: I, payload: _ }) : j.set($, { phase: g, springs: I, payload: _ });
  });
  const oe = ql(X0), le = E0(oe), U = oe !== le && M0(oe);
  qt(() => {
    U && ne(v, ($) => {
      $.ctrl.start({ default: oe });
    });
  }, [oe]), ne(j, ($, k) => {
    if (K.current.size) {
      const L = v.findIndex((Q) => Q.key === k.key);
      v.splice(L, 1);
    }
  }), qt(
    () => {
      ne(
        K.current.size ? K.current : j,
        ({ phase: $, payload: k }, L) => {
          const { ctrl: Q } = L;
          L.phase = $, d == null || d.add(Q), U && $ == "enter" && Q.start({ default: oe }), k && (F0(Q, k.ref), (Q.ref || d) && !J.current ? Q.update(k) : (Q.start(k), J.current && (J.current = !1)));
        }
      );
    },
    a ? void 0 : n
  );
  const ge = ($) => /* @__PURE__ */ S.createElement(S.Fragment, null, v.map((k, L) => {
    const { springs: Q } = j.get(k) || k.ctrl, B = $({ ...Q }, k.item, k, L);
    return B && B.type ? /* @__PURE__ */ S.createElement(
      B.type,
      {
        ...B.props,
        key: T.str(k.key) || T.num(k.key) ? k.key : k.ctrl.id,
        ref: B.ref
      }
    ) : B;
  }));
  return d ? [ge, d] : ge;
}
var Q0 = 1;
function Z0(e, { key: t, keys: n = t }, r) {
  if (n === null) {
    const a = /* @__PURE__ */ new Set();
    return e.map((o) => {
      const i = r && r.find(
        (s) => s.item === o && s.phase !== "leave" && !a.has(s)
      );
      return i ? (a.add(i), i.key) : Q0++;
    });
  }
  return T.und(n) ? e : T.fun(n) ? e.map(n) : Te(n);
}
var J0 = class extends Ti {
  constructor(e, t) {
    super(), this.source = e, this.idle = !0, this._active = /* @__PURE__ */ new Set(), this.calc = jn(...t);
    const n = this._get(), r = Mo(n);
    Pi(this, r.create(n));
  }
  advance(e) {
    const t = this._get(), n = this.get();
    tt(t, n) || (Ue(this).setValue(t), this._onChange(t, this.idle)), !this.idle && Yl(this._active) && Wa(this);
  }
  _get() {
    const e = T.arr(this.source) ? this.source.map(_e) : Te(_e(this.source));
    return this.calc(...e);
  }
  _start() {
    this.idle && !Yl(this._active) && (this.idle = !1, ne(Kr(this), (e) => {
      e.done = !1;
    }), Le.skipAnimation ? (Z.batchedUpdates(() => this.advance()), Wa(this)) : Br.start(this));
  }
  // Observe our sources only when we're observed.
  _attach() {
    let e = 1;
    ne(Te(this.source), (t) => {
      Fe(t) && cn(t, this), jo(t) && (t.idle || this._active.add(t), e = Math.max(e, t.priority + 1));
    }), this.priority = e, this._start();
  }
  // Stop observing our sources once we have no observers.
  _detach() {
    ne(Te(this.source), (e) => {
      Fe(e) && $n(e, this);
    }), this._active.clear(), Wa(this);
  }
  /** @internal */
  eventObserved(e) {
    e.type == "change" ? e.idle ? this.advance() : (this._active.add(e.parent), this._start()) : e.type == "idle" ? this._active.delete(e.parent) : e.type == "priority" && (this.priority = Te(this.source).reduce(
      (t, n) => Math.max(t, (jo(n) ? n.priority : 0) + 1),
      0
    ));
  }
};
function e1(e) {
  return e.idle !== !1;
}
function Yl(e) {
  return !e.size || Array.from(e).every(e1);
}
function Wa(e) {
  e.idle || (e.idle = !0, ne(Kr(e), (t) => {
    t.done = !0;
  }), Ln(e, {
    type: "idle",
    parent: e
  }));
}
Le.assign({
  createStringInterpolator: yf,
  to: (e, t) => new J0(e, t)
});
var zf = /^--/;
function t1(e, t) {
  return t == null || typeof t == "boolean" || t === "" ? "" : typeof t == "number" && t !== 0 && !zf.test(e) && !(Tn.hasOwnProperty(e) && Tn[e]) ? t + "px" : ("" + t).trim();
}
var Gl = {};
function n1(e, t) {
  if (!e.nodeType || !e.setAttribute)
    return !1;
  const n = e.nodeName === "filter" || e.parentNode && e.parentNode.nodeName === "filter", {
    className: r,
    style: a,
    children: o,
    scrollTop: i,
    scrollLeft: s,
    viewBox: c,
    ...l
  } = t, u = Object.values(l), f = Object.keys(l).map(
    (d) => n || e.hasAttribute(d) ? d : Gl[d] || (Gl[d] = d.replace(
      /([A-Z])/g,
      // Attributes are written in dash case
      (y) => "-" + y.toLowerCase()
    ))
  );
  o !== void 0 && (e.textContent = o);
  for (const d in a)
    if (a.hasOwnProperty(d)) {
      const y = t1(d, a[d]);
      zf.test(d) ? e.style.setProperty(d, y) : e.style[d] = y;
    }
  f.forEach((d, y) => {
    e.setAttribute(d, u[y]);
  }), r !== void 0 && (e.className = r), i !== void 0 && (e.scrollTop = i), s !== void 0 && (e.scrollLeft = s), c !== void 0 && e.setAttribute("viewBox", c);
}
var Tn = {
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
}, r1 = (e, t) => e + t.charAt(0).toUpperCase() + t.substring(1), a1 = ["Webkit", "Ms", "Moz", "O"];
Tn = Object.keys(Tn).reduce((e, t) => (a1.forEach((n) => e[r1(n, t)] = e[t]), e), Tn);
var o1 = /^(matrix|translate|scale|rotate|skew)/, i1 = /^(translate)/, s1 = /^(rotate|skew)/, Ua = (e, t) => T.num(e) && e !== 0 ? e + t : e, yr = (e, t) => T.arr(e) ? e.every((n) => yr(n, t)) : T.num(e) ? e === t : parseFloat(e) === t, l1 = class extends Zr {
  constructor({ x: e, y: t, z: n, ...r }) {
    const a = [], o = [];
    (e || t || n) && (a.push([e || 0, t || 0, n || 0]), o.push((i) => [
      `translate3d(${i.map((s) => Ua(s, "px")).join(",")})`,
      // prettier-ignore
      yr(i, 0)
    ])), Ke(r, (i, s) => {
      if (s === "transform")
        a.push([i || ""]), o.push((c) => [c, c === ""]);
      else if (o1.test(s)) {
        if (delete r[s], T.und(i)) return;
        const c = i1.test(s) ? "px" : s1.test(s) ? "deg" : "";
        a.push(Te(i)), o.push(
          s === "rotate3d" ? ([l, u, f, d]) => [
            `rotate3d(${l},${u},${f},${Ua(d, c)})`,
            yr(d, 0)
          ] : (l) => [
            `${s}(${l.map((u) => Ua(u, c)).join(",")})`,
            yr(l, s.startsWith("scale") ? 1 : 0)
          ]
        );
      }
    }), a.length && (r.transform = new c1(a, o)), super(r);
  }
}, c1 = class extends pf {
  constructor(e, t) {
    super(), this.inputs = e, this.transforms = t, this._value = null;
  }
  get() {
    return this._value || (this._value = this._get());
  }
  _get() {
    let e = "", t = !0;
    return ne(this.inputs, (n, r) => {
      const a = _e(n[0]), [o, i] = this.transforms[r](
        T.arr(a) ? a : n.map(_e)
      );
      e += " " + o, t = t && i;
    }), t ? "none" : e;
  }
  // Start observing our inputs once we have an observer.
  observerAdded(e) {
    e == 1 && ne(
      this.inputs,
      (t) => ne(
        t,
        (n) => Fe(n) && cn(n, this)
      )
    );
  }
  // Stop observing our inputs once we have no observers.
  observerRemoved(e) {
    e == 0 && ne(
      this.inputs,
      (t) => ne(
        t,
        (n) => Fe(n) && $n(n, this)
      )
    );
  }
  eventObserved(e) {
    e.type == "change" && (this._value = null), Ln(this, e);
  }
}, u1 = [
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
Le.assign({
  batchedUpdates: nd,
  createStringInterpolator: yf,
  colors: Qv
});
var f1 = T0(u1, {
  applyAnimatedValues: n1,
  createAnimatedStyle: (e) => new l1(e),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentProps: ({ scrollTop: e, scrollLeft: t, ...n }) => n
}), Lf = f1.animated;
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const d1 = {
  prefix: "fas",
  iconName: "down-left-and-up-right-to-center",
  icon: [512, 512, ["compress-alt"], "f422", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8l-144 0c-13.3 0-24-10.7-24-24l0-144c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272l144 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z"]
}, m1 = {
  prefix: "fas",
  iconName: "up-right-and-down-left-from-center",
  icon: [512, 512, ["expand-alt"], "f424", "M344 0L488 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512L24 512c-13.3 0-24-10.7-24-24L0 344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"]
};
var zo = /* @__PURE__ */ ((e) => (e[e.NONE = 0] = "NONE", e[e.INPUT = 1] = "INPUT", e[e.PANEL = 2] = "PANEL", e[e.DIALOGUE = 3] = "DIALOGUE", e))(zo || {}), p1 = Object.freeze({
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
}), h1 = "VisuallyHidden", $f = S.forwardRef(
  (e, t) => /* @__PURE__ */ V(
    Qe.span,
    {
      ...e,
      ref: t,
      style: { ...p1, ...e.style }
    }
  )
);
$f.displayName = h1;
var Bl = $f;
const Yn = [], g1 = (e) => {
  Yn.push(e);
}, y1 = (e) => {
  const t = Yn.findIndex((n) => n.id === e);
  t !== -1 && Yn.splice(t, 1);
}, b1 = (e, t) => {
  const n = Yn.find((r) => r.id === e);
  n && Object.assign(n, t);
}, v1 = () => Yn.filter((e) => e.closeOnEsc).sort((e, t) => t.zIndex - e.zIndex)[0];
typeof window < "u" && !window.__modalEscListenerInstalled && (window.__modalEscListenerInstalled = !0, window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" && e.key !== "Esc") return;
  const t = v1();
  t && (e.preventDefault(), t.onClose());
}));
let yn = 70;
const x1 = ({
  styles: e,
  backdropClassName: t,
  disableHotkeyInput: n,
  enableHotkeyInput: r
}) => (Ae(() => (n(zo.DIALOGUE), () => {
  r(zo.DIALOGUE);
}), [n, r]), /* @__PURE__ */ V(zm, { forceMount: !0, asChild: !0, children: /* @__PURE__ */ V(
  Lf.div,
  {
    className: wn("fixed inset-0 z-[69]", t),
    style: {
      opacity: e.opacity,
      pointerEvents: "none",
      background: "radial-gradient(800px 400px at 10% -10%, rgba(45,129,255,0.10), transparent), radial-gradient(600px 320px at 110% 110%, rgba(28,182,190,0.10), transparent), rgba(0,0,0,0.60)"
    }
  }
) })), Lo = ({ children: e }) => /* @__PURE__ */ V(br, { children: e }), Wf = Jf(
  void 0
), _i = ({ className: e, size: t = "md" }) => {
  const n = ql(Wf);
  if (!n) return null;
  const { expanded: r, toggleExpanded: a } = n;
  return /* @__PURE__ */ V(
    "button",
    {
      type: "button",
      "aria-label": r ? "Restore modal size" : "Expand modal",
      onClick: a,
      className: wn(
        "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
        {
          sm: "h-5 w-5 text-sm",
          md: "h-7 w-7 text-md",
          lg: "h-9 w-9 text-xl"
        }[t],
        "relative z-[70]",
        e
      ),
      children: /* @__PURE__ */ V(
        Mn,
        {
          icon: r ? d1 : m1
        }
      )
    }
  );
};
_i.displayName = "ModalExpandButton";
const Jr = ({
  isOpen: e,
  title: t,
  titleIcon: n,
  onTitleIconClick: r,
  onClose: a,
  enableHotkeyInput: o = () => {
  },
  disableHotkeyInput: i = () => {
  },
  className: s,
  backdropClassName: c,
  width: l,
  children: u,
  childPadding: f = !0,
  titleIconClassName: d,
  showClose: y = !0,
  draggable: v = !1,
  resizable: m = !1,
  initialPosition: p,
  closeOnOutsideClick: b = !0,
  closeOnEsc: A = !0,
  allowBackgroundInteraction: w = !1,
  expandable: P = !1,
  accessibleTitle: h,
  accessibleDescription: H
}) => {
  const [j, K] = yt(
    null
  ), [J, oe] = yt(!1), [le, U] = yt(!1), ge = Ee({ x: 0, y: 0 }), $ = Ee({ x: 0, y: 0 }), k = Ee(null), L = Ee(null), Q = Ee(null), [B, ie] = yt(() => ++yn), [g, x] = yt(!1), _ = Ee(null), D = Vl(e, {
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
  }), I = Vl(e, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      tension: 280,
      friction: 25
    }
  });
  Ae(() => {
    g ? (L.current && (_.current = { ...L.current }), K({ x: 0, y: 0 }), L.current = { x: 0, y: 0 }, k.current && (k.current.style.left = "0px", k.current.style.top = "0px", k.current.style.margin = "0", k.current.style.position = "fixed", k.current.style.zIndex = String(B))) : _.current && (K({ ..._.current }), L.current = { ..._.current }, k.current && (k.current.style.left = _.current.x + "px", k.current.style.top = _.current.y + "px", k.current.style.margin = "0", k.current.style.position = "fixed", k.current.style.zIndex = String(B)));
  }, [g, B]);
  const F = () => x((q) => !q);
  Ae(() => {
    e ? Q.current ? (K({ ...Q.current }), L.current = { ...Q.current }, k.current && (k.current.style.left = Q.current.x + "px", k.current.style.top = Q.current.y + "px", k.current.style.margin = "0", k.current.style.position = "fixed", k.current.style.zIndex = String(B))) : p && (K({ ...p }), L.current = { ...p }, k.current && (k.current.style.left = p.x + "px", k.current.style.top = p.y + "px", k.current.style.margin = "0", k.current.style.position = "fixed", k.current.style.zIndex = String(B))) : L.current && (Q.current = { ...L.current });
  }, [e, B]), Ae(() => {
    if (!J) return;
    let q = null;
    const X = (Ne) => {
      if (!k.current) return;
      const We = Ne.clientX - $.current.x, Oe = Ne.clientY - $.current.y, ue = ge.current.x + We, he = ge.current.y + Oe, Ce = k.current, { width: Ct, height: zt } = Ce.getBoundingClientRect(), ta = window.innerWidth, na = window.innerHeight, Ii = 450, Vf = -450, Yf = 0, Gf = ta - Ct + Ii, Bf = na - zt + Ii, qf = Math.max(Vf, Math.min(ue, Gf)), Hf = Math.max(Yf, Math.min(he, Bf));
      L.current = { x: qf, y: Hf }, k.current && (q && cancelAnimationFrame(q), q = requestAnimationFrame(() => {
        k.current && L.current && (k.current.style.left = L.current.x + "px", k.current.style.top = L.current.y + "px", k.current.style.margin = "0", k.current.style.position = "fixed", k.current.style.zIndex = String(B));
      }));
    }, se = () => {
      oe(!1), L.current && K({ ...L.current });
    };
    return window.addEventListener("mousemove", X), window.addEventListener("mouseup", se), () => {
      window.removeEventListener("mousemove", X), window.removeEventListener("mouseup", se), q && cancelAnimationFrame(q);
    };
  }, [J, B]);
  const R = (q) => {
    var Ce, Ct;
    if (!k.current) return;
    g && x(!1), q.preventDefault(), q.stopPropagation();
    const X = k.current, { width: se, height: Ne } = X.getBoundingClientRect(), We = window.innerWidth, Oe = window.innerHeight;
    let ue = ((Ce = L.current) == null ? void 0 : Ce.x) ?? (j == null ? void 0 : j.x), he = ((Ct = L.current) == null ? void 0 : Ct.y) ?? (j == null ? void 0 : j.y);
    (ue === void 0 || he === void 0) && (p ? (ue = p.x, he = p.y) : (ue = (We - se) / 2, he = (Oe - Ne) / 2)), ge.current = { x: ue, y: he }, $.current = { x: q.clientX, y: q.clientY }, oe(!0), !j && !L.current && (K({ x: ue, y: he }), L.current = { x: ue, y: he }, k.current && (k.current.style.left = ue + "px", k.current.style.top = he + "px", k.current.style.margin = "0", k.current.style.position = "fixed", k.current.style.zIndex = String(B)));
  };
  let N = u;
  if (v) {
    let q = !1;
    N = Array.isArray(u) ? u.map((X) => {
      if (!q && Ni(X) && (X.type === Lo || X.type.displayName === "ModalDragHandle")) {
        q = !0;
        const se = X;
        return Ri(se, {
          children: /* @__PURE__ */ V(
            "div",
            {
              style: { cursor: "move", userSelect: "none" },
              onMouseDown: R,
              children: se.props.children
            }
          )
        });
      }
      return X;
    }) : Ni(u) && (u.type === Lo || u.type.displayName === "ModalDragHandle") ? (() => {
      const X = u;
      return Ri(X, {
        children: /* @__PURE__ */ V(
          "div",
          {
            style: { cursor: "move", userSelect: "none" },
            onMouseDown: R,
            children: X.props.children
          }
        )
      });
    })() : u;
  }
  const z = Ee(null), M = Ee(null), W = (q, X) => {
    if (!k.current || (q.preventDefault(), q.stopPropagation(), g)) return;
    const se = k.current.getBoundingClientRect();
    z.current = X, M.current = {
      mouseX: q.clientX,
      mouseY: q.clientY,
      width: se.width,
      height: se.height,
      x: se.left,
      y: se.top
    }, U(!0);
  };
  Ae(() => {
    if (!le) return;
    let q = null;
    const X = (Ne) => {
      if (!k.current || !M.current || !z.current)
        return;
      const We = Ne.clientX - M.current.mouseX, Oe = Ne.clientY - M.current.mouseY;
      let ue = M.current.width, he = M.current.height, Ce = M.current.x, Ct = M.current.y;
      const zt = z.current, ta = 320, na = 240;
      zt.includes("right") && (ue = M.current.width + We), zt.includes("left") && (ue = M.current.width - We, Ce = M.current.x + We), zt.includes("bottom") && (he = M.current.height + Oe), zt.includes("top") && (he = M.current.height - Oe, Ct = M.current.y + Oe), ue = Math.max(ta, ue), he = Math.max(na, he), L.current = { x: Ce, y: Ct }, Se.current = { width: ue, height: he }, q && cancelAnimationFrame(q), q = requestAnimationFrame(() => {
        k.current && L.current && (k.current.style.width = ue + "px", k.current.style.height = he + "px", k.current.style.left = L.current.x + "px", k.current.style.top = L.current.y + "px", k.current.style.margin = "0", k.current.style.position = "fixed", k.current.style.zIndex = String(B));
      });
    }, se = () => {
      U(!1), L.current && K({ ...L.current }), Se.current && we({ ...Se.current });
    };
    return window.addEventListener("mousemove", X), window.addEventListener("mouseup", se), () => {
      window.removeEventListener("mousemove", X), window.removeEventListener("mouseup", se), q && cancelAnimationFrame(q);
    };
  }, [le, B]);
  const ce = () => {
    if (!m || g) return null;
    const q = "absolute z-[75] bg-transparent select-none", X = 5, se = 2, Ne = [
      { dir: "top", className: `top-0 left-0 w-full h-${se}` },
      { dir: "bottom", className: `bottom-0 left-0 w-full h-${se}` },
      { dir: "left", className: `left-0 top-0 h-full w-${se}` },
      { dir: "right", className: `right-0 top-0 h-full w-${se}` },
      {
        dir: "top-left",
        className: `top-0 left-0 w-${X} h-${X}`
      },
      {
        dir: "top-right",
        className: `top-0 right-0 w-${X} h-${X}`
      },
      {
        dir: "bottom-left",
        className: `bottom-0 left-0 w-${X} h-${X}`
      },
      {
        dir: "bottom-right",
        className: `bottom-0 right-0 w-${X} h-${X}`
      }
    ], We = {
      top: "n-resize",
      bottom: "s-resize",
      left: "w-resize",
      right: "e-resize",
      "top-left": "nw-resize",
      "top-right": "ne-resize",
      "bottom-left": "sw-resize",
      "bottom-right": "se-resize"
    };
    return Ne.map((Oe) => /* @__PURE__ */ V(
      "div",
      {
        className: `${q} ${Oe.className}`,
        style: { cursor: We[Oe.dir] },
        onMouseDown: (ue) => W(ue, Oe.dir)
      },
      Oe.dir
    ));
  }, [E, we] = yt(
    null
  ), Se = Ee(null), Ze = Ee(null);
  Ae(() => {
    if (e && !E && k.current && m) {
      const { width: q, height: X } = k.current.getBoundingClientRect();
      we({ width: q, height: X }), Se.current = { width: q, height: X };
    }
  }, [e, E, m]), Ae(() => {
    if (m) {
      if (!e)
        Se.current && (Ze.current = { ...Se.current });
      else if (Ze.current && k.current) {
        const { width: q, height: X } = Ze.current;
        k.current.style.width = q + "px", k.current.style.height = X + "px", we({ width: q, height: X }), Se.current = { width: q, height: X };
      }
    }
  }, [e, m]), Ae(() => {
    const q = () => {
      k.current && B < yn && (yn += 1, ie(yn), k.current.style.zIndex = String(yn));
    }, X = k.current;
    return X && X.addEventListener("mousedown", q), () => {
      X && X.removeEventListener("mousedown", q);
    };
  }, [B]), Ae(() => {
    if (!e || w) return;
    const q = (X) => {
      if (X.key === "Escape" || X.key === "Esc") return;
      const se = X.target;
      se && (se.closest(
        '[role="dialog"], [role="menu"], [role="listbox"], [data-headlessui-portal]'
      ) || se.matches("input, textarea, select, button, [contenteditable]")) || X.stopPropagation();
    };
    return window.addEventListener("keydown", q, !0), () => {
      window.removeEventListener("keydown", q, !0);
    };
  }, [e, w]), Ae(() => {
    if (!w) return;
    const q = k.current;
    if (!q) return;
    const X = (ue) => {
      ue && (ue.hasAttribute("inert") && ue.removeAttribute("inert"), ue.inert && (ue.inert = !1), ue.getAttribute("aria-hidden") === "true" && ue.removeAttribute("aria-hidden"));
    };
    let se = q;
    for (; se; )
      X(se), se = se.parentElement;
    const Ne = new MutationObserver((ue) => {
      ue.forEach((he) => {
        if (he.type === "attributes" && he.attributeName === "inert" && he.target instanceof HTMLElement) {
          const Ce = he.target;
          (Ce === q || q.contains(Ce)) && X(Ce);
        }
      });
    });
    Ne.observe(q, {
      attributes: !0,
      subtree: !1,
      attributeFilter: ["inert"]
    }), (() => {
      document.querySelectorAll(
        "[data-radix-portal][inert], [data-headlessui-portal][inert]"
      ).forEach((he) => he.removeAttribute("inert"));
    })();
    const Oe = new MutationObserver((ue) => {
      ue.forEach((he) => {
        if (he.type === "attributes" && he.attributeName === "inert" && he.target.hasAttribute("inert")) {
          const Ce = he.target;
          (Ce.hasAttribute("data-radix-portal") || Ce.hasAttribute("data-headlessui-portal")) && X(Ce);
        }
      });
    });
    return Oe.observe(document.body, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["inert"]
    }), () => {
      Ne.disconnect(), Oe.disconnect();
    };
  }, [w]);
  const ea = Ee(Math.floor(Math.random() * 1e9));
  Ae(() => {
    if (e)
      return g1({
        id: ea.current,
        zIndex: B,
        onClose: a,
        closeOnEsc: A
      }), () => {
        y1(ea.current);
      };
  }, [e]), Ae(() => {
    e && b1(ea.current, { zIndex: B, onClose: a, closeOnEsc: A });
  }, [e, B, a, A]);
  const Uf = () => g ? {
    position: "fixed",
    left: 0,
    top: 0,
    margin: 0,
    zIndex: B,
    width: "100vw",
    height: "100vh",
    ...w ? { pointerEvents: "auto" } : {}
  } : !v || !j ? {
    ...m && E ? { width: E.width, height: E.height } : {},
    ...w ? { pointerEvents: "auto" } : {}
  } : {
    position: "fixed",
    left: j.x,
    top: j.y,
    margin: 0,
    zIndex: B,
    ...m && E ? { width: E.width, height: E.height } : {},
    ...w ? { pointerEvents: "auto" } : {}
  };
  return /* @__PURE__ */ V(
    Dm,
    {
      open: e,
      onOpenChange: (q) => !q && b && a(),
      modal: !w,
      children: /* @__PURE__ */ V(jm, { children: /* @__PURE__ */ gt(
        "div",
        {
          className: "fixed inset-0 z-[70]",
          style: w ? { pointerEvents: "none" } : void 0,
          children: [
            !w && I(
              (q, X) => X ? /* @__PURE__ */ V(
                x1,
                {
                  styles: q,
                  backdropClassName: c,
                  disableHotkeyInput: i,
                  enableHotkeyInput: o
                },
                "backdrop"
              ) : null
            ),
            w && /* @__PURE__ */ V(
              "div",
              {
                className: wn("fixed inset-0 z-[69]", c),
                style: { pointerEvents: "none" }
              }
            ),
            /* @__PURE__ */ V(Wf.Provider, { value: { expanded: g, toggleExpanded: F }, children: /* @__PURE__ */ V(
              "div",
              {
                className: "flex min-h-full items-center justify-center p-4 text-center",
                style: w ? { pointerEvents: "none" } : void 0,
                children: D((q, X) => X ? /* @__PURE__ */ V(
                  Lm,
                  {
                    forceMount: !0,
                    asChild: !0,
                    ...H ? {} : { "aria-describedby": void 0 },
                    onPointerDownOutside: (se) => {
                      (!b || w) && se.preventDefault();
                    },
                    onEscapeKeyDown: (se) => {
                      A || se.preventDefault();
                    },
                    onInteractOutside: (se) => {
                      w && se.preventDefault();
                    },
                    children: /* @__PURE__ */ gt(
                      Lf.div,
                      {
                        className: wn(
                          "w-full max-w-lg rounded-xl relative border border-ui-panel-border bg-ui-modal text-left align-middle shadow-2xl z-[70]",
                          f && !g ? "p-4" : "",
                          s,
                          "!transition-none",
                          // Always disable CSS transitions for spring animations
                          g && "w-screen h-screen max-w-screen max-h-screen rounded-none"
                        ),
                        ref: k,
                        style: {
                          ...Uf(),
                          opacity: q.opacity,
                          transform: q.transform,
                          transformOrigin: "center center",
                          willChange: "transform, opacity"
                          // Optimize for animations
                        },
                        children: [
                          /* @__PURE__ */ gt("div", { className: "w-full h-full", children: [
                            H && /* @__PURE__ */ V(Bl, { asChild: !0, children: /* @__PURE__ */ V($m, { children: H }) }),
                            t ? /* @__PURE__ */ V(
                              qi,
                              {
                                className: wn(
                                  "mb-4 flex justify-between pb-0 text-xl font-bold text-base-fg"
                                ),
                                children: /* @__PURE__ */ V(br, { children: r ? /* @__PURE__ */ gt(
                                  "button",
                                  {
                                    className: "flex items-center gap-3",
                                    onClick: r,
                                    children: [
                                      n && /* @__PURE__ */ V(
                                        Mn,
                                        {
                                          icon: n,
                                          className: d
                                        }
                                      ),
                                      t
                                    ]
                                  }
                                ) : /* @__PURE__ */ gt("div", { className: "flex items-center gap-3", children: [
                                  n && /* @__PURE__ */ V(
                                    Mn,
                                    {
                                      icon: n,
                                      className: d
                                    }
                                  ),
                                  t
                                ] }) })
                              }
                            ) : /* @__PURE__ */ V(Bl, { asChild: !0, children: /* @__PURE__ */ V(qi, { children: h ?? "Dialog" }) }),
                            /* @__PURE__ */ V("div", { className: "h-full".trim(), children: N }),
                            ce()
                          ] }),
                          (y || P) && /* @__PURE__ */ gt("div", { className: "absolute top-0 right-0 m-2.5 z-[80] flex items-center gap-2", children: [
                            P && /* @__PURE__ */ V(Jr.ExpandButton, {}),
                            y && /* @__PURE__ */ V(Vv, { onClick: a })
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
Jr.DragHandle = Lo;
Jr.DragHandle.displayName = "ModalDragHandle";
Jr.ExpandButton = _i;
_i.displayName = "ModalExpandButton";
export {
  Jr as Modal
};
