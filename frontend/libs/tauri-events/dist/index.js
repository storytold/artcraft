import * as x from "react";
import { useEffect as E } from "react";
import "react/jsx-runtime";
var ye = /* @__PURE__ */ ((r) => (r.Success = "success", r.Failure = "failure", r))(ye || {});
function ge(r, u = !1) {
  return window.__TAURI_INTERNALS__.transformCallback(r, u);
}
async function ie(r, u = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(r, u, n);
}
var ee;
(function(r) {
  r.WINDOW_RESIZED = "tauri://resize", r.WINDOW_MOVED = "tauri://move", r.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", r.WINDOW_DESTROYED = "tauri://destroyed", r.WINDOW_FOCUS = "tauri://focus", r.WINDOW_BLUR = "tauri://blur", r.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", r.WINDOW_THEME_CHANGED = "tauri://theme-changed", r.WINDOW_CREATED = "tauri://window-created", r.WEBVIEW_CREATED = "tauri://webview-created", r.DRAG_ENTER = "tauri://drag-enter", r.DRAG_OVER = "tauri://drag-over", r.DRAG_DROP = "tauri://drag-drop", r.DRAG_LEAVE = "tauri://drag-leave";
})(ee || (ee = {}));
async function he(r, u) {
  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(r, u), await ie("plugin:event|unlisten", {
    event: r,
    eventId: u
  });
}
async function I(r, u, n) {
  var i;
  const a = (i = void 0) !== null && i !== void 0 ? i : { kind: "Any" };
  return ie("plugin:event|listen", {
    event: r,
    target: a,
    handler: ge(u)
  }).then((c) => async () => he(r, c));
}
const ve = "credits_balance_changed_event", yt = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(
        ve,
        async (a) => {
          await r(a.payload.data);
        }
      ), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
}, Ae = "image_edit_complete_event", gt = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(Ae, async (a) => {
        await r(a.payload.data);
      }), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
}, we = "image_to_video_generation_complete_event", ht = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(
        we,
        async (a) => {
          await r(a.payload.data);
        }
      ), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
}, be = "refresh_account_state_event", vt = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(be, async (a) => {
        await r(a.payload.data);
      }), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
}, xe = "show_provider_billing_modal_event", At = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(xe, async (a) => {
        await r(a.payload.data);
      }), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
}, Te = "show_provider_login_modal_event", wt = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(Te, async (a) => {
        await r(a.payload.data);
      }), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
}, Ee = "text_to_image_generation_complete_event", bt = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(Ee, async (a) => {
        await r(a.payload.data);
      }), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
}, Ie = "subscription_plan_changed_event", xt = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(
        Ie,
        async (a) => {
          await r(a.payload.data);
        }
      ), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
};
var se = (r) => {
  throw TypeError(r);
}, ue = (r, u, n) => u.has(r) || se("Cannot " + n), M = (r, u, n) => (ue(r, u, "read from private field"), n ? n.call(r) : u.get(r)), de = (r, u, n) => u.has(r) ? se("Cannot add the same private member more than once") : u instanceof WeakSet ? u.add(r) : u.set(r, n), te = (r, u, n, i) => (ue(r, u, "write to private field"), u.set(r, n), n), H = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, ne = {};
/*!
 *  howler.js v2.2.4
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */
var oe;
function Se() {
  return oe || (oe = 1, function(r) {
    (function() {
      var u = function() {
        this.init();
      };
      u.prototype = {
        /**
         * Initialize the global Howler object.
         * @return {Howler}
         */
        init: function() {
          var e = this || n;
          return e._counter = 1e3, e._html5AudioPool = [], e.html5PoolSize = 10, e._codecs = {}, e._howls = [], e._muted = !1, e._volume = 1, e._canPlayEvent = "canplaythrough", e._navigator = typeof window < "u" && window.navigator ? window.navigator : null, e.masterGain = null, e.noAudio = !1, e.usingWebAudio = !0, e.autoSuspend = !0, e.ctx = null, e.autoUnlock = !0, e._setup(), e;
        },
        /**
         * Get/set the global volume for all sounds.
         * @param  {Float} vol Volume from 0.0 to 1.0.
         * @return {Howler/Float}     Returns self or current volume.
         */
        volume: function(e) {
          var t = this || n;
          if (e = parseFloat(e), t.ctx || v(), typeof e < "u" && e >= 0 && e <= 1) {
            if (t._volume = e, t._muted)
              return t;
            t.usingWebAudio && t.masterGain.gain.setValueAtTime(e, n.ctx.currentTime);
            for (var o = 0; o < t._howls.length; o++)
              if (!t._howls[o]._webAudio)
                for (var s = t._howls[o]._getSoundIds(), l = 0; l < s.length; l++) {
                  var _ = t._howls[o]._soundById(s[l]);
                  _ && _._node && (_._node.volume = _._volume * e);
                }
            return t;
          }
          return t._volume;
        },
        /**
         * Handle muting and unmuting globally.
         * @param  {Boolean} muted Is muted or not.
         */
        mute: function(e) {
          var t = this || n;
          t.ctx || v(), t._muted = e, t.usingWebAudio && t.masterGain.gain.setValueAtTime(e ? 0 : t._volume, n.ctx.currentTime);
          for (var o = 0; o < t._howls.length; o++)
            if (!t._howls[o]._webAudio)
              for (var s = t._howls[o]._getSoundIds(), l = 0; l < s.length; l++) {
                var _ = t._howls[o]._soundById(s[l]);
                _ && _._node && (_._node.muted = e ? !0 : _._muted);
              }
          return t;
        },
        /**
         * Handle stopping all sounds globally.
         */
        stop: function() {
          for (var e = this || n, t = 0; t < e._howls.length; t++)
            e._howls[t].stop();
          return e;
        },
        /**
         * Unload and destroy all currently loaded Howl objects.
         * @return {Howler}
         */
        unload: function() {
          for (var e = this || n, t = e._howls.length - 1; t >= 0; t--)
            e._howls[t].unload();
          return e.usingWebAudio && e.ctx && typeof e.ctx.close < "u" && (e.ctx.close(), e.ctx = null, v()), e;
        },
        /**
         * Check for codec support of specific extension.
         * @param  {String} ext Audio file extention.
         * @return {Boolean}
         */
        codecs: function(e) {
          return (this || n)._codecs[e.replace(/^x-/, "")];
        },
        /**
         * Setup various state values for global tracking.
         * @return {Howler}
         */
        _setup: function() {
          var e = this || n;
          if (e.state = e.ctx && e.ctx.state || "suspended", e._autoSuspend(), !e.usingWebAudio)
            if (typeof Audio < "u")
              try {
                var t = new Audio();
                typeof t.oncanplaythrough > "u" && (e._canPlayEvent = "canplay");
              } catch {
                e.noAudio = !0;
              }
            else
              e.noAudio = !0;
          try {
            var t = new Audio();
            t.muted && (e.noAudio = !0);
          } catch {
          }
          return e.noAudio || e._setupCodecs(), e;
        },
        /**
         * Check for browser support for various codecs and cache the results.
         * @return {Howler}
         */
        _setupCodecs: function() {
          var e = this || n, t = null;
          try {
            t = typeof Audio < "u" ? new Audio() : null;
          } catch {
            return e;
          }
          if (!t || typeof t.canPlayType != "function")
            return e;
          var o = t.canPlayType("audio/mpeg;").replace(/^no$/, ""), s = e._navigator ? e._navigator.userAgent : "", l = s.match(/OPR\/(\d+)/g), _ = l && parseInt(l[0].split("/")[1], 10) < 33, d = s.indexOf("Safari") !== -1 && s.indexOf("Chrome") === -1, g = s.match(/Version\/(.*?) /), h = d && g && parseInt(g[1], 10) < 15;
          return e._codecs = {
            mp3: !!(!_ && (o || t.canPlayType("audio/mp3;").replace(/^no$/, ""))),
            mpeg: !!o,
            opus: !!t.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
            ogg: !!t.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            oga: !!t.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            wav: !!(t.canPlayType('audio/wav; codecs="1"') || t.canPlayType("audio/wav")).replace(/^no$/, ""),
            aac: !!t.canPlayType("audio/aac;").replace(/^no$/, ""),
            caf: !!t.canPlayType("audio/x-caf;").replace(/^no$/, ""),
            m4a: !!(t.canPlayType("audio/x-m4a;") || t.canPlayType("audio/m4a;") || t.canPlayType("audio/aac;")).replace(/^no$/, ""),
            m4b: !!(t.canPlayType("audio/x-m4b;") || t.canPlayType("audio/m4b;") || t.canPlayType("audio/aac;")).replace(/^no$/, ""),
            mp4: !!(t.canPlayType("audio/x-mp4;") || t.canPlayType("audio/mp4;") || t.canPlayType("audio/aac;")).replace(/^no$/, ""),
            weba: !!(!h && t.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            webm: !!(!h && t.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            dolby: !!t.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ""),
            flac: !!(t.canPlayType("audio/x-flac;") || t.canPlayType("audio/flac;")).replace(/^no$/, "")
          }, e;
        },
        /**
         * Some browsers/devices will only allow audio to be played after a user interaction.
         * Attempt to automatically unlock audio on the first user interaction.
         * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
         * @return {Howler}
         */
        _unlockAudio: function() {
          var e = this || n;
          if (!(e._audioUnlocked || !e.ctx)) {
            e._audioUnlocked = !1, e.autoUnlock = !1, !e._mobileUnloaded && e.ctx.sampleRate !== 44100 && (e._mobileUnloaded = !0, e.unload()), e._scratchBuffer = e.ctx.createBuffer(1, 1, 22050);
            var t = function(o) {
              for (; e._html5AudioPool.length < e.html5PoolSize; )
                try {
                  var s = new Audio();
                  s._unlocked = !0, e._releaseHtml5Audio(s);
                } catch {
                  e.noAudio = !0;
                  break;
                }
              for (var l = 0; l < e._howls.length; l++)
                if (!e._howls[l]._webAudio)
                  for (var _ = e._howls[l]._getSoundIds(), d = 0; d < _.length; d++) {
                    var g = e._howls[l]._soundById(_[d]);
                    g && g._node && !g._node._unlocked && (g._node._unlocked = !0, g._node.load());
                  }
              e._autoResume();
              var h = e.ctx.createBufferSource();
              h.buffer = e._scratchBuffer, h.connect(e.ctx.destination), typeof h.start > "u" ? h.noteOn(0) : h.start(0), typeof e.ctx.resume == "function" && e.ctx.resume(), h.onended = function() {
                h.disconnect(0), e._audioUnlocked = !0, document.removeEventListener("touchstart", t, !0), document.removeEventListener("touchend", t, !0), document.removeEventListener("click", t, !0), document.removeEventListener("keydown", t, !0);
                for (var w = 0; w < e._howls.length; w++)
                  e._howls[w]._emit("unlock");
              };
            };
            return document.addEventListener("touchstart", t, !0), document.addEventListener("touchend", t, !0), document.addEventListener("click", t, !0), document.addEventListener("keydown", t, !0), e;
          }
        },
        /**
         * Get an unlocked HTML5 Audio object from the pool. If none are left,
         * return a new Audio object and throw a warning.
         * @return {Audio} HTML5 Audio object.
         */
        _obtainHtml5Audio: function() {
          var e = this || n;
          if (e._html5AudioPool.length)
            return e._html5AudioPool.pop();
          var t = new Audio().play();
          return t && typeof Promise < "u" && (t instanceof Promise || typeof t.then == "function") && t.catch(function() {
            console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.");
          }), new Audio();
        },
        /**
         * Return an activated HTML5 Audio object to the pool.
         * @return {Howler}
         */
        _releaseHtml5Audio: function(e) {
          var t = this || n;
          return e._unlocked && t._html5AudioPool.push(e), t;
        },
        /**
         * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
         * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
         * @return {Howler}
         */
        _autoSuspend: function() {
          var e = this;
          if (!(!e.autoSuspend || !e.ctx || typeof e.ctx.suspend > "u" || !n.usingWebAudio)) {
            for (var t = 0; t < e._howls.length; t++)
              if (e._howls[t]._webAudio) {
                for (var o = 0; o < e._howls[t]._sounds.length; o++)
                  if (!e._howls[t]._sounds[o]._paused)
                    return e;
              }
            return e._suspendTimer && clearTimeout(e._suspendTimer), e._suspendTimer = setTimeout(function() {
              if (e.autoSuspend) {
                e._suspendTimer = null, e.state = "suspending";
                var s = function() {
                  e.state = "suspended", e._resumeAfterSuspend && (delete e._resumeAfterSuspend, e._autoResume());
                };
                e.ctx.suspend().then(s, s);
              }
            }, 3e4), e;
          }
        },
        /**
         * Automatically resume the Web Audio AudioContext when a new sound is played.
         * @return {Howler}
         */
        _autoResume: function() {
          var e = this;
          if (!(!e.ctx || typeof e.ctx.resume > "u" || !n.usingWebAudio))
            return e.state === "running" && e.ctx.state !== "interrupted" && e._suspendTimer ? (clearTimeout(e._suspendTimer), e._suspendTimer = null) : e.state === "suspended" || e.state === "running" && e.ctx.state === "interrupted" ? (e.ctx.resume().then(function() {
              e.state = "running";
              for (var t = 0; t < e._howls.length; t++)
                e._howls[t]._emit("resume");
            }), e._suspendTimer && (clearTimeout(e._suspendTimer), e._suspendTimer = null)) : e.state === "suspending" && (e._resumeAfterSuspend = !0), e;
        }
      };
      var n = new u(), i = function(e) {
        var t = this;
        if (!e.src || e.src.length === 0) {
          console.error("An array of source files must be passed with any new Howl.");
          return;
        }
        t.init(e);
      };
      i.prototype = {
        /**
         * Initialize a new Howl group object.
         * @param  {Object} o Passed in properties for this group.
         * @return {Howl}
         */
        init: function(e) {
          var t = this;
          return n.ctx || v(), t._autoplay = e.autoplay || !1, t._format = typeof e.format != "string" ? e.format : [e.format], t._html5 = e.html5 || !1, t._muted = e.mute || !1, t._loop = e.loop || !1, t._pool = e.pool || 5, t._preload = typeof e.preload == "boolean" || e.preload === "metadata" ? e.preload : !0, t._rate = e.rate || 1, t._sprite = e.sprite || {}, t._src = typeof e.src != "string" ? e.src : [e.src], t._volume = e.volume !== void 0 ? e.volume : 1, t._xhr = {
            method: e.xhr && e.xhr.method ? e.xhr.method : "GET",
            headers: e.xhr && e.xhr.headers ? e.xhr.headers : null,
            withCredentials: e.xhr && e.xhr.withCredentials ? e.xhr.withCredentials : !1
          }, t._duration = 0, t._state = "unloaded", t._sounds = [], t._endTimers = {}, t._queue = [], t._playLock = !1, t._onend = e.onend ? [{ fn: e.onend }] : [], t._onfade = e.onfade ? [{ fn: e.onfade }] : [], t._onload = e.onload ? [{ fn: e.onload }] : [], t._onloaderror = e.onloaderror ? [{ fn: e.onloaderror }] : [], t._onplayerror = e.onplayerror ? [{ fn: e.onplayerror }] : [], t._onpause = e.onpause ? [{ fn: e.onpause }] : [], t._onplay = e.onplay ? [{ fn: e.onplay }] : [], t._onstop = e.onstop ? [{ fn: e.onstop }] : [], t._onmute = e.onmute ? [{ fn: e.onmute }] : [], t._onvolume = e.onvolume ? [{ fn: e.onvolume }] : [], t._onrate = e.onrate ? [{ fn: e.onrate }] : [], t._onseek = e.onseek ? [{ fn: e.onseek }] : [], t._onunlock = e.onunlock ? [{ fn: e.onunlock }] : [], t._onresume = [], t._webAudio = n.usingWebAudio && !t._html5, typeof n.ctx < "u" && n.ctx && n.autoUnlock && n._unlockAudio(), n._howls.push(t), t._autoplay && t._queue.push({
            event: "play",
            action: function() {
              t.play();
            }
          }), t._preload && t._preload !== "none" && t.load(), t;
        },
        /**
         * Load the audio file.
         * @return {Howler}
         */
        load: function() {
          var e = this, t = null;
          if (n.noAudio) {
            e._emit("loaderror", null, "No audio support.");
            return;
          }
          typeof e._src == "string" && (e._src = [e._src]);
          for (var o = 0; o < e._src.length; o++) {
            var s, l;
            if (e._format && e._format[o])
              s = e._format[o];
            else {
              if (l = e._src[o], typeof l != "string") {
                e._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                continue;
              }
              s = /^data:audio\/([^;,]+);/i.exec(l), s || (s = /\.([^.]+)$/.exec(l.split("?", 1)[0])), s && (s = s[1].toLowerCase());
            }
            if (s || console.warn('No file extension was found. Consider using the "format" property or specify an extension.'), s && n.codecs(s)) {
              t = e._src[o];
              break;
            }
          }
          if (!t) {
            e._emit("loaderror", null, "No codec support for selected audio sources.");
            return;
          }
          return e._src = t, e._state = "loading", window.location.protocol === "https:" && t.slice(0, 5) === "http:" && (e._html5 = !0, e._webAudio = !1), new a(e), e._webAudio && p(e), e;
        },
        /**
         * Play a sound or resume previous playback.
         * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Number}          Sound ID.
         */
        play: function(e, t) {
          var o = this, s = null;
          if (typeof e == "number")
            s = e, e = null;
          else {
            if (typeof e == "string" && o._state === "loaded" && !o._sprite[e])
              return null;
            if (typeof e > "u" && (e = "__default", !o._playLock)) {
              for (var l = 0, _ = 0; _ < o._sounds.length; _++)
                o._sounds[_]._paused && !o._sounds[_]._ended && (l++, s = o._sounds[_]._id);
              l === 1 ? e = null : s = null;
            }
          }
          var d = s ? o._soundById(s) : o._inactiveSound();
          if (!d)
            return null;
          if (s && !e && (e = d._sprite || "__default"), o._state !== "loaded") {
            d._sprite = e, d._ended = !1;
            var g = d._id;
            return o._queue.push({
              event: "play",
              action: function() {
                o.play(g);
              }
            }), g;
          }
          if (s && !d._paused)
            return t || o._loadQueue("play"), d._id;
          o._webAudio && n._autoResume();
          var h = Math.max(0, d._seek > 0 ? d._seek : o._sprite[e][0] / 1e3), w = Math.max(0, (o._sprite[e][0] + o._sprite[e][1]) / 1e3 - h), S = w * 1e3 / Math.abs(d._rate), L = o._sprite[e][0] / 1e3, V = (o._sprite[e][0] + o._sprite[e][1]) / 1e3;
          d._sprite = e, d._ended = !1;
          var U = function() {
            d._paused = !1, d._seek = h, d._start = L, d._stop = V, d._loop = !!(d._loop || o._sprite[e][2]);
          };
          if (h >= V) {
            o._ended(d);
            return;
          }
          var A = d._node;
          if (o._webAudio) {
            var z = function() {
              o._playLock = !1, U(), o._refreshBuffer(d);
              var F = d._muted || o._muted ? 0 : d._volume;
              A.gain.setValueAtTime(F, n.ctx.currentTime), d._playStart = n.ctx.currentTime, typeof A.bufferSource.start > "u" ? d._loop ? A.bufferSource.noteGrainOn(0, h, 86400) : A.bufferSource.noteGrainOn(0, h, w) : d._loop ? A.bufferSource.start(0, h, 86400) : A.bufferSource.start(0, h, w), S !== 1 / 0 && (o._endTimers[d._id] = setTimeout(o._ended.bind(o, d), S)), t || setTimeout(function() {
                o._emit("play", d._id), o._loadQueue();
              }, 0);
            };
            n.state === "running" && n.ctx.state !== "interrupted" ? z() : (o._playLock = !0, o.once("resume", z), o._clearTimer(d._id));
          } else {
            var K = function() {
              A.currentTime = h, A.muted = d._muted || o._muted || n._muted || A.muted, A.volume = d._volume * n.volume(), A.playbackRate = d._rate;
              try {
                var F = A.play();
                if (F && typeof Promise < "u" && (F instanceof Promise || typeof F.then == "function") ? (o._playLock = !0, U(), F.then(function() {
                  o._playLock = !1, A._unlocked = !0, t ? o._loadQueue() : o._emit("play", d._id);
                }).catch(function() {
                  o._playLock = !1, o._emit("playerror", d._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."), d._ended = !0, d._paused = !0;
                })) : t || (o._playLock = !1, U(), o._emit("play", d._id)), A.playbackRate = d._rate, A.paused) {
                  o._emit("playerror", d._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");
                  return;
                }
                e !== "__default" || d._loop ? o._endTimers[d._id] = setTimeout(o._ended.bind(o, d), S) : (o._endTimers[d._id] = function() {
                  o._ended(d), A.removeEventListener("ended", o._endTimers[d._id], !1);
                }, A.addEventListener("ended", o._endTimers[d._id], !1));
              } catch (me) {
                o._emit("playerror", d._id, me);
              }
            };
            A.src === "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" && (A.src = o._src, A.load());
            var fe = window && window.ejecta || !A.readyState && n._navigator.isCocoonJS;
            if (A.readyState >= 3 || fe)
              K();
            else {
              o._playLock = !0, o._state = "loading";
              var J = function() {
                o._state = "loaded", K(), A.removeEventListener(n._canPlayEvent, J, !1);
              };
              A.addEventListener(n._canPlayEvent, J, !1), o._clearTimer(d._id);
            }
          }
          return d._id;
        },
        /**
         * Pause playback and save current position.
         * @param  {Number} id The sound ID (empty to pause all in group).
         * @return {Howl}
         */
        pause: function(e) {
          var t = this;
          if (t._state !== "loaded" || t._playLock)
            return t._queue.push({
              event: "pause",
              action: function() {
                t.pause(e);
              }
            }), t;
          for (var o = t._getSoundIds(e), s = 0; s < o.length; s++) {
            t._clearTimer(o[s]);
            var l = t._soundById(o[s]);
            if (l && !l._paused && (l._seek = t.seek(o[s]), l._rateSeek = 0, l._paused = !0, t._stopFade(o[s]), l._node))
              if (t._webAudio) {
                if (!l._node.bufferSource)
                  continue;
                typeof l._node.bufferSource.stop > "u" ? l._node.bufferSource.noteOff(0) : l._node.bufferSource.stop(0), t._cleanBuffer(l._node);
              } else (!isNaN(l._node.duration) || l._node.duration === 1 / 0) && l._node.pause();
            arguments[1] || t._emit("pause", l ? l._id : null);
          }
          return t;
        },
        /**
         * Stop playback and reset to start.
         * @param  {Number} id The sound ID (empty to stop all in group).
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Howl}
         */
        stop: function(e, t) {
          var o = this;
          if (o._state !== "loaded" || o._playLock)
            return o._queue.push({
              event: "stop",
              action: function() {
                o.stop(e);
              }
            }), o;
          for (var s = o._getSoundIds(e), l = 0; l < s.length; l++) {
            o._clearTimer(s[l]);
            var _ = o._soundById(s[l]);
            _ && (_._seek = _._start || 0, _._rateSeek = 0, _._paused = !0, _._ended = !0, o._stopFade(s[l]), _._node && (o._webAudio ? _._node.bufferSource && (typeof _._node.bufferSource.stop > "u" ? _._node.bufferSource.noteOff(0) : _._node.bufferSource.stop(0), o._cleanBuffer(_._node)) : (!isNaN(_._node.duration) || _._node.duration === 1 / 0) && (_._node.currentTime = _._start || 0, _._node.pause(), _._node.duration === 1 / 0 && o._clearSound(_._node))), t || o._emit("stop", _._id));
          }
          return o;
        },
        /**
         * Mute/unmute a single sound or all sounds in this Howl group.
         * @param  {Boolean} muted Set to true to mute and false to unmute.
         * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
         * @return {Howl}
         */
        mute: function(e, t) {
          var o = this;
          if (o._state !== "loaded" || o._playLock)
            return o._queue.push({
              event: "mute",
              action: function() {
                o.mute(e, t);
              }
            }), o;
          if (typeof t > "u")
            if (typeof e == "boolean")
              o._muted = e;
            else
              return o._muted;
          for (var s = o._getSoundIds(t), l = 0; l < s.length; l++) {
            var _ = o._soundById(s[l]);
            _ && (_._muted = e, _._interval && o._stopFade(_._id), o._webAudio && _._node ? _._node.gain.setValueAtTime(e ? 0 : _._volume, n.ctx.currentTime) : _._node && (_._node.muted = n._muted ? !0 : e), o._emit("mute", _._id));
          }
          return o;
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
          var e = this, t = arguments, o, s;
          if (t.length === 0)
            return e._volume;
          if (t.length === 1 || t.length === 2 && typeof t[1] > "u") {
            var l = e._getSoundIds(), _ = l.indexOf(t[0]);
            _ >= 0 ? s = parseInt(t[0], 10) : o = parseFloat(t[0]);
          } else t.length >= 2 && (o = parseFloat(t[0]), s = parseInt(t[1], 10));
          var d;
          if (typeof o < "u" && o >= 0 && o <= 1) {
            if (e._state !== "loaded" || e._playLock)
              return e._queue.push({
                event: "volume",
                action: function() {
                  e.volume.apply(e, t);
                }
              }), e;
            typeof s > "u" && (e._volume = o), s = e._getSoundIds(s);
            for (var g = 0; g < s.length; g++)
              d = e._soundById(s[g]), d && (d._volume = o, t[2] || e._stopFade(s[g]), e._webAudio && d._node && !d._muted ? d._node.gain.setValueAtTime(o, n.ctx.currentTime) : d._node && !d._muted && (d._node.volume = o * n.volume()), e._emit("volume", d._id));
          } else
            return d = s ? e._soundById(s) : e._sounds[0], d ? d._volume : 0;
          return e;
        },
        /**
         * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id (omit to fade all sounds).
         * @return {Howl}
         */
        fade: function(e, t, o, s) {
          var l = this;
          if (l._state !== "loaded" || l._playLock)
            return l._queue.push({
              event: "fade",
              action: function() {
                l.fade(e, t, o, s);
              }
            }), l;
          e = Math.min(Math.max(0, parseFloat(e)), 1), t = Math.min(Math.max(0, parseFloat(t)), 1), o = parseFloat(o), l.volume(e, s);
          for (var _ = l._getSoundIds(s), d = 0; d < _.length; d++) {
            var g = l._soundById(_[d]);
            if (g) {
              if (s || l._stopFade(_[d]), l._webAudio && !g._muted) {
                var h = n.ctx.currentTime, w = h + o / 1e3;
                g._volume = e, g._node.gain.setValueAtTime(e, h), g._node.gain.linearRampToValueAtTime(t, w);
              }
              l._startFadeInterval(g, e, t, o, _[d], typeof s > "u");
            }
          }
          return l;
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
        _startFadeInterval: function(e, t, o, s, l, _) {
          var d = this, g = t, h = o - t, w = Math.abs(h / 0.01), S = Math.max(4, w > 0 ? s / w : s), L = Date.now();
          e._fadeTo = o, e._interval = setInterval(function() {
            var V = (Date.now() - L) / s;
            L = Date.now(), g += h * V, g = Math.round(g * 100) / 100, h < 0 ? g = Math.max(o, g) : g = Math.min(o, g), d._webAudio ? e._volume = g : d.volume(g, e._id, !0), _ && (d._volume = g), (o < t && g <= o || o > t && g >= o) && (clearInterval(e._interval), e._interval = null, e._fadeTo = null, d.volume(o, e._id), d._emit("fade", e._id));
          }, S);
        },
        /**
         * Internal method that stops the currently playing fade when
         * a new fade starts, volume is changed or the sound is stopped.
         * @param  {Number} id The sound id.
         * @return {Howl}
         */
        _stopFade: function(e) {
          var t = this, o = t._soundById(e);
          return o && o._interval && (t._webAudio && o._node.gain.cancelScheduledValues(n.ctx.currentTime), clearInterval(o._interval), o._interval = null, t.volume(o._fadeTo, e), o._fadeTo = null, t._emit("fade", e)), t;
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
          var e = this, t = arguments, o, s, l;
          if (t.length === 0)
            return e._loop;
          if (t.length === 1)
            if (typeof t[0] == "boolean")
              o = t[0], e._loop = o;
            else
              return l = e._soundById(parseInt(t[0], 10)), l ? l._loop : !1;
          else t.length === 2 && (o = t[0], s = parseInt(t[1], 10));
          for (var _ = e._getSoundIds(s), d = 0; d < _.length; d++)
            l = e._soundById(_[d]), l && (l._loop = o, e._webAudio && l._node && l._node.bufferSource && (l._node.bufferSource.loop = o, o && (l._node.bufferSource.loopStart = l._start || 0, l._node.bufferSource.loopEnd = l._stop, e.playing(_[d]) && (e.pause(_[d], !0), e.play(_[d], !0)))));
          return e;
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
          var e = this, t = arguments, o, s;
          if (t.length === 0)
            s = e._sounds[0]._id;
          else if (t.length === 1) {
            var l = e._getSoundIds(), _ = l.indexOf(t[0]);
            _ >= 0 ? s = parseInt(t[0], 10) : o = parseFloat(t[0]);
          } else t.length === 2 && (o = parseFloat(t[0]), s = parseInt(t[1], 10));
          var d;
          if (typeof o == "number") {
            if (e._state !== "loaded" || e._playLock)
              return e._queue.push({
                event: "rate",
                action: function() {
                  e.rate.apply(e, t);
                }
              }), e;
            typeof s > "u" && (e._rate = o), s = e._getSoundIds(s);
            for (var g = 0; g < s.length; g++)
              if (d = e._soundById(s[g]), d) {
                e.playing(s[g]) && (d._rateSeek = e.seek(s[g]), d._playStart = e._webAudio ? n.ctx.currentTime : d._playStart), d._rate = o, e._webAudio && d._node && d._node.bufferSource ? d._node.bufferSource.playbackRate.setValueAtTime(o, n.ctx.currentTime) : d._node && (d._node.playbackRate = o);
                var h = e.seek(s[g]), w = (e._sprite[d._sprite][0] + e._sprite[d._sprite][1]) / 1e3 - h, S = w * 1e3 / Math.abs(d._rate);
                (e._endTimers[s[g]] || !d._paused) && (e._clearTimer(s[g]), e._endTimers[s[g]] = setTimeout(e._ended.bind(e, d), S)), e._emit("rate", d._id);
              }
          } else
            return d = e._soundById(s), d ? d._rate : e._rate;
          return e;
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
          var e = this, t = arguments, o, s;
          if (t.length === 0)
            e._sounds.length && (s = e._sounds[0]._id);
          else if (t.length === 1) {
            var l = e._getSoundIds(), _ = l.indexOf(t[0]);
            _ >= 0 ? s = parseInt(t[0], 10) : e._sounds.length && (s = e._sounds[0]._id, o = parseFloat(t[0]));
          } else t.length === 2 && (o = parseFloat(t[0]), s = parseInt(t[1], 10));
          if (typeof s > "u")
            return 0;
          if (typeof o == "number" && (e._state !== "loaded" || e._playLock))
            return e._queue.push({
              event: "seek",
              action: function() {
                e.seek.apply(e, t);
              }
            }), e;
          var d = e._soundById(s);
          if (d)
            if (typeof o == "number" && o >= 0) {
              var g = e.playing(s);
              g && e.pause(s, !0), d._seek = o, d._ended = !1, e._clearTimer(s), !e._webAudio && d._node && !isNaN(d._node.duration) && (d._node.currentTime = o);
              var h = function() {
                g && e.play(s, !0), e._emit("seek", s);
              };
              if (g && !e._webAudio) {
                var w = function() {
                  e._playLock ? setTimeout(w, 0) : h();
                };
                setTimeout(w, 0);
              } else
                h();
            } else if (e._webAudio) {
              var S = e.playing(s) ? n.ctx.currentTime - d._playStart : 0, L = d._rateSeek ? d._rateSeek - d._seek : 0;
              return d._seek + (L + S * Math.abs(d._rate));
            } else
              return d._node.currentTime;
          return e;
        },
        /**
         * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
         * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
         * @return {Boolean} True if playing and false if not.
         */
        playing: function(e) {
          var t = this;
          if (typeof e == "number") {
            var o = t._soundById(e);
            return o ? !o._paused : !1;
          }
          for (var s = 0; s < t._sounds.length; s++)
            if (!t._sounds[s]._paused)
              return !0;
          return !1;
        },
        /**
         * Get the duration of this sound. Passing a sound id will return the sprite duration.
         * @param  {Number} id The sound id to check. If none is passed, return full source duration.
         * @return {Number} Audio duration in seconds.
         */
        duration: function(e) {
          var t = this, o = t._duration, s = t._soundById(e);
          return s && (o = t._sprite[s._sprite][1] / 1e3), o;
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
          for (var e = this, t = e._sounds, o = 0; o < t.length; o++)
            t[o]._paused || e.stop(t[o]._id), e._webAudio || (e._clearSound(t[o]._node), t[o]._node.removeEventListener("error", t[o]._errorFn, !1), t[o]._node.removeEventListener(n._canPlayEvent, t[o]._loadFn, !1), t[o]._node.removeEventListener("ended", t[o]._endFn, !1), n._releaseHtml5Audio(t[o]._node)), delete t[o]._node, e._clearTimer(t[o]._id);
          var s = n._howls.indexOf(e);
          s >= 0 && n._howls.splice(s, 1);
          var l = !0;
          for (o = 0; o < n._howls.length; o++)
            if (n._howls[o]._src === e._src || e._src.indexOf(n._howls[o]._src) >= 0) {
              l = !1;
              break;
            }
          return c && l && delete c[e._src], n.noAudio = !1, e._state = "unloaded", e._sounds = [], e = null, null;
        },
        /**
         * Listen to a custom event.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
         * @return {Howl}
         */
        on: function(e, t, o, s) {
          var l = this, _ = l["_on" + e];
          return typeof t == "function" && _.push(s ? { id: o, fn: t, once: s } : { id: o, fn: t }), l;
        },
        /**
         * Remove a custom event. Call without parameters to remove all events.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to remove. Leave empty to remove all.
         * @param  {Number}   id    (optional) Only remove events for this sound.
         * @return {Howl}
         */
        off: function(e, t, o) {
          var s = this, l = s["_on" + e], _ = 0;
          if (typeof t == "number" && (o = t, t = null), t || o)
            for (_ = 0; _ < l.length; _++) {
              var d = o === l[_].id;
              if (t === l[_].fn && d || !t && d) {
                l.splice(_, 1);
                break;
              }
            }
          else if (e)
            s["_on" + e] = [];
          else {
            var g = Object.keys(s);
            for (_ = 0; _ < g.length; _++)
              g[_].indexOf("_on") === 0 && Array.isArray(s[g[_]]) && (s[g[_]] = []);
          }
          return s;
        },
        /**
         * Listen to a custom event and remove it once fired.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @return {Howl}
         */
        once: function(e, t, o) {
          var s = this;
          return s.on(e, t, o, 1), s;
        },
        /**
         * Emit all events of a specific type and pass the sound id.
         * @param  {String} event Event name.
         * @param  {Number} id    Sound ID.
         * @param  {Number} msg   Message to go with event.
         * @return {Howl}
         */
        _emit: function(e, t, o) {
          for (var s = this, l = s["_on" + e], _ = l.length - 1; _ >= 0; _--)
            (!l[_].id || l[_].id === t || e === "load") && (setTimeout((function(d) {
              d.call(this, t, o);
            }).bind(s, l[_].fn), 0), l[_].once && s.off(e, l[_].fn, l[_].id));
          return s._loadQueue(e), s;
        },
        /**
         * Queue of actions initiated before the sound has loaded.
         * These will be called in sequence, with the next only firing
         * after the previous has finished executing (even if async like play).
         * @return {Howl}
         */
        _loadQueue: function(e) {
          var t = this;
          if (t._queue.length > 0) {
            var o = t._queue[0];
            o.event === e && (t._queue.shift(), t._loadQueue()), e || o.action();
          }
          return t;
        },
        /**
         * Fired when playback ends at the end of the duration.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _ended: function(e) {
          var t = this, o = e._sprite;
          if (!t._webAudio && e._node && !e._node.paused && !e._node.ended && e._node.currentTime < e._stop)
            return setTimeout(t._ended.bind(t, e), 100), t;
          var s = !!(e._loop || t._sprite[o][2]);
          if (t._emit("end", e._id), !t._webAudio && s && t.stop(e._id, !0).play(e._id), t._webAudio && s) {
            t._emit("play", e._id), e._seek = e._start || 0, e._rateSeek = 0, e._playStart = n.ctx.currentTime;
            var l = (e._stop - e._start) * 1e3 / Math.abs(e._rate);
            t._endTimers[e._id] = setTimeout(t._ended.bind(t, e), l);
          }
          return t._webAudio && !s && (e._paused = !0, e._ended = !0, e._seek = e._start || 0, e._rateSeek = 0, t._clearTimer(e._id), t._cleanBuffer(e._node), n._autoSuspend()), !t._webAudio && !s && t.stop(e._id, !0), t;
        },
        /**
         * Clear the end timer for a sound playback.
         * @param  {Number} id The sound ID.
         * @return {Howl}
         */
        _clearTimer: function(e) {
          var t = this;
          if (t._endTimers[e]) {
            if (typeof t._endTimers[e] != "function")
              clearTimeout(t._endTimers[e]);
            else {
              var o = t._soundById(e);
              o && o._node && o._node.removeEventListener("ended", t._endTimers[e], !1);
            }
            delete t._endTimers[e];
          }
          return t;
        },
        /**
         * Return the sound identified by this ID, or return null.
         * @param  {Number} id Sound ID
         * @return {Object}    Sound object or null.
         */
        _soundById: function(e) {
          for (var t = this, o = 0; o < t._sounds.length; o++)
            if (e === t._sounds[o]._id)
              return t._sounds[o];
          return null;
        },
        /**
         * Return an inactive sound from the pool or create a new one.
         * @return {Sound} Sound playback object.
         */
        _inactiveSound: function() {
          var e = this;
          e._drain();
          for (var t = 0; t < e._sounds.length; t++)
            if (e._sounds[t]._ended)
              return e._sounds[t].reset();
          return new a(e);
        },
        /**
         * Drain excess inactive sounds from the pool.
         */
        _drain: function() {
          var e = this, t = e._pool, o = 0, s = 0;
          if (!(e._sounds.length < t)) {
            for (s = 0; s < e._sounds.length; s++)
              e._sounds[s]._ended && o++;
            for (s = e._sounds.length - 1; s >= 0; s--) {
              if (o <= t)
                return;
              e._sounds[s]._ended && (e._webAudio && e._sounds[s]._node && e._sounds[s]._node.disconnect(0), e._sounds.splice(s, 1), o--);
            }
          }
        },
        /**
         * Get all ID's from the sounds pool.
         * @param  {Number} id Only return one ID if one is passed.
         * @return {Array}    Array of IDs.
         */
        _getSoundIds: function(e) {
          var t = this;
          if (typeof e > "u") {
            for (var o = [], s = 0; s < t._sounds.length; s++)
              o.push(t._sounds[s]._id);
            return o;
          } else
            return [e];
        },
        /**
         * Load the sound back into the buffer source.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _refreshBuffer: function(e) {
          var t = this;
          return e._node.bufferSource = n.ctx.createBufferSource(), e._node.bufferSource.buffer = c[t._src], e._panner ? e._node.bufferSource.connect(e._panner) : e._node.bufferSource.connect(e._node), e._node.bufferSource.loop = e._loop, e._loop && (e._node.bufferSource.loopStart = e._start || 0, e._node.bufferSource.loopEnd = e._stop || 0), e._node.bufferSource.playbackRate.setValueAtTime(e._rate, n.ctx.currentTime), t;
        },
        /**
         * Prevent memory leaks by cleaning up the buffer source after playback.
         * @param  {Object} node Sound's audio node containing the buffer source.
         * @return {Howl}
         */
        _cleanBuffer: function(e) {
          var t = this, o = n._navigator && n._navigator.vendor.indexOf("Apple") >= 0;
          if (!e.bufferSource)
            return t;
          if (n._scratchBuffer && e.bufferSource && (e.bufferSource.onended = null, e.bufferSource.disconnect(0), o))
            try {
              e.bufferSource.buffer = n._scratchBuffer;
            } catch {
            }
          return e.bufferSource = null, t;
        },
        /**
         * Set the source to a 0-second silence to stop any downloading (except in IE).
         * @param  {Object} node Audio node to clear.
         */
        _clearSound: function(e) {
          var t = /MSIE |Trident\//.test(n._navigator && n._navigator.userAgent);
          t || (e.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        }
      };
      var a = function(e) {
        this._parent = e, this.init();
      };
      a.prototype = {
        /**
         * Initialize a new Sound object.
         * @return {Sound}
         */
        init: function() {
          var e = this, t = e._parent;
          return e._muted = t._muted, e._loop = t._loop, e._volume = t._volume, e._rate = t._rate, e._seek = 0, e._paused = !0, e._ended = !0, e._sprite = "__default", e._id = ++n._counter, t._sounds.push(e), e.create(), e;
        },
        /**
         * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
         * @return {Sound}
         */
        create: function() {
          var e = this, t = e._parent, o = n._muted || e._muted || e._parent._muted ? 0 : e._volume;
          return t._webAudio ? (e._node = typeof n.ctx.createGain > "u" ? n.ctx.createGainNode() : n.ctx.createGain(), e._node.gain.setValueAtTime(o, n.ctx.currentTime), e._node.paused = !0, e._node.connect(n.masterGain)) : n.noAudio || (e._node = n._obtainHtml5Audio(), e._errorFn = e._errorListener.bind(e), e._node.addEventListener("error", e._errorFn, !1), e._loadFn = e._loadListener.bind(e), e._node.addEventListener(n._canPlayEvent, e._loadFn, !1), e._endFn = e._endListener.bind(e), e._node.addEventListener("ended", e._endFn, !1), e._node.src = t._src, e._node.preload = t._preload === !0 ? "auto" : t._preload, e._node.volume = o * n.volume(), e._node.load()), e;
        },
        /**
         * Reset the parameters of this sound to the original state (for recycle).
         * @return {Sound}
         */
        reset: function() {
          var e = this, t = e._parent;
          return e._muted = t._muted, e._loop = t._loop, e._volume = t._volume, e._rate = t._rate, e._seek = 0, e._rateSeek = 0, e._paused = !0, e._ended = !0, e._sprite = "__default", e._id = ++n._counter, e;
        },
        /**
         * HTML5 Audio error listener callback.
         */
        _errorListener: function() {
          var e = this;
          e._parent._emit("loaderror", e._id, e._node.error ? e._node.error.code : 0), e._node.removeEventListener("error", e._errorFn, !1);
        },
        /**
         * HTML5 Audio canplaythrough listener callback.
         */
        _loadListener: function() {
          var e = this, t = e._parent;
          t._duration = Math.ceil(e._node.duration * 10) / 10, Object.keys(t._sprite).length === 0 && (t._sprite = { __default: [0, t._duration * 1e3] }), t._state !== "loaded" && (t._state = "loaded", t._emit("load"), t._loadQueue()), e._node.removeEventListener(n._canPlayEvent, e._loadFn, !1);
        },
        /**
         * HTML5 Audio ended listener callback.
         */
        _endListener: function() {
          var e = this, t = e._parent;
          t._duration === 1 / 0 && (t._duration = Math.ceil(e._node.duration * 10) / 10, t._sprite.__default[1] === 1 / 0 && (t._sprite.__default[1] = t._duration * 1e3), t._ended(e)), e._node.removeEventListener("ended", e._endFn, !1);
        }
      };
      var c = {}, p = function(e) {
        var t = e._src;
        if (c[t]) {
          e._duration = c[t].duration, m(e);
          return;
        }
        if (/^data:[^;]+;base64,/.test(t)) {
          for (var o = atob(t.split(",")[1]), s = new Uint8Array(o.length), l = 0; l < o.length; ++l)
            s[l] = o.charCodeAt(l);
          f(s.buffer, e);
        } else {
          var _ = new XMLHttpRequest();
          _.open(e._xhr.method, t, !0), _.withCredentials = e._xhr.withCredentials, _.responseType = "arraybuffer", e._xhr.headers && Object.keys(e._xhr.headers).forEach(function(d) {
            _.setRequestHeader(d, e._xhr.headers[d]);
          }), _.onload = function() {
            var d = (_.status + "")[0];
            if (d !== "0" && d !== "2" && d !== "3") {
              e._emit("loaderror", null, "Failed loading audio file with status: " + _.status + ".");
              return;
            }
            f(_.response, e);
          }, _.onerror = function() {
            e._webAudio && (e._html5 = !0, e._webAudio = !1, e._sounds = [], delete c[t], e.load());
          }, y(_);
        }
      }, y = function(e) {
        try {
          e.send();
        } catch {
          e.onerror();
        }
      }, f = function(e, t) {
        var o = function() {
          t._emit("loaderror", null, "Decoding audio data failed.");
        }, s = function(l) {
          l && t._sounds.length > 0 ? (c[t._src] = l, m(t, l)) : o();
        };
        typeof Promise < "u" && n.ctx.decodeAudioData.length === 1 ? n.ctx.decodeAudioData(e).then(s).catch(o) : n.ctx.decodeAudioData(e, s, o);
      }, m = function(e, t) {
        t && !e._duration && (e._duration = t.duration), Object.keys(e._sprite).length === 0 && (e._sprite = { __default: [0, e._duration * 1e3] }), e._state !== "loaded" && (e._state = "loaded", e._emit("load"), e._loadQueue());
      }, v = function() {
        if (n.usingWebAudio) {
          try {
            typeof AudioContext < "u" ? n.ctx = new AudioContext() : typeof webkitAudioContext < "u" ? n.ctx = new webkitAudioContext() : n.usingWebAudio = !1;
          } catch {
            n.usingWebAudio = !1;
          }
          n.ctx || (n.usingWebAudio = !1);
          var e = /iP(hone|od|ad)/.test(n._navigator && n._navigator.platform), t = n._navigator && n._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/), o = t ? parseInt(t[1], 10) : null;
          if (e && o && o < 9) {
            var s = /safari/.test(n._navigator && n._navigator.userAgent.toLowerCase());
            n._navigator && !s && (n.usingWebAudio = !1);
          }
          n.usingWebAudio && (n.masterGain = typeof n.ctx.createGain > "u" ? n.ctx.createGainNode() : n.ctx.createGain(), n.masterGain.gain.setValueAtTime(n._muted ? 0 : n._volume, n.ctx.currentTime), n.masterGain.connect(n.ctx.destination)), n._setup();
        }
      };
      r.Howler = n, r.Howl = i, typeof H < "u" ? (H.HowlerGlobal = u, H.Howler = n, H.Howl = i, H.Sound = a) : typeof window < "u" && (window.HowlerGlobal = u, window.Howler = n, window.Howl = i, window.Sound = a);
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
        var i = this;
        if (!i.ctx || !i.ctx.listener)
          return i;
        for (var a = i._howls.length - 1; a >= 0; a--)
          i._howls[a].stereo(n);
        return i;
      }, HowlerGlobal.prototype.pos = function(n, i, a) {
        var c = this;
        if (!c.ctx || !c.ctx.listener)
          return c;
        if (i = typeof i != "number" ? c._pos[1] : i, a = typeof a != "number" ? c._pos[2] : a, typeof n == "number")
          c._pos = [n, i, a], typeof c.ctx.listener.positionX < "u" ? (c.ctx.listener.positionX.setTargetAtTime(c._pos[0], Howler.ctx.currentTime, 0.1), c.ctx.listener.positionY.setTargetAtTime(c._pos[1], Howler.ctx.currentTime, 0.1), c.ctx.listener.positionZ.setTargetAtTime(c._pos[2], Howler.ctx.currentTime, 0.1)) : c.ctx.listener.setPosition(c._pos[0], c._pos[1], c._pos[2]);
        else
          return c._pos;
        return c;
      }, HowlerGlobal.prototype.orientation = function(n, i, a, c, p, y) {
        var f = this;
        if (!f.ctx || !f.ctx.listener)
          return f;
        var m = f._orientation;
        if (i = typeof i != "number" ? m[1] : i, a = typeof a != "number" ? m[2] : a, c = typeof c != "number" ? m[3] : c, p = typeof p != "number" ? m[4] : p, y = typeof y != "number" ? m[5] : y, typeof n == "number")
          f._orientation = [n, i, a, c, p, y], typeof f.ctx.listener.forwardX < "u" ? (f.ctx.listener.forwardX.setTargetAtTime(n, Howler.ctx.currentTime, 0.1), f.ctx.listener.forwardY.setTargetAtTime(i, Howler.ctx.currentTime, 0.1), f.ctx.listener.forwardZ.setTargetAtTime(a, Howler.ctx.currentTime, 0.1), f.ctx.listener.upX.setTargetAtTime(c, Howler.ctx.currentTime, 0.1), f.ctx.listener.upY.setTargetAtTime(p, Howler.ctx.currentTime, 0.1), f.ctx.listener.upZ.setTargetAtTime(y, Howler.ctx.currentTime, 0.1)) : f.ctx.listener.setOrientation(n, i, a, c, p, y);
        else
          return m;
        return f;
      }, Howl.prototype.init = /* @__PURE__ */ function(n) {
        return function(i) {
          var a = this;
          return a._orientation = i.orientation || [1, 0, 0], a._stereo = i.stereo || null, a._pos = i.pos || null, a._pannerAttr = {
            coneInnerAngle: typeof i.coneInnerAngle < "u" ? i.coneInnerAngle : 360,
            coneOuterAngle: typeof i.coneOuterAngle < "u" ? i.coneOuterAngle : 360,
            coneOuterGain: typeof i.coneOuterGain < "u" ? i.coneOuterGain : 0,
            distanceModel: typeof i.distanceModel < "u" ? i.distanceModel : "inverse",
            maxDistance: typeof i.maxDistance < "u" ? i.maxDistance : 1e4,
            panningModel: typeof i.panningModel < "u" ? i.panningModel : "HRTF",
            refDistance: typeof i.refDistance < "u" ? i.refDistance : 1,
            rolloffFactor: typeof i.rolloffFactor < "u" ? i.rolloffFactor : 1
          }, a._onstereo = i.onstereo ? [{ fn: i.onstereo }] : [], a._onpos = i.onpos ? [{ fn: i.onpos }] : [], a._onorientation = i.onorientation ? [{ fn: i.onorientation }] : [], n.call(this, i);
        };
      }(Howl.prototype.init), Howl.prototype.stereo = function(n, i) {
        var a = this;
        if (!a._webAudio)
          return a;
        if (a._state !== "loaded")
          return a._queue.push({
            event: "stereo",
            action: function() {
              a.stereo(n, i);
            }
          }), a;
        var c = typeof Howler.ctx.createStereoPanner > "u" ? "spatial" : "stereo";
        if (typeof i > "u")
          if (typeof n == "number")
            a._stereo = n, a._pos = [n, 0, 0];
          else
            return a._stereo;
        for (var p = a._getSoundIds(i), y = 0; y < p.length; y++) {
          var f = a._soundById(p[y]);
          if (f)
            if (typeof n == "number")
              f._stereo = n, f._pos = [n, 0, 0], f._node && (f._pannerAttr.panningModel = "equalpower", (!f._panner || !f._panner.pan) && u(f, c), c === "spatial" ? typeof f._panner.positionX < "u" ? (f._panner.positionX.setValueAtTime(n, Howler.ctx.currentTime), f._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime), f._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime)) : f._panner.setPosition(n, 0, 0) : f._panner.pan.setValueAtTime(n, Howler.ctx.currentTime)), a._emit("stereo", f._id);
            else
              return f._stereo;
        }
        return a;
      }, Howl.prototype.pos = function(n, i, a, c) {
        var p = this;
        if (!p._webAudio)
          return p;
        if (p._state !== "loaded")
          return p._queue.push({
            event: "pos",
            action: function() {
              p.pos(n, i, a, c);
            }
          }), p;
        if (i = typeof i != "number" ? 0 : i, a = typeof a != "number" ? -0.5 : a, typeof c > "u")
          if (typeof n == "number")
            p._pos = [n, i, a];
          else
            return p._pos;
        for (var y = p._getSoundIds(c), f = 0; f < y.length; f++) {
          var m = p._soundById(y[f]);
          if (m)
            if (typeof n == "number")
              m._pos = [n, i, a], m._node && ((!m._panner || m._panner.pan) && u(m, "spatial"), typeof m._panner.positionX < "u" ? (m._panner.positionX.setValueAtTime(n, Howler.ctx.currentTime), m._panner.positionY.setValueAtTime(i, Howler.ctx.currentTime), m._panner.positionZ.setValueAtTime(a, Howler.ctx.currentTime)) : m._panner.setPosition(n, i, a)), p._emit("pos", m._id);
            else
              return m._pos;
        }
        return p;
      }, Howl.prototype.orientation = function(n, i, a, c) {
        var p = this;
        if (!p._webAudio)
          return p;
        if (p._state !== "loaded")
          return p._queue.push({
            event: "orientation",
            action: function() {
              p.orientation(n, i, a, c);
            }
          }), p;
        if (i = typeof i != "number" ? p._orientation[1] : i, a = typeof a != "number" ? p._orientation[2] : a, typeof c > "u")
          if (typeof n == "number")
            p._orientation = [n, i, a];
          else
            return p._orientation;
        for (var y = p._getSoundIds(c), f = 0; f < y.length; f++) {
          var m = p._soundById(y[f]);
          if (m)
            if (typeof n == "number")
              m._orientation = [n, i, a], m._node && (m._panner || (m._pos || (m._pos = p._pos || [0, 0, -0.5]), u(m, "spatial")), typeof m._panner.orientationX < "u" ? (m._panner.orientationX.setValueAtTime(n, Howler.ctx.currentTime), m._panner.orientationY.setValueAtTime(i, Howler.ctx.currentTime), m._panner.orientationZ.setValueAtTime(a, Howler.ctx.currentTime)) : m._panner.setOrientation(n, i, a)), p._emit("orientation", m._id);
            else
              return m._orientation;
        }
        return p;
      }, Howl.prototype.pannerAttr = function() {
        var n = this, i = arguments, a, c, p;
        if (!n._webAudio)
          return n;
        if (i.length === 0)
          return n._pannerAttr;
        if (i.length === 1)
          if (typeof i[0] == "object")
            a = i[0], typeof c > "u" && (a.pannerAttr || (a.pannerAttr = {
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
            return p = n._soundById(parseInt(i[0], 10)), p ? p._pannerAttr : n._pannerAttr;
        else i.length === 2 && (a = i[0], c = parseInt(i[1], 10));
        for (var y = n._getSoundIds(c), f = 0; f < y.length; f++)
          if (p = n._soundById(y[f]), p) {
            var m = p._pannerAttr;
            m = {
              coneInnerAngle: typeof a.coneInnerAngle < "u" ? a.coneInnerAngle : m.coneInnerAngle,
              coneOuterAngle: typeof a.coneOuterAngle < "u" ? a.coneOuterAngle : m.coneOuterAngle,
              coneOuterGain: typeof a.coneOuterGain < "u" ? a.coneOuterGain : m.coneOuterGain,
              distanceModel: typeof a.distanceModel < "u" ? a.distanceModel : m.distanceModel,
              maxDistance: typeof a.maxDistance < "u" ? a.maxDistance : m.maxDistance,
              refDistance: typeof a.refDistance < "u" ? a.refDistance : m.refDistance,
              rolloffFactor: typeof a.rolloffFactor < "u" ? a.rolloffFactor : m.rolloffFactor,
              panningModel: typeof a.panningModel < "u" ? a.panningModel : m.panningModel
            };
            var v = p._panner;
            v || (p._pos || (p._pos = n._pos || [0, 0, -0.5]), u(p, "spatial"), v = p._panner), v.coneInnerAngle = m.coneInnerAngle, v.coneOuterAngle = m.coneOuterAngle, v.coneOuterGain = m.coneOuterGain, v.distanceModel = m.distanceModel, v.maxDistance = m.maxDistance, v.refDistance = m.refDistance, v.rolloffFactor = m.rolloffFactor, v.panningModel = m.panningModel;
          }
        return n;
      }, Sound.prototype.init = /* @__PURE__ */ function(n) {
        return function() {
          var i = this, a = i._parent;
          i._orientation = a._orientation, i._stereo = a._stereo, i._pos = a._pos, i._pannerAttr = a._pannerAttr, n.call(this), i._stereo ? a.stereo(i._stereo) : i._pos && a.pos(i._pos[0], i._pos[1], i._pos[2], i._id);
        };
      }(Sound.prototype.init), Sound.prototype.reset = /* @__PURE__ */ function(n) {
        return function() {
          var i = this, a = i._parent;
          return i._orientation = a._orientation, i._stereo = a._stereo, i._pos = a._pos, i._pannerAttr = a._pannerAttr, i._stereo ? a.stereo(i._stereo) : i._pos ? a.pos(i._pos[0], i._pos[1], i._pos[2], i._id) : i._panner && (i._panner.disconnect(0), i._panner = void 0, a._refreshBuffer(i)), n.call(this);
        };
      }(Sound.prototype.reset);
      var u = function(n, i) {
        i = i || "spatial", i === "spatial" ? (n._panner = Howler.ctx.createPanner(), n._panner.coneInnerAngle = n._pannerAttr.coneInnerAngle, n._panner.coneOuterAngle = n._pannerAttr.coneOuterAngle, n._panner.coneOuterGain = n._pannerAttr.coneOuterGain, n._panner.distanceModel = n._pannerAttr.distanceModel, n._panner.maxDistance = n._pannerAttr.maxDistance, n._panner.refDistance = n._pannerAttr.refDistance, n._panner.rolloffFactor = n._pannerAttr.rolloffFactor, n._panner.panningModel = n._pannerAttr.panningModel, typeof n._panner.positionX < "u" ? (n._panner.positionX.setValueAtTime(n._pos[0], Howler.ctx.currentTime), n._panner.positionY.setValueAtTime(n._pos[1], Howler.ctx.currentTime), n._panner.positionZ.setValueAtTime(n._pos[2], Howler.ctx.currentTime)) : n._panner.setPosition(n._pos[0], n._pos[1], n._pos[2]), typeof n._panner.orientationX < "u" ? (n._panner.orientationX.setValueAtTime(n._orientation[0], Howler.ctx.currentTime), n._panner.orientationY.setValueAtTime(n._orientation[1], Howler.ctx.currentTime), n._panner.orientationZ.setValueAtTime(n._orientation[2], Howler.ctx.currentTime)) : n._panner.setOrientation(n._orientation[0], n._orientation[1], n._orientation[2])) : (n._panner = Howler.ctx.createStereoPanner(), n._panner.pan.setValueAtTime(n._stereo, Howler.ctx.currentTime)), n._panner.connect(n._node), n._paused || n._parent.pause(n._id, !0).play(n._id, !0);
      };
    })();
  }(ne)), ne;
}
Se();
var B, O;
const le = class R {
  constructor() {
    de(this, O), te(this, O, /* @__PURE__ */ new Map());
  }
  static getInstance() {
    return M(R, B) === void 0 && te(R, B, new R()), M(R, B);
  }
  hasSound(u) {
    return M(this, O).has(u);
  }
  setSound(u, n) {
    M(this, O).set(u, n);
  }
  setSoundOnce(u, n) {
    M(this, O).has(u) || M(this, O).set(u, n);
  }
  getSound(u) {
    return M(this, O).get(u);
  }
  playSound(u) {
    var n;
    (n = M(this, O).get(u)) == null || n.play();
  }
};
B = /* @__PURE__ */ new WeakMap(), O = /* @__PURE__ */ new WeakMap(), de(le, B);
let W = le;
async function ke(r, u = {}, n) {
  return window.__TAURI_INTERNALS__.invoke(r, u, n);
}
var re;
(function(r) {
  r.WINDOW_RESIZED = "tauri://resize", r.WINDOW_MOVED = "tauri://move", r.WINDOW_CLOSE_REQUESTED = "tauri://close-requested", r.WINDOW_DESTROYED = "tauri://destroyed", r.WINDOW_FOCUS = "tauri://focus", r.WINDOW_BLUR = "tauri://blur", r.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change", r.WINDOW_THEME_CHANGED = "tauri://theme-changed", r.WINDOW_CREATED = "tauri://window-created", r.WEBVIEW_CREATED = "tauri://webview-created", r.DRAG_ENTER = "tauri://drag-enter", r.DRAG_OVER = "tauri://drag-over", r.DRAG_DROP = "tauri://drag-drop", r.DRAG_LEAVE = "tauri://drag-leave";
})(re || (re = {}));
const C = async () => await ke("get_app_preferences_command");
let Oe = { data: "" }, De = (r) => typeof window == "object" ? ((r ? r.querySelector("#_goober") : window._goober) || Object.assign((r || document.head).appendChild(document.createElement("style")), { innerHTML: " ", id: "_goober" })).firstChild : r || Oe, Me = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g, Ge = /\/\*[^]*?\*\/|  +/g, ae = /\n+/g, G = (r, u) => {
  let n = "", i = "", a = "";
  for (let c in r) {
    let p = r[c];
    c[0] == "@" ? c[1] == "i" ? n = c + " " + p + ";" : i += c[1] == "f" ? G(p, c) : c + "{" + G(p, c[1] == "k" ? "" : u) + "}" : typeof p == "object" ? i += G(p, u ? u.replace(/([^,])+/g, (y) => c.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g, (f) => /&/.test(f) ? f.replace(/&/g, y) : y ? y + " " + f : f)) : c) : p != null && (c = /^--/.test(c) ? c : c.replace(/[A-Z]/g, "-$&").toLowerCase(), a += G.p ? G.p(c, p) : c + ":" + p + ";");
  }
  return n + (u && a ? u + "{" + a + "}" : a) + i;
}, k = {}, ce = (r) => {
  if (typeof r == "object") {
    let u = "";
    for (let n in r) u += n + ce(r[n]);
    return u;
  }
  return r;
}, Ne = (r, u, n, i, a) => {
  let c = ce(r), p = k[c] || (k[c] = ((f) => {
    let m = 0, v = 11;
    for (; m < f.length; ) v = 101 * v + f.charCodeAt(m++) >>> 0;
    return "go" + v;
  })(c));
  if (!k[p]) {
    let f = c !== r ? r : ((m) => {
      let v, e, t = [{}];
      for (; v = Me.exec(m.replace(Ge, "")); ) v[4] ? t.shift() : v[3] ? (e = v[3].replace(ae, " ").trim(), t.unshift(t[0][e] = t[0][e] || {})) : t[0][v[1]] = v[2].replace(ae, " ").trim();
      return t[0];
    })(r);
    k[p] = G(a ? { ["@keyframes " + p]: f } : f, n ? "" : "." + p);
  }
  let y = n && k.g ? k.g : null;
  return n && (k.g = k[p]), ((f, m, v, e) => {
    e ? m.data = m.data.replace(e, f) : m.data.indexOf(f) === -1 && (m.data = v ? f + m.data : m.data + f);
  })(k[p], u, i, y), p;
}, Le = (r, u, n) => r.reduce((i, a, c) => {
  let p = u[c];
  if (p && p.call) {
    let y = p(n), f = y && y.props && y.props.className || /^go/.test(y) && y;
    p = f ? "." + f : y && typeof y == "object" ? y.props ? "" : G(y, "") : y === !1 ? "" : y;
  }
  return i + a + (p ?? "");
}, "");
function $(r) {
  let u = this || {}, n = r.call ? r(u.p) : r;
  return Ne(n.unshift ? n.raw ? Le(n, [].slice.call(arguments, 1), u.p) : n.reduce((i, a) => Object.assign(i, a && a.call ? a(u.p) : a), {}) : n, De(u.target), u.g, u.o, u.k);
}
let _e, j, Z;
$.bind({ g: 1 });
let D = $.bind({ k: 1 });
function Fe(r, u, n, i) {
  G.p = u, _e = r, j = n, Z = i;
}
function N(r, u) {
  let n = this || {};
  return function() {
    let i = arguments;
    function a(c, p) {
      let y = Object.assign({}, c), f = y.className || a.className;
      n.p = Object.assign({ theme: j && j() }, y), n.o = / *go\d+/.test(f), y.className = $.apply(n, i) + (f ? " " + f : "");
      let m = r;
      return r[0] && (m = y.as || r, delete y.as), Z && m[0] && Z(y), _e(m, y);
    }
    return a;
  };
}
var He = (r) => typeof r == "function", Q = (r, u) => He(r) ? r(u) : r, Re = /* @__PURE__ */ (() => {
  let r = 0;
  return () => (++r).toString();
})(), Be = /* @__PURE__ */ (() => {
  let r;
  return () => {
    if (r === void 0 && typeof window < "u") {
      let u = matchMedia("(prefers-reduced-motion: reduce)");
      r = !u || u.matches;
    }
    return r;
  };
})(), Pe = 20, pe = (r, u) => {
  switch (u.type) {
    case 0:
      return { ...r, toasts: [u.toast, ...r.toasts].slice(0, Pe) };
    case 1:
      return { ...r, toasts: r.toasts.map((c) => c.id === u.toast.id ? { ...c, ...u.toast } : c) };
    case 2:
      let { toast: n } = u;
      return pe(r, { type: r.toasts.find((c) => c.id === n.id) ? 1 : 0, toast: n });
    case 3:
      let { toastId: i } = u;
      return { ...r, toasts: r.toasts.map((c) => c.id === i || i === void 0 ? { ...c, dismissed: !0, visible: !1 } : c) };
    case 4:
      return u.toastId === void 0 ? { ...r, toasts: [] } : { ...r, toasts: r.toasts.filter((c) => c.id !== u.toastId) };
    case 5:
      return { ...r, pausedAt: u.time };
    case 6:
      let a = u.time - (r.pausedAt || 0);
      return { ...r, pausedAt: void 0, toasts: r.toasts.map((c) => ({ ...c, pauseDuration: c.pauseDuration + a })) };
  }
}, Ve = [], X = { toasts: [], pausedAt: void 0 }, Y = (r) => {
  X = pe(X, r), Ve.forEach((u) => {
    u(X);
  });
}, We = (r, u = "blank", n) => ({ createdAt: Date.now(), visible: !0, dismissed: !1, type: u, ariaProps: { role: "status", "aria-live": "polite" }, message: r, pauseDuration: 0, ...n, id: (n == null ? void 0 : n.id) || Re() }), P = (r) => (u, n) => {
  let i = We(u, r, n);
  return Y({ type: 2, toast: i }), i.id;
}, T = (r, u) => P("blank")(r, u);
T.error = P("error");
T.success = P("success");
T.loading = P("loading");
T.custom = P("custom");
T.dismiss = (r) => {
  Y({ type: 3, toastId: r });
};
T.remove = (r) => Y({ type: 4, toastId: r });
T.promise = (r, u, n) => {
  let i = T.loading(u.loading, { ...n, ...n == null ? void 0 : n.loading });
  return typeof r == "function" && (r = r()), r.then((a) => {
    let c = u.success ? Q(u.success, a) : void 0;
    return c ? T.success(c, { id: i, ...n, ...n == null ? void 0 : n.success }) : T.dismiss(i), a;
  }).catch((a) => {
    let c = u.error ? Q(u.error, a) : void 0;
    c ? T.error(c, { id: i, ...n, ...n == null ? void 0 : n.error }) : T.dismiss(i);
  }), r;
};
var Ce = D`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`, $e = D`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`, qe = D`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`, Ue = N("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(r) => r.primary || "#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Ce} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${$e} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${(r) => r.secondary || "#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${qe} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`, Xe = D`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`, je = N("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(r) => r.secondary || "#e0e0e0"};
  border-right-color: ${(r) => r.primary || "#616161"};
  animation: ${Xe} 1s linear infinite;
`, Ze = D`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`, Qe = D`
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
}`, Ye = N("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(r) => r.primary || "#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Ze} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Qe} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${(r) => r.secondary || "#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`, ze = N("div")`
  position: absolute;
`, Ke = N("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`, Je = D`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`, et = N("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Je} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`, tt = ({ toast: r }) => {
  let { icon: u, type: n, iconTheme: i } = r;
  return u !== void 0 ? typeof u == "string" ? x.createElement(et, null, u) : u : n === "blank" ? null : x.createElement(Ke, null, x.createElement(je, { ...i }), n !== "loading" && x.createElement(ze, null, n === "error" ? x.createElement(Ue, { ...i }) : x.createElement(Ye, { ...i })));
}, nt = (r) => `
0% {transform: translate3d(0,${r * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`, ot = (r) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${r * -150}%,-1px) scale(.6); opacity:0;}
`, rt = "0%{opacity:0;} 100%{opacity:1;}", at = "0%{opacity:1;} 100%{opacity:0;}", it = N("div")`
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
`, st = N("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`, ut = (r, u) => {
  let n = r.includes("top") ? 1 : -1, [i, a] = Be() ? [rt, at] : [nt(n), ot(n)];
  return { animation: u ? `${D(i)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${D(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)` };
};
x.memo(({ toast: r, position: u, style: n, children: i }) => {
  let a = r.height ? ut(r.position || u || "top-center", r.visible) : { opacity: 0 }, c = x.createElement(tt, { toast: r }), p = x.createElement(st, { ...r.ariaProps }, Q(r.message, r));
  return x.createElement(it, { className: r.className, style: { ...a, ...n, ...r.style } }, typeof i == "function" ? i({ icon: c, message: p }) : x.createElement(x.Fragment, null, c, p));
});
Fe(x.createElement);
$`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;
var q = T, b = /* @__PURE__ */ ((r) => (r.GenerateImage = "generate_image", r.GenerateVideo = "generate_video", r.RemoveBackground = "remove_background", r.ImageTo3d = "image_to_3d", r))(b || {});
const Tt = () => {
  E(() => {
    let r = !1, u;
    return (async () => {
      u = I("generation-complete-event", async (i) => {
        var y;
        console.log("Generation complete event received:", i);
        const c = (y = (await C()).preferences) == null ? void 0 : y.generation_success_sound;
        c !== void 0 && W.getInstance().playSound(c);
        const p = dt(i.payload.data);
        q.success(p);
      }), r && u.then((i) => i());
    })(), () => {
      r = !0, u.then((i) => i());
    };
  }, []);
}, dt = (r) => {
  if (!r.action)
    return "Generation complete!";
  switch (r.action) {
    case b.GenerateImage:
      return "Image generation complete!";
    case b.GenerateVideo:
      return "Video generation complete!";
    case b.RemoveBackground:
      return "Background removal complete!";
    case b.ImageTo3d:
      return "Image to 3D complete!";
    default:
      return "Generation complete!";
  }
}, Et = () => {
  E(() => {
    let r = !1, u;
    return (async () => {
      u = I("generation-enqueue-failure-event", async (i) => {
        var y;
        console.log("Generation enqueue failure event received:", i);
        const c = (y = (await C()).preferences) == null ? void 0 : y.enqueue_failure_sound;
        c !== void 0 && W.getInstance().playSound(c);
        const p = lt(i.payload.data);
        q.error(p);
      }), r && u.then((i) => i());
    })(), () => {
      r = !0, u.then((i) => i());
    };
  }, []);
}, lt = (r) => {
  if (r.reason)
    return r.reason;
  switch (r.action) {
    case b.GenerateImage:
      return "Couldn't enqueue image generation!";
    case b.GenerateVideo:
      return "Couldn't enqueue video generation!";
    case b.RemoveBackground:
      return "Couldn't enqueue background removal!";
    case b.ImageTo3d:
      return "Couldn't enqueue image to 3D!";
    default:
      return "Couldn't enqueue generation!";
  }
}, It = () => {
  E(() => {
    let r = !1, u;
    return (async () => {
      u = I("generation-enqueue-success-event", async (i) => {
        var y;
        console.log("Generation enqueue success event received:", i);
        const c = (y = (await C()).preferences) == null ? void 0 : y.enqueue_success_sound;
        c !== void 0 && W.getInstance().playSound(c);
        const p = ct(i.payload.data);
        q.success(p);
      }), r && u.then((i) => i());
    })(), () => {
      r = !0, u.then((i) => i());
    };
  }, []);
}, ct = (r) => {
  switch (r.action) {
    case b.GenerateImage:
      return "Image generation enqueued!";
    case b.GenerateVideo:
      return "Video generation enqueued!";
    case b.RemoveBackground:
      return "Background removal enqueued!";
    case b.ImageTo3d:
      return "Image to 3D enqueued!";
    default:
      return "Generation enqueued!";
  }
}, St = () => {
  E(() => {
    let r = !1, u;
    return (async () => {
      u = I("generation-failed-event", async (i) => {
        var y;
        console.log("Generation failed event received:", i);
        const c = (y = (await C()).preferences) == null ? void 0 : y.generation_failure_sound;
        c !== void 0 && W.getInstance().playSound(c);
        const p = _t(i.payload.data);
        q.error(p);
      }), r && u.then((i) => i());
    })(), () => {
      r = !0, u.then((i) => i());
    };
  }, []);
}, _t = (r) => {
  if (r.reason)
    return r.reason;
  switch (r.action) {
    case b.GenerateImage:
      return "Image generation failed!";
    case b.GenerateVideo:
      return "Video generation failed!";
    case b.RemoveBackground:
      return "Background removal failed!";
    case b.ImageTo3d:
      return "Image to 3D failed!";
    default:
      return "Generation failed!";
  }
}, pt = "flash_user_input_error_event", kt = (r) => {
  E(() => {
    let u = !1, n;
    return (async () => {
      n = I(pt, async (a) => {
        await r(a.payload.data);
      }), u && n.then((a) => a());
    })(), () => {
      u = !0, n.then((a) => a());
    };
  }, []);
};
export {
  ye as BasicEventStatus,
  yt as useCreditsBalanceChangedEvent,
  kt as useFlashUserInputErrorEvent,
  Tt as useGenerationCompleteEvent,
  Et as useGenerationEnqueueFailureEvent,
  It as useGenerationEnqueueSuccessEvent,
  St as useGenerationFailedEvent,
  gt as useImageEditCompleteEvent,
  ht as useImageToVideoGenerationCompleteEvent,
  vt as useRefreshAccountStateEvent,
  At as useShowProviderBillingModalEvent,
  wt as useShowProviderLoginModalEvent,
  xt as useSubscriptionPlanChangedEvent,
  bt as useTextToImageGenerationCompleteEvent
};
