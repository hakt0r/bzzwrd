#include "wayland.h"

struct wlContext wlContext = {0};


void wlIdleInhibit(struct wlContext *ctx, bool on)
{
	fprintf(stderr, "Got idle inhibit request: %s", on ? "on" : "off");
	if (on) {
		if (!ctx->idle.inhibit_start) {
			fprintf(stderr, "No idle inhibition support, ignoring request");
			return;
		}
		ctx->idle.inhibit_start(&ctx->idle);
	} else {
		if (!ctx->idle.inhibit_stop) {
			fprintf(stderr, "No idle inhibition support, ignoring request");
			return;
		}
		ctx->idle.inhibit_stop(&ctx->idle);
	}
}
