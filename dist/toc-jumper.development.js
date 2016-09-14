// <![CDATA[
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TocJumper = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*
    JavaScript autoComplete v1.0.4
    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/JavaScript-autoComplete
    License: http://www.opensource.org/licenses/mit-license.php
*/

var autoComplete = function () {
    // "use strict";
    function autoComplete(options) {
        if (!document.querySelector) return;

        // helpers
        function hasClass(el, className) {
            return el.classList ? el.classList.contains(className) : new RegExp('\\b' + className + '\\b').test(el.className);
        }

        function addEvent(el, type, handler) {
            if (el.attachEvent) el.attachEvent('on' + type, handler);else el.addEventListener(type, handler);
        }
        function removeEvent(el, type, handler) {
            // if (el.removeEventListener) not working in IE11
            if (el.detachEvent) el.detachEvent('on' + type, handler);else el.removeEventListener(type, handler);
        }
        function live(elClass, event, cb, context) {
            addEvent(context || document, event, function (e) {
                var found,
                    el = e.target || e.srcElement;
                while (el && !(found = hasClass(el, elClass))) {
                    el = el.parentElement;
                }if (found) cb.call(el, e);
            });
        }

        var o = {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            offsetLeft: 0,
            offsetTop: 1,
            cache: 1,
            menuClass: '',
            container: 'body',
            renderItem: function renderItem(item, search) {
                // escape special characters
                search = search.replace(/[-\/\\^$*+?.()|\[\]{}]/g, '\\$&');
                var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
            },
            onSelect: function onSelect(e, term, item) {}
        };
        for (var k in options) {
            if (options.hasOwnProperty(k)) o[k] = options[k];
        }

        // init
        var elems = _typeof(o.selector) == 'object' ? [o.selector] : document.querySelectorAll(o.selector);
        for (var i = 0; i < elems.length; i++) {
            var that = elems[i];

            // create suggestions container "sc"
            that.sc = document.createElement('div');
            that.sc.className = 'autocomplete-suggestions ' + o.menuClass;

            // If adding into a results container, remove the position absolute css styles
            if (o.container !== "body") {
                that.sc.className = that.sc.className + ' autocomplete-suggestions--in-container';
            }

            that.autocompleteAttr = that.getAttribute('autocomplete');
            that.setAttribute('autocomplete', 'off');
            that.cache = {};
            that.last_val = '';

            that.updateSC = function (resize, next) {
                var rect = that.getBoundingClientRect();
                if (o.container === 'body') {
                    // If the container is not the body, do not absolutely position in the window.
                    that.sc.style.left = Math.round(rect.left + (window.pageXOffset || document.documentElement.scrollLeft) + o.offsetLeft) + 'px';
                    that.sc.style.top = Math.round(rect.bottom + (window.pageYOffset || document.documentElement.scrollTop) + o.offsetTop) + 'px';
                }
                that.sc.style.width = Math.round(rect.right - rect.left) + 'px'; // outerWidth
                if (!resize) {
                    that.sc.style.display = 'block';
                    if (!that.sc.maxHeight) {
                        that.sc.maxHeight = parseInt((window.getComputedStyle ? getComputedStyle(that.sc, null) : that.sc.currentStyle).maxHeight);
                    }
                    if (!that.sc.suggestionHeight) that.sc.suggestionHeight = that.sc.querySelector('.autocomplete-suggestion').offsetHeight;
                    if (that.sc.suggestionHeight) if (!next) that.sc.scrollTop = 0;else {
                        var scrTop = that.sc.scrollTop,
                            selTop = next.getBoundingClientRect().top - that.sc.getBoundingClientRect().top;
                        if (selTop + that.sc.suggestionHeight - that.sc.maxHeight > 0) that.sc.scrollTop = selTop + that.sc.suggestionHeight + scrTop - that.sc.maxHeight;else if (selTop < 0) that.sc.scrollTop = selTop + scrTop;
                    }
                }
            };
            addEvent(window, 'resize', that.updateSC);
            document.querySelector(o.container).appendChild(that.sc);

            live('autocomplete-suggestion', 'mouseleave', function (e) {
                var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) setTimeout(function () {
                    sel.className = sel.className.replace('selected', '');
                }, 20);
            }, that.sc);

            live('autocomplete-suggestion', 'mouseover', function (e) {
                var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) sel.className = sel.className.replace('selected', '');
                this.className += ' selected';
            }, that.sc);

            live('autocomplete-suggestion', 'mousedown', function (e) {
                if (hasClass(this, 'autocomplete-suggestion')) {
                    // else outside click
                    var v = this.getAttribute('data-val');
                    that.value = v;
                    o.onSelect(e, v, this);
                    that.sc.style.display = 'none';
                }
            }, that.sc);

            that.blurHandler = function () {
                try {
                    var over_sb = document.querySelector('.autocomplete-suggestions:hover');
                } catch (e) {
                    var over_sb = 0;
                }
                if (!over_sb) {
                    that.last_val = that.value;
                    that.sc.style.display = 'none';
                    setTimeout(function () {
                        that.sc.style.display = 'none';
                    }, 350); // hide suggestions on fast input
                } else if (that !== document.activeElement) setTimeout(function () {
                    that.focus();
                }, 20);
            };
            addEvent(that, 'blur', that.blurHandler);

            var suggest = function suggest(data) {
                var val = that.value;
                that.cache[val] = data;
                if (data.length && val.length >= o.minChars) {
                    var s = '';
                    for (var i = 0; i < data.length; i++) {
                        s += o.renderItem(data[i], val);
                    }that.sc.innerHTML = s;
                    that.updateSC(0);
                } else that.sc.style.display = 'none';
            };

            that.keydownHandler = function (e) {
                var key = window.event ? e.keyCode : e.which;
                // down (40), up (38)
                if ((key == 40 || key == 38) && that.sc.innerHTML) {
                    var next,
                        sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (!sel) {
                        next = key == 40 ? that.sc.querySelector('.autocomplete-suggestion') : that.sc.childNodes[that.sc.childNodes.length - 1]; // first : last
                        next.className += ' selected';
                        that.value = next.getAttribute('data-val');
                    } else {
                        next = key == 40 ? sel.nextSibling : sel.previousSibling;
                        if (next) {
                            sel.className = sel.className.replace('selected', '');
                            next.className += ' selected';
                            that.value = next.getAttribute('data-val');
                        } else {
                            sel.className = sel.className.replace('selected', '');that.value = that.last_val;next = 0;
                        }
                    }
                    that.updateSC(0, next);
                    return false;
                }
                // esc
                else if (key == 27) {
                        that.value = that.last_val;that.sc.style.display = 'none';
                    }
                    // enter
                    else if (key == 13 || key == 9) {
                            var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                            if (sel && that.sc.style.display != 'none') {
                                o.onSelect(e, sel.getAttribute('data-val'), sel);setTimeout(function () {
                                    that.sc.style.display = 'none';
                                }, 20);
                            }
                        }
            };
            addEvent(that, 'keydown', that.keydownHandler);

            that.keyupHandler = function (e) {
                var key = window.event ? e.keyCode : e.which;
                if (!key || (key < 35 || key > 40) && key != 13 && key != 27) {
                    var val = that.value;
                    if (val.length >= o.minChars) {
                        if (val != that.last_val) {
                            that.last_val = val;
                            clearTimeout(that.timer);
                            if (o.cache) {
                                if (val in that.cache) {
                                    suggest(that.cache[val]);return;
                                }
                                // no requests if previous suggestions were empty
                                for (var i = 1; i < val.length - o.minChars; i++) {
                                    var part = val.slice(0, val.length - i);
                                    if (part in that.cache && !that.cache[part].length) {
                                        suggest([]);return;
                                    }
                                }
                            }
                            that.timer = setTimeout(function () {
                                o.source(val, suggest);
                            }, o.delay);
                        }
                    } else {
                        that.last_val = val;
                        that.sc.style.display = 'none';
                    }
                }
            };
            addEvent(that, 'keyup', that.keyupHandler);

            that.focusHandler = function (e) {
                that.last_val = '\n';
                that.keyupHandler(e);
            };
            if (!o.minChars) addEvent(that, 'focus', that.focusHandler);
        }

        // public destroy method
        this.destroy = function () {
            for (var i = 0; i < elems.length; i++) {
                var that = elems[i];
                removeEvent(window, 'resize', that.updateSC);
                removeEvent(that, 'blur', that.blurHandler);
                removeEvent(that, 'focus', that.focusHandler);
                removeEvent(that, 'keydown', that.keydownHandler);
                removeEvent(that, 'keyup', that.keyupHandler);
                if (that.autocompleteAttr) that.setAttribute('autocomplete', that.autocompleteAttr);else that.removeAttribute('autocomplete');
                document.querySelector(o.container).removeChild(that.sc);
                that = null;
            }
        };
    }
    return autoComplete;
}();

(function () {
    if (typeof define === 'function' && define.amd) define('autoComplete', function () {
        return autoComplete;
    });else if (typeof module !== 'undefined' && module.exports) module.exports = autoComplete;else window.autoComplete = autoComplete;
})();

},{}],2:[function(require,module,exports){
'use strict';

// browserify & brfs

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var store = require('store');
var keycode = require('keycode');

var template = require('./template');
var AutoComplete = require('./auto-complete.js');

var Movable = function () {
			function Movable(node, storage_id) {
						_classCallCheck(this, Movable);

						this.node = node;
						this.offset_x = null;
						this.offset_y = null;
						this.storage_id = storage_id;

						// we ought to specificaly bind mouse* callbacks to this object
						// for addEventListener/removeEventListener
						this.mousedown = this._mousedown.bind(this);
						this.mousemove = this._mousemove.bind(this);
						this.mouseup = this._mouseup.bind(this);

						this.log = console.log.bind(console, 'Movable:');
			}

			_createClass(Movable, [{
						key: 'position',
						value: function position(event) {
									var x = event.clientX - this.offset_x;
									var y = event.clientY - this.offset_y;

									// TODO: right, bottom
									if (x < 0) x = 0;
									if (y < 0) y = 0;
									return { x: x, y: y };
						}
			}, {
						key: 'move',
						value: function move(x, y) {
									this.node.style.left = x + 'px';
									this.node.style.top = y + 'px';
									this.node.style.right = 'auto';
									this.node.style.bottom = 'auto';
						}
			}, {
						key: 'valid_event',
						value: function valid_event(event) {
									return this.node === event.target && event.button === 0;
						}
			}, {
						key: '_mousedown',
						value: function _mousedown(event) {
									if (!this.valid_event(event)) return;
									this.offset_x = event.clientX - this.node.offsetLeft;
									this.offset_y = event.clientY - this.node.offsetTop;
									this.log('mousedown, offset_x=' + this.offset_x + ', offset_y=' + this.offset_y);
									document.addEventListener('mousemove', this.mousemove);
									this._mousemove(event);
						}
			}, {
						key: '_mousemove',
						value: function _mousemove(event) {
									this.node.style.cursor = 'move';
									var p = this.position(event);
									this.move(p.x, p.y);
						}

						// when `force` is true, `event` should be null because we're
						// invoking _mouseup() manually from a completely diff context to
						// forcibly remove mousemove listener.

			}, {
						key: '_mouseup',
						value: function _mouseup(event, force) {
									if (!force && !this.valid_event(event)) return;
									this.log('mouseup');
									document.removeEventListener('mousemove', this.mousemove);
									this.node.style.cursor = 'default';

									// save the widget position
									if (!this.storage_id || force) return;
									var p = this.position(event);
									store.set(this.storage_id, {
												left: p.x + 'px',
												top: p.y + 'px',
												right: 'auto',
												bottom: 'auto'
									});
									this.log('saved');
						}
			}, {
						key: 'hook',
						value: function hook() {
									this.node.addEventListener('mousedown', this.mousedown);
									this.node.addEventListener('mouseup', this.mouseup);
						}
			}, {
						key: 'unhook',
						value: function unhook() {
									this.node.removeEventListener('mousedown', this.mousedown);
									this.node.removeEventListener('mouseup', this.mouseup);
									document.removeEventListener('mousemove', this.mousemove);
						}
			}]);

			return Movable;
}();

var TocJumper = function () {
			function TocJumper(opt) {
						_classCallCheck(this, TocJumper);

						this.data = null;

						this.opt = {
									id: 'toc_jumper',
									selector: '',
									transform: null,
									key: 'i',
									pref_save: true,

									top: '4em',
									right: '.5em',
									bottom: 'auto',
									left: 'auto'
						};

						// merge user options
						for (var idx in opt) {
									this.opt[idx] = opt[idx];
						}if (this.opt.pref_save) this.opt.storage_id = 'toc_jumper--' + this.opt.id;

						this.log = console.log.bind(console, 'TocJumper:');
						this.log('init');
			}

			_createClass(TocJumper, [{
						key: 'load_saved_opt',
						value: function load_saved_opt() {
									var _this = this;

									if (!this.opt.storage_id) return;
									var saved_opt = store.get(this.opt.storage_id);
									if (saved_opt) {
												['top', 'right', 'bottom', 'left'].forEach(function (idx) {
															return _this.opt[idx] = saved_opt[idx] || _this.opt[idx];
												});
												this.log("loaded saved options");
									}
						}
			}, {
						key: 'scroll',
						value: function scroll(term) {
									if (term in this.data) {
												this.log(term);
												this.data[term].scrollIntoView(true);
									}
						}
			}, {
						key: 'hook',
						value: function hook() {
									var _this2 = this;

									this.data = make_index(this.opt.selector, this.opt.transform);
									css_inject({ id: this.opt.id });
									document.body.addEventListener('keydown', function (event) {
												if (['INPUT', 'TEXTAREA'].indexOf(event.target.nodeName) !== -1) return;
												if (keycode(event) === _this2.opt.key && !event.ctrlKey) _this2.dlg();
												if (keycode(event) === 'esc') _this2.movable._mouseup(null, true);
									});
						}
			}, {
						key: 'dlg',
						value: function dlg() {
									var _this3 = this;

									var node = document.getElementById(this.opt.id);
									if (node) return focus(node);

									this.load_saved_opt();
									node = document.createElement('div');
									node.id = this.opt.id;
									['top', 'right', 'bottom', 'left'].forEach(function (idx) {
												return node.style[idx] = _this3.opt[idx];
									});

									var ac_container = this.opt.id + '_container';
									node.innerHTML = '<span id="' + ac_container + '"><input size="40" spellcheck="false" /></span>\n<span id="' + this.opt.id + '_close" title="Close"><span>&times;</span></span>';
									document.body.appendChild(node);
									var input = node.querySelector('input');

									var ac = new AutoComplete({
												selector: input,
												minChars: 1,
												delay: 50,
												container: '#' + ac_container,
												source: function source(term, suggest) {
															var list = [];
															for (var key in _this3.data) {
																		if (key.toLowerCase().indexOf(term.toLowerCase()) !== -1) list.push(key);
															}
															suggest(TocJumper.sort(list, term));
												},
												onSelect: function onSelect(event, term, item) {
															return _this3.scroll(term);
												}
									});

									var destroy = function destroy() {
												ac.destroy();
												_this3.movable.unhook();
												document.body.removeChild(node);
									};

									node.querySelector('#' + this.opt.id + '_close').onclick = destroy;
									node.addEventListener('keydown', function (event) {
												if (keycode(event) === 'enter') _this3.scroll(input.value);
												if (keycode(event) === 'esc') destroy();
									});

									this.movable = new Movable(node, this.opt.storage_id);
									this.movable.log = this.log;
									this.movable.hook();

									focus(node);
						}
			}], [{
						key: 'sort',
						value: function sort(arr, term) {
									if (!term) return arr;
									term = term.toLowerCase();
									return arr.sort(function (a, b) {
												if (a.slice(0, term.length).toLowerCase() === term) return -1;
												if (b.slice(0, term.length).toLowerCase() === term) return 1;
												return a.localeCompare(b);
									});
						}
			}]);

			return TocJumper;
}();

module.exports = TocJumper;

var make_index = function make_index(selector, transform) {
			var nodes = document.querySelectorAll(selector);

			var r = {};
			var cache = {};
			for (var idx = 0; idx < nodes.length; ++idx) {
						var node = nodes[idx];
						var key = transform ? transform(node.innerText) : node.innerText;
						cache[key] = (cache[key] || 0) + 1;
						if (key in r) key = key + ' <' + cache[key] + '>';

						r[key] = node;
			}

			return r;
};

var css_inject = function css_inject(data) {
			var node = document.createElement('style');
			var tmpl = template("/* auto-complete.js */\n.autocomplete-suggestions {\n  text-align: left;\n  cursor: default;\n  border: 1px solid #ccc;\n  border-top: 0;\n  background: white;\n  box-shadow: -1px 1px 3px rgba(0, 0, 0, .1);\n\n  position: absolute;\n  display: none;\n  z-index: 9999;\n  max-height: 15em;\n  overflow: hidden;\n  overflow-y: auto;\n  box-sizing: border-box;\n}\n.autocomplete-suggestion {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.autocomplete-suggestion.selected {\n  background: #eee;\n}\n\n/* toc-jumper */\n#<%= id %> {\n  border: 1px solid #a9a9a9;\n  padding: 0.8em;\n  background-color: white;\n  color: black;\n  box-shadow: 1px 1px 3px rgba(0, 0, 0, .4);\n\n  position: fixed;\n}\n\n#<%= id %>_close {\n  margin-left: 1em;\n  font-weight: bold;\n  cursor: pointer;\n  text-align: center;\n  line-height: 2em;\n  width: 2em;\n  height: 2em;\n  display: inline-block;\n}\n\n#<%= id %>_close:hover {\n  background-color: #e81123;\n  color: white;\n}\n");
			node.innerHTML = tmpl(data);
			document.body.appendChild(node);
};

var focus = function focus(node) {
			setTimeout(function () {
						return node.querySelector('input').focus();
			}, 1);
};

},{"./auto-complete.js":1,"./template":5,"keycode":3,"store":4}],3:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// Source: http://jsfiddle.net/vWx8V/
// http://stackoverflow.com/questions/5603195/full-list-of-javascript-keycodes

/**
 * Conenience method returns corresponding value for given keyName or keyCode.
 *
 * @param {Mixed} keyCode {Number} or keyName {String}
 * @return {Mixed}
 * @api public
 */

exports = module.exports = function (searchInput) {
  // Keyboard Events
  if (searchInput && 'object' === (typeof searchInput === 'undefined' ? 'undefined' : _typeof(searchInput))) {
    var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode;
    if (hasKeyCode) searchInput = hasKeyCode;
  }

  // Numbers
  if ('number' === typeof searchInput) return names[searchInput];

  // Everything else (cast to string)
  var search = String(searchInput);

  // check codes
  var foundNamedKey = codes[search.toLowerCase()];
  if (foundNamedKey) return foundNamedKey;

  // check aliases
  var foundNamedKey = aliases[search.toLowerCase()];
  if (foundNamedKey) return foundNamedKey;

  // weird character?
  if (search.length === 1) return search.charCodeAt(0);

  return undefined;
};

/**
 * Get by name
 *
 *   exports.code['enter'] // => 13
 */

var codes = exports.code = exports.codes = {
  'backspace': 8,
  'tab': 9,
  'enter': 13,
  'shift': 16,
  'ctrl': 17,
  'alt': 18,
  'pause/break': 19,
  'caps lock': 20,
  'esc': 27,
  'space': 32,
  'page up': 33,
  'page down': 34,
  'end': 35,
  'home': 36,
  'left': 37,
  'up': 38,
  'right': 39,
  'down': 40,
  'insert': 45,
  'delete': 46,
  'command': 91,
  'left command': 91,
  'right command': 93,
  'numpad *': 106,
  'numpad +': 107,
  'numpad -': 109,
  'numpad .': 110,
  'numpad /': 111,
  'num lock': 144,
  'scroll lock': 145,
  'my computer': 182,
  'my calculator': 183,
  ';': 186,
  '=': 187,
  ',': 188,
  '-': 189,
  '.': 190,
  '/': 191,
  '`': 192,
  '[': 219,
  '\\': 220,
  ']': 221,
  "'": 222
};

// Helper aliases

var aliases = exports.aliases = {
  'windows': 91,
  '⇧': 16,
  '⌥': 18,
  '⌃': 17,
  '⌘': 91,
  'ctl': 17,
  'control': 17,
  'option': 18,
  'pause': 19,
  'break': 19,
  'caps': 20,
  'return': 13,
  'escape': 27,
  'spc': 32,
  'pgup': 33,
  'pgdn': 34,
  'ins': 45,
  'del': 46,
  'cmd': 91
};

/*!
 * Programatically add the following
 */

// lower case chars
for (i = 97; i < 123; i++) {
  codes[String.fromCharCode(i)] = i - 32;
} // numbers
for (var i = 48; i < 58; i++) {
  codes[i - 48] = i;
} // function keys
for (i = 1; i < 13; i++) {
  codes['f' + i] = i + 111;
} // numpad keys
for (i = 0; i < 10; i++) {
  codes['numpad ' + i] = i + 96;
} /**
   * Get by code
   *
   *   exports.name[13] // => 'Enter'
   */

var names = exports.names = exports.title = {}; // title for backward compat

// Create reverse mapping
for (i in codes) {
  names[codes[i]] = i;
} // Add aliases
for (var alias in aliases) {
  codes[alias] = aliases[alias];
}

},{}],4:[function(require,module,exports){
(function (global){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.store = factory();
	}
})(undefined, function () {

	// Store.js
	var store = {},
	    win = typeof window != 'undefined' ? window : global,
	    doc = win.document,
	    localStorageName = 'localStorage',
	    scriptTag = 'script',
	    storage;

	store.disabled = false;
	store.version = '1.3.20';
	store.set = function (key, value) {};
	store.get = function (key, defaultVal) {};
	store.has = function (key) {
		return store.get(key) !== undefined;
	};
	store.remove = function (key) {};
	store.clear = function () {};
	store.transact = function (key, defaultVal, transactionFn) {
		if (transactionFn == null) {
			transactionFn = defaultVal;
			defaultVal = null;
		}
		if (defaultVal == null) {
			defaultVal = {};
		}
		var val = store.get(key, defaultVal);
		transactionFn(val);
		store.set(key, val);
	};
	store.getAll = function () {};
	store.forEach = function () {};

	store.serialize = function (value) {
		return JSON.stringify(value);
	};
	store.deserialize = function (value) {
		if (typeof value != 'string') {
			return undefined;
		}
		try {
			return JSON.parse(value);
		} catch (e) {
			return value || undefined;
		}
	};

	// Functions to encapsulate questionable FireFox 3.6.13 behavior
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try {
			return localStorageName in win && win[localStorageName];
		} catch (err) {
			return false;
		}
	}

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName];
		store.set = function (key, val) {
			if (val === undefined) {
				return store.remove(key);
			}
			storage.setItem(key, store.serialize(val));
			return val;
		};
		store.get = function (key, defaultVal) {
			var val = store.deserialize(storage.getItem(key));
			return val === undefined ? defaultVal : val;
		};
		store.remove = function (key) {
			storage.removeItem(key);
		};
		store.clear = function () {
			storage.clear();
		};
		store.getAll = function () {
			var ret = {};
			store.forEach(function (key, val) {
				ret[key] = val;
			});
			return ret;
		};
		store.forEach = function (callback) {
			for (var i = 0; i < storage.length; i++) {
				var key = storage.key(i);
				callback(key, store.get(key));
			}
		};
	} else if (doc && doc.documentElement.addBehavior) {
		var storageOwner, storageContainer;
		// Since #userData storage applies only to specific paths, we need to
		// somehow link our data to a specific path.  We choose /favicon.ico
		// as a pretty safe option, since all browsers already make a request to
		// this URL anyway and being a 404 will not hurt us here.  We wrap an
		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
		// since the iframe access rules appear to allow direct access and
		// manipulation of the document element, even for a 404 page.  This
		// document can be used instead of the current document (which would
		// have been limited to the current path) to perform #userData storage.
		try {
			storageContainer = new ActiveXObject('htmlfile');
			storageContainer.open();
			storageContainer.write('<' + scriptTag + '>document.w=window</' + scriptTag + '><iframe src="/favicon.ico"></iframe>');
			storageContainer.close();
			storageOwner = storageContainer.w.frames[0].document;
			storage = storageOwner.createElement('div');
		} catch (e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div');
			storageOwner = doc.body;
		}
		var withIEStorage = function withIEStorage(storeFunction) {
			return function () {
				var args = Array.prototype.slice.call(arguments, 0);
				args.unshift(storage);
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				storageOwner.appendChild(storage);
				storage.addBehavior('#default#userData');
				storage.load(localStorageName);
				var result = storeFunction.apply(store, args);
				storageOwner.removeChild(storage);
				return result;
			};
		};

		// In IE7, keys cannot start with a digit or contain certain chars.
		// See https://github.com/marcuswestin/store.js/issues/40
		// See https://github.com/marcuswestin/store.js/issues/83
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g");
		var ieKeyFix = function ieKeyFix(key) {
			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___');
		};
		store.set = withIEStorage(function (storage, key, val) {
			key = ieKeyFix(key);
			if (val === undefined) {
				return store.remove(key);
			}
			storage.setAttribute(key, store.serialize(val));
			storage.save(localStorageName);
			return val;
		});
		store.get = withIEStorage(function (storage, key, defaultVal) {
			key = ieKeyFix(key);
			var val = store.deserialize(storage.getAttribute(key));
			return val === undefined ? defaultVal : val;
		});
		store.remove = withIEStorage(function (storage, key) {
			key = ieKeyFix(key);
			storage.removeAttribute(key);
			storage.save(localStorageName);
		});
		store.clear = withIEStorage(function (storage) {
			var attributes = storage.XMLDocument.documentElement.attributes;
			storage.load(localStorageName);
			for (var i = attributes.length - 1; i >= 0; i--) {
				storage.removeAttribute(attributes[i].name);
			}
			storage.save(localStorageName);
		});
		store.getAll = function (storage) {
			var ret = {};
			store.forEach(function (key, val) {
				ret[key] = val;
			});
			return ret;
		};
		store.forEach = withIEStorage(function (storage, callback) {
			var attributes = storage.XMLDocument.documentElement.attributes;
			for (var i = 0, attr; attr = attributes[i]; ++i) {
				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)));
			}
		});
	}

	try {
		var testKey = '__storejs__';
		store.set(testKey, testKey);
		if (store.get(testKey) != testKey) {
			store.disabled = true;
		}
		store.remove(testKey);
	} catch (e) {
		store.disabled = true;
	}
	store.enabled = !store.disabled;

	return store;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],5:[function(require,module,exports){
"use strict";

/*
  A modified _.template() from underscore.js.

  Why not use lodash/template? This version is ~5 times smaller.
*/

var noMatch = /(.)^/;
var escapes = {
   "'": "'",
   '\\': '\\',
   '\r': 'r',
   '\n': 'n',
   "\u2028": 'u2028',
   "\u2029": 'u2029'
};

var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

var escapeChar = function escapeChar(match) {
   return '\\' + escapes[match];
};

var templateSettings = {
   evaluate: /<%([\s\S]+?)%>/g,
   interpolate: /<%=([\s\S]+?)%>/g,
   escape: /<%-([\s\S]+?)%>/g
};

module.exports = function (text) {
   var settings = templateSettings;

   var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join('|') + '|$', 'g');

   var index = 0;
   var source = "__p+='";
   text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
         source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
         source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
         source += "';\n" + evaluate + "\n__p+='";
      }

      return match;
   });
   source += "';\n";

   if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

   source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + 'return __p;\n';

   var render;
   try {
      render = new Function(settings.variable || 'obj', source);
   } catch (e) {
      e.source = source;
      throw e;
   }

   var template = function template(data) {
      return render.call(this, data);
   };

   var argument = settings.variable || 'obj';
   template.source = 'function(' + argument + '){\n' + source + '}';

   return template;
};

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL29wdC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImF1dG8tY29tcGxldGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9rZXljb2RlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N0b3JlL3N0b3JlLmpzIiwidGVtcGxhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUE7Ozs7Ozs7QUFPQSxJQUFJLGVBQWdCLFlBQVU7QUFDMUI7QUFDQSxhQUFTLFlBQVQsQ0FBc0IsT0FBdEIsRUFBOEI7QUFDMUIsWUFBSSxDQUFDLFNBQVMsYUFBZCxFQUE2Qjs7QUFFN0I7QUFDQSxpQkFBUyxRQUFULENBQWtCLEVBQWxCLEVBQXNCLFNBQXRCLEVBQWdDO0FBQUUsbUJBQU8sR0FBRyxTQUFILEdBQWUsR0FBRyxTQUFILENBQWEsUUFBYixDQUFzQixTQUF0QixDQUFmLEdBQWtELElBQUksTUFBSixDQUFXLFFBQU8sU0FBUCxHQUFpQixLQUE1QixFQUFtQyxJQUFuQyxDQUF3QyxHQUFHLFNBQTNDLENBQXpEO0FBQWlIOztBQUVuSixpQkFBUyxRQUFULENBQWtCLEVBQWxCLEVBQXNCLElBQXRCLEVBQTRCLE9BQTVCLEVBQW9DO0FBQ2hDLGdCQUFJLEdBQUcsV0FBUCxFQUFvQixHQUFHLFdBQUgsQ0FBZSxPQUFLLElBQXBCLEVBQTBCLE9BQTFCLEVBQXBCLEtBQTZELEdBQUcsZ0JBQUgsQ0FBb0IsSUFBcEIsRUFBMEIsT0FBMUI7QUFDaEU7QUFDRCxpQkFBUyxXQUFULENBQXFCLEVBQXJCLEVBQXlCLElBQXpCLEVBQStCLE9BQS9CLEVBQXVDO0FBQ25DO0FBQ0EsZ0JBQUksR0FBRyxXQUFQLEVBQW9CLEdBQUcsV0FBSCxDQUFlLE9BQUssSUFBcEIsRUFBMEIsT0FBMUIsRUFBcEIsS0FBNkQsR0FBRyxtQkFBSCxDQUF1QixJQUF2QixF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QUFsQixDQUFQO0FBQ0ksSUFGRDs7QUFJQSxPQUFJLFdBQVcsU0FBUyxRQUFULElBQXFCLEtBQXBDO0FBQ0EsWUFBUyxNQUFULEdBQWtCLGNBQWMsUUFBZCxHQUF5QixNQUF6QixHQUFrQyxNQUFsQyxHQUEyQyxHQUE3RDs7QUFFQSxVQUFPLFFBQVA7QUFDSCxDQWpERCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICAgIEphdmFTY3JpcHQgYXV0b0NvbXBsZXRlIHYxLjAuNFxuICAgIENvcHlyaWdodCAoYykgMjAxNCBTaW1vbiBTdGVpbmJlcmdlciAvIFBpeGFiYXlcbiAgICBHaXRIdWI6IGh0dHBzOi8vZ2l0aHViLmNvbS9QaXhhYmF5L0phdmFTY3JpcHQtYXV0b0NvbXBsZXRlXG4gICAgTGljZW5zZTogaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcbiovXG5cbnZhciBhdXRvQ29tcGxldGUgPSAoZnVuY3Rpb24oKXtcbiAgICAvLyBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBhdXRvQ29tcGxldGUob3B0aW9ucyl7XG4gICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcikgcmV0dXJuO1xuXG4gICAgICAgIC8vIGhlbHBlcnNcbiAgICAgICAgZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIGNsYXNzTmFtZSl7IHJldHVybiBlbC5jbGFzc0xpc3QgPyBlbC5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKSA6IG5ldyBSZWdFeHAoJ1xcXFxiJysgY2xhc3NOYW1lKydcXFxcYicpLnRlc3QoZWwuY2xhc3NOYW1lKTsgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFkZEV2ZW50KGVsLCB0eXBlLCBoYW5kbGVyKXtcbiAgICAgICAgICAgIGlmIChlbC5hdHRhY2hFdmVudCkgZWwuYXR0YWNoRXZlbnQoJ29uJyt0eXBlLCBoYW5kbGVyKTsgZWxzZSBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGVsLCB0eXBlLCBoYW5kbGVyKXtcbiAgICAgICAgICAgIC8vIGlmIChlbC5yZW1vdmVFdmVudExpc3RlbmVyKSBub3Qgd29ya2luZyBpbiBJRTExXG4gICAgICAgICAgICBpZiAoZWwuZGV0YWNoRXZlbnQpIGVsLmRldGFjaEV2ZW50KCdvbicrdHlwZSwgaGFuZGxlcik7IGVsc2UgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBsaXZlKGVsQ2xhc3MsIGV2ZW50LCBjYiwgY29udGV4dCl7XG4gICAgICAgICAgICBhZGRFdmVudChjb250ZXh0IHx8IGRvY3VtZW50LCBldmVudCwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIGZvdW5kLCBlbCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWwgJiYgIShmb3VuZCA9IGhhc0NsYXNzKGVsLCBlbENsYXNzKSkpIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIGNiLmNhbGwoZWwsIGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbyA9IHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiAwLFxuICAgICAgICAgICAgc291cmNlOiAwLFxuICAgICAgICAgICAgbWluQ2hhcnM6IDMsXG4gICAgICAgICAgICBkZWxheTogMTUwLFxuICAgICAgICAgICAgb2Zmc2V0TGVmdDogMCxcbiAgICAgICAgICAgIG9mZnNldFRvcDogMSxcbiAgICAgICAgICAgIGNhY2hlOiAxLFxuICAgICAgICAgICAgbWVudUNsYXNzOiAnJyxcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJ2JvZHknLFxuICAgICAgICAgICAgcmVuZGVySXRlbTogZnVuY3Rpb24gKGl0ZW0sIHNlYXJjaCl7XG4gICAgICAgICAgICAgICAgLy8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgIHNlYXJjaCA9IHNlYXJjaC5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxcXFtcXF17fV0vZywgJ1xcXFwkJicpO1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIoXCIgKyBzZWFyY2guc3BsaXQoJyAnKS5qb2luKCd8JykgKyBcIilcIiwgXCJnaVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJhdXRvY29tcGxldGUtc3VnZ2VzdGlvblwiIGRhdGEtdmFsPVwiJyArIGl0ZW0gKyAnXCI+JyArIGl0ZW0ucmVwbGFjZShyZSwgXCI8Yj4kMTwvYj5cIikgKyAnPC9kaXY+JztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblNlbGVjdDogZnVuY3Rpb24oZSwgdGVybSwgaXRlbSl7fVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciBrIGluIG9wdGlvbnMpIHsgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaykpIG9ba10gPSBvcHRpb25zW2tdOyB9XG5cbiAgICAgICAgLy8gaW5pdFxuICAgICAgICB2YXIgZWxlbXMgPSB0eXBlb2Ygby5zZWxlY3RvciA9PSAnb2JqZWN0JyA/IFtvLnNlbGVjdG9yXSA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoby5zZWxlY3Rvcik7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxlbGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSBlbGVtc1tpXTtcblxuICAgICAgICAgICAgLy8gY3JlYXRlIHN1Z2dlc3Rpb25zIGNvbnRhaW5lciBcInNjXCJcbiAgICAgICAgICAgIHRoYXQuc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHRoYXQuc2MuY2xhc3NOYW1lID0gJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9ucyAnK28ubWVudUNsYXNzO1xuXG4gICAgICAgICAgICAvLyBJZiBhZGRpbmcgaW50byBhIHJlc3VsdHMgY29udGFpbmVyLCByZW1vdmUgdGhlIHBvc2l0aW9uIGFic29sdXRlIGNzcyBzdHlsZXNcbiAgICAgICAgICAgIGlmIChvLmNvbnRhaW5lciAhPT0gXCJib2R5XCIpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnNjLmNsYXNzTmFtZSA9IHRoYXQuc2MuY2xhc3NOYW1lICsgJyBhdXRvY29tcGxldGUtc3VnZ2VzdGlvbnMtLWluLWNvbnRhaW5lcic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoYXQuYXV0b2NvbXBsZXRlQXR0ciA9IHRoYXQuZ2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnKTtcbiAgICAgICAgICAgIHRoYXQuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCAnb2ZmJyk7XG4gICAgICAgICAgICB0aGF0LmNhY2hlID0ge307XG4gICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gJyc7XG5cbiAgICAgICAgICAgIHRoYXQudXBkYXRlU0MgPSBmdW5jdGlvbihyZXNpemUsIG5leHQpe1xuICAgICAgICAgICAgICAgIHZhciByZWN0ID0gdGhhdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBpZiAoby5jb250YWluZXIgPT09ICdib2R5Jykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY29udGFpbmVyIGlzIG5vdCB0aGUgYm9keSwgZG8gbm90IGFic29sdXRlbHkgcG9zaXRpb24gaW4gdGhlIHdpbmRvdy5cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5sZWZ0ID0gTWF0aC5yb3VuZChyZWN0LmxlZnQgKyAod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0KSArIG8ub2Zmc2V0TGVmdCkgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLnRvcCA9IE1hdGgucm91bmQocmVjdC5ib3R0b20gKyAod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3ApICsgby5vZmZzZXRUb3ApICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS53aWR0aCA9IE1hdGgucm91bmQocmVjdC5yaWdodCAtIHJlY3QubGVmdCkgKyAncHgnOyAvLyBvdXRlcldpZHRoXG4gICAgICAgICAgICAgICAgaWYgKCFyZXNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0LnNjLm1heEhlaWdodCkgeyB0aGF0LnNjLm1heEhlaWdodCA9IHBhcnNlSW50KCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSA/IGdldENvbXB1dGVkU3R5bGUodGhhdC5zYywgbnVsbCkgOiB0aGF0LnNjLmN1cnJlbnRTdHlsZSkubWF4SGVpZ2h0KTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodCkgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0ID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nKS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHQpIHRoYXQuc2Muc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY3JUb3AgPSB0aGF0LnNjLnNjcm9sbFRvcCwgc2VsVG9wID0gbmV4dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSB0aGF0LnNjLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsVG9wICsgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0IC0gdGhhdC5zYy5tYXhIZWlnaHQgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnNjcm9sbFRvcCA9IHNlbFRvcCArIHRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodCArIHNjclRvcCAtIHRoYXQuc2MubWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlbFRvcCA8IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc2Nyb2xsVG9wID0gc2VsVG9wICsgc2NyVG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFkZEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHRoYXQudXBkYXRlU0MpO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvLmNvbnRhaW5lcikuYXBwZW5kQ2hpbGQodGhhdC5zYyk7XG5cbiAgICAgICAgICAgIGxpdmUoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJywgJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsKSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNlbC5jbGFzc05hbWUgPSBzZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NlbGVjdGVkJywgJycpOyB9LCAyMCk7XG4gICAgICAgICAgICB9LCB0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2VvdmVyJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIHNlbCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbCkgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICB9LCB0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2Vkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgaWYgKGhhc0NsYXNzKHRoaXMsICdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicpKSB7IC8vIGVsc2Ugb3V0c2lkZSBjbGlja1xuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gdjtcbiAgICAgICAgICAgICAgICAgICAgby5vblNlbGVjdChlLCB2LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICB0aGF0LmJsdXJIYW5kbGVyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0cnkgeyB2YXIgb3Zlcl9zYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbnM6aG92ZXInKTsgfSBjYXRjaChlKXsgdmFyIG92ZXJfc2IgPSAwOyB9XG4gICAgICAgICAgICAgICAgaWYgKCFvdmVyX3NiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSB0aGF0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9LCAzNTApOyAvLyBoaWRlIHN1Z2dlc3Rpb25zIG9uIGZhc3QgaW5wdXRcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoYXQgIT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5mb2N1cygpOyB9LCAyMCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYWRkRXZlbnQodGhhdCwgJ2JsdXInLCB0aGF0LmJsdXJIYW5kbGVyKTtcblxuICAgICAgICAgICAgdmFyIHN1Z2dlc3QgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhhdC52YWx1ZTtcbiAgICAgICAgICAgICAgICB0aGF0LmNhY2hlW3ZhbF0gPSBkYXRhO1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aCAmJiB2YWwubGVuZ3RoID49IG8ubWluQ2hhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKSBzICs9IG8ucmVuZGVySXRlbShkYXRhW2ldLCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLmlubmVySFRNTCA9IHM7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlU0MoMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LmtleWRvd25IYW5kbGVyID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHdpbmRvdy5ldmVudCA/IGUua2V5Q29kZSA6IGUud2hpY2g7XG4gICAgICAgICAgICAgICAgLy8gZG93biAoNDApLCB1cCAoMzgpXG4gICAgICAgICAgICAgICAgaWYgKChrZXkgPT0gNDAgfHwga2V5ID09IDM4KSAmJiB0aGF0LnNjLmlubmVySFRNTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dCwgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgPSAoa2V5ID09IDQwKSA/IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJykgOiB0aGF0LnNjLmNoaWxkTm9kZXNbdGhhdC5zYy5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdOyAvLyBmaXJzdCA6IGxhc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQuY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC52YWx1ZSA9IG5leHQuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IChrZXkgPT0gNDApID8gc2VsLm5leHRTaWJsaW5nIDogc2VsLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC52YWx1ZSA9IG5leHQuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7IHNlbC5jbGFzc05hbWUgPSBzZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NlbGVjdGVkJywgJycpOyB0aGF0LnZhbHVlID0gdGhhdC5sYXN0X3ZhbDsgbmV4dCA9IDA7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZVNDKDAsIG5leHQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGVzY1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PSAyNykgeyB0aGF0LnZhbHVlID0gdGhhdC5sYXN0X3ZhbDsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9XG4gICAgICAgICAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXkgPT0gMTMgfHwga2V5ID09IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgJiYgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ICE9ICdub25lJykgeyBvLm9uU2VsZWN0KGUsIHNlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyksIHNlbCk7IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9LCAyMCk7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYWRkRXZlbnQodGhhdCwgJ2tleWRvd24nLCB0aGF0LmtleWRvd25IYW5kbGVyKTtcblxuICAgICAgICAgICAgdGhhdC5rZXl1cEhhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gd2luZG93LmV2ZW50ID8gZS5rZXlDb2RlIDogZS53aGljaDtcbiAgICAgICAgICAgICAgICBpZiAoIWtleSB8fCAoa2V5IDwgMzUgfHwga2V5ID4gNDApICYmIGtleSAhPSAxMyAmJiBrZXkgIT0gMjcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRoYXQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoID49IG8ubWluQ2hhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwgIT0gdGhhdC5sYXN0X3ZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoYXQudGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLmNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwgaW4gdGhhdC5jYWNoZSkgeyBzdWdnZXN0KHRoYXQuY2FjaGVbdmFsXSk7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyByZXF1ZXN0cyBpZiBwcmV2aW91cyBzdWdnZXN0aW9ucyB3ZXJlIGVtcHR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MTsgaTx2YWwubGVuZ3RoLW8ubWluQ2hhcnM7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnQgPSB2YWwuc2xpY2UoMCwgdmFsLmxlbmd0aC1pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJ0IGluIHRoYXQuY2FjaGUgJiYgIXRoYXQuY2FjaGVbcGFydF0ubGVuZ3RoKSB7IHN1Z2dlc3QoW10pOyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpeyBvLnNvdXJjZSh2YWwsIHN1Z2dlc3QpIH0sIG8uZGVsYXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAna2V5dXAnLCB0aGF0LmtleXVwSGFuZGxlcik7XG5cbiAgICAgICAgICAgIHRoYXQuZm9jdXNIYW5kbGVyID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9ICdcXG4nO1xuICAgICAgICAgICAgICAgIHRoYXQua2V5dXBIYW5kbGVyKGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCFvLm1pbkNoYXJzKSBhZGRFdmVudCh0aGF0LCAnZm9jdXMnLCB0aGF0LmZvY3VzSGFuZGxlcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBwdWJsaWMgZGVzdHJveSBtZXRob2RcbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxlbGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gZWxlbXNbaV07XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQod2luZG93LCAncmVzaXplJywgdGhhdC51cGRhdGVTQyk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQodGhhdCwgJ2JsdXInLCB0aGF0LmJsdXJIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAnZm9jdXMnLCB0aGF0LmZvY3VzSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQodGhhdCwgJ2tleWRvd24nLCB0aGF0LmtleWRvd25IYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAna2V5dXAnLCB0aGF0LmtleXVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuYXV0b2NvbXBsZXRlQXR0cilcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsIHRoYXQuYXV0b2NvbXBsZXRlQXR0cik7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZUF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJyk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvLmNvbnRhaW5lcikucmVtb3ZlQ2hpbGQodGhhdC5zYyk7XG4gICAgICAgICAgICAgICAgdGhhdCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBhdXRvQ29tcGxldGU7XG59KSgpO1xuXG4oZnVuY3Rpb24oKXtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuICAgICAgICBkZWZpbmUoJ2F1dG9Db21wbGV0ZScsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGF1dG9Db21wbGV0ZTsgfSk7XG4gICAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0NvbXBsZXRlO1xuICAgIGVsc2VcbiAgICAgICAgd2luZG93LmF1dG9Db21wbGV0ZSA9IGF1dG9Db21wbGV0ZTtcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cblx0XHQvLyBicm93c2VyaWZ5ICYgYnJmc1xuXG5sZXQgc3RvcmUgPSByZXF1aXJlKCdzdG9yZScpXG5sZXQga2V5Y29kZSA9IHJlcXVpcmUoJ2tleWNvZGUnKVxuXG5sZXQgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3RlbXBsYXRlJylcbmxldCBBdXRvQ29tcGxldGUgPSByZXF1aXJlKCcuL2F1dG8tY29tcGxldGUuanMnKVxuXG5sZXQgTW92YWJsZSA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3Rvcihub2RlLCBzdG9yYWdlX2lkKSB7XG5cdHRoaXMubm9kZSA9IG5vZGVcblx0dGhpcy5vZmZzZXRfeCA9IG51bGxcblx0dGhpcy5vZmZzZXRfeSA9IG51bGxcblx0dGhpcy5zdG9yYWdlX2lkID0gc3RvcmFnZV9pZFxuXG5cdC8vIHdlIG91Z2h0IHRvIHNwZWNpZmljYWx5IGJpbmQgbW91c2UqIGNhbGxiYWNrcyB0byB0aGlzIG9iamVjdFxuXHQvLyBmb3IgYWRkRXZlbnRMaXN0ZW5lci9yZW1vdmVFdmVudExpc3RlbmVyXG5cdHRoaXMubW91c2Vkb3duID0gdGhpcy5fbW91c2Vkb3duLmJpbmQodGhpcylcblx0dGhpcy5tb3VzZW1vdmUgPSB0aGlzLl9tb3VzZW1vdmUuYmluZCh0aGlzKVxuXHR0aGlzLm1vdXNldXAgPSB0aGlzLl9tb3VzZXVwLmJpbmQodGhpcylcblxuXHR0aGlzLmxvZyA9IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSwgJ01vdmFibGU6JylcbiAgICB9XG5cbiAgICBwb3NpdGlvbihldmVudCkge1xuXHRsZXQgeCA9IGV2ZW50LmNsaWVudFggLSB0aGlzLm9mZnNldF94XG5cdGxldCB5ID0gZXZlbnQuY2xpZW50WSAtIHRoaXMub2Zmc2V0X3lcblxuXHQvLyBUT0RPOiByaWdodCwgYm90dG9tXG5cdGlmICh4IDwgMCkgeCA9IDBcblx0aWYgKHkgPCAwKSB5ID0gMFxuXHRyZXR1cm4ge3gsIHl9XG4gICAgfVxuXG4gICAgbW92ZSh4LCB5KSB7XG5cdHRoaXMubm9kZS5zdHlsZS5sZWZ0ID0geCArICdweCdcblx0dGhpcy5ub2RlLnN0eWxlLnRvcCA9IHkgKyAncHgnXG5cdHRoaXMubm9kZS5zdHlsZS5yaWdodCA9ICdhdXRvJ1xuXHR0aGlzLm5vZGUuc3R5bGUuYm90dG9tID0gJ2F1dG8nXG4gICAgfVxuXG4gICAgdmFsaWRfZXZlbnQoZXZlbnQpIHtcblx0cmV0dXJuICh0aGlzLm5vZGUgPT09IGV2ZW50LnRhcmdldCkgJiYgKGV2ZW50LmJ1dHRvbiA9PT0gMClcbiAgICB9XG5cbiAgICBfbW91c2Vkb3duKGV2ZW50KSB7XG5cdGlmICghdGhpcy52YWxpZF9ldmVudChldmVudCkpIHJldHVyblxuXHR0aGlzLm9mZnNldF94ID0gZXZlbnQuY2xpZW50WCAtIHRoaXMubm9kZS5vZmZzZXRMZWZ0XG5cdHRoaXMub2Zmc2V0X3kgPSBldmVudC5jbGllbnRZIC0gdGhpcy5ub2RlLm9mZnNldFRvcFxuXHR0aGlzLmxvZyhgbW91c2Vkb3duLCBvZmZzZXRfeD0ke3RoaXMub2Zmc2V0X3h9LCBvZmZzZXRfeT0ke3RoaXMub2Zmc2V0X3l9YClcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5tb3VzZW1vdmUpXG5cdHRoaXMuX21vdXNlbW92ZShldmVudClcbiAgICB9XG5cbiAgICBfbW91c2Vtb3ZlKGV2ZW50KSB7XG5cdHRoaXMubm9kZS5zdHlsZS5jdXJzb3IgPSAnbW92ZSdcblx0bGV0IHAgPSB0aGlzLnBvc2l0aW9uKGV2ZW50KVxuXHR0aGlzLm1vdmUocC54LCBwLnkpXG4gICAgfVxuXG4gICAgLy8gd2hlbiBgZm9yY2VgIGlzIHRydWUsIGBldmVudGAgc2hvdWxkIGJlIG51bGwgYmVjYXVzZSB3ZSdyZVxuICAgIC8vIGludm9raW5nIF9tb3VzZXVwKCkgbWFudWFsbHkgZnJvbSBhIGNvbXBsZXRlbHkgZGlmZiBjb250ZXh0IHRvXG4gICAgLy8gZm9yY2libHkgcmVtb3ZlIG1vdXNlbW92ZSBsaXN0ZW5lci5cbiAgICBfbW91c2V1cChldmVudCwgZm9yY2UpIHtcblx0aWYgKCFmb3JjZSAmJiAhdGhpcy52YWxpZF9ldmVudChldmVudCkpIHJldHVyblxuXHR0aGlzLmxvZygnbW91c2V1cCcpXG5cdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMubW91c2Vtb3ZlKVxuXHR0aGlzLm5vZGUuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnXG5cblx0Ly8gc2F2ZSB0aGUgd2lkZ2V0IHBvc2l0aW9uXG5cdGlmICghdGhpcy5zdG9yYWdlX2lkIHx8IGZvcmNlKSByZXR1cm5cblx0bGV0IHAgPSB0aGlzLnBvc2l0aW9uKGV2ZW50KVxuXHRzdG9yZS5zZXQodGhpcy5zdG9yYWdlX2lkLCB7XG5cdCAgICBsZWZ0OiBwLnggKyAncHgnLFxuXHQgICAgdG9wOiBwLnkgKyAncHgnLFxuXHQgICAgcmlnaHQ6ICdhdXRvJyxcblx0ICAgIGJvdHRvbTogJ2F1dG8nXG5cdH0pXG5cdHRoaXMubG9nKCdzYXZlZCcpXG4gICAgfVxuXG4gICAgaG9vaygpIHtcblx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubW91c2Vkb3duKVxuXHR0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMubW91c2V1cClcbiAgICB9XG5cbiAgICB1bmhvb2soKSB7XG5cdHRoaXMubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm1vdXNlZG93bilcblx0dGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm1vdXNldXApXG5cdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMubW91c2Vtb3ZlKVxuICAgIH1cbn1cblxubGV0IFRvY0p1bXBlciA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3RvcihvcHQpIHtcblx0dGhpcy5kYXRhID0gbnVsbFxuXG5cdHRoaXMub3B0ID0ge1xuXHQgICAgaWQ6ICd0b2NfanVtcGVyJyxcblx0ICAgIHNlbGVjdG9yOiAnJyxcblx0ICAgIHRyYW5zZm9ybTogbnVsbCxcblx0ICAgIGtleTogJ2knLFxuXHQgICAgcHJlZl9zYXZlOiB0cnVlLFxuXG5cdCAgICB0b3A6ICc0ZW0nLFxuXHQgICAgcmlnaHQ6ICcuNWVtJyxcblx0ICAgIGJvdHRvbTogJ2F1dG8nLFxuXHQgICAgbGVmdDogJ2F1dG8nLFxuXHR9XG5cblx0Ly8gbWVyZ2UgdXNlciBvcHRpb25zXG5cdGZvciAobGV0IGlkeCBpbiBvcHQpIHRoaXMub3B0W2lkeF0gPSBvcHRbaWR4XVxuXG5cdGlmICh0aGlzLm9wdC5wcmVmX3NhdmUpIHRoaXMub3B0LnN0b3JhZ2VfaWQgPSBgdG9jX2p1bXBlci0tJHt0aGlzLm9wdC5pZH1gXG5cblx0dGhpcy5sb2cgPSBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUsICdUb2NKdW1wZXI6Jylcblx0dGhpcy5sb2coJ2luaXQnKVxuICAgIH1cblxuICAgIGxvYWRfc2F2ZWRfb3B0KCkge1xuXHRpZiAoIXRoaXMub3B0LnN0b3JhZ2VfaWQpIHJldHVyblxuXHRsZXQgc2F2ZWRfb3B0ID0gc3RvcmUuZ2V0KHRoaXMub3B0LnN0b3JhZ2VfaWQpXG5cdGlmIChzYXZlZF9vcHQpIHtcblx0ICAgIFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J11cblx0XHQuZm9yRWFjaCggKGlkeCkgPT4gdGhpcy5vcHRbaWR4XSA9IHNhdmVkX29wdFtpZHhdIHx8IHRoaXMub3B0W2lkeF0gKVxuXHQgICAgdGhpcy5sb2coXCJsb2FkZWQgc2F2ZWQgb3B0aW9uc1wiKVxuXHR9XG4gICAgfVxuXG4gICAgc2Nyb2xsKHRlcm0pIHtcblx0aWYgKHRlcm0gaW4gdGhpcy5kYXRhKSB7XG5cdCAgICB0aGlzLmxvZyh0ZXJtKVxuXHQgICAgdGhpcy5kYXRhW3Rlcm1dLnNjcm9sbEludG9WaWV3KHRydWUpXG5cdH1cbiAgICB9XG5cbiAgICBob29rKCkge1xuXHR0aGlzLmRhdGEgPSBtYWtlX2luZGV4KHRoaXMub3B0LnNlbGVjdG9yLCB0aGlzLm9wdC50cmFuc2Zvcm0pXG5cdGNzc19pbmplY3QoeyBpZDogdGhpcy5vcHQuaWQgfSlcblx0ZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG5cdCAgICBpZiAoWydJTlBVVCcsICdURVhUQVJFQSddLmluZGV4T2YoZXZlbnQudGFyZ2V0Lm5vZGVOYW1lKSAhPT0gLTEpXG5cdFx0cmV0dXJuXG5cdCAgICBpZiAoa2V5Y29kZShldmVudCkgPT09IHRoaXMub3B0LmtleSAmJiAhZXZlbnQuY3RybEtleSkgdGhpcy5kbGcoKVxuXHQgICAgaWYgKGtleWNvZGUoZXZlbnQpID09PSAnZXNjJykgdGhpcy5tb3ZhYmxlLl9tb3VzZXVwKG51bGwsIHRydWUpXG5cdH0pXG4gICAgfVxuXG4gICAgZGxnKCkge1xuXHRsZXQgbm9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMub3B0LmlkKVxuXHRpZiAobm9kZSkgcmV0dXJuIGZvY3VzKG5vZGUpXG5cblx0dGhpcy5sb2FkX3NhdmVkX29wdCgpXG5cdG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXHRub2RlLmlkID0gdGhpcy5vcHQuaWQ7XG5cdFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J11cblx0ICAgIC5mb3JFYWNoKCAoaWR4KSA9PiBub2RlLnN0eWxlW2lkeF0gPSB0aGlzLm9wdFtpZHhdIClcblxuXHRsZXQgYWNfY29udGFpbmVyID0gYCR7dGhpcy5vcHQuaWR9X2NvbnRhaW5lcmBcblx0bm9kZS5pbm5lckhUTUwgPSBgPHNwYW4gaWQ9XCIke2FjX2NvbnRhaW5lcn1cIj48aW5wdXQgc2l6ZT1cIjQwXCIgc3BlbGxjaGVjaz1cImZhbHNlXCIgLz48L3NwYW4+XG48c3BhbiBpZD1cIiR7dGhpcy5vcHQuaWR9X2Nsb3NlXCIgdGl0bGU9XCJDbG9zZVwiPjxzcGFuPiZ0aW1lczs8L3NwYW4+PC9zcGFuPmBcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKVxuXHRsZXQgaW5wdXQgPSBub2RlLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JylcblxuXHRsZXQgYWMgPSBuZXcgQXV0b0NvbXBsZXRlKHtcblx0ICAgIHNlbGVjdG9yOiBpbnB1dCxcblx0ICAgIG1pbkNoYXJzOiAxLFxuXHQgICAgZGVsYXk6IDUwLFxuXHQgICAgY29udGFpbmVyOiAnIycgKyBhY19jb250YWluZXIsXG5cdCAgICBzb3VyY2U6ICh0ZXJtLCBzdWdnZXN0KSA9PiB7XG5cdFx0bGV0IGxpc3QgPSBbXVxuXHRcdGZvciAobGV0IGtleSBpbiB0aGlzLmRhdGEpIHtcblx0XHQgICAgaWYgKGtleS50b0xvd2VyQ2FzZSgpLmluZGV4T2YodGVybS50b0xvd2VyQ2FzZSgpKSAhPT0gLTEpXG5cdFx0XHRsaXN0LnB1c2goa2V5KVxuXHRcdH1cblx0XHRzdWdnZXN0KFRvY0p1bXBlci5zb3J0KGxpc3QsIHRlcm0pKVxuXHQgICAgfSxcblx0ICAgIG9uU2VsZWN0OiAoZXZlbnQsIHRlcm0sIGl0ZW0pID0+IHRoaXMuc2Nyb2xsKHRlcm0pXG5cdH0pXG5cblx0bGV0IGRlc3Ryb3kgPSAoKSA9PiB7XG5cdCAgICBhYy5kZXN0cm95KClcblx0ICAgIHRoaXMubW92YWJsZS51bmhvb2soKVxuXHQgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChub2RlKVxuXHR9XG5cblx0bm9kZS5xdWVyeVNlbGVjdG9yKGAjJHt0aGlzLm9wdC5pZH1fY2xvc2VgKS5vbmNsaWNrID0gZGVzdHJveVxuXHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcblx0ICAgIGlmIChrZXljb2RlKGV2ZW50KSA9PT0gJ2VudGVyJykgdGhpcy5zY3JvbGwoaW5wdXQudmFsdWUpXG5cdCAgICBpZiAoa2V5Y29kZShldmVudCkgPT09ICdlc2MnKSBkZXN0cm95KClcblx0fSlcblxuXHR0aGlzLm1vdmFibGUgPSBuZXcgTW92YWJsZShub2RlLCB0aGlzLm9wdC5zdG9yYWdlX2lkKVxuXHR0aGlzLm1vdmFibGUubG9nID0gdGhpcy5sb2dcblx0dGhpcy5tb3ZhYmxlLmhvb2soKVxuXG5cdGZvY3VzKG5vZGUpXG4gICAgfVxuXG4gICAgc3RhdGljIHNvcnQoYXJyLCB0ZXJtKSB7XG5cdGlmICghdGVybSkgcmV0dXJuIGFyclxuXHR0ZXJtID0gdGVybS50b0xvd2VyQ2FzZSgpXG5cdHJldHVybiBhcnIuc29ydCggKGEsIGIpID0+IHtcblx0ICAgIGlmIChhLnNsaWNlKDAsIHRlcm0ubGVuZ3RoKS50b0xvd2VyQ2FzZSgpID09PSB0ZXJtKSByZXR1cm4gLTFcblx0ICAgIGlmIChiLnNsaWNlKDAsIHRlcm0ubGVuZ3RoKS50b0xvd2VyQ2FzZSgpID09PSB0ZXJtKSByZXR1cm4gMVxuXHQgICAgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiKVxuXHR9KVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUb2NKdW1wZXJcblxubGV0IG1ha2VfaW5kZXggPSBmdW5jdGlvbihzZWxlY3RvciwgdHJhbnNmb3JtKSB7XG4gICAgbGV0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcblxuICAgIGxldCByID0ge31cbiAgICBsZXQgY2FjaGUgPSB7fVxuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IG5vZGVzLmxlbmd0aDsgKytpZHgpIHtcblx0bGV0IG5vZGUgPSBub2Rlc1tpZHhdXG5cdGxldCBrZXkgPSB0cmFuc2Zvcm0gPyB0cmFuc2Zvcm0obm9kZS5pbm5lclRleHQpIDogbm9kZS5pbm5lclRleHRcblx0Y2FjaGVba2V5XSA9IChjYWNoZVtrZXldIHx8IDApICsgMVxuXHRpZiAoa2V5IGluIHIpIGtleSA9IGAke2tleX0gPCR7Y2FjaGVba2V5XX0+YFxuXG5cdHJba2V5XSA9IG5vZGVcbiAgICB9XG5cbiAgICByZXR1cm4gclxufVxuXG5sZXQgY3NzX2luamVjdCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBsZXQgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICBsZXQgdG1wbCA9IHRlbXBsYXRlKFwiLyogYXV0by1jb21wbGV0ZS5qcyAqL1xcbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbnMge1xcbiAgdGV4dC1hbGlnbjogbGVmdDtcXG4gIGN1cnNvcjogZGVmYXVsdDtcXG4gIGJvcmRlcjogMXB4IHNvbGlkICNjY2M7XFxuICBib3JkZXItdG9wOiAwO1xcbiAgYmFja2dyb3VuZDogd2hpdGU7XFxuICBib3gtc2hhZG93OiAtMXB4IDFweCAzcHggcmdiYSgwLCAwLCAwLCAuMSk7XFxuXFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBkaXNwbGF5OiBub25lO1xcbiAgei1pbmRleDogOTk5OTtcXG4gIG1heC1oZWlnaHQ6IDE1ZW07XFxuICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgb3ZlcmZsb3cteTogYXV0bztcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxufVxcbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbiB7XFxuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xcbn1cXG4uYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQge1xcbiAgYmFja2dyb3VuZDogI2VlZTtcXG59XFxuXFxuLyogdG9jLWp1bXBlciAqL1xcbiM8JT0gaWQgJT4ge1xcbiAgYm9yZGVyOiAxcHggc29saWQgI2E5YTlhOTtcXG4gIHBhZGRpbmc6IDAuOGVtO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICBjb2xvcjogYmxhY2s7XFxuICBib3gtc2hhZG93OiAxcHggMXB4IDNweCByZ2JhKDAsIDAsIDAsIC40KTtcXG5cXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG59XFxuXFxuIzwlPSBpZCAlPl9jbG9zZSB7XFxuICBtYXJnaW4tbGVmdDogMWVtO1xcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxuICBjdXJzb3I6IHBvaW50ZXI7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxuICBsaW5lLWhlaWdodDogMmVtO1xcbiAgd2lkdGg6IDJlbTtcXG4gIGhlaWdodDogMmVtO1xcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbn1cXG5cXG4jPCU9IGlkICU+X2Nsb3NlOmhvdmVyIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICNlODExMjM7XFxuICBjb2xvcjogd2hpdGU7XFxufVxcblwiKVxuICAgIG5vZGUuaW5uZXJIVE1MID0gdG1wbChkYXRhKVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZSlcbn1cblxubGV0IGZvY3VzID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHNldFRpbWVvdXQoICgpID0+IG5vZGUucXVlcnlTZWxlY3RvcignaW5wdXQnKS5mb2N1cygpLCAxKVxufVxuIiwiLy8gU291cmNlOiBodHRwOi8vanNmaWRkbGUubmV0L3ZXeDhWL1xuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81NjAzMTk1L2Z1bGwtbGlzdC1vZi1qYXZhc2NyaXB0LWtleWNvZGVzXG5cbi8qKlxuICogQ29uZW5pZW5jZSBtZXRob2QgcmV0dXJucyBjb3JyZXNwb25kaW5nIHZhbHVlIGZvciBnaXZlbiBrZXlOYW1lIG9yIGtleUNvZGUuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0ga2V5Q29kZSB7TnVtYmVyfSBvciBrZXlOYW1lIHtTdHJpbmd9XG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VhcmNoSW5wdXQpIHtcbiAgLy8gS2V5Ym9hcmQgRXZlbnRzXG4gIGlmIChzZWFyY2hJbnB1dCAmJiAnb2JqZWN0JyA9PT0gdHlwZW9mIHNlYXJjaElucHV0KSB7XG4gICAgdmFyIGhhc0tleUNvZGUgPSBzZWFyY2hJbnB1dC53aGljaCB8fCBzZWFyY2hJbnB1dC5rZXlDb2RlIHx8IHNlYXJjaElucHV0LmNoYXJDb2RlXG4gICAgaWYgKGhhc0tleUNvZGUpIHNlYXJjaElucHV0ID0gaGFzS2V5Q29kZVxuICB9XG5cbiAgLy8gTnVtYmVyc1xuICBpZiAoJ251bWJlcicgPT09IHR5cGVvZiBzZWFyY2hJbnB1dCkgcmV0dXJuIG5hbWVzW3NlYXJjaElucHV0XVxuXG4gIC8vIEV2ZXJ5dGhpbmcgZWxzZSAoY2FzdCB0byBzdHJpbmcpXG4gIHZhciBzZWFyY2ggPSBTdHJpbmcoc2VhcmNoSW5wdXQpXG5cbiAgLy8gY2hlY2sgY29kZXNcbiAgdmFyIGZvdW5kTmFtZWRLZXkgPSBjb2Rlc1tzZWFyY2gudG9Mb3dlckNhc2UoKV1cbiAgaWYgKGZvdW5kTmFtZWRLZXkpIHJldHVybiBmb3VuZE5hbWVkS2V5XG5cbiAgLy8gY2hlY2sgYWxpYXNlc1xuICB2YXIgZm91bmROYW1lZEtleSA9IGFsaWFzZXNbc2VhcmNoLnRvTG93ZXJDYXNlKCldXG4gIGlmIChmb3VuZE5hbWVkS2V5KSByZXR1cm4gZm91bmROYW1lZEtleVxuXG4gIC8vIHdlaXJkIGNoYXJhY3Rlcj9cbiAgaWYgKHNlYXJjaC5sZW5ndGggPT09IDEpIHJldHVybiBzZWFyY2guY2hhckNvZGVBdCgwKVxuXG4gIHJldHVybiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBHZXQgYnkgbmFtZVxuICpcbiAqICAgZXhwb3J0cy5jb2RlWydlbnRlciddIC8vID0+IDEzXG4gKi9cblxudmFyIGNvZGVzID0gZXhwb3J0cy5jb2RlID0gZXhwb3J0cy5jb2RlcyA9IHtcbiAgJ2JhY2tzcGFjZSc6IDgsXG4gICd0YWInOiA5LFxuICAnZW50ZXInOiAxMyxcbiAgJ3NoaWZ0JzogMTYsXG4gICdjdHJsJzogMTcsXG4gICdhbHQnOiAxOCxcbiAgJ3BhdXNlL2JyZWFrJzogMTksXG4gICdjYXBzIGxvY2snOiAyMCxcbiAgJ2VzYyc6IDI3LFxuICAnc3BhY2UnOiAzMixcbiAgJ3BhZ2UgdXAnOiAzMyxcbiAgJ3BhZ2UgZG93bic6IDM0LFxuICAnZW5kJzogMzUsXG4gICdob21lJzogMzYsXG4gICdsZWZ0JzogMzcsXG4gICd1cCc6IDM4LFxuICAncmlnaHQnOiAzOSxcbiAgJ2Rvd24nOiA0MCxcbiAgJ2luc2VydCc6IDQ1LFxuICAnZGVsZXRlJzogNDYsXG4gICdjb21tYW5kJzogOTEsXG4gICdsZWZ0IGNvbW1hbmQnOiA5MSxcbiAgJ3JpZ2h0IGNvbW1hbmQnOiA5MyxcbiAgJ251bXBhZCAqJzogMTA2LFxuICAnbnVtcGFkICsnOiAxMDcsXG4gICdudW1wYWQgLSc6IDEwOSxcbiAgJ251bXBhZCAuJzogMTEwLFxuICAnbnVtcGFkIC8nOiAxMTEsXG4gICdudW0gbG9jayc6IDE0NCxcbiAgJ3Njcm9sbCBsb2NrJzogMTQ1LFxuICAnbXkgY29tcHV0ZXInOiAxODIsXG4gICdteSBjYWxjdWxhdG9yJzogMTgzLFxuICAnOyc6IDE4NixcbiAgJz0nOiAxODcsXG4gICcsJzogMTg4LFxuICAnLSc6IDE4OSxcbiAgJy4nOiAxOTAsXG4gICcvJzogMTkxLFxuICAnYCc6IDE5MixcbiAgJ1snOiAyMTksXG4gICdcXFxcJzogMjIwLFxuICAnXSc6IDIyMSxcbiAgXCInXCI6IDIyMlxufVxuXG4vLyBIZWxwZXIgYWxpYXNlc1xuXG52YXIgYWxpYXNlcyA9IGV4cG9ydHMuYWxpYXNlcyA9IHtcbiAgJ3dpbmRvd3MnOiA5MSxcbiAgJ+KHpyc6IDE2LFxuICAn4oylJzogMTgsXG4gICfijIMnOiAxNyxcbiAgJ+KMmCc6IDkxLFxuICAnY3RsJzogMTcsXG4gICdjb250cm9sJzogMTcsXG4gICdvcHRpb24nOiAxOCxcbiAgJ3BhdXNlJzogMTksXG4gICdicmVhayc6IDE5LFxuICAnY2Fwcyc6IDIwLFxuICAncmV0dXJuJzogMTMsXG4gICdlc2NhcGUnOiAyNyxcbiAgJ3NwYyc6IDMyLFxuICAncGd1cCc6IDMzLFxuICAncGdkbic6IDM0LFxuICAnaW5zJzogNDUsXG4gICdkZWwnOiA0NixcbiAgJ2NtZCc6IDkxXG59XG5cblxuLyohXG4gKiBQcm9ncmFtYXRpY2FsbHkgYWRkIHRoZSBmb2xsb3dpbmdcbiAqL1xuXG4vLyBsb3dlciBjYXNlIGNoYXJzXG5mb3IgKGkgPSA5NzsgaSA8IDEyMzsgaSsrKSBjb2Rlc1tTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGkgLSAzMlxuXG4vLyBudW1iZXJzXG5mb3IgKHZhciBpID0gNDg7IGkgPCA1ODsgaSsrKSBjb2Rlc1tpIC0gNDhdID0gaVxuXG4vLyBmdW5jdGlvbiBrZXlzXG5mb3IgKGkgPSAxOyBpIDwgMTM7IGkrKykgY29kZXNbJ2YnK2ldID0gaSArIDExMVxuXG4vLyBudW1wYWQga2V5c1xuZm9yIChpID0gMDsgaSA8IDEwOyBpKyspIGNvZGVzWydudW1wYWQgJytpXSA9IGkgKyA5NlxuXG4vKipcbiAqIEdldCBieSBjb2RlXG4gKlxuICogICBleHBvcnRzLm5hbWVbMTNdIC8vID0+ICdFbnRlcidcbiAqL1xuXG52YXIgbmFtZXMgPSBleHBvcnRzLm5hbWVzID0gZXhwb3J0cy50aXRsZSA9IHt9IC8vIHRpdGxlIGZvciBiYWNrd2FyZCBjb21wYXRcblxuLy8gQ3JlYXRlIHJldmVyc2UgbWFwcGluZ1xuZm9yIChpIGluIGNvZGVzKSBuYW1lc1tjb2Rlc1tpXV0gPSBpXG5cbi8vIEFkZCBhbGlhc2VzXG5mb3IgKHZhciBhbGlhcyBpbiBhbGlhc2VzKSB7XG4gIGNvZGVzW2FsaWFzXSA9IGFsaWFzZXNbYWxpYXNdXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuLy8gTW9kdWxlIGV4cG9ydCBwYXR0ZXJuIGZyb21cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvcmV0dXJuRXhwb3J0cy5qc1xuOyhmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuICAgICAgICAvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcbiAgICAgICAgLy8gbGlrZSBOb2RlLlxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHMgKHJvb3QgaXMgd2luZG93KVxuICAgICAgICByb290LnN0b3JlID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblx0XG5cdC8vIFN0b3JlLmpzXG5cdHZhciBzdG9yZSA9IHt9LFxuXHRcdHdpbiA9ICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsKSxcblx0XHRkb2MgPSB3aW4uZG9jdW1lbnQsXG5cdFx0bG9jYWxTdG9yYWdlTmFtZSA9ICdsb2NhbFN0b3JhZ2UnLFxuXHRcdHNjcmlwdFRhZyA9ICdzY3JpcHQnLFxuXHRcdHN0b3JhZ2VcblxuXHRzdG9yZS5kaXNhYmxlZCA9IGZhbHNlXG5cdHN0b3JlLnZlcnNpb24gPSAnMS4zLjIwJ1xuXHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7fVxuXHRzdG9yZS5nZXQgPSBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWwpIHt9XG5cdHN0b3JlLmhhcyA9IGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gc3RvcmUuZ2V0KGtleSkgIT09IHVuZGVmaW5lZCB9XG5cdHN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uKGtleSkge31cblx0c3RvcmUuY2xlYXIgPSBmdW5jdGlvbigpIHt9XG5cdHN0b3JlLnRyYW5zYWN0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsLCB0cmFuc2FjdGlvbkZuKSB7XG5cdFx0aWYgKHRyYW5zYWN0aW9uRm4gPT0gbnVsbCkge1xuXHRcdFx0dHJhbnNhY3Rpb25GbiA9IGRlZmF1bHRWYWxcblx0XHRcdGRlZmF1bHRWYWwgPSBudWxsXG5cdFx0fVxuXHRcdGlmIChkZWZhdWx0VmFsID09IG51bGwpIHtcblx0XHRcdGRlZmF1bHRWYWwgPSB7fVxuXHRcdH1cblx0XHR2YXIgdmFsID0gc3RvcmUuZ2V0KGtleSwgZGVmYXVsdFZhbClcblx0XHR0cmFuc2FjdGlvbkZuKHZhbClcblx0XHRzdG9yZS5zZXQoa2V5LCB2YWwpXG5cdH1cblx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oKSB7fVxuXHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oKSB7fVxuXG5cdHN0b3JlLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXHR9XG5cdHN0b3JlLmRlc2VyaWFsaXplID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7IHJldHVybiB1bmRlZmluZWQgfVxuXHRcdHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHZhbHVlKSB9XG5cdFx0Y2F0Y2goZSkgeyByZXR1cm4gdmFsdWUgfHwgdW5kZWZpbmVkIH1cblx0fVxuXG5cdC8vIEZ1bmN0aW9ucyB0byBlbmNhcHN1bGF0ZSBxdWVzdGlvbmFibGUgRmlyZUZveCAzLjYuMTMgYmVoYXZpb3Jcblx0Ly8gd2hlbiBhYm91dC5jb25maWc6OmRvbS5zdG9yYWdlLmVuYWJsZWQgPT09IGZhbHNlXG5cdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFyY3Vzd2VzdGluL3N0b3JlLmpzL2lzc3VlcyNpc3N1ZS8xM1xuXHRmdW5jdGlvbiBpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSB7XG5cdFx0dHJ5IHsgcmV0dXJuIChsb2NhbFN0b3JhZ2VOYW1lIGluIHdpbiAmJiB3aW5bbG9jYWxTdG9yYWdlTmFtZV0pIH1cblx0XHRjYXRjaChlcnIpIHsgcmV0dXJuIGZhbHNlIH1cblx0fVxuXG5cdGlmIChpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSkge1xuXHRcdHN0b3JhZ2UgPSB3aW5bbG9jYWxTdG9yYWdlTmFtZV1cblx0XHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdFx0aWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XG5cdFx0XHRzdG9yYWdlLnNldEl0ZW0oa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHJldHVybiB2YWxcblx0XHR9XG5cdFx0c3RvcmUuZ2V0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsKSB7XG5cdFx0XHR2YXIgdmFsID0gc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRJdGVtKGtleSkpXG5cdFx0XHRyZXR1cm4gKHZhbCA9PT0gdW5kZWZpbmVkID8gZGVmYXVsdFZhbCA6IHZhbClcblx0XHR9XG5cdFx0c3RvcmUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7IHN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpIH1cblx0XHRzdG9yZS5jbGVhciA9IGZ1bmN0aW9uKCkgeyBzdG9yYWdlLmNsZWFyKCkgfVxuXHRcdHN0b3JlLmdldEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxzdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBrZXkgPSBzdG9yYWdlLmtleShpKVxuXHRcdFx0XHRjYWxsYmFjayhrZXksIHN0b3JlLmdldChrZXkpKVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmIChkb2MgJiYgZG9jLmRvY3VtZW50RWxlbWVudC5hZGRCZWhhdmlvcikge1xuXHRcdHZhciBzdG9yYWdlT3duZXIsXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyXG5cdFx0Ly8gU2luY2UgI3VzZXJEYXRhIHN0b3JhZ2UgYXBwbGllcyBvbmx5IHRvIHNwZWNpZmljIHBhdGhzLCB3ZSBuZWVkIHRvXG5cdFx0Ly8gc29tZWhvdyBsaW5rIG91ciBkYXRhIHRvIGEgc3BlY2lmaWMgcGF0aC4gIFdlIGNob29zZSAvZmF2aWNvbi5pY29cblx0XHQvLyBhcyBhIHByZXR0eSBzYWZlIG9wdGlvbiwgc2luY2UgYWxsIGJyb3dzZXJzIGFscmVhZHkgbWFrZSBhIHJlcXVlc3QgdG9cblx0XHQvLyB0aGlzIFVSTCBhbnl3YXkgYW5kIGJlaW5nIGEgNDA0IHdpbGwgbm90IGh1cnQgdXMgaGVyZS4gIFdlIHdyYXAgYW5cblx0XHQvLyBpZnJhbWUgcG9pbnRpbmcgdG8gdGhlIGZhdmljb24gaW4gYW4gQWN0aXZlWE9iamVjdChodG1sZmlsZSkgb2JqZWN0XG5cdFx0Ly8gKHNlZTogaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2FhNzUyNTc0KHY9VlMuODUpLmFzcHgpXG5cdFx0Ly8gc2luY2UgdGhlIGlmcmFtZSBhY2Nlc3MgcnVsZXMgYXBwZWFyIHRvIGFsbG93IGRpcmVjdCBhY2Nlc3MgYW5kXG5cdFx0Ly8gbWFuaXB1bGF0aW9uIG9mIHRoZSBkb2N1bWVudCBlbGVtZW50LCBldmVuIGZvciBhIDQwNCBwYWdlLiAgVGhpc1xuXHRcdC8vIGRvY3VtZW50IGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgZG9jdW1lbnQgKHdoaWNoIHdvdWxkXG5cdFx0Ly8gaGF2ZSBiZWVuIGxpbWl0ZWQgdG8gdGhlIGN1cnJlbnQgcGF0aCkgdG8gcGVyZm9ybSAjdXNlckRhdGEgc3RvcmFnZS5cblx0XHR0cnkge1xuXHRcdFx0c3RvcmFnZUNvbnRhaW5lciA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyLm9wZW4oKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci53cml0ZSgnPCcrc2NyaXB0VGFnKyc+ZG9jdW1lbnQudz13aW5kb3c8Lycrc2NyaXB0VGFnKyc+PGlmcmFtZSBzcmM9XCIvZmF2aWNvbi5pY29cIj48L2lmcmFtZT4nKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci5jbG9zZSgpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBzdG9yYWdlQ29udGFpbmVyLncuZnJhbWVzWzBdLmRvY3VtZW50XG5cdFx0XHRzdG9yYWdlID0gc3RvcmFnZU93bmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHQvLyBzb21laG93IEFjdGl2ZVhPYmplY3QgaW5zdGFudGlhdGlvbiBmYWlsZWQgKHBlcmhhcHMgc29tZSBzcGVjaWFsXG5cdFx0XHQvLyBzZWN1cml0eSBzZXR0aW5ncyBvciBvdGhlcndzZSksIGZhbGwgYmFjayB0byBwZXItcGF0aCBzdG9yYWdlXG5cdFx0XHRzdG9yYWdlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBkb2MuYm9keVxuXHRcdH1cblx0XHR2YXIgd2l0aElFU3RvcmFnZSA9IGZ1bmN0aW9uKHN0b3JlRnVuY3Rpb24pIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG5cdFx0XHRcdGFyZ3MudW5zaGlmdChzdG9yYWdlKVxuXHRcdFx0XHQvLyBTZWUgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxMDgxKHY9VlMuODUpLmFzcHhcblx0XHRcdFx0Ly8gYW5kIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTQyNCh2PVZTLjg1KS5hc3B4XG5cdFx0XHRcdHN0b3JhZ2VPd25lci5hcHBlbmRDaGlsZChzdG9yYWdlKVxuXHRcdFx0XHRzdG9yYWdlLmFkZEJlaGF2aW9yKCcjZGVmYXVsdCN1c2VyRGF0YScpXG5cdFx0XHRcdHN0b3JhZ2UubG9hZChsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gc3RvcmVGdW5jdGlvbi5hcHBseShzdG9yZSwgYXJncylcblx0XHRcdFx0c3RvcmFnZU93bmVyLnJlbW92ZUNoaWxkKHN0b3JhZ2UpXG5cdFx0XHRcdHJldHVybiByZXN1bHRcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJbiBJRTcsIGtleXMgY2Fubm90IHN0YXJ0IHdpdGggYSBkaWdpdCBvciBjb250YWluIGNlcnRhaW4gY2hhcnMuXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzQwXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzgzXG5cdFx0dmFyIGZvcmJpZGRlbkNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKFwiWyFcXFwiIyQlJicoKSorLC9cXFxcXFxcXDo7PD0+P0BbXFxcXF1eYHt8fX5dXCIsIFwiZ1wiKVxuXHRcdHZhciBpZUtleUZpeCA9IGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0cmV0dXJuIGtleS5yZXBsYWNlKC9eZC8sICdfX18kJicpLnJlcGxhY2UoZm9yYmlkZGVuQ2hhcnNSZWdleCwgJ19fXycpXG5cdFx0fVxuXHRcdHN0b3JlLnNldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5LCB2YWwpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gc3RvcmUucmVtb3ZlKGtleSkgfVxuXHRcdFx0c3RvcmFnZS5zZXRBdHRyaWJ1dGUoa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0cmV0dXJuIHZhbFxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0ID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXksIGRlZmF1bHRWYWwpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdHZhciB2YWwgPSBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEF0dHJpYnV0ZShrZXkpKVxuXHRcdFx0cmV0dXJuICh2YWwgPT09IHVuZGVmaW5lZCA/IGRlZmF1bHRWYWwgOiB2YWwpXG5cdFx0fSlcblx0XHRzdG9yZS5yZW1vdmUgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UsIGtleSkge1xuXHRcdFx0a2V5ID0gaWVLZXlGaXgoa2V5KVxuXHRcdFx0c3RvcmFnZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KVxuXHRcdFx0c3RvcmFnZS5zYXZlKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0fSlcblx0XHRzdG9yZS5jbGVhciA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRzdG9yYWdlLmxvYWQobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRcdGZvciAodmFyIGk9YXR0cmlidXRlcy5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG5cdFx0XHRcdHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZXNbaV0ubmFtZSlcblx0XHRcdH1cblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBjYWxsYmFjaykge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgKytpKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGF0dHIubmFtZSwgc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoYXR0ci5uYW1lKSkpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHRyeSB7XG5cdFx0dmFyIHRlc3RLZXkgPSAnX19zdG9yZWpzX18nXG5cdFx0c3RvcmUuc2V0KHRlc3RLZXksIHRlc3RLZXkpXG5cdFx0aWYgKHN0b3JlLmdldCh0ZXN0S2V5KSAhPSB0ZXN0S2V5KSB7IHN0b3JlLmRpc2FibGVkID0gdHJ1ZSB9XG5cdFx0c3RvcmUucmVtb3ZlKHRlc3RLZXkpXG5cdH0gY2F0Y2goZSkge1xuXHRcdHN0b3JlLmRpc2FibGVkID0gdHJ1ZVxuXHR9XG5cdHN0b3JlLmVuYWJsZWQgPSAhc3RvcmUuZGlzYWJsZWRcblx0XG5cdHJldHVybiBzdG9yZVxufSkpO1xuIiwiLypcbiAgQSBtb2RpZmllZCBfLnRlbXBsYXRlKCkgZnJvbSB1bmRlcnNjb3JlLmpzLlxuXG4gIFdoeSBub3QgdXNlIGxvZGFzaC90ZW1wbGF0ZT8gVGhpcyB2ZXJzaW9uIGlzIH41IHRpbWVzIHNtYWxsZXIuXG4qL1xuXG52YXIgbm9NYXRjaCA9IC8oLileLztcbnZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG59O1xuXG52YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHUyMDI4fFxcdTIwMjkvZztcblxudmFyIGVzY2FwZUNoYXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTtcbn07XG5cbnZhciB0ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGV4dCkge1xuICAgIHZhciBzZXR0aW5ncyA9IHRlbXBsYXRlU2V0dGluZ3M7XG5cbiAgICB2YXIgbWF0Y2hlciA9IFJlZ0V4cChbXG5cdChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuXHQoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuXHQoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcblx0c291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldCkucmVwbGFjZShlc2NhcGVyLCBlc2NhcGVDaGFyKTtcblx0aW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cblx0aWYgKGVzY2FwZSkge1xuXHQgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcblx0fSBlbHNlIGlmIChpbnRlcnBvbGF0ZSkge1xuXHQgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG5cdH0gZWxzZSBpZiAoZXZhbHVhdGUpIHtcblx0ICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG5cdH1cblxuXHRyZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG5cdFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG5cdHNvdXJjZSArICdyZXR1cm4gX19wO1xcbic7XG5cbiAgICB2YXIgcmVuZGVyXG4gICAgdHJ5IHtcblx0cmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcblx0ZS5zb3VyY2UgPSBzb3VyY2U7XG5cdHRocm93IGU7XG4gICAgfVxuXG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuXHRyZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSk7XG4gICAgfTtcblxuICAgIHZhciBhcmd1bWVudCA9IHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonO1xuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgYXJndW1lbnQgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xufTtcbiJdfQ==
// ]]>
