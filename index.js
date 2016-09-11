'use strict';

let fs = require('fs')		// browserify & brfs
let template = require('./template')
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
	css_inject({ id: this.opt.id })
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
	let ac_container = `${this.opt.id}_container`
	node.innerHTML = `<span id="${ac_container}"><input size="40" spellcheck="false" /></span>
<span id="${this.opt.id}_close" title="Close"><span>&times;</span></span>`
	document.body.appendChild(node)
	let input = node.querySelector('input')

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
		suggest(TocJumper.sort(list, term))
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

    static sort(arr, term) {
	return arr.sort( (a, b) => {
	    if (a.slice(0, term.length) === term) return -1
	    if (b.slice(0, term.length) === term) return 1
	    return a.localeCompare(b)
	})
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

let css_inject = function(data) {
    let node = document.createElement('style')
    let tmpl = template(fs.readFileSync(__dirname + '/index.css', 'utf8'))
    node.innerHTML = tmpl(data)
    document.body.appendChild(node)
}

let focus = function(node) {
    setTimeout( () => node.querySelector('input').focus(), 1)
}
