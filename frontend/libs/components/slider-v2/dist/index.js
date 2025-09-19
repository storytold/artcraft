import { jsxs as He, jsx as H, Fragment as De } from "react/jsx-runtime";
import * as nt from "react";
import se, { useState as me, useEffect as lt, useLayoutEffect as Vo, useRef as le, forwardRef as Wo, useCallback as Ie, Fragment as $e, isValidElement as Ho, cloneElement as Yo, createElement as Uo, useContext as Ot, createContext as yr, useMemo as Mn } from "react";
var qo = Object.defineProperty, Bo = (e, t, r) => t in e ? qo(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, Tt = (e, t, r) => (Bo(e, typeof t != "symbol" ? t + "" : t, r), r);
let Ko = class {
  constructor() {
    Tt(this, "current", this.detect()), Tt(this, "handoffState", "pending"), Tt(this, "currentId", 0);
  }
  set(t) {
    this.current !== t && (this.handoffState = "pending", this.currentId = 0, this.current = t);
  }
  reset() {
    this.set(this.detect());
  }
  nextId() {
    return ++this.currentId;
  }
  get isServer() {
    return this.current === "server";
  }
  get isClient() {
    return this.current === "client";
  }
  detect() {
    return typeof window > "u" || typeof document > "u" ? "server" : "client";
  }
  handoff() {
    this.handoffState === "pending" && (this.handoffState = "complete");
  }
  get isHandoffComplete() {
    return this.handoffState === "complete";
  }
}, bt = new Ko();
function Xo(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function St() {
  let e = [], t = { addEventListener(r, n, o, a) {
    return r.addEventListener(n, o, a), t.add(() => r.removeEventListener(n, o, a));
  }, requestAnimationFrame(...r) {
    let n = requestAnimationFrame(...r);
    return t.add(() => cancelAnimationFrame(n));
  }, nextFrame(...r) {
    return t.requestAnimationFrame(() => t.requestAnimationFrame(...r));
  }, setTimeout(...r) {
    let n = setTimeout(...r);
    return t.add(() => clearTimeout(n));
  }, microTask(...r) {
    let n = { current: !0 };
    return Xo(() => {
      n.current && r[0]();
    }), t.add(() => {
      n.current = !1;
    });
  }, style(r, n, o) {
    let a = r.style.getPropertyValue(n);
    return Object.assign(r.style, { [n]: o }), this.add(() => {
      Object.assign(r.style, { [n]: a });
    });
  }, group(r) {
    let n = St();
    return r(n), this.add(() => n.dispose());
  }, add(r) {
    return e.includes(r) || e.push(r), () => {
      let n = e.indexOf(r);
      if (n >= 0) for (let o of e.splice(n, 1)) o();
    };
  }, dispose() {
    for (let r of e.splice(0)) r();
  } };
  return t;
}
function In() {
  let [e] = me(St);
  return lt(() => () => e.dispose(), [e]), e;
}
let Ne = (e, t) => {
  bt.isServer ? lt(e, t) : Vo(e, t);
};
function Tn(e) {
  let t = le(e);
  return Ne(() => {
    t.current = e;
  }, [e]), t;
}
let he = function(e) {
  let t = Tn(e);
  return se.useCallback((...r) => t.current(...r), [t]);
};
function Xt(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function At(e, t, ...r) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...r) : o;
  }
  let n = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(n, At), n;
}
var Rn = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(Rn || {}), Ce = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(Ce || {});
function $n() {
  let e = Zo();
  return Ie((t) => Jo({ mergeRefs: e, ...t }), [e]);
}
function Jo({ ourProps: e, theirProps: t, slot: r, defaultTag: n, features: o, visible: a = !0, name: s, mergeRefs: i }) {
  i = i ?? Qo;
  let l = Fn(t, e);
  if (a) return dt(l, r, n, s, i);
  let c = o ?? 0;
  if (c & 2) {
    let { static: u = !1, ...d } = l;
    if (u) return dt(d, r, n, s, i);
  }
  if (c & 1) {
    let { unmount: u = !0, ...d } = l;
    return At(u ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return dt({ ...d, hidden: !0, style: { display: "none" } }, r, n, s, i);
    } });
  }
  return dt(l, r, n, s, i);
}
function dt(e, t = {}, r, n, o) {
  let { as: a = r, children: s, refName: i = "ref", ...l } = Rt(e, ["unmount", "static"]), c = e.ref !== void 0 ? { [i]: e.ref } : {}, u = typeof s == "function" ? s(t) : s;
  "className" in l && l.className && typeof l.className == "function" && (l.className = l.className(t)), l["aria-labelledby"] && l["aria-labelledby"] === l.id && (l["aria-labelledby"] = void 0);
  let d = {};
  if (t) {
    let p = !1, y = [];
    for (let [v, m] of Object.entries(t)) typeof m == "boolean" && (p = !0), m === !0 && y.push(v.replace(/([A-Z])/g, (f) => `-${f.toLowerCase()}`));
    if (p) {
      d["data-headlessui-state"] = y.join(" ");
      for (let v of y) d[`data-${v}`] = "";
    }
  }
  if (a === $e && (Object.keys(Me(l)).length > 0 || Object.keys(Me(d)).length > 0)) if (!Ho(u) || Array.isArray(u) && u.length > 1) {
    if (Object.keys(Me(l)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${n} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(Me(l)).concat(Object.keys(Me(d))).map((p) => `  - ${p}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((p) => `  - ${p}`).join(`
`)].join(`
`));
  } else {
    let p = u.props, y = p == null ? void 0 : p.className, v = typeof y == "function" ? (...w) => Xt(y(...w), l.className) : Xt(y, l.className), m = v ? { className: v } : {}, f = Fn(u.props, Me(Rt(l, ["ref"])));
    for (let w in d) w in f && delete d[w];
    return Yo(u, Object.assign({}, f, d, c, { ref: o(ea(u), c.ref) }, m));
  }
  return Uo(a, Object.assign({}, Rt(l, ["ref"]), a !== $e && c, a !== $e && d), u);
}
function Zo() {
  let e = le([]), t = Ie((r) => {
    for (let n of e.current) n != null && (typeof n == "function" ? n(r) : n.current = r);
  }, []);
  return (...r) => {
    if (!r.every((n) => n == null)) return e.current = r, t;
  };
}
function Qo(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let r of e) r != null && (typeof r == "function" ? r(t) : r.current = t);
  };
}
function Fn(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, r = {};
  for (let n of e) for (let o in n) o.startsWith("on") && typeof n[o] == "function" ? (r[o] != null || (r[o] = []), r[o].push(n[o])) : t[o] = n[o];
  if (t.disabled || t["aria-disabled"]) for (let n in r) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(n) && (r[n] = [(o) => {
    var a;
    return (a = o == null ? void 0 : o.preventDefault) == null ? void 0 : a.call(o);
  }]);
  for (let n in r) Object.assign(t, { [n](o, ...a) {
    let s = r[n];
    for (let i of s) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      i(o, ...a);
    }
  } });
  return t;
}
function vr(e) {
  var t;
  return Object.assign(Wo(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function Me(e) {
  let t = Object.assign({}, e);
  for (let r in t) t[r] === void 0 && delete t[r];
  return t;
}
function Rt(e, t = []) {
  let r = Object.assign({}, e);
  for (let n of t) n in r && delete r[n];
  return r;
}
function ea(e) {
  return se.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let ta = Symbol();
function Ln(...e) {
  let t = le(e);
  lt(() => {
    t.current = e;
  }, [e]);
  let r = he((n) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(n) : o.current = n);
  });
  return e.every((n) => n == null || (n == null ? void 0 : n[ta])) ? void 0 : r;
}
function ra(e = 0) {
  let [t, r] = me(e), n = Ie((l) => r(l), [t]), o = Ie((l) => r((c) => c | l), [t]), a = Ie((l) => (t & l) === l, [t]), s = Ie((l) => r((c) => c & ~l), [r]), i = Ie((l) => r((c) => c ^ l), [r]);
  return { flags: t, setFlag: n, addFlag: o, hasFlag: a, removeFlag: s, toggleFlag: i };
}
var $r, Fr;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && (($r = process == null ? void 0 : process.env) == null ? void 0 : $r.NODE_ENV) === "test" && typeof ((Fr = Element == null ? void 0 : Element.prototype) == null ? void 0 : Fr.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var na = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(na || {});
function oa(e) {
  let t = {};
  for (let r in e) e[r] === !0 && (t[`data-${r}`] = "");
  return t;
}
function aa(e, t, r, n) {
  let [o, a] = me(r), { hasFlag: s, addFlag: i, removeFlag: l } = ra(e && o ? 3 : 0), c = le(!1), u = le(!1), d = In();
  return Ne(() => {
    var p;
    if (e) {
      if (r && a(!0), !t) {
        r && i(3);
        return;
      }
      return (p = n == null ? void 0 : n.start) == null || p.call(n, r), ia(t, { inFlight: c, prepare() {
        u.current ? u.current = !1 : u.current = c.current, c.current = !0, !u.current && (r ? (i(3), l(4)) : (i(4), l(2)));
      }, run() {
        u.current ? r ? (l(3), i(4)) : (l(4), i(3)) : r ? l(1) : i(1);
      }, done() {
        var y;
        u.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (c.current = !1, l(7), r || a(!1), (y = n == null ? void 0 : n.end) == null || y.call(n, r));
      } });
    }
  }, [e, r, t, d]), e ? [o, { closed: s(1), enter: s(2), leave: s(4), transition: s(2) || s(4) }] : [r, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function ia(e, { prepare: t, run: r, done: n, inFlight: o }) {
  let a = St();
  return la(e, { prepare: t, inFlight: o }), a.nextFrame(() => {
    r(), a.requestAnimationFrame(() => {
      a.add(sa(e, n));
    });
  }), a.dispose;
}
function sa(e, t) {
  var r, n;
  let o = St();
  if (!e) return o.dispose;
  let a = !1;
  o.add(() => {
    a = !0;
  });
  let s = (n = (r = e.getAnimations) == null ? void 0 : r.call(e).filter((i) => i instanceof CSSTransition)) != null ? n : [];
  return s.length === 0 ? (t(), o.dispose) : (Promise.allSettled(s.map((i) => i.finished)).then(() => {
    a || t();
  }), o.dispose);
}
function la(e, { inFlight: t, prepare: r }) {
  if (t != null && t.current) {
    r();
    return;
  }
  let n = e.style.transition;
  e.style.transition = "none", r(), e.offsetHeight, e.style.transition = n;
}
let xr = yr(null);
xr.displayName = "OpenClosedContext";
var Te = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(Te || {});
function Dn() {
  return Ot(xr);
}
function ca({ value: e, children: t }) {
  return se.createElement(xr.Provider, { value: e }, t);
}
function ua() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in nt ? ((t) => t.useSyncExternalStore)(nt)(() => () => {
  }, () => !1, () => !e) : !1;
}
function _n() {
  let e = ua(), [t, r] = nt.useState(bt.isHandoffComplete);
  return t && bt.isHandoffComplete === !1 && r(!1), nt.useEffect(() => {
    t !== !0 && r(!0);
  }, [t]), nt.useEffect(() => bt.handoff(), []), e ? !1 : t;
}
function fa() {
  let e = le(!1);
  return Ne(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function Gn(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : Wn) !== $e || se.Children.count(e.children) === 1;
}
let Et = yr(null);
Et.displayName = "TransitionContext";
var da = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(da || {});
function pa() {
  let e = Ot(Et);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function ma() {
  let e = Ot(Ct);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let Ct = yr(null);
Ct.displayName = "NestingContext";
function Nt(e) {
  return "children" in e ? Nt(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function Vn(e, t) {
  let r = Tn(e), n = le([]), o = fa(), a = In(), s = he((y, v = Ce.Hidden) => {
    let m = n.current.findIndex(({ el: f }) => f === y);
    m !== -1 && (At(v, { [Ce.Unmount]() {
      n.current.splice(m, 1);
    }, [Ce.Hidden]() {
      n.current[m].state = "hidden";
    } }), a.microTask(() => {
      var f;
      !Nt(n) && o.current && ((f = r.current) == null || f.call(r));
    }));
  }), i = he((y) => {
    let v = n.current.find(({ el: m }) => m === y);
    return v ? v.state !== "visible" && (v.state = "visible") : n.current.push({ el: y, state: "visible" }), () => s(y, Ce.Unmount);
  }), l = le([]), c = le(Promise.resolve()), u = le({ enter: [], leave: [] }), d = he((y, v, m) => {
    l.current.splice(0), t && (t.chains.current[v] = t.chains.current[v].filter(([f]) => f !== y)), t == null || t.chains.current[v].push([y, new Promise((f) => {
      l.current.push(f);
    })]), t == null || t.chains.current[v].push([y, new Promise((f) => {
      Promise.all(u.current[v].map(([w, O]) => O)).then(() => f());
    })]), v === "enter" ? c.current = c.current.then(() => t == null ? void 0 : t.wait.current).then(() => m(v)) : m(v);
  }), p = he((y, v, m) => {
    Promise.all(u.current[v].splice(0).map(([f, w]) => w)).then(() => {
      var f;
      (f = l.current.shift()) == null || f();
    }).then(() => m(v));
  });
  return Mn(() => ({ children: n, register: i, unregister: s, onStart: d, onStop: p, wait: c, chains: u }), [i, s, n, d, p, u, c]);
}
let Wn = $e, Hn = Rn.RenderStrategy;
function ga(e, t) {
  var r, n;
  let { transition: o = !0, beforeEnter: a, afterEnter: s, beforeLeave: i, afterLeave: l, enter: c, enterFrom: u, enterTo: d, entered: p, leave: y, leaveFrom: v, leaveTo: m, ...f } = e, [w, O] = me(null), S = le(null), C = Gn(e), g = Ln(...C ? [S, t, O] : t === null ? [] : [t]), Z = (r = f.unmount) == null || r ? Ce.Unmount : Ce.Hidden, { show: V, appear: ae, initial: te } = pa(), [U, ee] = me(V ? "visible" : "hidden"), A = ma(), { register: ne, unregister: Y } = A;
  Ne(() => ne(S), [ne, S]), Ne(() => {
    if (Z === Ce.Hidden && S.current) {
      if (V && U !== "visible") {
        ee("visible");
        return;
      }
      return At(U, { hidden: () => Y(S), visible: () => ne(S) });
    }
  }, [U, S, ne, Y, V, Z]);
  let ie = _n();
  Ne(() => {
    if (C && ie && U === "visible" && S.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [S, U, ie, C]);
  let q = te && !ae, W = ae && V && te, Q = le(!1), J = Vn(() => {
    Q.current || (ee("hidden"), Y(S));
  }, A), b = he((M) => {
    Q.current = !0;
    let $ = M ? "enter" : "leave";
    J.onStart(S, $, (L) => {
      L === "enter" ? a == null || a() : L === "leave" && (i == null || i());
    });
  }), x = he((M) => {
    let $ = M ? "enter" : "leave";
    Q.current = !1, J.onStop(S, $, (L) => {
      L === "enter" ? s == null || s() : L === "leave" && (l == null || l());
    }), $ === "leave" && !Nt(J) && (ee("hidden"), Y(S));
  });
  lt(() => {
    C && o || (b(V), x(V));
  }, [V, C, o]);
  let R = !(!o || !C || !ie || q), [, N] = aa(R, w, V, { start: b, end: x }), P = Me({ ref: g, className: ((n = Xt(f.className, W && c, W && u, N.enter && c, N.enter && N.closed && u, N.enter && !N.closed && d, N.leave && y, N.leave && !N.closed && v, N.leave && N.closed && m, !N.transition && V && p)) == null ? void 0 : n.trim()) || void 0, ...oa(N) }), T = 0;
  U === "visible" && (T |= Te.Open), U === "hidden" && (T |= Te.Closed), V && U === "hidden" && (T |= Te.Opening), !V && U === "visible" && (T |= Te.Closing);
  let I = $n();
  return se.createElement(Ct.Provider, { value: J }, se.createElement(ca, { value: T }, I({ ourProps: P, theirProps: f, defaultTag: Wn, features: Hn, visible: U === "visible", name: "Transition.Child" })));
}
function ba(e, t) {
  let { show: r, appear: n = !1, unmount: o = !0, ...a } = e, s = le(null), i = Gn(e), l = Ln(...i ? [s, t] : t === null ? [] : [t]);
  _n();
  let c = Dn();
  if (r === void 0 && c !== null && (r = (c & Te.Open) === Te.Open), r === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [u, d] = me(r ? "visible" : "hidden"), p = Vn(() => {
    r || d("hidden");
  }), [y, v] = me(!0), m = le([r]);
  Ne(() => {
    y !== !1 && m.current[m.current.length - 1] !== r && (m.current.push(r), v(!1));
  }, [m, r]);
  let f = Mn(() => ({ show: r, appear: n, initial: y }), [r, n, y]);
  Ne(() => {
    r ? d("visible") : !Nt(p) && s.current !== null && d("hidden");
  }, [r, p]);
  let w = { unmount: o }, O = he(() => {
    var g;
    y && v(!1), (g = e.beforeEnter) == null || g.call(e);
  }), S = he(() => {
    var g;
    y && v(!1), (g = e.beforeLeave) == null || g.call(e);
  }), C = $n();
  return se.createElement(Ct.Provider, { value: p }, se.createElement(Et.Provider, { value: f }, C({ ourProps: { ...w, as: $e, children: se.createElement(Yn, { ref: l, ...w, ...a, beforeEnter: O, beforeLeave: S }) }, theirProps: {}, defaultTag: $e, features: Hn, visible: u === "visible", name: "Transition" })));
}
function ha(e, t) {
  let r = Ot(Et) !== null, n = Dn() !== null;
  return se.createElement(se.Fragment, null, !r && n ? se.createElement(Jt, { ref: t, ...e }) : se.createElement(Yn, { ref: t, ...e }));
}
let Jt = vr(ba), Yn = vr(ga), ya = vr(ha), va = Object.assign(Jt, { Child: ya, Root: Jt });
const wr = "-", xa = (e) => {
  const t = ka(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (s) => {
      const i = s.split(wr);
      return i[0] === "" && i.length !== 1 && i.shift(), Un(i, t) || wa(s);
    },
    getConflictingClassGroupIds: (s, i) => {
      const l = r[s] || [];
      return i && n[s] ? [...l, ...n[s]] : l;
    }
  };
}, Un = (e, t) => {
  var s;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], n = t.nextPart.get(r), o = n ? Un(e.slice(1), n) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const a = e.join(wr);
  return (s = t.validators.find(({
    validator: i
  }) => i(a))) == null ? void 0 : s.classGroupId;
}, Lr = /^\[(.+)\]$/, wa = (e) => {
  if (Lr.test(e)) {
    const t = Lr.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, ka = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Sa(Object.entries(e.classGroups), r).forEach(([a, s]) => {
    Zt(s, n, a, t);
  }), n;
}, Zt = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Dr(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (Oa(o)) {
        Zt(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, s]) => {
      Zt(s, Dr(t, a), r, n);
    });
  });
}, Dr = (e, t) => {
  let r = e;
  return t.split(wr).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Oa = (e) => e.isThemeGetter, Sa = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([s, i]) => [t + s, i])) : a);
  return [r, o];
}) : e, Aa = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, s) => {
    r.set(a, s), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let s = r.get(a);
      if (s !== void 0)
        return s;
      if ((s = n.get(a)) !== void 0)
        return o(a, s), s;
    },
    set(a, s) {
      r.has(a) ? r.set(a, s) : o(a, s);
    }
  };
}, qn = "!", Ea = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, s = (i) => {
    const l = [];
    let c = 0, u = 0, d;
    for (let f = 0; f < i.length; f++) {
      let w = i[f];
      if (c === 0) {
        if (w === o && (n || i.slice(f, f + a) === t)) {
          l.push(i.slice(u, f)), u = f + a;
          continue;
        }
        if (w === "/") {
          d = f;
          continue;
        }
      }
      w === "[" ? c++ : w === "]" && c--;
    }
    const p = l.length === 0 ? i : i.substring(u), y = p.startsWith(qn), v = y ? p.substring(1) : p, m = d && d > u ? d - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: y,
      baseClassName: v,
      maybePostfixModifierPosition: m
    };
  };
  return r ? (i) => r({
    className: i,
    parseClassName: s
  }) : s;
}, Ca = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Na = (e) => ({
  cache: Aa(e.cacheSize),
  parseClassName: Ea(e),
  ...xa(e)
}), Pa = /\s+/, ja = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], s = e.trim().split(Pa);
  let i = "";
  for (let l = s.length - 1; l >= 0; l -= 1) {
    const c = s[l], {
      modifiers: u,
      hasImportantModifier: d,
      baseClassName: p,
      maybePostfixModifierPosition: y
    } = r(c);
    let v = !!y, m = n(v ? p.substring(0, y) : p);
    if (!m) {
      if (!v) {
        i = c + (i.length > 0 ? " " + i : i);
        continue;
      }
      if (m = n(p), !m) {
        i = c + (i.length > 0 ? " " + i : i);
        continue;
      }
      v = !1;
    }
    const f = Ca(u).join(":"), w = d ? f + qn : f, O = w + m;
    if (a.includes(O))
      continue;
    a.push(O);
    const S = o(m, v);
    for (let C = 0; C < S.length; ++C) {
      const g = S[C];
      a.push(w + g);
    }
    i = c + (i.length > 0 ? " " + i : i);
  }
  return i;
};
function za() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Bn(t)) && (n && (n += " "), n += r);
  return n;
}
const Bn = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Bn(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Ma(e, ...t) {
  let r, n, o, a = s;
  function s(l) {
    const c = t.reduce((u, d) => d(u), e());
    return r = Na(c), n = r.cache.get, o = r.cache.set, a = i, i(l);
  }
  function i(l) {
    const c = n(l);
    if (c)
      return c;
    const u = ja(l, r);
    return o(l, u), u;
  }
  return function() {
    return a(za.apply(null, arguments));
  };
}
const B = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Kn = /^\[(?:([a-z-]+):)?(.+)\]$/i, Ia = /^\d+\/\d+$/, Ta = /* @__PURE__ */ new Set(["px", "full", "screen"]), Ra = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, $a = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Fa = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, La = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Da = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, ge = (e) => Ye(e) || Ta.has(e) || Ia.test(e), ke = (e) => Ke(e, "length", qa), Ye = (e) => !!e && !Number.isNaN(Number(e)), $t = (e) => Ke(e, "number", Ye), Ze = (e) => !!e && Number.isInteger(Number(e)), _a = (e) => e.endsWith("%") && Ye(e.slice(0, -1)), j = (e) => Kn.test(e), Oe = (e) => Ra.test(e), Ga = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Va = (e) => Ke(e, Ga, Xn), Wa = (e) => Ke(e, "position", Xn), Ha = /* @__PURE__ */ new Set(["image", "url"]), Ya = (e) => Ke(e, Ha, Ka), Ua = (e) => Ke(e, "", Ba), Qe = () => !0, Ke = (e, t, r) => {
  const n = Kn.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, qa = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  $a.test(e) && !Fa.test(e)
), Xn = () => !1, Ba = (e) => La.test(e), Ka = (e) => Da.test(e), Xa = () => {
  const e = B("colors"), t = B("spacing"), r = B("blur"), n = B("brightness"), o = B("borderColor"), a = B("borderRadius"), s = B("borderSpacing"), i = B("borderWidth"), l = B("contrast"), c = B("grayscale"), u = B("hueRotate"), d = B("invert"), p = B("gap"), y = B("gradientColorStops"), v = B("gradientColorStopPositions"), m = B("inset"), f = B("margin"), w = B("opacity"), O = B("padding"), S = B("saturate"), C = B("scale"), g = B("sepia"), Z = B("skew"), V = B("space"), ae = B("translate"), te = () => ["auto", "contain", "none"], U = () => ["auto", "hidden", "clip", "visible", "scroll"], ee = () => ["auto", j, t], A = () => [j, t], ne = () => ["", ge, ke], Y = () => ["auto", Ye, j], ie = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], q = () => ["solid", "dashed", "dotted", "double", "none"], W = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], Q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], J = () => ["", "0", j], b = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [Ye, j];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Qe],
      spacing: [ge, ke],
      blur: ["none", "", Oe, j],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Oe, j],
      borderSpacing: A(),
      borderWidth: ne(),
      contrast: x(),
      grayscale: J(),
      hueRotate: x(),
      invert: J(),
      gap: A(),
      gradientColorStops: [e],
      gradientColorStopPositions: [_a, ke],
      inset: ee(),
      margin: ee(),
      opacity: x(),
      padding: A(),
      saturate: x(),
      scale: x(),
      sepia: J(),
      skew: x(),
      space: A(),
      translate: A()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", j]
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
        columns: [Oe]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": b()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": b()
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
        object: [...ie(), j]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: U()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": U()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": U()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: te()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": te()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": te()
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
        z: ["auto", Ze, j]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ee()
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
        flex: ["1", "auto", "initial", "none", j]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: J()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: J()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Ze, j]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Qe]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Ze, j]
        }, j]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": Y()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": Y()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Qe]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Ze, j]
        }, j]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": Y()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": Y()
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
        "auto-cols": ["auto", "min", "max", "fr", j]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", j]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [p]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [p]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [p]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...Q()]
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
        content: ["normal", ...Q(), "baseline"]
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
        "place-content": [...Q(), "baseline"]
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
        p: [O]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [O]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [O]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [O]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [O]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [O]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [O]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [O]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [O]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [f]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [f]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [f]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [f]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [f]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [f]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [f]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [f]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [f]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [V]
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
        "space-y": [V]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", j, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [j, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [j, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Oe]
        }, Oe]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [j, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [j, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [j, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [j, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Oe, ke]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", $t]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Qe]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", j]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Ye, $t]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", ge, j]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", j]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", j]
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
        "placeholder-opacity": [w]
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
        "text-opacity": [w]
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
        decoration: [...q(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", ge, ke]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", ge, j]
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
        indent: A()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", j]
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
        content: ["none", j]
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
        "bg-opacity": [w]
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
        bg: [...ie(), Wa]
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
        bg: ["auto", "cover", "contain", Va]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Ya]
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
        rounded: [a]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [a]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [a]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [a]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [a]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [a]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [a]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [a]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [a]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [a]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [a]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [a]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [a]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [a]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [a]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [i]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [i]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [i]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [i]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [i]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [i]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [i]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [i]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [i]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [w]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...q(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [i]
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
        "divide-y": [i]
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
        "divide-opacity": [w]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: q()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [o]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [o]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [o]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [o]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [o]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [o]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [o]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [o]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [o]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [o]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...q()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [ge, j]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [ge, ke]
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
        ring: ne()
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
        "ring-opacity": [w]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [ge, ke]
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
        shadow: ["", "inner", "none", Oe, Ua]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Qe]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [w]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...W(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": W()
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
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [l]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Oe, j]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [c]
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
        invert: [d]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [S]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [g]
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
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [l]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [c]
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
        "backdrop-invert": [d]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [w]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [S]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [g]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", j]
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
        ease: ["linear", "in", "out", "in-out", j]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", j]
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
        scale: [C]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [C]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [C]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Ze, j]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [ae]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [ae]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [Z]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Z]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", j]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", j]
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
        "scroll-m": A()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": A()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": A()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": A()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": A()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": A()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": A()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": A()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": A()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": A()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": A()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": A()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": A()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": A()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": A()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": A()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": A()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": A()
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
        "will-change": ["auto", "scroll", "contents", "transform", j]
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
        stroke: [ge, ke, $t]
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
}, _e = /* @__PURE__ */ Ma(Xa);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Ja(e, t, r) {
  return (t = Qa(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function _r(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function h(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? _r(Object(r), !0).forEach(function(n) {
      Ja(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : _r(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Za(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Qa(e) {
  var t = Za(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Gr = () => {
};
let kr = {}, Jn = {}, Zn = null, Qn = {
  mark: Gr,
  measure: Gr
};
try {
  typeof window < "u" && (kr = window), typeof document < "u" && (Jn = document), typeof MutationObserver < "u" && (Zn = MutationObserver), typeof performance < "u" && (Qn = performance);
} catch {
}
const {
  userAgent: Vr = ""
} = kr.navigator || {}, Pe = kr, X = Jn, Wr = Zn, pt = Qn;
Pe.document;
const xe = !!X.documentElement && !!X.head && typeof X.addEventListener == "function" && typeof X.createElement == "function", eo = ~Vr.indexOf("MSIE") || ~Vr.indexOf("Trident/");
var ei = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, ti = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, to = {
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
}, ri = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ro = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], oe = "classic", Pt = "duotone", ni = "sharp", oi = "sharp-duotone", no = [oe, Pt, ni, oi], ai = {
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
}, ii = {
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
}, si = /* @__PURE__ */ new Map([["classic", {
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
}]]), li = {
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
}, ci = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Hr = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, ui = ["kit"], fi = {
  kit: {
    "fa-kit": "fak"
  }
}, di = ["fak", "fakd"], pi = {
  kit: {
    fak: "fa-kit"
  }
}, Yr = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, mt = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, mi = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], gi = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], bi = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, hi = {
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
}, yi = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Qt = {
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
}, vi = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], er = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...mi, ...vi], xi = ["solid", "regular", "light", "thin", "duotone", "brands"], oo = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], wi = oo.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), ki = [...Object.keys(yi), ...xi, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", mt.GROUP, mt.SWAP_OPACITY, mt.PRIMARY, mt.SECONDARY].concat(oo.map((e) => "".concat(e, "x"))).concat(wi.map((e) => "w-".concat(e))), Oi = {
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
const ye = "___FONT_AWESOME___", tr = 16, ao = "fa", io = "svg-inline--fa", Fe = "data-fa-i2svg", rr = "data-fa-pseudo-element", Si = "data-fa-pseudo-element-pending", Or = "data-prefix", Sr = "data-icon", Ur = "fontawesome-i2svg", Ai = "async", Ei = ["HTML", "HEAD", "STYLE", "SCRIPT"], so = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function ct(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[oe];
    }
  });
}
const lo = h({}, to);
lo[oe] = h(h(h(h({}, {
  "fa-duotone": "duotone"
}), to[oe]), Hr.kit), Hr["kit-duotone"]);
const Ci = ct(lo), nr = h({}, li);
nr[oe] = h(h(h(h({}, {
  duotone: "fad"
}), nr[oe]), Yr.kit), Yr["kit-duotone"]);
const qr = ct(nr), or = h({}, Qt);
or[oe] = h(h({}, or[oe]), pi.kit);
const Ar = ct(or), ar = h({}, hi);
ar[oe] = h(h({}, ar[oe]), fi.kit);
ct(ar);
const Ni = ei, co = "fa-layers-text", Pi = ti, ji = h({}, ai);
ct(ji);
const zi = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ft = ri, Mi = [...ui, ...ki], ot = Pe.FontAwesomeConfig || {};
function Ii(e) {
  var t = X.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Ti(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
X && typeof X.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = Ti(Ii(t));
  n != null && (ot[r] = n);
});
const uo = {
  styleDefault: "solid",
  familyDefault: oe,
  cssPrefix: ao,
  replacementClass: io,
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
ot.familyPrefix && (ot.cssPrefix = ot.familyPrefix);
const Be = h(h({}, uo), ot);
Be.autoReplaceSvg || (Be.observeMutations = !1);
const E = {};
Object.keys(uo).forEach((e) => {
  Object.defineProperty(E, e, {
    enumerable: !0,
    set: function(t) {
      Be[e] = t, at.forEach((r) => r(E));
    },
    get: function() {
      return Be[e];
    }
  });
});
Object.defineProperty(E, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Be.cssPrefix = e, at.forEach((t) => t(E));
  },
  get: function() {
    return Be.cssPrefix;
  }
});
Pe.FontAwesomeConfig = E;
const at = [];
function Ri(e) {
  return at.push(e), () => {
    at.splice(at.indexOf(e), 1);
  };
}
const Se = tr, de = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function $i(e) {
  if (!e || !xe)
    return;
  const t = X.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = X.head.childNodes;
  let n = null;
  for (let o = r.length - 1; o > -1; o--) {
    const a = r[o], s = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(s) > -1 && (n = a);
  }
  return X.head.insertBefore(t, n), e;
}
const Fi = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function it() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Fi[Math.random() * 62 | 0];
  return t;
}
function Xe(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Er(e) {
  return e.classList ? Xe(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function fo(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Li(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(fo(e[r]), '" '), "").trim();
}
function jt(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Cr(e) {
  return e.size !== de.size || e.x !== de.x || e.y !== de.y || e.rotate !== de.rotate || e.flipX || e.flipY;
}
function Di(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const o = {
    transform: "translate(".concat(r / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), s = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), i = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(a, " ").concat(s, " ").concat(i)
  }, c = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: l,
    path: c
  };
}
function _i(e) {
  let {
    transform: t,
    width: r = tr,
    height: n = tr,
    startCentered: o = !1
  } = e, a = "";
  return o && eo ? a += "translate(".concat(t.x / Se - r / 2, "em, ").concat(t.y / Se - n / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / Se, "em), calc(-50% + ").concat(t.y / Se, "em)) ") : a += "translate(".concat(t.x / Se, "em, ").concat(t.y / Se, "em) "), a += "scale(".concat(t.size / Se * (t.flipX ? -1 : 1), ", ").concat(t.size / Se * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var Gi = `:root, :host {
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
function po() {
  const e = ao, t = io, r = E.cssPrefix, n = E.replacementClass;
  let o = Gi;
  if (r !== e || n !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), s = new RegExp("\\--".concat(e, "\\-"), "g"), i = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(r, "-")).replace(s, "--".concat(r, "-")).replace(i, ".".concat(n));
  }
  return o;
}
let Br = !1;
function Lt() {
  E.autoAddCss && !Br && ($i(po()), Br = !0);
}
var Vi = {
  mixout() {
    return {
      dom: {
        css: po,
        insertCss: Lt
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Lt();
      },
      beforeI2svg() {
        Lt();
      }
    };
  }
};
const ve = Pe || {};
ve[ye] || (ve[ye] = {});
ve[ye].styles || (ve[ye].styles = {});
ve[ye].hooks || (ve[ye].hooks = {});
ve[ye].shims || (ve[ye].shims = []);
var pe = ve[ye];
const mo = [], go = function() {
  X.removeEventListener("DOMContentLoaded", go), xt = 1, mo.map((e) => e());
};
let xt = !1;
xe && (xt = (X.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(X.readyState), xt || X.addEventListener("DOMContentLoaded", go));
function Wi(e) {
  xe && (xt ? setTimeout(e, 0) : mo.push(e));
}
function ut(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? fo(e) : "<".concat(t, " ").concat(Li(r), ">").concat(n.map(ut).join(""), "</").concat(t, ">");
}
function Kr(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var Dt = function(e, t, r, n) {
  var o = Object.keys(e), a = o.length, s = t, i, l, c;
  for (r === void 0 ? (i = 1, c = e[o[0]]) : (i = 0, c = r); i < a; i++)
    l = o[i], c = s(c, e[l], l, e);
  return c;
};
function Hi(e) {
  const t = [];
  let r = 0;
  const n = e.length;
  for (; r < n; ) {
    const o = e.charCodeAt(r++);
    if (o >= 55296 && o <= 56319 && r < n) {
      const a = e.charCodeAt(r++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), r--);
    } else
      t.push(o);
  }
  return t;
}
function bo(e) {
  const t = Hi(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Yi(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), o;
  return n >= 55296 && n <= 56319 && r > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function Xr(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function ir(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, o = Xr(t);
  typeof pe.hooks.addPack == "function" && !n ? pe.hooks.addPack(e, Xr(t)) : pe.styles[e] = h(h({}, pe.styles[e] || {}), o), e === "fas" && ir("fa", t);
}
const {
  styles: st,
  shims: Ui
} = pe, ho = Object.keys(Ar), qi = ho.reduce((e, t) => (e[t] = Object.keys(Ar[t]), e), {});
let Nr = null, yo = {}, vo = {}, xo = {}, wo = {}, ko = {};
function Bi(e) {
  return ~Mi.indexOf(e);
}
function Ki(e, t) {
  const r = t.split("-"), n = r[0], o = r.slice(1).join("-");
  return n === e && o !== "" && !Bi(o) ? o : null;
}
const Oo = () => {
  const e = (n) => Dt(st, (o, a, s) => (o[s] = Dt(a, n, {}), o), {});
  yo = e((n, o, a) => (o[3] && (n[o[3]] = a), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    n[s.toString(16)] = a;
  }), n)), vo = e((n, o, a) => (n[a] = a, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    n[s] = a;
  }), n)), ko = e((n, o, a) => {
    const s = o[2];
    return n[a] = a, s.forEach((i) => {
      n[i] = a;
    }), n;
  });
  const t = "far" in st || E.autoFetchSvg, r = Dt(Ui, (n, o) => {
    const a = o[0];
    let s = o[1];
    const i = o[2];
    return s === "far" && !t && (s = "fas"), typeof a == "string" && (n.names[a] = {
      prefix: s,
      iconName: i
    }), typeof a == "number" && (n.unicodes[a.toString(16)] = {
      prefix: s,
      iconName: i
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  xo = r.names, wo = r.unicodes, Nr = zt(E.styleDefault, {
    family: E.familyDefault
  });
};
Ri((e) => {
  Nr = zt(e.styleDefault, {
    family: E.familyDefault
  });
});
Oo();
function Pr(e, t) {
  return (yo[e] || {})[t];
}
function Xi(e, t) {
  return (vo[e] || {})[t];
}
function Re(e, t) {
  return (ko[e] || {})[t];
}
function So(e) {
  return xo[e] || {
    prefix: null,
    iconName: null
  };
}
function Ji(e) {
  const t = wo[e], r = Pr("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function je() {
  return Nr;
}
const Ao = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Zi(e) {
  let t = oe;
  const r = ho.reduce((n, o) => (n[o] = "".concat(E.cssPrefix, "-").concat(o), n), {});
  return no.forEach((n) => {
    (e.includes(r[n]) || e.some((o) => qi[n].includes(o))) && (t = n);
  }), t;
}
function zt(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = oe
  } = t, n = Ci[r][e];
  if (r === Pt && !e)
    return "fad";
  const o = qr[r][e] || qr[r][n], a = e in pe.styles ? e : null;
  return o || a || null;
}
function Qi(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const o = Ki(E.cssPrefix, n);
    o ? r = o : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function Jr(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function Mt(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const o = er.concat(gi), a = Jr(e.filter((d) => o.includes(d))), s = Jr(e.filter((d) => !er.includes(d))), i = a.filter((d) => (n = d, !ro.includes(d))), [l = null] = i, c = Zi(a), u = h(h({}, Qi(s)), {}, {
    prefix: zt(l, {
      family: c
    })
  });
  return h(h(h({}, u), ns({
    values: e,
    family: c,
    styles: st,
    config: E,
    canonical: u,
    givenPrefix: n
  })), es(r, n, u));
}
function es(e, t, r) {
  let {
    prefix: n,
    iconName: o
  } = r;
  if (e || !n || !o)
    return {
      prefix: n,
      iconName: o
    };
  const a = t === "fa" ? So(o) : {}, s = Re(n, o);
  return o = a.iconName || s || o, n = a.prefix || n, n === "far" && !st.far && st.fas && !E.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: o
  };
}
const ts = no.filter((e) => e !== oe || e !== Pt), rs = Object.keys(Qt).filter((e) => e !== oe).map((e) => Object.keys(Qt[e])).flat();
function ns(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: o = "",
    styles: a = {},
    config: s = {}
  } = e, i = r === Pt, l = t.includes("fa-duotone") || t.includes("fad"), c = s.familyDefault === "duotone", u = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!i && (l || c || u) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && ts.includes(r) && (Object.keys(a).find((d) => rs.includes(d)) || s.autoFetchSvg)) {
    const d = si.get(r).defaultShortPrefixId;
    n.prefix = d, n.iconName = Re(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || o === "fa") && (n.prefix = je() || "fas"), n;
}
class os {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const o = r.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = h(h({}, this.definitions[a] || {}), o[a]), ir(a, o[a]);
      const s = Ar[oe][a];
      s && ir(s, o[a]), Oo();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, r) {
    const n = r.prefix && r.iconName && r.icon ? {
      0: r
    } : r;
    return Object.keys(n).map((o) => {
      const {
        prefix: a,
        iconName: s,
        icon: i
      } = n[o], l = i[2];
      t[a] || (t[a] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[a][c] = i);
      }), t[a][s] = i;
    }), t;
  }
}
let Zr = [], Ve = {};
const Ue = {}, as = Object.keys(Ue);
function is(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return Zr = e, Ve = {}, Object.keys(Ue).forEach((n) => {
    as.indexOf(n) === -1 && delete Ue[n];
  }), Zr.forEach((n) => {
    const o = n.mixout ? n.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (r[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((s) => {
        r[a] || (r[a] = {}), r[a][s] = o[a][s];
      });
    }), n.hooks) {
      const a = n.hooks();
      Object.keys(a).forEach((s) => {
        Ve[s] || (Ve[s] = []), Ve[s].push(a[s]);
      });
    }
    n.provides && n.provides(Ue);
  }), r;
}
function sr(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), o = 2; o < r; o++)
    n[o - 2] = arguments[o];
  return (Ve[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...n]);
  }), t;
}
function Le(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (Ve[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function ze() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Ue[e] ? Ue[e].apply(null, t) : void 0;
}
function lr(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || je();
  if (t)
    return t = Re(r, t) || t, Kr(Eo.definitions, r, t) || Kr(pe.styles, r, t);
}
const Eo = new os(), ss = () => {
  E.autoReplaceSvg = !1, E.observeMutations = !1, Le("noAuto");
}, ls = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return xe ? (Le("beforeI2svg", e), ze("pseudoElements2svg", e), ze("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    E.autoReplaceSvg === !1 && (E.autoReplaceSvg = !0), E.observeMutations = !0, Wi(() => {
      us({
        autoReplaceSvgRoot: t
      }), Le("watch", e);
    });
  }
}, cs = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Re(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = zt(e[0]);
      return {
        prefix: r,
        iconName: Re(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(E.cssPrefix, "-")) > -1 || e.match(Ni))) {
      const t = Mt(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || je(),
        iconName: Re(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = je();
      return {
        prefix: t,
        iconName: Re(t, e) || e
      };
    }
  }
}, ue = {
  noAuto: ss,
  config: E,
  dom: ls,
  parse: cs,
  library: Eo,
  findIconDefinition: lr,
  toHtml: ut
}, us = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = X
  } = e;
  (Object.keys(pe.styles).length > 0 || E.autoFetchSvg) && xe && E.autoReplaceSvg && ue.dom.i2svg({
    node: t
  });
};
function It(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => ut(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!xe) return;
      const r = X.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function fs(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: o,
    styles: a,
    transform: s
  } = e;
  if (Cr(s) && r.found && !n.found) {
    const {
      width: i,
      height: l
    } = r, c = {
      x: i / l / 2,
      y: 0.5
    };
    o.style = jt(h(h({}, a), {}, {
      "transform-origin": "".concat(c.x + s.x / 16, "em ").concat(c.y + s.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function ds(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: o,
    symbol: a
  } = e;
  const s = a === !0 ? "".concat(t, "-").concat(E.cssPrefix, "-").concat(r) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: h(h({}, o), {}, {
        id: s
      }),
      children: n
    }]
  }];
}
function jr(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: o,
    transform: a,
    symbol: s,
    title: i,
    maskId: l,
    titleId: c,
    extra: u,
    watchable: d = !1
  } = e, {
    width: p,
    height: y
  } = r.found ? r : t, v = di.includes(n), m = [E.replacementClass, o ? "".concat(E.cssPrefix, "-").concat(o) : ""].filter((g) => u.classes.indexOf(g) === -1).filter((g) => g !== "" || !!g).concat(u.classes).join(" ");
  let f = {
    children: [],
    attributes: h(h({}, u.attributes), {}, {
      "data-prefix": n,
      "data-icon": o,
      class: m,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(p, " ").concat(y)
    })
  };
  const w = v && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(p / y * 16 * 0.0625, "em")
  } : {};
  d && (f.attributes[Fe] = ""), i && (f.children.push({
    tag: "title",
    attributes: {
      id: f.attributes["aria-labelledby"] || "title-".concat(c || it())
    },
    children: [i]
  }), delete f.attributes.title);
  const O = h(h({}, f), {}, {
    prefix: n,
    iconName: o,
    main: t,
    mask: r,
    maskId: l,
    transform: a,
    symbol: s,
    styles: h(h({}, w), u.styles)
  }), {
    children: S,
    attributes: C
  } = r.found && t.found ? ze("generateAbstractMask", O) || {
    children: [],
    attributes: {}
  } : ze("generateAbstractIcon", O) || {
    children: [],
    attributes: {}
  };
  return O.children = S, O.attributes = C, s ? ds(O) : fs(O);
}
function Qr(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: o,
    title: a,
    extra: s,
    watchable: i = !1
  } = e, l = h(h(h({}, s.attributes), a ? {
    title: a
  } : {}), {}, {
    class: s.classes.join(" ")
  });
  i && (l[Fe] = "");
  const c = h({}, s.styles);
  Cr(o) && (c.transform = _i({
    transform: o,
    startCentered: !0,
    width: r,
    height: n
  }), c["-webkit-transform"] = c.transform);
  const u = jt(c);
  u.length > 0 && (l.style = u);
  const d = [];
  return d.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), a && d.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), d;
}
function ps(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, o = h(h(h({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), a = jt(n.styles);
  a.length > 0 && (o.style = a);
  const s = [];
  return s.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), r && s.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [r]
  }), s;
}
const {
  styles: _t
} = pe;
function cr(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let o = null;
  return Array.isArray(n) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(E.cssPrefix, "-").concat(Ft.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(E.cssPrefix, "-").concat(Ft.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(E.cssPrefix, "-").concat(Ft.PRIMARY),
        fill: "currentColor",
        d: n[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: n
    }
  }, {
    found: !0,
    width: t,
    height: r,
    icon: o
  };
}
const ms = {
  found: !1,
  width: 512,
  height: 512
};
function gs(e, t) {
  !so && !E.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function ur(e, t) {
  let r = t;
  return t === "fa" && E.styleDefault !== null && (t = je()), new Promise((n, o) => {
    if (r === "fa") {
      const a = So(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && _t[t] && _t[t][e]) {
      const a = _t[t][e];
      return n(cr(a));
    }
    gs(e, t), n(h(h({}, ms), {}, {
      icon: E.showMissingIcons && e ? ze("missingIconAbstract") || {} : {}
    }));
  });
}
const en = () => {
}, fr = E.measurePerformance && pt && pt.mark && pt.measure ? pt : {
  mark: en,
  measure: en
}, rt = 'FA "6.7.2"', bs = (e) => (fr.mark("".concat(rt, " ").concat(e, " begins")), () => Co(e)), Co = (e) => {
  fr.mark("".concat(rt, " ").concat(e, " ends")), fr.measure("".concat(rt, " ").concat(e), "".concat(rt, " ").concat(e, " begins"), "".concat(rt, " ").concat(e, " ends"));
};
var zr = {
  begin: bs,
  end: Co
};
const ht = () => {
};
function tn(e) {
  return typeof (e.getAttribute ? e.getAttribute(Fe) : null) == "string";
}
function hs(e) {
  const t = e.getAttribute ? e.getAttribute(Or) : null, r = e.getAttribute ? e.getAttribute(Sr) : null;
  return t && r;
}
function ys(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(E.replacementClass);
}
function vs() {
  return E.autoReplaceSvg === !0 ? yt.replace : yt[E.autoReplaceSvg] || yt.replace;
}
function xs(e) {
  return X.createElementNS("http://www.w3.org/2000/svg", e);
}
function ws(e) {
  return X.createElement(e);
}
function No(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? xs : ws
  } = t;
  if (typeof e == "string")
    return X.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(No(o, {
      ceFn: r
    }));
  }), n;
}
function ks(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const yt = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(No(r), t);
      }), t.getAttribute(Fe) === null && E.keepOriginalSource) {
        let r = X.createComment(ks(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Er(t).indexOf(E.replacementClass))
      return yt.replace(e);
    const n = new RegExp("".concat(E.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const a = r[0].attributes.class.split(" ").reduce((s, i) => (i === E.replacementClass || i.match(n) ? s.toSvg.push(i) : s.toNode.push(i), s), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = r.map((a) => ut(a)).join(`
`);
    t.setAttribute(Fe, ""), t.innerHTML = o;
  }
};
function rn(e) {
  e();
}
function Po(e, t) {
  const r = typeof t == "function" ? t : ht;
  if (e.length === 0)
    r();
  else {
    let n = rn;
    E.mutateApproach === Ai && (n = Pe.requestAnimationFrame || rn), n(() => {
      const o = vs(), a = zr.begin("mutate");
      e.map(o), a(), r();
    });
  }
}
let Mr = !1;
function jo() {
  Mr = !0;
}
function dr() {
  Mr = !1;
}
let wt = null;
function nn(e) {
  if (!Wr || !E.observeMutations)
    return;
  const {
    treeCallback: t = ht,
    nodeCallback: r = ht,
    pseudoElementsCallback: n = ht,
    observeMutationsRoot: o = X
  } = e;
  wt = new Wr((a) => {
    if (Mr) return;
    const s = je();
    Xe(a).forEach((i) => {
      if (i.type === "childList" && i.addedNodes.length > 0 && !tn(i.addedNodes[0]) && (E.searchPseudoElements && n(i.target), t(i.target)), i.type === "attributes" && i.target.parentNode && E.searchPseudoElements && n(i.target.parentNode), i.type === "attributes" && tn(i.target) && ~zi.indexOf(i.attributeName))
        if (i.attributeName === "class" && hs(i.target)) {
          const {
            prefix: l,
            iconName: c
          } = Mt(Er(i.target));
          i.target.setAttribute(Or, l || s), c && i.target.setAttribute(Sr, c);
        } else ys(i.target) && r(i.target);
    });
  }), xe && wt.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Os() {
  wt && wt.disconnect();
}
function Ss(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, o) => {
    const a = o.split(":"), s = a[0], i = a.slice(1);
    return s && i.length > 0 && (n[s] = i.join(":").trim()), n;
  }, {})), r;
}
function As(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = Mt(Er(e));
  return o.prefix || (o.prefix = je()), t && r && (o.prefix = t, o.iconName = r), o.iconName && o.prefix || (o.prefix && n.length > 0 && (o.iconName = Xi(o.prefix, e.innerText) || Pr(o.prefix, bo(e.innerText))), !o.iconName && E.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function Es(e) {
  const t = Xe(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return E.autoA11y && (r ? t["aria-labelledby"] = "".concat(E.replacementClass, "-title-").concat(n || it()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Cs() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: de,
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
function on(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: o
  } = As(e), a = Es(e), s = sr("parseNodeAttributes", {}, e);
  let i = t.styleParser ? Ss(e) : [];
  return h({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: de,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: i,
      attributes: a
    }
  }, s);
}
const {
  styles: Ns
} = pe;
function zo(e) {
  const t = E.autoReplaceSvg === "nest" ? on(e, {
    styleParser: !1
  }) : on(e);
  return ~t.extra.classes.indexOf(co) ? ze("generateLayersText", e, t) : ze("generateSvgReplacementMutation", e, t);
}
function Ps() {
  return [...ci, ...er];
}
function an(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!xe) return Promise.resolve();
  const r = X.documentElement.classList, n = (u) => r.add("".concat(Ur, "-").concat(u)), o = (u) => r.remove("".concat(Ur, "-").concat(u)), a = E.autoFetchSvg ? Ps() : ro.concat(Object.keys(Ns));
  a.includes("fa") || a.push("fa");
  const s = [".".concat(co, ":not([").concat(Fe, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(Fe, "])"))).join(", ");
  if (s.length === 0)
    return Promise.resolve();
  let i = [];
  try {
    i = Xe(e.querySelectorAll(s));
  } catch {
  }
  if (i.length > 0)
    n("pending"), o("complete");
  else
    return Promise.resolve();
  const l = zr.begin("onTree"), c = i.reduce((u, d) => {
    try {
      const p = zo(d);
      p && u.push(p);
    } catch (p) {
      so || p.name === "MissingIcon" && console.error(p);
    }
    return u;
  }, []);
  return new Promise((u, d) => {
    Promise.all(c).then((p) => {
      Po(p, () => {
        n("active"), n("complete"), o("pending"), typeof t == "function" && t(), l(), u();
      });
    }).catch((p) => {
      l(), d(p);
    });
  });
}
function js(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  zo(e).then((r) => {
    r && Po([r], t);
  });
}
function zs(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : lr(t || {});
    let {
      mask: o
    } = r;
    return o && (o = (o || {}).icon ? o : lr(o || {})), e(n, h(h({}, r), {}, {
      mask: o
    }));
  };
}
const Ms = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = de,
    symbol: n = !1,
    mask: o = null,
    maskId: a = null,
    title: s = null,
    titleId: i = null,
    classes: l = [],
    attributes: c = {},
    styles: u = {}
  } = t;
  if (!e) return;
  const {
    prefix: d,
    iconName: p,
    icon: y
  } = e;
  return It(h({
    type: "icon"
  }, e), () => (Le("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), E.autoA11y && (s ? c["aria-labelledby"] = "".concat(E.replacementClass, "-title-").concat(i || it()) : (c["aria-hidden"] = "true", c.focusable = "false")), jr({
    icons: {
      main: cr(y),
      mask: o ? cr(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: d,
    iconName: p,
    transform: h(h({}, de), r),
    symbol: n,
    title: s,
    maskId: a,
    titleId: i,
    extra: {
      attributes: c,
      styles: u,
      classes: l
    }
  })));
};
var Is = {
  mixout() {
    return {
      icon: zs(Ms)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = an, e.nodeCallback = js, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = X,
        callback: n = () => {
        }
      } = t;
      return an(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: o,
        titleId: a,
        prefix: s,
        transform: i,
        symbol: l,
        mask: c,
        maskId: u,
        extra: d
      } = r;
      return new Promise((p, y) => {
        Promise.all([ur(n, s), c.iconName ? ur(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((v) => {
          let [m, f] = v;
          p([t, jr({
            icons: {
              main: m,
              mask: f
            },
            prefix: s,
            iconName: n,
            transform: i,
            symbol: l,
            maskId: u,
            title: o,
            titleId: a,
            extra: d,
            watchable: !0
          })]);
        }).catch(y);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        transform: a,
        styles: s
      } = t;
      const i = jt(s);
      i.length > 0 && (n.style = i);
      let l;
      return Cr(a) && (l = ze("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), r.push(l || o.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, Ts = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return It({
          type: "layer"
        }, () => {
          Le("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let n = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              n = n.concat(a.abstract);
            }) : n = n.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(E.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, Rs = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: r = null,
          classes: n = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return It({
          type: "counter",
          content: e
        }, () => (Le("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ps({
          content: e.toString(),
          title: r,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(E.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, $s = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = de,
          title: n = null,
          classes: o = [],
          attributes: a = {},
          styles: s = {}
        } = t;
        return It({
          type: "text",
          content: e
        }, () => (Le("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Qr({
          content: e,
          transform: h(h({}, de), r),
          title: n,
          extra: {
            attributes: a,
            styles: s,
            classes: ["".concat(E.cssPrefix, "-layers-text"), ...o]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, r) {
      const {
        title: n,
        transform: o,
        extra: a
      } = r;
      let s = null, i = null;
      if (eo) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        s = c.width / l, i = c.height / l;
      }
      return E.autoA11y && !n && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Qr({
        content: t.innerHTML,
        width: s,
        height: i,
        transform: o,
        title: n,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const Fs = new RegExp('"', "ug"), sn = [1105920, 1112319], ln = h(h(h(h({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), ii), Oi), bi), pr = Object.keys(ln).reduce((e, t) => (e[t.toLowerCase()] = ln[t], e), {}), Ls = Object.keys(pr).reduce((e, t) => {
  const r = pr[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function Ds(e) {
  const t = e.replace(Fs, ""), r = Yi(t, 0), n = r >= sn[0] && r <= sn[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: bo(o ? t[0] : t),
    isSecondary: n || o
  };
}
function _s(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), o = isNaN(n) ? "normal" : n;
  return (pr[r] || {})[o] || Ls[r];
}
function cn(e, t) {
  const r = "".concat(Si).concat(t.replace(":", "-"));
  return new Promise((n, o) => {
    if (e.getAttribute(r) !== null)
      return n();
    const a = Xe(e.children).filter((d) => d.getAttribute(rr) === t)[0], s = Pe.getComputedStyle(e, t), i = s.getPropertyValue("font-family"), l = i.match(Pi), c = s.getPropertyValue("font-weight"), u = s.getPropertyValue("content");
    if (a && !l)
      return e.removeChild(a), n();
    if (l && u !== "none" && u !== "") {
      const d = s.getPropertyValue("content");
      let p = _s(i, c);
      const {
        value: y,
        isSecondary: v
      } = Ds(d), m = l[0].startsWith("FontAwesome");
      let f = Pr(p, y), w = f;
      if (m) {
        const O = Ji(y);
        O.iconName && O.prefix && (f = O.iconName, p = O.prefix);
      }
      if (f && !v && (!a || a.getAttribute(Or) !== p || a.getAttribute(Sr) !== w)) {
        e.setAttribute(r, w), a && e.removeChild(a);
        const O = Cs(), {
          extra: S
        } = O;
        S.attributes[rr] = t, ur(f, p).then((C) => {
          const g = jr(h(h({}, O), {}, {
            icons: {
              main: C,
              mask: Ao()
            },
            prefix: p,
            iconName: w,
            extra: S,
            watchable: !0
          })), Z = X.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(Z, e.firstChild) : e.appendChild(Z), Z.outerHTML = g.map((V) => ut(V)).join(`
`), e.removeAttribute(r), n();
        }).catch(o);
      } else
        n();
    } else
      n();
  });
}
function Gs(e) {
  return Promise.all([cn(e, "::before"), cn(e, "::after")]);
}
function Vs(e) {
  return e.parentNode !== document.head && !~Ei.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(rr) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function un(e) {
  if (xe)
    return new Promise((t, r) => {
      const n = Xe(e.querySelectorAll("*")).filter(Vs).map(Gs), o = zr.begin("searchPseudoElements");
      jo(), Promise.all(n).then(() => {
        o(), dr(), t();
      }).catch(() => {
        o(), dr(), r();
      });
    });
}
var Ws = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = un, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = X
      } = t;
      E.searchPseudoElements && un(r);
    };
  }
};
let fn = !1;
var Hs = {
  mixout() {
    return {
      dom: {
        unwatch() {
          jo(), fn = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        nn(sr("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Os();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        fn ? dr() : nn(sr("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const dn = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((r, n) => {
    const o = n.toLowerCase().split("-"), a = o[0];
    let s = o.slice(1).join("-");
    if (a && s === "h")
      return r.flipX = !0, r;
    if (a && s === "v")
      return r.flipY = !0, r;
    if (s = parseFloat(s), isNaN(s))
      return r;
    switch (a) {
      case "grow":
        r.size = r.size + s;
        break;
      case "shrink":
        r.size = r.size - s;
        break;
      case "left":
        r.x = r.x - s;
        break;
      case "right":
        r.x = r.x + s;
        break;
      case "up":
        r.y = r.y - s;
        break;
      case "down":
        r.y = r.y + s;
        break;
      case "rotate":
        r.rotate = r.rotate + s;
        break;
    }
    return r;
  }, t);
};
var Ys = {
  mixout() {
    return {
      parse: {
        transform: (e) => dn(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = dn(r)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: r,
        transform: n,
        containerWidth: o,
        iconWidth: a
      } = t;
      const s = {
        transform: "translate(".concat(o / 2, " 256)")
      }, i = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), l = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), c = "rotate(".concat(n.rotate, " 0 0)"), u = {
        transform: "".concat(i, " ").concat(l, " ").concat(c)
      }, d = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, p = {
        outer: s,
        inner: u,
        path: d
      };
      return {
        tag: "g",
        attributes: h({}, p.outer),
        children: [{
          tag: "g",
          attributes: h({}, p.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: h(h({}, r.icon.attributes), p.path)
          }]
        }]
      };
    };
  }
};
const Gt = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function pn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Us(e) {
  return e.tag === "g" ? e.children : [e];
}
var qs = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? Mt(r.split(" ").map((o) => o.trim())) : Ao();
        return n.prefix || (n.prefix = je()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        mask: a,
        maskId: s,
        transform: i
      } = t;
      const {
        width: l,
        icon: c
      } = o, {
        width: u,
        icon: d
      } = a, p = Di({
        transform: i,
        containerWidth: u,
        iconWidth: l
      }), y = {
        tag: "rect",
        attributes: h(h({}, Gt), {}, {
          fill: "white"
        })
      }, v = c.children ? {
        children: c.children.map(pn)
      } : {}, m = {
        tag: "g",
        attributes: h({}, p.inner),
        children: [pn(h({
          tag: c.tag,
          attributes: h(h({}, c.attributes), p.path)
        }, v))]
      }, f = {
        tag: "g",
        attributes: h({}, p.outer),
        children: [m]
      }, w = "mask-".concat(s || it()), O = "clip-".concat(s || it()), S = {
        tag: "mask",
        attributes: h(h({}, Gt), {}, {
          id: w,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [y, f]
      }, C = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: O
          },
          children: Us(d)
        }, S]
      };
      return r.push(C, {
        tag: "rect",
        attributes: h({
          fill: "currentColor",
          "clip-path": "url(#".concat(O, ")"),
          mask: "url(#".concat(w, ")")
        }, Gt)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, Bs = {
  provides(e) {
    let t = !1;
    Pe.matchMedia && (t = Pe.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: h(h({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = h(h({}, o), {}, {
        attributeName: "opacity"
      }), s = {
        tag: "circle",
        attributes: h(h({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || s.children.push({
        tag: "animate",
        attributes: h(h({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: h(h({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(s), r.push({
        tag: "path",
        attributes: h(h({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: h(h({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: h(h({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: h(h({}, a), {}, {
            values: "0;0;1;1;0;0;"
          })
        }]
      }), {
        tag: "g",
        attributes: {
          class: "missing"
        },
        children: r
      };
    };
  }
}, Ks = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, Xs = [Vi, Is, Ts, Rs, $s, Ws, Hs, Ys, qs, Bs, Ks];
is(Xs, {
  mixoutsTo: ue
});
ue.noAuto;
ue.config;
ue.library;
ue.dom;
const mr = ue.parse;
ue.findIconDefinition;
ue.toHtml;
const Js = ue.icon;
ue.layer;
ue.text;
ue.counter;
function Zs(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var gt = { exports: {} }, Vt = { exports: {} }, _ = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var mn;
function Qs() {
  if (mn) return _;
  mn = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, i = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, d = e ? Symbol.for("react.suspense") : 60113, p = e ? Symbol.for("react.suspense_list") : 60120, y = e ? Symbol.for("react.memo") : 60115, v = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, f = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, O = e ? Symbol.for("react.scope") : 60119;
  function S(g) {
    if (typeof g == "object" && g !== null) {
      var Z = g.$$typeof;
      switch (Z) {
        case t:
          switch (g = g.type, g) {
            case l:
            case c:
            case n:
            case a:
            case o:
            case d:
              return g;
            default:
              switch (g = g && g.$$typeof, g) {
                case i:
                case u:
                case v:
                case y:
                case s:
                  return g;
                default:
                  return Z;
              }
          }
        case r:
          return Z;
      }
    }
  }
  function C(g) {
    return S(g) === c;
  }
  return _.AsyncMode = l, _.ConcurrentMode = c, _.ContextConsumer = i, _.ContextProvider = s, _.Element = t, _.ForwardRef = u, _.Fragment = n, _.Lazy = v, _.Memo = y, _.Portal = r, _.Profiler = a, _.StrictMode = o, _.Suspense = d, _.isAsyncMode = function(g) {
    return C(g) || S(g) === l;
  }, _.isConcurrentMode = C, _.isContextConsumer = function(g) {
    return S(g) === i;
  }, _.isContextProvider = function(g) {
    return S(g) === s;
  }, _.isElement = function(g) {
    return typeof g == "object" && g !== null && g.$$typeof === t;
  }, _.isForwardRef = function(g) {
    return S(g) === u;
  }, _.isFragment = function(g) {
    return S(g) === n;
  }, _.isLazy = function(g) {
    return S(g) === v;
  }, _.isMemo = function(g) {
    return S(g) === y;
  }, _.isPortal = function(g) {
    return S(g) === r;
  }, _.isProfiler = function(g) {
    return S(g) === a;
  }, _.isStrictMode = function(g) {
    return S(g) === o;
  }, _.isSuspense = function(g) {
    return S(g) === d;
  }, _.isValidElementType = function(g) {
    return typeof g == "string" || typeof g == "function" || g === n || g === c || g === a || g === o || g === d || g === p || typeof g == "object" && g !== null && (g.$$typeof === v || g.$$typeof === y || g.$$typeof === s || g.$$typeof === i || g.$$typeof === u || g.$$typeof === f || g.$$typeof === w || g.$$typeof === O || g.$$typeof === m);
  }, _.typeOf = S, _;
}
var G = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var gn;
function el() {
  return gn || (gn = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, i = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, d = e ? Symbol.for("react.suspense") : 60113, p = e ? Symbol.for("react.suspense_list") : 60120, y = e ? Symbol.for("react.memo") : 60115, v = e ? Symbol.for("react.lazy") : 60116, m = e ? Symbol.for("react.block") : 60121, f = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, O = e ? Symbol.for("react.scope") : 60119;
    function S(k) {
      return typeof k == "string" || typeof k == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      k === n || k === c || k === a || k === o || k === d || k === p || typeof k == "object" && k !== null && (k.$$typeof === v || k.$$typeof === y || k.$$typeof === s || k.$$typeof === i || k.$$typeof === u || k.$$typeof === f || k.$$typeof === w || k.$$typeof === O || k.$$typeof === m);
    }
    function C(k) {
      if (typeof k == "object" && k !== null) {
        var we = k.$$typeof;
        switch (we) {
          case t:
            var ft = k.type;
            switch (ft) {
              case l:
              case c:
              case n:
              case a:
              case o:
              case d:
                return ft;
              default:
                var Rr = ft && ft.$$typeof;
                switch (Rr) {
                  case i:
                  case u:
                  case v:
                  case y:
                  case s:
                    return Rr;
                  default:
                    return we;
                }
            }
          case r:
            return we;
        }
      }
    }
    var g = l, Z = c, V = i, ae = s, te = t, U = u, ee = n, A = v, ne = y, Y = r, ie = a, q = o, W = d, Q = !1;
    function J(k) {
      return Q || (Q = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), b(k) || C(k) === l;
    }
    function b(k) {
      return C(k) === c;
    }
    function x(k) {
      return C(k) === i;
    }
    function R(k) {
      return C(k) === s;
    }
    function N(k) {
      return typeof k == "object" && k !== null && k.$$typeof === t;
    }
    function P(k) {
      return C(k) === u;
    }
    function T(k) {
      return C(k) === n;
    }
    function I(k) {
      return C(k) === v;
    }
    function M(k) {
      return C(k) === y;
    }
    function $(k) {
      return C(k) === r;
    }
    function L(k) {
      return C(k) === a;
    }
    function D(k) {
      return C(k) === o;
    }
    function re(k) {
      return C(k) === d;
    }
    G.AsyncMode = g, G.ConcurrentMode = Z, G.ContextConsumer = V, G.ContextProvider = ae, G.Element = te, G.ForwardRef = U, G.Fragment = ee, G.Lazy = A, G.Memo = ne, G.Portal = Y, G.Profiler = ie, G.StrictMode = q, G.Suspense = W, G.isAsyncMode = J, G.isConcurrentMode = b, G.isContextConsumer = x, G.isContextProvider = R, G.isElement = N, G.isForwardRef = P, G.isFragment = T, G.isLazy = I, G.isMemo = M, G.isPortal = $, G.isProfiler = L, G.isStrictMode = D, G.isSuspense = re, G.isValidElementType = S, G.typeOf = C;
  }()), G;
}
var bn;
function Mo() {
  return bn || (bn = 1, process.env.NODE_ENV === "production" ? Vt.exports = Qs() : Vt.exports = el()), Vt.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Wt, hn;
function tl() {
  if (hn) return Wt;
  hn = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function n(a) {
    if (a == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(a);
  }
  function o() {
    try {
      if (!Object.assign)
        return !1;
      var a = new String("abc");
      if (a[5] = "de", Object.getOwnPropertyNames(a)[0] === "5")
        return !1;
      for (var s = {}, i = 0; i < 10; i++)
        s["_" + String.fromCharCode(i)] = i;
      var l = Object.getOwnPropertyNames(s).map(function(u) {
        return s[u];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var c = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(u) {
        c[u] = u;
      }), Object.keys(Object.assign({}, c)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Wt = o() ? Object.assign : function(a, s) {
    for (var i, l = n(a), c, u = 1; u < arguments.length; u++) {
      i = Object(arguments[u]);
      for (var d in i)
        t.call(i, d) && (l[d] = i[d]);
      if (e) {
        c = e(i);
        for (var p = 0; p < c.length; p++)
          r.call(i, c[p]) && (l[c[p]] = i[c[p]]);
      }
    }
    return l;
  }, Wt;
}
var Ht, yn;
function Ir() {
  if (yn) return Ht;
  yn = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Ht = e, Ht;
}
var vn, xn;
function Io() {
  return xn || (xn = 1, vn = Function.call.bind(Object.prototype.hasOwnProperty)), vn;
}
var Yt, wn;
function rl() {
  if (wn) return Yt;
  wn = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Ir(), r = {}, n = /* @__PURE__ */ Io();
    e = function(a) {
      var s = "Warning: " + a;
      typeof console < "u" && console.error(s);
      try {
        throw new Error(s);
      } catch {
      }
    };
  }
  function o(a, s, i, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (n(a, u)) {
          var d;
          try {
            if (typeof a[u] != "function") {
              var p = Error(
                (l || "React class") + ": " + i + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw p.name = "Invariant Violation", p;
            }
            d = a[u](s, u, l, i, null, t);
          } catch (v) {
            d = v;
          }
          if (d && !(d instanceof Error) && e(
            (l || "React class") + ": type specification of " + i + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof d + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), d instanceof Error && !(d.message in r)) {
            r[d.message] = !0;
            var y = c ? c() : "";
            e(
              "Failed " + i + " type: " + d.message + (y ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Yt = o, Yt;
}
var Ut, kn;
function nl() {
  if (kn) return Ut;
  kn = 1;
  var e = Mo(), t = tl(), r = /* @__PURE__ */ Ir(), n = /* @__PURE__ */ Io(), o = /* @__PURE__ */ rl(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(i) {
    var l = "Warning: " + i;
    typeof console < "u" && console.error(l);
    try {
      throw new Error(l);
    } catch {
    }
  });
  function s() {
    return null;
  }
  return Ut = function(i, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function d(b) {
      var x = b && (c && b[c] || b[u]);
      if (typeof x == "function")
        return x;
    }
    var p = "<<anonymous>>", y = {
      array: w("array"),
      bigint: w("bigint"),
      bool: w("boolean"),
      func: w("function"),
      number: w("number"),
      object: w("object"),
      string: w("string"),
      symbol: w("symbol"),
      any: O(),
      arrayOf: S,
      element: C(),
      elementType: g(),
      instanceOf: Z,
      node: U(),
      objectOf: ae,
      oneOf: V,
      oneOfType: te,
      shape: A,
      exact: ne
    };
    function v(b, x) {
      return b === x ? b !== 0 || 1 / b === 1 / x : b !== b && x !== x;
    }
    function m(b, x) {
      this.message = b, this.data = x && typeof x == "object" ? x : {}, this.stack = "";
    }
    m.prototype = Error.prototype;
    function f(b) {
      if (process.env.NODE_ENV !== "production")
        var x = {}, R = 0;
      function N(T, I, M, $, L, D, re) {
        if ($ = $ || p, D = D || M, re !== r) {
          if (l) {
            var k = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw k.name = "Invariant Violation", k;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var we = $ + ":" + M;
            !x[we] && // Avoid spamming the console because they are often not actionable except for lib authors
            R < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + D + "` prop on `" + $ + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), x[we] = !0, R++);
          }
        }
        return I[M] == null ? T ? I[M] === null ? new m("The " + L + " `" + D + "` is marked as required " + ("in `" + $ + "`, but its value is `null`.")) : new m("The " + L + " `" + D + "` is marked as required in " + ("`" + $ + "`, but its value is `undefined`.")) : null : b(I, M, $, L, D);
      }
      var P = N.bind(null, !1);
      return P.isRequired = N.bind(null, !0), P;
    }
    function w(b) {
      function x(R, N, P, T, I, M) {
        var $ = R[N], L = q($);
        if (L !== b) {
          var D = W($);
          return new m(
            "Invalid " + T + " `" + I + "` of type " + ("`" + D + "` supplied to `" + P + "`, expected ") + ("`" + b + "`."),
            { expectedType: b }
          );
        }
        return null;
      }
      return f(x);
    }
    function O() {
      return f(s);
    }
    function S(b) {
      function x(R, N, P, T, I) {
        if (typeof b != "function")
          return new m("Property `" + I + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var M = R[N];
        if (!Array.isArray(M)) {
          var $ = q(M);
          return new m("Invalid " + T + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + P + "`, expected an array."));
        }
        for (var L = 0; L < M.length; L++) {
          var D = b(M, L, P, T, I + "[" + L + "]", r);
          if (D instanceof Error)
            return D;
        }
        return null;
      }
      return f(x);
    }
    function C() {
      function b(x, R, N, P, T) {
        var I = x[R];
        if (!i(I)) {
          var M = q(I);
          return new m("Invalid " + P + " `" + T + "` of type " + ("`" + M + "` supplied to `" + N + "`, expected a single ReactElement."));
        }
        return null;
      }
      return f(b);
    }
    function g() {
      function b(x, R, N, P, T) {
        var I = x[R];
        if (!e.isValidElementType(I)) {
          var M = q(I);
          return new m("Invalid " + P + " `" + T + "` of type " + ("`" + M + "` supplied to `" + N + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return f(b);
    }
    function Z(b) {
      function x(R, N, P, T, I) {
        if (!(R[N] instanceof b)) {
          var M = b.name || p, $ = J(R[N]);
          return new m("Invalid " + T + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + P + "`, expected ") + ("instance of `" + M + "`."));
        }
        return null;
      }
      return f(x);
    }
    function V(b) {
      if (!Array.isArray(b))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), s;
      function x(R, N, P, T, I) {
        for (var M = R[N], $ = 0; $ < b.length; $++)
          if (v(M, b[$]))
            return null;
        var L = JSON.stringify(b, function(D, re) {
          var k = W(re);
          return k === "symbol" ? String(re) : re;
        });
        return new m("Invalid " + T + " `" + I + "` of value `" + String(M) + "` " + ("supplied to `" + P + "`, expected one of " + L + "."));
      }
      return f(x);
    }
    function ae(b) {
      function x(R, N, P, T, I) {
        if (typeof b != "function")
          return new m("Property `" + I + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var M = R[N], $ = q(M);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + I + "` of type " + ("`" + $ + "` supplied to `" + P + "`, expected an object."));
        for (var L in M)
          if (n(M, L)) {
            var D = b(M, L, P, T, I + "." + L, r);
            if (D instanceof Error)
              return D;
          }
        return null;
      }
      return f(x);
    }
    function te(b) {
      if (!Array.isArray(b))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), s;
      for (var x = 0; x < b.length; x++) {
        var R = b[x];
        if (typeof R != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + Q(R) + " at index " + x + "."
          ), s;
      }
      function N(P, T, I, M, $) {
        for (var L = [], D = 0; D < b.length; D++) {
          var re = b[D], k = re(P, T, I, M, $, r);
          if (k == null)
            return null;
          k.data && n(k.data, "expectedType") && L.push(k.data.expectedType);
        }
        var we = L.length > 0 ? ", expected one of type [" + L.join(", ") + "]" : "";
        return new m("Invalid " + M + " `" + $ + "` supplied to " + ("`" + I + "`" + we + "."));
      }
      return f(N);
    }
    function U() {
      function b(x, R, N, P, T) {
        return Y(x[R]) ? null : new m("Invalid " + P + " `" + T + "` supplied to " + ("`" + N + "`, expected a ReactNode."));
      }
      return f(b);
    }
    function ee(b, x, R, N, P) {
      return new m(
        (b || "React class") + ": " + x + " type `" + R + "." + N + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function A(b) {
      function x(R, N, P, T, I) {
        var M = R[N], $ = q(M);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + I + "` of type `" + $ + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var L in b) {
          var D = b[L];
          if (typeof D != "function")
            return ee(P, T, I, L, W(D));
          var re = D(M, L, P, T, I + "." + L, r);
          if (re)
            return re;
        }
        return null;
      }
      return f(x);
    }
    function ne(b) {
      function x(R, N, P, T, I) {
        var M = R[N], $ = q(M);
        if ($ !== "object")
          return new m("Invalid " + T + " `" + I + "` of type `" + $ + "` " + ("supplied to `" + P + "`, expected `object`."));
        var L = t({}, R[N], b);
        for (var D in L) {
          var re = b[D];
          if (n(b, D) && typeof re != "function")
            return ee(P, T, I, D, W(re));
          if (!re)
            return new m(
              "Invalid " + T + " `" + I + "` key `" + D + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(R[N], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(b), null, "  ")
            );
          var k = re(M, D, P, T, I + "." + D, r);
          if (k)
            return k;
        }
        return null;
      }
      return f(x);
    }
    function Y(b) {
      switch (typeof b) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !b;
        case "object":
          if (Array.isArray(b))
            return b.every(Y);
          if (b === null || i(b))
            return !0;
          var x = d(b);
          if (x) {
            var R = x.call(b), N;
            if (x !== b.entries) {
              for (; !(N = R.next()).done; )
                if (!Y(N.value))
                  return !1;
            } else
              for (; !(N = R.next()).done; ) {
                var P = N.value;
                if (P && !Y(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function ie(b, x) {
      return b === "symbol" ? !0 : x ? x["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && x instanceof Symbol : !1;
    }
    function q(b) {
      var x = typeof b;
      return Array.isArray(b) ? "array" : b instanceof RegExp ? "object" : ie(x, b) ? "symbol" : x;
    }
    function W(b) {
      if (typeof b > "u" || b === null)
        return "" + b;
      var x = q(b);
      if (x === "object") {
        if (b instanceof Date)
          return "date";
        if (b instanceof RegExp)
          return "regexp";
      }
      return x;
    }
    function Q(b) {
      var x = W(b);
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
    function J(b) {
      return !b.constructor || !b.constructor.name ? p : b.constructor.name;
    }
    return y.checkPropTypes = o, y.resetWarningCache = o.resetWarningCache, y.PropTypes = y, y;
  }, Ut;
}
var qt, On;
function ol() {
  if (On) return qt;
  On = 1;
  var e = /* @__PURE__ */ Ir();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, qt = function() {
    function n(s, i, l, c, u, d) {
      if (d !== e) {
        var p = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw p.name = "Invariant Violation", p;
      }
    }
    n.isRequired = n;
    function o() {
      return n;
    }
    var a = {
      array: n,
      bigint: n,
      bool: n,
      func: n,
      number: n,
      object: n,
      string: n,
      symbol: n,
      any: n,
      arrayOf: o,
      element: n,
      elementType: n,
      instanceOf: o,
      node: n,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, qt;
}
var Sn;
function al() {
  if (Sn) return gt.exports;
  if (Sn = 1, process.env.NODE_ENV !== "production") {
    var e = Mo(), t = !0;
    gt.exports = /* @__PURE__ */ nl()(e.isElement, t);
  } else
    gt.exports = /* @__PURE__ */ ol()();
  return gt.exports;
}
var il = /* @__PURE__ */ al();
const F = /* @__PURE__ */ Zs(il);
function An(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function fe(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? An(Object(r), !0).forEach(function(n) {
      We(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : An(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function kt(e) {
  "@babel/helpers - typeof";
  return kt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, kt(e);
}
function We(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function sl(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), o, a;
  for (a = 0; a < n.length; a++)
    o = n[a], !(t.indexOf(o) >= 0) && (r[o] = e[o]);
  return r;
}
function ll(e, t) {
  if (e == null) return {};
  var r = sl(e, t), n, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      n = a[o], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function gr(e) {
  return cl(e) || ul(e) || fl(e) || dl();
}
function cl(e) {
  if (Array.isArray(e)) return br(e);
}
function ul(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function fl(e, t) {
  if (e) {
    if (typeof e == "string") return br(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return br(e, t);
  }
}
function br(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function dl() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function pl(e) {
  var t, r = e.beat, n = e.fade, o = e.beatFade, a = e.bounce, s = e.shake, i = e.flash, l = e.spin, c = e.spinPulse, u = e.spinReverse, d = e.pulse, p = e.fixedWidth, y = e.inverse, v = e.border, m = e.listItem, f = e.flip, w = e.size, O = e.rotation, S = e.pull, C = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": s,
    "fa-flash": i,
    "fa-spin": l,
    "fa-spin-reverse": u,
    "fa-spin-pulse": c,
    "fa-pulse": d,
    "fa-fw": p,
    "fa-inverse": y,
    "fa-border": v,
    "fa-li": m,
    "fa-flip": f === !0,
    "fa-flip-horizontal": f === "horizontal" || f === "both",
    "fa-flip-vertical": f === "vertical" || f === "both"
  }, We(t, "fa-".concat(w), typeof w < "u" && w !== null), We(t, "fa-rotate-".concat(O), typeof O < "u" && O !== null && O !== 0), We(t, "fa-pull-".concat(S), typeof S < "u" && S !== null), We(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(C).map(function(g) {
    return C[g] ? g : null;
  }).filter(function(g) {
    return g;
  });
}
function ml(e) {
  return e = e - 0, e === e;
}
function To(e) {
  return ml(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var gl = ["style"];
function bl(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function hl(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), o = To(r.slice(0, n)), a = r.slice(n + 1).trim();
    return o.startsWith("webkit") ? t[bl(o)] = a : t[o] = a, t;
  }, {});
}
function Ro(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(l) {
    return Ro(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var u = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = hl(u);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = u : l.attrs[To(c)] = u;
    }
    return l;
  }, {
    attrs: {}
  }), a = r.style, s = a === void 0 ? {} : a, i = ll(r, gl);
  return o.attrs.style = fe(fe({}, o.attrs.style), s), e.apply(void 0, [t.tag, fe(fe({}, o.attrs), i)].concat(gr(n)));
}
var $o = !1;
try {
  $o = process.env.NODE_ENV === "production";
} catch {
}
function yl() {
  if (!$o && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function En(e) {
  if (e && kt(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (mr.icon)
    return mr.icon(e);
  if (e === null)
    return null;
  if (e && kt(e) === "object" && e.prefix && e.iconName)
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
function Bt(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? We({}, e, t) : {};
}
var Cn = {
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
}, ce = /* @__PURE__ */ se.forwardRef(function(e, t) {
  var r = fe(fe({}, Cn), e), n = r.icon, o = r.mask, a = r.symbol, s = r.className, i = r.title, l = r.titleId, c = r.maskId, u = En(n), d = Bt("classes", [].concat(gr(pl(r)), gr((s || "").split(" ")))), p = Bt("transform", typeof r.transform == "string" ? mr.transform(r.transform) : r.transform), y = Bt("mask", En(o)), v = Js(u, fe(fe(fe(fe({}, d), p), y), {}, {
    symbol: a,
    title: i,
    titleId: l,
    maskId: c
  }));
  if (!v)
    return yl("Could not find icon", u), null;
  var m = v.abstract, f = {
    ref: t
  };
  return Object.keys(r).forEach(function(w) {
    Cn.hasOwnProperty(w) || (f[w] = r[w]);
  }), vl(m[0], f);
});
ce.displayName = "FontAwesomeIcon";
ce.propTypes = {
  beat: F.bool,
  border: F.bool,
  beatFade: F.bool,
  bounce: F.bool,
  className: F.string,
  fade: F.bool,
  flash: F.bool,
  mask: F.oneOfType([F.object, F.array, F.string]),
  maskId: F.string,
  fixedWidth: F.bool,
  inverse: F.bool,
  flip: F.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: F.oneOfType([F.object, F.array, F.string]),
  listItem: F.bool,
  pull: F.oneOf(["right", "left"]),
  pulse: F.bool,
  rotation: F.oneOf([0, 90, 180, 270]),
  shake: F.bool,
  size: F.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: F.bool,
  spinPulse: F.bool,
  spinReverse: F.bool,
  symbol: F.oneOfType([F.bool, F.string]),
  title: F.string,
  titleId: F.string,
  transform: F.oneOfType([F.string, F.object]),
  swapOpacity: F.bool
};
var vl = Ro.bind(null, se.createElement);
const Tr = "-", xl = (e) => {
  const t = kl(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Tr);
      return a[0] === "" && a.length !== 1 && a.shift(), Fo(a, t) || wl(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const s = r[o] || [];
      return a && n[o] ? [...s, ...n[o]] : s;
    }
  };
}, Fo = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? Fo(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const s = e.join(Tr);
  return (r = t.validators.find(({
    validator: i
  }) => i(s))) == null ? void 0 : r.classGroupId;
}, Nn = /^\[(.+)\]$/, wl = (e) => {
  if (Nn.test(e)) {
    const t = Nn.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, kl = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Sl(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    hr(a, n, o, t);
  }), n;
}, hr = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Pn(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (Ol(o)) {
        hr(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, s]) => {
      hr(s, Pn(t, a), r, n);
    });
  });
}, Pn = (e, t) => {
  let r = e;
  return t.split(Tr).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Ol = (e) => e.isThemeGetter, Sl = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([s, i]) => [t + s, i])) : a);
  return [r, o];
}) : e, Al = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, s) => {
    r.set(a, s), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let s = r.get(a);
      if (s !== void 0)
        return s;
      if ((s = n.get(a)) !== void 0)
        return o(a, s), s;
    },
    set(a, s) {
      r.has(a) ? r.set(a, s) : o(a, s);
    }
  };
}, Lo = "!", El = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, s = (i) => {
    const l = [];
    let c = 0, u = 0, d;
    for (let f = 0; f < i.length; f++) {
      let w = i[f];
      if (c === 0) {
        if (w === o && (n || i.slice(f, f + a) === t)) {
          l.push(i.slice(u, f)), u = f + a;
          continue;
        }
        if (w === "/") {
          d = f;
          continue;
        }
      }
      w === "[" ? c++ : w === "]" && c--;
    }
    const p = l.length === 0 ? i : i.substring(u), y = p.startsWith(Lo), v = y ? p.substring(1) : p, m = d && d > u ? d - u : void 0;
    return {
      modifiers: l,
      hasImportantModifier: y,
      baseClassName: v,
      maybePostfixModifierPosition: m
    };
  };
  return r ? (i) => r({
    className: i,
    parseClassName: s
  }) : s;
}, Cl = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Nl = (e) => ({
  cache: Al(e.cacheSize),
  parseClassName: El(e),
  ...xl(e)
}), Pl = /\s+/, jl = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], s = e.trim().split(Pl);
  let i = "";
  for (let l = s.length - 1; l >= 0; l -= 1) {
    const c = s[l], {
      modifiers: u,
      hasImportantModifier: d,
      baseClassName: p,
      maybePostfixModifierPosition: y
    } = r(c);
    let v = !!y, m = n(v ? p.substring(0, y) : p);
    if (!m) {
      if (!v) {
        i = c + (i.length > 0 ? " " + i : i);
        continue;
      }
      if (m = n(p), !m) {
        i = c + (i.length > 0 ? " " + i : i);
        continue;
      }
      v = !1;
    }
    const f = Cl(u).join(":"), w = d ? f + Lo : f, O = w + m;
    if (a.includes(O))
      continue;
    a.push(O);
    const S = o(m, v);
    for (let C = 0; C < S.length; ++C) {
      const g = S[C];
      a.push(w + g);
    }
    i = c + (i.length > 0 ? " " + i : i);
  }
  return i;
};
function zl() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Do(t)) && (n && (n += " "), n += r);
  return n;
}
const Do = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Do(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Ml(e, ...t) {
  let r, n, o, a = s;
  function s(l) {
    const c = t.reduce((u, d) => d(u), e());
    return r = Nl(c), n = r.cache.get, o = r.cache.set, a = i, i(l);
  }
  function i(l) {
    const c = n(l);
    if (c)
      return c;
    const u = jl(l, r);
    return o(l, u), u;
  }
  return function() {
    return a(zl.apply(null, arguments));
  };
}
const K = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, _o = /^\[(?:([a-z-]+):)?(.+)\]$/i, Il = /^\d+\/\d+$/, Tl = /* @__PURE__ */ new Set(["px", "full", "screen"]), Rl = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, $l = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Fl = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Ll = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Dl = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, be = (e) => qe(e) || Tl.has(e) || Il.test(e), Ae = (e) => Je(e, "length", ql), qe = (e) => !!e && !Number.isNaN(Number(e)), Kt = (e) => Je(e, "number", qe), et = (e) => !!e && Number.isInteger(Number(e)), _l = (e) => e.endsWith("%") && qe(e.slice(0, -1)), z = (e) => _o.test(e), Ee = (e) => Rl.test(e), Gl = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Vl = (e) => Je(e, Gl, Go), Wl = (e) => Je(e, "position", Go), Hl = /* @__PURE__ */ new Set(["image", "url"]), Yl = (e) => Je(e, Hl, Kl), Ul = (e) => Je(e, "", Bl), tt = () => !0, Je = (e, t, r) => {
  const n = _o.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, ql = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  $l.test(e) && !Fl.test(e)
), Go = () => !1, Bl = (e) => Ll.test(e), Kl = (e) => Dl.test(e), Xl = () => {
  const e = K("colors"), t = K("spacing"), r = K("blur"), n = K("brightness"), o = K("borderColor"), a = K("borderRadius"), s = K("borderSpacing"), i = K("borderWidth"), l = K("contrast"), c = K("grayscale"), u = K("hueRotate"), d = K("invert"), p = K("gap"), y = K("gradientColorStops"), v = K("gradientColorStopPositions"), m = K("inset"), f = K("margin"), w = K("opacity"), O = K("padding"), S = K("saturate"), C = K("scale"), g = K("sepia"), Z = K("skew"), V = K("space"), ae = K("translate"), te = () => ["auto", "contain", "none"], U = () => ["auto", "hidden", "clip", "visible", "scroll"], ee = () => ["auto", z, t], A = () => [z, t], ne = () => ["", be, Ae], Y = () => ["auto", qe, z], ie = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], q = () => ["solid", "dashed", "dotted", "double", "none"], W = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], Q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], J = () => ["", "0", z], b = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], x = () => [qe, z];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [tt],
      spacing: [be, Ae],
      blur: ["none", "", Ee, z],
      brightness: x(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Ee, z],
      borderSpacing: A(),
      borderWidth: ne(),
      contrast: x(),
      grayscale: J(),
      hueRotate: x(),
      invert: J(),
      gap: A(),
      gradientColorStops: [e],
      gradientColorStopPositions: [_l, Ae],
      inset: ee(),
      margin: ee(),
      opacity: x(),
      padding: A(),
      saturate: x(),
      scale: x(),
      sepia: J(),
      skew: x(),
      space: A(),
      translate: A()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", z]
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
        columns: [Ee]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": b()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": b()
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
        object: [...ie(), z]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: U()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": U()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": U()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: te()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": te()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": te()
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
        z: ["auto", et, z]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ee()
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
        flex: ["1", "auto", "initial", "none", z]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: J()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: J()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", et, z]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [tt]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", et, z]
        }, z]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": Y()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": Y()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [tt]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [et, z]
        }, z]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": Y()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": Y()
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
        "auto-cols": ["auto", "min", "max", "fr", z]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", z]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [p]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [p]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [p]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...Q()]
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
        content: ["normal", ...Q(), "baseline"]
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
        "place-content": [...Q(), "baseline"]
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
        p: [O]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [O]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [O]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [O]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [O]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [O]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [O]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [O]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [O]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [f]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [f]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [f]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [f]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [f]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [f]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [f]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [f]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [f]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [V]
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
        "space-y": [V]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", z, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [z, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [z, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Ee]
        }, Ee]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [z, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [z, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [z, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [z, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Ee, Ae]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Kt]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [tt]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", z]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", qe, Kt]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", be, z]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", z]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", z]
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
        "placeholder-opacity": [w]
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
        "text-opacity": [w]
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
        decoration: [...q(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", be, Ae]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", be, z]
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
        indent: A()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", z]
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
        content: ["none", z]
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
        "bg-opacity": [w]
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
        bg: [...ie(), Wl]
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
        bg: ["auto", "cover", "contain", Vl]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Yl]
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
        rounded: [a]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [a]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [a]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [a]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [a]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [a]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [a]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [a]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [a]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [a]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [a]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [a]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [a]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [a]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [a]
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: [i]
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": [i]
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": [i]
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": [i]
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": [i]
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": [i]
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": [i]
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": [i]
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": [i]
      }],
      /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */
      "border-opacity": [{
        "border-opacity": [w]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...q(), "hidden"]
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */
      "divide-x": [{
        "divide-x": [i]
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
        "divide-y": [i]
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
        "divide-opacity": [w]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: q()
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: [o]
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": [o]
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": [o]
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": [o]
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": [o]
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": [o]
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": [o]
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": [o]
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": [o]
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: [o]
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: ["", ...q()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [be, z]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [be, Ae]
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
        ring: ne()
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
        "ring-opacity": [w]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [be, Ae]
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
        shadow: ["", "inner", "none", Ee, Ul]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [tt]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [w]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...W(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": W()
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
        blur: [r]
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [n]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [l]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Ee, z]
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: [c]
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
        invert: [d]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [S]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [g]
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
        "backdrop-blur": [r]
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [n]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [l]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": [c]
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
        "backdrop-invert": [d]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [w]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [S]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [g]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", z]
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
        ease: ["linear", "in", "out", "in-out", z]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", z]
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
        scale: [C]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [C]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [C]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [et, z]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [ae]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [ae]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [Z]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Z]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", z]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", z]
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
        "scroll-m": A()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": A()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": A()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": A()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": A()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": A()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": A()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": A()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": A()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": A()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": A()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": A()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": A()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": A()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": A()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": A()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": A()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": A()
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
        "will-change": ["auto", "scroll", "contents", "transform", z]
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
        stroke: [be, Ae, Kt]
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
}, jn = /* @__PURE__ */ Ml(Xl);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Ge = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, zn = ({
  icon: e,
  iconClassName: t,
  children: r,
  className: n,
  htmlFor: o,
  variant: a = "primary",
  disabled: s,
  iconFlip: i = !1,
  loading: l,
  as: c = "button",
  href: u,
  target: d,
  ...p
}) => {
  function y(f) {
    switch (f) {
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
  const v = jn(
    s || l ? "opacity-50 pointer-events-none" : ""
  ), m = jn(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    y(a),
    n,
    v
  );
  return o ? /* @__PURE__ */ He("label", { className: m, htmlFor: o, style: p.style, children: [
    l && !i ? /* @__PURE__ */ H(ce, { icon: Ge, className: "animate-spin" }) : /* @__PURE__ */ H(De, { children: e && !i ? /* @__PURE__ */ H(ce, { icon: e, className: t }) : null }),
    r,
    l && i ? /* @__PURE__ */ H(ce, { icon: Ge, className: "animate-spin" }) : /* @__PURE__ */ H(De, { children: e && i ? /* @__PURE__ */ H(ce, { icon: e, className: t }) : null })
  ] }) : c === "link" && u ? /* @__PURE__ */ He(
    "a",
    {
      href: u,
      className: m,
      style: p.style,
      ...p,
      target: d,
      children: [
        l && !i ? /* @__PURE__ */ H(ce, { icon: Ge, className: "animate-spin" }) : /* @__PURE__ */ H(De, { children: e && !i ? /* @__PURE__ */ H(ce, { icon: e, className: t }) : null }),
        r,
        l && i ? /* @__PURE__ */ H(ce, { icon: Ge, className: "animate-spin" }) : /* @__PURE__ */ H(De, { children: e && i ? /* @__PURE__ */ H(ce, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ He(
    "button",
    {
      className: m,
      disabled: s || l,
      ...p,
      htmlFor: o,
      children: [
        l && !i ? /* @__PURE__ */ H(ce, { icon: Ge, className: "animate-spin" }) : /* @__PURE__ */ H(De, { children: e && !i ? /* @__PURE__ */ H(ce, { icon: e, className: t }) : null }),
        r,
        l && i ? /* @__PURE__ */ H(ce, { icon: Ge, className: "animate-spin" }) : /* @__PURE__ */ H(De, { children: e && i ? /* @__PURE__ */ H(ce, { icon: e, className: t }) : null })
      ]
    }
  );
};
var vt = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(vt || {});
vt.FEATURED, vt.MINE, vt.BOOKMARKED;
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Jl = {
  prefix: "fas",
  iconName: "minus",
  icon: [448, 512, [8211, 8722, 10134, "subtract"], "f068", "M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"]
}, Zl = {
  prefix: "fas",
  iconName: "plus",
  icon: [448, 512, [10133, 61543, "add"], "2b", "M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"]
}, rc = ({
  min: e,
  max: t,
  value: r,
  onChange: n,
  step: o,
  className: a,
  showTooltip: s,
  tooltipContent: i,
  suffix: l,
  innerLabel: c,
  showDecrement: u,
  showIncrement: d,
  variant: p = "filled",
  showProgressBar: y = !0
}) => {
  var q;
  const [v, m] = me(r), f = le(null), [w, O] = me(!1), [S, C] = me(!1);
  lt(() => {
    m(r);
  }, [r]);
  const g = (W) => {
    const Q = Math.round(W / o) * o, J = Math.min(Math.max(Q, e), t);
    m(J), n(J);
  }, Z = (W) => {
    if (!f.current) return;
    const Q = f.current.getBoundingClientRect(), b = (W - Q.left) / Q.width * (t - e) + e;
    g(b);
  }, V = (W) => {
    W.preventDefault(), O(!0), C(!0), document.addEventListener("mousemove", ae), document.addEventListener("mouseup", te), Z(W.clientX);
  }, ae = (W) => {
    W.preventDefault(), Z(W.clientX);
  }, te = (W) => {
    W.preventDefault(), O(!1), C(!1), document.removeEventListener("mousemove", ae), document.removeEventListener("mouseup", te);
  }, U = () => {
    w || C(!0);
  }, ee = () => {
    w || C(!1);
  }, A = () => {
    g(v - o);
  }, ne = () => {
    g(v + o);
  }, Y = (v - e) / (t - e) * 100, ie = v.toFixed(((q = o.toString().split(".")[1]) == null ? void 0 : q.length) || 0) + (l || "");
  return /* @__PURE__ */ He("div", { className: "flex w-full", children: [
    u && /* @__PURE__ */ H(
      zn,
      {
        icon: Jl,
        className: "focus-visible:outline-primary my-auto mr-1 size-6 rounded-full bg-transparent text-white/80 hover:bg-white/10 active:bg-brand-primary/30",
        onClick: A
      }
    ),
    p === "filled" ? /* @__PURE__ */ H(
      "div",
      {
        ref: f,
        className: _e(
          "glass border-ui-border group relative h-7 w-full cursor-pointer overflow-hidden rounded-lg border",
          w && "!bg-ui-controls/90",
          a
        ),
        onMouseDown: V,
        children: /* @__PURE__ */ He(
          "div",
          {
            className: _e(
              "absolute h-full bg-brand-primary/30 transition-colors duration-300 group-hover:bg-brand-primary/50",
              w && "!bg-brand-primary/50"
            ),
            style: { width: `${Y}%` },
            children: [
              c && /* @__PURE__ */ H(
                "span",
                {
                  className: _e(
                    "absolute top-1/2 ml-2.5 -translate-y-1/2 text-nowrap text-sm font-medium text-white/60 transition-colors duration-300 group-hover:text-white",
                    w && "!text-white"
                  ),
                  children: c
                }
              ),
              /* @__PURE__ */ H(
                "div",
                {
                  className: _e(
                    "absolute right-0 top-1/2 mr-1 h-4 w-0.5 -translate-y-1/2 rounded-full",
                    w ? "bg-white" : "bg-white/50"
                  ),
                  onMouseDown: V,
                  onMouseEnter: U,
                  onMouseLeave: ee
                }
              )
            ]
          }
        )
      }
    ) : /* @__PURE__ */ He(
      "div",
      {
        ref: f,
        className: _e(
          "relative h-4 w-full cursor-pointer flex items-center",
          a
        ),
        onMouseDown: V,
        children: [
          /* @__PURE__ */ H("div", { className: "absolute left-0 right-0 h-2 bg-ui-border rounded-full bg-white/15" }),
          y && /* @__PURE__ */ H(
            "div",
            {
              className: "absolute left-0 h-2 bg-white rounded-full transition-all duration-200",
              style: { width: `${Y}%` }
            }
          ),
          /* @__PURE__ */ H(
            "div",
            {
              className: _e(
                "absolute top-1/2 z-10 size-4 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow transition-colors duration-200 hover:ring-[4px] hover:ring-white/20",
                w ? "ring-[4px] ring-white/20" : ""
              ),
              style: { left: `calc(${Y}% - 10px)` },
              onMouseDown: V,
              onMouseEnter: U,
              onMouseLeave: ee
            }
          )
        ]
      }
    ),
    d && /* @__PURE__ */ H(
      zn,
      {
        icon: Zl,
        className: "focus-visible:outline-primary my-auto ml-1 size-6 rounded-full bg-transparent text-white/80 hover:bg-white/10 active:bg-brand-primary/30",
        onClick: ne
      }
    ),
    s && /* @__PURE__ */ H(
      va,
      {
        as: "div",
        show: S,
        enter: "transition ease-out duration-200",
        enterFrom: "opacity-0",
        enterTo: "opacity-100",
        leave: "transition ease-in duration-150",
        leaveFrom: "opacity-100 scale-100",
        leaveTo: "opacity-0",
        children: /* @__PURE__ */ H(
          "div",
          {
            className: "absolute -top-8 z-10 rounded-md bg-ui-panel px-2 py-1 text-xs text-black shadow-lg",
            style: { left: `${Y}%`, transform: "translateX(-50%)" },
            children: i || ie
          }
        )
      }
    )
  ] });
};
export {
  rc as SliderV2
};
