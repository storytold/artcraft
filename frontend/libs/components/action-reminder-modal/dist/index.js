import * as A from "react";
import sr, { version as wg, useRef as _e, createContext as kg, useState as Bt, useEffect as Re, isValidElement as ec, cloneElement as tc, useContext as gd, useMemo as Og, useLayoutEffect as Sg, forwardRef as Ag, useCallback as Pg } from "react";
import { jsxs as Ye, jsx as G, Fragment as st } from "react/jsx-runtime";
import * as Eg from "react-dom";
import Ng, { unstable_batchedUpdates as Cg } from "react-dom";
var $g = Symbol.for("preact-signals");
function Gs() {
  if (_r > 1)
    _r--;
  else {
    for (var e, t = !1; wn !== void 0; ) {
      var r = wn;
      for (wn = void 0, Ei++; r !== void 0; ) {
        var n = r.o;
        if (r.o = void 0, r.f &= -3, !(8 & r.f) && vd(r)) try {
          r.c();
        } catch (o) {
          t || (e = o, t = !0);
        }
        r = n;
      }
    }
    if (Ei = 0, _r--, t) throw e;
  }
}
var Oe = void 0, wn = void 0, _r = 0, Ei = 0, Mo = 0;
function bd(e) {
  if (Oe !== void 0) {
    var t = e.n;
    if (t === void 0 || t.t !== Oe)
      return t = { i: 0, S: e, p: Oe.s, n: void 0, t: Oe, e: void 0, x: void 0, r: t }, Oe.s !== void 0 && (Oe.s.n = t), Oe.s = t, e.n = t, 32 & Oe.f && e.S(t), t;
    if (t.i === -1)
      return t.i = 0, t.n !== void 0 && (t.n.p = t.p, t.p !== void 0 && (t.p.n = t.n), t.p = Oe.s, t.n = void 0, Oe.s.n = t, Oe.s = t), t;
  }
}
function Fe(e) {
  this.v = e, this.i = 0, this.n = void 0, this.t = void 0;
}
Fe.prototype.brand = $g;
Fe.prototype.h = function() {
  return !0;
};
Fe.prototype.S = function(e) {
  this.t !== e && e.e === void 0 && (e.x = this.t, this.t !== void 0 && (this.t.e = e), this.t = e);
};
Fe.prototype.U = function(e) {
  if (this.t !== void 0) {
    var t = e.e, r = e.x;
    t !== void 0 && (t.x = r, e.e = void 0), r !== void 0 && (r.e = t, e.x = void 0), e === this.t && (this.t = r);
  }
};
Fe.prototype.subscribe = function(e) {
  var t = this;
  return Od(function() {
    var r = t.value, n = Oe;
    Oe = void 0;
    try {
      e(r);
    } finally {
      Oe = n;
    }
  });
};
Fe.prototype.valueOf = function() {
  return this.value;
};
Fe.prototype.toString = function() {
  return this.value + "";
};
Fe.prototype.toJSON = function() {
  return this.value;
};
Fe.prototype.peek = function() {
  var e = Oe;
  Oe = void 0;
  try {
    return this.value;
  } finally {
    Oe = e;
  }
};
Object.defineProperty(Fe.prototype, "value", { get: function() {
  var e = bd(this);
  return e !== void 0 && (e.i = this.i), this.v;
}, set: function(e) {
  if (e !== this.v) {
    if (Ei > 100) throw new Error("Cycle detected");
    this.v = e, this.i++, Mo++, _r++;
    try {
      for (var t = this.t; t !== void 0; t = t.x) t.t.N();
    } finally {
      Gs();
    }
  }
} });
function yd(e) {
  return new Fe(e);
}
function vd(e) {
  for (var t = e.s; t !== void 0; t = t.n) if (t.S.i !== t.i || !t.S.h() || t.S.i !== t.i) return !0;
  return !1;
}
function xd(e) {
  for (var t = e.s; t !== void 0; t = t.n) {
    var r = t.S.n;
    if (r !== void 0 && (t.r = r), t.S.n = t, t.i = -1, t.n === void 0) {
      e.s = t;
      break;
    }
  }
}
function wd(e) {
  for (var t = e.s, r = void 0; t !== void 0; ) {
    var n = t.p;
    t.i === -1 ? (t.S.U(t), n !== void 0 && (n.n = t.n), t.n !== void 0 && (t.n.p = n)) : r = t, t.S.n = t.r, t.r !== void 0 && (t.r = void 0), t = n;
  }
  e.s = r;
}
function Xn(e) {
  Fe.call(this, void 0), this.x = e, this.s = void 0, this.g = Mo - 1, this.f = 4;
}
(Xn.prototype = new Fe()).h = function() {
  if (this.f &= -3, 1 & this.f) return !1;
  if ((36 & this.f) == 32 || (this.f &= -5, this.g === Mo)) return !0;
  if (this.g = Mo, this.f |= 1, this.i > 0 && !vd(this))
    return this.f &= -2, !0;
  var e = Oe;
  try {
    xd(this), Oe = this;
    var t = this.x();
    (16 & this.f || this.v !== t || this.i === 0) && (this.v = t, this.f &= -17, this.i++);
  } catch (r) {
    this.v = r, this.f |= 16, this.i++;
  }
  return Oe = e, wd(this), this.f &= -2, !0;
};
Xn.prototype.S = function(e) {
  if (this.t === void 0) {
    this.f |= 36;
    for (var t = this.s; t !== void 0; t = t.n) t.S.S(t);
  }
  Fe.prototype.S.call(this, e);
};
Xn.prototype.U = function(e) {
  if (this.t !== void 0 && (Fe.prototype.U.call(this, e), this.t === void 0)) {
    this.f &= -33;
    for (var t = this.s; t !== void 0; t = t.n) t.S.U(t);
  }
};
Xn.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 6;
    for (var e = this.t; e !== void 0; e = e.x) e.t.N();
  }
};
Object.defineProperty(Xn.prototype, "value", { get: function() {
  if (1 & this.f) throw new Error("Cycle detected");
  var e = bd(this);
  if (this.h(), e !== void 0 && (e.i = this.i), 16 & this.f) throw this.v;
  return this.v;
} });
function kd(e) {
  var t = e.u;
  if (e.u = void 0, typeof t == "function") {
    _r++;
    var r = Oe;
    Oe = void 0;
    try {
      t();
    } catch (n) {
      throw e.f &= -2, e.f |= 8, Ys(e), n;
    } finally {
      Oe = r, Gs();
    }
  }
}
function Ys(e) {
  for (var t = e.s; t !== void 0; t = t.n) t.S.U(t);
  e.x = void 0, e.s = void 0, kd(e);
}
function jg(e) {
  if (Oe !== this) throw new Error("Out-of-order effect");
  wd(this), Oe = e, this.f &= -2, 8 & this.f && Ys(this), Gs();
}
function Jn(e) {
  this.x = e, this.u = void 0, this.s = void 0, this.o = void 0, this.f = 32;
}
Jn.prototype.c = function() {
  var e = this.S();
  try {
    if (8 & this.f || this.x === void 0) return;
    var t = this.x();
    typeof t == "function" && (this.u = t);
  } finally {
    e();
  }
};
Jn.prototype.S = function() {
  if (1 & this.f) throw new Error("Cycle detected");
  this.f |= 1, this.f &= -9, kd(this), xd(this), _r++;
  var e = Oe;
  return Oe = this, jg.bind(this, e);
};
Jn.prototype.N = function() {
  2 & this.f || (this.f |= 2, this.o = wn, wn = this);
};
Jn.prototype.d = function() {
  this.f |= 8, 1 & this.f || Ys(this);
};
function Od(e) {
  var t = new Jn(e);
  try {
    t.c();
  } catch (r) {
    throw t.d(), r;
  }
  return t.d.bind(t);
}
var so = { exports: {} }, Sa = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var rc;
function Ig() {
  if (rc) return Sa;
  rc = 1;
  var e = sr;
  function t(f, d) {
    return f === d && (f !== 0 || 1 / f === 1 / d) || f !== f && d !== d;
  }
  var r = typeof Object.is == "function" ? Object.is : t, n = e.useState, o = e.useEffect, a = e.useLayoutEffect, i = e.useDebugValue;
  function s(f, d) {
    var b = d(), x = n({ inst: { value: b, getSnapshot: d } }), p = x[0].inst, m = x[1];
    return a(
      function() {
        p.value = b, p.getSnapshot = d, c(p) && m({ inst: p });
      },
      [f, b, d]
    ), o(
      function() {
        return c(p) && m({ inst: p }), f(function() {
          c(p) && m({ inst: p });
        });
      },
      [f]
    ), i(b), b;
  }
  function c(f) {
    var d = f.getSnapshot;
    f = f.value;
    try {
      var b = d();
      return !r(f, b);
    } catch {
      return !0;
    }
  }
  function l(f, d) {
    return d();
  }
  var u = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? l : s;
  return Sa.useSyncExternalStore = e.useSyncExternalStore !== void 0 ? e.useSyncExternalStore : u, Sa;
}
var Aa = {};
/**
 * @license React
 * use-sync-external-store-shim.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var nc;
function zg() {
  return nc || (nc = 1, process.env.NODE_ENV !== "production" && function() {
    function e(b, x) {
      return b === x && (b !== 0 || 1 / b === 1 / x) || b !== b && x !== x;
    }
    function t(b, x) {
      u || o.startTransition === void 0 || (u = !0, console.error(
        "You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release."
      ));
      var p = x();
      if (!f) {
        var m = x();
        a(p, m) || (console.error(
          "The result of getSnapshot should be cached to avoid an infinite loop"
        ), f = !0);
      }
      m = i({
        inst: { value: p, getSnapshot: x }
      });
      var y = m[0].inst, k = m[1];
      return c(
        function() {
          y.value = p, y.getSnapshot = x, r(y) && k({ inst: y });
        },
        [b, p, x]
      ), s(
        function() {
          return r(y) && k({ inst: y }), b(function() {
            r(y) && k({ inst: y });
          });
        },
        [b]
      ), l(p), p;
    }
    function r(b) {
      var x = b.getSnapshot;
      b = b.value;
      try {
        var p = x();
        return !a(b, p);
      } catch {
        return !0;
      }
    }
    function n(b, x) {
      return x();
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var o = sr, a = typeof Object.is == "function" ? Object.is : e, i = o.useState, s = o.useEffect, c = o.useLayoutEffect, l = o.useDebugValue, u = !1, f = !1, d = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? n : t;
    Aa.useSyncExternalStore = o.useSyncExternalStore !== void 0 ? o.useSyncExternalStore : d, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  }()), Aa;
}
var oc;
function _g() {
  return oc || (oc = 1, process.env.NODE_ENV === "production" ? so.exports = Ig() : so.exports = zg()), so.exports;
}
var Mg = _g(), Rg = wg.split(".").map(Number)[0], Tg = Symbol.for(Rg >= 19 ? "react.transitional.element" : "react.element"), lr, Sd = Symbol.dispose || Symbol.for("Symbol.dispose");
function Pa(e, t) {
  var r = t.effect.S();
  return lr = t, Dg.bind(t, e, r);
}
function Dg(e, t) {
  t(), lr = e;
}
var ac, Ni, ic = function() {
}, Lg = ((ac = { o: 0, effect: { s: void 0, c: function() {
}, S: function() {
  return ic;
}, d: function() {
} }, subscribe: function() {
  return ic;
}, getSnapshot: function() {
  return 0;
}, S: function() {
}, f: function() {
} })[Sd] = function() {
}, ac), Fg = Promise.prototype.then.bind(Promise.resolve());
function Vg() {
  Ni || (Ni = Fg(Wg));
}
function Wg() {
  var e;
  Ni = void 0, (e = lr) == null || e.f();
}
function Ug(e) {
  Vg();
  var t = _e();
  t.current == null && (typeof window > "u" ? t.current = Lg : t.current = function(n) {
    var o, a, i, s, c = 0, l = Od(function() {
      a = this;
    });
    return a.c = function() {
      c = c + 1 | 0, s && s();
    }, (o = { o: n, effect: a, subscribe: function(u) {
      return s = u, function() {
        c = c + 1 | 0, s = void 0, l();
      };
    }, getSnapshot: function() {
      return c;
    }, S: function() {
      if (lr != null) {
        var u = lr.o, f = this.o;
        u == 0 && f == 0 || u == 0 && f == 1 ? (lr.f(), i = Pa(void 0, this)) : u == 1 && f == 0 || u == 2 && f == 0 || (i = Pa(lr, this));
      } else i = Pa(void 0, this);
    }, f: function() {
      var u = i;
      i = void 0, u == null || u();
    } })[Sd] = function() {
      this.f();
    }, o;
  }(e));
  var r = t.current;
  return Mg.useSyncExternalStore(r.subscribe, r.getSnapshot, r.getSnapshot), r.S(), r;
}
Object.defineProperties(Fe.prototype, { $$typeof: { configurable: !0, value: Tg }, type: { configurable: !0, value: function(e) {
  var t = e.data, r = Ug(1);
  try {
    return t.value;
  } finally {
    r.f();
  }
} }, props: { configurable: !0, get: function() {
  return { data: this };
} }, ref: { configurable: !0, value: null } });
const sc = yd(!1), Gg = yd(
  null
);
function GS(e) {
  Gg.value = {
    ...e,
    onClose: () => {
      sc.value = !1;
    }
  }, sc.value = !0;
}
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Yg(e, t, r) {
  return (t = Bg(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function lc(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function D(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? lc(Object(r), !0).forEach(function(n) {
      Yg(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : lc(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function qg(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Bg(e) {
  var t = qg(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const cc = () => {
};
let qs = {}, Ad = {}, Pd = null, Ed = {
  mark: cc,
  measure: cc
};
try {
  typeof window < "u" && (qs = window), typeof document < "u" && (Ad = document), typeof MutationObserver < "u" && (Pd = MutationObserver), typeof performance < "u" && (Ed = performance);
} catch {
}
const {
  userAgent: uc = ""
} = qs.navigator || {}, Qt = qs, Ce = Ad, fc = Pd, lo = Ed;
Qt.document;
const jt = !!Ce.documentElement && !!Ce.head && typeof Ce.addEventListener == "function" && typeof Ce.createElement == "function", Nd = ~uc.indexOf("MSIE") || ~uc.indexOf("Trident/");
var Hg = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Kg = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Cd = {
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
}, Xg = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, $d = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Te = "classic", Jo = "duotone", Jg = "sharp", Qg = "sharp-duotone", jd = [Te, Jo, Jg, Qg], Zg = {
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
}, eb = {
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
}, tb = /* @__PURE__ */ new Map([["classic", {
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
}]]), rb = {
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
}, nb = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], dc = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, ob = ["kit"], ab = {
  kit: {
    "fa-kit": "fak"
  }
}, ib = ["fak", "fakd"], sb = {
  kit: {
    fak: "fa-kit"
  }
}, pc = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, co = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, lb = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], cb = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], ub = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, fb = {
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
}, db = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Ci = {
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
}, pb = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], $i = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...lb, ...pb], mb = ["solid", "regular", "light", "thin", "duotone", "brands"], Id = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], hb = Id.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), gb = [...Object.keys(db), ...mb, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", co.GROUP, co.SWAP_OPACITY, co.PRIMARY, co.SECONDARY].concat(Id.map((e) => "".concat(e, "x"))).concat(hb.map((e) => "w-".concat(e))), bb = {
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
const At = "___FONT_AWESOME___", ji = 16, zd = "fa", _d = "svg-inline--fa", dr = "data-fa-i2svg", Ii = "data-fa-pseudo-element", yb = "data-fa-pseudo-element-pending", Bs = "data-prefix", Hs = "data-icon", mc = "fontawesome-i2svg", vb = "async", xb = ["HTML", "HEAD", "STYLE", "SCRIPT"], Md = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function Qn(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Te];
    }
  });
}
const Rd = D({}, Cd);
Rd[Te] = D(D(D(D({}, {
  "fa-duotone": "duotone"
}), Cd[Te]), dc.kit), dc["kit-duotone"]);
const wb = Qn(Rd), zi = D({}, rb);
zi[Te] = D(D(D(D({}, {
  duotone: "fad"
}), zi[Te]), pc.kit), pc["kit-duotone"]);
const hc = Qn(zi), _i = D({}, Ci);
_i[Te] = D(D({}, _i[Te]), sb.kit);
const Ks = Qn(_i), Mi = D({}, fb);
Mi[Te] = D(D({}, Mi[Te]), ab.kit);
Qn(Mi);
const kb = Hg, Td = "fa-layers-text", Ob = Kg, Sb = D({}, Zg);
Qn(Sb);
const Ab = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ea = Xg, Pb = [...ob, ...gb], kn = Qt.FontAwesomeConfig || {};
function Eb(e) {
  var t = Ce.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Nb(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
Ce && typeof Ce.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = Nb(Eb(t));
  n != null && (kn[r] = n);
});
const Dd = {
  styleDefault: "solid",
  familyDefault: Te,
  cssPrefix: zd,
  replacementClass: _d,
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
kn.familyPrefix && (kn.cssPrefix = kn.familyPrefix);
const Yr = D(D({}, Dd), kn);
Yr.autoReplaceSvg || (Yr.observeMutations = !1);
const H = {};
Object.keys(Dd).forEach((e) => {
  Object.defineProperty(H, e, {
    enumerable: !0,
    set: function(t) {
      Yr[e] = t, On.forEach((r) => r(H));
    },
    get: function() {
      return Yr[e];
    }
  });
});
Object.defineProperty(H, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Yr.cssPrefix = e, On.forEach((t) => t(H));
  },
  get: function() {
    return Yr.cssPrefix;
  }
});
Qt.FontAwesomeConfig = H;
const On = [];
function Cb(e) {
  return On.push(e), () => {
    On.splice(On.indexOf(e), 1);
  };
}
const _t = ji, dt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function $b(e) {
  if (!e || !jt)
    return;
  const t = Ce.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = Ce.head.childNodes;
  let n = null;
  for (let o = r.length - 1; o > -1; o--) {
    const a = r[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = a);
  }
  return Ce.head.insertBefore(t, n), e;
}
const jb = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function zn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += jb[Math.random() * 62 | 0];
  return t;
}
function Kr(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Xs(e) {
  return e.classList ? Kr(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Ld(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Ib(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(Ld(e[r]), '" '), "").trim();
}
function Qo(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Js(e) {
  return e.size !== dt.size || e.x !== dt.x || e.y !== dt.y || e.rotate !== dt.rotate || e.flipX || e.flipY;
}
function zb(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const o = {
    transform: "translate(".concat(r / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: c,
    path: l
  };
}
function _b(e) {
  let {
    transform: t,
    width: r = ji,
    height: n = ji,
    startCentered: o = !1
  } = e, a = "";
  return o && Nd ? a += "translate(".concat(t.x / _t - r / 2, "em, ").concat(t.y / _t - n / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / _t, "em), calc(-50% + ").concat(t.y / _t, "em)) ") : a += "translate(".concat(t.x / _t, "em, ").concat(t.y / _t, "em) "), a += "scale(".concat(t.size / _t * (t.flipX ? -1 : 1), ", ").concat(t.size / _t * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var Mb = `:root, :host {
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
function Fd() {
  const e = zd, t = _d, r = H.cssPrefix, n = H.replacementClass;
  let o = Mb;
  if (r !== e || n !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return o;
}
let gc = !1;
function Na() {
  H.autoAddCss && !gc && ($b(Fd()), gc = !0);
}
var Rb = {
  mixout() {
    return {
      dom: {
        css: Fd,
        insertCss: Na
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Na();
      },
      beforeI2svg() {
        Na();
      }
    };
  }
};
const Pt = Qt || {};
Pt[At] || (Pt[At] = {});
Pt[At].styles || (Pt[At].styles = {});
Pt[At].hooks || (Pt[At].hooks = {});
Pt[At].shims || (Pt[At].shims = []);
var pt = Pt[At];
const Vd = [], Wd = function() {
  Ce.removeEventListener("DOMContentLoaded", Wd), Ro = 1, Vd.map((e) => e());
};
let Ro = !1;
jt && (Ro = (Ce.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(Ce.readyState), Ro || Ce.addEventListener("DOMContentLoaded", Wd));
function Tb(e) {
  jt && (Ro ? setTimeout(e, 0) : Vd.push(e));
}
function Zn(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? Ld(e) : "<".concat(t, " ").concat(Ib(r), ">").concat(n.map(Zn).join(""), "</").concat(t, ">");
}
function bc(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var Ca = function(e, t, r, n) {
  var o = Object.keys(e), a = o.length, i = t, s, c, l;
  for (r === void 0 ? (s = 1, l = e[o[0]]) : (s = 0, l = r); s < a; s++)
    c = o[s], l = i(l, e[c], c, e);
  return l;
};
function Db(e) {
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
function Ud(e) {
  const t = Db(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Lb(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), o;
  return n >= 55296 && n <= 56319 && r > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function yc(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function Ri(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, o = yc(t);
  typeof pt.hooks.addPack == "function" && !n ? pt.hooks.addPack(e, yc(t)) : pt.styles[e] = D(D({}, pt.styles[e] || {}), o), e === "fas" && Ri("fa", t);
}
const {
  styles: _n,
  shims: Fb
} = pt, Gd = Object.keys(Ks), Vb = Gd.reduce((e, t) => (e[t] = Object.keys(Ks[t]), e), {});
let Qs = null, Yd = {}, qd = {}, Bd = {}, Hd = {}, Kd = {};
function Wb(e) {
  return ~Pb.indexOf(e);
}
function Ub(e, t) {
  const r = t.split("-"), n = r[0], o = r.slice(1).join("-");
  return n === e && o !== "" && !Wb(o) ? o : null;
}
const Xd = () => {
  const e = (n) => Ca(_n, (o, a, i) => (o[i] = Ca(a, n, {}), o), {});
  Yd = e((n, o, a) => (o[3] && (n[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = a;
  }), n)), qd = e((n, o, a) => (n[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = a;
  }), n)), Kd = e((n, o, a) => {
    const i = o[2];
    return n[a] = a, i.forEach((s) => {
      n[s] = a;
    }), n;
  });
  const t = "far" in _n || H.autoFetchSvg, r = Ca(Fb, (n, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (n.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (n.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  Bd = r.names, Hd = r.unicodes, Qs = Zo(H.styleDefault, {
    family: H.familyDefault
  });
};
Cb((e) => {
  Qs = Zo(e.styleDefault, {
    family: H.familyDefault
  });
});
Xd();
function Zs(e, t) {
  return (Yd[e] || {})[t];
}
function Gb(e, t) {
  return (qd[e] || {})[t];
}
function cr(e, t) {
  return (Kd[e] || {})[t];
}
function Jd(e) {
  return Bd[e] || {
    prefix: null,
    iconName: null
  };
}
function Yb(e) {
  const t = Hd[e], r = Zs("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Zt() {
  return Qs;
}
const Qd = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function qb(e) {
  let t = Te;
  const r = Gd.reduce((n, o) => (n[o] = "".concat(H.cssPrefix, "-").concat(o), n), {});
  return jd.forEach((n) => {
    (e.includes(r[n]) || e.some((o) => Vb[n].includes(o))) && (t = n);
  }), t;
}
function Zo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Te
  } = t, n = wb[r][e];
  if (r === Jo && !e)
    return "fad";
  const o = hc[r][e] || hc[r][n], a = e in pt.styles ? e : null;
  return o || a || null;
}
function Bb(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const o = Ub(H.cssPrefix, n);
    o ? r = o : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function vc(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function ea(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const o = $i.concat(cb), a = vc(e.filter((f) => o.includes(f))), i = vc(e.filter((f) => !$i.includes(f))), s = a.filter((f) => (n = f, !$d.includes(f))), [c = null] = s, l = qb(a), u = D(D({}, Bb(i)), {}, {
    prefix: Zo(c, {
      family: l
    })
  });
  return D(D(D({}, u), Jb({
    values: e,
    family: l,
    styles: _n,
    config: H,
    canonical: u,
    givenPrefix: n
  })), Hb(r, n, u));
}
function Hb(e, t, r) {
  let {
    prefix: n,
    iconName: o
  } = r;
  if (e || !n || !o)
    return {
      prefix: n,
      iconName: o
    };
  const a = t === "fa" ? Jd(o) : {}, i = cr(n, o);
  return o = a.iconName || i || o, n = a.prefix || n, n === "far" && !_n.far && _n.fas && !H.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: o
  };
}
const Kb = jd.filter((e) => e !== Te || e !== Jo), Xb = Object.keys(Ci).filter((e) => e !== Te).map((e) => Object.keys(Ci[e])).flat();
function Jb(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = r === Jo, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || u) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && Kb.includes(r) && (Object.keys(a).find((f) => Xb.includes(f)) || i.autoFetchSvg)) {
    const f = tb.get(r).defaultShortPrefixId;
    n.prefix = f, n.iconName = cr(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || o === "fa") && (n.prefix = Zt() || "fas"), n;
}
let Qb = class {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const o = r.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = D(D({}, this.definitions[a] || {}), o[a]), Ri(a, o[a]);
      const i = Ks[Te][a];
      i && Ri(i, o[a]), Xd();
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
        iconName: i,
        icon: s
      } = n[o], c = s[2];
      t[a] || (t[a] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[a][l] = s);
      }), t[a][i] = s;
    }), t;
  }
}, xc = [], Er = {};
const Mr = {}, Zb = Object.keys(Mr);
function ey(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return xc = e, Er = {}, Object.keys(Mr).forEach((n) => {
    Zb.indexOf(n) === -1 && delete Mr[n];
  }), xc.forEach((n) => {
    const o = n.mixout ? n.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (r[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        r[a] || (r[a] = {}), r[a][i] = o[a][i];
      });
    }), n.hooks) {
      const a = n.hooks();
      Object.keys(a).forEach((i) => {
        Er[i] || (Er[i] = []), Er[i].push(a[i]);
      });
    }
    n.provides && n.provides(Mr);
  }), r;
}
function Ti(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), o = 2; o < r; o++)
    n[o - 2] = arguments[o];
  return (Er[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...n]);
  }), t;
}
function pr(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (Er[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function er() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Mr[e] ? Mr[e].apply(null, t) : void 0;
}
function Di(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || Zt();
  if (t)
    return t = cr(r, t) || t, bc(Zd.definitions, r, t) || bc(pt.styles, r, t);
}
const Zd = new Qb(), ty = () => {
  H.autoReplaceSvg = !1, H.observeMutations = !1, pr("noAuto");
}, ry = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return jt ? (pr("beforeI2svg", e), er("pseudoElements2svg", e), er("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    H.autoReplaceSvg === !1 && (H.autoReplaceSvg = !0), H.observeMutations = !0, Tb(() => {
      oy({
        autoReplaceSvgRoot: t
      }), pr("watch", e);
    });
  }
}, ny = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: cr(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = Zo(e[0]);
      return {
        prefix: r,
        iconName: cr(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(H.cssPrefix, "-")) > -1 || e.match(kb))) {
      const t = ea(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Zt(),
        iconName: cr(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Zt();
      return {
        prefix: t,
        iconName: cr(t, e) || e
      };
    }
  }
}, qe = {
  noAuto: ty,
  config: H,
  dom: ry,
  parse: ny,
  library: Zd,
  findIconDefinition: Di,
  toHtml: Zn
}, oy = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = Ce
  } = e;
  (Object.keys(pt.styles).length > 0 || H.autoFetchSvg) && jt && H.autoReplaceSvg && qe.dom.i2svg({
    node: t
  });
};
function ta(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => Zn(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!jt) return;
      const r = Ce.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function ay(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Js(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    o.style = Qo(D(D({}, a), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function iy(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(H.cssPrefix, "-").concat(r) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: D(D({}, o), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function el(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: b
  } = r.found ? r : t, x = ib.includes(n), p = [H.replacementClass, o ? "".concat(H.cssPrefix, "-").concat(o) : ""].filter((g) => u.classes.indexOf(g) === -1).filter((g) => g !== "" || !!g).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: D(D({}, u.attributes), {}, {
      "data-prefix": n,
      "data-icon": o,
      class: p,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(b)
    })
  };
  const y = x && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / b * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[dr] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(l || zn())
    },
    children: [s]
  }), delete m.attributes.title);
  const k = D(D({}, m), {}, {
    prefix: n,
    iconName: o,
    main: t,
    mask: r,
    maskId: c,
    transform: a,
    symbol: i,
    styles: D(D({}, y), u.styles)
  }), {
    children: O,
    attributes: S
  } = r.found && t.found ? er("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : er("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = O, k.attributes = S, i ? iy(k) : ay(k);
}
function wc(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, c = D(D(D({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[dr] = "");
  const l = D({}, i.styles);
  Js(o) && (l.transform = _b({
    transform: o,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const u = Qo(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function sy(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, o = D(D(D({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), a = Qo(n.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), r && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [r]
  }), i;
}
const {
  styles: $a
} = pt;
function Li(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let o = null;
  return Array.isArray(n) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(H.cssPrefix, "-").concat(Ea.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(H.cssPrefix, "-").concat(Ea.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(H.cssPrefix, "-").concat(Ea.PRIMARY),
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
const ly = {
  found: !1,
  width: 512,
  height: 512
};
function cy(e, t) {
  !Md && !H.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Fi(e, t) {
  let r = t;
  return t === "fa" && H.styleDefault !== null && (t = Zt()), new Promise((n, o) => {
    if (r === "fa") {
      const a = Jd(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && $a[t] && $a[t][e]) {
      const a = $a[t][e];
      return n(Li(a));
    }
    cy(e, t), n(D(D({}, ly), {}, {
      icon: H.showMissingIcons && e ? er("missingIconAbstract") || {} : {}
    }));
  });
}
const kc = () => {
}, Vi = H.measurePerformance && lo && lo.mark && lo.measure ? lo : {
  mark: kc,
  measure: kc
}, bn = 'FA "6.7.2"', uy = (e) => (Vi.mark("".concat(bn, " ").concat(e, " begins")), () => ep(e)), ep = (e) => {
  Vi.mark("".concat(bn, " ").concat(e, " ends")), Vi.measure("".concat(bn, " ").concat(e), "".concat(bn, " ").concat(e, " begins"), "".concat(bn, " ").concat(e, " ends"));
};
var tl = {
  begin: uy,
  end: ep
};
const So = () => {
};
function Oc(e) {
  return typeof (e.getAttribute ? e.getAttribute(dr) : null) == "string";
}
function fy(e) {
  const t = e.getAttribute ? e.getAttribute(Bs) : null, r = e.getAttribute ? e.getAttribute(Hs) : null;
  return t && r;
}
function dy(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(H.replacementClass);
}
function py() {
  return H.autoReplaceSvg === !0 ? Ao.replace : Ao[H.autoReplaceSvg] || Ao.replace;
}
function my(e) {
  return Ce.createElementNS("http://www.w3.org/2000/svg", e);
}
function hy(e) {
  return Ce.createElement(e);
}
function tp(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? my : hy
  } = t;
  if (typeof e == "string")
    return Ce.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(tp(o, {
      ceFn: r
    }));
  }), n;
}
function gy(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Ao = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(tp(r), t);
      }), t.getAttribute(dr) === null && H.keepOriginalSource) {
        let r = Ce.createComment(gy(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Xs(t).indexOf(H.replacementClass))
      return Ao.replace(e);
    const n = new RegExp("".concat(H.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const a = r[0].attributes.class.split(" ").reduce((i, s) => (s === H.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = r.map((a) => Zn(a)).join(`
`);
    t.setAttribute(dr, ""), t.innerHTML = o;
  }
};
function Sc(e) {
  e();
}
function rp(e, t) {
  const r = typeof t == "function" ? t : So;
  if (e.length === 0)
    r();
  else {
    let n = Sc;
    H.mutateApproach === vb && (n = Qt.requestAnimationFrame || Sc), n(() => {
      const o = py(), a = tl.begin("mutate");
      e.map(o), a(), r();
    });
  }
}
let rl = !1;
function np() {
  rl = !0;
}
function Wi() {
  rl = !1;
}
let To = null;
function Ac(e) {
  if (!fc || !H.observeMutations)
    return;
  const {
    treeCallback: t = So,
    nodeCallback: r = So,
    pseudoElementsCallback: n = So,
    observeMutationsRoot: o = Ce
  } = e;
  To = new fc((a) => {
    if (rl) return;
    const i = Zt();
    Kr(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Oc(s.addedNodes[0]) && (H.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && H.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && Oc(s.target) && ~Ab.indexOf(s.attributeName))
        if (s.attributeName === "class" && fy(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = ea(Xs(s.target));
          s.target.setAttribute(Bs, c || i), l && s.target.setAttribute(Hs, l);
        } else dy(s.target) && r(s.target);
    });
  }), jt && To.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function by() {
  To && To.disconnect();
}
function yy(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function vy(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = ea(Xs(e));
  return o.prefix || (o.prefix = Zt()), t && r && (o.prefix = t, o.iconName = r), o.iconName && o.prefix || (o.prefix && n.length > 0 && (o.iconName = Gb(o.prefix, e.innerText) || Zs(o.prefix, Ud(e.innerText))), !o.iconName && H.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function xy(e) {
  const t = Kr(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return H.autoA11y && (r ? t["aria-labelledby"] = "".concat(H.replacementClass, "-title-").concat(n || zn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function wy() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: dt,
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
function Pc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: o
  } = vy(e), a = xy(e), i = Ti("parseNodeAttributes", {}, e);
  let s = t.styleParser ? yy(e) : [];
  return D({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: dt,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: s,
      attributes: a
    }
  }, i);
}
const {
  styles: ky
} = pt;
function op(e) {
  const t = H.autoReplaceSvg === "nest" ? Pc(e, {
    styleParser: !1
  }) : Pc(e);
  return ~t.extra.classes.indexOf(Td) ? er("generateLayersText", e, t) : er("generateSvgReplacementMutation", e, t);
}
function Oy() {
  return [...nb, ...$i];
}
function Ec(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!jt) return Promise.resolve();
  const r = Ce.documentElement.classList, n = (u) => r.add("".concat(mc, "-").concat(u)), o = (u) => r.remove("".concat(mc, "-").concat(u)), a = H.autoFetchSvg ? Oy() : $d.concat(Object.keys(ky));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(Td, ":not([").concat(dr, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(dr, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = Kr(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), o("complete");
  else
    return Promise.resolve();
  const c = tl.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = op(f);
      d && u.push(d);
    } catch (d) {
      Md || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      rp(d, () => {
        n("active"), n("complete"), o("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function Sy(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  op(e).then((r) => {
    r && rp([r], t);
  });
}
function Ay(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : Di(t || {});
    let {
      mask: o
    } = r;
    return o && (o = (o || {}).icon ? o : Di(o || {})), e(n, D(D({}, r), {}, {
      mask: o
    }));
  };
}
const Py = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = dt,
    symbol: n = !1,
    mask: o = null,
    maskId: a = null,
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
    icon: b
  } = e;
  return ta(D({
    type: "icon"
  }, e), () => (pr("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), H.autoA11y && (i ? l["aria-labelledby"] = "".concat(H.replacementClass, "-title-").concat(s || zn()) : (l["aria-hidden"] = "true", l.focusable = "false")), el({
    icons: {
      main: Li(b),
      mask: o ? Li(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: D(D({}, dt), r),
    symbol: n,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var Ey = {
  mixout() {
    return {
      icon: Ay(Py)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Ec, e.nodeCallback = Sy, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = Ce,
        callback: n = () => {
        }
      } = t;
      return Ec(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = r;
      return new Promise((d, b) => {
        Promise.all([Fi(n, i), l.iconName ? Fi(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((x) => {
          let [p, m] = x;
          d([t, el({
            icons: {
              main: p,
              mask: m
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = Qo(i);
      s.length > 0 && (n.style = s);
      let c;
      return Js(a) && (c = er("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), r.push(c || o.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, Ny = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return ta({
          type: "layer"
        }, () => {
          pr("beforeDOMElementCreation", {
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
              class: ["".concat(H.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, Cy = {
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
        return ta({
          type: "counter",
          content: e
        }, () => (pr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), sy({
          content: e.toString(),
          title: r,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(H.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, $y = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = dt,
          title: n = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return ta({
          type: "text",
          content: e
        }, () => (pr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), wc({
          content: e,
          transform: D(D({}, dt), r),
          title: n,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(H.cssPrefix, "-layers-text"), ...o]
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
      let i = null, s = null;
      if (Nd) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return H.autoA11y && !n && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, wc({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: n,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const jy = new RegExp('"', "ug"), Nc = [1105920, 1112319], Cc = D(D(D(D({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), eb), bb), ub), Ui = Object.keys(Cc).reduce((e, t) => (e[t.toLowerCase()] = Cc[t], e), {}), Iy = Object.keys(Ui).reduce((e, t) => {
  const r = Ui[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function zy(e) {
  const t = e.replace(jy, ""), r = Lb(t, 0), n = r >= Nc[0] && r <= Nc[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Ud(o ? t[0] : t),
    isSecondary: n || o
  };
}
function _y(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), o = isNaN(n) ? "normal" : n;
  return (Ui[r] || {})[o] || Iy[r];
}
function $c(e, t) {
  const r = "".concat(yb).concat(t.replace(":", "-"));
  return new Promise((n, o) => {
    if (e.getAttribute(r) !== null)
      return n();
    const a = Kr(e.children).filter((f) => f.getAttribute(Ii) === t)[0], i = Qt.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(Ob), l = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !c)
      return e.removeChild(a), n();
    if (c && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = _y(s, l);
      const {
        value: b,
        isSecondary: x
      } = zy(f), p = c[0].startsWith("FontAwesome");
      let m = Zs(d, b), y = m;
      if (p) {
        const k = Yb(b);
        k.iconName && k.prefix && (m = k.iconName, d = k.prefix);
      }
      if (m && !x && (!a || a.getAttribute(Bs) !== d || a.getAttribute(Hs) !== y)) {
        e.setAttribute(r, y), a && e.removeChild(a);
        const k = wy(), {
          extra: O
        } = k;
        O.attributes[Ii] = t, Fi(m, d).then((S) => {
          const g = el(D(D({}, k), {}, {
            icons: {
              main: S,
              mask: Qd()
            },
            prefix: d,
            iconName: y,
            extra: O,
            watchable: !0
          })), Y = Ce.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(Y, e.firstChild) : e.appendChild(Y), Y.outerHTML = g.map((U) => Zn(U)).join(`
`), e.removeAttribute(r), n();
        }).catch(o);
      } else
        n();
    } else
      n();
  });
}
function My(e) {
  return Promise.all([$c(e, "::before"), $c(e, "::after")]);
}
function Ry(e) {
  return e.parentNode !== document.head && !~xb.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Ii) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function jc(e) {
  if (jt)
    return new Promise((t, r) => {
      const n = Kr(e.querySelectorAll("*")).filter(Ry).map(My), o = tl.begin("searchPseudoElements");
      np(), Promise.all(n).then(() => {
        o(), Wi(), t();
      }).catch(() => {
        o(), Wi(), r();
      });
    });
}
var Ty = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = jc, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = Ce
      } = t;
      H.searchPseudoElements && jc(r);
    };
  }
};
let Ic = !1;
var Dy = {
  mixout() {
    return {
      dom: {
        unwatch() {
          np(), Ic = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Ac(Ti("mutationObserverCallbacks", {}));
      },
      noAuto() {
        by();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Ic ? Wi() : Ac(Ti("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const zc = (e) => {
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
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return r.flipX = !0, r;
    if (a && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (a) {
      case "grow":
        r.size = r.size + i;
        break;
      case "shrink":
        r.size = r.size - i;
        break;
      case "left":
        r.x = r.x - i;
        break;
      case "right":
        r.x = r.x + i;
        break;
      case "up":
        r.y = r.y - i;
        break;
      case "down":
        r.y = r.y + i;
        break;
      case "rotate":
        r.rotate = r.rotate + i;
        break;
    }
    return r;
  }, t);
};
var Ly = {
  mixout() {
    return {
      parse: {
        transform: (e) => zc(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = zc(r)), e;
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
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: D({}, d.outer),
        children: [{
          tag: "g",
          attributes: D({}, d.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: D(D({}, r.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const ja = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function _c(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Fy(e) {
  return e.tag === "g" ? e.children : [e];
}
var Vy = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? ea(r.split(" ").map((o) => o.trim())) : Qd();
        return n.prefix || (n.prefix = Zt()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = o, {
        width: u,
        icon: f
      } = a, d = zb({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), b = {
        tag: "rect",
        attributes: D(D({}, ja), {}, {
          fill: "white"
        })
      }, x = l.children ? {
        children: l.children.map(_c)
      } : {}, p = {
        tag: "g",
        attributes: D({}, d.inner),
        children: [_c(D({
          tag: l.tag,
          attributes: D(D({}, l.attributes), d.path)
        }, x))]
      }, m = {
        tag: "g",
        attributes: D({}, d.outer),
        children: [p]
      }, y = "mask-".concat(i || zn()), k = "clip-".concat(i || zn()), O = {
        tag: "mask",
        attributes: D(D({}, ja), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, m]
      }, S = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: Fy(f)
        }, O]
      };
      return r.push(S, {
        tag: "rect",
        attributes: D({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(y, ")")
        }, ja)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, Wy = {
  provides(e) {
    let t = !1;
    Qt.matchMedia && (t = Qt.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: D(D({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = D(D({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: D(D({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: D(D({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: D(D({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: D(D({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: D(D({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: D(D({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: D(D({}, a), {}, {
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
}, Uy = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, Gy = [Rb, Ey, Ny, Cy, $y, Ty, Dy, Ly, Vy, Wy, Uy];
ey(Gy, {
  mixoutsTo: qe
});
qe.noAuto;
qe.config;
qe.library;
qe.dom;
const Gi = qe.parse;
qe.findIconDefinition;
qe.toHtml;
const Yy = qe.icon;
qe.layer;
qe.text;
qe.counter;
function qy(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var uo = { exports: {} }, Ia = { exports: {} }, be = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Mc;
function By() {
  if (Mc) return be;
  Mc = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function O(g) {
    if (typeof g == "object" && g !== null) {
      var Y = g.$$typeof;
      switch (Y) {
        case t:
          switch (g = g.type, g) {
            case c:
            case l:
            case n:
            case a:
            case o:
            case f:
              return g;
            default:
              switch (g = g && g.$$typeof, g) {
                case s:
                case u:
                case x:
                case b:
                case i:
                  return g;
                default:
                  return Y;
              }
          }
        case r:
          return Y;
      }
    }
  }
  function S(g) {
    return O(g) === l;
  }
  return be.AsyncMode = c, be.ConcurrentMode = l, be.ContextConsumer = s, be.ContextProvider = i, be.Element = t, be.ForwardRef = u, be.Fragment = n, be.Lazy = x, be.Memo = b, be.Portal = r, be.Profiler = a, be.StrictMode = o, be.Suspense = f, be.isAsyncMode = function(g) {
    return S(g) || O(g) === c;
  }, be.isConcurrentMode = S, be.isContextConsumer = function(g) {
    return O(g) === s;
  }, be.isContextProvider = function(g) {
    return O(g) === i;
  }, be.isElement = function(g) {
    return typeof g == "object" && g !== null && g.$$typeof === t;
  }, be.isForwardRef = function(g) {
    return O(g) === u;
  }, be.isFragment = function(g) {
    return O(g) === n;
  }, be.isLazy = function(g) {
    return O(g) === x;
  }, be.isMemo = function(g) {
    return O(g) === b;
  }, be.isPortal = function(g) {
    return O(g) === r;
  }, be.isProfiler = function(g) {
    return O(g) === a;
  }, be.isStrictMode = function(g) {
    return O(g) === o;
  }, be.isSuspense = function(g) {
    return O(g) === f;
  }, be.isValidElementType = function(g) {
    return typeof g == "string" || typeof g == "function" || g === n || g === l || g === a || g === o || g === f || g === d || typeof g == "object" && g !== null && (g.$$typeof === x || g.$$typeof === b || g.$$typeof === i || g.$$typeof === s || g.$$typeof === u || g.$$typeof === m || g.$$typeof === y || g.$$typeof === k || g.$$typeof === p);
  }, be.typeOf = O, be;
}
var xe = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Rc;
function Hy() {
  return Rc || (Rc = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function O(w) {
      return typeof w == "string" || typeof w == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      w === n || w === l || w === a || w === o || w === f || w === d || typeof w == "object" && w !== null && (w.$$typeof === x || w.$$typeof === b || w.$$typeof === i || w.$$typeof === s || w.$$typeof === u || w.$$typeof === m || w.$$typeof === y || w.$$typeof === k || w.$$typeof === p);
    }
    function S(w) {
      if (typeof w == "object" && w !== null) {
        var ge = w.$$typeof;
        switch (ge) {
          case t:
            var Ie = w.type;
            switch (Ie) {
              case c:
              case l:
              case n:
              case a:
              case o:
              case f:
                return Ie;
              default:
                var Ke = Ie && Ie.$$typeof;
                switch (Ke) {
                  case s:
                  case u:
                  case x:
                  case b:
                  case i:
                    return Ke;
                  default:
                    return ge;
                }
            }
          case r:
            return ge;
        }
      }
    }
    var g = c, Y = l, U = s, te = i, J = t, oe = u, ne = n, E = x, fe = b, W = r, N = a, T = o, B = f, q = !1;
    function re(w) {
      return q || (q = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), h(w) || S(w) === c;
    }
    function h(w) {
      return S(w) === l;
    }
    function v(w) {
      return S(w) === s;
    }
    function C(w) {
      return S(w) === i;
    }
    function I(w) {
      return typeof w == "object" && w !== null && w.$$typeof === t;
    }
    function P(w) {
      return S(w) === u;
    }
    function z(w) {
      return S(w) === n;
    }
    function $(w) {
      return S(w) === x;
    }
    function j(w) {
      return S(w) === b;
    }
    function M(w) {
      return S(w) === r;
    }
    function _(w) {
      return S(w) === a;
    }
    function R(w) {
      return S(w) === o;
    }
    function Q(w) {
      return S(w) === f;
    }
    xe.AsyncMode = g, xe.ConcurrentMode = Y, xe.ContextConsumer = U, xe.ContextProvider = te, xe.Element = J, xe.ForwardRef = oe, xe.Fragment = ne, xe.Lazy = E, xe.Memo = fe, xe.Portal = W, xe.Profiler = N, xe.StrictMode = T, xe.Suspense = B, xe.isAsyncMode = re, xe.isConcurrentMode = h, xe.isContextConsumer = v, xe.isContextProvider = C, xe.isElement = I, xe.isForwardRef = P, xe.isFragment = z, xe.isLazy = $, xe.isMemo = j, xe.isPortal = M, xe.isProfiler = _, xe.isStrictMode = R, xe.isSuspense = Q, xe.isValidElementType = O, xe.typeOf = S;
  }()), xe;
}
var Tc;
function ap() {
  return Tc || (Tc = 1, process.env.NODE_ENV === "production" ? Ia.exports = By() : Ia.exports = Hy()), Ia.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var za, Dc;
function Ky() {
  if (Dc) return za;
  Dc = 1;
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
  return za = o() ? Object.assign : function(a, i) {
    for (var s, c = n(a), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          r.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, za;
}
var _a, Lc;
function nl() {
  if (Lc) return _a;
  Lc = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return _a = e, _a;
}
var Fc, Vc;
function ip() {
  return Vc || (Vc = 1, Fc = Function.call.bind(Object.prototype.hasOwnProperty)), Fc;
}
var Ma, Wc;
function Xy() {
  if (Wc) return Ma;
  Wc = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ nl(), r = {}, n = /* @__PURE__ */ ip();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (n(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, c, s, null, t);
          } catch (x) {
            f = x;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in r)) {
            r[f.message] = !0;
            var b = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (b ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Ma = o, Ma;
}
var Ra, Uc;
function Jy() {
  if (Uc) return Ra;
  Uc = 1;
  var e = ap(), t = Ky(), r = /* @__PURE__ */ nl(), n = /* @__PURE__ */ ip(), o = /* @__PURE__ */ Xy(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
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
    function f(h) {
      var v = h && (l && h[l] || h[u]);
      if (typeof v == "function")
        return v;
    }
    var d = "<<anonymous>>", b = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: k(),
      arrayOf: O,
      element: S(),
      elementType: g(),
      instanceOf: Y,
      node: oe(),
      objectOf: te,
      oneOf: U,
      oneOfType: J,
      shape: E,
      exact: fe
    };
    function x(h, v) {
      return h === v ? h !== 0 || 1 / h === 1 / v : h !== h && v !== v;
    }
    function p(h, v) {
      this.message = h, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function m(h) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, C = 0;
      function I(z, $, j, M, _, R, Q) {
        if (M = M || d, R = R || j, Q !== r) {
          if (c) {
            var w = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw w.name = "Invariant Violation", w;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ge = M + ":" + j;
            !v[ge] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + R + "` prop on `" + M + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[ge] = !0, C++);
          }
        }
        return $[j] == null ? z ? $[j] === null ? new p("The " + _ + " `" + R + "` is marked as required " + ("in `" + M + "`, but its value is `null`.")) : new p("The " + _ + " `" + R + "` is marked as required in " + ("`" + M + "`, but its value is `undefined`.")) : null : h($, j, M, _, R);
      }
      var P = I.bind(null, !1);
      return P.isRequired = I.bind(null, !0), P;
    }
    function y(h) {
      function v(C, I, P, z, $, j) {
        var M = C[I], _ = T(M);
        if (_ !== h) {
          var R = B(M);
          return new p(
            "Invalid " + z + " `" + $ + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected ") + ("`" + h + "`."),
            { expectedType: h }
          );
        }
        return null;
      }
      return m(v);
    }
    function k() {
      return m(i);
    }
    function O(h) {
      function v(C, I, P, z, $) {
        if (typeof h != "function")
          return new p("Property `" + $ + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var j = C[I];
        if (!Array.isArray(j)) {
          var M = T(j);
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected an array."));
        }
        for (var _ = 0; _ < j.length; _++) {
          var R = h(j, _, P, z, $ + "[" + _ + "]", r);
          if (R instanceof Error)
            return R;
        }
        return null;
      }
      return m(v);
    }
    function S() {
      function h(v, C, I, P, z) {
        var $ = v[C];
        if (!s($)) {
          var j = T($);
          return new p("Invalid " + P + " `" + z + "` of type " + ("`" + j + "` supplied to `" + I + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(h);
    }
    function g() {
      function h(v, C, I, P, z) {
        var $ = v[C];
        if (!e.isValidElementType($)) {
          var j = T($);
          return new p("Invalid " + P + " `" + z + "` of type " + ("`" + j + "` supplied to `" + I + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(h);
    }
    function Y(h) {
      function v(C, I, P, z, $) {
        if (!(C[I] instanceof h)) {
          var j = h.name || d, M = re(C[I]);
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected ") + ("instance of `" + j + "`."));
        }
        return null;
      }
      return m(v);
    }
    function U(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function v(C, I, P, z, $) {
        for (var j = C[I], M = 0; M < h.length; M++)
          if (x(j, h[M]))
            return null;
        var _ = JSON.stringify(h, function(R, Q) {
          var w = B(Q);
          return w === "symbol" ? String(Q) : Q;
        });
        return new p("Invalid " + z + " `" + $ + "` of value `" + String(j) + "` " + ("supplied to `" + P + "`, expected one of " + _ + "."));
      }
      return m(v);
    }
    function te(h) {
      function v(C, I, P, z, $) {
        if (typeof h != "function")
          return new p("Property `" + $ + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected an object."));
        for (var _ in j)
          if (n(j, _)) {
            var R = h(j, _, P, z, $ + "." + _, r);
            if (R instanceof Error)
              return R;
          }
        return null;
      }
      return m(v);
    }
    function J(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var v = 0; v < h.length; v++) {
        var C = h[v];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + q(C) + " at index " + v + "."
          ), i;
      }
      function I(P, z, $, j, M) {
        for (var _ = [], R = 0; R < h.length; R++) {
          var Q = h[R], w = Q(P, z, $, j, M, r);
          if (w == null)
            return null;
          w.data && n(w.data, "expectedType") && _.push(w.data.expectedType);
        }
        var ge = _.length > 0 ? ", expected one of type [" + _.join(", ") + "]" : "";
        return new p("Invalid " + j + " `" + M + "` supplied to " + ("`" + $ + "`" + ge + "."));
      }
      return m(I);
    }
    function oe() {
      function h(v, C, I, P, z) {
        return W(v[C]) ? null : new p("Invalid " + P + " `" + z + "` supplied to " + ("`" + I + "`, expected a ReactNode."));
      }
      return m(h);
    }
    function ne(h, v, C, I, P) {
      return new p(
        (h || "React class") + ": " + v + " type `" + C + "." + I + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function E(h) {
      function v(C, I, P, z, $) {
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type `" + M + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var _ in h) {
          var R = h[_];
          if (typeof R != "function")
            return ne(P, z, $, _, B(R));
          var Q = R(j, _, P, z, $ + "." + _, r);
          if (Q)
            return Q;
        }
        return null;
      }
      return m(v);
    }
    function fe(h) {
      function v(C, I, P, z, $) {
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type `" + M + "` " + ("supplied to `" + P + "`, expected `object`."));
        var _ = t({}, C[I], h);
        for (var R in _) {
          var Q = h[R];
          if (n(h, R) && typeof Q != "function")
            return ne(P, z, $, R, B(Q));
          if (!Q)
            return new p(
              "Invalid " + z + " `" + $ + "` key `" + R + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(C[I], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(h), null, "  ")
            );
          var w = Q(j, R, P, z, $ + "." + R, r);
          if (w)
            return w;
        }
        return null;
      }
      return m(v);
    }
    function W(h) {
      switch (typeof h) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !h;
        case "object":
          if (Array.isArray(h))
            return h.every(W);
          if (h === null || s(h))
            return !0;
          var v = f(h);
          if (v) {
            var C = v.call(h), I;
            if (v !== h.entries) {
              for (; !(I = C.next()).done; )
                if (!W(I.value))
                  return !1;
            } else
              for (; !(I = C.next()).done; ) {
                var P = I.value;
                if (P && !W(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function N(h, v) {
      return h === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function T(h) {
      var v = typeof h;
      return Array.isArray(h) ? "array" : h instanceof RegExp ? "object" : N(v, h) ? "symbol" : v;
    }
    function B(h) {
      if (typeof h > "u" || h === null)
        return "" + h;
      var v = T(h);
      if (v === "object") {
        if (h instanceof Date)
          return "date";
        if (h instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function q(h) {
      var v = B(h);
      switch (v) {
        case "array":
        case "object":
          return "an " + v;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + v;
        default:
          return v;
      }
    }
    function re(h) {
      return !h.constructor || !h.constructor.name ? d : h.constructor.name;
    }
    return b.checkPropTypes = o, b.resetWarningCache = o.resetWarningCache, b.PropTypes = b, b;
  }, Ra;
}
var Ta, Gc;
function Qy() {
  if (Gc) return Ta;
  Gc = 1;
  var e = /* @__PURE__ */ nl();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, Ta = function() {
    function n(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
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
  }, Ta;
}
var Yc;
function Zy() {
  if (Yc) return uo.exports;
  if (Yc = 1, process.env.NODE_ENV !== "production") {
    var e = ap(), t = !0;
    uo.exports = /* @__PURE__ */ Jy()(e.isElement, t);
  } else
    uo.exports = /* @__PURE__ */ Qy()();
  return uo.exports;
}
var ev = /* @__PURE__ */ Zy();
const de = /* @__PURE__ */ qy(ev);
function qc(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function lt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? qc(Object(r), !0).forEach(function(n) {
      Nr(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : qc(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Do(e) {
  "@babel/helpers - typeof";
  return Do = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Do(e);
}
function Nr(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function tv(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), o, a;
  for (a = 0; a < n.length; a++)
    o = n[a], !(t.indexOf(o) >= 0) && (r[o] = e[o]);
  return r;
}
function rv(e, t) {
  if (e == null) return {};
  var r = tv(e, t), n, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      n = a[o], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function Yi(e) {
  return nv(e) || ov(e) || av(e) || iv();
}
function nv(e) {
  if (Array.isArray(e)) return qi(e);
}
function ov(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function av(e, t) {
  if (e) {
    if (typeof e == "string") return qi(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return qi(e, t);
  }
}
function qi(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function iv() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function sv(e) {
  var t, r = e.beat, n = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, b = e.inverse, x = e.border, p = e.listItem, m = e.flip, y = e.size, k = e.rotation, O = e.pull, S = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": b,
    "fa-border": x,
    "fa-li": p,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, Nr(t, "fa-".concat(y), typeof y < "u" && y !== null), Nr(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), Nr(t, "fa-pull-".concat(O), typeof O < "u" && O !== null), Nr(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(S).map(function(g) {
    return S[g] ? g : null;
  }).filter(function(g) {
    return g;
  });
}
function lv(e) {
  return e = e - 0, e === e;
}
function sp(e) {
  return lv(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var cv = ["style"];
function uv(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function fv(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), o = sp(r.slice(0, n)), a = r.slice(n + 1).trim();
    return o.startsWith("webkit") ? t[uv(o)] = a : t[o] = a, t;
  }, {});
}
function lp(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return lp(e, c);
  }), o = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = fv(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[sp(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), a = r.style, i = a === void 0 ? {} : a, s = rv(r, cv);
  return o.attrs.style = lt(lt({}, o.attrs.style), i), e.apply(void 0, [t.tag, lt(lt({}, o.attrs), s)].concat(Yi(n)));
}
var cp = !1;
try {
  cp = process.env.NODE_ENV === "production";
} catch {
}
function dv() {
  if (!cp && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Bc(e) {
  if (e && Do(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Gi.icon)
    return Gi.icon(e);
  if (e === null)
    return null;
  if (e && Do(e) === "object" && e.prefix && e.iconName)
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
function Da(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Nr({}, e, t) : {};
}
var Hc = {
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
}, We = /* @__PURE__ */ sr.forwardRef(function(e, t) {
  var r = lt(lt({}, Hc), e), n = r.icon, o = r.mask, a = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, u = Bc(n), f = Da("classes", [].concat(Yi(sv(r)), Yi((i || "").split(" ")))), d = Da("transform", typeof r.transform == "string" ? Gi.transform(r.transform) : r.transform), b = Da("mask", Bc(o)), x = Yy(u, lt(lt(lt(lt({}, f), d), b), {}, {
    symbol: a,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!x)
    return dv("Could not find icon", u), null;
  var p = x.abstract, m = {
    ref: t
  };
  return Object.keys(r).forEach(function(y) {
    Hc.hasOwnProperty(y) || (m[y] = r[y]);
  }), pv(p[0], m);
});
We.displayName = "FontAwesomeIcon";
We.propTypes = {
  beat: de.bool,
  border: de.bool,
  beatFade: de.bool,
  bounce: de.bool,
  className: de.string,
  fade: de.bool,
  flash: de.bool,
  mask: de.oneOfType([de.object, de.array, de.string]),
  maskId: de.string,
  fixedWidth: de.bool,
  inverse: de.bool,
  flip: de.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: de.oneOfType([de.object, de.array, de.string]),
  listItem: de.bool,
  pull: de.oneOf(["right", "left"]),
  pulse: de.bool,
  rotation: de.oneOf([0, 90, 180, 270]),
  shake: de.bool,
  size: de.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: de.bool,
  spinPulse: de.bool,
  spinReverse: de.bool,
  symbol: de.oneOfType([de.bool, de.string]),
  title: de.string,
  titleId: de.string,
  transform: de.oneOfType([de.string, de.object]),
  swapOpacity: de.bool
};
var pv = lp.bind(null, sr.createElement);
const ol = "-", mv = (e) => {
  const t = gv(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(ol);
      return a[0] === "" && a.length !== 1 && a.shift(), up(a, t) || hv(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = r[o] || [];
      return a && n[o] ? [...i, ...n[o]] : i;
    }
  };
}, up = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? up(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(ol);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, Kc = /^\[(.+)\]$/, hv = (e) => {
  if (Kc.test(e)) {
    const t = Kc.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, gv = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return yv(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    Bi(a, n, o, t);
  }), n;
}, Bi = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Xc(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (bv(o)) {
        Bi(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Bi(i, Xc(t, a), r, n);
    });
  });
}, Xc = (e, t) => {
  let r = e;
  return t.split(ol).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, bv = (e) => e.isThemeGetter, yv = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, vv = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, fp = "!", xv = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let y = s[m];
      if (l === 0) {
        if (y === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (y === "/") {
          f = m;
          continue;
        }
      }
      y === "[" ? l++ : y === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(fp), x = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: x,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, wv = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, kv = (e) => ({
  cache: vv(e.cacheSize),
  parseClassName: xv(e),
  ...mv(e)
}), Ov = /\s+/, Sv = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(Ov);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let x = !!b, p = n(x ? d.substring(0, b) : d);
    if (!p) {
      if (!x) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const m = wv(u).join(":"), y = f ? m + fp : m, k = y + p;
    if (a.includes(k))
      continue;
    a.push(k);
    const O = o(p, x);
    for (let S = 0; S < O.length; ++S) {
      const g = O[S];
      a.push(y + g);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Av() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = dp(t)) && (n && (n += " "), n += r);
  return n;
}
const dp = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = dp(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Pv(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = kv(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = Sv(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(Av.apply(null, arguments));
  };
}
const Ae = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, pp = /^\[(?:([a-z-]+):)?(.+)\]$/i, Ev = /^\d+\/\d+$/, Nv = /* @__PURE__ */ new Set(["px", "full", "screen"]), Cv = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, $v = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, jv = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Iv = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, zv = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, xt = (e) => Rr(e) || Nv.has(e) || Ev.test(e), Mt = (e) => Xr(e, "length", Vv), Rr = (e) => !!e && !Number.isNaN(Number(e)), La = (e) => Xr(e, "number", Rr), nn = (e) => !!e && Number.isInteger(Number(e)), _v = (e) => e.endsWith("%") && Rr(e.slice(0, -1)), ie = (e) => pp.test(e), Rt = (e) => Cv.test(e), Mv = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Rv = (e) => Xr(e, Mv, mp), Tv = (e) => Xr(e, "position", mp), Dv = /* @__PURE__ */ new Set(["image", "url"]), Lv = (e) => Xr(e, Dv, Uv), Fv = (e) => Xr(e, "", Wv), on = () => !0, Xr = (e, t, r) => {
  const n = pp.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, Vv = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  $v.test(e) && !jv.test(e)
), mp = () => !1, Wv = (e) => Iv.test(e), Uv = (e) => zv.test(e), Gv = () => {
  const e = Ae("colors"), t = Ae("spacing"), r = Ae("blur"), n = Ae("brightness"), o = Ae("borderColor"), a = Ae("borderRadius"), i = Ae("borderSpacing"), s = Ae("borderWidth"), c = Ae("contrast"), l = Ae("grayscale"), u = Ae("hueRotate"), f = Ae("invert"), d = Ae("gap"), b = Ae("gradientColorStops"), x = Ae("gradientColorStopPositions"), p = Ae("inset"), m = Ae("margin"), y = Ae("opacity"), k = Ae("padding"), O = Ae("saturate"), S = Ae("scale"), g = Ae("sepia"), Y = Ae("skew"), U = Ae("space"), te = Ae("translate"), J = () => ["auto", "contain", "none"], oe = () => ["auto", "hidden", "clip", "visible", "scroll"], ne = () => ["auto", ie, t], E = () => [ie, t], fe = () => ["", xt, Mt], W = () => ["auto", Rr, ie], N = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], T = () => ["solid", "dashed", "dotted", "double", "none"], B = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], re = () => ["", "0", ie], h = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Rr, ie];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [on],
      spacing: [xt, Mt],
      blur: ["none", "", Rt, ie],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Rt, ie],
      borderSpacing: E(),
      borderWidth: fe(),
      contrast: v(),
      grayscale: re(),
      hueRotate: v(),
      invert: re(),
      gap: E(),
      gradientColorStops: [e],
      gradientColorStopPositions: [_v, Mt],
      inset: ne(),
      margin: ne(),
      opacity: v(),
      padding: E(),
      saturate: v(),
      scale: v(),
      sepia: re(),
      skew: v(),
      space: E(),
      translate: E()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", ie]
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
        columns: [Rt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": h()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": h()
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
        object: [...N(), ie]
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", nn, ie]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ne()
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
        flex: ["1", "auto", "initial", "none", ie]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: re()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: re()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", nn, ie]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [on]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", nn, ie]
        }, ie]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": W()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": W()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [on]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [nn, ie]
        }, ie]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": W()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": W()
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
        "auto-cols": ["auto", "min", "max", "fr", ie]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", ie]
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
        justify: ["normal", ...q()]
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
        content: ["normal", ...q(), "baseline"]
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
        "place-content": [...q(), "baseline"]
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
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [m]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [m]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [m]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [m]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [m]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [m]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [m]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [m]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [m]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [U]
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
        "space-y": [U]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", ie, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [ie, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [ie, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Rt]
        }, Rt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [ie, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [ie, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [ie, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [ie, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Rt, Mt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", La]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [on]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", ie]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Rr, La]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", xt, ie]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", ie]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", ie]
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
        "placeholder-opacity": [y]
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
        "text-opacity": [y]
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
        decoration: [...T(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", xt, Mt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", xt, ie]
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
        indent: E()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", ie]
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
        content: ["none", ie]
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
        "bg-opacity": [y]
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
        bg: [...N(), Tv]
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
        }, Lv]
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
        from: [x]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [x]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [x]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [y]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...T(), "hidden"]
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
        "divide-opacity": [y]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: T()
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
        outline: ["", ...T()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [xt, ie]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [xt, Mt]
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
        ring: fe()
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
        "ring-opacity": [y]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [xt, Mt]
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
        shadow: ["", "inner", "none", Rt, Fv]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [on]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [y]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...B(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": B()
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
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Rt, ie]
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
        saturate: [O]
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
        "backdrop-opacity": [y]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", ie]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: v()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", ie]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: v()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", ie]
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
        scale: [S]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [S]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [S]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [nn, ie]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [te]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [te]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [Y]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Y]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", ie]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", ie]
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
        "scroll-m": E()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": E()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": E()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": E()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": E()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": E()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": E()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": E()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": E()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": E()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": E()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": E()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": E()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": E()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": E()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": E()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": E()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": E()
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
        "will-change": ["auto", "scroll", "contents", "transform", ie]
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
        stroke: [xt, Mt, La]
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
}, Jc = /* @__PURE__ */ Pv(Gv);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const kr = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, Qc = ({
  icon: e,
  iconClassName: t,
  children: r,
  className: n,
  htmlFor: o,
  variant: a = "primary",
  disabled: i,
  iconFlip: s = !1,
  loading: c,
  as: l = "button",
  href: u,
  target: f,
  ...d
}) => {
  function b(m) {
    switch (m) {
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
  const x = Jc(
    i || c ? "opacity-50 pointer-events-none" : ""
  ), p = Jc(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    b(a),
    n,
    x
  );
  return o ? /* @__PURE__ */ Ye("label", { className: p, htmlFor: o, style: d.style, children: [
    c && !s ? /* @__PURE__ */ G(We, { icon: kr, className: "animate-spin" }) : /* @__PURE__ */ G(st, { children: e && !s ? /* @__PURE__ */ G(We, { icon: e, className: t }) : null }),
    r,
    c && s ? /* @__PURE__ */ G(We, { icon: kr, className: "animate-spin" }) : /* @__PURE__ */ G(st, { children: e && s ? /* @__PURE__ */ G(We, { icon: e, className: t }) : null })
  ] }) : l === "link" && u ? /* @__PURE__ */ Ye(
    "a",
    {
      href: u,
      className: p,
      style: d.style,
      ...d,
      target: f,
      children: [
        c && !s ? /* @__PURE__ */ G(We, { icon: kr, className: "animate-spin" }) : /* @__PURE__ */ G(st, { children: e && !s ? /* @__PURE__ */ G(We, { icon: e, className: t }) : null }),
        r,
        c && s ? /* @__PURE__ */ G(We, { icon: kr, className: "animate-spin" }) : /* @__PURE__ */ G(st, { children: e && s ? /* @__PURE__ */ G(We, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ Ye(
    "button",
    {
      className: p,
      disabled: i || c,
      ...d,
      htmlFor: o,
      children: [
        c && !s ? /* @__PURE__ */ G(We, { icon: kr, className: "animate-spin" }) : /* @__PURE__ */ G(st, { children: e && !s ? /* @__PURE__ */ G(We, { icon: e, className: t }) : null }),
        r,
        c && s ? /* @__PURE__ */ G(We, { icon: kr, className: "animate-spin" }) : /* @__PURE__ */ G(st, { children: e && s ? /* @__PURE__ */ G(We, { icon: e, className: t }) : null })
      ]
    }
  );
};
var Po = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(Po || {});
Po.FEATURED, Po.MINE, Po.BOOKMARKED;
function Xt(e, t, { checkForDefaultPrevented: r = !0 } = {}) {
  return function(n) {
    if (e == null || e(n), r === !1 || !n.defaultPrevented)
      return t == null ? void 0 : t(n);
  };
}
function Zc(e, t) {
  if (typeof e == "function")
    return e(t);
  e != null && (e.current = t);
}
function hp(...e) {
  return (t) => {
    let r = !1;
    const n = e.map((o) => {
      const a = Zc(o, t);
      return !r && typeof a == "function" && (r = !0), a;
    });
    if (r)
      return () => {
        for (let o = 0; o < n.length; o++) {
          const a = n[o];
          typeof a == "function" ? a() : Zc(e[o], null);
        }
      };
  };
}
function xr(...e) {
  return A.useCallback(hp(...e), e);
}
function Yv(e, t) {
  const r = A.createContext(t), n = (a) => {
    const { children: i, ...s } = a, c = A.useMemo(() => s, Object.values(s));
    return /* @__PURE__ */ G(r.Provider, { value: c, children: i });
  };
  n.displayName = e + "Provider";
  function o(a) {
    const i = A.useContext(r);
    if (i) return i;
    if (t !== void 0) return t;
    throw new Error(`\`${a}\` must be used within \`${e}\``);
  }
  return [n, o];
}
function qv(e, t = []) {
  let r = [];
  function n(a, i) {
    const s = A.createContext(i), c = r.length;
    r = [...r, i];
    const l = (f) => {
      var d;
      const { scope: b, children: x, ...p } = f, m = ((d = b == null ? void 0 : b[e]) == null ? void 0 : d[c]) || s, y = A.useMemo(() => p, Object.values(p));
      return /* @__PURE__ */ G(m.Provider, { value: y, children: x });
    };
    l.displayName = a + "Provider";
    function u(f, d) {
      var b;
      const x = ((b = d == null ? void 0 : d[e]) == null ? void 0 : b[c]) || s, p = A.useContext(x);
      if (p) return p;
      if (i !== void 0) return i;
      throw new Error(`\`${f}\` must be used within \`${a}\``);
    }
    return [l, u];
  }
  const o = () => {
    const a = r.map((i) => A.createContext(i));
    return function(i) {
      const s = (i == null ? void 0 : i[e]) || a;
      return A.useMemo(
        () => ({ [`__scope${e}`]: { ...i, [e]: s } }),
        [i, s]
      );
    };
  };
  return o.scopeName = e, [n, Bv(o, ...t)];
}
function Bv(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const r = () => {
    const n = e.map((o) => ({
      useScope: o(),
      scopeName: o.scopeName
    }));
    return function(o) {
      const a = n.reduce((i, { useScope: s, scopeName: c }) => {
        const l = s(o)[`__scope${c}`];
        return { ...i, ...l };
      }, {});
      return A.useMemo(() => ({ [`__scope${t.scopeName}`]: a }), [a]);
    };
  };
  return r.scopeName = t.scopeName, r;
}
var Mn = globalThis != null && globalThis.document ? A.useLayoutEffect : () => {
}, Hv = A[" useId ".trim().toString()] || (() => {
}), Kv = 0;
function Fa(e) {
  const [t, r] = A.useState(Hv());
  return Mn(() => {
    r((n) => n ?? String(Kv++));
  }, [e]), e || (t ? `radix-${t}` : "");
}
var Xv = A[" useInsertionEffect ".trim().toString()] || Mn;
function Jv({
  prop: e,
  defaultProp: t,
  onChange: r = () => {
  },
  caller: n
}) {
  const [o, a, i] = Qv({
    defaultProp: t,
    onChange: r
  }), s = e !== void 0, c = s ? e : o;
  {
    const u = A.useRef(e !== void 0);
    A.useEffect(() => {
      const f = u.current;
      f !== s && console.warn(
        `${n} is changing from ${f ? "controlled" : "uncontrolled"} to ${s ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
      ), u.current = s;
    }, [s, n]);
  }
  const l = A.useCallback(
    (u) => {
      var f;
      if (s) {
        const d = Zv(u) ? u(e) : u;
        d !== e && ((f = i.current) == null || f.call(i, d));
      } else
        a(u);
    },
    [s, e, a, i]
  );
  return [c, l];
}
function Qv({
  defaultProp: e,
  onChange: t
}) {
  const [r, n] = A.useState(e), o = A.useRef(r), a = A.useRef(t);
  return Xv(() => {
    a.current = t;
  }, [t]), A.useEffect(() => {
    var i;
    o.current !== r && ((i = a.current) == null || i.call(a, r), o.current = r);
  }, [r, o]), [r, n, a];
}
function Zv(e) {
  return typeof e == "function";
}
// @__NO_SIDE_EFFECTS__
function gp(e) {
  const t = /* @__PURE__ */ e1(e), r = A.forwardRef((n, o) => {
    const { children: a, ...i } = n, s = A.Children.toArray(a), c = s.find(r1);
    if (c) {
      const l = c.props.children, u = s.map((f) => f === c ? A.Children.count(l) > 1 ? A.Children.only(null) : A.isValidElement(l) ? l.props.children : null : f);
      return /* @__PURE__ */ G(t, { ...i, ref: o, children: A.isValidElement(l) ? A.cloneElement(l, void 0, u) : null });
    }
    return /* @__PURE__ */ G(t, { ...i, ref: o, children: a });
  });
  return r.displayName = `${e}.Slot`, r;
}
// @__NO_SIDE_EFFECTS__
function e1(e) {
  const t = A.forwardRef((r, n) => {
    const { children: o, ...a } = r;
    if (A.isValidElement(o)) {
      const i = o1(o), s = n1(a, o.props);
      return o.type !== A.Fragment && (s.ref = n ? hp(n, i) : i), A.cloneElement(o, s);
    }
    return A.Children.count(o) > 1 ? A.Children.only(null) : null;
  });
  return t.displayName = `${e}.SlotClone`, t;
}
var t1 = Symbol("radix.slottable");
function r1(e) {
  return A.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === t1;
}
function n1(e, t) {
  const r = { ...t };
  for (const n in t) {
    const o = e[n], a = t[n];
    /^on[A-Z]/.test(n) ? o && a ? r[n] = (...i) => {
      const s = a(...i);
      return o(...i), s;
    } : o && (r[n] = o) : n === "style" ? r[n] = { ...o, ...a } : n === "className" && (r[n] = [o, a].filter(Boolean).join(" "));
  }
  return { ...e, ...r };
}
function o1(e) {
  var t, r;
  let n = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, o = n && "isReactWarning" in n && n.isReactWarning;
  return o ? e.ref : (n = (r = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : r.get, o = n && "isReactWarning" in n && n.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var a1 = [
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
], vt = a1.reduce((e, t) => {
  const r = /* @__PURE__ */ gp(`Primitive.${t}`), n = A.forwardRef((o, a) => {
    const { asChild: i, ...s } = o, c = i ? r : t;
    return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ G(c, { ...s, ref: a });
  });
  return n.displayName = `Primitive.${t}`, { ...e, [t]: n };
}, {});
function i1(e, t) {
  e && Eg.flushSync(() => e.dispatchEvent(t));
}
function Rn(e) {
  const t = A.useRef(e);
  return A.useEffect(() => {
    t.current = e;
  }), A.useMemo(() => (...r) => {
    var n;
    return (n = t.current) == null ? void 0 : n.call(t, ...r);
  }, []);
}
function s1(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Rn(e);
  A.useEffect(() => {
    const n = (o) => {
      o.key === "Escape" && r(o);
    };
    return t.addEventListener("keydown", n, { capture: !0 }), () => t.removeEventListener("keydown", n, { capture: !0 });
  }, [r, t]);
}
var l1 = "DismissableLayer", Hi = "dismissableLayer.update", c1 = "dismissableLayer.pointerDownOutside", u1 = "dismissableLayer.focusOutside", eu, bp = A.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
}), yp = A.forwardRef(
  (e, t) => {
    const {
      disableOutsidePointerEvents: r = !1,
      onEscapeKeyDown: n,
      onPointerDownOutside: o,
      onFocusOutside: a,
      onInteractOutside: i,
      onDismiss: s,
      ...c
    } = e, l = A.useContext(bp), [u, f] = A.useState(null), d = (u == null ? void 0 : u.ownerDocument) ?? (globalThis == null ? void 0 : globalThis.document), [, b] = A.useState({}), x = xr(t, (U) => f(U)), p = Array.from(l.layers), [m] = [...l.layersWithOutsidePointerEventsDisabled].slice(-1), y = p.indexOf(m), k = u ? p.indexOf(u) : -1, O = l.layersWithOutsidePointerEventsDisabled.size > 0, S = k >= y, g = p1((U) => {
      const te = U.target, J = [...l.branches].some((oe) => oe.contains(te));
      !S || J || (o == null || o(U), i == null || i(U), U.defaultPrevented || s == null || s());
    }, d), Y = m1((U) => {
      const te = U.target;
      [...l.branches].some((J) => J.contains(te)) || (a == null || a(U), i == null || i(U), U.defaultPrevented || s == null || s());
    }, d);
    return s1((U) => {
      k === l.layers.size - 1 && (n == null || n(U), !U.defaultPrevented && s && (U.preventDefault(), s()));
    }, d), A.useEffect(() => {
      if (u)
        return r && (l.layersWithOutsidePointerEventsDisabled.size === 0 && (eu = d.body.style.pointerEvents, d.body.style.pointerEvents = "none"), l.layersWithOutsidePointerEventsDisabled.add(u)), l.layers.add(u), tu(), () => {
          r && l.layersWithOutsidePointerEventsDisabled.size === 1 && (d.body.style.pointerEvents = eu);
        };
    }, [u, d, r, l]), A.useEffect(() => () => {
      u && (l.layers.delete(u), l.layersWithOutsidePointerEventsDisabled.delete(u), tu());
    }, [u, l]), A.useEffect(() => {
      const U = () => b({});
      return document.addEventListener(Hi, U), () => document.removeEventListener(Hi, U);
    }, []), /* @__PURE__ */ G(
      vt.div,
      {
        ...c,
        ref: x,
        style: {
          pointerEvents: O ? S ? "auto" : "none" : void 0,
          ...e.style
        },
        onFocusCapture: Xt(e.onFocusCapture, Y.onFocusCapture),
        onBlurCapture: Xt(e.onBlurCapture, Y.onBlurCapture),
        onPointerDownCapture: Xt(
          e.onPointerDownCapture,
          g.onPointerDownCapture
        )
      }
    );
  }
);
yp.displayName = l1;
var f1 = "DismissableLayerBranch", d1 = A.forwardRef((e, t) => {
  const r = A.useContext(bp), n = A.useRef(null), o = xr(t, n);
  return A.useEffect(() => {
    const a = n.current;
    if (a)
      return r.branches.add(a), () => {
        r.branches.delete(a);
      };
  }, [r.branches]), /* @__PURE__ */ G(vt.div, { ...e, ref: o });
});
d1.displayName = f1;
function p1(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Rn(e), n = A.useRef(!1), o = A.useRef(() => {
  });
  return A.useEffect(() => {
    const a = (s) => {
      if (s.target && !n.current) {
        let c = function() {
          vp(
            c1,
            r,
            l,
            { discrete: !0 }
          );
        };
        const l = { originalEvent: s };
        s.pointerType === "touch" ? (t.removeEventListener("click", o.current), o.current = c, t.addEventListener("click", o.current, { once: !0 })) : c();
      } else
        t.removeEventListener("click", o.current);
      n.current = !1;
    }, i = window.setTimeout(() => {
      t.addEventListener("pointerdown", a);
    }, 0);
    return () => {
      window.clearTimeout(i), t.removeEventListener("pointerdown", a), t.removeEventListener("click", o.current);
    };
  }, [t, r]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: () => n.current = !0
  };
}
function m1(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Rn(e), n = A.useRef(!1);
  return A.useEffect(() => {
    const o = (a) => {
      a.target && !n.current && vp(u1, r, { originalEvent: a }, {
        discrete: !1
      });
    };
    return t.addEventListener("focusin", o), () => t.removeEventListener("focusin", o);
  }, [t, r]), {
    onFocusCapture: () => n.current = !0,
    onBlurCapture: () => n.current = !1
  };
}
function tu() {
  const e = new CustomEvent(Hi);
  document.dispatchEvent(e);
}
function vp(e, t, r, { discrete: n }) {
  const o = r.originalEvent.target, a = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: r });
  t && o.addEventListener(e, t, { once: !0 }), n ? i1(o, a) : o.dispatchEvent(a);
}
var Va = "focusScope.autoFocusOnMount", Wa = "focusScope.autoFocusOnUnmount", ru = { bubbles: !1, cancelable: !0 }, h1 = "FocusScope", xp = A.forwardRef((e, t) => {
  const {
    loop: r = !1,
    trapped: n = !1,
    onMountAutoFocus: o,
    onUnmountAutoFocus: a,
    ...i
  } = e, [s, c] = A.useState(null), l = Rn(o), u = Rn(a), f = A.useRef(null), d = xr(t, (p) => c(p)), b = A.useRef({
    paused: !1,
    pause() {
      this.paused = !0;
    },
    resume() {
      this.paused = !1;
    }
  }).current;
  A.useEffect(() => {
    if (n) {
      let p = function(O) {
        if (b.paused || !s) return;
        const S = O.target;
        s.contains(S) ? f.current = S : qt(f.current, { select: !0 });
      }, m = function(O) {
        if (b.paused || !s) return;
        const S = O.relatedTarget;
        S !== null && (s.contains(S) || qt(f.current, { select: !0 }));
      }, y = function(O) {
        if (document.activeElement === document.body)
          for (const S of O)
            S.removedNodes.length > 0 && qt(s);
      };
      document.addEventListener("focusin", p), document.addEventListener("focusout", m);
      const k = new MutationObserver(y);
      return s && k.observe(s, { childList: !0, subtree: !0 }), () => {
        document.removeEventListener("focusin", p), document.removeEventListener("focusout", m), k.disconnect();
      };
    }
  }, [n, s, b.paused]), A.useEffect(() => {
    if (s) {
      ou.add(b);
      const p = document.activeElement;
      if (!s.contains(p)) {
        const m = new CustomEvent(Va, ru);
        s.addEventListener(Va, l), s.dispatchEvent(m), m.defaultPrevented || (g1(w1(wp(s)), { select: !0 }), document.activeElement === p && qt(s));
      }
      return () => {
        s.removeEventListener(Va, l), setTimeout(() => {
          const m = new CustomEvent(Wa, ru);
          s.addEventListener(Wa, u), s.dispatchEvent(m), m.defaultPrevented || qt(p ?? document.body, { select: !0 }), s.removeEventListener(Wa, u), ou.remove(b);
        }, 0);
      };
    }
  }, [s, l, u, b]);
  const x = A.useCallback(
    (p) => {
      if (!r && !n || b.paused) return;
      const m = p.key === "Tab" && !p.altKey && !p.ctrlKey && !p.metaKey, y = document.activeElement;
      if (m && y) {
        const k = p.currentTarget, [O, S] = b1(k);
        O && S ? !p.shiftKey && y === S ? (p.preventDefault(), r && qt(O, { select: !0 })) : p.shiftKey && y === O && (p.preventDefault(), r && qt(S, { select: !0 })) : y === k && p.preventDefault();
      }
    },
    [r, n, b.paused]
  );
  return /* @__PURE__ */ G(vt.div, { tabIndex: -1, ...i, ref: d, onKeyDown: x });
});
xp.displayName = h1;
function g1(e, { select: t = !1 } = {}) {
  const r = document.activeElement;
  for (const n of e)
    if (qt(n, { select: t }), document.activeElement !== r) return;
}
function b1(e) {
  const t = wp(e), r = nu(t, e), n = nu(t.reverse(), e);
  return [r, n];
}
function wp(e) {
  const t = [], r = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => {
      const o = n.tagName === "INPUT" && n.type === "hidden";
      return n.disabled || n.hidden || o ? NodeFilter.FILTER_SKIP : n.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  for (; r.nextNode(); ) t.push(r.currentNode);
  return t;
}
function nu(e, t) {
  for (const r of e)
    if (!y1(r, { upTo: t })) return r;
}
function y1(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function v1(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function qt(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const r = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== r && v1(e) && t && e.select();
  }
}
var ou = x1();
function x1() {
  let e = [];
  return {
    add(t) {
      const r = e[0];
      t !== r && (r == null || r.pause()), e = au(e, t), e.unshift(t);
    },
    remove(t) {
      var r;
      e = au(e, t), (r = e[0]) == null || r.resume();
    }
  };
}
function au(e, t) {
  const r = [...e], n = r.indexOf(t);
  return n !== -1 && r.splice(n, 1), r;
}
function w1(e) {
  return e.filter((t) => t.tagName !== "A");
}
var k1 = "Portal", kp = A.forwardRef((e, t) => {
  var r;
  const { container: n, ...o } = e, [a, i] = A.useState(!1);
  Mn(() => i(!0), []);
  const s = n || a && ((r = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : r.body);
  return s ? Ng.createPortal(/* @__PURE__ */ G(vt.div, { ...o, ref: t }), s) : null;
});
kp.displayName = k1;
function O1(e, t) {
  return A.useReducer((r, n) => t[r][n] ?? r, e);
}
var ra = (e) => {
  const { present: t, children: r } = e, n = S1(t), o = typeof r == "function" ? r({ present: n.isPresent }) : A.Children.only(r), a = xr(n.ref, A1(o));
  return typeof r == "function" || n.isPresent ? A.cloneElement(o, { ref: a }) : null;
};
ra.displayName = "Presence";
function S1(e) {
  const [t, r] = A.useState(), n = A.useRef(null), o = A.useRef(e), a = A.useRef("none"), i = e ? "mounted" : "unmounted", [s, c] = O1(i, {
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
  return A.useEffect(() => {
    const l = fo(n.current);
    a.current = s === "mounted" ? l : "none";
  }, [s]), Mn(() => {
    const l = n.current, u = o.current;
    if (u !== e) {
      const f = a.current, d = fo(l);
      e ? c("MOUNT") : d === "none" || (l == null ? void 0 : l.display) === "none" ? c("UNMOUNT") : c(u && f !== d ? "ANIMATION_OUT" : "UNMOUNT"), o.current = e;
    }
  }, [e, c]), Mn(() => {
    if (t) {
      let l;
      const u = t.ownerDocument.defaultView ?? window, f = (b) => {
        const x = fo(n.current).includes(b.animationName);
        if (b.target === t && x && (c("ANIMATION_END"), !o.current)) {
          const p = t.style.animationFillMode;
          t.style.animationFillMode = "forwards", l = u.setTimeout(() => {
            t.style.animationFillMode === "forwards" && (t.style.animationFillMode = p);
          });
        }
      }, d = (b) => {
        b.target === t && (a.current = fo(n.current));
      };
      return t.addEventListener("animationstart", d), t.addEventListener("animationcancel", f), t.addEventListener("animationend", f), () => {
        u.clearTimeout(l), t.removeEventListener("animationstart", d), t.removeEventListener("animationcancel", f), t.removeEventListener("animationend", f);
      };
    } else
      c("ANIMATION_END");
  }, [t, c]), {
    isPresent: ["mounted", "unmountSuspended"].includes(s),
    ref: A.useCallback((l) => {
      n.current = l ? getComputedStyle(l) : null, r(l);
    }, [])
  };
}
function fo(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function A1(e) {
  var t, r;
  let n = (t = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : t.get, o = n && "isReactWarning" in n && n.isReactWarning;
  return o ? e.ref : (n = (r = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : r.get, o = n && "isReactWarning" in n && n.isReactWarning, o ? e.props.ref : e.props.ref || e.ref);
}
var Ua = 0;
function P1() {
  A.useEffect(() => {
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return document.body.insertAdjacentElement("afterbegin", e[0] ?? iu()), document.body.insertAdjacentElement("beforeend", e[1] ?? iu()), Ua++, () => {
      Ua === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((t) => t.remove()), Ua--;
    };
  }, []);
}
function iu() {
  const e = document.createElement("span");
  return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
var ft = function() {
  return ft = Object.assign || function(e) {
    for (var t, r = 1, n = arguments.length; r < n; r++) {
      t = arguments[r];
      for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
    }
    return e;
  }, ft.apply(this, arguments);
};
function Op(e, t) {
  var r = {};
  for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && t.indexOf(n) < 0 && (r[n] = e[n]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var o = 0, n = Object.getOwnPropertySymbols(e); o < n.length; o++)
      t.indexOf(n[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, n[o]) && (r[n[o]] = e[n[o]]);
  return r;
}
function E1(e, t, r) {
  for (var n = 0, o = t.length, a; n < o; n++)
    (a || !(n in t)) && (a || (a = Array.prototype.slice.call(t, 0, n)), a[n] = t[n]);
  return e.concat(a || Array.prototype.slice.call(t));
}
var Eo = "right-scroll-bar-position", No = "width-before-scroll-bar", N1 = "with-scroll-bars-hidden", C1 = "--removed-body-scroll-bar-size";
function Ga(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function $1(e, t) {
  var r = Bt(function() {
    return {
      // value
      value: e,
      // last callback
      callback: t,
      // "memoized" public interface
      facade: {
        get current() {
          return r.value;
        },
        set current(n) {
          var o = r.value;
          o !== n && (r.value = n, r.callback(n, o));
        }
      }
    };
  })[0];
  return r.callback = t, r.facade;
}
var j1 = typeof window < "u" ? A.useLayoutEffect : A.useEffect, su = /* @__PURE__ */ new WeakMap();
function I1(e, t) {
  var r = $1(null, function(n) {
    return e.forEach(function(o) {
      return Ga(o, n);
    });
  });
  return j1(function() {
    var n = su.get(r);
    if (n) {
      var o = new Set(n), a = new Set(e), i = r.current;
      o.forEach(function(s) {
        a.has(s) || Ga(s, null);
      }), a.forEach(function(s) {
        o.has(s) || Ga(s, i);
      });
    }
    su.set(r, e);
  }, [e]), r;
}
function z1(e) {
  return e;
}
function _1(e, t) {
  t === void 0 && (t = z1);
  var r = [], n = !1, o = {
    read: function() {
      if (n)
        throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
      return r.length ? r[r.length - 1] : e;
    },
    useMedium: function(a) {
      var i = t(a, n);
      return r.push(i), function() {
        r = r.filter(function(s) {
          return s !== i;
        });
      };
    },
    assignSyncMedium: function(a) {
      for (n = !0; r.length; ) {
        var i = r;
        r = [], i.forEach(a);
      }
      r = {
        push: function(s) {
          return a(s);
        },
        filter: function() {
          return r;
        }
      };
    },
    assignMedium: function(a) {
      n = !0;
      var i = [];
      if (r.length) {
        var s = r;
        r = [], s.forEach(a), i = r;
      }
      var c = function() {
        var u = i;
        i = [], u.forEach(a);
      }, l = function() {
        return Promise.resolve().then(c);
      };
      l(), r = {
        push: function(u) {
          i.push(u), l();
        },
        filter: function(u) {
          return i = i.filter(u), r;
        }
      };
    }
  };
  return o;
}
function M1(e) {
  e === void 0 && (e = {});
  var t = _1(null);
  return t.options = ft({ async: !0, ssr: !1 }, e), t;
}
var Sp = function(e) {
  var t = e.sideCar, r = Op(e, ["sideCar"]);
  if (!t)
    throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var n = t.read();
  if (!n)
    throw new Error("Sidecar medium not found");
  return A.createElement(n, ft({}, r));
};
Sp.isSideCarExport = !0;
function R1(e, t) {
  return e.useMedium(t), Sp;
}
var Ap = M1(), Ya = function() {
}, na = A.forwardRef(function(e, t) {
  var r = A.useRef(null), n = A.useState({
    onScrollCapture: Ya,
    onWheelCapture: Ya,
    onTouchMoveCapture: Ya
  }), o = n[0], a = n[1], i = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, f = e.shards, d = e.sideCar, b = e.noRelative, x = e.noIsolation, p = e.inert, m = e.allowPinchZoom, y = e.as, k = y === void 0 ? "div" : y, O = e.gapMode, S = Op(e, ["forwardProps", "children", "className", "removeScrollBar", "enabled", "shards", "sideCar", "noRelative", "noIsolation", "inert", "allowPinchZoom", "as", "gapMode"]), g = d, Y = I1([r, t]), U = ft(ft({}, S), o);
  return A.createElement(
    A.Fragment,
    null,
    u && A.createElement(g, { sideCar: Ap, removeScrollBar: l, shards: f, noRelative: b, noIsolation: x, inert: p, setCallbacks: a, allowPinchZoom: !!m, lockRef: r, gapMode: O }),
    i ? A.cloneElement(A.Children.only(s), ft(ft({}, U), { ref: Y })) : A.createElement(k, ft({}, U, { className: c, ref: Y }), s)
  );
});
na.defaultProps = {
  enabled: !0,
  removeScrollBar: !0,
  inert: !1
};
na.classNames = {
  fullWidth: No,
  zeroRight: Eo
};
var T1 = function() {
  if (typeof __webpack_nonce__ < "u")
    return __webpack_nonce__;
};
function D1() {
  if (!document)
    return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = T1();
  return t && e.setAttribute("nonce", t), e;
}
function L1(e, t) {
  e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function F1(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var V1 = function() {
  var e = 0, t = null;
  return {
    add: function(r) {
      e == 0 && (t = D1()) && (L1(t, r), F1(t)), e++;
    },
    remove: function() {
      e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
    }
  };
}, W1 = function() {
  var e = V1();
  return function(t, r) {
    A.useEffect(function() {
      return e.add(t), function() {
        e.remove();
      };
    }, [t && r]);
  };
}, Pp = function() {
  var e = W1(), t = function(r) {
    var n = r.styles, o = r.dynamic;
    return e(n, o), null;
  };
  return t;
}, U1 = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0
}, qa = function(e) {
  return parseInt(e || "", 10) || 0;
}, G1 = function(e) {
  var t = window.getComputedStyle(document.body), r = t[e === "padding" ? "paddingLeft" : "marginLeft"], n = t[e === "padding" ? "paddingTop" : "marginTop"], o = t[e === "padding" ? "paddingRight" : "marginRight"];
  return [qa(r), qa(n), qa(o)];
}, Y1 = function(e) {
  if (e === void 0 && (e = "margin"), typeof window > "u")
    return U1;
  var t = G1(e), r = document.documentElement.clientWidth, n = window.innerWidth;
  return {
    left: t[0],
    top: t[1],
    right: t[2],
    gap: Math.max(0, n - r + t[2] - t[0])
  };
}, q1 = Pp(), Tr = "data-scroll-locked", B1 = function(e, t, r, n) {
  var o = e.left, a = e.top, i = e.right, s = e.gap;
  return r === void 0 && (r = "margin"), `
  .`.concat(N1, ` {
   overflow: hidden `).concat(n, `;
   padding-right: `).concat(s, "px ").concat(n, `;
  }
  body[`).concat(Tr, `] {
    overflow: hidden `).concat(n, `;
    overscroll-behavior: contain;
    `).concat([
    t && "position: relative ".concat(n, ";"),
    r === "margin" && `
    padding-left: `.concat(o, `px;
    padding-top: `).concat(a, `px;
    padding-right: `).concat(i, `px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(s, "px ").concat(n, `;
    `),
    r === "padding" && "padding-right: ".concat(s, "px ").concat(n, ";")
  ].filter(Boolean).join(""), `
  }
  
  .`).concat(Eo, ` {
    right: `).concat(s, "px ").concat(n, `;
  }
  
  .`).concat(No, ` {
    margin-right: `).concat(s, "px ").concat(n, `;
  }
  
  .`).concat(Eo, " .").concat(Eo, ` {
    right: 0 `).concat(n, `;
  }
  
  .`).concat(No, " .").concat(No, ` {
    margin-right: 0 `).concat(n, `;
  }
  
  body[`).concat(Tr, `] {
    `).concat(C1, ": ").concat(s, `px;
  }
`);
}, lu = function() {
  var e = parseInt(document.body.getAttribute(Tr) || "0", 10);
  return isFinite(e) ? e : 0;
}, H1 = function() {
  A.useEffect(function() {
    return document.body.setAttribute(Tr, (lu() + 1).toString()), function() {
      var e = lu() - 1;
      e <= 0 ? document.body.removeAttribute(Tr) : document.body.setAttribute(Tr, e.toString());
    };
  }, []);
}, K1 = function(e) {
  var t = e.noRelative, r = e.noImportant, n = e.gapMode, o = n === void 0 ? "margin" : n;
  H1();
  var a = A.useMemo(function() {
    return Y1(o);
  }, [o]);
  return A.createElement(q1, { styles: B1(a, !t, o, r ? "" : "!important") });
}, Ki = !1;
if (typeof window < "u")
  try {
    var po = Object.defineProperty({}, "passive", {
      get: function() {
        return Ki = !0, !0;
      }
    });
    window.addEventListener("test", po, po), window.removeEventListener("test", po, po);
  } catch {
    Ki = !1;
  }
var Or = Ki ? { passive: !1 } : !1, X1 = function(e) {
  return e.tagName === "TEXTAREA";
}, Ep = function(e, t) {
  if (!(e instanceof Element))
    return !1;
  var r = window.getComputedStyle(e);
  return (
    // not-not-scrollable
    r[t] !== "hidden" && // contains scroll inside self
    !(r.overflowY === r.overflowX && !X1(e) && r[t] === "visible")
  );
}, J1 = function(e) {
  return Ep(e, "overflowY");
}, Q1 = function(e) {
  return Ep(e, "overflowX");
}, cu = function(e, t) {
  var r = t.ownerDocument, n = t;
  do {
    typeof ShadowRoot < "u" && n instanceof ShadowRoot && (n = n.host);
    var o = Np(e, n);
    if (o) {
      var a = Cp(e, n), i = a[1], s = a[2];
      if (i > s)
        return !0;
    }
    n = n.parentNode;
  } while (n && n !== r.body);
  return !1;
}, Z1 = function(e) {
  var t = e.scrollTop, r = e.scrollHeight, n = e.clientHeight;
  return [
    t,
    r,
    n
  ];
}, e0 = function(e) {
  var t = e.scrollLeft, r = e.scrollWidth, n = e.clientWidth;
  return [
    t,
    r,
    n
  ];
}, Np = function(e, t) {
  return e === "v" ? J1(t) : Q1(t);
}, Cp = function(e, t) {
  return e === "v" ? Z1(t) : e0(t);
}, t0 = function(e, t) {
  return e === "h" && t === "rtl" ? -1 : 1;
}, r0 = function(e, t, r, n, o) {
  var a = t0(e, window.getComputedStyle(t).direction), i = a * n, s = r.target, c = t.contains(s), l = !1, u = i > 0, f = 0, d = 0;
  do {
    if (!s)
      break;
    var b = Cp(e, s), x = b[0], p = b[1], m = b[2], y = p - m - a * x;
    (x || y) && Np(e, s) && (f += y, d += x);
    var k = s.parentNode;
    s = k && k.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? k.host : k;
  } while (
    // portaled content
    !c && s !== document.body || // self content
    c && (t.contains(s) || t === s)
  );
  return (u && Math.abs(f) < 1 || !u && Math.abs(d) < 1) && (l = !0), l;
}, mo = function(e) {
  return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, uu = function(e) {
  return [e.deltaX, e.deltaY];
}, fu = function(e) {
  return e && "current" in e ? e.current : e;
}, n0 = function(e, t) {
  return e[0] === t[0] && e[1] === t[1];
}, o0 = function(e) {
  return `
  .block-interactivity-`.concat(e, ` {pointer-events: none;}
  .allow-interactivity-`).concat(e, ` {pointer-events: all;}
`);
}, a0 = 0, Sr = [];
function i0(e) {
  var t = A.useRef([]), r = A.useRef([0, 0]), n = A.useRef(), o = A.useState(a0++)[0], a = A.useState(Pp)[0], i = A.useRef(e);
  A.useEffect(function() {
    i.current = e;
  }, [e]), A.useEffect(function() {
    if (e.inert) {
      document.body.classList.add("block-interactivity-".concat(o));
      var p = E1([e.lockRef.current], (e.shards || []).map(fu)).filter(Boolean);
      return p.forEach(function(m) {
        return m.classList.add("allow-interactivity-".concat(o));
      }), function() {
        document.body.classList.remove("block-interactivity-".concat(o)), p.forEach(function(m) {
          return m.classList.remove("allow-interactivity-".concat(o));
        });
      };
    }
  }, [e.inert, e.lockRef.current, e.shards]);
  var s = A.useCallback(function(p, m) {
    if ("touches" in p && p.touches.length === 2 || p.type === "wheel" && p.ctrlKey)
      return !i.current.allowPinchZoom;
    var y = mo(p), k = r.current, O = "deltaX" in p ? p.deltaX : k[0] - y[0], S = "deltaY" in p ? p.deltaY : k[1] - y[1], g, Y = p.target, U = Math.abs(O) > Math.abs(S) ? "h" : "v";
    if ("touches" in p && U === "h" && Y.type === "range")
      return !1;
    var te = cu(U, Y);
    if (!te)
      return !0;
    if (te ? g = U : (g = U === "v" ? "h" : "v", te = cu(U, Y)), !te)
      return !1;
    if (!n.current && "changedTouches" in p && (O || S) && (n.current = g), !g)
      return !0;
    var J = n.current || g;
    return r0(J, m, p, J === "h" ? O : S);
  }, []), c = A.useCallback(function(p) {
    var m = p;
    if (!(!Sr.length || Sr[Sr.length - 1] !== a)) {
      var y = "deltaY" in m ? uu(m) : mo(m), k = t.current.filter(function(g) {
        return g.name === m.type && (g.target === m.target || m.target === g.shadowParent) && n0(g.delta, y);
      })[0];
      if (k && k.should) {
        m.cancelable && m.preventDefault();
        return;
      }
      if (!k) {
        var O = (i.current.shards || []).map(fu).filter(Boolean).filter(function(g) {
          return g.contains(m.target);
        }), S = O.length > 0 ? s(m, O[0]) : !i.current.noIsolation;
        S && m.cancelable && m.preventDefault();
      }
    }
  }, []), l = A.useCallback(function(p, m, y, k) {
    var O = { name: p, delta: m, target: y, should: k, shadowParent: s0(y) };
    t.current.push(O), setTimeout(function() {
      t.current = t.current.filter(function(S) {
        return S !== O;
      });
    }, 1);
  }, []), u = A.useCallback(function(p) {
    r.current = mo(p), n.current = void 0;
  }, []), f = A.useCallback(function(p) {
    l(p.type, uu(p), p.target, s(p, e.lockRef.current));
  }, []), d = A.useCallback(function(p) {
    l(p.type, mo(p), p.target, s(p, e.lockRef.current));
  }, []);
  A.useEffect(function() {
    return Sr.push(a), e.setCallbacks({
      onScrollCapture: f,
      onWheelCapture: f,
      onTouchMoveCapture: d
    }), document.addEventListener("wheel", c, Or), document.addEventListener("touchmove", c, Or), document.addEventListener("touchstart", u, Or), function() {
      Sr = Sr.filter(function(p) {
        return p !== a;
      }), document.removeEventListener("wheel", c, Or), document.removeEventListener("touchmove", c, Or), document.removeEventListener("touchstart", u, Or);
    };
  }, []);
  var b = e.removeScrollBar, x = e.inert;
  return A.createElement(
    A.Fragment,
    null,
    x ? A.createElement(a, { styles: o0(o) }) : null,
    b ? A.createElement(K1, { noRelative: e.noRelative, gapMode: e.gapMode }) : null
  );
}
function s0(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
  return t;
}
const l0 = R1(Ap, i0);
var $p = A.forwardRef(function(e, t) {
  return A.createElement(na, ft({}, e, { ref: t, sideCar: l0 }));
});
$p.classNames = na.classNames;
var c0 = function(e) {
  if (typeof document > "u")
    return null;
  var t = Array.isArray(e) ? e[0] : e;
  return t.ownerDocument.body;
}, Ar = /* @__PURE__ */ new WeakMap(), ho = /* @__PURE__ */ new WeakMap(), go = {}, Ba = 0, jp = function(e) {
  return e && (e.host || jp(e.parentNode));
}, u0 = function(e, t) {
  return t.map(function(r) {
    if (e.contains(r))
      return r;
    var n = jp(r);
    return n && e.contains(n) ? n : (console.error("aria-hidden", r, "in not contained inside", e, ". Doing nothing"), null);
  }).filter(function(r) {
    return !!r;
  });
}, f0 = function(e, t, r, n) {
  var o = u0(t, Array.isArray(e) ? e : [e]);
  go[r] || (go[r] = /* @__PURE__ */ new WeakMap());
  var a = go[r], i = [], s = /* @__PURE__ */ new Set(), c = new Set(o), l = function(f) {
    !f || s.has(f) || (s.add(f), l(f.parentNode));
  };
  o.forEach(l);
  var u = function(f) {
    !f || c.has(f) || Array.prototype.forEach.call(f.children, function(d) {
      if (s.has(d))
        u(d);
      else
        try {
          var b = d.getAttribute(n), x = b !== null && b !== "false", p = (Ar.get(d) || 0) + 1, m = (a.get(d) || 0) + 1;
          Ar.set(d, p), a.set(d, m), i.push(d), p === 1 && x && ho.set(d, !0), m === 1 && d.setAttribute(r, "true"), x || d.setAttribute(n, "true");
        } catch (y) {
          console.error("aria-hidden: cannot operate on ", d, y);
        }
    });
  };
  return u(t), s.clear(), Ba++, function() {
    i.forEach(function(f) {
      var d = Ar.get(f) - 1, b = a.get(f) - 1;
      Ar.set(f, d), a.set(f, b), d || (ho.has(f) || f.removeAttribute(n), ho.delete(f)), b || f.removeAttribute(r);
    }), Ba--, Ba || (Ar = /* @__PURE__ */ new WeakMap(), Ar = /* @__PURE__ */ new WeakMap(), ho = /* @__PURE__ */ new WeakMap(), go = {});
  };
}, d0 = function(e, t, r) {
  r === void 0 && (r = "data-aria-hidden");
  var n = Array.from(Array.isArray(e) ? e : [e]), o = c0(e);
  return o ? (n.push.apply(n, Array.from(o.querySelectorAll("[aria-live], script"))), f0(n, o, r, "aria-hidden")) : function() {
    return null;
  };
}, oa = "Dialog", [Ip, qS] = qv(oa), [p0, at] = Ip(oa), zp = (e) => {
  const {
    __scopeDialog: t,
    children: r,
    open: n,
    defaultOpen: o,
    onOpenChange: a,
    modal: i = !0
  } = e, s = A.useRef(null), c = A.useRef(null), [l, u] = Jv({
    prop: n,
    defaultProp: o ?? !1,
    onChange: a,
    caller: oa
  });
  return /* @__PURE__ */ G(
    p0,
    {
      scope: t,
      triggerRef: s,
      contentRef: c,
      contentId: Fa(),
      titleId: Fa(),
      descriptionId: Fa(),
      open: l,
      onOpenChange: u,
      onOpenToggle: A.useCallback(() => u((f) => !f), [u]),
      modal: i,
      children: r
    }
  );
};
zp.displayName = oa;
var _p = "DialogTrigger", m0 = A.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = at(_p, r), a = xr(t, o.triggerRef);
    return /* @__PURE__ */ G(
      vt.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": o.open,
        "aria-controls": o.contentId,
        "data-state": sl(o.open),
        ...n,
        ref: a,
        onClick: Xt(e.onClick, o.onOpenToggle)
      }
    );
  }
);
m0.displayName = _p;
var al = "DialogPortal", [h0, Mp] = Ip(al, {
  forceMount: void 0
}), Rp = (e) => {
  const { __scopeDialog: t, forceMount: r, children: n, container: o } = e, a = at(al, t);
  return /* @__PURE__ */ G(h0, { scope: t, forceMount: r, children: A.Children.map(n, (i) => /* @__PURE__ */ G(ra, { present: r || a.open, children: /* @__PURE__ */ G(kp, { asChild: !0, container: o, children: i }) })) });
};
Rp.displayName = al;
var Lo = "DialogOverlay", Tp = A.forwardRef(
  (e, t) => {
    const r = Mp(Lo, e.__scopeDialog), { forceMount: n = r.forceMount, ...o } = e, a = at(Lo, e.__scopeDialog);
    return a.modal ? /* @__PURE__ */ G(ra, { present: n || a.open, children: /* @__PURE__ */ G(b0, { ...o, ref: t }) }) : null;
  }
);
Tp.displayName = Lo;
var g0 = /* @__PURE__ */ gp("DialogOverlay.RemoveScroll"), b0 = A.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = at(Lo, r);
    return (
      // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
      // ie. when `Overlay` and `Content` are siblings
      /* @__PURE__ */ G($p, { as: g0, allowPinchZoom: !0, shards: [o.contentRef], children: /* @__PURE__ */ G(
        vt.div,
        {
          "data-state": sl(o.open),
          ...n,
          ref: t,
          style: { pointerEvents: "auto", ...n.style }
        }
      ) })
    );
  }
), mr = "DialogContent", Dp = A.forwardRef(
  (e, t) => {
    const r = Mp(mr, e.__scopeDialog), { forceMount: n = r.forceMount, ...o } = e, a = at(mr, e.__scopeDialog);
    return /* @__PURE__ */ G(ra, { present: n || a.open, children: a.modal ? /* @__PURE__ */ G(y0, { ...o, ref: t }) : /* @__PURE__ */ G(v0, { ...o, ref: t }) });
  }
);
Dp.displayName = mr;
var y0 = A.forwardRef(
  (e, t) => {
    const r = at(mr, e.__scopeDialog), n = A.useRef(null), o = xr(t, r.contentRef, n);
    return A.useEffect(() => {
      const a = n.current;
      if (a) return d0(a);
    }, []), /* @__PURE__ */ G(
      Lp,
      {
        ...e,
        ref: o,
        trapFocus: r.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: Xt(e.onCloseAutoFocus, (a) => {
          var i;
          a.preventDefault(), (i = r.triggerRef.current) == null || i.focus();
        }),
        onPointerDownOutside: Xt(e.onPointerDownOutside, (a) => {
          const i = a.detail.originalEvent, s = i.button === 0 && i.ctrlKey === !0;
          (i.button === 2 || s) && a.preventDefault();
        }),
        onFocusOutside: Xt(
          e.onFocusOutside,
          (a) => a.preventDefault()
        )
      }
    );
  }
), v0 = A.forwardRef(
  (e, t) => {
    const r = at(mr, e.__scopeDialog), n = A.useRef(!1), o = A.useRef(!1);
    return /* @__PURE__ */ G(
      Lp,
      {
        ...e,
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (a) => {
          var i, s;
          (i = e.onCloseAutoFocus) == null || i.call(e, a), a.defaultPrevented || (n.current || (s = r.triggerRef.current) == null || s.focus(), a.preventDefault()), n.current = !1, o.current = !1;
        },
        onInteractOutside: (a) => {
          var i, s;
          (i = e.onInteractOutside) == null || i.call(e, a), a.defaultPrevented || (n.current = !0, a.detail.originalEvent.type === "pointerdown" && (o.current = !0));
          const c = a.target;
          (s = r.triggerRef.current) != null && s.contains(c) && a.preventDefault(), a.detail.originalEvent.type === "focusin" && o.current && a.preventDefault();
        }
      }
    );
  }
), Lp = A.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, trapFocus: n, onOpenAutoFocus: o, onCloseAutoFocus: a, ...i } = e, s = at(mr, r), c = A.useRef(null), l = xr(t, c);
    return P1(), /* @__PURE__ */ Ye(st, { children: [
      /* @__PURE__ */ G(
        xp,
        {
          asChild: !0,
          loop: !0,
          trapped: n,
          onMountAutoFocus: o,
          onUnmountAutoFocus: a,
          children: /* @__PURE__ */ G(
            yp,
            {
              role: "dialog",
              id: s.contentId,
              "aria-describedby": s.descriptionId,
              "aria-labelledby": s.titleId,
              "data-state": sl(s.open),
              ...i,
              ref: l,
              onDismiss: () => s.onOpenChange(!1)
            }
          )
        }
      ),
      /* @__PURE__ */ Ye(st, { children: [
        /* @__PURE__ */ G(w0, { titleId: s.titleId }),
        /* @__PURE__ */ G(O0, { contentRef: c, descriptionId: s.descriptionId })
      ] })
    ] });
  }
), il = "DialogTitle", Fp = A.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = at(il, r);
    return /* @__PURE__ */ G(vt.h2, { id: o.titleId, ...n, ref: t });
  }
);
Fp.displayName = il;
var Vp = "DialogDescription", Wp = A.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = at(Vp, r);
    return /* @__PURE__ */ G(vt.p, { id: o.descriptionId, ...n, ref: t });
  }
);
Wp.displayName = Vp;
var Up = "DialogClose", x0 = A.forwardRef(
  (e, t) => {
    const { __scopeDialog: r, ...n } = e, o = at(Up, r);
    return /* @__PURE__ */ G(
      vt.button,
      {
        type: "button",
        ...n,
        ref: t,
        onClick: Xt(e.onClick, () => o.onOpenChange(!1))
      }
    );
  }
);
x0.displayName = Up;
function sl(e) {
  return e ? "open" : "closed";
}
var Gp = "DialogTitleWarning", [BS, Yp] = Yv(Gp, {
  contentName: mr,
  titleName: il,
  docsSlug: "dialog"
}), w0 = ({ titleId: e }) => {
  const t = Yp(Gp), r = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
  return A.useEffect(() => {
    e && (document.getElementById(e) || console.error(r));
  }, [r, e]), null;
}, k0 = "DialogDescriptionWarning", O0 = ({ contentRef: e, descriptionId: t }) => {
  const r = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Yp(k0).contentName}}.`;
  return A.useEffect(() => {
    var n;
    const o = (n = e.current) == null ? void 0 : n.getAttribute("aria-describedby");
    t && o && (document.getElementById(t) || console.warn(r));
  }, [r, e, t]), null;
}, S0 = zp, A0 = Rp, P0 = Tp, E0 = Dp, du = Fp, N0 = Wp;
const ll = "-", C0 = (e) => {
  const t = j0(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(ll);
      return a[0] === "" && a.length !== 1 && a.shift(), qp(a, t) || $0(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = r[o] || [];
      return a && n[o] ? [...i, ...n[o]] : i;
    }
  };
}, qp = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? qp(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(ll);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, pu = /^\[(.+)\]$/, $0 = (e) => {
  if (pu.test(e)) {
    const t = pu.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, j0 = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return z0(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    Xi(a, n, o, t);
  }), n;
}, Xi = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : mu(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (I0(o)) {
        Xi(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Xi(i, mu(t, a), r, n);
    });
  });
}, mu = (e, t) => {
  let r = e;
  return t.split(ll).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, I0 = (e) => e.isThemeGetter, z0 = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, _0 = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, Bp = "!", M0 = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let y = s[m];
      if (l === 0) {
        if (y === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (y === "/") {
          f = m;
          continue;
        }
      }
      y === "[" ? l++ : y === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(Bp), x = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: x,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, R0 = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, T0 = (e) => ({
  cache: _0(e.cacheSize),
  parseClassName: M0(e),
  ...C0(e)
}), D0 = /\s+/, L0 = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(D0);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let x = !!b, p = n(x ? d.substring(0, b) : d);
    if (!p) {
      if (!x) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const m = R0(u).join(":"), y = f ? m + Bp : m, k = y + p;
    if (a.includes(k))
      continue;
    a.push(k);
    const O = o(p, x);
    for (let S = 0; S < O.length; ++S) {
      const g = O[S];
      a.push(y + g);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function F0() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Hp(t)) && (n && (n += " "), n += r);
  return n;
}
const Hp = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Hp(e[n])) && (r && (r += " "), r += t);
  return r;
};
function V0(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = T0(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = L0(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(F0.apply(null, arguments));
  };
}
const Pe = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Kp = /^\[(?:([a-z-]+):)?(.+)\]$/i, W0 = /^\d+\/\d+$/, U0 = /* @__PURE__ */ new Set(["px", "full", "screen"]), G0 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Y0 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, q0 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, B0 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, H0 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, wt = (e) => Dr(e) || U0.has(e) || W0.test(e), Tt = (e) => Jr(e, "length", rx), Dr = (e) => !!e && !Number.isNaN(Number(e)), Ha = (e) => Jr(e, "number", Dr), an = (e) => !!e && Number.isInteger(Number(e)), K0 = (e) => e.endsWith("%") && Dr(e.slice(0, -1)), se = (e) => Kp.test(e), Dt = (e) => G0.test(e), X0 = /* @__PURE__ */ new Set(["length", "size", "percentage"]), J0 = (e) => Jr(e, X0, Xp), Q0 = (e) => Jr(e, "position", Xp), Z0 = /* @__PURE__ */ new Set(["image", "url"]), ex = (e) => Jr(e, Z0, ox), tx = (e) => Jr(e, "", nx), sn = () => !0, Jr = (e, t, r) => {
  const n = Kp.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, rx = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Y0.test(e) && !q0.test(e)
), Xp = () => !1, nx = (e) => B0.test(e), ox = (e) => H0.test(e), ax = () => {
  const e = Pe("colors"), t = Pe("spacing"), r = Pe("blur"), n = Pe("brightness"), o = Pe("borderColor"), a = Pe("borderRadius"), i = Pe("borderSpacing"), s = Pe("borderWidth"), c = Pe("contrast"), l = Pe("grayscale"), u = Pe("hueRotate"), f = Pe("invert"), d = Pe("gap"), b = Pe("gradientColorStops"), x = Pe("gradientColorStopPositions"), p = Pe("inset"), m = Pe("margin"), y = Pe("opacity"), k = Pe("padding"), O = Pe("saturate"), S = Pe("scale"), g = Pe("sepia"), Y = Pe("skew"), U = Pe("space"), te = Pe("translate"), J = () => ["auto", "contain", "none"], oe = () => ["auto", "hidden", "clip", "visible", "scroll"], ne = () => ["auto", se, t], E = () => [se, t], fe = () => ["", wt, Tt], W = () => ["auto", Dr, se], N = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], T = () => ["solid", "dashed", "dotted", "double", "none"], B = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], re = () => ["", "0", se], h = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Dr, se];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [sn],
      spacing: [wt, Tt],
      blur: ["none", "", Dt, se],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Dt, se],
      borderSpacing: E(),
      borderWidth: fe(),
      contrast: v(),
      grayscale: re(),
      hueRotate: v(),
      invert: re(),
      gap: E(),
      gradientColorStops: [e],
      gradientColorStopPositions: [K0, Tt],
      inset: ne(),
      margin: ne(),
      opacity: v(),
      padding: E(),
      saturate: v(),
      scale: v(),
      sepia: re(),
      skew: v(),
      space: E(),
      translate: E()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", se]
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
        columns: [Dt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": h()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": h()
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
        object: [...N(), se]
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", an, se]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ne()
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
        flex: ["1", "auto", "initial", "none", se]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: re()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: re()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", an, se]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [sn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", an, se]
        }, se]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": W()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": W()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [sn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [an, se]
        }, se]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": W()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": W()
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
        "auto-cols": ["auto", "min", "max", "fr", se]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", se]
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
        justify: ["normal", ...q()]
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
        content: ["normal", ...q(), "baseline"]
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
        "place-content": [...q(), "baseline"]
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
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [m]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [m]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [m]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [m]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [m]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [m]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [m]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [m]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [m]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [U]
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
        "space-y": [U]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", se, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [se, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [se, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Dt]
        }, Dt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [se, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [se, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [se, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [se, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Dt, Tt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Ha]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [sn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", se]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Dr, Ha]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", wt, se]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", se]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", se]
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
        "placeholder-opacity": [y]
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
        "text-opacity": [y]
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
        decoration: [...T(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", wt, Tt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", wt, se]
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
        indent: E()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", se]
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
        content: ["none", se]
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
        "bg-opacity": [y]
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
        bg: [...N(), Q0]
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
        bg: ["auto", "cover", "contain", J0]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, ex]
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
        from: [x]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [x]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [x]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [y]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...T(), "hidden"]
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
        "divide-opacity": [y]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: T()
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
        outline: ["", ...T()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [wt, se]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [wt, Tt]
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
        ring: fe()
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
        "ring-opacity": [y]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [wt, Tt]
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
        shadow: ["", "inner", "none", Dt, tx]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [sn]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [y]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...B(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": B()
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
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Dt, se]
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
        saturate: [O]
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
        "backdrop-opacity": [y]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", se]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: v()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", se]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: v()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", se]
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
        scale: [S]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [S]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [S]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [an, se]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [te]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [te]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [Y]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Y]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", se]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", se]
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
        "scroll-m": E()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": E()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": E()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": E()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": E()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": E()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": E()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": E()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": E()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": E()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": E()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": E()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": E()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": E()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": E()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": E()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": E()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": E()
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
        "will-change": ["auto", "scroll", "contents", "transform", se]
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
        stroke: [wt, Tt, Ha]
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
}, Sn = /* @__PURE__ */ V0(ax);
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function ix(e, t, r) {
  return (t = lx(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function hu(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function L(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? hu(Object(r), !0).forEach(function(n) {
      ix(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : hu(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function sx(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function lx(e) {
  var t = sx(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const gu = () => {
};
let cl = {}, Jp = {}, Qp = null, Zp = {
  mark: gu,
  measure: gu
};
try {
  typeof window < "u" && (cl = window), typeof document < "u" && (Jp = document), typeof MutationObserver < "u" && (Qp = MutationObserver), typeof performance < "u" && (Zp = performance);
} catch {
}
const {
  userAgent: bu = ""
} = cl.navigator || {}, tr = cl, $e = Jp, yu = Qp, bo = Zp;
tr.document;
const It = !!$e.documentElement && !!$e.head && typeof $e.addEventListener == "function" && typeof $e.createElement == "function", em = ~bu.indexOf("MSIE") || ~bu.indexOf("Trident/");
var cx = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, ux = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, tm = {
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
}, fx = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, rm = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], De = "classic", aa = "duotone", dx = "sharp", px = "sharp-duotone", nm = [De, aa, dx, px], mx = {
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
}, hx = {
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
}, gx = /* @__PURE__ */ new Map([["classic", {
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
}]]), bx = {
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
}, yx = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], vu = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, vx = ["kit"], xx = {
  kit: {
    "fa-kit": "fak"
  }
}, wx = ["fak", "fakd"], kx = {
  kit: {
    fak: "fa-kit"
  }
}, xu = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, yo = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Ox = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Sx = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ax = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Px = {
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
}, Ex = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Ji = {
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
}, Nx = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Qi = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Ox, ...Nx], Cx = ["solid", "regular", "light", "thin", "duotone", "brands"], om = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], $x = om.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), jx = [...Object.keys(Ex), ...Cx, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", yo.GROUP, yo.SWAP_OPACITY, yo.PRIMARY, yo.SECONDARY].concat(om.map((e) => "".concat(e, "x"))).concat($x.map((e) => "w-".concat(e))), Ix = {
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
const Et = "___FONT_AWESOME___", Zi = 16, am = "fa", im = "svg-inline--fa", hr = "data-fa-i2svg", es = "data-fa-pseudo-element", zx = "data-fa-pseudo-element-pending", ul = "data-prefix", fl = "data-icon", wu = "fontawesome-i2svg", _x = "async", Mx = ["HTML", "HEAD", "STYLE", "SCRIPT"], sm = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function eo(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[De];
    }
  });
}
const lm = L({}, tm);
lm[De] = L(L(L(L({}, {
  "fa-duotone": "duotone"
}), tm[De]), vu.kit), vu["kit-duotone"]);
const Rx = eo(lm), ts = L({}, bx);
ts[De] = L(L(L(L({}, {
  duotone: "fad"
}), ts[De]), xu.kit), xu["kit-duotone"]);
const ku = eo(ts), rs = L({}, Ji);
rs[De] = L(L({}, rs[De]), kx.kit);
const dl = eo(rs), ns = L({}, Px);
ns[De] = L(L({}, ns[De]), xx.kit);
eo(ns);
const Tx = cx, cm = "fa-layers-text", Dx = ux, Lx = L({}, mx);
eo(Lx);
const Fx = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Ka = fx, Vx = [...vx, ...jx], An = tr.FontAwesomeConfig || {};
function Wx(e) {
  var t = $e.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Ux(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
$e && typeof $e.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = Ux(Wx(t));
  n != null && (An[r] = n);
});
const um = {
  styleDefault: "solid",
  familyDefault: De,
  cssPrefix: am,
  replacementClass: im,
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
const qr = L(L({}, um), An);
qr.autoReplaceSvg || (qr.observeMutations = !1);
const K = {};
Object.keys(um).forEach((e) => {
  Object.defineProperty(K, e, {
    enumerable: !0,
    set: function(t) {
      qr[e] = t, Pn.forEach((r) => r(K));
    },
    get: function() {
      return qr[e];
    }
  });
});
Object.defineProperty(K, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    qr.cssPrefix = e, Pn.forEach((t) => t(K));
  },
  get: function() {
    return qr.cssPrefix;
  }
});
tr.FontAwesomeConfig = K;
const Pn = [];
function Gx(e) {
  return Pn.push(e), () => {
    Pn.splice(Pn.indexOf(e), 1);
  };
}
const Lt = Zi, mt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Yx(e) {
  if (!e || !It)
    return;
  const t = $e.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = $e.head.childNodes;
  let n = null;
  for (let o = r.length - 1; o > -1; o--) {
    const a = r[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = a);
  }
  return $e.head.insertBefore(t, n), e;
}
const qx = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Tn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += qx[Math.random() * 62 | 0];
  return t;
}
function Qr(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function pl(e) {
  return e.classList ? Qr(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function fm(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Bx(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(fm(e[r]), '" '), "").trim();
}
function ia(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function ml(e) {
  return e.size !== mt.size || e.x !== mt.x || e.y !== mt.y || e.rotate !== mt.rotate || e.flipX || e.flipY;
}
function Hx(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const o = {
    transform: "translate(".concat(r / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: c,
    path: l
  };
}
function Kx(e) {
  let {
    transform: t,
    width: r = Zi,
    height: n = Zi,
    startCentered: o = !1
  } = e, a = "";
  return o && em ? a += "translate(".concat(t.x / Lt - r / 2, "em, ").concat(t.y / Lt - n / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / Lt, "em), calc(-50% + ").concat(t.y / Lt, "em)) ") : a += "translate(".concat(t.x / Lt, "em, ").concat(t.y / Lt, "em) "), a += "scale(".concat(t.size / Lt * (t.flipX ? -1 : 1), ", ").concat(t.size / Lt * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var Xx = `:root, :host {
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
function dm() {
  const e = am, t = im, r = K.cssPrefix, n = K.replacementClass;
  let o = Xx;
  if (r !== e || n !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return o;
}
let Ou = !1;
function Xa() {
  K.autoAddCss && !Ou && (Yx(dm()), Ou = !0);
}
var Jx = {
  mixout() {
    return {
      dom: {
        css: dm,
        insertCss: Xa
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Xa();
      },
      beforeI2svg() {
        Xa();
      }
    };
  }
};
const Nt = tr || {};
Nt[Et] || (Nt[Et] = {});
Nt[Et].styles || (Nt[Et].styles = {});
Nt[Et].hooks || (Nt[Et].hooks = {});
Nt[Et].shims || (Nt[Et].shims = []);
var ht = Nt[Et];
const pm = [], mm = function() {
  $e.removeEventListener("DOMContentLoaded", mm), Fo = 1, pm.map((e) => e());
};
let Fo = !1;
It && (Fo = ($e.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test($e.readyState), Fo || $e.addEventListener("DOMContentLoaded", mm));
function Qx(e) {
  It && (Fo ? setTimeout(e, 0) : pm.push(e));
}
function to(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? fm(e) : "<".concat(t, " ").concat(Bx(r), ">").concat(n.map(to).join(""), "</").concat(t, ">");
}
function Su(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var Ja = function(e, t, r, n) {
  var o = Object.keys(e), a = o.length, i = t, s, c, l;
  for (r === void 0 ? (s = 1, l = e[o[0]]) : (s = 0, l = r); s < a; s++)
    c = o[s], l = i(l, e[c], c, e);
  return l;
};
function Zx(e) {
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
function hm(e) {
  const t = Zx(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function ew(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), o;
  return n >= 55296 && n <= 56319 && r > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function Au(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function os(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, o = Au(t);
  typeof ht.hooks.addPack == "function" && !n ? ht.hooks.addPack(e, Au(t)) : ht.styles[e] = L(L({}, ht.styles[e] || {}), o), e === "fas" && os("fa", t);
}
const {
  styles: Dn,
  shims: tw
} = ht, gm = Object.keys(dl), rw = gm.reduce((e, t) => (e[t] = Object.keys(dl[t]), e), {});
let hl = null, bm = {}, ym = {}, vm = {}, xm = {}, wm = {};
function nw(e) {
  return ~Vx.indexOf(e);
}
function ow(e, t) {
  const r = t.split("-"), n = r[0], o = r.slice(1).join("-");
  return n === e && o !== "" && !nw(o) ? o : null;
}
const km = () => {
  const e = (n) => Ja(Dn, (o, a, i) => (o[i] = Ja(a, n, {}), o), {});
  bm = e((n, o, a) => (o[3] && (n[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = a;
  }), n)), ym = e((n, o, a) => (n[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = a;
  }), n)), wm = e((n, o, a) => {
    const i = o[2];
    return n[a] = a, i.forEach((s) => {
      n[s] = a;
    }), n;
  });
  const t = "far" in Dn || K.autoFetchSvg, r = Ja(tw, (n, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (n.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (n.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  vm = r.names, xm = r.unicodes, hl = sa(K.styleDefault, {
    family: K.familyDefault
  });
};
Gx((e) => {
  hl = sa(e.styleDefault, {
    family: K.familyDefault
  });
});
km();
function gl(e, t) {
  return (bm[e] || {})[t];
}
function aw(e, t) {
  return (ym[e] || {})[t];
}
function ur(e, t) {
  return (wm[e] || {})[t];
}
function Om(e) {
  return vm[e] || {
    prefix: null,
    iconName: null
  };
}
function iw(e) {
  const t = xm[e], r = gl("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function rr() {
  return hl;
}
const Sm = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function sw(e) {
  let t = De;
  const r = gm.reduce((n, o) => (n[o] = "".concat(K.cssPrefix, "-").concat(o), n), {});
  return nm.forEach((n) => {
    (e.includes(r[n]) || e.some((o) => rw[n].includes(o))) && (t = n);
  }), t;
}
function sa(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = De
  } = t, n = Rx[r][e];
  if (r === aa && !e)
    return "fad";
  const o = ku[r][e] || ku[r][n], a = e in ht.styles ? e : null;
  return o || a || null;
}
function lw(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const o = ow(K.cssPrefix, n);
    o ? r = o : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function Pu(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function la(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const o = Qi.concat(Sx), a = Pu(e.filter((f) => o.includes(f))), i = Pu(e.filter((f) => !Qi.includes(f))), s = a.filter((f) => (n = f, !rm.includes(f))), [c = null] = s, l = sw(a), u = L(L({}, lw(i)), {}, {
    prefix: sa(c, {
      family: l
    })
  });
  return L(L(L({}, u), dw({
    values: e,
    family: l,
    styles: Dn,
    config: K,
    canonical: u,
    givenPrefix: n
  })), cw(r, n, u));
}
function cw(e, t, r) {
  let {
    prefix: n,
    iconName: o
  } = r;
  if (e || !n || !o)
    return {
      prefix: n,
      iconName: o
    };
  const a = t === "fa" ? Om(o) : {}, i = ur(n, o);
  return o = a.iconName || i || o, n = a.prefix || n, n === "far" && !Dn.far && Dn.fas && !K.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: o
  };
}
const uw = nm.filter((e) => e !== De || e !== aa), fw = Object.keys(Ji).filter((e) => e !== De).map((e) => Object.keys(Ji[e])).flat();
function dw(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = r === aa, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || u) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && uw.includes(r) && (Object.keys(a).find((f) => fw.includes(f)) || i.autoFetchSvg)) {
    const f = gx.get(r).defaultShortPrefixId;
    n.prefix = f, n.iconName = ur(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || o === "fa") && (n.prefix = rr() || "fas"), n;
}
class pw {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const o = r.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = L(L({}, this.definitions[a] || {}), o[a]), os(a, o[a]);
      const i = dl[De][a];
      i && os(i, o[a]), km();
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
        iconName: i,
        icon: s
      } = n[o], c = s[2];
      t[a] || (t[a] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[a][l] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let Eu = [], Cr = {};
const Lr = {}, mw = Object.keys(Lr);
function hw(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return Eu = e, Cr = {}, Object.keys(Lr).forEach((n) => {
    mw.indexOf(n) === -1 && delete Lr[n];
  }), Eu.forEach((n) => {
    const o = n.mixout ? n.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (r[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        r[a] || (r[a] = {}), r[a][i] = o[a][i];
      });
    }), n.hooks) {
      const a = n.hooks();
      Object.keys(a).forEach((i) => {
        Cr[i] || (Cr[i] = []), Cr[i].push(a[i]);
      });
    }
    n.provides && n.provides(Lr);
  }), r;
}
function as(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), o = 2; o < r; o++)
    n[o - 2] = arguments[o];
  return (Cr[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...n]);
  }), t;
}
function gr(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (Cr[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function nr() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Lr[e] ? Lr[e].apply(null, t) : void 0;
}
function is(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || rr();
  if (t)
    return t = ur(r, t) || t, Su(Am.definitions, r, t) || Su(ht.styles, r, t);
}
const Am = new pw(), gw = () => {
  K.autoReplaceSvg = !1, K.observeMutations = !1, gr("noAuto");
}, bw = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return It ? (gr("beforeI2svg", e), nr("pseudoElements2svg", e), nr("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    K.autoReplaceSvg === !1 && (K.autoReplaceSvg = !0), K.observeMutations = !0, Qx(() => {
      vw({
        autoReplaceSvgRoot: t
      }), gr("watch", e);
    });
  }
}, yw = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: ur(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = sa(e[0]);
      return {
        prefix: r,
        iconName: ur(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(K.cssPrefix, "-")) > -1 || e.match(Tx))) {
      const t = la(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || rr(),
        iconName: ur(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = rr();
      return {
        prefix: t,
        iconName: ur(t, e) || e
      };
    }
  }
}, Be = {
  noAuto: gw,
  config: K,
  dom: bw,
  parse: yw,
  library: Am,
  findIconDefinition: is,
  toHtml: to
}, vw = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = $e
  } = e;
  (Object.keys(ht.styles).length > 0 || K.autoFetchSvg) && It && K.autoReplaceSvg && Be.dom.i2svg({
    node: t
  });
};
function ca(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => to(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!It) return;
      const r = $e.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function xw(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (ml(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    o.style = ia(L(L({}, a), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function ww(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(K.cssPrefix, "-").concat(r) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: L(L({}, o), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function bl(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: b
  } = r.found ? r : t, x = wx.includes(n), p = [K.replacementClass, o ? "".concat(K.cssPrefix, "-").concat(o) : ""].filter((g) => u.classes.indexOf(g) === -1).filter((g) => g !== "" || !!g).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: L(L({}, u.attributes), {}, {
      "data-prefix": n,
      "data-icon": o,
      class: p,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(b)
    })
  };
  const y = x && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / b * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[hr] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(l || Tn())
    },
    children: [s]
  }), delete m.attributes.title);
  const k = L(L({}, m), {}, {
    prefix: n,
    iconName: o,
    main: t,
    mask: r,
    maskId: c,
    transform: a,
    symbol: i,
    styles: L(L({}, y), u.styles)
  }), {
    children: O,
    attributes: S
  } = r.found && t.found ? nr("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : nr("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = O, k.attributes = S, i ? ww(k) : xw(k);
}
function Nu(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, c = L(L(L({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[hr] = "");
  const l = L({}, i.styles);
  ml(o) && (l.transform = Kx({
    transform: o,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const u = ia(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function kw(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, o = L(L(L({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), a = ia(n.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), r && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [r]
  }), i;
}
const {
  styles: Qa
} = ht;
function ss(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let o = null;
  return Array.isArray(n) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(K.cssPrefix, "-").concat(Ka.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(K.cssPrefix, "-").concat(Ka.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(K.cssPrefix, "-").concat(Ka.PRIMARY),
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
const Ow = {
  found: !1,
  width: 512,
  height: 512
};
function Sw(e, t) {
  !sm && !K.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function ls(e, t) {
  let r = t;
  return t === "fa" && K.styleDefault !== null && (t = rr()), new Promise((n, o) => {
    if (r === "fa") {
      const a = Om(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Qa[t] && Qa[t][e]) {
      const a = Qa[t][e];
      return n(ss(a));
    }
    Sw(e, t), n(L(L({}, Ow), {}, {
      icon: K.showMissingIcons && e ? nr("missingIconAbstract") || {} : {}
    }));
  });
}
const Cu = () => {
}, cs = K.measurePerformance && bo && bo.mark && bo.measure ? bo : {
  mark: Cu,
  measure: Cu
}, yn = 'FA "6.7.2"', Aw = (e) => (cs.mark("".concat(yn, " ").concat(e, " begins")), () => Pm(e)), Pm = (e) => {
  cs.mark("".concat(yn, " ").concat(e, " ends")), cs.measure("".concat(yn, " ").concat(e), "".concat(yn, " ").concat(e, " begins"), "".concat(yn, " ").concat(e, " ends"));
};
var yl = {
  begin: Aw,
  end: Pm
};
const Co = () => {
};
function $u(e) {
  return typeof (e.getAttribute ? e.getAttribute(hr) : null) == "string";
}
function Pw(e) {
  const t = e.getAttribute ? e.getAttribute(ul) : null, r = e.getAttribute ? e.getAttribute(fl) : null;
  return t && r;
}
function Ew(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(K.replacementClass);
}
function Nw() {
  return K.autoReplaceSvg === !0 ? $o.replace : $o[K.autoReplaceSvg] || $o.replace;
}
function Cw(e) {
  return $e.createElementNS("http://www.w3.org/2000/svg", e);
}
function $w(e) {
  return $e.createElement(e);
}
function Em(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? Cw : $w
  } = t;
  if (typeof e == "string")
    return $e.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(Em(o, {
      ceFn: r
    }));
  }), n;
}
function jw(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const $o = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(Em(r), t);
      }), t.getAttribute(hr) === null && K.keepOriginalSource) {
        let r = $e.createComment(jw(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~pl(t).indexOf(K.replacementClass))
      return $o.replace(e);
    const n = new RegExp("".concat(K.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const a = r[0].attributes.class.split(" ").reduce((i, s) => (s === K.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = r.map((a) => to(a)).join(`
`);
    t.setAttribute(hr, ""), t.innerHTML = o;
  }
};
function ju(e) {
  e();
}
function Nm(e, t) {
  const r = typeof t == "function" ? t : Co;
  if (e.length === 0)
    r();
  else {
    let n = ju;
    K.mutateApproach === _x && (n = tr.requestAnimationFrame || ju), n(() => {
      const o = Nw(), a = yl.begin("mutate");
      e.map(o), a(), r();
    });
  }
}
let vl = !1;
function Cm() {
  vl = !0;
}
function us() {
  vl = !1;
}
let Vo = null;
function Iu(e) {
  if (!yu || !K.observeMutations)
    return;
  const {
    treeCallback: t = Co,
    nodeCallback: r = Co,
    pseudoElementsCallback: n = Co,
    observeMutationsRoot: o = $e
  } = e;
  Vo = new yu((a) => {
    if (vl) return;
    const i = rr();
    Qr(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !$u(s.addedNodes[0]) && (K.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && K.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && $u(s.target) && ~Fx.indexOf(s.attributeName))
        if (s.attributeName === "class" && Pw(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = la(pl(s.target));
          s.target.setAttribute(ul, c || i), l && s.target.setAttribute(fl, l);
        } else Ew(s.target) && r(s.target);
    });
  }), It && Vo.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Iw() {
  Vo && Vo.disconnect();
}
function zw(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function _w(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = la(pl(e));
  return o.prefix || (o.prefix = rr()), t && r && (o.prefix = t, o.iconName = r), o.iconName && o.prefix || (o.prefix && n.length > 0 && (o.iconName = aw(o.prefix, e.innerText) || gl(o.prefix, hm(e.innerText))), !o.iconName && K.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function Mw(e) {
  const t = Qr(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return K.autoA11y && (r ? t["aria-labelledby"] = "".concat(K.replacementClass, "-title-").concat(n || Tn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Rw() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: mt,
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
function zu(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: o
  } = _w(e), a = Mw(e), i = as("parseNodeAttributes", {}, e);
  let s = t.styleParser ? zw(e) : [];
  return L({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: mt,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: s,
      attributes: a
    }
  }, i);
}
const {
  styles: Tw
} = ht;
function $m(e) {
  const t = K.autoReplaceSvg === "nest" ? zu(e, {
    styleParser: !1
  }) : zu(e);
  return ~t.extra.classes.indexOf(cm) ? nr("generateLayersText", e, t) : nr("generateSvgReplacementMutation", e, t);
}
function Dw() {
  return [...yx, ...Qi];
}
function _u(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!It) return Promise.resolve();
  const r = $e.documentElement.classList, n = (u) => r.add("".concat(wu, "-").concat(u)), o = (u) => r.remove("".concat(wu, "-").concat(u)), a = K.autoFetchSvg ? Dw() : rm.concat(Object.keys(Tw));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(cm, ":not([").concat(hr, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(hr, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = Qr(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), o("complete");
  else
    return Promise.resolve();
  const c = yl.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = $m(f);
      d && u.push(d);
    } catch (d) {
      sm || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      Nm(d, () => {
        n("active"), n("complete"), o("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function Lw(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  $m(e).then((r) => {
    r && Nm([r], t);
  });
}
function Fw(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : is(t || {});
    let {
      mask: o
    } = r;
    return o && (o = (o || {}).icon ? o : is(o || {})), e(n, L(L({}, r), {}, {
      mask: o
    }));
  };
}
const Vw = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = mt,
    symbol: n = !1,
    mask: o = null,
    maskId: a = null,
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
    icon: b
  } = e;
  return ca(L({
    type: "icon"
  }, e), () => (gr("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), K.autoA11y && (i ? l["aria-labelledby"] = "".concat(K.replacementClass, "-title-").concat(s || Tn()) : (l["aria-hidden"] = "true", l.focusable = "false")), bl({
    icons: {
      main: ss(b),
      mask: o ? ss(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: L(L({}, mt), r),
    symbol: n,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var Ww = {
  mixout() {
    return {
      icon: Fw(Vw)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = _u, e.nodeCallback = Lw, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = $e,
        callback: n = () => {
        }
      } = t;
      return _u(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = r;
      return new Promise((d, b) => {
        Promise.all([ls(n, i), l.iconName ? ls(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((x) => {
          let [p, m] = x;
          d([t, bl({
            icons: {
              main: p,
              mask: m
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = ia(i);
      s.length > 0 && (n.style = s);
      let c;
      return ml(a) && (c = nr("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), r.push(c || o.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, Uw = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return ca({
          type: "layer"
        }, () => {
          gr("beforeDOMElementCreation", {
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
              class: ["".concat(K.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, Gw = {
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
        return ca({
          type: "counter",
          content: e
        }, () => (gr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), kw({
          content: e.toString(),
          title: r,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(K.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, Yw = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = mt,
          title: n = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return ca({
          type: "text",
          content: e
        }, () => (gr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Nu({
          content: e,
          transform: L(L({}, mt), r),
          title: n,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(K.cssPrefix, "-layers-text"), ...o]
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
      let i = null, s = null;
      if (em) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return K.autoA11y && !n && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Nu({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: n,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const qw = new RegExp('"', "ug"), Mu = [1105920, 1112319], Ru = L(L(L(L({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), hx), Ix), Ax), fs = Object.keys(Ru).reduce((e, t) => (e[t.toLowerCase()] = Ru[t], e), {}), Bw = Object.keys(fs).reduce((e, t) => {
  const r = fs[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function Hw(e) {
  const t = e.replace(qw, ""), r = ew(t, 0), n = r >= Mu[0] && r <= Mu[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: hm(o ? t[0] : t),
    isSecondary: n || o
  };
}
function Kw(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), o = isNaN(n) ? "normal" : n;
  return (fs[r] || {})[o] || Bw[r];
}
function Tu(e, t) {
  const r = "".concat(zx).concat(t.replace(":", "-"));
  return new Promise((n, o) => {
    if (e.getAttribute(r) !== null)
      return n();
    const a = Qr(e.children).filter((f) => f.getAttribute(es) === t)[0], i = tr.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(Dx), l = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !c)
      return e.removeChild(a), n();
    if (c && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = Kw(s, l);
      const {
        value: b,
        isSecondary: x
      } = Hw(f), p = c[0].startsWith("FontAwesome");
      let m = gl(d, b), y = m;
      if (p) {
        const k = iw(b);
        k.iconName && k.prefix && (m = k.iconName, d = k.prefix);
      }
      if (m && !x && (!a || a.getAttribute(ul) !== d || a.getAttribute(fl) !== y)) {
        e.setAttribute(r, y), a && e.removeChild(a);
        const k = Rw(), {
          extra: O
        } = k;
        O.attributes[es] = t, ls(m, d).then((S) => {
          const g = bl(L(L({}, k), {}, {
            icons: {
              main: S,
              mask: Sm()
            },
            prefix: d,
            iconName: y,
            extra: O,
            watchable: !0
          })), Y = $e.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(Y, e.firstChild) : e.appendChild(Y), Y.outerHTML = g.map((U) => to(U)).join(`
`), e.removeAttribute(r), n();
        }).catch(o);
      } else
        n();
    } else
      n();
  });
}
function Xw(e) {
  return Promise.all([Tu(e, "::before"), Tu(e, "::after")]);
}
function Jw(e) {
  return e.parentNode !== document.head && !~Mx.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(es) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Du(e) {
  if (It)
    return new Promise((t, r) => {
      const n = Qr(e.querySelectorAll("*")).filter(Jw).map(Xw), o = yl.begin("searchPseudoElements");
      Cm(), Promise.all(n).then(() => {
        o(), us(), t();
      }).catch(() => {
        o(), us(), r();
      });
    });
}
var Qw = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Du, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = $e
      } = t;
      K.searchPseudoElements && Du(r);
    };
  }
};
let Lu = !1;
var Zw = {
  mixout() {
    return {
      dom: {
        unwatch() {
          Cm(), Lu = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Iu(as("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Iw();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Lu ? us() : Iu(as("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Fu = (e) => {
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
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return r.flipX = !0, r;
    if (a && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (a) {
      case "grow":
        r.size = r.size + i;
        break;
      case "shrink":
        r.size = r.size - i;
        break;
      case "left":
        r.x = r.x - i;
        break;
      case "right":
        r.x = r.x + i;
        break;
      case "up":
        r.y = r.y - i;
        break;
      case "down":
        r.y = r.y + i;
        break;
      case "rotate":
        r.rotate = r.rotate + i;
        break;
    }
    return r;
  }, t);
};
var e2 = {
  mixout() {
    return {
      parse: {
        transform: (e) => Fu(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = Fu(r)), e;
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
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: L({}, d.outer),
        children: [{
          tag: "g",
          attributes: L({}, d.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: L(L({}, r.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const Za = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Vu(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function t2(e) {
  return e.tag === "g" ? e.children : [e];
}
var r2 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? la(r.split(" ").map((o) => o.trim())) : Sm();
        return n.prefix || (n.prefix = rr()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = o, {
        width: u,
        icon: f
      } = a, d = Hx({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), b = {
        tag: "rect",
        attributes: L(L({}, Za), {}, {
          fill: "white"
        })
      }, x = l.children ? {
        children: l.children.map(Vu)
      } : {}, p = {
        tag: "g",
        attributes: L({}, d.inner),
        children: [Vu(L({
          tag: l.tag,
          attributes: L(L({}, l.attributes), d.path)
        }, x))]
      }, m = {
        tag: "g",
        attributes: L({}, d.outer),
        children: [p]
      }, y = "mask-".concat(i || Tn()), k = "clip-".concat(i || Tn()), O = {
        tag: "mask",
        attributes: L(L({}, Za), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, m]
      }, S = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: t2(f)
        }, O]
      };
      return r.push(S, {
        tag: "rect",
        attributes: L({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(y, ")")
        }, Za)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, n2 = {
  provides(e) {
    let t = !1;
    tr.matchMedia && (t = tr.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: L(L({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = L(L({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: L(L({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: L(L({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: L(L({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: L(L({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: L(L({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: L(L({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: L(L({}, a), {}, {
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
}, o2 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, a2 = [Jx, Ww, Uw, Gw, Yw, Qw, Zw, e2, r2, n2, o2];
hw(a2, {
  mixoutsTo: Be
});
Be.noAuto;
Be.config;
Be.library;
Be.dom;
const ds = Be.parse;
Be.findIconDefinition;
Be.toHtml;
const i2 = Be.icon;
Be.layer;
Be.text;
Be.counter;
function s2(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var vo = { exports: {} }, ei = { exports: {} }, ye = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Wu;
function l2() {
  if (Wu) return ye;
  Wu = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function O(g) {
    if (typeof g == "object" && g !== null) {
      var Y = g.$$typeof;
      switch (Y) {
        case t:
          switch (g = g.type, g) {
            case c:
            case l:
            case n:
            case a:
            case o:
            case f:
              return g;
            default:
              switch (g = g && g.$$typeof, g) {
                case s:
                case u:
                case x:
                case b:
                case i:
                  return g;
                default:
                  return Y;
              }
          }
        case r:
          return Y;
      }
    }
  }
  function S(g) {
    return O(g) === l;
  }
  return ye.AsyncMode = c, ye.ConcurrentMode = l, ye.ContextConsumer = s, ye.ContextProvider = i, ye.Element = t, ye.ForwardRef = u, ye.Fragment = n, ye.Lazy = x, ye.Memo = b, ye.Portal = r, ye.Profiler = a, ye.StrictMode = o, ye.Suspense = f, ye.isAsyncMode = function(g) {
    return S(g) || O(g) === c;
  }, ye.isConcurrentMode = S, ye.isContextConsumer = function(g) {
    return O(g) === s;
  }, ye.isContextProvider = function(g) {
    return O(g) === i;
  }, ye.isElement = function(g) {
    return typeof g == "object" && g !== null && g.$$typeof === t;
  }, ye.isForwardRef = function(g) {
    return O(g) === u;
  }, ye.isFragment = function(g) {
    return O(g) === n;
  }, ye.isLazy = function(g) {
    return O(g) === x;
  }, ye.isMemo = function(g) {
    return O(g) === b;
  }, ye.isPortal = function(g) {
    return O(g) === r;
  }, ye.isProfiler = function(g) {
    return O(g) === a;
  }, ye.isStrictMode = function(g) {
    return O(g) === o;
  }, ye.isSuspense = function(g) {
    return O(g) === f;
  }, ye.isValidElementType = function(g) {
    return typeof g == "string" || typeof g == "function" || g === n || g === l || g === a || g === o || g === f || g === d || typeof g == "object" && g !== null && (g.$$typeof === x || g.$$typeof === b || g.$$typeof === i || g.$$typeof === s || g.$$typeof === u || g.$$typeof === m || g.$$typeof === y || g.$$typeof === k || g.$$typeof === p);
  }, ye.typeOf = O, ye;
}
var we = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Uu;
function c2() {
  return Uu || (Uu = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function O(w) {
      return typeof w == "string" || typeof w == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      w === n || w === l || w === a || w === o || w === f || w === d || typeof w == "object" && w !== null && (w.$$typeof === x || w.$$typeof === b || w.$$typeof === i || w.$$typeof === s || w.$$typeof === u || w.$$typeof === m || w.$$typeof === y || w.$$typeof === k || w.$$typeof === p);
    }
    function S(w) {
      if (typeof w == "object" && w !== null) {
        var ge = w.$$typeof;
        switch (ge) {
          case t:
            var Ie = w.type;
            switch (Ie) {
              case c:
              case l:
              case n:
              case a:
              case o:
              case f:
                return Ie;
              default:
                var Ke = Ie && Ie.$$typeof;
                switch (Ke) {
                  case s:
                  case u:
                  case x:
                  case b:
                  case i:
                    return Ke;
                  default:
                    return ge;
                }
            }
          case r:
            return ge;
        }
      }
    }
    var g = c, Y = l, U = s, te = i, J = t, oe = u, ne = n, E = x, fe = b, W = r, N = a, T = o, B = f, q = !1;
    function re(w) {
      return q || (q = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), h(w) || S(w) === c;
    }
    function h(w) {
      return S(w) === l;
    }
    function v(w) {
      return S(w) === s;
    }
    function C(w) {
      return S(w) === i;
    }
    function I(w) {
      return typeof w == "object" && w !== null && w.$$typeof === t;
    }
    function P(w) {
      return S(w) === u;
    }
    function z(w) {
      return S(w) === n;
    }
    function $(w) {
      return S(w) === x;
    }
    function j(w) {
      return S(w) === b;
    }
    function M(w) {
      return S(w) === r;
    }
    function _(w) {
      return S(w) === a;
    }
    function R(w) {
      return S(w) === o;
    }
    function Q(w) {
      return S(w) === f;
    }
    we.AsyncMode = g, we.ConcurrentMode = Y, we.ContextConsumer = U, we.ContextProvider = te, we.Element = J, we.ForwardRef = oe, we.Fragment = ne, we.Lazy = E, we.Memo = fe, we.Portal = W, we.Profiler = N, we.StrictMode = T, we.Suspense = B, we.isAsyncMode = re, we.isConcurrentMode = h, we.isContextConsumer = v, we.isContextProvider = C, we.isElement = I, we.isForwardRef = P, we.isFragment = z, we.isLazy = $, we.isMemo = j, we.isPortal = M, we.isProfiler = _, we.isStrictMode = R, we.isSuspense = Q, we.isValidElementType = O, we.typeOf = S;
  }()), we;
}
var Gu;
function jm() {
  return Gu || (Gu = 1, process.env.NODE_ENV === "production" ? ei.exports = l2() : ei.exports = c2()), ei.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var ti, Yu;
function u2() {
  if (Yu) return ti;
  Yu = 1;
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
  return ti = o() ? Object.assign : function(a, i) {
    for (var s, c = n(a), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          r.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, ti;
}
var ri, qu;
function xl() {
  if (qu) return ri;
  qu = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ri = e, ri;
}
var Bu, Hu;
function Im() {
  return Hu || (Hu = 1, Bu = Function.call.bind(Object.prototype.hasOwnProperty)), Bu;
}
var ni, Ku;
function f2() {
  if (Ku) return ni;
  Ku = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ xl(), r = {}, n = /* @__PURE__ */ Im();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (n(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, c, s, null, t);
          } catch (x) {
            f = x;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in r)) {
            r[f.message] = !0;
            var b = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (b ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, ni = o, ni;
}
var oi, Xu;
function d2() {
  if (Xu) return oi;
  Xu = 1;
  var e = jm(), t = u2(), r = /* @__PURE__ */ xl(), n = /* @__PURE__ */ Im(), o = /* @__PURE__ */ f2(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
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
  return oi = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(h) {
      var v = h && (l && h[l] || h[u]);
      if (typeof v == "function")
        return v;
    }
    var d = "<<anonymous>>", b = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: k(),
      arrayOf: O,
      element: S(),
      elementType: g(),
      instanceOf: Y,
      node: oe(),
      objectOf: te,
      oneOf: U,
      oneOfType: J,
      shape: E,
      exact: fe
    };
    function x(h, v) {
      return h === v ? h !== 0 || 1 / h === 1 / v : h !== h && v !== v;
    }
    function p(h, v) {
      this.message = h, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function m(h) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, C = 0;
      function I(z, $, j, M, _, R, Q) {
        if (M = M || d, R = R || j, Q !== r) {
          if (c) {
            var w = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw w.name = "Invariant Violation", w;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ge = M + ":" + j;
            !v[ge] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + R + "` prop on `" + M + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[ge] = !0, C++);
          }
        }
        return $[j] == null ? z ? $[j] === null ? new p("The " + _ + " `" + R + "` is marked as required " + ("in `" + M + "`, but its value is `null`.")) : new p("The " + _ + " `" + R + "` is marked as required in " + ("`" + M + "`, but its value is `undefined`.")) : null : h($, j, M, _, R);
      }
      var P = I.bind(null, !1);
      return P.isRequired = I.bind(null, !0), P;
    }
    function y(h) {
      function v(C, I, P, z, $, j) {
        var M = C[I], _ = T(M);
        if (_ !== h) {
          var R = B(M);
          return new p(
            "Invalid " + z + " `" + $ + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected ") + ("`" + h + "`."),
            { expectedType: h }
          );
        }
        return null;
      }
      return m(v);
    }
    function k() {
      return m(i);
    }
    function O(h) {
      function v(C, I, P, z, $) {
        if (typeof h != "function")
          return new p("Property `" + $ + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var j = C[I];
        if (!Array.isArray(j)) {
          var M = T(j);
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected an array."));
        }
        for (var _ = 0; _ < j.length; _++) {
          var R = h(j, _, P, z, $ + "[" + _ + "]", r);
          if (R instanceof Error)
            return R;
        }
        return null;
      }
      return m(v);
    }
    function S() {
      function h(v, C, I, P, z) {
        var $ = v[C];
        if (!s($)) {
          var j = T($);
          return new p("Invalid " + P + " `" + z + "` of type " + ("`" + j + "` supplied to `" + I + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(h);
    }
    function g() {
      function h(v, C, I, P, z) {
        var $ = v[C];
        if (!e.isValidElementType($)) {
          var j = T($);
          return new p("Invalid " + P + " `" + z + "` of type " + ("`" + j + "` supplied to `" + I + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(h);
    }
    function Y(h) {
      function v(C, I, P, z, $) {
        if (!(C[I] instanceof h)) {
          var j = h.name || d, M = re(C[I]);
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected ") + ("instance of `" + j + "`."));
        }
        return null;
      }
      return m(v);
    }
    function U(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function v(C, I, P, z, $) {
        for (var j = C[I], M = 0; M < h.length; M++)
          if (x(j, h[M]))
            return null;
        var _ = JSON.stringify(h, function(R, Q) {
          var w = B(Q);
          return w === "symbol" ? String(Q) : Q;
        });
        return new p("Invalid " + z + " `" + $ + "` of value `" + String(j) + "` " + ("supplied to `" + P + "`, expected one of " + _ + "."));
      }
      return m(v);
    }
    function te(h) {
      function v(C, I, P, z, $) {
        if (typeof h != "function")
          return new p("Property `" + $ + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected an object."));
        for (var _ in j)
          if (n(j, _)) {
            var R = h(j, _, P, z, $ + "." + _, r);
            if (R instanceof Error)
              return R;
          }
        return null;
      }
      return m(v);
    }
    function J(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var v = 0; v < h.length; v++) {
        var C = h[v];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + q(C) + " at index " + v + "."
          ), i;
      }
      function I(P, z, $, j, M) {
        for (var _ = [], R = 0; R < h.length; R++) {
          var Q = h[R], w = Q(P, z, $, j, M, r);
          if (w == null)
            return null;
          w.data && n(w.data, "expectedType") && _.push(w.data.expectedType);
        }
        var ge = _.length > 0 ? ", expected one of type [" + _.join(", ") + "]" : "";
        return new p("Invalid " + j + " `" + M + "` supplied to " + ("`" + $ + "`" + ge + "."));
      }
      return m(I);
    }
    function oe() {
      function h(v, C, I, P, z) {
        return W(v[C]) ? null : new p("Invalid " + P + " `" + z + "` supplied to " + ("`" + I + "`, expected a ReactNode."));
      }
      return m(h);
    }
    function ne(h, v, C, I, P) {
      return new p(
        (h || "React class") + ": " + v + " type `" + C + "." + I + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function E(h) {
      function v(C, I, P, z, $) {
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type `" + M + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var _ in h) {
          var R = h[_];
          if (typeof R != "function")
            return ne(P, z, $, _, B(R));
          var Q = R(j, _, P, z, $ + "." + _, r);
          if (Q)
            return Q;
        }
        return null;
      }
      return m(v);
    }
    function fe(h) {
      function v(C, I, P, z, $) {
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type `" + M + "` " + ("supplied to `" + P + "`, expected `object`."));
        var _ = t({}, C[I], h);
        for (var R in _) {
          var Q = h[R];
          if (n(h, R) && typeof Q != "function")
            return ne(P, z, $, R, B(Q));
          if (!Q)
            return new p(
              "Invalid " + z + " `" + $ + "` key `" + R + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(C[I], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(h), null, "  ")
            );
          var w = Q(j, R, P, z, $ + "." + R, r);
          if (w)
            return w;
        }
        return null;
      }
      return m(v);
    }
    function W(h) {
      switch (typeof h) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !h;
        case "object":
          if (Array.isArray(h))
            return h.every(W);
          if (h === null || s(h))
            return !0;
          var v = f(h);
          if (v) {
            var C = v.call(h), I;
            if (v !== h.entries) {
              for (; !(I = C.next()).done; )
                if (!W(I.value))
                  return !1;
            } else
              for (; !(I = C.next()).done; ) {
                var P = I.value;
                if (P && !W(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function N(h, v) {
      return h === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function T(h) {
      var v = typeof h;
      return Array.isArray(h) ? "array" : h instanceof RegExp ? "object" : N(v, h) ? "symbol" : v;
    }
    function B(h) {
      if (typeof h > "u" || h === null)
        return "" + h;
      var v = T(h);
      if (v === "object") {
        if (h instanceof Date)
          return "date";
        if (h instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function q(h) {
      var v = B(h);
      switch (v) {
        case "array":
        case "object":
          return "an " + v;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + v;
        default:
          return v;
      }
    }
    function re(h) {
      return !h.constructor || !h.constructor.name ? d : h.constructor.name;
    }
    return b.checkPropTypes = o, b.resetWarningCache = o.resetWarningCache, b.PropTypes = b, b;
  }, oi;
}
var ai, Ju;
function p2() {
  if (Ju) return ai;
  Ju = 1;
  var e = /* @__PURE__ */ xl();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, ai = function() {
    function n(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
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
  }, ai;
}
var Qu;
function m2() {
  if (Qu) return vo.exports;
  if (Qu = 1, process.env.NODE_ENV !== "production") {
    var e = jm(), t = !0;
    vo.exports = /* @__PURE__ */ d2()(e.isElement, t);
  } else
    vo.exports = /* @__PURE__ */ p2()();
  return vo.exports;
}
var h2 = /* @__PURE__ */ m2();
const pe = /* @__PURE__ */ s2(h2);
function Zu(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function ct(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Zu(Object(r), !0).forEach(function(n) {
      $r(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Zu(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Wo(e) {
  "@babel/helpers - typeof";
  return Wo = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Wo(e);
}
function $r(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function g2(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), o, a;
  for (a = 0; a < n.length; a++)
    o = n[a], !(t.indexOf(o) >= 0) && (r[o] = e[o]);
  return r;
}
function b2(e, t) {
  if (e == null) return {};
  var r = g2(e, t), n, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      n = a[o], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function ps(e) {
  return y2(e) || v2(e) || x2(e) || w2();
}
function y2(e) {
  if (Array.isArray(e)) return ms(e);
}
function v2(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function x2(e, t) {
  if (e) {
    if (typeof e == "string") return ms(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return ms(e, t);
  }
}
function ms(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function w2() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function k2(e) {
  var t, r = e.beat, n = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, b = e.inverse, x = e.border, p = e.listItem, m = e.flip, y = e.size, k = e.rotation, O = e.pull, S = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": b,
    "fa-border": x,
    "fa-li": p,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, $r(t, "fa-".concat(y), typeof y < "u" && y !== null), $r(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), $r(t, "fa-pull-".concat(O), typeof O < "u" && O !== null), $r(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(S).map(function(g) {
    return S[g] ? g : null;
  }).filter(function(g) {
    return g;
  });
}
function O2(e) {
  return e = e - 0, e === e;
}
function zm(e) {
  return O2(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var S2 = ["style"];
function A2(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function P2(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), o = zm(r.slice(0, n)), a = r.slice(n + 1).trim();
    return o.startsWith("webkit") ? t[A2(o)] = a : t[o] = a, t;
  }, {});
}
function _m(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return _m(e, c);
  }), o = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = P2(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[zm(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), a = r.style, i = a === void 0 ? {} : a, s = b2(r, S2);
  return o.attrs.style = ct(ct({}, o.attrs.style), i), e.apply(void 0, [t.tag, ct(ct({}, o.attrs), s)].concat(ps(n)));
}
var Mm = !1;
try {
  Mm = process.env.NODE_ENV === "production";
} catch {
}
function E2() {
  if (!Mm && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function ef(e) {
  if (e && Wo(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (ds.icon)
    return ds.icon(e);
  if (e === null)
    return null;
  if (e && Wo(e) === "object" && e.prefix && e.iconName)
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
function ii(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? $r({}, e, t) : {};
}
var tf = {
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
}, Ln = /* @__PURE__ */ sr.forwardRef(function(e, t) {
  var r = ct(ct({}, tf), e), n = r.icon, o = r.mask, a = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, u = ef(n), f = ii("classes", [].concat(ps(k2(r)), ps((i || "").split(" ")))), d = ii("transform", typeof r.transform == "string" ? ds.transform(r.transform) : r.transform), b = ii("mask", ef(o)), x = i2(u, ct(ct(ct(ct({}, f), d), b), {}, {
    symbol: a,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!x)
    return E2("Could not find icon", u), null;
  var p = x.abstract, m = {
    ref: t
  };
  return Object.keys(r).forEach(function(y) {
    tf.hasOwnProperty(y) || (m[y] = r[y]);
  }), N2(p[0], m);
});
Ln.displayName = "FontAwesomeIcon";
Ln.propTypes = {
  beat: pe.bool,
  border: pe.bool,
  beatFade: pe.bool,
  bounce: pe.bool,
  className: pe.string,
  fade: pe.bool,
  flash: pe.bool,
  mask: pe.oneOfType([pe.object, pe.array, pe.string]),
  maskId: pe.string,
  fixedWidth: pe.bool,
  inverse: pe.bool,
  flip: pe.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: pe.oneOfType([pe.object, pe.array, pe.string]),
  listItem: pe.bool,
  pull: pe.oneOf(["right", "left"]),
  pulse: pe.bool,
  rotation: pe.oneOf([0, 90, 180, 270]),
  shake: pe.bool,
  size: pe.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: pe.bool,
  spinPulse: pe.bool,
  spinReverse: pe.bool,
  symbol: pe.oneOfType([pe.bool, pe.string]),
  title: pe.string,
  titleId: pe.string,
  transform: pe.oneOfType([pe.string, pe.object]),
  swapOpacity: pe.bool
};
var N2 = _m.bind(null, sr.createElement);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const C2 = {
  prefix: "fas",
  iconName: "xmark",
  icon: [384, 512, [128473, 10005, 10006, 10060, 215, "close", "multiply", "remove", "times"], "f00d", "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function $2(e, t, r) {
  return (t = I2(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function rf(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function F(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? rf(Object(r), !0).forEach(function(n) {
      $2(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : rf(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function j2(e, t) {
  if (typeof e != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(e, t);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function I2(e) {
  var t = j2(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const nf = () => {
};
let wl = {}, Rm = {}, Tm = null, Dm = {
  mark: nf,
  measure: nf
};
try {
  typeof window < "u" && (wl = window), typeof document < "u" && (Rm = document), typeof MutationObserver < "u" && (Tm = MutationObserver), typeof performance < "u" && (Dm = performance);
} catch {
}
const {
  userAgent: of = ""
} = wl.navigator || {}, or = wl, je = Rm, af = Tm, xo = Dm;
or.document;
const zt = !!je.documentElement && !!je.head && typeof je.addEventListener == "function" && typeof je.createElement == "function", Lm = ~of.indexOf("MSIE") || ~of.indexOf("Trident/");
var z2 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, _2 = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Fm = {
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
}, M2 = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Vm = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Le = "classic", ua = "duotone", R2 = "sharp", T2 = "sharp-duotone", Wm = [Le, ua, R2, T2], D2 = {
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
}, L2 = {
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
}, F2 = /* @__PURE__ */ new Map([["classic", {
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
}]]), V2 = {
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
}, W2 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], sf = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, U2 = ["kit"], G2 = {
  kit: {
    "fa-kit": "fak"
  }
}, Y2 = ["fak", "fakd"], q2 = {
  kit: {
    fak: "fa-kit"
  }
}, lf = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, wo = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, B2 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], H2 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], K2 = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, X2 = {
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
}, J2 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, hs = {
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
}, Q2 = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], gs = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...B2, ...Q2], Z2 = ["solid", "regular", "light", "thin", "duotone", "brands"], Um = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ek = Um.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), tk = [...Object.keys(J2), ...Z2, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", wo.GROUP, wo.SWAP_OPACITY, wo.PRIMARY, wo.SECONDARY].concat(Um.map((e) => "".concat(e, "x"))).concat(ek.map((e) => "w-".concat(e))), rk = {
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
const Ct = "___FONT_AWESOME___", bs = 16, Gm = "fa", Ym = "svg-inline--fa", br = "data-fa-i2svg", ys = "data-fa-pseudo-element", nk = "data-fa-pseudo-element-pending", kl = "data-prefix", Ol = "data-icon", cf = "fontawesome-i2svg", ok = "async", ak = ["HTML", "HEAD", "STYLE", "SCRIPT"], qm = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function ro(e) {
  return new Proxy(e, {
    get(t, r) {
      return r in t ? t[r] : t[Le];
    }
  });
}
const Bm = F({}, Fm);
Bm[Le] = F(F(F(F({}, {
  "fa-duotone": "duotone"
}), Fm[Le]), sf.kit), sf["kit-duotone"]);
const ik = ro(Bm), vs = F({}, V2);
vs[Le] = F(F(F(F({}, {
  duotone: "fad"
}), vs[Le]), lf.kit), lf["kit-duotone"]);
const uf = ro(vs), xs = F({}, hs);
xs[Le] = F(F({}, xs[Le]), q2.kit);
const Sl = ro(xs), ws = F({}, X2);
ws[Le] = F(F({}, ws[Le]), G2.kit);
ro(ws);
const sk = z2, Hm = "fa-layers-text", lk = _2, ck = F({}, D2);
ro(ck);
const uk = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], si = M2, fk = [...U2, ...tk], En = or.FontAwesomeConfig || {};
function dk(e) {
  var t = je.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function pk(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
je && typeof je.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((e) => {
  let [t, r] = e;
  const n = pk(dk(t));
  n != null && (En[r] = n);
});
const Km = {
  styleDefault: "solid",
  familyDefault: Le,
  cssPrefix: Gm,
  replacementClass: Ym,
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
const Br = F(F({}, Km), En);
Br.autoReplaceSvg || (Br.observeMutations = !1);
const X = {};
Object.keys(Km).forEach((e) => {
  Object.defineProperty(X, e, {
    enumerable: !0,
    set: function(t) {
      Br[e] = t, Nn.forEach((r) => r(X));
    },
    get: function() {
      return Br[e];
    }
  });
});
Object.defineProperty(X, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Br.cssPrefix = e, Nn.forEach((t) => t(X));
  },
  get: function() {
    return Br.cssPrefix;
  }
});
or.FontAwesomeConfig = X;
const Nn = [];
function mk(e) {
  return Nn.push(e), () => {
    Nn.splice(Nn.indexOf(e), 1);
  };
}
const Ft = bs, gt = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function hk(e) {
  if (!e || !zt)
    return;
  const t = je.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const r = je.head.childNodes;
  let n = null;
  for (let o = r.length - 1; o > -1; o--) {
    const a = r[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (n = a);
  }
  return je.head.insertBefore(t, n), e;
}
const gk = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Fn() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += gk[Math.random() * 62 | 0];
  return t;
}
function Zr(e) {
  const t = [];
  for (let r = (e || []).length >>> 0; r--; )
    t[r] = e[r];
  return t;
}
function Al(e) {
  return e.classList ? Zr(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Xm(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function bk(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, '="').concat(Xm(e[r]), '" '), "").trim();
}
function fa(e) {
  return Object.keys(e || {}).reduce((t, r) => t + "".concat(r, ": ").concat(e[r].trim(), ";"), "");
}
function Pl(e) {
  return e.size !== gt.size || e.x !== gt.x || e.y !== gt.y || e.rotate !== gt.rotate || e.flipX || e.flipY;
}
function yk(e) {
  let {
    transform: t,
    containerWidth: r,
    iconWidth: n
  } = e;
  const o = {
    transform: "translate(".concat(r / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), c = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(n / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: c,
    path: l
  };
}
function vk(e) {
  let {
    transform: t,
    width: r = bs,
    height: n = bs,
    startCentered: o = !1
  } = e, a = "";
  return o && Lm ? a += "translate(".concat(t.x / Ft - r / 2, "em, ").concat(t.y / Ft - n / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / Ft, "em), calc(-50% + ").concat(t.y / Ft, "em)) ") : a += "translate(".concat(t.x / Ft, "em, ").concat(t.y / Ft, "em) "), a += "scale(".concat(t.size / Ft * (t.flipX ? -1 : 1), ", ").concat(t.size / Ft * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var xk = `:root, :host {
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
function Jm() {
  const e = Gm, t = Ym, r = X.cssPrefix, n = X.replacementClass;
  let o = xk;
  if (r !== e || n !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(r, "-")).replace(i, "--".concat(r, "-")).replace(s, ".".concat(n));
  }
  return o;
}
let ff = !1;
function li() {
  X.autoAddCss && !ff && (hk(Jm()), ff = !0);
}
var wk = {
  mixout() {
    return {
      dom: {
        css: Jm,
        insertCss: li
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        li();
      },
      beforeI2svg() {
        li();
      }
    };
  }
};
const $t = or || {};
$t[Ct] || ($t[Ct] = {});
$t[Ct].styles || ($t[Ct].styles = {});
$t[Ct].hooks || ($t[Ct].hooks = {});
$t[Ct].shims || ($t[Ct].shims = []);
var bt = $t[Ct];
const Qm = [], Zm = function() {
  je.removeEventListener("DOMContentLoaded", Zm), Uo = 1, Qm.map((e) => e());
};
let Uo = !1;
zt && (Uo = (je.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(je.readyState), Uo || je.addEventListener("DOMContentLoaded", Zm));
function kk(e) {
  zt && (Uo ? setTimeout(e, 0) : Qm.push(e));
}
function no(e) {
  const {
    tag: t,
    attributes: r = {},
    children: n = []
  } = e;
  return typeof e == "string" ? Xm(e) : "<".concat(t, " ").concat(bk(r), ">").concat(n.map(no).join(""), "</").concat(t, ">");
}
function df(e, t, r) {
  if (e && e[t] && e[t][r])
    return {
      prefix: t,
      iconName: r,
      icon: e[t][r]
    };
}
var ci = function(e, t, r, n) {
  var o = Object.keys(e), a = o.length, i = t, s, c, l;
  for (r === void 0 ? (s = 1, l = e[o[0]]) : (s = 0, l = r); s < a; s++)
    c = o[s], l = i(l, e[c], c, e);
  return l;
};
function Ok(e) {
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
function eh(e) {
  const t = Ok(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Sk(e, t) {
  const r = e.length;
  let n = e.charCodeAt(t), o;
  return n >= 55296 && n <= 56319 && r > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (n - 55296) * 1024 + o - 56320 + 65536 : n;
}
function pf(e) {
  return Object.keys(e).reduce((t, r) => {
    const n = e[r];
    return n.icon ? t[n.iconName] = n.icon : t[r] = n, t;
  }, {});
}
function ks(e, t) {
  let r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: n = !1
  } = r, o = pf(t);
  typeof bt.hooks.addPack == "function" && !n ? bt.hooks.addPack(e, pf(t)) : bt.styles[e] = F(F({}, bt.styles[e] || {}), o), e === "fas" && ks("fa", t);
}
const {
  styles: Vn,
  shims: Ak
} = bt, th = Object.keys(Sl), Pk = th.reduce((e, t) => (e[t] = Object.keys(Sl[t]), e), {});
let El = null, rh = {}, nh = {}, oh = {}, ah = {}, ih = {};
function Ek(e) {
  return ~fk.indexOf(e);
}
function Nk(e, t) {
  const r = t.split("-"), n = r[0], o = r.slice(1).join("-");
  return n === e && o !== "" && !Ek(o) ? o : null;
}
const sh = () => {
  const e = (n) => ci(Vn, (o, a, i) => (o[i] = ci(a, n, {}), o), {});
  rh = e((n, o, a) => (o[3] && (n[o[3]] = a), o[2] && o[2].filter((i) => typeof i == "number").forEach((i) => {
    n[i.toString(16)] = a;
  }), n)), nh = e((n, o, a) => (n[a] = a, o[2] && o[2].filter((i) => typeof i == "string").forEach((i) => {
    n[i] = a;
  }), n)), ih = e((n, o, a) => {
    const i = o[2];
    return n[a] = a, i.forEach((s) => {
      n[s] = a;
    }), n;
  });
  const t = "far" in Vn || X.autoFetchSvg, r = ci(Ak, (n, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (n.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (n.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), n;
  }, {
    names: {},
    unicodes: {}
  });
  oh = r.names, ah = r.unicodes, El = da(X.styleDefault, {
    family: X.familyDefault
  });
};
mk((e) => {
  El = da(e.styleDefault, {
    family: X.familyDefault
  });
});
sh();
function Nl(e, t) {
  return (rh[e] || {})[t];
}
function Ck(e, t) {
  return (nh[e] || {})[t];
}
function fr(e, t) {
  return (ih[e] || {})[t];
}
function lh(e) {
  return oh[e] || {
    prefix: null,
    iconName: null
  };
}
function $k(e) {
  const t = ah[e], r = Nl("fas", e);
  return t || (r ? {
    prefix: "fas",
    iconName: r
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function ar() {
  return El;
}
const ch = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function jk(e) {
  let t = Le;
  const r = th.reduce((n, o) => (n[o] = "".concat(X.cssPrefix, "-").concat(o), n), {});
  return Wm.forEach((n) => {
    (e.includes(r[n]) || e.some((o) => Pk[n].includes(o))) && (t = n);
  }), t;
}
function da(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: r = Le
  } = t, n = ik[r][e];
  if (r === ua && !e)
    return "fad";
  const o = uf[r][e] || uf[r][n], a = e in bt.styles ? e : null;
  return o || a || null;
}
function Ik(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    const o = Nk(X.cssPrefix, n);
    o ? r = o : n && t.push(n);
  }), {
    iconName: r,
    rest: t
  };
}
function mf(e) {
  return e.sort().filter((t, r, n) => n.indexOf(t) === r);
}
function pa(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: r = !1
  } = t;
  let n = null;
  const o = gs.concat(H2), a = mf(e.filter((f) => o.includes(f))), i = mf(e.filter((f) => !gs.includes(f))), s = a.filter((f) => (n = f, !Vm.includes(f))), [c = null] = s, l = jk(a), u = F(F({}, Ik(i)), {}, {
    prefix: da(c, {
      family: l
    })
  });
  return F(F(F({}, u), Rk({
    values: e,
    family: l,
    styles: Vn,
    config: X,
    canonical: u,
    givenPrefix: n
  })), zk(r, n, u));
}
function zk(e, t, r) {
  let {
    prefix: n,
    iconName: o
  } = r;
  if (e || !n || !o)
    return {
      prefix: n,
      iconName: o
    };
  const a = t === "fa" ? lh(o) : {}, i = fr(n, o);
  return o = a.iconName || i || o, n = a.prefix || n, n === "far" && !Vn.far && Vn.fas && !X.autoFetchSvg && (n = "fas"), {
    prefix: n,
    iconName: o
  };
}
const _k = Wm.filter((e) => e !== Le || e !== ua), Mk = Object.keys(hs).filter((e) => e !== Le).map((e) => Object.keys(hs[e])).flat();
function Rk(e) {
  const {
    values: t,
    family: r,
    canonical: n,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = r === ua, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", u = n.prefix === "fad" || n.prefix === "fa-duotone";
  if (!s && (c || l || u) && (n.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (n.prefix = "fab"), !n.prefix && _k.includes(r) && (Object.keys(a).find((f) => Mk.includes(f)) || i.autoFetchSvg)) {
    const f = F2.get(r).defaultShortPrefixId;
    n.prefix = f, n.iconName = fr(n.prefix, n.iconName) || n.iconName;
  }
  return (n.prefix === "fa" || o === "fa") && (n.prefix = ar() || "fas"), n;
}
class Tk {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, r = new Array(t), n = 0; n < t; n++)
      r[n] = arguments[n];
    const o = r.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = F(F({}, this.definitions[a] || {}), o[a]), ks(a, o[a]);
      const i = Sl[Le][a];
      i && ks(i, o[a]), sh();
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
        iconName: i,
        icon: s
      } = n[o], c = s[2];
      t[a] || (t[a] = {}), c.length > 0 && c.forEach((l) => {
        typeof l == "string" && (t[a][l] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let hf = [], jr = {};
const Fr = {}, Dk = Object.keys(Fr);
function Lk(e, t) {
  let {
    mixoutsTo: r
  } = t;
  return hf = e, jr = {}, Object.keys(Fr).forEach((n) => {
    Dk.indexOf(n) === -1 && delete Fr[n];
  }), hf.forEach((n) => {
    const o = n.mixout ? n.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (r[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        r[a] || (r[a] = {}), r[a][i] = o[a][i];
      });
    }), n.hooks) {
      const a = n.hooks();
      Object.keys(a).forEach((i) => {
        jr[i] || (jr[i] = []), jr[i].push(a[i]);
      });
    }
    n.provides && n.provides(Fr);
  }), r;
}
function Os(e, t) {
  for (var r = arguments.length, n = new Array(r > 2 ? r - 2 : 0), o = 2; o < r; o++)
    n[o - 2] = arguments[o];
  return (jr[e] || []).forEach((a) => {
    t = a.apply(null, [t, ...n]);
  }), t;
}
function yr(e) {
  for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++)
    r[n - 1] = arguments[n];
  (jr[e] || []).forEach((o) => {
    o.apply(null, r);
  });
}
function ir() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Fr[e] ? Fr[e].apply(null, t) : void 0;
}
function Ss(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const r = e.prefix || ar();
  if (t)
    return t = fr(r, t) || t, df(uh.definitions, r, t) || df(bt.styles, r, t);
}
const uh = new Tk(), Fk = () => {
  X.autoReplaceSvg = !1, X.observeMutations = !1, yr("noAuto");
}, Vk = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return zt ? (yr("beforeI2svg", e), ir("pseudoElements2svg", e), ir("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    X.autoReplaceSvg === !1 && (X.autoReplaceSvg = !0), X.observeMutations = !0, kk(() => {
      Uk({
        autoReplaceSvgRoot: t
      }), yr("watch", e);
    });
  }
}, Wk = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: fr(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], r = da(e[0]);
      return {
        prefix: r,
        iconName: fr(r, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(X.cssPrefix, "-")) > -1 || e.match(sk))) {
      const t = pa(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || ar(),
        iconName: fr(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = ar();
      return {
        prefix: t,
        iconName: fr(t, e) || e
      };
    }
  }
}, He = {
  noAuto: Fk,
  config: X,
  dom: Vk,
  parse: Wk,
  library: uh,
  findIconDefinition: Ss,
  toHtml: no
}, Uk = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = je
  } = e;
  (Object.keys(bt.styles).length > 0 || X.autoFetchSvg) && zt && X.autoReplaceSvg && He.dom.i2svg({
    node: t
  });
};
function ma(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((r) => no(r));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!zt) return;
      const r = je.createElement("div");
      return r.innerHTML = e.html, r.children;
    }
  }), e;
}
function Gk(e) {
  let {
    children: t,
    main: r,
    mask: n,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (Pl(i) && r.found && !n.found) {
    const {
      width: s,
      height: c
    } = r, l = {
      x: s / c / 2,
      y: 0.5
    };
    o.style = fa(F(F({}, a), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function Yk(e) {
  let {
    prefix: t,
    iconName: r,
    children: n,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(X.cssPrefix, "-").concat(r) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: F(F({}, o), {}, {
        id: i
      }),
      children: n
    }]
  }];
}
function Cl(e) {
  const {
    icons: {
      main: t,
      mask: r
    },
    prefix: n,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: c,
    titleId: l,
    extra: u,
    watchable: f = !1
  } = e, {
    width: d,
    height: b
  } = r.found ? r : t, x = Y2.includes(n), p = [X.replacementClass, o ? "".concat(X.cssPrefix, "-").concat(o) : ""].filter((g) => u.classes.indexOf(g) === -1).filter((g) => g !== "" || !!g).concat(u.classes).join(" ");
  let m = {
    children: [],
    attributes: F(F({}, u.attributes), {}, {
      "data-prefix": n,
      "data-icon": o,
      class: p,
      role: u.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(d, " ").concat(b)
    })
  };
  const y = x && !~u.classes.indexOf("fa-fw") ? {
    width: "".concat(d / b * 16 * 0.0625, "em")
  } : {};
  f && (m.attributes[br] = ""), s && (m.children.push({
    tag: "title",
    attributes: {
      id: m.attributes["aria-labelledby"] || "title-".concat(l || Fn())
    },
    children: [s]
  }), delete m.attributes.title);
  const k = F(F({}, m), {}, {
    prefix: n,
    iconName: o,
    main: t,
    mask: r,
    maskId: c,
    transform: a,
    symbol: i,
    styles: F(F({}, y), u.styles)
  }), {
    children: O,
    attributes: S
  } = r.found && t.found ? ir("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : ir("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = O, k.attributes = S, i ? Yk(k) : Gk(k);
}
function gf(e) {
  const {
    content: t,
    width: r,
    height: n,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, c = F(F(F({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[br] = "");
  const l = F({}, i.styles);
  Pl(o) && (l.transform = vk({
    transform: o,
    startCentered: !0,
    width: r,
    height: n
  }), l["-webkit-transform"] = l.transform);
  const u = fa(l);
  u.length > 0 && (c.style = u);
  const f = [];
  return f.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), a && f.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), f;
}
function qk(e) {
  const {
    content: t,
    title: r,
    extra: n
  } = e, o = F(F(F({}, n.attributes), r ? {
    title: r
  } : {}), {}, {
    class: n.classes.join(" ")
  }), a = fa(n.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
    children: [t]
  }), r && i.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [r]
  }), i;
}
const {
  styles: ui
} = bt;
function As(e) {
  const t = e[0], r = e[1], [n] = e.slice(4);
  let o = null;
  return Array.isArray(n) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(X.cssPrefix, "-").concat(si.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(X.cssPrefix, "-").concat(si.SECONDARY),
        fill: "currentColor",
        d: n[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(X.cssPrefix, "-").concat(si.PRIMARY),
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
const Bk = {
  found: !1,
  width: 512,
  height: 512
};
function Hk(e, t) {
  !qm && !X.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Ps(e, t) {
  let r = t;
  return t === "fa" && X.styleDefault !== null && (t = ar()), new Promise((n, o) => {
    if (r === "fa") {
      const a = lh(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && ui[t] && ui[t][e]) {
      const a = ui[t][e];
      return n(As(a));
    }
    Hk(e, t), n(F(F({}, Bk), {}, {
      icon: X.showMissingIcons && e ? ir("missingIconAbstract") || {} : {}
    }));
  });
}
const bf = () => {
}, Es = X.measurePerformance && xo && xo.mark && xo.measure ? xo : {
  mark: bf,
  measure: bf
}, vn = 'FA "6.7.2"', Kk = (e) => (Es.mark("".concat(vn, " ").concat(e, " begins")), () => fh(e)), fh = (e) => {
  Es.mark("".concat(vn, " ").concat(e, " ends")), Es.measure("".concat(vn, " ").concat(e), "".concat(vn, " ").concat(e, " begins"), "".concat(vn, " ").concat(e, " ends"));
};
var $l = {
  begin: Kk,
  end: fh
};
const jo = () => {
};
function yf(e) {
  return typeof (e.getAttribute ? e.getAttribute(br) : null) == "string";
}
function Xk(e) {
  const t = e.getAttribute ? e.getAttribute(kl) : null, r = e.getAttribute ? e.getAttribute(Ol) : null;
  return t && r;
}
function Jk(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(X.replacementClass);
}
function Qk() {
  return X.autoReplaceSvg === !0 ? Io.replace : Io[X.autoReplaceSvg] || Io.replace;
}
function Zk(e) {
  return je.createElementNS("http://www.w3.org/2000/svg", e);
}
function e5(e) {
  return je.createElement(e);
}
function dh(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: r = e.tag === "svg" ? Zk : e5
  } = t;
  if (typeof e == "string")
    return je.createTextNode(e);
  const n = r(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    n.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    n.appendChild(dh(o, {
      ceFn: r
    }));
  }), n;
}
function t5(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Io = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((r) => {
        t.parentNode.insertBefore(dh(r), t);
      }), t.getAttribute(br) === null && X.keepOriginalSource) {
        let r = je.createComment(t5(t));
        t.parentNode.replaceChild(r, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], r = e[1];
    if (~Al(t).indexOf(X.replacementClass))
      return Io.replace(e);
    const n = new RegExp("".concat(X.cssPrefix, "-.*"));
    if (delete r[0].attributes.id, r[0].attributes.class) {
      const a = r[0].attributes.class.split(" ").reduce((i, s) => (s === X.replacementClass || s.match(n) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      r[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = r.map((a) => no(a)).join(`
`);
    t.setAttribute(br, ""), t.innerHTML = o;
  }
};
function vf(e) {
  e();
}
function ph(e, t) {
  const r = typeof t == "function" ? t : jo;
  if (e.length === 0)
    r();
  else {
    let n = vf;
    X.mutateApproach === ok && (n = or.requestAnimationFrame || vf), n(() => {
      const o = Qk(), a = $l.begin("mutate");
      e.map(o), a(), r();
    });
  }
}
let jl = !1;
function mh() {
  jl = !0;
}
function Ns() {
  jl = !1;
}
let Go = null;
function xf(e) {
  if (!af || !X.observeMutations)
    return;
  const {
    treeCallback: t = jo,
    nodeCallback: r = jo,
    pseudoElementsCallback: n = jo,
    observeMutationsRoot: o = je
  } = e;
  Go = new af((a) => {
    if (jl) return;
    const i = ar();
    Zr(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !yf(s.addedNodes[0]) && (X.searchPseudoElements && n(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && X.searchPseudoElements && n(s.target.parentNode), s.type === "attributes" && yf(s.target) && ~uk.indexOf(s.attributeName))
        if (s.attributeName === "class" && Xk(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = pa(Al(s.target));
          s.target.setAttribute(kl, c || i), l && s.target.setAttribute(Ol, l);
        } else Jk(s.target) && r(s.target);
    });
  }), zt && Go.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function r5() {
  Go && Go.disconnect();
}
function n5(e) {
  const t = e.getAttribute("style");
  let r = [];
  return t && (r = t.split(";").reduce((n, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (n[i] = s.join(":").trim()), n;
  }, {})), r;
}
function o5(e) {
  const t = e.getAttribute("data-prefix"), r = e.getAttribute("data-icon"), n = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = pa(Al(e));
  return o.prefix || (o.prefix = ar()), t && r && (o.prefix = t, o.iconName = r), o.iconName && o.prefix || (o.prefix && n.length > 0 && (o.iconName = Ck(o.prefix, e.innerText) || Nl(o.prefix, eh(e.innerText))), !o.iconName && X.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function a5(e) {
  const t = Zr(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), r = e.getAttribute("title"), n = e.getAttribute("data-fa-title-id");
  return X.autoA11y && (r ? t["aria-labelledby"] = "".concat(X.replacementClass, "-title-").concat(n || Fn()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function i5() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: gt,
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
function wf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: r,
    prefix: n,
    rest: o
  } = o5(e), a = a5(e), i = Os("parseNodeAttributes", {}, e);
  let s = t.styleParser ? n5(e) : [];
  return F({
    iconName: r,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: n,
    transform: gt,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: o,
      styles: s,
      attributes: a
    }
  }, i);
}
const {
  styles: s5
} = bt;
function hh(e) {
  const t = X.autoReplaceSvg === "nest" ? wf(e, {
    styleParser: !1
  }) : wf(e);
  return ~t.extra.classes.indexOf(Hm) ? ir("generateLayersText", e, t) : ir("generateSvgReplacementMutation", e, t);
}
function l5() {
  return [...W2, ...gs];
}
function kf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!zt) return Promise.resolve();
  const r = je.documentElement.classList, n = (u) => r.add("".concat(cf, "-").concat(u)), o = (u) => r.remove("".concat(cf, "-").concat(u)), a = X.autoFetchSvg ? l5() : Vm.concat(Object.keys(s5));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(Hm, ":not([").concat(br, "])")].concat(a.map((u) => ".".concat(u, ":not([").concat(br, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = Zr(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    n("pending"), o("complete");
  else
    return Promise.resolve();
  const c = $l.begin("onTree"), l = s.reduce((u, f) => {
    try {
      const d = hh(f);
      d && u.push(d);
    } catch (d) {
      qm || d.name === "MissingIcon" && console.error(d);
    }
    return u;
  }, []);
  return new Promise((u, f) => {
    Promise.all(l).then((d) => {
      ph(d, () => {
        n("active"), n("complete"), o("pending"), typeof t == "function" && t(), c(), u();
      });
    }).catch((d) => {
      c(), f(d);
    });
  });
}
function c5(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  hh(e).then((r) => {
    r && ph([r], t);
  });
}
function u5(e) {
  return function(t) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = (t || {}).icon ? t : Ss(t || {});
    let {
      mask: o
    } = r;
    return o && (o = (o || {}).icon ? o : Ss(o || {})), e(n, F(F({}, r), {}, {
      mask: o
    }));
  };
}
const f5 = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: r = gt,
    symbol: n = !1,
    mask: o = null,
    maskId: a = null,
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
    icon: b
  } = e;
  return ma(F({
    type: "icon"
  }, e), () => (yr("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), X.autoA11y && (i ? l["aria-labelledby"] = "".concat(X.replacementClass, "-title-").concat(s || Fn()) : (l["aria-hidden"] = "true", l.focusable = "false")), Cl({
    icons: {
      main: As(b),
      mask: o ? As(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: f,
    iconName: d,
    transform: F(F({}, gt), r),
    symbol: n,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: l,
      styles: u,
      classes: c
    }
  })));
};
var d5 = {
  mixout() {
    return {
      icon: u5(f5)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = kf, e.nodeCallback = c5, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: r = je,
        callback: n = () => {
        }
      } = t;
      return kf(r, n);
    }, e.generateSvgReplacementMutation = function(t, r) {
      const {
        iconName: n,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: u,
        extra: f
      } = r;
      return new Promise((d, b) => {
        Promise.all([Ps(n, i), l.iconName ? Ps(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((x) => {
          let [p, m] = x;
          d([t, Cl({
            icons: {
              main: p,
              mask: m
            },
            prefix: i,
            iconName: n,
            transform: s,
            symbol: c,
            maskId: u,
            title: o,
            titleId: a,
            extra: f,
            watchable: !0
          })]);
        }).catch(b);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: r,
        attributes: n,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = fa(i);
      s.length > 0 && (n.style = s);
      let c;
      return Pl(a) && (c = ir("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), r.push(c || o.icon), {
        children: r,
        attributes: n
      };
    };
  }
}, p5 = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: r = []
        } = t;
        return ma({
          type: "layer"
        }, () => {
          yr("beforeDOMElementCreation", {
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
              class: ["".concat(X.cssPrefix, "-layers"), ...r].join(" ")
            },
            children: n
          }];
        });
      }
    };
  }
}, m5 = {
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
        return ma({
          type: "counter",
          content: e
        }, () => (yr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), qk({
          content: e.toString(),
          title: r,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(X.cssPrefix, "-layers-counter"), ...n]
          }
        })));
      }
    };
  }
}, h5 = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: r = gt,
          title: n = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return ma({
          type: "text",
          content: e
        }, () => (yr("beforeDOMElementCreation", {
          content: e,
          params: t
        }), gf({
          content: e,
          transform: F(F({}, gt), r),
          title: n,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(X.cssPrefix, "-layers-text"), ...o]
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
      let i = null, s = null;
      if (Lm) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return X.autoA11y && !n && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, gf({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: n,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const g5 = new RegExp('"', "ug"), Of = [1105920, 1112319], Sf = F(F(F(F({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), L2), rk), K2), Cs = Object.keys(Sf).reduce((e, t) => (e[t.toLowerCase()] = Sf[t], e), {}), b5 = Object.keys(Cs).reduce((e, t) => {
  const r = Cs[t];
  return e[t] = r[900] || [...Object.entries(r)][0][1], e;
}, {});
function y5(e) {
  const t = e.replace(g5, ""), r = Sk(t, 0), n = r >= Of[0] && r <= Of[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: eh(o ? t[0] : t),
    isSecondary: n || o
  };
}
function v5(e, t) {
  const r = e.replace(/^['"]|['"]$/g, "").toLowerCase(), n = parseInt(t), o = isNaN(n) ? "normal" : n;
  return (Cs[r] || {})[o] || b5[r];
}
function Af(e, t) {
  const r = "".concat(nk).concat(t.replace(":", "-"));
  return new Promise((n, o) => {
    if (e.getAttribute(r) !== null)
      return n();
    const a = Zr(e.children).filter((f) => f.getAttribute(ys) === t)[0], i = or.getComputedStyle(e, t), s = i.getPropertyValue("font-family"), c = s.match(lk), l = i.getPropertyValue("font-weight"), u = i.getPropertyValue("content");
    if (a && !c)
      return e.removeChild(a), n();
    if (c && u !== "none" && u !== "") {
      const f = i.getPropertyValue("content");
      let d = v5(s, l);
      const {
        value: b,
        isSecondary: x
      } = y5(f), p = c[0].startsWith("FontAwesome");
      let m = Nl(d, b), y = m;
      if (p) {
        const k = $k(b);
        k.iconName && k.prefix && (m = k.iconName, d = k.prefix);
      }
      if (m && !x && (!a || a.getAttribute(kl) !== d || a.getAttribute(Ol) !== y)) {
        e.setAttribute(r, y), a && e.removeChild(a);
        const k = i5(), {
          extra: O
        } = k;
        O.attributes[ys] = t, Ps(m, d).then((S) => {
          const g = Cl(F(F({}, k), {}, {
            icons: {
              main: S,
              mask: ch()
            },
            prefix: d,
            iconName: y,
            extra: O,
            watchable: !0
          })), Y = je.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(Y, e.firstChild) : e.appendChild(Y), Y.outerHTML = g.map((U) => no(U)).join(`
`), e.removeAttribute(r), n();
        }).catch(o);
      } else
        n();
    } else
      n();
  });
}
function x5(e) {
  return Promise.all([Af(e, "::before"), Af(e, "::after")]);
}
function w5(e) {
  return e.parentNode !== document.head && !~ak.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(ys) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Pf(e) {
  if (zt)
    return new Promise((t, r) => {
      const n = Zr(e.querySelectorAll("*")).filter(w5).map(x5), o = $l.begin("searchPseudoElements");
      mh(), Promise.all(n).then(() => {
        o(), Ns(), t();
      }).catch(() => {
        o(), Ns(), r();
      });
    });
}
var k5 = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Pf, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: r = je
      } = t;
      X.searchPseudoElements && Pf(r);
    };
  }
};
let Ef = !1;
var O5 = {
  mixout() {
    return {
      dom: {
        unwatch() {
          mh(), Ef = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        xf(Os("mutationObserverCallbacks", {}));
      },
      noAuto() {
        r5();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Ef ? Ns() : xf(Os("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Nf = (e) => {
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
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return r.flipX = !0, r;
    if (a && i === "v")
      return r.flipY = !0, r;
    if (i = parseFloat(i), isNaN(i))
      return r;
    switch (a) {
      case "grow":
        r.size = r.size + i;
        break;
      case "shrink":
        r.size = r.size - i;
        break;
      case "left":
        r.x = r.x - i;
        break;
      case "right":
        r.x = r.x + i;
        break;
      case "up":
        r.y = r.y - i;
        break;
      case "down":
        r.y = r.y + i;
        break;
      case "rotate":
        r.rotate = r.rotate + i;
        break;
    }
    return r;
  }, t);
};
var S5 = {
  mixout() {
    return {
      parse: {
        transform: (e) => Nf(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-transform");
        return r && (e.transform = Nf(r)), e;
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
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(n.x * 32, ", ").concat(n.y * 32, ") "), c = "scale(".concat(n.size / 16 * (n.flipX ? -1 : 1), ", ").concat(n.size / 16 * (n.flipY ? -1 : 1), ") "), l = "rotate(".concat(n.rotate, " 0 0)"), u = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, f = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, d = {
        outer: i,
        inner: u,
        path: f
      };
      return {
        tag: "g",
        attributes: F({}, d.outer),
        children: [{
          tag: "g",
          attributes: F({}, d.inner),
          children: [{
            tag: r.icon.tag,
            children: r.icon.children,
            attributes: F(F({}, r.icon.attributes), d.path)
          }]
        }]
      };
    };
  }
};
const fi = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Cf(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function A5(e) {
  return e.tag === "g" ? e.children : [e];
}
var P5 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-mask"), n = r ? pa(r.split(" ").map((o) => o.trim())) : ch();
        return n.prefix || (n.prefix = ar()), e.mask = n, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        maskId: i,
        transform: s
      } = t;
      const {
        width: c,
        icon: l
      } = o, {
        width: u,
        icon: f
      } = a, d = yk({
        transform: s,
        containerWidth: u,
        iconWidth: c
      }), b = {
        tag: "rect",
        attributes: F(F({}, fi), {}, {
          fill: "white"
        })
      }, x = l.children ? {
        children: l.children.map(Cf)
      } : {}, p = {
        tag: "g",
        attributes: F({}, d.inner),
        children: [Cf(F({
          tag: l.tag,
          attributes: F(F({}, l.attributes), d.path)
        }, x))]
      }, m = {
        tag: "g",
        attributes: F({}, d.outer),
        children: [p]
      }, y = "mask-".concat(i || Fn()), k = "clip-".concat(i || Fn()), O = {
        tag: "mask",
        attributes: F(F({}, fi), {}, {
          id: y,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [b, m]
      }, S = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: k
          },
          children: A5(f)
        }, O]
      };
      return r.push(S, {
        tag: "rect",
        attributes: F({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(y, ")")
        }, fi)
      }), {
        children: r,
        attributes: n
      };
    };
  }
}, E5 = {
  provides(e) {
    let t = !1;
    or.matchMedia && (t = or.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const r = [], n = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      r.push({
        tag: "path",
        attributes: F(F({}, n), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = F(F({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: F(F({}, n), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: F(F({}, o), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: F(F({}, a), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), r.push(i), r.push({
        tag: "path",
        attributes: F(F({}, n), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: F(F({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || r.push({
        tag: "path",
        attributes: F(F({}, n), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: F(F({}, a), {}, {
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
}, N5 = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const r = t.getAttribute("data-fa-symbol"), n = r === null ? !1 : r === "" ? !0 : r;
        return e.symbol = n, e;
      }
    };
  }
}, C5 = [wk, d5, p5, m5, h5, k5, O5, S5, P5, E5, N5];
Lk(C5, {
  mixoutsTo: He
});
He.noAuto;
He.config;
He.library;
He.dom;
const $s = He.parse;
He.findIconDefinition;
He.toHtml;
const $5 = He.icon;
He.layer;
He.text;
He.counter;
function j5(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ko = { exports: {} }, di = { exports: {} }, ve = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var $f;
function I5() {
  if ($f) return ve;
  $f = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function O(g) {
    if (typeof g == "object" && g !== null) {
      var Y = g.$$typeof;
      switch (Y) {
        case t:
          switch (g = g.type, g) {
            case c:
            case l:
            case n:
            case a:
            case o:
            case f:
              return g;
            default:
              switch (g = g && g.$$typeof, g) {
                case s:
                case u:
                case x:
                case b:
                case i:
                  return g;
                default:
                  return Y;
              }
          }
        case r:
          return Y;
      }
    }
  }
  function S(g) {
    return O(g) === l;
  }
  return ve.AsyncMode = c, ve.ConcurrentMode = l, ve.ContextConsumer = s, ve.ContextProvider = i, ve.Element = t, ve.ForwardRef = u, ve.Fragment = n, ve.Lazy = x, ve.Memo = b, ve.Portal = r, ve.Profiler = a, ve.StrictMode = o, ve.Suspense = f, ve.isAsyncMode = function(g) {
    return S(g) || O(g) === c;
  }, ve.isConcurrentMode = S, ve.isContextConsumer = function(g) {
    return O(g) === s;
  }, ve.isContextProvider = function(g) {
    return O(g) === i;
  }, ve.isElement = function(g) {
    return typeof g == "object" && g !== null && g.$$typeof === t;
  }, ve.isForwardRef = function(g) {
    return O(g) === u;
  }, ve.isFragment = function(g) {
    return O(g) === n;
  }, ve.isLazy = function(g) {
    return O(g) === x;
  }, ve.isMemo = function(g) {
    return O(g) === b;
  }, ve.isPortal = function(g) {
    return O(g) === r;
  }, ve.isProfiler = function(g) {
    return O(g) === a;
  }, ve.isStrictMode = function(g) {
    return O(g) === o;
  }, ve.isSuspense = function(g) {
    return O(g) === f;
  }, ve.isValidElementType = function(g) {
    return typeof g == "string" || typeof g == "function" || g === n || g === l || g === a || g === o || g === f || g === d || typeof g == "object" && g !== null && (g.$$typeof === x || g.$$typeof === b || g.$$typeof === i || g.$$typeof === s || g.$$typeof === u || g.$$typeof === m || g.$$typeof === y || g.$$typeof === k || g.$$typeof === p);
  }, ve.typeOf = O, ve;
}
var ke = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var jf;
function z5() {
  return jf || (jf = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, n = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, u = e ? Symbol.for("react.forward_ref") : 60112, f = e ? Symbol.for("react.suspense") : 60113, d = e ? Symbol.for("react.suspense_list") : 60120, b = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, p = e ? Symbol.for("react.block") : 60121, m = e ? Symbol.for("react.fundamental") : 60117, y = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function O(w) {
      return typeof w == "string" || typeof w == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      w === n || w === l || w === a || w === o || w === f || w === d || typeof w == "object" && w !== null && (w.$$typeof === x || w.$$typeof === b || w.$$typeof === i || w.$$typeof === s || w.$$typeof === u || w.$$typeof === m || w.$$typeof === y || w.$$typeof === k || w.$$typeof === p);
    }
    function S(w) {
      if (typeof w == "object" && w !== null) {
        var ge = w.$$typeof;
        switch (ge) {
          case t:
            var Ie = w.type;
            switch (Ie) {
              case c:
              case l:
              case n:
              case a:
              case o:
              case f:
                return Ie;
              default:
                var Ke = Ie && Ie.$$typeof;
                switch (Ke) {
                  case s:
                  case u:
                  case x:
                  case b:
                  case i:
                    return Ke;
                  default:
                    return ge;
                }
            }
          case r:
            return ge;
        }
      }
    }
    var g = c, Y = l, U = s, te = i, J = t, oe = u, ne = n, E = x, fe = b, W = r, N = a, T = o, B = f, q = !1;
    function re(w) {
      return q || (q = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), h(w) || S(w) === c;
    }
    function h(w) {
      return S(w) === l;
    }
    function v(w) {
      return S(w) === s;
    }
    function C(w) {
      return S(w) === i;
    }
    function I(w) {
      return typeof w == "object" && w !== null && w.$$typeof === t;
    }
    function P(w) {
      return S(w) === u;
    }
    function z(w) {
      return S(w) === n;
    }
    function $(w) {
      return S(w) === x;
    }
    function j(w) {
      return S(w) === b;
    }
    function M(w) {
      return S(w) === r;
    }
    function _(w) {
      return S(w) === a;
    }
    function R(w) {
      return S(w) === o;
    }
    function Q(w) {
      return S(w) === f;
    }
    ke.AsyncMode = g, ke.ConcurrentMode = Y, ke.ContextConsumer = U, ke.ContextProvider = te, ke.Element = J, ke.ForwardRef = oe, ke.Fragment = ne, ke.Lazy = E, ke.Memo = fe, ke.Portal = W, ke.Profiler = N, ke.StrictMode = T, ke.Suspense = B, ke.isAsyncMode = re, ke.isConcurrentMode = h, ke.isContextConsumer = v, ke.isContextProvider = C, ke.isElement = I, ke.isForwardRef = P, ke.isFragment = z, ke.isLazy = $, ke.isMemo = j, ke.isPortal = M, ke.isProfiler = _, ke.isStrictMode = R, ke.isSuspense = Q, ke.isValidElementType = O, ke.typeOf = S;
  }()), ke;
}
var If;
function gh() {
  return If || (If = 1, process.env.NODE_ENV === "production" ? di.exports = I5() : di.exports = z5()), di.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var pi, zf;
function _5() {
  if (zf) return pi;
  zf = 1;
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
  return pi = o() ? Object.assign : function(a, i) {
    for (var s, c = n(a), l, u = 1; u < arguments.length; u++) {
      s = Object(arguments[u]);
      for (var f in s)
        t.call(s, f) && (c[f] = s[f]);
      if (e) {
        l = e(s);
        for (var d = 0; d < l.length; d++)
          r.call(s, l[d]) && (c[l[d]] = s[l[d]]);
      }
    }
    return c;
  }, pi;
}
var mi, _f;
function Il() {
  if (_f) return mi;
  _f = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return mi = e, mi;
}
var Mf, Rf;
function bh() {
  return Rf || (Rf = 1, Mf = Function.call.bind(Object.prototype.hasOwnProperty)), Mf;
}
var hi, Tf;
function M5() {
  if (Tf) return hi;
  Tf = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Il(), r = {}, n = /* @__PURE__ */ bh();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, c, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var u in a)
        if (n(a, u)) {
          var f;
          try {
            if (typeof a[u] != "function") {
              var d = Error(
                (c || "React class") + ": " + s + " type `" + u + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[u] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw d.name = "Invariant Violation", d;
            }
            f = a[u](i, u, c, s, null, t);
          } catch (x) {
            f = x;
          }
          if (f && !(f instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + u + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof f + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), f instanceof Error && !(f.message in r)) {
            r[f.message] = !0;
            var b = l ? l() : "";
            e(
              "Failed " + s + " type: " + f.message + (b ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, hi = o, hi;
}
var gi, Df;
function R5() {
  if (Df) return gi;
  Df = 1;
  var e = gh(), t = _5(), r = /* @__PURE__ */ Il(), n = /* @__PURE__ */ bh(), o = /* @__PURE__ */ M5(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
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
  return gi = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, u = "@@iterator";
    function f(h) {
      var v = h && (l && h[l] || h[u]);
      if (typeof v == "function")
        return v;
    }
    var d = "<<anonymous>>", b = {
      array: y("array"),
      bigint: y("bigint"),
      bool: y("boolean"),
      func: y("function"),
      number: y("number"),
      object: y("object"),
      string: y("string"),
      symbol: y("symbol"),
      any: k(),
      arrayOf: O,
      element: S(),
      elementType: g(),
      instanceOf: Y,
      node: oe(),
      objectOf: te,
      oneOf: U,
      oneOfType: J,
      shape: E,
      exact: fe
    };
    function x(h, v) {
      return h === v ? h !== 0 || 1 / h === 1 / v : h !== h && v !== v;
    }
    function p(h, v) {
      this.message = h, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    p.prototype = Error.prototype;
    function m(h) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, C = 0;
      function I(z, $, j, M, _, R, Q) {
        if (M = M || d, R = R || j, Q !== r) {
          if (c) {
            var w = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw w.name = "Invariant Violation", w;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var ge = M + ":" + j;
            !v[ge] && // Avoid spamming the console because they are often not actionable except for lib authors
            C < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + R + "` prop on `" + M + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[ge] = !0, C++);
          }
        }
        return $[j] == null ? z ? $[j] === null ? new p("The " + _ + " `" + R + "` is marked as required " + ("in `" + M + "`, but its value is `null`.")) : new p("The " + _ + " `" + R + "` is marked as required in " + ("`" + M + "`, but its value is `undefined`.")) : null : h($, j, M, _, R);
      }
      var P = I.bind(null, !1);
      return P.isRequired = I.bind(null, !0), P;
    }
    function y(h) {
      function v(C, I, P, z, $, j) {
        var M = C[I], _ = T(M);
        if (_ !== h) {
          var R = B(M);
          return new p(
            "Invalid " + z + " `" + $ + "` of type " + ("`" + R + "` supplied to `" + P + "`, expected ") + ("`" + h + "`."),
            { expectedType: h }
          );
        }
        return null;
      }
      return m(v);
    }
    function k() {
      return m(i);
    }
    function O(h) {
      function v(C, I, P, z, $) {
        if (typeof h != "function")
          return new p("Property `" + $ + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var j = C[I];
        if (!Array.isArray(j)) {
          var M = T(j);
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected an array."));
        }
        for (var _ = 0; _ < j.length; _++) {
          var R = h(j, _, P, z, $ + "[" + _ + "]", r);
          if (R instanceof Error)
            return R;
        }
        return null;
      }
      return m(v);
    }
    function S() {
      function h(v, C, I, P, z) {
        var $ = v[C];
        if (!s($)) {
          var j = T($);
          return new p("Invalid " + P + " `" + z + "` of type " + ("`" + j + "` supplied to `" + I + "`, expected a single ReactElement."));
        }
        return null;
      }
      return m(h);
    }
    function g() {
      function h(v, C, I, P, z) {
        var $ = v[C];
        if (!e.isValidElementType($)) {
          var j = T($);
          return new p("Invalid " + P + " `" + z + "` of type " + ("`" + j + "` supplied to `" + I + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return m(h);
    }
    function Y(h) {
      function v(C, I, P, z, $) {
        if (!(C[I] instanceof h)) {
          var j = h.name || d, M = re(C[I]);
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected ") + ("instance of `" + j + "`."));
        }
        return null;
      }
      return m(v);
    }
    function U(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function v(C, I, P, z, $) {
        for (var j = C[I], M = 0; M < h.length; M++)
          if (x(j, h[M]))
            return null;
        var _ = JSON.stringify(h, function(R, Q) {
          var w = B(Q);
          return w === "symbol" ? String(Q) : Q;
        });
        return new p("Invalid " + z + " `" + $ + "` of value `" + String(j) + "` " + ("supplied to `" + P + "`, expected one of " + _ + "."));
      }
      return m(v);
    }
    function te(h) {
      function v(C, I, P, z, $) {
        if (typeof h != "function")
          return new p("Property `" + $ + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type " + ("`" + M + "` supplied to `" + P + "`, expected an object."));
        for (var _ in j)
          if (n(j, _)) {
            var R = h(j, _, P, z, $ + "." + _, r);
            if (R instanceof Error)
              return R;
          }
        return null;
      }
      return m(v);
    }
    function J(h) {
      if (!Array.isArray(h))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var v = 0; v < h.length; v++) {
        var C = h[v];
        if (typeof C != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + q(C) + " at index " + v + "."
          ), i;
      }
      function I(P, z, $, j, M) {
        for (var _ = [], R = 0; R < h.length; R++) {
          var Q = h[R], w = Q(P, z, $, j, M, r);
          if (w == null)
            return null;
          w.data && n(w.data, "expectedType") && _.push(w.data.expectedType);
        }
        var ge = _.length > 0 ? ", expected one of type [" + _.join(", ") + "]" : "";
        return new p("Invalid " + j + " `" + M + "` supplied to " + ("`" + $ + "`" + ge + "."));
      }
      return m(I);
    }
    function oe() {
      function h(v, C, I, P, z) {
        return W(v[C]) ? null : new p("Invalid " + P + " `" + z + "` supplied to " + ("`" + I + "`, expected a ReactNode."));
      }
      return m(h);
    }
    function ne(h, v, C, I, P) {
      return new p(
        (h || "React class") + ": " + v + " type `" + C + "." + I + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function E(h) {
      function v(C, I, P, z, $) {
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type `" + M + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var _ in h) {
          var R = h[_];
          if (typeof R != "function")
            return ne(P, z, $, _, B(R));
          var Q = R(j, _, P, z, $ + "." + _, r);
          if (Q)
            return Q;
        }
        return null;
      }
      return m(v);
    }
    function fe(h) {
      function v(C, I, P, z, $) {
        var j = C[I], M = T(j);
        if (M !== "object")
          return new p("Invalid " + z + " `" + $ + "` of type `" + M + "` " + ("supplied to `" + P + "`, expected `object`."));
        var _ = t({}, C[I], h);
        for (var R in _) {
          var Q = h[R];
          if (n(h, R) && typeof Q != "function")
            return ne(P, z, $, R, B(Q));
          if (!Q)
            return new p(
              "Invalid " + z + " `" + $ + "` key `" + R + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(C[I], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(h), null, "  ")
            );
          var w = Q(j, R, P, z, $ + "." + R, r);
          if (w)
            return w;
        }
        return null;
      }
      return m(v);
    }
    function W(h) {
      switch (typeof h) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !h;
        case "object":
          if (Array.isArray(h))
            return h.every(W);
          if (h === null || s(h))
            return !0;
          var v = f(h);
          if (v) {
            var C = v.call(h), I;
            if (v !== h.entries) {
              for (; !(I = C.next()).done; )
                if (!W(I.value))
                  return !1;
            } else
              for (; !(I = C.next()).done; ) {
                var P = I.value;
                if (P && !W(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function N(h, v) {
      return h === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function T(h) {
      var v = typeof h;
      return Array.isArray(h) ? "array" : h instanceof RegExp ? "object" : N(v, h) ? "symbol" : v;
    }
    function B(h) {
      if (typeof h > "u" || h === null)
        return "" + h;
      var v = T(h);
      if (v === "object") {
        if (h instanceof Date)
          return "date";
        if (h instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function q(h) {
      var v = B(h);
      switch (v) {
        case "array":
        case "object":
          return "an " + v;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + v;
        default:
          return v;
      }
    }
    function re(h) {
      return !h.constructor || !h.constructor.name ? d : h.constructor.name;
    }
    return b.checkPropTypes = o, b.resetWarningCache = o.resetWarningCache, b.PropTypes = b, b;
  }, gi;
}
var bi, Lf;
function T5() {
  if (Lf) return bi;
  Lf = 1;
  var e = /* @__PURE__ */ Il();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, bi = function() {
    function n(i, s, c, l, u, f) {
      if (f !== e) {
        var d = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw d.name = "Invariant Violation", d;
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
  }, bi;
}
var Ff;
function D5() {
  if (Ff) return ko.exports;
  if (Ff = 1, process.env.NODE_ENV !== "production") {
    var e = gh(), t = !0;
    ko.exports = /* @__PURE__ */ R5()(e.isElement, t);
  } else
    ko.exports = /* @__PURE__ */ T5()();
  return ko.exports;
}
var L5 = /* @__PURE__ */ D5();
const me = /* @__PURE__ */ j5(L5);
function Vf(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function ut(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Vf(Object(r), !0).forEach(function(n) {
      Ir(e, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : Vf(Object(r)).forEach(function(n) {
      Object.defineProperty(e, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return e;
}
function Yo(e) {
  "@babel/helpers - typeof";
  return Yo = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Yo(e);
}
function Ir(e, t, r) {
  return t in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function F5(e, t) {
  if (e == null) return {};
  var r = {}, n = Object.keys(e), o, a;
  for (a = 0; a < n.length; a++)
    o = n[a], !(t.indexOf(o) >= 0) && (r[o] = e[o]);
  return r;
}
function V5(e, t) {
  if (e == null) return {};
  var r = F5(e, t), n, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      n = a[o], !(t.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(e, n) && (r[n] = e[n]);
  }
  return r;
}
function js(e) {
  return W5(e) || U5(e) || G5(e) || Y5();
}
function W5(e) {
  if (Array.isArray(e)) return Is(e);
}
function U5(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function G5(e, t) {
  if (e) {
    if (typeof e == "string") return Is(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    if (r === "Object" && e.constructor && (r = e.constructor.name), r === "Map" || r === "Set") return Array.from(e);
    if (r === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Is(e, t);
  }
}
function Is(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function Y5() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function q5(e) {
  var t, r = e.beat, n = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, u = e.spinReverse, f = e.pulse, d = e.fixedWidth, b = e.inverse, x = e.border, p = e.listItem, m = e.flip, y = e.size, k = e.rotation, O = e.pull, S = (t = {
    "fa-beat": r,
    "fa-fade": n,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": u,
    "fa-spin-pulse": l,
    "fa-pulse": f,
    "fa-fw": d,
    "fa-inverse": b,
    "fa-border": x,
    "fa-li": p,
    "fa-flip": m === !0,
    "fa-flip-horizontal": m === "horizontal" || m === "both",
    "fa-flip-vertical": m === "vertical" || m === "both"
  }, Ir(t, "fa-".concat(y), typeof y < "u" && y !== null), Ir(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), Ir(t, "fa-pull-".concat(O), typeof O < "u" && O !== null), Ir(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(S).map(function(g) {
    return S[g] ? g : null;
  }).filter(function(g) {
    return g;
  });
}
function B5(e) {
  return e = e - 0, e === e;
}
function yh(e) {
  return B5(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, r) {
    return r ? r.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var H5 = ["style"];
function K5(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function X5(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, r) {
    var n = r.indexOf(":"), o = yh(r.slice(0, n)), a = r.slice(n + 1).trim();
    return o.startsWith("webkit") ? t[K5(o)] = a : t[o] = a, t;
  }, {});
}
function vh(e, t) {
  var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var n = (t.children || []).map(function(c) {
    return vh(e, c);
  }), o = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var u = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = u, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = X5(u);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = u : c.attrs[yh(l)] = u;
    }
    return c;
  }, {
    attrs: {}
  }), a = r.style, i = a === void 0 ? {} : a, s = V5(r, H5);
  return o.attrs.style = ut(ut({}, o.attrs.style), i), e.apply(void 0, [t.tag, ut(ut({}, o.attrs), s)].concat(js(n)));
}
var xh = !1;
try {
  xh = process.env.NODE_ENV === "production";
} catch {
}
function J5() {
  if (!xh && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Wf(e) {
  if (e && Yo(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if ($s.icon)
    return $s.icon(e);
  if (e === null)
    return null;
  if (e && Yo(e) === "object" && e.prefix && e.iconName)
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
function yi(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Ir({}, e, t) : {};
}
var Uf = {
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
}, zl = /* @__PURE__ */ sr.forwardRef(function(e, t) {
  var r = ut(ut({}, Uf), e), n = r.icon, o = r.mask, a = r.symbol, i = r.className, s = r.title, c = r.titleId, l = r.maskId, u = Wf(n), f = yi("classes", [].concat(js(q5(r)), js((i || "").split(" ")))), d = yi("transform", typeof r.transform == "string" ? $s.transform(r.transform) : r.transform), b = yi("mask", Wf(o)), x = $5(u, ut(ut(ut(ut({}, f), d), b), {}, {
    symbol: a,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!x)
    return J5("Could not find icon", u), null;
  var p = x.abstract, m = {
    ref: t
  };
  return Object.keys(r).forEach(function(y) {
    Uf.hasOwnProperty(y) || (m[y] = r[y]);
  }), Q5(p[0], m);
});
zl.displayName = "FontAwesomeIcon";
zl.propTypes = {
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
var Q5 = vh.bind(null, sr.createElement);
const _l = "-", Z5 = (e) => {
  const t = tO(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(_l);
      return a[0] === "" && a.length !== 1 && a.shift(), wh(a, t) || eO(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = r[o] || [];
      return a && n[o] ? [...i, ...n[o]] : i;
    }
  };
}, wh = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), a = o ? wh(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(_l);
  return (r = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : r.classGroupId;
}, Gf = /^\[(.+)\]$/, eO = (e) => {
  if (Gf.test(e)) {
    const t = Gf.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, tO = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return nO(Object.entries(e.classGroups), r).forEach(([o, a]) => {
    zs(a, n, o, t);
  }), n;
}, zs = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Yf(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (rO(o)) {
        zs(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      zs(i, Yf(t, a), r, n);
    });
  });
}, Yf = (e, t) => {
  let r = e;
  return t.split(_l).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, rO = (e) => e.isThemeGetter, nO = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, oO = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, kh = "!", aO = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let y = s[m];
      if (l === 0) {
        if (y === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (y === "/") {
          f = m;
          continue;
        }
      }
      y === "[" ? l++ : y === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(kh), x = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: x,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, iO = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, sO = (e) => ({
  cache: oO(e.cacheSize),
  parseClassName: aO(e),
  ...Z5(e)
}), lO = /\s+/, cO = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(lO);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let x = !!b, p = n(x ? d.substring(0, b) : d);
    if (!p) {
      if (!x) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const m = iO(u).join(":"), y = f ? m + kh : m, k = y + p;
    if (a.includes(k))
      continue;
    a.push(k);
    const O = o(p, x);
    for (let S = 0; S < O.length; ++S) {
      const g = O[S];
      a.push(y + g);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function uO() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Oh(t)) && (n && (n += " "), n += r);
  return n;
}
const Oh = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Oh(e[n])) && (r && (r += " "), r += t);
  return r;
};
function fO(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = sO(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = cO(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(uO.apply(null, arguments));
  };
}
const Ee = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, Sh = /^\[(?:([a-z-]+):)?(.+)\]$/i, dO = /^\d+\/\d+$/, pO = /* @__PURE__ */ new Set(["px", "full", "screen"]), mO = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, hO = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, gO = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, bO = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, yO = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, kt = (e) => Vr(e) || pO.has(e) || dO.test(e), Vt = (e) => en(e, "length", PO), Vr = (e) => !!e && !Number.isNaN(Number(e)), vi = (e) => en(e, "number", Vr), ln = (e) => !!e && Number.isInteger(Number(e)), vO = (e) => e.endsWith("%") && Vr(e.slice(0, -1)), le = (e) => Sh.test(e), Wt = (e) => mO.test(e), xO = /* @__PURE__ */ new Set(["length", "size", "percentage"]), wO = (e) => en(e, xO, Ah), kO = (e) => en(e, "position", Ah), OO = /* @__PURE__ */ new Set(["image", "url"]), SO = (e) => en(e, OO, NO), AO = (e) => en(e, "", EO), cn = () => !0, en = (e, t, r) => {
  const n = Sh.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, PO = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  hO.test(e) && !gO.test(e)
), Ah = () => !1, EO = (e) => bO.test(e), NO = (e) => yO.test(e), CO = () => {
  const e = Ee("colors"), t = Ee("spacing"), r = Ee("blur"), n = Ee("brightness"), o = Ee("borderColor"), a = Ee("borderRadius"), i = Ee("borderSpacing"), s = Ee("borderWidth"), c = Ee("contrast"), l = Ee("grayscale"), u = Ee("hueRotate"), f = Ee("invert"), d = Ee("gap"), b = Ee("gradientColorStops"), x = Ee("gradientColorStopPositions"), p = Ee("inset"), m = Ee("margin"), y = Ee("opacity"), k = Ee("padding"), O = Ee("saturate"), S = Ee("scale"), g = Ee("sepia"), Y = Ee("skew"), U = Ee("space"), te = Ee("translate"), J = () => ["auto", "contain", "none"], oe = () => ["auto", "hidden", "clip", "visible", "scroll"], ne = () => ["auto", le, t], E = () => [le, t], fe = () => ["", kt, Vt], W = () => ["auto", Vr, le], N = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], T = () => ["solid", "dashed", "dotted", "double", "none"], B = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], re = () => ["", "0", le], h = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Vr, le];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [cn],
      spacing: [kt, Vt],
      blur: ["none", "", Wt, le],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Wt, le],
      borderSpacing: E(),
      borderWidth: fe(),
      contrast: v(),
      grayscale: re(),
      hueRotate: v(),
      invert: re(),
      gap: E(),
      gradientColorStops: [e],
      gradientColorStopPositions: [vO, Vt],
      inset: ne(),
      margin: ne(),
      opacity: v(),
      padding: E(),
      saturate: v(),
      scale: v(),
      sepia: re(),
      skew: v(),
      space: E(),
      translate: E()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", le]
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
        columns: [Wt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": h()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": h()
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
        object: [...N(), le]
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", ln, le]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ne()
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
        flex: ["1", "auto", "initial", "none", le]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: re()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: re()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", ln, le]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [cn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", ln, le]
        }, le]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": W()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": W()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [cn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [ln, le]
        }, le]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": W()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": W()
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
        "auto-cols": ["auto", "min", "max", "fr", le]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", le]
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
        justify: ["normal", ...q()]
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
        content: ["normal", ...q(), "baseline"]
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
        "place-content": [...q(), "baseline"]
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
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [m]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [m]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [m]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [m]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [m]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [m]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [m]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [m]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [m]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [U]
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
        "space-y": [U]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", le, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [le, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [le, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Wt]
        }, Wt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [le, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [le, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [le, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [le, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Wt, Vt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", vi]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [cn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", le]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Vr, vi]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", kt, le]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", le]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", le]
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
        "placeholder-opacity": [y]
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
        "text-opacity": [y]
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
        decoration: [...T(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", kt, Vt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", kt, le]
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
        indent: E()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", le]
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
        content: ["none", le]
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
        "bg-opacity": [y]
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
        bg: [...N(), kO]
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
        bg: ["auto", "cover", "contain", wO]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, SO]
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
        from: [x]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [x]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [x]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [y]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...T(), "hidden"]
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
        "divide-opacity": [y]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: T()
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
        outline: ["", ...T()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [kt, le]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [kt, Vt]
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
        ring: fe()
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
        "ring-opacity": [y]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [kt, Vt]
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
        shadow: ["", "inner", "none", Wt, AO]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [cn]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [y]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...B(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": B()
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
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Wt, le]
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
        saturate: [O]
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
        "backdrop-opacity": [y]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", le]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: v()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", le]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: v()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", le]
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
        scale: [S]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [S]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [S]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [ln, le]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [te]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [te]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [Y]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Y]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", le]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", le]
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
        "scroll-m": E()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": E()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": E()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": E()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": E()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": E()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": E()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": E()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": E()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": E()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": E()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": E()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": E()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": E()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": E()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": E()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": E()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": E()
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
        "will-change": ["auto", "scroll", "contents", "transform", le]
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
        stroke: [kt, Vt, vi]
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
}, $O = /* @__PURE__ */ fO(CO), jO = ({
  onClick: e,
  className: t,
  size: r = "md"
}) => /* @__PURE__ */ G(
  "button",
  {
    onClick: e,
    className: $O(
      "flex items-center justify-center rounded-full bg-black/40 text-white/60 transition-all hover:bg-black/70 hover:text-white",
      {
        sm: "h-5 w-5 text-sm",
        md: "h-7 w-7 text-md",
        lg: "h-9 w-9 text-xl"
      }[r],
      t
    ),
    children: /* @__PURE__ */ G(zl, { icon: C2 })
  }
);
var Ml = ao(), ae = (e) => oo(e, Ml), Rl = ao();
ae.write = (e) => oo(e, Rl);
var ha = ao();
ae.onStart = (e) => oo(e, ha);
var Tl = ao();
ae.onFrame = (e) => oo(e, Tl);
var Dl = ao();
ae.onFinish = (e) => oo(e, Dl);
var Wr = [];
ae.setTimeout = (e, t) => {
  const r = ae.now() + t, n = () => {
    const a = Wr.findIndex((i) => i.cancel == n);
    ~a && Wr.splice(a, 1), Kt -= ~a ? 1 : 0;
  }, o = { time: r, handler: e, cancel: n };
  return Wr.splice(Ph(r), 0, o), Kt += 1, Eh(), o;
};
var Ph = (e) => ~(~Wr.findIndex((t) => t.time > e) || ~Wr.length);
ae.cancel = (e) => {
  ha.delete(e), Tl.delete(e), Dl.delete(e), Ml.delete(e), Rl.delete(e);
};
ae.sync = (e) => {
  _s = !0, ae.batchedUpdates(e), _s = !1;
};
ae.throttle = (e) => {
  let t;
  function r() {
    try {
      e(...t);
    } finally {
      t = null;
    }
  }
  function n(...o) {
    t = o, ae.onStart(r);
  }
  return n.handler = e, n.cancel = () => {
    ha.delete(r), t = null;
  }, n;
};
var Ll = typeof window < "u" ? window.requestAnimationFrame : (
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  () => {
  }
);
ae.use = (e) => Ll = e;
ae.now = typeof performance < "u" ? () => performance.now() : Date.now;
ae.batchedUpdates = (e) => e();
ae.catch = console.error;
ae.frameLoop = "always";
ae.advance = () => {
  ae.frameLoop !== "demand" ? console.warn(
    "Cannot call the manual advancement of rafz whilst frameLoop is not set as demand"
  ) : Ch();
};
var Ht = -1, Kt = 0, _s = !1;
function oo(e, t) {
  _s ? (t.delete(e), e(0)) : (t.add(e), Eh());
}
function Eh() {
  Ht < 0 && (Ht = 0, ae.frameLoop !== "demand" && Ll(Nh));
}
function IO() {
  Ht = -1;
}
function Nh() {
  ~Ht && (Ll(Nh), ae.batchedUpdates(Ch));
}
function Ch() {
  const e = Ht;
  Ht = ae.now();
  const t = Ph(Ht);
  if (t && ($h(Wr.splice(0, t), (r) => r.handler()), Kt -= t), !Kt) {
    IO();
    return;
  }
  ha.flush(), Ml.flush(e ? Math.min(64, Ht - e) : 16.667), Tl.flush(), Rl.flush(), Dl.flush();
}
function ao() {
  let e = /* @__PURE__ */ new Set(), t = e;
  return {
    add(r) {
      Kt += t == e && !e.has(r) ? 1 : 0, e.add(r);
    },
    delete(r) {
      return Kt -= t == e && e.has(r) ? 1 : 0, e.delete(r);
    },
    flush(r) {
      t.size && (e = /* @__PURE__ */ new Set(), Kt -= t.size, $h(t, (n) => n(r) && e.add(n)), Kt += e.size, t = e);
    }
  };
}
function $h(e, t) {
  e.forEach((r) => {
    try {
      t(r);
    } catch (n) {
      ae.catch(n);
    }
  });
}
var zO = Object.defineProperty, _O = (e, t) => {
  for (var r in t)
    zO(e, r, { get: t[r], enumerable: !0 });
}, ot = {};
_O(ot, {
  assign: () => RO,
  colors: () => Jt,
  createStringInterpolator: () => Vl,
  skipAnimation: () => Ih,
  to: () => jh,
  willAdvance: () => Wl
});
function Ms() {
}
var MO = (e, t, r) => Object.defineProperty(e, t, { value: r, writable: !0, configurable: !0 }), V = {
  arr: Array.isArray,
  obj: (e) => !!e && e.constructor.name === "Object",
  fun: (e) => typeof e == "function",
  str: (e) => typeof e == "string",
  num: (e) => typeof e == "number",
  und: (e) => e === void 0
};
function St(e, t) {
  if (V.arr(e)) {
    if (!V.arr(t) || e.length !== t.length) return !1;
    for (let r = 0; r < e.length; r++)
      if (e[r] !== t[r]) return !1;
    return !0;
  }
  return e === t;
}
var ue = (e, t) => e.forEach(t);
function yt(e, t, r) {
  if (V.arr(e)) {
    for (let n = 0; n < e.length; n++)
      t.call(r, e[n], `${n}`);
    return;
  }
  for (const n in e)
    e.hasOwnProperty(n) && t.call(r, e[n], n);
}
var Ve = (e) => V.und(e) ? [] : V.arr(e) ? e : [e];
function Cn(e, t) {
  if (e.size) {
    const r = Array.from(e);
    e.clear(), ue(r, t);
  }
}
var xn = (e, ...t) => Cn(e, (r) => r(...t)), Fl = () => typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), Vl, jh, Jt = null, Ih = !1, Wl = Ms, RO = (e) => {
  e.to && (jh = e.to), e.now && (ae.now = e.now), e.colors !== void 0 && (Jt = e.colors), e.skipAnimation != null && (Ih = e.skipAnimation), e.createStringInterpolator && (Vl = e.createStringInterpolator), e.requestAnimationFrame && ae.use(e.requestAnimationFrame), e.batchedUpdates && (ae.batchedUpdates = e.batchedUpdates), e.willAdvance && (Wl = e.willAdvance), e.frameLoop && (ae.frameLoop = e.frameLoop);
}, $n = /* @__PURE__ */ new Set(), tt = [], xi = [], qo = 0, ga = {
  get idle() {
    return !$n.size && !tt.length;
  },
  /** Advance the given animation on every frame until idle. */
  start(e) {
    qo > e.priority ? ($n.add(e), ae.onStart(TO)) : (zh(e), ae(Rs));
  },
  /** Advance all animations by the given time. */
  advance: Rs,
  /** Call this when an animation's priority changes. */
  sort(e) {
    if (qo)
      ae.onFrame(() => ga.sort(e));
    else {
      const t = tt.indexOf(e);
      ~t && (tt.splice(t, 1), _h(e));
    }
  },
  /**
   * Clear all animations. For testing purposes.
   *
   * ☠️ Never call this from within the frameloop.
   */
  clear() {
    tt = [], $n.clear();
  }
};
function TO() {
  $n.forEach(zh), $n.clear(), ae(Rs);
}
function zh(e) {
  tt.includes(e) || _h(e);
}
function _h(e) {
  tt.splice(
    DO(tt, (t) => t.priority > e.priority),
    0,
    e
  );
}
function Rs(e) {
  const t = xi;
  for (let r = 0; r < tt.length; r++) {
    const n = tt[r];
    qo = n.priority, n.idle || (Wl(n), n.advance(e), n.idle || t.push(n));
  }
  return qo = 0, xi = tt, xi.length = 0, tt = t, tt.length > 0;
}
function DO(e, t) {
  const r = e.findIndex(t);
  return r < 0 ? e.length : r;
}
var LO = {
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
}, nt = "[-+]?\\d*\\.?\\d+", Bo = nt + "%";
function ba(...e) {
  return "\\(\\s*(" + e.join(")\\s*,\\s*(") + ")\\s*\\)";
}
var FO = new RegExp("rgb" + ba(nt, nt, nt)), VO = new RegExp("rgba" + ba(nt, nt, nt, nt)), WO = new RegExp("hsl" + ba(nt, Bo, Bo)), UO = new RegExp(
  "hsla" + ba(nt, Bo, Bo, nt)
), GO = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, YO = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/, qO = /^#([0-9a-fA-F]{6})$/, BO = /^#([0-9a-fA-F]{8})$/;
function HO(e) {
  let t;
  return typeof e == "number" ? e >>> 0 === e && e >= 0 && e <= 4294967295 ? e : null : (t = qO.exec(e)) ? parseInt(t[1] + "ff", 16) >>> 0 : Jt && Jt[e] !== void 0 ? Jt[e] : (t = FO.exec(e)) ? (Pr(t[1]) << 24 | // r
  Pr(t[2]) << 16 | // g
  Pr(t[3]) << 8 | // b
  255) >>> // a
  0 : (t = VO.exec(e)) ? (Pr(t[1]) << 24 | // r
  Pr(t[2]) << 16 | // g
  Pr(t[3]) << 8 | // b
  Hf(t[4])) >>> // a
  0 : (t = GO.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    "ff",
    // a
    16
  ) >>> 0 : (t = BO.exec(e)) ? parseInt(t[1], 16) >>> 0 : (t = YO.exec(e)) ? parseInt(
    t[1] + t[1] + // r
    t[2] + t[2] + // g
    t[3] + t[3] + // b
    t[4] + t[4],
    // a
    16
  ) >>> 0 : (t = WO.exec(e)) ? (qf(
    Bf(t[1]),
    // h
    Oo(t[2]),
    // s
    Oo(t[3])
    // l
  ) | 255) >>> // a
  0 : (t = UO.exec(e)) ? (qf(
    Bf(t[1]),
    // h
    Oo(t[2]),
    // s
    Oo(t[3])
    // l
  ) | Hf(t[4])) >>> // a
  0 : null;
}
function wi(e, t, r) {
  return r < 0 && (r += 1), r > 1 && (r -= 1), r < 1 / 6 ? e + (t - e) * 6 * r : r < 1 / 2 ? t : r < 2 / 3 ? e + (t - e) * (2 / 3 - r) * 6 : e;
}
function qf(e, t, r) {
  const n = r < 0.5 ? r * (1 + t) : r + t - r * t, o = 2 * r - n, a = wi(o, n, e + 1 / 3), i = wi(o, n, e), s = wi(o, n, e - 1 / 3);
  return Math.round(a * 255) << 24 | Math.round(i * 255) << 16 | Math.round(s * 255) << 8;
}
function Pr(e) {
  const t = parseInt(e, 10);
  return t < 0 ? 0 : t > 255 ? 255 : t;
}
function Bf(e) {
  return (parseFloat(e) % 360 + 360) % 360 / 360;
}
function Hf(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 1 ? 255 : Math.round(t * 255);
}
function Oo(e) {
  const t = parseFloat(e);
  return t < 0 ? 0 : t > 100 ? 1 : t / 100;
}
function Kf(e) {
  let t = HO(e);
  if (t === null) return e;
  t = t || 0;
  const r = (t & 4278190080) >>> 24, n = (t & 16711680) >>> 16, o = (t & 65280) >>> 8, a = (t & 255) / 255;
  return `rgba(${r}, ${n}, ${o}, ${a})`;
}
var Wn = (e, t, r) => {
  if (V.fun(e))
    return e;
  if (V.arr(e))
    return Wn({
      range: e,
      output: t,
      extrapolate: r
    });
  if (V.str(e.output[0]))
    return Vl(e);
  const n = e, o = n.output, a = n.range || [0, 1], i = n.extrapolateLeft || n.extrapolate || "extend", s = n.extrapolateRight || n.extrapolate || "extend", c = n.easing || ((l) => l);
  return (l) => {
    const u = XO(l, a);
    return KO(
      l,
      a[u],
      a[u + 1],
      o[u],
      o[u + 1],
      c,
      i,
      s,
      n.map
    );
  };
};
function KO(e, t, r, n, o, a, i, s, c) {
  let l = c ? c(e) : e;
  if (l < t) {
    if (i === "identity") return l;
    i === "clamp" && (l = t);
  }
  if (l > r) {
    if (s === "identity") return l;
    s === "clamp" && (l = r);
  }
  return n === o ? n : t === r ? e <= t ? n : o : (t === -1 / 0 ? l = -l : r === 1 / 0 ? l = l - t : l = (l - t) / (r - t), l = a(l), n === -1 / 0 ? l = -l : o === 1 / 0 ? l = l + n : l = l * (o - n) + n, l);
}
function XO(e, t) {
  for (var r = 1; r < t.length - 1 && !(t[r] >= e); ++r)
    ;
  return r - 1;
}
var JO = {
  linear: (e) => e
}, Un = Symbol.for("FluidValue.get"), Hr = Symbol.for("FluidValue.observers"), et = (e) => !!(e && e[Un]), Ue = (e) => e && e[Un] ? e[Un]() : e, Xf = (e) => e[Hr] || null;
function QO(e, t) {
  e.eventObserved ? e.eventObserved(t) : e(t);
}
function Gn(e, t) {
  const r = e[Hr];
  r && r.forEach((n) => {
    QO(n, t);
  });
}
var Mh = class {
  constructor(e) {
    if (!e && !(e = this.get))
      throw Error("Unknown getter");
    ZO(this, e);
  }
}, ZO = (e, t) => Rh(e, Un, t);
function tn(e, t) {
  if (e[Un]) {
    let r = e[Hr];
    r || Rh(e, Hr, r = /* @__PURE__ */ new Set()), r.has(t) || (r.add(t), e.observerAdded && e.observerAdded(r.size, t));
  }
  return t;
}
function Yn(e, t) {
  const r = e[Hr];
  if (r && r.has(t)) {
    const n = r.size - 1;
    n ? r.delete(t) : e[Hr] = null, e.observerRemoved && e.observerRemoved(n, t);
  }
}
var Rh = (e, t, r) => Object.defineProperty(e, t, {
  value: r,
  writable: !0,
  configurable: !0
}), zo = /[+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, e4 = /(#(?:[0-9a-f]{2}){2,4}|(#[0-9a-f]{3})|(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))/gi, Jf = new RegExp(`(${zo.source})(%|[a-z]+)`, "i"), t4 = /rgba\(([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+), ([0-9\.-]+)\)/gi, ya = /var\((--[a-zA-Z0-9-_]+),? ?([a-zA-Z0-9 ()%#.,-]+)?\)/, Th = (e) => {
  const [t, r] = r4(e);
  if (!t || Fl())
    return e;
  const n = window.getComputedStyle(document.documentElement).getPropertyValue(t);
  return n ? n.trim() : r && r.startsWith("--") ? window.getComputedStyle(document.documentElement).getPropertyValue(r) || e : r && ya.test(r) ? Th(r) : r || e;
}, r4 = (e) => {
  const t = ya.exec(e);
  if (!t) return [,];
  const [, r, n] = t;
  return [r, n];
}, ki, n4 = (e, t, r, n, o) => `rgba(${Math.round(t)}, ${Math.round(r)}, ${Math.round(n)}, ${o})`, Dh = (e) => {
  ki || (ki = Jt ? (
    // match color names, ignore partial matches
    new RegExp(`(${Object.keys(Jt).join("|")})(?!\\w)`, "g")
  ) : (
    // never match
    /^\b$/
  ));
  const t = e.output.map((o) => Ue(o).replace(ya, Th).replace(e4, Kf).replace(ki, Kf)), r = t.map((o) => o.match(zo).map(Number)), n = r[0].map(
    (o, a) => r.map((i) => {
      if (!(a in i))
        throw Error('The arity of each "output" value must be equal');
      return i[a];
    })
  ).map(
    (o) => Wn({ ...e, output: o })
  );
  return (o) => {
    var a;
    const i = !Jf.test(t[0]) && ((a = t.find((c) => Jf.test(c))) == null ? void 0 : a.replace(zo, ""));
    let s = 0;
    return t[0].replace(
      zo,
      () => `${n[s++](o)}${i || ""}`
    ).replace(t4, n4);
  };
}, Ul = "react-spring: ", Lh = (e) => {
  const t = e;
  let r = !1;
  if (typeof t != "function")
    throw new TypeError(`${Ul}once requires a function parameter`);
  return (...n) => {
    r || (t(...n), r = !0);
  };
}, o4 = Lh(console.warn);
function a4() {
  o4(
    `${Ul}The "interpolate" function is deprecated in v9 (use "to" instead)`
  );
}
var i4 = Lh(console.warn);
function s4() {
  i4(
    `${Ul}Directly calling start instead of using the api object is deprecated in v9 (use ".start" instead), this will be removed in later 0.X.0 versions`
  );
}
function va(e) {
  return V.str(e) && (e[0] == "#" || /\d/.test(e) || // Do not identify a CSS variable as an AnimatedString if its SSR
  !Fl() && ya.test(e) || e in (Jt || {}));
}
var zr = Fl() ? Re : Sg, l4 = () => {
  const e = _e(!1);
  return zr(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
};
function Fh() {
  const e = Bt()[1], t = l4();
  return () => {
    t.current && e(Math.random());
  };
}
var Vh = (e) => Re(e, c4), c4 = [];
function u4(e) {
  const t = _e(void 0);
  return Re(() => {
    t.current = e;
  }), t.current;
}
var qn = Symbol.for("Animated:node"), f4 = (e) => !!e && e[qn] === e, it = (e) => e && e[qn], Gl = (e, t) => MO(e, qn, t), xa = (e) => e && e[qn] && e[qn].getPayload(), Wh = class {
  constructor() {
    Gl(this, this);
  }
  /** Get every `AnimatedValue` used by this node. */
  getPayload() {
    return this.payload || [];
  }
}, wa = class Uh extends Wh {
  constructor(t) {
    super(), this._value = t, this.done = !0, this.durationProgress = 0, V.num(this._value) && (this.lastPosition = this._value);
  }
  /** @internal */
  static create(t) {
    return new Uh(t);
  }
  getPayload() {
    return [this];
  }
  getValue() {
    return this._value;
  }
  setValue(t, r) {
    return V.num(t) && (this.lastPosition = t, r && (t = Math.round(t / r) * r, this.done && (this.lastPosition = t))), this._value === t ? !1 : (this._value = t, !0);
  }
  reset() {
    const { done: t } = this;
    this.done = !1, V.num(this._value) && (this.elapsedTime = 0, this.durationProgress = 0, this.lastPosition = this._value, t && (this.lastVelocity = null), this.v0 = null);
  }
}, Ho = class Gh extends wa {
  constructor(t) {
    super(0), this._string = null, this._toString = Wn({
      output: [t, t]
    });
  }
  /** @internal */
  static create(t) {
    return new Gh(t);
  }
  getValue() {
    return this._string ?? (this._string = this._toString(this._value));
  }
  setValue(t) {
    if (V.str(t)) {
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
    t && (this._toString = Wn({
      output: [this.getValue(), t]
    })), this._value = 0, super.reset();
  }
}, Ko = { dependencies: null }, ka = class extends Wh {
  constructor(e) {
    super(), this.source = e, this.setValue(e);
  }
  getValue(e) {
    const t = {};
    return yt(this.source, (r, n) => {
      f4(r) ? t[n] = r.getValue(e) : et(r) ? t[n] = Ue(r) : e || (t[n] = r);
    }), t;
  }
  /** Replace the raw object data */
  setValue(e) {
    this.source = e, this.payload = this._makePayload(e);
  }
  reset() {
    this.payload && ue(this.payload, (e) => e.reset());
  }
  /** Create a payload set. */
  _makePayload(e) {
    if (e) {
      const t = /* @__PURE__ */ new Set();
      return yt(e, this._addToPayload, t), Array.from(t);
    }
  }
  /** Add to a payload set. */
  _addToPayload(e) {
    Ko.dependencies && et(e) && Ko.dependencies.add(e);
    const t = xa(e);
    t && ue(t, (r) => this.add(r));
  }
}, d4 = class Yh extends ka {
  constructor(t) {
    super(t);
  }
  /** @internal */
  static create(t) {
    return new Yh(t);
  }
  getValue() {
    return this.source.map((t) => t.getValue());
  }
  setValue(t) {
    const r = this.getPayload();
    return t.length == r.length ? r.map((n, o) => n.setValue(t[o])).some(Boolean) : (super.setValue(t.map(p4)), !0);
  }
};
function p4(e) {
  return (va(e) ? Ho : wa).create(e);
}
function Ts(e) {
  const t = it(e);
  return t ? t.constructor : V.arr(e) ? d4 : va(e) ? Ho : wa;
}
var Qf = (e, t) => {
  const r = (
    // Function components must use "forwardRef" to avoid being
    // re-rendered on every animation frame.
    !V.fun(e) || e.prototype && e.prototype.isReactComponent
  );
  return Ag((n, o) => {
    const a = _e(null), i = r && // eslint-disable-next-line react-hooks/rules-of-hooks
    Pg(
      (x) => {
        a.current = g4(o, x);
      },
      [o]
    ), [s, c] = h4(n, t), l = Fh(), u = () => {
      const x = a.current;
      r && !x || (x ? t.applyAnimatedValues(x, s.getValue(!0)) : !1) === !1 && l();
    }, f = new m4(u, c), d = _e(void 0);
    zr(() => (d.current = f, ue(c, (x) => tn(x, f)), () => {
      d.current && (ue(
        d.current.deps,
        (x) => Yn(x, d.current)
      ), ae.cancel(d.current.update));
    })), Re(u, []), Vh(() => () => {
      const x = d.current;
      ue(x.deps, (p) => Yn(p, x));
    });
    const b = t.getComponentProps(s.getValue());
    return /* @__PURE__ */ A.createElement(e, { ...b, ref: i });
  });
}, m4 = class {
  constructor(e, t) {
    this.update = e, this.deps = t;
  }
  eventObserved(e) {
    e.type == "change" && ae.write(this.update);
  }
};
function h4(e, t) {
  const r = /* @__PURE__ */ new Set();
  return Ko.dependencies = r, e.style && (e = {
    ...e,
    style: t.createAnimatedStyle(e.style)
  }), e = new ka(e), Ko.dependencies = null, [e, r];
}
function g4(e, t) {
  return e && (V.fun(e) ? e(t) : e.current = t), t;
}
var Zf = Symbol.for("AnimatedComponent"), b4 = (e, {
  applyAnimatedValues: t = () => !1,
  createAnimatedStyle: r = (o) => new ka(o),
  getComponentProps: n = (o) => o
} = {}) => {
  const o = {
    applyAnimatedValues: t,
    createAnimatedStyle: r,
    getComponentProps: n
  }, a = (i) => {
    const s = ed(i) || "Anonymous";
    return V.str(i) ? i = a[i] || (a[i] = Qf(i, o)) : i = i[Zf] || (i[Zf] = Qf(i, o)), i.displayName = `Animated(${s})`, i;
  };
  return yt(e, (i, s) => {
    V.arr(e) && (s = ed(i)), a[s] = a(i);
  }), {
    animated: a
  };
}, ed = (e) => V.str(e) ? e : e && V.str(e.displayName) ? e.displayName : V.fun(e) && e.name || null;
function Ge(e, ...t) {
  return V.fun(e) ? e(...t) : e;
}
var jn = (e, t) => e === !0 || !!(t && e && (V.fun(e) ? e(t) : Ve(e).includes(t))), qh = (e, t) => V.obj(e) ? t && e[t] : e, Bh = (e, t) => e.default === !0 ? e[t] : e.default ? e.default[t] : void 0, y4 = (e) => e, Yl = (e, t = y4) => {
  let r = v4;
  e.default && e.default !== !0 && (e = e.default, r = Object.keys(e));
  const n = {};
  for (const o of r) {
    const a = t(e[o], o);
    V.und(a) || (n[o] = a);
  }
  return n;
}, v4 = [
  "config",
  "onProps",
  "onStart",
  "onChange",
  "onPause",
  "onResume",
  "onRest"
], x4 = {
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
function w4(e) {
  const t = {};
  let r = 0;
  if (yt(e, (n, o) => {
    x4[o] || (t[o] = n, r++);
  }), r)
    return t;
}
function ql(e) {
  const t = w4(e);
  if (t) {
    const r = { to: t };
    return yt(e, (n, o) => o in t || (r[o] = n)), r;
  }
  return { ...e };
}
function Bn(e) {
  return e = Ue(e), V.arr(e) ? e.map(Bn) : va(e) ? ot.createStringInterpolator({
    range: [0, 1],
    output: [e, e]
  })(1) : e;
}
function k4(e) {
  for (const t in e) return !0;
  return !1;
}
function Ds(e) {
  return V.fun(e) || V.arr(e) && V.obj(e[0]);
}
function td(e, t) {
  var r;
  (r = e.ref) == null || r.delete(e), t == null || t.delete(e);
}
function O4(e, t) {
  var r;
  t && e.ref !== t && ((r = e.ref) == null || r.delete(e), t.add(e), e.ref = t);
}
var S4 = {
  default: { tension: 170, friction: 26 }
}, Ls = {
  ...S4.default,
  mass: 1,
  damping: 1,
  easing: JO.linear,
  clamp: !1
}, A4 = class {
  constructor() {
    this.velocity = 0, Object.assign(this, Ls);
  }
};
function P4(e, t, r) {
  r && (r = { ...r }, rd(r, t), t = { ...r, ...t }), rd(e, t), Object.assign(e, t);
  for (const i in Ls)
    e[i] == null && (e[i] = Ls[i]);
  let { frequency: n, damping: o } = e;
  const { mass: a } = e;
  return V.und(n) || (n < 0.01 && (n = 0.01), o < 0 && (o = 0), e.tension = Math.pow(2 * Math.PI / n, 2) * a, e.friction = 4 * Math.PI * o * a / n), e;
}
function rd(e, t) {
  if (!V.und(t.decay))
    e.duration = void 0;
  else {
    const r = !V.und(t.tension) || !V.und(t.friction);
    (r || !V.und(t.frequency) || !V.und(t.damping) || !V.und(t.mass)) && (e.duration = void 0, e.decay = void 0), r && (e.frequency = void 0);
  }
}
var nd = [], E4 = class {
  constructor() {
    this.changed = !1, this.values = nd, this.toValues = null, this.fromValues = nd, this.config = new A4(), this.immediate = !1;
  }
};
function Hh(e, { key: t, props: r, defaultProps: n, state: o, actions: a }) {
  return new Promise((i, s) => {
    let c, l, u = jn(r.cancel ?? (n == null ? void 0 : n.cancel), t);
    if (u)
      b();
    else {
      V.und(r.pause) || (o.paused = jn(r.pause, t));
      let x = n == null ? void 0 : n.pause;
      x !== !0 && (x = o.paused || jn(x, t)), c = Ge(r.delay || 0, t), x ? (o.resumeQueue.add(d), a.pause()) : (a.resume(), d());
    }
    function f() {
      o.resumeQueue.add(d), o.timeouts.delete(l), l.cancel(), c = l.time - ae.now();
    }
    function d() {
      c > 0 && !ot.skipAnimation ? (o.delayed = !0, l = ae.setTimeout(b, c), o.pauseQueue.add(f), o.timeouts.add(l)) : b();
    }
    function b() {
      o.delayed && (o.delayed = !1), o.pauseQueue.delete(f), o.timeouts.delete(l), e <= (o.cancelId || 0) && (u = !0);
      try {
        a.start({ ...r, callId: e, cancel: u }, i);
      } catch (x) {
        s(x);
      }
    }
  });
}
var Bl = (e, t) => t.length == 1 ? t[0] : t.some((r) => r.cancelled) ? Ur(e.get()) : t.every((r) => r.noop) ? Kh(e.get()) : rt(
  e.get(),
  t.every((r) => r.finished)
), Kh = (e) => ({
  value: e,
  noop: !0,
  finished: !0,
  cancelled: !1
}), rt = (e, t, r = !1) => ({
  value: e,
  finished: t,
  cancelled: r
}), Ur = (e) => ({
  value: e,
  cancelled: !0,
  finished: !1
});
function Xh(e, t, r, n) {
  const { callId: o, parentId: a, onRest: i } = t, { asyncTo: s, promise: c } = r;
  return !a && e === s && !t.reset ? c : r.promise = (async () => {
    r.asyncId = o, r.asyncTo = e;
    const l = Yl(
      t,
      (m, y) => (
        // The `onRest` prop is only called when the `runAsync` promise is resolved.
        y === "onRest" ? void 0 : m
      )
    );
    let u, f;
    const d = new Promise(
      (m, y) => (u = m, f = y)
    ), b = (m) => {
      const y = (
        // The `cancel` prop or `stop` method was used.
        o <= (r.cancelId || 0) && Ur(n) || // The async `to` prop was replaced.
        o !== r.asyncId && rt(n, !1)
      );
      if (y)
        throw m.result = y, f(m), m;
    }, x = (m, y) => {
      const k = new od(), O = new ad();
      return (async () => {
        if (ot.skipAnimation)
          throw Hn(r), O.result = rt(n, !1), f(O), O;
        b(k);
        const S = V.obj(m) ? { ...m } : { ...y, to: m };
        S.parentId = o, yt(l, (Y, U) => {
          V.und(S[U]) && (S[U] = Y);
        });
        const g = await n.start(S);
        return b(k), r.paused && await new Promise((Y) => {
          r.resumeQueue.add(Y);
        }), g;
      })();
    };
    let p;
    if (ot.skipAnimation)
      return Hn(r), rt(n, !1);
    try {
      let m;
      V.arr(e) ? m = (async (y) => {
        for (const k of y)
          await x(k);
      })(e) : m = Promise.resolve(e(x, n.stop.bind(n))), await Promise.all([m.then(u), d]), p = rt(n.get(), !0, !1);
    } catch (m) {
      if (m instanceof od)
        p = m.result;
      else if (m instanceof ad)
        p = m.result;
      else
        throw m;
    } finally {
      o == r.asyncId && (r.asyncId = a, r.asyncTo = a ? s : void 0, r.promise = a ? c : void 0);
    }
    return V.fun(i) && ae.batchedUpdates(() => {
      i(p, n, n.item);
    }), p;
  })();
}
function Hn(e, t) {
  Cn(e.timeouts, (r) => r.cancel()), e.pauseQueue.clear(), e.resumeQueue.clear(), e.asyncId = e.asyncTo = e.promise = void 0, t && (e.cancelId = t);
}
var od = class extends Error {
  constructor() {
    super(
      "An async animation has been interrupted. You see this error because you forgot to use `await` or `.catch(...)` on its returned promise."
    );
  }
}, ad = class extends Error {
  constructor() {
    super("SkipAnimationSignal");
  }
}, Fs = (e) => e instanceof Hl, N4 = 1, Hl = class extends Mh {
  constructor() {
    super(...arguments), this.id = N4++, this._priority = 0;
  }
  get priority() {
    return this._priority;
  }
  set priority(e) {
    this._priority != e && (this._priority = e, this._onPriorityChange(e));
  }
  /** Get the current value */
  get() {
    const e = it(this);
    return e && e.getValue();
  }
  /** Create a spring that maps our value to another value */
  to(...e) {
    return ot.to(this, e);
  }
  /** @deprecated Use the `to` method instead. */
  interpolate(...e) {
    return a4(), ot.to(this, e);
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
    Gn(this, {
      type: "change",
      parent: this,
      value: e,
      idle: t
    });
  }
  /** Tell our children about our new priority */
  _onPriorityChange(e) {
    this.idle || ga.sort(this), Gn(this, {
      type: "priority",
      parent: this,
      priority: e
    });
  }
}, vr = Symbol.for("SpringPhase"), Jh = 1, Qh = 2, Zh = 4, Oi = (e) => (e[vr] & Jh) > 0, Ut = (e) => (e[vr] & Qh) > 0, un = (e) => (e[vr] & Zh) > 0, id = (e, t) => t ? e[vr] |= Qh | Jh : e[vr] &= -3, sd = (e, t) => t ? e[vr] |= Zh : e[vr] &= -5, C4 = class extends Hl {
  constructor(e, t) {
    if (super(), this.animation = new E4(), this.defaultProps = {}, this._state = {
      paused: !1,
      delayed: !1,
      pauseQueue: /* @__PURE__ */ new Set(),
      resumeQueue: /* @__PURE__ */ new Set(),
      timeouts: /* @__PURE__ */ new Set()
    }, this._pendingCalls = /* @__PURE__ */ new Set(), this._lastCallId = 0, this._lastToId = 0, this._memoizedDuration = 0, !V.und(e) || !V.und(t)) {
      const r = V.obj(e) ? { ...e } : { ...t, from: e };
      V.und(r.default) && (r.default = !0), this.start(r);
    }
  }
  /** Equals true when not advancing on each frame. */
  get idle() {
    return !(Ut(this) || this._state.asyncTo) || un(this);
  }
  get goal() {
    return Ue(this.animation.to);
  }
  get velocity() {
    const e = it(this);
    return e instanceof wa ? e.lastVelocity || 0 : e.getPayload().map((t) => t.lastVelocity || 0);
  }
  /**
   * When true, this value has been animated at least once.
   */
  get hasAnimated() {
    return Oi(this);
  }
  /**
   * When true, this value has an unfinished animation,
   * which is either active or paused.
   */
  get isAnimating() {
    return Ut(this);
  }
  /**
   * When true, all current and future animations are paused.
   */
  get isPaused() {
    return un(this);
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
    let t = !0, r = !1;
    const n = this.animation;
    let { toValues: o } = n;
    const { config: a } = n, i = xa(n.to);
    !i && et(n.to) && (o = Ve(Ue(n.to))), n.values.forEach((l, u) => {
      if (l.done) return;
      const f = (
        // Animated strings always go from 0 to 1.
        l.constructor == Ho ? 1 : i ? i[u].lastPosition : o[u]
      );
      let d = n.immediate, b = f;
      if (!d) {
        if (b = l.lastPosition, a.tension <= 0) {
          l.done = !0;
          return;
        }
        let x = l.elapsedTime += e;
        const p = n.fromValues[u], m = l.v0 != null ? l.v0 : l.v0 = V.arr(a.velocity) ? a.velocity[u] : a.velocity;
        let y;
        const k = a.precision || (p == f ? 5e-3 : Math.min(1, Math.abs(f - p) * 1e-3));
        if (V.und(a.duration))
          if (a.decay) {
            const O = a.decay === !0 ? 0.998 : a.decay, S = Math.exp(-(1 - O) * x);
            b = p + m / (1 - O) * (1 - S), d = Math.abs(l.lastPosition - b) <= k, y = m * S;
          } else {
            y = l.lastVelocity == null ? m : l.lastVelocity;
            const O = a.restVelocity || k / 10, S = a.clamp ? 0 : a.bounce, g = !V.und(S), Y = p == f ? l.v0 > 0 : p < f;
            let U, te = !1;
            const J = 1, oe = Math.ceil(e / J);
            for (let ne = 0; ne < oe && (U = Math.abs(y) > O, !(!U && (d = Math.abs(f - b) <= k, d))); ++ne) {
              g && (te = b == f || b > f == Y, te && (y = -y * S, b = f));
              const E = -a.tension * 1e-6 * (b - f), fe = -a.friction * 1e-3 * y, W = (E + fe) / a.mass;
              y = y + W * J, b = b + y * J;
            }
          }
        else {
          let O = 1;
          a.duration > 0 && (this._memoizedDuration !== a.duration && (this._memoizedDuration = a.duration, l.durationProgress > 0 && (l.elapsedTime = a.duration * l.durationProgress, x = l.elapsedTime += e)), O = (a.progress || 0) + x / this._memoizedDuration, O = O > 1 ? 1 : O < 0 ? 0 : O, l.durationProgress = O), b = p + a.easing(O) * (f - p), y = (b - l.lastPosition) / e, d = O == 1;
        }
        l.lastVelocity = y, Number.isNaN(b) && (console.warn("Got NaN while animating:", this), d = !0);
      }
      i && !i[u].done && (d = !1), d ? l.done = !0 : t = !1, l.setValue(b, a.round) && (r = !0);
    });
    const s = it(this), c = s.getValue();
    if (t) {
      const l = Ue(n.to);
      (c !== l || r) && !a.decay ? (s.setValue(l), this._onChange(l)) : r && a.decay && this._onChange(c), this._stop();
    } else r && this._onChange(c);
  }
  /** Set the current value, while stopping the current animation */
  set(e) {
    return ae.batchedUpdates(() => {
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
    if (Ut(this)) {
      const { to: e, config: t } = this.animation;
      ae.batchedUpdates(() => {
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
    let r;
    return V.und(e) ? (r = this.queue || [], this.queue = []) : r = [V.obj(e) ? e : { ...t, to: e }], Promise.all(
      r.map((n) => this._update(n))
    ).then((n) => Bl(this, n));
  }
  /**
   * Stop the current animation, and cancel any delayed updates.
   *
   * Pass `true` to call `onRest` with `cancelled: true`.
   */
  stop(e) {
    const { to: t } = this.animation;
    return this._focus(this.get()), Hn(this._state, e && this._lastCallId), ae.batchedUpdates(() => this._stop(t, e)), this;
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
    let { to: r, from: n } = e;
    r = V.obj(r) ? r[t] : r, (r == null || Ds(r)) && (r = void 0), n = V.obj(n) ? n[t] : n, n == null && (n = void 0);
    const o = { to: r, from: n };
    return Oi(this) || (e.reverse && ([r, n] = [n, r]), n = Ue(n), V.und(n) ? it(this) || this._set(r) : this._set(n)), o;
  }
  /** Every update is processed by this method before merging. */
  _update({ ...e }, t) {
    const { key: r, defaultProps: n } = this;
    e.default && Object.assign(
      n,
      Yl(
        e,
        (i, s) => /^on/.test(s) ? qh(i, r) : i
      )
    ), cd(this, e, "onProps"), dn(this, "onProps", e, this);
    const o = this._prepareNode(e);
    if (Object.isFrozen(this))
      throw Error(
        "Cannot animate a `SpringValue` object that is frozen. Did you forget to pass your component to `animated(...)` before animating its props?"
      );
    const a = this._state;
    return Hh(++this._lastCallId, {
      key: r,
      props: e,
      defaultProps: n,
      state: a,
      actions: {
        pause: () => {
          un(this) || (sd(this, !0), xn(a.pauseQueue), dn(
            this,
            "onPause",
            rt(this, fn(this, this.animation.to)),
            this
          ));
        },
        resume: () => {
          un(this) && (sd(this, !1), Ut(this) && this._resume(), xn(a.resumeQueue), dn(
            this,
            "onResume",
            rt(this, fn(this, this.animation.to)),
            this
          ));
        },
        start: this._merge.bind(this, o)
      }
    }).then((i) => {
      if (e.loop && i.finished && !(t && i.noop)) {
        const s = eg(e);
        if (s)
          return this._update(s, !0);
      }
      return i;
    });
  }
  /** Merge props into the current animation */
  _merge(e, t, r) {
    if (t.cancel)
      return this.stop(!0), r(Ur(this));
    const n = !V.und(e.to), o = !V.und(e.from);
    if (n || o)
      if (t.callId > this._lastToId)
        this._lastToId = t.callId;
      else
        return r(Ur(this));
    const { key: a, defaultProps: i, animation: s } = this, { to: c, from: l } = s;
    let { to: u = c, from: f = l } = e;
    o && !n && (!t.default || V.und(u)) && (u = f), t.reverse && ([u, f] = [f, u]);
    const d = !St(f, l);
    d && (s.from = f), f = Ue(f);
    const b = !St(u, c);
    b && this._focus(u);
    const x = Ds(t.to), { config: p } = s, { decay: m, velocity: y } = p;
    (n || o) && (p.velocity = 0), t.config && !x && P4(
      p,
      Ge(t.config, a),
      // Avoid calling the same "config" prop twice.
      t.config !== i.config ? Ge(i.config, a) : void 0
    );
    let k = it(this);
    if (!k || V.und(u))
      return r(rt(this, !0));
    const O = (
      // When `reset` is undefined, the `from` prop implies `reset: true`,
      // except for declarative updates. When `reset` is defined, there
      // must exist a value to animate from.
      V.und(t.reset) ? o && !t.default : !V.und(f) && jn(t.reset, a)
    ), S = O ? f : this.get(), g = Bn(u), Y = V.num(g) || V.arr(g) || va(g), U = !x && (!Y || jn(i.immediate || t.immediate, a));
    if (b) {
      const ne = Ts(u);
      if (ne !== k.constructor)
        if (U)
          k = this._set(g);
        else
          throw Error(
            `Cannot animate between ${k.constructor.name} and ${ne.name}, as the "to" prop suggests`
          );
    }
    const te = k.constructor;
    let J = et(u), oe = !1;
    if (!J) {
      const ne = O || !Oi(this) && d;
      (b || ne) && (oe = St(Bn(S), g), J = !oe), (!St(s.immediate, U) && !U || !St(p.decay, m) || !St(p.velocity, y)) && (J = !0);
    }
    if (oe && Ut(this) && (s.changed && !O ? J = !0 : J || this._stop(c)), !x && ((J || et(c)) && (s.values = k.getPayload(), s.toValues = et(u) ? null : te == Ho ? [1] : Ve(g)), s.immediate != U && (s.immediate = U, !U && !O && this._set(c)), J)) {
      const { onRest: ne } = s;
      ue($4, (fe) => cd(this, t, fe));
      const E = rt(this, fn(this, c));
      xn(this._pendingCalls, E), this._pendingCalls.add(r), s.changed && ae.batchedUpdates(() => {
        var fe;
        s.changed = !O, ne == null || ne(E, this), O ? Ge(i.onRest, E) : (fe = s.onStart) == null || fe.call(s, E, this);
      });
    }
    O && this._set(S), x ? r(Xh(t.to, t, this._state, this)) : J ? this._start() : Ut(this) && !b ? this._pendingCalls.add(r) : r(Kh(S));
  }
  /** Update the `animation.to` value, which might be a `FluidValue` */
  _focus(e) {
    const t = this.animation;
    e !== t.to && (Xf(this) && this._detach(), t.to = e, Xf(this) && this._attach());
  }
  _attach() {
    let e = 0;
    const { to: t } = this.animation;
    et(t) && (tn(t, this), Fs(t) && (e = t.priority + 1)), this.priority = e;
  }
  _detach() {
    const { to: e } = this.animation;
    et(e) && Yn(e, this);
  }
  /**
   * Update the current value from outside the frameloop,
   * and return the `Animated` node.
   */
  _set(e, t = !0) {
    const r = Ue(e);
    if (!V.und(r)) {
      const n = it(this);
      if (!n || !St(r, n.getValue())) {
        const o = Ts(r);
        !n || n.constructor != o ? Gl(this, o.create(r)) : n.setValue(r), n && ae.batchedUpdates(() => {
          this._onChange(r, t);
        });
      }
    }
    return it(this);
  }
  _onStart() {
    const e = this.animation;
    e.changed || (e.changed = !0, dn(
      this,
      "onStart",
      rt(this, fn(this, e.to)),
      this
    ));
  }
  _onChange(e, t) {
    t || (this._onStart(), Ge(this.animation.onChange, e, this)), Ge(this.defaultProps.onChange, e, this), super._onChange(e, t);
  }
  // This method resets the animation state (even if already animating) to
  // ensure the latest from/to range is used, and it also ensures this spring
  // is added to the frameloop.
  _start() {
    const e = this.animation;
    it(this).reset(Ue(e.to)), e.immediate || (e.fromValues = e.values.map((t) => t.lastPosition)), Ut(this) || (id(this, !0), un(this) || this._resume());
  }
  _resume() {
    ot.skipAnimation ? this.finish() : ga.start(this);
  }
  /**
   * Exit the frameloop and notify `onRest` listeners.
   *
   * Always wrap `_stop` calls with `batchedUpdates`.
   */
  _stop(e, t) {
    if (Ut(this)) {
      id(this, !1);
      const r = this.animation;
      ue(r.values, (o) => {
        o.done = !0;
      }), r.toValues && (r.onChange = r.onPause = r.onResume = void 0), Gn(this, {
        type: "idle",
        parent: this
      });
      const n = t ? Ur(this.get()) : rt(this.get(), fn(this, e ?? r.to));
      xn(this._pendingCalls, n), r.changed && (r.changed = !1, dn(this, "onRest", n, this));
    }
  }
};
function fn(e, t) {
  const r = Bn(t), n = Bn(e.get());
  return St(n, r);
}
function eg(e, t = e.loop, r = e.to) {
  const n = Ge(t);
  if (n) {
    const o = n !== !0 && ql(n), a = (o || e).reverse, i = !o || o.reset;
    return Xo({
      ...e,
      loop: t,
      // Avoid updating default props when looping.
      default: !1,
      // Never loop the `pause` prop.
      pause: void 0,
      // For the "reverse" prop to loop as expected, the "to" prop
      // must be undefined. The "reverse" prop is ignored when the
      // "to" prop is an array or function.
      to: !a || Ds(r) ? r : void 0,
      // Ignore the "from" prop except on reset.
      from: i ? e.from : void 0,
      reset: i,
      // The "loop" prop can return a "useSpring" props object to
      // override any of the original props.
      ...o
    });
  }
}
function Xo(e) {
  const { to: t, from: r } = e = ql(e), n = /* @__PURE__ */ new Set();
  return V.obj(t) && ld(t, n), V.obj(r) && ld(r, n), e.keys = n.size ? Array.from(n) : null, e;
}
function ld(e, t) {
  yt(e, (r, n) => r != null && t.add(n));
}
var $4 = [
  "onStart",
  "onRest",
  "onChange",
  "onPause",
  "onResume"
];
function cd(e, t, r) {
  e.animation[r] = t[r] !== Bh(t, r) ? qh(t[r], e.key) : void 0;
}
function dn(e, t, ...r) {
  var n, o, a, i;
  (o = (n = e.animation)[t]) == null || o.call(n, ...r), (i = (a = e.defaultProps)[t]) == null || i.call(a, ...r);
}
var j4 = ["onStart", "onChange", "onRest"], I4 = 1, z4 = class {
  constructor(e, t) {
    this.id = I4++, this.springs = {}, this.queue = [], this._lastAsyncId = 0, this._active = /* @__PURE__ */ new Set(), this._changed = /* @__PURE__ */ new Set(), this._started = !1, this._state = {
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
    return this.each((t, r) => e[r] = t.get()), e;
  }
  /** Set the current values without animating. */
  set(e) {
    for (const t in e) {
      const r = e[t];
      V.und(r) || this.springs[t].set(r);
    }
  }
  /** Push an update onto the queue of each value. */
  update(e) {
    return e && this.queue.push(Xo(e)), this;
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
    return e ? t = Ve(e).map(Xo) : this.queue = [], this._flush ? this._flush(this, t) : (og(this, t), _4(this, t));
  }
  /** @internal */
  stop(e, t) {
    if (e !== !!e && (t = e), t) {
      const r = this.springs;
      ue(Ve(t), (n) => r[n].stop(!!e));
    } else
      Hn(this._state, this._lastAsyncId), this.each((r) => r.stop(!!e));
    return this;
  }
  /** Freeze the active animation in time */
  pause(e) {
    if (V.und(e))
      this.start({ pause: !0 });
    else {
      const t = this.springs;
      ue(Ve(e), (r) => t[r].pause());
    }
    return this;
  }
  /** Resume the animation if paused. */
  resume(e) {
    if (V.und(e))
      this.start({ pause: !1 });
    else {
      const t = this.springs;
      ue(Ve(e), (r) => t[r].resume());
    }
    return this;
  }
  /** Call a function once per spring value */
  each(e) {
    yt(this.springs, e);
  }
  /** @internal Called at the end of every animation frame */
  _onFrame() {
    const { onStart: e, onChange: t, onRest: r } = this._events, n = this._active.size > 0, o = this._changed.size > 0;
    (n && !this._started || o && !this._started) && (this._started = !0, Cn(e, ([s, c]) => {
      c.value = this.get(), s(c, this, this._item);
    }));
    const a = !n && this._started, i = o || a && r.size ? this.get() : null;
    o && t.size && Cn(t, ([s, c]) => {
      c.value = i, s(c, this, this._item);
    }), a && (this._started = !1, Cn(r, ([s, c]) => {
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
    ae.onFrame(this._onFrame);
  }
};
function _4(e, t) {
  return Promise.all(t.map((r) => tg(e, r))).then(
    (r) => Bl(e, r)
  );
}
async function tg(e, t, r) {
  const { keys: n, to: o, from: a, loop: i, onRest: s, onResolve: c } = t, l = V.obj(t.default) && t.default;
  i && (t.loop = !1), o === !1 && (t.to = null), a === !1 && (t.from = null);
  const u = V.arr(o) || V.fun(o) ? o : void 0;
  u ? (t.to = void 0, t.onRest = void 0, l && (l.onRest = void 0)) : ue(j4, (p) => {
    const m = t[p];
    if (V.fun(m)) {
      const y = e._events[p];
      t[p] = ({ finished: k, cancelled: O }) => {
        const S = y.get(m);
        S ? (k || (S.finished = !1), O && (S.cancelled = !0)) : y.set(m, {
          value: null,
          finished: k || !1,
          cancelled: O || !1
        });
      }, l && (l[p] = t[p]);
    }
  });
  const f = e._state;
  t.pause === !f.paused ? (f.paused = t.pause, xn(t.pause ? f.pauseQueue : f.resumeQueue)) : f.paused && (t.pause = !0);
  const d = (n || Object.keys(e.springs)).map(
    (p) => e.springs[p].start(t)
  ), b = t.cancel === !0 || Bh(t, "cancel") === !0;
  (u || b && f.asyncId) && d.push(
    Hh(++e._lastAsyncId, {
      props: t,
      state: f,
      actions: {
        pause: Ms,
        resume: Ms,
        start(p, m) {
          b ? (Hn(f, e._lastAsyncId), m(Ur(e))) : (p.onRest = s, m(
            Xh(
              u,
              p,
              f,
              e
            )
          ));
        }
      }
    })
  ), f.paused && await new Promise((p) => {
    f.resumeQueue.add(p);
  });
  const x = Bl(e, await Promise.all(d));
  if (i && x.finished && !(r && x.noop)) {
    const p = eg(t, i, o);
    if (p)
      return og(e, [p]), tg(e, p, !0);
  }
  return c && ae.batchedUpdates(() => c(x, e, e.item)), x;
}
function M4(e, t) {
  const r = { ...e.springs };
  return t && ue(Ve(t), (n) => {
    V.und(n.keys) && (n = Xo(n)), V.obj(n.to) || (n = { ...n, to: void 0 }), ng(r, n, (o) => rg(o));
  }), R4(e, r), r;
}
function R4(e, t) {
  yt(t, (r, n) => {
    e.springs[n] || (e.springs[n] = r, tn(r, e));
  });
}
function rg(e, t) {
  const r = new C4();
  return r.key = e, t && tn(r, t), r;
}
function ng(e, t, r) {
  t.keys && ue(t.keys, (n) => {
    (e[n] || (e[n] = r(n)))._prepareNode(t);
  });
}
function og(e, t) {
  ue(t, (r) => {
    ng(e.springs, r, (n) => rg(n, e));
  });
}
var T4 = A.createContext({
  pause: !1,
  immediate: !1
}), D4 = () => {
  const e = [], t = function(n) {
    s4();
    const o = [];
    return ue(e, (a, i) => {
      if (V.und(n))
        o.push(a.start());
      else {
        const s = r(n, a, i);
        s && o.push(a.start(s));
      }
    }), o;
  };
  t.current = e, t.add = function(n) {
    e.includes(n) || e.push(n);
  }, t.delete = function(n) {
    const o = e.indexOf(n);
    ~o && e.splice(o, 1);
  }, t.pause = function() {
    return ue(e, (n) => n.pause(...arguments)), this;
  }, t.resume = function() {
    return ue(e, (n) => n.resume(...arguments)), this;
  }, t.set = function(n) {
    ue(e, (o, a) => {
      const i = V.fun(n) ? n(a, o) : n;
      i && o.set(i);
    });
  }, t.start = function(n) {
    const o = [];
    return ue(e, (a, i) => {
      if (V.und(n))
        o.push(a.start());
      else {
        const s = this._getProps(n, a, i);
        s && o.push(a.start(s));
      }
    }), o;
  }, t.stop = function() {
    return ue(e, (n) => n.stop(...arguments)), this;
  }, t.update = function(n) {
    return ue(e, (o, a) => o.update(this._getProps(n, o, a))), this;
  };
  const r = function(n, o, a) {
    return V.fun(n) ? n(a, o) : n;
  };
  return t._getProps = r, t;
};
function ud(e, t, r) {
  const n = V.fun(t) && t, {
    reset: o,
    sort: a,
    trail: i = 0,
    expires: s = !0,
    exitBeforeEnter: c = !1,
    onDestroyed: l,
    ref: u,
    config: f
  } = n ? n() : t, d = Og(
    () => n || arguments.length == 3 ? D4() : void 0,
    []
  ), b = Ve(e), x = [], p = _e(null), m = o ? null : p.current;
  zr(() => {
    p.current = x;
  }), Vh(() => (ue(x, (W) => {
    d == null || d.add(W.ctrl), W.ctrl.ref = d;
  }), () => {
    ue(p.current, (W) => {
      W.expired && clearTimeout(W.expirationId), td(W.ctrl, d), W.ctrl.stop(!0);
    });
  }));
  const y = F4(b, n ? n() : t, m), k = o && p.current || [];
  zr(
    () => ue(k, ({ ctrl: W, item: N, key: T }) => {
      td(W, d), Ge(l, N, T);
    })
  );
  const O = [];
  if (m && ue(m, (W, N) => {
    W.expired ? (clearTimeout(W.expirationId), k.push(W)) : (N = O[N] = y.indexOf(W.key), ~N && (x[N] = W));
  }), ue(b, (W, N) => {
    x[N] || (x[N] = {
      key: y[N],
      item: W,
      phase: "mount",
      ctrl: new z4()
    }, x[N].ctrl.item = W);
  }), O.length) {
    let W = -1;
    const { leave: N } = n ? n() : t;
    ue(O, (T, B) => {
      const q = m[B];
      ~T ? (W = x.indexOf(q), x[W] = { ...q, item: b[T] }) : N && x.splice(++W, 0, q);
    });
  }
  V.fun(a) && x.sort((W, N) => a(W.item, N.item));
  let S = -i;
  const g = Fh(), Y = Yl(t), U = /* @__PURE__ */ new Map(), te = _e(/* @__PURE__ */ new Map()), J = _e(!1);
  ue(x, (W, N) => {
    const T = W.key, B = W.phase, q = n ? n() : t;
    let re, h;
    const v = Ge(q.delay || 0, T);
    if (B == "mount")
      re = q.enter, h = "enter";
    else {
      const z = y.indexOf(T) < 0;
      if (B != "leave")
        if (z)
          re = q.leave, h = "leave";
        else if (re = q.update)
          h = "update";
        else return;
      else if (!z)
        re = q.enter, h = "enter";
      else return;
    }
    if (re = Ge(re, W.item, N), re = V.obj(re) ? ql(re) : { to: re }, !re.config) {
      const z = f || Y.config;
      re.config = Ge(z, W.item, N, h);
    }
    S += i;
    const C = {
      ...Y,
      // we need to add our props.delay value you here.
      delay: v + S,
      ref: u,
      immediate: q.immediate,
      // This prevents implied resets.
      reset: !1,
      // Merge any phase-specific props.
      ...re
    };
    if (h == "enter" && V.und(C.from)) {
      const z = n ? n() : t, $ = V.und(z.initial) || m ? z.from : z.initial;
      C.from = Ge($, W.item, N);
    }
    const { onResolve: I } = C;
    C.onResolve = (z) => {
      Ge(I, z);
      const $ = p.current, j = $.find((M) => M.key === T);
      if (j && !(z.cancelled && j.phase != "update") && j.ctrl.idle) {
        const M = $.every((_) => _.ctrl.idle);
        if (j.phase == "leave") {
          const _ = Ge(s, j.item);
          if (_ !== !1) {
            const R = _ === !0 ? 0 : _;
            if (j.expired = !0, !M && R > 0) {
              R <= 2147483647 && (j.expirationId = setTimeout(g, R));
              return;
            }
          }
        }
        M && $.some((_) => _.expired) && (te.current.delete(j), c && (J.current = !0), g());
      }
    };
    const P = M4(W.ctrl, C);
    h === "leave" && c ? te.current.set(W, { phase: h, springs: P, payload: C }) : U.set(W, { phase: h, springs: P, payload: C });
  });
  const oe = gd(T4), ne = u4(oe), E = oe !== ne && k4(oe);
  zr(() => {
    E && ue(x, (W) => {
      W.ctrl.start({ default: oe });
    });
  }, [oe]), ue(U, (W, N) => {
    if (te.current.size) {
      const T = x.findIndex((B) => B.key === N.key);
      x.splice(T, 1);
    }
  }), zr(
    () => {
      ue(
        te.current.size ? te.current : U,
        ({ phase: W, payload: N }, T) => {
          const { ctrl: B } = T;
          T.phase = W, d == null || d.add(B), E && W == "enter" && B.start({ default: oe }), N && (O4(B, N.ref), (B.ref || d) && !J.current ? B.update(N) : (B.start(N), J.current && (J.current = !1)));
        }
      );
    },
    o ? void 0 : r
  );
  const fe = (W) => /* @__PURE__ */ A.createElement(A.Fragment, null, x.map((N, T) => {
    const { springs: B } = U.get(N) || N.ctrl, q = W({ ...B }, N.item, N, T);
    return q && q.type ? /* @__PURE__ */ A.createElement(
      q.type,
      {
        ...q.props,
        key: V.str(N.key) || V.num(N.key) ? N.key : N.ctrl.id,
        ref: q.ref
      }
    ) : q;
  }));
  return d ? [fe, d] : fe;
}
var L4 = 1;
function F4(e, { key: t, keys: r = t }, n) {
  if (r === null) {
    const o = /* @__PURE__ */ new Set();
    return e.map((a) => {
      const i = n && n.find(
        (s) => s.item === a && s.phase !== "leave" && !o.has(s)
      );
      return i ? (o.add(i), i.key) : L4++;
    });
  }
  return V.und(r) ? e : V.fun(r) ? e.map(r) : Ve(r);
}
var V4 = class extends Hl {
  constructor(e, t) {
    super(), this.source = e, this.idle = !0, this._active = /* @__PURE__ */ new Set(), this.calc = Wn(...t);
    const r = this._get(), n = Ts(r);
    Gl(this, n.create(r));
  }
  advance(e) {
    const t = this._get(), r = this.get();
    St(t, r) || (it(this).setValue(t), this._onChange(t, this.idle)), !this.idle && fd(this._active) && Si(this);
  }
  _get() {
    const e = V.arr(this.source) ? this.source.map(Ue) : Ve(Ue(this.source));
    return this.calc(...e);
  }
  _start() {
    this.idle && !fd(this._active) && (this.idle = !1, ue(xa(this), (e) => {
      e.done = !1;
    }), ot.skipAnimation ? (ae.batchedUpdates(() => this.advance()), Si(this)) : ga.start(this));
  }
  // Observe our sources only when we're observed.
  _attach() {
    let e = 1;
    ue(Ve(this.source), (t) => {
      et(t) && tn(t, this), Fs(t) && (t.idle || this._active.add(t), e = Math.max(e, t.priority + 1));
    }), this.priority = e, this._start();
  }
  // Stop observing our sources once we have no observers.
  _detach() {
    ue(Ve(this.source), (e) => {
      et(e) && Yn(e, this);
    }), this._active.clear(), Si(this);
  }
  /** @internal */
  eventObserved(e) {
    e.type == "change" ? e.idle ? this.advance() : (this._active.add(e.parent), this._start()) : e.type == "idle" ? this._active.delete(e.parent) : e.type == "priority" && (this.priority = Ve(this.source).reduce(
      (t, r) => Math.max(t, (Fs(r) ? r.priority : 0) + 1),
      0
    ));
  }
};
function W4(e) {
  return e.idle !== !1;
}
function fd(e) {
  return !e.size || Array.from(e).every(W4);
}
function Si(e) {
  e.idle || (e.idle = !0, ue(xa(e), (t) => {
    t.done = !0;
  }), Gn(e, {
    type: "idle",
    parent: e
  }));
}
ot.assign({
  createStringInterpolator: Dh,
  to: (e, t) => new V4(e, t)
});
var ag = /^--/;
function U4(e, t) {
  return t == null || typeof t == "boolean" || t === "" ? "" : typeof t == "number" && t !== 0 && !ag.test(e) && !(In.hasOwnProperty(e) && In[e]) ? t + "px" : ("" + t).trim();
}
var dd = {};
function G4(e, t) {
  if (!e.nodeType || !e.setAttribute)
    return !1;
  const r = e.nodeName === "filter" || e.parentNode && e.parentNode.nodeName === "filter", {
    className: n,
    style: o,
    children: a,
    scrollTop: i,
    scrollLeft: s,
    viewBox: c,
    ...l
  } = t, u = Object.values(l), f = Object.keys(l).map(
    (d) => r || e.hasAttribute(d) ? d : dd[d] || (dd[d] = d.replace(
      /([A-Z])/g,
      // Attributes are written in dash case
      (b) => "-" + b.toLowerCase()
    ))
  );
  a !== void 0 && (e.textContent = a);
  for (const d in o)
    if (o.hasOwnProperty(d)) {
      const b = U4(d, o[d]);
      ag.test(d) ? e.style.setProperty(d, b) : e.style[d] = b;
    }
  f.forEach((d, b) => {
    e.setAttribute(d, u[b]);
  }), n !== void 0 && (e.className = n), i !== void 0 && (e.scrollTop = i), s !== void 0 && (e.scrollLeft = s), c !== void 0 && e.setAttribute("viewBox", c);
}
var In = {
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
}, Y4 = (e, t) => e + t.charAt(0).toUpperCase() + t.substring(1), q4 = ["Webkit", "Ms", "Moz", "O"];
In = Object.keys(In).reduce((e, t) => (q4.forEach((r) => e[Y4(r, t)] = e[t]), e), In);
var B4 = /^(matrix|translate|scale|rotate|skew)/, H4 = /^(translate)/, K4 = /^(rotate|skew)/, Ai = (e, t) => V.num(e) && e !== 0 ? e + t : e, _o = (e, t) => V.arr(e) ? e.every((r) => _o(r, t)) : V.num(e) ? e === t : parseFloat(e) === t, X4 = class extends ka {
  constructor({ x: e, y: t, z: r, ...n }) {
    const o = [], a = [];
    (e || t || r) && (o.push([e || 0, t || 0, r || 0]), a.push((i) => [
      `translate3d(${i.map((s) => Ai(s, "px")).join(",")})`,
      // prettier-ignore
      _o(i, 0)
    ])), yt(n, (i, s) => {
      if (s === "transform")
        o.push([i || ""]), a.push((c) => [c, c === ""]);
      else if (B4.test(s)) {
        if (delete n[s], V.und(i)) return;
        const c = H4.test(s) ? "px" : K4.test(s) ? "deg" : "";
        o.push(Ve(i)), a.push(
          s === "rotate3d" ? ([l, u, f, d]) => [
            `rotate3d(${l},${u},${f},${Ai(d, c)})`,
            _o(d, 0)
          ] : (l) => [
            `${s}(${l.map((u) => Ai(u, c)).join(",")})`,
            _o(l, s.startsWith("scale") ? 1 : 0)
          ]
        );
      }
    }), o.length && (n.transform = new J4(o, a)), super(n);
  }
}, J4 = class extends Mh {
  constructor(e, t) {
    super(), this.inputs = e, this.transforms = t, this._value = null;
  }
  get() {
    return this._value || (this._value = this._get());
  }
  _get() {
    let e = "", t = !0;
    return ue(this.inputs, (r, n) => {
      const o = Ue(r[0]), [a, i] = this.transforms[n](
        V.arr(o) ? o : r.map(Ue)
      );
      e += " " + a, t = t && i;
    }), t ? "none" : e;
  }
  // Start observing our inputs once we have an observer.
  observerAdded(e) {
    e == 1 && ue(
      this.inputs,
      (t) => ue(
        t,
        (r) => et(r) && tn(r, this)
      )
    );
  }
  // Stop observing our inputs once we have no observers.
  observerRemoved(e) {
    e == 0 && ue(
      this.inputs,
      (t) => ue(
        t,
        (r) => et(r) && Yn(r, this)
      )
    );
  }
  eventObserved(e) {
    e.type == "change" && (this._value = null), Gn(this, e);
  }
}, Q4 = [
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
ot.assign({
  batchedUpdates: Cg,
  createStringInterpolator: Dh,
  colors: LO
});
var Z4 = b4(Q4, {
  applyAnimatedValues: G4,
  createAnimatedStyle: (e) => new X4(e),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentProps: ({ scrollTop: e, scrollLeft: t, ...r }) => r
}), ig = Z4.animated;
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const eS = {
  prefix: "fas",
  iconName: "down-left-and-up-right-to-center",
  icon: [512, 512, ["compress-alt"], "f422", "M439 7c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8l-144 0c-13.3 0-24-10.7-24-24l0-144c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39L439 7zM72 272l144 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39L73 505c-9.4 9.4-24.6 9.4-33.9 0L7 473c-9.4-9.4-9.4-24.6 0-33.9l87-87L55 313c-6.9-6.9-8.9-17.2-5.2-26.2s12.5-14.8 22.2-14.8z"]
}, tS = {
  prefix: "fas",
  iconName: "up-right-and-down-left-from-center",
  icon: [512, 512, ["expand-alt"], "f424", "M344 0L488 0c13.3 0 24 10.7 24 24l0 144c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512L24 512c-13.3 0-24-10.7-24-24L0 344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"]
};
var Vs = /* @__PURE__ */ ((e) => (e[e.NONE = 0] = "NONE", e[e.INPUT = 1] = "INPUT", e[e.PANEL = 2] = "PANEL", e[e.DIALOGUE = 3] = "DIALOGUE", e))(Vs || {}), rS = Object.freeze({
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
}), nS = "VisuallyHidden", sg = A.forwardRef(
  (e, t) => /* @__PURE__ */ G(
    vt.span,
    {
      ...e,
      ref: t,
      style: { ...rS, ...e.style }
    }
  )
);
sg.displayName = nS;
var pd = sg;
const Kn = [], oS = (e) => {
  Kn.push(e);
}, aS = (e) => {
  const t = Kn.findIndex((r) => r.id === e);
  t !== -1 && Kn.splice(t, 1);
}, iS = (e, t) => {
  const r = Kn.find((n) => n.id === e);
  r && Object.assign(r, t);
}, sS = () => Kn.filter((e) => e.closeOnEsc).sort((e, t) => t.zIndex - e.zIndex)[0];
typeof window < "u" && !window.__modalEscListenerInstalled && (window.__modalEscListenerInstalled = !0, window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" && e.key !== "Esc") return;
  const t = sS();
  t && (e.preventDefault(), t.onClose());
}));
let pn = 70;
const lS = ({
  styles: e,
  backdropClassName: t,
  disableHotkeyInput: r,
  enableHotkeyInput: n
}) => (Re(() => (r(Vs.DIALOGUE), () => {
  n(Vs.DIALOGUE);
}), [r, n]), /* @__PURE__ */ G(P0, { forceMount: !0, asChild: !0, children: /* @__PURE__ */ G(
  ig.div,
  {
    className: Sn("fixed inset-0 z-[69]", t),
    style: {
      opacity: e.opacity,
      pointerEvents: "none",
      background: "radial-gradient(800px 400px at 10% -10%, rgba(45,129,255,0.10), transparent), radial-gradient(600px 320px at 110% 110%, rgba(28,182,190,0.10), transparent), rgba(0,0,0,0.60)"
    }
  }
) })), Ws = ({ children: e }) => /* @__PURE__ */ G(st, { children: e }), lg = kg(
  void 0
), Kl = ({ className: e, size: t = "md" }) => {
  const r = gd(lg);
  if (!r) return null;
  const { expanded: n, toggleExpanded: o } = r;
  return /* @__PURE__ */ G(
    "button",
    {
      type: "button",
      "aria-label": n ? "Restore modal size" : "Expand modal",
      onClick: o,
      className: Sn(
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
        Ln,
        {
          icon: n ? eS : tS
        }
      )
    }
  );
};
Kl.displayName = "ModalExpandButton";
const io = ({
  isOpen: e,
  title: t,
  titleIcon: r,
  onTitleIconClick: n,
  onClose: o,
  enableHotkeyInput: a = () => {
  },
  disableHotkeyInput: i = () => {
  },
  className: s,
  backdropClassName: c,
  width: l,
  children: u,
  childPadding: f = !0,
  titleIconClassName: d,
  showClose: b = !0,
  draggable: x = !1,
  resizable: p = !1,
  initialPosition: m,
  closeOnOutsideClick: y = !0,
  closeOnEsc: k = !0,
  allowBackgroundInteraction: O = !1,
  expandable: S = !1,
  accessibleTitle: g,
  accessibleDescription: Y
}) => {
  const [U, te] = Bt(
    null
  ), [J, oe] = Bt(!1), [ne, E] = Bt(!1), fe = _e({ x: 0, y: 0 }), W = _e({ x: 0, y: 0 }), N = _e(null), T = _e(null), B = _e(null), [q, re] = Bt(() => ++pn), [h, v] = Bt(!1), C = _e(null), I = ud(e, {
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
  }), P = ud(e, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      tension: 280,
      friction: 25
    }
  });
  Re(() => {
    h ? (T.current && (C.current = { ...T.current }), te({ x: 0, y: 0 }), T.current = { x: 0, y: 0 }, N.current && (N.current.style.left = "0px", N.current.style.top = "0px", N.current.style.margin = "0", N.current.style.position = "fixed", N.current.style.zIndex = String(q))) : C.current && (te({ ...C.current }), T.current = { ...C.current }, N.current && (N.current.style.left = C.current.x + "px", N.current.style.top = C.current.y + "px", N.current.style.margin = "0", N.current.style.position = "fixed", N.current.style.zIndex = String(q)));
  }, [h, q]);
  const z = () => v((Z) => !Z);
  Re(() => {
    e ? B.current ? (te({ ...B.current }), T.current = { ...B.current }, N.current && (N.current.style.left = B.current.x + "px", N.current.style.top = B.current.y + "px", N.current.style.margin = "0", N.current.style.position = "fixed", N.current.style.zIndex = String(q))) : m && (te({ ...m }), T.current = { ...m }, N.current && (N.current.style.left = m.x + "px", N.current.style.top = m.y + "px", N.current.style.margin = "0", N.current.style.position = "fixed", N.current.style.zIndex = String(q))) : T.current && (B.current = { ...T.current });
  }, [e, q]), Re(() => {
    if (!J) return;
    let Z = null;
    const ee = (Xe) => {
      if (!N.current) return;
      const Je = Xe.clientX - W.current.x, Se = Xe.clientY - W.current.y, ze = fe.current.x + Je, Me = fe.current.y + Se, Qe = N.current, { width: Ze, height: wr } = Qe.getBoundingClientRect(), Jl = window.innerWidth, Ql = window.innerHeight, Zl = 450, hg = -450, gg = 0, bg = Jl - Ze + Zl, yg = Ql - wr + Zl, vg = Math.max(hg, Math.min(ze, bg)), xg = Math.max(gg, Math.min(Me, yg));
      T.current = { x: vg, y: xg }, N.current && (Z && cancelAnimationFrame(Z), Z = requestAnimationFrame(() => {
        N.current && T.current && (N.current.style.left = T.current.x + "px", N.current.style.top = T.current.y + "px", N.current.style.margin = "0", N.current.style.position = "fixed", N.current.style.zIndex = String(q));
      }));
    }, he = () => {
      oe(!1), T.current && te({ ...T.current });
    };
    return window.addEventListener("mousemove", ee), window.addEventListener("mouseup", he), () => {
      window.removeEventListener("mousemove", ee), window.removeEventListener("mouseup", he), Z && cancelAnimationFrame(Z);
    };
  }, [J, q]);
  const $ = (Z) => {
    var ee, he;
    if (!N.current) return;
    h && v(!1), Z.preventDefault(), Z.stopPropagation();
    const Xe = N.current, { width: Je, height: Se } = Xe.getBoundingClientRect(), ze = window.innerWidth, Me = window.innerHeight;
    let Qe = ((ee = T.current) == null ? void 0 : ee.x) ?? (U == null ? void 0 : U.x), Ze = ((he = T.current) == null ? void 0 : he.y) ?? (U == null ? void 0 : U.y);
    (Qe === void 0 || Ze === void 0) && (m ? (Qe = m.x, Ze = m.y) : (Qe = (ze - Je) / 2, Ze = (Me - Se) / 2)), fe.current = { x: Qe, y: Ze }, W.current = { x: Z.clientX, y: Z.clientY }, oe(!0), !U && !T.current && (te({ x: Qe, y: Ze }), T.current = { x: Qe, y: Ze }, N.current && (N.current.style.left = Qe + "px", N.current.style.top = Ze + "px", N.current.style.margin = "0", N.current.style.position = "fixed", N.current.style.zIndex = String(q)));
  };
  let j = u;
  if (x) {
    let Z = !1;
    j = Array.isArray(u) ? u.map((ee) => {
      if (!Z && ec(ee) && (ee.type === Ws || ee.type.displayName === "ModalDragHandle")) {
        Z = !0;
        const he = ee;
        return tc(he, {
          children: /* @__PURE__ */ G(
            "div",
            {
              style: { cursor: "move", userSelect: "none" },
              onMouseDown: $,
              children: he.props.children
            }
          )
        });
      }
      return ee;
    }) : ec(u) && (u.type === Ws || u.type.displayName === "ModalDragHandle") ? (() => {
      const ee = u;
      return tc(ee, {
        children: /* @__PURE__ */ G(
          "div",
          {
            style: { cursor: "move", userSelect: "none" },
            onMouseDown: $,
            children: ee.props.children
          }
        )
      });
    })() : u;
  }
  const M = _e(null), _ = _e(null), R = (Z, ee) => {
    if (!N.current || (Z.preventDefault(), Z.stopPropagation(), h)) return;
    const he = N.current.getBoundingClientRect();
    M.current = ee, _.current = {
      mouseX: Z.clientX,
      mouseY: Z.clientY,
      width: he.width,
      height: he.height,
      x: he.left,
      y: he.top
    }, E(!0);
  };
  Re(() => {
    if (!ne) return;
    let Z = null;
    const ee = (Xe) => {
      if (!N.current || !_.current || !M.current)
        return;
      const Je = Xe.clientX - _.current.mouseX, Se = Xe.clientY - _.current.mouseY;
      let ze = _.current.width, Me = _.current.height, Qe = _.current.x, Ze = _.current.y;
      const wr = M.current;
      wr.includes("right") && (ze = _.current.width + Je), wr.includes("left") && (ze = _.current.width - Je, Qe = _.current.x + Je), wr.includes("bottom") && (Me = _.current.height + Se), wr.includes("top") && (Me = _.current.height - Se, Ze = _.current.y + Se), ze = Math.max(320, ze), Me = Math.max(240, Me), T.current = { x: Qe, y: Ze }, Ie.current = { width: ze, height: Me }, Z && cancelAnimationFrame(Z), Z = requestAnimationFrame(() => {
        N.current && T.current && (N.current.style.width = ze + "px", N.current.style.height = Me + "px", N.current.style.left = T.current.x + "px", N.current.style.top = T.current.y + "px", N.current.style.margin = "0", N.current.style.position = "fixed", N.current.style.zIndex = String(q));
      });
    }, he = () => {
      E(!1), T.current && te({ ...T.current }), Ie.current && ge({ ...Ie.current });
    };
    return window.addEventListener("mousemove", ee), window.addEventListener("mouseup", he), () => {
      window.removeEventListener("mousemove", ee), window.removeEventListener("mouseup", he), Z && cancelAnimationFrame(Z);
    };
  }, [ne, q]);
  const Q = () => {
    if (!p || h) return null;
    const Z = "absolute z-[75] bg-transparent select-none", ee = 5, he = 2, Xe = [
      { dir: "top", className: `top-0 left-0 w-full h-${he}` },
      { dir: "bottom", className: `bottom-0 left-0 w-full h-${he}` },
      { dir: "left", className: `left-0 top-0 h-full w-${he}` },
      { dir: "right", className: `right-0 top-0 h-full w-${he}` },
      {
        dir: "top-left",
        className: `top-0 left-0 w-${ee} h-${ee}`
      },
      {
        dir: "top-right",
        className: `top-0 right-0 w-${ee} h-${ee}`
      },
      {
        dir: "bottom-left",
        className: `bottom-0 left-0 w-${ee} h-${ee}`
      },
      {
        dir: "bottom-right",
        className: `bottom-0 right-0 w-${ee} h-${ee}`
      }
    ], Je = {
      top: "n-resize",
      bottom: "s-resize",
      left: "w-resize",
      right: "e-resize",
      "top-left": "nw-resize",
      "top-right": "ne-resize",
      "bottom-left": "sw-resize",
      "bottom-right": "se-resize"
    };
    return Xe.map((Se) => /* @__PURE__ */ G(
      "div",
      {
        className: `${Z} ${Se.className}`,
        style: { cursor: Je[Se.dir] },
        onMouseDown: (ze) => R(ze, Se.dir)
      },
      Se.dir
    ));
  }, [w, ge] = Bt(
    null
  ), Ie = _e(null), Ke = _e(null);
  Re(() => {
    if (e && !w && N.current && p) {
      const { width: Z, height: ee } = N.current.getBoundingClientRect();
      ge({ width: Z, height: ee }), Ie.current = { width: Z, height: ee };
    }
  }, [e, w, p]), Re(() => {
    if (p) {
      if (!e)
        Ie.current && (Ke.current = { ...Ie.current });
      else if (Ke.current && N.current) {
        const { width: Z, height: ee } = Ke.current;
        N.current.style.width = Z + "px", N.current.style.height = ee + "px", ge({ width: Z, height: ee }), Ie.current = { width: Z, height: ee };
      }
    }
  }, [e, p]), Re(() => {
    const Z = () => {
      N.current && q < pn && (pn += 1, re(pn), N.current.style.zIndex = String(pn));
    }, ee = N.current;
    return ee && ee.addEventListener("mousedown", Z), () => {
      ee && ee.removeEventListener("mousedown", Z);
    };
  }, [q]), Re(() => {
    if (!e || O) return;
    const Z = (ee) => {
      if (ee.key === "Escape" || ee.key === "Esc") return;
      const he = ee.target;
      he && (he.closest(
        '[role="dialog"], [role="menu"], [role="listbox"], [data-headlessui-portal]'
      ) || he.matches("input, textarea, select, button, [contenteditable]")) || ee.stopPropagation();
    };
    return window.addEventListener("keydown", Z, !0), () => {
      window.removeEventListener("keydown", Z, !0);
    };
  }, [e, O]), Re(() => {
    if (!O) return;
    const Z = N.current;
    if (!Z) return;
    const ee = (Se) => {
      Se && (Se.hasAttribute("inert") && Se.removeAttribute("inert"), Se.inert && (Se.inert = !1), Se.getAttribute("aria-hidden") === "true" && Se.removeAttribute("aria-hidden"));
    };
    let he = Z;
    for (; he; )
      ee(he), he = he.parentElement;
    const Xe = new MutationObserver((Se) => {
      Se.forEach((ze) => {
        if (ze.type === "attributes" && ze.attributeName === "inert" && ze.target instanceof HTMLElement) {
          const Me = ze.target;
          (Me === Z || Z.contains(Me)) && ee(Me);
        }
      });
    });
    Xe.observe(Z, {
      attributes: !0,
      subtree: !1,
      attributeFilter: ["inert"]
    }), document.querySelectorAll(
      "[data-radix-portal][inert], [data-headlessui-portal][inert]"
    ).forEach((Se) => Se.removeAttribute("inert"));
    const Je = new MutationObserver((Se) => {
      Se.forEach((ze) => {
        if (ze.type === "attributes" && ze.attributeName === "inert" && ze.target.hasAttribute("inert")) {
          const Me = ze.target;
          (Me.hasAttribute("data-radix-portal") || Me.hasAttribute("data-headlessui-portal")) && ee(Me);
        }
      });
    });
    return Je.observe(document.body, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["inert"]
    }), () => {
      Xe.disconnect(), Je.disconnect();
    };
  }, [O]);
  const Oa = _e(Math.floor(Math.random() * 1e9));
  Re(() => {
    if (e)
      return oS({
        id: Oa.current,
        zIndex: q,
        onClose: o,
        closeOnEsc: k
      }), () => {
        aS(Oa.current);
      };
  }, [e]), Re(() => {
    e && iS(Oa.current, { zIndex: q, onClose: o, closeOnEsc: k });
  }, [e, q, o, k]);
  const mg = () => h ? {
    position: "fixed",
    left: 0,
    top: 0,
    margin: 0,
    zIndex: q,
    width: "100vw",
    height: "100vh",
    ...O ? { pointerEvents: "auto" } : {}
  } : !x || !U ? {
    ...p && w ? { width: w.width, height: w.height } : {},
    ...O ? { pointerEvents: "auto" } : {}
  } : {
    position: "fixed",
    left: U.x,
    top: U.y,
    margin: 0,
    zIndex: q,
    ...p && w ? { width: w.width, height: w.height } : {},
    ...O ? { pointerEvents: "auto" } : {}
  };
  return /* @__PURE__ */ G(
    S0,
    {
      open: e,
      onOpenChange: (Z) => !Z && y && o(),
      modal: !O,
      children: /* @__PURE__ */ G(A0, { children: /* @__PURE__ */ Ye(
        "div",
        {
          className: "fixed inset-0 z-[70]",
          style: O ? { pointerEvents: "none" } : void 0,
          children: [
            !O && P(
              (Z, ee) => ee ? /* @__PURE__ */ G(
                lS,
                {
                  styles: Z,
                  backdropClassName: c,
                  disableHotkeyInput: i,
                  enableHotkeyInput: a
                },
                "backdrop"
              ) : null
            ),
            O && /* @__PURE__ */ G(
              "div",
              {
                className: Sn("fixed inset-0 z-[69]", c),
                style: { pointerEvents: "none" }
              }
            ),
            /* @__PURE__ */ G(lg.Provider, { value: { expanded: h, toggleExpanded: z }, children: /* @__PURE__ */ G(
              "div",
              {
                className: "flex min-h-full items-center justify-center p-4 text-center",
                style: O ? { pointerEvents: "none" } : void 0,
                children: I((Z, ee) => ee ? /* @__PURE__ */ G(
                  E0,
                  {
                    forceMount: !0,
                    asChild: !0,
                    ...Y ? {} : { "aria-describedby": void 0 },
                    onPointerDownOutside: (he) => {
                      (!y || O) && he.preventDefault();
                    },
                    onEscapeKeyDown: (he) => {
                      k || he.preventDefault();
                    },
                    onInteractOutside: (he) => {
                      O && he.preventDefault();
                    },
                    children: /* @__PURE__ */ Ye(
                      ig.div,
                      {
                        className: Sn(
                          "w-full max-w-lg rounded-xl relative border border-ui-panel-border bg-ui-modal text-left align-middle shadow-2xl z-[70]",
                          f && !h ? "p-4" : "",
                          s,
                          "!transition-none",
                          // Always disable CSS transitions for spring animations
                          h && "w-screen h-screen max-w-screen max-h-screen rounded-none"
                        ),
                        ref: N,
                        style: {
                          ...mg(),
                          opacity: Z.opacity,
                          transform: Z.transform,
                          transformOrigin: "center center",
                          willChange: "transform, opacity"
                          // Optimize for animations
                        },
                        children: [
                          /* @__PURE__ */ Ye("div", { className: "w-full h-full", children: [
                            Y && /* @__PURE__ */ G(pd, { asChild: !0, children: /* @__PURE__ */ G(N0, { children: Y }) }),
                            t ? /* @__PURE__ */ G(
                              du,
                              {
                                className: Sn(
                                  "mb-4 flex justify-between pb-0 text-xl font-bold text-base-fg"
                                ),
                                children: /* @__PURE__ */ G(st, { children: n ? /* @__PURE__ */ Ye(
                                  "button",
                                  {
                                    className: "flex items-center gap-3",
                                    onClick: n,
                                    children: [
                                      r && /* @__PURE__ */ G(
                                        Ln,
                                        {
                                          icon: r,
                                          className: d
                                        }
                                      ),
                                      t
                                    ]
                                  }
                                ) : /* @__PURE__ */ Ye("div", { className: "flex items-center gap-3", children: [
                                  r && /* @__PURE__ */ G(
                                    Ln,
                                    {
                                      icon: r,
                                      className: d
                                    }
                                  ),
                                  t
                                ] }) })
                              }
                            ) : /* @__PURE__ */ G(pd, { asChild: !0, children: /* @__PURE__ */ G(du, { children: g ?? "Dialog" }) }),
                            /* @__PURE__ */ G("div", { className: "h-full".trim(), children: j }),
                            Q()
                          ] }),
                          (b || S) && /* @__PURE__ */ Ye("div", { className: "absolute top-0 right-0 m-2.5 z-[80] flex items-center gap-2", children: [
                            S && /* @__PURE__ */ G(io.ExpandButton, {}),
                            b && /* @__PURE__ */ G(jO, { onClick: o })
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
io.DragHandle = Ws;
io.DragHandle.displayName = "ModalDragHandle";
io.ExpandButton = Kl;
Kl.displayName = "ModalExpandButton";
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const mn = {
  prefix: "fas",
  iconName: "right-to-bracket",
  icon: [512, 512, ["sign-in-alt"], "f2f6", "M217.9 105.9L340.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L217.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1L32 320c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM352 416l64 0c17.7 0 32-14.3 32-32l0-256c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c53 0 96 43 96 96l0 256c0 53-43 96-96 96l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z"]
}, Xl = "-", cS = (e) => {
  const t = fS(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(Xl);
      return s[0] === "" && s.length !== 1 && s.shift(), cg(s, t) || uS(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const c = r[i] || [];
      return s && n[i] ? [...c, ...n[i]] : c;
    }
  };
}, cg = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], n = t.nextPart.get(r), o = n ? cg(e.slice(1), n) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const a = e.join(Xl);
  return (i = t.validators.find(({
    validator: s
  }) => s(a))) == null ? void 0 : i.classGroupId;
}, md = /^\[(.+)\]$/, uS = (e) => {
  if (md.test(e)) {
    const t = md.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, fS = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return pS(Object.entries(e.classGroups), r).forEach(([a, i]) => {
    Us(i, n, a, t);
  }), n;
}, Us = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : hd(t, o);
      a.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (dS(o)) {
        Us(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      Us(i, hd(t, a), r, n);
    });
  });
}, hd = (e, t) => {
  let r = e;
  return t.split(Xl).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, dS = (e) => e.isThemeGetter, pS = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [r, o];
}) : e, mS = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    r.set(a, i), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = r.get(a);
      if (i !== void 0)
        return i;
      if ((i = n.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      r.has(a) ? r.set(a, i) : o(a, i);
    }
  };
}, ug = "!", hS = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const c = [];
    let l = 0, u = 0, f;
    for (let m = 0; m < s.length; m++) {
      let y = s[m];
      if (l === 0) {
        if (y === o && (n || s.slice(m, m + a) === t)) {
          c.push(s.slice(u, m)), u = m + a;
          continue;
        }
        if (y === "/") {
          f = m;
          continue;
        }
      }
      y === "[" ? l++ : y === "]" && l--;
    }
    const d = c.length === 0 ? s : s.substring(u), b = d.startsWith(ug), x = b ? d.substring(1) : d, p = f && f > u ? f - u : void 0;
    return {
      modifiers: c,
      hasImportantModifier: b,
      baseClassName: x,
      maybePostfixModifierPosition: p
    };
  };
  return r ? (s) => r({
    className: s,
    parseClassName: i
  }) : i;
}, gS = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, bS = (e) => ({
  cache: mS(e.cacheSize),
  parseClassName: hS(e),
  ...cS(e)
}), yS = /\s+/, vS = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(yS);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: u,
      hasImportantModifier: f,
      baseClassName: d,
      maybePostfixModifierPosition: b
    } = r(l);
    let x = !!b, p = n(x ? d.substring(0, b) : d);
    if (!p) {
      if (!x) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (p = n(d), !p) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const m = gS(u).join(":"), y = f ? m + ug : m, k = y + p;
    if (a.includes(k))
      continue;
    a.push(k);
    const O = o(p, x);
    for (let S = 0; S < O.length; ++S) {
      const g = O[S];
      a.push(y + g);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function xS() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = fg(t)) && (n && (n += " "), n += r);
  return n;
}
const fg = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = fg(e[n])) && (r && (r += " "), r += t);
  return r;
};
function wS(e, ...t) {
  let r, n, o, a = i;
  function i(c) {
    const l = t.reduce((u, f) => f(u), e());
    return r = bS(l), n = r.cache.get, o = r.cache.set, a = s, s(c);
  }
  function s(c) {
    const l = n(c);
    if (l)
      return l;
    const u = vS(c, r);
    return o(c, u), u;
  }
  return function() {
    return a(xS.apply(null, arguments));
  };
}
const Ne = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, dg = /^\[(?:([a-z-]+):)?(.+)\]$/i, kS = /^\d+\/\d+$/, OS = /* @__PURE__ */ new Set(["px", "full", "screen"]), SS = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, AS = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, PS = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, ES = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, NS = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, Ot = (e) => Gr(e) || OS.has(e) || kS.test(e), Gt = (e) => rn(e, "length", RS), Gr = (e) => !!e && !Number.isNaN(Number(e)), Pi = (e) => rn(e, "number", Gr), hn = (e) => !!e && Number.isInteger(Number(e)), CS = (e) => e.endsWith("%") && Gr(e.slice(0, -1)), ce = (e) => dg.test(e), Yt = (e) => SS.test(e), $S = /* @__PURE__ */ new Set(["length", "size", "percentage"]), jS = (e) => rn(e, $S, pg), IS = (e) => rn(e, "position", pg), zS = /* @__PURE__ */ new Set(["image", "url"]), _S = (e) => rn(e, zS, DS), MS = (e) => rn(e, "", TS), gn = () => !0, rn = (e, t, r) => {
  const n = dg.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, RS = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  AS.test(e) && !PS.test(e)
), pg = () => !1, TS = (e) => ES.test(e), DS = (e) => NS.test(e), LS = () => {
  const e = Ne("colors"), t = Ne("spacing"), r = Ne("blur"), n = Ne("brightness"), o = Ne("borderColor"), a = Ne("borderRadius"), i = Ne("borderSpacing"), s = Ne("borderWidth"), c = Ne("contrast"), l = Ne("grayscale"), u = Ne("hueRotate"), f = Ne("invert"), d = Ne("gap"), b = Ne("gradientColorStops"), x = Ne("gradientColorStopPositions"), p = Ne("inset"), m = Ne("margin"), y = Ne("opacity"), k = Ne("padding"), O = Ne("saturate"), S = Ne("scale"), g = Ne("sepia"), Y = Ne("skew"), U = Ne("space"), te = Ne("translate"), J = () => ["auto", "contain", "none"], oe = () => ["auto", "hidden", "clip", "visible", "scroll"], ne = () => ["auto", ce, t], E = () => [ce, t], fe = () => ["", Ot, Gt], W = () => ["auto", Gr, ce], N = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], T = () => ["solid", "dashed", "dotted", "double", "none"], B = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], re = () => ["", "0", ce], h = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Gr, ce];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [gn],
      spacing: [Ot, Gt],
      blur: ["none", "", Yt, ce],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Yt, ce],
      borderSpacing: E(),
      borderWidth: fe(),
      contrast: v(),
      grayscale: re(),
      hueRotate: v(),
      invert: re(),
      gap: E(),
      gradientColorStops: [e],
      gradientColorStopPositions: [CS, Gt],
      inset: ne(),
      margin: ne(),
      opacity: v(),
      padding: E(),
      saturate: v(),
      scale: v(),
      sepia: re(),
      skew: v(),
      space: E(),
      translate: E()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", ce]
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
        columns: [Yt]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": h()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": h()
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
        object: [...N(), ce]
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
        inset: [p]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [p]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [p]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [p]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [p]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [p]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [p]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [p]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [p]
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
        z: ["auto", hn, ce]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ne()
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
        flex: ["1", "auto", "initial", "none", ce]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: re()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: re()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", hn, ce]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [gn]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", hn, ce]
        }, ce]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": W()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": W()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [gn]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [hn, ce]
        }, ce]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": W()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": W()
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
        "auto-cols": ["auto", "min", "max", "fr", ce]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", ce]
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
        justify: ["normal", ...q()]
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
        content: ["normal", ...q(), "baseline"]
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
        "place-content": [...q(), "baseline"]
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
        p: [k]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [k]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [k]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [k]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [k]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [k]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [k]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [k]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [k]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [m]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [m]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [m]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [m]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [m]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [m]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [m]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [m]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [m]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [U]
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
        "space-y": [U]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", ce, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [ce, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [ce, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Yt]
        }, Yt]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [ce, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [ce, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [ce, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [ce, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Yt, Gt]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Pi]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [gn]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", ce]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Gr, Pi]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Ot, ce]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", ce]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", ce]
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
        "placeholder-opacity": [y]
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
        "text-opacity": [y]
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
        decoration: [...T(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", Ot, Gt]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", Ot, ce]
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
        indent: E()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", ce]
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
        content: ["none", ce]
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
        "bg-opacity": [y]
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
        bg: [...N(), IS]
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
        bg: ["auto", "cover", "contain", jS]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, _S]
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
        from: [x]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [x]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [x]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [b]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [b]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [b]
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
        "border-opacity": [y]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...T(), "hidden"]
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
        "divide-opacity": [y]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: T()
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
        outline: ["", ...T()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [Ot, ce]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [Ot, Gt]
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
        ring: fe()
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
        "ring-opacity": [y]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [Ot, Gt]
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
        shadow: ["", "inner", "none", Yt, MS]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [gn]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [y]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...B(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": B()
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
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Yt, ce]
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
        saturate: [O]
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
        "backdrop-opacity": [y]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [O]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", ce]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: v()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", ce]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: v()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", ce]
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
        scale: [S]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [S]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [S]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [hn, ce]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [te]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [te]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [Y]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [Y]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", ce]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", ce]
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
        "scroll-m": E()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": E()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": E()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": E()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": E()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": E()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": E()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": E()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": E()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": E()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": E()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": E()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": E()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": E()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": E()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": E()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": E()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": E()
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
        "will-change": ["auto", "scroll", "contents", "transform", ce]
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
        stroke: [Ot, Gt, Pi]
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
}, FS = /* @__PURE__ */ wS(LS);
function HS({
  isOpen: e,
  onClose: t,
  reminderType: r = "default",
  onPrimaryAction: n,
  title: o,
  hideTitle: a = !1,
  message: i,
  children: s,
  primaryActionText: c,
  secondaryActionText: l,
  onSecondaryAction: u,
  isLoading: f = !1,
  modalClassName: d = "",
  primaryActionIcon: b = mn,
  primaryActionBtnClassName: x = ""
}) {
  let p, m, y, k = mn, O = "";
  if (a)
    p = void 0;
  else
    switch (r) {
      case "soraLogin":
        p = o || "Link Your OpenAI Sora Account";
        break;
      case "artcraftLogin":
        p = o || "Login to ArtCraft";
        break;
      default:
        p = o || "Action Required";
        break;
    }
  switch (r) {
    case "soraLogin":
      p = o || "Link Your OpenAI Account", m = i || /* @__PURE__ */ G("p", { children: "To use this feature, please connect your OpenAI account. This allows us to leverage your existing subscription." }), y = c || "Login with OpenAI", k = b || mn, O = x || "";
      break;
    case "artcraftLogin":
      m = i || /* @__PURE__ */ G("p", { className: "text-sm text-white/70", children: "Please log in or sign up to ArtCraft to proceed. This will allow you to save your work and access all features." }), y = c || "Login / Sign Up", k = b || mn, O = x || "";
      break;
    default:
      m = i || /* @__PURE__ */ G("p", { className: "text-sm text-white/70", children: "Please complete the required action." }), y = c || "Proceed", k = b || mn, O = x || "";
      break;
  }
  const S = u || t, g = l || "Cancel", U = `${d} `.trim();
  return /* @__PURE__ */ G(
    io,
    {
      isOpen: e,
      onClose: t,
      title: p,
      className: U,
      children: /* @__PURE__ */ Ye("div", { children: [
        s ? /* @__PURE__ */ G("div", { className: "space-y-4", children: s }) : /* @__PURE__ */ G("div", { className: "space-y-4", children: m }),
        /* @__PURE__ */ Ye("div", { className: "mt-6 flex flex-col sm:flex-row-reverse gap-3", children: [
          /* @__PURE__ */ G(
            Qc,
            {
              onClick: n,
              loading: f,
              disabled: f,
              icon: k,
              className: FS("w-full sm:w-auto", O),
              children: y
            }
          ),
          (u || l) && /* @__PURE__ */ G(
            Qc,
            {
              variant: "secondary",
              onClick: S,
              disabled: f,
              className: "w-full sm:w-auto",
              children: g
            }
          )
        ] })
      ] })
    }
  );
}
export {
  HS as ActionReminderModal,
  Gg as actionReminderProps,
  sc as isActionReminderOpen,
  GS as showActionReminder
};
