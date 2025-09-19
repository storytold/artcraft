import { jsxs as Ke, jsx as ne, Fragment as Rr } from "react/jsx-runtime";
import * as X from "react";
import M, { createContext as Re, forwardRef as Gt, useRef as C, useState as z, useMemo as Z, Fragment as ee, useContext as Pe, useEffect as W, useLayoutEffect as Rt, useCallback as O, isValidElement as Ht, cloneElement as Dt, createElement as Wt, useId as _t, useReducer as Hr } from "react";
const wt = "-", Dr = (e) => {
  const t = _r(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (a) => {
      const l = a.split(wt);
      return l[0] === "" && l.length !== 1 && l.shift(), Ut(l, t) || Wr(a);
    },
    getConflictingClassGroupIds: (a, l) => {
      const i = r[a] || [];
      return l && n[a] ? [...i, ...n[a]] : i;
    }
  };
}, Ut = (e, t) => {
  var a;
  if (e.length === 0)
    return t.classGroupId;
  const r = e[0], n = t.nextPart.get(r), o = n ? Ut(e.slice(1), n) : void 0;
  if (o)
    return o;
  if (t.validators.length === 0)
    return;
  const s = e.join(wt);
  return (a = t.validators.find(({
    validator: l
  }) => l(s))) == null ? void 0 : a.classGroupId;
}, Ft = /^\[(.+)\]$/, Wr = (e) => {
  if (Ft.test(e)) {
    const t = Ft.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, _r = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Vr(Object.entries(e.classGroups), r).forEach(([s, a]) => {
    ut(a, n, s, t);
  }), n;
}, ut = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const s = o === "" ? t : At(t, o);
      s.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (Ur(o)) {
        ut(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([s, a]) => {
      ut(a, At(t, s), r, n);
    });
  });
}, At = (e, t) => {
  let r = e;
  return t.split(wt).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Ur = (e) => e.isThemeGetter, Vr = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((s) => typeof s == "string" ? t + s : typeof s == "object" ? Object.fromEntries(Object.entries(s).map(([a, l]) => [t + a, l])) : s);
  return [r, o];
}) : e, Br = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (s, a) => {
    r.set(s, a), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(s) {
      let a = r.get(s);
      if (a !== void 0)
        return a;
      if ((a = n.get(s)) !== void 0)
        return o(s, a), a;
    },
    set(s, a) {
      r.has(s) ? r.set(s, a) : o(s, a);
    }
  };
}, Vt = "!", qr = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], s = t.length, a = (l) => {
    const i = [];
    let u = 0, c = 0, d;
    for (let m = 0; m < l.length; m++) {
      let h = l[m];
      if (u === 0) {
        if (h === o && (n || l.slice(m, m + s) === t)) {
          i.push(l.slice(c, m)), c = m + s;
          continue;
        }
        if (h === "/") {
          d = m;
          continue;
        }
      }
      h === "[" ? u++ : h === "]" && u--;
    }
    const g = i.length === 0 ? l : l.substring(c), b = g.startsWith(Vt), p = b ? g.substring(1) : g, f = d && d > c ? d - c : void 0;
    return {
      modifiers: i,
      hasImportantModifier: b,
      baseClassName: p,
      maybePostfixModifierPosition: f
    };
  };
  return r ? (l) => r({
    className: l,
    parseClassName: a
  }) : a;
}, Kr = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, Yr = (e) => ({
  cache: Br(e.cacheSize),
  parseClassName: qr(e),
  ...Dr(e)
}), Xr = /\s+/, Zr = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, s = [], a = e.trim().split(Xr);
  let l = "";
  for (let i = a.length - 1; i >= 0; i -= 1) {
    const u = a[i], {
      modifiers: c,
      hasImportantModifier: d,
      baseClassName: g,
      maybePostfixModifierPosition: b
    } = r(u);
    let p = !!b, f = n(p ? g.substring(0, b) : g);
    if (!f) {
      if (!p) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      if (f = n(g), !f) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      p = !1;
    }
    const m = Kr(c).join(":"), h = d ? m + Vt : m, y = h + f;
    if (s.includes(y))
      continue;
    s.push(y);
    const $ = o(f, p);
    for (let E = 0; E < $.length; ++E) {
      const P = $[E];
      s.push(h + P);
    }
    l = u + (l.length > 0 ? " " + l : l);
  }
  return l;
};
function Jr() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = Bt(t)) && (n && (n += " "), n += r);
  return n;
}
const Bt = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = Bt(e[n])) && (r && (r += " "), r += t);
  return r;
};
function Qr(e, ...t) {
  let r, n, o, s = a;
  function a(i) {
    const u = t.reduce((c, d) => d(c), e());
    return r = Yr(u), n = r.cache.get, o = r.cache.set, s = l, l(i);
  }
  function l(i) {
    const u = n(i);
    if (u)
      return u;
    const c = Zr(i, r);
    return o(i, c), c;
  }
  return function() {
    return s(Jr.apply(null, arguments));
  };
}
const A = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, qt = /^\[(?:([a-z-]+):)?(.+)\]$/i, en = /^\d+\/\d+$/, tn = /* @__PURE__ */ new Set(["px", "full", "screen"]), rn = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, nn = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, on = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, sn = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, ln = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, te = (e) => Ee(e) || tn.has(e) || en.test(e), se = (e) => Ce(e, "length", mn), Ee = (e) => !!e && !Number.isNaN(Number(e)), nt = (e) => Ce(e, "number", Ee), Ne = (e) => !!e && Number.isInteger(Number(e)), an = (e) => e.endsWith("%") && Ee(e.slice(0, -1)), w = (e) => qt.test(e), le = (e) => rn.test(e), cn = /* @__PURE__ */ new Set(["length", "size", "percentage"]), un = (e) => Ce(e, cn, Kt), dn = (e) => Ce(e, "position", Kt), fn = /* @__PURE__ */ new Set(["image", "url"]), pn = (e) => Ce(e, fn, hn), bn = (e) => Ce(e, "", gn), Me = () => !0, Ce = (e, t, r) => {
  const n = qt.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, mn = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  nn.test(e) && !on.test(e)
), Kt = () => !1, gn = (e) => sn.test(e), hn = (e) => ln.test(e), vn = () => {
  const e = A("colors"), t = A("spacing"), r = A("blur"), n = A("brightness"), o = A("borderColor"), s = A("borderRadius"), a = A("borderSpacing"), l = A("borderWidth"), i = A("contrast"), u = A("grayscale"), c = A("hueRotate"), d = A("invert"), g = A("gap"), b = A("gradientColorStops"), p = A("gradientColorStopPositions"), f = A("inset"), m = A("margin"), h = A("opacity"), y = A("padding"), $ = A("saturate"), E = A("scale"), P = A("sepia"), N = A("skew"), F = A("space"), U = A("translate"), R = () => ["auto", "contain", "none"], T = () => ["auto", "hidden", "clip", "visible", "scroll"], I = () => ["auto", w, t], v = () => [w, t], V = () => ["", te, se], G = () => ["auto", Ee, w], q = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], H = () => ["solid", "dashed", "dotted", "double", "none"], J = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], _ = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], j = () => ["", "0", w], S = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], k = () => [Ee, w];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Me],
      spacing: [te, se],
      blur: ["none", "", le, w],
      brightness: k(),
      borderColor: [e],
      borderRadius: ["none", "", "full", le, w],
      borderSpacing: v(),
      borderWidth: V(),
      contrast: k(),
      grayscale: j(),
      hueRotate: k(),
      invert: j(),
      gap: v(),
      gradientColorStops: [e],
      gradientColorStopPositions: [an, se],
      inset: I(),
      margin: I(),
      opacity: k(),
      padding: v(),
      saturate: k(),
      scale: k(),
      sepia: j(),
      skew: k(),
      space: v(),
      translate: v()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", w]
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
        columns: [le]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": S()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": S()
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
        object: [...q(), w]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: T()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": T()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": T()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: R()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": R()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": R()
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
        inset: [f]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [f]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [f]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [f]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [f]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [f]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [f]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [f]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [f]
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
        z: ["auto", Ne, w]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: I()
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
        flex: ["1", "auto", "initial", "none", w]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: j()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: j()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Ne, w]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Me]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Ne, w]
        }, w]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": G()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": G()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Me]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Ne, w]
        }, w]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": G()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": G()
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
        "auto-cols": ["auto", "min", "max", "fr", w]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", w]
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
        justify: ["normal", ..._()]
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
        content: ["normal", ..._(), "baseline"]
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
        "place-content": [..._(), "baseline"]
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
        p: [y]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [y]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [y]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [y]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [y]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [y]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [y]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [y]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [y]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", w, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [w, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [w, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [le]
        }, le]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [w, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [w, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [w, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [w, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", le, se]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", nt]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Me]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", w]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", Ee, nt]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", te, w]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", w]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", w]
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
        "placeholder-opacity": [h]
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
        "text-opacity": [h]
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
        decoration: [...H(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", te, se]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", te, w]
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
        indent: v()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", w]
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
        content: ["none", w]
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
        "bg-opacity": [h]
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
        bg: [...q(), dn]
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
        bg: ["auto", "cover", "contain", un]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, pn]
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
        from: [p]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [p]
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
        rounded: [s]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [s]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [s]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [s]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [s]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [s]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [s]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [s]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [s]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [s]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [s]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [s]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [s]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [s]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [s]
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
        "border-opacity": [h]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...H(), "hidden"]
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
        "divide-opacity": [h]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: H()
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
        outline: ["", ...H()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [te, w]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [te, se]
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
        ring: V()
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
        "ring-opacity": [h]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [te, se]
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
        shadow: ["", "inner", "none", le, bn]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Me]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [h]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...J(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": J()
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
        contrast: [i]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", le, w]
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
        "hue-rotate": [c]
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
        saturate: [$]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [P]
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
        "backdrop-contrast": [i]
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
        "backdrop-hue-rotate": [c]
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
        "backdrop-opacity": [h]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [$]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [P]
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
        "border-spacing": [a]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [a]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [a]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", w]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: k()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", w]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: k()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", w]
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
        scale: [E]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [E]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [E]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Ne, w]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [U]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [U]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [N]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [N]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", w]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", w]
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
        "scroll-m": v()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": v()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": v()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": v()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": v()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": v()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": v()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": v()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": v()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": v()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": v()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": v()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": v()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": v()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": v()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": v()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": v()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": v()
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
        "will-change": ["auto", "scroll", "contents", "transform", w]
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
        stroke: [te, se, nt]
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
}, Ue = /* @__PURE__ */ Qr(vn);
var yn = Object.defineProperty, wn = (e, t, r) => t in e ? yn(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, ot = (e, t, r) => (wn(e, typeof t != "symbol" ? t + "" : t, r), r);
let xn = class {
  constructor() {
    ot(this, "current", this.detect()), ot(this, "handoffState", "pending"), ot(this, "currentId", 0);
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
}, qe = new xn();
function En(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Ze() {
  let e = [], t = { addEventListener(r, n, o, s) {
    return r.addEventListener(n, o, s), t.add(() => r.removeEventListener(n, o, s));
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
    return En(() => {
      n.current && r[0]();
    }), t.add(() => {
      n.current = !1;
    });
  }, style(r, n, o) {
    let s = r.style.getPropertyValue(n);
    return Object.assign(r.style, { [n]: o }), this.add(() => {
      Object.assign(r.style, { [n]: s });
    });
  }, group(r) {
    let n = Ze();
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
function Yt() {
  let [e] = z(Ze);
  return W(() => () => e.dispose(), [e]), e;
}
let ue = (e, t) => {
  qe.isServer ? W(e, t) : Rt(e, t);
};
function Xt(e) {
  let t = C(e);
  return ue(() => {
    t.current = e;
  }, [e]), t;
}
let oe = function(e) {
  let t = Xt(e);
  return M.useCallback((...r) => t.current(...r), [t]);
};
function dt(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function Je(e, t, ...r) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...r) : o;
  }
  let n = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(n, Je), n;
}
var Zt = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(Zt || {}), ce = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(ce || {});
function Jt() {
  let e = Tn();
  return O((t) => $n({ mergeRefs: e, ...t }), [e]);
}
function $n({ ourProps: e, theirProps: t, slot: r, defaultTag: n, features: o, visible: s = !0, name: a, mergeRefs: l }) {
  l = l ?? kn;
  let i = Qt(t, e);
  if (s) return Ve(i, r, n, a, l);
  let u = o ?? 0;
  if (u & 2) {
    let { static: c = !1, ...d } = i;
    if (c) return Ve(d, r, n, a, l);
  }
  if (u & 1) {
    let { unmount: c = !0, ...d } = i;
    return Je(c ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return Ve({ ...d, hidden: !0, style: { display: "none" } }, r, n, a, l);
    } });
  }
  return Ve(i, r, n, a, l);
}
function Ve(e, t = {}, r, n, o) {
  let { as: s = r, children: a, refName: l = "ref", ...i } = st(e, ["unmount", "static"]), u = e.ref !== void 0 ? { [l]: e.ref } : {}, c = typeof a == "function" ? a(t) : a;
  "className" in i && i.className && typeof i.className == "function" && (i.className = i.className(t)), i["aria-labelledby"] && i["aria-labelledby"] === i.id && (i["aria-labelledby"] = void 0);
  let d = {};
  if (t) {
    let g = !1, b = [];
    for (let [p, f] of Object.entries(t)) typeof f == "boolean" && (g = !0), f === !0 && b.push(p.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`));
    if (g) {
      d["data-headlessui-state"] = b.join(" ");
      for (let p of b) d[`data-${p}`] = "";
    }
  }
  if (s === ee && (Object.keys(pe(i)).length > 0 || Object.keys(pe(d)).length > 0)) if (!Ht(c) || Array.isArray(c) && c.length > 1) {
    if (Object.keys(pe(i)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${n} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(pe(i)).concat(Object.keys(pe(d))).map((g) => `  - ${g}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((g) => `  - ${g}`).join(`
`)].join(`
`));
  } else {
    let g = c.props, b = g == null ? void 0 : g.className, p = typeof b == "function" ? (...h) => dt(b(...h), i.className) : dt(b, i.className), f = p ? { className: p } : {}, m = Qt(c.props, pe(st(i, ["ref"])));
    for (let h in d) h in m && delete d[h];
    return Dt(c, Object.assign({}, m, d, u, { ref: o(Pn(c), u.ref) }, f));
  }
  return Wt(s, Object.assign({}, st(i, ["ref"]), s !== ee && u, s !== ee && d), c);
}
function Tn() {
  let e = C([]), t = O((r) => {
    for (let n of e.current) n != null && (typeof n == "function" ? n(r) : n.current = r);
  }, []);
  return (...r) => {
    if (!r.every((n) => n == null)) return e.current = r, t;
  };
}
function kn(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let r of e) r != null && (typeof r == "function" ? r(t) : r.current = t);
  };
}
function Qt(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, r = {};
  for (let n of e) for (let o in n) o.startsWith("on") && typeof n[o] == "function" ? (r[o] != null || (r[o] = []), r[o].push(n[o])) : t[o] = n[o];
  if (t.disabled || t["aria-disabled"]) for (let n in r) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(n) && (r[n] = [(o) => {
    var s;
    return (s = o == null ? void 0 : o.preventDefault) == null ? void 0 : s.call(o);
  }]);
  for (let n in r) Object.assign(t, { [n](o, ...s) {
    let a = r[n];
    for (let l of a) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      l(o, ...s);
    }
  } });
  return t;
}
function xt(e) {
  var t;
  return Object.assign(Gt(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function pe(e) {
  let t = Object.assign({}, e);
  for (let r in t) t[r] === void 0 && delete t[r];
  return t;
}
function st(e, t = []) {
  let r = Object.assign({}, e);
  for (let n of t) n in r && delete r[n];
  return r;
}
function Pn(e) {
  return M.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let Cn = Symbol();
function er(...e) {
  let t = C(e);
  W(() => {
    t.current = e;
  }, [e]);
  let r = oe((n) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(n) : o.current = n);
  });
  return e.every((n) => n == null || (n == null ? void 0 : n[Cn])) ? void 0 : r;
}
function Sn(e = 0) {
  let [t, r] = z(e), n = O((i) => r(i), [t]), o = O((i) => r((u) => u | i), [t]), s = O((i) => (t & i) === i, [t]), a = O((i) => r((u) => u & ~i), [r]), l = O((i) => r((u) => u ^ i), [r]);
  return { flags: t, setFlag: n, addFlag: o, hasFlag: s, removeFlag: a, toggleFlag: l };
}
var Lt, Nt;
typeof process < "u" && typeof globalThis < "u" && typeof Element < "u" && ((Lt = process == null ? void 0 : process.env) == null ? void 0 : Lt.NODE_ENV) === "test" && typeof ((Nt = Element == null ? void 0 : Element.prototype) == null ? void 0 : Nt.getAnimations) > "u" && (Element.prototype.getAnimations = function() {
  return console.warn(["Headless UI has polyfilled `Element.prototype.getAnimations` for your tests.", "Please install a proper polyfill e.g. `jsdom-testing-mocks`, to silence these warnings.", "", "Example usage:", "```js", "import { mockAnimationsApi } from 'jsdom-testing-mocks'", "mockAnimationsApi()", "```"].join(`
`)), [];
});
var Fn = ((e) => (e[e.None = 0] = "None", e[e.Closed = 1] = "Closed", e[e.Enter = 2] = "Enter", e[e.Leave = 4] = "Leave", e))(Fn || {});
function An(e) {
  let t = {};
  for (let r in e) e[r] === !0 && (t[`data-${r}`] = "");
  return t;
}
function Ln(e, t, r, n) {
  let [o, s] = z(r), { hasFlag: a, addFlag: l, removeFlag: i } = Sn(e && o ? 3 : 0), u = C(!1), c = C(!1), d = Yt();
  return ue(() => {
    var g;
    if (e) {
      if (r && s(!0), !t) {
        r && l(3);
        return;
      }
      return (g = n == null ? void 0 : n.start) == null || g.call(n, r), Nn(t, { inFlight: u, prepare() {
        c.current ? c.current = !1 : c.current = u.current, u.current = !0, !c.current && (r ? (l(3), i(4)) : (l(4), i(2)));
      }, run() {
        c.current ? r ? (i(3), l(4)) : (i(4), l(3)) : r ? i(1) : l(1);
      }, done() {
        var b;
        c.current && typeof t.getAnimations == "function" && t.getAnimations().length > 0 || (u.current = !1, i(7), r || s(!1), (b = n == null ? void 0 : n.end) == null || b.call(n, r));
      } });
    }
  }, [e, r, t, d]), e ? [o, { closed: a(1), enter: a(2), leave: a(4), transition: a(2) || a(4) }] : [r, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }];
}
function Nn(e, { prepare: t, run: r, done: n, inFlight: o }) {
  let s = Ze();
  return In(e, { prepare: t, inFlight: o }), s.nextFrame(() => {
    r(), s.requestAnimationFrame(() => {
      s.add(Mn(e, n));
    });
  }), s.dispose;
}
function Mn(e, t) {
  var r, n;
  let o = Ze();
  if (!e) return o.dispose;
  let s = !1;
  o.add(() => {
    s = !0;
  });
  let a = (n = (r = e.getAnimations) == null ? void 0 : r.call(e).filter((l) => l instanceof CSSTransition)) != null ? n : [];
  return a.length === 0 ? (t(), o.dispose) : (Promise.allSettled(a.map((l) => l.finished)).then(() => {
    s || t();
  }), o.dispose);
}
function In(e, { inFlight: t, prepare: r }) {
  if (t != null && t.current) {
    r();
    return;
  }
  let n = e.style.transition;
  e.style.transition = "none", r(), e.offsetHeight, e.style.transition = n;
}
let Et = Re(null);
Et.displayName = "OpenClosedContext";
var be = ((e) => (e[e.Open = 1] = "Open", e[e.Closed = 2] = "Closed", e[e.Closing = 4] = "Closing", e[e.Opening = 8] = "Opening", e))(be || {});
function tr() {
  return Pe(Et);
}
function On({ value: e, children: t }) {
  return M.createElement(Et.Provider, { value: e }, t);
}
function jn() {
  let e = typeof document > "u";
  return "useSyncExternalStore" in X ? ((t) => t.useSyncExternalStore)(X)(() => () => {
  }, () => !1, () => !e) : !1;
}
function rr() {
  let e = jn(), [t, r] = X.useState(qe.isHandoffComplete);
  return t && qe.isHandoffComplete === !1 && r(!1), X.useEffect(() => {
    t !== !0 && r(!0);
  }, [t]), X.useEffect(() => qe.handoff(), []), e ? !1 : t;
}
function zn() {
  let e = C(!1);
  return ue(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function nr(e) {
  var t;
  return !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) || ((t = e.as) != null ? t : sr) !== ee || M.Children.count(e.children) === 1;
}
let Qe = Re(null);
Qe.displayName = "TransitionContext";
var Gn = ((e) => (e.Visible = "visible", e.Hidden = "hidden", e))(Gn || {});
function Rn() {
  let e = Pe(Qe);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
function Hn() {
  let e = Pe(et);
  if (e === null) throw new Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");
  return e;
}
let et = Re(null);
et.displayName = "NestingContext";
function tt(e) {
  return "children" in e ? tt(e.children) : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === "visible").length > 0;
}
function or(e, t) {
  let r = Xt(e), n = C([]), o = zn(), s = Yt(), a = oe((b, p = ce.Hidden) => {
    let f = n.current.findIndex(({ el: m }) => m === b);
    f !== -1 && (Je(p, { [ce.Unmount]() {
      n.current.splice(f, 1);
    }, [ce.Hidden]() {
      n.current[f].state = "hidden";
    } }), s.microTask(() => {
      var m;
      !tt(n) && o.current && ((m = r.current) == null || m.call(r));
    }));
  }), l = oe((b) => {
    let p = n.current.find(({ el: f }) => f === b);
    return p ? p.state !== "visible" && (p.state = "visible") : n.current.push({ el: b, state: "visible" }), () => a(b, ce.Unmount);
  }), i = C([]), u = C(Promise.resolve()), c = C({ enter: [], leave: [] }), d = oe((b, p, f) => {
    i.current.splice(0), t && (t.chains.current[p] = t.chains.current[p].filter(([m]) => m !== b)), t == null || t.chains.current[p].push([b, new Promise((m) => {
      i.current.push(m);
    })]), t == null || t.chains.current[p].push([b, new Promise((m) => {
      Promise.all(c.current[p].map(([h, y]) => y)).then(() => m());
    })]), p === "enter" ? u.current = u.current.then(() => t == null ? void 0 : t.wait.current).then(() => f(p)) : f(p);
  }), g = oe((b, p, f) => {
    Promise.all(c.current[p].splice(0).map(([m, h]) => h)).then(() => {
      var m;
      (m = i.current.shift()) == null || m();
    }).then(() => f(p));
  });
  return Z(() => ({ children: n, register: l, unregister: a, onStart: d, onStop: g, wait: u, chains: c }), [l, a, n, d, g, c, u]);
}
let sr = ee, lr = Zt.RenderStrategy;
function Dn(e, t) {
  var r, n;
  let { transition: o = !0, beforeEnter: s, afterEnter: a, beforeLeave: l, afterLeave: i, enter: u, enterFrom: c, enterTo: d, entered: g, leave: b, leaveFrom: p, leaveTo: f, ...m } = e, [h, y] = z(null), $ = C(null), E = nr(e), P = er(...E ? [$, t, y] : t === null ? [] : [t]), N = (r = m.unmount) == null || r ? ce.Unmount : ce.Hidden, { show: F, appear: U, initial: R } = Rn(), [T, I] = z(F ? "visible" : "hidden"), v = Hn(), { register: V, unregister: G } = v;
  ue(() => V($), [V, $]), ue(() => {
    if (N === ce.Hidden && $.current) {
      if (F && T !== "visible") {
        I("visible");
        return;
      }
      return Je(T, { hidden: () => G($), visible: () => V($) });
    }
  }, [T, $, V, G, F, N]);
  let q = rr();
  ue(() => {
    if (E && q && T === "visible" && $.current === null) throw new Error("Did you forget to passthrough the `ref` to the actual DOM node?");
  }, [$, T, q, E]);
  let H = R && !U, J = U && F && R, _ = C(!1), j = or(() => {
    _.current || (I("hidden"), G($));
  }, v), S = oe((rt) => {
    _.current = !0;
    let _e = rt ? "enter" : "leave";
    j.onStart($, _e, (Le) => {
      Le === "enter" ? s == null || s() : Le === "leave" && (l == null || l());
    });
  }), k = oe((rt) => {
    let _e = rt ? "enter" : "leave";
    _.current = !1, j.onStop($, _e, (Le) => {
      Le === "enter" ? a == null || a() : Le === "leave" && (i == null || i());
    }), _e === "leave" && !tt(j) && (I("hidden"), G($));
  });
  W(() => {
    E && o || (S(F), k(F));
  }, [F, E, o]);
  let ve = !(!o || !E || !q || H), [, D] = Ln(ve, h, F, { start: S, end: k }), We = pe({ ref: P, className: ((n = dt(m.className, J && u, J && c, D.enter && u, D.enter && D.closed && c, D.enter && !D.closed && d, D.leave && b, D.leave && !D.closed && p, D.leave && D.closed && f, !D.transition && F && g)) == null ? void 0 : n.trim()) || void 0, ...An(D) }), fe = 0;
  T === "visible" && (fe |= be.Open), T === "hidden" && (fe |= be.Closed), F && T === "hidden" && (fe |= be.Opening), !F && T === "visible" && (fe |= be.Closing);
  let Gr = Jt();
  return M.createElement(et.Provider, { value: j }, M.createElement(On, { value: fe }, Gr({ ourProps: We, theirProps: m, defaultTag: sr, features: lr, visible: T === "visible", name: "Transition.Child" })));
}
function Wn(e, t) {
  let { show: r, appear: n = !1, unmount: o = !0, ...s } = e, a = C(null), l = nr(e), i = er(...l ? [a, t] : t === null ? [] : [t]);
  rr();
  let u = tr();
  if (r === void 0 && u !== null && (r = (u & be.Open) === be.Open), r === void 0) throw new Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");
  let [c, d] = z(r ? "visible" : "hidden"), g = or(() => {
    r || d("hidden");
  }), [b, p] = z(!0), f = C([r]);
  ue(() => {
    b !== !1 && f.current[f.current.length - 1] !== r && (f.current.push(r), p(!1));
  }, [f, r]);
  let m = Z(() => ({ show: r, appear: n, initial: b }), [r, n, b]);
  ue(() => {
    r ? d("visible") : !tt(g) && a.current !== null && d("hidden");
  }, [r, g]);
  let h = { unmount: o }, y = oe(() => {
    var P;
    b && p(!1), (P = e.beforeEnter) == null || P.call(e);
  }), $ = oe(() => {
    var P;
    b && p(!1), (P = e.beforeLeave) == null || P.call(e);
  }), E = Jt();
  return M.createElement(et.Provider, { value: g }, M.createElement(Qe.Provider, { value: m }, E({ ourProps: { ...h, as: ee, children: M.createElement(ar, { ref: i, ...h, ...s, beforeEnter: y, beforeLeave: $ }) }, theirProps: {}, defaultTag: ee, features: lr, visible: c === "visible", name: "Transition" })));
}
function _n(e, t) {
  let r = Pe(Qe) !== null, n = tr() !== null;
  return M.createElement(M.Fragment, null, !r && n ? M.createElement(ft, { ref: t, ...e }) : M.createElement(ar, { ref: t, ...e }));
}
let ft = xt(Wn), ar = xt(Dn), Un = xt(_n), Vn = Object.assign(ft, { Child: Un, Root: ft });
const $t = "-", Bn = (e) => {
  const t = Kn(e), {
    conflictingClassGroups: r,
    conflictingClassGroupModifiers: n
  } = e;
  return {
    getClassGroupId: (o) => {
      const s = o.split($t);
      return s[0] === "" && s.length !== 1 && s.shift(), ir(s, t) || qn(o);
    },
    getConflictingClassGroupIds: (o, s) => {
      const a = r[o] || [];
      return s && n[o] ? [...a, ...n[o]] : a;
    }
  };
}, ir = (e, t) => {
  var r;
  if (e.length === 0)
    return t.classGroupId;
  const n = e[0], o = t.nextPart.get(n), s = o ? ir(e.slice(1), o) : void 0;
  if (s)
    return s;
  if (t.validators.length === 0)
    return;
  const a = e.join($t);
  return (r = t.validators.find(({
    validator: l
  }) => l(a))) == null ? void 0 : r.classGroupId;
}, Mt = /^\[(.+)\]$/, qn = (e) => {
  if (Mt.test(e)) {
    const t = Mt.exec(e)[1], r = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (r)
      return "arbitrary.." + r;
  }
}, Kn = (e) => {
  const {
    theme: t,
    prefix: r
  } = e, n = {
    nextPart: /* @__PURE__ */ new Map(),
    validators: []
  };
  return Xn(Object.entries(e.classGroups), r).forEach(([o, s]) => {
    pt(s, n, o, t);
  }), n;
}, pt = (e, t, r, n) => {
  e.forEach((o) => {
    if (typeof o == "string") {
      const s = o === "" ? t : It(t, o);
      s.classGroupId = r;
      return;
    }
    if (typeof o == "function") {
      if (Yn(o)) {
        pt(o(n), t, r, n);
        return;
      }
      t.validators.push({
        validator: o,
        classGroupId: r
      });
      return;
    }
    Object.entries(o).forEach(([s, a]) => {
      pt(a, It(t, s), r, n);
    });
  });
}, It = (e, t) => {
  let r = e;
  return t.split($t).forEach((n) => {
    r.nextPart.has(n) || r.nextPart.set(n, {
      nextPart: /* @__PURE__ */ new Map(),
      validators: []
    }), r = r.nextPart.get(n);
  }), r;
}, Yn = (e) => e.isThemeGetter, Xn = (e, t) => t ? e.map(([r, n]) => {
  const o = n.map((s) => typeof s == "string" ? t + s : typeof s == "object" ? Object.fromEntries(Object.entries(s).map(([a, l]) => [t + a, l])) : s);
  return [r, o];
}) : e, Zn = (e) => {
  if (e < 1)
    return {
      get: () => {
      },
      set: () => {
      }
    };
  let t = 0, r = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
  const o = (s, a) => {
    r.set(s, a), t++, t > e && (t = 0, n = r, r = /* @__PURE__ */ new Map());
  };
  return {
    get(s) {
      let a = r.get(s);
      if (a !== void 0)
        return a;
      if ((a = n.get(s)) !== void 0)
        return o(s, a), a;
    },
    set(s, a) {
      r.has(s) ? r.set(s, a) : o(s, a);
    }
  };
}, cr = "!", Jn = (e) => {
  const {
    separator: t,
    experimentalParseClassName: r
  } = e, n = t.length === 1, o = t[0], s = t.length, a = (l) => {
    const i = [];
    let u = 0, c = 0, d;
    for (let m = 0; m < l.length; m++) {
      let h = l[m];
      if (u === 0) {
        if (h === o && (n || l.slice(m, m + s) === t)) {
          i.push(l.slice(c, m)), c = m + s;
          continue;
        }
        if (h === "/") {
          d = m;
          continue;
        }
      }
      h === "[" ? u++ : h === "]" && u--;
    }
    const g = i.length === 0 ? l : l.substring(c), b = g.startsWith(cr), p = b ? g.substring(1) : g, f = d && d > c ? d - c : void 0;
    return {
      modifiers: i,
      hasImportantModifier: b,
      baseClassName: p,
      maybePostfixModifierPosition: f
    };
  };
  return r ? (l) => r({
    className: l,
    parseClassName: a
  }) : a;
}, Qn = (e) => {
  if (e.length <= 1)
    return e;
  const t = [];
  let r = [];
  return e.forEach((n) => {
    n[0] === "[" ? (t.push(...r.sort(), n), r = []) : r.push(n);
  }), t.push(...r.sort()), t;
}, eo = (e) => ({
  cache: Zn(e.cacheSize),
  parseClassName: Jn(e),
  ...Bn(e)
}), to = /\s+/, ro = (e, t) => {
  const {
    parseClassName: r,
    getClassGroupId: n,
    getConflictingClassGroupIds: o
  } = t, s = [], a = e.trim().split(to);
  let l = "";
  for (let i = a.length - 1; i >= 0; i -= 1) {
    const u = a[i], {
      modifiers: c,
      hasImportantModifier: d,
      baseClassName: g,
      maybePostfixModifierPosition: b
    } = r(u);
    let p = !!b, f = n(p ? g.substring(0, b) : g);
    if (!f) {
      if (!p) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      if (f = n(g), !f) {
        l = u + (l.length > 0 ? " " + l : l);
        continue;
      }
      p = !1;
    }
    const m = Qn(c).join(":"), h = d ? m + cr : m, y = h + f;
    if (s.includes(y))
      continue;
    s.push(y);
    const $ = o(f, p);
    for (let E = 0; E < $.length; ++E) {
      const P = $[E];
      s.push(h + P);
    }
    l = u + (l.length > 0 ? " " + l : l);
  }
  return l;
};
function no() {
  let e = 0, t, r, n = "";
  for (; e < arguments.length; )
    (t = arguments[e++]) && (r = ur(t)) && (n && (n += " "), n += r);
  return n;
}
const ur = (e) => {
  if (typeof e == "string")
    return e;
  let t, r = "";
  for (let n = 0; n < e.length; n++)
    e[n] && (t = ur(e[n])) && (r && (r += " "), r += t);
  return r;
};
function oo(e, ...t) {
  let r, n, o, s = a;
  function a(i) {
    const u = t.reduce((c, d) => d(c), e());
    return r = eo(u), n = r.cache.get, o = r.cache.set, s = l, l(i);
  }
  function l(i) {
    const u = n(i);
    if (u)
      return u;
    const c = ro(i, r);
    return o(i, c), c;
  }
  return function() {
    return s(no.apply(null, arguments));
  };
}
const L = (e) => {
  const t = (r) => r[e] || [];
  return t.isThemeGetter = !0, t;
}, dr = /^\[(?:([a-z-]+):)?(.+)\]$/i, so = /^\d+\/\d+$/, lo = /* @__PURE__ */ new Set(["px", "full", "screen"]), ao = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, io = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, co = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, uo = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, fo = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, re = (e) => $e(e) || lo.has(e) || so.test(e), ae = (e) => Se(e, "length", wo), $e = (e) => !!e && !Number.isNaN(Number(e)), lt = (e) => Se(e, "number", $e), Ie = (e) => !!e && Number.isInteger(Number(e)), po = (e) => e.endsWith("%") && $e(e.slice(0, -1)), x = (e) => dr.test(e), ie = (e) => ao.test(e), bo = /* @__PURE__ */ new Set(["length", "size", "percentage"]), mo = (e) => Se(e, bo, fr), go = (e) => Se(e, "position", fr), ho = /* @__PURE__ */ new Set(["image", "url"]), vo = (e) => Se(e, ho, Eo), yo = (e) => Se(e, "", xo), Oe = () => !0, Se = (e, t, r) => {
  const n = dr.exec(e);
  return n ? n[1] ? typeof t == "string" ? n[1] === t : t.has(n[1]) : r(n[2]) : !1;
}, wo = (e) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  io.test(e) && !co.test(e)
), fr = () => !1, xo = (e) => uo.test(e), Eo = (e) => fo.test(e), $o = () => {
  const e = L("colors"), t = L("spacing"), r = L("blur"), n = L("brightness"), o = L("borderColor"), s = L("borderRadius"), a = L("borderSpacing"), l = L("borderWidth"), i = L("contrast"), u = L("grayscale"), c = L("hueRotate"), d = L("invert"), g = L("gap"), b = L("gradientColorStops"), p = L("gradientColorStopPositions"), f = L("inset"), m = L("margin"), h = L("opacity"), y = L("padding"), $ = L("saturate"), E = L("scale"), P = L("sepia"), N = L("skew"), F = L("space"), U = L("translate"), R = () => ["auto", "contain", "none"], T = () => ["auto", "hidden", "clip", "visible", "scroll"], I = () => ["auto", x, t], v = () => [x, t], V = () => ["", re, ae], G = () => ["auto", $e, x], q = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"], H = () => ["solid", "dashed", "dotted", "double", "none"], J = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"], _ = () => ["start", "end", "center", "between", "around", "evenly", "stretch"], j = () => ["", "0", x], S = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"], k = () => [$e, x];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Oe],
      spacing: [re, ae],
      blur: ["none", "", ie, x],
      brightness: k(),
      borderColor: [e],
      borderRadius: ["none", "", "full", ie, x],
      borderSpacing: v(),
      borderWidth: V(),
      contrast: k(),
      grayscale: j(),
      hueRotate: k(),
      invert: j(),
      gap: v(),
      gradientColorStops: [e],
      gradientColorStopPositions: [po, ae],
      inset: I(),
      margin: I(),
      opacity: k(),
      padding: v(),
      saturate: k(),
      scale: k(),
      sepia: j(),
      skew: k(),
      space: v(),
      translate: v()
    },
    classGroups: {
      // Layout
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", "video", x]
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
        columns: [ie]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": S()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": S()
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
        object: [...q(), x]
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: T()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": T()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": T()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: R()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": R()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": R()
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
        inset: [f]
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": [f]
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": [f]
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: [f]
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: [f]
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: [f]
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: [f]
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: [f]
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: [f]
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
        z: ["auto", Ie, x]
      }],
      // Flexbox and Grid
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: I()
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
        flex: ["1", "auto", "initial", "none", x]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: j()
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: j()
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: ["first", "last", "none", Ie, x]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": [Oe]
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: ["auto", {
          span: ["full", Ie, x]
        }, x]
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": G()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": G()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": [Oe]
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: ["auto", {
          span: [Ie, x]
        }, x]
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": G()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": G()
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
        "auto-cols": ["auto", "min", "max", "fr", x]
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": ["auto", "min", "max", "fr", x]
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
        justify: ["normal", ..._()]
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
        content: ["normal", ..._(), "baseline"]
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
        "place-content": [..._(), "baseline"]
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
        p: [y]
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: [y]
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: [y]
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: [y]
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: [y]
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: [y]
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: [y]
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: [y]
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: [y]
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
        w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", x, t]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [x, t, "min", "max", "fit"]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [x, t, "none", "full", "min", "max", "fit", "prose", {
          screen: [ie]
        }, ie]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: [x, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": [x, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": [x, t, "min", "max", "fit", "svh", "lvh", "dvh"]
      }],
      /**
       * Size
       * @see https://tailwindcss.com/docs/size
       */
      size: [{
        size: [x, t, "auto", "min", "max", "fit"]
      }],
      // Typography
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", ie, ae]
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
        font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", lt]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [Oe]
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
        tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", x]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": ["none", $e, lt]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: ["none", "tight", "snug", "normal", "relaxed", "loose", re, x]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", x]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["none", "disc", "decimal", x]
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
        "placeholder-opacity": [h]
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
        "text-opacity": [h]
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
        decoration: [...H(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: ["auto", "from-font", re, ae]
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": ["auto", re, x]
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
        indent: v()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", x]
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
        content: ["none", x]
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
        "bg-opacity": [h]
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
        bg: [...q(), go]
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
        bg: ["auto", "cover", "contain", mo]
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
        }, vo]
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
        from: [p]
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: [p]
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: [p]
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
        rounded: [s]
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": [s]
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": [s]
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": [s]
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": [s]
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": [s]
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": [s]
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": [s]
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": [s]
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": [s]
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": [s]
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": [s]
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": [s]
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": [s]
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": [s]
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
        "border-opacity": [h]
      }],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...H(), "hidden"]
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
        "divide-opacity": [h]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */
      "divide-style": [{
        divide: H()
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
        outline: ["", ...H()]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [re, x]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: [re, ae]
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
        ring: V()
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
        "ring-opacity": [h]
      }],
      /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */
      "ring-offset-w": [{
        "ring-offset": [re, ae]
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
        shadow: ["", "inner", "none", ie, yo]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */
      "shadow-color": [{
        shadow: [Oe]
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [h]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...J(), "plus-lighter", "plus-darker"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": J()
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
        contrast: [i]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": ["", "none", ie, x]
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
        "hue-rotate": [c]
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
        saturate: [$]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: [P]
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
        "backdrop-contrast": [i]
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
        "backdrop-hue-rotate": [c]
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
        "backdrop-opacity": [h]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [$]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": [P]
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
        "border-spacing": [a]
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": [a]
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": [a]
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
        transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", x]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: k()
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "in", "out", "in-out", x]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: k()
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", "spin", "ping", "pulse", "bounce", x]
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
        scale: [E]
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": [E]
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": [E]
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: [Ie, x]
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": [U]
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": [U]
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": [N]
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": [N]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: ["center", "top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left", x]
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
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", x]
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
        "scroll-m": v()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": v()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": v()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": v()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": v()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": v()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": v()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": v()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": v()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": v()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": v()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": v()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": v()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": v()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": v()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": v()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": v()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": v()
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
        "will-change": ["auto", "scroll", "contents", "transform", x]
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
        stroke: [re, ae, lt]
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
}, Ot = /* @__PURE__ */ oo($o), To = ({
  children: e,
  content: t,
  position: r,
  className: n,
  delay: o = 300,
  closeOnClick: s = !1,
  imageSrc: a,
  description: l,
  interactive: i = !1
}) => {
  const [u, c] = z(!1), d = C(null), g = C(null), [b, p] = z(!1), [f, m] = z(!1), h = () => d.current ? d.current.querySelectorAll('[data-headlessui-state="open"]').length > 0 : !1;
  W(() => {
    const E = new MutationObserver((P) => {
      P.forEach((N) => {
        N.type === "attributes" && N.attributeName === "data-headlessui-state" && N.target.getAttribute("data-headlessui-state") === "open" && c(!1);
      });
    });
    return d.current && E.observe(d.current, {
      attributes: !0,
      subtree: !0,
      attributeFilter: ["data-headlessui-state"]
    }), () => {
      E.disconnect();
    };
  }, []);
  const y = () => {
    if (d.current) {
      const E = d.current.getBoundingClientRect();
      switch (r) {
        case "top":
          return {
            bottom: E.height + 10,
            left: "50%",
            transform: "translateX(-50%)"
          };
        case "bottom":
          return {
            top: E.height + 10,
            left: "50%",
            transform: "translateX(-50%)"
          };
        case "left":
          return {
            right: E.width + 10,
            top: "50%",
            transform: "translateY(-50%)"
          };
        case "right":
          return {
            left: E.width + 10,
            top: "50%",
            transform: "translateY(-50%)"
          };
        default:
          return {};
      }
    }
    return {};
  }, $ = (E) => {
    s && (c(!1), E.stopPropagation());
  };
  return W(() => {
    h() || c(b || i && f);
  }, [b, f, i]), /* @__PURE__ */ Ke(
    "div",
    {
      ref: d,
      onMouseEnter: () => {
        p(!0), h() || c(!0);
      },
      onMouseLeave: () => {
        p(!1), i || c(!1);
      },
      onClick: $,
      className: "relative",
      children: [
        e,
        /* @__PURE__ */ ne(
          Vn,
          {
            show: u,
            enter: Ot(
              "transition ease-out duration-200",
              o ? `delay-[${o}ms]` : "delay-[300ms]"
            ),
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            leave: "transition ease-in duration-150",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
            children: /* @__PURE__ */ ne(
              "div",
              {
                ref: g,
                onMouseEnter: () => i && m(!0),
                onMouseLeave: () => i && m(!1),
                style: {
                  ...y(),
                  transitionDelay: `${o}ms`,
                  transitionProperty: "opacity",
                  transitionDuration: "200ms",
                  transitionTimingFunction: "ease-out"
                },
                className: Ot(
                  "absolute z-10 w-max rounded-lg bg-ui-controls px-2.5 py-1.5 text-[13px] font-medium text-base-fg shadow-xl border border-ui-panel-border",
                  i ? "pointer-events-auto" : "pointer-events-none",
                  n || ""
                ),
                children: /* @__PURE__ */ Ke("div", { className: "flex flex-col gap-1", children: [
                  t,
                  a && /* @__PURE__ */ ne(
                    "img",
                    {
                      src: a,
                      alt: "tooltip",
                      className: "mb-1 aspect-square w-56 rounded-md"
                    }
                  ),
                  l && /* @__PURE__ */ ne("p", { className: "text-sm text-base-fg font-normal", children: l })
                ] })
              }
            )
          }
        )
      ]
    }
  );
}, pr = typeof document < "u" ? M.useLayoutEffect : () => {
};
function ko(e) {
  const t = C(null);
  return pr(() => {
    t.current = e;
  }, [
    e
  ]), O((...r) => {
    const n = t.current;
    return n == null ? void 0 : n(...r);
  }, []);
}
const de = (e) => {
  var t;
  return (t = e == null ? void 0 : e.ownerDocument) !== null && t !== void 0 ? t : document;
}, me = (e) => e && "window" in e && e.window === e ? e : de(e).defaultView || window;
function Po(e) {
  return e !== null && typeof e == "object" && "nodeType" in e && typeof e.nodeType == "number";
}
function Co(e) {
  return Po(e) && e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in e;
}
let So = !1;
function Tt() {
  return So;
}
function br(e, t) {
  if (!Tt()) return t && e ? e.contains(t) : !1;
  if (!e || !t) return !1;
  let r = t;
  for (; r !== null; ) {
    if (r === e) return !0;
    r.tagName === "SLOT" && r.assignedSlot ? r = r.assignedSlot.parentNode : Co(r) ? r = r.host : r = r.parentNode;
  }
  return !1;
}
const bt = (e = document) => {
  var t;
  if (!Tt()) return e.activeElement;
  let r = e.activeElement;
  for (; r && "shadowRoot" in r && (!((t = r.shadowRoot) === null || t === void 0) && t.activeElement); ) r = r.shadowRoot.activeElement;
  return r;
};
function mr(e) {
  return Tt() && e.target.shadowRoot && e.composedPath ? e.composedPath()[0] : e.target;
}
function Fo(e) {
  var t;
  return typeof window > "u" || window.navigator == null ? !1 : ((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.brands.some((r) => e.test(r.brand))) || e.test(window.navigator.userAgent);
}
function Ao(e) {
  var t;
  return typeof window < "u" && window.navigator != null ? e.test(((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) || window.navigator.platform) : !1;
}
function gr(e) {
  let t = null;
  return () => (t == null && (t = e()), t);
}
const Lo = gr(function() {
  return Ao(/^Mac/i);
}), No = gr(function() {
  return Fo(/Android/i);
});
function hr() {
  let e = C(/* @__PURE__ */ new Map()), t = O((o, s, a, l) => {
    let i = l != null && l.once ? (...u) => {
      e.current.delete(a), a(...u);
    } : a;
    e.current.set(a, {
      type: s,
      eventTarget: o,
      fn: i,
      options: l
    }), o.addEventListener(s, i, l);
  }, []), r = O((o, s, a, l) => {
    var i;
    let u = ((i = e.current.get(a)) === null || i === void 0 ? void 0 : i.fn) || a;
    o.removeEventListener(s, u, l), e.current.delete(a);
  }, []), n = O(() => {
    e.current.forEach((o, s) => {
      r(o.eventTarget, o.type, s, o.options);
    });
  }, [
    r
  ]);
  return W(() => n, [
    n
  ]), {
    addGlobalListener: t,
    removeGlobalListener: r,
    removeAllGlobalListeners: n
  };
}
function Mo(e) {
  return e.mozInputSource === 0 && e.isTrusted ? !0 : No() && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
class vr {
  isDefaultPrevented() {
    return this.nativeEvent.defaultPrevented;
  }
  preventDefault() {
    this.defaultPrevented = !0, this.nativeEvent.preventDefault();
  }
  stopPropagation() {
    this.nativeEvent.stopPropagation(), this.isPropagationStopped = () => !0;
  }
  isPropagationStopped() {
    return !1;
  }
  persist() {
  }
  constructor(t, r) {
    this.nativeEvent = r, this.target = r.target, this.currentTarget = r.currentTarget, this.relatedTarget = r.relatedTarget, this.bubbles = r.bubbles, this.cancelable = r.cancelable, this.defaultPrevented = r.defaultPrevented, this.eventPhase = r.eventPhase, this.isTrusted = r.isTrusted, this.timeStamp = r.timeStamp, this.type = t;
  }
}
function yr(e) {
  let t = C({
    isFocused: !1,
    observer: null
  });
  pr(() => {
    const n = t.current;
    return () => {
      n.observer && (n.observer.disconnect(), n.observer = null);
    };
  }, []);
  let r = ko((n) => {
    e == null || e(n);
  });
  return O((n) => {
    if (n.target instanceof HTMLButtonElement || n.target instanceof HTMLInputElement || n.target instanceof HTMLTextAreaElement || n.target instanceof HTMLSelectElement) {
      t.current.isFocused = !0;
      let o = n.target, s = (a) => {
        t.current.isFocused = !1, o.disabled && r(new vr("blur", a)), t.current.observer && (t.current.observer.disconnect(), t.current.observer = null);
      };
      o.addEventListener("focusout", s, {
        once: !0
      }), t.current.observer = new MutationObserver(() => {
        if (t.current.isFocused && o.disabled) {
          var a;
          (a = t.current.observer) === null || a === void 0 || a.disconnect();
          let l = o === document.activeElement ? null : document.activeElement;
          o.dispatchEvent(new FocusEvent("blur", {
            relatedTarget: l
          })), o.dispatchEvent(new FocusEvent("focusout", {
            bubbles: !0,
            relatedTarget: l
          }));
        }
      }), t.current.observer.observe(o, {
        attributes: !0,
        attributeFilter: [
          "disabled"
        ]
      });
    }
  }, [
    r
  ]);
}
let Io = !1, He = null, mt = /* @__PURE__ */ new Set(), Ge = /* @__PURE__ */ new Map(), he = !1, gt = !1;
const Oo = {
  Tab: !0,
  Escape: !0
};
function kt(e, t) {
  for (let r of mt) r(e, t);
}
function jo(e) {
  return !(e.metaKey || !Lo() && e.altKey || e.ctrlKey || e.key === "Control" || e.key === "Shift" || e.key === "Meta");
}
function Ye(e) {
  he = !0, jo(e) && (He = "keyboard", kt("keyboard", e));
}
function B(e) {
  He = "pointer", (e.type === "mousedown" || e.type === "pointerdown") && (he = !0, kt("pointer", e));
}
function wr(e) {
  Mo(e) && (he = !0, He = "virtual");
}
function xr(e) {
  e.target === window || e.target === document || Io || !e.isTrusted || (!he && !gt && (He = "virtual", kt("virtual", e)), he = !1, gt = !1);
}
function Er() {
  he = !1, gt = !0;
}
function ht(e) {
  if (typeof window > "u" || Ge.get(me(e))) return;
  const t = me(e), r = de(e);
  let n = t.HTMLElement.prototype.focus;
  t.HTMLElement.prototype.focus = function() {
    he = !0, n.apply(this, arguments);
  }, r.addEventListener("keydown", Ye, !0), r.addEventListener("keyup", Ye, !0), r.addEventListener("click", wr, !0), t.addEventListener("focus", xr, !0), t.addEventListener("blur", Er, !1), typeof PointerEvent < "u" ? (r.addEventListener("pointerdown", B, !0), r.addEventListener("pointermove", B, !0), r.addEventListener("pointerup", B, !0)) : (r.addEventListener("mousedown", B, !0), r.addEventListener("mousemove", B, !0), r.addEventListener("mouseup", B, !0)), t.addEventListener("beforeunload", () => {
    $r(e);
  }, {
    once: !0
  }), Ge.set(t, {
    focus: n
  });
}
const $r = (e, t) => {
  const r = me(e), n = de(e);
  t && n.removeEventListener("DOMContentLoaded", t), Ge.has(r) && (r.HTMLElement.prototype.focus = Ge.get(r).focus, n.removeEventListener("keydown", Ye, !0), n.removeEventListener("keyup", Ye, !0), n.removeEventListener("click", wr, !0), r.removeEventListener("focus", xr, !0), r.removeEventListener("blur", Er, !1), typeof PointerEvent < "u" ? (n.removeEventListener("pointerdown", B, !0), n.removeEventListener("pointermove", B, !0), n.removeEventListener("pointerup", B, !0)) : (n.removeEventListener("mousedown", B, !0), n.removeEventListener("mousemove", B, !0), n.removeEventListener("mouseup", B, !0)), Ge.delete(r));
};
function zo(e) {
  const t = de(e);
  let r;
  return t.readyState !== "loading" ? ht(e) : (r = () => {
    ht(e);
  }, t.addEventListener("DOMContentLoaded", r)), () => $r(e, r);
}
typeof document < "u" && zo();
function Tr() {
  return He !== "pointer";
}
const Go = /* @__PURE__ */ new Set([
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "image",
  "button",
  "submit",
  "reset"
]);
function Ro(e, t, r) {
  let n = de(r == null ? void 0 : r.target);
  const o = typeof window < "u" ? me(r == null ? void 0 : r.target).HTMLInputElement : HTMLInputElement, s = typeof window < "u" ? me(r == null ? void 0 : r.target).HTMLTextAreaElement : HTMLTextAreaElement, a = typeof window < "u" ? me(r == null ? void 0 : r.target).HTMLElement : HTMLElement, l = typeof window < "u" ? me(r == null ? void 0 : r.target).KeyboardEvent : KeyboardEvent;
  return e = e || n.activeElement instanceof o && !Go.has(n.activeElement.type) || n.activeElement instanceof s || n.activeElement instanceof a && n.activeElement.isContentEditable, !(e && t === "keyboard" && r instanceof l && !Oo[r.key]);
}
function Ho(e, t, r) {
  ht(), W(() => {
    let n = (o, s) => {
      Ro(!!(r != null && r.isTextInput), o, s) && e(Tr());
    };
    return mt.add(n), () => {
      mt.delete(n);
    };
  }, t);
}
function Do(e) {
  let { isDisabled: t, onFocus: r, onBlur: n, onFocusChange: o } = e;
  const s = O((i) => {
    if (i.target === i.currentTarget)
      return n && n(i), o && o(!1), !0;
  }, [
    n,
    o
  ]), a = yr(s), l = O((i) => {
    const u = de(i.target), c = u ? bt(u) : bt();
    i.target === i.currentTarget && c === mr(i.nativeEvent) && (r && r(i), o && o(!0), a(i));
  }, [
    o,
    r,
    a
  ]);
  return {
    focusProps: {
      onFocus: !t && (r || o || n) ? l : void 0,
      onBlur: !t && (n || o) ? s : void 0
    }
  };
}
function Wo(e) {
  let { isDisabled: t, onBlurWithin: r, onFocusWithin: n, onFocusWithinChange: o } = e, s = C({
    isFocusWithin: !1
  }), { addGlobalListener: a, removeAllGlobalListeners: l } = hr(), i = O((d) => {
    d.currentTarget.contains(d.target) && s.current.isFocusWithin && !d.currentTarget.contains(d.relatedTarget) && (s.current.isFocusWithin = !1, l(), r && r(d), o && o(!1));
  }, [
    r,
    o,
    s,
    l
  ]), u = yr(i), c = O((d) => {
    if (!d.currentTarget.contains(d.target)) return;
    const g = de(d.target), b = bt(g);
    if (!s.current.isFocusWithin && b === mr(d.nativeEvent)) {
      n && n(d), o && o(!0), s.current.isFocusWithin = !0, u(d);
      let p = d.currentTarget;
      a(g, "focus", (f) => {
        if (s.current.isFocusWithin && !br(p, f.target)) {
          let m = new vr("blur", new g.defaultView.FocusEvent("blur", {
            relatedTarget: f.target
          }));
          m.target = p, m.currentTarget = p, i(m);
        }
      }, {
        capture: !0
      });
    }
  }, [
    n,
    o,
    u,
    a,
    i
  ]);
  return t ? {
    focusWithinProps: {
      // These cannot be null, that would conflict in mergeProps
      onFocus: void 0,
      onBlur: void 0
    }
  } : {
    focusWithinProps: {
      onFocus: c,
      onBlur: i
    }
  };
}
let Xe = !1, at = 0;
function vt() {
  Xe = !0, setTimeout(() => {
    Xe = !1;
  }, 50);
}
function jt(e) {
  e.pointerType === "touch" && vt();
}
function _o() {
  if (!(typeof document > "u"))
    return typeof PointerEvent < "u" ? document.addEventListener("pointerup", jt) : document.addEventListener("touchend", vt), at++, () => {
      at--, !(at > 0) && (typeof PointerEvent < "u" ? document.removeEventListener("pointerup", jt) : document.removeEventListener("touchend", vt));
    };
}
function Uo(e) {
  let { onHoverStart: t, onHoverChange: r, onHoverEnd: n, isDisabled: o } = e, [s, a] = z(!1), l = C({
    isHovered: !1,
    ignoreEmulatedMouseEvents: !1,
    pointerType: "",
    target: null
  }).current;
  W(_o, []);
  let { addGlobalListener: i, removeAllGlobalListeners: u } = hr(), { hoverProps: c, triggerHoverEnd: d } = Z(() => {
    let g = (f, m) => {
      if (l.pointerType = m, o || m === "touch" || l.isHovered || !f.currentTarget.contains(f.target)) return;
      l.isHovered = !0;
      let h = f.currentTarget;
      l.target = h, i(de(f.target), "pointerover", (y) => {
        l.isHovered && l.target && !br(l.target, y.target) && b(y, y.pointerType);
      }, {
        capture: !0
      }), t && t({
        type: "hoverstart",
        target: h,
        pointerType: m
      }), r && r(!0), a(!0);
    }, b = (f, m) => {
      let h = l.target;
      l.pointerType = "", l.target = null, !(m === "touch" || !l.isHovered || !h) && (l.isHovered = !1, u(), n && n({
        type: "hoverend",
        target: h,
        pointerType: m
      }), r && r(!1), a(!1));
    }, p = {};
    return typeof PointerEvent < "u" ? (p.onPointerEnter = (f) => {
      Xe && f.pointerType === "mouse" || g(f, f.pointerType);
    }, p.onPointerLeave = (f) => {
      !o && f.currentTarget.contains(f.target) && b(f, f.pointerType);
    }) : (p.onTouchStart = () => {
      l.ignoreEmulatedMouseEvents = !0;
    }, p.onMouseEnter = (f) => {
      !l.ignoreEmulatedMouseEvents && !Xe && g(f, "mouse"), l.ignoreEmulatedMouseEvents = !1;
    }, p.onMouseLeave = (f) => {
      !o && f.currentTarget.contains(f.target) && b(f, "mouse");
    }), {
      hoverProps: p,
      triggerHoverEnd: b
    };
  }, [
    t,
    r,
    n,
    o,
    l,
    i,
    u
  ]);
  return W(() => {
    o && d({
      currentTarget: l.target
    }, l.pointerType);
  }, [
    o
  ]), {
    hoverProps: c,
    isHovered: s
  };
}
function kr(e = {}) {
  let { autoFocus: t = !1, isTextInput: r, within: n } = e, o = C({
    isFocused: !1,
    isFocusVisible: t || Tr()
  }), [s, a] = z(!1), [l, i] = z(() => o.current.isFocused && o.current.isFocusVisible), u = O(() => i(o.current.isFocused && o.current.isFocusVisible), []), c = O((b) => {
    o.current.isFocused = b, a(b), u();
  }, [
    u
  ]);
  Ho((b) => {
    o.current.isFocusVisible = b, u();
  }, [], {
    isTextInput: r
  });
  let { focusProps: d } = Do({
    isDisabled: n,
    onFocusChange: c
  }), { focusWithinProps: g } = Wo({
    isDisabled: !n,
    onFocusWithinChange: c
  });
  return {
    isFocused: s,
    isFocusVisible: l,
    focusProps: n ? g : d
  };
}
var Vo = Object.defineProperty, Bo = (e, t, r) => t in e ? Vo(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, it = (e, t, r) => (Bo(e, typeof t != "symbol" ? t + "" : t, r), r);
let qo = class {
  constructor() {
    it(this, "current", this.detect()), it(this, "handoffState", "pending"), it(this, "currentId", 0);
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
}, Pr = new qo();
function Cr(e) {
  var t, r;
  return Pr.isServer ? null : e ? "ownerDocument" in e ? e.ownerDocument : "current" in e ? (r = (t = e.current) == null ? void 0 : t.ownerDocument) != null ? r : document : null : document;
}
function Sr(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((t) => setTimeout(() => {
    throw t;
  }));
}
function Fr() {
  let e = [], t = { addEventListener(r, n, o, s) {
    return r.addEventListener(n, o, s), t.add(() => r.removeEventListener(n, o, s));
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
    return Sr(() => {
      n.current && r[0]();
    }), t.add(() => {
      n.current = !1;
    });
  }, style(r, n, o) {
    let s = r.style.getPropertyValue(n);
    return Object.assign(r.style, { [n]: o }), this.add(() => {
      Object.assign(r.style, { [n]: s });
    });
  }, group(r) {
    let n = Fr();
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
function Ko() {
  let [e] = z(Fr);
  return W(() => () => e.dispose(), [e]), e;
}
let Te = (e, t) => {
  Pr.isServer ? W(e, t) : Rt(e, t);
};
function je(e) {
  let t = C(e);
  return Te(() => {
    t.current = e;
  }, [e]), t;
}
let Q = function(e) {
  let t = je(e);
  return M.useCallback((...r) => t.current(...r), [t]);
};
function Yo(e) {
  let t = e.width / 2, r = e.height / 2;
  return { top: e.clientY - r, right: e.clientX + t, bottom: e.clientY + r, left: e.clientX - t };
}
function Xo(e, t) {
  return !(!e || !t || e.right < t.left || e.left > t.right || e.bottom < t.top || e.top > t.bottom);
}
function Zo({ disabled: e = !1 } = {}) {
  let t = C(null), [r, n] = z(!1), o = Ko(), s = Q(() => {
    t.current = null, n(!1), o.dispose();
  }), a = Q((l) => {
    if (o.dispose(), t.current === null) {
      t.current = l.currentTarget, n(!0);
      {
        let i = Cr(l.currentTarget);
        o.addEventListener(i, "pointerup", s, !1), o.addEventListener(i, "pointermove", (u) => {
          if (t.current) {
            let c = Yo(u);
            n(Xo(c, t.current.getBoundingClientRect()));
          }
        }, !1), o.addEventListener(i, "pointercancel", s, !1);
      }
    }
  });
  return { pressed: r, pressProps: e ? {} : { onPointerDown: a, onPointerUp: s, onClick: s } };
}
function zt(...e) {
  return Array.from(new Set(e.flatMap((t) => typeof t == "string" ? t.split(" ") : []))).filter(Boolean).join(" ");
}
function ge(e, t, ...r) {
  if (e in t) {
    let o = t[e];
    return typeof o == "function" ? o(...r) : o;
  }
  let n = new Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map((o) => `"${o}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(n, ge), n;
}
var yt = ((e) => (e[e.None = 0] = "None", e[e.RenderStrategy = 1] = "RenderStrategy", e[e.Static = 2] = "Static", e))(yt || {}), Jo = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(Jo || {});
function Fe() {
  let e = es();
  return O((t) => Qo({ mergeRefs: e, ...t }), [e]);
}
function Qo({ ourProps: e, theirProps: t, slot: r, defaultTag: n, features: o, visible: s = !0, name: a, mergeRefs: l }) {
  l = l ?? ts;
  let i = Ar(t, e);
  if (s) return Be(i, r, n, a, l);
  let u = o ?? 0;
  if (u & 2) {
    let { static: c = !1, ...d } = i;
    if (c) return Be(d, r, n, a, l);
  }
  if (u & 1) {
    let { unmount: c = !0, ...d } = i;
    return ge(c ? 0 : 1, { 0() {
      return null;
    }, 1() {
      return Be({ ...d, hidden: !0, style: { display: "none" } }, r, n, a, l);
    } });
  }
  return Be(i, r, n, a, l);
}
function Be(e, t = {}, r, n, o) {
  let { as: s = r, children: a, refName: l = "ref", ...i } = ct(e, ["unmount", "static"]), u = e.ref !== void 0 ? { [l]: e.ref } : {}, c = typeof a == "function" ? a(t) : a;
  "className" in i && i.className && typeof i.className == "function" && (i.className = i.className(t)), i["aria-labelledby"] && i["aria-labelledby"] === i.id && (i["aria-labelledby"] = void 0);
  let d = {};
  if (t) {
    let g = !1, b = [];
    for (let [p, f] of Object.entries(t)) typeof f == "boolean" && (g = !0), f === !0 && b.push(p.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`));
    if (g) {
      d["data-headlessui-state"] = b.join(" ");
      for (let p of b) d[`data-${p}`] = "";
    }
  }
  if (s === ee && (Object.keys(ye(i)).length > 0 || Object.keys(ye(d)).length > 0)) if (!Ht(c) || Array.isArray(c) && c.length > 1) {
    if (Object.keys(ye(i)).length > 0) throw new Error(['Passing props on "Fragment"!', "", `The current component <${n} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(ye(i)).concat(Object.keys(ye(d))).map((g) => `  - ${g}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((g) => `  - ${g}`).join(`
`)].join(`
`));
  } else {
    let g = c.props, b = g == null ? void 0 : g.className, p = typeof b == "function" ? (...h) => zt(b(...h), i.className) : zt(b, i.className), f = p ? { className: p } : {}, m = Ar(c.props, ye(ct(i, ["ref"])));
    for (let h in d) h in m && delete d[h];
    return Dt(c, Object.assign({}, m, d, u, { ref: o(rs(c), u.ref) }, f));
  }
  return Wt(s, Object.assign({}, ct(i, ["ref"]), s !== ee && u, s !== ee && d), c);
}
function es() {
  let e = C([]), t = O((r) => {
    for (let n of e.current) n != null && (typeof n == "function" ? n(r) : n.current = r);
  }, []);
  return (...r) => {
    if (!r.every((n) => n == null)) return e.current = r, t;
  };
}
function ts(...e) {
  return e.every((t) => t == null) ? void 0 : (t) => {
    for (let r of e) r != null && (typeof r == "function" ? r(t) : r.current = t);
  };
}
function Ar(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, r = {};
  for (let n of e) for (let o in n) o.startsWith("on") && typeof n[o] == "function" ? (r[o] != null || (r[o] = []), r[o].push(n[o])) : t[o] = n[o];
  if (t.disabled || t["aria-disabled"]) for (let n in r) /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(n) && (r[n] = [(o) => {
    var s;
    return (s = o == null ? void 0 : o.preventDefault) == null ? void 0 : s.call(o);
  }]);
  for (let n in r) Object.assign(t, { [n](o, ...s) {
    let a = r[n];
    for (let l of a) {
      if ((o instanceof Event || (o == null ? void 0 : o.nativeEvent) instanceof Event) && o.defaultPrevented) return;
      l(o, ...s);
    }
  } });
  return t;
}
function Lr(...e) {
  if (e.length === 0) return {};
  if (e.length === 1) return e[0];
  let t = {}, r = {};
  for (let n of e) for (let o in n) o.startsWith("on") && typeof n[o] == "function" ? (r[o] != null || (r[o] = []), r[o].push(n[o])) : t[o] = n[o];
  for (let n in r) Object.assign(t, { [n](...o) {
    let s = r[n];
    for (let a of s) a == null || a(...o);
  } });
  return t;
}
function Ae(e) {
  var t;
  return Object.assign(Gt(e), { displayName: (t = e.displayName) != null ? t : e.name });
}
function ye(e) {
  let t = Object.assign({}, e);
  for (let r in t) t[r] === void 0 && delete t[r];
  return t;
}
function ct(e, t = []) {
  let r = Object.assign({}, e);
  for (let n of t) n in r && delete r[n];
  return r;
}
function rs(e) {
  return M.version.split(".")[0] >= "19" ? e.props.ref : e.ref;
}
let ns = "span";
var Nr = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(Nr || {});
function os(e, t) {
  var r;
  let { features: n = 1, ...o } = e, s = { ref: t, "aria-hidden": (n & 2) === 2 ? !0 : (r = o["aria-hidden"]) != null ? r : void 0, hidden: (n & 4) === 4 ? !0 : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(n & 4) === 4 && (n & 2) !== 2 && { display: "none" } } };
  return Fe()({ ourProps: s, theirProps: o, slot: {}, defaultTag: ns, name: "Hidden" });
}
let Mr = Ae(os), ss = Symbol();
function De(...e) {
  let t = C(e);
  W(() => {
    t.current = e;
  }, [e]);
  let r = Q((n) => {
    for (let o of t.current) o != null && (typeof o == "function" ? o(n) : o.current = n);
  });
  return e.every((n) => n == null || (n == null ? void 0 : n[ss])) ? void 0 : r;
}
var K = ((e) => (e.Space = " ", e.Enter = "Enter", e.Escape = "Escape", e.Backspace = "Backspace", e.Delete = "Delete", e.ArrowLeft = "ArrowLeft", e.ArrowUp = "ArrowUp", e.ArrowRight = "ArrowRight", e.ArrowDown = "ArrowDown", e.Home = "Home", e.End = "End", e.PageUp = "PageUp", e.PageDown = "PageDown", e.Tab = "Tab", e))(K || {});
let ls = ["[contentEditable=true]", "[tabindex]", "a[href]", "area[href]", "button:not([disabled])", "iframe", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])"].map((e) => `${e}:not([tabindex='-1'])`).join(","), as = ["[data-autofocus]"].map((e) => `${e}:not([tabindex='-1'])`).join(",");
var Y = ((e) => (e[e.First = 1] = "First", e[e.Previous = 2] = "Previous", e[e.Next = 4] = "Next", e[e.Last = 8] = "Last", e[e.WrapAround = 16] = "WrapAround", e[e.NoScroll = 32] = "NoScroll", e[e.AutoFocus = 64] = "AutoFocus", e))(Y || {}), ze = ((e) => (e[e.Error = 0] = "Error", e[e.Overflow = 1] = "Overflow", e[e.Success = 2] = "Success", e[e.Underflow = 3] = "Underflow", e))(ze || {}), is = ((e) => (e[e.Previous = -1] = "Previous", e[e.Next = 1] = "Next", e))(is || {});
function cs(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(ls)).sort((t, r) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (r.tabIndex || Number.MAX_SAFE_INTEGER)));
}
function us(e = document.body) {
  return e == null ? [] : Array.from(e.querySelectorAll(as)).sort((t, r) => Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (r.tabIndex || Number.MAX_SAFE_INTEGER)));
}
var ds = ((e) => (e[e.Strict = 0] = "Strict", e[e.Loose = 1] = "Loose", e))(ds || {}), fs = ((e) => (e[e.Keyboard = 0] = "Keyboard", e[e.Mouse = 1] = "Mouse", e))(fs || {});
typeof window < "u" && typeof document < "u" && (document.addEventListener("keydown", (e) => {
  e.metaKey || e.altKey || e.ctrlKey || (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0), document.addEventListener("click", (e) => {
  e.detail === 1 ? delete document.documentElement.dataset.headlessuiFocusVisible : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = "");
}, !0));
let ps = ["textarea", "input"].join(",");
function bs(e) {
  var t, r;
  return (r = (t = e == null ? void 0 : e.matches) == null ? void 0 : t.call(e, ps)) != null ? r : !1;
}
function xe(e, t = (r) => r) {
  return e.slice().sort((r, n) => {
    let o = t(r), s = t(n);
    if (o === null || s === null) return 0;
    let a = o.compareDocumentPosition(s);
    return a & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : a & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}
function we(e, t, { sorted: r = !0, relativeTo: n = null, skipElements: o = [] } = {}) {
  let s = Array.isArray(e) ? e.length > 0 ? e[0].ownerDocument : document : e.ownerDocument, a = Array.isArray(e) ? r ? xe(e) : e : t & 64 ? us(e) : cs(e);
  o.length > 0 && a.length > 1 && (a = a.filter((b) => !o.some((p) => p != null && "current" in p ? (p == null ? void 0 : p.current) === b : p === b))), n = n ?? s.activeElement;
  let l = (() => {
    if (t & 5) return 1;
    if (t & 10) return -1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), i = (() => {
    if (t & 1) return 0;
    if (t & 2) return Math.max(0, a.indexOf(n)) - 1;
    if (t & 4) return Math.max(0, a.indexOf(n)) + 1;
    if (t & 8) return a.length - 1;
    throw new Error("Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last");
  })(), u = t & 32 ? { preventScroll: !0 } : {}, c = 0, d = a.length, g;
  do {
    if (c >= d || c + d <= 0) return 0;
    let b = i + c;
    if (t & 16) b = (b + d) % d;
    else {
      if (b < 0) return 3;
      if (b >= d) return 1;
    }
    g = a[b], g == null || g.focus(u), c += l;
  } while (g !== s.activeElement);
  return t & 6 && bs(g) && g.select(), 2;
}
function ms(e, t) {
  return Z(() => {
    var r;
    if (e.type) return e.type;
    let n = (r = e.as) != null ? r : "button";
    if (typeof n == "string" && n.toLowerCase() === "button" || (t == null ? void 0 : t.tagName) === "BUTTON" && !t.hasAttribute("type")) return "button";
  }, [e.type, e.as, t]);
}
function gs() {
  let e = C(!1);
  return Te(() => (e.current = !0, () => {
    e.current = !1;
  }), []), e;
}
function hs({ onFocus: e }) {
  let [t, r] = z(!0), n = gs();
  return t ? M.createElement(Mr, { as: "button", type: "button", features: Nr.Focusable, onFocus: (o) => {
    o.preventDefault();
    let s, a = 50;
    function l() {
      if (a-- <= 0) {
        s && cancelAnimationFrame(s);
        return;
      }
      if (e()) {
        if (cancelAnimationFrame(s), !n.current) return;
        r(!1);
        return;
      }
      s = requestAnimationFrame(l);
    }
    s = requestAnimationFrame(l);
  } }) : null;
}
const Ir = X.createContext(null);
function vs() {
  return { groups: /* @__PURE__ */ new Map(), get(e, t) {
    var r;
    let n = this.groups.get(e);
    n || (n = /* @__PURE__ */ new Map(), this.groups.set(e, n));
    let o = (r = n.get(t)) != null ? r : 0;
    n.set(t, o + 1);
    let s = Array.from(n.keys()).indexOf(t);
    function a() {
      let l = n.get(t);
      l > 1 ? n.set(t, l - 1) : n.delete(t);
    }
    return [s, a];
  } };
}
function ys({ children: e }) {
  let t = X.useRef(vs());
  return X.createElement(Ir.Provider, { value: t }, e);
}
function Or(e) {
  let t = X.useContext(Ir);
  if (!t) throw new Error("You must wrap your component in a <StableCollection>");
  let r = X.useId(), [n, o] = t.current.get(e, r);
  return X.useEffect(() => o, []), n;
}
var ws = ((e) => (e[e.Forwards = 0] = "Forwards", e[e.Backwards = 1] = "Backwards", e))(ws || {}), xs = ((e) => (e[e.Less = -1] = "Less", e[e.Equal = 0] = "Equal", e[e.Greater = 1] = "Greater", e))(xs || {}), Es = ((e) => (e[e.SetSelectedIndex = 0] = "SetSelectedIndex", e[e.RegisterTab = 1] = "RegisterTab", e[e.UnregisterTab = 2] = "UnregisterTab", e[e.RegisterPanel = 3] = "RegisterPanel", e[e.UnregisterPanel = 4] = "UnregisterPanel", e))(Es || {});
let $s = { 0(e, t) {
  var r;
  let n = xe(e.tabs, (c) => c.current), o = xe(e.panels, (c) => c.current), s = n.filter((c) => {
    var d;
    return !((d = c.current) != null && d.hasAttribute("disabled"));
  }), a = { ...e, tabs: n, panels: o };
  if (t.index < 0 || t.index > n.length - 1) {
    let c = ge(Math.sign(t.index - e.selectedIndex), { [-1]: () => 1, 0: () => ge(Math.sign(t.index), { [-1]: () => 0, 0: () => 0, 1: () => 1 }), 1: () => 0 });
    if (s.length === 0) return a;
    let d = ge(c, { 0: () => n.indexOf(s[0]), 1: () => n.indexOf(s[s.length - 1]) });
    return { ...a, selectedIndex: d === -1 ? e.selectedIndex : d };
  }
  let l = n.slice(0, t.index), i = [...n.slice(t.index), ...l].find((c) => s.includes(c));
  if (!i) return a;
  let u = (r = n.indexOf(i)) != null ? r : e.selectedIndex;
  return u === -1 && (u = e.selectedIndex), { ...a, selectedIndex: u };
}, 1(e, t) {
  if (e.tabs.includes(t.tab)) return e;
  let r = e.tabs[e.selectedIndex], n = xe([...e.tabs, t.tab], (s) => s.current), o = e.selectedIndex;
  return e.info.current.isControlled || (o = n.indexOf(r), o === -1 && (o = e.selectedIndex)), { ...e, tabs: n, selectedIndex: o };
}, 2(e, t) {
  return { ...e, tabs: e.tabs.filter((r) => r !== t.tab) };
}, 3(e, t) {
  return e.panels.includes(t.panel) ? e : { ...e, panels: xe([...e.panels, t.panel], (r) => r.current) };
}, 4(e, t) {
  return { ...e, panels: e.panels.filter((r) => r !== t.panel) };
} }, Pt = Re(null);
Pt.displayName = "TabsDataContext";
function ke(e) {
  let t = Pe(Pt);
  if (t === null) {
    let r = new Error(`<${e} /> is missing a parent <Tab.Group /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(r, ke), r;
  }
  return t;
}
let Ct = Re(null);
Ct.displayName = "TabsActionsContext";
function St(e) {
  let t = Pe(Ct);
  if (t === null) {
    let r = new Error(`<${e} /> is missing a parent <Tab.Group /> component.`);
    throw Error.captureStackTrace && Error.captureStackTrace(r, St), r;
  }
  return t;
}
function Ts(e, t) {
  return ge(t.type, $s, e, t);
}
let ks = "div";
function Ps(e, t) {
  let { defaultIndex: r = 0, vertical: n = !1, manual: o = !1, onChange: s, selectedIndex: a = null, ...l } = e;
  const i = n ? "vertical" : "horizontal", u = o ? "manual" : "auto";
  let c = a !== null, d = je({ isControlled: c }), g = De(t), [b, p] = Hr(Ts, { info: d, selectedIndex: a ?? r, tabs: [], panels: [] }), f = Z(() => ({ selectedIndex: b.selectedIndex }), [b.selectedIndex]), m = je(s || (() => {
  })), h = je(b.tabs), y = Z(() => ({ orientation: i, activation: u, ...b }), [i, u, b]), $ = Q((T) => (p({ type: 1, tab: T }), () => p({ type: 2, tab: T }))), E = Q((T) => (p({ type: 3, panel: T }), () => p({ type: 4, panel: T }))), P = Q((T) => {
    N.current !== T && m.current(T), c || p({ type: 0, index: T });
  }), N = je(c ? e.selectedIndex : b.selectedIndex), F = Z(() => ({ registerTab: $, registerPanel: E, change: P }), []);
  Te(() => {
    p({ type: 0, index: a ?? r });
  }, [a]), Te(() => {
    if (N.current === void 0 || b.tabs.length <= 0) return;
    let T = xe(b.tabs, (I) => I.current);
    T.some((I, v) => b.tabs[v] !== I) && P(T.indexOf(b.tabs[N.current]));
  });
  let U = { ref: g }, R = Fe();
  return M.createElement(ys, null, M.createElement(Ct.Provider, { value: F }, M.createElement(Pt.Provider, { value: y }, y.tabs.length <= 0 && M.createElement(hs, { onFocus: () => {
    var T, I;
    for (let v of h.current) if (((T = v.current) == null ? void 0 : T.tabIndex) === 0) return (I = v.current) == null || I.focus(), !0;
    return !1;
  } }), R({ ourProps: U, theirProps: l, slot: f, defaultTag: ks, name: "Tabs" }))));
}
let Cs = "div";
function Ss(e, t) {
  let { orientation: r, selectedIndex: n } = ke("Tab.List"), o = De(t), s = Z(() => ({ selectedIndex: n }), [n]), a = e, l = { ref: o, role: "tablist", "aria-orientation": r };
  return Fe()({ ourProps: l, theirProps: a, slot: s, defaultTag: Cs, name: "Tabs.List" });
}
let Fs = "button";
function As(e, t) {
  var r, n;
  let o = _t(), { id: s = `headlessui-tabs-tab-${o}`, disabled: a = !1, autoFocus: l = !1, ...i } = e, { orientation: u, activation: c, selectedIndex: d, tabs: g, panels: b } = ke("Tab"), p = St("Tab"), f = ke("Tab"), [m, h] = z(null), y = C(null), $ = De(y, t, h);
  Te(() => p.registerTab(y), [p, y]);
  let E = Or("tabs"), P = g.indexOf(y);
  P === -1 && (P = E);
  let N = P === d, F = Q((S) => {
    var k;
    let ve = S();
    if (ve === ze.Success && c === "auto") {
      let D = (k = Cr(y)) == null ? void 0 : k.activeElement, We = f.tabs.findIndex((fe) => fe.current === D);
      We !== -1 && p.change(We);
    }
    return ve;
  }), U = Q((S) => {
    let k = g.map((ve) => ve.current).filter(Boolean);
    if (S.key === K.Space || S.key === K.Enter) {
      S.preventDefault(), S.stopPropagation(), p.change(P);
      return;
    }
    switch (S.key) {
      case K.Home:
      case K.PageUp:
        return S.preventDefault(), S.stopPropagation(), F(() => we(k, Y.First));
      case K.End:
      case K.PageDown:
        return S.preventDefault(), S.stopPropagation(), F(() => we(k, Y.Last));
    }
    if (F(() => ge(u, { vertical() {
      return S.key === K.ArrowUp ? we(k, Y.Previous | Y.WrapAround) : S.key === K.ArrowDown ? we(k, Y.Next | Y.WrapAround) : ze.Error;
    }, horizontal() {
      return S.key === K.ArrowLeft ? we(k, Y.Previous | Y.WrapAround) : S.key === K.ArrowRight ? we(k, Y.Next | Y.WrapAround) : ze.Error;
    } })) === ze.Success) return S.preventDefault();
  }), R = C(!1), T = Q(() => {
    var S;
    R.current || (R.current = !0, (S = y.current) == null || S.focus({ preventScroll: !0 }), p.change(P), Sr(() => {
      R.current = !1;
    }));
  }), I = Q((S) => {
    S.preventDefault();
  }), { isFocusVisible: v, focusProps: V } = kr({ autoFocus: l }), { isHovered: G, hoverProps: q } = Uo({ isDisabled: a }), { pressed: H, pressProps: J } = Zo({ disabled: a }), _ = Z(() => ({ selected: N, hover: G, active: H, focus: v, autofocus: l, disabled: a }), [N, G, v, H, l, a]), j = Lr({ ref: $, onKeyDown: U, onMouseDown: I, onClick: T, id: s, role: "tab", type: ms(e, m), "aria-controls": (n = (r = b[P]) == null ? void 0 : r.current) == null ? void 0 : n.id, "aria-selected": N, tabIndex: N ? 0 : -1, disabled: a || void 0, autoFocus: l }, V, q, J);
  return Fe()({ ourProps: j, theirProps: i, slot: _, defaultTag: Fs, name: "Tabs.Tab" });
}
let Ls = "div";
function Ns(e, t) {
  let { selectedIndex: r } = ke("Tab.Panels"), n = De(t), o = Z(() => ({ selectedIndex: r }), [r]), s = e, a = { ref: n };
  return Fe()({ ourProps: a, theirProps: s, slot: o, defaultTag: Ls, name: "Tabs.Panels" });
}
let Ms = "div", Is = yt.RenderStrategy | yt.Static;
function Os(e, t) {
  var r, n, o, s;
  let a = _t(), { id: l = `headlessui-tabs-panel-${a}`, tabIndex: i = 0, ...u } = e, { selectedIndex: c, tabs: d, panels: g } = ke("Tab.Panel"), b = St("Tab.Panel"), p = C(null), f = De(p, t);
  Te(() => b.registerPanel(p), [b, p]);
  let m = Or("panels"), h = g.indexOf(p);
  h === -1 && (h = m);
  let y = h === c, { isFocusVisible: $, focusProps: E } = kr(), P = Z(() => ({ selected: y, focus: $ }), [y, $]), N = Lr({ ref: f, id: l, role: "tabpanel", "aria-labelledby": (n = (r = d[h]) == null ? void 0 : r.current) == null ? void 0 : n.id, tabIndex: y ? i : -1 }, E), F = Fe();
  return !y && ((o = u.unmount) == null || o) && !((s = u.static) != null && s) ? M.createElement(Mr, { "aria-hidden": "true", ...N }) : F({ ourProps: N, theirProps: u, slot: P, defaultTag: Ms, features: Is, visible: y, name: "Tabs.Panel" });
}
let js = Ae(As), jr = Ae(Ps), zr = Ae(Ss), zs = Ae(Ns), Gs = Ae(Os), Rs = Object.assign(js, { Group: jr, List: zr, Panels: zs, Panel: Gs });
const _s = ({
  tabs: e,
  activeTab: t,
  onTabChange: r,
  className: n,
  disabled: o,
  disabledMessage: s,
  tabClassName: a,
  indicatorClassName: l,
  selectedTabClassName: i
}) => {
  const u = e.findIndex((f) => f.id === t), c = C([]), [d, g] = z({
    left: 0,
    width: 0
  }), b = (f) => {
    r(e[f].id);
  };
  W(() => {
    if (u >= 0 && c.current[u]) {
      const f = c.current[u];
      f && g({
        left: f.offsetLeft,
        width: f.offsetWidth
      });
    }
  }, [u, e]);
  const p = /* @__PURE__ */ ne(
    "div",
    {
      className: Ue(
        "w-full",
        n,
        o ? "cursor-not-allowed opacity-60" : ""
      ),
      children: /* @__PURE__ */ ne(jr, { selectedIndex: u, onChange: b, children: /* @__PURE__ */ Ke(zr, { className: "glass glass-no-hover relative inline-flex min-w-fit overflow-x-auto rounded-lg p-0.5 py-1 !shadow-none", children: [
        /* @__PURE__ */ ne(
          "div",
          {
            className: Ue(
              "absolute top-1 z-10 h-[calc(100%-8px)] rounded-md bg-primary/30 transition-all duration-200 ease-in-out",
              l
            ),
            style: {
              left: d.left,
              width: d.width
            }
          }
        ),
        e.map((f, m) => /* @__PURE__ */ ne(
          Rs,
          {
            ref: (h) => {
              h && (c.current[m] = h);
            },
            disabled: o,
            className: ({ selected: h }) => Ue(
              "relative z-20 mx-0.5 min-w-max rounded-md border-2 border-transparent px-4 py-0.5 text-center text-sm font-semibold transition-all duration-200 ease-in-out",
              "focus-visible:outline-none focus-visible:ring-0",
              h ? Ue("text-base-fg", i) : "text-base-fg/70 hover:text-base-fg",
              o ? "cursor-not-allowed opacity-60" : "",
              a
            ),
            children: f.label
          },
          f.id
        ))
      ] }) })
    }
  );
  return /* @__PURE__ */ Ke(Rr, { children: [
    o && /* @__PURE__ */ ne(
      To,
      {
        content: s ?? "Cannot change tab. Generation in progress.",
        position: "bottom",
        children: p
      }
    ),
    !o && p
  ] });
};
export {
  _s as TabSelector
};
