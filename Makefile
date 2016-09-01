.DELETE_ON_ERROR:

NODE_ENV ?= development
out := dist
npm.root := $(shell npm -g root)

js.src := $(wildcard *.js)
umd := $(out)/toc-jumper.$(NODE_ENV).js
babel.presets := es2015

.PHONY: compile
compile:

ifeq ($(NODE_ENV), development)
BROWSERIFY_OPT := -d
endif

ifeq ($(NODE_ENV), min)
babel.presets += babili
endif

get-babel-presets = $(foreach idx,$(1),$(npm.root)/babel-preset-$(idx))

$(umd): $(js.src)
	@mkdir -p $(dir $@)
	browserify $(BROWSERIFY_OPT) -s TocJumper index.js -o $@ -t [ $(npm.root)/babelify --presets [ $(call get-babel-presets,$(babel.presets)) ] ]

compile: $(umd)


.PHONY: release
release:
	NODE_ENV=development $(MAKE)
	NODE_ENV=min $(MAKE)
