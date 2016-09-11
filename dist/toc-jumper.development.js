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

var template = require('./template');
var AutoComplete = require('./auto-complete.js');

var Movable = function () {
			function Movable(node) {
						_classCallCheck(this, Movable);

						this.node = node;
						this.offset_x = null;
						this.offset_y = null;

						// we ought to specificaly bind mouse* callbacks to this class
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
						key: '_mousedown',
						value: function _mousedown(event) {
									if (this.node !== event.target) return;
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
			}, {
						key: '_mouseup',
						value: function _mouseup(event, force) {
									if (!force && this.node !== event.target) return;
									this.log('mouseup');
									document.removeEventListener('mousemove', this.mousemove);
									this.node.style.cursor = 'default';
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

									top: '4em',
									right: '.5em',
									bottom: 'auto',
									left: 'auto'
						};

						for (var idx in opt) {
									// merge
									if (opt.hasOwnProperty(idx)) this.opt[idx] = opt[idx];
						}
						this.log = console.log.bind(console, 'TocJumper:');
						this.log('init');
			}

			_createClass(TocJumper, [{
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
									var _this = this;

									this.data = make_index(this.opt.selector, this.opt.transform);
									css_inject({ id: this.opt.id });
									document.body.addEventListener('keydown', function (event) {
												if (event.target.nodeName === 'INPUT') return;
												if (event.key === _this.opt.key && !event.ctrlKey) _this.dlg();
												// IE11 returns "Esc", Chrome & Firefox return "Escape"
												if (event.key.match(/^Esc/)) _this.movable._mouseup(null, true);
									});
						}
			}, {
						key: 'dlg',
						value: function dlg() {
									var _this2 = this;

									var node = document.getElementById(this.opt.id);
									if (node) return focus(node);

									node = document.createElement('div');
									node.id = this.opt.id;
									['top', 'right', 'bottom', 'left'].forEach(function (idx) {
												return node.style[idx] = _this2.opt[idx];
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
															for (var key in _this2.data) {
																		if (key.toLowerCase().indexOf(term.toLowerCase()) !== -1) list.push(key);
															}
															suggest(TocJumper.sort(list, term));
												},
												onSelect: function onSelect(event, term, item) {
															return _this2.scroll(term);
												}
									});

									var destroy = function destroy() {
												ac.destroy();
												_this2.movable.unhook();
												document.body.removeChild(node);
									};

									node.querySelector('#' + this.opt.id + '_close').onclick = destroy;
									node.addEventListener('keydown', function (event) {
												if (event.key === 'Enter') _this2.scroll(input.value);
												// IE11 returns "Esc", Chrome & Firefox return "Escape"
												if (event.key.match(/^Esc/)) destroy();
									});

									this.movable = new Movable(node);
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

},{"./auto-complete.js":1,"./template":3}],3:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL29wdC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImF1dG8tY29tcGxldGUuanMiLCJpbmRleC5qcyIsInRlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBOzs7Ozs7O0FBT0EsSUFBSSxlQUFnQixZQUFVO0FBQzFCO0FBQ0EsYUFBUyxZQUFULENBQXNCLE9BQXRCLEVBQThCO0FBQzFCLFlBQUksQ0FBQyxTQUFTLGFBQWQsRUFBNkI7O0FBRTdCO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFzQixTQUF0QixFQUFnQztBQUFFLG1CQUFPLEdBQUcsU0FBSCxHQUFlLEdBQUcsU0FBSCxDQUFhLFFBQWIsQ0FBc0IsU0FBdEIsQ0FBZixHQUFrRCxJQUFJLE1BQUosQ0FBVyxRQUFPLFNBQVAsR0FBaUIsS0FBNUIsRUFBbUMsSUFBbkMsQ0FBd0MsR0FBRyxTQUEzQyxDQUF6RDtBQUFpSDs7QUFFbkosaUJBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFzQixJQUF0QixFQUE0QixPQUE1QixFQUFvQztBQUNoQyxnQkFBSSxHQUFHLFdBQVAsRUFBb0IsR0FBRyxXQUFILENBQWUsT0FBSyxJQUFwQixFQUEwQixPQUExQixFQUFwQixLQUE2RCxHQUFHLGdCQUFILENBQW9CLElBQXBCLEVBQTBCLE9BQTFCO0FBQ2hFO0FBQ0QsaUJBQVMsV0FBVCxDQUFxQixFQUFyQixFQUF5QixJQUF6QixFQUErQixPQUEvQixFQUF1QztBQUNuQztBQUNBLGdCQUFJLEdBQUcsV0FBUCxFQUFvQixHQUFHLFdBQUgsQ0FBZSxPQUFLLElBQXBCLEVBQTBCLE9BQTFCLEVBQXBCLEtBQTZELEdBQUcsbUJBQUgsQ0FBdUIsSUFBdkIsRUFBNkIsT0FBN0I7QUFDaEU7QUFDRCxpQkFBUyxJQUFULENBQWMsT0FBZCxFQUF1QixLQUF2QixFQUE4QixF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Q0EsWUFBTSxDQUFOO0FBQ0k7O0FBRUQsT0FBSSxXQUFXLFNBQVgsUUFBVyxDQUFTLElBQVQsRUFBZTtBQUNqQyxhQUFPLE9BQU8sSUFBUCxDQUFZLElBQVosRUFBa0IsSUFBbEIsQ0FBUDtBQUNJLElBRkQ7O0FBSUEsT0FBSSxXQUFXLFNBQVMsUUFBVCxJQUFxQixLQUFwQztBQUNBLFlBQVMsTUFBVCxHQUFrQixjQUFjLFFBQWQsR0FBeUIsTUFBekIsR0FBa0MsTUFBbEMsR0FBMkMsR0FBN0Q7O0FBRUEsVUFBTyxRQUFQO0FBQ0gsQ0FqREQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcbiAgICBKYXZhU2NyaXB0IGF1dG9Db21wbGV0ZSB2MS4wLjRcbiAgICBDb3B5cmlnaHQgKGMpIDIwMTQgU2ltb24gU3RlaW5iZXJnZXIgLyBQaXhhYmF5XG4gICAgR2l0SHViOiBodHRwczovL2dpdGh1Yi5jb20vUGl4YWJheS9KYXZhU2NyaXB0LWF1dG9Db21wbGV0ZVxuICAgIExpY2Vuc2U6IGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG4qL1xuXG52YXIgYXV0b0NvbXBsZXRlID0gKGZ1bmN0aW9uKCl7XG4gICAgLy8gXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gYXV0b0NvbXBsZXRlKG9wdGlvbnMpe1xuICAgICAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IpIHJldHVybjtcblxuICAgICAgICAvLyBoZWxwZXJzXG4gICAgICAgIGZ1bmN0aW9uIGhhc0NsYXNzKGVsLCBjbGFzc05hbWUpeyByZXR1cm4gZWwuY2xhc3NMaXN0ID8gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSkgOiBuZXcgUmVnRXhwKCdcXFxcYicrIGNsYXNzTmFtZSsnXFxcXGInKS50ZXN0KGVsLmNsYXNzTmFtZSk7IH1cblxuICAgICAgICBmdW5jdGlvbiBhZGRFdmVudChlbCwgdHlwZSwgaGFuZGxlcil7XG4gICAgICAgICAgICBpZiAoZWwuYXR0YWNoRXZlbnQpIGVsLmF0dGFjaEV2ZW50KCdvbicrdHlwZSwgaGFuZGxlcik7IGVsc2UgZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiByZW1vdmVFdmVudChlbCwgdHlwZSwgaGFuZGxlcil7XG4gICAgICAgICAgICAvLyBpZiAoZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcikgbm90IHdvcmtpbmcgaW4gSUUxMVxuICAgICAgICAgICAgaWYgKGVsLmRldGFjaEV2ZW50KSBlbC5kZXRhY2hFdmVudCgnb24nK3R5cGUsIGhhbmRsZXIpOyBlbHNlIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gbGl2ZShlbENsYXNzLCBldmVudCwgY2IsIGNvbnRleHQpe1xuICAgICAgICAgICAgYWRkRXZlbnQoY29udGV4dCB8fCBkb2N1bWVudCwgZXZlbnQsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBmb3VuZCwgZWwgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsICYmICEoZm91bmQgPSBoYXNDbGFzcyhlbCwgZWxDbGFzcykpKSBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSBjYi5jYWxsKGVsLCBlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG8gPSB7XG4gICAgICAgICAgICBzZWxlY3RvcjogMCxcbiAgICAgICAgICAgIHNvdXJjZTogMCxcbiAgICAgICAgICAgIG1pbkNoYXJzOiAzLFxuICAgICAgICAgICAgZGVsYXk6IDE1MCxcbiAgICAgICAgICAgIG9mZnNldExlZnQ6IDAsXG4gICAgICAgICAgICBvZmZzZXRUb3A6IDEsXG4gICAgICAgICAgICBjYWNoZTogMSxcbiAgICAgICAgICAgIG1lbnVDbGFzczogJycsXG4gICAgICAgICAgICBjb250YWluZXI6ICdib2R5JyxcbiAgICAgICAgICAgIHJlbmRlckl0ZW06IGZ1bmN0aW9uIChpdGVtLCBzZWFyY2gpe1xuICAgICAgICAgICAgICAgIC8vIGVzY2FwZSBzcGVjaWFsIGNoYXJhY3RlcnNcbiAgICAgICAgICAgICAgICBzZWFyY2ggPSBzZWFyY2gucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8XFxbXFxde31dL2csICdcXFxcJCYnKTtcbiAgICAgICAgICAgICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiKFwiICsgc2VhcmNoLnNwbGl0KCcgJykuam9pbignfCcpICsgXCIpXCIsIFwiZ2lcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwiYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb25cIiBkYXRhLXZhbD1cIicgKyBpdGVtICsgJ1wiPicgKyBpdGVtLnJlcGxhY2UocmUsIFwiPGI+JDE8L2I+XCIpICsgJzwvZGl2Pic7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25TZWxlY3Q6IGZ1bmN0aW9uKGUsIHRlcm0sIGl0ZW0pe31cbiAgICAgICAgfTtcbiAgICAgICAgZm9yICh2YXIgayBpbiBvcHRpb25zKSB7IGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGspKSBvW2tdID0gb3B0aW9uc1trXTsgfVxuXG4gICAgICAgIC8vIGluaXRcbiAgICAgICAgdmFyIGVsZW1zID0gdHlwZW9mIG8uc2VsZWN0b3IgPT0gJ29iamVjdCcgPyBbby5zZWxlY3Rvcl0gOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG8uc2VsZWN0b3IpO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8ZWxlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gZWxlbXNbaV07XG5cbiAgICAgICAgICAgIC8vIGNyZWF0ZSBzdWdnZXN0aW9ucyBjb250YWluZXIgXCJzY1wiXG4gICAgICAgICAgICB0aGF0LnNjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICB0aGF0LnNjLmNsYXNzTmFtZSA9ICdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbnMgJytvLm1lbnVDbGFzcztcblxuICAgICAgICAgICAgLy8gSWYgYWRkaW5nIGludG8gYSByZXN1bHRzIGNvbnRhaW5lciwgcmVtb3ZlIHRoZSBwb3NpdGlvbiBhYnNvbHV0ZSBjc3Mgc3R5bGVzXG4gICAgICAgICAgICBpZiAoby5jb250YWluZXIgIT09IFwiYm9keVwiKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5zYy5jbGFzc05hbWUgPSB0aGF0LnNjLmNsYXNzTmFtZSArICcgYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb25zLS1pbi1jb250YWluZXInO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LmF1dG9jb21wbGV0ZUF0dHIgPSB0aGF0LmdldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJyk7XG4gICAgICAgICAgICB0aGF0LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpO1xuICAgICAgICAgICAgdGhhdC5jYWNoZSA9IHt9O1xuICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9ICcnO1xuXG4gICAgICAgICAgICB0aGF0LnVwZGF0ZVNDID0gZnVuY3Rpb24ocmVzaXplLCBuZXh0KXtcbiAgICAgICAgICAgICAgICB2YXIgcmVjdCA9IHRoYXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgaWYgKG8uY29udGFpbmVyID09PSAnYm9keScpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGNvbnRhaW5lciBpcyBub3QgdGhlIGJvZHksIGRvIG5vdCBhYnNvbHV0ZWx5IHBvc2l0aW9uIGluIHRoZSB3aW5kb3cuXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUubGVmdCA9IE1hdGgucm91bmQocmVjdC5sZWZ0ICsgKHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCkgKyBvLm9mZnNldExlZnQpICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS50b3AgPSBNYXRoLnJvdW5kKHJlY3QuYm90dG9tICsgKHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wKSArIG8ub2Zmc2V0VG9wKSArICdweCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUud2lkdGggPSBNYXRoLnJvdW5kKHJlY3QucmlnaHQgLSByZWN0LmxlZnQpICsgJ3B4JzsgLy8gb3V0ZXJXaWR0aFxuICAgICAgICAgICAgICAgIGlmICghcmVzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5zYy5tYXhIZWlnaHQpIHsgdGhhdC5zYy5tYXhIZWlnaHQgPSBwYXJzZUludCgod2luZG93LmdldENvbXB1dGVkU3R5bGUgPyBnZXRDb21wdXRlZFN0eWxlKHRoYXQuc2MsIG51bGwpIDogdGhhdC5zYy5jdXJyZW50U3R5bGUpLm1heEhlaWdodCk7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQpIHRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJykub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXh0KSB0aGF0LnNjLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NyVG9wID0gdGhhdC5zYy5zY3JvbGxUb3AsIHNlbFRvcCA9IG5leHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gdGhhdC5zYy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbFRvcCArIHRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodCAtIHRoYXQuc2MubWF4SGVpZ2h0ID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zY3JvbGxUb3AgPSBzZWxUb3AgKyB0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQgKyBzY3JUb3AgLSB0aGF0LnNjLm1heEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzZWxUb3AgPCAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnNjcm9sbFRvcCA9IHNlbFRvcCArIHNjclRvcDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGRFdmVudCh3aW5kb3csICdyZXNpemUnLCB0aGF0LnVwZGF0ZVNDKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioby5jb250YWluZXIpLmFwcGVuZENoaWxkKHRoYXQuc2MpO1xuXG4gICAgICAgICAgICBsaXZlKCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicsICdtb3VzZWxlYXZlJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIHNlbCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbCkgc2V0VGltZW91dChmdW5jdGlvbigpeyBzZWwuY2xhc3NOYW1lID0gc2VsLmNsYXNzTmFtZS5yZXBsYWNlKCdzZWxlY3RlZCcsICcnKTsgfSwgMjApO1xuICAgICAgICAgICAgfSwgdGhhdC5zYyk7XG5cbiAgICAgICAgICAgIGxpdmUoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJywgJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBzZWwgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgIGlmIChzZWwpIHNlbC5jbGFzc05hbWUgPSBzZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NlbGVjdGVkJywgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgICAgICAgfSwgdGhhdC5zYyk7XG5cbiAgICAgICAgICAgIGxpdmUoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJywgJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIGlmIChoYXNDbGFzcyh0aGlzLCAnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nKSkgeyAvLyBlbHNlIG91dHNpZGUgY2xpY2tcbiAgICAgICAgICAgICAgICAgICAgdmFyIHYgPSB0aGlzLmdldEF0dHJpYnV0ZSgnZGF0YS12YWwnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC52YWx1ZSA9IHY7XG4gICAgICAgICAgICAgICAgICAgIG8ub25TZWxlY3QoZSwgdiwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGF0LnNjKTtcblxuICAgICAgICAgICAgdGhhdC5ibHVySGFuZGxlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgdHJ5IHsgdmFyIG92ZXJfc2IgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb25zOmhvdmVyJyk7IH0gY2F0Y2goZSl7IHZhciBvdmVyX3NiID0gMDsgfVxuICAgICAgICAgICAgICAgIGlmICghb3Zlcl9zYikge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gdGhhdC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJzsgfSwgMzUwKTsgLy8gaGlkZSBzdWdnZXN0aW9ucyBvbiBmYXN0IGlucHV0XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGF0ICE9PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50KSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHRoYXQuZm9jdXMoKTsgfSwgMjApO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGFkZEV2ZW50KHRoYXQsICdibHVyJywgdGhhdC5ibHVySGFuZGxlcik7XG5cbiAgICAgICAgICAgIHZhciBzdWdnZXN0ID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRoYXQudmFsdWU7XG4gICAgICAgICAgICAgICAgdGhhdC5jYWNoZVt2YWxdID0gZGF0YTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGggJiYgdmFsLmxlbmd0aCA+PSBvLm1pbkNoYXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDtpPGRhdGEubGVuZ3RoO2krKykgcyArPSBvLnJlbmRlckl0ZW0oZGF0YVtpXSwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5pbm5lckhUTUwgPSBzO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZVNDKDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhhdC5rZXlkb3duSGFuZGxlciA9IGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSB3aW5kb3cuZXZlbnQgPyBlLmtleUNvZGUgOiBlLndoaWNoO1xuICAgICAgICAgICAgICAgIC8vIGRvd24gKDQwKSwgdXAgKDM4KVxuICAgICAgICAgICAgICAgIGlmICgoa2V5ID09IDQwIHx8IGtleSA9PSAzOCkgJiYgdGhhdC5zYy5pbm5lckhUTUwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHQsIHNlbCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0ID0gKGtleSA9PSA0MCkgPyB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbicpIDogdGhhdC5zYy5jaGlsZE5vZGVzW3RoYXQuc2MuY2hpbGROb2Rlcy5sZW5ndGggLSAxXTsgLy8gZmlyc3QgOiBsYXN0XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0LmNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudmFsdWUgPSBuZXh0LmdldEF0dHJpYnV0ZSgnZGF0YS12YWwnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgPSAoa2V5ID09IDQwKSA/IHNlbC5uZXh0U2libGluZyA6IHNlbC5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5jbGFzc05hbWUgPSBzZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NlbGVjdGVkJywgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQuY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudmFsdWUgPSBuZXh0LmdldEF0dHJpYnV0ZSgnZGF0YS12YWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgeyBzZWwuY2xhc3NOYW1lID0gc2VsLmNsYXNzTmFtZS5yZXBsYWNlKCdzZWxlY3RlZCcsICcnKTsgdGhhdC52YWx1ZSA9IHRoYXQubGFzdF92YWw7IG5leHQgPSAwOyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVTQygwLCBuZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBlc2NcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXkgPT0gMjcpIHsgdGhhdC52YWx1ZSA9IHRoYXQubGFzdF92YWw7IHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJzsgfVxuICAgICAgICAgICAgICAgIC8vIGVudGVyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5ID09IDEzIHx8IGtleSA9PSA5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWwgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICYmIHRoYXQuc2Muc3R5bGUuZGlzcGxheSAhPSAnbm9uZScpIHsgby5vblNlbGVjdChlLCBzZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpLCBzZWwpOyBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJzsgfSwgMjApOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGFkZEV2ZW50KHRoYXQsICdrZXlkb3duJywgdGhhdC5rZXlkb3duSGFuZGxlcik7XG5cbiAgICAgICAgICAgIHRoYXQua2V5dXBIYW5kbGVyID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHdpbmRvdy5ldmVudCA/IGUua2V5Q29kZSA6IGUud2hpY2g7XG4gICAgICAgICAgICAgICAgaWYgKCFrZXkgfHwgKGtleSA8IDM1IHx8IGtleSA+IDQwKSAmJiBrZXkgIT0gMTMgJiYga2V5ICE9IDI3KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0aGF0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA+PSBvLm1pbkNoYXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsICE9IHRoYXQubGFzdF92YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGF0LnRpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5jYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsIGluIHRoYXQuY2FjaGUpIHsgc3VnZ2VzdCh0aGF0LmNhY2hlW3ZhbF0pOyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gcmVxdWVzdHMgaWYgcHJldmlvdXMgc3VnZ2VzdGlvbnMgd2VyZSBlbXB0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTE7IGk8dmFsLmxlbmd0aC1vLm1pbkNoYXJzOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXJ0ID0gdmFsLnNsaWNlKDAsIHZhbC5sZW5ndGgtaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFydCBpbiB0aGF0LmNhY2hlICYmICF0aGF0LmNhY2hlW3BhcnRdLmxlbmd0aCkgeyBzdWdnZXN0KFtdKTsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgby5zb3VyY2UodmFsLCBzdWdnZXN0KSB9LCBvLmRlbGF5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYWRkRXZlbnQodGhhdCwgJ2tleXVwJywgdGhhdC5rZXl1cEhhbmRsZXIpO1xuXG4gICAgICAgICAgICB0aGF0LmZvY3VzSGFuZGxlciA9IGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSAnXFxuJztcbiAgICAgICAgICAgICAgICB0aGF0LmtleXVwSGFuZGxlcihlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICghby5taW5DaGFycykgYWRkRXZlbnQodGhhdCwgJ2ZvY3VzJywgdGhhdC5mb2N1c0hhbmRsZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcHVibGljIGRlc3Ryb3kgbWV0aG9kXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8ZWxlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IGVsZW1zW2ldO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHRoYXQudXBkYXRlU0MpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHRoYXQsICdibHVyJywgdGhhdC5ibHVySGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQodGhhdCwgJ2ZvY3VzJywgdGhhdC5mb2N1c0hhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHRoYXQsICdrZXlkb3duJywgdGhhdC5rZXlkb3duSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQodGhhdCwgJ2tleXVwJywgdGhhdC5rZXl1cEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIGlmICh0aGF0LmF1dG9jb21wbGV0ZUF0dHIpXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCB0aGF0LmF1dG9jb21wbGV0ZUF0dHIpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioby5jb250YWluZXIpLnJlbW92ZUNoaWxkKHRoYXQuc2MpO1xuICAgICAgICAgICAgICAgIHRoYXQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gYXV0b0NvbXBsZXRlO1xufSkoKTtcblxuKGZ1bmN0aW9uKCl7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcbiAgICAgICAgZGVmaW5lKCdhdXRvQ29tcGxldGUnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBhdXRvQ29tcGxldGU7IH0pO1xuICAgIGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Db21wbGV0ZTtcbiAgICBlbHNlXG4gICAgICAgIHdpbmRvdy5hdXRvQ29tcGxldGUgPSBhdXRvQ29tcGxldGU7XG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cdFx0Ly8gYnJvd3NlcmlmeSAmIGJyZnNcbmxldCB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdGVtcGxhdGUnKVxubGV0IEF1dG9Db21wbGV0ZSA9IHJlcXVpcmUoJy4vYXV0by1jb21wbGV0ZS5qcycpXG5cbmxldCBNb3ZhYmxlID0gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKG5vZGUpIHtcblx0dGhpcy5ub2RlID0gbm9kZVxuXHR0aGlzLm9mZnNldF94ID0gbnVsbFxuXHR0aGlzLm9mZnNldF95ID0gbnVsbFxuXG5cdC8vIHdlIG91Z2h0IHRvIHNwZWNpZmljYWx5IGJpbmQgbW91c2UqIGNhbGxiYWNrcyB0byB0aGlzIGNsYXNzXG5cdC8vIGZvciBhZGRFdmVudExpc3RlbmVyL3JlbW92ZUV2ZW50TGlzdGVuZXJcblx0dGhpcy5tb3VzZWRvd24gPSB0aGlzLl9tb3VzZWRvd24uYmluZCh0aGlzKVxuXHR0aGlzLm1vdXNlbW92ZSA9IHRoaXMuX21vdXNlbW92ZS5iaW5kKHRoaXMpXG5cdHRoaXMubW91c2V1cCA9IHRoaXMuX21vdXNldXAuYmluZCh0aGlzKVxuXG5cdHRoaXMubG9nID0gY29uc29sZS5sb2cuYmluZChjb25zb2xlLCAnTW92YWJsZTonKVxuICAgIH1cblxuICAgIHBvc2l0aW9uKGV2ZW50KSB7XG5cdGxldCB4ID0gZXZlbnQuY2xpZW50WCAtIHRoaXMub2Zmc2V0X3hcblx0bGV0IHkgPSBldmVudC5jbGllbnRZIC0gdGhpcy5vZmZzZXRfeVxuXG5cdC8vIFRPRE86IHJpZ2h0LCBib3R0b21cblx0aWYgKHggPCAwKSB4ID0gMFxuXHRpZiAoeSA8IDApIHkgPSAwXG5cdHJldHVybiB7eCwgeX1cbiAgICB9XG5cbiAgICBtb3ZlKHgsIHkpIHtcblx0dGhpcy5ub2RlLnN0eWxlLmxlZnQgPSB4ICsgJ3B4J1xuXHR0aGlzLm5vZGUuc3R5bGUudG9wID0geSArICdweCdcblx0dGhpcy5ub2RlLnN0eWxlLnJpZ2h0ID0gJ2F1dG8nXG5cdHRoaXMubm9kZS5zdHlsZS5ib3R0b20gPSAnYXV0bydcbiAgICB9XG5cbiAgICBfbW91c2Vkb3duKGV2ZW50KSB7XG5cdGlmICh0aGlzLm5vZGUgIT09IGV2ZW50LnRhcmdldCkgcmV0dXJuXG5cdHRoaXMub2Zmc2V0X3ggPSBldmVudC5jbGllbnRYIC0gdGhpcy5ub2RlLm9mZnNldExlZnRcblx0dGhpcy5vZmZzZXRfeSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLm5vZGUub2Zmc2V0VG9wXG5cdHRoaXMubG9nKGBtb3VzZWRvd24sIG9mZnNldF94PSR7dGhpcy5vZmZzZXRfeH0sIG9mZnNldF95PSR7dGhpcy5vZmZzZXRfeX1gKVxuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlbW92ZSlcblx0dGhpcy5fbW91c2Vtb3ZlKGV2ZW50KVxuICAgIH1cblxuICAgIF9tb3VzZW1vdmUoZXZlbnQpIHtcblx0dGhpcy5ub2RlLnN0eWxlLmN1cnNvciA9ICdtb3ZlJ1xuXHRsZXQgcCA9IHRoaXMucG9zaXRpb24oZXZlbnQpXG5cdHRoaXMubW92ZShwLngsIHAueSlcbiAgICB9XG5cbiAgICBfbW91c2V1cChldmVudCwgZm9yY2UpIHtcblx0aWYgKCFmb3JjZSAmJiAodGhpcy5ub2RlICE9PSBldmVudC50YXJnZXQpKSByZXR1cm5cblx0dGhpcy5sb2coJ21vdXNldXAnKVxuXHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlbW92ZSlcblx0dGhpcy5ub2RlLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0J1xuICAgIH1cblxuICAgIGhvb2soKSB7XG5cdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm1vdXNlZG93bilcblx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm1vdXNldXApXG4gICAgfVxuXG4gICAgdW5ob29rKCkge1xuXHR0aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5tb3VzZWRvd24pXG5cdHRoaXMubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5tb3VzZXVwKVxuXHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm1vdXNlbW92ZSlcbiAgICB9XG59XG5cbmxldCBUb2NKdW1wZXIgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3Iob3B0KSB7XG5cdHRoaXMuZGF0YSA9IG51bGxcblxuXHR0aGlzLm9wdCA9IHtcblx0ICAgIGlkOiAndG9jX2p1bXBlcicsXG5cdCAgICBzZWxlY3RvcjogJycsXG5cdCAgICB0cmFuc2Zvcm06IG51bGwsXG5cdCAgICBrZXk6ICdpJyxcblxuXHQgICAgdG9wOiAnNGVtJyxcblx0ICAgIHJpZ2h0OiAnLjVlbScsXG5cdCAgICBib3R0b206ICdhdXRvJyxcblx0ICAgIGxlZnQ6ICdhdXRvJyxcblx0fVxuXG5cdGZvciAobGV0IGlkeCBpbiBvcHQpIHtcdC8vIG1lcmdlXG5cdCAgICBpZiAob3B0Lmhhc093blByb3BlcnR5KGlkeCkpIHRoaXMub3B0W2lkeF0gPSBvcHRbaWR4XVxuXHR9XG5cdHRoaXMubG9nID0gY29uc29sZS5sb2cuYmluZChjb25zb2xlLCAnVG9jSnVtcGVyOicpXG5cdHRoaXMubG9nKCdpbml0JylcbiAgICB9XG5cbiAgICBzY3JvbGwodGVybSkge1xuXHRpZiAodGVybSBpbiB0aGlzLmRhdGEpIHtcblx0ICAgIHRoaXMubG9nKHRlcm0pXG5cdCAgICB0aGlzLmRhdGFbdGVybV0uc2Nyb2xsSW50b1ZpZXcodHJ1ZSlcblx0fVxuICAgIH1cblxuICAgIGhvb2soKSB7XG5cdHRoaXMuZGF0YSA9IG1ha2VfaW5kZXgodGhpcy5vcHQuc2VsZWN0b3IsIHRoaXMub3B0LnRyYW5zZm9ybSlcblx0Y3NzX2luamVjdCh7IGlkOiB0aGlzLm9wdC5pZCB9KVxuXHRkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcblx0ICAgIGlmIChldmVudC50YXJnZXQubm9kZU5hbWUgPT09ICdJTlBVVCcpIHJldHVyblxuXHQgICAgaWYgKGV2ZW50LmtleSA9PT0gdGhpcy5vcHQua2V5ICYmICFldmVudC5jdHJsS2V5KSB0aGlzLmRsZygpXG5cdCAgICAvLyBJRTExIHJldHVybnMgXCJFc2NcIiwgQ2hyb21lICYgRmlyZWZveCByZXR1cm4gXCJFc2NhcGVcIlxuXHQgICAgaWYgKGV2ZW50LmtleS5tYXRjaCgvXkVzYy8pKSB0aGlzLm1vdmFibGUuX21vdXNldXAobnVsbCwgdHJ1ZSlcblx0fSlcbiAgICB9XG5cbiAgICBkbGcoKSB7XG5cdGxldCBub2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5vcHQuaWQpXG5cdGlmIChub2RlKSByZXR1cm4gZm9jdXMobm9kZSlcblxuXHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jylcblx0bm9kZS5pZCA9IHRoaXMub3B0LmlkO1xuXHRbJ3RvcCcsICdyaWdodCcsICdib3R0b20nLCAnbGVmdCddXG5cdCAgICAuZm9yRWFjaCggKGlkeCkgPT4gbm9kZS5zdHlsZVtpZHhdID0gdGhpcy5vcHRbaWR4XSApXG5cblx0bGV0IGFjX2NvbnRhaW5lciA9IGAke3RoaXMub3B0LmlkfV9jb250YWluZXJgXG5cdG5vZGUuaW5uZXJIVE1MID0gYDxzcGFuIGlkPVwiJHthY19jb250YWluZXJ9XCI+PGlucHV0IHNpemU9XCI0MFwiIHNwZWxsY2hlY2s9XCJmYWxzZVwiIC8+PC9zcGFuPlxuPHNwYW4gaWQ9XCIke3RoaXMub3B0LmlkfV9jbG9zZVwiIHRpdGxlPVwiQ2xvc2VcIj48c3Bhbj4mdGltZXM7PC9zcGFuPjwvc3Bhbj5gXG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZSlcblx0bGV0IGlucHV0ID0gbm9kZS5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpXG5cblx0bGV0IGFjID0gbmV3IEF1dG9Db21wbGV0ZSh7XG5cdCAgICBzZWxlY3RvcjogaW5wdXQsXG5cdCAgICBtaW5DaGFyczogMSxcblx0ICAgIGRlbGF5OiA1MCxcblx0ICAgIGNvbnRhaW5lcjogJyMnICsgYWNfY29udGFpbmVyLFxuXHQgICAgc291cmNlOiAodGVybSwgc3VnZ2VzdCkgPT4ge1xuXHRcdGxldCBsaXN0ID0gW11cblx0XHRmb3IgKGxldCBrZXkgaW4gdGhpcy5kYXRhKSB7XG5cdFx0ICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKS5pbmRleE9mKHRlcm0udG9Mb3dlckNhc2UoKSkgIT09IC0xKVxuXHRcdFx0bGlzdC5wdXNoKGtleSlcblx0XHR9XG5cdFx0c3VnZ2VzdChUb2NKdW1wZXIuc29ydChsaXN0LCB0ZXJtKSlcblx0ICAgIH0sXG5cdCAgICBvblNlbGVjdDogKGV2ZW50LCB0ZXJtLCBpdGVtKSA9PiB0aGlzLnNjcm9sbCh0ZXJtKVxuXHR9KVxuXG5cdGxldCBkZXN0cm95ID0gKCkgPT4ge1xuXHQgICAgYWMuZGVzdHJveSgpXG5cdCAgICB0aGlzLm1vdmFibGUudW5ob29rKClcblx0ICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobm9kZSlcblx0fVxuXG5cdG5vZGUucXVlcnlTZWxlY3RvcihgIyR7dGhpcy5vcHQuaWR9X2Nsb3NlYCkub25jbGljayA9IGRlc3Ryb3lcblx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG5cdCAgICBpZiAoZXZlbnQua2V5ID09PSAnRW50ZXInKSB0aGlzLnNjcm9sbChpbnB1dC52YWx1ZSlcblx0ICAgIC8vIElFMTEgcmV0dXJucyBcIkVzY1wiLCBDaHJvbWUgJiBGaXJlZm94IHJldHVybiBcIkVzY2FwZVwiXG5cdCAgICBpZiAoZXZlbnQua2V5Lm1hdGNoKC9eRXNjLykpIGRlc3Ryb3koKVxuXHR9KVxuXG5cdHRoaXMubW92YWJsZSA9IG5ldyBNb3ZhYmxlKG5vZGUpXG5cdHRoaXMubW92YWJsZS5ob29rKClcblxuXHRmb2N1cyhub2RlKVxuICAgIH1cblxuICAgIHN0YXRpYyBzb3J0KGFyciwgdGVybSkge1xuXHRyZXR1cm4gYXJyLnNvcnQoIChhLCBiKSA9PiB7XG5cdCAgICBpZiAoYS5zbGljZSgwLCB0ZXJtLmxlbmd0aCkgPT09IHRlcm0pIHJldHVybiAtMVxuXHQgICAgaWYgKGIuc2xpY2UoMCwgdGVybS5sZW5ndGgpID09PSB0ZXJtKSByZXR1cm4gMVxuXHQgICAgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiKVxuXHR9KVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUb2NKdW1wZXJcblxubGV0IG1ha2VfaW5kZXggPSBmdW5jdGlvbihzZWxlY3RvciwgdHJhbnNmb3JtKSB7XG4gICAgbGV0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcblxuICAgIGxldCByID0ge31cbiAgICBsZXQgY2FjaGUgPSB7fVxuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IG5vZGVzLmxlbmd0aDsgKytpZHgpIHtcblx0bGV0IG5vZGUgPSBub2Rlc1tpZHhdXG5cdGxldCBrZXkgPSB0cmFuc2Zvcm0gPyB0cmFuc2Zvcm0obm9kZS5pbm5lclRleHQpIDogbm9kZS5pbm5lclRleHRcblx0Y2FjaGVba2V5XSA9IChjYWNoZVtrZXldIHx8IDApICsgMVxuXHRpZiAoa2V5IGluIHIpIGtleSA9IGAke2tleX0gPCR7Y2FjaGVba2V5XX0+YFxuXG5cdHJba2V5XSA9IG5vZGVcbiAgICB9XG5cbiAgICByZXR1cm4gclxufVxuXG5sZXQgY3NzX2luamVjdCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBsZXQgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICBsZXQgdG1wbCA9IHRlbXBsYXRlKFwiLyogYXV0by1jb21wbGV0ZS5qcyAqL1xcbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbnMge1xcbiAgdGV4dC1hbGlnbjogbGVmdDtcXG4gIGN1cnNvcjogZGVmYXVsdDtcXG4gIGJvcmRlcjogMXB4IHNvbGlkICNjY2M7XFxuICBib3JkZXItdG9wOiAwO1xcbiAgYmFja2dyb3VuZDogd2hpdGU7XFxuICBib3gtc2hhZG93OiAtMXB4IDFweCAzcHggcmdiYSgwLCAwLCAwLCAuMSk7XFxuXFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBkaXNwbGF5OiBub25lO1xcbiAgei1pbmRleDogOTk5OTtcXG4gIG1heC1oZWlnaHQ6IDE1ZW07XFxuICBvdmVyZmxvdzogaGlkZGVuO1xcbiAgb3ZlcmZsb3cteTogYXV0bztcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxufVxcbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbiB7XFxuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xcbn1cXG4uYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQge1xcbiAgYmFja2dyb3VuZDogI2VlZTtcXG59XFxuXFxuLyogdG9jLWp1bXBlciAqL1xcbiM8JT0gaWQgJT4ge1xcbiAgYm9yZGVyOiAxcHggc29saWQgI2E5YTlhOTtcXG4gIHBhZGRpbmc6IDAuOGVtO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XFxuICBjb2xvcjogYmxhY2s7XFxuICBib3gtc2hhZG93OiAxcHggMXB4IDNweCByZ2JhKDAsIDAsIDAsIC40KTtcXG5cXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG59XFxuXFxuIzwlPSBpZCAlPl9jbG9zZSB7XFxuICBtYXJnaW4tbGVmdDogMWVtO1xcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxuICBjdXJzb3I6IHBvaW50ZXI7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxuICBsaW5lLWhlaWdodDogMmVtO1xcbiAgd2lkdGg6IDJlbTtcXG4gIGhlaWdodDogMmVtO1xcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbn1cXG5cXG4jPCU9IGlkICU+X2Nsb3NlOmhvdmVyIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICNlODExMjM7XFxuICBjb2xvcjogd2hpdGU7XFxufVxcblwiKVxuICAgIG5vZGUuaW5uZXJIVE1MID0gdG1wbChkYXRhKVxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobm9kZSlcbn1cblxubGV0IGZvY3VzID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHNldFRpbWVvdXQoICgpID0+IG5vZGUucXVlcnlTZWxlY3RvcignaW5wdXQnKS5mb2N1cygpLCAxKVxufVxuIiwiLypcbiAgQSBtb2RpZmllZCBfLnRlbXBsYXRlKCkgZnJvbSB1bmRlcnNjb3JlLmpzLlxuXG4gIFdoeSBub3QgdXNlIGxvZGFzaC90ZW1wbGF0ZT8gVGhpcyB2ZXJzaW9uIGlzIH41IHRpbWVzIHNtYWxsZXIuXG4qL1xuXG52YXIgbm9NYXRjaCA9IC8oLileLztcbnZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG59O1xuXG52YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHUyMDI4fFxcdTIwMjkvZztcblxudmFyIGVzY2FwZUNoYXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTtcbn07XG5cbnZhciB0ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGV4dCkge1xuICAgIHZhciBzZXR0aW5ncyA9IHRlbXBsYXRlU2V0dGluZ3M7XG5cbiAgICB2YXIgbWF0Y2hlciA9IFJlZ0V4cChbXG5cdChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuXHQoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuXHQoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcblx0c291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldCkucmVwbGFjZShlc2NhcGVyLCBlc2NhcGVDaGFyKTtcblx0aW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cblx0aWYgKGVzY2FwZSkge1xuXHQgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcblx0fSBlbHNlIGlmIChpbnRlcnBvbGF0ZSkge1xuXHQgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG5cdH0gZWxzZSBpZiAoZXZhbHVhdGUpIHtcblx0ICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG5cdH1cblxuXHRyZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG5cdFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG5cdHNvdXJjZSArICdyZXR1cm4gX19wO1xcbic7XG5cbiAgICB2YXIgcmVuZGVyXG4gICAgdHJ5IHtcblx0cmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcblx0ZS5zb3VyY2UgPSBzb3VyY2U7XG5cdHRocm93IGU7XG4gICAgfVxuXG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuXHRyZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSk7XG4gICAgfTtcblxuICAgIHZhciBhcmd1bWVudCA9IHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonO1xuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgYXJndW1lbnQgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xufTtcbiJdfQ==
// ]]>
