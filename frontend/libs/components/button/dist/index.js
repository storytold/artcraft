import { jsxs as at, jsx as U, Fragment as Se } from "react/jsx-runtime";
import $n from "react";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Rr(e, t, n) {
  return (t = Nr(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Qt(e, t) {
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
    t % 2 ? Qt(Object(n), !0).forEach(function(r) {
      Rr(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Qt(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Mr(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Nr(e) {
  var t = Mr(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const en = () => {
};
let Dt = {}, Un = {}, Gn = null, qn = {
  mark: en,
  measure: en
};
try {
  typeof window < "u" && (Dt = window), typeof document < "u" && (Un = document), typeof MutationObserver < "u" && (Gn = MutationObserver), typeof performance < "u" && (qn = performance);
} catch {
}
const {
  userAgent: tn = ""
} = Dt.navigator || {}, me = Dt, $ = Un, nn = Gn, Ge = qn;
me.document;
const se = !!$.documentElement && !!$.head && typeof $.addEventListener == "function" && typeof $.createElement == "function", Bn = ~tn.indexOf("MSIE") || ~tn.indexOf("Trident/");
var Fr = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, jr = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Vn = {
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
}, zr = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Hn = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], G = "classic", Qe = "duotone", Lr = "sharp", Dr = "sharp-duotone", Xn = [G, Qe, Lr, Dr], Yr = {
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
}, Wr = {
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
}, $r = /* @__PURE__ */ new Map([["classic", {
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
}]]), Ur = {
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
}, Gr = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], rn = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, qr = ["kit"], Br = {
  kit: {
    "fa-kit": "fak"
  }
}, Vr = ["fak", "fakd"], Hr = {
  kit: {
    fak: "fa-kit"
  }
}, an = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, qe = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Xr = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Kr = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Jr = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, Zr = {
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
}, Qr = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, yt = {
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
}, ea = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], vt = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...Xr, ...ea], ta = ["solid", "regular", "light", "thin", "duotone", "brands"], Kn = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], na = Kn.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), ra = [...Object.keys(Qr), ...ta, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", qe.GROUP, qe.SWAP_OPACITY, qe.PRIMARY, qe.SECONDARY].concat(Kn.map((e) => "".concat(e, "x"))).concat(na.map((e) => "w-".concat(e))), aa = {
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
const oe = "___FONT_AWESOME___", xt = 16, Jn = "fa", Zn = "svg-inline--fa", xe = "data-fa-i2svg", wt = "data-fa-pseudo-element", oa = "data-fa-pseudo-element-pending", Yt = "data-prefix", Wt = "data-icon", on = "fontawesome-i2svg", ia = "async", sa = ["HTML", "HEAD", "STYLE", "SCRIPT"], Qn = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function We(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[G];
    }
  });
}
const er = u({}, Vn);
er[G] = u(u(u(u({}, {
  "fa-duotone": "duotone"
}), Vn[G]), rn.kit), rn["kit-duotone"]);
const la = We(er), At = u({}, Ur);
At[G] = u(u(u(u({}, {
  duotone: "fad"
}), At[G]), an.kit), an["kit-duotone"]);
const sn = We(At), Et = u({}, yt);
Et[G] = u(u({}, Et[G]), Hr.kit);
const $t = We(Et), St = u({}, Zr);
St[G] = u(u({}, St[G]), Br.kit);
We(St);
const ca = Fr, tr = "fa-layers-text", fa = jr, ua = u({}, Yr);
We(ua);
const da = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], ot = zr, pa = [...qr, ...ra], je = me.FontAwesomeConfig || {};
function ma(e) {
  var t = $.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function ga(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
$ && typeof $.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const a = ga(ma(n));
  a != null && (je[r] = a);
});
const nr = {
  styleDefault: "solid",
  familyDefault: G,
  cssPrefix: Jn,
  replacementClass: Zn,
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
je.familyPrefix && (je.cssPrefix = je.familyPrefix);
const Ie = u(u({}, nr), je);
Ie.autoReplaceSvg || (Ie.observeMutations = !1);
const v = {};
Object.keys(nr).forEach((e) => {
  Object.defineProperty(v, e, {
    enumerable: !0,
    set: function(t) {
      Ie[e] = t, ze.forEach((n) => n(v));
    },
    get: function() {
      return Ie[e];
    }
  });
});
Object.defineProperty(v, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Ie.cssPrefix = e, ze.forEach((t) => t(v));
  },
  get: function() {
    return Ie.cssPrefix;
  }
});
me.FontAwesomeConfig = v;
const ze = [];
function ba(e) {
  return ze.push(e), () => {
    ze.splice(ze.indexOf(e), 1);
  };
}
const ue = xt, te = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function ha(e) {
  if (!e || !se)
    return;
  const t = $.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = $.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], s = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(s) > -1 && (r = o);
  }
  return $.head.insertBefore(t, r), e;
}
const ya = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function De() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += ya[Math.random() * 62 | 0];
  return t;
}
function _e(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Ut(e) {
  return e.classList ? _e(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function rr(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function va(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(rr(e[n]), '" '), "").trim();
}
function et(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Gt(e) {
  return e.size !== te.size || e.x !== te.x || e.y !== te.y || e.rotate !== te.rotate || e.flipX || e.flipY;
}
function xa(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), s = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), i = "rotate(".concat(t.rotate, " 0 0)"), l = {
    transform: "".concat(o, " ").concat(s, " ").concat(i)
  }, c = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: l,
    path: c
  };
}
function wa(e) {
  let {
    transform: t,
    width: n = xt,
    height: r = xt,
    startCentered: a = !1
  } = e, o = "";
  return a && Bn ? o += "translate(".concat(t.x / ue - n / 2, "em, ").concat(t.y / ue - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / ue, "em), calc(-50% + ").concat(t.y / ue, "em)) ") : o += "translate(".concat(t.x / ue, "em, ").concat(t.y / ue, "em) "), o += "scale(".concat(t.size / ue * (t.flipX ? -1 : 1), ", ").concat(t.size / ue * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var Aa = `:root, :host {
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
function ar() {
  const e = Jn, t = Zn, n = v.cssPrefix, r = v.replacementClass;
  let a = Aa;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), s = new RegExp("\\--".concat(e, "\\-"), "g"), i = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(s, "--".concat(n, "-")).replace(i, ".".concat(r));
  }
  return a;
}
let ln = !1;
function it() {
  v.autoAddCss && !ln && (ha(ar()), ln = !0);
}
var Ea = {
  mixout() {
    return {
      dom: {
        css: ar,
        insertCss: it
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        it();
      },
      beforeI2svg() {
        it();
      }
    };
  }
};
const ie = me || {};
ie[oe] || (ie[oe] = {});
ie[oe].styles || (ie[oe].styles = {});
ie[oe].hooks || (ie[oe].hooks = {});
ie[oe].shims || (ie[oe].shims = []);
var ne = ie[oe];
const or = [], ir = function() {
  $.removeEventListener("DOMContentLoaded", ir), Ke = 1, or.map((e) => e());
};
let Ke = !1;
se && (Ke = ($.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test($.readyState), Ke || $.addEventListener("DOMContentLoaded", ir));
function Sa(e) {
  se && (Ke ? setTimeout(e, 0) : or.push(e));
}
function $e(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? rr(e) : "<".concat(t, " ").concat(va(n), ">").concat(r.map($e).join(""), "</").concat(t, ">");
}
function cn(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var st = function(t, n, r, a) {
  var o = Object.keys(t), s = o.length, i = n, l, c, f;
  for (r === void 0 ? (l = 1, f = t[o[0]]) : (l = 0, f = r); l < s; l++)
    c = o[l], f = i(f, t[c], c, t);
  return f;
};
function Pa(e) {
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
function Pt(e) {
  const t = Pa(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Oa(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function fn(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Ot(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = fn(t);
  typeof ne.hooks.addPack == "function" && !r ? ne.hooks.addPack(e, fn(t)) : ne.styles[e] = u(u({}, ne.styles[e] || {}), a), e === "fas" && Ot("fa", t);
}
const {
  styles: Ye,
  shims: ka
} = ne, sr = Object.keys($t), Ca = sr.reduce((e, t) => (e[t] = Object.keys($t[t]), e), {});
let qt = null, lr = {}, cr = {}, fr = {}, ur = {}, dr = {};
function Ta(e) {
  return ~pa.indexOf(e);
}
function Ia(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !Ta(a) ? a : null;
}
const pr = () => {
  const e = (r) => st(Ye, (a, o, s) => (a[s] = st(o, r, {}), a), {});
  lr = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((i) => typeof i == "number").forEach((i) => {
    r[i.toString(16)] = o;
  }), r)), cr = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((i) => typeof i == "string").forEach((i) => {
    r[i] = o;
  }), r)), dr = e((r, a, o) => {
    const s = a[2];
    return r[o] = o, s.forEach((i) => {
      r[i] = o;
    }), r;
  });
  const t = "far" in Ye || v.autoFetchSvg, n = st(ka, (r, a) => {
    const o = a[0];
    let s = a[1];
    const i = a[2];
    return s === "far" && !t && (s = "fas"), typeof o == "string" && (r.names[o] = {
      prefix: s,
      iconName: i
    }), typeof o == "number" && (r.unicodes[o.toString(16)] = {
      prefix: s,
      iconName: i
    }), r;
  }, {
    names: {},
    unicodes: {}
  });
  fr = n.names, ur = n.unicodes, qt = tt(v.styleDefault, {
    family: v.familyDefault
  });
};
ba((e) => {
  qt = tt(e.styleDefault, {
    family: v.familyDefault
  });
});
pr();
function Bt(e, t) {
  return (lr[e] || {})[t];
}
function _a(e, t) {
  return (cr[e] || {})[t];
}
function ve(e, t) {
  return (dr[e] || {})[t];
}
function mr(e) {
  return fr[e] || {
    prefix: null,
    iconName: null
  };
}
function Ra(e) {
  const t = ur[e], n = Bt("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function ge() {
  return qt;
}
const gr = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Ma(e) {
  let t = G;
  const n = sr.reduce((r, a) => (r[a] = "".concat(v.cssPrefix, "-").concat(a), r), {});
  return Xn.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => Ca[r].includes(a))) && (t = r);
  }), t;
}
function tt(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = G
  } = t, r = la[n][e];
  if (n === Qe && !e)
    return "fad";
  const a = sn[n][e] || sn[n][r], o = e in ne.styles ? e : null;
  return a || o || null;
}
function Na(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = Ia(v.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function un(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function nt(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = vt.concat(Kr), o = un(e.filter((m) => a.includes(m))), s = un(e.filter((m) => !vt.includes(m))), i = o.filter((m) => (r = m, !Hn.includes(m))), [l = null] = i, c = Ma(o), f = u(u({}, Na(s)), {}, {
    prefix: tt(l, {
      family: c
    })
  });
  return u(u(u({}, f), La({
    values: e,
    family: c,
    styles: Ye,
    config: v,
    canonical: f,
    givenPrefix: r
  })), Fa(n, r, f));
}
function Fa(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? mr(a) : {}, s = ve(r, a);
  return a = o.iconName || s || a, r = o.prefix || r, r === "far" && !Ye.far && Ye.fas && !v.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const ja = Xn.filter((e) => e !== G || e !== Qe), za = Object.keys(yt).filter((e) => e !== G).map((e) => Object.keys(yt[e])).flat();
function La(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: s = {}
  } = e, i = n === Qe, l = t.includes("fa-duotone") || t.includes("fad"), c = s.familyDefault === "duotone", f = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!i && (l || c || f) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && ja.includes(n) && (Object.keys(o).find((g) => za.includes(g)) || s.autoFetchSvg)) {
    const g = $r.get(n).defaultShortPrefixId;
    r.prefix = g, r.iconName = ve(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = ge() || "fas"), r;
}
class Da {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = u(u({}, this.definitions[o] || {}), a[o]), Ot(o, a[o]);
      const s = $t[G][o];
      s && Ot(s, a[o]), pr();
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
        icon: i
      } = r[a], l = i[2];
      t[o] || (t[o] = {}), l.length > 0 && l.forEach((c) => {
        typeof c == "string" && (t[o][c] = i);
      }), t[o][s] = i;
    }), t;
  }
}
let dn = [], Oe = {};
const Ce = {}, Ya = Object.keys(Ce);
function Wa(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return dn = e, Oe = {}, Object.keys(Ce).forEach((r) => {
    Ya.indexOf(r) === -1 && delete Ce[r];
  }), dn.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((s) => {
        n[o] || (n[o] = {}), n[o][s] = a[o][s];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((s) => {
        Oe[s] || (Oe[s] = []), Oe[s].push(o[s]);
      });
    }
    r.provides && r.provides(Ce);
  }), n;
}
function kt(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return (Oe[e] || []).forEach((s) => {
    t = s.apply(null, [t, ...r]);
  }), t;
}
function we(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  (Oe[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function be() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Ce[e] ? Ce[e].apply(null, t) : void 0;
}
function Ct(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || ge();
  if (t)
    return t = ve(n, t) || t, cn(br.definitions, n, t) || cn(ne.styles, n, t);
}
const br = new Da(), $a = () => {
  v.autoReplaceSvg = !1, v.observeMutations = !1, we("noAuto");
}, Ua = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return se ? (we("beforeI2svg", e), be("pseudoElements2svg", e), be("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    v.autoReplaceSvg === !1 && (v.autoReplaceSvg = !0), v.observeMutations = !0, Sa(() => {
      qa({
        autoReplaceSvgRoot: t
      }), we("watch", e);
    });
  }
}, Ga = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: ve(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = tt(e[0]);
      return {
        prefix: n,
        iconName: ve(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(v.cssPrefix, "-")) > -1 || e.match(ca))) {
      const t = nt(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || ge(),
        iconName: ve(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = ge();
      return {
        prefix: t,
        iconName: ve(t, e) || e
      };
    }
  }
}, H = {
  noAuto: $a,
  config: v,
  dom: Ua,
  parse: Ga,
  library: br,
  findIconDefinition: Ct,
  toHtml: $e
}, qa = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = $
  } = e;
  (Object.keys(ne.styles).length > 0 || v.autoFetchSvg) && se && v.autoReplaceSvg && H.dom.i2svg({
    node: t
  });
};
function rt(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => $e(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!se) return;
      const n = $.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function Ba(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: s
  } = e;
  if (Gt(s) && n.found && !r.found) {
    const {
      width: i,
      height: l
    } = n, c = {
      x: i / l / 2,
      y: 0.5
    };
    a.style = et(u(u({}, o), {}, {
      "transform-origin": "".concat(c.x + s.x / 16, "em ").concat(c.y + s.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function Va(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const s = o === !0 ? "".concat(t, "-").concat(v.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: u(u({}, a), {}, {
        id: s
      }),
      children: r
    }]
  }];
}
function Vt(e) {
  const {
    icons: {
      main: t,
      mask: n
    },
    prefix: r,
    iconName: a,
    transform: o,
    symbol: s,
    title: i,
    maskId: l,
    titleId: c,
    extra: f,
    watchable: m = !1
  } = e, {
    width: g,
    height: w
  } = n.found ? n : t, S = Vr.includes(r), x = [v.replacementClass, a ? "".concat(v.cssPrefix, "-").concat(a) : ""].filter((p) => f.classes.indexOf(p) === -1).filter((p) => p !== "" || !!p).concat(f.classes).join(" ");
  let y = {
    children: [],
    attributes: u(u({}, f.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: x,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(g, " ").concat(w)
    })
  };
  const A = S && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(g / w * 16 * 0.0625, "em")
  } : {};
  m && (y.attributes[xe] = ""), i && (y.children.push({
    tag: "title",
    attributes: {
      id: y.attributes["aria-labelledby"] || "title-".concat(c || De())
    },
    children: [i]
  }), delete y.attributes.title);
  const k = u(u({}, y), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: l,
    transform: o,
    symbol: s,
    styles: u(u({}, A), f.styles)
  }), {
    children: O,
    attributes: I
  } = n.found && t.found ? be("generateAbstractMask", k) || {
    children: [],
    attributes: {}
  } : be("generateAbstractIcon", k) || {
    children: [],
    attributes: {}
  };
  return k.children = O, k.attributes = I, s ? Va(k) : Ba(k);
}
function pn(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: s,
    watchable: i = !1
  } = e, l = u(u(u({}, s.attributes), o ? {
    title: o
  } : {}), {}, {
    class: s.classes.join(" ")
  });
  i && (l[xe] = "");
  const c = u({}, s.styles);
  Gt(a) && (c.transform = wa({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), c["-webkit-transform"] = c.transform);
  const f = et(c);
  f.length > 0 && (l.style = f);
  const m = [];
  return m.push({
    tag: "span",
    attributes: l,
    children: [t]
  }), o && m.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), m;
}
function Ha(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = u(u(u({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = et(r.styles);
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
  styles: lt
} = ne;
function Tt(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(v.cssPrefix, "-").concat(ot.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(v.cssPrefix, "-").concat(ot.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(v.cssPrefix, "-").concat(ot.PRIMARY),
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
const Xa = {
  found: !1,
  width: 512,
  height: 512
};
function Ka(e, t) {
  !Qn && !v.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function It(e, t) {
  let n = t;
  return t === "fa" && v.styleDefault !== null && (t = ge()), new Promise((r, a) => {
    if (n === "fa") {
      const o = mr(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && lt[t] && lt[t][e]) {
      const o = lt[t][e];
      return r(Tt(o));
    }
    Ka(e, t), r(u(u({}, Xa), {}, {
      icon: v.showMissingIcons && e ? be("missingIconAbstract") || {} : {}
    }));
  });
}
const mn = () => {
}, _t = v.measurePerformance && Ge && Ge.mark && Ge.measure ? Ge : {
  mark: mn,
  measure: mn
}, Fe = 'FA "6.7.2"', Ja = (e) => (_t.mark("".concat(Fe, " ").concat(e, " begins")), () => hr(e)), hr = (e) => {
  _t.mark("".concat(Fe, " ").concat(e, " ends")), _t.measure("".concat(Fe, " ").concat(e), "".concat(Fe, " ").concat(e, " begins"), "".concat(Fe, " ").concat(e, " ends"));
};
var Ht = {
  begin: Ja,
  end: hr
};
const He = () => {
};
function gn(e) {
  return typeof (e.getAttribute ? e.getAttribute(xe) : null) == "string";
}
function Za(e) {
  const t = e.getAttribute ? e.getAttribute(Yt) : null, n = e.getAttribute ? e.getAttribute(Wt) : null;
  return t && n;
}
function Qa(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(v.replacementClass);
}
function eo() {
  return v.autoReplaceSvg === !0 ? Xe.replace : Xe[v.autoReplaceSvg] || Xe.replace;
}
function to(e) {
  return $.createElementNS("http://www.w3.org/2000/svg", e);
}
function no(e) {
  return $.createElement(e);
}
function yr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? to : no
  } = t;
  if (typeof e == "string")
    return $.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(yr(o, {
      ceFn: n
    }));
  }), r;
}
function ro(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Xe = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(yr(n), t);
      }), t.getAttribute(xe) === null && v.keepOriginalSource) {
        let n = $.createComment(ro(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Ut(t).indexOf(v.replacementClass))
      return Xe.replace(e);
    const r = new RegExp("".concat(v.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((s, i) => (i === v.replacementClass || i.match(r) ? s.toSvg.push(i) : s.toNode.push(i), s), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => $e(o)).join(`
`);
    t.setAttribute(xe, ""), t.innerHTML = a;
  }
};
function bn(e) {
  e();
}
function vr(e, t) {
  const n = typeof t == "function" ? t : He;
  if (e.length === 0)
    n();
  else {
    let r = bn;
    v.mutateApproach === ia && (r = me.requestAnimationFrame || bn), r(() => {
      const a = eo(), o = Ht.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let Xt = !1;
function xr() {
  Xt = !0;
}
function Rt() {
  Xt = !1;
}
let Je = null;
function hn(e) {
  if (!nn || !v.observeMutations)
    return;
  const {
    treeCallback: t = He,
    nodeCallback: n = He,
    pseudoElementsCallback: r = He,
    observeMutationsRoot: a = $
  } = e;
  Je = new nn((o) => {
    if (Xt) return;
    const s = ge();
    _e(o).forEach((i) => {
      if (i.type === "childList" && i.addedNodes.length > 0 && !gn(i.addedNodes[0]) && (v.searchPseudoElements && r(i.target), t(i.target)), i.type === "attributes" && i.target.parentNode && v.searchPseudoElements && r(i.target.parentNode), i.type === "attributes" && gn(i.target) && ~da.indexOf(i.attributeName))
        if (i.attributeName === "class" && Za(i.target)) {
          const {
            prefix: l,
            iconName: c
          } = nt(Ut(i.target));
          i.target.setAttribute(Yt, l || s), c && i.target.setAttribute(Wt, c);
        } else Qa(i.target) && n(i.target);
    });
  }), se && Je.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function ao() {
  Je && Je.disconnect();
}
function oo(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), s = o[0], i = o.slice(1);
    return s && i.length > 0 && (r[s] = i.join(":").trim()), r;
  }, {})), n;
}
function io(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = nt(Ut(e));
  return a.prefix || (a.prefix = ge()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = _a(a.prefix, e.innerText) || Bt(a.prefix, Pt(e.innerText))), !a.iconName && v.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function so(e) {
  const t = _e(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return v.autoA11y && (n ? t["aria-labelledby"] = "".concat(v.replacementClass, "-title-").concat(r || De()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function lo() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: te,
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
function yn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = io(e), o = so(e), s = kt("parseNodeAttributes", {}, e);
  let i = t.styleParser ? oo(e) : [];
  return u({
    iconName: n,
    title: e.getAttribute("title"),
    titleId: e.getAttribute("data-fa-title-id"),
    prefix: r,
    transform: te,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: !1,
    extra: {
      classes: a,
      styles: i,
      attributes: o
    }
  }, s);
}
const {
  styles: co
} = ne;
function wr(e) {
  const t = v.autoReplaceSvg === "nest" ? yn(e, {
    styleParser: !1
  }) : yn(e);
  return ~t.extra.classes.indexOf(tr) ? be("generateLayersText", e, t) : be("generateSvgReplacementMutation", e, t);
}
function fo() {
  return [...Gr, ...vt];
}
function vn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!se) return Promise.resolve();
  const n = $.documentElement.classList, r = (f) => n.add("".concat(on, "-").concat(f)), a = (f) => n.remove("".concat(on, "-").concat(f)), o = v.autoFetchSvg ? fo() : Hn.concat(Object.keys(co));
  o.includes("fa") || o.push("fa");
  const s = [".".concat(tr, ":not([").concat(xe, "])")].concat(o.map((f) => ".".concat(f, ":not([").concat(xe, "])"))).join(", ");
  if (s.length === 0)
    return Promise.resolve();
  let i = [];
  try {
    i = _e(e.querySelectorAll(s));
  } catch {
  }
  if (i.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const l = Ht.begin("onTree"), c = i.reduce((f, m) => {
    try {
      const g = wr(m);
      g && f.push(g);
    } catch (g) {
      Qn || g.name === "MissingIcon" && console.error(g);
    }
    return f;
  }, []);
  return new Promise((f, m) => {
    Promise.all(c).then((g) => {
      vr(g, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), l(), f();
      });
    }).catch((g) => {
      l(), m(g);
    });
  });
}
function uo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  wr(e).then((n) => {
    n && vr([n], t);
  });
}
function po(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : Ct(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : Ct(a || {})), e(r, u(u({}, n), {}, {
      mask: a
    }));
  };
}
const mo = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = te,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: s = null,
    titleId: i = null,
    classes: l = [],
    attributes: c = {},
    styles: f = {}
  } = t;
  if (!e) return;
  const {
    prefix: m,
    iconName: g,
    icon: w
  } = e;
  return rt(u({
    type: "icon"
  }, e), () => (we("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), v.autoA11y && (s ? c["aria-labelledby"] = "".concat(v.replacementClass, "-title-").concat(i || De()) : (c["aria-hidden"] = "true", c.focusable = "false")), Vt({
    icons: {
      main: Tt(w),
      mask: a ? Tt(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: m,
    iconName: g,
    transform: u(u({}, te), n),
    symbol: r,
    title: s,
    maskId: o,
    titleId: i,
    extra: {
      attributes: c,
      styles: f,
      classes: l
    }
  })));
};
var go = {
  mixout() {
    return {
      icon: po(mo)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = vn, e.nodeCallback = uo, e;
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
      return vn(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: s,
        transform: i,
        symbol: l,
        mask: c,
        maskId: f,
        extra: m
      } = n;
      return new Promise((g, w) => {
        Promise.all([It(r, s), c.iconName ? It(c.iconName, c.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((S) => {
          let [x, y] = S;
          g([t, Vt({
            icons: {
              main: x,
              mask: y
            },
            prefix: s,
            iconName: r,
            transform: i,
            symbol: l,
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
        styles: s
      } = t;
      const i = et(s);
      i.length > 0 && (r.style = i);
      let l;
      return Gt(o) && (l = be("generateAbstractTransformGrouping", {
        main: a,
        transform: o,
        containerWidth: a.width,
        iconWidth: a.width
      })), n.push(l || a.icon), {
        children: n,
        attributes: r
      };
    };
  }
}, bo = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return rt({
          type: "layer"
        }, () => {
          we("beforeDOMElementCreation", {
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
}, ho = {
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
        return rt({
          type: "counter",
          content: e
        }, () => (we("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Ha({
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
}, yo = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = te,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: s = {}
        } = t;
        return rt({
          type: "text",
          content: e
        }, () => (we("beforeDOMElementCreation", {
          content: e,
          params: t
        }), pn({
          content: e,
          transform: u(u({}, te), n),
          title: r,
          extra: {
            attributes: o,
            styles: s,
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
      let s = null, i = null;
      if (Bn) {
        const l = parseInt(getComputedStyle(t).fontSize, 10), c = t.getBoundingClientRect();
        s = c.width / l, i = c.height / l;
      }
      return v.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, pn({
        content: t.innerHTML,
        width: s,
        height: i,
        transform: a,
        title: r,
        extra: o,
        watchable: !0
      })]);
    };
  }
};
const vo = new RegExp('"', "ug"), xn = [1105920, 1112319], wn = u(u(u(u({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), Wr), aa), Jr), Mt = Object.keys(wn).reduce((e, t) => (e[t.toLowerCase()] = wn[t], e), {}), xo = Object.keys(Mt).reduce((e, t) => {
  const n = Mt[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function wo(e) {
  const t = e.replace(vo, ""), n = Oa(t, 0), r = n >= xn[0] && n <= xn[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Pt(a ? t[0] : t),
    isSecondary: r || a
  };
}
function Ao(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (Mt[n] || {})[a] || xo[n];
}
function An(e, t) {
  const n = "".concat(oa).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const s = _e(e.children).filter((g) => g.getAttribute(wt) === t)[0], i = me.getComputedStyle(e, t), l = i.getPropertyValue("font-family"), c = l.match(fa), f = i.getPropertyValue("font-weight"), m = i.getPropertyValue("content");
    if (s && !c)
      return e.removeChild(s), r();
    if (c && m !== "none" && m !== "") {
      const g = i.getPropertyValue("content");
      let w = Ao(l, f);
      const {
        value: S,
        isSecondary: x
      } = wo(g), y = c[0].startsWith("FontAwesome");
      let A = Bt(w, S), k = A;
      if (y) {
        const O = Ra(S);
        O.iconName && O.prefix && (A = O.iconName, w = O.prefix);
      }
      if (A && !x && (!s || s.getAttribute(Yt) !== w || s.getAttribute(Wt) !== k)) {
        e.setAttribute(n, k), s && e.removeChild(s);
        const O = lo(), {
          extra: I
        } = O;
        I.attributes[wt] = t, It(A, w).then((p) => {
          const X = Vt(u(u({}, O), {}, {
            icons: {
              main: p,
              mask: gr()
            },
            prefix: w,
            iconName: k,
            extra: I,
            watchable: !0
          })), J = $.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(J, e.firstChild) : e.appendChild(J), J.outerHTML = X.map((le) => $e(le)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function Eo(e) {
  return Promise.all([An(e, "::before"), An(e, "::after")]);
}
function So(e) {
  return e.parentNode !== document.head && !~sa.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(wt) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function En(e) {
  if (se)
    return new Promise((t, n) => {
      const r = _e(e.querySelectorAll("*")).filter(So).map(Eo), a = Ht.begin("searchPseudoElements");
      xr(), Promise.all(r).then(() => {
        a(), Rt(), t();
      }).catch(() => {
        a(), Rt(), n();
      });
    });
}
var Po = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = En, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = $
      } = t;
      v.searchPseudoElements && En(n);
    };
  }
};
let Sn = !1;
var Oo = {
  mixout() {
    return {
      dom: {
        unwatch() {
          xr(), Sn = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        hn(kt("mutationObserverCallbacks", {}));
      },
      noAuto() {
        ao();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Sn ? Rt() : hn(kt("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const Pn = (e) => {
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
var ko = {
  mixout() {
    return {
      parse: {
        transform: (e) => Pn(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = Pn(n)), e;
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
      }, i = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), l = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), c = "rotate(".concat(r.rotate, " 0 0)"), f = {
        transform: "".concat(i, " ").concat(l, " ").concat(c)
      }, m = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, g = {
        outer: s,
        inner: f,
        path: m
      };
      return {
        tag: "g",
        attributes: u({}, g.outer),
        children: [{
          tag: "g",
          attributes: u({}, g.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: u(u({}, n.icon.attributes), g.path)
          }]
        }]
      };
    };
  }
};
const ct = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function On(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Co(e) {
  return e.tag === "g" ? e.children : [e];
}
var To = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? nt(n.split(" ").map((a) => a.trim())) : gr();
        return r.prefix || (r.prefix = ge()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        transform: i
      } = t;
      const {
        width: l,
        icon: c
      } = a, {
        width: f,
        icon: m
      } = o, g = xa({
        transform: i,
        containerWidth: f,
        iconWidth: l
      }), w = {
        tag: "rect",
        attributes: u(u({}, ct), {}, {
          fill: "white"
        })
      }, S = c.children ? {
        children: c.children.map(On)
      } : {}, x = {
        tag: "g",
        attributes: u({}, g.inner),
        children: [On(u({
          tag: c.tag,
          attributes: u(u({}, c.attributes), g.path)
        }, S))]
      }, y = {
        tag: "g",
        attributes: u({}, g.outer),
        children: [x]
      }, A = "mask-".concat(s || De()), k = "clip-".concat(s || De()), O = {
        tag: "mask",
        attributes: u(u({}, ct), {}, {
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
            id: k
          },
          children: Co(m)
        }, O]
      };
      return n.push(I, {
        tag: "rect",
        attributes: u({
          fill: "currentColor",
          "clip-path": "url(#".concat(k, ")"),
          mask: "url(#".concat(A, ")")
        }, ct)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Io = {
  provides(e) {
    let t = !1;
    me.matchMedia && (t = me.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
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
      }), s = {
        tag: "circle",
        attributes: u(u({}, r), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      return t || s.children.push({
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
      }), n.push(s), n.push({
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
}, _o = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, Ro = [Ea, go, bo, ho, yo, Po, Oo, ko, To, Io, _o];
Wa(Ro, {
  mixoutsTo: H
});
H.noAuto;
H.config;
H.library;
H.dom;
const Nt = H.parse;
H.findIconDefinition;
H.toHtml;
const Mo = H.icon;
H.layer;
H.text;
H.counter;
function No(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Be = { exports: {} }, Ve = { exports: {} }, z = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var kn;
function Fo() {
  if (kn) return z;
  kn = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, i = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, S = e ? Symbol.for("react.lazy") : 60116, x = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, A = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function O(p) {
    if (typeof p == "object" && p !== null) {
      var X = p.$$typeof;
      switch (X) {
        case t:
          switch (p = p.type, p) {
            case l:
            case c:
            case r:
            case o:
            case a:
            case m:
              return p;
            default:
              switch (p = p && p.$$typeof, p) {
                case i:
                case f:
                case S:
                case w:
                case s:
                  return p;
                default:
                  return X;
              }
          }
        case n:
          return X;
      }
    }
  }
  function I(p) {
    return O(p) === c;
  }
  return z.AsyncMode = l, z.ConcurrentMode = c, z.ContextConsumer = i, z.ContextProvider = s, z.Element = t, z.ForwardRef = f, z.Fragment = r, z.Lazy = S, z.Memo = w, z.Portal = n, z.Profiler = o, z.StrictMode = a, z.Suspense = m, z.isAsyncMode = function(p) {
    return I(p) || O(p) === l;
  }, z.isConcurrentMode = I, z.isContextConsumer = function(p) {
    return O(p) === i;
  }, z.isContextProvider = function(p) {
    return O(p) === s;
  }, z.isElement = function(p) {
    return typeof p == "object" && p !== null && p.$$typeof === t;
  }, z.isForwardRef = function(p) {
    return O(p) === f;
  }, z.isFragment = function(p) {
    return O(p) === r;
  }, z.isLazy = function(p) {
    return O(p) === S;
  }, z.isMemo = function(p) {
    return O(p) === w;
  }, z.isPortal = function(p) {
    return O(p) === n;
  }, z.isProfiler = function(p) {
    return O(p) === o;
  }, z.isStrictMode = function(p) {
    return O(p) === a;
  }, z.isSuspense = function(p) {
    return O(p) === m;
  }, z.isValidElementType = function(p) {
    return typeof p == "string" || typeof p == "function" || p === r || p === c || p === o || p === a || p === m || p === g || typeof p == "object" && p !== null && (p.$$typeof === S || p.$$typeof === w || p.$$typeof === s || p.$$typeof === i || p.$$typeof === f || p.$$typeof === y || p.$$typeof === A || p.$$typeof === k || p.$$typeof === x);
  }, z.typeOf = O, z;
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
var Cn;
function jo() {
  return Cn || (Cn = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, s = e ? Symbol.for("react.provider") : 60109, i = e ? Symbol.for("react.context") : 60110, l = e ? Symbol.for("react.async_mode") : 60111, c = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, m = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, S = e ? Symbol.for("react.lazy") : 60116, x = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, A = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function O(h) {
      return typeof h == "string" || typeof h == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      h === r || h === c || h === o || h === a || h === m || h === g || typeof h == "object" && h !== null && (h.$$typeof === S || h.$$typeof === w || h.$$typeof === s || h.$$typeof === i || h.$$typeof === f || h.$$typeof === y || h.$$typeof === A || h.$$typeof === k || h.$$typeof === x);
    }
    function I(h) {
      if (typeof h == "object" && h !== null) {
        var Q = h.$$typeof;
        switch (Q) {
          case t:
            var Ue = h.type;
            switch (Ue) {
              case l:
              case c:
              case r:
              case o:
              case a:
              case m:
                return Ue;
              default:
                var Zt = Ue && Ue.$$typeof;
                switch (Zt) {
                  case i:
                  case f:
                  case S:
                  case w:
                  case s:
                    return Zt;
                  default:
                    return Q;
                }
            }
          case n:
            return Q;
        }
      }
    }
    var p = l, X = c, J = i, le = s, he = t, ye = f, ce = r, Y = S, Ae = w, K = n, Ee = o, q = a, Z = m, fe = !1;
    function re(h) {
      return fe || (fe = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(h) || I(h) === l;
    }
    function d(h) {
      return I(h) === c;
    }
    function b(h) {
      return I(h) === i;
    }
    function M(h) {
      return I(h) === s;
    }
    function _(h) {
      return typeof h == "object" && h !== null && h.$$typeof === t;
    }
    function P(h) {
      return I(h) === f;
    }
    function N(h) {
      return I(h) === r;
    }
    function C(h) {
      return I(h) === S;
    }
    function R(h) {
      return I(h) === w;
    }
    function F(h) {
      return I(h) === n;
    }
    function D(h) {
      return I(h) === o;
    }
    function j(h) {
      return I(h) === a;
    }
    function B(h) {
      return I(h) === m;
    }
    L.AsyncMode = p, L.ConcurrentMode = X, L.ContextConsumer = J, L.ContextProvider = le, L.Element = he, L.ForwardRef = ye, L.Fragment = ce, L.Lazy = Y, L.Memo = Ae, L.Portal = K, L.Profiler = Ee, L.StrictMode = q, L.Suspense = Z, L.isAsyncMode = re, L.isConcurrentMode = d, L.isContextConsumer = b, L.isContextProvider = M, L.isElement = _, L.isForwardRef = P, L.isFragment = N, L.isLazy = C, L.isMemo = R, L.isPortal = F, L.isProfiler = D, L.isStrictMode = j, L.isSuspense = B, L.isValidElementType = O, L.typeOf = I;
  }()), L;
}
var Tn;
function Ar() {
  return Tn || (Tn = 1, process.env.NODE_ENV === "production" ? Ve.exports = Fo() : Ve.exports = jo()), Ve.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var ft, In;
function zo() {
  if (In) return ft;
  In = 1;
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
      for (var s = {}, i = 0; i < 10; i++)
        s["_" + String.fromCharCode(i)] = i;
      var l = Object.getOwnPropertyNames(s).map(function(f) {
        return s[f];
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
  return ft = a() ? Object.assign : function(o, s) {
    for (var i, l = r(o), c, f = 1; f < arguments.length; f++) {
      i = Object(arguments[f]);
      for (var m in i)
        t.call(i, m) && (l[m] = i[m]);
      if (e) {
        c = e(i);
        for (var g = 0; g < c.length; g++)
          n.call(i, c[g]) && (l[c[g]] = i[c[g]]);
      }
    }
    return l;
  }, ft;
}
var ut, _n;
function Kt() {
  if (_n) return ut;
  _n = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return ut = e, ut;
}
var dt, Rn;
function Er() {
  return Rn || (Rn = 1, dt = Function.call.bind(Object.prototype.hasOwnProperty)), dt;
}
var pt, Mn;
function Lo() {
  if (Mn) return pt;
  Mn = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ Kt(), n = {}, r = /* @__PURE__ */ Er();
    e = function(o) {
      var s = "Warning: " + o;
      typeof console < "u" && console.error(s);
      try {
        throw new Error(s);
      } catch {
      }
    };
  }
  function a(o, s, i, l, c) {
    if (process.env.NODE_ENV !== "production") {
      for (var f in o)
        if (r(o, f)) {
          var m;
          try {
            if (typeof o[f] != "function") {
              var g = Error(
                (l || "React class") + ": " + i + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw g.name = "Invariant Violation", g;
            }
            m = o[f](s, f, l, i, null, t);
          } catch (S) {
            m = S;
          }
          if (m && !(m instanceof Error) && e(
            (l || "React class") + ": type specification of " + i + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof m + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), m instanceof Error && !(m.message in n)) {
            n[m.message] = !0;
            var w = c ? c() : "";
            e(
              "Failed " + i + " type: " + m.message + (w ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, pt = a, pt;
}
var mt, Nn;
function Do() {
  if (Nn) return mt;
  Nn = 1;
  var e = Ar(), t = zo(), n = /* @__PURE__ */ Kt(), r = /* @__PURE__ */ Er(), a = /* @__PURE__ */ Lo(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(i) {
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
  return mt = function(i, l) {
    var c = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function m(d) {
      var b = d && (c && d[c] || d[f]);
      if (typeof b == "function")
        return b;
    }
    var g = "<<anonymous>>", w = {
      array: A("array"),
      bigint: A("bigint"),
      bool: A("boolean"),
      func: A("function"),
      number: A("number"),
      object: A("object"),
      string: A("string"),
      symbol: A("symbol"),
      any: k(),
      arrayOf: O,
      element: I(),
      elementType: p(),
      instanceOf: X,
      node: ye(),
      objectOf: le,
      oneOf: J,
      oneOfType: he,
      shape: Y,
      exact: Ae
    };
    function S(d, b) {
      return d === b ? d !== 0 || 1 / d === 1 / b : d !== d && b !== b;
    }
    function x(d, b) {
      this.message = d, this.data = b && typeof b == "object" ? b : {}, this.stack = "";
    }
    x.prototype = Error.prototype;
    function y(d) {
      if (process.env.NODE_ENV !== "production")
        var b = {}, M = 0;
      function _(N, C, R, F, D, j, B) {
        if (F = F || g, j = j || R, B !== n) {
          if (l) {
            var h = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw h.name = "Invariant Violation", h;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var Q = F + ":" + R;
            !b[Q] && // Avoid spamming the console because they are often not actionable except for lib authors
            M < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + j + "` prop on `" + F + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), b[Q] = !0, M++);
          }
        }
        return C[R] == null ? N ? C[R] === null ? new x("The " + D + " `" + j + "` is marked as required " + ("in `" + F + "`, but its value is `null`.")) : new x("The " + D + " `" + j + "` is marked as required in " + ("`" + F + "`, but its value is `undefined`.")) : null : d(C, R, F, D, j);
      }
      var P = _.bind(null, !1);
      return P.isRequired = _.bind(null, !0), P;
    }
    function A(d) {
      function b(M, _, P, N, C, R) {
        var F = M[_], D = q(F);
        if (D !== d) {
          var j = Z(F);
          return new x(
            "Invalid " + N + " `" + C + "` of type " + ("`" + j + "` supplied to `" + P + "`, expected ") + ("`" + d + "`."),
            { expectedType: d }
          );
        }
        return null;
      }
      return y(b);
    }
    function k() {
      return y(s);
    }
    function O(d) {
      function b(M, _, P, N, C) {
        if (typeof d != "function")
          return new x("Property `" + C + "` of component `" + P + "` has invalid PropType notation inside arrayOf.");
        var R = M[_];
        if (!Array.isArray(R)) {
          var F = q(R);
          return new x("Invalid " + N + " `" + C + "` of type " + ("`" + F + "` supplied to `" + P + "`, expected an array."));
        }
        for (var D = 0; D < R.length; D++) {
          var j = d(R, D, P, N, C + "[" + D + "]", n);
          if (j instanceof Error)
            return j;
        }
        return null;
      }
      return y(b);
    }
    function I() {
      function d(b, M, _, P, N) {
        var C = b[M];
        if (!i(C)) {
          var R = q(C);
          return new x("Invalid " + P + " `" + N + "` of type " + ("`" + R + "` supplied to `" + _ + "`, expected a single ReactElement."));
        }
        return null;
      }
      return y(d);
    }
    function p() {
      function d(b, M, _, P, N) {
        var C = b[M];
        if (!e.isValidElementType(C)) {
          var R = q(C);
          return new x("Invalid " + P + " `" + N + "` of type " + ("`" + R + "` supplied to `" + _ + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return y(d);
    }
    function X(d) {
      function b(M, _, P, N, C) {
        if (!(M[_] instanceof d)) {
          var R = d.name || g, F = re(M[_]);
          return new x("Invalid " + N + " `" + C + "` of type " + ("`" + F + "` supplied to `" + P + "`, expected ") + ("instance of `" + R + "`."));
        }
        return null;
      }
      return y(b);
    }
    function J(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), s;
      function b(M, _, P, N, C) {
        for (var R = M[_], F = 0; F < d.length; F++)
          if (S(R, d[F]))
            return null;
        var D = JSON.stringify(d, function(B, h) {
          var Q = Z(h);
          return Q === "symbol" ? String(h) : h;
        });
        return new x("Invalid " + N + " `" + C + "` of value `" + String(R) + "` " + ("supplied to `" + P + "`, expected one of " + D + "."));
      }
      return y(b);
    }
    function le(d) {
      function b(M, _, P, N, C) {
        if (typeof d != "function")
          return new x("Property `" + C + "` of component `" + P + "` has invalid PropType notation inside objectOf.");
        var R = M[_], F = q(R);
        if (F !== "object")
          return new x("Invalid " + N + " `" + C + "` of type " + ("`" + F + "` supplied to `" + P + "`, expected an object."));
        for (var D in R)
          if (r(R, D)) {
            var j = d(R, D, P, N, C + "." + D, n);
            if (j instanceof Error)
              return j;
          }
        return null;
      }
      return y(b);
    }
    function he(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), s;
      for (var b = 0; b < d.length; b++) {
        var M = d[b];
        if (typeof M != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + fe(M) + " at index " + b + "."
          ), s;
      }
      function _(P, N, C, R, F) {
        for (var D = [], j = 0; j < d.length; j++) {
          var B = d[j], h = B(P, N, C, R, F, n);
          if (h == null)
            return null;
          h.data && r(h.data, "expectedType") && D.push(h.data.expectedType);
        }
        var Q = D.length > 0 ? ", expected one of type [" + D.join(", ") + "]" : "";
        return new x("Invalid " + R + " `" + F + "` supplied to " + ("`" + C + "`" + Q + "."));
      }
      return y(_);
    }
    function ye() {
      function d(b, M, _, P, N) {
        return K(b[M]) ? null : new x("Invalid " + P + " `" + N + "` supplied to " + ("`" + _ + "`, expected a ReactNode."));
      }
      return y(d);
    }
    function ce(d, b, M, _, P) {
      return new x(
        (d || "React class") + ": " + b + " type `" + M + "." + _ + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + P + "`."
      );
    }
    function Y(d) {
      function b(M, _, P, N, C) {
        var R = M[_], F = q(R);
        if (F !== "object")
          return new x("Invalid " + N + " `" + C + "` of type `" + F + "` " + ("supplied to `" + P + "`, expected `object`."));
        for (var D in d) {
          var j = d[D];
          if (typeof j != "function")
            return ce(P, N, C, D, Z(j));
          var B = j(R, D, P, N, C + "." + D, n);
          if (B)
            return B;
        }
        return null;
      }
      return y(b);
    }
    function Ae(d) {
      function b(M, _, P, N, C) {
        var R = M[_], F = q(R);
        if (F !== "object")
          return new x("Invalid " + N + " `" + C + "` of type `" + F + "` " + ("supplied to `" + P + "`, expected `object`."));
        var D = t({}, M[_], d);
        for (var j in D) {
          var B = d[j];
          if (r(d, j) && typeof B != "function")
            return ce(P, N, C, j, Z(B));
          if (!B)
            return new x(
              "Invalid " + N + " `" + C + "` key `" + j + "` supplied to `" + P + "`.\nBad object: " + JSON.stringify(M[_], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(d), null, "  ")
            );
          var h = B(R, j, P, N, C + "." + j, n);
          if (h)
            return h;
        }
        return null;
      }
      return y(b);
    }
    function K(d) {
      switch (typeof d) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !d;
        case "object":
          if (Array.isArray(d))
            return d.every(K);
          if (d === null || i(d))
            return !0;
          var b = m(d);
          if (b) {
            var M = b.call(d), _;
            if (b !== d.entries) {
              for (; !(_ = M.next()).done; )
                if (!K(_.value))
                  return !1;
            } else
              for (; !(_ = M.next()).done; ) {
                var P = _.value;
                if (P && !K(P[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function Ee(d, b) {
      return d === "symbol" ? !0 : b ? b["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && b instanceof Symbol : !1;
    }
    function q(d) {
      var b = typeof d;
      return Array.isArray(d) ? "array" : d instanceof RegExp ? "object" : Ee(b, d) ? "symbol" : b;
    }
    function Z(d) {
      if (typeof d > "u" || d === null)
        return "" + d;
      var b = q(d);
      if (b === "object") {
        if (d instanceof Date)
          return "date";
        if (d instanceof RegExp)
          return "regexp";
      }
      return b;
    }
    function fe(d) {
      var b = Z(d);
      switch (b) {
        case "array":
        case "object":
          return "an " + b;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + b;
        default:
          return b;
      }
    }
    function re(d) {
      return !d.constructor || !d.constructor.name ? g : d.constructor.name;
    }
    return w.checkPropTypes = a, w.resetWarningCache = a.resetWarningCache, w.PropTypes = w, w;
  }, mt;
}
var gt, Fn;
function Yo() {
  if (Fn) return gt;
  Fn = 1;
  var e = /* @__PURE__ */ Kt();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, gt = function() {
    function r(s, i, l, c, f, m) {
      if (m !== e) {
        var g = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw g.name = "Invariant Violation", g;
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
  }, gt;
}
var jn;
function Wo() {
  if (jn) return Be.exports;
  if (jn = 1, process.env.NODE_ENV !== "production") {
    var e = Ar(), t = !0;
    Be.exports = /* @__PURE__ */ Do()(e.isElement, t);
  } else
    Be.exports = /* @__PURE__ */ Yo()();
  return Be.exports;
}
var $o = /* @__PURE__ */ Wo();
const T = /* @__PURE__ */ No($o);
function zn(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function ee(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? zn(Object(n), !0).forEach(function(r) {
      ke(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : zn(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Ze(e) {
  "@babel/helpers - typeof";
  return Ze = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Ze(e);
}
function ke(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Uo(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function Go(e, t) {
  if (e == null) return {};
  var n = Uo(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Ft(e) {
  return qo(e) || Bo(e) || Vo(e) || Ho();
}
function qo(e) {
  if (Array.isArray(e)) return jt(e);
}
function Bo(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Vo(e, t) {
  if (e) {
    if (typeof e == "string") return jt(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return jt(e, t);
  }
}
function jt(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Ho() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Xo(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, s = e.shake, i = e.flash, l = e.spin, c = e.spinPulse, f = e.spinReverse, m = e.pulse, g = e.fixedWidth, w = e.inverse, S = e.border, x = e.listItem, y = e.flip, A = e.size, k = e.rotation, O = e.pull, I = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": s,
    "fa-flash": i,
    "fa-spin": l,
    "fa-spin-reverse": f,
    "fa-spin-pulse": c,
    "fa-pulse": m,
    "fa-fw": g,
    "fa-inverse": w,
    "fa-border": S,
    "fa-li": x,
    "fa-flip": y === !0,
    "fa-flip-horizontal": y === "horizontal" || y === "both",
    "fa-flip-vertical": y === "vertical" || y === "both"
  }, ke(t, "fa-".concat(A), typeof A < "u" && A !== null), ke(t, "fa-rotate-".concat(k), typeof k < "u" && k !== null && k !== 0), ke(t, "fa-pull-".concat(O), typeof O < "u" && O !== null), ke(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(I).map(function(p) {
    return I[p] ? p : null;
  }).filter(function(p) {
    return p;
  });
}
function Ko(e) {
  return e = e - 0, e === e;
}
function Sr(e) {
  return Ko(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Jo = ["style"];
function Zo(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Qo(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Sr(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[Zo(a)] = o : t[a] = o, t;
  }, {});
}
function Pr(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(l) {
    return Pr(e, l);
  }), a = Object.keys(t.attributes || {}).reduce(function(l, c) {
    var f = t.attributes[c];
    switch (c) {
      case "class":
        l.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        l.attrs.style = Qo(f);
        break;
      default:
        c.indexOf("aria-") === 0 || c.indexOf("data-") === 0 ? l.attrs[c.toLowerCase()] = f : l.attrs[Sr(c)] = f;
    }
    return l;
  }, {
    attrs: {}
  }), o = n.style, s = o === void 0 ? {} : o, i = Go(n, Jo);
  return a.attrs.style = ee(ee({}, a.attrs.style), s), e.apply(void 0, [t.tag, ee(ee({}, a.attrs), i)].concat(Ft(r)));
}
var Or = !1;
try {
  Or = process.env.NODE_ENV === "production";
} catch {
}
function ei() {
  if (!Or && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function Ln(e) {
  if (e && Ze(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (Nt.icon)
    return Nt.icon(e);
  if (e === null)
    return null;
  if (e && Ze(e) === "object" && e.prefix && e.iconName)
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
function bt(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? ke({}, e, t) : {};
}
var Dn = {
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
}, V = /* @__PURE__ */ $n.forwardRef(function(e, t) {
  var n = ee(ee({}, Dn), e), r = n.icon, a = n.mask, o = n.symbol, s = n.className, i = n.title, l = n.titleId, c = n.maskId, f = Ln(r), m = bt("classes", [].concat(Ft(Xo(n)), Ft((s || "").split(" ")))), g = bt("transform", typeof n.transform == "string" ? Nt.transform(n.transform) : n.transform), w = bt("mask", Ln(a)), S = Mo(f, ee(ee(ee(ee({}, m), g), w), {}, {
    symbol: o,
    title: i,
    titleId: l,
    maskId: c
  }));
  if (!S)
    return ei("Could not find icon", f), null;
  var x = S.abstract, y = {
    ref: t
  };
  return Object.keys(n).forEach(function(A) {
    Dn.hasOwnProperty(A) || (y[A] = n[A]);
  }), ti(x[0], y);
});
V.displayName = "FontAwesomeIcon";
V.propTypes = {
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
var ti = Pr.bind(null, $n.createElement);
const Jt = "-", ni = (e) => {
  const t = ai(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (s) => {
      const i = s.split(Jt);
      return i[0] === "" && i.length !== 1 && i.shift(), kr(i, t) || ri(s);
    },
    getConflictingClassGroupIds: (s, i) => {
      const l = n[s] || [];
      return i && r[s] ? [...l, ...r[s]] : l;
    }
  };
}, kr = (e, t) => {
  var s;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), a = r ? kr(e.slice(1), r) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const o = e.join(Jt);
  return (s = t.validators.find(({
    validator: i
  }) => i(o))) == null ? void 0 : s.classGroupId;
}, Yn = /^\[(.+)\]$/, ri = (e) => {
  if (Yn.test(e)) {
    const t = Yn.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, ai = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return ii(Object.entries(e.classGroups), n).forEach(([o, s]) => {
    zt(s, r, o, t);
  }), r;
}, zt = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : Wn(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (oi(a)) {
        zt(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, s]) => {
      zt(s, Wn(t, o), n, r);
    });
  });
}, Wn = (e, t) => {
  let n = e;
  return t.split(Jt).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, oi = (e) => e.isThemeGetter, ii = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([s, i]) => [t + s, i])) : o);
  return [n, a];
}) : e, si = (e) => {
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
}, Cr = "!", li = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, s = (i) => {
    const l = [];
    let c = 0, f = 0, m;
    for (let y = 0; y < i.length; y++) {
      let A = i[y];
      if (c === 0) {
        if (A === a && (r || i.slice(y, y + o) === t)) {
          l.push(i.slice(f, y)), f = y + o;
          continue;
        }
        if (A === "/") {
          m = y;
          continue;
        }
      }
      A === "[" ? c++ : A === "]" && c--;
    }
    const g = l.length === 0 ? i : i.substring(f), w = g.startsWith(Cr), S = w ? g.substring(1) : g, x = m && m > f ? m - f : void 0;
    return {
      modifiers: l,
      hasImportantModifier: w,
      baseClassName: S,
      maybePostfixModifierPosition: x
    };
  };
  return n ? (i) => n({
    className: i,
    parseClassName: s
  }) : s;
}, ci = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, fi = (e) => ({
  cache: si(e.cacheSize),
  parseClassName: li(e),
  ...ni(e)
}), ui = /\s+/, di = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], s = e.trim().split(ui);
  let i = "";
  for (let l = s.length - 1; l >= 0; l -= 1) {
    const c = s[l], {
      modifiers: f,
      hasImportantModifier: m,
      baseClassName: g,
      maybePostfixModifierPosition: w
    } = n(c);
    let S = !!w, x = r(S ? g.substring(0, w) : g);
    if (!x) {
      if (!S) {
        i = c + (i.length > 0 ? " " + i : i);
        continue;
      }
      if (x = r(g), !x) {
        i = c + (i.length > 0 ? " " + i : i);
        continue;
      }
      S = !1;
    }
    const y = ci(f).join(":"), A = m ? y + Cr : y, k = A + x;
    if (o.includes(k))
      continue;
    o.push(k);
    const O = a(x, S);
    for (let I = 0; I < O.length; ++I) {
      const p = O[I];
      o.push(A + p);
    }
    i = c + (i.length > 0 ? " " + i : i);
  }
  return i;
};
function pi() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Tr(t)) && (r && (r += " "), r += n);
  return r;
}
const Tr = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Tr(e[r])) && (n && (n += " "), n += t);
  return n;
};
function mi(e, ...t) {
  let n, r, a, o = s;
  function s(l) {
    const c = t.reduce((f, m) => m(f), e());
    return n = fi(c), r = n.cache.get, a = n.cache.set, o = i, i(l);
  }
  function i(l) {
    const c = r(l);
    if (c)
      return c;
    const f = di(l, n);
    return a(l, f), f;
  }
  return function() {
    return o(pi.apply(null, arguments));
  };
}
const W = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Ir = /^\[(?:([a-z-]+):)?(.+)\]$/i, gi = /^\d+\/\d+$/, bi = /* @__PURE__ */ new Set(["px", "full", "screen"]), hi = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, yi = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, vi = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, xi = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, wi = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, ae = (e) => Te(e) || bi.has(e) || gi.test(e), de = (e) => Re(e, "length", Ti), Te = (e) => !!e && !Number.isNaN(Number(e)), ht = (e) => Re(e, "number", Te), Me = (e) => !!e && Number.isInteger(Number(e)), Ai = (e) => e.endsWith("%") && Te(e.slice(0, -1)), E = (e) => Ir.test(e), pe = (e) => hi.test(e), Ei = /* @__PURE__ */ new Set(["length", "size", "percentage"]), Si = (e) => Re(e, Ei, _r), Pi = (e) => Re(e, "position", _r), Oi = /* @__PURE__ */ new Set(["image", "url"]), ki = (e) => Re(e, Oi, _i), Ci = (e) => Re(e, "", Ii), Ne = () => !0, Re = (e, t, n) => {
  const r = Ir.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, Ti = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  yi.test(e) && !vi.test(e)
), _r = () => !1, Ii = (e) => xi.test(e), _i = (e) => wi.test(e), Ri = () => {
  const e = W("colors"), t = W("spacing"), n = W("blur"), r = W("brightness"), a = W("borderColor"), o = W("borderRadius"), s = W("borderSpacing"), i = W("borderWidth"), l = W("contrast"), c = W("grayscale"), f = W("hueRotate"), m = W("invert"), g = W("gap"), w = W("gradientColorStops"), S = W("gradientColorStopPositions"), x = W("inset"), y = W("margin"), A = W("opacity"), k = W("padding"), O = W("saturate"), I = W("scale"), p = W("sepia"), X = W("skew"), J = W("space"), le = W("translate"), he = () => ["auto", "contain", "none"], ye = () => ["auto", "hidden", "clip", "visible", "scroll"], ce = () => ["auto", E, t], Y = () => [E, t], Ae = () => ["", ae, de], K = () => ["auto", Te, E], Ee = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], q = () => ["solid", "dashed", "dotted", "double", "none"], Z = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], fe = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], re = () => ["", "0", E], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], b = () => [Te, E];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Ne],
      spacing: [ae, de],
      blur: ["none", "", pe, E],
      brightness: b(),
      borderColor: [e],
      borderRadius: ["none", "", "full", pe, E],
      borderSpacing: Y(),
      borderWidth: Ae(),
      contrast: b(),
      grayscale: re(),
      hueRotate: b(),
      invert: re(),
      gap: Y(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Ai, de],
      inset: ce(),
      margin: ce(),
      opacity: b(),
      padding: Y(),
      saturate: b(),
      scale: b(),
      sepia: re(),
      skew: b(),
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
        columns: [pe]
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
        object: [...Ee(), E]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: ye()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": ye()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": ye()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: he()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": he()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": he()
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
        z: ["auto", Me, E]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: ce()
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
        order: ["first", "last", "none", Me, E]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Ne]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Me, E]
        }, E]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": K()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": K()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Ne]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Me, E]
        }, E]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": K()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": K()
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
        gap: [g]
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": [g]
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": [g]
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: ["normal", ...fe()]
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
        content: ["normal", ...fe(), "baseline"]
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
        "place-content": [...fe(), "baseline"]
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
        "space-x": [J]
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
        "space-y": [J]
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
          screen: [pe]
        }, pe]
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
        text: ["base", pe, de]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", ht]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Ne]
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
        "line-clamp": ["none", Te, ht]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", ae, E]
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
        decoration: [...q(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", ae, de]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", ae, E]
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
        bg: [...Ee(), Pi]
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
        bg: ["auto", "cover", "contain", Si]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, ki]
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
        from: [S]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [S]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [S]
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
        "border-opacity": [A]
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
        "divide-opacity": [A]
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
        outline: ["", ...q()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [ae, E]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [ae, de]
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
        ring: Ae()
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
        "ring-offset": [ae, de]
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
        shadow: ["", "inner", "none", pe, Ci]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Ne]
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
        "drop-shadow": ["", "none", pe, E]
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
        invert: [m]
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
        "backdrop-saturate": [O]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", E]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: b()
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
        delay: b()
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
        rotate: [Me, E]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [le]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [le]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [X]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [X]
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
        stroke: [ae, de, ht]
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
}, Lt = /* @__PURE__ */ mi(Ri);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Pe = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
}, Mi = ({
  icon: e,
  iconClassName: t,
  children: n,
  className: r,
  htmlFor: a,
  variant: o = "primary",
  disabled: s,
  iconFlip: i = !1,
  loading: l,
  as: c = "button",
  href: f,
  target: m,
  ...g
}) => {
  function w(y) {
    switch (y) {
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
  const S = Lt(
    s || l ? "opacity-50 pointer-events-none" : ""
  ), x = Lt(
    "w-fit text-sm font-medium rounded-lg px-3 py-2 border border-transparent shadow-sm focus-visible:outline focus-visible:outline-0 focus-visible:outline-offset-0 transition-all duration-150 flex gap-2 items-center justify-center active:scale-95 transform",
    w(o),
    r,
    S
  );
  return a ? /* @__PURE__ */ at("label", { className: x, htmlFor: a, style: g.style, children: [
    l && !i ? /* @__PURE__ */ U(V, { icon: Pe, className: "animate-spin" }) : /* @__PURE__ */ U(Se, { children: e && !i ? /* @__PURE__ */ U(V, { icon: e, className: t }) : null }),
    n,
    l && i ? /* @__PURE__ */ U(V, { icon: Pe, className: "animate-spin" }) : /* @__PURE__ */ U(Se, { children: e && i ? /* @__PURE__ */ U(V, { icon: e, className: t }) : null })
  ] }) : c === "link" && f ? /* @__PURE__ */ at(
    "a",
    {
      href: f,
      className: x,
      style: g.style,
      ...g,
      target: m,
      children: [
        l && !i ? /* @__PURE__ */ U(V, { icon: Pe, className: "animate-spin" }) : /* @__PURE__ */ U(Se, { children: e && !i ? /* @__PURE__ */ U(V, { icon: e, className: t }) : null }),
        n,
        l && i ? /* @__PURE__ */ U(V, { icon: Pe, className: "animate-spin" }) : /* @__PURE__ */ U(Se, { children: e && i ? /* @__PURE__ */ U(V, { icon: e, className: t }) : null })
      ]
    }
  ) : /* @__PURE__ */ at(
    "button",
    {
      className: x,
      disabled: s || l,
      ...g,
      htmlFor: a,
      children: [
        l && !i ? /* @__PURE__ */ U(V, { icon: Pe, className: "animate-spin" }) : /* @__PURE__ */ U(Se, { children: e && !i ? /* @__PURE__ */ U(V, { icon: e, className: t }) : null }),
        n,
        l && i ? /* @__PURE__ */ U(V, { icon: Pe, className: "animate-spin" }) : /* @__PURE__ */ U(Se, { children: e && i ? /* @__PURE__ */ U(V, { icon: e, className: t }) : null })
      ]
    }
  );
}, zi = ({
  isActive: e,
  icon: t,
  activeIcon: n,
  onClick: r,
  className: a
}) => /* @__PURE__ */ U(
  Mi,
  {
    className: Lt(
      "flex h-9 w-9 items-center border-2 border-transparent text-sm text-white backdrop-blur-lg transition-all",
      e ? "border-white/20 bg-brand-primary/40 hover:border-white/30 hover:bg-brand-primary/40" : "bg-[#5F5F68]/60 hover:bg-[#5F5F68]/90",
      a
    ),
    variant: "secondary",
    icon: e && n ? n : t,
    onClick: r
  }
);
var Le = /* @__PURE__ */ ((e) => (e[e.ALL = 0] = "ALL", e[e.FEATURED = 1] = "FEATURED", e[e.MINE = 2] = "MINE", e[e.BOOKMARKED = 3] = "BOOKMARKED", e))(Le || {});
const Ni = [
  {
    text: "Featured",
    option: Le.FEATURED
  },
  {
    text: "Mine",
    option: Le.MINE
  },
  {
    text: "Bookmarked",
    option: Le.BOOKMARKED
  }
];
function Li({ onClick: e, value: t }) {
  return /* @__PURE__ */ U("div", { children: /* @__PURE__ */ U("div", { className: "flex gap-2 overflow-x-auto overflow-y-hidden px-4", children: Ni.map((n) => {
    const r = n.option === Le.BOOKMARKED;
    return /* @__PURE__ */ U(
      "button",
      {
        className: `filter-tab${t === n.option ? " active" : ""}`,
        disabled: r,
        onClick: () => e(n.option),
        children: n.text
      },
      n.option
    );
  }) }) });
}
export {
  Mi as Button,
  Li as FilterButtons,
  zi as ToggleButton
};
