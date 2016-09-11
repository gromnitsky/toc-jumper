# toc-jumper

Look up a string in the TOC of some HTML manual and go to that entry.
Loosely based on `(Info-index)` idea from the Emacs `Info-mode`.

The example for the huge [Mutt](http://www.mutt.org/) manual:

![A screenshot of running toc-jump](https://raw.github.com/gromnitsky/toc-jumper/master/test/screenshot1.png)

To see it in action, clone the repo, open `test/manual.html` in a
browser & press <kbd>i</kbd>.

## Quick start

~~~
<script src="toc-jumper.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
	let tj = new TocJumper({ selector: 'h1,h2,h3,h4' })
	tj.hook()
})
</script>
~~~

No external dependencies needed.

You can also set a custom initial position of the widget:

	new TocJumper({ selector: '...',
                    top: '1em', right: 'auto', left: '5%' })

By default it's  `top: '4em', right: '.5em'`.


## Compilation

Firstly, you'll need browserify, babelify & babel-preset-es2015
installed _globally_. Then

	$ npm i
	$ make release

creates both development & production builds in `dist/`.

It uses a modified version of
[autoComplete](https://goodies.pixabay.com/javascript/auto-complete/demo.html),
so don't try to replace it w/ some npm dependency.

## License

MIT.
