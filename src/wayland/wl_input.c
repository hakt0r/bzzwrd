#include "wayland.h"
#include <assert.h>
#include <stdbool.h>
#include "fdio_full.h"
#include <xkbcommon/xkbcommon.h>


/* handle button maps */

void wlLoadButtonMap(struct wlContext *ctx)
{
	int i;
	char *key;
	int default_map[] = {
		0,
		0x110, /*BTN_LEFT*/
		0x112, /*BTN_MIDDLE*/
		0x111, /*BTN_RIGHT*/
		0x113, /*BTN_SIDE*/
		0x114, /*BTN_EXTRA*/
		0x113, /*BTN_SIDE*/
		0x114, /*BTN_EXTRA*/
	};
	static_assert(sizeof(default_map)/sizeof(*default_map) == WL_INPUT_BUTTON_COUNT, "button map size mismatch");
	for (i = 0; i < WL_INPUT_BUTTON_COUNT; ++i) {
		xasprintf(&key, "button-map/%d", i);
		ctx->input.button_map[i] = default_map[i];
		LOG(stderr, "Set button mapping: %d -> %d", i, ctx->input.button_map[i]);
		free(key);
	}
};


/* Code to track keyboard state for modifier masks
 * because the synergy protocol is less than ideal at sending us modifiers
*/


static bool local_mod_init(struct wlContext *wl_ctx, char *keymap_str) {
	wl_ctx->input.xkb_ctx = xkb_context_new(XKB_CONTEXT_NO_FLAGS);
	if (!wl_ctx->input.xkb_ctx) {
		return false;
	}
	wl_ctx->input.xkb_map = xkb_keymap_new_from_string(wl_ctx->input.xkb_ctx, keymap_str, XKB_KEYMAP_FORMAT_TEXT_V1, XKB_KEYMAP_COMPILE_NO_FLAGS);
	if (!wl_ctx->input.xkb_map) {
		xkb_context_unref(wl_ctx->input.xkb_ctx);
		return false;
	}
	wl_ctx->input.xkb_state = xkb_state_new(wl_ctx->input.xkb_map);
	if (!wl_ctx->input.xkb_state) {
		xkb_map_unref(wl_ctx->input.xkb_map);
		xkb_context_unref(wl_ctx->input.xkb_ctx);
		return false;
	}
	return true;
}

/* and code to handle raw mapping of keys */

static void load_raw_keymap(struct wlContext *ctx)
{
	bool offset_on_explicit = true;
	char **key = NULL, **val = NULL;
	int i, count = 0, offset, lkey, rkey;
	
	if (ctx->input.raw_keymap) {
		free(ctx->input.raw_keymap);
	}
	/* start with the xkb maximum */
	ctx->input.key_count = xkb_keymap_max_keycode(ctx->input.xkb_map) + 1;
	LOG(stderr, "max key: %zu", ctx->input.key_count);
	
	/* initialize everything */
	ctx->input.raw_keymap = xcalloc(ctx->input.key_count, sizeof(*ctx->input.raw_keymap));
	offset = 0;
	LOG(stderr, "Initial raw key offset: %d", offset);
	for (i = 0; i < ctx->input.key_count; ++i) {
		ctx->input.raw_keymap[i] = i + offset;
	}
	
	strfreev(key);
	strfreev(val);
}

static void load_id_keymap(struct wlContext *ctx)
{
	char **key = NULL, **val = NULL;
	int i, count = 0, lkey, rkey;
	
	if (ctx->input.id_keymap) {
		free(ctx->input.id_keymap);
	}
	/* start with the known synergy maximum */
	ctx->input.id_count = 0xF000;
	LOG(stderr, "max key: %zu", ctx->input.id_count);
	
	/* initialize everything */
	ctx->input.id_keymap = xcalloc(ctx->input.id_count, sizeof(*ctx->input.id_keymap));
	/* and set everything as invalid initially, to trigger raw key map */
	if (ctx->input.id_keymap_valid) {
		free(ctx->input.id_keymap_valid);
	}
	ctx->input.id_keymap_valid = xcalloc(ctx->input.id_count, sizeof(*ctx->input.id_keymap_valid));
	
	strfreev(key);
	strfreev(val);
}

int wlKeySetConfigLayout(struct wlContext *ctx)
{
	int ret = 0;

	/* ensure that we've given everything a chance to give us a proper
	   default */
	if (!ctx->kb_map) {
		wl_display_dispatch(ctx->display);
		wl_display_roundtrip(ctx->display);
	}

	char *default_map = ctx->kb_map;
	LOG(stderr, "Will default to map %s", default_map);
	char *keymap_str = default_map ? xstrdup(default_map) : NULL;
	local_mod_init(ctx, keymap_str);
	ret = !ctx->input.key_map(&ctx->input, keymap_str);
	ctx->input.key_press_state_len = 0;
	load_raw_keymap(ctx);
	load_id_keymap(ctx);
	ctx->input.key_press_state = xcalloc(ctx->input.key_press_state_len, sizeof(*ctx->input.key_press_state));
	free(keymap_str);
	return ret;
}

void wlKeyRaw(struct wlContext *ctx, int key, int state)
{
	size_t i;

	/* keep track of raw keystate size */
	if (key >= ctx->input.key_press_state_len) {
		LOG(stderr, "Resizing key press state array from %zu to %zu", ctx->input.key_press_state_len, key + 1);
		ctx->input.key_press_state = xreallocarray (ctx->input.key_press_state, key + 1, sizeof(*ctx->input.key_press_state));
		for (i = ctx->input.key_press_state_len; i < (key + 1); ++i) {
			ctx->input.key_press_state[i] = 0;
		}
		ctx->input.key_press_state_len = key + 1;
	}

	if (!ctx->input.key_press_state[key] && !state) {
		LOG(stderr, "Superfluous release of raw key %d", key);
		return;
	}

	if (key > xkb_keymap_max_keycode(ctx->input.xkb_map)) {
		LOG(stderr, "keycode greater than xkb maximum, mod not tracked");
	} else {
		xkb_state_update_key(ctx->input.xkb_state, key, state);
		xkb_mod_mask_t depressed = xkb_state_serialize_mods(ctx->input.xkb_state, XKB_STATE_MODS_DEPRESSED);
		xkb_mod_mask_t latched = xkb_state_serialize_mods(ctx->input.xkb_state, XKB_STATE_MODS_LATCHED);
		xkb_mod_mask_t locked = xkb_state_serialize_mods(ctx->input.xkb_state, XKB_STATE_MODS_LOCKED);
		xkb_layout_index_t group = xkb_state_serialize_layout(ctx->input.xkb_state, XKB_STATE_LAYOUT_EFFECTIVE);
		LOG(stderr, "Modifiers: depressed: %x latched: %x locked: %x group: %x", depressed, latched, locked, group);
	}

	LOG(stderr, "Keycode: %d, state %d", key, state);
	ctx->input.key_press_state[key] += state ? 1 : -1;
	ctx->input.key(&ctx->input, key, state);
}


void wlKey(struct wlContext *ctx, int key, int id, int state)
{
	int oldkey = key;

	if ((id < ctx->input.id_count) && ctx->input.id_keymap_valid[id]) {
		key = ctx->input.id_keymap[id];
		LOG(stderr, "Key %d remapped to %d by id %d", oldkey, key, id);
	} else {
		if (key >= ctx->input.key_count) {
			LOG(stderr, "Key %d outside configured keymap, dropping", key);
			return;
		}
		key = ctx->input.raw_keymap[key];
		if (key != oldkey) {
			LOG(stderr, "Key %d remapped to %d", oldkey, key);
		}
	}
	if (key == -1) {
		LOG(stderr, "Dropping key mapped to -1");
		return;
	}
	wlKeyRaw(ctx, key, state);
}

void wlKeyReleaseAll(struct wlContext *ctx)
{
	size_t i;
	for (i = 0; i < ctx->input.key_press_state_len; ++i) {
		while (ctx->input.key_press_state[i]) {
			LOG(stderr, "Release all: key %zd, pressed %d times", i, ctx->input.key_press_state[i]);
			wlKeyRaw(ctx, i, 0);
		}
	}
}


void wlMouseRelativeMotion(struct wlContext *ctx, int dx, int dy)
{
	ctx->input.mouse_rel_motion(&ctx->input, dx, dy);
}
void wlMouseMotion(struct wlContext *ctx, int x, int y)
{
	ctx->input.mouse_motion(&ctx->input, x, y);
}
void wlMouseButton(struct wlContext *ctx, int button, int state)
{
	if (button >= WL_INPUT_BUTTON_COUNT) {
		LOG(stderr, "Mouse button %d exceeds maximum %d, dropping", button, WL_INPUT_BUTTON_COUNT);
		return;
	}
	LOG(stderr, "Mouse button: %d (mapped to %d), state: %d", button, ctx->input.button_map[button], state);
	ctx->input.mouse_button(&ctx->input, ctx->input.button_map[button], state);
}
void wlMouseWheel(struct wlContext *ctx, signed short dx, signed short dy)
{
	ctx->input.mouse_wheel(&ctx->input, dx, dy);
}
