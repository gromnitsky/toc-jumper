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
												document.body.removeChild(node);
									};

									node.querySelector('#' + this.opt.id + '_close').onclick = destroy;
									node.addEventListener('keydown', function (event) {
												if (event.key === 'Enter') _this2.scroll(input.value);
												// IE11 returns "Esc", Chrome & Firefox return "Escape"
												if (event.key.match(/^Esc/)) destroy();
									});

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
			var tmpl = template("/* auto-complete.js */\n.autocomplete-suggestions {\n  text-align: left;\n  cursor: default;\n  border: 1px solid #ccc;\n  border-top: 0;\n  background: white;\n  box-shadow: -1px 1px 3px rgba(0, 0, 0, .1);\n\n  position: absolute;\n  display: none;\n  z-index: 9999;\n  max-height: 15em;\n  overflow: hidden;\n  overflow-y: auto;\n  box-sizing: border-box;\n}\n.autocomplete-suggestion {\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.autocomplete-suggestion.selected {\n  background: #eee;\n}\n\n/* toc-jumper */\n#<%= id %> {\n  border: 1px solid #a9a9a9;\n  padding: 0.8em;\n  background-color: white;\n  color: black;\n  box-shadow: 1px 1px 3px rgba(0, 0, 0, .4);\n  position: fixed;\n  top: 4em;\n  right: .5em;\n}\n\n#<%= id %>_close {\n  margin-left: 1em;\n  font-weight: bold;\n  cursor: pointer;\n  text-align: center;\n  line-height: 2em;\n  width: 2em;\n  height: 2em;\n  display: inline-block;\n}\n\n#<%= id %>_close > span {\n  display: inline-block;\n}\n\n#<%= id %>_close:hover {\n  background-color: #e81123;\n  color: white;\n}\n");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL29wdC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImF1dG8tY29tcGxldGUuanMiLCJpbmRleC5qcyIsInRlbXBsYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBOzs7Ozs7O0FBT0EsSUFBSSxlQUFnQixZQUFVO0FBQzFCO0FBQ0EsYUFBUyxZQUFULENBQXNCLE9BQXRCLEVBQThCO0FBQzFCLFlBQUksQ0FBQyxTQUFTLGFBQWQsRUFBNkI7O0FBRTdCO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFzQixTQUF0QixFQUFnQztBQUFFLG1CQUFPLEdBQUcsU0FBSCxHQUFlLEdBQUcsU0FBSCxDQUFhLFFBQWIsQ0FBc0IsU0FBdEIsQ0FBZixHQUFrRCxJQUFJLE1BQUosQ0FBVyxRQUFPLFNBQVAsR0FBaUIsS0FBNUIsRUFBbUMsSUFBbkMsQ0FBd0MsR0FBRyxTQUEzQyxDQUF6RDtBQUFpSDs7QUFFbkosaUJBQVMsUUFBVCxDQUFrQixFQUFsQixFQUFzQixJQUF0QixFQUE0QixPQUE1QixFQUFvQztBQUNoQyxnQkFBSSxHQUFHLFdBQVAsRUFBb0IsR0FBRyxXQUFILENBQWUsT0FBSyxJQUFwQixFQUEwQixPQUExQixFQUFwQixLQUE2RCxHQUFHLGdCQUFILENBQW9CLElBQXBCLEVBQTBCLE9BQTFCO0FBQ2hFO0FBQ0QsaUJBQVMsV0FBVCxDQUFxQixFQUFyQixFQUF5QixJQUF6QixFQUErQixPQUEvQixFQUF1QztBQUNuQztBQUNBLGdCQUFJLEdBQUcsV0FBUCxFQUFvQixHQUFHLFdBQUgsQ0FBZSxPQUFLLElBQXBCLEVBQTBCLE9BQTFCLEVBQXBCLEtBQTZELEdBQUcsbUJBQUgsQ0FBdUIsSUFBdkIsRUFBNkIsT0FBN0I7QUFDaEU7QUFDRCxpQkFBUyxJQUFULENBQWMsT0FBZCxFQUF1QixLQUF2QixFQUE4QixF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QyxPQUFsQyxFQUEyQyxVQUEzQyxDQUFWO0FBQ0EsY0FBUSxTQUFTLE1BQU0sTUFBdkI7O0FBRUEsVUFBSSxNQUFKLEVBQVk7QUFDUixtQkFBVSxnQkFBZ0IsTUFBaEIsR0FBeUIsZ0NBQW5DO0FBQ0gsT0FGRCxNQUVPLElBQUksV0FBSixFQUFpQjtBQUNwQixtQkFBVSxnQkFBZ0IsV0FBaEIsR0FBOEIsc0JBQXhDO0FBQ0gsT0FGTSxNQUVBLElBQUksUUFBSixFQUFjO0FBQ2pCLG1CQUFVLFNBQVMsUUFBVCxHQUFvQixVQUE5QjtBQUNIOztBQUVELGFBQU8sS0FBUDtBQUNJLElBYkQ7QUFjQSxhQUFVLE1BQVY7O0FBRUEsT0FBSSxDQUFDLFNBQVMsUUFBZCxFQUF3QixTQUFTLHFCQUFxQixNQUFyQixHQUE4QixLQUF2Qzs7QUFFeEIsWUFBUyw2Q0FDWixtREFEWSxHQUVaLE1BRlksR0FFSCxlQUZOOztBQUlBLE9BQUksTUFBSjtBQUNBLE9BQUk7QUFDUCxlQUFTLElBQUksUUFBSixDQUFhLFNBQVMsUUFBVCxJQUFxQixLQUFsQyxFQUF5QyxNQUF6QyxDQUFUO0FBQ0ksSUFGRCxDQUVFLE9BQU8sQ0FBUCxFQUFVO0FBQ2YsUUFBRSxNQUFGLEdBQVcsTUFBWDtBQUNBLFlBQU0sQ0FBTjtBQUNJOztBQUVELE9BQUksV0FBVyxTQUFYLFFBQVcsQ0FBUyxJQUFULEVBQWU7QUFDakMsYUFBTyxPQUFPLElBQVAsQ0FBWSxJQUFaLEVBQWtCLElBQWxCLENBQVA7QUFDSSxJQUZEOztBQUlBLE9BQUksV0FBVyxTQUFTLFFBQVQsSUFBcUIsS0FBcEM7QUFDQSxZQUFTLE1BQVQsR0FBa0IsY0FBYyxRQUFkLEdBQXlCLE1BQXpCLEdBQWtDLE1BQWxDLEdBQTJDLEdBQTdEOztBQUVBLFVBQU8sUUFBUDtBQUNILENBakREIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG4gICAgSmF2YVNjcmlwdCBhdXRvQ29tcGxldGUgdjEuMC40XG4gICAgQ29weXJpZ2h0IChjKSAyMDE0IFNpbW9uIFN0ZWluYmVyZ2VyIC8gUGl4YWJheVxuICAgIEdpdEh1YjogaHR0cHM6Ly9naXRodWIuY29tL1BpeGFiYXkvSmF2YVNjcmlwdC1hdXRvQ29tcGxldGVcbiAgICBMaWNlbnNlOiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuKi9cblxudmFyIGF1dG9Db21wbGV0ZSA9IChmdW5jdGlvbigpe1xuICAgIC8vIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIGF1dG9Db21wbGV0ZShvcHRpb25zKXtcbiAgICAgICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKSByZXR1cm47XG5cbiAgICAgICAgLy8gaGVscGVyc1xuICAgICAgICBmdW5jdGlvbiBoYXNDbGFzcyhlbCwgY2xhc3NOYW1lKXsgcmV0dXJuIGVsLmNsYXNzTGlzdCA/IGVsLmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpIDogbmV3IFJlZ0V4cCgnXFxcXGInKyBjbGFzc05hbWUrJ1xcXFxiJykudGVzdChlbC5jbGFzc05hbWUpOyB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkRXZlbnQoZWwsIHR5cGUsIGhhbmRsZXIpe1xuICAgICAgICAgICAgaWYgKGVsLmF0dGFjaEV2ZW50KSBlbC5hdHRhY2hFdmVudCgnb24nK3R5cGUsIGhhbmRsZXIpOyBlbHNlIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZWwsIHR5cGUsIGhhbmRsZXIpe1xuICAgICAgICAgICAgLy8gaWYgKGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpIG5vdCB3b3JraW5nIGluIElFMTFcbiAgICAgICAgICAgIGlmIChlbC5kZXRhY2hFdmVudCkgZWwuZGV0YWNoRXZlbnQoJ29uJyt0eXBlLCBoYW5kbGVyKTsgZWxzZSBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGxpdmUoZWxDbGFzcywgZXZlbnQsIGNiLCBjb250ZXh0KXtcbiAgICAgICAgICAgIGFkZEV2ZW50KGNvbnRleHQgfHwgZG9jdW1lbnQsIGV2ZW50LCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgZm91bmQsIGVsID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbCAmJiAhKGZvdW5kID0gaGFzQ2xhc3MoZWwsIGVsQ2xhc3MpKSkgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkgY2IuY2FsbChlbCwgZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvID0ge1xuICAgICAgICAgICAgc2VsZWN0b3I6IDAsXG4gICAgICAgICAgICBzb3VyY2U6IDAsXG4gICAgICAgICAgICBtaW5DaGFyczogMyxcbiAgICAgICAgICAgIGRlbGF5OiAxNTAsXG4gICAgICAgICAgICBvZmZzZXRMZWZ0OiAwLFxuICAgICAgICAgICAgb2Zmc2V0VG9wOiAxLFxuICAgICAgICAgICAgY2FjaGU6IDEsXG4gICAgICAgICAgICBtZW51Q2xhc3M6ICcnLFxuICAgICAgICAgICAgY29udGFpbmVyOiAnYm9keScsXG4gICAgICAgICAgICByZW5kZXJJdGVtOiBmdW5jdGlvbiAoaXRlbSwgc2VhcmNoKXtcbiAgICAgICAgICAgICAgICAvLyBlc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gICAgICAgICAgICAgICAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFxcW1xcXXt9XS9nLCAnXFxcXCQmJyk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIihcIiArIHNlYXJjaC5zcGxpdCgnICcpLmpvaW4oJ3wnKSArIFwiKVwiLCBcImdpXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cImF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uXCIgZGF0YS12YWw9XCInICsgaXRlbSArICdcIj4nICsgaXRlbS5yZXBsYWNlKHJlLCBcIjxiPiQxPC9iPlwiKSArICc8L2Rpdj4nO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uU2VsZWN0OiBmdW5jdGlvbihlLCB0ZXJtLCBpdGVtKXt9XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIGsgaW4gb3B0aW9ucykgeyBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrKSkgb1trXSA9IG9wdGlvbnNba107IH1cblxuICAgICAgICAvLyBpbml0XG4gICAgICAgIHZhciBlbGVtcyA9IHR5cGVvZiBvLnNlbGVjdG9yID09ICdvYmplY3QnID8gW28uc2VsZWN0b3JdIDogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChvLnNlbGVjdG9yKTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPGVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IGVsZW1zW2ldO1xuXG4gICAgICAgICAgICAvLyBjcmVhdGUgc3VnZ2VzdGlvbnMgY29udGFpbmVyIFwic2NcIlxuICAgICAgICAgICAgdGhhdC5zYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgdGhhdC5zYy5jbGFzc05hbWUgPSAnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb25zICcrby5tZW51Q2xhc3M7XG5cbiAgICAgICAgICAgIC8vIElmIGFkZGluZyBpbnRvIGEgcmVzdWx0cyBjb250YWluZXIsIHJlbW92ZSB0aGUgcG9zaXRpb24gYWJzb2x1dGUgY3NzIHN0eWxlc1xuICAgICAgICAgICAgaWYgKG8uY29udGFpbmVyICE9PSBcImJvZHlcIikge1xuICAgICAgICAgICAgICAgIHRoYXQuc2MuY2xhc3NOYW1lID0gdGhhdC5zYy5jbGFzc05hbWUgKyAnIGF1dG9jb21wbGV0ZS1zdWdnZXN0aW9ucy0taW4tY29udGFpbmVyJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhhdC5hdXRvY29tcGxldGVBdHRyID0gdGhhdC5nZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScpO1xuICAgICAgICAgICAgdGhhdC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcbiAgICAgICAgICAgIHRoYXQuY2FjaGUgPSB7fTtcbiAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSAnJztcblxuICAgICAgICAgICAgdGhhdC51cGRhdGVTQyA9IGZ1bmN0aW9uKHJlc2l6ZSwgbmV4dCl7XG4gICAgICAgICAgICAgICAgdmFyIHJlY3QgPSB0aGF0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgIGlmIChvLmNvbnRhaW5lciA9PT0gJ2JvZHknKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjb250YWluZXIgaXMgbm90IHRoZSBib2R5LCBkbyBub3QgYWJzb2x1dGVseSBwb3NpdGlvbiBpbiB0aGUgd2luZG93LlxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmxlZnQgPSBNYXRoLnJvdW5kKHJlY3QubGVmdCArICh3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQpICsgby5vZmZzZXRMZWZ0KSArICdweCc7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUudG9wID0gTWF0aC5yb3VuZChyZWN0LmJvdHRvbSArICh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCkgKyBvLm9mZnNldFRvcCkgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLndpZHRoID0gTWF0aC5yb3VuZChyZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0KSArICdweCc7IC8vIG91dGVyV2lkdGhcbiAgICAgICAgICAgICAgICBpZiAoIXJlc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuc2MubWF4SGVpZ2h0KSB7IHRoYXQuc2MubWF4SGVpZ2h0ID0gcGFyc2VJbnQoKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gZ2V0Q29tcHV0ZWRTdHlsZSh0aGF0LnNjLCBudWxsKSA6IHRoYXQuc2MuY3VycmVudFN0eWxlKS5tYXhIZWlnaHQpOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0KSB0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbicpLm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmV4dCkgdGhhdC5zYy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjclRvcCA9IHRoYXQuc2Muc2Nyb2xsVG9wLCBzZWxUb3AgPSBuZXh0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIHRoYXQuc2MuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxUb3AgKyB0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQgLSB0aGF0LnNjLm1heEhlaWdodCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc2Nyb2xsVG9wID0gc2VsVG9wICsgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0ICsgc2NyVG9wIC0gdGhhdC5zYy5tYXhIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2VsVG9wIDwgMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zY3JvbGxUb3AgPSBzZWxUb3AgKyBzY3JUb3A7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkRXZlbnQod2luZG93LCAncmVzaXplJywgdGhhdC51cGRhdGVTQyk7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG8uY29udGFpbmVyKS5hcHBlbmRDaGlsZCh0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBzZWwgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgIGlmIChzZWwpIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7IH0sIDIwKTtcbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICBsaXZlKCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicsICdtb3VzZW92ZXInLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsKSBzZWwuY2xhc3NOYW1lID0gc2VsLmNsYXNzTmFtZS5yZXBsYWNlKCdzZWxlY3RlZCcsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICBsaXZlKCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicsICdtb3VzZWRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICBpZiAoaGFzQ2xhc3ModGhpcywgJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJykpIHsgLy8gZWxzZSBvdXRzaWRlIGNsaWNrXG4gICAgICAgICAgICAgICAgICAgIHZhciB2ID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudmFsdWUgPSB2O1xuICAgICAgICAgICAgICAgICAgICBvLm9uU2VsZWN0KGUsIHYsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhhdC5zYyk7XG5cbiAgICAgICAgICAgIHRoYXQuYmx1ckhhbmRsZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHRyeSB7IHZhciBvdmVyX3NiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uczpob3ZlcicpOyB9IGNhdGNoKGUpeyB2YXIgb3Zlcl9zYiA9IDA7IH1cbiAgICAgICAgICAgICAgICBpZiAoIW92ZXJfc2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHRoYXQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDM1MCk7IC8vIGhpZGUgc3VnZ2VzdGlvbnMgb24gZmFzdCBpbnB1dFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhhdCAhPT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LmZvY3VzKCk7IH0sIDIwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAnYmx1cicsIHRoYXQuYmx1ckhhbmRsZXIpO1xuXG4gICAgICAgICAgICB2YXIgc3VnZ2VzdCA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0aGF0LnZhbHVlO1xuICAgICAgICAgICAgICAgIHRoYXQuY2FjaGVbdmFsXSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoICYmIHZhbC5sZW5ndGggPj0gby5taW5DaGFycykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7aTxkYXRhLmxlbmd0aDtpKyspIHMgKz0gby5yZW5kZXJJdGVtKGRhdGFbaV0sIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2MuaW5uZXJIVE1MID0gcztcbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVTQygwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoYXQua2V5ZG93bkhhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gd2luZG93LmV2ZW50ID8gZS5rZXlDb2RlIDogZS53aGljaDtcbiAgICAgICAgICAgICAgICAvLyBkb3duICg0MCksIHVwICgzOClcbiAgICAgICAgICAgICAgICBpZiAoKGtleSA9PSA0MCB8fCBrZXkgPT0gMzgpICYmIHRoYXQuc2MuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0LCBzZWwgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IChrZXkgPT0gNDApID8gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nKSA6IHRoYXQuc2MuY2hpbGROb2Rlc1t0aGF0LnNjLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV07IC8vIGZpcnN0IDogbGFzdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gbmV4dC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0ID0gKGtleSA9PSA0MCkgPyBzZWwubmV4dFNpYmxpbmcgOiBzZWwucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwuY2xhc3NOYW1lID0gc2VsLmNsYXNzTmFtZS5yZXBsYWNlKCdzZWxlY3RlZCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0LmNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gbmV4dC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHsgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7IHRoYXQudmFsdWUgPSB0aGF0Lmxhc3RfdmFsOyBuZXh0ID0gMDsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlU0MoMCwgbmV4dCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gZXNjXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5ID09IDI3KSB7IHRoYXQudmFsdWUgPSB0aGF0Lmxhc3RfdmFsOyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH1cbiAgICAgICAgICAgICAgICAvLyBlbnRlclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PSAxMyB8fCBrZXkgPT0gOSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAmJiB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgIT0gJ25vbmUnKSB7IG8ub25TZWxlY3QoZSwgc2VsLmdldEF0dHJpYnV0ZSgnZGF0YS12YWwnKSwgc2VsKTsgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDIwKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAna2V5ZG93bicsIHRoYXQua2V5ZG93bkhhbmRsZXIpO1xuXG4gICAgICAgICAgICB0aGF0LmtleXVwSGFuZGxlciA9IGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSB3aW5kb3cuZXZlbnQgPyBlLmtleUNvZGUgOiBlLndoaWNoO1xuICAgICAgICAgICAgICAgIGlmICgha2V5IHx8IChrZXkgPCAzNSB8fCBrZXkgPiA0MCkgJiYga2V5ICE9IDEzICYmIGtleSAhPSAyNykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhhdC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPj0gby5taW5DaGFycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAhPSB0aGF0Lmxhc3RfdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhhdC50aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8uY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCBpbiB0aGF0LmNhY2hlKSB7IHN1Z2dlc3QodGhhdC5jYWNoZVt2YWxdKTsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIHJlcXVlc3RzIGlmIHByZXZpb3VzIHN1Z2dlc3Rpb25zIHdlcmUgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0xOyBpPHZhbC5sZW5ndGgtby5taW5DaGFyczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFydCA9IHZhbC5zbGljZSgwLCB2YWwubGVuZ3RoLWkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnQgaW4gdGhhdC5jYWNoZSAmJiAhdGhhdC5jYWNoZVtwYXJ0XS5sZW5ndGgpIHsgc3VnZ2VzdChbXSk7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IG8uc291cmNlKHZhbCwgc3VnZ2VzdCkgfSwgby5kZWxheSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGFkZEV2ZW50KHRoYXQsICdrZXl1cCcsIHRoYXQua2V5dXBIYW5kbGVyKTtcblxuICAgICAgICAgICAgdGhhdC5mb2N1c0hhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gJ1xcbic7XG4gICAgICAgICAgICAgICAgdGhhdC5rZXl1cEhhbmRsZXIoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoIW8ubWluQ2hhcnMpIGFkZEV2ZW50KHRoYXQsICdmb2N1cycsIHRoYXQuZm9jdXNIYW5kbGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHB1YmxpYyBkZXN0cm95IG1ldGhvZFxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSBlbGVtc1tpXTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh3aW5kb3csICdyZXNpemUnLCB0aGF0LnVwZGF0ZVNDKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAnYmx1cicsIHRoYXQuYmx1ckhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHRoYXQsICdmb2N1cycsIHRoYXQuZm9jdXNIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAna2V5ZG93bicsIHRoYXQua2V5ZG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHRoYXQsICdrZXl1cCcsIHRoYXQua2V5dXBIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5hdXRvY29tcGxldGVBdHRyKVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgdGhhdC5hdXRvY29tcGxldGVBdHRyKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlQXR0cmlidXRlKCdhdXRvY29tcGxldGUnKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG8uY29udGFpbmVyKS5yZW1vdmVDaGlsZCh0aGF0LnNjKTtcbiAgICAgICAgICAgICAgICB0aGF0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGF1dG9Db21wbGV0ZTtcbn0pKCk7XG5cbihmdW5jdGlvbigpe1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG4gICAgICAgIGRlZmluZSgnYXV0b0NvbXBsZXRlJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gYXV0b0NvbXBsZXRlOyB9KTtcbiAgICBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvQ29tcGxldGU7XG4gICAgZWxzZVxuICAgICAgICB3aW5kb3cuYXV0b0NvbXBsZXRlID0gYXV0b0NvbXBsZXRlO1xufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXHRcdC8vIGJyb3dzZXJpZnkgJiBicmZzXG5sZXQgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3RlbXBsYXRlJylcbmxldCBBdXRvQ29tcGxldGUgPSByZXF1aXJlKCcuL2F1dG8tY29tcGxldGUuanMnKVxuXG5sZXQgVG9jSnVtcGVyID0gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKG9wdCkge1xuXHR0aGlzLmRhdGEgPSBudWxsXG5cblx0dGhpcy5vcHQgPSB7XG5cdCAgICBpZDogJ3RvY19qdW1wZXInLFxuXHQgICAgc2VsZWN0b3I6ICcnLFxuXHQgICAgdHJhbnNmb3JtOiBudWxsLFxuXHQgICAga2V5OiAnaScsXG5cblx0ICAgIHRvcDogJzRlbScsXG5cdCAgICByaWdodDogJy41ZW0nLFxuXHQgICAgYm90dG9tOiAnYXV0bycsXG5cdCAgICBsZWZ0OiAnYXV0bycsXG5cdH1cblxuXHRmb3IgKGxldCBpZHggaW4gb3B0KSB7XHQvLyBtZXJnZVxuXHQgICAgaWYgKG9wdC5oYXNPd25Qcm9wZXJ0eShpZHgpKSB0aGlzLm9wdFtpZHhdID0gb3B0W2lkeF1cblx0fVxuXHR0aGlzLmxvZyA9IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSwgJ1RvY0p1bXBlcjonKVxuXHR0aGlzLmxvZygnaW5pdCcpXG4gICAgfVxuXG4gICAgc2Nyb2xsKHRlcm0pIHtcblx0aWYgKHRlcm0gaW4gdGhpcy5kYXRhKSB7XG5cdCAgICB0aGlzLmxvZyh0ZXJtKVxuXHQgICAgdGhpcy5kYXRhW3Rlcm1dLnNjcm9sbEludG9WaWV3KHRydWUpXG5cdH1cbiAgICB9XG5cbiAgICBob29rKCkge1xuXHR0aGlzLmRhdGEgPSBtYWtlX2luZGV4KHRoaXMub3B0LnNlbGVjdG9yLCB0aGlzLm9wdC50cmFuc2Zvcm0pXG5cdGNzc19pbmplY3QoeyBpZDogdGhpcy5vcHQuaWQgfSlcblx0ZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG5cdCAgICBpZiAoZXZlbnQudGFyZ2V0Lm5vZGVOYW1lID09PSAnSU5QVVQnKSByZXR1cm5cblx0ICAgIGlmIChldmVudC5rZXkgPT09IHRoaXMub3B0LmtleSAmJiAhZXZlbnQuY3RybEtleSkgdGhpcy5kbGcoKVxuXHR9KVxuICAgIH1cblxuICAgIGRsZygpIHtcblx0bGV0IG5vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLm9wdC5pZClcblx0aWYgKG5vZGUpIHJldHVybiBmb2N1cyhub2RlKVxuXG5cdG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXHRub2RlLmlkID0gdGhpcy5vcHQuaWQ7XG5cdFsndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J11cblx0ICAgIC5mb3JFYWNoKCAoaWR4KSA9PiBub2RlLnN0eWxlW2lkeF0gPSB0aGlzLm9wdFtpZHhdIClcblxuXHRsZXQgYWNfY29udGFpbmVyID0gYCR7dGhpcy5vcHQuaWR9X2NvbnRhaW5lcmBcblx0bm9kZS5pbm5lckhUTUwgPSBgPHNwYW4gaWQ9XCIke2FjX2NvbnRhaW5lcn1cIj48aW5wdXQgc2l6ZT1cIjQwXCIgc3BlbGxjaGVjaz1cImZhbHNlXCIgLz48L3NwYW4+XG48c3BhbiBpZD1cIiR7dGhpcy5vcHQuaWR9X2Nsb3NlXCIgdGl0bGU9XCJDbG9zZVwiPjxzcGFuPiZ0aW1lczs8L3NwYW4+PC9zcGFuPmBcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKVxuXHRsZXQgaW5wdXQgPSBub2RlLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JylcblxuXHRsZXQgYWMgPSBuZXcgQXV0b0NvbXBsZXRlKHtcblx0ICAgIHNlbGVjdG9yOiBpbnB1dCxcblx0ICAgIG1pbkNoYXJzOiAxLFxuXHQgICAgZGVsYXk6IDUwLFxuXHQgICAgY29udGFpbmVyOiAnIycgKyBhY19jb250YWluZXIsXG5cdCAgICBzb3VyY2U6ICh0ZXJtLCBzdWdnZXN0KSA9PiB7XG5cdFx0bGV0IGxpc3QgPSBbXVxuXHRcdGZvciAobGV0IGtleSBpbiB0aGlzLmRhdGEpIHtcblx0XHQgICAgaWYgKGtleS50b0xvd2VyQ2FzZSgpLmluZGV4T2YodGVybS50b0xvd2VyQ2FzZSgpKSAhPT0gLTEpXG5cdFx0XHRsaXN0LnB1c2goa2V5KVxuXHRcdH1cblx0XHRzdWdnZXN0KFRvY0p1bXBlci5zb3J0KGxpc3QsIHRlcm0pKVxuXHQgICAgfSxcblx0ICAgIG9uU2VsZWN0OiAoZXZlbnQsIHRlcm0sIGl0ZW0pID0+IHRoaXMuc2Nyb2xsKHRlcm0pXG5cdH0pXG5cblx0bGV0IGRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcblx0ICAgIGFjLmRlc3Ryb3koKVxuXHQgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChub2RlKVxuXHR9XG5cblx0bm9kZS5xdWVyeVNlbGVjdG9yKGAjJHt0aGlzLm9wdC5pZH1fY2xvc2VgKS5vbmNsaWNrID0gZGVzdHJveVxuXHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcblx0ICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicpIHRoaXMuc2Nyb2xsKGlucHV0LnZhbHVlKVxuXHQgICAgLy8gSUUxMSByZXR1cm5zIFwiRXNjXCIsIENocm9tZSAmIEZpcmVmb3ggcmV0dXJuIFwiRXNjYXBlXCJcblx0ICAgIGlmIChldmVudC5rZXkubWF0Y2goL15Fc2MvKSkgZGVzdHJveSgpXG5cdH0pXG5cblx0Zm9jdXMobm9kZSlcbiAgICB9XG5cbiAgICBzdGF0aWMgc29ydChhcnIsIHRlcm0pIHtcblx0cmV0dXJuIGFyci5zb3J0KCAoYSwgYikgPT4ge1xuXHQgICAgaWYgKGEuc2xpY2UoMCwgdGVybS5sZW5ndGgpID09PSB0ZXJtKSByZXR1cm4gLTFcblx0ICAgIGlmIChiLnNsaWNlKDAsIHRlcm0ubGVuZ3RoKSA9PT0gdGVybSkgcmV0dXJuIDFcblx0ICAgIHJldHVybiBhLmxvY2FsZUNvbXBhcmUoYilcblx0fSlcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVG9jSnVtcGVyXG5cbmxldCBtYWtlX2luZGV4ID0gZnVuY3Rpb24oc2VsZWN0b3IsIHRyYW5zZm9ybSkge1xuICAgIGxldCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXG5cbiAgICBsZXQgciA9IHt9XG4gICAgbGV0IGNhY2hlID0ge31cbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBub2Rlcy5sZW5ndGg7ICsraWR4KSB7XG5cdGxldCBub2RlID0gbm9kZXNbaWR4XVxuXHRsZXQga2V5ID0gdHJhbnNmb3JtID8gdHJhbnNmb3JtKG5vZGUuaW5uZXJUZXh0KSA6IG5vZGUuaW5uZXJUZXh0XG5cdGNhY2hlW2tleV0gPSAoY2FjaGVba2V5XSB8fCAwKSArIDFcblx0aWYgKGtleSBpbiByKSBrZXkgPSBgJHtrZXl9IDwke2NhY2hlW2tleV19PmBcblxuXHRyW2tleV0gPSBub2RlXG4gICAgfVxuXG4gICAgcmV0dXJuIHJcbn1cblxubGV0IGNzc19pbmplY3QgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgbGV0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgbGV0IHRtcGwgPSB0ZW1wbGF0ZShcIi8qIGF1dG8tY29tcGxldGUuanMgKi9cXG4uYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb25zIHtcXG4gIHRleHQtYWxpZ246IGxlZnQ7XFxuICBjdXJzb3I6IGRlZmF1bHQ7XFxuICBib3JkZXI6IDFweCBzb2xpZCAjY2NjO1xcbiAgYm9yZGVyLXRvcDogMDtcXG4gIGJhY2tncm91bmQ6IHdoaXRlO1xcbiAgYm94LXNoYWRvdzogLTFweCAxcHggM3B4IHJnYmEoMCwgMCwgMCwgLjEpO1xcblxcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgZGlzcGxheTogbm9uZTtcXG4gIHotaW5kZXg6IDk5OTk7XFxuICBtYXgtaGVpZ2h0OiAxNWVtO1xcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcXG4gIG92ZXJmbG93LXk6IGF1dG87XFxuICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xcbn1cXG4uYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24ge1xcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcXG4gIG92ZXJmbG93OiBoaWRkZW47XFxuICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcXG59XFxuLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkIHtcXG4gIGJhY2tncm91bmQ6ICNlZWU7XFxufVxcblxcbi8qIHRvYy1qdW1wZXIgKi9cXG4jPCU9IGlkICU+IHtcXG4gIGJvcmRlcjogMXB4IHNvbGlkICNhOWE5YTk7XFxuICBwYWRkaW5nOiAwLjhlbTtcXG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlO1xcbiAgY29sb3I6IGJsYWNrO1xcbiAgYm94LXNoYWRvdzogMXB4IDFweCAzcHggcmdiYSgwLCAwLCAwLCAuNCk7XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxuICB0b3A6IDRlbTtcXG4gIHJpZ2h0OiAuNWVtO1xcbn1cXG5cXG4jPCU9IGlkICU+X2Nsb3NlIHtcXG4gIG1hcmdpbi1sZWZ0OiAxZW07XFxuICBmb250LXdlaWdodDogYm9sZDtcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcXG4gIGxpbmUtaGVpZ2h0OiAyZW07XFxuICB3aWR0aDogMmVtO1xcbiAgaGVpZ2h0OiAyZW07XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxufVxcblxcbiM8JT0gaWQgJT5fY2xvc2UgPiBzcGFuIHtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG59XFxuXFxuIzwlPSBpZCAlPl9jbG9zZTpob3ZlciB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZTgxMTIzO1xcbiAgY29sb3I6IHdoaXRlO1xcbn1cXG5cIilcbiAgICBub2RlLmlubmVySFRNTCA9IHRtcGwoZGF0YSlcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXG59XG5cbmxldCBmb2N1cyA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBzZXRUaW1lb3V0KCAoKSA9PiBub2RlLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykuZm9jdXMoKSwgMSlcbn1cbiIsIi8qXG4gIEEgbW9kaWZpZWQgXy50ZW1wbGF0ZSgpIGZyb20gdW5kZXJzY29yZS5qcy5cblxuICBXaHkgbm90IHVzZSBsb2Rhc2gvdGVtcGxhdGU/IFRoaXMgdmVyc2lvbiBpcyB+NSB0aW1lcyBzbWFsbGVyLlxuKi9cblxudmFyIG5vTWF0Y2ggPSAvKC4pXi87XG52YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xufTtcblxudmFyIGVzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx1MjAyOHxcXHUyMDI5L2c7XG5cbnZhciBlc2NhcGVDaGFyID0gZnVuY3Rpb24obWF0Y2gpIHtcbiAgICByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07XG59O1xuXG52YXIgdGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICB2YXIgc2V0dGluZ3MgPSB0ZW1wbGF0ZVNldHRpbmdzO1xuXG4gICAgdmFyIG1hdGNoZXIgPSBSZWdFeHAoW1xuXHQoc2V0dGluZ3MuZXNjYXBlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcblx0KHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcblx0KHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG5cdHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpLnJlcGxhY2UoZXNjYXBlciwgZXNjYXBlQ2hhcik7XG5cdGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuXG5cdGlmIChlc2NhcGUpIHtcblx0ICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG5cdH0gZWxzZSBpZiAoaW50ZXJwb2xhdGUpIHtcblx0ICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgaW50ZXJwb2xhdGUgKyBcIikpPT1udWxsPycnOl9fdCkrXFxuJ1wiO1xuXHR9IGVsc2UgaWYgKGV2YWx1YXRlKSB7XG5cdCAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuXHR9XG5cblx0cmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICBpZiAoIXNldHRpbmdzLnZhcmlhYmxlKSBzb3VyY2UgPSAnd2l0aChvYmp8fHt9KXtcXG4nICsgc291cmNlICsgJ31cXG4nO1xuXG4gICAgc291cmNlID0gXCJ2YXIgX190LF9fcD0nJyxfX2o9QXJyYXkucHJvdG90eXBlLmpvaW4sXCIgK1xuXHRcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuXHRzb3VyY2UgKyAncmV0dXJuIF9fcDtcXG4nO1xuXG4gICAgdmFyIHJlbmRlclxuICAgIHRyeSB7XG5cdHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgc291cmNlKTtcbiAgICB9IGNhdGNoIChlKSB7XG5cdGUuc291cmNlID0gc291cmNlO1xuXHR0aHJvdyBlO1xuICAgIH1cblxuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0cmV0dXJuIHJlbmRlci5jYWxsKHRoaXMsIGRhdGEpO1xuICAgIH07XG5cbiAgICB2YXIgYXJndW1lbnQgPSBzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJztcbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIGFyZ3VtZW50ICsgJyl7XFxuJyArIHNvdXJjZSArICd9JztcblxuICAgIHJldHVybiB0ZW1wbGF0ZTtcbn07XG4iXX0=
// ]]>
