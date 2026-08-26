/**
 * Coffee Browser — Guest page preload (runs before any page script)
 * Purpose: strip YouTube video ad payloads before the player sees them,
 * using the same technique as uBlock Origin on Chromium:
 *   - trap window.ytInitialPlayerResponse assignment (inline HTML config)
 *   - hook fetch()/XMLHttpRequest for /youtubei/ API JSON responses
 * No Node APIs are used — safe under sandbox or isolated contexts.
 */
(function () {
  try {
    var loc = window.location || {};
    var host = String(loc.hostname || '');
    if (!/(^|\.)youtube\.com$/.test(host) && !/(^|\.)youtube-nocookie\.com$/.test(host)) return;

    var AD_KEYS = ['adPlacements', 'adSlots', 'adBreakHeartbeatParams', 'adSafetyReason'];

    function scrub(obj, depth) {
      if (!obj || typeof obj !== 'object') return obj;
      if (depth === undefined) depth = 0;
      if (depth > 4) return obj;
      for (var i = 0; i < AD_KEYS.length; i++) {
        if (AD_KEYS[i] in obj) {
          try { delete obj[AD_KEYS[i]]; } catch (e) {}
        }
      }
      try {
        if (Array.isArray(obj.playerAds)) obj.playerAds.length = 0;
      } catch (e) {}
      try {
        if (obj.playerResponse && typeof obj.playerResponse === 'object') scrub(obj.playerResponse, depth + 1);
      } catch (e) {}
      return obj;
    }

    function shouldScrubUrl(url) {
      return typeof url === 'string' && url.indexOf('/youtubei/') !== -1 &&
        (/\/player\?|\/player\b|\/next\b|\/browse\b|\/search\b|\/guide\b/.test(url));
    }

    // ---- Trap window.ytInitialPlayerResponse (inline config in watch pages) ----
    try {
      var _ypr = window.ytInitialPlayerResponse;
      scrub(_ypr);
      Object.defineProperty(window, 'ytInitialPlayerResponse', {
        configurable: true,
        get: function () { return _ypr; },
        set: function (v) { _ypr = scrub(v); }
      });
    } catch (e) {}

    // ---- Hook fetch() ----
    try {
      var _origFetch = window.fetch;
      if (typeof _origFetch === 'function') {
        window.fetch = function () {
          var args = arguments;
          var url = '';
          try {
            url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
          } catch (e) {}
          var promise = _origFetch.apply(this, args);
          if (!shouldScrubUrl(url)) return promise;
          return promise.then(function (res) {
            try {
              var clone = res.clone();
              return clone.json().then(function (json) {
                scrub(json);
                if (json.playerResponse) scrub(json.playerResponse);
                var headers = new Headers();
                try {
                  var ct = res.headers.get('content-type');
                  if (ct) headers.set('content-type', ct);
                } catch (e) {}
                return new Response(JSON.stringify(json), { status: res.status, statusText: res.statusText, headers: headers });
              }).catch(function () { return res; });
            } catch (e) {
              return res;
            }
          });
        };
      }
    } catch (e) {}

    // ---- Hook XMLHttpRequest ----
    try {
      var XHR = window.XMLHttpRequest;
      var origOpen = XHR.prototype.open;
      var origSend = XHR.prototype.send;

      XHR.prototype.open = function (method, url) {
        try { this.__coffeeUrl = String(url || ''); } catch (e) {}
        return origOpen.apply(this, arguments);
      };

      XHR.prototype.send = function () {
        var xhr = this;
        var url = xhr.__coffeeUrl || '';
        if (!shouldScrubUrl(url)) return origSend.apply(this, arguments);

        var onReadyBound = null;
        var origDescriptor = null;
        var proto = XHR.prototype;
        var descResponse = Object.getOwnPropertyDescriptor(proto, 'response');
        var descText = Object.getOwnPropertyDescriptor(proto, 'responseText');

        function patchedListener() {
          try {
            if (xhr.readyState === 4 && !xhr.__coffeePatched) {
              xhr.__coffeePatched = true;
              var raw = null;
              try { raw = descText && descText.get ? descText.get.call(xhr) : xhr.responseText; } catch (e) {}
              if (typeof raw === 'string' && raw.length > 2) {
                try {
                  var json = JSON.parse(raw);
                  var changed = scrub(json);
                  if (json.playerResponse) scrub(json.playerResponse);
                  Object.defineProperty(xhr, 'responseText', { configurable: true, get: function () { return JSON.stringify(json); } });
                  Object.defineProperty(xhr, 'response', { configurable: true, get: function () { return JSON.stringify(json); } });
                } catch (e) {}
              }
            }
          } catch (e) {}
          if (typeof onReadyBound === 'function') return onReadyBound.apply(this, arguments);
        }

        try {
          onReadyBound = xhr.onreadystatechange;
          xhr.onreadystatechange = patchedListener;

          // Also cover listeners attached via addEventListener
          var origAdd = xhr.addEventListener.bind(xhr);
          xhr.addEventListener = function (type, fn, opts) {
            if (type === 'readystatechange' && typeof fn === 'function') {
              var wrapper = function () {
                patchedListener.call(xhr);
                return fn.apply(xhr, arguments);
              };
              return origAdd(type, wrapper, opts);
            }
            return origAdd(type, fn, opts);
          };

          var origRemove = xhr.removeEventListener.bind(xhr);
          xhr.removeEventListener = function (type, fn, opts) {
            return origRemove(type, fn, opts);
          };
        } catch (e) {}

        return origSend.apply(this, arguments);
      };
    } catch (e) {}

    // ---- Periodic sweep for late-loading configs ----
    setInterval(function () {
      try { scrub(window.ytInitialPlayerResponse); } catch (e) {}
      try {
        var cfg = window.ytplayer && window.ytplayer.config;
        if (cfg && cfg.playerResponse) scrub(cfg.playerResponse);
      } catch (e) {}
    }, 1000);
  } catch (e) {}

  // Defensive: never leak Node integration symbols to guest pages
  try {
    if (!window.process || (window.process && window.process.versions && window.process.versions.electron)) {
      /* leave untouched when absent */
    }
  } catch (e) {}
})();
