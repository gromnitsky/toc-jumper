.DELETE_ON_ERROR:

out := dist
js.src := $(wildcard *.js)
umd := $(out)/mutt_toc_jumper.umd.js

.PHONY: compile
compile:

$(umd): $(js.src)
	@mkdir -p $(dir $@)
	browserify -s MuttTocJumper index.js -o $@

compile: $(umd)
