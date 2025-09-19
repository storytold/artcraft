var Q = Object.defineProperty;
var C = (h) => {
  throw TypeError(h);
};
var Y = (h, m, r) => m in h ? Q(h, m, { enumerable: !0, configurable: !0, writable: !0, value: r }) : h[m] = r;
var M = (h, m, r) => Y(h, typeof m != "symbol" ? m + "" : m, r), q = (h, m, r) => m.has(h) || C("Cannot " + r);
var x = (h, m, r) => (q(h, m, "read from private field"), r ? r.call(h) : m.get(h)), B = (h, m, r) => m.has(h) ? C("Cannot add the same private member more than once") : m instanceof WeakSet ? m.add(h) : m.set(h, r), L = (h, m, r, i) => (q(h, m, "write to private field"), i ? i.call(h, r) : m.set(h, r), r);
var H = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, G = {};
/*!
 *  howler.js v2.2.4
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */
var X;
function Z() {
  return X || (X = 1, function(h) {
    (function() {
      var m = function() {
        this.init();
      };
      m.prototype = {
        /**
         * Initialize the global Howler object.
         * @return {Howler}
         */
        init: function() {
          var e = this || r;
          return e._counter = 1e3, e._html5AudioPool = [], e.html5PoolSize = 10, e._codecs = {}, e._howls = [], e._muted = !1, e._volume = 1, e._canPlayEvent = "canplaythrough", e._navigator = typeof window < "u" && window.navigator ? window.navigator : null, e.masterGain = null, e.noAudio = !1, e.usingWebAudio = !0, e.autoSuspend = !0, e.ctx = null, e.autoUnlock = !0, e._setup(), e;
        },
        /**
         * Get/set the global volume for all sounds.
         * @param  {Float} vol Volume from 0.0 to 1.0.
         * @return {Howler/Float}     Returns self or current volume.
         */
        volume: function(e) {
          var t = this || r;
          if (e = parseFloat(e), t.ctx || w(), typeof e < "u" && e >= 0 && e <= 1) {
            if (t._volume = e, t._muted)
              return t;
            t.usingWebAudio && t.masterGain.gain.setValueAtTime(e, r.ctx.currentTime);
            for (var n = 0; n < t._howls.length; n++)
              if (!t._howls[n]._webAudio)
                for (var o = t._howls[n]._getSoundIds(), l = 0; l < o.length; l++) {
                  var s = t._howls[n]._soundById(o[l]);
                  s && s._node && (s._node.volume = s._volume * e);
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
          var t = this || r;
          t.ctx || w(), t._muted = e, t.usingWebAudio && t.masterGain.gain.setValueAtTime(e ? 0 : t._volume, r.ctx.currentTime);
          for (var n = 0; n < t._howls.length; n++)
            if (!t._howls[n]._webAudio)
              for (var o = t._howls[n]._getSoundIds(), l = 0; l < o.length; l++) {
                var s = t._howls[n]._soundById(o[l]);
                s && s._node && (s._node.muted = e ? !0 : s._muted);
              }
          return t;
        },
        /**
         * Handle stopping all sounds globally.
         */
        stop: function() {
          for (var e = this || r, t = 0; t < e._howls.length; t++)
            e._howls[t].stop();
          return e;
        },
        /**
         * Unload and destroy all currently loaded Howl objects.
         * @return {Howler}
         */
        unload: function() {
          for (var e = this || r, t = e._howls.length - 1; t >= 0; t--)
            e._howls[t].unload();
          return e.usingWebAudio && e.ctx && typeof e.ctx.close < "u" && (e.ctx.close(), e.ctx = null, w()), e;
        },
        /**
         * Check for codec support of specific extension.
         * @param  {String} ext Audio file extention.
         * @return {Boolean}
         */
        codecs: function(e) {
          return (this || r)._codecs[e.replace(/^x-/, "")];
        },
        /**
         * Setup various state values for global tracking.
         * @return {Howler}
         */
        _setup: function() {
          var e = this || r;
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
          var e = this || r, t = null;
          try {
            t = typeof Audio < "u" ? new Audio() : null;
          } catch {
            return e;
          }
          if (!t || typeof t.canPlayType != "function")
            return e;
          var n = t.canPlayType("audio/mpeg;").replace(/^no$/, ""), o = e._navigator ? e._navigator.userAgent : "", l = o.match(/OPR\/(\d+)/g), s = l && parseInt(l[0].split("/")[1], 10) < 33, a = o.indexOf("Safari") !== -1 && o.indexOf("Chrome") === -1, f = o.match(/Version\/(.*?) /), v = a && f && parseInt(f[1], 10) < 15;
          return e._codecs = {
            mp3: !!(!s && (n || t.canPlayType("audio/mp3;").replace(/^no$/, ""))),
            mpeg: !!n,
            opus: !!t.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
            ogg: !!t.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            oga: !!t.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            wav: !!(t.canPlayType('audio/wav; codecs="1"') || t.canPlayType("audio/wav")).replace(/^no$/, ""),
            aac: !!t.canPlayType("audio/aac;").replace(/^no$/, ""),
            caf: !!t.canPlayType("audio/x-caf;").replace(/^no$/, ""),
            m4a: !!(t.canPlayType("audio/x-m4a;") || t.canPlayType("audio/m4a;") || t.canPlayType("audio/aac;")).replace(/^no$/, ""),
            m4b: !!(t.canPlayType("audio/x-m4b;") || t.canPlayType("audio/m4b;") || t.canPlayType("audio/aac;")).replace(/^no$/, ""),
            mp4: !!(t.canPlayType("audio/x-mp4;") || t.canPlayType("audio/mp4;") || t.canPlayType("audio/aac;")).replace(/^no$/, ""),
            weba: !!(!v && t.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            webm: !!(!v && t.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
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
          var e = this || r;
          if (!(e._audioUnlocked || !e.ctx)) {
            e._audioUnlocked = !1, e.autoUnlock = !1, !e._mobileUnloaded && e.ctx.sampleRate !== 44100 && (e._mobileUnloaded = !0, e.unload()), e._scratchBuffer = e.ctx.createBuffer(1, 1, 22050);
            var t = function(n) {
              for (; e._html5AudioPool.length < e.html5PoolSize; )
                try {
                  var o = new Audio();
                  o._unlocked = !0, e._releaseHtml5Audio(o);
                } catch {
                  e.noAudio = !0;
                  break;
                }
              for (var l = 0; l < e._howls.length; l++)
                if (!e._howls[l]._webAudio)
                  for (var s = e._howls[l]._getSoundIds(), a = 0; a < s.length; a++) {
                    var f = e._howls[l]._soundById(s[a]);
                    f && f._node && !f._node._unlocked && (f._node._unlocked = !0, f._node.load());
                  }
              e._autoResume();
              var v = e.ctx.createBufferSource();
              v.buffer = e._scratchBuffer, v.connect(e.ctx.destination), typeof v.start > "u" ? v.noteOn(0) : v.start(0), typeof e.ctx.resume == "function" && e.ctx.resume(), v.onended = function() {
                v.disconnect(0), e._audioUnlocked = !0, document.removeEventListener("touchstart", t, !0), document.removeEventListener("touchend", t, !0), document.removeEventListener("click", t, !0), document.removeEventListener("keydown", t, !0);
                for (var g = 0; g < e._howls.length; g++)
                  e._howls[g]._emit("unlock");
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
          var e = this || r;
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
          var t = this || r;
          return e._unlocked && t._html5AudioPool.push(e), t;
        },
        /**
         * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
         * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
         * @return {Howler}
         */
        _autoSuspend: function() {
          var e = this;
          if (!(!e.autoSuspend || !e.ctx || typeof e.ctx.suspend > "u" || !r.usingWebAudio)) {
            for (var t = 0; t < e._howls.length; t++)
              if (e._howls[t]._webAudio) {
                for (var n = 0; n < e._howls[t]._sounds.length; n++)
                  if (!e._howls[t]._sounds[n]._paused)
                    return e;
              }
            return e._suspendTimer && clearTimeout(e._suspendTimer), e._suspendTimer = setTimeout(function() {
              if (e.autoSuspend) {
                e._suspendTimer = null, e.state = "suspending";
                var o = function() {
                  e.state = "suspended", e._resumeAfterSuspend && (delete e._resumeAfterSuspend, e._autoResume());
                };
                e.ctx.suspend().then(o, o);
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
          if (!(!e.ctx || typeof e.ctx.resume > "u" || !r.usingWebAudio))
            return e.state === "running" && e.ctx.state !== "interrupted" && e._suspendTimer ? (clearTimeout(e._suspendTimer), e._suspendTimer = null) : e.state === "suspended" || e.state === "running" && e.ctx.state === "interrupted" ? (e.ctx.resume().then(function() {
              e.state = "running";
              for (var t = 0; t < e._howls.length; t++)
                e._howls[t]._emit("resume");
            }), e._suspendTimer && (clearTimeout(e._suspendTimer), e._suspendTimer = null)) : e.state === "suspending" && (e._resumeAfterSuspend = !0), e;
        }
      };
      var r = new m(), i = function(e) {
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
          return r.ctx || w(), t._autoplay = e.autoplay || !1, t._format = typeof e.format != "string" ? e.format : [e.format], t._html5 = e.html5 || !1, t._muted = e.mute || !1, t._loop = e.loop || !1, t._pool = e.pool || 5, t._preload = typeof e.preload == "boolean" || e.preload === "metadata" ? e.preload : !0, t._rate = e.rate || 1, t._sprite = e.sprite || {}, t._src = typeof e.src != "string" ? e.src : [e.src], t._volume = e.volume !== void 0 ? e.volume : 1, t._xhr = {
            method: e.xhr && e.xhr.method ? e.xhr.method : "GET",
            headers: e.xhr && e.xhr.headers ? e.xhr.headers : null,
            withCredentials: e.xhr && e.xhr.withCredentials ? e.xhr.withCredentials : !1
          }, t._duration = 0, t._state = "unloaded", t._sounds = [], t._endTimers = {}, t._queue = [], t._playLock = !1, t._onend = e.onend ? [{ fn: e.onend }] : [], t._onfade = e.onfade ? [{ fn: e.onfade }] : [], t._onload = e.onload ? [{ fn: e.onload }] : [], t._onloaderror = e.onloaderror ? [{ fn: e.onloaderror }] : [], t._onplayerror = e.onplayerror ? [{ fn: e.onplayerror }] : [], t._onpause = e.onpause ? [{ fn: e.onpause }] : [], t._onplay = e.onplay ? [{ fn: e.onplay }] : [], t._onstop = e.onstop ? [{ fn: e.onstop }] : [], t._onmute = e.onmute ? [{ fn: e.onmute }] : [], t._onvolume = e.onvolume ? [{ fn: e.onvolume }] : [], t._onrate = e.onrate ? [{ fn: e.onrate }] : [], t._onseek = e.onseek ? [{ fn: e.onseek }] : [], t._onunlock = e.onunlock ? [{ fn: e.onunlock }] : [], t._onresume = [], t._webAudio = r.usingWebAudio && !t._html5, typeof r.ctx < "u" && r.ctx && r.autoUnlock && r._unlockAudio(), r._howls.push(t), t._autoplay && t._queue.push({
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
          if (r.noAudio) {
            e._emit("loaderror", null, "No audio support.");
            return;
          }
          typeof e._src == "string" && (e._src = [e._src]);
          for (var n = 0; n < e._src.length; n++) {
            var o, l;
            if (e._format && e._format[n])
              o = e._format[n];
            else {
              if (l = e._src[n], typeof l != "string") {
                e._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                continue;
              }
              o = /^data:audio\/([^;,]+);/i.exec(l), o || (o = /\.([^.]+)$/.exec(l.split("?", 1)[0])), o && (o = o[1].toLowerCase());
            }
            if (o || console.warn('No file extension was found. Consider using the "format" property or specify an extension.'), o && r.codecs(o)) {
              t = e._src[n];
              break;
            }
          }
          if (!t) {
            e._emit("loaderror", null, "No codec support for selected audio sources.");
            return;
          }
          return e._src = t, e._state = "loading", window.location.protocol === "https:" && t.slice(0, 5) === "http:" && (e._html5 = !0, e._webAudio = !1), new u(e), e._webAudio && d(e), e;
        },
        /**
         * Play a sound or resume previous playback.
         * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Number}          Sound ID.
         */
        play: function(e, t) {
          var n = this, o = null;
          if (typeof e == "number")
            o = e, e = null;
          else {
            if (typeof e == "string" && n._state === "loaded" && !n._sprite[e])
              return null;
            if (typeof e > "u" && (e = "__default", !n._playLock)) {
              for (var l = 0, s = 0; s < n._sounds.length; s++)
                n._sounds[s]._paused && !n._sounds[s]._ended && (l++, o = n._sounds[s]._id);
              l === 1 ? e = null : o = null;
            }
          }
          var a = o ? n._soundById(o) : n._inactiveSound();
          if (!a)
            return null;
          if (o && !e && (e = a._sprite || "__default"), n._state !== "loaded") {
            a._sprite = e, a._ended = !1;
            var f = a._id;
            return n._queue.push({
              event: "play",
              action: function() {
                n.play(f);
              }
            }), f;
          }
          if (o && !a._paused)
            return t || n._loadQueue("play"), a._id;
          n._webAudio && r._autoResume();
          var v = Math.max(0, a._seek > 0 ? a._seek : n._sprite[e][0] / 1e3), g = Math.max(0, (n._sprite[e][0] + n._sprite[e][1]) / 1e3 - v), T = g * 1e3 / Math.abs(a._rate), k = n._sprite[e][0] / 1e3, P = (n._sprite[e][0] + n._sprite[e][1]) / 1e3;
          a._sprite = e, a._ended = !1;
          var F = function() {
            a._paused = !1, a._seek = v, a._start = k, a._stop = P, a._loop = !!(a._loop || n._sprite[e][2]);
          };
          if (v >= P) {
            n._ended(a);
            return;
          }
          var y = a._node;
          if (n._webAudio) {
            var D = function() {
              n._playLock = !1, F(), n._refreshBuffer(a);
              var I = a._muted || n._muted ? 0 : a._volume;
              y.gain.setValueAtTime(I, r.ctx.currentTime), a._playStart = r.ctx.currentTime, typeof y.bufferSource.start > "u" ? a._loop ? y.bufferSource.noteGrainOn(0, v, 86400) : y.bufferSource.noteGrainOn(0, v, g) : a._loop ? y.bufferSource.start(0, v, 86400) : y.bufferSource.start(0, v, g), T !== 1 / 0 && (n._endTimers[a._id] = setTimeout(n._ended.bind(n, a), T)), t || setTimeout(function() {
                n._emit("play", a._id), n._loadQueue();
              }, 0);
            };
            r.state === "running" && r.ctx.state !== "interrupted" ? D() : (n._playLock = !0, n.once("resume", D), n._clearTimer(a._id));
          } else {
            var E = function() {
              y.currentTime = v, y.muted = a._muted || n._muted || r._muted || y.muted, y.volume = a._volume * r.volume(), y.playbackRate = a._rate;
              try {
                var I = y.play();
                if (I && typeof Promise < "u" && (I instanceof Promise || typeof I.then == "function") ? (n._playLock = !0, F(), I.then(function() {
                  n._playLock = !1, y._unlocked = !0, t ? n._loadQueue() : n._emit("play", a._id);
                }).catch(function() {
                  n._playLock = !1, n._emit("playerror", a._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."), a._ended = !0, a._paused = !0;
                })) : t || (n._playLock = !1, F(), n._emit("play", a._id)), y.playbackRate = a._rate, y.paused) {
                  n._emit("playerror", a._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");
                  return;
                }
                e !== "__default" || a._loop ? n._endTimers[a._id] = setTimeout(n._ended.bind(n, a), T) : (n._endTimers[a._id] = function() {
                  n._ended(a), y.removeEventListener("ended", n._endTimers[a._id], !1);
                }, y.addEventListener("ended", n._endTimers[a._id], !1));
              } catch (W) {
                n._emit("playerror", a._id, W);
              }
            };
            y.src === "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" && (y.src = n._src, y.load());
            var $ = window && window.ejecta || !y.readyState && r._navigator.isCocoonJS;
            if (y.readyState >= 3 || $)
              E();
            else {
              n._playLock = !0, n._state = "loading";
              var V = function() {
                n._state = "loaded", E(), y.removeEventListener(r._canPlayEvent, V, !1);
              };
              y.addEventListener(r._canPlayEvent, V, !1), n._clearTimer(a._id);
            }
          }
          return a._id;
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
          for (var n = t._getSoundIds(e), o = 0; o < n.length; o++) {
            t._clearTimer(n[o]);
            var l = t._soundById(n[o]);
            if (l && !l._paused && (l._seek = t.seek(n[o]), l._rateSeek = 0, l._paused = !0, t._stopFade(n[o]), l._node))
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
          var n = this;
          if (n._state !== "loaded" || n._playLock)
            return n._queue.push({
              event: "stop",
              action: function() {
                n.stop(e);
              }
            }), n;
          for (var o = n._getSoundIds(e), l = 0; l < o.length; l++) {
            n._clearTimer(o[l]);
            var s = n._soundById(o[l]);
            s && (s._seek = s._start || 0, s._rateSeek = 0, s._paused = !0, s._ended = !0, n._stopFade(o[l]), s._node && (n._webAudio ? s._node.bufferSource && (typeof s._node.bufferSource.stop > "u" ? s._node.bufferSource.noteOff(0) : s._node.bufferSource.stop(0), n._cleanBuffer(s._node)) : (!isNaN(s._node.duration) || s._node.duration === 1 / 0) && (s._node.currentTime = s._start || 0, s._node.pause(), s._node.duration === 1 / 0 && n._clearSound(s._node))), t || n._emit("stop", s._id));
          }
          return n;
        },
        /**
         * Mute/unmute a single sound or all sounds in this Howl group.
         * @param  {Boolean} muted Set to true to mute and false to unmute.
         * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
         * @return {Howl}
         */
        mute: function(e, t) {
          var n = this;
          if (n._state !== "loaded" || n._playLock)
            return n._queue.push({
              event: "mute",
              action: function() {
                n.mute(e, t);
              }
            }), n;
          if (typeof t > "u")
            if (typeof e == "boolean")
              n._muted = e;
            else
              return n._muted;
          for (var o = n._getSoundIds(t), l = 0; l < o.length; l++) {
            var s = n._soundById(o[l]);
            s && (s._muted = e, s._interval && n._stopFade(s._id), n._webAudio && s._node ? s._node.gain.setValueAtTime(e ? 0 : s._volume, r.ctx.currentTime) : s._node && (s._node.muted = r._muted ? !0 : e), n._emit("mute", s._id));
          }
          return n;
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
          var e = this, t = arguments, n, o;
          if (t.length === 0)
            return e._volume;
          if (t.length === 1 || t.length === 2 && typeof t[1] > "u") {
            var l = e._getSoundIds(), s = l.indexOf(t[0]);
            s >= 0 ? o = parseInt(t[0], 10) : n = parseFloat(t[0]);
          } else t.length >= 2 && (n = parseFloat(t[0]), o = parseInt(t[1], 10));
          var a;
          if (typeof n < "u" && n >= 0 && n <= 1) {
            if (e._state !== "loaded" || e._playLock)
              return e._queue.push({
                event: "volume",
                action: function() {
                  e.volume.apply(e, t);
                }
              }), e;
            typeof o > "u" && (e._volume = n), o = e._getSoundIds(o);
            for (var f = 0; f < o.length; f++)
              a = e._soundById(o[f]), a && (a._volume = n, t[2] || e._stopFade(o[f]), e._webAudio && a._node && !a._muted ? a._node.gain.setValueAtTime(n, r.ctx.currentTime) : a._node && !a._muted && (a._node.volume = n * r.volume()), e._emit("volume", a._id));
          } else
            return a = o ? e._soundById(o) : e._sounds[0], a ? a._volume : 0;
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
        fade: function(e, t, n, o) {
          var l = this;
          if (l._state !== "loaded" || l._playLock)
            return l._queue.push({
              event: "fade",
              action: function() {
                l.fade(e, t, n, o);
              }
            }), l;
          e = Math.min(Math.max(0, parseFloat(e)), 1), t = Math.min(Math.max(0, parseFloat(t)), 1), n = parseFloat(n), l.volume(e, o);
          for (var s = l._getSoundIds(o), a = 0; a < s.length; a++) {
            var f = l._soundById(s[a]);
            if (f) {
              if (o || l._stopFade(s[a]), l._webAudio && !f._muted) {
                var v = r.ctx.currentTime, g = v + n / 1e3;
                f._volume = e, f._node.gain.setValueAtTime(e, v), f._node.gain.linearRampToValueAtTime(t, g);
              }
              l._startFadeInterval(f, e, t, n, s[a], typeof o > "u");
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
        _startFadeInterval: function(e, t, n, o, l, s) {
          var a = this, f = t, v = n - t, g = Math.abs(v / 0.01), T = Math.max(4, g > 0 ? o / g : o), k = Date.now();
          e._fadeTo = n, e._interval = setInterval(function() {
            var P = (Date.now() - k) / o;
            k = Date.now(), f += v * P, f = Math.round(f * 100) / 100, v < 0 ? f = Math.max(n, f) : f = Math.min(n, f), a._webAudio ? e._volume = f : a.volume(f, e._id, !0), s && (a._volume = f), (n < t && f <= n || n > t && f >= n) && (clearInterval(e._interval), e._interval = null, e._fadeTo = null, a.volume(n, e._id), a._emit("fade", e._id));
          }, T);
        },
        /**
         * Internal method that stops the currently playing fade when
         * a new fade starts, volume is changed or the sound is stopped.
         * @param  {Number} id The sound id.
         * @return {Howl}
         */
        _stopFade: function(e) {
          var t = this, n = t._soundById(e);
          return n && n._interval && (t._webAudio && n._node.gain.cancelScheduledValues(r.ctx.currentTime), clearInterval(n._interval), n._interval = null, t.volume(n._fadeTo, e), n._fadeTo = null, t._emit("fade", e)), t;
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
          var e = this, t = arguments, n, o, l;
          if (t.length === 0)
            return e._loop;
          if (t.length === 1)
            if (typeof t[0] == "boolean")
              n = t[0], e._loop = n;
            else
              return l = e._soundById(parseInt(t[0], 10)), l ? l._loop : !1;
          else t.length === 2 && (n = t[0], o = parseInt(t[1], 10));
          for (var s = e._getSoundIds(o), a = 0; a < s.length; a++)
            l = e._soundById(s[a]), l && (l._loop = n, e._webAudio && l._node && l._node.bufferSource && (l._node.bufferSource.loop = n, n && (l._node.bufferSource.loopStart = l._start || 0, l._node.bufferSource.loopEnd = l._stop, e.playing(s[a]) && (e.pause(s[a], !0), e.play(s[a], !0)))));
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
          var e = this, t = arguments, n, o;
          if (t.length === 0)
            o = e._sounds[0]._id;
          else if (t.length === 1) {
            var l = e._getSoundIds(), s = l.indexOf(t[0]);
            s >= 0 ? o = parseInt(t[0], 10) : n = parseFloat(t[0]);
          } else t.length === 2 && (n = parseFloat(t[0]), o = parseInt(t[1], 10));
          var a;
          if (typeof n == "number") {
            if (e._state !== "loaded" || e._playLock)
              return e._queue.push({
                event: "rate",
                action: function() {
                  e.rate.apply(e, t);
                }
              }), e;
            typeof o > "u" && (e._rate = n), o = e._getSoundIds(o);
            for (var f = 0; f < o.length; f++)
              if (a = e._soundById(o[f]), a) {
                e.playing(o[f]) && (a._rateSeek = e.seek(o[f]), a._playStart = e._webAudio ? r.ctx.currentTime : a._playStart), a._rate = n, e._webAudio && a._node && a._node.bufferSource ? a._node.bufferSource.playbackRate.setValueAtTime(n, r.ctx.currentTime) : a._node && (a._node.playbackRate = n);
                var v = e.seek(o[f]), g = (e._sprite[a._sprite][0] + e._sprite[a._sprite][1]) / 1e3 - v, T = g * 1e3 / Math.abs(a._rate);
                (e._endTimers[o[f]] || !a._paused) && (e._clearTimer(o[f]), e._endTimers[o[f]] = setTimeout(e._ended.bind(e, a), T)), e._emit("rate", a._id);
              }
          } else
            return a = e._soundById(o), a ? a._rate : e._rate;
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
          var e = this, t = arguments, n, o;
          if (t.length === 0)
            e._sounds.length && (o = e._sounds[0]._id);
          else if (t.length === 1) {
            var l = e._getSoundIds(), s = l.indexOf(t[0]);
            s >= 0 ? o = parseInt(t[0], 10) : e._sounds.length && (o = e._sounds[0]._id, n = parseFloat(t[0]));
          } else t.length === 2 && (n = parseFloat(t[0]), o = parseInt(t[1], 10));
          if (typeof o > "u")
            return 0;
          if (typeof n == "number" && (e._state !== "loaded" || e._playLock))
            return e._queue.push({
              event: "seek",
              action: function() {
                e.seek.apply(e, t);
              }
            }), e;
          var a = e._soundById(o);
          if (a)
            if (typeof n == "number" && n >= 0) {
              var f = e.playing(o);
              f && e.pause(o, !0), a._seek = n, a._ended = !1, e._clearTimer(o), !e._webAudio && a._node && !isNaN(a._node.duration) && (a._node.currentTime = n);
              var v = function() {
                f && e.play(o, !0), e._emit("seek", o);
              };
              if (f && !e._webAudio) {
                var g = function() {
                  e._playLock ? setTimeout(g, 0) : v();
                };
                setTimeout(g, 0);
              } else
                v();
            } else if (e._webAudio) {
              var T = e.playing(o) ? r.ctx.currentTime - a._playStart : 0, k = a._rateSeek ? a._rateSeek - a._seek : 0;
              return a._seek + (k + T * Math.abs(a._rate));
            } else
              return a._node.currentTime;
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
            var n = t._soundById(e);
            return n ? !n._paused : !1;
          }
          for (var o = 0; o < t._sounds.length; o++)
            if (!t._sounds[o]._paused)
              return !0;
          return !1;
        },
        /**
         * Get the duration of this sound. Passing a sound id will return the sprite duration.
         * @param  {Number} id The sound id to check. If none is passed, return full source duration.
         * @return {Number} Audio duration in seconds.
         */
        duration: function(e) {
          var t = this, n = t._duration, o = t._soundById(e);
          return o && (n = t._sprite[o._sprite][1] / 1e3), n;
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
          for (var e = this, t = e._sounds, n = 0; n < t.length; n++)
            t[n]._paused || e.stop(t[n]._id), e._webAudio || (e._clearSound(t[n]._node), t[n]._node.removeEventListener("error", t[n]._errorFn, !1), t[n]._node.removeEventListener(r._canPlayEvent, t[n]._loadFn, !1), t[n]._node.removeEventListener("ended", t[n]._endFn, !1), r._releaseHtml5Audio(t[n]._node)), delete t[n]._node, e._clearTimer(t[n]._id);
          var o = r._howls.indexOf(e);
          o >= 0 && r._howls.splice(o, 1);
          var l = !0;
          for (n = 0; n < r._howls.length; n++)
            if (r._howls[n]._src === e._src || e._src.indexOf(r._howls[n]._src) >= 0) {
              l = !1;
              break;
            }
          return c && l && delete c[e._src], r.noAudio = !1, e._state = "unloaded", e._sounds = [], e = null, null;
        },
        /**
         * Listen to a custom event.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
         * @return {Howl}
         */
        on: function(e, t, n, o) {
          var l = this, s = l["_on" + e];
          return typeof t == "function" && s.push(o ? { id: n, fn: t, once: o } : { id: n, fn: t }), l;
        },
        /**
         * Remove a custom event. Call without parameters to remove all events.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to remove. Leave empty to remove all.
         * @param  {Number}   id    (optional) Only remove events for this sound.
         * @return {Howl}
         */
        off: function(e, t, n) {
          var o = this, l = o["_on" + e], s = 0;
          if (typeof t == "number" && (n = t, t = null), t || n)
            for (s = 0; s < l.length; s++) {
              var a = n === l[s].id;
              if (t === l[s].fn && a || !t && a) {
                l.splice(s, 1);
                break;
              }
            }
          else if (e)
            o["_on" + e] = [];
          else {
            var f = Object.keys(o);
            for (s = 0; s < f.length; s++)
              f[s].indexOf("_on") === 0 && Array.isArray(o[f[s]]) && (o[f[s]] = []);
          }
          return o;
        },
        /**
         * Listen to a custom event and remove it once fired.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @return {Howl}
         */
        once: function(e, t, n) {
          var o = this;
          return o.on(e, t, n, 1), o;
        },
        /**
         * Emit all events of a specific type and pass the sound id.
         * @param  {String} event Event name.
         * @param  {Number} id    Sound ID.
         * @param  {Number} msg   Message to go with event.
         * @return {Howl}
         */
        _emit: function(e, t, n) {
          for (var o = this, l = o["_on" + e], s = l.length - 1; s >= 0; s--)
            (!l[s].id || l[s].id === t || e === "load") && (setTimeout((function(a) {
              a.call(this, t, n);
            }).bind(o, l[s].fn), 0), l[s].once && o.off(e, l[s].fn, l[s].id));
          return o._loadQueue(e), o;
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
            var n = t._queue[0];
            n.event === e && (t._queue.shift(), t._loadQueue()), e || n.action();
          }
          return t;
        },
        /**
         * Fired when playback ends at the end of the duration.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _ended: function(e) {
          var t = this, n = e._sprite;
          if (!t._webAudio && e._node && !e._node.paused && !e._node.ended && e._node.currentTime < e._stop)
            return setTimeout(t._ended.bind(t, e), 100), t;
          var o = !!(e._loop || t._sprite[n][2]);
          if (t._emit("end", e._id), !t._webAudio && o && t.stop(e._id, !0).play(e._id), t._webAudio && o) {
            t._emit("play", e._id), e._seek = e._start || 0, e._rateSeek = 0, e._playStart = r.ctx.currentTime;
            var l = (e._stop - e._start) * 1e3 / Math.abs(e._rate);
            t._endTimers[e._id] = setTimeout(t._ended.bind(t, e), l);
          }
          return t._webAudio && !o && (e._paused = !0, e._ended = !0, e._seek = e._start || 0, e._rateSeek = 0, t._clearTimer(e._id), t._cleanBuffer(e._node), r._autoSuspend()), !t._webAudio && !o && t.stop(e._id, !0), t;
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
              var n = t._soundById(e);
              n && n._node && n._node.removeEventListener("ended", t._endTimers[e], !1);
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
          for (var t = this, n = 0; n < t._sounds.length; n++)
            if (e === t._sounds[n]._id)
              return t._sounds[n];
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
          return new u(e);
        },
        /**
         * Drain excess inactive sounds from the pool.
         */
        _drain: function() {
          var e = this, t = e._pool, n = 0, o = 0;
          if (!(e._sounds.length < t)) {
            for (o = 0; o < e._sounds.length; o++)
              e._sounds[o]._ended && n++;
            for (o = e._sounds.length - 1; o >= 0; o--) {
              if (n <= t)
                return;
              e._sounds[o]._ended && (e._webAudio && e._sounds[o]._node && e._sounds[o]._node.disconnect(0), e._sounds.splice(o, 1), n--);
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
            for (var n = [], o = 0; o < t._sounds.length; o++)
              n.push(t._sounds[o]._id);
            return n;
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
          return e._node.bufferSource = r.ctx.createBufferSource(), e._node.bufferSource.buffer = c[t._src], e._panner ? e._node.bufferSource.connect(e._panner) : e._node.bufferSource.connect(e._node), e._node.bufferSource.loop = e._loop, e._loop && (e._node.bufferSource.loopStart = e._start || 0, e._node.bufferSource.loopEnd = e._stop || 0), e._node.bufferSource.playbackRate.setValueAtTime(e._rate, r.ctx.currentTime), t;
        },
        /**
         * Prevent memory leaks by cleaning up the buffer source after playback.
         * @param  {Object} node Sound's audio node containing the buffer source.
         * @return {Howl}
         */
        _cleanBuffer: function(e) {
          var t = this, n = r._navigator && r._navigator.vendor.indexOf("Apple") >= 0;
          if (!e.bufferSource)
            return t;
          if (r._scratchBuffer && e.bufferSource && (e.bufferSource.onended = null, e.bufferSource.disconnect(0), n))
            try {
              e.bufferSource.buffer = r._scratchBuffer;
            } catch {
            }
          return e.bufferSource = null, t;
        },
        /**
         * Set the source to a 0-second silence to stop any downloading (except in IE).
         * @param  {Object} node Audio node to clear.
         */
        _clearSound: function(e) {
          var t = /MSIE |Trident\//.test(r._navigator && r._navigator.userAgent);
          t || (e.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        }
      };
      var u = function(e) {
        this._parent = e, this.init();
      };
      u.prototype = {
        /**
         * Initialize a new Sound object.
         * @return {Sound}
         */
        init: function() {
          var e = this, t = e._parent;
          return e._muted = t._muted, e._loop = t._loop, e._volume = t._volume, e._rate = t._rate, e._seek = 0, e._paused = !0, e._ended = !0, e._sprite = "__default", e._id = ++r._counter, t._sounds.push(e), e.create(), e;
        },
        /**
         * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
         * @return {Sound}
         */
        create: function() {
          var e = this, t = e._parent, n = r._muted || e._muted || e._parent._muted ? 0 : e._volume;
          return t._webAudio ? (e._node = typeof r.ctx.createGain > "u" ? r.ctx.createGainNode() : r.ctx.createGain(), e._node.gain.setValueAtTime(n, r.ctx.currentTime), e._node.paused = !0, e._node.connect(r.masterGain)) : r.noAudio || (e._node = r._obtainHtml5Audio(), e._errorFn = e._errorListener.bind(e), e._node.addEventListener("error", e._errorFn, !1), e._loadFn = e._loadListener.bind(e), e._node.addEventListener(r._canPlayEvent, e._loadFn, !1), e._endFn = e._endListener.bind(e), e._node.addEventListener("ended", e._endFn, !1), e._node.src = t._src, e._node.preload = t._preload === !0 ? "auto" : t._preload, e._node.volume = n * r.volume(), e._node.load()), e;
        },
        /**
         * Reset the parameters of this sound to the original state (for recycle).
         * @return {Sound}
         */
        reset: function() {
          var e = this, t = e._parent;
          return e._muted = t._muted, e._loop = t._loop, e._volume = t._volume, e._rate = t._rate, e._seek = 0, e._rateSeek = 0, e._paused = !0, e._ended = !0, e._sprite = "__default", e._id = ++r._counter, e;
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
          t._duration = Math.ceil(e._node.duration * 10) / 10, Object.keys(t._sprite).length === 0 && (t._sprite = { __default: [0, t._duration * 1e3] }), t._state !== "loaded" && (t._state = "loaded", t._emit("load"), t._loadQueue()), e._node.removeEventListener(r._canPlayEvent, e._loadFn, !1);
        },
        /**
         * HTML5 Audio ended listener callback.
         */
        _endListener: function() {
          var e = this, t = e._parent;
          t._duration === 1 / 0 && (t._duration = Math.ceil(e._node.duration * 10) / 10, t._sprite.__default[1] === 1 / 0 && (t._sprite.__default[1] = t._duration * 1e3), t._ended(e)), e._node.removeEventListener("ended", e._endFn, !1);
        }
      };
      var c = {}, d = function(e) {
        var t = e._src;
        if (c[t]) {
          e._duration = c[t].duration, _(e);
          return;
        }
        if (/^data:[^;]+;base64,/.test(t)) {
          for (var n = atob(t.split(",")[1]), o = new Uint8Array(n.length), l = 0; l < n.length; ++l)
            o[l] = n.charCodeAt(l);
          p(o.buffer, e);
        } else {
          var s = new XMLHttpRequest();
          s.open(e._xhr.method, t, !0), s.withCredentials = e._xhr.withCredentials, s.responseType = "arraybuffer", e._xhr.headers && Object.keys(e._xhr.headers).forEach(function(a) {
            s.setRequestHeader(a, e._xhr.headers[a]);
          }), s.onload = function() {
            var a = (s.status + "")[0];
            if (a !== "0" && a !== "2" && a !== "3") {
              e._emit("loaderror", null, "Failed loading audio file with status: " + s.status + ".");
              return;
            }
            p(s.response, e);
          }, s.onerror = function() {
            e._webAudio && (e._html5 = !0, e._webAudio = !1, e._sounds = [], delete c[t], e.load());
          }, A(s);
        }
      }, A = function(e) {
        try {
          e.send();
        } catch {
          e.onerror();
        }
      }, p = function(e, t) {
        var n = function() {
          t._emit("loaderror", null, "Decoding audio data failed.");
        }, o = function(l) {
          l && t._sounds.length > 0 ? (c[t._src] = l, _(t, l)) : n();
        };
        typeof Promise < "u" && r.ctx.decodeAudioData.length === 1 ? r.ctx.decodeAudioData(e).then(o).catch(n) : r.ctx.decodeAudioData(e, o, n);
      }, _ = function(e, t) {
        t && !e._duration && (e._duration = t.duration), Object.keys(e._sprite).length === 0 && (e._sprite = { __default: [0, e._duration * 1e3] }), e._state !== "loaded" && (e._state = "loaded", e._emit("load"), e._loadQueue());
      }, w = function() {
        if (r.usingWebAudio) {
          try {
            typeof AudioContext < "u" ? r.ctx = new AudioContext() : typeof webkitAudioContext < "u" ? r.ctx = new webkitAudioContext() : r.usingWebAudio = !1;
          } catch {
            r.usingWebAudio = !1;
          }
          r.ctx || (r.usingWebAudio = !1);
          var e = /iP(hone|od|ad)/.test(r._navigator && r._navigator.platform), t = r._navigator && r._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/), n = t ? parseInt(t[1], 10) : null;
          if (e && n && n < 9) {
            var o = /safari/.test(r._navigator && r._navigator.userAgent.toLowerCase());
            r._navigator && !o && (r.usingWebAudio = !1);
          }
          r.usingWebAudio && (r.masterGain = typeof r.ctx.createGain > "u" ? r.ctx.createGainNode() : r.ctx.createGain(), r.masterGain.gain.setValueAtTime(r._muted ? 0 : r._volume, r.ctx.currentTime), r.masterGain.connect(r.ctx.destination)), r._setup();
        }
      };
      h.Howler = r, h.Howl = i, typeof H < "u" ? (H.HowlerGlobal = m, H.Howler = r, H.Howl = i, H.Sound = u) : typeof window < "u" && (window.HowlerGlobal = m, window.Howler = r, window.Howl = i, window.Sound = u);
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
      HowlerGlobal.prototype._pos = [0, 0, 0], HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0], HowlerGlobal.prototype.stereo = function(r) {
        var i = this;
        if (!i.ctx || !i.ctx.listener)
          return i;
        for (var u = i._howls.length - 1; u >= 0; u--)
          i._howls[u].stereo(r);
        return i;
      }, HowlerGlobal.prototype.pos = function(r, i, u) {
        var c = this;
        if (!c.ctx || !c.ctx.listener)
          return c;
        if (i = typeof i != "number" ? c._pos[1] : i, u = typeof u != "number" ? c._pos[2] : u, typeof r == "number")
          c._pos = [r, i, u], typeof c.ctx.listener.positionX < "u" ? (c.ctx.listener.positionX.setTargetAtTime(c._pos[0], Howler.ctx.currentTime, 0.1), c.ctx.listener.positionY.setTargetAtTime(c._pos[1], Howler.ctx.currentTime, 0.1), c.ctx.listener.positionZ.setTargetAtTime(c._pos[2], Howler.ctx.currentTime, 0.1)) : c.ctx.listener.setPosition(c._pos[0], c._pos[1], c._pos[2]);
        else
          return c._pos;
        return c;
      }, HowlerGlobal.prototype.orientation = function(r, i, u, c, d, A) {
        var p = this;
        if (!p.ctx || !p.ctx.listener)
          return p;
        var _ = p._orientation;
        if (i = typeof i != "number" ? _[1] : i, u = typeof u != "number" ? _[2] : u, c = typeof c != "number" ? _[3] : c, d = typeof d != "number" ? _[4] : d, A = typeof A != "number" ? _[5] : A, typeof r == "number")
          p._orientation = [r, i, u, c, d, A], typeof p.ctx.listener.forwardX < "u" ? (p.ctx.listener.forwardX.setTargetAtTime(r, Howler.ctx.currentTime, 0.1), p.ctx.listener.forwardY.setTargetAtTime(i, Howler.ctx.currentTime, 0.1), p.ctx.listener.forwardZ.setTargetAtTime(u, Howler.ctx.currentTime, 0.1), p.ctx.listener.upX.setTargetAtTime(c, Howler.ctx.currentTime, 0.1), p.ctx.listener.upY.setTargetAtTime(d, Howler.ctx.currentTime, 0.1), p.ctx.listener.upZ.setTargetAtTime(A, Howler.ctx.currentTime, 0.1)) : p.ctx.listener.setOrientation(r, i, u, c, d, A);
        else
          return _;
        return p;
      }, Howl.prototype.init = /* @__PURE__ */ function(r) {
        return function(i) {
          var u = this;
          return u._orientation = i.orientation || [1, 0, 0], u._stereo = i.stereo || null, u._pos = i.pos || null, u._pannerAttr = {
            coneInnerAngle: typeof i.coneInnerAngle < "u" ? i.coneInnerAngle : 360,
            coneOuterAngle: typeof i.coneOuterAngle < "u" ? i.coneOuterAngle : 360,
            coneOuterGain: typeof i.coneOuterGain < "u" ? i.coneOuterGain : 0,
            distanceModel: typeof i.distanceModel < "u" ? i.distanceModel : "inverse",
            maxDistance: typeof i.maxDistance < "u" ? i.maxDistance : 1e4,
            panningModel: typeof i.panningModel < "u" ? i.panningModel : "HRTF",
            refDistance: typeof i.refDistance < "u" ? i.refDistance : 1,
            rolloffFactor: typeof i.rolloffFactor < "u" ? i.rolloffFactor : 1
          }, u._onstereo = i.onstereo ? [{ fn: i.onstereo }] : [], u._onpos = i.onpos ? [{ fn: i.onpos }] : [], u._onorientation = i.onorientation ? [{ fn: i.onorientation }] : [], r.call(this, i);
        };
      }(Howl.prototype.init), Howl.prototype.stereo = function(r, i) {
        var u = this;
        if (!u._webAudio)
          return u;
        if (u._state !== "loaded")
          return u._queue.push({
            event: "stereo",
            action: function() {
              u.stereo(r, i);
            }
          }), u;
        var c = typeof Howler.ctx.createStereoPanner > "u" ? "spatial" : "stereo";
        if (typeof i > "u")
          if (typeof r == "number")
            u._stereo = r, u._pos = [r, 0, 0];
          else
            return u._stereo;
        for (var d = u._getSoundIds(i), A = 0; A < d.length; A++) {
          var p = u._soundById(d[A]);
          if (p)
            if (typeof r == "number")
              p._stereo = r, p._pos = [r, 0, 0], p._node && (p._pannerAttr.panningModel = "equalpower", (!p._panner || !p._panner.pan) && m(p, c), c === "spatial" ? typeof p._panner.positionX < "u" ? (p._panner.positionX.setValueAtTime(r, Howler.ctx.currentTime), p._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime), p._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime)) : p._panner.setPosition(r, 0, 0) : p._panner.pan.setValueAtTime(r, Howler.ctx.currentTime)), u._emit("stereo", p._id);
            else
              return p._stereo;
        }
        return u;
      }, Howl.prototype.pos = function(r, i, u, c) {
        var d = this;
        if (!d._webAudio)
          return d;
        if (d._state !== "loaded")
          return d._queue.push({
            event: "pos",
            action: function() {
              d.pos(r, i, u, c);
            }
          }), d;
        if (i = typeof i != "number" ? 0 : i, u = typeof u != "number" ? -0.5 : u, typeof c > "u")
          if (typeof r == "number")
            d._pos = [r, i, u];
          else
            return d._pos;
        for (var A = d._getSoundIds(c), p = 0; p < A.length; p++) {
          var _ = d._soundById(A[p]);
          if (_)
            if (typeof r == "number")
              _._pos = [r, i, u], _._node && ((!_._panner || _._panner.pan) && m(_, "spatial"), typeof _._panner.positionX < "u" ? (_._panner.positionX.setValueAtTime(r, Howler.ctx.currentTime), _._panner.positionY.setValueAtTime(i, Howler.ctx.currentTime), _._panner.positionZ.setValueAtTime(u, Howler.ctx.currentTime)) : _._panner.setPosition(r, i, u)), d._emit("pos", _._id);
            else
              return _._pos;
        }
        return d;
      }, Howl.prototype.orientation = function(r, i, u, c) {
        var d = this;
        if (!d._webAudio)
          return d;
        if (d._state !== "loaded")
          return d._queue.push({
            event: "orientation",
            action: function() {
              d.orientation(r, i, u, c);
            }
          }), d;
        if (i = typeof i != "number" ? d._orientation[1] : i, u = typeof u != "number" ? d._orientation[2] : u, typeof c > "u")
          if (typeof r == "number")
            d._orientation = [r, i, u];
          else
            return d._orientation;
        for (var A = d._getSoundIds(c), p = 0; p < A.length; p++) {
          var _ = d._soundById(A[p]);
          if (_)
            if (typeof r == "number")
              _._orientation = [r, i, u], _._node && (_._panner || (_._pos || (_._pos = d._pos || [0, 0, -0.5]), m(_, "spatial")), typeof _._panner.orientationX < "u" ? (_._panner.orientationX.setValueAtTime(r, Howler.ctx.currentTime), _._panner.orientationY.setValueAtTime(i, Howler.ctx.currentTime), _._panner.orientationZ.setValueAtTime(u, Howler.ctx.currentTime)) : _._panner.setOrientation(r, i, u)), d._emit("orientation", _._id);
            else
              return _._orientation;
        }
        return d;
      }, Howl.prototype.pannerAttr = function() {
        var r = this, i = arguments, u, c, d;
        if (!r._webAudio)
          return r;
        if (i.length === 0)
          return r._pannerAttr;
        if (i.length === 1)
          if (typeof i[0] == "object")
            u = i[0], typeof c > "u" && (u.pannerAttr || (u.pannerAttr = {
              coneInnerAngle: u.coneInnerAngle,
              coneOuterAngle: u.coneOuterAngle,
              coneOuterGain: u.coneOuterGain,
              distanceModel: u.distanceModel,
              maxDistance: u.maxDistance,
              refDistance: u.refDistance,
              rolloffFactor: u.rolloffFactor,
              panningModel: u.panningModel
            }), r._pannerAttr = {
              coneInnerAngle: typeof u.pannerAttr.coneInnerAngle < "u" ? u.pannerAttr.coneInnerAngle : r._coneInnerAngle,
              coneOuterAngle: typeof u.pannerAttr.coneOuterAngle < "u" ? u.pannerAttr.coneOuterAngle : r._coneOuterAngle,
              coneOuterGain: typeof u.pannerAttr.coneOuterGain < "u" ? u.pannerAttr.coneOuterGain : r._coneOuterGain,
              distanceModel: typeof u.pannerAttr.distanceModel < "u" ? u.pannerAttr.distanceModel : r._distanceModel,
              maxDistance: typeof u.pannerAttr.maxDistance < "u" ? u.pannerAttr.maxDistance : r._maxDistance,
              refDistance: typeof u.pannerAttr.refDistance < "u" ? u.pannerAttr.refDistance : r._refDistance,
              rolloffFactor: typeof u.pannerAttr.rolloffFactor < "u" ? u.pannerAttr.rolloffFactor : r._rolloffFactor,
              panningModel: typeof u.pannerAttr.panningModel < "u" ? u.pannerAttr.panningModel : r._panningModel
            });
          else
            return d = r._soundById(parseInt(i[0], 10)), d ? d._pannerAttr : r._pannerAttr;
        else i.length === 2 && (u = i[0], c = parseInt(i[1], 10));
        for (var A = r._getSoundIds(c), p = 0; p < A.length; p++)
          if (d = r._soundById(A[p]), d) {
            var _ = d._pannerAttr;
            _ = {
              coneInnerAngle: typeof u.coneInnerAngle < "u" ? u.coneInnerAngle : _.coneInnerAngle,
              coneOuterAngle: typeof u.coneOuterAngle < "u" ? u.coneOuterAngle : _.coneOuterAngle,
              coneOuterGain: typeof u.coneOuterGain < "u" ? u.coneOuterGain : _.coneOuterGain,
              distanceModel: typeof u.distanceModel < "u" ? u.distanceModel : _.distanceModel,
              maxDistance: typeof u.maxDistance < "u" ? u.maxDistance : _.maxDistance,
              refDistance: typeof u.refDistance < "u" ? u.refDistance : _.refDistance,
              rolloffFactor: typeof u.rolloffFactor < "u" ? u.rolloffFactor : _.rolloffFactor,
              panningModel: typeof u.panningModel < "u" ? u.panningModel : _.panningModel
            };
            var w = d._panner;
            w || (d._pos || (d._pos = r._pos || [0, 0, -0.5]), m(d, "spatial"), w = d._panner), w.coneInnerAngle = _.coneInnerAngle, w.coneOuterAngle = _.coneOuterAngle, w.coneOuterGain = _.coneOuterGain, w.distanceModel = _.distanceModel, w.maxDistance = _.maxDistance, w.refDistance = _.refDistance, w.rolloffFactor = _.rolloffFactor, w.panningModel = _.panningModel;
          }
        return r;
      }, Sound.prototype.init = /* @__PURE__ */ function(r) {
        return function() {
          var i = this, u = i._parent;
          i._orientation = u._orientation, i._stereo = u._stereo, i._pos = u._pos, i._pannerAttr = u._pannerAttr, r.call(this), i._stereo ? u.stereo(i._stereo) : i._pos && u.pos(i._pos[0], i._pos[1], i._pos[2], i._id);
        };
      }(Sound.prototype.init), Sound.prototype.reset = /* @__PURE__ */ function(r) {
        return function() {
          var i = this, u = i._parent;
          return i._orientation = u._orientation, i._stereo = u._stereo, i._pos = u._pos, i._pannerAttr = u._pannerAttr, i._stereo ? u.stereo(i._stereo) : i._pos ? u.pos(i._pos[0], i._pos[1], i._pos[2], i._id) : i._panner && (i._panner.disconnect(0), i._panner = void 0, u._refreshBuffer(i)), r.call(this);
        };
      }(Sound.prototype.reset);
      var m = function(r, i) {
        i = i || "spatial", i === "spatial" ? (r._panner = Howler.ctx.createPanner(), r._panner.coneInnerAngle = r._pannerAttr.coneInnerAngle, r._panner.coneOuterAngle = r._pannerAttr.coneOuterAngle, r._panner.coneOuterGain = r._pannerAttr.coneOuterGain, r._panner.distanceModel = r._pannerAttr.distanceModel, r._panner.maxDistance = r._pannerAttr.maxDistance, r._panner.refDistance = r._pannerAttr.refDistance, r._panner.rolloffFactor = r._pannerAttr.rolloffFactor, r._panner.panningModel = r._pannerAttr.panningModel, typeof r._panner.positionX < "u" ? (r._panner.positionX.setValueAtTime(r._pos[0], Howler.ctx.currentTime), r._panner.positionY.setValueAtTime(r._pos[1], Howler.ctx.currentTime), r._panner.positionZ.setValueAtTime(r._pos[2], Howler.ctx.currentTime)) : r._panner.setPosition(r._pos[0], r._pos[1], r._pos[2]), typeof r._panner.orientationX < "u" ? (r._panner.orientationX.setValueAtTime(r._orientation[0], Howler.ctx.currentTime), r._panner.orientationY.setValueAtTime(r._orientation[1], Howler.ctx.currentTime), r._panner.orientationZ.setValueAtTime(r._orientation[2], Howler.ctx.currentTime)) : r._panner.setOrientation(r._orientation[0], r._orientation[1], r._orientation[2])) : (r._panner = Howler.ctx.createStereoPanner(), r._panner.pan.setValueAtTime(r._stereo, Howler.ctx.currentTime)), r._panner.connect(r._node), r._paused || r._parent.pause(r._id, !0).play(r._id, !0);
      };
    })();
  }(G)), G;
}
var N = Z();
class J {
  constructor(m, r) {
    M(this, "soundUrl");
    M(this, "defaultVolume");
    M(this, "howlerSound");
    const i = (r == null ? void 0 : r.defaultVolume) || 1;
    this.soundUrl = m, this.defaultVolume = i, this.howlerSound = new N.Howl({
      src: [m],
      autoplay: !1,
      loop: !1,
      volume: i
    });
  }
  play() {
    this.howlerSound.play();
  }
}
var O, b;
const S = class S {
  constructor() {
    B(this, b);
    L(this, b, /* @__PURE__ */ new Map());
  }
  static getInstance() {
    return x(S, O) === void 0 && L(S, O, new S()), x(S, O);
  }
  hasSound(m) {
    return x(this, b).has(m);
  }
  setSound(m, r) {
    x(this, b).set(m, r);
  }
  setSoundOnce(m, r) {
    x(this, b).has(m) || x(this, b).set(m, r);
  }
  getSound(m) {
    return x(this, b).get(m);
  }
  playSound(m) {
    var r;
    (r = x(this, b).get(m)) == null || r.play();
  }
};
O = new WeakMap(), b = new WeakMap(), B(S, O);
let R = S;
export {
  J as SoundEffect,
  R as SoundRegistry
};
