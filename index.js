'use strict';

let AutoComplete = require('./auto-complete.js')

let MuttTocJumper = class {
    constructor(opt) {
	this.data = null

	this.opt = {
	    id: 'mutt_toc_jumper',
	    selector: '',
	    transform: null,
	    key: 'i'
	}

	for (let idx in opt) {	// merge
	    if (opt.hasOwnProperty(idx)) this.opt[idx] = opt[idx]
	}
	this.log = console.log.bind(console, 'MuttTocJumper:')
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
	node.style.top = '4em'
	node.style.right = '1em'

	document.body.appendChild(node)
	// TODO: add a close btn
	node.innerHTML = '<input size="40" />'
	let input = node.querySelector('input')

	let ac = new AutoComplete({
	    selector: input,
	    minChars: 1,
	    delay: 50,
	    container: '#' + this.opt.id,
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

	node.addEventListener('keydown', (event) => {
	    if (event.key === 'Enter') this.scroll(input.value)
	    if (event.key === 'Escape') {
		ac.destroy()
		document.body.removeChild(node)
	    }
	})

	focus(node)
    }

}

module.exports = MuttTocJumper

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
