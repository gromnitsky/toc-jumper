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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AutoComplete = require('./auto-complete.js');

var TocJumper = function () {
			function TocJumper(opt) {
						_classCallCheck(this, TocJumper);

						this.data = null;

						this.opt = {
									id: 'toc_jumper',
									selector: '',
									transform: null,
									key: 'i'
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
									css_inject('\n.autocomplete-suggestions {\n  text-align: left; cursor: default; border: 1px solid #ccc; border-top: 0; background: white; box-shadow: -1px 1px 3px rgba(0, 0, 0, .1);\n  position: absolute; display: none; z-index: 9999; max-height: 15em; overflow: hidden; overflow-y: auto; box-sizing: border-box;\n}\n.autocomplete-suggestion {\n  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n}\n.autocomplete-suggestion.selected { background: #eee; }\n');
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
									node.style.border = '1px solid #a9a9a9';
									node.style.padding = '0.8em';
									node.style.backgroundColor = 'white';
									node.style.color = 'black';
									node.style.boxShadow = '1px 1px 3px rgba(0, 0, 0, .4)';
									node.style.position = 'fixed';
									node.style.top = '4em';
									node.style.right = '1em';

									document.body.appendChild(node);
									// TODO: add a close btn
									node.innerHTML = '<input size="40" />';
									var input = node.querySelector('input');

									var ac = new AutoComplete({
												selector: input,
												minChars: 1,
												delay: 50,
												container: '#' + this.opt.id,
												source: function source(term, suggest) {
															var list = [];
															for (var key in _this2.data) {
																		if (key.toLowerCase().indexOf(term.toLowerCase()) !== -1) list.push(key);
															}
															// TODO: sort by relevancy
															suggest(list);
												},
												onSelect: function onSelect(event, term, item) {
															return _this2.scroll(term);
												}
									});

									node.addEventListener('keydown', function (event) {
												if (event.key === 'Enter') _this2.scroll(input.value);
												// IE11 returns "Esc", Chrome & Firefox return "Escape"
												if (event.key.match(/^Esc/)) {
															ac.destroy();
															document.body.removeChild(node);
												}
									});

									focus(node);
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

var css_inject = function css_inject(css) {
			var node = document.createElement('style');
			node.innerHTML = css;
			document.body.appendChild(node);
};

var focus = function focus(node) {
			setTimeout(function () {
						return node.querySelector('input').focus();
			}, 1);
};

},{"./auto-complete.js":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL29wdC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImF1dG8tY29tcGxldGUuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQTs7Ozs7OztBQU9BLElBQUksZUFBZ0IsWUFBVTtBQUMxQjtBQUNBLGFBQVMsWUFBVCxDQUFzQixPQUF0QixFQUE4QjtBQUMxQixZQUFJLENBQUMsU0FBUyxhQUFkLEVBQTZCOztBQUU3QjtBQUNBLGlCQUFTLFFBQVQsQ0FBa0IsRUFBbEIsRUFBc0IsU0FBdEIsRUFBZ0M7QUFBRSxtQkFBTyxHQUFHLFNBQUgsR0FBZSxHQUFHLFNBQUgsQ0FBYSxRQUFiLENBQXNCLFNBQXRCLENBQWYsR0FBa0QsSUFBSSxNQUFKLENBQVcsUUFBTyxTQUFQLEdBQWlCLEtBQTVCLEVBQW1DLElBQW5DLENBQXdDLEdBQUcsU0FBM0MsQ0FBekQ7QUFBaUg7O0FBRW5KLGlCQUFTLFFBQVQsQ0FBa0IsRUFBbEIsRUFBc0IsSUFBdEIsRUFBNEIsT0FBNUIsRUFBb0M7QUFDaEMsZ0JBQUksR0FBRyxXQUFQLEVBQW9CLEdBQUcsV0FBSCxDQUFlLE9BQUssSUFBcEIsRUFBMEIsT0FBMUIsRUFBcEIsS0FBNkQsR0FBRyxnQkFBSCxDQUFvQixJQUFwQixFQUEwQixPQUExQjtBQUNoRTtBQUNELGlCQUFTLFdBQVQsQ0FBcUIsRUFBckIsRUFBeUIsSUFBekIsRUFBK0IsT0FBL0IsRUFBdUM7QUFDbkM7QUFDQSxnQkFBSSxHQUFHLFdBQVAsRUFBb0IsR0FBRyxXQUFILENBQWUsT0FBSyxJQUFwQixFQUEwQixPQUExQixFQUFwQixLQUE2RCxHQUFHLG1CQUFILENBQXVCLElBQXZCLEVBQTZCLE9BQTdCO0FBQ2hFO0FBQ0QsaUJBQVMsSUFBVCxDQUFjLE9BQWQsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFBa0MsT0FB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QUF3QyxLQUFLLFNBQXZEO0FBQ0EsWUFBTSxHQUFOLElBQWEsQ0FBQyxNQUFNLEdBQU4sS0FBYyxDQUFmLElBQW9CLENBQWpDO0FBQ0EsVUFBSSxPQUFPLENBQVgsRUFBYyxNQUFTLEdBQVQsVUFBaUIsTUFBTSxHQUFOLENBQWpCOztBQUVkLFFBQUUsR0FBRixJQUFTLElBQVQ7QUFDSTs7QUFFRCxVQUFPLENBQVA7QUFDSCxDQWZEOztBQWlCQSxJQUFJLGFBQWEsU0FBYixVQUFhLENBQVMsR0FBVCxFQUFjO0FBQzNCLE9BQUksT0FBTyxTQUFTLGFBQVQsQ0FBdUIsT0FBdkIsQ0FBWDtBQUNBLFFBQUssU0FBTCxHQUFpQixHQUFqQjtBQUNBLFlBQVMsSUFBVCxDQUFjLFdBQWQsQ0FBMEIsSUFBMUI7QUFDSCxDQUpEOztBQU1BLElBQUksUUFBUSxTQUFSLEtBQVEsQ0FBUyxJQUFULEVBQWU7QUFDdkIsY0FBWTtBQUFBLGFBQU0sS0FBSyxhQUFMLENBQW1CLE9BQW5CLEVBQTRCLEtBQTVCLEVBQU47QUFBQSxJQUFaLEVBQXVELENBQXZEO0FBQ0gsQ0FGRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICAgIEphdmFTY3JpcHQgYXV0b0NvbXBsZXRlIHYxLjAuNFxuICAgIENvcHlyaWdodCAoYykgMjAxNCBTaW1vbiBTdGVpbmJlcmdlciAvIFBpeGFiYXlcbiAgICBHaXRIdWI6IGh0dHBzOi8vZ2l0aHViLmNvbS9QaXhhYmF5L0phdmFTY3JpcHQtYXV0b0NvbXBsZXRlXG4gICAgTGljZW5zZTogaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcbiovXG5cbnZhciBhdXRvQ29tcGxldGUgPSAoZnVuY3Rpb24oKXtcbiAgICAvLyBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBhdXRvQ29tcGxldGUob3B0aW9ucyl7XG4gICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcikgcmV0dXJuO1xuXG4gICAgICAgIC8vIGhlbHBlcnNcbiAgICAgICAgZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIGNsYXNzTmFtZSl7IHJldHVybiBlbC5jbGFzc0xpc3QgPyBlbC5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKSA6IG5ldyBSZWdFeHAoJ1xcXFxiJysgY2xhc3NOYW1lKydcXFxcYicpLnRlc3QoZWwuY2xhc3NOYW1lKTsgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFkZEV2ZW50KGVsLCB0eXBlLCBoYW5kbGVyKXtcbiAgICAgICAgICAgIGlmIChlbC5hdHRhY2hFdmVudCkgZWwuYXR0YWNoRXZlbnQoJ29uJyt0eXBlLCBoYW5kbGVyKTsgZWxzZSBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGVsLCB0eXBlLCBoYW5kbGVyKXtcbiAgICAgICAgICAgIC8vIGlmIChlbC5yZW1vdmVFdmVudExpc3RlbmVyKSBub3Qgd29ya2luZyBpbiBJRTExXG4gICAgICAgICAgICBpZiAoZWwuZGV0YWNoRXZlbnQpIGVsLmRldGFjaEV2ZW50KCdvbicrdHlwZSwgaGFuZGxlcik7IGVsc2UgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBsaXZlKGVsQ2xhc3MsIGV2ZW50LCBjYiwgY29udGV4dCl7XG4gICAgICAgICAgICBhZGRFdmVudChjb250ZXh0IHx8IGRvY3VtZW50LCBldmVudCwgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIGZvdW5kLCBlbCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWwgJiYgIShmb3VuZCA9IGhhc0NsYXNzKGVsLCBlbENsYXNzKSkpIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIGNiLmNhbGwoZWwsIGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbyA9IHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiAwLFxuICAgICAgICAgICAgc291cmNlOiAwLFxuICAgICAgICAgICAgbWluQ2hhcnM6IDMsXG4gICAgICAgICAgICBkZWxheTogMTUwLFxuICAgICAgICAgICAgb2Zmc2V0TGVmdDogMCxcbiAgICAgICAgICAgIG9mZnNldFRvcDogMSxcbiAgICAgICAgICAgIGNhY2hlOiAxLFxuICAgICAgICAgICAgbWVudUNsYXNzOiAnJyxcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJ2JvZHknLFxuICAgICAgICAgICAgcmVuZGVySXRlbTogZnVuY3Rpb24gKGl0ZW0sIHNlYXJjaCl7XG4gICAgICAgICAgICAgICAgLy8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgIHNlYXJjaCA9IHNlYXJjaC5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxcXFtcXF17fV0vZywgJ1xcXFwkJicpO1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCIoXCIgKyBzZWFyY2guc3BsaXQoJyAnKS5qb2luKCd8JykgKyBcIilcIiwgXCJnaVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJhdXRvY29tcGxldGUtc3VnZ2VzdGlvblwiIGRhdGEtdmFsPVwiJyArIGl0ZW0gKyAnXCI+JyArIGl0ZW0ucmVwbGFjZShyZSwgXCI8Yj4kMTwvYj5cIikgKyAnPC9kaXY+JztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblNlbGVjdDogZnVuY3Rpb24oZSwgdGVybSwgaXRlbSl7fVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciBrIGluIG9wdGlvbnMpIHsgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaykpIG9ba10gPSBvcHRpb25zW2tdOyB9XG5cbiAgICAgICAgLy8gaW5pdFxuICAgICAgICB2YXIgZWxlbXMgPSB0eXBlb2Ygby5zZWxlY3RvciA9PSAnb2JqZWN0JyA/IFtvLnNlbGVjdG9yXSA6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoby5zZWxlY3Rvcik7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxlbGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSBlbGVtc1tpXTtcblxuICAgICAgICAgICAgLy8gY3JlYXRlIHN1Z2dlc3Rpb25zIGNvbnRhaW5lciBcInNjXCJcbiAgICAgICAgICAgIHRoYXQuc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIHRoYXQuc2MuY2xhc3NOYW1lID0gJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9ucyAnK28ubWVudUNsYXNzO1xuXG4gICAgICAgICAgICAvLyBJZiBhZGRpbmcgaW50byBhIHJlc3VsdHMgY29udGFpbmVyLCByZW1vdmUgdGhlIHBvc2l0aW9uIGFic29sdXRlIGNzcyBzdHlsZXNcbiAgICAgICAgICAgIGlmIChvLmNvbnRhaW5lciAhPT0gXCJib2R5XCIpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnNjLmNsYXNzTmFtZSA9IHRoYXQuc2MuY2xhc3NOYW1lICsgJyBhdXRvY29tcGxldGUtc3VnZ2VzdGlvbnMtLWluLWNvbnRhaW5lcic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoYXQuYXV0b2NvbXBsZXRlQXR0ciA9IHRoYXQuZ2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnKTtcbiAgICAgICAgICAgIHRoYXQuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCAnb2ZmJyk7XG4gICAgICAgICAgICB0aGF0LmNhY2hlID0ge307XG4gICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gJyc7XG5cbiAgICAgICAgICAgIHRoYXQudXBkYXRlU0MgPSBmdW5jdGlvbihyZXNpemUsIG5leHQpe1xuICAgICAgICAgICAgICAgIHZhciByZWN0ID0gdGhhdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBpZiAoby5jb250YWluZXIgPT09ICdib2R5Jykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY29udGFpbmVyIGlzIG5vdCB0aGUgYm9keSwgZG8gbm90IGFic29sdXRlbHkgcG9zaXRpb24gaW4gdGhlIHdpbmRvdy5cbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5sZWZ0ID0gTWF0aC5yb3VuZChyZWN0LmxlZnQgKyAod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0KSArIG8ub2Zmc2V0TGVmdCkgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLnRvcCA9IE1hdGgucm91bmQocmVjdC5ib3R0b20gKyAod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3ApICsgby5vZmZzZXRUb3ApICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS53aWR0aCA9IE1hdGgucm91bmQocmVjdC5yaWdodCAtIHJlY3QubGVmdCkgKyAncHgnOyAvLyBvdXRlcldpZHRoXG4gICAgICAgICAgICAgICAgaWYgKCFyZXNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGF0LnNjLm1heEhlaWdodCkgeyB0aGF0LnNjLm1heEhlaWdodCA9IHBhcnNlSW50KCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSA/IGdldENvbXB1dGVkU3R5bGUodGhhdC5zYywgbnVsbCkgOiB0aGF0LnNjLmN1cnJlbnRTdHlsZSkubWF4SGVpZ2h0KTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodCkgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0ID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nKS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHQpIHRoYXQuc2Muc2Nyb2xsVG9wID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY3JUb3AgPSB0aGF0LnNjLnNjcm9sbFRvcCwgc2VsVG9wID0gbmV4dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSB0aGF0LnNjLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsVG9wICsgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0IC0gdGhhdC5zYy5tYXhIZWlnaHQgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnNjcm9sbFRvcCA9IHNlbFRvcCArIHRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodCArIHNjclRvcCAtIHRoYXQuc2MubWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNlbFRvcCA8IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc2Nyb2xsVG9wID0gc2VsVG9wICsgc2NyVG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFkZEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHRoYXQudXBkYXRlU0MpO1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvLmNvbnRhaW5lcikuYXBwZW5kQ2hpbGQodGhhdC5zYyk7XG5cbiAgICAgICAgICAgIGxpdmUoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJywgJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsKSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNlbC5jbGFzc05hbWUgPSBzZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NlbGVjdGVkJywgJycpOyB9LCAyMCk7XG4gICAgICAgICAgICB9LCB0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2VvdmVyJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIHNlbCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbCkgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICB9LCB0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2Vkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgaWYgKGhhc0NsYXNzKHRoaXMsICdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicpKSB7IC8vIGVsc2Ugb3V0c2lkZSBjbGlja1xuICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gdjtcbiAgICAgICAgICAgICAgICAgICAgby5vblNlbGVjdChlLCB2LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICB0aGF0LmJsdXJIYW5kbGVyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB0cnkgeyB2YXIgb3Zlcl9zYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbnM6aG92ZXInKTsgfSBjYXRjaChlKXsgdmFyIG92ZXJfc2IgPSAwOyB9XG4gICAgICAgICAgICAgICAgaWYgKCFvdmVyX3NiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSB0aGF0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9LCAzNTApOyAvLyBoaWRlIHN1Z2dlc3Rpb25zIG9uIGZhc3QgaW5wdXRcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoYXQgIT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5mb2N1cygpOyB9LCAyMCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYWRkRXZlbnQodGhhdCwgJ2JsdXInLCB0aGF0LmJsdXJIYW5kbGVyKTtcblxuICAgICAgICAgICAgdmFyIHN1Z2dlc3QgPSBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhhdC52YWx1ZTtcbiAgICAgICAgICAgICAgICB0aGF0LmNhY2hlW3ZhbF0gPSBkYXRhO1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aCAmJiB2YWwubGVuZ3RoID49IG8ubWluQ2hhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKSBzICs9IG8ucmVuZGVySXRlbShkYXRhW2ldLCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLmlubmVySFRNTCA9IHM7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlU0MoMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LmtleWRvd25IYW5kbGVyID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHdpbmRvdy5ldmVudCA/IGUua2V5Q29kZSA6IGUud2hpY2g7XG4gICAgICAgICAgICAgICAgLy8gZG93biAoNDApLCB1cCAoMzgpXG4gICAgICAgICAgICAgICAgaWYgKChrZXkgPT0gNDAgfHwga2V5ID09IDM4KSAmJiB0aGF0LnNjLmlubmVySFRNTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dCwgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgPSAoa2V5ID09IDQwKSA/IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJykgOiB0aGF0LnNjLmNoaWxkTm9kZXNbdGhhdC5zYy5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdOyAvLyBmaXJzdCA6IGxhc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQuY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC52YWx1ZSA9IG5leHQuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IChrZXkgPT0gNDApID8gc2VsLm5leHRTaWJsaW5nIDogc2VsLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC52YWx1ZSA9IG5leHQuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7IHNlbC5jbGFzc05hbWUgPSBzZWwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NlbGVjdGVkJywgJycpOyB0aGF0LnZhbHVlID0gdGhhdC5sYXN0X3ZhbDsgbmV4dCA9IDA7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZVNDKDAsIG5leHQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGVzY1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PSAyNykgeyB0aGF0LnZhbHVlID0gdGhhdC5sYXN0X3ZhbDsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9XG4gICAgICAgICAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXkgPT0gMTMgfHwga2V5ID09IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbCA9IHRoYXQuc2MucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgJiYgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ICE9ICdub25lJykgeyBvLm9uU2VsZWN0KGUsIHNlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyksIHNlbCk7IHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyB9LCAyMCk7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYWRkRXZlbnQodGhhdCwgJ2tleWRvd24nLCB0aGF0LmtleWRvd25IYW5kbGVyKTtcblxuICAgICAgICAgICAgdGhhdC5rZXl1cEhhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gd2luZG93LmV2ZW50ID8gZS5rZXlDb2RlIDogZS53aGljaDtcbiAgICAgICAgICAgICAgICBpZiAoIWtleSB8fCAoa2V5IDwgMzUgfHwga2V5ID4gNDApICYmIGtleSAhPSAxMyAmJiBrZXkgIT0gMjcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRoYXQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoID49IG8ubWluQ2hhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwgIT0gdGhhdC5sYXN0X3ZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoYXQudGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLmNhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwgaW4gdGhhdC5jYWNoZSkgeyBzdWdnZXN0KHRoYXQuY2FjaGVbdmFsXSk7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyByZXF1ZXN0cyBpZiBwcmV2aW91cyBzdWdnZXN0aW9ucyB3ZXJlIGVtcHR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MTsgaTx2YWwubGVuZ3RoLW8ubWluQ2hhcnM7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnQgPSB2YWwuc2xpY2UoMCwgdmFsLmxlbmd0aC1pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJ0IGluIHRoYXQuY2FjaGUgJiYgIXRoYXQuY2FjaGVbcGFydF0ubGVuZ3RoKSB7IHN1Z2dlc3QoW10pOyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpeyBvLnNvdXJjZSh2YWwsIHN1Z2dlc3QpIH0sIG8uZGVsYXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAna2V5dXAnLCB0aGF0LmtleXVwSGFuZGxlcik7XG5cbiAgICAgICAgICAgIHRoYXQuZm9jdXNIYW5kbGVyID0gZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9ICdcXG4nO1xuICAgICAgICAgICAgICAgIHRoYXQua2V5dXBIYW5kbGVyKGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCFvLm1pbkNoYXJzKSBhZGRFdmVudCh0aGF0LCAnZm9jdXMnLCB0aGF0LmZvY3VzSGFuZGxlcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBwdWJsaWMgZGVzdHJveSBtZXRob2RcbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxlbGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gZWxlbXNbaV07XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQod2luZG93LCAncmVzaXplJywgdGhhdC51cGRhdGVTQyk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQodGhhdCwgJ2JsdXInLCB0aGF0LmJsdXJIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAnZm9jdXMnLCB0aGF0LmZvY3VzSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnQodGhhdCwgJ2tleWRvd24nLCB0aGF0LmtleWRvd25IYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAna2V5dXAnLCB0aGF0LmtleXVwSGFuZGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuYXV0b2NvbXBsZXRlQXR0cilcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsIHRoYXQuYXV0b2NvbXBsZXRlQXR0cik7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbW92ZUF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJyk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvLmNvbnRhaW5lcikucmVtb3ZlQ2hpbGQodGhhdC5zYyk7XG4gICAgICAgICAgICAgICAgdGhhdCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBhdXRvQ29tcGxldGU7XG59KSgpO1xuXG4oZnVuY3Rpb24oKXtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuICAgICAgICBkZWZpbmUoJ2F1dG9Db21wbGV0ZScsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGF1dG9Db21wbGV0ZTsgfSk7XG4gICAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0NvbXBsZXRlO1xuICAgIGVsc2VcbiAgICAgICAgd2luZG93LmF1dG9Db21wbGV0ZSA9IGF1dG9Db21wbGV0ZTtcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmxldCBBdXRvQ29tcGxldGUgPSByZXF1aXJlKCcuL2F1dG8tY29tcGxldGUuanMnKVxuXG5sZXQgVG9jSnVtcGVyID0gY2xhc3Mge1xuICAgIGNvbnN0cnVjdG9yKG9wdCkge1xuXHR0aGlzLmRhdGEgPSBudWxsXG5cblx0dGhpcy5vcHQgPSB7XG5cdCAgICBpZDogJ3RvY19qdW1wZXInLFxuXHQgICAgc2VsZWN0b3I6ICcnLFxuXHQgICAgdHJhbnNmb3JtOiBudWxsLFxuXHQgICAga2V5OiAnaSdcblx0fVxuXG5cdGZvciAobGV0IGlkeCBpbiBvcHQpIHtcdC8vIG1lcmdlXG5cdCAgICBpZiAob3B0Lmhhc093blByb3BlcnR5KGlkeCkpIHRoaXMub3B0W2lkeF0gPSBvcHRbaWR4XVxuXHR9XG5cdHRoaXMubG9nID0gY29uc29sZS5sb2cuYmluZChjb25zb2xlLCAnVG9jSnVtcGVyOicpXG5cdHRoaXMubG9nKCdpbml0JylcbiAgICB9XG5cbiAgICBzY3JvbGwodGVybSkge1xuXHRpZiAodGVybSBpbiB0aGlzLmRhdGEpIHtcblx0ICAgIHRoaXMubG9nKHRlcm0pXG5cdCAgICB0aGlzLmRhdGFbdGVybV0uc2Nyb2xsSW50b1ZpZXcodHJ1ZSlcblx0fVxuICAgIH1cblxuICAgIGhvb2soKSB7XG5cdHRoaXMuZGF0YSA9IG1ha2VfaW5kZXgodGhpcy5vcHQuc2VsZWN0b3IsIHRoaXMub3B0LnRyYW5zZm9ybSlcblx0Y3NzX2luamVjdChgXG4uYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb25zIHtcbiAgdGV4dC1hbGlnbjogbGVmdDsgY3Vyc29yOiBkZWZhdWx0OyBib3JkZXI6IDFweCBzb2xpZCAjY2NjOyBib3JkZXItdG9wOiAwOyBiYWNrZ3JvdW5kOiB3aGl0ZTsgYm94LXNoYWRvdzogLTFweCAxcHggM3B4IHJnYmEoMCwgMCwgMCwgLjEpO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7IGRpc3BsYXk6IG5vbmU7IHotaW5kZXg6IDk5OTk7IG1heC1oZWlnaHQ6IDE1ZW07IG92ZXJmbG93OiBoaWRkZW47IG92ZXJmbG93LXk6IGF1dG87IGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG59XG4uYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24ge1xuICB3aGl0ZS1zcGFjZTogbm93cmFwOyBvdmVyZmxvdzogaGlkZGVuOyB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbn1cbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCB7IGJhY2tncm91bmQ6ICNlZWU7IH1cbmApXG5cdGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuXHQgICAgaWYgKGV2ZW50LnRhcmdldC5ub2RlTmFtZSA9PT0gJ0lOUFVUJykgcmV0dXJuXG5cdCAgICBpZiAoZXZlbnQua2V5ID09PSB0aGlzLm9wdC5rZXkgJiYgIWV2ZW50LmN0cmxLZXkpIHRoaXMuZGxnKClcblx0fSlcbiAgICB9XG5cbiAgICBkbGcoKSB7XG5cdGxldCBub2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5vcHQuaWQpXG5cdGlmIChub2RlKSByZXR1cm4gZm9jdXMobm9kZSlcblxuXHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jylcblx0bm9kZS5pZCA9IHRoaXMub3B0LmlkXG5cdG5vZGUuc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCAjYTlhOWE5J1xuXHRub2RlLnN0eWxlLnBhZGRpbmcgPSAnMC44ZW0nXG5cdG5vZGUuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3doaXRlJ1xuXHRub2RlLnN0eWxlLmNvbG9yID0gJ2JsYWNrJ1xuXHRub2RlLnN0eWxlLmJveFNoYWRvdyA9ICcxcHggMXB4IDNweCByZ2JhKDAsIDAsIDAsIC40KSdcblx0bm9kZS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCdcblx0bm9kZS5zdHlsZS50b3AgPSAnNGVtJ1xuXHRub2RlLnN0eWxlLnJpZ2h0ID0gJzFlbSdcblxuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXG5cdC8vIFRPRE86IGFkZCBhIGNsb3NlIGJ0blxuXHRub2RlLmlubmVySFRNTCA9ICc8aW5wdXQgc2l6ZT1cIjQwXCIgLz4nXG5cdGxldCBpbnB1dCA9IG5vZGUucXVlcnlTZWxlY3RvcignaW5wdXQnKVxuXG5cdGxldCBhYyA9IG5ldyBBdXRvQ29tcGxldGUoe1xuXHQgICAgc2VsZWN0b3I6IGlucHV0LFxuXHQgICAgbWluQ2hhcnM6IDEsXG5cdCAgICBkZWxheTogNTAsXG5cdCAgICBjb250YWluZXI6ICcjJyArIHRoaXMub3B0LmlkLFxuXHQgICAgc291cmNlOiAodGVybSwgc3VnZ2VzdCkgPT4ge1xuXHRcdGxldCBsaXN0ID0gW11cblx0XHRmb3IgKGxldCBrZXkgaW4gdGhpcy5kYXRhKSB7XG5cdFx0ICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKS5pbmRleE9mKHRlcm0udG9Mb3dlckNhc2UoKSkgIT09IC0xKVxuXHRcdFx0bGlzdC5wdXNoKGtleSlcblx0XHR9XG5cdFx0Ly8gVE9ETzogc29ydCBieSByZWxldmFuY3lcblx0XHRzdWdnZXN0KGxpc3QpXG5cdCAgICB9LFxuXHQgICAgb25TZWxlY3Q6IChldmVudCwgdGVybSwgaXRlbSkgPT4gdGhpcy5zY3JvbGwodGVybSlcblx0fSlcblxuXHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcblx0ICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicpIHRoaXMuc2Nyb2xsKGlucHV0LnZhbHVlKVxuXHQgICAgLy8gSUUxMSByZXR1cm5zIFwiRXNjXCIsIENocm9tZSAmIEZpcmVmb3ggcmV0dXJuIFwiRXNjYXBlXCJcblx0ICAgIGlmIChldmVudC5rZXkubWF0Y2goL15Fc2MvKSkge1xuXHRcdGFjLmRlc3Ryb3koKVxuXHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobm9kZSlcblx0ICAgIH1cblx0fSlcblxuXHRmb2N1cyhub2RlKVxuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRvY0p1bXBlclxuXG5sZXQgbWFrZV9pbmRleCA9IGZ1bmN0aW9uKHNlbGVjdG9yLCB0cmFuc2Zvcm0pIHtcbiAgICBsZXQgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxuXG4gICAgbGV0IHIgPSB7fVxuICAgIGxldCBjYWNoZSA9IHt9XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgbm9kZXMubGVuZ3RoOyArK2lkeCkge1xuXHRsZXQgbm9kZSA9IG5vZGVzW2lkeF1cblx0bGV0IGtleSA9IHRyYW5zZm9ybSA/IHRyYW5zZm9ybShub2RlLmlubmVyVGV4dCkgOiBub2RlLmlubmVyVGV4dFxuXHRjYWNoZVtrZXldID0gKGNhY2hlW2tleV0gfHwgMCkgKyAxXG5cdGlmIChrZXkgaW4gcikga2V5ID0gYCR7a2V5fSA8JHtjYWNoZVtrZXldfT5gXG5cblx0cltrZXldID0gbm9kZVxuICAgIH1cblxuICAgIHJldHVybiByXG59XG5cbmxldCBjc3NfaW5qZWN0ID0gZnVuY3Rpb24oY3NzKSB7XG4gICAgbGV0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpXG4gICAgbm9kZS5pbm5lckhUTUwgPSBjc3NcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXG59XG5cbmxldCBmb2N1cyA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBzZXRUaW1lb3V0KCAoKSA9PiBub2RlLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykuZm9jdXMoKSwgMSlcbn1cbiJdfQ==
