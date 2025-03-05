#include "wayland.h"

struct wlContext wlContext = {0};


void wlIdleInhibit(struct wlContext *ctx, bool on)
{
	LOG(stderr, "Got idle inhibit request: %s", on ? "on" : "off");
	if (on) {
		if (!ctx->idle.inhibit_start) {
			LOG(stderr, "No idle inhibition support, ignoring request");
			return;
		}
		ctx->idle.inhibit_start(&ctx->idle);
	} else {
		if (!ctx->idle.inhibit_stop) {
			LOG(stderr, "No idle inhibition support, ignoring request");
			return;
		}
		ctx->idle.inhibit_stop(&ctx->idle);
	}
}
