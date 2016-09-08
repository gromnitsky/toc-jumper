/*
  A modified _.template() from underscore.js.

  Why not use lodash/template? This version is ~5 times smaller.
*/

var noMatch = /(.)^/;
var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
};

var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

var escapeChar = function(match) {
    return '\\' + escapes[match];
};

var templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
};

module.exports = function(text) {
    var settings = templateSettings;

    var matcher = RegExp([
	(settings.escape || noMatch).source,
	(settings.interpolate || noMatch).source,
	(settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
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

    source = "var __t,__p='',__j=Array.prototype.join," +
	"print=function(){__p+=__j.call(arguments,'');};\n" +
	source + 'return __p;\n';

    var render
    try {
	render = new Function(settings.variable || 'obj', source);
    } catch (e) {
	e.source = source;
	throw e;
    }

    var template = function(data) {
	return render.call(this, data);
    };

    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
};
