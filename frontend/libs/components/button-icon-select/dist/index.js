import { jsxs as gt, jsx as ue } from "react/jsx-runtime";
import * as Qe from "react";
import ne, { createContext as hn, forwardRef as Lo, useRef as ee, useState as ce, useMemo as Tr, Fragment as je, useContext as xt, useEffect as Fe, useLayoutEffect as Do, useCallback as Ne, isValidElement as $o, cloneElement as Wo, createElement as Yo } from "react";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Go(e, t, n) {
  return (t = qo(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function jn(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function h(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? jn(Object(n), !0).forEach(function(r) {
      Go(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : jn(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Uo(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function qo(e) {
  var t = Uo(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Fn = () => {
};
let yn = {}, Ir = {}, _r = null, Nr = {
  mark: Fn,
  measure: Fn
};
try {
  typeof window < "u" && (yn = window), typeof document < "u" && (Ir = document), typeof MutationObserver < "u" && (_r = MutationObserver), typeof performance < "u" && (Nr = performance);
} catch {
}
const {
  userAgent: zn = ""
} = yn.navigator || {}, Oe = yn, q = Ir, Ln = _r, st = Nr;
Oe.document;
const xe = !!q.documentElement && !!q.head && typeof q.addEventListener == "function" && typeof q.createElement == "function", Rr = ~zn.indexOf("MSIE") || ~zn.indexOf("Trident/");
var Ho = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Vo = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Mr = {
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
}, Bo = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, jr = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], te = "classic", wt = "duotone", Xo = "sharp", Ko = "sharp-duotone", Fr = [te, wt, Xo, Ko], Jo = {
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
}, Zo = {
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
}, Qo = /* @__PURE__ */ new Map([["classic", {
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
}]]), ea = {
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
}, ta = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Dn = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, na = ["kit"], ra = {
  kit: {
    "fa-kit": "fak"
  }
}, oa = ["fak", "fakd"], aa = {
  kit: {
    fak: "fa-kit"
  }
}, $n = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, lt = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ia = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], sa = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], la = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, ca = {
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
}, fa = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, Vt = {
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
}, ua = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Bt = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...ia, ...ua], da = ["solid", "regular", "light", "thin", "duotone", "brands"], zr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], pa = zr.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), ma = [...Object.keys(fa), ...da, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", lt.GROUP, lt.SWAP_OPACITY, lt.PRIMARY, lt.SECONDARY].concat(zr.map((e) => "".concat(e, "x"))).concat(pa.map((e) => "w-".concat(e))), ga = {
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
const ye = "___FONT_AWESOME___", Xt = 16, Lr = "fa", Dr = "svg-inline--fa", ze = "data-fa-i2svg", Kt = "data-fa-pseudo-element", ba = "data-fa-pseudo-element-pending", vn = "data-prefix", xn = "data-icon", Wn = "fontawesome-i2svg", ha = "async", ya = ["HTML", "HEAD", "STYLE", "SCRIPT"], $r = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function ot(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[te];
    }
  });
}
const Wr = h({}, Mr);
Wr[te] = h(h(h(h({}, {
  "fa-duotone": "duotone"
}), Mr[te]), Dn.kit), Dn["kit-duotone"]);
const va = ot(Wr), Jt = h({}, ea);
Jt[te] = h(h(h(h({}, {
  duotone: "fad"
}), Jt[te]), $n.kit), $n["kit-duotone"]);
const Yn = ot(Jt), Zt = h({}, Vt);
Zt[te] = h(h({}, Zt[te]), aa.kit);
const wn = ot(Zt), Qt = h({}, ca);
Qt[te] = h(h({}, Qt[te]), ra.kit);
ot(Qt);
const xa = Ho, Yr = "fa-layers-text", wa = Vo, Ea = h({}, Jo);
ot(Ea);
const ka = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], _t = Bo, Aa = [...na, ...ma], et = Oe.FontAwesomeConfig || {};
function Sa(e) {
  var t = q.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Pa(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
q && typeof q.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const o = Pa(Sa(n));
  o != null && (et[r] = o);
});
const Gr = {
  styleDefault: "solid",
  familyDefault: te,
  cssPrefix: Lr,
  replacementClass: Dr,
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
et.familyPrefix && (et.cssPrefix = et.familyPrefix);
const Ue = h(h({}, Gr), et);
Ue.autoReplaceSvg || (Ue.observeMutations = !1);
const P = {};
Object.keys(Gr).forEach((e) => {
  Object.defineProperty(P, e, {
    enumerable: !0,
    set: function(t) {
      Ue[e] = t, tt.forEach((n) => n(P));
    },
    get: function() {
      return Ue[e];
    }
  });
});
Object.defineProperty(P, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Ue.cssPrefix = e, tt.forEach((t) => t(P));
  },
  get: function() {
    return Ue.cssPrefix;
  }
});
Oe.FontAwesomeConfig = P;
const tt = [];
function Ca(e) {
  return tt.push(e), () => {
    tt.splice(tt.indexOf(e), 1);
  };
}
const we = Xt, pe = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Oa(e) {
  if (!e || !xe)
    return;
  const t = q.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = q.head.childNodes;
  let r = null;
  for (let o = n.length - 1; o > -1; o--) {
    const a = n[o], i = (a.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = a);
  }
  return q.head.insertBefore(t, r), e;
}
const Ta = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function nt() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Ta[Math.random() * 62 | 0];
  return t;
}
function qe(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function En(e) {
  return e.classList ? qe(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Ur(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Ia(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Ur(e[n]), '" '), "").trim();
}
function Et(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function kn(e) {
  return e.size !== pe.size || e.x !== pe.x || e.y !== pe.y || e.rotate !== pe.rotate || e.flipX || e.flipY;
}
function _a(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const o = {
    transform: "translate(".concat(n / 2, " 256)")
  }, a = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(a, " ").concat(i, " ").concat(s)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: o,
    inner: l,
    path: c
  };
}
function Na(e) {
  let {
    transform: t,
    width: n = Xt,
    height: r = Xt,
    startCentered: o = !1
  } = e, a = "";
  return o && Rr ? a += "translate(".concat(t.x / we - n / 2, "em, ").concat(t.y / we - r / 2, "em) ") : o ? a += "translate(calc(-50% + ".concat(t.x / we, "em), calc(-50% + ").concat(t.y / we, "em)) ") : a += "translate(".concat(t.x / we, "em, ").concat(t.y / we, "em) "), a += "scale(".concat(t.size / we * (t.flipX ? -1 : 1), ", ").concat(t.size / we * (t.flipY ? -1 : 1), ") "), a += "rotate(".concat(t.rotate, "deg) "), a;
}
var Ra = `:root, :host {
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
function qr() {
  const e = Lr, t = Dr, n = P.cssPrefix, r = P.replacementClass;
  let o = Ra;
  if (n !== e || r !== t) {
    const a = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    o = o.replace(a, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return o;
}
let Gn = !1;
function Nt() {
  P.autoAddCss && !Gn && (Oa(qr()), Gn = !0);
}
var Ma = {
  mixout() {
    return {
      dom: {
        css: qr,
        insertCss: Nt
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        Nt();
      },
      beforeI2svg() {
        Nt();
      }
    };
  }
};
const ve = Oe || {};
ve[ye] || (ve[ye] = {});
ve[ye].styles || (ve[ye].styles = {});
ve[ye].hooks || (ve[ye].hooks = {});
ve[ye].shims || (ve[ye].shims = []);
var me = ve[ye];
const Hr = [], Vr = function() {
  q.removeEventListener("DOMContentLoaded", Vr), bt = 1, Hr.map((e) => e());
};
let bt = !1;
xe && (bt = (q.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(q.readyState), bt || q.addEventListener("DOMContentLoaded", Vr));
function ja(e) {
  xe && (bt ? setTimeout(e, 0) : Hr.push(e));
}
function at(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Ur(e) : "<".concat(t, " ").concat(Ia(n), ">").concat(r.map(at).join(""), "</").concat(t, ">");
}
function Un(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var Rt = function(t, n, r, o) {
  var a = Object.keys(t), i = a.length, s = n, l, c, f;
  for (r === void 0 ? (l = 1, f = t[a[0]]) : (l = 0, f = r); l < i; l++)
    c = a[l], f = s(f, t[c], c, t);
  return f;
};
function Fa(e) {
  const t = [];
  let n = 0;
  const r = e.length;
  for (; n < r; ) {
    const o = e.charCodeAt(n++);
    if (o >= 55296 && o <= 56319 && n < r) {
      const a = e.charCodeAt(n++);
      (a & 64512) == 56320 ? t.push(((o & 1023) << 10) + (a & 1023) + 65536) : (t.push(o), n--);
    } else
      t.push(o);
  }
  return t;
}
function en(e) {
  const t = Fa(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function za(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), o;
  return r >= 55296 && r <= 56319 && n > t + 1 && (o = e.charCodeAt(t + 1), o >= 56320 && o <= 57343) ? (r - 55296) * 1024 + o - 56320 + 65536 : r;
}
function qn(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function tn(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, o = qn(t);
  typeof me.hooks.addPack == "function" && !r ? me.hooks.addPack(e, qn(t)) : me.styles[e] = h(h({}, me.styles[e] || {}), o), e === "fas" && tn("fa", t);
}
const {
  styles: rt,
  shims: La
} = me, Br = Object.keys(wn), Da = Br.reduce((e, t) => (e[t] = Object.keys(wn[t]), e), {});
let An = null, Xr = {}, Kr = {}, Jr = {}, Zr = {}, Qr = {};
function $a(e) {
  return ~Aa.indexOf(e);
}
function Wa(e, t) {
  const n = t.split("-"), r = n[0], o = n.slice(1).join("-");
  return r === e && o !== "" && !$a(o) ? o : null;
}
const eo = () => {
  const e = (r) => Rt(rt, (o, a, i) => (o[i] = Rt(a, r, {}), o), {});
  Xr = e((r, o, a) => (o[3] && (r[o[3]] = a), o[2] && o[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = a;
  }), r)), Kr = e((r, o, a) => (r[a] = a, o[2] && o[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = a;
  }), r)), Qr = e((r, o, a) => {
    const i = o[2];
    return r[a] = a, i.forEach((s) => {
      r[s] = a;
    }), r;
  });
  const t = "far" in rt || P.autoFetchSvg, n = Rt(La, (r, o) => {
    const a = o[0];
    let i = o[1];
    const s = o[2];
    return i === "far" && !t && (i = "fas"), typeof a == "string" && (r.names[a] = {
      prefix: i,
      iconName: s
    }), typeof a == "number" && (r.unicodes[a.toString(16)] = {
      prefix: i,
      iconName: s
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  Jr = n.names, Zr = n.unicodes, An = kt(P.styleDefault, {
    family: P.familyDefault
  });
};
Ca((e) => {
  An = kt(e.styleDefault, {
    family: P.familyDefault
  });
});
eo();
function Sn(e, t) {
  return (Xr[e] || {})[t];
}
function Ya(e, t) {
  return (Kr[e] || {})[t];
}
function Re(e, t) {
  return (Qr[e] || {})[t];
}
function to(e) {
  return Jr[e] || {
    prefix: null,
    iconName: null
  };
}
function Ga(e) {
  const t = Zr[e], n = Sn("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Te() {
  return An;
}
const no = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Ua(e) {
  let t = te;
  const n = Br.reduce((r, o) => (r[o] = "".concat(P.cssPrefix, "-").concat(o), r), {});
  return Fr.forEach((r) => {
    (e.includes(n[r]) || e.some((o) => Da[r].includes(o))) && (t = r);
  }), t;
}
function kt(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = te
  } = t, r = va[n][e];
  if (n === wt && !e)
    return "fad";
  const o = Yn[n][e] || Yn[n][r], a = e in me.styles ? e : null;
  return o || a || null;
}
function qa(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const o = Wa(P.cssPrefix, r);
    o ? n = o : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function Hn(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function At(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const o = Bt.concat(sa), a = Hn(e.filter((u) => o.includes(u))), i = Hn(e.filter((u) => !Bt.includes(u))), s = a.filter((u) => (r = u, !jr.includes(u))), [l = null] = s, c = Ua(a), f = h(h({}, qa(i)), {}, {
    prefix: kt(l, {
      family: c
    })
  });
  return h(h(h({}, f), Xa({
    values: e,
    family: c,
    styles: rt,
    config: P,
    canonical: f,
    givenPrefix: r
  })), Ha(n, r, f));
}
function Ha(e, t, n) {
  let {
    prefix: r,
    iconName: o
  } = n;
  if (e || !r || !o)
    return {
      prefix: r,
      iconName: o
    };
  const a = t === "fa" ? to(o) : {}, i = Re(r, o);
  return o = a.iconName || i || o, r = a.prefix || r, r === "far" && !rt.far && rt.fas && !P.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: o
  };
}
const Va = Fr.filter((e) => e !== te || e !== wt), Ba = Object.keys(Vt).filter((e) => e !== te).map((e) => Object.keys(Vt[e])).flat();
function Xa(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: o = "",
    styles: a = {},
    config: i = {}
  } = e, s = n === wt, l = t.includes("fa-duotone") || t.includes("fad"), c = i.familyDefault === "duotone", f = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (l || c || f) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Va.includes(n) && (Object.keys(a).find((p) => Ba.includes(p)) || i.autoFetchSvg)) {
    const p = Qo.get(n).defaultShortPrefixId;
    r.prefix = p, r.iconName = Re(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || o === "fa") && (r.prefix = Te() || "fas"), r;
}
class Ka {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const o = n.reduce(this._pullDefinitions, {});
    Object.keys(o).forEach((a) => {
      this.definitions[a] = h(h({}, this.definitions[a] || {}), o[a]), tn(a, o[a]);
      const i = wn[te][a];
      i && tn(i, o[a]), eo();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(t, n) {
    const r = n.prefix && n.iconName && n.icon ? {
      0: n
    } : n;
    return Object.keys(r).map((o) => {
      const {
        prefix: a,
        iconName: i,
        icon: s
      } = r[o], l = s[2];
      t[a] || (t[a] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[a][c] = s);
      }), t[a][i] = s;
    }), t;
  }
}
let Vn = [], De = {};
const We = {}, Ja = Object.keys(We);
function Za(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Vn = e, De = {}, Object.keys(We).forEach((r) => {
    Ja.indexOf(r) === -1 && delete We[r];
  }), Vn.forEach((r) => {
    const o = r.mixout ? r.mixout() : {};
    if (Object.keys(o).forEach((a) => {
      typeof o[a] == "function" && (n[a] = o[a]), typeof o[a] == "object" && Object.keys(o[a]).forEach((i) => {
        n[a] || (n[a] = {}), n[a][i] = o[a][i];
      });
    }), r.hooks) {
      const a = r.hooks();
      Object.keys(a).forEach((i) => {
        De[i] || (De[i] = []), De[i].push(a[i]);
      });
    }
    r.provides && r.provides(We);
  }), n;
}
function nn(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), o = 2; o < n; o++)
    r[o - 2] = arguments[o];
  return (De[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function Le(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (De[e] || []).forEach((a) => {
    a.apply(null, n);
  });
}
function Ie() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return We[e] ? We[e].apply(null, t) : void 0;
}
function rn(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Te();
  if (t)
    return t = Re(n, t) || t, Un(ro.definitions, n, t) || Un(me.styles, n, t);
}
const ro = new Ka(), Qa = () => {
  P.autoReplaceSvg = !1, P.observeMutations = !1, Le("noAuto");
}, ei = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return xe ? (Le("beforeI2svg", e), Ie("pseudoElements2svg", e), Ie("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    P.autoReplaceSvg === !1 && (P.autoReplaceSvg = !0), P.observeMutations = !0, ja(() => {
      ni({
        autoReplaceSvgRoot: t
      }), Le("watch", e);
    });
  }
}, ti = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Re(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = kt(e[0]);
      return {
        prefix: n,
        iconName: Re(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(P.cssPrefix, "-")) > -1 || e.match(xa))) {
      const t = At(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Te(),
        iconName: Re(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Te();
      return {
        prefix: t,
        iconName: Re(t, e) || e
      };
    }
  }
}, le = {
  noAuto: Qa,
  config: P,
  dom: ei,
  parse: ti,
  library: ro,
  findIconDefinition: rn,
  toHtml: at
}, ni = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = q
  } = e;
  (Object.keys(me.styles).length > 0 || P.autoFetchSvg) && xe && P.autoReplaceSvg && le.dom.i2svg({
    node: t
  });
};
function St(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => at(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!xe) return;
      const n = q.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function ri(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: o,
    styles: a,
    transform: i
  } = e;
  if (kn(i) && n.found && !r.found) {
    const {
      width: s,
      height: l
    } = n, c = {
      x: s / l / 2,
      y: 0.5
    };
    o.style = Et(h(h({}, a), {}, {
      "transform-origin": "".concat(c.x + i.x / 16, "em ").concat(c.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: o,
    children: t
  }];
}
function oi(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: o,
    symbol: a
  } = e;
  const i = a === !0 ? "".concat(t, "-").concat(P.cssPrefix, "-").concat(n) : a;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: h(h({}, o), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Pn(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: o,
    transform: a,
    symbol: i,
    title: s,
    maskId: l,
    titleId: c,
    extra: f,
    watchable: u = !1
  } = e, {
    width: p,
    height: y
  } = n.found ? n : t, x = oa.includes(r), g = [P.replacementClass, o ? "".concat(P.cssPrefix, "-").concat(o) : ""].filter((m) => f.classes.indexOf(m) === -1).filter((m) => m !== "" || !!m).concat(f.classes).join(" ");
  let d = {
    children: [],
    attributes: h(h({}, f.attributes), {}, {
      "data-prefix": r,
      "data-icon": o,
      class: g,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(p, " ").concat(y)
    })
  };
  const w = x && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(p / y * 16 * 0.0625, "em")
  } : {};
  u && (d.attributes[ze] = ""), s && (d.children.push({
    tag: "title",
    attributes: {
      id: d.attributes["aria-labelledby"] || "title-".concat(c || nt())
    },
    children: [s]
  }), delete d.attributes.title);
  const S = h(h({}, d), {}, {
    prefix: r,
    iconName: o,
    main: t,
    mask: n,
    maskId: l,
    transform: a,
    symbol: i,
    styles: h(h({}, w), f.styles)
  }), {
    children: k,
    attributes: A
  } = n.found && t.found ? Ie("generateAbstractMask", S) || {
    children: [],
    attributes: {}
  } : Ie("generateAbstractIcon", S) || {
    children: [],
    attributes: {}
  };
  return S.children = k, S.attributes = A, i ? oi(S) : ri(S);
}
function Bn(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: o,
    title: a,
    extra: i,
    watchable: s = !1
  } = e, l = h(h(h({}, i.attributes), a ? {
    title: a
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (l[ze] = "");
  const c = h({}, i.styles);
  kn(o) && (c.transform = Na({
    transform: o,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const f = Et(c);
  f.length > 0 && (l.style = f);
  const u = [];
  return u.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), a && u.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [a]
  }), u;
}
function ai(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, o = h(h(h({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), a = Et(r.styles);
  a.length > 0 && (o.style = a);
  const i = [];
  return i.push({
    tag: "span",
    attributes: o,
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
  styles: Mt
} = me;
function on(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let o = null;
  return Array.isArray(r) ? o = {
    tag: "g",
    attributes: {
      class: "".concat(P.cssPrefix, "-").concat(_t.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(P.cssPrefix, "-").concat(_t.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(P.cssPrefix, "-").concat(_t.PRIMARY),
        fill: "currentColor",
        d: r[1]
      }
    }]
  } : o = {
    tag: "path",
    attributes: {
      fill: "currentColor",
      d: r
    }
  }, {
    found: !0,
    width: t,
    height: n,
    icon: o
  };
}
const ii = {
  found: !1,
  width: 512,
  height: 512
};
function si(e, t) {
  !$r && !P.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function an(e, t) {
  let n = t;
  return t === "fa" && P.styleDefault !== null && (t = Te()), new Promise((r, o) => {
    if (n === "fa") {
      const a = to(e) || {};
      e = a.iconName || e, t = a.prefix || t;
    }
    if (e && t && Mt[t] && Mt[t][e]) {
      const a = Mt[t][e];
      return r(on(a));
    }
    si(e, t), r(h(h({}, ii), {}, {
      icon: P.showMissingIcons && e ? Ie("missingIconAbstract") || {} : {}
    }));
  });
}
const Xn = () => {
}, sn = P.measurePerformance && st && st.mark && st.measure ? st : {
  mark: Xn,
  measure: Xn
}, Ze = 'FA "6.7.2"', li = (e) => (sn.mark("".concat(Ze, " ").concat(e, " begins")), () => oo(e)), oo = (e) => {
  sn.mark("".concat(Ze, " ").concat(e, " ends")), sn.measure("".concat(Ze, " ").concat(e), "".concat(Ze, " ").concat(e, " begins"), "".concat(Ze, " ").concat(e, " ends"));
};
var Cn = {
  begin: li,
  end: oo
};
const dt = () => {
};
function Kn(e) {
  return typeof (e.getAttribute ? e.getAttribute(ze) : null) == "string";
}
function ci(e) {
  const t = e.getAttribute ? e.getAttribute(vn) : null, n = e.getAttribute ? e.getAttribute(xn) : null;
  return t && n;
}
function fi(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(P.replacementClass);
}
function ui() {
  return P.autoReplaceSvg === !0 ? pt.replace : pt[P.autoReplaceSvg] || pt.replace;
}
function di(e) {
  return q.createElementNS("http://www.w3.org/2000/svg", e);
}
function pi(e) {
  return q.createElement(e);
}
function ao(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? di : pi
  } = t;
  if (typeof e == "string")
    return q.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(a) {
    r.setAttribute(a, e.attributes[a]);
  }), (e.children || []).forEach(function(a) {
    r.appendChild(ao(a, {
      ceFn: n
    }));
  }), r;
}
function mi(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const pt = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(ao(n), t);
      }), t.getAttribute(ze) === null && P.keepOriginalSource) {
        let n = q.createComment(mi(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~En(t).indexOf(P.replacementClass))
      return pt.replace(e);
    const r = new RegExp("".concat(P.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const a = n[0].attributes.class.split(" ").reduce((i, s) => (s === P.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = a.toSvg.join(" "), a.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", a.toNode.join(" "));
    }
    const o = n.map((a) => at(a)).join(`
`);
    t.setAttribute(ze, ""), t.innerHTML = o;
  }
};
function Jn(e) {
  e();
}
function io(e, t) {
  const n = typeof t == "function" ? t : dt;
  if (e.length === 0)
    n();
  else {
    let r = Jn;
    P.mutateApproach === ha && (r = Oe.requestAnimationFrame || Jn), r(() => {
      const o = ui(), a = Cn.begin("mutate");
      e.map(o), a(), n();
    });
  }
}
let On = !1;
function so() {
  On = !0;
}
function ln() {
  On = !1;
}
let ht = null;
function Zn(e) {
  if (!Ln || !P.observeMutations)
    return;
  const {
    treeCallback: t = dt,
    nodeCallback: n = dt,
    pseudoElementsCallback: r = dt,
    observeMutationsRoot: o = q
  } = e;
  ht = new Ln((a) => {
    if (On) return;
    const i = Te();
    qe(a).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Kn(s.addedNodes[0]) && (P.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && P.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Kn(s.target) && ~ka.indexOf(s.attributeName))
        if (s.attributeName === "class" && ci(s.target)) {
          const {
            prefix: l,
            iconName: c
          } = At(En(s.target));
          s.target.setAttribute(vn, l || i), c && s.target.setAttribute(xn, c);
        } else fi(s.target) && n(s.target);
    });
  }), xe && ht.observe(o, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function gi() {
  ht && ht.disconnect();
}
function bi(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, o) => {
    const a = o.split(":"), i = a[0], s = a.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function hi(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let o = At(En(e));
  return o.prefix || (o.prefix = Te()), t && n && (o.prefix = t, o.iconName = n), o.iconName && o.prefix || (o.prefix && r.length > 0 && (o.iconName = Ya(o.prefix, e.innerText) || Sn(o.prefix, en(e.innerText))), !o.iconName && P.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (o.iconName = e.firstChild.data)), o;
}
function yi(e) {
  const t = qe(e.attributes).reduce((o, a) => (o.name !== "class" && o.name !== "style" && (o[a.name] = a.value), o), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return P.autoA11y && (n ? t["aria-labelledby"] = "".concat(P.replacementClass, "-title-").concat(r || nt()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function vi() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: pe,
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
function Qn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: o
  } = hi(e), a = yi(e), i = nn("parseNodeAttributes", {}, e);
  let s = t.styleParser ? bi(e) : [];
  return h({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: pe,
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
  styles: xi
} = me;
function lo(e) {
  const t = P.autoReplaceSvg === "nest" ? Qn(e, {
    styleParser: !1
  }) : Qn(e);
  return ~t.extra.classes.indexOf(Yr) ? Ie("generateLayersText", e, t) : Ie("generateSvgReplacementMutation", e, t);
}
function wi() {
  return [...ta, ...Bt];
}
function er(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!xe) return Promise.resolve();
  const n = q.documentElement.classList, r = (f) => n.add("".concat(Wn, "-").concat(f)), o = (f) => n.remove("".concat(Wn, "-").concat(f)), a = P.autoFetchSvg ? wi() : jr.concat(Object.keys(xi));
  a.includes("fa") || a.push("fa");
  const i = [".".concat(Yr, ":not([").concat(ze, "])")].concat(a.map((f) => ".".concat(f, ":not([").concat(ze, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = qe(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), o("complete");
  else
    return Promise.resolve();
  const l = Cn.begin("onTree"), c = s.reduce((f, u) => {
    try {
      const p = lo(u);
      p && f.push(p);
    } catch (p) {
      $r || p.name === "MissingIcon" && console.error(p);
    }
    return f;
  }, []);
  return new Promise((f, u) => {
    Promise.all(c).then((p) => {
      io(p, () => {
        r("active"), r("complete"), o("pending"), typeof t == "function" && t(), l(), f();
      });
    }).catch((p) => {
      l(), u(p);
    });
  });
}
function Ei(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  lo(e).then((n) => {
    n && io([n], t);
  });
}
function ki(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : rn(t || {});
    let {
      mask: o
    } = n;
    return o && (o = (o || {}).icon ? o : rn(o || {})), e(r, h(h({}, n), {}, {
      mask: o
    }));
  };
}
const Ai = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = pe,
    symbol: r = !1,
    mask: o = null,
    maskId: a = null,
    title: i = null,
    titleId: s = null,
    classes: l = [],
    attributes: c = {},
    styles: f = {}
  } = t;
  if (!e) return;
  const {
    prefix: u,
    iconName: p,
    icon: y
  } = e;
  return St(h({
    type: "icon"
  }, e), () => (Le("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), P.autoA11y && (i ? c["aria-labelledby"] = "".concat(P.replacementClass, "-title-").concat(s || nt()) : (c["aria-hidden"] = "true", c.focusable = "false")), Pn({
    icons: {
      main: on(y),
      mask: o ? on(o.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: u,
    iconName: p,
    transform: h(h({}, pe), n),
    symbol: r,
    title: i,
    maskId: a,
    titleId: s,
    extra: {
      attributes: c,
      styles: f,
      classes: l
    }
  })));
};
var Si = {
  mixout() {
    return {
      icon: ki(Ai)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = er, e.nodeCallback = Ei, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = q,
        callback: r = () => {
        }
      } = t;
      return er(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: o,
        titleId: a,
        prefix: i,
        transform: s,
        symbol: l,
        mask: c,
        maskId: f,
        extra: u
      } = n;
      return new Promise((p, y) => {
        Promise.all([an(r, i), c.iconName ? an(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((x) => {
          let [g, d] = x;
          p([t, Pn({
            icons: {
              main: g,
              mask: d
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: l,
            maskId: f,
            title: o,
            titleId: a,
            extra: u,
            watchable: !0
          })]);
        }).catch(y);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        transform: a,
        styles: i
      } = t;
      const s = Et(i);
      s.length > 0 && (r.style = s);
      let l;
      return kn(a) && (l = Ie("generateAbstractTransformGrouping", {
        main: o,
        transform: a,
        containerWidth: o.width,
        iconWidth: o.width
      })), n.push(l || o.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, Pi = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return St({
          type: "layer"
        }, () => {
          Le("beforeDOMElementCreation", {
            assembler: e,
            params: t
          });
          let r = [];
          return e((o) => {
            Array.isArray(o) ? o.map((a) => {
              r = r.concat(a.abstract);
            }) : r = r.concat(o.abstract);
          }), [{
            tag: "span",
            attributes: {
              class: ["".concat(P.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, Ci = {
  mixout() {
    return {
      counter(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title: n = null,
          classes: r = [],
          attributes: o = {},
          styles: a = {}
        } = t;
        return St({
          type: "counter",
          content: e
        }, () => (Le("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ai({
          content: e.toString(),
          title: n,
          extra: {
            attributes: o,
            styles: a,
            classes: ["".concat(P.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, Oi = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = pe,
          title: r = null,
          classes: o = [],
          attributes: a = {},
          styles: i = {}
        } = t;
        return St({
          type: "text",
          content: e
        }, () => (Le("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Bn({
          content: e,
          transform: h(h({}, pe), n),
          title: r,
          extra: {
            attributes: a,
            styles: i,
            classes: ["".concat(P.cssPrefix, "-layers-text"), ...o]
          }
        })));
      }
    };
  },
  provides(e) {
    e.generateLayersText = function(t, n) {
      const {
        title: r,
        transform: o,
        extra: a
      } = n;
      let i = null, s = null;
      if (Rr) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        i = c.width / l, s = c.height / l;
      }
      return P.autoA11y && !r && (a.attributes["aria-hidden"] = "true"), Promise.resolve([t, Bn({
        content: t.innerHTML,
        width: i,
        height: s,
        transform: o,
        title: r,
        extra: a,
        watchable: !0
      })]);
    };
  }
};
const Ti = new RegExp('"', "ug"), tr = [1105920, 1112319], nr = h(h(h(h({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Zo), ga), la), cn = Object.keys(nr).reduce((e, t) => (e[t.toLowerCase()] = nr[t], e), {}), Ii = Object.keys(cn).reduce((e, t) => {
  const n = cn[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function _i(e) {
  const t = e.replace(Ti, ""), n = za(t, 0), r = n >= tr[0] && n <= tr[1], o = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: en(o ? t[0] : t),
    isSecondary: r || o
  };
}
function Ni(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), o = isNaN(r) ? "normal" : r;
  return (cn[n] || {})[o] || Ii[n];
}
function rr(e, t) {
  const n = "".concat(ba).concat(t.replace(":", "-"));
  return new Promise((r, o) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = qe(e.children).filter((p) => p.getAttribute(Kt) === t)[0], s = Oe.getComputedStyle(e, t), l = s.getPropertyValue("font-family"), c = l.match(wa), f = s.getPropertyValue("font-weight"), u = s.getPropertyValue("content");
    if (i && !c)
      return e.removeChild(i), r();
    if (c && u !== "none" && u !== "") {
      const p = s.getPropertyValue("content");
      let y = Ni(l, f);
      const {
        value: x,
        isSecondary: g
      } = _i(p), d = c[0].startsWith("FontAwesome");
      let w = Sn(y, x), S = w;
      if (d) {
        const k = Ga(x);
        k.iconName && k.prefix && (w = k.iconName, y = k.prefix);
      }
      if (w && !g && (!i || i.getAttribute(vn) !== y || i.getAttribute(xn) !== S)) {
        e.setAttribute(n, S), i && e.removeChild(i);
        const k = vi(), {
          extra: A
        } = k;
        A.attributes[Kt] = t, an(w, y).then((m) => {
          const H = Pn(h(h({}, k), {}, {
            icons: {
              main: m,
              mask: no()
            },
            prefix: y,
            iconName: S,
            extra: A,
            watchable: !0
          })), Y = q.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(Y, e.firstChild) : e.appendChild(Y), Y.outerHTML = H.map((re) => at(re)).join(`
`), e.removeAttribute(n), r();
        }).catch(o);
      } else
        r();
    } else
      r();
  });
}
function Ri(e) {
  return Promise.all([rr(e, "::before"), rr(e, "::after")]);
}
function Mi(e) {
  return e.parentNode !== document.head && !~ya.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(Kt) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function or(e) {
  if (xe)
    return new Promise((t, n) => {
      const r = qe(e.querySelectorAll("*")).filter(Mi).map(Ri), o = Cn.begin("searchPseudoElements");
      so(), Promise.all(r).then(() => {
        o(), ln(), t();
      }).catch(() => {
        o(), ln(), n();
      });
    });
}
var ji = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = or, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = q
      } = t;
      P.searchPseudoElements && or(n);
    };
  }
};
let ar = !1;
var Fi = {
  mixout() {
    return {
      dom: {
        unwatch() {
          so(), ar = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        Zn(nn("mutationObserverCallbacks", {}));
      },
      noAuto() {
        gi();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        ar ? ln() : Zn(nn("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const ir = (e) => {
  let t = {
    size: 16,
    x: 0,
    y: 0,
    flipX: !1,
    flipY: !1,
    rotate: 0
  };
  return e.toLowerCase().split(" ").reduce((n, r) => {
    const o = r.toLowerCase().split("-"), a = o[0];
    let i = o.slice(1).join("-");
    if (a && i === "h")
      return n.flipX = !0, n;
    if (a && i === "v")
      return n.flipY = !0, n;
    if (i = parseFloat(i), isNaN(i))
      return n;
    switch (a) {
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
var zi = {
  mixout() {
    return {
      parse: {
        transform: (e) => ir(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = ir(n)), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractTransformGrouping = function(t) {
      let {
        main: n,
        transform: r,
        containerWidth: o,
        iconWidth: a
      } = t;
      const i = {
        transform: "translate(".concat(o / 2, " 256)")
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), f = {
        transform: "".concat(s, " ").concat(l, " ").concat(c)
      }, u = {
        transform: "translate(".concat(a / 2 * -1, " -256)")
      }, p = {
        outer: i,
        inner: f,
        path: u
      };
      return {
        tag: "g",
        attributes: h({}, p.outer),
        children: [{
          tag: "g",
          attributes: h({}, p.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: h(h({}, n.icon.attributes), p.path)
          }]
        }]
      };
    };
  }
};
const jt = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function sr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Li(e) {
  return e.tag === "g" ? e.children : [e];
}
var Di = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? At(n.split(" ").map((o) => o.trim())) : no();
        return r.prefix || (r.prefix = Te()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
      }
    };
  },
  provides(e) {
    e.generateAbstractMask = function(t) {
      let {
        children: n,
        attributes: r,
        main: o,
        mask: a,
        maskId: i,
        transform: s
      } = t;
      const {
        width: l,
        icon: c
      } = o, {
        width: f,
        icon: u
      } = a, p = _a({
        transform: s,
        containerWidth: f,
        iconWidth: l
      }), y = {
        tag: "rect",
        attributes: h(h({}, jt), {}, {
          fill: "white"
        })
      }, x = c.children ? {
        children: c.children.map(sr)
      } : {}, g = {
        tag: "g",
        attributes: h({}, p.inner),
        children: [sr(h({
          tag: c.tag,
          attributes: h(h({}, c.attributes), p.path)
        }, x))]
      }, d = {
        tag: "g",
        attributes: h({}, p.outer),
        children: [g]
      }, w = "mask-".concat(i || nt()), S = "clip-".concat(i || nt()), k = {
        tag: "mask",
        attributes: h(h({}, jt), {}, {
          id: w,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [y, d]
      }, A = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: S
          },
          children: Li(u)
        }, k]
      };
      return n.push(A, {
        tag: "rect",
        attributes: h({
          fill: "currentColor",
          "clip-path": "url(#".concat(S, ")"),
          mask: "url(#".concat(w, ")")
        }, jt)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, $i = {
  provides(e) {
    let t = !1;
    Oe.matchMedia && (t = Oe.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, o = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: h(h({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const a = h(h({}, o), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: h(h({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
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
      }), n.push(i), n.push({
        tag: "path",
        attributes: h(h({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: h(h({}, a), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: h(h({}, r), {}, {
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
        children: n
      };
    };
  }
}, Wi = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Yi = [Ma, Si, Pi, Ci, Oi, ji, Fi, zi, Di, $i, Wi];
Za(Yi, {
  mixoutsTo: le
});
le.noAuto;
le.config;
le.library;
le.dom;
const fn = le.parse;
le.findIconDefinition;
le.toHtml;
const Gi = le.icon;
le.layer;
le.text;
le.counter;
function Ui(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ct = { exports: {} }, ft = { exports: {} }, $ = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var lr;
function qi() {
  if (lr) return $;
  lr = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, p = e ? Symbol.for("react.suspense_list") : 60120, y = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, g = e ? Symbol.for("react.block") : 60121, d = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, S = e ? Symbol.for("react.scope") : 60119;
  function k(m) {
    if (typeof m == "object" && m !== null) {
      var H = m.$$typeof;
      switch (H) {
        case t:
          switch (m = m.type, m) {
            case l:
            case c:
            case r:
            case a:
            case o:
            case u:
              return m;
            default:
              switch (m = m && m.$$typeof, m) {
                case s:
                case f:
                case x:
                case y:
                case i:
                  return m;
                default:
                  return H;
              }
          }
        case n:
          return H;
      }
    }
  }
  function A(m) {
    return k(m) === c;
  }
  return $.AsyncMode = l, $.ConcurrentMode = c, $.ContextConsumer = s, $.ContextProvider = i, $.Element = t, $.ForwardRef = f, $.Fragment = r, $.Lazy = x, $.Memo = y, $.Portal = n, $.Profiler = a, $.StrictMode = o, $.Suspense = u, $.isAsyncMode = function(m) {
    return A(m) || k(m) === l;
  }, $.isConcurrentMode = A, $.isContextConsumer = function(m) {
    return k(m) === s;
  }, $.isContextProvider = function(m) {
    return k(m) === i;
  }, $.isElement = function(m) {
    return typeof m == "object" && m !== null && m.$$typeof === t;
  }, $.isForwardRef = function(m) {
    return k(m) === f;
  }, $.isFragment = function(m) {
    return k(m) === r;
  }, $.isLazy = function(m) {
    return k(m) === x;
  }, $.isMemo = function(m) {
    return k(m) === y;
  }, $.isPortal = function(m) {
    return k(m) === n;
  }, $.isProfiler = function(m) {
    return k(m) === a;
  }, $.isStrictMode = function(m) {
    return k(m) === o;
  }, $.isSuspense = function(m) {
    return k(m) === u;
  }, $.isValidElementType = function(m) {
    return typeof m == "string" || typeof m == "function" || m === r || m === c || m === a || m === o || m === u || m === p || typeof m == "object" && m !== null && (m.$$typeof === x || m.$$typeof === y || m.$$typeof === i || m.$$typeof === s || m.$$typeof === f || m.$$typeof === d || m.$$typeof === w || m.$$typeof === S || m.$$typeof === g);
  }, $.typeOf = k, $;
}
var W = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var cr;
function Hi() {
  return cr || (cr = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, o = e ? Symbol.for("react.strict_mode") : 60108, a = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, p = e ? Symbol.for("react.suspense_list") : 60120, y = e ? Symbol.for("react.memo") : 60115, x = e ? Symbol.for("react.lazy") : 60116, g = e ? Symbol.for("react.block") : 60121, d = e ? Symbol.for("react.fundamental") : 60117, w = e ? Symbol.for("react.responder") : 60118, S = e ? Symbol.for("react.scope") : 60119;
    function k(E) {
      return typeof E == "string" || typeof E == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      E === r || E === c || E === a || E === o || E === u || E === p || typeof E == "object" && E !== null && (E.$$typeof === x || E.$$typeof === y || E.$$typeof === i || E.$$typeof === s || E.$$typeof === f || E.$$typeof === d || E.$$typeof === w || E.$$typeof === S || E.$$typeof === g);
    }
    function A(E) {
      if (typeof E == "object" && E !== null) {
        var fe = E.$$typeof;
        switch (fe) {
          case t:
            var it = E.type;
            switch (it) {
              case l:
              case c:
              case r:
              case a:
              case o:
              case u:
                return it;
              default:
                var Mn = it && it.$$typeof;
                switch (Mn) {
                  case s:
                  case f:
                  case x:
                  case y:
                  case i:
                    return Mn;
                  default:
                    return fe;
                }
            }
          case n:
            return fe;
        }
      }
    }
    var m = l, H = c, Y = s, re = i, oe = t, V = f, J = r, C = x, ae = y, X = n, se = a, B = o, Z = u, Q = !1;
    function K(E) {
      return Q || (Q = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), b(E) || A(E) === l;
    }
    function b(E) {
      return A(E) === c;
    }
    function v(E) {
      return A(E) === s;
    }
    function j(E) {
      return A(E) === i;
    }
    function O(E) {
      return typeof E == "object" && E !== null && E.$$typeof === t;
    }
    function T(E) {
      return A(E) === f;
    }
    function M(E) {
      return A(E) === r;
    }
    function R(E) {
      return A(E) === x;
    }
    function N(E) {
      return A(E) === y;
    }
    function F(E) {
      return A(E) === n;
    }
    function L(E) {
      return A(E) === a;
    }
    function D(E) {
      return A(E) === o;
    }
    function ie(E) {
      return A(E) === u;
    }
    W.AsyncMode = m, W.ConcurrentMode = H, W.ContextConsumer = Y, W.ContextProvider = re, W.Element = oe, W.ForwardRef = V, W.Fragment = J, W.Lazy = C, W.Memo = ae, W.Portal = X, W.Profiler = se, W.StrictMode = B, W.Suspense = Z, W.isAsyncMode = K, W.isConcurrentMode = b, W.isContextConsumer = v, W.isContextProvider = j, W.isElement = O, W.isForwardRef = T, W.isFragment = M, W.isLazy = R, W.isMemo = N, W.isPortal = F, W.isProfiler = L, W.isStrictMode = D, W.isSuspense = ie, W.isValidElementType = k, W.typeOf = A;
  }()), W;
}
var fr;
function co() {
  return fr || (fr = 1, process.env.NODE_ENV === "production" ? ft.exports = qi() : ft.exports = Hi()), ft.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var Ft, ur;
function Vi() {
  if (ur) return Ft;
  ur = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, n = Object.prototype.propertyIsEnumerable;
  function r(a) {
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
      var l = Object.getOwnPropertyNames(i).map(function(f) {
        return i[f];
      });
      if (l.join("") !== "0123456789")
        return !1;
      var c = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(f) {
        c[f] = f;
      }), Object.keys(Object.assign({}, c)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return Ft = o() ? Object.assign : function(a, i) {
    for (var s, l = r(a), c, f = 1; f < arguments.length; f++) {
      s = Object(arguments[f]);
      for (var u in s)
        t.call(s, u) && (l[u] = s[u]);
      if (e) {
        c = e(s);
        for (var p = 0; p < c.length; p++)
          n.call(s, c[p]) && (l[c[p]] = s[c[p]]);
      }
    }
    return l;
  }, Ft;
}
var zt, dr;
function Tn() {
  if (dr) return zt;
  dr = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return zt = e, zt;
}
var Lt, pr;
function fo() {
  return pr || (pr = 1, Lt = Function.call.bind(Object.prototype.hasOwnProperty)), Lt;
}
var Dt, mr;
function Bi() {
  if (mr) return Dt;
  mr = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Tn(), n = {}, r = /* @__PURE__ */ fo();
    e = function(a) {
      var i = "Warning: " + a;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function o(a, i, s, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var f in a)
        if (r(a, f)) {
          var u;
          try {
            if (typeof a[f] != "function") {
              var p = Error(
                (l || "React class") + ": " + s + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof a[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw p.name = "Invariant Violation", p;
            }
            u = a[f](i, f, l, s, null, t);
          } catch (x) {
            u = x;
          }
          if (u && !(u instanceof Error) && e(
            (l || "React class") + ": type specification of " + s + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof u + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), u instanceof Error && !(u.message in n)) {
            n[u.message] = !0;
            var y = c ? c() : "";
            e(
              "Failed " + s + " type: " + u.message + (y ?? "")
            );
          }
        }
    }
  }
  return o.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, Dt = o, Dt;
}
var $t, gr;
function Xi() {
  if (gr) return $t;
  gr = 1;
  var e = co(), t = Vi(), n = /* @__PURE__ */ Tn(), r = /* @__PURE__ */ fo(), o = /* @__PURE__ */ Bi(), a = function() {
  };
  process.env.NODE_ENV !== "production" && (a = function(s) {
    var l = "Warning: " + s;
    typeof console < "u" && console.error(l);
    try {
      throw new Error(l);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return $t = function(s, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function u(b) {
      var v = b && (c && b[c] || b[f]);
      if (typeof v == "function")
        return v;
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
      any: S(),
      arrayOf: k,
      element: A(),
      elementType: m(),
      instanceOf: H,
      node: V(),
      objectOf: re,
      oneOf: Y,
      oneOfType: oe,
      shape: C,
      exact: ae
    };
    function x(b, v) {
      return b === v ? b !== 0 || 1 / b === 1 / v : b !== b && v !== v;
    }
    function g(b, v) {
      this.message = b, this.data = v && typeof v == "object" ? v : {}, this.stack = "";
    }
    g.prototype = Error.prototype;
    function d(b) {
      if (process.env.NODE_ENV !== "production")
        var v = {}, j = 0;
      function O(M, R, N, F, L, D, ie) {
        if (F = F || p, D = D || N, ie !== n) {
          if (l) {
            var E = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw E.name = "Invariant Violation", E;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var fe = F + ":" + N;
            !v[fe] && // Avoid spamming the console because they are often not actionable except for lib authors
            j < 3 && (a(
              "You are manually calling a React.PropTypes validation function for the `" + D + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), v[fe] = !0, j++);
          }
        }
        return R[N] == null ? M ? R[N] === null ? new g("The " + L + " `" + D + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new g("The " + L + " `" + D + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : b(R, N, F, L, D);
      }
      var T = O.bind(null, !1);
      return T.isRequired = O.bind(null, !0), T;
    }
    function w(b) {
      function v(j, O, T, M, R, N) {
        var F = j[O], L = B(F);
        if (L !== b) {
          var D = Z(F);
          return new g(
            "Invalid " + M + " `" + R + "` of type " + ("`" + D + "` supplied to `" + T + "`, expected ") + ("`" + b + "`."),
            { expectedType: b }
          );
        }
        return null;
      }
      return d(v);
    }
    function S() {
      return d(i);
    }
    function k(b) {
      function v(j, O, T, M, R) {
        if (typeof b != "function")
          return new g("Property `" + R + "` of component `" + T + "` has invalid PropType notation inside arrayOf.");
        var N = j[O];
        if (!Array.isArray(N)) {
          var F = B(N);
          return new g("Invalid " + M + " `" + R + "` of type " + ("`" + F + "` supplied to `" + T + "`, expected an array."));
        }
        for (var L = 0; L < N.length; L++) {
          var D = b(N, L, T, M, R + "[" + L + "]", n);
          if (D instanceof Error)
            return D;
        }
        return null;
      }
      return d(v);
    }
    function A() {
      function b(v, j, O, T, M) {
        var R = v[j];
        if (!s(R)) {
          var N = B(R);
          return new g("Invalid " + T + " `" + M + "` of type " + ("`" + N + "` supplied to `" + O + "`, expected a single ReactElement."));
        }
        return null;
      }
      return d(b);
    }
    function m() {
      function b(v, j, O, T, M) {
        var R = v[j];
        if (!e.isValidElementType(R)) {
          var N = B(R);
          return new g("Invalid " + T + " `" + M + "` of type " + ("`" + N + "` supplied to `" + O + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return d(b);
    }
    function H(b) {
      function v(j, O, T, M, R) {
        if (!(j[O] instanceof b)) {
          var N = b.name || p, F = K(j[O]);
          return new g("Invalid " + M + " `" + R + "` of type " + ("`" + F + "` supplied to `" + T + "`, expected ") + ("instance of `" + N + "`."));
        }
        return null;
      }
      return d(v);
    }
    function Y(b) {
      if (!Array.isArray(b))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? a(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : a("Invalid argument supplied to oneOf, expected an array.")), i;
      function v(j, O, T, M, R) {
        for (var N = j[O], F = 0; F < b.length; F++)
          if (x(N, b[F]))
            return null;
        var L = JSON.stringify(b, function(ie, E) {
          var fe = Z(E);
          return fe === "symbol" ? String(E) : E;
        });
        return new g("Invalid " + M + " `" + R + "` of value `" + String(N) + "` " + ("supplied to `" + T + "`, expected one of " + L + "."));
      }
      return d(v);
    }
    function re(b) {
      function v(j, O, T, M, R) {
        if (typeof b != "function")
          return new g("Property `" + R + "` of component `" + T + "` has invalid PropType notation inside objectOf.");
        var N = j[O], F = B(N);
        if (F !== "object")
          return new g("Invalid " + M + " `" + R + "` of type " + ("`" + F + "` supplied to `" + T + "`, expected an object."));
        for (var L in N)
          if (r(N, L)) {
            var D = b(N, L, T, M, R + "." + L, n);
            if (D instanceof Error)
              return D;
          }
        return null;
      }
      return d(v);
    }
    function oe(b) {
      if (!Array.isArray(b))
        return process.env.NODE_ENV !== "production" && a("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var v = 0; v < b.length; v++) {
        var j = b[v];
        if (typeof j != "function")
          return a(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + Q(j) + " at index " + v + "."
          ), i;
      }
      function O(T, M, R, N, F) {
        for (var L = [], D = 0; D < b.length; D++) {
          var ie = b[D], E = ie(T, M, R, N, F, n);
          if (E == null)
            return null;
          E.data && r(E.data, "expectedType") && L.push(E.data.expectedType);
        }
        var fe = L.length > 0 ? ", expected one of type [" + L.join(", ") + "]" : "";
        return new g("Invalid " + N + " `" + F + "` supplied to " + ("`" + R + "`" + fe + "."));
      }
      return d(O);
    }
    function V() {
      function b(v, j, O, T, M) {
        return X(v[j]) ? null : new g("Invalid " + T + " `" + M + "` supplied to " + ("`" + O + "`, expected a ReactNode."));
      }
      return d(b);
    }
    function J(b, v, j, O, T) {
      return new g(
        (b || "React class") + ": " + v + " type `" + j + "." + O + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + T + "`."
      );
    }
    function C(b) {
      function v(j, O, T, M, R) {
        var N = j[O], F = B(N);
        if (F !== "object")
          return new g("Invalid " + M + " `" + R + "` of type `" + F + "` " + ("supplied to `" + T + "`, expected `object`."));
        for (var L in b) {
          var D = b[L];
          if (typeof D != "function")
            return J(T, M, R, L, Z(D));
          var ie = D(N, L, T, M, R + "." + L, n);
          if (ie)
            return ie;
        }
        return null;
      }
      return d(v);
    }
    function ae(b) {
      function v(j, O, T, M, R) {
        var N = j[O], F = B(N);
        if (F !== "object")
          return new g("Invalid " + M + " `" + R + "` of type `" + F + "` " + ("supplied to `" + T + "`, expected `object`."));
        var L = t({}, j[O], b);
        for (var D in L) {
          var ie = b[D];
          if (r(b, D) && typeof ie != "function")
            return J(T, M, R, D, Z(ie));
          if (!ie)
            return new g(
              "Invalid " + M + " `" + R + "` key `" + D + "` supplied to `" + T + "`.\nBad object: " + JSON.stringify(j[O], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(b), null, "  ")
            );
          var E = ie(N, D, T, M, R + "." + D, n);
          if (E)
            return E;
        }
        return null;
      }
      return d(v);
    }
    function X(b) {
      switch (typeof b) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !b;
        case "object":
          if (Array.isArray(b))
            return b.every(X);
          if (b === null || s(b))
            return !0;
          var v = u(b);
          if (v) {
            var j = v.call(b), O;
            if (v !== b.entries) {
              for (; !(O = j.next()).done; )
                if (!X(O.value))
                  return !1;
            } else
              for (; !(O = j.next()).done; ) {
                var T = O.value;
                if (T && !X(T[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function se(b, v) {
      return b === "symbol" ? !0 : v ? v["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && v instanceof Symbol : !1;
    }
    function B(b) {
      var v = typeof b;
      return Array.isArray(b) ? "array" : b instanceof RegExp ? "object" : se(v, b) ? "symbol" : v;
    }
    function Z(b) {
      if (typeof b > "u" || b === null)
        return "" + b;
      var v = B(b);
      if (v === "object") {
        if (b instanceof Date)
          return "date";
        if (b instanceof RegExp)
          return "regexp";
      }
      return v;
    }
    function Q(b) {
      var v = Z(b);
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
    function K(b) {
      return !b.constructor || !b.constructor.name ? p : b.constructor.name;
    }
    return y.checkPropTypes = o, y.resetWarningCache = o.resetWarningCache, y.PropTypes = y, y;
  }, $t;
}
var Wt, br;
function Ki() {
  if (br) return Wt;
  br = 1;
  var e = /* @__PURE__ */ Tn();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, Wt = function() {
    function r(i, s, l, c, f, u) {
      if (u !== e) {
        var p = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw p.name = "Invariant Violation", p;
      }
    }
    r.isRequired = r;
    function o() {
      return r;
    }
    var a = {
      array: r,
      bigint: r,
      bool: r,
      func: r,
      number: r,
      object: r,
      string: r,
      symbol: r,
      any: r,
      arrayOf: o,
      element: r,
      elementType: r,
      instanceOf: o,
      node: r,
      objectOf: o,
      oneOf: o,
      oneOfType: o,
      shape: o,
      exact: o,
      checkPropTypes: n,
      resetWarningCache: t
    };
    return a.PropTypes = a, a;
  }, Wt;
}
var hr;
function Ji() {
  if (hr) return ct.exports;
  if (hr = 1, process.env.NODE_ENV !== "production") {
    var e = co(), t = !0;
    ct.exports = /* @__PURE__ */ Xi()(e.isElement, t);
  } else
    ct.exports = /* @__PURE__ */ Ki()();
  return ct.exports;
}
var Zi = /* @__PURE__ */ Ji();
const z = /* @__PURE__ */ Ui(Zi);
function yr(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(o) {
      return Object.getOwnPropertyDescriptor(e, o).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function de(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? yr(Object(n), !0).forEach(function(r) {
      $e(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : yr(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function yt(e) {
  "@babel/helpers - typeof";
  return yt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, yt(e);
}
function $e(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Qi(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), o, a;
  for (a = 0; a < r.length; a++)
    o = r[a], !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function es(e, t) {
  if (e == null) return {};
  var n = Qi(e, t), r, o;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(e);
    for (o = 0; o < a.length; o++)
      r = a[o], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function un(e) {
  return ts(e) || ns(e) || rs(e) || os();
}
function ts(e) {
  if (Array.isArray(e)) return dn(e);
}
function ns(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function rs(e, t) {
  if (e) {
    if (typeof e == "string") return dn(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return dn(e, t);
  }
}
function dn(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function os() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function as(e) {
  var t, n = e.beat, r = e.fade, o = e.beatFade, a = e.bounce, i = e.shake, s = e.flash, l = e.spin, c = e.spinPulse, f = e.spinReverse, u = e.pulse, p = e.fixedWidth, y = e.inverse, x = e.border, g = e.listItem, d = e.flip, w = e.size, S = e.rotation, k = e.pull, A = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": o,
    "fa-bounce": a,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": l,
    "fa-spin-reverse": f,
    "fa-spin-pulse": c,
    "fa-pulse": u,
    "fa-fw": p,
    "fa-inverse": y,
    "fa-border": x,
    "fa-li": g,
    "fa-flip": d === !0,
    "fa-flip-horizontal": d === "horizontal" || d === "both",
    "fa-flip-vertical": d === "vertical" || d === "both"
  }, $e(t, "fa-".concat(w), typeof w < "u" && w !== null), $e(t, "fa-rotate-".concat(S), typeof S < "u" && S !== null && S !== 0), $e(t, "fa-pull-".concat(k), typeof k < "u" && k !== null), $e(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(A).map(function(m) {
    return A[m] ? m : null;
  }).filter(function(m) {
    return m;
  });
}
function is(e) {
  return e = e - 0, e === e;
}
function uo(e) {
  return is(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var ss = ["style"];
function ls(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function cs(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), o = uo(n.slice(0, r)), a = n.slice(r + 1).trim();
    return o.startsWith("webkit") ? t[ls(o)] = a : t[o] = a, t;
  }, {});
}
function po(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return po(e, l);
  }), o = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var f = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = cs(f);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = f : l.attrs[uo(c)] = f;
    }
    return l;
  }, {
    attrs: {}
  }), a = n.style, i = a === void 0 ? {} : a, s = es(n, ss);
  return o.attrs.style = de(de({}, o.attrs.style), i), e.apply(void 0, [t.tag, de(de({}, o.attrs), s)].concat(un(r)));
}
var mo = !1;
try {
  mo = process.env.NODE_ENV === "production";
} catch {
}
function fs() {
  if (!mo && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function vr(e) {
  if (e && yt(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (fn.icon)
    return fn.icon(e);
  if (e === null)
    return null;
  if (e && yt(e) === "object" && e.prefix && e.iconName)
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
function Yt(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? $e({}, e, t) : {};
}
var xr = {
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
}, vt = /* @__PURE__ */ ne.forwardRef(function(e, t) {
  var n = de(de({}, xr), e), r = n.icon, o = n.mask, a = n.symbol, i = n.className, s = n.title, l = n.titleId, c = n.maskId, f = vr(r), u = Yt("classes", [].concat(un(as(n)), un((i || "").split(" ")))), p = Yt("transform", typeof n.transform == "string" ? fn.transform(n.transform) : n.transform), y = Yt("mask", vr(o)), x = Gi(f, de(de(de(de({}, u), p), y), {}, {
    symbol: a,
    title: s,
    titleId: l,
    maskId: c
  }));
  if (!x)
    return fs("Could not find icon", f), null;
  var g = x.abstract, d = {
    ref: t
  };
  return Object.keys(n).forEach(function(w) {
    xr.hasOwnProperty(w) || (d[w] = n[w]);
  }), us(g[0], d);
});
vt.displayName = "FontAwesomeIcon";
vt.propTypes = {
  beat: z.bool,
  border: z.bool,
  beatFade: z.bool,
  bounce: z.bool,
  className: z.string,
  fade: z.bool,
  flash: z.bool,
  mask: z.oneOfType([z.object, z.array, z.string]),
  maskId: z.string,
  fixedWidth: z.bool,
  inverse: z.bool,
  flip: z.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: z.oneOfType([z.object, z.array, z.string]),
  listItem: z.bool,
  pull: z.oneOf(["right", "left"]),
  pulse: z.bool,
  rotation: z.oneOf([0, 90, 180, 270]),
  shake: z.bool,
  size: z.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: z.bool,
  spinPulse: z.bool,
  spinReverse: z.bool,
  symbol: z.oneOfType([z.bool, z.string]),
  title: z.string,
  titleId: z.string,
  transform: z.oneOfType([z.string, z.object]),
  swapOpacity: z.bool
};
var us = po.bind(null, ne.createElement);
const In = "-", ds = (e) => {
  const t = ms(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(In);
      return s[0] === "" && s.length !== 1 && s.shift(), go(s, t) || ps(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const l = n[i] || [];
      return s && r[i] ? [...l, ...r[i]] : l;
    }
  };
}, go = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), o = r ? go(e.slice(1), r) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const a = e.join(In);
  return (i = t.validators.find(({
    validator: s
  }) => s(a))) == null ? void 0 : i.classGroupId;
}, wr = /^\[(.+)\]$/, ps = (e) => {
  if (wr.test(e)) {
    const t = wr.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, ms = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return bs(Object.entries(e.classGroups), n).forEach(([a, i]) => {
    pn(i, r, a, t);
  }), r;
}, pn = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Er(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (gs(o)) {
        pn(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      pn(i, Er(t, a), n, r);
    });
  });
}, Er = (e, t) => {
  let n = e;
  return t.split(In).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, gs = (e) => e.isThemeGetter, bs = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, hs = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    n.set(a, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = n.get(a);
      if (i !== void 0)
        return i;
      if ((i = r.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      n.has(a) ? n.set(a, i) : o(a, i);
    }
  };
}, bo = "!", ys = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const l = [];
    let c = 0, f = 0, u;
    for (let d = 0; d < s.length; d++) {
      let w = s[d];
      if (c === 0) {
        if (w === o && (r || s.slice(d, d + a) === t)) {
          l.push(s.slice(f, d)), f = d + a;
          continue;
        }
        if (w === "/") {
          u = d;
          continue;
        }
      }
      w === "[" ? c++ : w === "]" && c--;
    }
    const p = l.length === 0 ? s : s.substring(f), y = p.startsWith(bo), x = y ? p.substring(1) : p, g = u && u > f ? u - f : void 0;
    return {
      modifiers: l,
      hasImportantModifier: y,
      baseClassName: x,
      maybePostfixModifierPosition: g
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, vs = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, xs = (e) => ({
  cache: hs(e.cacheSize),
  parseClassName: ys(e),
  ...ds(e)
}), ws = /\s+/, Es = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(ws);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: f,
      hasImportantModifier: u,
      baseClassName: p,
      maybePostfixModifierPosition: y
    } = n(c);
    let x = !!y, g = r(x ? p.substring(0, y) : p);
    if (!g) {
      if (!x) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (g = r(p), !g) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const d = vs(f).join(":"), w = u ? d + bo : d, S = w + g;
    if (a.includes(S))
      continue;
    a.push(S);
    const k = o(g, x);
    for (let A = 0; A < k.length; ++A) {
      const m = k[A];
      a.push(w + m);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function ks() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = ho(t)) && (r && (r += " "), r += n);
  return r;
}
const ho = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = ho(e[r])) && (n && (n += " "), n += t);
  return n;
};
function As(e, ...t) {
  let n, r, o, a = i;
  function i(l) {
    const c = t.reduce((f, u) => u(f), e());
    return n = xs(c), r = n.cache.get, o = n.cache.set, a = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const f = Es(l, n);
    return o(l, f), f;
  }
  return function() {
    return a(ks.apply(null, arguments));
  };
}
const G = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, yo = /^\[(?:([a-z-]+):)?(.+)\]$/i, Ss = /^\d+\/\d+$/, Ps = /* @__PURE__ */ new Set(["px", "full", "screen"]), Cs = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Os = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Ts = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Is = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, _s = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, ge = (e) => Ye(e) || Ps.has(e) || Ss.test(e), Ee = (e) => He(e, "length", Ds), Ye = (e) => !!e && !Number.isNaN(Number(e)), Gt = (e) => He(e, "number", Ye), Be = (e) => !!e && Number.isInteger(Number(e)), Ns = (e) => e.endsWith("%") && Ye(e.slice(0, -1)), I = (e) => yo.test(e), ke = (e) => Cs.test(e), Rs = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Ms = (e) => He(e, Rs, vo), js = (e) => He(e, "position", vo), Fs = /* @__PURE__ */ new Set(["image", "url"]), zs = (e) => He(e, Fs, Ws), Ls = (e) => He(e, "", $s), Xe = () => !0, He = (e, t, n) => {
  const r = yo.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Ds = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Os.test(e) && !Ts.test(e)
), vo = () => !1, $s = (e) => Is.test(e), Ws = (e) => _s.test(e), Ys = () => {
  const e = G("colors"), t = G("spacing"), n = G("blur"), r = G("brightness"), o = G("borderColor"), a = G("borderRadius"), i = G("borderSpacing"), s = G("borderWidth"), l = G("contrast"), c = G("grayscale"), f = G("hueRotate"), u = G("invert"), p = G("gap"), y = G("gradientColorStops"), x = G("gradientColorStopPositions"), g = G("inset"), d = G("margin"), w = G("opacity"), S = G("padding"), k = G("saturate"), A = G("scale"), m = G("sepia"), H = G("skew"), Y = G("space"), re = G("translate"), oe = () => ["auto", "contain", "none"], V = () => ["auto", "hidden", "clip", "visible", "scroll"], J = () => ["auto", I, t], C = () => [I, t], ae = () => ["", ge, Ee], X = () => ["auto", Ye, I], se = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], B = () => ["solid", "dashed", "dotted", "double", "none"], Z = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], Q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], K = () => ["", "0", I], b = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Ye, I];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Xe],
      spacing: [ge, Ee],
      blur: ["none", "", ke, I],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", ke, I],
      borderSpacing: C(),
      borderWidth: ae(),
      contrast: v(),
      grayscale: K(),
      hueRotate: v(),
      invert: K(),
      gap: C(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Ns, Ee],
      inset: J(),
      margin: J(),
      opacity: v(),
      padding: C(),
      saturate: v(),
      scale: v(),
      sepia: K(),
      skew: v(),
      space: C(),
      translate: C()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", I]
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
        columns: [ke]
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
        object: [...se(), I]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: V()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": V()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": V()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: oe()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": oe()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": oe()
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
        inset: [g]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [g]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [g]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [g]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [g]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [g]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [g]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [g]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [g]
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
        z: ["auto", Be, I]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: J()
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
        flex: ["1", "auto", "initial", "none", I]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: K()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: K()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Be, I]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Xe]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Be, I]
        }, I]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": X()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": X()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Xe]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Be, I]
        }, I]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": X()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": X()
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
        "auto-cols": ["auto", "min", "max", "fr", I]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", I]
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
        p: [S]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [S]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [S]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [S]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [S]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [S]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [S]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [S]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [S]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [d]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [d]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [d]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [d]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [d]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [d]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [d]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [d]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [d]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [Y]
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
        "space-y": [Y]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", I, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [I, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [I, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [ke]
        }, ke]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [I, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [I, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [I, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [I, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", ke, Ee]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Gt]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Xe]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", I]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Ye, Gt]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", ge, I]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", I]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", I]
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
        decoration: [...B(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", ge, Ee]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", ge, I]
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
        indent: C()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", I]
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
        content: ["none", I]
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
        bg: [...se(), js]
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
        bg: ["auto", "cover", "contain", Ms]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, zs]
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
        "border-opacity": [w]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...B(), "hidden"]
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
        "divide-opacity": [w]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: B()
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
        outline: ["", ...B()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [ge, I]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [ge, Ee]
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
        ring: ae()
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
        "ring-offset": [ge, Ee]
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
        shadow: ["", "inner", "none", ke, Ls]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Xe]
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
        "mix-blend": [...Z(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Z()
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
        contrast: [l]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", ke, I]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [u]
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
        sepia: [m]
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
        "backdrop-hue-rotate": [f]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [u]
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
        "backdrop-saturate": [k]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [m]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", I]
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
        ease: ["linear", "in", "out", "in-out", I]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", I]
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
        rotate: [Be, I]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [re]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [re]
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
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", I]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", I]
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
        "scroll-m": C()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": C()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": C()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": C()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": C()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": C()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": C()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": C()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": C()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": C()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": C()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": C()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": C()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": C()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": C()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": C()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": C()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": C()
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
        "will-change": ["auto", "scroll", "contents", "transform", I]
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
        stroke: [ge, Ee, Gt]
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
}, kr = /* @__PURE__ */ As(Ys);
var Gs = Object.defineProperty, Us = (e, t, n) => t in e ? Gs(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, Ut = (e, t, n) => (Us(e, typeof t != "symbol" ? t + "" : t, n), n);
let qs = class {
  constructor() {
    Ut(this, "current", this.detect()), Ut(this, "handoffState", "pending"), Ut(this, "currentId", 0);
  }
  set(e) {
    this.current !== e && (this.handoffState = "pending", this.currentId = 0, this.current = e);
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
}, mt = new qs();
function Hs(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Pt() {
  let e = [], t = { addEventListener(n, r, o, a) {
    return n.addEventListener(r, o, a), t.add(() => n.removeEventListener(r, o, a));
  }, requestAnimationFrame(...n) {
    let r = requestAnimationFrame(...n);
    return t.add(() => cancelAnimationFrame(r));
  }, nextFrame(...n) {
    return t.requestAnimationFrame(() => t.requestAnimationFrame(...n));
  }, setTimeout(...n) {
    let r = setTimeout(...n);
    return t.add(() => clearTimeout(r));
  }, microTask(...n) {
    let r = { current: !0 };
    return Hs(() => {
      r.current && n[0]();
    }), t.add(() => {
      r.current = !1;
    });
  }, style(n, r, o) {
    let a = n.style.getPropertyValue(r);
    return Object.assign(n.style, { [r]: o }), this.add(() => {
      Object.assign(n.style, { [r]: a });
    });
  }, group(n) {
    let r = Pt();
    return n(r), this.add(() => r.dispose());
  }, add(n) {
    return e.includes(n) || e.push(n), () => {
      let r = e.indexOf(n);
      if (r >= 0) for (let o of e.splice(r, 1)) o();
    };
  }, dispose() {
    for (let n of e.splice(0)) n();
  } };
  return t;
}
function xo() {
  let [e] = ce(Pt);
  return Fe(() => () => e.dispose(), [e]), e;
}
let Ce = (e, t) => {
  mt.isServer ? Fe(e, t) : Do(e, t);
};
function wo(e) {
  let t = ee(e);
  return Ce(() => {
    t.current = e;
  }, [e]), t;
}
let he = function(e) {
  let t = wo(e);
  return ne.useCallback((...n) => t.current(...n), [t]);
};
function mn(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function Ct(e, t, ...n) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...n) : o;
  }
  let r = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(r, Ct), r;
}
var Eo = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(Eo || {}), Pe = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(Pe || {});
function ko() {
  let e = Bs();
  return Ne((t) => Vs({ mergeRefs: e, ...t }), [e]);
}
function Vs({ ourProps: e, theirProps: t, slot: n, defaultTag: r, features: o, visible: a = !0, name: i, mergeRefs: s }) {
  s = s ?? Xs;
  let l = Ao(t, e);
  if (a) return ut(l, n, r, i, s);
  let c = o ?? 0;
  if (c & 2) {
    let { static: f = !1, ...u } = l;
    if (f) return ut(u, n, r, i, s);
  }
  if (c & 1) {
    let { unmount: f = !0, ...u } = l;
    return Ct(f ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return ut({ ...u, hidden: !0, style: { display: "none" } }, n, r, i, s);
    } });
  }
  return ut(l, n, r, i, s);
}
function ut(e, t = {}, n, r, o) {
  let { as: a = n, children: i, refName: s = "ref", ...l } = qt(e, ["unmount", "static"]), c = e.ref !== void 0 ? { [s]: e.ref } : {}, f = typeof i == "function" ? i(t) : i;
  "className" in l && l.className && typeof l.className == "function" && (l.className = l.className(t)), l["aria-labelledby"] && l["aria-labelledby"] === l.id && (l["aria-labelledby"] = void 0);
  let u = {};
  if (t) {
    let p = !1, y = [];
    for (let [x, g] of Object.entries(t)) typeof g == "boolean" && (p = !0), g === !0 && y.push(x.replace(/([A-Z])/g, (d) => `-${d.toLowerCase()}`));
    if (p) {
      u["data-headlessui-state"] = y.join(" ");
      for (let x of y) u[`data-${x}`] = "";
    }
  }
  if (a === je && (Object.keys(_e(l)).length > 0 || Object.keys(_e(u)).length > 0)) if (!$o(f) || Array.isArray(f) && f.length > 1) {
    if (Object.keys(_e(l)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${r} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(_e(l)).concat(Object.keys(_e(u))).map((p) => `  - ${p}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((p) => `  - ${p}`).join(`
`)].join(`
`));
  } else {
    let p = f.props, y = p == null ? void 0 : p.className, x = typeof y == "function" ? (...w) => mn(y(...w), l.className) : mn(y, l.className), g = x ? { className: x } : {}, d = Ao(f.props, _e(qt(l, ["ref"])));
    for (let w in u) w in d && delete u[w];
    return Wo(f, Object.assign({}, d, u, c, { ref: o(Ks(f), c.ref) }, g));
  }
  return Yo(a, Object.assign({}, qt(l, ["ref"]), a !== je && c, a !== je && u), f);
}
function Bs() {
  let e = ee([]), t = Ne((n) => {
    for (let r of e.current) r != null && (typeof r == "function" ? r(n) : r.current = n);
  }, []);
  return (...n) => {
    if (!n.every((r) => r == null)) return e.current = n, t;
  };
}
function Xs(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let n of e) n != null && (typeof n == "function" ? n(t) : n.current = t);
  };
}
function Ao(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, n = {};
  for (let r of e) for (let o in r) o.startsWith("on") && typeof r[o] == "function" ? (n[o] != null || (n[o] = []), n[o].push(r[o])) : t[o] = r[o];
  if (t.disabled || t["aria-disabled"]) for (let r in n) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(r) && (n[r] = [(o) => {
    var a;
    return (a = o == null ? void 0 : o.preventDefault) == null ? void 0 : a.call(o);
  }]);
  for (let r in n) Object.assign(t, { [r](o, ...a) {
    let i = n[r];
    for (let s of i) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      s(o, ...a);
    }
  } });
  return t;
}
function _n(e) {
  var t;
  return Object.assign(Lo(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function _e(e) {
  let t = Object.assign({}, e);
  for (let n in t) t[n] === void 0 && delete t[n];
  return t;
}
function qt(e, t = []) {
  let n = Object.assign({}, e);
  for (let r of t) r in n && delete n[r];
  return n;
}
function Ks(e) {
  return ne.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let Js = Symbol();
function So(...e) {
  let t = ee(e);
  Fe(() => {
    t.current = e;
  }, [e]);
  let n = he((r) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(r) : o.current = r);
  });
  return e.every((r) => r == null || (r == null ? void 0 : r[Js])) ? void 0 : n;
}
function Zs(e = 0) {
  let [t, n] = ce(e), r = Ne((l) => n(l), [t]), o = Ne((l) => n((c) => c | l), [t]), a = Ne((l) => (t & l) === l, [t]), i = Ne((l) => n((c) => c & ~l), [n]), s = Ne((l) => n((c) => c ^ l), [n]);
  return { flags: t, setFlag: r, addFlag: o, hasFlag: a, removeFlag: i, toggleFlag: s };
}
var Ar, Sr;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((Ar = process == null ? void 0 : process.env) == null ? void 0 : Ar.NODE_ENV) === "test" && typeof ((Sr = Element == null ? void 0 : Element.prototype) == null ? void 0 : Sr.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var Qs = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(Qs || {});
function el(e) {
  let t = {};
  for (let n in e) e[n] === !0 && (t[`data-${n}`] = "");
  return t;
}
function tl(e, t, n, r) {
  let [o, a] = ce(n), { hasFlag: i, addFlag: s, removeFlag: l } = Zs(e && o ? 3 : 0), c = ee(!1), f = ee(!1), u = xo();
  return Ce(() => {
    var p;
    if (e) {
      if (n && a(!0), !t) {
        n && s(3);
        return;
      }
      return (p = r == null ? void 0 : r.start) == null || p.call(r, n), nl(t, { inFlight: c, prepare() {
        f.current ? f.current = !1 : f.current = c.current, c.current = !0, !f.current && (n ? (s(3), l(4)) : (s(4), l(2)));
      }, run() {
        f.current ? n ? (l(3), s(4)) : (l(4), s(3)) : n ? l(1) : s(1);
      }, done() {
        var y;
        f.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (c.current = !1, l(7), n || a(!1), (y = r == null ? void 0 : r.end) == null || y.call(r, n));
      } });
    }
  }, [e, n, t, u]), e ? [o, { closed: i(1), enter: i(2), leave: i(4), transition: i(2) || i(4) }] : [n, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function nl(e, { prepare: t, run: n, done: r, inFlight: o }) {
  let a = Pt();
  return ol(e, { prepare: t, inFlight: o }), a.nextFrame(() => {
    n(), a.requestAnimationFrame(() => {
      a.add(rl(e, r));
    });
  }), a.dispose;
}
function rl(e, t) {
  var n, r;
  let o = Pt();
  if (!e) return o.dispose;
  let a = !1;
  o.add(() => {
    a = !0;
  });
  let i = (r = (n = e.getAnimations) == null ? void 0 : n.call(e).filter((s) => s instanceof CSSTransition)) != null ? r : [];
  return i.length === 0 ? (t(), o.dispose) : (Promise.allSettled(i.map((s) => s.finished)).then(() => {
    a || t();
  }), o.dispose);
}
function ol(e, { inFlight: t, prepare: n }) {
  if (t != null && t.current) {
    n();
    return;
  }
  let r = e.style.transition;
  e.style.transition = "none", n(), e.offsetHeight, e.style.transition = r;
}
let Nn = hn(null);
Nn.displayName = "OpenClosedContext";
var Me = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(Me || {});
function Po() {
  return xt(Nn);
}
function al({ value: e, children: t }) {
  return ne.createElement(Nn.Provider, { value: e }, t);
}
function il() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in Qe ? ((t) => t.useSyncExternalStore)(Qe)(() => () => {
  }, () => !1, () => !e) : !1;
}
function Co() {
  let e = il(), [t, n] = Qe.useState(mt.isHandoffComplete);
  return t && mt.isHandoffComplete === !1 && n(!1), Qe.useEffect(() => {
    t !== !0 && n(!0);
  }, [t]), Qe.useEffect(() => mt.handoff(), []), e ? !1 : t;
}
function sl() {
  let e = ee(!1);
  return Ce(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function Oo(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : Io) !== je || ne.Children.count(e.children) === 1;
}
let Ot = hn(null);
Ot.displayName = "TransitionContext";
var ll = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(ll || {});
function cl() {
  let e = xt(Ot);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function fl() {
  let e = xt(Tt);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let Tt = hn(null);
Tt.displayName = "NestingContext";
function It(e) {
  return "children" in e ? It(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function To(e, t) {
  let n = wo(e), r = ee([]), o = sl(), a = xo(), i = he((y, x = Pe.Hidden) => {
    let g = r.current.findIndex(({ el: d }) => d === y);
    g !== -1 && (Ct(x, { [Pe.Unmount]() {
      r.current.splice(g, 1);
    }, [Pe.Hidden]() {
      r.current[g].state = "hidden";
    } }), a.microTask(() => {
      var d;
      !It(r) && o.current && ((d = n.current) == null || d.call(n));
    }));
  }), s = he((y) => {
    let x = r.current.find(({ el: g }) => g === y);
    return x ? x.state !== "visible" && (x.state = "visible") : r.current.push({ el: y, state: "visible" }), () => i(y, Pe.Unmount);
  }), l = ee([]), c = ee(Promise.resolve()), f = ee({ enter: [], leave: [] }), u = he((y, x, g) => {
    l.current.splice(0), t && (t.chains.current[x] = t.chains.current[x].filter(([d]) => d !== y)), t == null || t.chains.current[x].push([y, new Promise((d) => {
      l.current.push(d);
    })]), t == null || t.chains.current[x].push([y, new Promise((d) => {
      Promise.all(f.current[x].map(([w, S]) => S)).then(() => d());
    })]), x === "enter" ? c.current = c.current.then(() => t == null ? void 0 : t.wait.current).then(() => g(x)) : g(x);
  }), p = he((y, x, g) => {
    Promise.all(f.current[x].splice(0).map(([d, w]) => w)).then(() => {
      var d;
      (d = l.current.shift()) == null || d();
    }).then(() => g(x));
  });
  return Tr(() => ({ children: r, register: s, unregister: i, onStart: u, onStop: p, wait: c, chains: f }), [s, i, r, u, p, f, c]);
}
let Io = je, _o = Eo.RenderStrategy;
function ul(e, t) {
  var n, r;
  let { transition: o = !0, beforeEnter: a, afterEnter: i, beforeLeave: s, afterLeave: l, enter: c, enterFrom: f, enterTo: u, entered: p, leave: y, leaveFrom: x, leaveTo: g, ...d } = e, [w, S] = ce(null), k = ee(null), A = Oo(e), m = So(...A ? [k, t, S] : t === null ? [] : [t]), H = (n = d.unmount) == null || n ? Pe.Unmount : Pe.Hidden, { show: Y, appear: re, initial: oe } = cl(), [V, J] = ce(Y ? "visible" : "hidden"), C = fl(), { register: ae, unregister: X } = C;
  Ce(() => ae(k), [ae, k]), Ce(() => {
    if (H === Pe.Hidden && k.current) {
      if (Y && V !== "visible") {
        J("visible");
        return;
      }
      return Ct(V, { hidden: () => X(k), visible: () => ae(k) });
    }
  }, [V, k, ae, X, Y, H]);
  let se = Co();
  Ce(() => {
    if (A && se && V === "visible" && k.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [k, V, se, A]);
  let B = oe && !re, Z = re && Y && oe, Q = ee(!1), K = To(() => {
    Q.current || (J("hidden"), X(k));
  }, C), b = he((N) => {
    Q.current = !0;
    let F = N ? "enter" : "leave";
    K.onStart(k, F, (L) => {
      L === "enter" ? a == null || a() : L === "leave" && (s == null || s());
    });
  }), v = he((N) => {
    let F = N ? "enter" : "leave";
    Q.current = !1, K.onStop(k, F, (L) => {
      L === "enter" ? i == null || i() : L === "leave" && (l == null || l());
    }), F === "leave" && !It(K) && (J("hidden"), X(k));
  });
  Fe(() => {
    A && o || (b(Y), v(Y));
  }, [Y, A, o]);
  let j = !(!o || !A || !se || B), [, O] = tl(j, w, Y, { start: b, end: v }), T = _e({ ref: m, className: ((r = mn(d.className, Z && c, Z && f, O.enter && c, O.enter && O.closed && f, O.enter && !O.closed && u, O.leave && y, O.leave && !O.closed && x, O.leave && O.closed && g, !O.transition && Y && p)) == null ? void 0 : r.trim()) || void 0, ...el(O) }), M = 0;
  V === "visible" && (M |= Me.Open), V === "hidden" && (M |= Me.Closed), Y && V === "hidden" && (M |= Me.Opening), !Y && V === "visible" && (M |= Me.Closing);
  let R = ko();
  return ne.createElement(Tt.Provider, { value: K }, ne.createElement(al, { value: M }, R({ ourProps: T, theirProps: d, defaultTag: Io, features: _o, visible: V === "visible", name: "Transition.Child" })));
}
function dl(e, t) {
  let { show: n, appear: r = !1, unmount: o = !0, ...a } = e, i = ee(null), s = Oo(e), l = So(...s ? [i, t] : t === null ? [] : [t]);
  Co();
  let c = Po();
  if (n === void 0 && c !== null && (n = (c & Me.Open) === Me.Open), n === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [f, u] = ce(n ? "visible" : "hidden"), p = To(() => {
    n || u("hidden");
  }), [y, x] = ce(!0), g = ee([n]);
  Ce(() => {
    y !== !1 && g.current[g.current.length - 1] !== n && (g.current.push(n), x(!1));
  }, [g, n]);
  let d = Tr(() => ({ show: n, appear: r, initial: y }), [n, r, y]);
  Ce(() => {
    n ? u("visible") : !It(p) && i.current !== null && u("hidden");
  }, [n, p]);
  let w = { unmount: o }, S = he(() => {
    var m;
    y && x(!1), (m = e.beforeEnter) == null || m.call(e);
  }), k = he(() => {
    var m;
    y && x(!1), (m = e.beforeLeave) == null || m.call(e);
  }), A = ko();
  return ne.createElement(Tt.Provider, { value: p }, ne.createElement(Ot.Provider, { value: d }, A({ ourProps: { ...w, as: je, children: ne.createElement(No, { ref: l, ...w, ...a, beforeEnter: S, beforeLeave: k }) }, theirProps: {}, defaultTag: je, features: _o, visible: f === "visible", name: "Transition" })));
}
function pl(e, t) {
  let n = xt(Ot) !== null, r = Po() !== null;
  return ne.createElement(ne.Fragment, null, !n && r ? ne.createElement(gn, { ref: t, ...e }) : ne.createElement(No, { ref: t, ...e }));
}
let gn = _n(dl), No = _n(ul), ml = _n(pl), gl = Object.assign(gn, { Child: ml, Root: gn });
const Rn = "-", bl = (e) => {
  const t = yl(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (o) => {
      const a = o.split(Rn);
      return a[0] === "" && a.length !== 1 && a.shift(), Ro(a, t) || hl(o);
    },
    getConflictingClassGroupIds: (o, a) => {
      const i = n[o] || [];
      return a && r[o] ? [...i, ...r[o]] : i;
    }
  };
}, Ro = (e, t) => {
  var n;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], o = t.nextPart.get(r), a = o ? Ro(e.slice(1), o) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const i = e.join(Rn);
  return (n = t.validators.find(({
    validator: s
  }) => s(i))) == null ? void 0 : n.classGroupId;
}, Pr = /^\[(.+)\]$/, hl = (e) => {
  if (Pr.test(e)) {
    const t = Pr.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, yl = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return xl(Object.entries(e.classGroups), n).forEach(([o, a]) => {
    bn(a, r, o, t);
  }), r;
}, bn = (e, t, n, r) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const a = o === "" ? t : Cr(t, o);
      a.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (vl(o)) {
        bn(o(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: n
      });
      return;
    }
    Object.entries(o).forEach(([a, i]) => {
      bn(i, Cr(t, a), n, r);
    });
  });
}, Cr = (e, t) => {
  let n = e;
  return t.split(Rn).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, vl = (e) => e.isThemeGetter, xl = (e, t) => t ? e.map(([n, r]) => {
  const o = r.map((a) => typeof a == "string" ? t + a : typeof a == "object" ? Object.fromEntries(Object.entries(a).map(([i, s]) => [t + i, s])) : a);
  return [n, o];
}) : e, wl = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  const o = (a, i) => {
    n.set(a, i), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
  };
  return {
    get(a) {
      let i = n.get(a);
      if (i !== void 0)
        return i;
      if ((i = r.get(a)) !== void 0)
        return o(a, i), i;
    },
    set(a, i) {
      n.has(a) ? n.set(a, i) : o(a, i);
    }
  };
}, Mo = "!", El = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, o = t[0], a = t.length, i = (s) => {
    const l = [];
    let c = 0, f = 0, u;
    for (let d = 0; d < s.length; d++) {
      let w = s[d];
      if (c === 0) {
        if (w === o && (r || s.slice(d, d + a) === t)) {
          l.push(s.slice(f, d)), f = d + a;
          continue;
        }
        if (w === "/") {
          u = d;
          continue;
        }
      }
      w === "[" ? c++ : w === "]" && c--;
    }
    const p = l.length === 0 ? s : s.substring(f), y = p.startsWith(Mo), x = y ? p.substring(1) : p, g = u && u > f ? u - f : void 0;
    return {
      modifiers: l,
      hasImportantModifier: y,
      baseClassName: x,
      maybePostfixModifierPosition: g
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, kl = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, Al = (e) => ({
  cache: wl(e.cacheSize),
  parseClassName: El(e),
  ...bl(e)
}), Sl = /\s+/, Pl = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: o
  } = t, a = [], i = e.trim().split(Sl);
  let s = "";
  for (let l = i.length - 1; l >= 0; l -= 1) {
    const c = i[l], {
      modifiers: f,
      hasImportantModifier: u,
      baseClassName: p,
      maybePostfixModifierPosition: y
    } = n(c);
    let x = !!y, g = r(x ? p.substring(0, y) : p);
    if (!g) {
      if (!x) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (g = r(p), !g) {
        s = c + (s.length > 0 ? " " + s : s);
        continue;
      }
      x = !1;
    }
    const d = kl(f).join(":"), w = u ? d + Mo : d, S = w + g;
    if (a.includes(S))
      continue;
    a.push(S);
    const k = o(g, x);
    for (let A = 0; A < k.length; ++A) {
      const m = k[A];
      a.push(w + m);
    }
    s = c + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Cl() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = jo(t)) && (r && (r += " "), r += n);
  return r;
}
const jo = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = jo(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Ol(e, ...t) {
  let n, r, o, a = i;
  function i(l) {
    const c = t.reduce((f, u) => u(f), e());
    return n = Al(c), r = n.cache.get, o = n.cache.set, a = s, s(l);
  }
  function s(l) {
    const c = r(l);
    if (c)
      return c;
    const f = Pl(l, n);
    return o(l, f), f;
  }
  return function() {
    return a(Cl.apply(null, arguments));
  };
}
const U = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Fo = /^\[(?:([a-z-]+):)?(.+)\]$/i, Tl = /^\d+\/\d+$/, Il = /* @__PURE__ */ new Set(["px", "full", "screen"]), _l = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Nl = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Rl = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Ml = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, jl = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, be = (e) => Ge(e) || Il.has(e) || Tl.test(e), Ae = (e) => Ve(e, "length", Gl), Ge = (e) => !!e && !Number.isNaN(Number(e)), Ht = (e) => Ve(e, "number", Ge), Ke = (e) => !!e && Number.isInteger(Number(e)), Fl = (e) => e.endsWith("%") && Ge(e.slice(0, -1)), _ = (e) => Fo.test(e), Se = (e) => _l.test(e), zl = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Ll = (e) => Ve(e, zl, zo), Dl = (e) => Ve(e, "position", zo), $l = /* @__PURE__ */ new Set(["image", "url"]), Wl = (e) => Ve(e, $l, ql), Yl = (e) => Ve(e, "", Ul), Je = () => !0, Ve = (e, t, n) => {
  const r = Fo.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Gl = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Nl.test(e) && !Rl.test(e)
), zo = () => !1, Ul = (e) => Ml.test(e), ql = (e) => jl.test(e), Hl = () => {
  const e = U("colors"), t = U("spacing"), n = U("blur"), r = U("brightness"), o = U("borderColor"), a = U("borderRadius"), i = U("borderSpacing"), s = U("borderWidth"), l = U("contrast"), c = U("grayscale"), f = U("hueRotate"), u = U("invert"), p = U("gap"), y = U("gradientColorStops"), x = U("gradientColorStopPositions"), g = U("inset"), d = U("margin"), w = U("opacity"), S = U("padding"), k = U("saturate"), A = U("scale"), m = U("sepia"), H = U("skew"), Y = U("space"), re = U("translate"), oe = () => ["auto", "contain", "none"], V = () => ["auto", "hidden", "clip", "visible", "scroll"], J = () => ["auto", _, t], C = () => [_, t], ae = () => ["", be, Ae], X = () => ["auto", Ge, _], se = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], B = () => ["solid", "dashed", "dotted", "double", "none"], Z = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], Q = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], K = () => ["", "0", _], b = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], v = () => [Ge, _];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Je],
      spacing: [be, Ae],
      blur: ["none", "", Se, _],
      brightness: v(),
      borderColor: [e],
      borderRadius: ["none", "", "full", Se, _],
      borderSpacing: C(),
      borderWidth: ae(),
      contrast: v(),
      grayscale: K(),
      hueRotate: v(),
      invert: K(),
      gap: C(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Fl, Ae],
      inset: J(),
      margin: J(),
      opacity: v(),
      padding: C(),
      saturate: v(),
      scale: v(),
      sepia: K(),
      skew: v(),
      space: C(),
      translate: C()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", _]
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
        columns: [Se]
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
        object: [...se(), _]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: V()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": V()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": V()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: oe()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": oe()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": oe()
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
        inset: [g]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [g]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [g]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [g]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [g]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [g]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [g]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [g]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [g]
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
        z: ["auto", Ke, _]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: J()
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
        flex: ["1", "auto", "initial", "none", _]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: K()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: K()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Ke, _]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Je]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Ke, _]
        }, _]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": X()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": X()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Je]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Ke, _]
        }, _]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": X()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": X()
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
        "auto-cols": ["auto", "min", "max", "fr", _]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", _]
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
        p: [S]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [S]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [S]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [S]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [S]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [S]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [S]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [S]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [S]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [d]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [d]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [d]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [d]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [d]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [d]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [d]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [d]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [d]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [Y]
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
        "space-y": [Y]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", _, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [_, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [_, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [Se]
        }, Se]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [_, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [_, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [_, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [_, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", Se, Ae]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", Ht]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Je]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", _]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Ge, Ht]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", be, _]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", _]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", _]
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
        decoration: [...B(), "wavy"]
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
        "underline-offset": ["auto", be, _]
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
        indent: C()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", _]
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
        content: ["none", _]
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
        bg: [...se(), Dl]
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
        bg: ["auto", "cover", "contain", Ll]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Wl]
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
        "border-opacity": [w]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...B(), "hidden"]
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
        "divide-opacity": [w]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: B()
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
        outline: ["", ...B()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [be, _]
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
        ring: ae()
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
        shadow: ["", "inner", "none", Se, Yl]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Je]
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
        "mix-blend": [...Z(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": Z()
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
        contrast: [l]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", Se, _]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [u]
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
        sepia: [m]
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
        "backdrop-hue-rotate": [f]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [u]
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
        "backdrop-saturate": [k]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [m]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", _]
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
        ease: ["linear", "in", "out", "in-out", _]
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
        animate: ["none", "spin", "ping", "pulse", "bounce", _]
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
        rotate: [Ke, _]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [re]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [re]
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
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", _]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", _]
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
        "scroll-m": C()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": C()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": C()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": C()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": C()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": C()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": C()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": C()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": C()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": C()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": C()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": C()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": C()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": C()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": C()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": C()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": C()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": C()
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
        "will-change": ["auto", "scroll", "contents", "transform", _]
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
        stroke: [be, Ae, Ht]
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
}, Or = /* @__PURE__ */ Ol(Hl), Vl = ({
  children: e,
  content: t,
  position: n,
  className: r,
  delay: o = 300,
  closeOnClick: a = !1,
  imageSrc: i,
  description: s,
  interactive: l = !1
}) => {
  const [c, f] = ce(!1), u = ee(null), p = ee(null), [y, x] = ce(!1), [g, d] = ce(!1), w = () => u.current ? u.current.querySelectorAll('[data-headlessui-state="open"]').length > 0 : !1;
  Fe(() => {
    const A = new MutationObserver((m) => {
      m.forEach((H) => {
        H.type === "attributes" && H.attributeName === "data-headlessui-state" && H.target.getAttribute("data-headlessui-state") === "open" && f(!1);
      });
    });
    return u.current && A.observe(u.current, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["data-headlessui-state"]
    }), () => {
      A.disconnect();
    };
  }, []);
  const S = () => {
    if (u.current) {
      const A = u.current.getBoundingClientRect();
      switch (n) {
        case "top":
          return {
            bottom: A.height + 10,
            left: "50%",
            transform: "translateX(-50%)"
          };
        case "bottom":
          return {
            top: A.height + 10,
            left: "50%",
            transform: "translateX(-50%)"
          };
        case "left":
          return {
            right: A.width + 10,
            top: "50%",
            transform: "translateY(-50%)"
          };
        case "right":
          return {
            left: A.width + 10,
            top: "50%",
            transform: "translateY(-50%)"
          };
        default:
          return {};
      }
    }
    return {};
  }, k = (A) => {
    a && (f(!1), A.stopPropagation());
  };
  return Fe(() => {
    w() || f(y || l && g);
  }, [y, g, l]), /* @__PURE__ */ gt(
    "div",
    {
      ref: u,
      onMouseEnter: () => {
        x(!0), w() || f(!0);
      },
      onMouseLeave: () => {
        x(!1), l || f(!1);
      },
      onClick: k,
      className: "relative",
      children: [
        e,
        /* @__PURE__ */ ue(
          gl,
          {
            show: c,
            enter: Or(
              "transition ease-out duration-200",
              o ? `delay-[${o}ms]` : "delay-[300ms]"
            ),
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            leave: "transition ease-in duration-150",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ ue(
              "div",
              {
                ref: p,
                onMouseEnter: () => l && d(!0),
                onMouseLeave: () => l && d(!1),
                style: {
                  ...S(),
                  transitionDelay: `${o}ms`,
                  transitionProperty: "opacity",
                  transitionDuration: "200ms",
                  transitionTimingFunction: "ease-out"
                },
                className: Or(
                  "absolute z-10 w-max rounded-lg bg-ui-controls px-2.5 py-1.5 text-[13px] font-medium text-base-fg shadow-xl border border-ui-panel-border",
                  l ? "pointer-events-auto" : "pointer-events-none",
                  r || ""
                ),
                children: /* @__PURE__ */ gt("div", { className: "flex flex-col gap-1", children: [
                  t,
                  i && /* @__PURE__ */ ue(
                    "img",
                    {
                      src: i,
                      alt: "tooltip",
                      className: "mb-1 aspect-square w-56 rounded-md"
                    }
                  ),
                  s && /* @__PURE__ */ ue("p", { className: "text-sm text-base-fg font-normal", children: s })
                ] })
              }
            )
          }
        )
      ]
    }
  );
};
function Kl({
  options: e,
  onOptionChange: t,
  selectedOption: n
}) {
  const [r, o] = ce(
    n || e[0].value
  );
  Fe(() => {
    o(n || e[0].value);
  }, [n, e]);
  const a = (i) => {
    o(i), t && t(i);
  };
  return /* @__PURE__ */ ue("div", { className: "flex space-x-1", children: e.map(
    ({ value: i, icon: s, text: l, tooltip: c }) => c ? /* @__PURE__ */ ue(
      Vl,
      {
        content: c,
        position: "bottom",
        delay: 300,
        closeOnClick: !0,
        children: /* @__PURE__ */ gt(
          "button",
          {
            className: kr(
              "flex h-9 items-center justify-center rounded-lg border text-sm outline-none transition-all duration-150 focus:outline-none",
              l ? "h-auto w-auto gap-2 px-3 py-1.5" : "w-9",
              r === i ? "border-brand-primary bg-brand-primary/20" : "border-transparent hover:bg-ui-panel/[0.4]"
            ),
            onClick: () => a(i),
            children: [
              /* @__PURE__ */ ue(vt, { icon: s }),
              l && /* @__PURE__ */ ue("span", { className: "text-nowrap text-sm font-medium", children: l })
            ]
          }
        )
      },
      i
    ) : /* @__PURE__ */ gt(
      "button",
      {
        className: kr(
          "flex h-9 items-center justify-center rounded-lg border text-sm transition-all duration-150",
          l ? "h-auto w-auto gap-2 px-3 py-1.5" : "w-9",
          r === i ? "border-brand-primary bg-brand-primary/20" : "border-transparent hover:bg-ui-panel/[0.4]"
        ),
        onClick: () => a(i),
        children: [
          /* @__PURE__ */ ue(vt, { icon: s }),
          l && /* @__PURE__ */ ue("span", { className: "text-nowrap text-sm font-medium", children: l })
        ]
      },
      i
    )
  ) });
}
export {
  Kl as ButtonIconSelect
};
