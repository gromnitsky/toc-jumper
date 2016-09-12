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
												if (event.key === _this2.opt.key && !event.ctrlKey) _this2.dlg();
												if (is_escape_key(event)) _this2.movable._mouseup(null, true);
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
												if (event.key === 'Enter') _this3.scroll(input.value);
												if (is_escape_key(event)) destroy();
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

// IE11 returns "Esc", Chrome & Firefox return "Escape"
var is_escape_key = function is_escape_key(event) {
			return event.key.match(/^Esc/);
};

},{"./auto-complete.js":1,"./template":4,"store":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL29wdC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImF1dG8tY29tcGxldGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdG9yZS9zdG9yZS5qcyIsInRlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBOzs7Ozs7O0FBT0EsSUFBSSxlQUFnQixZQUFVO0FBQzFCO0FBQ0EsYUFBUyxZQUFULENBQXNCLE9BQXRCLEVBQThCO0FBQzFCLFlBQUksQ0FBQyxTQUFTLGFBQWQsRUFBNkI7O0FBRTdCO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFzQixTQUF0QixFQUFnQztBQUFFLG1CQUFPLEdBQUcsU0FBSCxHQUFlLEdBQUcsU0FBSCxDQUFhLFFBQWIsQ0FBc0IsU0FBdEIsQ0FBZixHQUFrRCxJQUFJLE1BQUosQ0FBVyxRQUFPLFNBQVAsR0FBaUIsS0FBNUIsRUFBbUMsSUFBbkMsQ0FBd0MsR0FBRyxTQUEzQyxDQUF6RDtBQUFpSDs7QUFFbkosaUJBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFzQixJQUF0QixFQUE0QixPQUE1QixFQUFvQztBQUNoQyxnQkFBSSxHQUFHLFdBQVAsRUFBb0IsR0FBRyxXQUFILENBQWUsT0FBSyxJQUFwQixFQUEwQixPQUExQixFQUFwQixLQUE2RCxHQUFHLGdCQUFILENBQW9CLElBQXBCLEVBQTBCLE9BQTFCO0FBQ2hFO0FBQ0QsaUJBQVMsV0FBVCxDQUFxQixFQUFyQixFQUF5QixJQUF6QixFQUErQixPQUEvQixFQUF1QztBQUNuQztBQUNBLGdCQUFJLEdBQUcsV0FBUCxFQUFvQixHQUFHLFdBQUgsQ0FBZSxPQUFLLElBQXBCLEVBQTBCLE9BQTFCLEVBQXBCLEtBQTZELEdBQUcsbUJBQUgsQ0FBdUIsSUFBdkIsRUFBNkIsT0FBN0I7QUFDaEU7QUFDRCxpQkFBUyxJQUFU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ZUFGTjs7QUFJQSxPQUFJLE1BQUo7QUFDQSxPQUFJO0FBQ1AsZUFBUyxJQUFJLFFBQUosQ0FBYSxTQUFTLFFBQVQsSUFBcUIsS0FBbEMsRUFBeUMsTUFBekMsQ0FBVDtBQUNJLElBRkQsQ0FFRSxPQUFPLENBQVAsRUFBVTtBQUNmLFFBQUUsTUFBRixHQUFXLE1BQVg7QUFDQSxZQUFNLENBQU47QUFDSTs7QUFFRCxPQUFJLFdBQVcsU0FBWCxRQUFXLENBQVMsSUFBVCxFQUFlO0FBQ2pDLGFBQU8sT0FBTyxJQUFQLENBQVksSUFBWixFQUFrQixJQUFsQixDQUFQO0FBQ0ksSUFGRDs7QUFJQSxPQUFJLFdBQVcsU0FBUyxRQUFULElBQXFCLEtBQXBDO0FBQ0EsWUFBUyxNQUFULEdBQWtCLGNBQWMsUUFBZCxHQUF5QixNQUF6QixHQUFrQyxNQUFsQyxHQUEyQyxHQUE3RDs7QUFFQSxVQUFPLFFBQVA7QUFDSCxDQWpERCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICAgIEphdmFTY3JpcHQgYXV0b0NvbXBsZXRlIHYxLjAuNFxuICAgIENvcHlyaWdodCAoYykgMjAxNCBTaW1vbiBTdGVpbmJlcmdlciAvIFBpeGFiYXlcbiAgICBHaXRIdWI6IGh0dHBzOi8vZ2l0aHViLmNvbS9QaXhhYmF5L0phdmFTY3JpcHQtYXV0b0NvbXBsZXRlXG4gICAgTGljZW5zZTogaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcbiovXG5cbnZhciBhdXRvQ29tcGxldGUgPSAoZnVuY3Rpb24oKXtcbiAgICAvLyBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBhdXRvQ29tcGxldGUob3B0aW9ucyl7XG4gICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcikgcmV0dXJuO1xuXG4gICAgICAgIC8vIGhlbHBlcnNcbiAgICAgICAgZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIGNsYXNzTmFtZSl7IHJldHVybiBlbC5jbGFzc0xpc3QgPyBlbC5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKSA6IG5ldyBSZWdFeHAoJ1xcXFxiJysgY2xhc3NOYW1lKydcXFxcYicpLnRlc3QoZWwuY2xhc3NOYW1lKTsgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFkZEV2ZW50KGVsLCB0eXBlLCBoYW5kbGVyKXtcbiAgICAgICAgICAgIGlmIChlbC5hdHRhY2hFdmVudCkgZWwuYXR0YWNoRXZlbnQoJ29uJyt0eXBlLCBoYW5kbGVyKTsgZWxzZSBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGVsLCB0eXBlLCBoYW5kbGVyKXtcbiAgICAgICAgICAgIC8vIGlmIChlbC5yZW1vdmVFdmVudExpc3RlbmVyKSBub3Qgd29ya2luZyBpbiBJRTExXG4gICAgICAgICAgICBpZiAoZWwuZGV0YWNoRXZlbnQpIGVsLmRldGFjaEV2ZW50KCdvbicrdHlwZSwgaGFuZGxlcik7IGVsc2UgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBsaXZlKGVsQ2xhc3MsIGV2ZW50LCBjYiwgY29udGV4dCl7XG4gICAgICAgICAgICBhZGRFdmVudChjb250ZXh0IHx8IGRvY3VtZW50LCBldmVudCwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIGZvdW5kLCBlbCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWwgJiYgIShmb3VuZCA9IGhhc0NsYXNzKGVsLCBlbENsYXNzKSkpIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIGNiLmNhbGwoZWwsIGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbyA9IHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiAwLFxuICAgICAgICAgICAgc291cmNlOiAwLFxuICAgICAgICAgICAgbWluQ2hhcnM6IDMsXG4gICAgICAgICAgICBkZWxheTogMTUwLFxuICAgICAgICAgICAgb2Zmc2V0TGVmdDogMCxcbiAgICAgICAgICAgIG9mZnNldFRvcDogMSxcbiAgICAgICAgICAgIGNhY2hlOiAxLFxuICAgICAgICAgICAgbWVudUNsYXNzOiAnJyxcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJ2JvZHknLFxuICAgICAgICAgICAgcmVuZGVySXRlbTogZnVuY3Rpb24gKGl0ZW0sIHNlYXJjaCl7XG4gICAgICAgICAgICAgICAgLy8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgIHNlYXJjaCA9IHNlYXJjaC5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxcXFtcXF17fV0vZywgJ1xcXFwkJicpO1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIoXCIgKyBzZWFyY2guc3BsaXQoJyAnKS5qb2luKCd8JykgKyBcIilcIiwgXCJnaVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJhdXRvY29tcGxldGUtc3VnZ2VzdGlvblwiIGRhdGEtdmFsPVwiJyArIGl0ZW0gKyAnXCI+JyArIGl0ZW0ucmVwbGFjZShyZSwgXCI8Yj4kMTwvYj5cIikgKyAnPC9kaXY+JztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblNlbGVjdDogZnVuY3Rpb24oZSwgdGVybSwgaXRlbSl7fVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciBrIGluIG9wdGlvbnMpIHsgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaykpIG9ba10gPSBvcHRpb25zW2tdOyB9XG5cbiAgICAgICAgLy8gaW5pdFxuICAgICAgICB2YXIgZWxlbXMgPSB0eXBlb2Ygby5zZWxlY3RvciA9PSAnb2JqZWN0JyA/IFtvLnNlbGVjdG9yXSA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoby5zZWxlY3Rvcik7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxlbGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSBlbGVtc1tpXTtcblxuICAgICAgICAgICAgLy8gY3JlYXRlIHN1Z2dlc3Rpb25zIGNvbnRhaW5lciBcInNjXCJcbiAgICAgICAgICAgIHRoYXQuc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHRoYXQuc2MuY2xhc3NOYW1lID0gJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9ucyAnK28ubWVudUNsYXNzO1xuXG4gICAgICAgICAgICAvLyBJZiBhZGRpbmcgaW50byBhIHJlc3VsdHMgY29udGFpbmVyLCByZW1vdmUgdGhlIHBvc2l0aW9uIGFic29sdXRlIGNzcyBzdHlsZXNcbiAgICAgICAgICAgIGlmIChvLmNvbnRhaW5lciAhPT0gXCJib2R5XCIpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnNjLmNsYXNzTmFtZSA9IHRoYXQuc2MuY2xhc3NOYW1lICsgJyBhdXRvY29tcGxldGUtc3VnZ2VzdGlvbnMtLWluLWNvbnRhaW5lcic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoYXQuYXV0b2NvbXBsZXRlQXR0ciA9IHRoYXQuZ2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnKTtcbiAgICAgICAgICAgIHRoYXQuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCAnb2ZmJyk7XG4gICAgICAgICAgICB0aGF0LmNhY2hlID0ge307XG4gICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gJyc7XG5cbiAgICAgICAgICAgIHRoYXQudXBkYXRlU0MgPSBmdW5jdGlvbihyZXNpemUsIG5leHQpe1xuICAgICAgICAgICAgICAgIHZhciByZWN0ID0gdGhhdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBpZiAoby5jb250YWluZXIgPT09ICdib2R5Jykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY29udGFpbmVyIGlzIG5vdCB0aGUgYm9keSwgZG8gbm90IGFic29sdXRlbHkgcG9zaXRpb24gaW4gdGhlIHdpbmRvdy5cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5sZWZ0ID0gTWF0aC5yb3VuZChyZWN0LmxlZnQgKyAod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0KSArIG8ub2Zmc2V0TGVmdCkgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLnRvcCA9IE1hdGgucm91bmQocmVjdC5ib3R0b20gKyAod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3ApICsgby5vZmZzZXRUb3ApICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS53aWR0aCA9IE1hdGgucm91bmQocmVjdC5yaWdodCAtIHJlY3QubGVmdCkgKyAncHgnOyAvLyBvdXRlcldpZHRoXG4gICAgICAgICAgICAgICAgaWYgKCFyZXNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0LnNjLm1heEhlaWdodCkgeyB0aGF0LnNjLm1heEhlaWdodCA9IHBhcnNlSW50KCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSA/IGdldENvbXB1dGVkU3R5bGUodGhhdC5zYywgbnVsbCkgOiB0aGF0LnNjLmN1cnJlbnRTdHlsZSkubWF4SGVpZ2h0KTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodCkgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0ID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nKS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHQpIHRoYXQuc2Muc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY3JUb3AgPSB0aGF0LnNjLnNjcm9sbFRvcCwgc2VsVG9wID0gbmV4dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSB0aGF0LnNjLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsVG9wICsgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0IC0gdGhhdC5zYy5tYXhIZWlnaHQgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnNjcm9sbFRvcCA9IHNlbFRvcCArIHRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodCArIHNjclRvcCAtIHRoYXQuc2MubWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlbFRvcCA8IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc2Nyb2xsVG9wID0gc2VsVG9wICsgc2NyVG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFkZEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHRoYXQudXBkYXRlU0MpO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvLmNvbnRhaW5lcikuYXBwZW5kQ2hpbGQodGhhdC5zYyk7XG5cbiAgICAgICAgICAgIGxpdmUoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJywgJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsKSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNlbC5jbGFzc05hbWUgPSBzZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NlbGVjdGVkJywgJycpOyB9LCAyMCk7XG4gICAgICAgICAgICB9LCB0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2VvdmVyJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIHNlbCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbCkgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICB9LCB0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2Vkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgaWYgKGhhc0NsYXNzKHRoaXMsICdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicpKSB7IC8vIGVsc2Ugb3V0c2lkZSBjbGlja1xuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gdjtcbiAgICAgICAgICAgICAgICAgICAgby5vblNlbGVjdChlLCB2LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICB0aGF0LmJsdXJIYW5kbGVyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0cnkgeyB2YXIgb3Zlcl9zYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbnM6aG92ZXInKTsgfSBjYXRjaChlKXsgdmFyIG92ZXJfc2IgPSAwOyB9XG4gICAgICAgICAgICAgICAgaWYgKCFvdmVyX3NiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSB0aGF0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9LCAzNTApOyAvLyBoaWRlIHN1Z2dlc3Rpb25zIG9uIGZhc3QgaW5wdXRcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoYXQgIT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5mb2N1cygpOyB9LCAyMCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYWRkRXZlbnQodGhhdCwgJ2JsdXInLCB0aGF0LmJsdXJIYW5kbGVyKTtcblxuICAgICAgICAgICAgdmFyIHN1Z2dlc3QgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhhdC52YWx1ZTtcbiAgICAgICAgICAgICAgICB0aGF0LmNhY2hlW3ZhbF0gPSBkYXRhO1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aCAmJiB2YWwubGVuZ3RoID49IG8ubWluQ2hhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKSBzICs9IG8ucmVuZGVySXRlbShkYXRhW2ldLCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLmlubmVySFRNTCA9IHM7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlU0MoMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LmtleWRvd25IYW5kbGVyID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHdpbmRvdy5ldmVudCA/IGUua2V5Q29kZSA6IGUud2hpY2g7XG4gICAgICAgICAgICAgICAgLy8gZG93biAoNDApLCB1cCAoMzgpXG4gICAgICAgICAgICAgICAgaWYgKChrZXkgPT0gNDAgfHwga2V5ID09IDM4KSAmJiB0aGF0LnNjLmlubmVySFRNTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dCwgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgPSAoa2V5ID09IDQwKSA/IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJykgOiB0aGF0LnNjLmNoaWxkTm9kZXNbdGhhdC5zYy5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdOyAvLyBmaXJzdCA6IGxhc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQuY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC52YWx1ZSA9IG5leHQuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IChrZXkgPT0gNDApID8gc2VsLm5leHRTaWJsaW5nIDogc2VsLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC52YWx1ZSA9IG5leHQuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7IHNlbC5jbGFzc05hbWUgPSBzZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NlbGVjdGVkJywgJycpOyB0aGF0LnZhbHVlID0gdGhhdC5sYXN0X3ZhbDsgbmV4dCA9IDA7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZVNDKDAsIG5leHQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGVzY1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PSAyNykgeyB0aGF0LnZhbHVlID0gdGhhdC5sYXN0X3ZhbDsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9XG4gICAgICAgICAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXkgPT0gMTMgfHwga2V5ID09IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgJiYgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ICE9ICdub25lJykgeyBvLm9uU2VsZWN0KGUsIHNlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyksIHNlbCk7IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9LCAyMCk7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYWRkRXZlbnQodGhhdCwgJ2tleWRvd24nLCB0aGF0LmtleWRvd25IYW5kbGVyKTtcblxuICAgICAgICAgICAgdGhhdC5rZXl1cEhhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gd2luZG93LmV2ZW50ID8gZS5rZXlDb2RlIDogZS53aGljaDtcbiAgICAgICAgICAgICAgICBpZiAoIWtleSB8fCAoa2V5IDwgMzUgfHwga2V5ID4gNDApICYmIGtleSAhPSAxMyAmJiBrZXkgIT0gMjcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRoYXQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoID49IG8ubWluQ2hhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwgIT0gdGhhdC5sYXN0X3ZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoYXQudGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLmNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwgaW4gdGhhdC5jYWNoZSkgeyBzdWdnZXN0KHRoYXQuY2FjaGVbdmFsXSk7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyByZXF1ZXN0cyBpZiBwcmV2aW91cyBzdWdnZXN0aW9ucyB3ZXJlIGVtcHR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MTsgaTx2YWwubGVuZ3RoLW8ubWluQ2hhcnM7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnQgPSB2YWwuc2xpY2UoMCwgdmFsLmxlbmd0aC1pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJ0IGluIHRoYXQuY2FjaGUgJiYgIXRoYXQuY2FjaGVbcGFydF0ubGVuZ3RoKSB7IHN1Z2dlc3QoW10pOyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpeyBvLnNvdXJjZSh2YWwsIHN1Z2dlc3QpIH0sIG8uZGVsYXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAna2V5dXAnLCB0aGF0LmtleXVwSGFuZGxlcik7XG5cbiAgICAgICAgICAgIHRoYXQuZm9jdXNIYW5kbGVyID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9ICdcXG4nO1xuICAgICAgICAgICAgICAgIHRoYXQua2V5dXBIYW5kbGVyKGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCFvLm1pbkNoYXJzKSBhZGRFdmVudCh0aGF0LCAnZm9jdXMnLCB0aGF0LmZvY3VzSGFuZGxlcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBwdWJsaWMgZGVzdHJveSBtZXRob2RcbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxlbGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gZWxlbXNbaV07XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQod2luZG93LCAncmVzaXplJywgdGhhdC51cGRhdGVTQyk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQodGhhdCwgJ2JsdXInLCB0aGF0LmJsdXJIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAnZm9jdXMnLCB0aGF0LmZvY3VzSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQodGhhdCwgJ2tleWRvd24nLCB0aGF0LmtleWRvd25IYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAna2V5dXAnLCB0aGF0LmtleXVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuYXV0b2NvbXBsZXRlQXR0cilcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsIHRoYXQuYXV0b2NvbXBsZXRlQXR0cik7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZUF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJyk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvLmNvbnRhaW5lcikucmVtb3ZlQ2hpbGQodGhhdC5zYyk7XG4gICAgICAgICAgICAgICAgdGhhdCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBhdXRvQ29tcGxldGU7XG59KSgpO1xuXG4oZnVuY3Rpb24oKXtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuICAgICAgICBkZWZpbmUoJ2F1dG9Db21wbGV0ZScsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGF1dG9Db21wbGV0ZTsgfSk7XG4gICAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0NvbXBsZXRlO1xuICAgIGVsc2VcbiAgICAgICAgd2luZG93LmF1dG9Db21wbGV0ZSA9IGF1dG9Db21wbGV0ZTtcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cblx0XHQvLyBicm93c2VyaWZ5ICYgYnJmc1xuXG5sZXQgc3RvcmUgPSByZXF1aXJlKCdzdG9yZScpXG5cbmxldCB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdGVtcGxhdGUnKVxubGV0IEF1dG9Db21wbGV0ZSA9IHJlcXVpcmUoJy4vYXV0by1jb21wbGV0ZS5qcycpXG5cbmxldCBNb3ZhYmxlID0gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKG5vZGUsIHN0b3JhZ2VfaWQpIHtcblx0dGhpcy5ub2RlID0gbm9kZVxuXHR0aGlzLm9mZnNldF94ID0gbnVsbFxuXHR0aGlzLm9mZnNldF95ID0gbnVsbFxuXHR0aGlzLnN0b3JhZ2VfaWQgPSBzdG9yYWdlX2lkXG5cblx0Ly8gd2Ugb3VnaHQgdG8gc3BlY2lmaWNhbHkgYmluZCBtb3VzZSogY2FsbGJhY2tzIHRvIHRoaXMgb2JqZWN0XG5cdC8vIGZvciBhZGRFdmVudExpc3RlbmVyL3JlbW92ZUV2ZW50TGlzdGVuZXJcblx0dGhpcy5tb3VzZWRvd24gPSB0aGlzLl9tb3VzZWRvd24uYmluZCh0aGlzKVxuXHR0aGlzLm1vdXNlbW92ZSA9IHRoaXMuX21vdXNlbW92ZS5iaW5kKHRoaXMpXG5cdHRoaXMubW91c2V1cCA9IHRoaXMuX21vdXNldXAuYmluZCh0aGlzKVxuXG5cdHRoaXMubG9nID0gY29uc29sZS5sb2cuYmluZChjb25zb2xlLCAnTW92YWJsZTonKVxuICAgIH1cblxuICAgIHBvc2l0aW9uKGV2ZW50KSB7XG5cdGxldCB4ID0gZXZlbnQuY2xpZW50WCAtIHRoaXMub2Zmc2V0X3hcblx0bGV0IHkgPSBldmVudC5jbGllbnRZIC0gdGhpcy5vZmZzZXRfeVxuXG5cdC8vIFRPRE86IHJpZ2h0LCBib3R0b21cblx0aWYgKHggPCAwKSB4ID0gMFxuXHRpZiAoeSA8IDApIHkgPSAwXG5cdHJldHVybiB7eCwgeX1cbiAgICB9XG5cbiAgICBtb3ZlKHgsIHkpIHtcblx0dGhpcy5ub2RlLnN0eWxlLmxlZnQgPSB4ICsgJ3B4J1xuXHR0aGlzLm5vZGUuc3R5bGUudG9wID0geSArICdweCdcblx0dGhpcy5ub2RlLnN0eWxlLnJpZ2h0ID0gJ2F1dG8nXG5cdHRoaXMubm9kZS5zdHlsZS5ib3R0b20gPSAnYXV0bydcbiAgICB9XG5cbiAgICB2YWxpZF9ldmVudChldmVudCkge1xuXHRyZXR1cm4gKHRoaXMubm9kZSA9PT0gZXZlbnQudGFyZ2V0KSAmJiAoZXZlbnQuYnV0dG9uID09PSAwKVxuICAgIH1cblxuICAgIF9tb3VzZWRvd24oZXZlbnQpIHtcblx0aWYgKCF0aGlzLnZhbGlkX2V2ZW50KGV2ZW50KSkgcmV0dXJuXG5cdHRoaXMub2Zmc2V0X3ggPSBldmVudC5jbGllbnRYIC0gdGhpcy5ub2RlLm9mZnNldExlZnRcblx0dGhpcy5vZmZzZXRfeSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm5vZGUub2Zmc2V0VG9wXG5cdHRoaXMubG9nKGBtb3VzZWRvd24sIG9mZnNldF94PSR7dGhpcy5vZmZzZXRfeH0sIG9mZnNldF95PSR7dGhpcy5vZmZzZXRfeX1gKVxuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlbW92ZSlcblx0dGhpcy5fbW91c2Vtb3ZlKGV2ZW50KVxuICAgIH1cblxuICAgIF9tb3VzZW1vdmUoZXZlbnQpIHtcblx0dGhpcy5ub2RlLnN0eWxlLmN1cnNvciA9ICdtb3ZlJ1xuXHRsZXQgcCA9IHRoaXMucG9zaXRpb24oZXZlbnQpXG5cdHRoaXMubW92ZShwLngsIHAueSlcbiAgICB9XG5cbiAgICAvLyB3aGVuIGBmb3JjZWAgaXMgdHJ1ZSwgYGV2ZW50YCBzaG91bGQgYmUgbnVsbCBiZWNhdXNlIHdlJ3JlXG4gICAgLy8gaW52b2tpbmcgX21vdXNldXAoKSBtYW51YWxseSBmcm9tIGEgY29tcGxldGVseSBkaWZmIGNvbnRleHQgdG9cbiAgICAvLyBmb3JjaWJseSByZW1vdmUgbW91c2Vtb3ZlIGxpc3RlbmVyLlxuICAgIF9tb3VzZXVwKGV2ZW50LCBmb3JjZSkge1xuXHRpZiAoIWZvcmNlICYmICF0aGlzLnZhbGlkX2V2ZW50KGV2ZW50KSkgcmV0dXJuXG5cdHRoaXMubG9nKCdtb3VzZXVwJylcblx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5tb3VzZW1vdmUpXG5cdHRoaXMubm9kZS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCdcblxuXHQvLyBzYXZlIHRoZSB3aWRnZXQgcG9zaXRpb25cblx0aWYgKCF0aGlzLnN0b3JhZ2VfaWQgfHwgZm9yY2UpIHJldHVyblxuXHRsZXQgcCA9IHRoaXMucG9zaXRpb24oZXZlbnQpXG5cdHN0b3JlLnNldCh0aGlzLnN0b3JhZ2VfaWQsIHtcblx0ICAgIGxlZnQ6IHAueCArICdweCcsXG5cdCAgICB0b3A6IHAueSArICdweCcsXG5cdCAgICByaWdodDogJ2F1dG8nLFxuXHQgICAgYm90dG9tOiAnYXV0bydcblx0fSlcblx0dGhpcy5sb2coJ3NhdmVkJylcbiAgICB9XG5cbiAgICBob29rKCkge1xuXHR0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5tb3VzZWRvd24pXG5cdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5tb3VzZXVwKVxuICAgIH1cblxuICAgIHVuaG9vaygpIHtcblx0dGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubW91c2Vkb3duKVxuXHR0aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMubW91c2V1cClcblx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5tb3VzZW1vdmUpXG4gICAgfVxufVxuXG5sZXQgVG9jSnVtcGVyID0gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKG9wdCkge1xuXHR0aGlzLmRhdGEgPSBudWxsXG5cblx0dGhpcy5vcHQgPSB7XG5cdCAgICBpZDogJ3RvY19qdW1wZXInLFxuXHQgICAgc2VsZWN0b3I6ICcnLFxuXHQgICAgdHJhbnNmb3JtOiBudWxsLFxuXHQgICAga2V5OiAnaScsXG5cdCAgICBwcmVmX3NhdmU6IHRydWUsXG5cblx0ICAgIHRvcDogJzRlbScsXG5cdCAgICByaWdodDogJy41ZW0nLFxuXHQgICAgYm90dG9tOiAnYXV0bycsXG5cdCAgICBsZWZ0OiAnYXV0bycsXG5cdH1cblxuXHQvLyBtZXJnZSB1c2VyIG9wdGlvbnNcblx0Zm9yIChsZXQgaWR4IGluIG9wdCkgdGhpcy5vcHRbaWR4XSA9IG9wdFtpZHhdXG5cblx0aWYgKHRoaXMub3B0LnByZWZfc2F2ZSkgdGhpcy5vcHQuc3RvcmFnZV9pZCA9IGB0b2NfanVtcGVyLS0ke3RoaXMub3B0LmlkfWBcblxuXHR0aGlzLmxvZyA9IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSwgJ1RvY0p1bXBlcjonKVxuXHR0aGlzLmxvZygnaW5pdCcpXG4gICAgfVxuXG4gICAgbG9hZF9zYXZlZF9vcHQoKSB7XG5cdGlmICghdGhpcy5vcHQuc3RvcmFnZV9pZCkgcmV0dXJuXG5cdGxldCBzYXZlZF9vcHQgPSBzdG9yZS5nZXQodGhpcy5vcHQuc3RvcmFnZV9pZClcblx0aWYgKHNhdmVkX29wdCkge1xuXHQgICAgWyd0b3AnLCAncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXVxuXHRcdC5mb3JFYWNoKCAoaWR4KSA9PiB0aGlzLm9wdFtpZHhdID0gc2F2ZWRfb3B0W2lkeF0gfHwgdGhpcy5vcHRbaWR4XSApXG5cdCAgICB0aGlzLmxvZyhcImxvYWRlZCBzYXZlZCBvcHRpb25zXCIpXG5cdH1cbiAgICB9XG5cbiAgICBzY3JvbGwodGVybSkge1xuXHRpZiAodGVybSBpbiB0aGlzLmRhdGEpIHtcblx0ICAgIHRoaXMubG9nKHRlcm0pXG5cdCAgICB0aGlzLmRhdGFbdGVybV0uc2Nyb2xsSW50b1ZpZXcodHJ1ZSlcblx0fVxuICAgIH1cblxuICAgIGhvb2soKSB7XG5cdHRoaXMuZGF0YSA9IG1ha2VfaW5kZXgodGhpcy5vcHQuc2VsZWN0b3IsIHRoaXMub3B0LnRyYW5zZm9ybSlcblx0Y3NzX2luamVjdCh7IGlkOiB0aGlzLm9wdC5pZCB9KVxuXHRkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcblx0ICAgIGlmIChbJ0lOUFVUJywgJ1RFWFRBUkVBJ10uaW5kZXhPZihldmVudC50YXJnZXQubm9kZU5hbWUpICE9PSAtMSlcblx0XHRyZXR1cm5cblx0ICAgIGlmIChldmVudC5rZXkgPT09IHRoaXMub3B0LmtleSAmJiAhZXZlbnQuY3RybEtleSkgdGhpcy5kbGcoKVxuXHQgICAgaWYgKGlzX2VzY2FwZV9rZXkoZXZlbnQpKSB0aGlzLm1vdmFibGUuX21vdXNldXAobnVsbCwgdHJ1ZSlcblx0fSlcbiAgICB9XG5cbiAgICBkbGcoKSB7XG5cdGxldCBub2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5vcHQuaWQpXG5cdGlmIChub2RlKSByZXR1cm4gZm9jdXMobm9kZSlcblxuXHR0aGlzLmxvYWRfc2F2ZWRfb3B0KClcblx0bm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdG5vZGUuaWQgPSB0aGlzLm9wdC5pZDtcblx0Wyd0b3AnLCAncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXVxuXHQgICAgLmZvckVhY2goIChpZHgpID0+IG5vZGUuc3R5bGVbaWR4XSA9IHRoaXMub3B0W2lkeF0gKVxuXG5cdGxldCBhY19jb250YWluZXIgPSBgJHt0aGlzLm9wdC5pZH1fY29udGFpbmVyYFxuXHRub2RlLmlubmVySFRNTCA9IGA8c3BhbiBpZD1cIiR7YWNfY29udGFpbmVyfVwiPjxpbnB1dCBzaXplPVwiNDBcIiBzcGVsbGNoZWNrPVwiZmFsc2VcIiAvPjwvc3Bhbj5cbjxzcGFuIGlkPVwiJHt0aGlzLm9wdC5pZH1fY2xvc2VcIiB0aXRsZT1cIkNsb3NlXCI+PHNwYW4+JnRpbWVzOzwvc3Bhbj48L3NwYW4+YFxuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXG5cdGxldCBpbnB1dCA9IG5vZGUucXVlcnlTZWxlY3RvcignaW5wdXQnKVxuXG5cdGxldCBhYyA9IG5ldyBBdXRvQ29tcGxldGUoe1xuXHQgICAgc2VsZWN0b3I6IGlucHV0LFxuXHQgICAgbWluQ2hhcnM6IDEsXG5cdCAgICBkZWxheTogNTAsXG5cdCAgICBjb250YWluZXI6ICcjJyArIGFjX2NvbnRhaW5lcixcblx0ICAgIHNvdXJjZTogKHRlcm0sIHN1Z2dlc3QpID0+IHtcblx0XHRsZXQgbGlzdCA9IFtdXG5cdFx0Zm9yIChsZXQga2V5IGluIHRoaXMuZGF0YSkge1xuXHRcdCAgICBpZiAoa2V5LnRvTG93ZXJDYXNlKCkuaW5kZXhPZih0ZXJtLnRvTG93ZXJDYXNlKCkpICE9PSAtMSlcblx0XHRcdGxpc3QucHVzaChrZXkpXG5cdFx0fVxuXHRcdHN1Z2dlc3QoVG9jSnVtcGVyLnNvcnQobGlzdCwgdGVybSkpXG5cdCAgICB9LFxuXHQgICAgb25TZWxlY3Q6IChldmVudCwgdGVybSwgaXRlbSkgPT4gdGhpcy5zY3JvbGwodGVybSlcblx0fSlcblxuXHRsZXQgZGVzdHJveSA9ICgpID0+IHtcblx0ICAgIGFjLmRlc3Ryb3koKVxuXHQgICAgdGhpcy5tb3ZhYmxlLnVuaG9vaygpXG5cdCAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG5vZGUpXG5cdH1cblxuXHRub2RlLnF1ZXJ5U2VsZWN0b3IoYCMke3RoaXMub3B0LmlkfV9jbG9zZWApLm9uY2xpY2sgPSBkZXN0cm95XG5cdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuXHQgICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VudGVyJykgdGhpcy5zY3JvbGwoaW5wdXQudmFsdWUpXG5cdCAgICBpZiAoaXNfZXNjYXBlX2tleShldmVudCkpIGRlc3Ryb3koKVxuXHR9KVxuXG5cdHRoaXMubW92YWJsZSA9IG5ldyBNb3ZhYmxlKG5vZGUsIHRoaXMub3B0LnN0b3JhZ2VfaWQpXG5cdHRoaXMubW92YWJsZS5sb2cgPSB0aGlzLmxvZ1xuXHR0aGlzLm1vdmFibGUuaG9vaygpXG5cblx0Zm9jdXMobm9kZSlcbiAgICB9XG5cbiAgICBzdGF0aWMgc29ydChhcnIsIHRlcm0pIHtcblx0aWYgKCF0ZXJtKSByZXR1cm4gYXJyXG5cdHRlcm0gPSB0ZXJtLnRvTG93ZXJDYXNlKClcblx0cmV0dXJuIGFyci5zb3J0KCAoYSwgYikgPT4ge1xuXHQgICAgaWYgKGEuc2xpY2UoMCwgdGVybS5sZW5ndGgpLnRvTG93ZXJDYXNlKCkgPT09IHRlcm0pIHJldHVybiAtMVxuXHQgICAgaWYgKGIuc2xpY2UoMCwgdGVybS5sZW5ndGgpLnRvTG93ZXJDYXNlKCkgPT09IHRlcm0pIHJldHVybiAxXG5cdCAgICByZXR1cm4gYS5sb2NhbGVDb21wYXJlKGIpXG5cdH0pXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRvY0p1bXBlclxuXG5sZXQgbWFrZV9pbmRleCA9IGZ1bmN0aW9uKHNlbGVjdG9yLCB0cmFuc2Zvcm0pIHtcbiAgICBsZXQgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuXG4gICAgbGV0IHIgPSB7fVxuICAgIGxldCBjYWNoZSA9IHt9XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgbm9kZXMubGVuZ3RoOyArK2lkeCkge1xuXHRsZXQgbm9kZSA9IG5vZGVzW2lkeF1cblx0bGV0IGtleSA9IHRyYW5zZm9ybSA/IHRyYW5zZm9ybShub2RlLmlubmVyVGV4dCkgOiBub2RlLmlubmVyVGV4dFxuXHRjYWNoZVtrZXldID0gKGNhY2hlW2tleV0gfHwgMCkgKyAxXG5cdGlmIChrZXkgaW4gcikga2V5ID0gYCR7a2V5fSA8JHtjYWNoZVtrZXldfT5gXG5cblx0cltrZXldID0gbm9kZVxuICAgIH1cblxuICAgIHJldHVybiByXG59XG5cbmxldCBjc3NfaW5qZWN0ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIGxldCBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgIGxldCB0bXBsID0gdGVtcGxhdGUoXCIvKiBhdXRvLWNvbXBsZXRlLmpzICovXFxuLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9ucyB7XFxuICB0ZXh0LWFsaWduOiBsZWZ0O1xcbiAgY3Vyc29yOiBkZWZhdWx0O1xcbiAgYm9yZGVyOiAxcHggc29saWQgI2NjYztcXG4gIGJvcmRlci10b3A6IDA7XFxuICBiYWNrZ3JvdW5kOiB3aGl0ZTtcXG4gIGJveC1zaGFkb3c6IC0xcHggMXB4IDNweCByZ2JhKDAsIDAsIDAsIC4xKTtcXG5cXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIGRpc3BsYXk6IG5vbmU7XFxuICB6LWluZGV4OiA5OTk5O1xcbiAgbWF4LWhlaWdodDogMTVlbTtcXG4gIG92ZXJmbG93OiBoaWRkZW47XFxuICBvdmVyZmxvdy15OiBhdXRvO1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG59XFxuLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uIHtcXG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XFxuICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XFxufVxcbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCB7XFxuICBiYWNrZ3JvdW5kOiAjZWVlO1xcbn1cXG5cXG4vKiB0b2MtanVtcGVyICovXFxuIzwlPSBpZCAlPiB7XFxuICBib3JkZXI6IDFweCBzb2xpZCAjYTlhOWE5O1xcbiAgcGFkZGluZzogMC44ZW07XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gIGNvbG9yOiBibGFjaztcXG4gIGJveC1zaGFkb3c6IDFweCAxcHggM3B4IHJnYmEoMCwgMCwgMCwgLjQpO1xcblxcbiAgcG9zaXRpb246IGZpeGVkO1xcbn1cXG5cXG4jPCU9IGlkICU+X2Nsb3NlIHtcXG4gIG1hcmdpbi1sZWZ0OiAxZW07XFxuICBmb250LXdlaWdodDogYm9sZDtcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcXG4gIGxpbmUtaGVpZ2h0OiAyZW07XFxuICB3aWR0aDogMmVtO1xcbiAgaGVpZ2h0OiAyZW07XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxufVxcblxcbiM8JT0gaWQgJT5fY2xvc2U6aG92ZXIge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2U4MTEyMztcXG4gIGNvbG9yOiB3aGl0ZTtcXG59XFxuXCIpXG4gICAgbm9kZS5pbm5lckhUTUwgPSB0bXBsKGRhdGEpXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKVxufVxuXG5sZXQgZm9jdXMgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgc2V0VGltZW91dCggKCkgPT4gbm9kZS5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpLmZvY3VzKCksIDEpXG59XG5cbi8vIElFMTEgcmV0dXJucyBcIkVzY1wiLCBDaHJvbWUgJiBGaXJlZm94IHJldHVybiBcIkVzY2FwZVwiXG5sZXQgaXNfZXNjYXBlX2tleSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgcmV0dXJuIGV2ZW50LmtleS5tYXRjaCgvXkVzYy8pXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuLy8gTW9kdWxlIGV4cG9ydCBwYXR0ZXJuIGZyb21cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvcmV0dXJuRXhwb3J0cy5qc1xuOyhmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuICAgICAgICAvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcbiAgICAgICAgLy8gbGlrZSBOb2RlLlxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHMgKHJvb3QgaXMgd2luZG93KVxuICAgICAgICByb290LnN0b3JlID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblx0XG5cdC8vIFN0b3JlLmpzXG5cdHZhciBzdG9yZSA9IHt9LFxuXHRcdHdpbiA9ICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsKSxcblx0XHRkb2MgPSB3aW4uZG9jdW1lbnQsXG5cdFx0bG9jYWxTdG9yYWdlTmFtZSA9ICdsb2NhbFN0b3JhZ2UnLFxuXHRcdHNjcmlwdFRhZyA9ICdzY3JpcHQnLFxuXHRcdHN0b3JhZ2VcblxuXHRzdG9yZS5kaXNhYmxlZCA9IGZhbHNlXG5cdHN0b3JlLnZlcnNpb24gPSAnMS4zLjIwJ1xuXHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7fVxuXHRzdG9yZS5nZXQgPSBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWwpIHt9XG5cdHN0b3JlLmhhcyA9IGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gc3RvcmUuZ2V0KGtleSkgIT09IHVuZGVmaW5lZCB9XG5cdHN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uKGtleSkge31cblx0c3RvcmUuY2xlYXIgPSBmdW5jdGlvbigpIHt9XG5cdHN0b3JlLnRyYW5zYWN0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsLCB0cmFuc2FjdGlvbkZuKSB7XG5cdFx0aWYgKHRyYW5zYWN0aW9uRm4gPT0gbnVsbCkge1xuXHRcdFx0dHJhbnNhY3Rpb25GbiA9IGRlZmF1bHRWYWxcblx0XHRcdGRlZmF1bHRWYWwgPSBudWxsXG5cdFx0fVxuXHRcdGlmIChkZWZhdWx0VmFsID09IG51bGwpIHtcblx0XHRcdGRlZmF1bHRWYWwgPSB7fVxuXHRcdH1cblx0XHR2YXIgdmFsID0gc3RvcmUuZ2V0KGtleSwgZGVmYXVsdFZhbClcblx0XHR0cmFuc2FjdGlvbkZuKHZhbClcblx0XHRzdG9yZS5zZXQoa2V5LCB2YWwpXG5cdH1cblx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oKSB7fVxuXHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oKSB7fVxuXG5cdHN0b3JlLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXHR9XG5cdHN0b3JlLmRlc2VyaWFsaXplID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7IHJldHVybiB1bmRlZmluZWQgfVxuXHRcdHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHZhbHVlKSB9XG5cdFx0Y2F0Y2goZSkgeyByZXR1cm4gdmFsdWUgfHwgdW5kZWZpbmVkIH1cblx0fVxuXG5cdC8vIEZ1bmN0aW9ucyB0byBlbmNhcHN1bGF0ZSBxdWVzdGlvbmFibGUgRmlyZUZveCAzLjYuMTMgYmVoYXZpb3Jcblx0Ly8gd2hlbiBhYm91dC5jb25maWc6OmRvbS5zdG9yYWdlLmVuYWJsZWQgPT09IGZhbHNlXG5cdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFyY3Vzd2VzdGluL3N0b3JlLmpzL2lzc3VlcyNpc3N1ZS8xM1xuXHRmdW5jdGlvbiBpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSB7XG5cdFx0dHJ5IHsgcmV0dXJuIChsb2NhbFN0b3JhZ2VOYW1lIGluIHdpbiAmJiB3aW5bbG9jYWxTdG9yYWdlTmFtZV0pIH1cblx0XHRjYXRjaChlcnIpIHsgcmV0dXJuIGZhbHNlIH1cblx0fVxuXG5cdGlmIChpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSkge1xuXHRcdHN0b3JhZ2UgPSB3aW5bbG9jYWxTdG9yYWdlTmFtZV1cblx0XHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdFx0aWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XG5cdFx0XHRzdG9yYWdlLnNldEl0ZW0oa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHJldHVybiB2YWxcblx0XHR9XG5cdFx0c3RvcmUuZ2V0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsKSB7XG5cdFx0XHR2YXIgdmFsID0gc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRJdGVtKGtleSkpXG5cdFx0XHRyZXR1cm4gKHZhbCA9PT0gdW5kZWZpbmVkID8gZGVmYXVsdFZhbCA6IHZhbClcblx0XHR9XG5cdFx0c3RvcmUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7IHN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpIH1cblx0XHRzdG9yZS5jbGVhciA9IGZ1bmN0aW9uKCkgeyBzdG9yYWdlLmNsZWFyKCkgfVxuXHRcdHN0b3JlLmdldEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxzdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBrZXkgPSBzdG9yYWdlLmtleShpKVxuXHRcdFx0XHRjYWxsYmFjayhrZXksIHN0b3JlLmdldChrZXkpKVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmIChkb2MgJiYgZG9jLmRvY3VtZW50RWxlbWVudC5hZGRCZWhhdmlvcikge1xuXHRcdHZhciBzdG9yYWdlT3duZXIsXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyXG5cdFx0Ly8gU2luY2UgI3VzZXJEYXRhIHN0b3JhZ2UgYXBwbGllcyBvbmx5IHRvIHNwZWNpZmljIHBhdGhzLCB3ZSBuZWVkIHRvXG5cdFx0Ly8gc29tZWhvdyBsaW5rIG91ciBkYXRhIHRvIGEgc3BlY2lmaWMgcGF0aC4gIFdlIGNob29zZSAvZmF2aWNvbi5pY29cblx0XHQvLyBhcyBhIHByZXR0eSBzYWZlIG9wdGlvbiwgc2luY2UgYWxsIGJyb3dzZXJzIGFscmVhZHkgbWFrZSBhIHJlcXVlc3QgdG9cblx0XHQvLyB0aGlzIFVSTCBhbnl3YXkgYW5kIGJlaW5nIGEgNDA0IHdpbGwgbm90IGh1cnQgdXMgaGVyZS4gIFdlIHdyYXAgYW5cblx0XHQvLyBpZnJhbWUgcG9pbnRpbmcgdG8gdGhlIGZhdmljb24gaW4gYW4gQWN0aXZlWE9iamVjdChodG1sZmlsZSkgb2JqZWN0XG5cdFx0Ly8gKHNlZTogaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2FhNzUyNTc0KHY9VlMuODUpLmFzcHgpXG5cdFx0Ly8gc2luY2UgdGhlIGlmcmFtZSBhY2Nlc3MgcnVsZXMgYXBwZWFyIHRvIGFsbG93IGRpcmVjdCBhY2Nlc3MgYW5kXG5cdFx0Ly8gbWFuaXB1bGF0aW9uIG9mIHRoZSBkb2N1bWVudCBlbGVtZW50LCBldmVuIGZvciBhIDQwNCBwYWdlLiAgVGhpc1xuXHRcdC8vIGRvY3VtZW50IGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgZG9jdW1lbnQgKHdoaWNoIHdvdWxkXG5cdFx0Ly8gaGF2ZSBiZWVuIGxpbWl0ZWQgdG8gdGhlIGN1cnJlbnQgcGF0aCkgdG8gcGVyZm9ybSAjdXNlckRhdGEgc3RvcmFnZS5cblx0XHR0cnkge1xuXHRcdFx0c3RvcmFnZUNvbnRhaW5lciA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyLm9wZW4oKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci53cml0ZSgnPCcrc2NyaXB0VGFnKyc+ZG9jdW1lbnQudz13aW5kb3c8Lycrc2NyaXB0VGFnKyc+PGlmcmFtZSBzcmM9XCIvZmF2aWNvbi5pY29cIj48L2lmcmFtZT4nKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci5jbG9zZSgpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBzdG9yYWdlQ29udGFpbmVyLncuZnJhbWVzWzBdLmRvY3VtZW50XG5cdFx0XHRzdG9yYWdlID0gc3RvcmFnZU93bmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHQvLyBzb21laG93IEFjdGl2ZVhPYmplY3QgaW5zdGFudGlhdGlvbiBmYWlsZWQgKHBlcmhhcHMgc29tZSBzcGVjaWFsXG5cdFx0XHQvLyBzZWN1cml0eSBzZXR0aW5ncyBvciBvdGhlcndzZSksIGZhbGwgYmFjayB0byBwZXItcGF0aCBzdG9yYWdlXG5cdFx0XHRzdG9yYWdlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBkb2MuYm9keVxuXHRcdH1cblx0XHR2YXIgd2l0aElFU3RvcmFnZSA9IGZ1bmN0aW9uKHN0b3JlRnVuY3Rpb24pIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG5cdFx0XHRcdGFyZ3MudW5zaGlmdChzdG9yYWdlKVxuXHRcdFx0XHQvLyBTZWUgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxMDgxKHY9VlMuODUpLmFzcHhcblx0XHRcdFx0Ly8gYW5kIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTQyNCh2PVZTLjg1KS5hc3B4XG5cdFx0XHRcdHN0b3JhZ2VPd25lci5hcHBlbmRDaGlsZChzdG9yYWdlKVxuXHRcdFx0XHRzdG9yYWdlLmFkZEJlaGF2aW9yKCcjZGVmYXVsdCN1c2VyRGF0YScpXG5cdFx0XHRcdHN0b3JhZ2UubG9hZChsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gc3RvcmVGdW5jdGlvbi5hcHBseShzdG9yZSwgYXJncylcblx0XHRcdFx0c3RvcmFnZU93bmVyLnJlbW92ZUNoaWxkKHN0b3JhZ2UpXG5cdFx0XHRcdHJldHVybiByZXN1bHRcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJbiBJRTcsIGtleXMgY2Fubm90IHN0YXJ0IHdpdGggYSBkaWdpdCBvciBjb250YWluIGNlcnRhaW4gY2hhcnMuXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzQwXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzgzXG5cdFx0dmFyIGZvcmJpZGRlbkNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKFwiWyFcXFwiIyQlJicoKSorLC9cXFxcXFxcXDo7PD0+P0BbXFxcXF1eYHt8fX5dXCIsIFwiZ1wiKVxuXHRcdHZhciBpZUtleUZpeCA9IGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0cmV0dXJuIGtleS5yZXBsYWNlKC9eZC8sICdfX18kJicpLnJlcGxhY2UoZm9yYmlkZGVuQ2hhcnNSZWdleCwgJ19fXycpXG5cdFx0fVxuXHRcdHN0b3JlLnNldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5LCB2YWwpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gc3RvcmUucmVtb3ZlKGtleSkgfVxuXHRcdFx0c3RvcmFnZS5zZXRBdHRyaWJ1dGUoa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0cmV0dXJuIHZhbFxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0ID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXksIGRlZmF1bHRWYWwpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdHZhciB2YWwgPSBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEF0dHJpYnV0ZShrZXkpKVxuXHRcdFx0cmV0dXJuICh2YWwgPT09IHVuZGVmaW5lZCA/IGRlZmF1bHRWYWwgOiB2YWwpXG5cdFx0fSlcblx0XHRzdG9yZS5yZW1vdmUgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UsIGtleSkge1xuXHRcdFx0a2V5ID0gaWVLZXlGaXgoa2V5KVxuXHRcdFx0c3RvcmFnZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KVxuXHRcdFx0c3RvcmFnZS5zYXZlKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0fSlcblx0XHRzdG9yZS5jbGVhciA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRzdG9yYWdlLmxvYWQobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRcdGZvciAodmFyIGk9YXR0cmlidXRlcy5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG5cdFx0XHRcdHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZXNbaV0ubmFtZSlcblx0XHRcdH1cblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBjYWxsYmFjaykge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgKytpKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGF0dHIubmFtZSwgc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoYXR0ci5uYW1lKSkpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHRyeSB7XG5cdFx0dmFyIHRlc3RLZXkgPSAnX19zdG9yZWpzX18nXG5cdFx0c3RvcmUuc2V0KHRlc3RLZXksIHRlc3RLZXkpXG5cdFx0aWYgKHN0b3JlLmdldCh0ZXN0S2V5KSAhPSB0ZXN0S2V5KSB7IHN0b3JlLmRpc2FibGVkID0gdHJ1ZSB9XG5cdFx0c3RvcmUucmVtb3ZlKHRlc3RLZXkpXG5cdH0gY2F0Y2goZSkge1xuXHRcdHN0b3JlLmRpc2FibGVkID0gdHJ1ZVxuXHR9XG5cdHN0b3JlLmVuYWJsZWQgPSAhc3RvcmUuZGlzYWJsZWRcblx0XG5cdHJldHVybiBzdG9yZVxufSkpO1xuIiwiLypcbiAgQSBtb2RpZmllZCBfLnRlbXBsYXRlKCkgZnJvbSB1bmRlcnNjb3JlLmpzLlxuXG4gIFdoeSBub3QgdXNlIGxvZGFzaC90ZW1wbGF0ZT8gVGhpcyB2ZXJzaW9uIGlzIH41IHRpbWVzIHNtYWxsZXIuXG4qL1xuXG52YXIgbm9NYXRjaCA9IC8oLileLztcbnZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG59O1xuXG52YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHUyMDI4fFxcdTIwMjkvZztcblxudmFyIGVzY2FwZUNoYXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTtcbn07XG5cbnZhciB0ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGV4dCkge1xuICAgIHZhciBzZXR0aW5ncyA9IHRlbXBsYXRlU2V0dGluZ3M7XG5cbiAgICB2YXIgbWF0Y2hlciA9IFJlZ0V4cChbXG5cdChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuXHQoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuXHQoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcblx0c291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldCkucmVwbGFjZShlc2NhcGVyLCBlc2NhcGVDaGFyKTtcblx0aW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cblx0aWYgKGVzY2FwZSkge1xuXHQgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcblx0fSBlbHNlIGlmIChpbnRlcnBvbGF0ZSkge1xuXHQgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG5cdH0gZWxzZSBpZiAoZXZhbHVhdGUpIHtcblx0ICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG5cdH1cblxuXHRyZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG5cdFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG5cdHNvdXJjZSArICdyZXR1cm4gX19wO1xcbic7XG5cbiAgICB2YXIgcmVuZGVyXG4gICAgdHJ5IHtcblx0cmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcblx0ZS5zb3VyY2UgPSBzb3VyY2U7XG5cdHRocm93IGU7XG4gICAgfVxuXG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuXHRyZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSk7XG4gICAgfTtcblxuICAgIHZhciBhcmd1bWVudCA9IHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonO1xuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgYXJndW1lbnQgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xufTtcbiJdfQ==
// ]]>
