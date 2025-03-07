/* Generated by wayland-scanner 1.23.1 */

#ifndef IDLE_CLIENT_PROTOCOL_H
#define IDLE_CLIENT_PROTOCOL_H

#include <stdint.h>
#include <stddef.h>
#include "wayland-client.h"

#ifdef  __cplusplus
extern "C" {
#endif

/**
 * @page page_idle The idle protocol
 * @section page_ifaces_idle Interfaces
 * - @subpage page_iface_org_kde_kwin_idle - User idle time manager
 * - @subpage page_iface_org_kde_kwin_idle_timeout - 
 * @section page_copyright_idle Copyright
 * <pre>
 *
 * Copyright (C) 2015 Martin Gräßlin
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * </pre>
 */
struct org_kde_kwin_idle;
struct org_kde_kwin_idle_timeout;
struct wl_seat;

#ifndef ORG_KDE_KWIN_IDLE_INTERFACE
#define ORG_KDE_KWIN_IDLE_INTERFACE
/**
 * @page page_iface_org_kde_kwin_idle org_kde_kwin_idle
 * @section page_iface_org_kde_kwin_idle_desc Description
 *
 * This interface allows to monitor user idle time on a given seat. The interface
 * allows to register timers which trigger after no user activity was registered
 * on the seat for a given interval. It notifies when user activity resumes.
 *
 * This is useful for applications wanting to perform actions when the user is not
 * interacting with the system, e.g. chat applications setting the user as away, power
 * management features to dim screen, etc..
 * @section page_iface_org_kde_kwin_idle_api API
 * See @ref iface_org_kde_kwin_idle.
 */
/**
 * @defgroup iface_org_kde_kwin_idle The org_kde_kwin_idle interface
 *
 * This interface allows to monitor user idle time on a given seat. The interface
 * allows to register timers which trigger after no user activity was registered
 * on the seat for a given interval. It notifies when user activity resumes.
 *
 * This is useful for applications wanting to perform actions when the user is not
 * interacting with the system, e.g. chat applications setting the user as away, power
 * management features to dim screen, etc..
 */
extern const struct wl_interface org_kde_kwin_idle_interface;
#endif
#ifndef ORG_KDE_KWIN_IDLE_TIMEOUT_INTERFACE
#define ORG_KDE_KWIN_IDLE_TIMEOUT_INTERFACE
/**
 * @page page_iface_org_kde_kwin_idle_timeout org_kde_kwin_idle_timeout
 * @section page_iface_org_kde_kwin_idle_timeout_api API
 * See @ref iface_org_kde_kwin_idle_timeout.
 */
/**
 * @defgroup iface_org_kde_kwin_idle_timeout The org_kde_kwin_idle_timeout interface
 */
extern const struct wl_interface org_kde_kwin_idle_timeout_interface;
#endif

#define ORG_KDE_KWIN_IDLE_GET_IDLE_TIMEOUT 0


/**
 * @ingroup iface_org_kde_kwin_idle
 */
#define ORG_KDE_KWIN_IDLE_GET_IDLE_TIMEOUT_SINCE_VERSION 1

/** @ingroup iface_org_kde_kwin_idle */
static inline void
org_kde_kwin_idle_set_user_data(struct org_kde_kwin_idle *org_kde_kwin_idle, void *user_data)
{
	wl_proxy_set_user_data((struct wl_proxy *) org_kde_kwin_idle, user_data);
}

/** @ingroup iface_org_kde_kwin_idle */
static inline void *
org_kde_kwin_idle_get_user_data(struct org_kde_kwin_idle *org_kde_kwin_idle)
{
	return wl_proxy_get_user_data((struct wl_proxy *) org_kde_kwin_idle);
}

static inline uint32_t
org_kde_kwin_idle_get_version(struct org_kde_kwin_idle *org_kde_kwin_idle)
{
	return wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_idle);
}

/** @ingroup iface_org_kde_kwin_idle */
static inline void
org_kde_kwin_idle_destroy(struct org_kde_kwin_idle *org_kde_kwin_idle)
{
	wl_proxy_destroy((struct wl_proxy *) org_kde_kwin_idle);
}

/**
 * @ingroup iface_org_kde_kwin_idle
 */
static inline struct org_kde_kwin_idle_timeout *
org_kde_kwin_idle_get_idle_timeout(struct org_kde_kwin_idle *org_kde_kwin_idle, struct wl_seat *seat, uint32_t timeout)
{
	struct wl_proxy *id;

	id = wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_idle,
			 ORG_KDE_KWIN_IDLE_GET_IDLE_TIMEOUT, &org_kde_kwin_idle_timeout_interface, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_idle), 0, NULL, seat, timeout);

	return (struct org_kde_kwin_idle_timeout *) id;
}

/**
 * @ingroup iface_org_kde_kwin_idle_timeout
 * @struct org_kde_kwin_idle_timeout_listener
 */
struct org_kde_kwin_idle_timeout_listener {
	/**
	 * Triggered when there has not been any user activity in the requested idle time interval
	 *
	 * 
	 */
	void (*idle)(void *data,
		     struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout);
	/**
	 * Triggered on the first user activity after an idle event
	 *
	 * 
	 */
	void (*resumed)(void *data,
			struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout);
};

/**
 * @ingroup iface_org_kde_kwin_idle_timeout
 */
static inline int
org_kde_kwin_idle_timeout_add_listener(struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout,
				       const struct org_kde_kwin_idle_timeout_listener *listener, void *data)
{
	return wl_proxy_add_listener((struct wl_proxy *) org_kde_kwin_idle_timeout,
				     (void (**)(void)) listener, data);
}

#define ORG_KDE_KWIN_IDLE_TIMEOUT_RELEASE 0
#define ORG_KDE_KWIN_IDLE_TIMEOUT_SIMULATE_USER_ACTIVITY 1

/**
 * @ingroup iface_org_kde_kwin_idle_timeout
 */
#define ORG_KDE_KWIN_IDLE_TIMEOUT_IDLE_SINCE_VERSION 1
/**
 * @ingroup iface_org_kde_kwin_idle_timeout
 */
#define ORG_KDE_KWIN_IDLE_TIMEOUT_RESUMED_SINCE_VERSION 1

/**
 * @ingroup iface_org_kde_kwin_idle_timeout
 */
#define ORG_KDE_KWIN_IDLE_TIMEOUT_RELEASE_SINCE_VERSION 1
/**
 * @ingroup iface_org_kde_kwin_idle_timeout
 */
#define ORG_KDE_KWIN_IDLE_TIMEOUT_SIMULATE_USER_ACTIVITY_SINCE_VERSION 1

/** @ingroup iface_org_kde_kwin_idle_timeout */
static inline void
org_kde_kwin_idle_timeout_set_user_data(struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout, void *user_data)
{
	wl_proxy_set_user_data((struct wl_proxy *) org_kde_kwin_idle_timeout, user_data);
}

/** @ingroup iface_org_kde_kwin_idle_timeout */
static inline void *
org_kde_kwin_idle_timeout_get_user_data(struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout)
{
	return wl_proxy_get_user_data((struct wl_proxy *) org_kde_kwin_idle_timeout);
}

static inline uint32_t
org_kde_kwin_idle_timeout_get_version(struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout)
{
	return wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_idle_timeout);
}

/** @ingroup iface_org_kde_kwin_idle_timeout */
static inline void
org_kde_kwin_idle_timeout_destroy(struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout)
{
	wl_proxy_destroy((struct wl_proxy *) org_kde_kwin_idle_timeout);
}

/**
 * @ingroup iface_org_kde_kwin_idle_timeout
 */
static inline void
org_kde_kwin_idle_timeout_release(struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_idle_timeout,
			 ORG_KDE_KWIN_IDLE_TIMEOUT_RELEASE, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_idle_timeout), WL_MARSHAL_FLAG_DESTROY);
}

/**
 * @ingroup iface_org_kde_kwin_idle_timeout
 */
static inline void
org_kde_kwin_idle_timeout_simulate_user_activity(struct org_kde_kwin_idle_timeout *org_kde_kwin_idle_timeout)
{
	wl_proxy_marshal_flags((struct wl_proxy *) org_kde_kwin_idle_timeout,
			 ORG_KDE_KWIN_IDLE_TIMEOUT_SIMULATE_USER_ACTIVITY, NULL, wl_proxy_get_version((struct wl_proxy *) org_kde_kwin_idle_timeout), 0);
}

#ifdef  __cplusplus
}
#endif

#endif
