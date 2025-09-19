import { jsxs as ae, jsx as H, Fragment as et } from "react/jsx-runtime";
import De, { useDebugValue as ar, createElement as Oo, useRef as dn, useContext as ko, useState as pt, useCallback as Qe, useEffect as Bt } from "react";
var ne = function() {
  return ne = Object.assign || function(t) {
    for (var n, r = 1, a = arguments.length; r < a; r++) {
      n = arguments[r];
      for (var o in n) Object.prototype.hasOwnProperty.call(n, o) && (t[o] = n[o]);
    }
    return t;
  }, ne.apply(this, arguments);
};
function Ue(e, t, n) {
  if (n || arguments.length === 2) for (var r = 0, a = t.length, o; r < a; r++)
    (o || !(r in t)) && (o || (o = Array.prototype.slice.call(t, 0, r)), o[r] = t[r]);
  return e.concat(o || Array.prototype.slice.call(t));
}
function Co(e) {
  var t = /* @__PURE__ */ Object.create(null);
  return function(n) {
    return t[n] === void 0 && (t[n] = e(n)), t[n];
  };
}
var To = /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|abbr|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|decoding|default|defer|dir|disabled|disablePictureInPicture|disableRemotePlayback|download|draggable|encType|enterKeyHint|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loading|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|translate|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|incremental|fallback|inert|itemProp|itemScope|itemType|itemID|itemRef|on|option|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/, _o = /* @__PURE__ */ Co(
  function(e) {
    return To.test(e) || e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) < 91;
  }
  /* Z+1 */
);
function Io(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var V = "-ms-", rt = "-moz-", W = "-webkit-", ha = "comm", Ft = "rule", $n = "decl", No = "@import", ga = "@keyframes", Ro = "@layer", ya = Math.abs, Yn = String.fromCharCode, pn = Object.assign;
function Mo(e, t) {
  return K(e, 0) ^ 45 ? (((t << 2 ^ K(e, 0)) << 2 ^ K(e, 1)) << 2 ^ K(e, 2)) << 2 ^ K(e, 3) : 0;
}
function va(e) {
  return e.trim();
}
function he(e, t) {
  return (e = t.exec(e)) ? e[0] : e;
}
function L(e, t, n) {
  return e.replace(t, n);
}
function St(e, t, n) {
  return e.indexOf(t, n);
}
function K(e, t) {
  return e.charCodeAt(t) | 0;
}
function He(e, t, n) {
  return e.slice(t, n);
}
function ue(e) {
  return e.length;
}
function ba(e) {
  return e.length;
}
function tt(e, t) {
  return t.push(e), e;
}
function Do(e, t) {
  return e.map(t).join("");
}
function or(e, t) {
  return e.filter(function(n) {
    return !he(n, t);
  });
}
var jt = 1, Ve = 1, xa = 0, se = 0, X = 0, Ke = "";
function Lt(e, t, n, r, a, o, i, s) {
  return { value: e, root: t, parent: n, type: r, props: a, children: o, line: jt, column: Ve, length: i, return: "", siblings: s };
}
function Ae(e, t) {
  return pn(Lt("", null, null, "", null, null, 0, e.siblings), e, { length: -e.length }, t);
}
function ze(e) {
  for (; e.root; )
    e = Ae(e.root, { children: [e] });
  tt(e, e.siblings);
}
function Fo() {
  return X;
}
function jo() {
  return X = se > 0 ? K(Ke, --se) : 0, Ve--, X === 10 && (Ve = 1, jt--), X;
}
function ce() {
  return X = se < xa ? K(Ke, se++) : 0, Ve++, X === 10 && (Ve = 1, jt++), X;
}
function Ne() {
  return K(Ke, se);
}
function Et() {
  return se;
}
function zt(e, t) {
  return He(Ke, e, t);
}
function mn(e) {
  switch (e) {
    // \0 \t \n \r \s whitespace token
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    // ! + , / > @ ~ isolate token
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    // ; { } breakpoint token
    case 59:
    case 123:
    case 125:
      return 4;
    // : accompanied token
    case 58:
      return 3;
    // " ' ( [ opening delimit token
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    // ) ] closing delimit token
    case 41:
    case 93:
      return 1;
  }
  return 0;
}
function Lo(e) {
  return jt = Ve = 1, xa = ue(Ke = e), se = 0, [];
}
function zo(e) {
  return Ke = "", e;
}
function Gt(e) {
  return va(zt(se - 1, hn(e === 91 ? e + 2 : e === 40 ? e + 1 : e)));
}
function $o(e) {
  for (; (X = Ne()) && X < 33; )
    ce();
  return mn(e) > 2 || mn(X) > 3 ? "" : " ";
}
function Yo(e, t) {
  for (; --t && ce() && !(X < 48 || X > 102 || X > 57 && X < 65 || X > 70 && X < 97); )
    ;
  return zt(e, Et() + (t < 6 && Ne() == 32 && ce() == 32));
}
function hn(e) {
  for (; ce(); )
    switch (X) {
      // ] ) " '
      case e:
        return se;
      // " '
      case 34:
      case 39:
        e !== 34 && e !== 39 && hn(X);
        break;
      // (
      case 40:
        e === 41 && hn(e);
        break;
      // \
      case 92:
        ce();
        break;
    }
  return se;
}
function Wo(e, t) {
  for (; ce() && e + X !== 57; )
    if (e + X === 84 && Ne() === 47)
      break;
  return "/*" + zt(t, se - 1) + "*" + Yn(e === 47 ? e : ce());
}
function Uo(e) {
  for (; !mn(Ne()); )
    ce();
  return zt(e, se);
}
function Ho(e) {
  return zo(At("", null, null, null, [""], e = Lo(e), 0, [0], e));
}
function At(e, t, n, r, a, o, i, s, c) {
  for (var l = 0, f = 0, p = i, g = 0, v = 0, E = 0, w = 1, O = 1, A = 1, _ = 0, b = "", P = a, u = o, N = r, T = b; O; )
    switch (E = _, _ = ce()) {
      // (
      case 40:
        if (E != 108 && K(T, p - 1) == 58) {
          St(T += L(Gt(_), "&", "&\f"), "&\f", ya(l ? s[l - 1] : 0)) != -1 && (A = -1);
          break;
        }
      // " ' [
      case 34:
      case 39:
      case 91:
        T += Gt(_);
        break;
      // \t \n \r \s
      case 9:
      case 10:
      case 13:
      case 32:
        T += $o(E);
        break;
      // \
      case 92:
        T += Yo(Et() - 1, 7);
        continue;
      // /
      case 47:
        switch (Ne()) {
          case 42:
          case 47:
            tt(Vo(Wo(ce(), Et()), t, n, c), c);
            break;
          default:
            T += "/";
        }
        break;
      // {
      case 123 * w:
        s[l++] = ue(T) * A;
      // } ; \0
      case 125 * w:
      case 59:
      case 0:
        switch (_) {
          // \0 }
          case 0:
          case 125:
            O = 0;
          // ;
          case 59 + f:
            A == -1 && (T = L(T, /\f/g, "")), v > 0 && ue(T) - p && tt(v > 32 ? sr(T + ";", r, n, p - 1, c) : sr(L(T, " ", "") + ";", r, n, p - 2, c), c);
            break;
          // @ ;
          case 59:
            T += ";";
          // { rule/at-rule
          default:
            if (tt(N = ir(T, t, n, l, f, a, s, b, P = [], u = [], p, o), o), _ === 123)
              if (f === 0)
                At(T, t, N, N, P, o, p, s, u);
              else
                switch (g === 99 && K(T, 3) === 110 ? 100 : g) {
                  // d l m s
                  case 100:
                  case 108:
                  case 109:
                  case 115:
                    At(e, N, N, r && tt(ir(e, N, N, 0, 0, a, s, b, a, P = [], p, u), u), a, u, p, s, r ? P : u);
                    break;
                  default:
                    At(T, N, N, N, [""], u, 0, s, u);
                }
        }
        l = f = v = 0, w = A = 1, b = T = "", p = i;
        break;
      // :
      case 58:
        p = 1 + ue(T), v = E;
      default:
        if (w < 1) {
          if (_ == 123)
            --w;
          else if (_ == 125 && w++ == 0 && jo() == 125)
            continue;
        }
        switch (T += Yn(_), _ * w) {
          // &
          case 38:
            A = f > 0 ? 1 : (T += "\f", -1);
            break;
          // ,
          case 44:
            s[l++] = (ue(T) - 1) * A, A = 1;
            break;
          // @
          case 64:
            Ne() === 45 && (T += Gt(ce())), g = Ne(), f = p = ue(b = T += Uo(Et())), _++;
            break;
          // -
          case 45:
            E === 45 && ue(T) == 2 && (w = 0);
        }
    }
  return o;
}
function ir(e, t, n, r, a, o, i, s, c, l, f, p) {
  for (var g = a - 1, v = a === 0 ? o : [""], E = ba(v), w = 0, O = 0, A = 0; w < r; ++w)
    for (var _ = 0, b = He(e, g + 1, g = ya(O = i[w])), P = e; _ < E; ++_)
      (P = va(O > 0 ? v[_] + " " + b : L(b, /&\f/g, v[_]))) && (c[A++] = P);
  return Lt(e, t, n, a === 0 ? Ft : s, c, l, f, p);
}
function Vo(e, t, n, r) {
  return Lt(e, t, n, ha, Yn(Fo()), He(e, 2, -2), 0, r);
}
function sr(e, t, n, r, a) {
  return Lt(e, t, n, $n, He(e, 0, r), He(e, r + 1, -1), r, a);
}
function wa(e, t, n) {
  switch (Mo(e, t)) {
    // color-adjust
    case 5103:
      return W + "print-" + e + e;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855:
    // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return W + e + e;
    // tab-size
    case 4789:
      return rt + e + e;
    // appearance, user-select, transform, hyphens, text-size-adjust
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return W + e + rt + e + V + e + e;
    // writing-mode
    case 5936:
      switch (K(e, t + 11)) {
        // vertical-l(r)
        case 114:
          return W + e + V + L(e, /[svh]\w+-[tblr]{2}/, "tb") + e;
        // vertical-r(l)
        case 108:
          return W + e + V + L(e, /[svh]\w+-[tblr]{2}/, "tb-rl") + e;
        // horizontal(-)tb
        case 45:
          return W + e + V + L(e, /[svh]\w+-[tblr]{2}/, "lr") + e;
      }
    // flex, flex-direction, scroll-snap-type, writing-mode
    case 6828:
    case 4268:
    case 2903:
      return W + e + V + e + e;
    // order
    case 6165:
      return W + e + V + "flex-" + e + e;
    // align-items
    case 5187:
      return W + e + L(e, /(\w+).+(:[^]+)/, W + "box-$1$2" + V + "flex-$1$2") + e;
    // align-self
    case 5443:
      return W + e + V + "flex-item-" + L(e, /flex-|-self/g, "") + (he(e, /flex-|baseline/) ? "" : V + "grid-row-" + L(e, /flex-|-self/g, "")) + e;
    // align-content
    case 4675:
      return W + e + V + "flex-line-pack" + L(e, /align-content|flex-|-self/g, "") + e;
    // flex-shrink
    case 5548:
      return W + e + V + L(e, "shrink", "negative") + e;
    // flex-basis
    case 5292:
      return W + e + V + L(e, "basis", "preferred-size") + e;
    // flex-grow
    case 6060:
      return W + "box-" + L(e, "-grow", "") + W + e + V + L(e, "grow", "positive") + e;
    // transition
    case 4554:
      return W + L(e, /([^-])(transform)/g, "$1" + W + "$2") + e;
    // cursor
    case 6187:
      return L(L(L(e, /(zoom-|grab)/, W + "$1"), /(image-set)/, W + "$1"), e, "") + e;
    // background, background-image
    case 5495:
    case 3959:
      return L(e, /(image-set\([^]*)/, W + "$1$`$1");
    // justify-content
    case 4968:
      return L(L(e, /(.+:)(flex-)?(.*)/, W + "box-pack:$3" + V + "flex-pack:$3"), /s.+-b[^;]+/, "justify") + W + e + e;
    // justify-self
    case 4200:
      if (!he(e, /flex-|baseline/)) return V + "grid-column-align" + He(e, t) + e;
      break;
    // grid-template-(columns|rows)
    case 2592:
    case 3360:
      return V + L(e, "template-", "") + e;
    // grid-(row|column)-start
    case 4384:
    case 3616:
      return n && n.some(function(r, a) {
        return t = a, he(r.props, /grid-\w+-end/);
      }) ? ~St(e + (n = n[t].value), "span", 0) ? e : V + L(e, "-start", "") + e + V + "grid-row-span:" + (~St(n, "span", 0) ? he(n, /\d+/) : +he(n, /\d+/) - +he(e, /\d+/)) + ";" : V + L(e, "-start", "") + e;
    // grid-(row|column)-end
    case 4896:
    case 4128:
      return n && n.some(function(r) {
        return he(r.props, /grid-\w+-start/);
      }) ? e : V + L(L(e, "-end", "-span"), "span ", "") + e;
    // (margin|padding)-inline-(start|end)
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return L(e, /(.+)-inline(.+)/, W + "$1$2") + e;
    // (min|max)?(width|height|inline-size|block-size)
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if (ue(e) - 1 - t > 6)
        switch (K(e, t + 1)) {
          // (m)ax-content, (m)in-content
          case 109:
            if (K(e, t + 4) !== 45)
              break;
          // (f)ill-available, (f)it-content
          case 102:
            return L(e, /(.+:)(.+)-([^]+)/, "$1" + W + "$2-$3$1" + rt + (K(e, t + 3) == 108 ? "$3" : "$2-$3")) + e;
          // (s)tretch
          case 115:
            return ~St(e, "stretch", 0) ? wa(L(e, "stretch", "fill-available"), t, n) + e : e;
        }
      break;
    // grid-(column|row)
    case 5152:
    case 5920:
      return L(e, /(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/, function(r, a, o, i, s, c, l) {
        return V + a + ":" + o + l + (i ? V + a + "-span:" + (s ? c : +c - +o) + l : "") + e;
      });
    // position: sticky
    case 4949:
      if (K(e, t + 6) === 121)
        return L(e, ":", ":" + W) + e;
      break;
    // display: (flex|inline-flex|grid|inline-grid)
    case 6444:
      switch (K(e, K(e, 14) === 45 ? 18 : 11)) {
        // (inline-)?fle(x)
        case 120:
          return L(e, /(.+:)([^;\s!]+)(;|(\s+)?!.+)?/, "$1" + W + (K(e, 14) === 45 ? "inline-" : "") + "box$3$1" + W + "$2$3$1" + V + "$2box$3") + e;
        // (inline-)?gri(d)
        case 100:
          return L(e, ":", ":" + V) + e;
      }
      break;
    // scroll-margin, scroll-margin-(top|right|bottom|left)
    case 5719:
    case 2647:
    case 2135:
    case 3927:
    case 2391:
      return L(e, "scroll-", "scroll-snap-") + e;
  }
  return e;
}
function Tt(e, t) {
  for (var n = "", r = 0; r < e.length; r++)
    n += t(e[r], r, e, t) || "";
  return n;
}
function qo(e, t, n, r) {
  switch (e.type) {
    case Ro:
      if (e.children.length) break;
    case No:
    case $n:
      return e.return = e.return || e.value;
    case ha:
      return "";
    case ga:
      return e.return = e.value + "{" + Tt(e.children, r) + "}";
    case Ft:
      if (!ue(e.value = e.props.join(","))) return "";
  }
  return ue(n = Tt(e.children, r)) ? e.return = e.value + "{" + n + "}" : "";
}
function Bo(e) {
  var t = ba(e);
  return function(n, r, a, o) {
    for (var i = "", s = 0; s < t; s++)
      i += e[s](n, r, a, o) || "";
    return i;
  };
}
function Go(e) {
  return function(t) {
    t.root || (t = t.return) && e(t);
  };
}
function Xo(e, t, n, r) {
  if (e.length > -1 && !e.return)
    switch (e.type) {
      case $n:
        e.return = wa(e.value, e.length, n);
        return;
      case ga:
        return Tt([Ae(e, { value: L(e.value, "@", "@" + W) })], r);
      case Ft:
        if (e.length)
          return Do(n = e.props, function(a) {
            switch (he(a, r = /(::plac\w+|:read-\w+)/)) {
              // :read-(only|write)
              case ":read-only":
              case ":read-write":
                ze(Ae(e, { props: [L(a, /:(read-\w+)/, ":" + rt + "$1")] })), ze(Ae(e, { props: [a] })), pn(e, { props: or(n, r) });
                break;
              // :placeholder
              case "::placeholder":
                ze(Ae(e, { props: [L(a, /:(plac\w+)/, ":" + W + "input-$1")] })), ze(Ae(e, { props: [L(a, /:(plac\w+)/, ":" + rt + "$1")] })), ze(Ae(e, { props: [L(a, /:(plac\w+)/, V + "input-$1")] })), ze(Ae(e, { props: [a] })), pn(e, { props: or(n, r) });
                break;
            }
            return "";
          });
    }
}
var Ko = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
}, Fe = typeof process < "u" && process.env !== void 0 && (process.env.REACT_APP_SC_ATTR || process.env.SC_ATTR) || "data-styled", Sa = "active", Ea = "data-styled-version", $t = "6.1.17", Wn = `/*!sc*/
`, _t = typeof window < "u" && "HTMLElement" in window, Zo = !!(typeof SC_DISABLE_SPEEDY == "boolean" ? SC_DISABLE_SPEEDY : typeof process < "u" && process.env !== void 0 && process.env.REACT_APP_SC_DISABLE_SPEEDY !== void 0 && process.env.REACT_APP_SC_DISABLE_SPEEDY !== "" ? process.env.REACT_APP_SC_DISABLE_SPEEDY !== "false" && process.env.REACT_APP_SC_DISABLE_SPEEDY : typeof process < "u" && process.env !== void 0 && process.env.SC_DISABLE_SPEEDY !== void 0 && process.env.SC_DISABLE_SPEEDY !== "" ? process.env.SC_DISABLE_SPEEDY !== "false" && process.env.SC_DISABLE_SPEEDY : process.env.NODE_ENV !== "production"), cr = /invalid hook call/i, mt = /* @__PURE__ */ new Set(), Jo = function(e, t) {
  if (process.env.NODE_ENV !== "production") {
    var n = t ? ' with the id of "'.concat(t, '"') : "", r = "The component ".concat(e).concat(n, ` has been created dynamically.
`) + `You may see this warning because you've called styled inside another component.
To resolve this only create new StyledComponents outside of any render method and function component.
See https://styled-components.com/docs/basics#define-styled-components-outside-of-the-render-method for more info.
`, a = console.error;
    try {
      var o = !0;
      console.error = function(i) {
        for (var s = [], c = 1; c < arguments.length; c++) s[c - 1] = arguments[c];
        cr.test(i) ? (o = !1, mt.delete(r)) : a.apply(void 0, Ue([i], s, !1));
      }, dn(), o && !mt.has(r) && (console.warn(r), mt.add(r));
    } catch (i) {
      cr.test(i.message) && mt.delete(r);
    } finally {
      console.error = a;
    }
  }
}, Yt = Object.freeze([]), qe = Object.freeze({});
function Qo(e, t, n) {
  return n === void 0 && (n = qe), e.theme !== n.theme && e.theme || t || n.theme;
}
var gn = /* @__PURE__ */ new Set(["a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "main", "map", "mark", "menu", "menuitem", "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "u", "ul", "use", "var", "video", "wbr", "circle", "clipPath", "defs", "ellipse", "foreignObject", "g", "image", "line", "linearGradient", "marker", "mask", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "stop", "svg", "text", "tspan"]), ei = /[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~-]+/g, ti = /(^-|-$)/g;
function lr(e) {
  return e.replace(ei, "-").replace(ti, "");
}
var ni = /(a)(d)/gi, ht = 52, fr = function(e) {
  return String.fromCharCode(e + (e > 25 ? 39 : 97));
};
function yn(e) {
  var t, n = "";
  for (t = Math.abs(e); t > ht; t = t / ht | 0) n = fr(t % ht) + n;
  return (fr(t % ht) + n).replace(ni, "$1-$2");
}
var Xt, Aa = 5381, Te = function(e, t) {
  for (var n = t.length; n; ) e = 33 * e ^ t.charCodeAt(--n);
  return e;
}, Pa = function(e) {
  return Te(Aa, e);
};
function ri(e) {
  return yn(Pa(e) >>> 0);
}
function Oa(e) {
  return process.env.NODE_ENV !== "production" && typeof e == "string" && e || e.displayName || e.name || "Component";
}
function Kt(e) {
  return typeof e == "string" && (process.env.NODE_ENV === "production" || e.charAt(0) === e.charAt(0).toLowerCase());
}
var ka = typeof Symbol == "function" && Symbol.for, Ca = ka ? Symbol.for("react.memo") : 60115, ai = ka ? Symbol.for("react.forward_ref") : 60112, oi = { childContextTypes: !0, contextType: !0, contextTypes: !0, defaultProps: !0, displayName: !0, getDefaultProps: !0, getDerivedStateFromError: !0, getDerivedStateFromProps: !0, mixins: !0, propTypes: !0, type: !0 }, ii = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 }, Ta = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 }, si = ((Xt = {})[ai] = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 }, Xt[Ca] = Ta, Xt);
function ur(e) {
  return ("type" in (t = e) && t.type.$$typeof) === Ca ? Ta : "$$typeof" in e ? si[e.$$typeof] : oi;
  var t;
}
var ci = Object.defineProperty, li = Object.getOwnPropertyNames, dr = Object.getOwnPropertySymbols, fi = Object.getOwnPropertyDescriptor, ui = Object.getPrototypeOf, pr = Object.prototype;
function _a(e, t, n) {
  if (typeof t != "string") {
    if (pr) {
      var r = ui(t);
      r && r !== pr && _a(e, r, n);
    }
    var a = li(t);
    dr && (a = a.concat(dr(t)));
    for (var o = ur(e), i = ur(t), s = 0; s < a.length; ++s) {
      var c = a[s];
      if (!(c in ii || n && n[c] || i && c in i || o && c in o)) {
        var l = fi(t, c);
        try {
          ci(e, c, l);
        } catch {
        }
      }
    }
  }
  return e;
}
function Be(e) {
  return typeof e == "function";
}
function Un(e) {
  return typeof e == "object" && "styledComponentId" in e;
}
function _e(e, t) {
  return e && t ? "".concat(e, " ").concat(t) : e || t || "";
}
function mr(e, t) {
  if (e.length === 0) return "";
  for (var n = e[0], r = 1; r < e.length; r++) n += e[r];
  return n;
}
function Ge(e) {
  return e !== null && typeof e == "object" && e.constructor.name === Object.name && !("props" in e && e.$$typeof);
}
function vn(e, t, n) {
  if (n === void 0 && (n = !1), !n && !Ge(e) && !Array.isArray(e)) return t;
  if (Array.isArray(t)) for (var r = 0; r < t.length; r++) e[r] = vn(e[r], t[r]);
  else if (Ge(t)) for (var r in t) e[r] = vn(e[r], t[r]);
  return e;
}
function Hn(e, t) {
  Object.defineProperty(e, "toString", { value: t });
}
var di = process.env.NODE_ENV !== "production" ? { 1: `Cannot create styled-component for component: %s.

`, 2: `Can't collect styles once you've consumed a \`ServerStyleSheet\`'s styles! \`ServerStyleSheet\` is a one off instance for each server-side render cycle.

- Are you trying to reuse it across renders?
- Are you accidentally calling collectStyles twice?

`, 3: `Streaming SSR is only supported in a Node.js environment; Please do not try to call this method in the browser.

`, 4: `The \`StyleSheetManager\` expects a valid target or sheet prop!

- Does this error occur on the client and is your target falsy?
- Does this error occur on the server and is the sheet falsy?

`, 5: `The clone method cannot be used on the client!

- Are you running in a client-like environment on the server?
- Are you trying to run SSR on the client?

`, 6: `Trying to insert a new style tag, but the given Node is unmounted!

- Are you using a custom target that isn't mounted?
- Does your document not have a valid head element?
- Have you accidentally removed a style tag manually?

`, 7: 'ThemeProvider: Please return an object from your "theme" prop function, e.g.\n\n```js\ntheme={() => ({})}\n```\n\n', 8: `ThemeProvider: Please make your "theme" prop an object.

`, 9: "Missing document `<head>`\n\n", 10: `Cannot find a StyleSheet instance. Usually this happens if there are multiple copies of styled-components loaded at once. Check out this issue for how to troubleshoot and fix the common cases where this situation can happen: https://github.com/styled-components/styled-components/issues/1941#issuecomment-417862021

`, 11: `_This error was replaced with a dev-time warning, it will be deleted for v4 final._ [createGlobalStyle] received children which will not be rendered. Please use the component without passing children elements.

`, 12: "It seems you are interpolating a keyframe declaration (%s) into an untagged string. This was supported in styled-components v3, but is not longer supported in v4 as keyframes are now injected on-demand. Please wrap your string in the css\\`\\` helper which ensures the styles are injected correctly. See https://www.styled-components.com/docs/api#css\n\n", 13: `%s is not a styled component and cannot be referred to via component selector. See https://www.styled-components.com/docs/advanced#referring-to-other-components for more details.

`, 14: `ThemeProvider: "theme" prop is required.

`, 15: "A stylis plugin has been supplied that is not named. We need a name for each plugin to be able to prevent styling collisions between different stylis configurations within the same app. Before you pass your plugin to `<StyleSheetManager stylisPlugins={[]}>`, please make sure each plugin is uniquely-named, e.g.\n\n```js\nObject.defineProperty(importedPlugin, 'name', { value: 'some-unique-name' });\n```\n\n", 16: `Reached the limit of how many styled components may be created at group %s.
You may only create up to 1,073,741,824 components. If you're creating components dynamically,
as for instance in your render method then you may be running into this limitation.

`, 17: `CSSStyleSheet could not be found on HTMLStyleElement.
Has styled-components' style tag been unmounted or altered by another script?
`, 18: "ThemeProvider: Please make sure your useTheme hook is within a `<ThemeProvider>`" } : {};
function pi() {
  for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
  for (var n = e[0], r = [], a = 1, o = e.length; a < o; a += 1) r.push(e[a]);
  return r.forEach(function(i) {
    n = n.replace(/%[a-z]/, i);
  }), n;
}
function Ze(e) {
  for (var t = [], n = 1; n < arguments.length; n++) t[n - 1] = arguments[n];
  return process.env.NODE_ENV === "production" ? new Error("An error occurred. See https://github.com/styled-components/styled-components/blob/main/packages/styled-components/src/utils/errors.md#".concat(e, " for more information.").concat(t.length > 0 ? " Args: ".concat(t.join(", ")) : "")) : new Error(pi.apply(void 0, Ue([di[e]], t, !1)).trim());
}
var mi = function() {
  function e(t) {
    this.groupSizes = new Uint32Array(512), this.length = 512, this.tag = t;
  }
  return e.prototype.indexOfGroup = function(t) {
    for (var n = 0, r = 0; r < t; r++) n += this.groupSizes[r];
    return n;
  }, e.prototype.insertRules = function(t, n) {
    if (t >= this.groupSizes.length) {
      for (var r = this.groupSizes, a = r.length, o = a; t >= o; ) if ((o <<= 1) < 0) throw Ze(16, "".concat(t));
      this.groupSizes = new Uint32Array(o), this.groupSizes.set(r), this.length = o;
      for (var i = a; i < o; i++) this.groupSizes[i] = 0;
    }
    for (var s = this.indexOfGroup(t + 1), c = (i = 0, n.length); i < c; i++) this.tag.insertRule(s, n[i]) && (this.groupSizes[t]++, s++);
  }, e.prototype.clearGroup = function(t) {
    if (t < this.length) {
      var n = this.groupSizes[t], r = this.indexOfGroup(t), a = r + n;
      this.groupSizes[t] = 0;
      for (var o = r; o < a; o++) this.tag.deleteRule(r);
    }
  }, e.prototype.getGroup = function(t) {
    var n = "";
    if (t >= this.length || this.groupSizes[t] === 0) return n;
    for (var r = this.groupSizes[t], a = this.indexOfGroup(t), o = a + r, i = a; i < o; i++) n += "".concat(this.tag.getRule(i)).concat(Wn);
    return n;
  }, e;
}(), hi = 1 << 30, Pt = /* @__PURE__ */ new Map(), It = /* @__PURE__ */ new Map(), Ot = 1, gt = function(e) {
  if (Pt.has(e)) return Pt.get(e);
  for (; It.has(Ot); ) Ot++;
  var t = Ot++;
  if (process.env.NODE_ENV !== "production" && ((0 | t) < 0 || t > hi)) throw Ze(16, "".concat(t));
  return Pt.set(e, t), It.set(t, e), t;
}, gi = function(e, t) {
  Ot = t + 1, Pt.set(e, t), It.set(t, e);
}, yi = "style[".concat(Fe, "][").concat(Ea, '="').concat($t, '"]'), vi = new RegExp("^".concat(Fe, '\\.g(\\d+)\\[id="([\\w\\d-]+)"\\].*?"([^"]*)')), bi = function(e, t, n) {
  for (var r, a = n.split(","), o = 0, i = a.length; o < i; o++) (r = a[o]) && e.registerName(t, r);
}, xi = function(e, t) {
  for (var n, r = ((n = t.textContent) !== null && n !== void 0 ? n : "").split(Wn), a = [], o = 0, i = r.length; o < i; o++) {
    var s = r[o].trim();
    if (s) {
      var c = s.match(vi);
      if (c) {
        var l = 0 | parseInt(c[1], 10), f = c[2];
        l !== 0 && (gi(f, l), bi(e, f, c[3]), e.getTag().insertRules(l, a)), a.length = 0;
      } else a.push(s);
    }
  }
}, hr = function(e) {
  for (var t = document.querySelectorAll(yi), n = 0, r = t.length; n < r; n++) {
    var a = t[n];
    a && a.getAttribute(Fe) !== Sa && (xi(e, a), a.parentNode && a.parentNode.removeChild(a));
  }
};
function wi() {
  return typeof __webpack_nonce__ < "u" ? __webpack_nonce__ : null;
}
var Ia = function(e) {
  var t = document.head, n = e || t, r = document.createElement("style"), a = function(s) {
    var c = Array.from(s.querySelectorAll("style[".concat(Fe, "]")));
    return c[c.length - 1];
  }(n), o = a !== void 0 ? a.nextSibling : null;
  r.setAttribute(Fe, Sa), r.setAttribute(Ea, $t);
  var i = wi();
  return i && r.setAttribute("nonce", i), n.insertBefore(r, o), r;
}, Si = function() {
  function e(t) {
    this.element = Ia(t), this.element.appendChild(document.createTextNode("")), this.sheet = function(n) {
      if (n.sheet) return n.sheet;
      for (var r = document.styleSheets, a = 0, o = r.length; a < o; a++) {
        var i = r[a];
        if (i.ownerNode === n) return i;
      }
      throw Ze(17);
    }(this.element), this.length = 0;
  }
  return e.prototype.insertRule = function(t, n) {
    try {
      return this.sheet.insertRule(n, t), this.length++, !0;
    } catch {
      return !1;
    }
  }, e.prototype.deleteRule = function(t) {
    this.sheet.deleteRule(t), this.length--;
  }, e.prototype.getRule = function(t) {
    var n = this.sheet.cssRules[t];
    return n && n.cssText ? n.cssText : "";
  }, e;
}(), Ei = function() {
  function e(t) {
    this.element = Ia(t), this.nodes = this.element.childNodes, this.length = 0;
  }
  return e.prototype.insertRule = function(t, n) {
    if (t <= this.length && t >= 0) {
      var r = document.createTextNode(n);
      return this.element.insertBefore(r, this.nodes[t] || null), this.length++, !0;
    }
    return !1;
  }, e.prototype.deleteRule = function(t) {
    this.element.removeChild(this.nodes[t]), this.length--;
  }, e.prototype.getRule = function(t) {
    return t < this.length ? this.nodes[t].textContent : "";
  }, e;
}(), Ai = function() {
  function e(t) {
    this.rules = [], this.length = 0;
  }
  return e.prototype.insertRule = function(t, n) {
    return t <= this.length && (this.rules.splice(t, 0, n), this.length++, !0);
  }, e.prototype.deleteRule = function(t) {
    this.rules.splice(t, 1), this.length--;
  }, e.prototype.getRule = function(t) {
    return t < this.length ? this.rules[t] : "";
  }, e;
}(), gr = _t, Pi = { isServer: !_t, useCSSOMInjection: !Zo }, Na = function() {
  function e(t, n, r) {
    t === void 0 && (t = qe), n === void 0 && (n = {});
    var a = this;
    this.options = ne(ne({}, Pi), t), this.gs = n, this.names = new Map(r), this.server = !!t.isServer, !this.server && _t && gr && (gr = !1, hr(this)), Hn(this, function() {
      return function(o) {
        for (var i = o.getTag(), s = i.length, c = "", l = function(p) {
          var g = function(A) {
            return It.get(A);
          }(p);
          if (g === void 0) return "continue";
          var v = o.names.get(g), E = i.getGroup(p);
          if (v === void 0 || !v.size || E.length === 0) return "continue";
          var w = "".concat(Fe, ".g").concat(p, '[id="').concat(g, '"]'), O = "";
          v !== void 0 && v.forEach(function(A) {
            A.length > 0 && (O += "".concat(A, ","));
          }), c += "".concat(E).concat(w, '{content:"').concat(O, '"}').concat(Wn);
        }, f = 0; f < s; f++) l(f);
        return c;
      }(a);
    });
  }
  return e.registerId = function(t) {
    return gt(t);
  }, e.prototype.rehydrate = function() {
    !this.server && _t && hr(this);
  }, e.prototype.reconstructWithOptions = function(t, n) {
    return n === void 0 && (n = !0), new e(ne(ne({}, this.options), t), this.gs, n && this.names || void 0);
  }, e.prototype.allocateGSInstance = function(t) {
    return this.gs[t] = (this.gs[t] || 0) + 1;
  }, e.prototype.getTag = function() {
    return this.tag || (this.tag = (t = function(n) {
      var r = n.useCSSOMInjection, a = n.target;
      return n.isServer ? new Ai(a) : r ? new Si(a) : new Ei(a);
    }(this.options), new mi(t)));
    var t;
  }, e.prototype.hasNameForId = function(t, n) {
    return this.names.has(t) && this.names.get(t).has(n);
  }, e.prototype.registerName = function(t, n) {
    if (gt(t), this.names.has(t)) this.names.get(t).add(n);
    else {
      var r = /* @__PURE__ */ new Set();
      r.add(n), this.names.set(t, r);
    }
  }, e.prototype.insertRules = function(t, n, r) {
    this.registerName(t, n), this.getTag().insertRules(gt(t), r);
  }, e.prototype.clearNames = function(t) {
    this.names.has(t) && this.names.get(t).clear();
  }, e.prototype.clearRules = function(t) {
    this.getTag().clearGroup(gt(t)), this.clearNames(t);
  }, e.prototype.clearTag = function() {
    this.tag = void 0;
  }, e;
}(), Oi = /&/g, ki = /^\s*\/\/.*$/gm;
function Ra(e, t) {
  return e.map(function(n) {
    return n.type === "rule" && (n.value = "".concat(t, " ").concat(n.value), n.value = n.value.replaceAll(",", ",".concat(t, " ")), n.props = n.props.map(function(r) {
      return "".concat(t, " ").concat(r);
    })), Array.isArray(n.children) && n.type !== "@keyframes" && (n.children = Ra(n.children, t)), n;
  });
}
function Ci(e) {
  var t, n, r, a = qe, o = a.options, i = o === void 0 ? qe : o, s = a.plugins, c = s === void 0 ? Yt : s, l = function(g, v, E) {
    return E.startsWith(n) && E.endsWith(n) && E.replaceAll(n, "").length > 0 ? ".".concat(t) : g;
  }, f = c.slice();
  f.push(function(g) {
    g.type === Ft && g.value.includes("&") && (g.props[0] = g.props[0].replace(Oi, n).replace(r, l));
  }), i.prefix && f.push(Xo), f.push(qo);
  var p = function(g, v, E, w) {
    v === void 0 && (v = ""), E === void 0 && (E = ""), w === void 0 && (w = "&"), t = w, n = v, r = new RegExp("\\".concat(n, "\\b"), "g");
    var O = g.replace(ki, ""), A = Ho(E || v ? "".concat(E, " ").concat(v, " { ").concat(O, " }") : O);
    i.namespace && (A = Ra(A, i.namespace));
    var _ = [];
    return Tt(A, Bo(f.concat(Go(function(b) {
      return _.push(b);
    })))), _;
  };
  return p.hash = c.length ? c.reduce(function(g, v) {
    return v.name || Ze(15), Te(g, v.name);
  }, Aa).toString() : "", p;
}
var Ti = new Na(), bn = Ci(), Ma = De.createContext({ shouldForwardProp: void 0, styleSheet: Ti, stylis: bn });
Ma.Consumer;
De.createContext(void 0);
function yr() {
  return ko(Ma);
}
var vr = function() {
  function e(t, n) {
    var r = this;
    this.inject = function(a, o) {
      o === void 0 && (o = bn);
      var i = r.name + o.hash;
      a.hasNameForId(r.id, i) || a.insertRules(r.id, i, o(r.rules, i, "@keyframes"));
    }, this.name = t, this.id = "sc-keyframes-".concat(t), this.rules = n, Hn(this, function() {
      throw Ze(12, String(r.name));
    });
  }
  return e.prototype.getName = function(t) {
    return t === void 0 && (t = bn), this.name + t.hash;
  }, e;
}(), _i = function(e) {
  return e >= "A" && e <= "Z";
};
function br(e) {
  for (var t = "", n = 0; n < e.length; n++) {
    var r = e[n];
    if (n === 1 && r === "-" && e[0] === "-") return e;
    _i(r) ? t += "-" + r.toLowerCase() : t += r;
  }
  return t.startsWith("ms-") ? "-" + t : t;
}
var Da = function(e) {
  return e == null || e === !1 || e === "";
}, Fa = function(e) {
  var t, n, r = [];
  for (var a in e) {
    var o = e[a];
    e.hasOwnProperty(a) && !Da(o) && (Array.isArray(o) && o.isCss || Be(o) ? r.push("".concat(br(a), ":"), o, ";") : Ge(o) ? r.push.apply(r, Ue(Ue(["".concat(a, " {")], Fa(o), !1), ["}"], !1)) : r.push("".concat(br(a), ": ").concat((t = a, (n = o) == null || typeof n == "boolean" || n === "" ? "" : typeof n != "number" || n === 0 || t in Ko || t.startsWith("--") ? String(n).trim() : "".concat(n, "px")), ";")));
  }
  return r;
};
function Re(e, t, n, r) {
  if (Da(e)) return [];
  if (Un(e)) return [".".concat(e.styledComponentId)];
  if (Be(e)) {
    if (!Be(o = e) || o.prototype && o.prototype.isReactComponent || !t) return [e];
    var a = e(t);
    return process.env.NODE_ENV === "production" || typeof a != "object" || Array.isArray(a) || a instanceof vr || Ge(a) || a === null || console.error("".concat(Oa(e), " is not a styled component and cannot be referred to via component selector. See https://www.styled-components.com/docs/advanced#referring-to-other-components for more details.")), Re(a, t, n, r);
  }
  var o;
  return e instanceof vr ? n ? (e.inject(n, r), [e.getName(r)]) : [e] : Ge(e) ? Fa(e) : Array.isArray(e) ? Array.prototype.concat.apply(Yt, e.map(function(i) {
    return Re(i, t, n, r);
  })) : [e.toString()];
}
function Ii(e) {
  for (var t = 0; t < e.length; t += 1) {
    var n = e[t];
    if (Be(n) && !Un(n)) return !1;
  }
  return !0;
}
var Ni = Pa($t), Ri = function() {
  function e(t, n, r) {
    this.rules = t, this.staticRulesId = "", this.isStatic = process.env.NODE_ENV === "production" && (r === void 0 || r.isStatic) && Ii(t), this.componentId = n, this.baseHash = Te(Ni, n), this.baseStyle = r, Na.registerId(n);
  }
  return e.prototype.generateAndInjectStyles = function(t, n, r) {
    var a = this.baseStyle ? this.baseStyle.generateAndInjectStyles(t, n, r) : "";
    if (this.isStatic && !r.hash) if (this.staticRulesId && n.hasNameForId(this.componentId, this.staticRulesId)) a = _e(a, this.staticRulesId);
    else {
      var o = mr(Re(this.rules, t, n, r)), i = yn(Te(this.baseHash, o) >>> 0);
      if (!n.hasNameForId(this.componentId, i)) {
        var s = r(o, ".".concat(i), void 0, this.componentId);
        n.insertRules(this.componentId, i, s);
      }
      a = _e(a, i), this.staticRulesId = i;
    }
    else {
      for (var c = Te(this.baseHash, r.hash), l = "", f = 0; f < this.rules.length; f++) {
        var p = this.rules[f];
        if (typeof p == "string") l += p, process.env.NODE_ENV !== "production" && (c = Te(c, p));
        else if (p) {
          var g = mr(Re(p, t, n, r));
          c = Te(c, g + f), l += g;
        }
      }
      if (l) {
        var v = yn(c >>> 0);
        n.hasNameForId(this.componentId, v) || n.insertRules(this.componentId, v, r(l, ".".concat(v), void 0, this.componentId)), a = _e(a, v);
      }
    }
    return a;
  }, e;
}(), ja = De.createContext(void 0);
ja.Consumer;
var Zt = {}, xr = /* @__PURE__ */ new Set();
function Mi(e, t, n) {
  var r = Un(e), a = e, o = !Kt(e), i = t.attrs, s = i === void 0 ? Yt : i, c = t.componentId, l = c === void 0 ? function(P, u) {
    var N = typeof P != "string" ? "sc" : lr(P);
    Zt[N] = (Zt[N] || 0) + 1;
    var T = "".concat(N, "-").concat(ri($t + N + Zt[N]));
    return u ? "".concat(u, "-").concat(T) : T;
  }(t.displayName, t.parentComponentId) : c, f = t.displayName, p = f === void 0 ? function(P) {
    return Kt(P) ? "styled.".concat(P) : "Styled(".concat(Oa(P), ")");
  }(e) : f, g = t.displayName && t.componentId ? "".concat(lr(t.displayName), "-").concat(t.componentId) : t.componentId || l, v = r && a.attrs ? a.attrs.concat(s).filter(Boolean) : s, E = t.shouldForwardProp;
  if (r && a.shouldForwardProp) {
    var w = a.shouldForwardProp;
    if (t.shouldForwardProp) {
      var O = t.shouldForwardProp;
      E = function(P, u) {
        return w(P, u) && O(P, u);
      };
    } else E = w;
  }
  var A = new Ri(n, g, r ? a.componentStyle : void 0);
  function _(P, u) {
    return function(N, T, B) {
      var re = N.attrs, Ce = N.componentStyle, le = N.defaultProps, be = N.foldedComponentIds, xe = N.styledComponentId, ie = N.target, we = De.useContext(ja), ee = yr(), Z = N.shouldForwardProp || ee.shouldForwardProp;
      process.env.NODE_ENV !== "production" && ar(xe);
      var fe = Qo(T, we, le) || qe, J = function(M, I, R) {
        for (var D, F = ne(ne({}, I), { className: void 0, theme: R }), j = 0; j < M.length; j += 1) {
          var G = Be(D = M[j]) ? D(F) : D;
          for (var y in G) F[y] = y === "className" ? _e(F[y], G[y]) : y === "style" ? ne(ne({}, F[y]), G[y]) : G[y];
        }
        return I.className && (F.className = _e(F.className, I.className)), F;
      }(re, T, fe), d = J.as || ie, m = {};
      for (var x in J) J[x] === void 0 || x[0] === "$" || x === "as" || x === "theme" && J.theme === fe || (x === "forwardedAs" ? m.as = J.forwardedAs : Z && !Z(x, d) || (m[x] = J[x], Z || process.env.NODE_ENV !== "development" || _o(x) || xr.has(x) || !gn.has(d) || (xr.add(x), console.warn('styled-components: it looks like an unknown prop "'.concat(x, '" is being sent through to the DOM, which will likely trigger a React console error. If you would like automatic filtering of unknown props, you can opt-into that behavior via `<StyleSheetManager shouldForwardProp={...}>` (connect an API like `@emotion/is-prop-valid`) or consider using transient props (`$` prefix for automatic filtering.)')))));
      var k = function(M, I) {
        var R = yr(), D = M.generateAndInjectStyles(I, R.styleSheet, R.stylis);
        return process.env.NODE_ENV !== "production" && ar(D), D;
      }(Ce, J);
      process.env.NODE_ENV !== "production" && N.warnTooManyClasses && N.warnTooManyClasses(k);
      var C = _e(be, xe);
      return k && (C += " " + k), J.className && (C += " " + J.className), m[Kt(d) && !gn.has(d) ? "class" : "className"] = C, B && (m.ref = B), Oo(d, m);
    }(b, P, u);
  }
  _.displayName = p;
  var b = De.forwardRef(_);
  return b.attrs = v, b.componentStyle = A, b.displayName = p, b.shouldForwardProp = E, b.foldedComponentIds = r ? _e(a.foldedComponentIds, a.styledComponentId) : "", b.styledComponentId = g, b.target = r ? a.target : e, Object.defineProperty(b, "defaultProps", { get: function() {
    return this._foldedDefaultProps;
  }, set: function(P) {
    this._foldedDefaultProps = r ? function(u) {
      for (var N = [], T = 1; T < arguments.length; T++) N[T - 1] = arguments[T];
      for (var B = 0, re = N; B < re.length; B++) vn(u, re[B], !0);
      return u;
    }({}, a.defaultProps, P) : P;
  } }), process.env.NODE_ENV !== "production" && (Jo(p, g), b.warnTooManyClasses = /* @__PURE__ */ function(P, u) {
    var N = {}, T = !1;
    return function(B) {
      if (!T && (N[B] = !0, Object.keys(N).length >= 200)) {
        var re = u ? ' with the id of "'.concat(u, '"') : "";
        console.warn("Over ".concat(200, " classes were generated for component ").concat(P).concat(re, `.
`) + `Consider using the attrs method, together with a style object for frequently changed styles.
Example:
  const Component = styled.div.attrs(props => ({
    style: {
      background: props.background,
    },
  }))\`width: 100%;\`

  <Component />`), T = !0, N = {};
      }
    };
  }(p, g)), Hn(b, function() {
    return ".".concat(b.styledComponentId);
  }), o && _a(b, e, { attrs: !0, componentStyle: !0, displayName: !0, foldedComponentIds: !0, shouldForwardProp: !0, styledComponentId: !0, target: !0 }), b;
}
function wr(e, t) {
  for (var n = [e[0]], r = 0, a = t.length; r < a; r += 1) n.push(t[r], e[r + 1]);
  return n;
}
var Sr = function(e) {
  return Object.assign(e, { isCss: !0 });
};
function La(e) {
  for (var t = [], n = 1; n < arguments.length; n++) t[n - 1] = arguments[n];
  if (Be(e) || Ge(e)) return Sr(Re(wr(Yt, Ue([e], t, !0))));
  var r = e;
  return t.length === 0 && r.length === 1 && typeof r[0] == "string" ? Re(r) : Sr(Re(wr(r, t)));
}
function xn(e, t, n) {
  if (n === void 0 && (n = qe), !t) throw Ze(1, t);
  var r = function(a) {
    for (var o = [], i = 1; i < arguments.length; i++) o[i - 1] = arguments[i];
    return e(t, n, La.apply(void 0, Ue([a], o, !1)));
  };
  return r.attrs = function(a) {
    return xn(e, t, ne(ne({}, n), { attrs: Array.prototype.concat(n.attrs, a).filter(Boolean) }));
  }, r.withConfig = function(a) {
    return xn(e, t, ne(ne({}, n), a));
  }, r;
}
var za = function(e) {
  return xn(Mi, e);
}, ct = za;
gn.forEach(function(e) {
  ct[e] = za(e);
});
process.env.NODE_ENV !== "production" && typeof navigator < "u" && navigator.product === "ReactNative" && console.warn(`It looks like you've imported 'styled-components' on React Native.
Perhaps you're looking to import 'styled-components/native'?
Read more about this at https://www.styled-components.com/docs/basics#react-native`);
var yt = "__sc-".concat(Fe, "__");
process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test" && typeof window < "u" && (window[yt] || (window[yt] = 0), window[yt] === 1 && console.warn(`It looks like there are several instances of 'styled-components' initialized in this application. This may cause dynamic styles to not render properly, errors during the rehydration process, a missing theme prop, and makes your application bigger without good reason.

See https://s-c.sh/2BAXzed for more info.`), window[yt] += 1);
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var Me = function() {
  return Me = Object.assign || function(e) {
    for (var t, n = 1, r = arguments.length; n < r; n++) for (var a in t = arguments[n]) Object.prototype.hasOwnProperty.call(t, a) && (e[a] = t[a]);
    return e;
  }, Me.apply(this, arguments);
};
function lt(e, t) {
  return Object.defineProperty ? Object.defineProperty(e, "raw", { value: t }) : e.raw = t, e;
}
var Er, Ar, Pr, Or, kr, Di = La(Er || (Er = lt([`
  display: flex;
  align-items: center;
  min-width: 322px;
  max-width: 508px;
  height: 48px;
  border: dashed 2px `, `;
  padding: 8px 16px 8px 8px;
  border-radius: 5px;
  cursor: pointer;
  flex-grow: 0;

  &.is-disabled {
    border: dashed 2px `, `;
    cursor: no-drop;
    svg {
      fill: `, `;
      color: `, `;
      path {
        fill: `, `;
        color: `, `;
      }
    }
  }
`], [`
  display: flex;
  align-items: center;
  min-width: 322px;
  max-width: 508px;
  height: 48px;
  border: dashed 2px `, `;
  padding: 8px 16px 8px 8px;
  border-radius: 5px;
  cursor: pointer;
  flex-grow: 0;

  &.is-disabled {
    border: dashed 2px `, `;
    cursor: no-drop;
    svg {
      fill: `, `;
      color: `, `;
      path {
        fill: `, `;
        color: `, `;
      }
    }
  }
`])), "#0658c2", "#666", "#666", "#666", "#666", "#666"), Fi = ct.label(Ar || (Ar = lt([`
  position: relative;
  `, `;
  &:focus-within {
    outline: 2px solid black;
  }
  & > input {
    display: block;
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }
`], [`
  position: relative;
  `, `;
  &:focus-within {
    outline: 2px solid black;
  }
  & > input {
    display: block;
    opacity: 0;
    position: absolute;
    pointer-events: none;
  }
`])), function(e) {
  return e.overRide ? "" : Di;
}), ji = ct.div(Pr || (Pr = lt([`
  border: dashed 2px `, `;
  border-radius: 5px;
  background-color: `, `;
  opacity: 0.9;
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 999;
  & > span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
  }
`], [`
  border: dashed 2px `, `;
  border-radius: 5px;
  background-color: `, `;
  opacity: 0.9;
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 999;
  & > span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
  }
`])), "#666", "#999"), Li = ct.div(Or || (Or = lt([`
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  & > span {
    font-size: 12px;
    color: `, `;
  }
  .file-types {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100px;
  }
`], [`
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  & > span {
    font-size: 12px;
    color: `, `;
  }
  .file-types {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100px;
  }
`])), function(e) {
  return e.error ? "red" : "#666";
}), zi = ct.span(kr || (kr = lt([`
  font-size: 14px;
  color: `, `;
  span {
    text-decoration: underline;
  }
`], [`
  font-size: 14px;
  color: `, `;
  span {
    text-decoration: underline;
  }
`])), "#666"), Cr = function(e) {
  return e / 1024 / 1024;
}, $i = function(e) {
  return e === void 0 ? "" : e.map(function(t) {
    return ".".concat(t.toLowerCase());
  }).join(",");
};
function Yi(e) {
  var t = e.types, n = e.minSize, r = e.maxSize;
  if (t) {
    var a = t.toString(), o = "";
    return r && (o += "size >= ".concat(r, ", ")), n && (o += "size <= ".concat(n, ", ")), H("span", Me({ title: "".concat(o, "types: ").concat(a), className: "file-types" }, { children: a }), void 0);
  }
  return null;
}
function Wi() {
  return ae("svg", Me({ width: "32", height: "32", viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, { children: [H("path", { d: "M5.33317 6.66667H22.6665V16H25.3332V6.66667C25.3332 5.196 24.1372 4 22.6665 4H5.33317C3.8625 4 2.6665 5.196 2.6665 6.66667V22.6667C2.6665 24.1373 3.8625 25.3333 5.33317 25.3333H15.9998V22.6667H5.33317V6.66667Z", fill: "#0658C2" }, void 0), H("path", { d: "M10.6665 14.6667L6.6665 20H21.3332L15.9998 12L11.9998 17.3333L10.6665 14.6667Z", fill: "#0658C2" }, void 0), H("path", { d: "M25.3332 18.6667H22.6665V22.6667H18.6665V25.3333H22.6665V29.3333H25.3332V25.3333H29.3332V22.6667H25.3332V18.6667Z", fill: "#0658C2" }, void 0)] }), void 0);
}
var Jt = 0, Ui = function(e, t, n, r, a, o) {
  return n ? H("span", { children: "File type/size error, Hovered on types!" }, void 0) : H(zi, { children: r ? H("span", { children: "Upload disabled" }, void 0) : H(et, e || t ? { children: o ? H(et, { children: H("span", { children: o }, void 0) }, void 0) : ae(et, { children: [H("span", { children: "Uploaded Successfully!" }, void 0), " Upload another?"] }, void 0) } : { children: ae(et, a ? { children: [H("span", { children: a.split(" ")[0] }, void 0), " ", a.substr(a.indexOf(" ") + 1)] } : { children: [H("span", { children: "Upload" }, void 0), " or drop a file right here"] }, void 0) }, void 0) }, void 0);
}, Hi = function(e) {
  var t = e.name, n = e.hoverTitle, r = e.types, a = e.handleChange, o = e.classes, i = e.children, s = e.maxSize, c = e.minSize, l = e.fileOrFiles, f = e.onSizeError, p = e.onTypeError, g = e.onSelect, v = e.onDrop, E = e.disabled, w = e.label, O = e.uploadedLabel, A = e.multiple, _ = e.required, b = e.onDraggingStateChange, P = e.dropMessageStyle, u = e.ariaLabel, N = e.ariaDescribedby, T = dn(null), B = dn(null), re = pt(!1), Ce = re[0], le = re[1], be = pt(null), xe = be[0], ie = be[1], we = pt(!1), ee = we[0], Z = we[1], fe = function(m) {
    return r && !function(x, k) {
      var C = x.name.split(".").pop();
      return k.map(function(M) {
        return M.toLowerCase();
      }).includes(C.toLowerCase());
    }(m, r) ? (Z(!0), p && p("File type is not supported"), !1) : s && Cr(m.size) > s ? (Z(!0), f && f("File size is too big"), !1) : !(c && Cr(m.size) < c) || (Z(!0), f && f("File size is too small"), !1);
  }, J = function(m) {
    var x = !1;
    if (m) {
      if (m instanceof File) x = !fe(m);
      else for (var k = 0; k < m.length; k++) {
        var C = m[k];
        x = !fe(C) || x;
      }
      return !x && (a && a(m), ie(m), le(!0), Z(!1), !0);
    }
    return !1;
  }, d = function(m) {
    var x = m.labelRef, k = m.inputRef, C = m.multiple, M = m.handleChanges, I = m.onDrop, R = pt(!1), D = R[0], F = R[1], j = Qe(function() {
      k.current.click();
    }, [k]), G = Qe(function(U) {
      U.preventDefault(), U.stopPropagation(), Jt++, U.dataTransfer.items && U.dataTransfer.items.length !== 0 && F(!0);
    }, []), y = Qe(function(U) {
      U.preventDefault(), U.stopPropagation(), --Jt > 0 || F(!1);
    }, []), te = Qe(function(U) {
      U.preventDefault(), U.stopPropagation();
    }, []), Se = Qe(function(U) {
      U.preventDefault(), U.stopPropagation(), F(!1), Jt = 0;
      var dt = U.dataTransfer.files;
      if (dt && dt.length > 0) {
        var rr = C ? dt : dt[0], Po = M(rr);
        I && Po && I(rr);
      }
    }, [M]);
    return Bt(function() {
      var U = x.current;
      return U.addEventListener("click", j), U.addEventListener("dragenter", G), U.addEventListener("dragleave", y), U.addEventListener("dragover", te), U.addEventListener("drop", Se), function() {
        U.removeEventListener("click", j), U.removeEventListener("dragenter", G), U.removeEventListener("dragleave", y), U.removeEventListener("dragover", te), U.removeEventListener("drop", Se);
      };
    }, [j, G, y, te, Se, x]), D;
  }({ labelRef: T, inputRef: B, multiple: A, handleChanges: J, onDrop: v });
  return Bt(function() {
    b == null || b(d);
  }, [d]), Bt(function() {
    l ? (le(!0), ie(l)) : (B.current && (B.current.value = ""), le(!1), ie(null));
  }, [l]), ae(Fi, Me({ overRide: i, className: "".concat(o || "", " ").concat(E ? "is-disabled" : ""), ref: T, htmlFor: t, onClick: function(m) {
    m.preventDefault(), m.stopPropagation();
  }, "aria-describedby": N, role: "button", "aria-label": u }, { children: [H("input", { onClick: function(m) {
    m.stopPropagation(), B && B.current && (B.current.value = "", B.current.click());
  }, onChange: function(m) {
    var x = m.target.files, k = A ? x : x[0], C = J(k);
    g && C && g(k);
  }, accept: $i(r), ref: B, type: "file", id: t, name: t, disabled: E, multiple: A, required: _ }, void 0), d && H(ji, Me({ style: P }, { children: H("span", { children: n || "Drop Here" }, void 0) }), void 0), !i && ae(et, { children: [H(Wi, {}, void 0), ae(Li, Me({ error: ee }, { children: [Ui(xe, Ce, ee, E, w, O), H(Yi, { types: r, minSize: c, maxSize: s }, void 0)] }), void 0)] }, void 0), i] }), void 0);
};
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const Vi = {
  prefix: "fas",
  iconName: "file-arrow-up",
  icon: [384, 512, ["file-upload"], "f574", "M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM216 408c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-102.1-31 31c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l72-72c9.4-9.4 24.6-9.4 33.9 0l72 72c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-31-31L216 408z"]
}, qi = {
  prefix: "fas",
  iconName: "file-audio",
  icon: [384, 512, [], "f1c7", "M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zm2 226.3c37.1 22.4 62 63.1 62 109.7s-24.9 87.3-62 109.7c-7.6 4.6-17.4 2.1-22-5.4s-2.1-17.4 5.4-22C269.4 401.5 288 370.9 288 336s-18.6-65.5-46.5-82.3c-7.6-4.6-10-14.4-5.4-22s14.4-10 22-5.4zm-91.9 30.9c6 2.5 9.9 8.3 9.9 14.8l0 128c0 6.5-3.9 12.3-9.9 14.8s-12.9 1.1-17.4-3.5L113.4 376 80 376c-8.8 0-16-7.2-16-16l0-48c0-8.8 7.2-16 16-16l33.4 0 35.3-35.3c4.6-4.6 11.5-5.9 17.4-3.5zm51 34.9c6.6-5.9 16.7-5.3 22.6 1.3C249.8 304.6 256 319.6 256 336s-6.2 31.4-16.3 42.7c-5.9 6.6-16 7.1-22.6 1.3s-7.1-16-1.3-22.6c5.1-5.7 8.1-13.1 8.1-21.3s-3.1-15.7-8.1-21.3c-5.9-6.6-5.3-16.7 1.3-22.6z"]
};
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function Bi(e, t, n) {
  return (t = Xi(t)) in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function Tr(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function h(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? Tr(Object(n), !0).forEach(function(r) {
      Bi(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Tr(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Gi(e, t) {
  if (typeof e != "object" || !e) return e;
  var n = e[Symbol.toPrimitive];
  if (n !== void 0) {
    var r = n.call(e, t);
    if (typeof r != "object") return r;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Xi(e) {
  var t = Gi(e, "string");
  return typeof t == "symbol" ? t : t + "";
}
const _r = () => {
};
let Vn = {}, $a = {}, Ya = null, Wa = {
  mark: _r,
  measure: _r
};
try {
  typeof window < "u" && (Vn = window), typeof document < "u" && ($a = document), typeof MutationObserver < "u" && (Ya = MutationObserver), typeof performance < "u" && (Wa = performance);
} catch {
}
const {
  userAgent: Ir = ""
} = Vn.navigator || {}, Pe = Vn, q = $a, Nr = Ya, vt = Wa;
Pe.document;
const ve = !!q.documentElement && !!q.head && typeof q.addEventListener == "function" && typeof q.createElement == "function", Ua = ~Ir.indexOf("MSIE") || ~Ir.indexOf("Trident/");
var Ki = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, Zi = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i, Ha = {
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
}, Ji = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, Va = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], Q = "classic", Wt = "duotone", Qi = "sharp", es = "sharp-duotone", qa = [Q, Wt, Qi, es], ts = {
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
}, ns = {
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
}, rs = /* @__PURE__ */ new Map([["classic", {
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
}]]), as = {
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
}, os = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], Rr = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, is = ["kit"], ss = {
  kit: {
    "fa-kit": "fak"
  }
}, cs = ["fak", "fakd"], ls = {
  kit: {
    fak: "fa-kit"
  }
}, Mr = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
}, bt = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, fs = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"], us = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], ds = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
}, ps = {
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
}, ms = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, wn = {
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
}, hs = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Sn = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...fs, ...hs], gs = ["solid", "regular", "light", "thin", "duotone", "brands"], Ba = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ys = Ba.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), vs = [...Object.keys(ms), ...gs, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", bt.GROUP, bt.SWAP_OPACITY, bt.PRIMARY, bt.SECONDARY].concat(Ba.map((e) => "".concat(e, "x"))).concat(ys.map((e) => "w-".concat(e))), bs = {
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
const ge = "___FONT_AWESOME___", En = 16, Ga = "fa", Xa = "svg-inline--fa", je = "data-fa-i2svg", An = "data-fa-pseudo-element", xs = "data-fa-pseudo-element-pending", qn = "data-prefix", Bn = "data-icon", Dr = "fontawesome-i2svg", ws = "async", Ss = ["HTML", "HEAD", "STYLE", "SCRIPT"], Ka = (() => {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    return !1;
  }
})();
function ft(e) {
  return new Proxy(e, {
    get(t, n) {
      return n in t ? t[n] : t[Q];
    }
  });
}
const Za = h({}, Ha);
Za[Q] = h(h(h(h({}, {
  "fa-duotone": "duotone"
}), Ha[Q]), Rr.kit), Rr["kit-duotone"]);
const Es = ft(Za), Pn = h({}, as);
Pn[Q] = h(h(h(h({}, {
  duotone: "fad"
}), Pn[Q]), Mr.kit), Mr["kit-duotone"]);
const Fr = ft(Pn), On = h({}, wn);
On[Q] = h(h({}, On[Q]), ls.kit);
const Gn = ft(On), kn = h({}, ps);
kn[Q] = h(h({}, kn[Q]), ss.kit);
ft(kn);
const As = Ki, Ja = "fa-layers-text", Ps = Zi, Os = h({}, ts);
ft(Os);
const ks = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"], Qt = Ji, Cs = [...is, ...vs], at = Pe.FontAwesomeConfig || {};
function Ts(e) {
  var t = q.querySelector("script[" + e + "]");
  if (t)
    return t.getAttribute(e);
}
function _s(e) {
  return e === "" ? !0 : e === "false" ? !1 : e === "true" ? !0 : e;
}
q && typeof q.querySelector == "function" && [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]].forEach((t) => {
  let [n, r] = t;
  const a = _s(Ts(n));
  a != null && (at[r] = a);
});
const Qa = {
  styleDefault: "solid",
  familyDefault: Q,
  cssPrefix: Ga,
  replacementClass: Xa,
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
at.familyPrefix && (at.cssPrefix = at.familyPrefix);
const Xe = h(h({}, Qa), at);
Xe.autoReplaceSvg || (Xe.observeMutations = !1);
const S = {};
Object.keys(Qa).forEach((e) => {
  Object.defineProperty(S, e, {
    enumerable: !0,
    set: function(t) {
      Xe[e] = t, ot.forEach((n) => n(S));
    },
    get: function() {
      return Xe[e];
    }
  });
});
Object.defineProperty(S, "familyPrefix", {
  enumerable: !0,
  set: function(e) {
    Xe.cssPrefix = e, ot.forEach((t) => t(S));
  },
  get: function() {
    return Xe.cssPrefix;
  }
});
Pe.FontAwesomeConfig = S;
const ot = [];
function Is(e) {
  return ot.push(e), () => {
    ot.splice(ot.indexOf(e), 1);
  };
}
const Ee = En, pe = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: !1,
  flipY: !1
};
function Ns(e) {
  if (!e || !ve)
    return;
  const t = q.createElement("style");
  t.setAttribute("type", "text/css"), t.innerHTML = e;
  const n = q.head.childNodes;
  let r = null;
  for (let a = n.length - 1; a > -1; a--) {
    const o = n[a], i = (o.tagName || "").toUpperCase();
    ["STYLE", "LINK"].indexOf(i) > -1 && (r = o);
  }
  return q.head.insertBefore(t, r), e;
}
const Rs = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function it() {
  let e = 12, t = "";
  for (; e-- > 0; )
    t += Rs[Math.random() * 62 | 0];
  return t;
}
function Je(e) {
  const t = [];
  for (let n = (e || []).length >>> 0; n--; )
    t[n] = e[n];
  return t;
}
function Xn(e) {
  return e.classList ? Je(e.classList) : (e.getAttribute("class") || "").split(" ").filter((t) => t);
}
function eo(e) {
  return "".concat(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Ms(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, '="').concat(eo(e[n]), '" '), "").trim();
}
function Ut(e) {
  return Object.keys(e || {}).reduce((t, n) => t + "".concat(n, ": ").concat(e[n].trim(), ";"), "");
}
function Kn(e) {
  return e.size !== pe.size || e.x !== pe.x || e.y !== pe.y || e.rotate !== pe.rotate || e.flipX || e.flipY;
}
function Ds(e) {
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
function Fs(e) {
  let {
    transform: t,
    width: n = En,
    height: r = En,
    startCentered: a = !1
  } = e, o = "";
  return a && Ua ? o += "translate(".concat(t.x / Ee - n / 2, "em, ").concat(t.y / Ee - r / 2, "em) ") : a ? o += "translate(calc(-50% + ".concat(t.x / Ee, "em), calc(-50% + ").concat(t.y / Ee, "em)) ") : o += "translate(".concat(t.x / Ee, "em, ").concat(t.y / Ee, "em) "), o += "scale(".concat(t.size / Ee * (t.flipX ? -1 : 1), ", ").concat(t.size / Ee * (t.flipY ? -1 : 1), ") "), o += "rotate(".concat(t.rotate, "deg) "), o;
}
var js = `:root, :host {
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
function to() {
  const e = Ga, t = Xa, n = S.cssPrefix, r = S.replacementClass;
  let a = js;
  if (n !== e || r !== t) {
    const o = new RegExp("\\.".concat(e, "\\-"), "g"), i = new RegExp("\\--".concat(e, "\\-"), "g"), s = new RegExp("\\.".concat(t), "g");
    a = a.replace(o, ".".concat(n, "-")).replace(i, "--".concat(n, "-")).replace(s, ".".concat(r));
  }
  return a;
}
let jr = !1;
function en() {
  S.autoAddCss && !jr && (Ns(to()), jr = !0);
}
var Ls = {
  mixout() {
    return {
      dom: {
        css: to,
        insertCss: en
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        en();
      },
      beforeI2svg() {
        en();
      }
    };
  }
};
const ye = Pe || {};
ye[ge] || (ye[ge] = {});
ye[ge].styles || (ye[ge].styles = {});
ye[ge].hooks || (ye[ge].hooks = {});
ye[ge].shims || (ye[ge].shims = []);
var me = ye[ge];
const no = [], ro = function() {
  q.removeEventListener("DOMContentLoaded", ro), Nt = 1, no.map((e) => e());
};
let Nt = !1;
ve && (Nt = (q.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(q.readyState), Nt || q.addEventListener("DOMContentLoaded", ro));
function zs(e) {
  ve && (Nt ? setTimeout(e, 0) : no.push(e));
}
function ut(e) {
  const {
    tag: t,
    attributes: n = {},
    children: r = []
  } = e;
  return typeof e == "string" ? eo(e) : "<".concat(t, " ").concat(Ms(n), ">").concat(r.map(ut).join(""), "</").concat(t, ">");
}
function Lr(e, t, n) {
  if (e && e[t] && e[t][n])
    return {
      prefix: t,
      iconName: n,
      icon: e[t][n]
    };
}
var tn = function(t, n, r, a) {
  var o = Object.keys(t), i = o.length, s = n, c, l, f;
  for (r === void 0 ? (c = 1, f = t[o[0]]) : (c = 0, f = r); c < i; c++)
    l = o[c], f = s(f, t[l], l, t);
  return f;
};
function $s(e) {
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
function Cn(e) {
  const t = $s(e);
  return t.length === 1 ? t[0].toString(16) : null;
}
function Ys(e, t) {
  const n = e.length;
  let r = e.charCodeAt(t), a;
  return r >= 55296 && r <= 56319 && n > t + 1 && (a = e.charCodeAt(t + 1), a >= 56320 && a <= 57343) ? (r - 55296) * 1024 + a - 56320 + 65536 : r;
}
function zr(e) {
  return Object.keys(e).reduce((t, n) => {
    const r = e[n];
    return !!r.icon ? t[r.iconName] = r.icon : t[n] = r, t;
  }, {});
}
function Tn(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks: r = !1
  } = n, a = zr(t);
  typeof me.hooks.addPack == "function" && !r ? me.hooks.addPack(e, zr(t)) : me.styles[e] = h(h({}, me.styles[e] || {}), a), e === "fas" && Tn("fa", t);
}
const {
  styles: st,
  shims: Ws
} = me, ao = Object.keys(Gn), Us = ao.reduce((e, t) => (e[t] = Object.keys(Gn[t]), e), {});
let Zn = null, oo = {}, io = {}, so = {}, co = {}, lo = {};
function Hs(e) {
  return ~Cs.indexOf(e);
}
function Vs(e, t) {
  const n = t.split("-"), r = n[0], a = n.slice(1).join("-");
  return r === e && a !== "" && !Hs(a) ? a : null;
}
const fo = () => {
  const e = (r) => tn(st, (a, o, i) => (a[i] = tn(o, r, {}), a), {});
  oo = e((r, a, o) => (a[3] && (r[a[3]] = o), a[2] && a[2].filter((s) => typeof s == "number").forEach((s) => {
    r[s.toString(16)] = o;
  }), r)), io = e((r, a, o) => (r[o] = o, a[2] && a[2].filter((s) => typeof s == "string").forEach((s) => {
    r[s] = o;
  }), r)), lo = e((r, a, o) => {
    const i = a[2];
    return r[o] = o, i.forEach((s) => {
      r[s] = o;
    }), r;
  });
  const t = "far" in st || S.autoFetchSvg, n = tn(Ws, (r, a) => {
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
  so = n.names, co = n.unicodes, Zn = Ht(S.styleDefault, {
    family: S.familyDefault
  });
};
Is((e) => {
  Zn = Ht(e.styleDefault, {
    family: S.familyDefault
  });
});
fo();
function Jn(e, t) {
  return (oo[e] || {})[t];
}
function qs(e, t) {
  return (io[e] || {})[t];
}
function Ie(e, t) {
  return (lo[e] || {})[t];
}
function uo(e) {
  return so[e] || {
    prefix: null,
    iconName: null
  };
}
function Bs(e) {
  const t = co[e], n = Jn("fas", e);
  return t || (n ? {
    prefix: "fas",
    iconName: n
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function Oe() {
  return Zn;
}
const po = () => ({
  prefix: null,
  iconName: null,
  rest: []
});
function Gs(e) {
  let t = Q;
  const n = ao.reduce((r, a) => (r[a] = "".concat(S.cssPrefix, "-").concat(a), r), {});
  return qa.forEach((r) => {
    (e.includes(n[r]) || e.some((a) => Us[r].includes(a))) && (t = r);
  }), t;
}
function Ht(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family: n = Q
  } = t, r = Es[n][e];
  if (n === Wt && !e)
    return "fad";
  const a = Fr[n][e] || Fr[n][r], o = e in me.styles ? e : null;
  return a || o || null;
}
function Xs(e) {
  let t = [], n = null;
  return e.forEach((r) => {
    const a = Vs(S.cssPrefix, r);
    a ? n = a : r && t.push(r);
  }), {
    iconName: n,
    rest: t
  };
}
function $r(e) {
  return e.sort().filter((t, n, r) => r.indexOf(t) === n);
}
function Vt(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups: n = !1
  } = t;
  let r = null;
  const a = Sn.concat(us), o = $r(e.filter((p) => a.includes(p))), i = $r(e.filter((p) => !Sn.includes(p))), s = o.filter((p) => (r = p, !Va.includes(p))), [c = null] = s, l = Gs(o), f = h(h({}, Xs(i)), {}, {
    prefix: Ht(c, {
      family: l
    })
  });
  return h(h(h({}, f), Qs({
    values: e,
    family: l,
    styles: st,
    config: S,
    canonical: f,
    givenPrefix: r
  })), Ks(n, r, f));
}
function Ks(e, t, n) {
  let {
    prefix: r,
    iconName: a
  } = n;
  if (e || !r || !a)
    return {
      prefix: r,
      iconName: a
    };
  const o = t === "fa" ? uo(a) : {}, i = Ie(r, a);
  return a = o.iconName || i || a, r = o.prefix || r, r === "far" && !st.far && st.fas && !S.autoFetchSvg && (r = "fas"), {
    prefix: r,
    iconName: a
  };
}
const Zs = qa.filter((e) => e !== Q || e !== Wt), Js = Object.keys(wn).filter((e) => e !== Q).map((e) => Object.keys(wn[e])).flat();
function Qs(e) {
  const {
    values: t,
    family: n,
    canonical: r,
    givenPrefix: a = "",
    styles: o = {},
    config: i = {}
  } = e, s = n === Wt, c = t.includes("fa-duotone") || t.includes("fad"), l = i.familyDefault === "duotone", f = r.prefix === "fad" || r.prefix === "fa-duotone";
  if (!s && (c || l || f) && (r.prefix = "fad"), (t.includes("fa-brands") || t.includes("fab")) && (r.prefix = "fab"), !r.prefix && Zs.includes(n) && (Object.keys(o).find((g) => Js.includes(g)) || i.autoFetchSvg)) {
    const g = rs.get(n).defaultShortPrefixId;
    r.prefix = g, r.iconName = Ie(r.prefix, r.iconName) || r.iconName;
  }
  return (r.prefix === "fa" || a === "fa") && (r.prefix = Oe() || "fas"), r;
}
class ec {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var t = arguments.length, n = new Array(t), r = 0; r < t; r++)
      n[r] = arguments[r];
    const a = n.reduce(this._pullDefinitions, {});
    Object.keys(a).forEach((o) => {
      this.definitions[o] = h(h({}, this.definitions[o] || {}), a[o]), Tn(o, a[o]);
      const i = Gn[Q][o];
      i && Tn(i, a[o]), fo();
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
let Yr = [], $e = {};
const We = {}, tc = Object.keys(We);
function nc(e, t) {
  let {
    mixoutsTo: n
  } = t;
  return Yr = e, $e = {}, Object.keys(We).forEach((r) => {
    tc.indexOf(r) === -1 && delete We[r];
  }), Yr.forEach((r) => {
    const a = r.mixout ? r.mixout() : {};
    if (Object.keys(a).forEach((o) => {
      typeof a[o] == "function" && (n[o] = a[o]), typeof a[o] == "object" && Object.keys(a[o]).forEach((i) => {
        n[o] || (n[o] = {}), n[o][i] = a[o][i];
      });
    }), r.hooks) {
      const o = r.hooks();
      Object.keys(o).forEach((i) => {
        $e[i] || ($e[i] = []), $e[i].push(o[i]);
      });
    }
    r.provides && r.provides(We);
  }), n;
}
function _n(e, t) {
  for (var n = arguments.length, r = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++)
    r[a - 2] = arguments[a];
  return ($e[e] || []).forEach((i) => {
    t = i.apply(null, [t, ...r]);
  }), t;
}
function Le(e) {
  for (var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), r = 1; r < t; r++)
    n[r - 1] = arguments[r];
  ($e[e] || []).forEach((o) => {
    o.apply(null, n);
  });
}
function ke() {
  const e = arguments[0], t = Array.prototype.slice.call(arguments, 1);
  return We[e] ? We[e].apply(null, t) : void 0;
}
function In(e) {
  e.prefix === "fa" && (e.prefix = "fas");
  let {
    iconName: t
  } = e;
  const n = e.prefix || Oe();
  if (t)
    return t = Ie(n, t) || t, Lr(mo.definitions, n, t) || Lr(me.styles, n, t);
}
const mo = new ec(), rc = () => {
  S.autoReplaceSvg = !1, S.observeMutations = !1, Le("noAuto");
}, ac = {
  i2svg: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    return ve ? (Le("beforeI2svg", e), ke("pseudoElements2svg", e), ke("i2svg", e)) : Promise.reject(new Error("Operation requires a DOM of some kind."));
  },
  watch: function() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot: t
    } = e;
    S.autoReplaceSvg === !1 && (S.autoReplaceSvg = !0), S.observeMutations = !0, zs(() => {
      ic({
        autoReplaceSvgRoot: t
      }), Le("watch", e);
    });
  }
}, oc = {
  icon: (e) => {
    if (e === null)
      return null;
    if (typeof e == "object" && e.prefix && e.iconName)
      return {
        prefix: e.prefix,
        iconName: Ie(e.prefix, e.iconName) || e.iconName
      };
    if (Array.isArray(e) && e.length === 2) {
      const t = e[1].indexOf("fa-") === 0 ? e[1].slice(3) : e[1], n = Ht(e[0]);
      return {
        prefix: n,
        iconName: Ie(n, t) || t
      };
    }
    if (typeof e == "string" && (e.indexOf("".concat(S.cssPrefix, "-")) > -1 || e.match(As))) {
      const t = Vt(e.split(" "), {
        skipLookups: !0
      });
      return {
        prefix: t.prefix || Oe(),
        iconName: Ie(t.prefix, t.iconName) || t.iconName
      };
    }
    if (typeof e == "string") {
      const t = Oe();
      return {
        prefix: t,
        iconName: Ie(t, e) || e
      };
    }
  }
}, oe = {
  noAuto: rc,
  config: S,
  dom: ac,
  parse: oc,
  library: mo,
  findIconDefinition: In,
  toHtml: ut
}, ic = function() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot: t = q
  } = e;
  (Object.keys(me.styles).length > 0 || S.autoFetchSvg) && ve && S.autoReplaceSvg && oe.dom.i2svg({
    node: t
  });
};
function qt(e, t) {
  return Object.defineProperty(e, "abstract", {
    get: t
  }), Object.defineProperty(e, "html", {
    get: function() {
      return e.abstract.map((n) => ut(n));
    }
  }), Object.defineProperty(e, "node", {
    get: function() {
      if (!ve) return;
      const n = q.createElement("div");
      return n.innerHTML = e.html, n.children;
    }
  }), e;
}
function sc(e) {
  let {
    children: t,
    main: n,
    mask: r,
    attributes: a,
    styles: o,
    transform: i
  } = e;
  if (Kn(i) && n.found && !r.found) {
    const {
      width: s,
      height: c
    } = n, l = {
      x: s / c / 2,
      y: 0.5
    };
    a.style = Ut(h(h({}, o), {}, {
      "transform-origin": "".concat(l.x + i.x / 16, "em ").concat(l.y + i.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes: a,
    children: t
  }];
}
function cc(e) {
  let {
    prefix: t,
    iconName: n,
    children: r,
    attributes: a,
    symbol: o
  } = e;
  const i = o === !0 ? "".concat(t, "-").concat(S.cssPrefix, "-").concat(n) : o;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: h(h({}, a), {}, {
        id: i
      }),
      children: r
    }]
  }];
}
function Qn(e) {
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
    watchable: p = !1
  } = e, {
    width: g,
    height: v
  } = n.found ? n : t, E = cs.includes(r), w = [S.replacementClass, a ? "".concat(S.cssPrefix, "-").concat(a) : ""].filter((u) => f.classes.indexOf(u) === -1).filter((u) => u !== "" || !!u).concat(f.classes).join(" ");
  let O = {
    children: [],
    attributes: h(h({}, f.attributes), {}, {
      "data-prefix": r,
      "data-icon": a,
      class: w,
      role: f.attributes.role || "img",
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 ".concat(g, " ").concat(v)
    })
  };
  const A = E && !~f.classes.indexOf("fa-fw") ? {
    width: "".concat(g / v * 16 * 0.0625, "em")
  } : {};
  p && (O.attributes[je] = ""), s && (O.children.push({
    tag: "title",
    attributes: {
      id: O.attributes["aria-labelledby"] || "title-".concat(l || it())
    },
    children: [s]
  }), delete O.attributes.title);
  const _ = h(h({}, O), {}, {
    prefix: r,
    iconName: a,
    main: t,
    mask: n,
    maskId: c,
    transform: o,
    symbol: i,
    styles: h(h({}, A), f.styles)
  }), {
    children: b,
    attributes: P
  } = n.found && t.found ? ke("generateAbstractMask", _) || {
    children: [],
    attributes: {}
  } : ke("generateAbstractIcon", _) || {
    children: [],
    attributes: {}
  };
  return _.children = b, _.attributes = P, i ? cc(_) : sc(_);
}
function Wr(e) {
  const {
    content: t,
    width: n,
    height: r,
    transform: a,
    title: o,
    extra: i,
    watchable: s = !1
  } = e, c = h(h(h({}, i.attributes), o ? {
    title: o
  } : {}), {}, {
    class: i.classes.join(" ")
  });
  s && (c[je] = "");
  const l = h({}, i.styles);
  Kn(a) && (l.transform = Fs({
    transform: a,
    startCentered: !0,
    width: n,
    height: r
  }), l["-webkit-transform"] = l.transform);
  const f = Ut(l);
  f.length > 0 && (c.style = f);
  const p = [];
  return p.push({
    tag: "span",
    attributes: c,
    children: [t]
  }), o && p.push({
    tag: "span",
    attributes: {
      class: "sr-only"
    },
    children: [o]
  }), p;
}
function lc(e) {
  const {
    content: t,
    title: n,
    extra: r
  } = e, a = h(h(h({}, r.attributes), n ? {
    title: n
  } : {}), {}, {
    class: r.classes.join(" ")
  }), o = Ut(r.styles);
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
  styles: nn
} = me;
function Nn(e) {
  const t = e[0], n = e[1], [r] = e.slice(4);
  let a = null;
  return Array.isArray(r) ? a = {
    tag: "g",
    attributes: {
      class: "".concat(S.cssPrefix, "-").concat(Qt.GROUP)
    },
    children: [{
      tag: "path",
      attributes: {
        class: "".concat(S.cssPrefix, "-").concat(Qt.SECONDARY),
        fill: "currentColor",
        d: r[0]
      }
    }, {
      tag: "path",
      attributes: {
        class: "".concat(S.cssPrefix, "-").concat(Qt.PRIMARY),
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
const fc = {
  found: !1,
  width: 512,
  height: 512
};
function uc(e, t) {
  !Ka && !S.showMissingIcons && e && console.error('Icon with name "'.concat(e, '" and prefix "').concat(t, '" is missing.'));
}
function Rn(e, t) {
  let n = t;
  return t === "fa" && S.styleDefault !== null && (t = Oe()), new Promise((r, a) => {
    if (n === "fa") {
      const o = uo(e) || {};
      e = o.iconName || e, t = o.prefix || t;
    }
    if (e && t && nn[t] && nn[t][e]) {
      const o = nn[t][e];
      return r(Nn(o));
    }
    uc(e, t), r(h(h({}, fc), {}, {
      icon: S.showMissingIcons && e ? ke("missingIconAbstract") || {} : {}
    }));
  });
}
const Ur = () => {
}, Mn = S.measurePerformance && vt && vt.mark && vt.measure ? vt : {
  mark: Ur,
  measure: Ur
}, nt = 'FA "6.7.2"', dc = (e) => (Mn.mark("".concat(nt, " ").concat(e, " begins")), () => ho(e)), ho = (e) => {
  Mn.mark("".concat(nt, " ").concat(e, " ends")), Mn.measure("".concat(nt, " ").concat(e), "".concat(nt, " ").concat(e, " begins"), "".concat(nt, " ").concat(e, " ends"));
};
var er = {
  begin: dc,
  end: ho
};
const kt = () => {
};
function Hr(e) {
  return typeof (e.getAttribute ? e.getAttribute(je) : null) == "string";
}
function pc(e) {
  const t = e.getAttribute ? e.getAttribute(qn) : null, n = e.getAttribute ? e.getAttribute(Bn) : null;
  return t && n;
}
function mc(e) {
  return e && e.classList && e.classList.contains && e.classList.contains(S.replacementClass);
}
function hc() {
  return S.autoReplaceSvg === !0 ? Ct.replace : Ct[S.autoReplaceSvg] || Ct.replace;
}
function gc(e) {
  return q.createElementNS("http://www.w3.org/2000/svg", e);
}
function yc(e) {
  return q.createElement(e);
}
function go(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn: n = e.tag === "svg" ? gc : yc
  } = t;
  if (typeof e == "string")
    return q.createTextNode(e);
  const r = n(e.tag);
  return Object.keys(e.attributes || []).forEach(function(o) {
    r.setAttribute(o, e.attributes[o]);
  }), (e.children || []).forEach(function(o) {
    r.appendChild(go(o, {
      ceFn: n
    }));
  }), r;
}
function vc(e) {
  let t = " ".concat(e.outerHTML, " ");
  return t = "".concat(t, "Font Awesome fontawesome.com "), t;
}
const Ct = {
  replace: function(e) {
    const t = e[0];
    if (t.parentNode)
      if (e[1].forEach((n) => {
        t.parentNode.insertBefore(go(n), t);
      }), t.getAttribute(je) === null && S.keepOriginalSource) {
        let n = q.createComment(vc(t));
        t.parentNode.replaceChild(n, t);
      } else
        t.remove();
  },
  nest: function(e) {
    const t = e[0], n = e[1];
    if (~Xn(t).indexOf(S.replacementClass))
      return Ct.replace(e);
    const r = new RegExp("".concat(S.cssPrefix, "-.*"));
    if (delete n[0].attributes.id, n[0].attributes.class) {
      const o = n[0].attributes.class.split(" ").reduce((i, s) => (s === S.replacementClass || s.match(r) ? i.toSvg.push(s) : i.toNode.push(s), i), {
        toNode: [],
        toSvg: []
      });
      n[0].attributes.class = o.toSvg.join(" "), o.toNode.length === 0 ? t.removeAttribute("class") : t.setAttribute("class", o.toNode.join(" "));
    }
    const a = n.map((o) => ut(o)).join(`
`);
    t.setAttribute(je, ""), t.innerHTML = a;
  }
};
function Vr(e) {
  e();
}
function yo(e, t) {
  const n = typeof t == "function" ? t : kt;
  if (e.length === 0)
    n();
  else {
    let r = Vr;
    S.mutateApproach === ws && (r = Pe.requestAnimationFrame || Vr), r(() => {
      const a = hc(), o = er.begin("mutate");
      e.map(a), o(), n();
    });
  }
}
let tr = !1;
function vo() {
  tr = !0;
}
function Dn() {
  tr = !1;
}
let Rt = null;
function qr(e) {
  if (!Nr || !S.observeMutations)
    return;
  const {
    treeCallback: t = kt,
    nodeCallback: n = kt,
    pseudoElementsCallback: r = kt,
    observeMutationsRoot: a = q
  } = e;
  Rt = new Nr((o) => {
    if (tr) return;
    const i = Oe();
    Je(o).forEach((s) => {
      if (s.type === "childList" && s.addedNodes.length > 0 && !Hr(s.addedNodes[0]) && (S.searchPseudoElements && r(s.target), t(s.target)), s.type === "attributes" && s.target.parentNode && S.searchPseudoElements && r(s.target.parentNode), s.type === "attributes" && Hr(s.target) && ~ks.indexOf(s.attributeName))
        if (s.attributeName === "class" && pc(s.target)) {
          const {
            prefix: c,
            iconName: l
          } = Vt(Xn(s.target));
          s.target.setAttribute(qn, c || i), l && s.target.setAttribute(Bn, l);
        } else mc(s.target) && n(s.target);
    });
  }), ve && Rt.observe(a, {
    childList: !0,
    attributes: !0,
    characterData: !0,
    subtree: !0
  });
}
function bc() {
  Rt && Rt.disconnect();
}
function xc(e) {
  const t = e.getAttribute("style");
  let n = [];
  return t && (n = t.split(";").reduce((r, a) => {
    const o = a.split(":"), i = o[0], s = o.slice(1);
    return i && s.length > 0 && (r[i] = s.join(":").trim()), r;
  }, {})), n;
}
function wc(e) {
  const t = e.getAttribute("data-prefix"), n = e.getAttribute("data-icon"), r = e.innerText !== void 0 ? e.innerText.trim() : "";
  let a = Vt(Xn(e));
  return a.prefix || (a.prefix = Oe()), t && n && (a.prefix = t, a.iconName = n), a.iconName && a.prefix || (a.prefix && r.length > 0 && (a.iconName = qs(a.prefix, e.innerText) || Jn(a.prefix, Cn(e.innerText))), !a.iconName && S.autoFetchSvg && e.firstChild && e.firstChild.nodeType === Node.TEXT_NODE && (a.iconName = e.firstChild.data)), a;
}
function Sc(e) {
  const t = Je(e.attributes).reduce((a, o) => (a.name !== "class" && a.name !== "style" && (a[o.name] = o.value), a), {}), n = e.getAttribute("title"), r = e.getAttribute("data-fa-title-id");
  return S.autoA11y && (n ? t["aria-labelledby"] = "".concat(S.replacementClass, "-title-").concat(r || it()) : (t["aria-hidden"] = "true", t.focusable = "false")), t;
}
function Ec() {
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
function Br(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: !0
  };
  const {
    iconName: n,
    prefix: r,
    rest: a
  } = wc(e), o = Sc(e), i = _n("parseNodeAttributes", {}, e);
  let s = t.styleParser ? xc(e) : [];
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
      classes: a,
      styles: s,
      attributes: o
    }
  }, i);
}
const {
  styles: Ac
} = me;
function bo(e) {
  const t = S.autoReplaceSvg === "nest" ? Br(e, {
    styleParser: !1
  }) : Br(e);
  return ~t.extra.classes.indexOf(Ja) ? ke("generateLayersText", e, t) : ke("generateSvgReplacementMutation", e, t);
}
function Pc() {
  return [...os, ...Sn];
}
function Gr(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!ve) return Promise.resolve();
  const n = q.documentElement.classList, r = (f) => n.add("".concat(Dr, "-").concat(f)), a = (f) => n.remove("".concat(Dr, "-").concat(f)), o = S.autoFetchSvg ? Pc() : Va.concat(Object.keys(Ac));
  o.includes("fa") || o.push("fa");
  const i = [".".concat(Ja, ":not([").concat(je, "])")].concat(o.map((f) => ".".concat(f, ":not([").concat(je, "])"))).join(", ");
  if (i.length === 0)
    return Promise.resolve();
  let s = [];
  try {
    s = Je(e.querySelectorAll(i));
  } catch {
  }
  if (s.length > 0)
    r("pending"), a("complete");
  else
    return Promise.resolve();
  const c = er.begin("onTree"), l = s.reduce((f, p) => {
    try {
      const g = bo(p);
      g && f.push(g);
    } catch (g) {
      Ka || g.name === "MissingIcon" && console.error(g);
    }
    return f;
  }, []);
  return new Promise((f, p) => {
    Promise.all(l).then((g) => {
      yo(g, () => {
        r("active"), r("complete"), a("pending"), typeof t == "function" && t(), c(), f();
      });
    }).catch((g) => {
      c(), p(g);
    });
  });
}
function Oc(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  bo(e).then((n) => {
    n && yo([n], t);
  });
}
function kc(e) {
  return function(t) {
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const r = (t || {}).icon ? t : In(t || {});
    let {
      mask: a
    } = n;
    return a && (a = (a || {}).icon ? a : In(a || {})), e(r, h(h({}, n), {}, {
      mask: a
    }));
  };
}
const Cc = function(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform: n = pe,
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
    prefix: p,
    iconName: g,
    icon: v
  } = e;
  return qt(h({
    type: "icon"
  }, e), () => (Le("beforeDOMElementCreation", {
    iconDefinition: e,
    params: t
  }), S.autoA11y && (i ? l["aria-labelledby"] = "".concat(S.replacementClass, "-title-").concat(s || it()) : (l["aria-hidden"] = "true", l.focusable = "false")), Qn({
    icons: {
      main: Nn(v),
      mask: a ? Nn(a.icon) : {
        found: !1,
        width: null,
        height: null,
        icon: {}
      }
    },
    prefix: p,
    iconName: g,
    transform: h(h({}, pe), n),
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
var Tc = {
  mixout() {
    return {
      icon: kc(Cc)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.treeCallback = Gr, e.nodeCallback = Oc, e;
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
      return Gr(n, r);
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
        extra: p
      } = n;
      return new Promise((g, v) => {
        Promise.all([Rn(r, i), l.iconName ? Rn(l.iconName, l.prefix) : Promise.resolve({
          found: !1,
          width: 512,
          height: 512,
          icon: {}
        })]).then((E) => {
          let [w, O] = E;
          g([t, Qn({
            icons: {
              main: w,
              mask: O
            },
            prefix: i,
            iconName: r,
            transform: s,
            symbol: c,
            maskId: f,
            title: a,
            titleId: o,
            extra: p,
            watchable: !0
          })]);
        }).catch(v);
      });
    }, e.generateAbstractIcon = function(t) {
      let {
        children: n,
        attributes: r,
        main: a,
        transform: o,
        styles: i
      } = t;
      const s = Ut(i);
      s.length > 0 && (r.style = s);
      let c;
      return Kn(o) && (c = ke("generateAbstractTransformGrouping", {
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
}, _c = {
  mixout() {
    return {
      layer(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes: n = []
        } = t;
        return qt({
          type: "layer"
        }, () => {
          Le("beforeDOMElementCreation", {
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
              class: ["".concat(S.cssPrefix, "-layers"), ...n].join(" ")
            },
            children: r
          }];
        });
      }
    };
  }
}, Ic = {
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
        return qt({
          type: "counter",
          content: e
        }, () => (Le("beforeDOMElementCreation", {
          content: e,
          params: t
        }), lc({
          content: e.toString(),
          title: n,
          extra: {
            attributes: a,
            styles: o,
            classes: ["".concat(S.cssPrefix, "-layers-counter"), ...r]
          }
        })));
      }
    };
  }
}, Nc = {
  mixout() {
    return {
      text(e) {
        let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform: n = pe,
          title: r = null,
          classes: a = [],
          attributes: o = {},
          styles: i = {}
        } = t;
        return qt({
          type: "text",
          content: e
        }, () => (Le("beforeDOMElementCreation", {
          content: e,
          params: t
        }), Wr({
          content: e,
          transform: h(h({}, pe), n),
          title: r,
          extra: {
            attributes: o,
            styles: i,
            classes: ["".concat(S.cssPrefix, "-layers-text"), ...a]
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
      if (Ua) {
        const c = parseInt(getComputedStyle(t).fontSize, 10), l = t.getBoundingClientRect();
        i = l.width / c, s = l.height / c;
      }
      return S.autoA11y && !r && (o.attributes["aria-hidden"] = "true"), Promise.resolve([t, Wr({
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
const Rc = new RegExp('"', "ug"), Xr = [1105920, 1112319], Kr = h(h(h(h({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), ns), bs), ds), Fn = Object.keys(Kr).reduce((e, t) => (e[t.toLowerCase()] = Kr[t], e), {}), Mc = Object.keys(Fn).reduce((e, t) => {
  const n = Fn[t];
  return e[t] = n[900] || [...Object.entries(n)][0][1], e;
}, {});
function Dc(e) {
  const t = e.replace(Rc, ""), n = Ys(t, 0), r = n >= Xr[0] && n <= Xr[1], a = t.length === 2 ? t[0] === t[1] : !1;
  return {
    value: Cn(a ? t[0] : t),
    isSecondary: r || a
  };
}
function Fc(e, t) {
  const n = e.replace(/^['"]|['"]$/g, "").toLowerCase(), r = parseInt(t), a = isNaN(r) ? "normal" : r;
  return (Fn[n] || {})[a] || Mc[n];
}
function Zr(e, t) {
  const n = "".concat(xs).concat(t.replace(":", "-"));
  return new Promise((r, a) => {
    if (e.getAttribute(n) !== null)
      return r();
    const i = Je(e.children).filter((g) => g.getAttribute(An) === t)[0], s = Pe.getComputedStyle(e, t), c = s.getPropertyValue("font-family"), l = c.match(Ps), f = s.getPropertyValue("font-weight"), p = s.getPropertyValue("content");
    if (i && !l)
      return e.removeChild(i), r();
    if (l && p !== "none" && p !== "") {
      const g = s.getPropertyValue("content");
      let v = Fc(c, f);
      const {
        value: E,
        isSecondary: w
      } = Dc(g), O = l[0].startsWith("FontAwesome");
      let A = Jn(v, E), _ = A;
      if (O) {
        const b = Bs(E);
        b.iconName && b.prefix && (A = b.iconName, v = b.prefix);
      }
      if (A && !w && (!i || i.getAttribute(qn) !== v || i.getAttribute(Bn) !== _)) {
        e.setAttribute(n, _), i && e.removeChild(i);
        const b = Ec(), {
          extra: P
        } = b;
        P.attributes[An] = t, Rn(A, v).then((u) => {
          const N = Qn(h(h({}, b), {}, {
            icons: {
              main: u,
              mask: po()
            },
            prefix: v,
            iconName: _,
            extra: P,
            watchable: !0
          })), T = q.createElementNS("http://www.w3.org/2000/svg", "svg");
          t === "::before" ? e.insertBefore(T, e.firstChild) : e.appendChild(T), T.outerHTML = N.map((B) => ut(B)).join(`
`), e.removeAttribute(n), r();
        }).catch(a);
      } else
        r();
    } else
      r();
  });
}
function jc(e) {
  return Promise.all([Zr(e, "::before"), Zr(e, "::after")]);
}
function Lc(e) {
  return e.parentNode !== document.head && !~Ss.indexOf(e.tagName.toUpperCase()) && !e.getAttribute(An) && (!e.parentNode || e.parentNode.tagName !== "svg");
}
function Jr(e) {
  if (ve)
    return new Promise((t, n) => {
      const r = Je(e.querySelectorAll("*")).filter(Lc).map(jc), a = er.begin("searchPseudoElements");
      vo(), Promise.all(r).then(() => {
        a(), Dn(), t();
      }).catch(() => {
        a(), Dn(), n();
      });
    });
}
var zc = {
  hooks() {
    return {
      mutationObserverCallbacks(e) {
        return e.pseudoElementsCallback = Jr, e;
      }
    };
  },
  provides(e) {
    e.pseudoElements2svg = function(t) {
      const {
        node: n = q
      } = t;
      S.searchPseudoElements && Jr(n);
    };
  }
};
let Qr = !1;
var $c = {
  mixout() {
    return {
      dom: {
        unwatch() {
          vo(), Qr = !0;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        qr(_n("mutationObserverCallbacks", {}));
      },
      noAuto() {
        bc();
      },
      watch(e) {
        const {
          observeMutationsRoot: t
        } = e;
        Qr ? Dn() : qr(_n("mutationObserverCallbacks", {
          observeMutationsRoot: t
        }));
      }
    };
  }
};
const ea = (e) => {
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
var Yc = {
  mixout() {
    return {
      parse: {
        transform: (e) => ea(e)
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-transform");
        return n && (e.transform = ea(n)), e;
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
      }, p = {
        transform: "translate(".concat(o / 2 * -1, " -256)")
      }, g = {
        outer: i,
        inner: f,
        path: p
      };
      return {
        tag: "g",
        attributes: h({}, g.outer),
        children: [{
          tag: "g",
          attributes: h({}, g.inner),
          children: [{
            tag: n.icon.tag,
            children: n.icon.children,
            attributes: h(h({}, n.icon.attributes), g.path)
          }]
        }]
      };
    };
  }
};
const rn = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function ta(e) {
  let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0;
  return e.attributes && (e.attributes.fill || t) && (e.attributes.fill = "black"), e;
}
function Wc(e) {
  return e.tag === "g" ? e.children : [e];
}
var Uc = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-mask"), r = n ? Vt(n.split(" ").map((a) => a.trim())) : po();
        return r.prefix || (r.prefix = Oe()), e.mask = r, e.maskId = t.getAttribute("data-fa-mask-id"), e;
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
        icon: p
      } = o, g = Ds({
        transform: s,
        containerWidth: f,
        iconWidth: c
      }), v = {
        tag: "rect",
        attributes: h(h({}, rn), {}, {
          fill: "white"
        })
      }, E = l.children ? {
        children: l.children.map(ta)
      } : {}, w = {
        tag: "g",
        attributes: h({}, g.inner),
        children: [ta(h({
          tag: l.tag,
          attributes: h(h({}, l.attributes), g.path)
        }, E))]
      }, O = {
        tag: "g",
        attributes: h({}, g.outer),
        children: [w]
      }, A = "mask-".concat(i || it()), _ = "clip-".concat(i || it()), b = {
        tag: "mask",
        attributes: h(h({}, rn), {}, {
          id: A,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [v, O]
      }, P = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: _
          },
          children: Wc(p)
        }, b]
      };
      return n.push(P, {
        tag: "rect",
        attributes: h({
          fill: "currentColor",
          "clip-path": "url(#".concat(_, ")"),
          mask: "url(#".concat(A, ")")
        }, rn)
      }), {
        children: n,
        attributes: r
      };
    };
  }
}, Hc = {
  provides(e) {
    let t = !1;
    Pe.matchMedia && (t = Pe.matchMedia("(prefers-reduced-motion: reduce)").matches), e.missingIconAbstract = function() {
      const n = [], r = {
        fill: "currentColor"
      }, a = {
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
      const o = h(h({}, a), {}, {
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
        attributes: h(h({}, a), {}, {
          attributeName: "r",
          values: "28;14;28;28;14;28;"
        })
      }, {
        tag: "animate",
        attributes: h(h({}, o), {}, {
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
          attributes: h(h({}, o), {}, {
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
          attributes: h(h({}, o), {}, {
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
}, Vc = {
  hooks() {
    return {
      parseNodeAttributes(e, t) {
        const n = t.getAttribute("data-fa-symbol"), r = n === null ? !1 : n === "" ? !0 : n;
        return e.symbol = r, e;
      }
    };
  }
}, qc = [Ls, Tc, _c, Ic, Nc, zc, $c, Yc, Uc, Hc, Vc];
nc(qc, {
  mixoutsTo: oe
});
oe.noAuto;
oe.config;
oe.library;
oe.dom;
const jn = oe.parse;
oe.findIconDefinition;
oe.toHtml;
const Bc = oe.icon;
oe.layer;
oe.text;
oe.counter;
var xt = { exports: {} }, wt = { exports: {} }, $ = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var na;
function Gc() {
  if (na) return $;
  na = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, v = e ? Symbol.for("react.memo") : 60115, E = e ? Symbol.for("react.lazy") : 60116, w = e ? Symbol.for("react.block") : 60121, O = e ? Symbol.for("react.fundamental") : 60117, A = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
  function b(u) {
    if (typeof u == "object" && u !== null) {
      var N = u.$$typeof;
      switch (N) {
        case t:
          switch (u = u.type, u) {
            case c:
            case l:
            case r:
            case o:
            case a:
            case p:
              return u;
            default:
              switch (u = u && u.$$typeof, u) {
                case s:
                case f:
                case E:
                case v:
                case i:
                  return u;
                default:
                  return N;
              }
          }
        case n:
          return N;
      }
    }
  }
  function P(u) {
    return b(u) === l;
  }
  return $.AsyncMode = c, $.ConcurrentMode = l, $.ContextConsumer = s, $.ContextProvider = i, $.Element = t, $.ForwardRef = f, $.Fragment = r, $.Lazy = E, $.Memo = v, $.Portal = n, $.Profiler = o, $.StrictMode = a, $.Suspense = p, $.isAsyncMode = function(u) {
    return P(u) || b(u) === c;
  }, $.isConcurrentMode = P, $.isContextConsumer = function(u) {
    return b(u) === s;
  }, $.isContextProvider = function(u) {
    return b(u) === i;
  }, $.isElement = function(u) {
    return typeof u == "object" && u !== null && u.$$typeof === t;
  }, $.isForwardRef = function(u) {
    return b(u) === f;
  }, $.isFragment = function(u) {
    return b(u) === r;
  }, $.isLazy = function(u) {
    return b(u) === E;
  }, $.isMemo = function(u) {
    return b(u) === v;
  }, $.isPortal = function(u) {
    return b(u) === n;
  }, $.isProfiler = function(u) {
    return b(u) === o;
  }, $.isStrictMode = function(u) {
    return b(u) === a;
  }, $.isSuspense = function(u) {
    return b(u) === p;
  }, $.isValidElementType = function(u) {
    return typeof u == "string" || typeof u == "function" || u === r || u === l || u === o || u === a || u === p || u === g || typeof u == "object" && u !== null && (u.$$typeof === E || u.$$typeof === v || u.$$typeof === i || u.$$typeof === s || u.$$typeof === f || u.$$typeof === O || u.$$typeof === A || u.$$typeof === _ || u.$$typeof === w);
  }, $.typeOf = b, $;
}
var Y = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ra;
function Xc() {
  return ra || (ra = 1, process.env.NODE_ENV !== "production" && function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, n = e ? Symbol.for("react.portal") : 60106, r = e ? Symbol.for("react.fragment") : 60107, a = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, i = e ? Symbol.for("react.provider") : 60109, s = e ? Symbol.for("react.context") : 60110, c = e ? Symbol.for("react.async_mode") : 60111, l = e ? Symbol.for("react.concurrent_mode") : 60111, f = e ? Symbol.for("react.forward_ref") : 60112, p = e ? Symbol.for("react.suspense") : 60113, g = e ? Symbol.for("react.suspense_list") : 60120, v = e ? Symbol.for("react.memo") : 60115, E = e ? Symbol.for("react.lazy") : 60116, w = e ? Symbol.for("react.block") : 60121, O = e ? Symbol.for("react.fundamental") : 60117, A = e ? Symbol.for("react.responder") : 60118, _ = e ? Symbol.for("react.scope") : 60119;
    function b(y) {
      return typeof y == "string" || typeof y == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      y === r || y === l || y === o || y === a || y === p || y === g || typeof y == "object" && y !== null && (y.$$typeof === E || y.$$typeof === v || y.$$typeof === i || y.$$typeof === s || y.$$typeof === f || y.$$typeof === O || y.$$typeof === A || y.$$typeof === _ || y.$$typeof === w);
    }
    function P(y) {
      if (typeof y == "object" && y !== null) {
        var te = y.$$typeof;
        switch (te) {
          case t:
            var Se = y.type;
            switch (Se) {
              case c:
              case l:
              case r:
              case o:
              case a:
              case p:
                return Se;
              default:
                var U = Se && Se.$$typeof;
                switch (U) {
                  case s:
                  case f:
                  case E:
                  case v:
                  case i:
                    return U;
                  default:
                    return te;
                }
            }
          case n:
            return te;
        }
      }
    }
    var u = c, N = l, T = s, B = i, re = t, Ce = f, le = r, be = E, xe = v, ie = n, we = o, ee = a, Z = p, fe = !1;
    function J(y) {
      return fe || (fe = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), d(y) || P(y) === c;
    }
    function d(y) {
      return P(y) === l;
    }
    function m(y) {
      return P(y) === s;
    }
    function x(y) {
      return P(y) === i;
    }
    function k(y) {
      return typeof y == "object" && y !== null && y.$$typeof === t;
    }
    function C(y) {
      return P(y) === f;
    }
    function M(y) {
      return P(y) === r;
    }
    function I(y) {
      return P(y) === E;
    }
    function R(y) {
      return P(y) === v;
    }
    function D(y) {
      return P(y) === n;
    }
    function F(y) {
      return P(y) === o;
    }
    function j(y) {
      return P(y) === a;
    }
    function G(y) {
      return P(y) === p;
    }
    Y.AsyncMode = u, Y.ConcurrentMode = N, Y.ContextConsumer = T, Y.ContextProvider = B, Y.Element = re, Y.ForwardRef = Ce, Y.Fragment = le, Y.Lazy = be, Y.Memo = xe, Y.Portal = ie, Y.Profiler = we, Y.StrictMode = ee, Y.Suspense = Z, Y.isAsyncMode = J, Y.isConcurrentMode = d, Y.isContextConsumer = m, Y.isContextProvider = x, Y.isElement = k, Y.isForwardRef = C, Y.isFragment = M, Y.isLazy = I, Y.isMemo = R, Y.isPortal = D, Y.isProfiler = F, Y.isStrictMode = j, Y.isSuspense = G, Y.isValidElementType = b, Y.typeOf = P;
  }()), Y;
}
var aa;
function xo() {
  return aa || (aa = 1, process.env.NODE_ENV === "production" ? wt.exports = Gc() : wt.exports = Xc()), wt.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var an, oa;
function Kc() {
  if (oa) return an;
  oa = 1;
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
  return an = a() ? Object.assign : function(o, i) {
    for (var s, c = r(o), l, f = 1; f < arguments.length; f++) {
      s = Object(arguments[f]);
      for (var p in s)
        t.call(s, p) && (c[p] = s[p]);
      if (e) {
        l = e(s);
        for (var g = 0; g < l.length; g++)
          n.call(s, l[g]) && (c[l[g]] = s[l[g]]);
      }
    }
    return c;
  }, an;
}
var on, ia;
function nr() {
  if (ia) return on;
  ia = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return on = e, on;
}
var sn, sa;
function wo() {
  return sa || (sa = 1, sn = Function.call.bind(Object.prototype.hasOwnProperty)), sn;
}
var cn, ca;
function Zc() {
  if (ca) return cn;
  ca = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ nr(), n = {}, r = /* @__PURE__ */ wo();
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
          var p;
          try {
            if (typeof o[f] != "function") {
              var g = Error(
                (c || "React class") + ": " + s + " type `" + f + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[f] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw g.name = "Invariant Violation", g;
            }
            p = o[f](i, f, c, s, null, t);
          } catch (E) {
            p = E;
          }
          if (p && !(p instanceof Error) && e(
            (c || "React class") + ": type specification of " + s + " `" + f + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof p + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), p instanceof Error && !(p.message in n)) {
            n[p.message] = !0;
            var v = l ? l() : "";
            e(
              "Failed " + s + " type: " + p.message + (v ?? "")
            );
          }
        }
    }
  }
  return a.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (n = {});
  }, cn = a, cn;
}
var ln, la;
function Jc() {
  if (la) return ln;
  la = 1;
  var e = xo(), t = Kc(), n = /* @__PURE__ */ nr(), r = /* @__PURE__ */ wo(), a = /* @__PURE__ */ Zc(), o = function() {
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
  return ln = function(s, c) {
    var l = typeof Symbol == "function" && Symbol.iterator, f = "@@iterator";
    function p(d) {
      var m = d && (l && d[l] || d[f]);
      if (typeof m == "function")
        return m;
    }
    var g = "<<anonymous>>", v = {
      array: A("array"),
      bigint: A("bigint"),
      bool: A("boolean"),
      func: A("function"),
      number: A("number"),
      object: A("object"),
      string: A("string"),
      symbol: A("symbol"),
      any: _(),
      arrayOf: b,
      element: P(),
      elementType: u(),
      instanceOf: N,
      node: Ce(),
      objectOf: B,
      oneOf: T,
      oneOfType: re,
      shape: be,
      exact: xe
    };
    function E(d, m) {
      return d === m ? d !== 0 || 1 / d === 1 / m : d !== d && m !== m;
    }
    function w(d, m) {
      this.message = d, this.data = m && typeof m == "object" ? m : {}, this.stack = "";
    }
    w.prototype = Error.prototype;
    function O(d) {
      if (process.env.NODE_ENV !== "production")
        var m = {}, x = 0;
      function k(M, I, R, D, F, j, G) {
        if (D = D || g, j = j || R, G !== n) {
          if (c) {
            var y = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw y.name = "Invariant Violation", y;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var te = D + ":" + R;
            !m[te] && // Avoid spamming the console because they are often not actionable except for lib authors
            x < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + j + "` prop on `" + D + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), m[te] = !0, x++);
          }
        }
        return I[R] == null ? M ? I[R] === null ? new w("The " + F + " `" + j + "` is marked as required " + ("in `" + D + "`, but its value is `null`.")) : new w("The " + F + " `" + j + "` is marked as required in " + ("`" + D + "`, but its value is `undefined`.")) : null : d(I, R, D, F, j);
      }
      var C = k.bind(null, !1);
      return C.isRequired = k.bind(null, !0), C;
    }
    function A(d) {
      function m(x, k, C, M, I, R) {
        var D = x[k], F = ee(D);
        if (F !== d) {
          var j = Z(D);
          return new w(
            "Invalid " + M + " `" + I + "` of type " + ("`" + j + "` supplied to `" + C + "`, expected ") + ("`" + d + "`."),
            { expectedType: d }
          );
        }
        return null;
      }
      return O(m);
    }
    function _() {
      return O(i);
    }
    function b(d) {
      function m(x, k, C, M, I) {
        if (typeof d != "function")
          return new w("Property `" + I + "` of component `" + C + "` has invalid PropType notation inside arrayOf.");
        var R = x[k];
        if (!Array.isArray(R)) {
          var D = ee(R);
          return new w("Invalid " + M + " `" + I + "` of type " + ("`" + D + "` supplied to `" + C + "`, expected an array."));
        }
        for (var F = 0; F < R.length; F++) {
          var j = d(R, F, C, M, I + "[" + F + "]", n);
          if (j instanceof Error)
            return j;
        }
        return null;
      }
      return O(m);
    }
    function P() {
      function d(m, x, k, C, M) {
        var I = m[x];
        if (!s(I)) {
          var R = ee(I);
          return new w("Invalid " + C + " `" + M + "` of type " + ("`" + R + "` supplied to `" + k + "`, expected a single ReactElement."));
        }
        return null;
      }
      return O(d);
    }
    function u() {
      function d(m, x, k, C, M) {
        var I = m[x];
        if (!e.isValidElementType(I)) {
          var R = ee(I);
          return new w("Invalid " + C + " `" + M + "` of type " + ("`" + R + "` supplied to `" + k + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return O(d);
    }
    function N(d) {
      function m(x, k, C, M, I) {
        if (!(x[k] instanceof d)) {
          var R = d.name || g, D = J(x[k]);
          return new w("Invalid " + M + " `" + I + "` of type " + ("`" + D + "` supplied to `" + C + "`, expected ") + ("instance of `" + R + "`."));
        }
        return null;
      }
      return O(m);
    }
    function T(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), i;
      function m(x, k, C, M, I) {
        for (var R = x[k], D = 0; D < d.length; D++)
          if (E(R, d[D]))
            return null;
        var F = JSON.stringify(d, function(G, y) {
          var te = Z(y);
          return te === "symbol" ? String(y) : y;
        });
        return new w("Invalid " + M + " `" + I + "` of value `" + String(R) + "` " + ("supplied to `" + C + "`, expected one of " + F + "."));
      }
      return O(m);
    }
    function B(d) {
      function m(x, k, C, M, I) {
        if (typeof d != "function")
          return new w("Property `" + I + "` of component `" + C + "` has invalid PropType notation inside objectOf.");
        var R = x[k], D = ee(R);
        if (D !== "object")
          return new w("Invalid " + M + " `" + I + "` of type " + ("`" + D + "` supplied to `" + C + "`, expected an object."));
        for (var F in R)
          if (r(R, F)) {
            var j = d(R, F, C, M, I + "." + F, n);
            if (j instanceof Error)
              return j;
          }
        return null;
      }
      return O(m);
    }
    function re(d) {
      if (!Array.isArray(d))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), i;
      for (var m = 0; m < d.length; m++) {
        var x = d[m];
        if (typeof x != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + fe(x) + " at index " + m + "."
          ), i;
      }
      function k(C, M, I, R, D) {
        for (var F = [], j = 0; j < d.length; j++) {
          var G = d[j], y = G(C, M, I, R, D, n);
          if (y == null)
            return null;
          y.data && r(y.data, "expectedType") && F.push(y.data.expectedType);
        }
        var te = F.length > 0 ? ", expected one of type [" + F.join(", ") + "]" : "";
        return new w("Invalid " + R + " `" + D + "` supplied to " + ("`" + I + "`" + te + "."));
      }
      return O(k);
    }
    function Ce() {
      function d(m, x, k, C, M) {
        return ie(m[x]) ? null : new w("Invalid " + C + " `" + M + "` supplied to " + ("`" + k + "`, expected a ReactNode."));
      }
      return O(d);
    }
    function le(d, m, x, k, C) {
      return new w(
        (d || "React class") + ": " + m + " type `" + x + "." + k + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + C + "`."
      );
    }
    function be(d) {
      function m(x, k, C, M, I) {
        var R = x[k], D = ee(R);
        if (D !== "object")
          return new w("Invalid " + M + " `" + I + "` of type `" + D + "` " + ("supplied to `" + C + "`, expected `object`."));
        for (var F in d) {
          var j = d[F];
          if (typeof j != "function")
            return le(C, M, I, F, Z(j));
          var G = j(R, F, C, M, I + "." + F, n);
          if (G)
            return G;
        }
        return null;
      }
      return O(m);
    }
    function xe(d) {
      function m(x, k, C, M, I) {
        var R = x[k], D = ee(R);
        if (D !== "object")
          return new w("Invalid " + M + " `" + I + "` of type `" + D + "` " + ("supplied to `" + C + "`, expected `object`."));
        var F = t({}, x[k], d);
        for (var j in F) {
          var G = d[j];
          if (r(d, j) && typeof G != "function")
            return le(C, M, I, j, Z(G));
          if (!G)
            return new w(
              "Invalid " + M + " `" + I + "` key `" + j + "` supplied to `" + C + "`.\nBad object: " + JSON.stringify(x[k], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(d), null, "  ")
            );
          var y = G(R, j, C, M, I + "." + j, n);
          if (y)
            return y;
        }
        return null;
      }
      return O(m);
    }
    function ie(d) {
      switch (typeof d) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !d;
        case "object":
          if (Array.isArray(d))
            return d.every(ie);
          if (d === null || s(d))
            return !0;
          var m = p(d);
          if (m) {
            var x = m.call(d), k;
            if (m !== d.entries) {
              for (; !(k = x.next()).done; )
                if (!ie(k.value))
                  return !1;
            } else
              for (; !(k = x.next()).done; ) {
                var C = k.value;
                if (C && !ie(C[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function we(d, m) {
      return d === "symbol" ? !0 : m ? m["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && m instanceof Symbol : !1;
    }
    function ee(d) {
      var m = typeof d;
      return Array.isArray(d) ? "array" : d instanceof RegExp ? "object" : we(m, d) ? "symbol" : m;
    }
    function Z(d) {
      if (typeof d > "u" || d === null)
        return "" + d;
      var m = ee(d);
      if (m === "object") {
        if (d instanceof Date)
          return "date";
        if (d instanceof RegExp)
          return "regexp";
      }
      return m;
    }
    function fe(d) {
      var m = Z(d);
      switch (m) {
        case "array":
        case "object":
          return "an " + m;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + m;
        default:
          return m;
      }
    }
    function J(d) {
      return !d.constructor || !d.constructor.name ? g : d.constructor.name;
    }
    return v.checkPropTypes = a, v.resetWarningCache = a.resetWarningCache, v.PropTypes = v, v;
  }, ln;
}
var fn, fa;
function Qc() {
  if (fa) return fn;
  fa = 1;
  var e = /* @__PURE__ */ nr();
  function t() {
  }
  function n() {
  }
  return n.resetWarningCache = t, fn = function() {
    function r(i, s, c, l, f, p) {
      if (p !== e) {
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
  }, fn;
}
var ua;
function el() {
  if (ua) return xt.exports;
  if (ua = 1, process.env.NODE_ENV !== "production") {
    var e = xo(), t = !0;
    xt.exports = /* @__PURE__ */ Jc()(e.isElement, t);
  } else
    xt.exports = /* @__PURE__ */ Qc()();
  return xt.exports;
}
var tl = /* @__PURE__ */ el();
const z = /* @__PURE__ */ Io(tl);
function da(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(a) {
      return Object.getOwnPropertyDescriptor(e, a).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function de(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? da(Object(n), !0).forEach(function(r) {
      Ye(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : da(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Mt(e) {
  "@babel/helpers - typeof";
  return Mt = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Mt(e);
}
function Ye(e, t, n) {
  return t in e ? Object.defineProperty(e, t, {
    value: n,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = n, e;
}
function nl(e, t) {
  if (e == null) return {};
  var n = {}, r = Object.keys(e), a, o;
  for (o = 0; o < r.length; o++)
    a = r[o], !(t.indexOf(a) >= 0) && (n[a] = e[a]);
  return n;
}
function rl(e, t) {
  if (e == null) return {};
  var n = nl(e, t), r, a;
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    for (a = 0; a < o.length; a++)
      r = o[a], !(t.indexOf(r) >= 0) && Object.prototype.propertyIsEnumerable.call(e, r) && (n[r] = e[r]);
  }
  return n;
}
function Ln(e) {
  return al(e) || ol(e) || il(e) || sl();
}
function al(e) {
  if (Array.isArray(e)) return zn(e);
}
function ol(e) {
  if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function il(e, t) {
  if (e) {
    if (typeof e == "string") return zn(e, t);
    var n = Object.prototype.toString.call(e).slice(8, -1);
    if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set") return Array.from(e);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return zn(e, t);
  }
}
function zn(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = new Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function sl() {
  throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function cl(e) {
  var t, n = e.beat, r = e.fade, a = e.beatFade, o = e.bounce, i = e.shake, s = e.flash, c = e.spin, l = e.spinPulse, f = e.spinReverse, p = e.pulse, g = e.fixedWidth, v = e.inverse, E = e.border, w = e.listItem, O = e.flip, A = e.size, _ = e.rotation, b = e.pull, P = (t = {
    "fa-beat": n,
    "fa-fade": r,
    "fa-beat-fade": a,
    "fa-bounce": o,
    "fa-shake": i,
    "fa-flash": s,
    "fa-spin": c,
    "fa-spin-reverse": f,
    "fa-spin-pulse": l,
    "fa-pulse": p,
    "fa-fw": g,
    "fa-inverse": v,
    "fa-border": E,
    "fa-li": w,
    "fa-flip": O === !0,
    "fa-flip-horizontal": O === "horizontal" || O === "both",
    "fa-flip-vertical": O === "vertical" || O === "both"
  }, Ye(t, "fa-".concat(A), typeof A < "u" && A !== null), Ye(t, "fa-rotate-".concat(_), typeof _ < "u" && _ !== null && _ !== 0), Ye(t, "fa-pull-".concat(b), typeof b < "u" && b !== null), Ye(t, "fa-swap-opacity", e.swapOpacity), t);
  return Object.keys(P).map(function(u) {
    return P[u] ? u : null;
  }).filter(function(u) {
    return u;
  });
}
function ll(e) {
  return e = e - 0, e === e;
}
function So(e) {
  return ll(e) ? e : (e = e.replace(/[\-_\s]+(.)?/g, function(t, n) {
    return n ? n.toUpperCase() : "";
  }), e.substr(0, 1).toLowerCase() + e.substr(1));
}
var fl = ["style"];
function ul(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function dl(e) {
  return e.split(";").map(function(t) {
    return t.trim();
  }).filter(function(t) {
    return t;
  }).reduce(function(t, n) {
    var r = n.indexOf(":"), a = So(n.slice(0, r)), o = n.slice(r + 1).trim();
    return a.startsWith("webkit") ? t[ul(a)] = o : t[a] = o, t;
  }, {});
}
function Eo(e, t) {
  var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof t == "string")
    return t;
  var r = (t.children || []).map(function(c) {
    return Eo(e, c);
  }), a = Object.keys(t.attributes || {}).reduce(function(c, l) {
    var f = t.attributes[l];
    switch (l) {
      case "class":
        c.attrs.className = f, delete t.attributes.class;
        break;
      case "style":
        c.attrs.style = dl(f);
        break;
      default:
        l.indexOf("aria-") === 0 || l.indexOf("data-") === 0 ? c.attrs[l.toLowerCase()] = f : c.attrs[So(l)] = f;
    }
    return c;
  }, {
    attrs: {}
  }), o = n.style, i = o === void 0 ? {} : o, s = rl(n, fl);
  return a.attrs.style = de(de({}, a.attrs.style), i), e.apply(void 0, [t.tag, de(de({}, a.attrs), s)].concat(Ln(r)));
}
var Ao = !1;
try {
  Ao = process.env.NODE_ENV === "production";
} catch {
}
function pl() {
  if (!Ao && console && typeof console.error == "function") {
    var e;
    (e = console).error.apply(e, arguments);
  }
}
function pa(e) {
  if (e && Mt(e) === "object" && e.prefix && e.iconName && e.icon)
    return e;
  if (jn.icon)
    return jn.icon(e);
  if (e === null)
    return null;
  if (e && Mt(e) === "object" && e.prefix && e.iconName)
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
function un(e, t) {
  return Array.isArray(t) && t.length > 0 || !Array.isArray(t) && t ? Ye({}, e, t) : {};
}
var ma = {
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
}, Dt = /* @__PURE__ */ De.forwardRef(function(e, t) {
  var n = de(de({}, ma), e), r = n.icon, a = n.mask, o = n.symbol, i = n.className, s = n.title, c = n.titleId, l = n.maskId, f = pa(r), p = un("classes", [].concat(Ln(cl(n)), Ln((i || "").split(" ")))), g = un("transform", typeof n.transform == "string" ? jn.transform(n.transform) : n.transform), v = un("mask", pa(a)), E = Bc(f, de(de(de(de({}, p), g), v), {}, {
    symbol: o,
    title: s,
    titleId: c,
    maskId: l
  }));
  if (!E)
    return pl("Could not find icon", f), null;
  var w = E.abstract, O = {
    ref: t
  };
  return Object.keys(n).forEach(function(A) {
    ma.hasOwnProperty(A) || (O[A] = n[A]);
  }), ml(w[0], O);
});
Dt.displayName = "FontAwesomeIcon";
Dt.propTypes = {
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
var ml = Eo.bind(null, De.createElement);
const hl = ({
  file: e,
  fileTypes: t
}) => {
  if (!e)
    return /* @__PURE__ */ ae("div", { className: "flex cursor-pointer items-center gap-3.5 rounded-lg border border-dashed border-[#363636] bg-brand-secondary p-3", children: [
      /* @__PURE__ */ H(Dt, { icon: Vi, className: "text-4xl" }),
      /* @__PURE__ */ ae("div", { className: "flex flex-col gap-0", children: [
        /* @__PURE__ */ ae("p", { className: "font-medium", children: [
          /* @__PURE__ */ H("u", { children: "Upload a file" }),
          " or drop it here"
        ] }),
        /* @__PURE__ */ ae("p", { className: "flex items-center gap-2 text-sm font-normal opacity-50", children: [
          t.join(", ").toString(),
          " supported"
        ] })
      ] })
    ] });
  const n = e.name.split(".")[0].toUpperCase(), r = e.size >= 1024 * 1024 ? (e.size / 1024 / 1024).toFixed(2) + " MB" : `${Math.floor(e.size / 1024)} KB`;
  return /* @__PURE__ */ ae("div", { className: "flex cursor-pointer items-center justify-between gap-3.5 rounded-lg border border-dashed border-[#363636] bg-brand-secondary p-3", children: [
    /* @__PURE__ */ H(Dt, { icon: qi, className: "text-4xl" }),
    /* @__PURE__ */ ae("div", { className: "flex grow flex-col gap-0", children: [
      /* @__PURE__ */ H("p", { className: "font-medium", children: e.name.slice(0, e.name.lastIndexOf(".")) }),
      /* @__PURE__ */ ae("p", { className: "flex items-center gap-2 text-sm font-normal", children: [
        /* @__PURE__ */ H("span", { className: "opacity-50", children: `${n} file size: ${r} ` }),
        /* @__PURE__ */ H("u", { className: "transition-all hover:text-white/80", children: "Change File" })
      ] })
    ] })
  ] });
}, vl = ({
  file: e,
  fileTypes: t,
  handleChange: n
}) => /* @__PURE__ */ H(
  Hi,
  {
    handleChange: n,
    name: "file",
    maxSize: 50,
    types: t,
    children: /* @__PURE__ */ H(hl, { file: e, fileTypes: t })
  }
);
export {
  vl as FileUploader
};
