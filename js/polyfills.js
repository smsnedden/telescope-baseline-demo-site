/**
 * Pulse Studio — Browser Compatibility Layer
 * Ensures consistent behavior across older browsers.
 * Loaded before main application scripts.
 */

(function () {
  'use strict';

  // ── Promise polyfill ──────────────────────────────────────────────
  if (typeof Promise === 'undefined') {
    window.Promise = (function () {
      function PromisePolyfill(executor) {
        var self = this;
        self._state = 0; // 0: pending, 1: fulfilled, 2: rejected
        self._value = undefined;
        self._handlers = [];

        function resolve(value) {
          if (self._state !== 0) return;
          self._state = 1;
          self._value = value;
          self._handlers.forEach(handle);
        }

        function reject(reason) {
          if (self._state !== 0) return;
          self._state = 2;
          self._value = reason;
          self._handlers.forEach(handle);
        }

        function handle(handler) {
          if (self._state === 0) {
            self._handlers.push(handler);
            return;
          }
          var cb = self._state === 1 ? handler.onFulfilled : handler.onRejected;
          if (typeof cb !== 'function') {
            (self._state === 1 ? handler.resolve : handler.reject)(self._value);
            return;
          }
          try {
            handler.resolve(cb(self._value));
          } catch (e) {
            handler.reject(e);
          }
        }

        try {
          executor(resolve, reject);
        } catch (e) {
          reject(e);
        }
      }

      PromisePolyfill.prototype.then = function (onFulfilled, onRejected) {
        var self = this;
        return new PromisePolyfill(function (resolve, reject) {
          self._handlers
            ? self._handlers.push({
                onFulfilled: onFulfilled,
                onRejected: onRejected,
                resolve: resolve,
                reject: reject,
              })
            : setTimeout(function () {
                var cb = self._state === 1 ? onFulfilled : onRejected;
                if (typeof cb !== 'function') {
                  (self._state === 1 ? resolve : reject)(self._value);
                  return;
                }
                try {
                  resolve(cb(self._value));
                } catch (e) {
                  reject(e);
                }
              }, 0);
        });
      };

      PromisePolyfill.prototype.catch = function (onRejected) {
        return this.then(null, onRejected);
      };

      PromisePolyfill.resolve = function (value) {
        return new PromisePolyfill(function (resolve) {
          resolve(value);
        });
      };

      PromisePolyfill.reject = function (reason) {
        return new PromisePolyfill(function (_, reject) {
          reject(reason);
        });
      };

      return PromisePolyfill;
    })();
  }

  // ── Fetch polyfill ────────────────────────────────────────────────
  if (!window.fetch) {
    window.fetch = function (url, options) {
      options = options || {};
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', url, true);

        if (options.headers) {
          Object.keys(options.headers).forEach(function (key) {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }

        xhr.onload = function () {
          var responseHeaders = {};
          xhr
            .getAllResponseHeaders()
            .split('\r\n')
            .forEach(function (line) {
              var parts = line.split(': ');
              if (parts[0]) responseHeaders[parts[0].toLowerCase()] = parts[1];
            });

          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: {
              get: function (name) {
                return responseHeaders[name.toLowerCase()] || null;
              },
            },
            text: function () {
              return Promise.resolve(xhr.responseText);
            },
            json: function () {
              return Promise.resolve(JSON.parse(xhr.responseText));
            },
          });
        };

        xhr.onerror = function () {
          reject(new TypeError('Network request failed'));
        };

        xhr.ontimeout = function () {
          reject(new TypeError('Network request timed out'));
        };

        xhr.send(options.body || null);
      });
    };
  }

  // ── requestAnimationFrame polyfill ────────────────────────────────
  (function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];

    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      window.requestAnimationFrame =
        window[vendors[i] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame =
        window[vendors[i] + 'CancelAnimationFrame'] ||
        window[vendors[i] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
    }
  })();

  // ── CustomEvent polyfill (IE11) ───────────────────────────────────
  if (typeof window.CustomEvent !== 'function') {
    function CustomEventPolyfill(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(
        event,
        params.bubbles,
        params.cancelable,
        params.detail
      );
      return evt;
    }

    CustomEventPolyfill.prototype = window.Event.prototype;
    window.CustomEvent = CustomEventPolyfill;
  }

  // ── classList polyfill ────────────────────────────────────────────
  if (
    !('classList' in document.createElement('_')) ||
    (document.createElementNS &&
      !(
        'classList' in
        document.createElementNS('http://www.w3.org/2000/svg', 'g')
      ))
  ) {
    (function () {
      var protoProp = 'prototype';
      var strTrim = String[protoProp].trim;

      function ClassList(elem) {
        var classes = (elem.getAttribute('class') || '').replace(/^\s+|\s+$/g, '').split(/\s+/);
        this._element = elem;
        this.length = 0;
        for (var i = 0; i < classes.length; i++) {
          if (classes[i]) {
            Array[protoProp].push.call(this, classes[i]);
          }
        }
      }

      ClassList[protoProp] = {
        add: function (token) {
          if (!this.contains(token)) {
            Array[protoProp].push.call(this, token);
            this._element.setAttribute('class', this.toString());
          }
        },
        remove: function (token) {
          var index = Array[protoProp].indexOf.call(this, token);
          if (index !== -1) {
            Array[protoProp].splice.call(this, index, 1);
            this._element.setAttribute('class', this.toString());
          }
        },
        contains: function (token) {
          return Array[protoProp].indexOf.call(this, token) !== -1;
        },
        toggle: function (token) {
          if (this.contains(token)) {
            this.remove(token);
            return false;
          } else {
            this.add(token);
            return true;
          }
        },
        toString: function () {
          return Array[protoProp].join.call(this, ' ');
        },
      };

      if (!('classList' in Element[protoProp])) {
        Object.defineProperty(Element[protoProp], 'classList', {
          get: function () {
            return new ClassList(this);
          },
        });
      }
    })();
  }

  // ── IntersectionObserver polyfill ─────────────────────────────────
  if (
    !('IntersectionObserver' in window) ||
    !('IntersectionObserverEntry' in window) ||
    !('intersectionRatio' in window.IntersectionObserverEntry.prototype)
  ) {
    (function () {
      function IntersectionObserverPolyfill(callback, options) {
        this._callback = callback;
        this._options = options || {};
        this._root = this._options.root || null;
        this._rootMargin = this._options.rootMargin || '0px';
        this._threshold = this._options.threshold || [0];
        this._entries = [];
        this._observedElements = [];
        this._checkInterval = null;
      }

      IntersectionObserverPolyfill.prototype.observe = function (target) {
        if (this._observedElements.indexOf(target) !== -1) return;
        this._observedElements.push(target);

        var self = this;
        if (!this._checkInterval) {
          this._checkInterval = setInterval(function () {
            self._checkIntersections();
          }, 150);
        }
      };

      IntersectionObserverPolyfill.prototype.unobserve = function (target) {
        var idx = this._observedElements.indexOf(target);
        if (idx !== -1) {
          this._observedElements.splice(idx, 1);
        }
        if (this._observedElements.length === 0 && this._checkInterval) {
          clearInterval(this._checkInterval);
          this._checkInterval = null;
        }
      };

      IntersectionObserverPolyfill.prototype.disconnect = function () {
        this._observedElements = [];
        if (this._checkInterval) {
          clearInterval(this._checkInterval);
          this._checkInterval = null;
        }
      };

      IntersectionObserverPolyfill.prototype._checkIntersections =
        function () {
          var entries = [];
          var viewportHeight =
            window.innerHeight || document.documentElement.clientHeight;
          var viewportWidth =
            window.innerWidth || document.documentElement.clientWidth;

          for (var i = 0; i < this._observedElements.length; i++) {
            var el = this._observedElements[i];
            var rect = el.getBoundingClientRect();
            var isIntersecting =
              rect.top < viewportHeight &&
              rect.bottom > 0 &&
              rect.left < viewportWidth &&
              rect.right > 0;

            entries.push({
              target: el,
              isIntersecting: isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
              boundingClientRect: rect,
              time: Date.now(),
            });
          }

          if (entries.length > 0) {
            this._callback(entries, this);
          }
        };

      window.IntersectionObserver = IntersectionObserverPolyfill;
    })();
  }
})();
