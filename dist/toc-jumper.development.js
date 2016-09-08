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
						css_inject('\n.autocomplete-suggestions {\n  text-align: left; cursor: default; border: 1px solid #ccc; border-top: 0; background: white; box-shadow: -1px 1px 3px rgba(0, 0, 0, .1);\n  position: absolute; display: none; z-index: 9999; max-height: 15em; overflow: hidden; overflow-y: auto; box-sizing: border-box;\n}\n.autocomplete-suggestion {\n  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n}\n.autocomplete-suggestion.selected { background: #eee; }\n\n#' + this.opt.id + ' {\n  border: 1px solid #a9a9a9;\n  padding: 0.8em;\n  background-color: white;\n  color: black;\n  box-shadow: 1px 1px 3px rgba(0, 0, 0, .4);\n  position: fixed;\n  top: 4em;\n  right: .5em;\n}\n#' + this.opt.id + '_close {\n  margin-left: 1em;\n  font-weight: bold;\n  cursor: pointer;\n  text-align: center;\n  line-height: 2em;\n  width: 2em;\n  height: 2em;\n  display: inline-block;\n}\n#' + this.opt.id + '_close > span {\n  display: inline-block;\n}\n#' + this.opt.id + '_close:hover {\n  background-color: #e81123;\n  color: white;\n}\n');
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
										// TODO: sort by relevancy
										suggest(list);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL29wdC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImF1dG8tY29tcGxldGUuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQTs7Ozs7OztBQU9BLElBQUksZUFBZ0IsWUFBVTtBQUMxQjtBQUNBLGFBQVMsWUFBVCxDQUFzQixPQUF0QixFQUE4QjtBQUMxQixZQUFJLENBQUMsU0FBUyxhQUFkLEVBQTZCOztBQUU3QjtBQUNBLGlCQUFTLFFBQVQsQ0FBa0IsRUFBbEIsRUFBc0IsU0FBdEIsRUFBZ0M7QUFBRSxtQkFBTyxHQUFHLFNBQUgsR0FBZSxHQUFHLFNBQUgsQ0FBYSxRQUFiLENBQXNCLFNBQXRCLENBQWYsR0FBa0QsSUFBSSxNQUFKLENBQVcsUUFBTyxTQUFQLEdBQWlCLEtBQTVCLEVBQW1DLElBQW5DLENBQXdDLEdBQUcsU0FBM0MsQ0FBekQ7QUFBaUg7O0FBRW5KLGlCQUFTLFFBQVQsQ0FBa0IsRUFBbEIsRUFBc0IsSUFBdEIsRUFBNEIsT0FBNUIsRUFBb0M7QUFDaEMsZ0JBQUksR0FBRyxXQUFQLEVBQW9CLEdBQUcsV0FBSCxDQUFlLE9BQUssSUFBcEIsRUFBMEIsT0FBMUIsRUFBcEIsS0FBNkQsR0FBRyxnQkFBSCxDQUFvQixJQUFwQixFQUEwQixPQUExQjtBQUNoRTtBQUNELGlCQUFTLFdBQVQsQ0FBcUIsRUFBckIsRUFBeUIsSUFBekIsRUFBK0IsT0FBL0IsRUFBdUM7QUFDbkM7QUFDQSxnQkFBSSxHQUFHLFdBQVAsRUFBb0IsR0FBRyxXQUFILENBQWUsT0FBSyxJQUFwQixFQUEwQixPQUExQixFQUFwQixLQUE2RCxHQUFHLG1CQUFILENBQXVCLElBQXZCLEVBQTZCLE9BQTdCO0FBQ2hFO0FBQ0QsaUJBQVMsSUFBVCxDQUFjLE9BQWQsRUFBdUIsS0FBdkIsRUFBOEIsRUFBOUIsRUFBa0MsT0FB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TixLQUFjLENBQWYsSUFBb0IsQ0FBakM7QUFDQSxRQUFJLE9BQU8sQ0FBWCxFQUFjLE1BQVMsR0FBVCxVQUFpQixNQUFNLEdBQU4sQ0FBakI7O0FBRWQsTUFBRSxHQUFGLElBQVMsSUFBVDtBQUNJOztBQUVELFNBQU8sQ0FBUDtBQUNILENBZkQ7O0FBaUJBLElBQUksYUFBYSxTQUFiLFVBQWEsQ0FBUyxHQUFULEVBQWM7QUFDM0IsTUFBSSxPQUFPLFNBQVMsYUFBVCxDQUF1QixPQUF2QixDQUFYO0FBQ0EsT0FBSyxTQUFMLEdBQWlCLEdBQWpCO0FBQ0EsV0FBUyxJQUFULENBQWMsV0FBZCxDQUEwQixJQUExQjtBQUNILENBSkQ7O0FBTUEsSUFBSSxRQUFRLFNBQVIsS0FBUSxDQUFTLElBQVQsRUFBZTtBQUN2QixhQUFZO0FBQUEsV0FBTSxLQUFLLGFBQUwsQ0FBbUIsT0FBbkIsRUFBNEIsS0FBNUIsRUFBTjtBQUFBLEdBQVosRUFBdUQsQ0FBdkQ7QUFDSCxDQUZEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG4gICAgSmF2YVNjcmlwdCBhdXRvQ29tcGxldGUgdjEuMC40XG4gICAgQ29weXJpZ2h0IChjKSAyMDE0IFNpbW9uIFN0ZWluYmVyZ2VyIC8gUGl4YWJheVxuICAgIEdpdEh1YjogaHR0cHM6Ly9naXRodWIuY29tL1BpeGFiYXkvSmF2YVNjcmlwdC1hdXRvQ29tcGxldGVcbiAgICBMaWNlbnNlOiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuKi9cblxudmFyIGF1dG9Db21wbGV0ZSA9IChmdW5jdGlvbigpe1xuICAgIC8vIFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIGF1dG9Db21wbGV0ZShvcHRpb25zKXtcbiAgICAgICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKSByZXR1cm47XG5cbiAgICAgICAgLy8gaGVscGVyc1xuICAgICAgICBmdW5jdGlvbiBoYXNDbGFzcyhlbCwgY2xhc3NOYW1lKXsgcmV0dXJuIGVsLmNsYXNzTGlzdCA/IGVsLmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpIDogbmV3IFJlZ0V4cCgnXFxcXGInKyBjbGFzc05hbWUrJ1xcXFxiJykudGVzdChlbC5jbGFzc05hbWUpOyB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkRXZlbnQoZWwsIHR5cGUsIGhhbmRsZXIpe1xuICAgICAgICAgICAgaWYgKGVsLmF0dGFjaEV2ZW50KSBlbC5hdHRhY2hFdmVudCgnb24nK3R5cGUsIGhhbmRsZXIpOyBlbHNlIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZWwsIHR5cGUsIGhhbmRsZXIpe1xuICAgICAgICAgICAgLy8gaWYgKGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpIG5vdCB3b3JraW5nIGluIElFMTFcbiAgICAgICAgICAgIGlmIChlbC5kZXRhY2hFdmVudCkgZWwuZGV0YWNoRXZlbnQoJ29uJyt0eXBlLCBoYW5kbGVyKTsgZWxzZSBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGxpdmUoZWxDbGFzcywgZXZlbnQsIGNiLCBjb250ZXh0KXtcbiAgICAgICAgICAgIGFkZEV2ZW50KGNvbnRleHQgfHwgZG9jdW1lbnQsIGV2ZW50LCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgZm91bmQsIGVsID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbCAmJiAhKGZvdW5kID0gaGFzQ2xhc3MoZWwsIGVsQ2xhc3MpKSkgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkgY2IuY2FsbChlbCwgZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvID0ge1xuICAgICAgICAgICAgc2VsZWN0b3I6IDAsXG4gICAgICAgICAgICBzb3VyY2U6IDAsXG4gICAgICAgICAgICBtaW5DaGFyczogMyxcbiAgICAgICAgICAgIGRlbGF5OiAxNTAsXG4gICAgICAgICAgICBvZmZzZXRMZWZ0OiAwLFxuICAgICAgICAgICAgb2Zmc2V0VG9wOiAxLFxuICAgICAgICAgICAgY2FjaGU6IDEsXG4gICAgICAgICAgICBtZW51Q2xhc3M6ICcnLFxuICAgICAgICAgICAgY29udGFpbmVyOiAnYm9keScsXG4gICAgICAgICAgICByZW5kZXJJdGVtOiBmdW5jdGlvbiAoaXRlbSwgc2VhcmNoKXtcbiAgICAgICAgICAgICAgICAvLyBlc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gICAgICAgICAgICAgICAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFxcW1xcXXt9XS9nLCAnXFxcXCQmJyk7XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIihcIiArIHNlYXJjaC5zcGxpdCgnICcpLmpvaW4oJ3wnKSArIFwiKVwiLCBcImdpXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAnPGRpdiBjbGFzcz1cImF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uXCIgZGF0YS12YWw9XCInICsgaXRlbSArICdcIj4nICsgaXRlbS5yZXBsYWNlKHJlLCBcIjxiPiQxPC9iPlwiKSArICc8L2Rpdj4nO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uU2VsZWN0OiBmdW5jdGlvbihlLCB0ZXJtLCBpdGVtKXt9XG4gICAgICAgIH07XG4gICAgICAgIGZvciAodmFyIGsgaW4gb3B0aW9ucykgeyBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrKSkgb1trXSA9IG9wdGlvbnNba107IH1cblxuICAgICAgICAvLyBpbml0XG4gICAgICAgIHZhciBlbGVtcyA9IHR5cGVvZiBvLnNlbGVjdG9yID09ICdvYmplY3QnID8gW28uc2VsZWN0b3JdIDogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChvLnNlbGVjdG9yKTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPGVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IGVsZW1zW2ldO1xuXG4gICAgICAgICAgICAvLyBjcmVhdGUgc3VnZ2VzdGlvbnMgY29udGFpbmVyIFwic2NcIlxuICAgICAgICAgICAgdGhhdC5zYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgdGhhdC5zYy5jbGFzc05hbWUgPSAnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb25zICcrby5tZW51Q2xhc3M7XG5cbiAgICAgICAgICAgIC8vIElmIGFkZGluZyBpbnRvIGEgcmVzdWx0cyBjb250YWluZXIsIHJlbW92ZSB0aGUgcG9zaXRpb24gYWJzb2x1dGUgY3NzIHN0eWxlc1xuICAgICAgICAgICAgaWYgKG8uY29udGFpbmVyICE9PSBcImJvZHlcIikge1xuICAgICAgICAgICAgICAgIHRoYXQuc2MuY2xhc3NOYW1lID0gdGhhdC5zYy5jbGFzc05hbWUgKyAnIGF1dG9jb21wbGV0ZS1zdWdnZXN0aW9ucy0taW4tY29udGFpbmVyJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhhdC5hdXRvY29tcGxldGVBdHRyID0gdGhhdC5nZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScpO1xuICAgICAgICAgICAgdGhhdC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcbiAgICAgICAgICAgIHRoYXQuY2FjaGUgPSB7fTtcbiAgICAgICAgICAgIHRoYXQubGFzdF92YWwgPSAnJztcblxuICAgICAgICAgICAgdGhhdC51cGRhdGVTQyA9IGZ1bmN0aW9uKHJlc2l6ZSwgbmV4dCl7XG4gICAgICAgICAgICAgICAgdmFyIHJlY3QgPSB0aGF0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgIGlmIChvLmNvbnRhaW5lciA9PT0gJ2JvZHknKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjb250YWluZXIgaXMgbm90IHRoZSBib2R5LCBkbyBub3QgYWJzb2x1dGVseSBwb3NpdGlvbiBpbiB0aGUgd2luZG93LlxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmxlZnQgPSBNYXRoLnJvdW5kKHJlY3QubGVmdCArICh3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQpICsgby5vZmZzZXRMZWZ0KSArICdweCc7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUudG9wID0gTWF0aC5yb3VuZChyZWN0LmJvdHRvbSArICh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCkgKyBvLm9mZnNldFRvcCkgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLndpZHRoID0gTWF0aC5yb3VuZChyZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0KSArICdweCc7IC8vIG91dGVyV2lkdGhcbiAgICAgICAgICAgICAgICBpZiAoIXJlc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoYXQuc2MubWF4SGVpZ2h0KSB7IHRoYXQuc2MubWF4SGVpZ2h0ID0gcGFyc2VJbnQoKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gZ2V0Q29tcHV0ZWRTdHlsZSh0aGF0LnNjLCBudWxsKSA6IHRoYXQuc2MuY3VycmVudFN0eWxlKS5tYXhIZWlnaHQpOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0KSB0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbicpLm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuc2Muc3VnZ2VzdGlvbkhlaWdodClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmV4dCkgdGhhdC5zYy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjclRvcCA9IHRoYXQuc2Muc2Nyb2xsVG9wLCBzZWxUb3AgPSBuZXh0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIHRoYXQuc2MuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxUb3AgKyB0aGF0LnNjLnN1Z2dlc3Rpb25IZWlnaHQgLSB0aGF0LnNjLm1heEhlaWdodCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc2Nyb2xsVG9wID0gc2VsVG9wICsgdGhhdC5zYy5zdWdnZXN0aW9uSGVpZ2h0ICsgc2NyVG9wIC0gdGhhdC5zYy5tYXhIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc2VsVG9wIDwgMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zY3JvbGxUb3AgPSBzZWxUb3AgKyBzY3JUb3A7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkRXZlbnQod2luZG93LCAncmVzaXplJywgdGhhdC51cGRhdGVTQyk7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG8uY29udGFpbmVyKS5hcHBlbmRDaGlsZCh0aGF0LnNjKTtcblxuICAgICAgICAgICAgbGl2ZSgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nLCAnbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBzZWwgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgIGlmIChzZWwpIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7IH0sIDIwKTtcbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICBsaXZlKCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicsICdtb3VzZW92ZXInLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsKSBzZWwuY2xhc3NOYW1lID0gc2VsLmNsYXNzTmFtZS5yZXBsYWNlKCdzZWxlY3RlZCcsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcbiAgICAgICAgICAgIH0sIHRoYXQuc2MpO1xuXG4gICAgICAgICAgICBsaXZlKCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbicsICdtb3VzZWRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICBpZiAoaGFzQ2xhc3ModGhpcywgJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uJykpIHsgLy8gZWxzZSBvdXRzaWRlIGNsaWNrXG4gICAgICAgICAgICAgICAgICAgIHZhciB2ID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudmFsdWUgPSB2O1xuICAgICAgICAgICAgICAgICAgICBvLm9uU2VsZWN0KGUsIHYsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhhdC5zYyk7XG5cbiAgICAgICAgICAgIHRoYXQuYmx1ckhhbmRsZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHRyeSB7IHZhciBvdmVyX3NiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uczpob3ZlcicpOyB9IGNhdGNoKGUpeyB2YXIgb3Zlcl9zYiA9IDA7IH1cbiAgICAgICAgICAgICAgICBpZiAoIW92ZXJfc2IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHRoYXQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2Muc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDM1MCk7IC8vIGhpZGUgc3VnZ2VzdGlvbnMgb24gZmFzdCBpbnB1dFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhhdCAhPT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LmZvY3VzKCk7IH0sIDIwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAnYmx1cicsIHRoYXQuYmx1ckhhbmRsZXIpO1xuXG4gICAgICAgICAgICB2YXIgc3VnZ2VzdCA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSB0aGF0LnZhbHVlO1xuICAgICAgICAgICAgICAgIHRoYXQuY2FjaGVbdmFsXSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoICYmIHZhbC5sZW5ndGggPj0gby5taW5DaGFycykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7aTxkYXRhLmxlbmd0aDtpKyspIHMgKz0gby5yZW5kZXJJdGVtKGRhdGFbaV0sIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2MuaW5uZXJIVE1MID0gcztcbiAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVTQygwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoYXQua2V5ZG93bkhhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gd2luZG93LmV2ZW50ID8gZS5rZXlDb2RlIDogZS53aGljaDtcbiAgICAgICAgICAgICAgICAvLyBkb3duICg0MCksIHVwICgzOClcbiAgICAgICAgICAgICAgICBpZiAoKGtleSA9PSA0MCB8fCBrZXkgPT0gMzgpICYmIHRoYXQuc2MuaW5uZXJIVE1MKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0LCBzZWwgPSB0aGF0LnNjLnF1ZXJ5U2VsZWN0b3IoJy5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbi5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IChrZXkgPT0gNDApID8gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24nKSA6IHRoYXQuc2MuY2hpbGROb2Rlc1t0aGF0LnNjLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV07IC8vIGZpcnN0IDogbGFzdFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dC5jbGFzc05hbWUgKz0gJyBzZWxlY3RlZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gbmV4dC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0ID0gKGtleSA9PSA0MCkgPyBzZWwubmV4dFNpYmxpbmcgOiBzZWwucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwuY2xhc3NOYW1lID0gc2VsLmNsYXNzTmFtZS5yZXBsYWNlKCdzZWxlY3RlZCcsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0LmNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnZhbHVlID0gbmV4dC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdmFsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHsgc2VsLmNsYXNzTmFtZSA9IHNlbC5jbGFzc05hbWUucmVwbGFjZSgnc2VsZWN0ZWQnLCAnJyk7IHRoYXQudmFsdWUgPSB0aGF0Lmxhc3RfdmFsOyBuZXh0ID0gMDsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlU0MoMCwgbmV4dCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gZXNjXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5ID09IDI3KSB7IHRoYXQudmFsdWUgPSB0aGF0Lmxhc3RfdmFsOyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH1cbiAgICAgICAgICAgICAgICAvLyBlbnRlclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PSAxMyB8fCBrZXkgPT0gOSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsID0gdGhhdC5zYy5xdWVyeVNlbGVjdG9yKCcuYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24uc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAmJiB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgIT0gJ25vbmUnKSB7IG8ub25TZWxlY3QoZSwgc2VsLmdldEF0dHJpYnV0ZSgnZGF0YS12YWwnKSwgc2VsKTsgc2V0VGltZW91dChmdW5jdGlvbigpeyB0aGF0LnNjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IH0sIDIwKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhZGRFdmVudCh0aGF0LCAna2V5ZG93bicsIHRoYXQua2V5ZG93bkhhbmRsZXIpO1xuXG4gICAgICAgICAgICB0aGF0LmtleXVwSGFuZGxlciA9IGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSB3aW5kb3cuZXZlbnQgPyBlLmtleUNvZGUgOiBlLndoaWNoO1xuICAgICAgICAgICAgICAgIGlmICgha2V5IHx8IChrZXkgPCAzNSB8fCBrZXkgPiA0MCkgJiYga2V5ICE9IDEzICYmIGtleSAhPSAyNykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gdGhhdC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPj0gby5taW5DaGFycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAhPSB0aGF0Lmxhc3RfdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sYXN0X3ZhbCA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhhdC50aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8uY2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCBpbiB0aGF0LmNhY2hlKSB7IHN1Z2dlc3QodGhhdC5jYWNoZVt2YWxdKTsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIHJlcXVlc3RzIGlmIHByZXZpb3VzIHN1Z2dlc3Rpb25zIHdlcmUgZW1wdHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaT0xOyBpPHZhbC5sZW5ndGgtby5taW5DaGFyczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFydCA9IHZhbC5zbGljZSgwLCB2YWwubGVuZ3RoLWkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnQgaW4gdGhhdC5jYWNoZSAmJiAhdGhhdC5jYWNoZVtwYXJ0XS5sZW5ndGgpIHsgc3VnZ2VzdChbXSk7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IG8uc291cmNlKHZhbCwgc3VnZ2VzdCkgfSwgby5kZWxheSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGFkZEV2ZW50KHRoYXQsICdrZXl1cCcsIHRoYXQua2V5dXBIYW5kbGVyKTtcblxuICAgICAgICAgICAgdGhhdC5mb2N1c0hhbmRsZXIgPSBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgICAgICB0aGF0Lmxhc3RfdmFsID0gJ1xcbic7XG4gICAgICAgICAgICAgICAgdGhhdC5rZXl1cEhhbmRsZXIoZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoIW8ubWluQ2hhcnMpIGFkZEV2ZW50KHRoYXQsICdmb2N1cycsIHRoYXQuZm9jdXNIYW5kbGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHB1YmxpYyBkZXN0cm95IG1ldGhvZFxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSBlbGVtc1tpXTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh3aW5kb3csICdyZXNpemUnLCB0aGF0LnVwZGF0ZVNDKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAnYmx1cicsIHRoYXQuYmx1ckhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHRoYXQsICdmb2N1cycsIHRoYXQuZm9jdXNIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudCh0aGF0LCAna2V5ZG93bicsIHRoYXQua2V5ZG93bkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KHRoYXQsICdrZXl1cCcsIHRoYXQua2V5dXBIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5hdXRvY29tcGxldGVBdHRyKVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgdGhhdC5hdXRvY29tcGxldGVBdHRyKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRoYXQucmVtb3ZlQXR0cmlidXRlKCdhdXRvY29tcGxldGUnKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG8uY29udGFpbmVyKS5yZW1vdmVDaGlsZCh0aGF0LnNjKTtcbiAgICAgICAgICAgICAgICB0aGF0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGF1dG9Db21wbGV0ZTtcbn0pKCk7XG5cbihmdW5jdGlvbigpe1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG4gICAgICAgIGRlZmluZSgnYXV0b0NvbXBsZXRlJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gYXV0b0NvbXBsZXRlOyB9KTtcbiAgICBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvQ29tcGxldGU7XG4gICAgZWxzZVxuICAgICAgICB3aW5kb3cuYXV0b0NvbXBsZXRlID0gYXV0b0NvbXBsZXRlO1xufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubGV0IEF1dG9Db21wbGV0ZSA9IHJlcXVpcmUoJy4vYXV0by1jb21wbGV0ZS5qcycpXG5cbmxldCBUb2NKdW1wZXIgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3Iob3B0KSB7XG5cdHRoaXMuZGF0YSA9IG51bGxcblxuXHR0aGlzLm9wdCA9IHtcblx0ICAgIGlkOiAndG9jX2p1bXBlcicsXG5cdCAgICBzZWxlY3RvcjogJycsXG5cdCAgICB0cmFuc2Zvcm06IG51bGwsXG5cdCAgICBrZXk6ICdpJ1xuXHR9XG5cblx0Zm9yIChsZXQgaWR4IGluIG9wdCkge1x0Ly8gbWVyZ2Vcblx0ICAgIGlmIChvcHQuaGFzT3duUHJvcGVydHkoaWR4KSkgdGhpcy5vcHRbaWR4XSA9IG9wdFtpZHhdXG5cdH1cblx0dGhpcy5sb2cgPSBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUsICdUb2NKdW1wZXI6Jylcblx0dGhpcy5sb2coJ2luaXQnKVxuICAgIH1cblxuICAgIHNjcm9sbCh0ZXJtKSB7XG5cdGlmICh0ZXJtIGluIHRoaXMuZGF0YSkge1xuXHQgICAgdGhpcy5sb2codGVybSlcblx0ICAgIHRoaXMuZGF0YVt0ZXJtXS5zY3JvbGxJbnRvVmlldyh0cnVlKVxuXHR9XG4gICAgfVxuXG4gICAgaG9vaygpIHtcblx0dGhpcy5kYXRhID0gbWFrZV9pbmRleCh0aGlzLm9wdC5zZWxlY3RvciwgdGhpcy5vcHQudHJhbnNmb3JtKVxuXHRjc3NfaW5qZWN0KGBcbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbnMge1xuICB0ZXh0LWFsaWduOiBsZWZ0OyBjdXJzb3I6IGRlZmF1bHQ7IGJvcmRlcjogMXB4IHNvbGlkICNjY2M7IGJvcmRlci10b3A6IDA7IGJhY2tncm91bmQ6IHdoaXRlOyBib3gtc2hhZG93OiAtMXB4IDFweCAzcHggcmdiYSgwLCAwLCAwLCAuMSk7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTsgZGlzcGxheTogbm9uZTsgei1pbmRleDogOTk5OTsgbWF4LWhlaWdodDogMTVlbTsgb3ZlcmZsb3c6IGhpZGRlbjsgb3ZlcmZsb3cteTogYXV0bzsgYm94LXNpemluZzogYm9yZGVyLWJveDtcbn1cbi5hdXRvY29tcGxldGUtc3VnZ2VzdGlvbiB7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7IG92ZXJmbG93OiBoaWRkZW47IHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xufVxuLmF1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLnNlbGVjdGVkIHsgYmFja2dyb3VuZDogI2VlZTsgfVxuXG4jJHt0aGlzLm9wdC5pZH0ge1xuICBib3JkZXI6IDFweCBzb2xpZCAjYTlhOWE5O1xuICBwYWRkaW5nOiAwLjhlbTtcbiAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XG4gIGNvbG9yOiBibGFjaztcbiAgYm94LXNoYWRvdzogMXB4IDFweCAzcHggcmdiYSgwLCAwLCAwLCAuNCk7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgdG9wOiA0ZW07XG4gIHJpZ2h0OiAuNWVtO1xufVxuIyR7dGhpcy5vcHQuaWR9X2Nsb3NlIHtcbiAgbWFyZ2luLWxlZnQ6IDFlbTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xuICBsaW5lLWhlaWdodDogMmVtO1xuICB3aWR0aDogMmVtO1xuICBoZWlnaHQ6IDJlbTtcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xufVxuIyR7dGhpcy5vcHQuaWR9X2Nsb3NlID4gc3BhbiB7XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbn1cbiMke3RoaXMub3B0LmlkfV9jbG9zZTpob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNlODExMjM7XG4gIGNvbG9yOiB3aGl0ZTtcbn1cbmApXG5cdGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuXHQgICAgaWYgKGV2ZW50LnRhcmdldC5ub2RlTmFtZSA9PT0gJ0lOUFVUJykgcmV0dXJuXG5cdCAgICBpZiAoZXZlbnQua2V5ID09PSB0aGlzLm9wdC5rZXkgJiYgIWV2ZW50LmN0cmxLZXkpIHRoaXMuZGxnKClcblx0fSlcbiAgICB9XG5cbiAgICBkbGcoKSB7XG5cdGxldCBub2RlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5vcHQuaWQpXG5cdGlmIChub2RlKSByZXR1cm4gZm9jdXMobm9kZSlcblxuXHRub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jylcblx0bm9kZS5pZCA9IHRoaXMub3B0LmlkXG5cdGxldCBhY19jb250YWluZXIgPSBgJHt0aGlzLm9wdC5pZH1fY29udGFpbmVyYFxuXHRub2RlLmlubmVySFRNTCA9IGA8c3BhbiBpZD1cIiR7YWNfY29udGFpbmVyfVwiPjxpbnB1dCBzaXplPVwiNDBcIiBzcGVsbGNoZWNrPVwiZmFsc2VcIiAvPjwvc3Bhbj5cbjxzcGFuIGlkPVwiJHt0aGlzLm9wdC5pZH1fY2xvc2VcIiB0aXRsZT1cIkNsb3NlXCI+PHNwYW4+JnRpbWVzOzwvc3Bhbj48L3NwYW4+YFxuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpXG5cdGxldCBpbnB1dCA9IG5vZGUucXVlcnlTZWxlY3RvcignaW5wdXQnKVxuXG5cdGxldCBhYyA9IG5ldyBBdXRvQ29tcGxldGUoe1xuXHQgICAgc2VsZWN0b3I6IGlucHV0LFxuXHQgICAgbWluQ2hhcnM6IDEsXG5cdCAgICBkZWxheTogNTAsXG5cdCAgICBjb250YWluZXI6ICcjJyArIGFjX2NvbnRhaW5lcixcblx0ICAgIHNvdXJjZTogKHRlcm0sIHN1Z2dlc3QpID0+IHtcblx0XHRsZXQgbGlzdCA9IFtdXG5cdFx0Zm9yIChsZXQga2V5IGluIHRoaXMuZGF0YSkge1xuXHRcdCAgICBpZiAoa2V5LnRvTG93ZXJDYXNlKCkuaW5kZXhPZih0ZXJtLnRvTG93ZXJDYXNlKCkpICE9PSAtMSlcblx0XHRcdGxpc3QucHVzaChrZXkpXG5cdFx0fVxuXHRcdC8vIFRPRE86IHNvcnQgYnkgcmVsZXZhbmN5XG5cdFx0c3VnZ2VzdChsaXN0KVxuXHQgICAgfSxcblx0ICAgIG9uU2VsZWN0OiAoZXZlbnQsIHRlcm0sIGl0ZW0pID0+IHRoaXMuc2Nyb2xsKHRlcm0pXG5cdH0pXG5cblx0bGV0IGRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcblx0ICAgIGFjLmRlc3Ryb3koKVxuXHQgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChub2RlKVxuXHR9XG5cblx0bm9kZS5xdWVyeVNlbGVjdG9yKGAjJHt0aGlzLm9wdC5pZH1fY2xvc2VgKS5vbmNsaWNrID0gZGVzdHJveVxuXHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcblx0ICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicpIHRoaXMuc2Nyb2xsKGlucHV0LnZhbHVlKVxuXHQgICAgLy8gSUUxMSByZXR1cm5zIFwiRXNjXCIsIENocm9tZSAmIEZpcmVmb3ggcmV0dXJuIFwiRXNjYXBlXCJcblx0ICAgIGlmIChldmVudC5rZXkubWF0Y2goL15Fc2MvKSkgZGVzdHJveSgpXG5cdH0pXG5cblx0Zm9jdXMobm9kZSlcbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUb2NKdW1wZXJcblxubGV0IG1ha2VfaW5kZXggPSBmdW5jdGlvbihzZWxlY3RvciwgdHJhbnNmb3JtKSB7XG4gICAgbGV0IG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcblxuICAgIGxldCByID0ge31cbiAgICBsZXQgY2FjaGUgPSB7fVxuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IG5vZGVzLmxlbmd0aDsgKytpZHgpIHtcblx0bGV0IG5vZGUgPSBub2Rlc1tpZHhdXG5cdGxldCBrZXkgPSB0cmFuc2Zvcm0gPyB0cmFuc2Zvcm0obm9kZS5pbm5lclRleHQpIDogbm9kZS5pbm5lclRleHRcblx0Y2FjaGVba2V5XSA9IChjYWNoZVtrZXldIHx8IDApICsgMVxuXHRpZiAoa2V5IGluIHIpIGtleSA9IGAke2tleX0gPCR7Y2FjaGVba2V5XX0+YFxuXG5cdHJba2V5XSA9IG5vZGVcbiAgICB9XG5cbiAgICByZXR1cm4gclxufVxuXG5sZXQgY3NzX2luamVjdCA9IGZ1bmN0aW9uKGNzcykge1xuICAgIGxldCBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgIG5vZGUuaW5uZXJIVE1MID0gY3NzXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKVxufVxuXG5sZXQgZm9jdXMgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgc2V0VGltZW91dCggKCkgPT4gbm9kZS5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpLmZvY3VzKCksIDEpXG59XG4iXX0=
// ]]>
