/* Generated by wayland-scanner 1.23.1 */

/*
 * SPDX-FileCopyrightText: 2015 Martin Gräßlin
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

#include <stdbool.h>
#include <stdlib.h>
#include <stdint.h>
#include "wayland-util.h"

#ifndef __has_attribute
# define __has_attribute(x) 0  /* Compatibility with non-clang compilers. */
#endif

#if (__has_attribute(visibility) || defined(__GNUC__) && __GNUC__ >= 4)
#define WL_PRIVATE __attribute__ ((visibility("hidden")))
#else
#define WL_PRIVATE
#endif


static const struct wl_interface *fake_input_types[] = {
	NULL,
	NULL,
	NULL,
};

static const struct wl_message org_kde_kwin_fake_input_requests[] = {
	{ "authenticate", "ss", fake_input_types + 0 },
	{ "pointer_motion", "ff", fake_input_types + 0 },
	{ "button", "uu", fake_input_types + 0 },
	{ "axis", "uf", fake_input_types + 0 },
	{ "touch_down", "2uff", fake_input_types + 0 },
	{ "touch_motion", "2uff", fake_input_types + 0 },
	{ "touch_up", "2u", fake_input_types + 0 },
	{ "touch_cancel", "2", fake_input_types + 0 },
	{ "touch_frame", "2", fake_input_types + 0 },
	{ "pointer_motion_absolute", "3ff", fake_input_types + 0 },
	{ "keyboard_key", "4uu", fake_input_types + 0 },
};

WL_PRIVATE const struct wl_interface org_kde_kwin_fake_input_interface = {
	"org_kde_kwin_fake_input", 4,
	11, org_kde_kwin_fake_input_requests,
	0, NULL,
};

