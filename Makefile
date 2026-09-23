MODULE_DIRS := datachannel_c_module dispatch_c_module socket_c_module webview_c_module
APP_DIRS    := net webrtc webView wsHttpServer
ALL_DIRS    := $(MODULE_DIRS) $(APP_DIRS)

DOCS_DIR := docs
DOCS_STAMP := $(DOCS_DIR)/.jsdoc-stamp

DOCS_INPUTS := \
	jsdoc.json \
	shared_src/cognito.mjs \
	shared_src/httpRequest.mjs \
	shared_src/parseUrl.mjs \
	shared_src/socket.c \
	shared_src/wsClient.mjs \
	shared_src/dc.jsdoc.js \
	shared_src/js_dispatch.c \
	shared_src/priorityChannel.mjs \
	shared_src/socket.jsdoc.js \
	shared_src/wsEndpoint.mjs \
	shared_src/EncodeDecode.mjs \
	shared_src/parseHttpResponse.mjs \
	shared_src/qjsPeer.mjs \
	shared_src/webview.jsdoc.js

.DEFAULT_GOAL := all

.PHONY: all clean docs clean-docs \
        $(ALL_DIRS) \
        $(addprefix clean-,$(ALL_DIRS))

all: $(APP_DIRS)

clean-docs:
	rm -rf $(DOCS_DIR)/*
	rm -f $(DOCS_STAMP)

ifneq ($(filter clean,$(MAKECMDGOALS)),)

# For `make clean net`, `net` is a clean selector—not a build target.
$(ALL_DIRS) docs:
	@:

else

$(MODULE_DIRS):
	+$(MAKE) -C $@ all

$(APP_DIRS): $(MODULE_DIRS)
	+$(MAKE) -C $@ all

docs: $(DOCS_STAMP)

$(DOCS_STAMP): $(DOCS_INPUTS)
	npx jsdoc -c jsdoc.json -r shared_src
	@touch $@

endif

CLEANABLE_DIRS := $(ALL_DIRS) docs
REQUESTED_DIRS := $(filter $(CLEANABLE_DIRS),$(MAKECMDGOALS))
CLEAN_DIRS := $(if $(REQUESTED_DIRS),$(REQUESTED_DIRS),$(CLEANABLE_DIRS))

clean: $(addprefix clean-,$(CLEAN_DIRS))

define MAKE_CLEAN_RULE
clean-$(1):
	+$(MAKE) -C $(1) clean
endef

$(foreach dir,$(ALL_DIRS),$(eval $(call MAKE_CLEAN_RULE,$(dir))))