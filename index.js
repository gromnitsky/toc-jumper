'use strict';

let AutoComplete = require('./auto-complete.js')

let TocJumper = class {
    constructor(opt) {
	this.data = null

	this.opt = {
	    id: 'toc_jumper',
	    selector: '',
	    transform: null,
	    key: 'i'
	}

	for (let idx in opt) {	// merge
	    if (opt.hasOwnProperty(idx)) this.opt[idx] = opt[idx]
	}
	this.log = console.log.bind(console, 'TocJumper:')
	this.log('init')
    }

    scroll(term) {
	if (term in this.data) {
	    this.log(term)
	    this.data[term].scrollIntoView(true)
	}
    }

    hook() {
	this.data = make_index(this.opt.selector, this.opt.transform)
	css_inject(`
.autocomplete-suggestions {
  text-align: left; cursor: default; border: 1px solid #ccc; border-top: 0; background: white; box-shadow: -1px 1px 3px rgba(0, 0, 0, .1);
  position: absolute; display: none; z-index: 9999; max-height: 15em; overflow: hidden; overflow-y: auto; box-sizing: border-box;
}
.autocomplete-suggestion {
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.autocomplete-suggestion.selected { background: #eee; }
`)
	document.body.addEventListener('keydown', (event) => {
	    if (event.target.nodeName === 'INPUT') return
	    if (event.key === this.opt.key && !event.ctrlKey) this.dlg()
	})
    }

    dlg() {
	let node = document.getElementById(this.opt.id)
	if (node) return focus(node)

	node = document.createElement('div')
	node.id = this.opt.id
	node.style.border = '1px solid #a9a9a9'
	node.style.padding = '0.8em'
	node.style.backgroundColor = 'white'
	node.style.color = 'black'
	node.style.boxShadow = '1px 1px 3px rgba(0, 0, 0, .4)'
	node.style.position = 'fixed'
	node.style.top = '-6em'
	node.style.right = '.5em'
	node.style.transition = 'all 300ms'

	document.body.appendChild(node)
	let ac_container = `${this.opt.id}_container`
	let help_id = `${this.opt.id}_help`
	node.innerHTML = `<span id="${this.opt.id}_close" style="position: absolute; top: .2em; left: .2em; cursor: pointer; font-size: 140%;" title="Close">&otimes;</span>
<p id="${help_id}" style="text-align: right; margin: 0 0 .5em 0;"></p>
<div style="margin-left: 2em;" id="${ac_container}">
<input size="40" spellcheck="false" /></div>`
	setTimeout( () => node.style.transform = 'translateY(150%)', 1)

	let input = node.querySelector('input')
	let help = node.querySelector('#' + help_id)

	let help_focus = function(is_focused) {
	    help.innerHTML = is_focused ? '<kbd>Esc</kbd> - close'
		: '<kbd>i</kbd> - focus'
	}

	input.addEventListener('focus', () => help_focus(true))
	input.addEventListener('blur', () => help_focus())

	let ac = new AutoComplete({
	    selector: input,
	    minChars: 1,
	    delay: 50,
	    container: '#' + ac_container,
	    source: (term, suggest) => {
		let list = []
		for (let key in this.data) {
		    if (key.toLowerCase().indexOf(term.toLowerCase()) !== -1)
			list.push(key)
		}
		// TODO: sort by relevancy
		suggest(list)
	    },
	    onSelect: (event, term, item) => this.scroll(term)
	})

	let destroy = function() {
	    ac.destroy()
	    document.body.removeChild(node)
	}

	node.querySelector(`#${this.opt.id}_close`).onclick = destroy
	node.addEventListener('keydown', (event) => {
	    if (event.key === 'Enter') this.scroll(input.value)
	    // IE11 returns "Esc", Chrome & Firefox return "Escape"
	    if (event.key.match(/^Esc/)) destroy()
	})

	focus(node)
    }

}

module.exports = TocJumper

let make_index = function(selector, transform) {
    let nodes = document.querySelectorAll(selector)

    let r = {}
    let cache = {}
    for (let idx = 0; idx < nodes.length; ++idx) {
	let node = nodes[idx]
	let key = transform ? transform(node.innerText) : node.innerText
	cache[key] = (cache[key] || 0) + 1
	if (key in r) key = `${key} <${cache[key]}>`

	r[key] = node
    }

    return r
}

let css_inject = function(css) {
    let node = document.createElement('style')
    node.innerHTML = css
    document.body.appendChild(node)
}

let focus = function(node) {
    setTimeout( () => node.querySelector('input').focus(), 1)
}
