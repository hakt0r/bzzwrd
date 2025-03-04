/* Generated by wayland-scanner 1.23.1 */

#ifndef XDG_OUTPUT_UNSTABLE_V1_CLIENT_PROTOCOL_H
#define XDG_OUTPUT_UNSTABLE_V1_CLIENT_PROTOCOL_H

#include <stdint.h>
#include <stddef.h>
#include "wayland-client.h"

#ifdef  __cplusplus
extern "C" {
#endif

/**
 * @page page_xdg_output_unstable_v1 The xdg_output_unstable_v1 protocol
 * Protocol to describe output regions
 *
 * @section page_desc_xdg_output_unstable_v1 Description
 *
 * This protocol aims at describing outputs in a way which is more in line
 * with the concept of an output on desktop oriented systems.
 *
 * Some information are more specific to the concept of an output for
 * a desktop oriented system and may not make sense in other applications,
 * such as IVI systems for example.
 *
 * Typically, the global compositor space on a desktop system is made of
 * a contiguous or overlapping set of rectangular regions.
 *
 * Some of the information provided in this protocol might be identical
 * to their counterparts already available from wl_output, in which case
 * the information provided by this protocol should be preferred to their
 * equivalent in wl_output. The goal is to move the desktop specific
 * concepts (such as output location within the global compositor space,
 * the connector name and types, etc.) out of the core wl_output protocol.
 *
 * Warning! The protocol described in this file is experimental and
 * backward incompatible changes may be made. Backward compatible
 * changes may be added together with the corresponding interface
 * version bump.
 * Backward incompatible changes are done by bumping the version
 * number in the protocol and interface names and resetting the
 * interface version. Once the protocol is to be declared stable,
 * the 'z' prefix and the version number in the protocol and
 * interface names are removed and the interface version number is
 * reset.
 *
 * @section page_ifaces_xdg_output_unstable_v1 Interfaces
 * - @subpage page_iface_zxdg_output_manager_v1 - manage xdg_output objects
 * - @subpage page_iface_zxdg_output_v1 - compositor logical output region
 * @section page_copyright_xdg_output_unstable_v1 Copyright
 * <pre>
 *
 * Copyright © 2017 Red Hat Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice (including the next
 * paragraph) shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * </pre>
 */
struct wl_output;
struct zxdg_output_manager_v1;
struct zxdg_output_v1;

#ifndef ZXDG_OUTPUT_MANAGER_V1_INTERFACE
#define ZXDG_OUTPUT_MANAGER_V1_INTERFACE
/**
 * @page page_iface_zxdg_output_manager_v1 zxdg_output_manager_v1
 * @section page_iface_zxdg_output_manager_v1_desc Description
 *
 * A global factory interface for xdg_output objects.
 * @section page_iface_zxdg_output_manager_v1_api API
 * See @ref iface_zxdg_output_manager_v1.
 */
/**
 * @defgroup iface_zxdg_output_manager_v1 The zxdg_output_manager_v1 interface
 *
 * A global factory interface for xdg_output objects.
 */
extern const struct wl_interface zxdg_output_manager_v1_interface;
#endif
#ifndef ZXDG_OUTPUT_V1_INTERFACE
#define ZXDG_OUTPUT_V1_INTERFACE
/**
 * @page page_iface_zxdg_output_v1 zxdg_output_v1
 * @section page_iface_zxdg_output_v1_desc Description
 *
 * An xdg_output describes part of the compositor geometry.
 *
 * This typically corresponds to a monitor that displays part of the
 * compositor space.
 *
 * For objects version 3 onwards, after all xdg_output properties have been
 * sent (when the object is created and when properties are updated), a
 * wl_output.done event is sent. This allows changes to the output
 * properties to be seen as atomic, even if they happen via multiple events.
 * @section page_iface_zxdg_output_v1_api API
 * See @ref iface_zxdg_output_v1.
 */
/**
 * @defgroup iface_zxdg_output_v1 The zxdg_output_v1 interface
 *
 * An xdg_output describes part of the compositor geometry.
 *
 * This typically corresponds to a monitor that displays part of the
 * compositor space.
 *
 * For objects version 3 onwards, after all xdg_output properties have been
 * sent (when the object is created and when properties are updated), a
 * wl_output.done event is sent. This allows changes to the output
 * properties to be seen as atomic, even if they happen via multiple events.
 */
extern const struct wl_interface zxdg_output_v1_interface;
#endif

#define ZXDG_OUTPUT_MANAGER_V1_DESTROY 0
#define ZXDG_OUTPUT_MANAGER_V1_GET_XDG_OUTPUT 1


/**
 * @ingroup iface_zxdg_output_manager_v1
 */
#define ZXDG_OUTPUT_MANAGER_V1_DESTROY_SINCE_VERSION 1
/**
 * @ingroup iface_zxdg_output_manager_v1
 */
#define ZXDG_OUTPUT_MANAGER_V1_GET_XDG_OUTPUT_SINCE_VERSION 1

/** @ingroup iface_zxdg_output_manager_v1 */
static inline void
zxdg_output_manager_v1_set_user_data(struct zxdg_output_manager_v1 *zxdg_output_manager_v1, void *user_data)
{
	wl_proxy_set_user_data((struct wl_proxy *) zxdg_output_manager_v1, user_data);
}

/** @ingroup iface_zxdg_output_manager_v1 */
static inline void *
zxdg_output_manager_v1_get_user_data(struct zxdg_output_manager_v1 *zxdg_output_manager_v1)
{
	return wl_proxy_get_user_data((struct wl_proxy *) zxdg_output_manager_v1);
}

static inline uint32_t
zxdg_output_manager_v1_get_version(struct zxdg_output_manager_v1 *zxdg_output_manager_v1)
{
	return wl_proxy_get_version((struct wl_proxy *) zxdg_output_manager_v1);
}

/**
 * @ingroup iface_zxdg_output_manager_v1
 *
 * Using this request a client can tell the server that it is not
 * going to use the xdg_output_manager object anymore.
 *
 * Any objects already created through this instance are not affected.
 */
static inline void
zxdg_output_manager_v1_destroy(struct zxdg_output_manager_v1 *zxdg_output_manager_v1)
{
	wl_proxy_marshal_flags((struct wl_proxy *) zxdg_output_manager_v1,
			 ZXDG_OUTPUT_MANAGER_V1_DESTROY, NULL, wl_proxy_get_version((struct wl_proxy *) zxdg_output_manager_v1), WL_MARSHAL_FLAG_DESTROY);
}

/**
 * @ingroup iface_zxdg_output_manager_v1
 *
 * This creates a new xdg_output object for the given wl_output.
 */
static inline struct zxdg_output_v1 *
zxdg_output_manager_v1_get_xdg_output(struct zxdg_output_manager_v1 *zxdg_output_manager_v1, struct wl_output *output)
{
	struct wl_proxy *id;

	id = wl_proxy_marshal_flags((struct wl_proxy *) zxdg_output_manager_v1,
			 ZXDG_OUTPUT_MANAGER_V1_GET_XDG_OUTPUT, &zxdg_output_v1_interface, wl_proxy_get_version((struct wl_proxy *) zxdg_output_manager_v1), 0, NULL, output);

	return (struct zxdg_output_v1 *) id;
}

/**
 * @ingroup iface_zxdg_output_v1
 * @struct zxdg_output_v1_listener
 */
struct zxdg_output_v1_listener {
	/**
	 * position of the output within the global compositor space
	 *
	 * The position event describes the location of the wl_output
	 * within the global compositor space.
	 *
	 * The logical_position event is sent after creating an xdg_output
	 * (see xdg_output_manager.get_xdg_output) and whenever the
	 * location of the output changes within the global compositor
	 * space.
	 * @param x x position within the global compositor space
	 * @param y y position within the global compositor space
	 */
	void (*logical_position)(void *data,
				 struct zxdg_output_v1 *zxdg_output_v1,
				 int32_t x,
				 int32_t y);
	/**
	 * size of the output in the global compositor space
	 *
	 * The logical_size event describes the size of the output in the
	 * global compositor space.
	 *
	 * For example, a surface without any buffer scale, transformation
	 * nor rotation set, with the size matching the logical_size will
	 * have the same size as the corresponding output when displayed.
	 *
	 * Most regular Wayland clients should not pay attention to the
	 * logical size and would rather rely on xdg_shell interfaces.
	 *
	 * Some clients such as Xwayland, however, need this to configure
	 * their surfaces in the global compositor space as the compositor
	 * may apply a different scale from what is advertised by the
	 * output scaling property (to achieve fractional scaling, for
	 * example).
	 *
	 * For example, for a wl_output mode 3840×2160 and a scale factor
	 * 2:
	 *
	 * - A compositor not scaling the surface buffers will advertise a
	 * logical size of 3840×2160,
	 *
	 * - A compositor automatically scaling the surface buffers will
	 * advertise a logical size of 1920×1080,
	 *
	 * - A compositor using a fractional scale of 1.5 will advertise a
	 * logical size to 2560×1620.
	 *
	 * For example, for a wl_output mode 1920×1080 and a 90 degree
	 * rotation, the compositor will advertise a logical size of
	 * 1080x1920.
	 *
	 * The logical_size event is sent after creating an xdg_output (see
	 * xdg_output_manager.get_xdg_output) and whenever the logical size
	 * of the output changes, either as a result of a change in the
	 * applied scale or because of a change in the corresponding output
	 * mode(see wl_output.mode) or transform (see wl_output.transform).
	 * @param width width in global compositor space
	 * @param height height in global compositor space
	 */
	void (*logical_size)(void *data,
			     struct zxdg_output_v1 *zxdg_output_v1,
			     int32_t width,
			     int32_t height);
	/**
	 * all information about the output have been sent
	 *
	 * This event is sent after all other properties of an xdg_output
	 * have been sent.
	 *
	 * This allows changes to the xdg_output properties to be seen as
	 * atomic, even if they happen via multiple events.
	 *
	 * For objects version 3 onwards, this event is deprecated.
	 * Compositors are not required to send it anymore and must send
	 * wl_output.done instead.
	 */
	void (*done)(void *data,
		     struct zxdg_output_v1 *zxdg_output_v1);
	/**
	 * name of this output
	 *
	 * Many compositors will assign names to their outputs, show them
	 * to the user, allow them to be configured by name, etc. The
	 * client may wish to know this name as well to offer the user
	 * similar behaviors.
	 *
	 * The naming convention is compositor defined, but limited to
	 * alphanumeric characters and dashes (-). Each name is unique
	 * among all wl_output globals, but if a wl_output global is
	 * destroyed the same name may be reused later. The names will also
	 * remain consistent across sessions with the same hardware and
	 * software configuration.
	 *
	 * Examples of names include 'HDMI-A-1', 'WL-1', 'X11-1', etc.
	 * However, do not assume that the name is a reflection of an
	 * underlying DRM connector, X11 connection, etc.
	 *
	 * The name event is sent after creating an xdg_output (see
	 * xdg_output_manager.get_xdg_output). This event is only sent once
	 * per xdg_output, and the name does not change over the lifetime
	 * of the wl_output global.
	 * @param name output name
	 * @since 2
	 */
	void (*name)(void *data,
		     struct zxdg_output_v1 *zxdg_output_v1,
		     const char *name);
	/**
	 * human-readable description of this output
	 *
	 * Many compositors can produce human-readable descriptions of
	 * their outputs. The client may wish to know this description as
	 * well, to communicate the user for various purposes.
	 *
	 * The description is a UTF-8 string with no convention defined for
	 * its contents. Examples might include 'Foocorp 11" Display' or
	 * 'Virtual X11 output via :1'.
	 *
	 * The description event is sent after creating an xdg_output (see
	 * xdg_output_manager.get_xdg_output) and whenever the description
	 * changes. The description is optional, and may not be sent at
	 * all.
	 *
	 * For objects of version 2 and lower, this event is only sent once
	 * per xdg_output, and the description does not change over the
	 * lifetime of the wl_output global.
	 * @param description output description
	 * @since 2
	 */
	void (*description)(void *data,
			    struct zxdg_output_v1 *zxdg_output_v1,
			    const char *description);
};

/**
 * @ingroup iface_zxdg_output_v1
 */
static inline int
zxdg_output_v1_add_listener(struct zxdg_output_v1 *zxdg_output_v1,
			    const struct zxdg_output_v1_listener *listener, void *data)
{
	return wl_proxy_add_listener((struct wl_proxy *) zxdg_output_v1,
				     (void (**)(void)) listener, data);
}

#define ZXDG_OUTPUT_V1_DESTROY 0

/**
 * @ingroup iface_zxdg_output_v1
 */
#define ZXDG_OUTPUT_V1_LOGICAL_POSITION_SINCE_VERSION 1
/**
 * @ingroup iface_zxdg_output_v1
 */
#define ZXDG_OUTPUT_V1_LOGICAL_SIZE_SINCE_VERSION 1
/**
 * @ingroup iface_zxdg_output_v1
 */
#define ZXDG_OUTPUT_V1_DONE_SINCE_VERSION 1
/**
 * @ingroup iface_zxdg_output_v1
 */
#define ZXDG_OUTPUT_V1_NAME_SINCE_VERSION 2
/**
 * @ingroup iface_zxdg_output_v1
 */
#define ZXDG_OUTPUT_V1_DESCRIPTION_SINCE_VERSION 2

/**
 * @ingroup iface_zxdg_output_v1
 */
#define ZXDG_OUTPUT_V1_DESTROY_SINCE_VERSION 1

/** @ingroup iface_zxdg_output_v1 */
static inline void
zxdg_output_v1_set_user_data(struct zxdg_output_v1 *zxdg_output_v1, void *user_data)
{
	wl_proxy_set_user_data((struct wl_proxy *) zxdg_output_v1, user_data);
}

/** @ingroup iface_zxdg_output_v1 */
static inline void *
zxdg_output_v1_get_user_data(struct zxdg_output_v1 *zxdg_output_v1)
{
	return wl_proxy_get_user_data((struct wl_proxy *) zxdg_output_v1);
}

static inline uint32_t
zxdg_output_v1_get_version(struct zxdg_output_v1 *zxdg_output_v1)
{
	return wl_proxy_get_version((struct wl_proxy *) zxdg_output_v1);
}

/**
 * @ingroup iface_zxdg_output_v1
 *
 * Using this request a client can tell the server that it is not
 * going to use the xdg_output object anymore.
 */
static inline void
zxdg_output_v1_destroy(struct zxdg_output_v1 *zxdg_output_v1)
{
	wl_proxy_marshal_flags((struct wl_proxy *) zxdg_output_v1,
			 ZXDG_OUTPUT_V1_DESTROY, NULL, wl_proxy_get_version((struct wl_proxy *) zxdg_output_v1), WL_MARSHAL_FLAG_DESTROY);
}

#ifdef  __cplusplus
}
#endif

#endif
