#include "wayland.h"
#include <unistd.h>
#include <string.h>

static bool key_map(struct wlInput *input, char *keymap_str)
{
	/* XXX: this is blatantly inadequate */
	LOG(stderr, "KDE does not support xkb keymaps -- use raw-keymap instead\n");
	return true;
}

static void key(struct wlInput *input, int key, int state)
{
	struct org_kde_kwin_fake_input *fake = input->state;
	org_kde_kwin_fake_input_keyboard_key(fake, key - 8, state);
	wlDisplayFlush(input->wl_ctx);
}
static void mouse_rel_motion(struct wlInput *input, int dx, int dy)
{
	struct org_kde_kwin_fake_input *fake = input->state;
	org_kde_kwin_fake_input_pointer_motion(fake, wl_fixed_from_int(dx), wl_fixed_from_int(dy));
	wlDisplayFlush(input->wl_ctx);
}

static void mouse_motion(struct wlInput *input, int x, int y)
{
	struct org_kde_kwin_fake_input *fake = input->state;
	org_kde_kwin_fake_input_pointer_motion_absolute(fake, wl_fixed_from_int(x), wl_fixed_from_int(y));
	wlDisplayFlush(input->wl_ctx);
}

static void mouse_button(struct wlInput *input, int button, int state)
{
	struct org_kde_kwin_fake_input *fake = input->state;
	org_kde_kwin_fake_input_button(fake, button, state);
	wlDisplayFlush(input->wl_ctx);
}

static void mouse_wheel(struct wlInput *input, signed short dx, signed short dy)
{
	struct org_kde_kwin_fake_input *fake = input->state;
	if (dx < 0) {
		org_kde_kwin_fake_input_axis(fake, 1, wl_fixed_from_int(15));
	}else if (dx > 0) {
		org_kde_kwin_fake_input_axis(fake, 1, wl_fixed_from_int(-15));
	}
	if (dy < 0) {
		org_kde_kwin_fake_input_axis(fake, 0, wl_fixed_from_int(15));
	} else if (dy > 0) {
		org_kde_kwin_fake_input_axis(fake, 0, wl_fixed_from_int(-15));
	}
	wlDisplayFlush(input->wl_ctx);
}

bool wlInputInitKde(struct wlContext *ctx)
{
	LOG(stderr, "Trying KDE fake input protocol for input\n");
	if (!(ctx->fake_input)) {
		LOG(stderr, "KDE: Fake input not supported\n");
		return false;
	}
	org_kde_kwin_fake_input_authenticate(ctx->fake_input, "bzzwrd", "control keyboard and mouse with Synergy/Barrier server");
	ctx->input = (struct wlInput) {
		.state = ctx->fake_input,
		.wl_ctx = ctx,
		.mouse_motion = mouse_motion,
		.mouse_rel_motion = mouse_rel_motion,
		.mouse_button = mouse_button,
		.mouse_wheel = mouse_wheel,
		.key = key,
		.key_map = key_map,
	};
	wlLoadButtonMap(ctx);
	LOG(stderr, "Using KDE fake input protocol\n");
	return true;
}

