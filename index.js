'use strict';

let fs = require('fs')		// browserify & brfs

let store = require('store')

let template = require('./template')
let AutoComplete = require('./auto-complete.js')

let Movable = class {
    constructor(node, storage_id) {
	this.node = node
	this.offset_x = null
	this.offset_y = null
	this.storage_id = storage_id

	// we ought to specificaly bind mouse* callbacks to this object
	// for addEventListener/removeEventListener
	this.mousedown = this._mousedown.bind(this)
	this.mousemove = this._mousemove.bind(this)
	this.mouseup = this._mouseup.bind(this)

	this.log = console.log.bind(console, 'Movable:')
    }

    position(event) {
	let x = event.clientX - this.offset_x
	let y = event.clientY - this.offset_y

	// TODO: right, bottom
	if (x < 0) x = 0
	if (y < 0) y = 0
	return {x, y}
    }

    move(x, y) {
	this.node.style.left = x + 'px'
	this.node.style.top = y + 'px'
	this.node.style.right = 'auto'
	this.node.style.bottom = 'auto'
    }

    valid_event(event) {
	return (this.node === event.target) && (event.button === 0)
    }

    _mousedown(event) {
	if (!this.valid_event(event)) return
	this.offset_x = event.clientX - this.node.offsetLeft
	this.offset_y = event.clientY - this.node.offsetTop
	this.log(`mousedown, offset_x=${this.offset_x}, offset_y=${this.offset_y}`)
	document.addEventListener('mousemove', this.mousemove)
	this._mousemove(event)
    }

    _mousemove(event) {
	this.node.style.cursor = 'move'
	let p = this.position(event)
	this.move(p.x, p.y)
    }

    // when `force` is true, `event` should be null because we're
    // invoking _mouseup() manually from a completely diff context to
    // forcibly remove mousemove listener.
    _mouseup(event, force) {
	if (!force && !this.valid_event(event)) return
	this.log('mouseup')
	document.removeEventListener('mousemove', this.mousemove)
	this.node.style.cursor = 'default'

	// save the widget position
	if (!this.storage_id || force) return
	let p = this.position(event)
	store.set(this.storage_id, {
	    left: p.x + 'px',
	    top: p.y + 'px',
	    right: 'auto',
	    bottom: 'auto'
	})
	this.log('saved')
    }

    hook() {
	this.node.addEventListener('mousedown', this.mousedown)
	this.node.addEventListener('mouseup', this.mouseup)
    }

    unhook() {
	this.node.removeEventListener('mousedown', this.mousedown)
	this.node.removeEventListener('mouseup', this.mouseup)
	document.removeEventListener('mousemove', this.mousemove)
    }
}

let TocJumper = class {
    constructor(opt) {
	this.data = null

	this.opt = {
	    id: 'toc_jumper',
	    selector: '',
	    transform: null,
	    key: 'i',
	    pref_save: true,

	    top: '4em',
	    right: '.5em',
	    bottom: 'auto',
	    left: 'auto',
	}

	// merge user options
	for (let idx in opt) this.opt[idx] = opt[idx]

	if (this.opt.pref_save) this.opt.storage_id = `toc_jumper--${this.opt.id}`

	this.log = console.log.bind(console, 'TocJumper:')
	this.log('init')
    }

    load_saved_opt() {
	if (!this.opt.storage_id) return
	let saved_opt = store.get(this.opt.storage_id)
	if (saved_opt) {
	    ['top', 'right', 'bottom', 'left']
		.forEach( (idx) => this.opt[idx] = saved_opt[idx] || this.opt[idx] )
	    this.log("loaded saved options")
	}
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
	    // IE11 returns "Esc", Chrome & Firefox return "Escape"
	    if (event.key.match(/^Esc/)) this.movable._mouseup(null, true)
	})
    }

    dlg() {
	let node = document.getElementById(this.opt.id)
	if (node) return focus(node)

	this.load_saved_opt()
	node = document.createElement('div')
	node.id = this.opt.id;
	['top', 'right', 'bottom', 'left']
	    .forEach( (idx) => node.style[idx] = this.opt[idx] )

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

	let destroy = () => {
	    ac.destroy()
	    this.movable.unhook()
	    document.body.removeChild(node)
	}

	node.querySelector(`#${this.opt.id}_close`).onclick = destroy
	node.addEventListener('keydown', (event) => {
	    if (event.key === 'Enter') this.scroll(input.value)
	    // IE11 returns "Esc", Chrome & Firefox return "Escape"
	    if (event.key.match(/^Esc/)) destroy()
	})

	this.movable = new Movable(node, this.opt.storage_id)
	this.movable.hook()

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
