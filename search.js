'use strict';

let index = function(css_expr, transform) {
    let nodes = document.querySelectorAll(css_expr)

    let r = {}
    let names = []
    let cache = {}
    for (let idx = 0; idx < nodes.length; ++idx) {
	let node = nodes[idx]
	let key = transform ? transform(node.innerText) : node.innerText
	cache[key] = (cache[key] || 0) + 1
	if (key in r) key = `${key} <${cache[key]}>`

	r[key] = node
	names.push(key)
    }

    return {
	nodes: r,
	names
    }
}

let dlg = function(options) {
    let id = 'search'
    let node = document.getElementById(id)
    let focus = function() {
	setTimeout( () => node.querySelector('input').focus(), 1)
    }
    if (node) {
	focus()
	return node.querySelector('input')
    }

    node = document.createElement('div')
    node.id = 'search'
    node.style.border = '1px solid #a9a9a9'
    node.style.padding = '0 1em 0 1em'
    node.style.backgroundColor = 'white'
    node.style.color = 'black'
    node.style.boxShadow = '2px 2px 2px rgba(0, 0, 0, 0.4)'
    node.style.position = 'fixed'
    node.style.top = '50%'
    node.style.left = '50%'
    node.style.marginRight = '-50%'
    node.style.transform = 'translate(-50%, -50%)'

    document.body.appendChild(node)
    node.innerHTML = [].concat(
	'<div><p>',
	'<input list="indices" />',
	'<datalist id="indices">',
	options.map( (idx) => `<option value="${idx}"></option>` ),
	'</datalist>',
	'</p></div>'
    ).join("\n")

    node.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') document.body.removeChild(node)
    })

    focus()
    return node.querySelector('input')
}

let headers = index('.titlepage .title',
		    (str) => str.replace(/^[0-9.\s]+/, ''))

let kbd_listen = function(event) {
    if (event.target.nodeName === 'INPUT') return

    if (event.key === 'i' && !event.ctrlKey) {
	dlg(headers.names).addEventListener('input', (node) => {
	    let key = node.target.value
	    if (key in headers.nodes) {
		headers.nodes[key].scrollIntoView(true)
	    }
	})
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('keydown', kbd_listen)
})
