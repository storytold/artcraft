import { jsx as Bt } from "react/jsx-runtime";
import zn from "react";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Cr(e, t, n) {
  return (t = Tr(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Ht(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function u(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Ht(Object(n), !0).forEach(function(r) {
      Cr(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Ht(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function kr(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Tr(e) {
  var t = kr(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Xt = () => {
};
let Rt = {}, Ln = {}, Dn = null, Yn = {
  mark: Xt,
  measure: Xt
};
try {
  typeof window < "u" && (Rt = window), typeof document < "u" && (Ln = document), typeof MutationObserver < "u" && (Dn = MutationObserver), typeof performance < "u" && (Yn = performance);
} catch {
}
const {
  userAgent: Kt = ""
} = Rt.navigator || {}, de = Rt, $ = Ln, Jt = Dn, De = Yn;
de.document;
const oe = !!$.documentElement && !!$.head && typeof $.addEventListener == "function" && typeof $.createElement == "function", Wn = ~Kt.indexOf("MSIE") || ~Kt.indexOf("Trident/");
var Ir = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, _r = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, $n = {
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
}, Rr = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Un = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], U = "classic", He = "duotone", Mr = "sharp", Nr = "sharp-duotone", Gn = [U, He, Mr, Nr], Fr = {
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
}, jr = {
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
}, zr = /* @__PURE__ */ new Map([["classic", {
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
}]]), Lr = {
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
}, Dr = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Zt = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Yr = ["kit"], Wr = {
  kit: {
    "fa-kit": "fak"
  }
}, $r = ["fak", "fakd"], Ur = {
  kit: {
    fak: "fa-kit"
  }
}, Qt = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, Ye = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Gr = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], qr = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Vr = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Br = {
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
}, Hr = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, dt = {
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
}, Xr = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], pt = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Gr, ...Xr], Kr = ["solid", "regular", "light", "thin", "duotone", "brands"], qn = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Jr = qn.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), Zr = [...Object.keys(Hr), ...Kr, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", Ye.GROUP, Ye.SWAP_OPACITY, Ye.PRIMARY, Ye.SECONDARY].concat(qn.map((e) => "".concat(e, "x"))).concat(Jr.map((e) => "w-".concat(e))), Qr = {
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
const re = "___FONT_AWESOME___", mt = 16, Vn = "fa", Bn = "svg-inline--fa", ye = "data-fa-i2svg", gt = "data-fa-pseudo-element", ea = "data-fa-pseudo-element-pending", Mt = "data-prefix", Nt = "data-icon", en = "fontawesome-i2svg", ta = "async", na = ["HTML", "HEAD", "STYLE", "SCRIPT"], Hn = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function je(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[U];
    }
  });
}
const Xn = u({}, $n);
Xn[U] = u(u(u(u({}, {
  "fa-duotone": "duotone"
}), $n[U]), Zt.kit), Zt["kit-duotone"]);
const ra = je(Xn), ht = u({}, Lr);
ht[U] = u(u(u(u({}, {
  duotone: "fad"
}), ht[U]), Qt.kit), Qt["kit-duotone"]);
const tn = je(ht), bt = u({}, dt);
bt[U] = u(u({}, bt[U]), Ur.kit);
const Ft = je(bt), yt = u({}, Br);
yt[U] = u(u({}, yt[U]), Wr.kit);
je(yt);
const aa = Ir, Kn = "fa-layers-text", oa = _r, ia = u({}, Fr);
je(ia);
const sa = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Qe = Rr, la = [...Yr, ...Zr], Re = de.FontAwesomeConfig || {};
function ca(e) {
  var t = $.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function fa(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
$ && typeof $.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const a = fa(ca(n));
  a != null && (Re[r] = a);
});
const Jn = {
  styleDefault: "solid",
  familyDefault: U,
  cssPrefix: Vn,
  replacementClass: Bn,
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
Re.familyPrefix && (Re.cssPrefix = Re.familyPrefix);
const Oe = u(u({}, Jn), Re);
Oe.autoReplaceSvg || (Oe.observeMutations = !1);
const v = {};
Object.keys(Jn).forEach((e) => {
  Object.defineProperty(v, e, {
    enumerable: !0,
    set: function(t) {
      Oe[e] = t, Me.forEach((n) => n(v));
    },
    get: function() {
      return Oe[e];
    }
  });
});
Object.defineProperty(v, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Oe.cssPrefix = e, Me.forEach((t) => t(v));
  },
  get: function() {
    return Oe.cssPrefix;
  }
});
de.FontAwesomeConfig = v;
const Me = [];
function ua(e) {
  return Me.push(e), () => {
    Me.splice(Me.indexOf(e), 1);
  };
}
const ce = mt, Q = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function da(e) {
  if (!e || !oe)
    return;
  const t = $.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = $.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return $.head.insertBefore(t, r), e;
}
const pa = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Ne() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += pa[Math.random() * 62 | 0];
  return t;
}
function Ce(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function jt(e) {
  return e.classList ? Ce(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function Zn(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function ma(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(Zn(e[n]), '" '), "").trim();
}
function Xe(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function zt(e) {
  return e.size !== Q.size || e.x !== Q.x || e.y !== Q.y || e.rotate !== Q.rotate || e.flipX || e.flipY;
}
function ga(e) {
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
function ha(e) {
  let {
    transform: t,
    width: n = mt,
    height: r = mt,
    startCentered: a = !1
  } = e, o = "";
  return a && Wn ? o += "translate(".concat(t.x / ce - n / 2, "em, ").concat(t.y / ce - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / ce, "em), calc(-50% + ").concat(t.y / ce, "em)) ") : o += "translate(".concat(t.x / ce, "em, ").concat(t.y / ce, "em) "), o += "scale(".concat(t.size / ce * (t.flipX ? -1 : 1), ", ").concat(t.size / ce * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var ba = `:root, :host {
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
function Qn() {
  const e = Vn, t = Bn, n = v.cssPrefix, r = v.replacementClass;
  let a = ba;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let nn = !1;
function et() {
  v.autoAddCss && !nn && (da(Qn()), nn = !0);
}
var ya = {
  mixout() {
    return {
      dom: {
        css: Qn,
        insertCss: et
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        et();
      },
      beforeI2svg() {
        et();
      }
    };
  }
};
const ae = de || {};
ae[re] || (ae[re] = {});
ae[re].styles || (ae[re].styles = {});
ae[re].hooks || (ae[re].hooks = {});
ae[re].shims || (ae[re].shims = []);
var ee = ae[re];
const er = [], tr = function() {
  $.removeEventListener("DOMContentLoaded", tr), qe = 1, er.map((e) => e());
};
let qe = !1;
oe && (qe = ($.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test($.readyState), qe || $.addEventListener("DOMContentLoaded", tr));
function va(e) {
  oe && (qe ? setTimeout(e, 0) : er.push(e));
}
function ze(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? Zn(e) : "<".concat(t, " ").concat(ma(n), ">").concat(r.map(ze).join(""), "</").concat(t, ">");
}
function rn(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var tt = function(t, n, r, a) {
  var o = Object.keys(t), i = o.length, s = n, c, l, f;
  for (r === void 0 ? (c = 1, f = t[o[0]]) : (c = 0, f = r); c < i; c++)
    l = o[c], f = s(f, t[l], l, t);
  return f;
};
function xa(e) {
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
function vt(e) {
  const t = xa(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function wa(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function an(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function xt(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = an(t);
  typeof ee.hooks.addPack == "function" && !r ? ee.hooks.addPack(e, an(t)) : ee.styles[e] = u(u({}, ee.styles[e] || {}), a), e === "fas" && xt("fa", t);
}
const {
  styles: Fe,
  shims: Aa
} = ee, nr = Object.keys(Ft), Ea = nr.reduce((e, t) => (e[t] = Object.keys(Ft[t]), e), {});
let Lt = null, rr = {}, ar = {}, or = {}, ir = {}, sr = {};
function Sa(e) {
  return ~la.indexOf(e);
}
function Pa(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !Sa(a) ? a : null;
}
const lr = () => {
  const e = (r) => tt(Fe, (a, o, i) => (a[i] = tt(o, r, {}), a), {});
  rr = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), ar = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), sr = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in Fe || v.autoFetchSvg, n = tt(Aa, (r, a) => {
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
  or = n.names, ir = n.unicodes, Lt = Ke(v.styleDefault, {
    family: v.familyDefault
  });
};
ua((e) => {
  Lt = Ke(e.styleDefault, {
    family: v.familyDefault
  });
});
lr();
function Dt(e, t) {
  return (rr[e] || {})[t];
}
function Oa(e, t) {
  return (ar[e] || {})[t];
}
function be(e, t) {
  return (sr[e] || {})[t];
}
function cr(e) {
  return or[e] || {
    prefix: null,
    iconName: null
  };
}
function Ca(e) {
  const t = ir[e], n = Dt("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function pe() {
  return Lt;
}
const fr = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function ka(e) {
  let t = U;
  const n = nr.reduce((r, a) => (r[a] = "".concat(v.cssPrefix, "-").concat(a), r), {});
  return Gn.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => Ea[r].includes(a))) && (t = r);
  }), t;
}
function Ke(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = U
  } = t, r = ra[n][e];
  if (n === He && !e)
    return "fad";
  const a = tn[n][e] || tn[n][r], o = e in ee.styles ? e : null;
  return a || o || null;
}
function Ta(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = Pa(v.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function on(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Je(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = pt.concat(qr), o = on(e.filter((m) => a.includes(m))), i = on(e.filter((m) => !pt.includes(m))), s = o.filter((m) => (r = m, !Un.includes(m))), [c = null] = s, l = ka(o), f = u(u({}, Ta(i)), {}, {
    prefix: Ke(c, {
      family: l
    })
  });
  return u(u(u({}, f), Ma({
    values: e,
    family: l,
    styles: Fe,
    config: v,
    canonical: f,
    givenPrefix: r
  })), Ia(n, r, f));
}
function Ia(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? cr(a) : {}, i = be(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !Fe.far && Fe.fas && !v.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const _a = Gn.filter((e) => e !== U || e !== He), Ra = Object.keys(dt).filter((e) => e !== U).map((e) => Object.keys(dt[e])).flat();
function Ma(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === He, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", f = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (c || l || f) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && _a.includes(n) && (Object.keys(o).find((h) => Ra.includes(h)) || i.autoFetchSvg)) {
    const h = zr.get(n).defaultShortPrefixId;
    r.prefix = h, r.iconName = be(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = pe() || "fas"), r;
}
class Na {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = u(u({}, this.definitions[o] || {}), a[o]), xt(o, a[o]);
      const i = Ft[U][o];
      i && xt(i, a[o]), lr();
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
let sn = [], Ae = {};
const Se = {}, Fa = Object.keys(Se);
function ja(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return sn = e, Ae = {}, Object.keys(Se).forEach((r) => {
    Fa.indexOf(r) === -1 && delete Se[r];
  }), sn.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        Ae[i] || (Ae[i] = []), Ae[i].push(o[i]);
      });
    }
    r.provides && r.provides(Se);
  }), n;
}
function wt(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Ae[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function ve(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Ae[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function me() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Se[e] ? Se[e].apply(null, t) : void 0;
}
function At(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || pe();
  if (t)
    return t = be(n, t) || t, rn(ur.definitions, n, t) || rn(ee.styles, n, t);
}
const ur = new Na(), za = () => {
  v.autoReplaceSvg = !1, v.observeMutations = !1, ve("noAuto");
}, La = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return oe ? (ve("beforeI2svg", e), me("pseudoElements2svg", e), me("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    v.autoReplaceSvg === !1 && (v.autoReplaceSvg = !0), v.observeMutations = !0, va(() => {
      Ya({
        autoReplaceSvgRoot: t
      }), ve("watch", e);
    });
  }
}, Da = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: be(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Ke(e[0]);
      return {
        prefix: n,
        iconName: be(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(v.cssPrefix, "-")) > -1 || e.match(aa))) {
      const t = Je(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || pe(),
        iconName: be(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = pe();
      return {
        prefix: t,
        iconName: be(t, e) || e
      };
    }
  }
}, V = {
  noAuto: za,
  config: v,
  dom: La,
  parse: Da,
  library: ur,
  findIconDefinition: At,
  toHtml: ze
}, Ya = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = $
  } = e;
  (Object.keys(ee.styles).length > 0 || v.autoFetchSvg) && oe && v.autoReplaceSvg && V.dom.i2svg({
    node: t
  });
};
function Ze(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => ze(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!oe) return;
      const n = $.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function Wa(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (zt(i) && n.found && !r.found) {
    const {
      width: s,
      height: c
    } = n, l = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = Xe(u(u({}, o), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function $a(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(v.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: u(u({}, a), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Yt(e) {
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
    extra: f,
    watchable: m = !1
  } = e, {
    width: h,
    height: w
  } = n.found ? n : t, O = $r.includes(r), x = [v.replacementClass, a ? "".concat(v.cssPrefix, "-").concat(a) : ""].filter((p) => f.classes.indexOf(p) === -1).filter((p) => p !== "" || !!p).concat(f.classes).join(" ");
  let y = {
    children: [],
    attributes: u(u({}, f.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: x,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(h, " ").concat(w)
    })
  };
  const A = O && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(h / w * 16 * 0.0625, "em")
  } : {};
  m && (y.attributes[ye] = ""), s && (y.children.push({
    tag: "title",
    attributes: {
      id: y.attributes["aria-labelledby"] || "title-".concat(l || Ne())
    },
    children: [s]
  }), delete y.attributes.title);
  const C = u(u({}, y), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: c,
    transform: o,
    symbol: i,
    styles: u(u({}, A), f.styles)
  }), {
    children: P,
    attributes: I
  } = n.found && t.found ? me("generateAbstractMask", C) || {
    children: [],
    attributes: {}
  } : me("generateAbstractIcon", C) || {
    children: [],
    attributes: {}
  };
  return C.children = P, C.attributes = I, i ? $a(C) : Wa(C);
}
function ln(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = u(u(u({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[ye] = "");
  const l = u({}, i.styles);
  zt(a) && (l.transform = ha({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), l["-webkit-transform"] = l.transform);
  const f = Xe(l);
  f.length > 0 && (c.style = f);
  const m = [];
  return m.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && m.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), m;
}
function Ua(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = u(u(u({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = Xe(r.styles);
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
  styles: nt
} = ee;
function Et(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(v.cssPrefix, "-").concat(Qe.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(v.cssPrefix, "-").concat(Qe.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(v.cssPrefix, "-").concat(Qe.PRIMARY),
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
const Ga = {
  found: !1,
  width: 512,
  height: 512
};
function qa(e, t) {
  !Hn && !v.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function St(e, t) {
  let n = t;
  return t === "fa" && v.styleDefault !== null && (t = pe()), new Promise((r, a) => {
    if (n === "fa") {
      const o = cr(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && nt[t] && nt[t][e]) {
      const o = nt[t][e];
      return r(Et(o));
    }
    qa(e, t), r(u(u({}, Ga), {}, {
      icon: v.showMissingIcons && e ? me("missingIconAbstract") || {} : {}
    }));
  });
}
const cn = () => {
}, Pt = v.measurePerformance && De && De.mark && De.measure ? De : {
  mark: cn,
  measure: cn
}, _e = 'FA "6.7.2"', Va = (e) => (Pt.mark("".concat(_e, " ").concat(e, " begins")), () => dr(e)), dr = (e) => {
  Pt.mark("".concat(_e, " ").concat(e, " ends")), Pt.measure("".concat(_e, " ").concat(e), "".concat(_e, " ").concat(e, " begins"), "".concat(_e, " ").concat(e, " ends"));
};
var Wt = {
  begin: Va,
  end: dr
};
const Ue = () => {
};
function fn(e) {
  return typeof (e.getAttribute ? e.getAttribute(ye) : null) == "string";
}
function Ba(e) {
  const t = e.getAttribute ? e.getAttribute(Mt) : null, n = e.getAttribute ? e.getAttribute(Nt) : null;
  return t && n;
}
function Ha(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(v.replacementClass);
}
function Xa() {
  return v.autoReplaceSvg === !0 ? Ge.replace : Ge[v.autoReplaceSvg] || Ge.replace;
}
function Ka(e) {
  return $.createElementNS("http://www.w3.org/2000/svg", e);
}
function Ja(e) {
  return $.createElement(e);
}
function pr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? Ka : Ja
  } = t;
  if (typeof e == "string")
    return $.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(pr(o, {
      ceFn: n
    }));
  }), r;
}
function Za(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Ge = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(pr(n), t);
      }), t.getAttribute(ye) === null && v.keepOriginalSource) {
        let n = $.createComment(Za(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~jt(t).indexOf(v.replacementClass))
      return Ge.replace(e);
    const r = new RegExp("".concat(v.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === v.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => ze(o)).join(`
`);
    t.setAttribute(ye, ""), t.innerHTML = a;
  }
};
function un(e) {
  e();
}
function mr(e, t) {
  const n = typeof t == "function" ? t : Ue;
  if (e.length === 0)
    n();
  else {
    let r = un;
    v.mutateApproach === ta && (r = de.requestAnimationFrame || un), r(() => {
      const a = Xa(), o = Wt.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let $t = !1;
function gr() {
  $t = !0;
}
function Ot() {
  $t = !1;
}
let Ve = null;
function dn(e) {
  if (!Jt || !v.observeMutations)
    return;
  const {
    treeCallback: t = Ue,
    nodeCallback: n = Ue,
    pseudoElementsCallback: r = Ue,
    observeMutationsRoot: a = $
  } = e;
  Ve = new Jt((o) => {
    if ($t) return;
    const i = pe();
    Ce(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !fn(s.addedNodes[0]) && (v.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && v.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && fn(s.target) && ~sa.indexOf(s.attributeName))
        if (s.attributeName === "class" && Ba(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = Je(jt(s.target));
          s.target.setAttribute(Mt, c || i), l && s.target.setAttribute(Nt, l);
        } else Ha(s.target) && n(s.target);
    });
  }), oe && Ve.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Qa() {
  Ve && Ve.disconnect();
}
function eo(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function to(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = Je(jt(e));
  return a.prefix || (a.prefix = pe()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = Oa(a.prefix, e.innerText) || Dt(a.prefix, vt(e.innerText))), !a.iconName && v.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function no(e) {
  const t = Ce(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return v.autoA11y && (n ? t["aria-labelledby"] = "".concat(v.replacementClass, "-title-").concat(r || Ne()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function ro() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: Q,
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
function pn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = to(e), o = no(e), i = wt("parseNodeAttributes", {}, e);
  let s = t.styleParser ? eo(e) : [];
  return u({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: Q,
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
  styles: ao
} = ee;
function hr(e) {
  const t = v.autoReplaceSvg === "nest" ? pn(e, {
    styleParser: !1
  }) : pn(e);
  return ~t.extra.classes.indexOf(Kn) ? me("generateLayersText", e, t) : me("generateSvgReplacementMutation", e, t);
}
function oo() {
  return [...Dr, ...pt];
}
function mn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!oe) return Promise.resolve();
  const n = $.documentElement.classList, r = (f) => n.add("".concat(en, "-").concat(f)), a = (f) => n.remove("".concat(en, "-").concat(f)), o = v.autoFetchSvg ? oo() : Un.concat(Object.keys(ao));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(Kn, ":not([").concat(ye, "])")].concat(o.map((f) => ".".concat(f, ":not([").concat(ye, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = Ce(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const c = Wt.begin("onTree"), l = s.reduce((f, m) => {
    try {
      const h = hr(m);
      h && f.push(h);
    } catch (h) {
      Hn || h.name === "MissingIcon" && console.error(h);
    }
    return f;
  }, []);
  return new Promise((f, m) => {
    Promise.all(l).then((h) => {
      mr(h, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), c(), f();
      });
    }).catch((h) => {
      c(), m(h);
    });
  });
}
function io(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  hr(e).then((n) => {
    n && mr([n], t);
  });
}
function so(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : At(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : At(a || {})), e(r, u(u({}, n), {}, {
      mask: a
    }));
  };
}
const lo = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Q,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: c = [],
    attributes: l = {},
    styles: f = {}
  } = t;
  if (!e) return;
  const {
    prefix: m,
    iconName: h,
    icon: w
  } = e;
  return Ze(u({
    type: "icon"
  }, e), () => (ve("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), v.autoA11y && (i ? l["aria-labelledby"] = "".concat(v.replacementClass, "-title-").concat(s || Ne()) : (l["aria-hidden"] = "true", l.focusable = "false")), Yt({
    icons: {
      main: Et(w),
      mask: a ? Et(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: m,
    iconName: h,
    transform: u(u({}, Q), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: l,
      styles: f,
      classes: c
    }
  })));
};
var co = {
  mixout() {
    return {
      icon: so(lo)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = mn, e.nodeCallback = io, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = $,
        callback: r = () => {
        }
      } = t;
      return mn(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: c,
        mask: l,
        maskId: f,
        extra: m
      } = n;
      return new Promise((h, w) => {
        Promise.all([St(r, i), l.iconName ? St(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((O) => {
          let [x, y] = O;
          h([t, Yt({
            icons: {
              main: x,
              mask: y
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: c,
            maskId: f,
            title: a,
            titleId: o,
            extra: m,
            watchable: !0
          })]);
        }).catch(w);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = Xe(i);
      s.length > 0 && (r.style = s);
      let c;
      return zt(o) && (c = me("generateAbstractTransformGrouping", {
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
}, fo = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return Ze({
          type: "layer"
        }, () => {
          ve("beforeDOMElementCreation", {
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
              class: ["".concat(v.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, uo = {
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
        return Ze({
          type: "counter",
          content: e
        }, () => (ve("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Ua({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(v.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, po = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = Q,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return Ze({
          type: "text",
          content: e
        }, () => (ve("beforeDOMElementCreation", {
          content: e,
          params: t
        }), ln({
          content: e,
          transform: u(u({}, Q), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(v.cssPrefix, "-layers-text"), ...a]
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
      if (Wn) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return v.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, ln({
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
const mo = new RegExp('"', "ug"), gn = [1105920, 1112319], hn = u(u(u(u({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), jr), Qr), Vr), Ct = Object.keys(hn).reduce((e, t) => (e[t.toLowerCase()] = hn[t], e), {}), go = Object.keys(Ct).reduce((e, t) => {
  const n = Ct[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function ho(e) {
  const t = e.replace(mo, ""), n = wa(t, 0), r = n >= gn[0] && n <= gn[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: vt(a ? t[0] : t),
    isSecondary: r || a
  };
}
function bo(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (Ct[n] || {})[a] || go[n];
}
function bn(e, t) {
  const n = "".concat(ea).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = Ce(e.children).filter((h) => h.getAttribute(gt) === t)[0], s = de.getComputedStyle(e, t), c = s.getPropertyValue("font-family"), l = c.match(oa), f = s.getPropertyValue("font-weight"), m = s.getPropertyValue("content");
    if (i && !l)
      return e.removeChild(i), r();
    if (l && m !== "none" && m !== "") {
      const h = s.getPropertyValue("content");
      let w = bo(c, f);
      const {
        value: O,
        isSecondary: x
      } = ho(h), y = l[0].startsWith("FontAwesome");
      let A = Dt(w, O), C = A;
      if (y) {
        const P = Ca(O);
        P.iconName && P.prefix && (A = P.iconName, w = P.prefix);
      }
      if (A && !x && (!i || i.getAttribute(Mt) !== w || i.getAttribute(Nt) !== C)) {
        e.setAttribute(n, C), i && e.removeChild(i);
        const P = ro(), {
          extra: I
        } = P;
        I.attributes[gt] = t, St(A, w).then((p) => {
          const B = Yt(u(u({}, P), {}, {
            icons: {
              main: p,
              mask: fr()
            },
            prefix: w,
            iconName: C,
            extra: I,
            watchable: !0
          })), X = $.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(X, e.firstChild) : e.appendChild(X), X.outerHTML = B.map((ie) => ze(ie)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function yo(e) {
  return Promise.all([bn(e, "::before"), bn(e, "::after")]);
}
function vo(e) {
  return e.parentNode !== document.head && !~na.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(gt) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function yn(e) {
  if (oe)
    return new Promise((t, n) => {
      const r = Ce(e.querySelectorAll("*")).filter(vo).map(yo), a = Wt.begin("searchPseudoElements");
      gr(), Promise.all(r).then(() => {
        a(), Ot(), t();
      }).catch(() => {
        a(), Ot(), n();
      });
    });
}
var xo = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = yn, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = $
      } = t;
      v.searchPseudoElements && yn(n);
    };
  }
};
let vn = !1;
var wo = {
  mixout() {
    return {
      dom: {
        unwatch() {
          gr(), vn = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        dn(wt("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Qa();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        vn ? Ot() : dn(wt("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const xn = (e) => {
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
var Ao = {
  mixout() {
    return {
      parse: {
        transform: (e) => xn(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = xn(n)), e;
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
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), c = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), l = "rotate(".concat(r.rotate, " 0 0)"), f = {
        transform: "".concat(s, " ").concat(c, " ").concat(l)
      }, m = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, h = {
        outer: i,
        inner: f,
        path: m
      };
      return {
        tag: "g",
        attributes: u({}, h.outer),
        children: [{
          tag: "g",
          attributes: u({}, h.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: u(u({}, n.icon.attributes), h.path)
          }]
        }]
      };
    };
  }
};
const rt = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function wn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Eo(e) {
  return e.tag === "g" ? e.children : [e];
}
var So = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Je(n.split(" ").map((a) => a.trim())) : fr();
        return r.prefix || (r.prefix = pe()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        width: f,
        icon: m
      } = o, h = ga({
        transform: s,
        containerWidth: f,
        iconWidth: c
      }), w = {
        tag: "rect",
        attributes: u(u({}, rt), {}, {
          fill: "white"
        })
      }, O = l.children ? {
        children: l.children.map(wn)
      } : {}, x = {
        tag: "g",
        attributes: u({}, h.inner),
        children: [wn(u({
          tag: l.tag,
          attributes: u(u({}, l.attributes), h.path)
        }, O))]
      }, y = {
        tag: "g",
        attributes: u({}, h.outer),
        children: [x]
      }, A = "mask-".concat(i || Ne()), C = "clip-".concat(i || Ne()), P = {
        tag: "mask",
        attributes: u(u({}, rt), {}, {
          id: A,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [w, y]
      }, I = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: C
          },
          children: Eo(m)
        }, P]
      };
      return n.push(I, {
        tag: "rect",
        attributes: u({
          fill: "currentColor",
          "clip-path": "url(#".concat(C, ")"),
          mask: "url(#".concat(A, ")")
        }, rt)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Po = {
  provides(e) {
    let t = !1;
    de.matchMedia && (t = de.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      n.push({
        tag: "path",
        attributes: u(u({}, r), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const o = u(u({}, a), {}, {
        attributeName: "opacity"
      }), i = {
        tag: "circle",
        attributes: u(u({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || i.children.push({
        tag: "animate",
        attributes: u(u({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: u(u({}, o), {}, {
          values: "1;0;1;1;0;1;"
        })
      }), n.push(i), n.push({
        tag: "path",
        attributes: u(u({}, r), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: t ? [] : [{
          tag: "animate",
          attributes: u(u({}, o), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      }), t || n.push({
        tag: "path",
        attributes: u(u({}, r), {}, {
          opacity: "0",
          d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
        }),
        children: [{
          tag: "animate",
          attributes: u(u({}, o), {}, {
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
}, Oo = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Co = [ya, co, fo, uo, po, xo, wo, Ao, So, Po, Oo];
ja(Co, {
  mixoutsTo: V
});
V.noAuto;
V.config;
V.library;
V.dom;
const kt = V.parse;
V.findIconDefinition;
V.toHtml;
const ko = V.icon;
V.layer;
V.text;
V.counter;
function To(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var We = { exports: {} }, $e = { exports: {} }, z = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var An;
function Io() {
  if (An) return z;
  An = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, x = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, A = e ? Symbol.for("react.responder") : 60118, C = e ? Symbol.for("react.scope") : 60119;
  function P(p) {
    if (typeof p == "object" && p !== null) {
      var B = p.$$typeof;
      switch (B) {
        case t:
          switch (p = p.type, p) {
            case c:
            case l:
            case r:
            case o:
            case a:
            case m:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case s:
                case f:
                case O:
                case w:
                case i:
                  return p;
                default:
                  return B;
              }
          }
        case n:
          return B;
      }
    }
  }
  function I(p) {
    return P(p) === l;
  }
  return z.AsyncMode = c, z.ConcurrentMode = l, z.ContextConsumer = s, z.ContextProvider = i, z.Element = t, z.ForwardRef = f, z.Fragment = r, z.Lazy = O, z.Memo = w, z.Portal = n, z.Profiler = o, z.StrictMode = a, z.Suspense = m, z.isAsyncMode = function(p) {
    return I(p) || P(p) === c;
  }, z.isConcurrentMode = I, z.isContextConsumer = function(p) {
    return P(p) === s;
  }, z.isContextProvider = function(p) {
    return P(p) === i;
  }, z.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, z.isForwardRef = function(p) {
    return P(p) === f;
  }, z.isFragment = function(p) {
    return P(p) === r;
  }, z.isLazy = function(p) {
    return P(p) === O;
  }, z.isMemo = function(p) {
    return P(p) === w;
  }, z.isPortal = function(p) {
    return P(p) === n;
  }, z.isProfiler = function(p) {
    return P(p) === o;
  }, z.isStrictMode = function(p) {
    return P(p) === a;
  }, z.isSuspense = function(p) {
    return P(p) === m;
  }, z.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === r || p === l || p === o || p === a || p === m || p === h || typeof p == "object" && p !== null && (p.$$typeof === O || p.$$typeof === w || p.$$typeof === i || p.$$typeof === s || p.$$typeof === f || p.$$typeof === y || p.$$typeof === A || p.$$typeof === C || p.$$typeof === x);
  }, z.typeOf = P, z;
}
var L = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var En;
function _o() {
  return En || (En = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, x = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, A = e ? Symbol.for("react.responder") : 60118, C = e ? Symbol.for("react.scope") : 60119;
    function P(b) {
      return typeof b == "string" || typeof b == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      b === r || b === l || b === o || b === a || b === m || b === h || typeof b == "object" && b !== null && (b.$$typeof === O || b.$$typeof === w || b.$$typeof === i || b.$$typeof === s || b.$$typeof === f || b.$$typeof === y || b.$$typeof === A || b.$$typeof === C || b.$$typeof === x);
    }
    function I(b) {
      if (typeof b == "object" && b !== null) {
        var J = b.$$typeof;
        switch (J) {
          case t:
            var Le = b.type;
            switch (Le) {
              case c:
              case l:
              case r:
              case o:
              case a:
              case m:
                return Le;
              default:
                var Vt = Le && Le.$$typeof;
                switch (Vt) {
                  case s:
                  case f:
                  case O:
                  case w:
                  case i:
                    return Vt;
                  default:
                    return J;
                }
            }
          case n:
            return J;
        }
      }
    }
    var p = c, B = l, X = s, ie = i, ge = t, he = f, se = r, Y = O, xe = w, H = n, we = o, G = a, K = m, le = !1;
    function te(b) {
      return le || (le = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(b) || I(b) === c;
    }
    function d(b) {
      return I(b) === l;
    }
    function g(b) {
      return I(b) === s;
    }
    function M(b) {
      return I(b) === i;
    }
    function _(b) {
      return typeof b == "object" && b !== null && b.$$typeof === t;
    }
    function S(b) {
      return I(b) === f;
    }
    function N(b) {
      return I(b) === r;
    }
    function k(b) {
      return I(b) === O;
    }
    function R(b) {
      return I(b) === w;
    }
    function F(b) {
      return I(b) === n;
    }
    function D(b) {
      return I(b) === o;
    }
    function j(b) {
      return I(b) === a;
    }
    function q(b) {
      return I(b) === m;
    }
    L.AsyncMode = p, L.ConcurrentMode = B, L.ContextConsumer = X, L.ContextProvider = ie, L.Element = ge, L.ForwardRef = he, L.Fragment = se, L.Lazy = Y, L.Memo = xe, L.Portal = H, L.Profiler = we, L.StrictMode = G, L.Suspense = K, L.isAsyncMode = te, L.isConcurrentMode = d, L.isContextConsumer = g, L.isContextProvider = M, L.isElement = _, L.isForwardRef = S, L.isFragment = N, L.isLazy = k, L.isMemo = R, L.isPortal = F, L.isProfiler = D, L.isStrictMode = j, L.isSuspense = q, L.isValidElementType = P, L.typeOf = I;
  }()), L;
}
var Sn;
function br() {
  return Sn || (Sn = 1, process.env.NODE_ENV === "production" ? $e.exports = Io() : $e.exports = _o()), $e.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var at, Pn;
function Ro() {
  if (Pn) return at;
  Pn = 1;
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
      var c = Object.getOwnPropertyNames(i).map(function(f) {
        return i[f];
      });
      if (c.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(f) {
        l[f] = f;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return at = a() ? Object.assign : function(o, i) {
    for (var s, c = r(o), l, f = 1; f < arguments.length; f++) {
      s = Object(arguments[f]);
      for (var m in s)
        t.call(s, m) && (c[m] = s[m]);
      if (e) {
        l = e(s);
        for (var h = 0; h < l.length; h++)
          n.call(s, l[h]) && (c[l[h]] = s[l[h]]);
      }
    }
    return c;
  }, at;
}
var ot, On;
function Ut() {
  if (On) return ot;
  On = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ot = e, ot;
}
var it, Cn;
function yr() {
  return Cn || (Cn = 1, it = Function.call.bind(Object.prototype.hasOwnProperty)), it;
}
var st, kn;
function Mo() {
  if (kn) return st;
  kn = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Ut(), n = {}, r = /* @__PURE__ */ yr();
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
      for (var f in o)
        if (r(o, f)) {
          var m;
          try {
            if (typeof o[f] != "function") {
              var h = Error(
                (c || "React class") + ": " + s + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw h.name = "Invariant Violation", h;
            }
            m = o[f](i, f, c, s, null, t);
          } catch (O) {
            m = O;
          }
          if (m && !(m instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof m + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), m instanceof Error && !(m.message in n)) {
            n[m.message] = !0;
            var w = l ? l() : "";
            e(
              "Failed " + s + " type: " + m.message + (w ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, st = a, st;
}
var lt, Tn;
function No() {
  if (Tn) return lt;
  Tn = 1;
  var e = br(), t = Ro(), n = /* @__PURE__ */ Ut(), r = /* @__PURE__ */ yr(), a = /* @__PURE__ */ Mo(), o = function() {
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
  return lt = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function m(d) {
      var g = d && (l && d[l] || d[f]);
      if (typeof g == "function")
        return g;
    }
    var h = "<<anonymous>>", w = {
      array: A("array"),
      bigint: A("bigint"),
      bool: A("boolean"),
      func: A("function"),
      number: A("number"),
      object: A("object"),
      string: A("string"),
      symbol: A("symbol"),
      any: C(),
      arrayOf: P,
      element: I(),
      elementType: p(),
      instanceOf: B,
      node: he(),
      objectOf: ie,
      oneOf: X,
      oneOfType: ge,
      shape: Y,
      exact: xe
    };
    function O(d, g) {
      return d === g ? d !== 0 || 1 / d === 1 / g : d !== d && g !== g;
    }
    function x(d, g) {
      this.message = d, this.data = g && typeof g == "object" ? g : {}, this.stack = "";
    }
    x.prototype = Error.prototype;
    function y(d) {
      if (process.env.NODE_ENV !== "production")
        var g = {}, M = 0;
      function _(N, k, R, F, D, j, q) {
        if (F = F || h, j = j || R, q !== n) {
          if (c) {
            var b = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw b.name = "Invariant Violation", b;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var J = F + ":" + R;
            !g[J] && // Avoid spamming the console because they are often not actionable except for lib authors
            M < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + j + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), g[J] = !0, M++);
          }
        }
        return k[R] == null ? N ? k[R] === null ? new x("The " + D + " `" + j + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new x("The " + D + " `" + j + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : d(k, R, F, D, j);
      }
      var S = _.bind(null, !1);
      return S.isRequired = _.bind(null, !0), S;
    }
    function A(d) {
      function g(M, _, S, N, k, R) {
        var F = M[_], D = G(F);
        if (D !== d) {
          var j = K(F);
          return new x(
            "Invalid " + N + " `" + k + "` of type " + ("`" + j + "` supplied to `" + S + "`, expected ") + ("`" + d + "`."),
            { expectedType: d }
          );
        }
        return null;
      }
      return y(g);
    }
    function C() {
      return y(i);
    }
    function P(d) {
      function g(M, _, S, N, k) {
        if (typeof d != "function")
          return new x("Property `" + k + "` of component `" + S + "` has invalid PropType notation inside arrayOf.");
        var R = M[_];
        if (!Array.isArray(R)) {
          var F = G(R);
          return new x("Invalid " + N + " `" + k + "` of type " + ("`" + F + "` supplied to `" + S + "`, expected an array."));
        }
        for (var D = 0; D < R.length; D++) {
          var j = d(R, D, S, N, k + "[" + D + "]", n);
          if (j instanceof Error)
            return j;
        }
        return null;
      }
      return y(g);
    }
    function I() {
      function d(g, M, _, S, N) {
        var k = g[M];
        if (!s(k)) {
          var R = G(k);
          return new x("Invalid " + S + " `" + N + "` of type " + ("`" + R + "` supplied to `" + _ + "`, expected a single ReactElement."));
        }
        return null;
      }
      return y(d);
    }
    function p() {
      function d(g, M, _, S, N) {
        var k = g[M];
        if (!e.isValidElementType(k)) {
          var R = G(k);
          return new x("Invalid " + S + " `" + N + "` of type " + ("`" + R + "` supplied to `" + _ + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return y(d);
    }
    function B(d) {
      function g(M, _, S, N, k) {
        if (!(M[_] instanceof d)) {
          var R = d.name || h, F = te(M[_]);
          return new x("Invalid " + N + " `" + k + "` of type " + ("`" + F + "` supplied to `" + S + "`, expected ") + ("instance of `" + R + "`."));
        }
        return null;
      }
      return y(g);
    }
    function X(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function g(M, _, S, N, k) {
        for (var R = M[_], F = 0; F < d.length; F++)
          if (O(R, d[F]))
            return null;
        var D = JSON.stringify(d, function(q, b) {
          var J = K(b);
          return J === "symbol" ? String(b) : b;
        });
        return new x("Invalid " + N + " `" + k + "` of value `" + String(R) + "` " + ("supplied to `" + S + "`, expected one of " + D + "."));
      }
      return y(g);
    }
    function ie(d) {
      function g(M, _, S, N, k) {
        if (typeof d != "function")
          return new x("Property `" + k + "` of component `" + S + "` has invalid PropType notation inside objectOf.");
        var R = M[_], F = G(R);
        if (F !== "object")
          return new x("Invalid " + N + " `" + k + "` of type " + ("`" + F + "` supplied to `" + S + "`, expected an object."));
        for (var D in R)
          if (r(R, D)) {
            var j = d(R, D, S, N, k + "." + D, n);
            if (j instanceof Error)
              return j;
          }
        return null;
      }
      return y(g);
    }
    function ge(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var g = 0; g < d.length; g++) {
        var M = d[g];
        if (typeof M != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + le(M) + " at index " + g + "."
          ), i;
      }
      function _(S, N, k, R, F) {
        for (var D = [], j = 0; j < d.length; j++) {
          var q = d[j], b = q(S, N, k, R, F, n);
          if (b == null)
            return null;
          b.data && r(b.data, "expectedType") && D.push(b.data.expectedType);
        }
        var J = D.length > 0 ? ", expected one of type [" + D.join(", ") + "]" : "";
        return new x("Invalid " + R + " `" + F + "` supplied to " + ("`" + k + "`" + J + "."));
      }
      return y(_);
    }
    function he() {
      function d(g, M, _, S, N) {
        return H(g[M]) ? null : new x("Invalid " + S + " `" + N + "` supplied to " + ("`" + _ + "`, expected a ReactNode."));
      }
      return y(d);
    }
    function se(d, g, M, _, S) {
      return new x(
        (d || "React class") + ": " + g + " type `" + M + "." + _ + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + S + "`."
      );
    }
    function Y(d) {
      function g(M, _, S, N, k) {
        var R = M[_], F = G(R);
        if (F !== "object")
          return new x("Invalid " + N + " `" + k + "` of type `" + F + "` " + ("supplied to `" + S + "`, expected `object`."));
        for (var D in d) {
          var j = d[D];
          if (typeof j != "function")
            return se(S, N, k, D, K(j));
          var q = j(R, D, S, N, k + "." + D, n);
          if (q)
            return q;
        }
        return null;
      }
      return y(g);
    }
    function xe(d) {
      function g(M, _, S, N, k) {
        var R = M[_], F = G(R);
        if (F !== "object")
          return new x("Invalid " + N + " `" + k + "` of type `" + F + "` " + ("supplied to `" + S + "`, expected `object`."));
        var D = t({}, M[_], d);
        for (var j in D) {
          var q = d[j];
          if (r(d, j) && typeof q != "function")
            return se(S, N, k, j, K(q));
          if (!q)
            return new x(
              "Invalid " + N + " `" + k + "` key `" + j + "` supplied to `" + S + "`.\nBad object: " + JSON.stringify(M[_], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(d), null, "  ")
            );
          var b = q(R, j, S, N, k + "." + j, n);
          if (b)
            return b;
        }
        return null;
      }
      return y(g);
    }
    function H(d) {
      switch (typeof d) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !d;
        case "object":
          if (Array.isArray(d))
            return d.every(H);
          if (d === null || s(d))
            return !0;
          var g = m(d);
          if (g) {
            var M = g.call(d), _;
            if (g !== d.entries) {
              for (; !(_ = M.next()).done; )
                if (!H(_.value))
                  return !1;
            } else
              for (; !(_ = M.next()).done; ) {
                var S = _.value;
                if (S && !H(S[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function we(d, g) {
      return d === "symbol" ? !0 : g ? g["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && g instanceof Symbol : !1;
    }
    function G(d) {
      var g = typeof d;
      return Array.isArray(d) ? "array" : d instanceof RegExp ? "object" : we(g, d) ? "symbol" : g;
    }
    function K(d) {
      if (typeof d > "u" || d === null)
        return "" + d;
      var g = G(d);
      if (g === "object") {
        if (d instanceof Date)
          return "date";
        if (d instanceof RegExp)
          return "regexp";
      }
      return g;
    }
    function le(d) {
      var g = K(d);
      switch (g) {
        case "array":
        case "object":
          return "an " + g;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + g;
        default:
          return g;
      }
    }
    function te(d) {
      return !d.constructor || !d.constructor.name ? h : d.constructor.name;
    }
    return w.checkPropTypes = a, w.resetWarningCache = a.resetWarningCache, w.PropTypes = w, w;
  }, lt;
}
var ct, In;
function Fo() {
  if (In) return ct;
  In = 1;
  var e = /* @__PURE__ */ Ut();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, ct = function() {
    function r(i, s, c, l, f, m) {
      if (m !== e) {
        var h = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw h.name = "Invariant Violation", h;
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
  }, ct;
}
var _n;
function jo() {
  if (_n) return We.exports;
  if (_n = 1, process.env.NODE_ENV !== "production") {
    var e = br(), t = !0;
    We.exports = /* @__PURE__ */ No()(e.isElement, t);
  } else
    We.exports = /* @__PURE__ */ Fo()();
  return We.exports;
}
var zo = /* @__PURE__ */ jo();
const T = /* @__PURE__ */ To(zo);
function Rn(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Z(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Rn(Object(n), !0).forEach(function(r) {
      Ee(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Rn(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Be(e) {
  "@babel/helpers - typeof";
  return Be = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Be(e);
}
function Ee(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Lo(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function Do(e, t) {
  if (e == null) return {};
  var n = Lo(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Tt(e) {
  return Yo(e) || Wo(e) || $o(e) || Uo();
}
function Yo(e) {
  if (Array.isArray(e)) return It(e);
}
function Wo(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function $o(e, t) {
  if (e) {
    if (typeof e == "string") return It(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return It(e, t);
  }
}
function It(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Uo() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Go(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, f = e.spinReverse, m = e.pulse, h = e.fixedWidth, w = e.inverse, O = e.border, x = e.listItem, y = e.flip, A = e.size, C = e.rotation, P = e.pull, I = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": f,
    "fa-spin-pulse": l,
    "fa-pulse": m,
    "fa-fw": h,
    "fa-inverse": w,
    "fa-border": O,
    "fa-li": x,
    "fa-flip": y === !0,
    "fa-flip-horizontal": y === "horizontal" || y === "both",
    "fa-flip-vertical": y === "vertical" || y === "both"
  }, Ee(t, "fa-".concat(A), typeof A < "u" && A !== null), Ee(t, "fa-rotate-".concat(C), typeof C < "u" && C !== null && C !== 0), Ee(t, "fa-pull-".concat(P), typeof P < "u" && P !== null), Ee(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(I).map(function(p) {
    return I[p] ? p : null;
  }).filter(function(p) {
    return p;
  });
}
function qo(e) {
  return e = e - 0, e === e;
}
function vr(e) {
  return qo(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Vo = ["style"];
function Bo(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Ho(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = vr(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[Bo(a)] = o : t[a] = o, t;
  }, {});
}
function xr(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(c) {
    return xr(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var f = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = Ho(f);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = f : c.attrs[vr(l)] = f;
    }
    return c;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = Do(n, Vo);
  return a.attrs.style = Z(Z({}, a.attrs.style), i), e.apply(void 0, [t.tag, Z(Z({}, a.attrs), s)].concat(Tt(r)));
}
var wr = !1;
try {
  wr = process.env.NODE_ENV === "production";
} catch {
}
function Xo() {
  if (!wr && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Mn(e) {
  if (e && Be(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (kt.icon)
    return kt.icon(e);
  if (e === null)
    return null;
  if (e && Be(e) === "object" && e.prefix && e.iconName)
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
function ft(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Ee({}, e, t) : {};
}
var Nn = {
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
}, Gt = /* @__PURE__ */ zn.forwardRef(function(e, t) {
  var n = Z(Z({}, Nn), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, c = n.titleId, l = n.maskId, f = Mn(r), m = ft("classes", [].concat(Tt(Go(n)), Tt((i || "").split(" ")))), h = ft("transform", typeof n.transform == "string" ? kt.transform(n.transform) : n.transform), w = ft("mask", Mn(a)), O = ko(f, Z(Z(Z(Z({}, m), h), w), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!O)
    return Xo("Could not find icon", f), null;
  var x = O.abstract, y = {
    ref: t
  };
  return Object.keys(n).forEach(function(A) {
    Nn.hasOwnProperty(A) || (y[A] = n[A]);
  }), Ko(x[0], y);
});
Gt.displayName = "FontAwesomeIcon";
Gt.propTypes = {
  beat: T.bool,
  border: T.bool,
  beatFade: T.bool,
  bounce: T.bool,
  className: T.string,
  fade: T.bool,
  flash: T.bool,
  mask: T.oneOfType([T.object, T.array, T.string]),
  maskId: T.string,
  fixedWidth: T.bool,
  inverse: T.bool,
  flip: T.oneOf([!0, !1, "horizontal", "vertical", "both"]),
  icon: T.oneOfType([T.object, T.array, T.string]),
  listItem: T.bool,
  pull: T.oneOf(["right", "left"]),
  pulse: T.bool,
  rotation: T.oneOf([0, 90, 180, 270]),
  shake: T.bool,
  size: T.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: T.bool,
  spinPulse: T.bool,
  spinReverse: T.bool,
  symbol: T.oneOfType([T.bool, T.string]),
  title: T.string,
  titleId: T.string,
  transform: T.oneOfType([T.string, T.object]),
  swapOpacity: T.bool
};
var Ko = xr.bind(null, zn.createElement);
const qt = "-", Jo = (e) => {
  const t = Qo(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(qt);
      return s[0] === "" && s.length !== 1 && s.shift(), Ar(s, t) || Zo(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const c = n[i] || [];
      return s && r[i] ? [...c, ...r[i]] : c;
    }
  };
}, Ar = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), a = r ? Ar(e.slice(1), r) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const o = e.join(qt);
  return (i = t.validators.find(({
    validator: s
  }) => s(o))) == null ? void 0 : i.classGroupId;
}, Fn = /^\[(.+)\]$/, Zo = (e) => {
  if (Fn.test(e)) {
    const t = Fn.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, Qo = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return ti(Object.entries(e.classGroups), n).forEach(([o, i]) => {
    _t(i, r, o, t);
  }), r;
}, _t = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : jn(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (ei(a)) {
        _t(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      _t(i, jn(t, o), n, r);
    });
  });
}, jn = (e, t) => {
  let n = e;
  return t.split(qt).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, ei = (e) => e.isThemeGetter, ti = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [n, a];
}) : e, ni = (e) => {
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
}, Er = "!", ri = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const c = [];
    let l = 0, f = 0, m;
    for (let y = 0; y < s.length; y++) {
      let A = s[y];
      if (l === 0) {
        if (A === a && (r || s.slice(y, y + o) === t)) {
          c.push(s.slice(f, y)), f = y + o;
          continue;
        }
        if (A === "/") {
          m = y;
          continue;
        }
      }
      A === "[" ? l++ : A === "]" && l--;
    }
    const h = c.length === 0 ? s : s.substring(f), w = h.startsWith(Er), O = w ? h.substring(1) : h, x = m && m > f ? m - f : void 0;
    return {
      modifiers: c,
      hasImportantModifier: w,
      baseClassName: O,
      maybePostfixModifierPosition: x
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, ai = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, oi = (e) => ({
  cache: ni(e.cacheSize),
  parseClassName: ri(e),
  ...Jo(e)
}), ii = /\s+/, si = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(ii);
  let s = "";
  for (let c = i.length - 1; c >= 0; c -= 1) {
    const l = i[c], {
      modifiers: f,
      hasImportantModifier: m,
      baseClassName: h,
      maybePostfixModifierPosition: w
    } = n(l);
    let O = !!w, x = r(O ? h.substring(0, w) : h);
    if (!x) {
      if (!O) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      if (x = r(h), !x) {
        s = l + (s.length > 0 ? " " + s : s);
        continue;
      }
      O = !1;
    }
    const y = ai(f).join(":"), A = m ? y + Er : y, C = A + x;
    if (o.includes(C))
      continue;
    o.push(C);
    const P = a(x, O);
    for (let I = 0; I < P.length; ++I) {
      const p = P[I];
      o.push(A + p);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function li() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Sr(t)) && (r && (r += " "), r += n);
  return r;
}
const Sr = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Sr(e[r])) && (n && (n += " "), n += t);
  return n;
};
function ci(e, ...t) {
  let n, r, a, o = i;
  function i(c) {
    const l = t.reduce((f, m) => m(f), e());
    return n = oi(l), r = n.cache.get, a = n.cache.set, o = s, s(c);
  }
  function s(c) {
    const l = r(c);
    if (l)
      return l;
    const f = si(c, n);
    return a(c, f), f;
  }
  return function() {
    return o(li.apply(null, arguments));
  };
}
const W = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Pr = /^\[(?:([a-z-]+):)?(.+)\]$/i, fi = /^\d+\/\d+$/, ui = /* @__PURE__ */ new Set(["px", "full", "screen"]), di = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, pi = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, mi = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, gi = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, hi = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, ne = (e) => Pe(e) || ui.has(e) || fi.test(e), fe = (e) => ke(e, "length", Si), Pe = (e) => !!e && !Number.isNaN(Number(e)), ut = (e) => ke(e, "number", Pe), Te = (e) => !!e && Number.isInteger(Number(e)), bi = (e) => e.endsWith("%") && Pe(e.slice(0, -1)), E = (e) => Pr.test(e), ue = (e) => di.test(e), yi = /* @__PURE__ */ new Set(["length", "size", "percentage"]), vi = (e) => ke(e, yi, Or), xi = (e) => ke(e, "position", Or), wi = /* @__PURE__ */ new Set(["image", "url"]), Ai = (e) => ke(e, wi, Oi), Ei = (e) => ke(e, "", Pi), Ie = () => !0, ke = (e, t, n) => {
  const r = Pr.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Si = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  pi.test(e) && !mi.test(e)
), Or = () => !1, Pi = (e) => gi.test(e), Oi = (e) => hi.test(e), Ci = () => {
  const e = W("colors"), t = W("spacing"), n = W("blur"), r = W("brightness"), a = W("borderColor"), o = W("borderRadius"), i = W("borderSpacing"), s = W("borderWidth"), c = W("contrast"), l = W("grayscale"), f = W("hueRotate"), m = W("invert"), h = W("gap"), w = W("gradientColorStops"), O = W("gradientColorStopPositions"), x = W("inset"), y = W("margin"), A = W("opacity"), C = W("padding"), P = W("saturate"), I = W("scale"), p = W("sepia"), B = W("skew"), X = W("space"), ie = W("translate"), ge = () => ["auto", "contain", "none"], he = () => ["auto", "hidden", "clip", "visible", "scroll"], se = () => ["auto", E, t], Y = () => [E, t], xe = () => ["", ne, fe], H = () => ["auto", Pe, E], we = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], G = () => ["solid", "dashed", "dotted", "double", "none"], K = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], le = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], te = () => ["", "0", E], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], g = () => [Pe, E];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Ie],
      spacing: [ne, fe],
      blur: ["none", "", ue, E],
      brightness: g(),
      borderColor: [e],
      borderRadius: ["none", "", "full", ue, E],
      borderSpacing: Y(),
      borderWidth: xe(),
      contrast: g(),
      grayscale: te(),
      hueRotate: g(),
      invert: te(),
      gap: Y(),
      gradientColorStops: [e],
      gradientColorStopPositions: [bi, fe],
      inset: se(),
      margin: se(),
      opacity: g(),
      padding: Y(),
      saturate: g(),
      scale: g(),
      sepia: te(),
      skew: g(),
      space: Y(),
      translate: Y()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", E]
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
        columns: [ue]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": d()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": d()
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
        object: [...we(), E]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: he()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": he()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": he()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: ge()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": ge()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": ge()
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
        inset: [x]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [x]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [x]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [x]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [x]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [x]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [x]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [x]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [x]
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
        z: ["auto", Te, E]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: se()
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
        flex: ["1", "auto", "initial", "none", E]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: te()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: te()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Te, E]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Ie]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Te, E]
        }, E]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": H()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": H()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Ie]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Te, E]
        }, E]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": H()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": H()
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
        "auto-cols": ["auto", "min", "max", "fr", E]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", E]
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: [h]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [h]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [h]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...le()]
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
        content: ["normal", ...le(), "baseline"]
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
        "place-content": [...le(), "baseline"]
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
        p: [C]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [C]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [C]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [C]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [C]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [C]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [C]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [C]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [C]
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: [y]
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: [y]
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: [y]
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: [y]
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: [y]
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: [y]
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: [y]
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: [y]
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: [y]
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */
      "space-x": [{
        "space-x": [X]
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
        "space-y": [X]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", E, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [E, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [E, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [ue]
        }, ue]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [E, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [E, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [E, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [E, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", ue, fe]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", ut]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Ie]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", E]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Pe, ut]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", ne, E]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", E]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", E]
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
        "placeholder-opacity": [A]
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
        "text-opacity": [A]
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
        decoration: [...G(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", ne, fe]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", ne, E]
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
        indent: Y()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", E]
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
        content: ["none", E]
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
        "bg-opacity": [A]
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
        bg: [...we(), xi]
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
        bg: ["auto", "cover", "contain", vi]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, Ai]
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
        from: [O]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [O]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [O]
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: [w]
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: [w]
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: [w]
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
        "border-opacity": [A]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...G(), "hidden"]
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
        "divide-opacity": [A]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: G()
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
        outline: ["", ...G()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [ne, E]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [ne, fe]
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
        ring: xe()
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
        "ring-opacity": [A]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [ne, fe]
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
        shadow: ["", "inner", "none", ue, Ei]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Ie]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [A]
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
        contrast: [c]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", ue, E]
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
        "hue-rotate": [f]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [m]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [P]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [p]
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
        "backdrop-hue-rotate": [f]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [m]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [A]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [P]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [p]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", E]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: g()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", E]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: g()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", E]
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
        scale: [I]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [I]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [I]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Te, E]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [ie]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [ie]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [B]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [B]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", E]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", E]
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
        "scroll-m": Y()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": Y()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": Y()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": Y()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": Y()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": Y()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": Y()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": Y()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": Y()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": Y()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": Y()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": Y()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": Y()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": Y()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": Y()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": Y()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": Y()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": Y()
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
        "will-change": ["auto", "scroll", "contents", "transform", E]
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
        stroke: [ne, fe, ut]
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
}, ki = /* @__PURE__ */ ci(Ci), _i = ({
  icon: e,
  size: t,
  onClick: n,
  className: r,
  bgFill: a = !1,
  disabled: o,
  ...i
}) => {
  const s = ki(
    "box-content flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
    a ? "bg-ui-controls-button hover:bg-ui-controls-button/[0.75]" : "bg-transparent hover:bg-ui-panel/[0.4]",
    o && "opacity-50 hover:bg-transparent",
    r
  );
  return /* @__PURE__ */ Bt("button", { className: s, onClick: n, disabled: o, children: /* @__PURE__ */ Bt(Gt, { icon: e, size: t, ...i }) });
};
export {
  _i as ButtonIcon
};
