MODULE_DIRS := datachan_c_module socket_c_module webview_c_module
APP_DIRS    := net webrtc webView wsHttpServer
ALL_DIRS    := $(MODULE_DIRS) $(APP_DIRS)

.DEFAULT_GOAL := all

.PHONY: all clean \
        $(ALL_DIRS) \
        $(addprefix clean-,$(ALL_DIRS))

all: $(APP_DIRS)

ifneq ($(filter clean,$(MAKECMDGOALS)),)

# For `make clean net`, `net` is a clean selector—not a build target.
$(ALL_DIRS):
	@:

else

$(MODULE_DIRS):
	+$(MAKE) -C $@ all

$(APP_DIRS): $(MODULE_DIRS)
	+$(MAKE) -C $@ all

endif


REQUESTED_DIRS := $(filter $(ALL_DIRS),$(MAKECMDGOALS))
CLEAN_DIRS := $(if $(REQUESTED_DIRS),$(REQUESTED_DIRS),$(ALL_DIRS))

clean: $(addprefix clean-,$(CLEAN_DIRS))

define MAKE_CLEAN_RULE
clean-$(1):
	+$(MAKE) -C $(1) clean
endef

$(foreach dir,$(ALL_DIRS),$(eval $(call MAKE_CLEAN_RULE,$(dir))))