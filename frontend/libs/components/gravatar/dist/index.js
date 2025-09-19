var kr = Object.defineProperty;
var Tr = (e, t, n) => t in e ? kr(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Ht = (e, t, n) => Tr(e, typeof t != "symbol" ? t + "" : t, n);
import { jsxs as Ir, jsx as Qe } from "react/jsx-runtime";
import Ln, { useState as _r } from "react";
const Mt = "-", Rr = (e) => {
  const t = Nr(e), {
    conflictingClassGroups: n,
    conflictingClassGroupModifiers: r
  } = e;
  return {
    getClassGroupId: (i) => {
      const s = i.split(Mt);
      return s[0] === "" && s.length !== 1 && s.shift(), Dn(s, t) || Mr(i);
    },
    getConflictingClassGroupIds: (i, s) => {
      const f = n[i] || [];
      return s && r[i] ? [...f, ...r[i]] : f;
    }
  };
}, Dn = (e, t) => {
  var i;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], r = t.nextPart.get(n), a = r ? Dn(e.slice(1), r) : void 0;
  if (a)
    return a;
  if (t.validators.length === 0)
    return;
  const o = e.join(Mt);
  return (i = t.validators.find(({
    validator: s
  }) => s(o))) == null ? void 0 : i.classGroupId;
}, Xt = /^\[(.+)\]$/, Mr = (e) => {
  if (Xt.test(e)) {
    const t = Xt.exec(e)[1], n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n)
      return "arbitrary.." + n;
  }
}, Nr = (e) => {
  const {
    theme: t,
    prefix: n
  } = e, r = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return jr(Object.entries(e.classGroups), n).forEach(([o, i]) => {
    mt(i, r, o, t);
  }), r;
}, mt = (e, t, n, r) => {
  e.forEach((a) => {
    if (typeof a == "string") {
      const o = a === "" ? t : Kt(t, a);
      o.classGroupId = n;
      return;
    }
    if (typeof a == "function") {
      if (Fr(a)) {
        mt(a(r), t, n, r);
        return;
      }
      t.validators.push({
        validator: a,
        classGroupId: n
      });
      return;
    }
    Object.entries(a).forEach(([o, i]) => {
      mt(i, Kt(t, o), n, r);
    });
  });
}, Kt = (e, t) => {
  let n = e;
  return t.split(Mt).forEach((r) => {
    n.nextPart.has(r) || n.nextPart.set(r, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), n = n.nextPart.get(r);
  }), n;
}, Fr = (e) => e.isThemeGetter, jr = (e, t) => t ? e.map(([n, r]) => {
  const a = r.map((o) => typeof o == "string" ? t + o : typeof o == "object" ? Object.fromEntries(Object.entries(o).map(([i, s]) => [t + i, s])) : o);
  return [n, a];
}) : e, zr = (e) => {
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
}, $n = "!", Lr = (e) => {
  const {
    separator: t,
    experimentalParseClassName: n
  } = e, r = t.length === 1, a = t[0], o = t.length, i = (s) => {
    const f = [];
    let l = 0, c = 0, p;
    for (let y = 0; y < s.length; y++) {
      let A = s[y];
      if (l === 0) {
        if (A === a && (r || s.slice(y, y + o) === t)) {
          f.push(s.slice(c, y)), c = y + o;
          continue;
        }
        if (A === "/") {
          p = y;
          continue;
        }
      }
      A === "[" ? l++ : A === "]" && l--;
    }
    const h = f.length === 0 ? s : s.substring(c), w = h.startsWith($n), O = w ? h.substring(1) : h, x = p && p > c ? p - c : void 0;
    return {
      modifiers: f,
      hasImportantModifier: w,
      baseClassName: O,
      maybePostfixModifierPosition: x
    };
  };
  return n ? (s) => n({
    className: s,
    parseClassName: i
  }) : i;
}, Dr = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let n = [];
  return e.forEach((r) => {
    r[0] === "[" ? (t.push(...n.sort(), r), n = []) : n.push(r);
  }), t.push(...n.sort()), t;
}, $r = (e) => ({
  cache: zr(e.cacheSize),
  parseClassName: Lr(e),
  ...Rr(e)
}), Yr = /\s+/, Wr = (e, t) => {
  const {
    parseClassName: n,
    getClassGroupId: r,
    getConflictingClassGroupIds: a
  } = t, o = [], i = e.trim().split(Yr);
  let s = "";
  for (let f = i.length - 1; f >= 0; f -= 1) {
    const l = i[f], {
      modifiers: c,
      hasImportantModifier: p,
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
    const y = Dr(c).join(":"), A = p ? y + $n : y, C = A + x;
    if (o.includes(C))
      continue;
    o.push(C);
    const P = a(x, O);
    for (let I = 0; I < P.length; ++I) {
      const m = P[I];
      o.push(A + m);
    }
    s = l + (s.length > 0 ? " " + s : s);
  }
  return s;
};
function Ur() {
  let e = 0, t, n, r = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Yn(t)) && (r && (r += " "), r += n);
  return r;
}
const Yn = (e) => {
  if (typeof e == "string")
    return e;
  let t, n = "";
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Yn(e[r])) && (n && (n += " "), n += t);
  return n;
};
function Gr(e, ...t) {
  let n, r, a, o = i;
  function i(f) {
    const l = t.reduce((c, p) => p(c), e());
    return n = $r(l), r = n.cache.get, a = n.cache.set, o = s, s(f);
  }
  function s(f) {
    const l = r(f);
    if (l)
      return l;
    const c = Wr(f, n);
    return a(f, c), c;
  }
  return function() {
    return o(Ur.apply(null, arguments));
  };
}
const Y = (e) => {
  const t = (n) => n[e] || [];
  return t.isThemeGetter = !0, t;
}, Wn = /^\[(?:([a-z-]+):)?(.+)\]$/i, qr = /^\d+\/\d+$/, Vr = /* @__PURE__ */ new Set(["px", "full", "screen"]), Br = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, Hr = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, Xr = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, Kr = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, Jr = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, ne = (e) => Se(e) || Vr.has(e) || qr.test(e), ce = (e) => Ce(e, "length", oa), Se = (e) => !!e && !Number.isNaN(Number(e)), et = (e) => Ce(e, "number", Se), Te = (e) => !!e && Number.isInteger(Number(e)), Zr = (e) => e.endsWith("%") && Se(e.slice(0, -1)), E = (e) => Wn.test(e), fe = (e) => Br.test(e), Qr = /* @__PURE__ */ new Set(["length", "size", "percentage"]), ea = (e) => Ce(e, Qr, Un), ta = (e) => Ce(e, "position", Un), na = /* @__PURE__ */ new Set(["image", "url"]), ra = (e) => Ce(e, na, sa), aa = (e) => Ce(e, "", ia), Ie = () => !0, Ce = (e, t, n) => {
  const r = Wn.exec(e);
  return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, oa = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  Hr.test(e) && !Xr.test(e)
), Un = () => !1, ia = (e) => Kr.test(e), sa = (e) => Jr.test(e), la = () => {
  const e = Y("colors"), t = Y("spacing"), n = Y("blur"), r = Y("brightness"), a = Y("borderColor"), o = Y("borderRadius"), i = Y("borderSpacing"), s = Y("borderWidth"), f = Y("contrast"), l = Y("grayscale"), c = Y("hueRotate"), p = Y("invert"), h = Y("gap"), w = Y("gradientColorStops"), O = Y("gradientColorStopPositions"), x = Y("inset"), y = Y("margin"), A = Y("opacity"), C = Y("padding"), P = Y("saturate"), I = Y("scale"), m = Y("sepia"), B = Y("skew"), X = Y("space"), ie = Y("translate"), ge = () => ["auto", "contain", "none"], he = () => ["auto", "hidden", "clip", "visible", "scroll"], se = () => ["auto", E, t], $ = () => [E, t], xe = () => ["", ne, ce], H = () => ["auto", Se, E], we = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], G = () => ["solid", "dashed", "dotted", "double", "none"], K = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], le = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], te = () => ["", "0", E], d = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], g = () => [Se, E];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Ie],
      spacing: [ne, ce],
      blur: ["none", "", fe, E],
      brightness: g(),
      borderColor: [e],
      borderRadius: ["none", "", "full", fe, E],
      borderSpacing: $(),
      borderWidth: xe(),
      contrast: g(),
      grayscale: te(),
      hueRotate: g(),
      invert: te(),
      gap: $(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Zr, ce],
      inset: se(),
      margin: se(),
      opacity: g(),
      padding: $(),
      saturate: g(),
      scale: g(),
      sepia: te(),
      skew: g(),
      space: $(),
      translate: $()
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
        columns: [fe]
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
          screen: [fe]
        }, fe]
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
        text: ["base", fe, ce]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", et]
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
        "line-clamp": ["none", Se, et]
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
        decoration: ["auto", "from-font", ne, ce]
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
        indent: $()
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
        bg: [...we(), ta]
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
        bg: ["auto", "cover", "contain", ea]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, ra]
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
        outline: [ne, ce]
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
        "ring-offset": [ne, ce]
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
        shadow: ["", "inner", "none", fe, aa]
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
        contrast: [f]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", fe, E]
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
        "hue-rotate": [c]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: [p]
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
        "backdrop-contrast": [f]
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
        "backdrop-hue-rotate": [c]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": [p]
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
        "scroll-m": $()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": $()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": $()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": $()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": $()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": $()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": $()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": $()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": $()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": $()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": $()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": $()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": $()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": $()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": $()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": $()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": $()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": $()
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
        stroke: [ne, ce, et]
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
}, ca = /* @__PURE__ */ Gr(la);
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const fa = {
  prefix: "fas",
  iconName: "spinner-third",
  icon: [512, 512, [], "f3f4", "M224 32c0-17.7 14.3-32 32-32C397.4 0 512 114.6 512 256c0 46.6-12.5 90.4-34.3 128c-8.8 15.3-28.4 20.5-43.7 11.7s-20.5-28.4-11.7-43.7c16.3-28.2 25.7-61 25.7-96c0-106-86-192-192-192c-17.7 0-32-14.3-32-32z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function ua(e, t, n) {
  return (t = ma(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Jt(e, t) {
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
    t % 2 ? Jt(Object(n), !0).forEach(function(r) {
      ua(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Jt(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function da(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function ma(e) {
  var t = da(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const Zt = () => {
};
let Nt = {}, Gn = {}, qn = null, Vn = {
  mark: Zt,
  measure: Zt
};
try {
  typeof window < "u" && (Nt = window), typeof document < "u" && (Gn = document), typeof MutationObserver < "u" && (qn = MutationObserver), typeof performance < "u" && (Vn = performance);
} catch {
}
const {
  userAgent: Qt = ""
} = Nt.navigator || {}, de = Nt, W = Gn, en = qn, De = Vn;
de.document;
const oe = !!W.documentElement && !!W.head && typeof W.addEventListener == "function" && typeof W.createElement == "function", Bn = ~Qt.indexOf("MSIE") || ~Qt.indexOf("Trident/");
var pa = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, ga = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Hn = {
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
}, ha = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Xn = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], U = "classic", He = "duotone", ba = "sharp", ya = "sharp-duotone", Kn = [U, He, ba, ya], va = {
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
}, xa = {
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
}, wa = /* @__PURE__ */ new Map([["classic", {
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
}]]), Aa = {
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
}, Ea = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], tn = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, Sa = ["kit"], Pa = {
  kit: {
    "fa-kit": "fak"
  }
}, Oa = ["fak", "fakd"], Ca = {
  kit: {
    fak: "fa-kit"
  }
}, nn = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, $e = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, ka = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Ta = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Ia = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, _a = {
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
}, Ra = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, pt = {
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
}, Ma = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], gt = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...ka, ...Ma], Na = ["solid", "regular", "light", "thin", "duotone", "brands"], Jn = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Fa = Jn.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), ja = [...Object.keys(Ra), ...Na, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", $e.GROUP, $e.SWAP_OPACITY, $e.PRIMARY, $e.SECONDARY].concat(Jn.map((e) => "".concat(e, "x"))).concat(Fa.map((e) => "w-".concat(e))), za = {
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
const re = "___FONT_AWESOME___", ht = 16, Zn = "fa", Qn = "svg-inline--fa", ye = "data-fa-i2svg", bt = "data-fa-pseudo-element", La = "data-fa-pseudo-element-pending", Ft = "data-prefix", jt = "data-icon", rn = "fontawesome-i2svg", Da = "async", $a = ["HTML", "HEAD", "STYLE", "SCRIPT"], er = (() => {
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
const tr = u({}, Hn);
tr[U] = u(u(u(u({}, {
  "fa-duotone": "duotone"
}), Hn[U]), tn.kit), tn["kit-duotone"]);
const Ya = je(tr), yt = u({}, Aa);
yt[U] = u(u(u(u({}, {
  duotone: "fad"
}), yt[U]), nn.kit), nn["kit-duotone"]);
const an = je(yt), vt = u({}, pt);
vt[U] = u(u({}, vt[U]), Ca.kit);
const zt = je(vt), xt = u({}, _a);
xt[U] = u(u({}, xt[U]), Pa.kit);
je(xt);
const Wa = pa, nr = "fa-layers-text", Ua = ga, Ga = u({}, va);
je(Ga);
const qa = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], tt = ha, Va = [...Sa, ...ja], Re = de.FontAwesomeConfig || {};
function Ba(e) {
  var t = W.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function Ha(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
W && typeof W.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const a = Ha(Ba(n));
  a != null && (Re[r] = a);
});
const rr = {
  styleDefault: "solid",
  familyDefault: U,
  cssPrefix: Zn,
  replacementClass: Qn,
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
const Oe = u(u({}, rr), Re);
Oe.autoReplaceSvg || (Oe.observeMutations = !1);
const v = {};
Object.keys(rr).forEach((e) => {
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
function Xa(e) {
  return Me.push(e), () => {
    Me.splice(Me.indexOf(e), 1);
  };
}
const ue = ht, Q = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Ka(e) {
  if (!e || !oe)
    return;
  const t = W.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = W.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return W.head.insertBefore(t, r), e;
}
const Ja = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function Ne() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Ja[Math.random() * 62 | 0];
  return t;
}
function ke(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Lt(e) {
  return e.classList ? ke(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function ar(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Za(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(ar(e[n]), '" '), "").trim();
}
function Xe(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Dt(e) {
  return e.size !== Q.size || e.x !== Q.x || e.y !== Q.y || e.rotate !== Q.rotate || e.flipX || e.flipY;
}
function Qa(e) {
  let {
    transform: t,
    containerWidth: n,
    iconWidth: r
  } = e;
  const a = {
    transform: "translate(".concat(n / 2, " 256)")
  }, o = "translate(".concat(t.x * 32, ", ").concat(t.y * 32, ") "), i = "scale(".concat(t.size / 16 * (t.flipX ? -1 : 1), ", ").concat(t.size / 16 * (t.flipY ? -1 : 1), ") "), s = "rotate(".concat(t.rotate, " 0 0)"), f = {
    transform: "".concat(o, " ").concat(i, " ").concat(s)
  }, l = {
    transform: "translate(".concat(r / 2 * -1, " -256)")
  };
  return {
    outer: a,
    inner: f,
    path: l
  };
}
function eo(e) {
  let {
    transform: t,
    width: n = ht,
    height: r = ht,
    startCentered: a = !1
  } = e, o = "";
  return a && Bn ? o += "translate(".concat(t.x / ue - n / 2, "em, ").concat(t.y / ue - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / ue, "em), calc(-50% + ").concat(t.y / ue, "em)) ") : o += "translate(".concat(t.x / ue, "em, ").concat(t.y / ue, "em) "), o += "scale(".concat(t.size / ue * (t.flipX ? -1 : 1), ", ").concat(t.size / ue * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var to = `:root, :host {
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
function or() {
  const e = Zn, t = Qn, n = v.cssPrefix, r = v.replacementClass;
  let a = to;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let on = !1;
function nt() {
  v.autoAddCss && !on && (Ka(or()), on = !0);
}
var no = {
  mixout() {
    return {
      dom: {
        css: or,
        insertCss: nt
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        nt();
      },
      beforeI2svg() {
        nt();
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
const ir = [], sr = function() {
  W.removeEventListener("DOMContentLoaded", sr), qe = 1, ir.map((e) => e());
};
let qe = !1;
oe && (qe = (W.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(W.readyState), qe || W.addEventListener("DOMContentLoaded", sr));
function ro(e) {
  oe && (qe ? setTimeout(e, 0) : ir.push(e));
}
function ze(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? ar(e) : "<".concat(t, " ").concat(Za(n), ">").concat(r.map(ze).join(""), "</").concat(t, ">");
}
function sn(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var rt = function(t, n, r, a) {
  var o = Object.keys(t), i = o.length, s = n, f, l, c;
  for (r === void 0 ? (f = 1, c = t[o[0]]) : (f = 0, c = r); f < i; f++)
    l = o[f], c = s(c, t[l], l, t);
  return c;
};
function ao(e) {
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
function wt(e) {
  const t = ao(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function oo(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function ln(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function At(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = ln(t);
  typeof ee.hooks.addPack == "function" && !r ? ee.hooks.addPack(e, ln(t)) : ee.styles[e] = u(u({}, ee.styles[e] || {}), a), e === "fas" && At("fa", t);
}
const {
  styles: Fe,
  shims: io
} = ee, lr = Object.keys(zt), so = lr.reduce((e, t) => (e[t] = Object.keys(zt[t]), e), {});
let $t = null, cr = {}, fr = {}, ur = {}, dr = {}, mr = {};
function lo(e) {
  return ~Va.indexOf(e);
}
function co(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !lo(a) ? a : null;
}
const pr = () => {
  const e = (r) => rt(Fe, (a, o, i) => (a[i] = rt(o, r, {}), a), {});
  cr = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), fr = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), mr = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in Fe || v.autoFetchSvg, n = rt(io, (r, a) => {
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
  ur = n.names, dr = n.unicodes, $t = Ke(v.styleDefault, {
    family: v.familyDefault
  });
};
Xa((e) => {
  $t = Ke(e.styleDefault, {
    family: v.familyDefault
  });
});
pr();
function Yt(e, t) {
  return (cr[e] || {})[t];
}
function fo(e, t) {
  return (fr[e] || {})[t];
}
function be(e, t) {
  return (mr[e] || {})[t];
}
function gr(e) {
  return ur[e] || {
    prefix: null,
    iconName: null
  };
}
function uo(e) {
  const t = dr[e], n = Yt("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function me() {
  return $t;
}
const hr = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function mo(e) {
  let t = U;
  const n = lr.reduce((r, a) => (r[a] = "".concat(v.cssPrefix, "-").concat(a), r), {});
  return Kn.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => so[r].includes(a))) && (t = r);
  }), t;
}
function Ke(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = U
  } = t, r = Ya[n][e];
  if (n === He && !e)
    return "fad";
  const a = an[n][e] || an[n][r], o = e in ee.styles ? e : null;
  return a || o || null;
}
function po(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = co(v.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function cn(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Je(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = gt.concat(Ta), o = cn(e.filter((p) => a.includes(p))), i = cn(e.filter((p) => !gt.includes(p))), s = o.filter((p) => (r = p, !Xn.includes(p))), [f = null] = s, l = mo(o), c = u(u({}, po(i)), {}, {
    prefix: Ke(f, {
      family: l
    })
  });
  return u(u(u({}, c), yo({
    values: e,
    family: l,
    styles: Fe,
    config: v,
    canonical: c,
    givenPrefix: r
  })), go(n, r, c));
}
function go(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? gr(a) : {}, i = be(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !Fe.far && Fe.fas && !v.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const ho = Kn.filter((e) => e !== U || e !== He), bo = Object.keys(pt).filter((e) => e !== U).map((e) => Object.keys(pt[e])).flat();
function yo(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === He, f = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", c = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (f || l || c) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && ho.includes(n) && (Object.keys(o).find((h) => bo.includes(h)) || i.autoFetchSvg)) {
    const h = wa.get(n).defaultShortPrefixId;
    r.prefix = h, r.iconName = be(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = me() || "fas"), r;
}
class vo {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = u(u({}, this.definitions[o] || {}), a[o]), At(o, a[o]);
      const i = zt[U][o];
      i && At(i, a[o]), pr();
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
      } = r[a], f = s[2];
      t[o] || (t[o] = {}), f.length > 0 && f.forEach((l) => {
        typeof l == "string" && (t[o][l] = s);
      }), t[o][i] = s;
    }), t;
  }
}
let fn = [], Ae = {};
const Pe = {}, xo = Object.keys(Pe);
function wo(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return fn = e, Ae = {}, Object.keys(Pe).forEach((r) => {
    xo.indexOf(r) === -1 && delete Pe[r];
  }), fn.forEach((r) => {
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
    r.provides && r.provides(Pe);
  }), n;
}
function Et(e, t) {
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
function pe() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return Pe[e] ? Pe[e].apply(null, t) : void 0;
}
function St(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || me();
  if (t)
    return t = be(n, t) || t, sn(br.definitions, n, t) || sn(ee.styles, n, t);
}
const br = new vo(), Ao = () => {
  v.autoReplaceSvg = !1, v.observeMutations = !1, ve("noAuto");
}, Eo = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return oe ? (ve("beforeI2svg", e), pe("pseudoElements2svg", e), pe("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    v.autoReplaceSvg === !1 && (v.autoReplaceSvg = !0), v.observeMutations = !0, ro(() => {
      Po({
        autoReplaceSvgRoot: t
      }), ve("watch", e);
    });
  }
}, So = {
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
    if (typeof e == "string" && (e.indexOf("".concat(v.cssPrefix, "-")) > -1 || e.match(Wa))) {
      const t = Je(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || me(),
        iconName: be(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = me();
      return {
        prefix: t,
        iconName: be(t, e) || e
      };
    }
  }
}, V = {
  noAuto: Ao,
  config: v,
  dom: Eo,
  parse: So,
  library: br,
  findIconDefinition: St,
  toHtml: ze
}, Po = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = W
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
      const n = W.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function Oo(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (Dt(i) && n.found && !r.found) {
    const {
      width: s,
      height: f
    } = n, l = {
      x: s / f / 2,
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
function Co(e) {
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
function Wt(e) {
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
    maskId: f,
    titleId: l,
    extra: c,
    watchable: p = !1
  } = e, {
    width: h,
    height: w
  } = n.found ? n : t, O = Oa.includes(r), x = [v.replacementClass, a ? "".concat(v.cssPrefix, "-").concat(a) : ""].filter((m) => c.classes.indexOf(m) === -1).filter((m) => m !== "" || !!m).concat(c.classes).join(" ");
  let y = {
    children: [],
    attributes: u(u({}, c.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: x,
      role: c.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(h, " ").concat(w)
    })
  };
  const A = O && !~c.classes.indexOf("fa-fw") ? {
    width: "".concat(h / w * 16 * 0.0625, "em")
  } : {};
  p && (y.attributes[ye] = ""), s && (y.children.push({
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
    maskId: f,
    transform: o,
    symbol: i,
    styles: u(u({}, A), c.styles)
  }), {
    children: P,
    attributes: I
  } = n.found && t.found ? pe("generateAbstractMask", C) || {
    children: [],
    attributes: {}
  } : pe("generateAbstractIcon", C) || {
    children: [],
    attributes: {}
  };
  return C.children = P, C.attributes = I, i ? Co(C) : Oo(C);
}
function un(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, f = u(u(u({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (f[ye] = "");
  const l = u({}, i.styles);
  Dt(a) && (l.transform = eo({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), l["-webkit-transform"] = l.transform);
  const c = Xe(l);
  c.length > 0 && (f.style = c);
  const p = [];
  return p.push({
    tag: "span",
    attributes: f,
    children: [t]
  }), o && p.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), p;
}
function ko(e) {
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
  styles: at
} = ee;
function Pt(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(v.cssPrefix, "-").concat(tt.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(v.cssPrefix, "-").concat(tt.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(v.cssPrefix, "-").concat(tt.PRIMARY),
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
const To = {
  found: !1,
  width: 512,
  height: 512
};
function Io(e, t) {
  !er && !v.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Ot(e, t) {
  let n = t;
  return t === "fa" && v.styleDefault !== null && (t = me()), new Promise((r, a) => {
    if (n === "fa") {
      const o = gr(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && at[t] && at[t][e]) {
      const o = at[t][e];
      return r(Pt(o));
    }
    Io(e, t), r(u(u({}, To), {}, {
      icon: v.showMissingIcons && e ? pe("missingIconAbstract") || {} : {}
    }));
  });
}
const dn = () => {
}, Ct = v.measurePerformance && De && De.mark && De.measure ? De : {
  mark: dn,
  measure: dn
}, _e = 'FA "6.7.2"', _o = (e) => (Ct.mark("".concat(_e, " ").concat(e, " begins")), () => yr(e)), yr = (e) => {
  Ct.mark("".concat(_e, " ").concat(e, " ends")), Ct.measure("".concat(_e, " ").concat(e), "".concat(_e, " ").concat(e, " begins"), "".concat(_e, " ").concat(e, " ends"));
};
var Ut = {
  begin: _o,
  end: yr
};
const Ue = () => {
};
function mn(e) {
  return typeof (e.getAttribute ? e.getAttribute(ye) : null) == "string";
}
function Ro(e) {
  const t = e.getAttribute ? e.getAttribute(Ft) : null, n = e.getAttribute ? e.getAttribute(jt) : null;
  return t && n;
}
function Mo(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(v.replacementClass);
}
function No() {
  return v.autoReplaceSvg === !0 ? Ge.replace : Ge[v.autoReplaceSvg] || Ge.replace;
}
function Fo(e) {
  return W.createElementNS("http://www.w3.org/2000/svg", e);
}
function jo(e) {
  return W.createElement(e);
}
function vr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? Fo : jo
  } = t;
  if (typeof e == "string")
    return W.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(vr(o, {
      ceFn: n
    }));
  }), r;
}
function zo(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Ge = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(vr(n), t);
      }), t.getAttribute(ye) === null && v.keepOriginalSource) {
        let n = W.createComment(zo(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Lt(t).indexOf(v.replacementClass))
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
function pn(e) {
  e();
}
function xr(e, t) {
  const n = typeof t == "function" ? t : Ue;
  if (e.length === 0)
    n();
  else {
    let r = pn;
    v.mutateApproach === Da && (r = de.requestAnimationFrame || pn), r(() => {
      const a = No(), o = Ut.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let Gt = !1;
function wr() {
  Gt = !0;
}
function kt() {
  Gt = !1;
}
let Ve = null;
function gn(e) {
  if (!en || !v.observeMutations)
    return;
  const {
    treeCallback: t = Ue,
    nodeCallback: n = Ue,
    pseudoElementsCallback: r = Ue,
    observeMutationsRoot: a = W
  } = e;
  Ve = new en((o) => {
    if (Gt) return;
    const i = me();
    ke(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !mn(s.addedNodes[0]) && (v.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && v.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && mn(s.target) && ~qa.indexOf(s.attributeName))
        if (s.attributeName === "class" && Ro(s.target)) {
          const {
            prefix: f,
            iconName: l
          } = Je(Lt(s.target));
          s.target.setAttribute(Ft, f || i), l && s.target.setAttribute(jt, l);
        } else Mo(s.target) && n(s.target);
    });
  }), oe && Ve.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function Lo() {
  Ve && Ve.disconnect();
}
function Do(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function $o(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = Je(Lt(e));
  return a.prefix || (a.prefix = me()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = fo(a.prefix, e.innerText) || Yt(a.prefix, wt(e.innerText))), !a.iconName && v.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function Yo(e) {
  const t = ke(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return v.autoA11y && (n ? t["aria-labelledby"] = "".concat(v.replacementClass, "-title-").concat(r || Ne()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Wo() {
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
function hn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = $o(e), o = Yo(e), i = Et("parseNodeAttributes", {}, e);
  let s = t.styleParser ? Do(e) : [];
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
  styles: Uo
} = ee;
function Ar(e) {
  const t = v.autoReplaceSvg === "nest" ? hn(e, {
    styleParser: !1
  }) : hn(e);
  return ~t.extra.classes.indexOf(nr) ? pe("generateLayersText", e, t) : pe("generateSvgReplacementMutation", e, t);
}
function Go() {
  return [...Ea, ...gt];
}
function bn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!oe) return Promise.resolve();
  const n = W.documentElement.classList, r = (c) => n.add("".concat(rn, "-").concat(c)), a = (c) => n.remove("".concat(rn, "-").concat(c)), o = v.autoFetchSvg ? Go() : Xn.concat(Object.keys(Uo));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(nr, ":not([").concat(ye, "])")].concat(o.map((c) => ".".concat(c, ":not([").concat(ye, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = ke(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const f = Ut.begin("onTree"), l = s.reduce((c, p) => {
    try {
      const h = Ar(p);
      h && c.push(h);
    } catch (h) {
      er || h.name === "MissingIcon" && console.error(h);
    }
    return c;
  }, []);
  return new Promise((c, p) => {
    Promise.all(l).then((h) => {
      xr(h, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), f(), c();
      });
    }).catch((h) => {
      f(), p(h);
    });
  });
}
function qo(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  Ar(e).then((n) => {
    n && xr([n], t);
  });
}
function Vo(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : St(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : St(a || {})), e(r, u(u({}, n), {}, {
      mask: a
    }));
  };
}
const Bo = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = Q,
    symbol: r = !1,
    mask: a = null,
    maskId: o = null,
    title: i = null,
    titleId: s = null,
    classes: f = [],
    attributes: l = {},
    styles: c = {}
  } = t;
  if (!e) return;
  const {
    prefix: p,
    iconName: h,
    icon: w
  } = e;
  return Ze(u({
    type: "icon"
  }, e), () => (ve("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), v.autoA11y && (i ? l["aria-labelledby"] = "".concat(v.replacementClass, "-title-").concat(s || Ne()) : (l["aria-hidden"] = "true", l.focusable = "false")), Wt({
    icons: {
      main: Pt(w),
      mask: a ? Pt(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: h,
    transform: u(u({}, Q), n),
    symbol: r,
    title: i,
    maskId: o,
    titleId: s,
    extra: {
      attributes: l,
      styles: c,
      classes: f
    }
  })));
};
var Ho = {
  mixout() {
    return {
      icon: Vo(Bo)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = bn, e.nodeCallback = qo, e;
      }
    };
  },
  provides(e) {
    e.i2svg = function(t) {
      const {
        node: n = W,
        callback: r = () => {
        }
      } = t;
      return bn(n, r);
    }, e.generateSvgReplacementMutation = function(t, n) {
      const {
        iconName: r,
        title: a,
        titleId: o,
        prefix: i,
        transform: s,
        symbol: f,
        mask: l,
        maskId: c,
        extra: p
      } = n;
      return new Promise((h, w) => {
        Promise.all([Ot(r, i), l.iconName ? Ot(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((O) => {
          let [x, y] = O;
          h([t, Wt({
            icons: {
              main: x,
              mask: y
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: f,
            maskId: c,
            title: a,
            titleId: o,
            extra: p,
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
      let f;
      return Dt(o) && (f = pe("generateAbstractTransformGrouping", {
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
}, Xo = {
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
}, Ko = {
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
        }), ko({
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
}, Jo = {
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
        }), un({
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
      if (Bn) {
        const f = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / f, s = l.height / f;
      }
      return v.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, un({
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
const Zo = new RegExp('"', "ug"), yn = [1105920, 1112319], vn = u(u(u(u({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), xa), za), Ia), Tt = Object.keys(vn).reduce((e, t) => (e[t.toLowerCase()] = vn[t], e), {}), Qo = Object.keys(Tt).reduce((e, t) => {
  const n = Tt[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function ei(e) {
  const t = e.replace(Zo, ""), n = oo(t, 0), r = n >= yn[0] && n <= yn[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: wt(a ? t[0] : t),
    isSecondary: r || a
  };
}
function ti(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (Tt[n] || {})[a] || Qo[n];
}
function xn(e, t) {
  const n = "".concat(La).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = ke(e.children).filter((h) => h.getAttribute(bt) === t)[0], s = de.getComputedStyle(e, t), f = s.getPropertyValue("font-family"), l = f.match(Ua), c = s.getPropertyValue("font-weight"), p = s.getPropertyValue("content");
    if (i && !l)
      return e.removeChild(i), r();
    if (l && p !== "none" && p !== "") {
      const h = s.getPropertyValue("content");
      let w = ti(f, c);
      const {
        value: O,
        isSecondary: x
      } = ei(h), y = l[0].startsWith("FontAwesome");
      let A = Yt(w, O), C = A;
      if (y) {
        const P = uo(O);
        P.iconName && P.prefix && (A = P.iconName, w = P.prefix);
      }
      if (A && !x && (!i || i.getAttribute(Ft) !== w || i.getAttribute(jt) !== C)) {
        e.setAttribute(n, C), i && e.removeChild(i);
        const P = Wo(), {
          extra: I
        } = P;
        I.attributes[bt] = t, Ot(A, w).then((m) => {
          const B = Wt(u(u({}, P), {}, {
            icons: {
              main: m,
              mask: hr()
            },
            prefix: w,
            iconName: C,
            extra: I,
            watchable: !0
          })), X = W.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(X, e.firstChild) : e.appendChild(X), X.outerHTML = B.map((ie) => ze(ie)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function ni(e) {
  return Promise.all([xn(e, "::before"), xn(e, "::after")]);
}
function ri(e) {
  return e.parentNode !== document.head && !~$a.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(bt) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function wn(e) {
  if (oe)
    return new Promise((t, n) => {
      const r = ke(e.querySelectorAll("*")).filter(ri).map(ni), a = Ut.begin("searchPseudoElements");
      wr(), Promise.all(r).then(() => {
        a(), kt(), t();
      }).catch(() => {
        a(), kt(), n();
      });
    });
}
var ai = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = wn, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = W
      } = t;
      v.searchPseudoElements && wn(n);
    };
  }
};
let An = !1;
var oi = {
  mixout() {
    return {
      dom: {
        unwatch() {
          wr(), An = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        gn(Et("mutationObserverCallbacks", {}));
      },
      noAuto() {
        Lo();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        An ? kt() : gn(Et("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const En = (e) => {
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
var ii = {
  mixout() {
    return {
      parse: {
        transform: (e) => En(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = En(n)), e;
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
      }, s = "translate(".concat(r.x * 32, ", ").concat(r.y * 32, ") "), f = "scale(".concat(r.size / 16 * (r.flipX ? -1 : 1), ", ").concat(r.size / 16 * (r.flipY ? -1 : 1), ") "), l = "rotate(".concat(r.rotate, " 0 0)"), c = {
        transform: "".concat(s, " ").concat(f, " ").concat(l)
      }, p = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, h = {
        outer: i,
        inner: c,
        path: p
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
const ot = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function Sn(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function si(e) {
  return e.tag === "g" ? e.children : [e];
}
var li = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Je(n.split(" ").map((a) => a.trim())) : hr();
        return r.prefix || (r.prefix = me()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        width: f,
        icon: l
      } = a, {
        width: c,
        icon: p
      } = o, h = Qa({
        transform: s,
        containerWidth: c,
        iconWidth: f
      }), w = {
        tag: "rect",
        attributes: u(u({}, ot), {}, {
          fill: "white"
        })
      }, O = l.children ? {
        children: l.children.map(Sn)
      } : {}, x = {
        tag: "g",
        attributes: u({}, h.inner),
        children: [Sn(u({
          tag: l.tag,
          attributes: u(u({}, l.attributes), h.path)
        }, O))]
      }, y = {
        tag: "g",
        attributes: u({}, h.outer),
        children: [x]
      }, A = "mask-".concat(i || Ne()), C = "clip-".concat(i || Ne()), P = {
        tag: "mask",
        attributes: u(u({}, ot), {}, {
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
          children: si(p)
        }, P]
      };
      return n.push(I, {
        tag: "rect",
        attributes: u({
          fill: "currentColor",
          "clip-path": "url(#".concat(C, ")"),
          mask: "url(#".concat(A, ")")
        }, ot)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, ci = {
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
}, fi = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, ui = [no, Ho, Xo, Ko, Jo, ai, oi, ii, li, ci, fi];
wo(ui, {
  mixoutsTo: V
});
V.noAuto;
V.config;
V.library;
V.dom;
const It = V.parse;
V.findIconDefinition;
V.toHtml;
const di = V.icon;
V.layer;
V.text;
V.counter;
function mi(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Ye = { exports: {} }, We = { exports: {} }, z = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Pn;
function pi() {
  if (Pn) return z;
  Pn = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, c = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, x = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, A = e ? Symbol.for("react.responder") : 60118, C = e ? Symbol.for("react.scope") : 60119;
  function P(m) {
    if (typeof m == "object" && m !== null) {
      var B = m.$$typeof;
      switch (B) {
        case t:
          switch (m = m.type, m) {
            case f:
            case l:
            case r:
            case o:
            case a:
            case p:
              return m;
            default:
              switch (m = m && m.$$typeof, m) {
                case s:
                case c:
                case O:
                case w:
                case i:
                  return m;
                default:
                  return B;
              }
          }
        case n:
          return B;
      }
    }
  }
  function I(m) {
    return P(m) === l;
  }
  return z.AsyncMode = f, z.ConcurrentMode = l, z.ContextConsumer = s, z.ContextProvider = i, z.Element = t, z.ForwardRef = c, z.Fragment = r, z.Lazy = O, z.Memo = w, z.Portal = n, z.Profiler = o, z.StrictMode = a, z.Suspense = p, z.isAsyncMode = function(m) {
    return I(m) || P(m) === f;
  }, z.isConcurrentMode = I, z.isContextConsumer = function(m) {
    return P(m) === s;
  }, z.isContextProvider = function(m) {
    return P(m) === i;
  }, z.isElement = function(m) {
    return typeof m == "object" && m !== null && m.$$typeof === t;
  }, z.isForwardRef = function(m) {
    return P(m) === c;
  }, z.isFragment = function(m) {
    return P(m) === r;
  }, z.isLazy = function(m) {
    return P(m) === O;
  }, z.isMemo = function(m) {
    return P(m) === w;
  }, z.isPortal = function(m) {
    return P(m) === n;
  }, z.isProfiler = function(m) {
    return P(m) === o;
  }, z.isStrictMode = function(m) {
    return P(m) === a;
  }, z.isSuspense = function(m) {
    return P(m) === p;
  }, z.isValidElementType = function(m) {
    return typeof m == "string" || typeof m == "function" || m === r || m === l || m === o || m === a || m === p || m === h || typeof m == "object" && m !== null && (m.$$typeof === O || m.$$typeof === w || m.$$typeof === i || m.$$typeof === s || m.$$typeof === c || m.$$typeof === y || m.$$typeof === A || m.$$typeof === C || m.$$typeof === x);
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
var On;
function gi() {
  return On || (On = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, c = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, h = e ? Symbol.for("react.suspense_list") : 60120, w = e ? Symbol.for("react.memo") : 60115, O = e ? Symbol.for("react.lazy") : 60116, x = e ? Symbol.for("react.block") : 60121, y = e ? Symbol.for("react.fundamental") : 60117, A = e ? Symbol.for("react.responder") : 60118, C = e ? Symbol.for("react.scope") : 60119;
    function P(b) {
      return typeof b == "string" || typeof b == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      b === r || b === l || b === o || b === a || b === p || b === h || typeof b == "object" && b !== null && (b.$$typeof === O || b.$$typeof === w || b.$$typeof === i || b.$$typeof === s || b.$$typeof === c || b.$$typeof === y || b.$$typeof === A || b.$$typeof === C || b.$$typeof === x);
    }
    function I(b) {
      if (typeof b == "object" && b !== null) {
        var J = b.$$typeof;
        switch (J) {
          case t:
            var Le = b.type;
            switch (Le) {
              case f:
              case l:
              case r:
              case o:
              case a:
              case p:
                return Le;
              default:
                var Bt = Le && Le.$$typeof;
                switch (Bt) {
                  case s:
                  case c:
                  case O:
                  case w:
                  case i:
                    return Bt;
                  default:
                    return J;
                }
            }
          case n:
            return J;
        }
      }
    }
    var m = f, B = l, X = s, ie = i, ge = t, he = c, se = r, $ = O, xe = w, H = n, we = o, G = a, K = p, le = !1;
    function te(b) {
      return le || (le = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(b) || I(b) === f;
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
      return I(b) === c;
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
      return I(b) === p;
    }
    L.AsyncMode = m, L.ConcurrentMode = B, L.ContextConsumer = X, L.ContextProvider = ie, L.Element = ge, L.ForwardRef = he, L.Fragment = se, L.Lazy = $, L.Memo = xe, L.Portal = H, L.Profiler = we, L.StrictMode = G, L.Suspense = K, L.isAsyncMode = te, L.isConcurrentMode = d, L.isContextConsumer = g, L.isContextProvider = M, L.isElement = _, L.isForwardRef = S, L.isFragment = N, L.isLazy = k, L.isMemo = R, L.isPortal = F, L.isProfiler = D, L.isStrictMode = j, L.isSuspense = q, L.isValidElementType = P, L.typeOf = I;
  }()), L;
}
var Cn;
function Er() {
  return Cn || (Cn = 1, process.env.NODE_ENV === "production" ? We.exports = pi() : We.exports = gi()), We.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var it, kn;
function hi() {
  if (kn) return it;
  kn = 1;
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
      var f = Object.getOwnPropertyNames(i).map(function(c) {
        return i[c];
      });
      if (f.join("") !== "0123456789")
        return !1;
      var l = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(c) {
        l[c] = c;
      }), Object.keys(Object.assign({}, l)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return it = a() ? Object.assign : function(o, i) {
    for (var s, f = r(o), l, c = 1; c < arguments.length; c++) {
      s = Object(arguments[c]);
      for (var p in s)
        t.call(s, p) && (f[p] = s[p]);
      if (e) {
        l = e(s);
        for (var h = 0; h < l.length; h++)
          n.call(s, l[h]) && (f[l[h]] = s[l[h]]);
      }
    }
    return f;
  }, it;
}
var st, Tn;
function qt() {
  if (Tn) return st;
  Tn = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return st = e, st;
}
var lt, In;
function Sr() {
  return In || (In = 1, lt = Function.call.bind(Object.prototype.hasOwnProperty)), lt;
}
var ct, _n;
function bi() {
  if (_n) return ct;
  _n = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ qt(), n = {}, r = /* @__PURE__ */ Sr();
    e = function(o) {
      var i = "Warning: " + o;
      typeof console < "u" && console.error(i);
      try {
        throw new Error(i);
      } catch {
      }
    };
  }
  function a(o, i, s, f, l) {
    if (process.env.NODE_ENV !== "production") {
      for (var c in o)
        if (r(o, c)) {
          var p;
          try {
            if (typeof o[c] != "function") {
              var h = Error(
                (f || "React class") + ": " + s + " type `" + c + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[c] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw h.name = "Invariant Violation", h;
            }
            p = o[c](i, c, f, s, null, t);
          } catch (O) {
            p = O;
          }
          if (p && !(p instanceof Error) && e(
            (f || "React class") + ": type specification of " + s + " `" + c + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var w = l ? l() : "";
            e(
              "Failed " + s + " type: " + p.message + (w ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, ct = a, ct;
}
var ft, Rn;
function yi() {
  if (Rn) return ft;
  Rn = 1;
  var e = Er(), t = hi(), n = /* @__PURE__ */ qt(), r = /* @__PURE__ */ Sr(), a = /* @__PURE__ */ bi(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(s) {
    var f = "Warning: " + s;
    typeof console < "u" && console.error(f);
    try {
      throw new Error(f);
    } catch {
    }
  });
  function i() {
    return null;
  }
  return ft = function(s, f) {
    var l = typeof Symbol == "function" && Symbol.iterator, c = "@@iterator";
    function p(d) {
      var g = d && (l && d[l] || d[c]);
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
      elementType: m(),
      instanceOf: B,
      node: he(),
      objectOf: ie,
      oneOf: X,
      oneOfType: ge,
      shape: $,
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
          if (f) {
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
    function m() {
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
    function $(d) {
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
          var g = p(d);
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
  }, ft;
}
var ut, Mn;
function vi() {
  if (Mn) return ut;
  Mn = 1;
  var e = /* @__PURE__ */ qt();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, ut = function() {
    function r(i, s, f, l, c, p) {
      if (p !== e) {
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
  }, ut;
}
var Nn;
function xi() {
  if (Nn) return Ye.exports;
  if (Nn = 1, process.env.NODE_ENV !== "production") {
    var e = Er(), t = !0;
    Ye.exports = /* @__PURE__ */ yi()(e.isElement, t);
  } else
    Ye.exports = /* @__PURE__ */ vi()();
  return Ye.exports;
}
var wi = /* @__PURE__ */ xi();
const T = /* @__PURE__ */ mi(wi);
function Fn(e, t) {
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
    t % 2 ? Fn(Object(n), !0).forEach(function(r) {
      Ee(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Fn(Object(n)).forEach(function(r) {
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
function Ai(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function Ei(e, t) {
  if (e == null) return {};
  var n = Ai(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function _t(e) {
  return Si(e) || Pi(e) || Oi(e) || Ci();
}
function Si(e) {
  if (Array.isArray(e)) return Rt(e);
}
function Pi(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Oi(e, t) {
  if (e) {
    if (typeof e == "string") return Rt(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return Rt(e, t);
  }
}
function Rt(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Ci() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function ki(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, f = e.spin, l = e.spinPulse, c = e.spinReverse, p = e.pulse, h = e.fixedWidth, w = e.inverse, O = e.border, x = e.listItem, y = e.flip, A = e.size, C = e.rotation, P = e.pull, I = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": f,
    "fa-spin-reverse": c,
    "fa-spin-pulse": l,
    "fa-pulse": p,
    "fa-fw": h,
    "fa-inverse": w,
    "fa-border": O,
    "fa-li": x,
    "fa-flip": y === !0,
    "fa-flip-horizontal": y === "horizontal" || y === "both",
    "fa-flip-vertical": y === "vertical" || y === "both"
  }, Ee(t, "fa-".concat(A), typeof A < "u" && A !== null), Ee(t, "fa-rotate-".concat(C), typeof C < "u" && C !== null && C !== 0), Ee(t, "fa-pull-".concat(P), typeof P < "u" && P !== null), Ee(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(I).map(function(m) {
    return I[m] ? m : null;
  }).filter(function(m) {
    return m;
  });
}
function Ti(e) {
  return e = e - 0, e === e;
}
function Pr(e) {
  return Ti(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var Ii = ["style"];
function _i(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Ri(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = Pr(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[_i(a)] = o : t[a] = o, t;
  }, {});
}
function Or(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(f) {
    return Or(e, f);
  }), a = Object.keys(t.attributes || {}).reduce(function(f, l) {
    var c = t.attributes[l];
    switch (l) {
      case "class":
        f.attrs.className = c, delete t.attributes.class;
        break;
      case "style":
        f.attrs.style = Ri(c);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? f.attrs[l.toLowerCase()] = c : f.attrs[Pr(l)] = c;
    }
    return f;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = Ei(n, Ii);
  return a.attrs.style = Z(Z({}, a.attrs.style), i), e.apply(void 0, [t.tag, Z(Z({}, a.attrs), s)].concat(_t(r)));
}
var Cr = !1;
try {
  Cr = process.env.NODE_ENV === "production";
} catch {
}
function Mi() {
  if (!Cr && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function jn(e) {
  if (e && Be(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (It.icon)
    return It.icon(e);
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
function dt(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Ee({}, e, t) : {};
}
var zn = {
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
}, Vt = /* @__PURE__ */ Ln.forwardRef(function(e, t) {
  var n = Z(Z({}, zn), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, f = n.titleId, l = n.maskId, c = jn(r), p = dt("classes", [].concat(_t(ki(n)), _t((i || "").split(" ")))), h = dt("transform", typeof n.transform == "string" ? It.transform(n.transform) : n.transform), w = dt("mask", jn(a)), O = di(c, Z(Z(Z(Z({}, p), h), w), {}, {
    symbol: o,
    title: s,
    titleId: f,
    maskId: l
  }));
  if (!O)
    return Mi("Could not find icon", c), null;
  var x = O.abstract, y = {
    ref: t
  };
  return Object.keys(n).forEach(function(A) {
    zn.hasOwnProperty(A) || (y[A] = n[A]);
  }), Ni(x[0], y);
});
Vt.displayName = "FontAwesomeIcon";
Vt.propTypes = {
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
var Ni = Or.bind(null, Ln.createElement);
class Fi {
  constructor() {
    Ht(this, "values", {});
  }
  initialize(t) {
    this.values = t;
  }
}
const ji = new Fi();
function $i(e) {
  const t = e.avatarIndex === void 0 ? "/resources/avatars/0.webp" : `/resources/avatars/${e.avatarIndex}.webp`, n = e.avatarIndex === void 0 ? "https://storyteller.ai/images/avatars/2000x2000/0.webp" : `https://storyteller.ai/images/avatars/2000x2000/${e.avatarIndex}.webp`, r = encodeURIComponent(n), a = `${ji.values.GRAVATAR_API}/avatar/${e.email_hash}?s=${e.size}&d=${r}`, [{ imgUrl: o, showLoader: i }, s] = _r({
    imgUrl: a,
    showLoader: !0
  }), f = e.username ? `${e.username}'s gravatar` : "gravatar";
  function l(c) {
    switch (c) {
      case 0:
        return "#E66462";
      case 1:
        return "#FD881B";
      case 2:
        return "#E7C13C";
      case 3:
        return "#4BA905";
      case 4:
        return "#25B8A0";
      case 5:
        return "#0078D1";
      case 6:
        return "#7F52C1";
      case 7:
        return "#FF66AC";
      case 8:
        return "#259FEC";
      default:
        return "#1a1a27";
    }
  }
  return /* @__PURE__ */ Ir(
    "div",
    {
      className: ca(
        "relative aspect-square overflow-hidden rounded-full border border-white",
        e.className
      ),
      children: [
        i && /* @__PURE__ */ Qe("div", { className: "absolute flex h-full w-full items-center justify-center bg-brand-secondary", children: /* @__PURE__ */ Qe(Vt, { icon: fa, spin: !0, size: "lg" }) }),
        /* @__PURE__ */ Qe(
          "img",
          {
            crossOrigin: "anonymous",
            alt: f,
            src: o,
            height: e.size,
            width: e.size,
            style: { backgroundColor: l(e.backgroundIndex) },
            onLoad: () => {
              s((c) => ({
                imgUrl: c.imgUrl,
                showLoader: !1
              }));
            },
            onError: () => {
              s((c) => ({
                imgUrl: c.imgUrl !== t ? t : c.imgUrl,
                showLoader: !1
              }));
            }
          }
        )
      ]
    }
  );
}
export {
  $i as Gravatar
};
