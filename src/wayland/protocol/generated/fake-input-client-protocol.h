/* Generated by wayland-scanner 1.23.1 */

#ifndef FAKE_INPUT_CLIENT_PROTOCOL_H
#define FAKE_INPUT_CLIENT_PROTOCOL_H

#include <stdint.h>
#include <stddef.h>
#include "wayland-client.h"

#ifdef  __cplusplus
extern "C" {
#endif

/**
 * @page page_fake_input The fake_input protocol
 * @section page_ifaces_fake_input Interfaces
 * - @subpage page_iface_org_kde_kwin_fake_input - Fake input manager
 * @section page_copyright_fake_input Copyright
 * <pre>
 *
 * SPDX-FileCopyrightText: 2015 Martin Gräßlin
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later
 * </pre>
 */
struct org_kde_kwin_fake_input;

#ifndef ORG_KDE_KWIN_FAKE_INPUT_INTERFACE
#define ORG_KDE_KWIN_FAKE_INPUT_INTERFACE
/**
 * @page page_iface_org_kde_kwin_fake_input org_kde_kwin_fake_input
 * @section page_iface_org_kde_kwin_fake_input_desc Description
 *
 * This interface allows other processes to provide fake input events.
 * Purpose is on the one hand side to provide testing facilities like XTest on X11.
 * But also to support use case like kdeconnect's mouse pad interface.
 *
 * A compositor should not trust the input received from this interface.
 * Clients should not expect that the compositor honors the requests from this
 * interface.
 * @section page_iface_org_kde_kwin_fake_input_api API
 * See @ref iface_org_kde_kwin_fake_input.
 */
/**
 * @defgroup iface_org_kde_kwin_fake_input The org_kde_kwin_fake_input interface
 *
 * This interface allows other processes to provide fake input events.
 * Purpose is on the one hand side to provide testing facilities like XTest on X11.
 * But also to support use case like kdeconnect's mouse pad interface.
 *
 * A compositor should not trust the input received from this interface.
 * Clients should not expect that the compositor honors the requests from this
 * interface.
 */
extern const struct wl_interface org_kde_kwin_fake_input_interface;
#endif

#define ORG_KDE_KWIN_FAKE_INPUT_AUTHENTICATE 0
#define ORG_KDE_KWIN_FAKE_INPUT_POINTER_MOTION 1
#define ORG_KDE_KWIN_FAKE_INPUT_BUTTON 2
#define ORG_KDE_KWIN_FAKE_INPUT_AXIS 3
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_DOWN 4
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_MOTION 5
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_UP 6
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_CANCEL 7
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_FRAME 8
#define ORG_KDE_KWIN_FAKE_INPUT_POINTER_MOTION_ABSOLUTE 9
#define ORG_KDE_KWIN_FAKE_INPUT_KEYBOARD_KEY 10


/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_AUTHENTICATE_SINCE_VERSION 1
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_POINTER_MOTION_SINCE_VERSION 1
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_BUTTON_SINCE_VERSION 1
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_AXIS_SINCE_VERSION 1
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_DOWN_SINCE_VERSION 2
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_MOTION_SINCE_VERSION 2
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_UP_SINCE_VERSION 2
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_CANCEL_SINCE_VERSION 2
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_TOUCH_FRAME_SINCE_VERSION 2
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_POINTER_MOTION_ABSOLUTE_SINCE_VERSION 3
/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
#define ORG_KDE_KWIN_FAKE_INPUT_KEYBOARD_KEY_SINCE_VERSION 4

/** @ingroup iface_org_kde_kwin_fake_input */
static inline void
org_kde_kwin_fake_input_set_user_data(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, void *user_data)
{
	wl_proxy_set_user_data((struct wl_proxy *) org_kde_kwin_fake_input, user_data);
}

/** @ingroup iface_org_kde_kwin_fake_input */
static inline void *
org_kde_kwin_fake_input_get_user_data(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input)
{
	return wl_proxy_get_user_data((struct wl_proxy *) org_kde_kwin_fake_input);
}

static inline uint32_t
org_kde_kwin_fake_input_get_version(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input)
{
	return wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input);
}

/** @ingroup iface_org_kde_kwin_fake_input */
static inline void
org_kde_kwin_fake_input_destroy(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input)
{
	wl_proxy_destroy((struct wl_proxy *) org_kde_kwin_fake_input);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 *
 * A client should use this request to tell the compositor why it wants to
 * use this interface. The compositor might use the information to decide
 * whether it wants to grant the request. The data might also be passed to
 * the user to decide whether the application should get granted access to
 * this very privileged interface.
 */
static inline void
org_kde_kwin_fake_input_authenticate(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, const char *application, const char *reason)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_AUTHENTICATE, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, application, reason);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
static inline void
org_kde_kwin_fake_input_pointer_motion(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, wl_fixed_t delta_x, wl_fixed_t delta_y)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_POINTER_MOTION, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, delta_x, delta_y);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
static inline void
org_kde_kwin_fake_input_button(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, uint32_t button, uint32_t state)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_BUTTON, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, button, state);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
static inline void
org_kde_kwin_fake_input_axis(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, uint32_t axis, wl_fixed_t value)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_AXIS, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, axis, value);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 *
 * A client should use this request to send touch down event at specific
 * coordinates.
 */
static inline void
org_kde_kwin_fake_input_touch_down(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, uint32_t id, wl_fixed_t x, wl_fixed_t y)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_TOUCH_DOWN, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, id, x, y);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 *
 * A client should use this request to send touch motion to specific position.
 */
static inline void
org_kde_kwin_fake_input_touch_motion(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, uint32_t id, wl_fixed_t x, wl_fixed_t y)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_TOUCH_MOTION, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, id, x, y);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 *
 * A client should use this request to send touch up event.
 */
static inline void
org_kde_kwin_fake_input_touch_up(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, uint32_t id)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_TOUCH_UP, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, id);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 *
 * A client should use this request to cancel the current
 * touch event.
 */
static inline void
org_kde_kwin_fake_input_touch_cancel(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_TOUCH_CANCEL, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 *
 * A client should use this request to send touch frame event.
 */
static inline void
org_kde_kwin_fake_input_touch_frame(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_TOUCH_FRAME, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
static inline void
org_kde_kwin_fake_input_pointer_motion_absolute(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, wl_fixed_t x, wl_fixed_t y)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_POINTER_MOTION_ABSOLUTE, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, x, y);
}

/**
 * @ingroup iface_org_kde_kwin_fake_input
 */
static inline void
org_kde_kwin_fake_input_keyboard_key(struct org_kde_kwin_fake_input *org_kde_kwin_fake_input, uint32_t button, uint32_t state)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_fake_input,
			 ORG_KDE_KWIN_FAKE_INPUT_KEYBOARD_KEY, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_fake_input), 0, button, state);
}

#ifdef  __cplusplus
}
#endif

#endif
