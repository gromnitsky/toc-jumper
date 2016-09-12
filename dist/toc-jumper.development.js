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
									this.movable.hook();

									focus(node);
						}
			}], [{
						key: 'sort',
						value: function sort(arr, term) {
									return arr.sort(function (a, b) {
												if (a.slice(0, term.length) === term) return -1;
												if (b.slice(0, term.length) === term) return 1;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL29wdC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImF1dG8tY29tcGxldGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdG9yZS9zdG9yZS5qcyIsInRlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBOzs7Ozs7O0FBT0EsSUFBSSxlQUFnQixZQUFVO0FBQzFCO0FBQ0EsYUFBUyxZQUFULENBQXNCLE9BQXRCLEVBQThCO0FBQzFCLFlBQUksQ0FBQyxTQUFTLGFBQWQsRUFBNkI7O0FBRTdCO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFzQixTQUF0QixFQUFnQztBQUFFLG1CQUFPLEdBQUcsU0FBSCxHQUFlLEdBQUcsU0FBSCxDQUFhLFFBQWIsQ0FBc0IsU0FBdEIsQ0FBZixHQUFrRCxJQUFJLE1BQUosQ0FBVyxRQUFPLFNBQVAsR0FBaUIsS0FBNUIsRUFBbUMsSUFBbkMsQ0FBd0MsR0FBRyxTQUEzQyxDQUF6RDtBQUFpSDs7QUFFbkosaUJBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFzQixJQUF0QixFQUE0QixPQUE1QixFQUFvQztBQUNoQyxnQkFBSSxHQUFHLFdBQVAsRUFBb0IsR0FBRyxXQUFILENBQWUsT0FBSyxJQUFwQixFQUEwQixPQUExQixFQUFwQixLQUE2RCxHQUFHLGdCQUFILENBQW9CLElBQXBCLEVBQTBCLE9BQTFCO0FBQ2hFO0FBQ0QsaUJBQVMsV0FBVCxDQUFxQixFQUFyQixFQUF5QixJQUF6QixFQUErQixPQUEvQixFQUF1QztBQUNuQztBQUNBLGdCQUFJLEdBQUcsV0FBUCxFQUFvQixHQUFHLFdBQUgsQ0FBZSxPQUFLLElBQXBCLEVBQTBCLE9BQTFCLEVBQXBCLEtBQTZELEdBQUcsbUJBQUgsQ0FBdUIsSUFBdkIsRUFBNkIsT0FBN0I7QUFDaEU7QUFDRCxpQkFBUyxJQUFU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Q2YsUUFBRSxNQUFGLEdBQVcsTUFBWDtBQUNBLFlBQU0sQ0FBTjtBQUNJOztBQUVELE9BQUksV0FBVyxTQUFYLFFBQVcsQ0FBUyxJQUFULEVBQWU7QUFDakMsYUFBTyxPQUFPLElBQVAsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLENBQVA7QUFDSSxJQUZEOztBQUlBLE9BQUksV0FBVyxTQUFTLFFBQVQsSUFBcUIsS0FBcEM7QUFDQSxZQUFTLE1BQVQsR0FBa0IsY0FBYyxRQUFkLEdBQXlCLE1BQXpCLEdBQWtDLE1BQWxDLEdBQTJDLEdBQTdEOztBQUVBLFVBQU8sUUFBUDtBQUNILENBakREIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG4gICAgSmF2YVNjcmlwdCBhdXRvQ29tcGxldGUgdjEuMC40XG4gICAgQ29weXJpZ2h0IChjKSAyMDE0IFNpbW9uIFN0ZWluYmVyZ2VyIC8gUGl4YWJheVxuICAgIEdpdEh1YjogaHR0cHM6Ly9naXRodWIuY29tL1BpeGFiYXkvSmF2YVNjcmlwdC1hdXRvQ29tcGxldGVcbiAgICBMaWNlbnNlOiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuKi9cblxudmFyIGF1dG9Db21wbGV0ZSA9IChmdW5jdGlvbigpe1xuICAgIC8vIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIGF1dG9Db21wbGV0ZShvcHRpb25zKXtcbiAgICAgICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKSByZXR1cm47XG5cbiAgICAgICAgLy8gaGVscGVyc1xuICAgICAgICBmdW5jdGlvbiBoYXNDbGFzcyhlbCwgY2xhc3NOYW1lKXsgcmV0dXJuIGVsLmNsYXNzTGlzdCA/IGVsLmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpIDogbmV3IFJlZ0V4cCgnXFxcXGInKyBjbGFzc05hbWUrJ1xcXFxiJykudGVzdChlbC5jbGFzc05hbWUpOyB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkRXZlbnQoZWwsIHR5cGUsIGhhbmRsZXIpe1xuICAgICAgICAgICAgaWYgKGVsLmF0dGFjaEV2ZW50KSBlbC5hdHRhY2hFdmVudCgnb24nK3R5cGUsIGhhbmRsZXIpOyBlbHNlIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZWwsIHR5cGUsIGhhbmRsZXIpe1xuICAgICAgICAgICAgLy8gaWYgKGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpIG5vdCB3b3JraW5nIGluIElFMTFcbiAgICAgICAgICAgIGlmIChlbC5kZXRhY2hFdmVudCkgZWwuZGV0YWNoRXZlbnQoJ29uJyt0eXBlLCBoYW5kbGVyKTsgZWxzZSBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGxpdmUoZWxDbGFzcywgZXZlbnQsIGNiLCBjb250ZXh0KXtcbiAgICAgICAgICAgIGFkZEV2ZW50KGNvbnRleHQgfHwgZG9jdW1lbnQsIGV2ZW50LCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgZm91bmQsIGVsID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbCAmJiAhKGZvdW5kID0gaGFzQ2xhc3MoZWwsIGVsQ2xhc3MpKSkgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkgY2IuY2FsbChlbCwgZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvID0ge1xuICAgICAgICAgICAgc2VsZWN0b3I6IDAsXG4gICAgICAgICAgICBzb3VyY2U6IDAsXG4gICAgICAgICAgICBtaW5DaGFyczogMyxcbiAgICAgICAgICAgIGRlbGF5OiAxNTAsXG4gICAgICAgICAgICBvZmZzZXRMZWZ0OiAwLFxuICAgICAgICAgICAgb2Zmc2V0VG9wOiAxLFxuICAgICAgICAgICAgY2FjaGU6IDEsXG4gICAgICAgICAgICBtZW51Q2xhc3M6ICcnLFxuICAgICAgICAgICAgY29udGFpbmVyOiAnYm9keScsXG4gICAgICAgICAgICByZW5kZXJJdGVtOiBmdW5jdGlvbiAoaXRlbSwgc2VhcmNoKXtcbiAgICAgICAgICAgICAgICAvLyBlc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gICAgICAgICAgICAgICAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFxcW1xcXXt9XS9nLCAnXFxcXCQmJyk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIihcIiArIHNlYXJjaC5zcGxpdCgnICcpLmpvaW4oJ3wnKSArIFwiKVwiLCBcImdpXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cImF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uXCIgZGF0YS12YWw9XCInICsgaXRlbSArICdcIj4nICsgaXRlbS5yZXBsYWNlKHJlLCBcIjxiPiQxPC9iPlwiKSArICc8L2Rpdj4nO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uU2VsZWN0OiBmdW5jdGlvbihlLCB0ZXJtLCBpdGVtKXt9XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIGsgaW4gb3B0aW9ucykgeyBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrKSkgb1trXSA9IG9wdGlvbnNba107IH1cblxuICAgICAgICAvLyBpbml0XG4gICAgICAgIHZhciBlbGVtcyA9IHR5cGVvZiBvLnNlbGVjdG9yID09ICdvYmplY3QnID8gW28uc2VsZWN0b3JdIDogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChvLnNlbGVjdG9yKTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPGVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IGVsZW1zW2ldO1xuXG4gICAgICAgICAgICAvLyBjcmVhdGUgc3VnZ2VzdGlvbnMgY29udGFpbmVyIFwic2NcIlxuICAgICAgICAgICAgdGhhdC5zYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgdGhhdC5zYy5jbGFzc05hbWUgPSAnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb25zICcrby5tZW51Q2xhc3M7XG5cbiAgICAgICAgICAgIC8vIElmIGFkZGluZyBpbnRvIGEgcmVzdWx0cyBjb250YWluZXIsIHJlbW92ZSB0aGUgcG9zaXRpb24gYWJzb2x1dGUgY3NzIHN0eWxlc1xuICAgICAgICAgICAgaWYgKG8uY29udGFpbmVyICE9PSBcImJvZHlcIikge1xuICAgICAgICAgICAgICAgIHRoYXQuc2MuY2xhc3NOYW1lID0gdGhhdC5zYy5jbGFzc05hbWUgKyAnIGF1dG9jb21wbGV0ZS1zdWdnZXN0aW9ucy0taW4tY29udGFpbmVyJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhhdC5hdXRvY29tcGxldGVBdHRyID0gdGhhdC5nZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScpO1xuICAgICAgICAgICAgdGhhdC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcbiAgICAgICAgICAgIHRoYXQuY2FjaGUgPSB7fTtcbiAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSAnJztcblxuICAgICAgICAgICAgdGhhdC51cGRhdGVTQyA9IGZ1bmN0aW9uKHJlc2l6ZSwgbmV4dCl7XG4gICAgICAgICAgICAgICAgdmFyIHJlY3QgPSB0aGF0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgIGlmIChvLmNvbnRhaW5lciA9PT0gJ2JvZHknKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjb250YWluZXIgaXMgbm90IHRoZSBib2R5LCBkbyBub3QgYWJzb2x1dGVseSBwb3NpdGlvbiBpbiB0aGUgd2luZG93LlxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmxlZnQgPSBNYXRoLnJvdW5kKHJlY3QubGVmdCArICh3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQpICsgby5vZmZzZXRMZWZ0KSArICdweCc7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUudG9wID0gTWF0aC5yb3VuZChyZWN0LmJvdHRvbSArICh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCkgKyBvLm9mZnNldFRvcCkgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLndpZHRoID0gTWF0aC5yb3VuZChyZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0KSArICdweCc7IC8vIG91dGVyV2lkdGhcbiAgICAgICAgICAgICAgICBpZiAoIXJlc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuc2MubWF4SGVpZ2h0KSB7IHRoYXQuc2MubWF4SGVpZ2h0ID0gcGFyc2VJbnQoKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gZ2V0Q29tcHV0ZWRTdHlsZSh0aGF0LnNjLCBudWxsKSA6IHRoYXQuc2MuY3VycmVudFN0eWxlKS5tYXhIZWlnaHQpOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0KSB0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbicpLm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmV4dCkgdGhhdC5zYy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjclRvcCA9IHRoYXQuc2Muc2Nyb2xsVG9wLCBzZWxUb3AgPSBuZXh0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIHRoYXQuc2MuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxUb3AgKyB0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQgLSB0aGF0LnNjLm1heEhlaWdodCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc2Nyb2xsVG9wID0gc2VsVG9wICsgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0ICsgc2NyVG9wIC0gdGhhdC5zYy5tYXhIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2VsVG9wIDwgMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zY3JvbGxUb3AgPSBzZWxUb3AgKyBzY3JUb3A7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkRXZlbnQod2luZG93LCAncmVzaXplJywgdGhhdC51cGRhdGVTQyk7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG8uY29udGFpbmVyKS5hcHBlbmRDaGlsZCh0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBzZWwgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgIGlmIChzZWwpIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7IH0sIDIwKTtcbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICBsaXZlKCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicsICdtb3VzZW92ZXInLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsKSBzZWwuY2xhc3NOYW1lID0gc2VsLmNsYXNzTmFtZS5yZXBsYWNlKCdzZWxlY3RlZCcsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICBsaXZlKCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicsICdtb3VzZWRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICBpZiAoaGFzQ2xhc3ModGhpcywgJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJykpIHsgLy8gZWxzZSBvdXRzaWRlIGNsaWNrXG4gICAgICAgICAgICAgICAgICAgIHZhciB2ID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudmFsdWUgPSB2O1xuICAgICAgICAgICAgICAgICAgICBvLm9uU2VsZWN0KGUsIHYsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhhdC5zYyk7XG5cbiAgICAgICAgICAgIHRoYXQuYmx1ckhhbmRsZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHRyeSB7IHZhciBvdmVyX3NiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uczpob3ZlcicpOyB9IGNhdGNoKGUpeyB2YXIgb3Zlcl9zYiA9IDA7IH1cbiAgICAgICAgICAgICAgICBpZiAoIW92ZXJfc2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHRoYXQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDM1MCk7IC8vIGhpZGUgc3VnZ2VzdGlvbnMgb24gZmFzdCBpbnB1dFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhhdCAhPT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LmZvY3VzKCk7IH0sIDIwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAnYmx1cicsIHRoYXQuYmx1ckhhbmRsZXIpO1xuXG4gICAgICAgICAgICB2YXIgc3VnZ2VzdCA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0aGF0LnZhbHVlO1xuICAgICAgICAgICAgICAgIHRoYXQuY2FjaGVbdmFsXSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoICYmIHZhbC5sZW5ndGggPj0gby5taW5DaGFycykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7aTxkYXRhLmxlbmd0aDtpKyspIHMgKz0gby5yZW5kZXJJdGVtKGRhdGFbaV0sIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2MuaW5uZXJIVE1MID0gcztcbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVTQygwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoYXQua2V5ZG93bkhhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gd2luZG93LmV2ZW50ID8gZS5rZXlDb2RlIDogZS53aGljaDtcbiAgICAgICAgICAgICAgICAvLyBkb3duICg0MCksIHVwICgzOClcbiAgICAgICAgICAgICAgICBpZiAoKGtleSA9PSA0MCB8fCBrZXkgPT0gMzgpICYmIHRoYXQuc2MuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0LCBzZWwgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IChrZXkgPT0gNDApID8gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nKSA6IHRoYXQuc2MuY2hpbGROb2Rlc1t0aGF0LnNjLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV07IC8vIGZpcnN0IDogbGFzdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gbmV4dC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0ID0gKGtleSA9PSA0MCkgPyBzZWwubmV4dFNpYmxpbmcgOiBzZWwucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwuY2xhc3NOYW1lID0gc2VsLmNsYXNzTmFtZS5yZXBsYWNlKCdzZWxlY3RlZCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0LmNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gbmV4dC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHsgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7IHRoYXQudmFsdWUgPSB0aGF0Lmxhc3RfdmFsOyBuZXh0ID0gMDsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlU0MoMCwgbmV4dCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gZXNjXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5ID09IDI3KSB7IHRoYXQudmFsdWUgPSB0aGF0Lmxhc3RfdmFsOyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH1cbiAgICAgICAgICAgICAgICAvLyBlbnRlclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PSAxMyB8fCBrZXkgPT0gOSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAmJiB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgIT0gJ25vbmUnKSB7IG8ub25TZWxlY3QoZSwgc2VsLmdldEF0dHJpYnV0ZSgnZGF0YS12YWwnKSwgc2VsKTsgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDIwKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAna2V5ZG93bicsIHRoYXQua2V5ZG93bkhhbmRsZXIpO1xuXG4gICAgICAgICAgICB0aGF0LmtleXVwSGFuZGxlciA9IGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSB3aW5kb3cuZXZlbnQgPyBlLmtleUNvZGUgOiBlLndoaWNoO1xuICAgICAgICAgICAgICAgIGlmICgha2V5IHx8IChrZXkgPCAzNSB8fCBrZXkgPiA0MCkgJiYga2V5ICE9IDEzICYmIGtleSAhPSAyNykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhhdC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPj0gby5taW5DaGFycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAhPSB0aGF0Lmxhc3RfdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhhdC50aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8uY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCBpbiB0aGF0LmNhY2hlKSB7IHN1Z2dlc3QodGhhdC5jYWNoZVt2YWxdKTsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIHJlcXVlc3RzIGlmIHByZXZpb3VzIHN1Z2dlc3Rpb25zIHdlcmUgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0xOyBpPHZhbC5sZW5ndGgtby5taW5DaGFyczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFydCA9IHZhbC5zbGljZSgwLCB2YWwubGVuZ3RoLWkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnQgaW4gdGhhdC5jYWNoZSAmJiAhdGhhdC5jYWNoZVtwYXJ0XS5sZW5ndGgpIHsgc3VnZ2VzdChbXSk7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IG8uc291cmNlKHZhbCwgc3VnZ2VzdCkgfSwgby5kZWxheSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGFkZEV2ZW50KHRoYXQsICdrZXl1cCcsIHRoYXQua2V5dXBIYW5kbGVyKTtcblxuICAgICAgICAgICAgdGhhdC5mb2N1c0hhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gJ1xcbic7XG4gICAgICAgICAgICAgICAgdGhhdC5rZXl1cEhhbmRsZXIoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoIW8ubWluQ2hhcnMpIGFkZEV2ZW50KHRoYXQsICdmb2N1cycsIHRoYXQuZm9jdXNIYW5kbGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHB1YmxpYyBkZXN0cm95IG1ldGhvZFxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSBlbGVtc1tpXTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh3aW5kb3csICdyZXNpemUnLCB0aGF0LnVwZGF0ZVNDKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAnYmx1cicsIHRoYXQuYmx1ckhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHRoYXQsICdmb2N1cycsIHRoYXQuZm9jdXNIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAna2V5ZG93bicsIHRoYXQua2V5ZG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHRoYXQsICdrZXl1cCcsIHRoYXQua2V5dXBIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5hdXRvY29tcGxldGVBdHRyKVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgdGhhdC5hdXRvY29tcGxldGVBdHRyKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlQXR0cmlidXRlKCdhdXRvY29tcGxldGUnKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG8uY29udGFpbmVyKS5yZW1vdmVDaGlsZCh0aGF0LnNjKTtcbiAgICAgICAgICAgICAgICB0aGF0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGF1dG9Db21wbGV0ZTtcbn0pKCk7XG5cbihmdW5jdGlvbigpe1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG4gICAgICAgIGRlZmluZSgnYXV0b0NvbXBsZXRlJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gYXV0b0NvbXBsZXRlOyB9KTtcbiAgICBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvQ29tcGxldGU7XG4gICAgZWxzZVxuICAgICAgICB3aW5kb3cuYXV0b0NvbXBsZXRlID0gYXV0b0NvbXBsZXRlO1xufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXHRcdC8vIGJyb3dzZXJpZnkgJiBicmZzXG5cbmxldCBzdG9yZSA9IHJlcXVpcmUoJ3N0b3JlJylcblxubGV0IHRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpXG5sZXQgQXV0b0NvbXBsZXRlID0gcmVxdWlyZSgnLi9hdXRvLWNvbXBsZXRlLmpzJylcblxubGV0IE1vdmFibGUgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3Iobm9kZSwgc3RvcmFnZV9pZCkge1xuXHR0aGlzLm5vZGUgPSBub2RlXG5cdHRoaXMub2Zmc2V0X3ggPSBudWxsXG5cdHRoaXMub2Zmc2V0X3kgPSBudWxsXG5cdHRoaXMuc3RvcmFnZV9pZCA9IHN0b3JhZ2VfaWRcblxuXHQvLyB3ZSBvdWdodCB0byBzcGVjaWZpY2FseSBiaW5kIG1vdXNlKiBjYWxsYmFja3MgdG8gdGhpcyBvYmplY3Rcblx0Ly8gZm9yIGFkZEV2ZW50TGlzdGVuZXIvcmVtb3ZlRXZlbnRMaXN0ZW5lclxuXHR0aGlzLm1vdXNlZG93biA9IHRoaXMuX21vdXNlZG93bi5iaW5kKHRoaXMpXG5cdHRoaXMubW91c2Vtb3ZlID0gdGhpcy5fbW91c2Vtb3ZlLmJpbmQodGhpcylcblx0dGhpcy5tb3VzZXVwID0gdGhpcy5fbW91c2V1cC5iaW5kKHRoaXMpXG5cblx0dGhpcy5sb2cgPSBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUsICdNb3ZhYmxlOicpXG4gICAgfVxuXG4gICAgcG9zaXRpb24oZXZlbnQpIHtcblx0bGV0IHggPSBldmVudC5jbGllbnRYIC0gdGhpcy5vZmZzZXRfeFxuXHRsZXQgeSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm9mZnNldF95XG5cblx0Ly8gVE9ETzogcmlnaHQsIGJvdHRvbVxuXHRpZiAoeCA8IDApIHggPSAwXG5cdGlmICh5IDwgMCkgeSA9IDBcblx0cmV0dXJuIHt4LCB5fVxuICAgIH1cblxuICAgIG1vdmUoeCwgeSkge1xuXHR0aGlzLm5vZGUuc3R5bGUubGVmdCA9IHggKyAncHgnXG5cdHRoaXMubm9kZS5zdHlsZS50b3AgPSB5ICsgJ3B4J1xuXHR0aGlzLm5vZGUuc3R5bGUucmlnaHQgPSAnYXV0bydcblx0dGhpcy5ub2RlLnN0eWxlLmJvdHRvbSA9ICdhdXRvJ1xuICAgIH1cblxuICAgIHZhbGlkX2V2ZW50KGV2ZW50KSB7XG5cdHJldHVybiAodGhpcy5ub2RlID09PSBldmVudC50YXJnZXQpICYmIChldmVudC5idXR0b24gPT09IDApXG4gICAgfVxuXG4gICAgX21vdXNlZG93bihldmVudCkge1xuXHRpZiAoIXRoaXMudmFsaWRfZXZlbnQoZXZlbnQpKSByZXR1cm5cblx0dGhpcy5vZmZzZXRfeCA9IGV2ZW50LmNsaWVudFggLSB0aGlzLm5vZGUub2Zmc2V0TGVmdFxuXHR0aGlzLm9mZnNldF95ID0gZXZlbnQuY2xpZW50WSAtIHRoaXMubm9kZS5vZmZzZXRUb3Bcblx0dGhpcy5sb2coYG1vdXNlZG93biwgb2Zmc2V0X3g9JHt0aGlzLm9mZnNldF94fSwgb2Zmc2V0X3k9JHt0aGlzLm9mZnNldF95fWApXG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMubW91c2Vtb3ZlKVxuXHR0aGlzLl9tb3VzZW1vdmUoZXZlbnQpXG4gICAgfVxuXG4gICAgX21vdXNlbW92ZShldmVudCkge1xuXHR0aGlzLm5vZGUuc3R5bGUuY3Vyc29yID0gJ21vdmUnXG5cdGxldCBwID0gdGhpcy5wb3NpdGlvbihldmVudClcblx0dGhpcy5tb3ZlKHAueCwgcC55KVxuICAgIH1cblxuICAgIC8vIHdoZW4gYGZvcmNlYCBpcyB0cnVlLCBgZXZlbnRgIHNob3VsZCBiZSBudWxsIGJlY2F1c2Ugd2UncmVcbiAgICAvLyBpbnZva2luZyBfbW91c2V1cCgpIG1hbnVhbGx5IGZyb20gYSBjb21wbGV0ZWx5IGRpZmYgY29udGV4dCB0b1xuICAgIC8vIGZvcmNpYmx5IHJlbW92ZSBtb3VzZW1vdmUgbGlzdGVuZXIuXG4gICAgX21vdXNldXAoZXZlbnQsIGZvcmNlKSB7XG5cdGlmICghZm9yY2UgJiYgIXRoaXMudmFsaWRfZXZlbnQoZXZlbnQpKSByZXR1cm5cblx0dGhpcy5sb2coJ21vdXNldXAnKVxuXHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlbW92ZSlcblx0dGhpcy5ub2RlLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0J1xuXG5cdC8vIHNhdmUgdGhlIHdpZGdldCBwb3NpdGlvblxuXHRpZiAoIXRoaXMuc3RvcmFnZV9pZCB8fCBmb3JjZSkgcmV0dXJuXG5cdGxldCBwID0gdGhpcy5wb3NpdGlvbihldmVudClcblx0c3RvcmUuc2V0KHRoaXMuc3RvcmFnZV9pZCwge1xuXHQgICAgbGVmdDogcC54ICsgJ3B4Jyxcblx0ICAgIHRvcDogcC55ICsgJ3B4Jyxcblx0ICAgIHJpZ2h0OiAnYXV0bycsXG5cdCAgICBib3R0b206ICdhdXRvJ1xuXHR9KVxuXHR0aGlzLmxvZygnc2F2ZWQnKVxuICAgIH1cblxuICAgIGhvb2soKSB7XG5cdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm1vdXNlZG93bilcblx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm1vdXNldXApXG4gICAgfVxuXG4gICAgdW5ob29rKCkge1xuXHR0aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5tb3VzZWRvd24pXG5cdHRoaXMubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5tb3VzZXVwKVxuXHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlbW92ZSlcbiAgICB9XG59XG5cbmxldCBUb2NKdW1wZXIgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3Iob3B0KSB7XG5cdHRoaXMuZGF0YSA9IG51bGxcblxuXHR0aGlzLm9wdCA9IHtcblx0ICAgIGlkOiAndG9jX2p1bXBlcicsXG5cdCAgICBzZWxlY3RvcjogJycsXG5cdCAgICB0cmFuc2Zvcm06IG51bGwsXG5cdCAgICBrZXk6ICdpJyxcblx0ICAgIHByZWZfc2F2ZTogdHJ1ZSxcblxuXHQgICAgdG9wOiAnNGVtJyxcblx0ICAgIHJpZ2h0OiAnLjVlbScsXG5cdCAgICBib3R0b206ICdhdXRvJyxcblx0ICAgIGxlZnQ6ICdhdXRvJyxcblx0fVxuXG5cdC8vIG1lcmdlIHVzZXIgb3B0aW9uc1xuXHRmb3IgKGxldCBpZHggaW4gb3B0KSB0aGlzLm9wdFtpZHhdID0gb3B0W2lkeF1cblxuXHRpZiAodGhpcy5vcHQucHJlZl9zYXZlKSB0aGlzLm9wdC5zdG9yYWdlX2lkID0gYHRvY19qdW1wZXItLSR7dGhpcy5vcHQuaWR9YFxuXG5cdHRoaXMubG9nID0gY29uc29sZS5sb2cuYmluZChjb25zb2xlLCAnVG9jSnVtcGVyOicpXG5cdHRoaXMubG9nKCdpbml0JylcbiAgICB9XG5cbiAgICBsb2FkX3NhdmVkX29wdCgpIHtcblx0aWYgKCF0aGlzLm9wdC5zdG9yYWdlX2lkKSByZXR1cm5cblx0bGV0IHNhdmVkX29wdCA9IHN0b3JlLmdldCh0aGlzLm9wdC5zdG9yYWdlX2lkKVxuXHRpZiAoc2F2ZWRfb3B0KSB7XG5cdCAgICBbJ3RvcCcsICdyaWdodCcsICdib3R0b20nLCAnbGVmdCddXG5cdFx0LmZvckVhY2goIChpZHgpID0+IHRoaXMub3B0W2lkeF0gPSBzYXZlZF9vcHRbaWR4XSB8fCB0aGlzLm9wdFtpZHhdIClcblx0ICAgIHRoaXMubG9nKFwibG9hZGVkIHNhdmVkIG9wdGlvbnNcIilcblx0fVxuICAgIH1cblxuICAgIHNjcm9sbCh0ZXJtKSB7XG5cdGlmICh0ZXJtIGluIHRoaXMuZGF0YSkge1xuXHQgICAgdGhpcy5sb2codGVybSlcblx0ICAgIHRoaXMuZGF0YVt0ZXJtXS5zY3JvbGxJbnRvVmlldyh0cnVlKVxuXHR9XG4gICAgfVxuXG4gICAgaG9vaygpIHtcblx0dGhpcy5kYXRhID0gbWFrZV9pbmRleCh0aGlzLm9wdC5zZWxlY3RvciwgdGhpcy5vcHQudHJhbnNmb3JtKVxuXHRjc3NfaW5qZWN0KHsgaWQ6IHRoaXMub3B0LmlkIH0pXG5cdGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuXHQgICAgaWYgKFsnSU5QVVQnLCAnVEVYVEFSRUEnXS5pbmRleE9mKGV2ZW50LnRhcmdldC5ub2RlTmFtZSkgIT09IC0xKVxuXHRcdHJldHVyblxuXHQgICAgaWYgKGV2ZW50LmtleSA9PT0gdGhpcy5vcHQua2V5ICYmICFldmVudC5jdHJsS2V5KSB0aGlzLmRsZygpXG5cdCAgICBpZiAoaXNfZXNjYXBlX2tleShldmVudCkpIHRoaXMubW92YWJsZS5fbW91c2V1cChudWxsLCB0cnVlKVxuXHR9KVxuICAgIH1cblxuICAgIGRsZygpIHtcblx0bGV0IG5vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLm9wdC5pZClcblx0aWYgKG5vZGUpIHJldHVybiBmb2N1cyhub2RlKVxuXG5cdHRoaXMubG9hZF9zYXZlZF9vcHQoKVxuXHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jylcblx0bm9kZS5pZCA9IHRoaXMub3B0LmlkO1xuXHRbJ3RvcCcsICdyaWdodCcsICdib3R0b20nLCAnbGVmdCddXG5cdCAgICAuZm9yRWFjaCggKGlkeCkgPT4gbm9kZS5zdHlsZVtpZHhdID0gdGhpcy5vcHRbaWR4XSApXG5cblx0bGV0IGFjX2NvbnRhaW5lciA9IGAke3RoaXMub3B0LmlkfV9jb250YWluZXJgXG5cdG5vZGUuaW5uZXJIVE1MID0gYDxzcGFuIGlkPVwiJHthY19jb250YWluZXJ9XCI+PGlucHV0IHNpemU9XCI0MFwiIHNwZWxsY2hlY2s9XCJmYWxzZVwiIC8+PC9zcGFuPlxuPHNwYW4gaWQ9XCIke3RoaXMub3B0LmlkfV9jbG9zZVwiIHRpdGxlPVwiQ2xvc2VcIj48c3Bhbj4mdGltZXM7PC9zcGFuPjwvc3Bhbj5gXG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZSlcblx0bGV0IGlucHV0ID0gbm9kZS5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpXG5cblx0bGV0IGFjID0gbmV3IEF1dG9Db21wbGV0ZSh7XG5cdCAgICBzZWxlY3RvcjogaW5wdXQsXG5cdCAgICBtaW5DaGFyczogMSxcblx0ICAgIGRlbGF5OiA1MCxcblx0ICAgIGNvbnRhaW5lcjogJyMnICsgYWNfY29udGFpbmVyLFxuXHQgICAgc291cmNlOiAodGVybSwgc3VnZ2VzdCkgPT4ge1xuXHRcdGxldCBsaXN0ID0gW11cblx0XHRmb3IgKGxldCBrZXkgaW4gdGhpcy5kYXRhKSB7XG5cdFx0ICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKS5pbmRleE9mKHRlcm0udG9Mb3dlckNhc2UoKSkgIT09IC0xKVxuXHRcdFx0bGlzdC5wdXNoKGtleSlcblx0XHR9XG5cdFx0c3VnZ2VzdChUb2NKdW1wZXIuc29ydChsaXN0LCB0ZXJtKSlcblx0ICAgIH0sXG5cdCAgICBvblNlbGVjdDogKGV2ZW50LCB0ZXJtLCBpdGVtKSA9PiB0aGlzLnNjcm9sbCh0ZXJtKVxuXHR9KVxuXG5cdGxldCBkZXN0cm95ID0gKCkgPT4ge1xuXHQgICAgYWMuZGVzdHJveSgpXG5cdCAgICB0aGlzLm1vdmFibGUudW5ob29rKClcblx0ICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobm9kZSlcblx0fVxuXG5cdG5vZGUucXVlcnlTZWxlY3RvcihgIyR7dGhpcy5vcHQuaWR9X2Nsb3NlYCkub25jbGljayA9IGRlc3Ryb3lcblx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG5cdCAgICBpZiAoZXZlbnQua2V5ID09PSAnRW50ZXInKSB0aGlzLnNjcm9sbChpbnB1dC52YWx1ZSlcblx0ICAgIGlmIChpc19lc2NhcGVfa2V5KGV2ZW50KSkgZGVzdHJveSgpXG5cdH0pXG5cblx0dGhpcy5tb3ZhYmxlID0gbmV3IE1vdmFibGUobm9kZSwgdGhpcy5vcHQuc3RvcmFnZV9pZClcblx0dGhpcy5tb3ZhYmxlLmhvb2soKVxuXG5cdGZvY3VzKG5vZGUpXG4gICAgfVxuXG4gICAgc3RhdGljIHNvcnQoYXJyLCB0ZXJtKSB7XG5cdHJldHVybiBhcnIuc29ydCggKGEsIGIpID0+IHtcblx0ICAgIGlmIChhLnNsaWNlKDAsIHRlcm0ubGVuZ3RoKSA9PT0gdGVybSkgcmV0dXJuIC0xXG5cdCAgICBpZiAoYi5zbGljZSgwLCB0ZXJtLmxlbmd0aCkgPT09IHRlcm0pIHJldHVybiAxXG5cdCAgICByZXR1cm4gYS5sb2NhbGVDb21wYXJlKGIpXG5cdH0pXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRvY0p1bXBlclxuXG5sZXQgbWFrZV9pbmRleCA9IGZ1bmN0aW9uKHNlbGVjdG9yLCB0cmFuc2Zvcm0pIHtcbiAgICBsZXQgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuXG4gICAgbGV0IHIgPSB7fVxuICAgIGxldCBjYWNoZSA9IHt9XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgbm9kZXMubGVuZ3RoOyArK2lkeCkge1xuXHRsZXQgbm9kZSA9IG5vZGVzW2lkeF1cblx0bGV0IGtleSA9IHRyYW5zZm9ybSA/IHRyYW5zZm9ybShub2RlLmlubmVyVGV4dCkgOiBub2RlLmlubmVyVGV4dFxuXHRjYWNoZVtrZXldID0gKGNhY2hlW2tleV0gfHwgMCkgKyAxXG5cdGlmIChrZXkgaW4gcikga2V5ID0gYCR7a2V5fSA8JHtjYWNoZVtrZXldfT5gXG5cblx0cltrZXldID0gbm9kZVxuICAgIH1cblxuICAgIHJldHVybiByXG59XG5cbmxldCBjc3NfaW5qZWN0ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIGxldCBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgIGxldCB0bXBsID0gdGVtcGxhdGUoXCIvKiBhdXRvLWNvbXBsZXRlLmpzICovXFxuLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9ucyB7XFxuICB0ZXh0LWFsaWduOiBsZWZ0O1xcbiAgY3Vyc29yOiBkZWZhdWx0O1xcbiAgYm9yZGVyOiAxcHggc29saWQgI2NjYztcXG4gIGJvcmRlci10b3A6IDA7XFxuICBiYWNrZ3JvdW5kOiB3aGl0ZTtcXG4gIGJveC1zaGFkb3c6IC0xcHggMXB4IDNweCByZ2JhKDAsIDAsIDAsIC4xKTtcXG5cXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIGRpc3BsYXk6IG5vbmU7XFxuICB6LWluZGV4OiA5OTk5O1xcbiAgbWF4LWhlaWdodDogMTVlbTtcXG4gIG92ZXJmbG93OiBoaWRkZW47XFxuICBvdmVyZmxvdy15OiBhdXRvO1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG59XFxuLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uIHtcXG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XFxuICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XFxufVxcbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCB7XFxuICBiYWNrZ3JvdW5kOiAjZWVlO1xcbn1cXG5cXG4vKiB0b2MtanVtcGVyICovXFxuIzwlPSBpZCAlPiB7XFxuICBib3JkZXI6IDFweCBzb2xpZCAjYTlhOWE5O1xcbiAgcGFkZGluZzogMC44ZW07XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcXG4gIGNvbG9yOiBibGFjaztcXG4gIGJveC1zaGFkb3c6IDFweCAxcHggM3B4IHJnYmEoMCwgMCwgMCwgLjQpO1xcblxcbiAgcG9zaXRpb246IGZpeGVkO1xcbn1cXG5cXG4jPCU9IGlkICU+X2Nsb3NlIHtcXG4gIG1hcmdpbi1sZWZ0OiAxZW07XFxuICBmb250LXdlaWdodDogYm9sZDtcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcXG4gIGxpbmUtaGVpZ2h0OiAyZW07XFxuICB3aWR0aDogMmVtO1xcbiAgaGVpZ2h0OiAyZW07XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxufVxcblxcbiM8JT0gaWQgJT5fY2xvc2U6aG92ZXIge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2U4MTEyMztcXG4gIGNvbG9yOiB3aGl0ZTtcXG59XFxuXCIpXG4gICAgbm9kZS5pbm5lckhUTUwgPSB0bXBsKGRhdGEpXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKVxufVxuXG5sZXQgZm9jdXMgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgc2V0VGltZW91dCggKCkgPT4gbm9kZS5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpLmZvY3VzKCksIDEpXG59XG5cbi8vIElFMTEgcmV0dXJucyBcIkVzY1wiLCBDaHJvbWUgJiBGaXJlZm94IHJldHVybiBcIkVzY2FwZVwiXG5sZXQgaXNfZXNjYXBlX2tleSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgcmV0dXJuIGV2ZW50LmtleS5tYXRjaCgvXkVzYy8pXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuLy8gTW9kdWxlIGV4cG9ydCBwYXR0ZXJuIGZyb21cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvcmV0dXJuRXhwb3J0cy5qc1xuOyhmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuICAgICAgICAvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcbiAgICAgICAgLy8gbGlrZSBOb2RlLlxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHMgKHJvb3QgaXMgd2luZG93KVxuICAgICAgICByb290LnN0b3JlID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblx0XG5cdC8vIFN0b3JlLmpzXG5cdHZhciBzdG9yZSA9IHt9LFxuXHRcdHdpbiA9ICh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gd2luZG93IDogZ2xvYmFsKSxcblx0XHRkb2MgPSB3aW4uZG9jdW1lbnQsXG5cdFx0bG9jYWxTdG9yYWdlTmFtZSA9ICdsb2NhbFN0b3JhZ2UnLFxuXHRcdHNjcmlwdFRhZyA9ICdzY3JpcHQnLFxuXHRcdHN0b3JhZ2VcblxuXHRzdG9yZS5kaXNhYmxlZCA9IGZhbHNlXG5cdHN0b3JlLnZlcnNpb24gPSAnMS4zLjIwJ1xuXHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7fVxuXHRzdG9yZS5nZXQgPSBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWwpIHt9XG5cdHN0b3JlLmhhcyA9IGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gc3RvcmUuZ2V0KGtleSkgIT09IHVuZGVmaW5lZCB9XG5cdHN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uKGtleSkge31cblx0c3RvcmUuY2xlYXIgPSBmdW5jdGlvbigpIHt9XG5cdHN0b3JlLnRyYW5zYWN0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsLCB0cmFuc2FjdGlvbkZuKSB7XG5cdFx0aWYgKHRyYW5zYWN0aW9uRm4gPT0gbnVsbCkge1xuXHRcdFx0dHJhbnNhY3Rpb25GbiA9IGRlZmF1bHRWYWxcblx0XHRcdGRlZmF1bHRWYWwgPSBudWxsXG5cdFx0fVxuXHRcdGlmIChkZWZhdWx0VmFsID09IG51bGwpIHtcblx0XHRcdGRlZmF1bHRWYWwgPSB7fVxuXHRcdH1cblx0XHR2YXIgdmFsID0gc3RvcmUuZ2V0KGtleSwgZGVmYXVsdFZhbClcblx0XHR0cmFuc2FjdGlvbkZuKHZhbClcblx0XHRzdG9yZS5zZXQoa2V5LCB2YWwpXG5cdH1cblx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oKSB7fVxuXHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oKSB7fVxuXG5cdHN0b3JlLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXHR9XG5cdHN0b3JlLmRlc2VyaWFsaXplID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7IHJldHVybiB1bmRlZmluZWQgfVxuXHRcdHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHZhbHVlKSB9XG5cdFx0Y2F0Y2goZSkgeyByZXR1cm4gdmFsdWUgfHwgdW5kZWZpbmVkIH1cblx0fVxuXG5cdC8vIEZ1bmN0aW9ucyB0byBlbmNhcHN1bGF0ZSBxdWVzdGlvbmFibGUgRmlyZUZveCAzLjYuMTMgYmVoYXZpb3Jcblx0Ly8gd2hlbiBhYm91dC5jb25maWc6OmRvbS5zdG9yYWdlLmVuYWJsZWQgPT09IGZhbHNlXG5cdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFyY3Vzd2VzdGluL3N0b3JlLmpzL2lzc3VlcyNpc3N1ZS8xM1xuXHRmdW5jdGlvbiBpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSB7XG5cdFx0dHJ5IHsgcmV0dXJuIChsb2NhbFN0b3JhZ2VOYW1lIGluIHdpbiAmJiB3aW5bbG9jYWxTdG9yYWdlTmFtZV0pIH1cblx0XHRjYXRjaChlcnIpIHsgcmV0dXJuIGZhbHNlIH1cblx0fVxuXG5cdGlmIChpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSkge1xuXHRcdHN0b3JhZ2UgPSB3aW5bbG9jYWxTdG9yYWdlTmFtZV1cblx0XHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdFx0aWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XG5cdFx0XHRzdG9yYWdlLnNldEl0ZW0oa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHJldHVybiB2YWxcblx0XHR9XG5cdFx0c3RvcmUuZ2V0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsKSB7XG5cdFx0XHR2YXIgdmFsID0gc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRJdGVtKGtleSkpXG5cdFx0XHRyZXR1cm4gKHZhbCA9PT0gdW5kZWZpbmVkID8gZGVmYXVsdFZhbCA6IHZhbClcblx0XHR9XG5cdFx0c3RvcmUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7IHN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpIH1cblx0XHRzdG9yZS5jbGVhciA9IGZ1bmN0aW9uKCkgeyBzdG9yYWdlLmNsZWFyKCkgfVxuXHRcdHN0b3JlLmdldEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxzdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBrZXkgPSBzdG9yYWdlLmtleShpKVxuXHRcdFx0XHRjYWxsYmFjayhrZXksIHN0b3JlLmdldChrZXkpKVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmIChkb2MgJiYgZG9jLmRvY3VtZW50RWxlbWVudC5hZGRCZWhhdmlvcikge1xuXHRcdHZhciBzdG9yYWdlT3duZXIsXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyXG5cdFx0Ly8gU2luY2UgI3VzZXJEYXRhIHN0b3JhZ2UgYXBwbGllcyBvbmx5IHRvIHNwZWNpZmljIHBhdGhzLCB3ZSBuZWVkIHRvXG5cdFx0Ly8gc29tZWhvdyBsaW5rIG91ciBkYXRhIHRvIGEgc3BlY2lmaWMgcGF0aC4gIFdlIGNob29zZSAvZmF2aWNvbi5pY29cblx0XHQvLyBhcyBhIHByZXR0eSBzYWZlIG9wdGlvbiwgc2luY2UgYWxsIGJyb3dzZXJzIGFscmVhZHkgbWFrZSBhIHJlcXVlc3QgdG9cblx0XHQvLyB0aGlzIFVSTCBhbnl3YXkgYW5kIGJlaW5nIGEgNDA0IHdpbGwgbm90IGh1cnQgdXMgaGVyZS4gIFdlIHdyYXAgYW5cblx0XHQvLyBpZnJhbWUgcG9pbnRpbmcgdG8gdGhlIGZhdmljb24gaW4gYW4gQWN0aXZlWE9iamVjdChodG1sZmlsZSkgb2JqZWN0XG5cdFx0Ly8gKHNlZTogaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2FhNzUyNTc0KHY9VlMuODUpLmFzcHgpXG5cdFx0Ly8gc2luY2UgdGhlIGlmcmFtZSBhY2Nlc3MgcnVsZXMgYXBwZWFyIHRvIGFsbG93IGRpcmVjdCBhY2Nlc3MgYW5kXG5cdFx0Ly8gbWFuaXB1bGF0aW9uIG9mIHRoZSBkb2N1bWVudCBlbGVtZW50LCBldmVuIGZvciBhIDQwNCBwYWdlLiAgVGhpc1xuXHRcdC8vIGRvY3VtZW50IGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgZG9jdW1lbnQgKHdoaWNoIHdvdWxkXG5cdFx0Ly8gaGF2ZSBiZWVuIGxpbWl0ZWQgdG8gdGhlIGN1cnJlbnQgcGF0aCkgdG8gcGVyZm9ybSAjdXNlckRhdGEgc3RvcmFnZS5cblx0XHR0cnkge1xuXHRcdFx0c3RvcmFnZUNvbnRhaW5lciA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyLm9wZW4oKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci53cml0ZSgnPCcrc2NyaXB0VGFnKyc+ZG9jdW1lbnQudz13aW5kb3c8Lycrc2NyaXB0VGFnKyc+PGlmcmFtZSBzcmM9XCIvZmF2aWNvbi5pY29cIj48L2lmcmFtZT4nKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci5jbG9zZSgpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBzdG9yYWdlQ29udGFpbmVyLncuZnJhbWVzWzBdLmRvY3VtZW50XG5cdFx0XHRzdG9yYWdlID0gc3RvcmFnZU93bmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHQvLyBzb21laG93IEFjdGl2ZVhPYmplY3QgaW5zdGFudGlhdGlvbiBmYWlsZWQgKHBlcmhhcHMgc29tZSBzcGVjaWFsXG5cdFx0XHQvLyBzZWN1cml0eSBzZXR0aW5ncyBvciBvdGhlcndzZSksIGZhbGwgYmFjayB0byBwZXItcGF0aCBzdG9yYWdlXG5cdFx0XHRzdG9yYWdlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBkb2MuYm9keVxuXHRcdH1cblx0XHR2YXIgd2l0aElFU3RvcmFnZSA9IGZ1bmN0aW9uKHN0b3JlRnVuY3Rpb24pIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG5cdFx0XHRcdGFyZ3MudW5zaGlmdChzdG9yYWdlKVxuXHRcdFx0XHQvLyBTZWUgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxMDgxKHY9VlMuODUpLmFzcHhcblx0XHRcdFx0Ly8gYW5kIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTQyNCh2PVZTLjg1KS5hc3B4XG5cdFx0XHRcdHN0b3JhZ2VPd25lci5hcHBlbmRDaGlsZChzdG9yYWdlKVxuXHRcdFx0XHRzdG9yYWdlLmFkZEJlaGF2aW9yKCcjZGVmYXVsdCN1c2VyRGF0YScpXG5cdFx0XHRcdHN0b3JhZ2UubG9hZChsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gc3RvcmVGdW5jdGlvbi5hcHBseShzdG9yZSwgYXJncylcblx0XHRcdFx0c3RvcmFnZU93bmVyLnJlbW92ZUNoaWxkKHN0b3JhZ2UpXG5cdFx0XHRcdHJldHVybiByZXN1bHRcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJbiBJRTcsIGtleXMgY2Fubm90IHN0YXJ0IHdpdGggYSBkaWdpdCBvciBjb250YWluIGNlcnRhaW4gY2hhcnMuXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzQwXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzgzXG5cdFx0dmFyIGZvcmJpZGRlbkNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKFwiWyFcXFwiIyQlJicoKSorLC9cXFxcXFxcXDo7PD0+P0BbXFxcXF1eYHt8fX5dXCIsIFwiZ1wiKVxuXHRcdHZhciBpZUtleUZpeCA9IGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0cmV0dXJuIGtleS5yZXBsYWNlKC9eZC8sICdfX18kJicpLnJlcGxhY2UoZm9yYmlkZGVuQ2hhcnNSZWdleCwgJ19fXycpXG5cdFx0fVxuXHRcdHN0b3JlLnNldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5LCB2YWwpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gc3RvcmUucmVtb3ZlKGtleSkgfVxuXHRcdFx0c3RvcmFnZS5zZXRBdHRyaWJ1dGUoa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0cmV0dXJuIHZhbFxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0ID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXksIGRlZmF1bHRWYWwpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdHZhciB2YWwgPSBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEF0dHJpYnV0ZShrZXkpKVxuXHRcdFx0cmV0dXJuICh2YWwgPT09IHVuZGVmaW5lZCA/IGRlZmF1bHRWYWwgOiB2YWwpXG5cdFx0fSlcblx0XHRzdG9yZS5yZW1vdmUgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UsIGtleSkge1xuXHRcdFx0a2V5ID0gaWVLZXlGaXgoa2V5KVxuXHRcdFx0c3RvcmFnZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KVxuXHRcdFx0c3RvcmFnZS5zYXZlKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0fSlcblx0XHRzdG9yZS5jbGVhciA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRzdG9yYWdlLmxvYWQobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRcdGZvciAodmFyIGk9YXR0cmlidXRlcy5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG5cdFx0XHRcdHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZXNbaV0ubmFtZSlcblx0XHRcdH1cblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBjYWxsYmFjaykge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgKytpKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGF0dHIubmFtZSwgc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoYXR0ci5uYW1lKSkpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHRyeSB7XG5cdFx0dmFyIHRlc3RLZXkgPSAnX19zdG9yZWpzX18nXG5cdFx0c3RvcmUuc2V0KHRlc3RLZXksIHRlc3RLZXkpXG5cdFx0aWYgKHN0b3JlLmdldCh0ZXN0S2V5KSAhPSB0ZXN0S2V5KSB7IHN0b3JlLmRpc2FibGVkID0gdHJ1ZSB9XG5cdFx0c3RvcmUucmVtb3ZlKHRlc3RLZXkpXG5cdH0gY2F0Y2goZSkge1xuXHRcdHN0b3JlLmRpc2FibGVkID0gdHJ1ZVxuXHR9XG5cdHN0b3JlLmVuYWJsZWQgPSAhc3RvcmUuZGlzYWJsZWRcblx0XG5cdHJldHVybiBzdG9yZVxufSkpO1xuIiwiLypcbiAgQSBtb2RpZmllZCBfLnRlbXBsYXRlKCkgZnJvbSB1bmRlcnNjb3JlLmpzLlxuXG4gIFdoeSBub3QgdXNlIGxvZGFzaC90ZW1wbGF0ZT8gVGhpcyB2ZXJzaW9uIGlzIH41IHRpbWVzIHNtYWxsZXIuXG4qL1xuXG52YXIgbm9NYXRjaCA9IC8oLileLztcbnZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG59O1xuXG52YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHUyMDI4fFxcdTIwMjkvZztcblxudmFyIGVzY2FwZUNoYXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTtcbn07XG5cbnZhciB0ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGV4dCkge1xuICAgIHZhciBzZXR0aW5ncyA9IHRlbXBsYXRlU2V0dGluZ3M7XG5cbiAgICB2YXIgbWF0Y2hlciA9IFJlZ0V4cChbXG5cdChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuXHQoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuXHQoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcblx0c291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldCkucmVwbGFjZShlc2NhcGVyLCBlc2NhcGVDaGFyKTtcblx0aW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cblx0aWYgKGVzY2FwZSkge1xuXHQgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcblx0fSBlbHNlIGlmIChpbnRlcnBvbGF0ZSkge1xuXHQgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG5cdH0gZWxzZSBpZiAoZXZhbHVhdGUpIHtcblx0ICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG5cdH1cblxuXHRyZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG5cdFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG5cdHNvdXJjZSArICdyZXR1cm4gX19wO1xcbic7XG5cbiAgICB2YXIgcmVuZGVyXG4gICAgdHJ5IHtcblx0cmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcblx0ZS5zb3VyY2UgPSBzb3VyY2U7XG5cdHRocm93IGU7XG4gICAgfVxuXG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuXHRyZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSk7XG4gICAgfTtcblxuICAgIHZhciBhcmd1bWVudCA9IHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonO1xuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgYXJndW1lbnQgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xufTtcbiJdfQ==
// ]]>
