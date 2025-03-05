#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <time.h>
#include <poll.h>
#include <wayland-client.h>
#include <wayland-client-protocol.h>
#include <sys/mman.h>
#include <errno.h>
#include "wayland.h"
#include <stdbool.h>

// Define error codes that were previously in sig.h
enum sigExitStatus {
    SES_SUCCESS = EXIT_SUCCESS,
    SES_ERROR_GENERIC = 1,
    SES_ERROR_ARGS,
    SES_ERROR_CONFIG,
    SES_ERROR_CONN,
    SES_ERROR_WL,
    SES_ERROR_CLIP,
    SES_ERROR_FATAL,
};

static char *display_strerror(int error)
{
	switch (error) {
		case WL_DISPLAY_ERROR_INVALID_OBJECT:
			return "server couldn't find object";
		case WL_DISPLAY_ERROR_INVALID_METHOD:
			return "method doesn't exist on specified interface or malformed request";
		case WL_DISPLAY_ERROR_NO_MEMORY:
			return "server is out of memory";
		case WL_DISPLAY_ERROR_IMPLEMENTATION:
			return "compositor implementation error";
	}
	return strerror(error);
}

static void wl_log_handler(const char *fmt, va_list ap)
{
	LOG(stderr, "Wayland error: ");
	LOG(stderr, fmt, ap);
	LOG(stderr, "\n");
	LOG(stderr, "Logged wayland errors set to fatal\n");
}

static bool wl_display_flush_base(struct wlContext *ctx)
{
	int error;

	if ((error = wl_display_get_error(ctx->display))) {
		LOG(stderr, "Wayland display error %d: %s\n", error, display_strerror(error));
		return false;
	}

	if (wl_display_flush(ctx->display) == -1) {
		if (errno == EAGAIN) {
			return false;
		} else {
			if ((error = wl_display_get_error(ctx->display))) {
				LOG(stderr, "Wayland display error %d: %s\n", error, display_strerror(error));
			} else {
				LOG(stderr, "No wayland display error, but flush failed\n");
			}
			return false;
		}
	}
	return true;
}

static bool wl_display_flush_block(struct wlContext *ctx)
{
	struct pollfd pfd = {0};
	int pret;

	pfd.fd = wlPrepareFd(ctx);
	pfd.events = POLLOUT;

	pret = poll(&pfd, 1, ctx->timeout);

	if (pret == 1) {
		if (pfd.revents & POLLOUT) {
			if (wl_display_flush_base(ctx)) {
				return true;
			}
			LOG(stderr, "blocking display flush failed\n");
		} else {
			LOG(stderr, "blocking display flush socket unwritable\n");
		}
	} else if (pret == 0) {
		LOG(stderr, "blocking display flush timed out\n");
	} else if (pret == -1)  {
		LOG(stderr, "blocking display poll failed\n");
	}

	return false;
}

void wlDisplayFlush(struct wlContext *ctx)
{
	if (wl_display_flush_base(ctx)) return;
	if (wl_display_flush_block(ctx)) return;
	LOG(stderr, "Display flush failed\n");
}

void wlOutputAppend(struct wlOutput **outputs, struct wl_output *output, struct zxdg_output_v1 *xdg_output, uint32_t wl_name)
{
	struct wlOutput *l;
	struct wlOutput *n = xmalloc(sizeof(*n));
	memset(n, 0, sizeof(*n));
	n->wl_output = output;
	n->xdg_output = xdg_output;
	n->wl_name = wl_name;
	if (!*outputs) {
		*outputs = n;
	} else {
		for (l = *outputs; l->next; l = l->next);
		l->next = n;
	}
}

struct wlOutput *wlOutputGet(struct wlOutput *outputs, struct wl_output *wl_output)
{
	struct wlOutput *l = NULL;
	for (l = outputs; l; l = l->next) {
		if (l->wl_output == wl_output) {
			break;
		}
	}
	return l;
}

struct wlOutput *wlOutputGetXdg(struct wlOutput *outputs, struct zxdg_output_v1 *xdg_output)
{
	struct wlOutput *l = NULL;
	for (l = outputs; l; l = l->next) {
		if (l->xdg_output == xdg_output)
			break;
	}
	return l;
}

struct wlOutput *wlOutputGetWlName(struct wlOutput *outputs, uint32_t wl_name)
{
	struct wlOutput *l = NULL;
	for (l = outputs; l; l = l->next) {
		if (l->wl_name == wl_name)
			break;
	}
	return l;
}

void wlOutputRemove(struct wlOutput **outputs, struct wlOutput *output)
{
	struct wlOutput *prev = NULL;
	if (!outputs)
		return;
	if (*outputs != output) {
		for (prev = *outputs; prev; prev = prev->next) {
			if (prev->next == output)
				break;
		}
		if (!prev) {
			LOG(stderr, "Tried to remove unknown output\n");
			return;
		}
		prev->next = prev->next->next;
	} else {
		*outputs = NULL;
	}
	free(output->name);
	free(output->desc);
	if (output->xdg_output) {
		zxdg_output_v1_destroy(output->xdg_output);
	}
	if (output->wl_output) {
		wl_output_destroy(output->wl_output);
	}
	free(output);
}

static void output_geometry(void *data, struct wl_output *wl_output, int32_t x, int32_t y, int32_t physical_width, int32_t physical_height, int32_t subpixel, const char *make, const char *model, int32_t transform)
{
	struct wlContext *ctx = data;
	struct wlOutput *output = wlOutputGet(ctx->outputs, wl_output);
	if (!output) {
		LOG(stderr, "Output not found\n");
		return;
	}
	LOG(stderr, "Mutating output...\n");
	if (output->have_log_pos) {
		LOG(stderr, "Except not really, because the logical position outweighs this\n");
		return;
	}
	output->complete = false;
	output->x = x;
	output->y = y;

	LOG(stderr, "Got output at position %d,%d\n", x, y);
}

static void output_mode(void *data, struct wl_output *wl_output, uint32_t flags, int32_t width, int32_t height, int32_t refresh)
{
	struct wlContext *ctx = data;
	struct wlOutput *output = wlOutputGet(ctx->outputs, wl_output);
	bool preferred = flags & WL_OUTPUT_MODE_PREFERRED;
	bool current = flags & WL_OUTPUT_MODE_CURRENT;
	LOG(stderr, "Got %smode: %dx%d@%d%s\n", current ? "current " : "", width, height, refresh, preferred ? "*" : "");
	if (!output) {
		LOG(stderr, "Output not found in list\n");
		return;
	}
	if (current) {
		if (!preferred) {
			LOG(stderr, "Not using preferred mode on output -- check config\n");
		}
		LOG(stderr, "Mutating output...\n");
		if (output->have_log_size) {
			LOG(stderr, "Except not really, because the logical size outweighs this\n");
			return;
		}
		output->complete = false;
		output->width = width;
		output->height = height;
	}
}

static void output_scale(void *data, struct wl_output *wl_output, int32_t factor)
{
	struct wlContext *ctx = data;
	struct wlOutput *output = wlOutputGet(ctx->outputs, wl_output);
	LOG(stderr, "Got scale factor for output: %d\n", factor);
	if (!output) {
		LOG(stderr, "Output not found in list\n");
		return;
	}
	LOG(stderr, "Mutating output...\n");
	output->complete = false;
	output->scale = factor;
}

static void output_done(void *data, struct wl_output *wl_output)
{
	struct wlContext *ctx = data;
	struct wlOutput *output = wlOutputGet(ctx->outputs, wl_output);
	if (!output) {
		LOG(stderr, "Output not found in list\n");
		return;
	}
	output->complete = true;
	if (output->name) {
		LOG(stderr, "Output name: %s\n", output->name);
	}
	if (output->desc) {
		LOG(stderr, "Output description: %s\n", output->desc);
	}
	LOG(stderr, "Output updated: %dx%d at %d, %d (scale: %d)\n",
			output->width,
			output->height,
			output->x,
			output->y,
			output->scale);

	/* fire event if all outputs are complete. */
	bool complete = true;
	for (output = ctx->outputs; output; output = output->next) {
		complete = complete && output->complete;
	}
	if (complete) {
		LOG(stderr, "All outputs updated, triggering event\n");
		if (ctx->on_output_update)
			ctx->on_output_update(ctx);
	}
}

static void xdg_output_pos(void *data, struct zxdg_output_v1 *xdg_output, int32_t x, int32_t y)
{
	LOG(stderr, "Got xdg output position: %d, %d\n", x, y);
	struct wlContext *ctx = data;
	struct wlOutput *output = wlOutputGetXdg(ctx->outputs, xdg_output);
	if (!output) {
		LOG(stderr, "Could not find xdg output\n");
		return;
	}
	LOG(stderr, "Mutating output from xdg_output event\n");
	output->complete = false;
	output->have_log_pos = true;
	output->x = x;
	output->y = y;
}

static void xdg_output_size(void *data, struct zxdg_output_v1 *xdg_output, int32_t width, int32_t height)
{
	LOG(stderr, "Got xdg output size: %dx%d\n", width, height);
	struct wlContext *ctx = data;
	struct wlOutput *output = wlOutputGetXdg(ctx->outputs, xdg_output);
	if (!output) {
		LOG(stderr, "Could not find xdg output\n");
		return;
	}
	LOG(stderr, "Mutating output from xdg_output event\n");
	output->complete = false;
	output->have_log_size = true;
	output->width = width;
	output->height = height;
}

static void xdg_output_name(void *data, struct zxdg_output_v1 *xdg_output, const char *name)
{
	LOG(stderr, "Got xdg output name: %s\n", name);
	struct wlContext *ctx = data;
	struct wlOutput *output = wlOutputGetXdg(ctx->outputs, xdg_output);
	if (!output) {
		LOG(stderr, "Could not find xdg output\n");
		return;
	}
	LOG(stderr, "Mutating output from xdg_output event\n");
	output->complete = false;
	if (output->name) {
		free(output->name);
	}
	output->name = xstrdup(name);
}

static void xdg_output_desc(void *data, struct zxdg_output_v1 *xdg_output, const char *desc)
{
	LOG(stderr, "Got xdg output desc: %s\n", desc);
	struct wlContext *ctx = data;
	struct wlOutput *output = wlOutputGetXdg(ctx->outputs, xdg_output);
	if (!output) {
		LOG(stderr, "Could not find xdg output\n");
		return;
	}
	LOG(stderr, "Mutating output from xdg_output event\n");
	output->complete = false;
	if (output->desc) {
		free(output->desc);
	}
	output->desc = xstrdup(desc);
}

static struct zxdg_output_v1_listener xdg_output_listener = {
	.logical_position = xdg_output_pos,
	.logical_size = xdg_output_size,
	.name = xdg_output_name,
	.description = xdg_output_desc,
};

static struct wl_output_listener output_listener = {
	.geometry = output_geometry,
	.mode = output_mode,
	.done = output_done,
	.scale = output_scale
};

static void keyboard_keymap(void *data, struct wl_keyboard *wl_kb, uint32_t format, int32_t fd, uint32_t size)
{
	struct wlContext *ctx = data;
	char *buf = NULL;
	char *map = NULL;
	if (!true) {
		goto cleanup;
	}

	if ((map = mmap(NULL, size, PROT_READ, MAP_PRIVATE, fd, 0)) == MAP_FAILED) {
		LOG(stderr, "Could not map keymap from fd\n");
		goto cleanup;
	}

	buf = xcalloc(size + 1, 1);
	memcpy(buf, map, size);
	free(ctx->kb_map);
	ctx->kb_map = buf;
	buf = NULL;
	LOG(stderr, "Current keymap updated\n");
	free(buf);
	munmap(map, size);
cleanup:
	close(fd);
}

static void keyboard_enter(void *data, struct wl_keyboard *wl_kb, uint32_t serial, struct wl_surface *surface, struct wl_array *keys)
{
}

static void keyboard_leave(void *data, struct wl_keyboard *wl_kb, uint32_t serial, struct wl_surface *surface)
{
}

static void keyboard_key(void *data, struct wl_keyboard *wl_kb, uint32_t serial, uint32_t time, uint32_t key, uint32_t state)
{
}

static void keyboard_mod(void *data, struct wl_keyboard *wl_kb, uint32_t serial, uint32_t mods_depressed, uint32_t mods_latched, uint32_t mods_locked, uint32_t group)
{
}

static void keyboard_rep(void *data, struct wl_keyboard *wl_kb, int32_t rate, int32_t delay)
{
}

static struct wl_keyboard_listener keyboard_listener = {
	.keymap = keyboard_keymap,
	.enter = keyboard_enter,
	.leave = keyboard_leave,
	.key = keyboard_key,
	.modifiers = keyboard_mod,
	.repeat_info = keyboard_rep,
};

static void seat_capabilities(void *data, struct wl_seat *wl_seat, uint32_t caps)
{
	struct wlContext *ctx = data;
	ctx->seat_caps = caps;
	if (caps & WL_SEAT_CAPABILITY_POINTER) {
		LOG(stderr, "Seat has pointer\n");
	}
	if (caps & WL_SEAT_CAPABILITY_KEYBOARD) {
		LOG(stderr, "Seat has keyboard\n");
		ctx->kb = wl_seat_get_keyboard(wl_seat);
		wl_keyboard_add_listener(ctx->kb, &keyboard_listener, ctx);
		wl_display_dispatch(ctx->display);
		wl_display_roundtrip(ctx->display);
	}
}

static void seat_name(void *data, struct wl_seat *seat, const char *name)
{
	LOG(stderr, "Seat name is %s\n", name);
}

static struct wl_seat_listener seat_listener = {
	.capabilities = seat_capabilities,
	.name = seat_name,
};

static void handle_global(void *data, struct wl_registry *registry, uint32_t name, const char *interface, uint32_t version)
{
	struct wlContext *ctx = data;
	struct wl_output *wl_output;
	struct zxdg_output_v1 *xdg_output;
	if (strcmp(interface, wl_seat_interface.name) == 0) {
		ctx->seat = wl_registry_bind(registry, name, &wl_seat_interface, version);
		wl_seat_add_listener(ctx->seat, &seat_listener, ctx);
	} else if (strcmp(interface, zwlr_virtual_pointer_manager_v1_interface.name) == 0) {
		ctx->pointer_manager = wl_registry_bind(registry, name, &zwlr_virtual_pointer_manager_v1_interface, 1);
	} else if (strcmp(interface, zwp_virtual_keyboard_manager_v1_interface.name) == 0) {
		ctx->keyboard_manager = wl_registry_bind(registry, name, &zwp_virtual_keyboard_manager_v1_interface, 1);
	} else if (strcmp(interface, org_kde_kwin_fake_input_interface.name) == 0) {
		ctx->fake_input = wl_registry_bind(registry, name, &org_kde_kwin_fake_input_interface, 4);
	} else if (strcmp(interface, zxdg_output_manager_v1_interface.name) ==0) {
		if (version < 3) {
			LOG(stderr, "xdg-output too old (version %d)\n", version);
			return;
		}
		ctx->output_manager = wl_registry_bind(registry, name, &zxdg_output_manager_v1_interface, 3);
		if (ctx->outputs) {
			for (struct wlOutput *output = ctx->outputs; output; output = output->next) {
				if (!output->xdg_output) {
					output->xdg_output = zxdg_output_manager_v1_get_xdg_output(ctx->output_manager, output->wl_output);
					zxdg_output_v1_add_listener(output->xdg_output, &xdg_output_listener, ctx);
				}
			}
		}
	} else if (strcmp(interface, wl_output_interface.name) == 0) {
		wl_output = wl_registry_bind(registry, name, &wl_output_interface, 2);
		wl_output_add_listener(wl_output, &output_listener, ctx);
		if (ctx->output_manager) {
			xdg_output = zxdg_output_manager_v1_get_xdg_output(ctx->output_manager, wl_output);
			zxdg_output_v1_add_listener(xdg_output, &xdg_output_listener, ctx);
		} else {
			xdg_output = NULL;
		}
		wlOutputAppend(&ctx->outputs, wl_output, xdg_output, name);
	} else if (strcmp(interface, org_kde_kwin_idle_interface.name) == 0) {
		LOG(stderr, "Got idle manager\n");
		ctx->idle_manager = wl_registry_bind(registry, name, &org_kde_kwin_idle_interface, version);
	} else if (strcmp(interface, ext_idle_notifier_v1_interface.name) == 0) {
		LOG(stderr, "Got idle notifier\n");
		ctx->idle_notifier = wl_registry_bind(registry, name, &ext_idle_notifier_v1_interface, version);
	}
}

static void handle_global_remove(void *data, struct wl_registry *registry, uint32_t name)
{
	struct wlContext *ctx = data;
	/* possible objects */
	struct wlOutput *output;
	/* for now we only handle the case of outputs going away */
	output = wlOutputGetWlName(ctx->outputs, name);
	if (output) {
		LOG(stderr, "Lost output %s\n", output->name ? output->name : "");
		wlOutputRemove(&ctx->outputs, output);
		ctx->on_output_update(ctx);
	}
}

static const struct wl_registry_listener registry_listener = {
	.global = handle_global,
	.global_remove = handle_global_remove,
};

uint32_t wlTS(struct wlContext *ctx)
{
	struct timespec ts;
	if (ctx->epoch == -1) {
		ctx->epoch = time(NULL);
	}
	clock_gettime(CLOCK_MONOTONIC, &ts);
	ts.tv_sec -= ctx->epoch;
	return (ts.tv_sec * 1000) + (ts.tv_nsec / 1000000);
}

void wlClose(struct wlContext *ctx)
{
	return;
}

bool wlSetup(struct wlContext *ctx, int width, int height, char *backend)
{
	int fd;
	bool input_init = false;

	wl_log_set_handler_client(&wl_log_handler);
	ctx->timeout = 5000;

	ctx->width = width;
	ctx->height = height;

	const char *wayland_display = getenv("WAYLAND_DISPLAY");

	if (wayland_display) {
		ctx->display = wl_display_connect(wayland_display);
	} else {
		ctx->display = wl_display_connect(NULL);
	}

	if (!ctx->display) {
		LOG(stderr, "Could not connect to display: %s\n", strerror(errno));
		return false;
	}

	ctx->registry = wl_display_get_registry(ctx->display);
	wl_registry_add_listener(ctx->registry, &registry_listener, ctx);
	wl_display_dispatch(ctx->display);
	wl_display_roundtrip(ctx->display);

	/* figure out which compositor we are using */
	fd = wl_display_get_fd(ctx->display);
	ctx->comp_name = osGetPeerProcName(fd);
	LOG(stderr, "Compositor seems to be %s\n", ctx->comp_name);

	if (wlInputInitWlr(ctx)) {
		LOG(stderr, "Using wlroots protocols for virtual input\n");
	} else if (wlInputInitKde(ctx)) {
		LOG(stderr, "Using kde protocols for virtual input\n");
	} else {
		LOG(stderr, "Virtual input not supported by compositor\n");
		return false;
	}
	
	if(wlKeySetConfigLayout(ctx)) {
		LOG(stderr, "Could not configure virtual keyboard\n");
		return false;
	}

	/* initiailize idle inhibition */
	if (true) {
		if (wlIdleInitExt(ctx)) {
			LOG(stderr, "Using ext-idle-notify-v1 idle inhibition protocol\n");
		} else if (wlIdleInitKde(ctx)) {
			LOG(stderr, "Using KDE idle inhibition protocol\n");
		} else if (wlIdleInitGnome(ctx)) {
			LOG(stderr, "Using GNOME idle inhibition through gnome-session-inhibit\n");
		} else {
			LOG(stderr, "No idle inhibition support\n");
		}
	} else {
		LOG(stderr, "Idle inhibition explicitly disabled\n");
	}

	/* set FD_CLOEXEC */
	int flags = fcntl(fd, F_GETFD);
	flags |= FD_CLOEXEC;
	fcntl(fd, F_SETFD, flags);
	return true;
}

void wlResUpdate(struct wlContext *ctx, int width, int height)
{
	ctx->width = width;
	ctx->height = height;
	if (ctx->input.update_geom) {
		ctx->input.update_geom(&ctx->input);
	} else {
		LOG(stderr, "Current output backend does not update input geometry\n");
	}
}

int wlPrepareFd(struct wlContext *ctx)
{
	int fd;

	fd = wl_display_get_fd(ctx->display);
//	while (wl_display_prepare_read(display) != 0) {
//		wl_display_dispatch(display);
//	}
//	wl_display_flush(display);
	return fd;
}

void wlPollProc(struct wlContext *ctx, short revents)
{
	if (revents & POLLIN) {
//		wl_display_cancel_read(display);
		wl_display_dispatch(ctx->display);
	}
	if (revents & POLLHUP) return;
	LOG(stderr, "Lost wayland connection\n");
}

struct wlContext *wlContextNew(void)
{
	struct wlContext *ctx = xcalloc(1, sizeof(*ctx));
	return ctx;
}

void wlContextFree(struct wlContext *ctx)
{
	if (!ctx) return;
	wlClose(ctx);
	free(ctx);
}
