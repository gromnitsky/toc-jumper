let assert = require('assert')
let TocJumper = require('../index.js')

suite('Toc Jumper', function() {
    setup(function() {
    })

    test('sort 2', function() {
	assert.deepEqual([], TocJumper.sort([]))

	assert.deepEqual(['foo', 'foobar', 'barfoo'],
			 TocJumper.sort(['barfoo', 'foo', 'foobar'], 'foo'))

    })
})
