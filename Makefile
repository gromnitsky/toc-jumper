.DELETE_ON_ERROR:

NODE_ENV ?= development
out := build.$(NODE_ENV)
npm.root := $(shell npm -g root)

js.src := $(wildcard *.js)
umd := $(out)/mutt_toc_jumper.umd.js

.PHONY: compile
compile:

ifeq ($(NODE_ENV), development)
BROWSERIFY_OPT := -d
endif

$(umd): $(js.src)
	@mkdir -p $(dir $@)
	browserify $(BROWSERIFY_OPT) -s MuttTocJumper index.js -o $@ -t [ $(npm.root)/babelify --presets [ $(npm.root)/babel-preset-es2015 ] ]

compile: $(umd)
