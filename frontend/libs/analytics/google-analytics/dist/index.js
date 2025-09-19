const o = "G-Y4Y8KMLPQ7", t = function(g) {
  console.debug("gtagLogin", o, g), window.gtag(
    "config",
    o,
    {
      user_id: g
    }
  );
}, i = function() {
  console.debug("gtagLogout", o), window.gtag(
    "config",
    o,
    {
      user_id: null
    }
  );
}, c = function(g, n) {
  console.debug("gtagEvent", g, n), n ? window.gtag("event", g, n) : window.gtag("event", g);
};
export {
  c as gtagEvent,
  t as gtagLogin,
  i as gtagLogout
};
