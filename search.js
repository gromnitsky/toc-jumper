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

let inject_css = function(css) {
    let node = document.createElement('style')
    node.innerHTML = css
    document.body.appendChild(node)
}

let dlg = function(data) {
    let id = 'search'		// FIXME
    let node = document.getElementById(id)
    let focus = function() {
	setTimeout( () => node.querySelector('input').focus(), 1)
    }
    if (node) return focus()

    let scroll = function(term) {
	if (term in data.nodes) {
	    console.log(term)
	    data.nodes[term].scrollIntoView(true)
	}
    }

    node = document.createElement('div')
    node.id = id
    node.style.border = '1px solid #a9a9a9'
    node.style.padding = '1em'
    node.style.backgroundColor = 'white'
    node.style.color = 'black'
    node.style.boxShadow = '1px 1px 3px rgba(0, 0, 0, 0.4)'
    node.style.position = 'fixed'
    node.style.top = '50%'
    node.style.left = '50%'
    node.style.marginRight = '-50%'
    node.style.transform = 'translate(-50%, -50%)'
//    node.style.bottom = '2em'
//    node.style.right = '2em'

    document.body.appendChild(node)
    // TODO: add a close btn
    node.innerHTML = `<input />`

    let ac = new autoComplete({
	selector: node.querySelector('input'),
	minChars: 1,
	source: function(term, suggest) {
	    suggest(data.names.filter( (idx) => {
		return idx.match(new RegExp(term, 'i'))
	    }))
	},
	onSelect: (event, term, item) => scroll(term)
    })

    inject_css(`
.autocomplete-suggestions {
    text-align: left; cursor: default; border: 1px solid #ccc; border-top: 0; background: white; box-shadow: -1px 1px 3px rgba(0,0,0,.1);
    position: absolute; display: none; z-index: 9999; max-height: 254px; overflow: hidden; overflow-y: auto; box-sizing: border-box;
}
.autocomplete-suggestion { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.autocomplete-suggestion.selected { background: #eee; }
`)

    node.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
	    document.body.removeChild(node)
	    ac.destroy()
	}
	if (event.key === 'Enter') {
	    let term = node.querySelector('input').value
	    scroll(term)
	}
    })

    focus()
}

let headers = index('.titlepage .title',
		    (str) => str.replace(/^[0-9.\s]+/, ''))

let kbd_listen = function(event) {
    if (event.target.nodeName === 'INPUT') return
    if (event.key === 'i' && !event.ctrlKey) dlg(headers)
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('keydown', kbd_listen)
})
