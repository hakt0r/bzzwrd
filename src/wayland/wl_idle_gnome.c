#include "wayland.h"
#include <signal.h>
#include <spawn.h>
#include <unistd.h>
#include <stdlib.h>

extern char **environ;

static void inhibit_stop(struct wlIdle *idle)
{
	pid_t *inhibitor = idle->state;
        if (*inhibitor == -1) {
                LOG(stderr, "gnome-session-inhibit not running");
                return;
        }
        LOG(stderr, "Stopping gnome-session-inhibit");
        kill(*inhibitor, SIGTERM);
	*inhibitor = -1;
}
static void inhibit_start(struct wlIdle *idle)
{
	pid_t *inhibitor = idle->state;
        char *argv[] = {
                "gnome-session-inhibit",
                "--inhibit",
                "idle",
                "--inhibit-only",
                NULL,
        };

        if (*inhibitor != -1) {
                inhibit_stop(idle);
        }

        LOG(stderr, "Starting gnome-session-inhibit");
        if (posix_spawnp(inhibitor, argv[0], NULL, NULL, argv, environ)) {
                *inhibitor = -1;
                LOG(stderr, "Could not spawn gnome-session-inhibit");
        }
}

bool wlIdleInitGnome(struct wlContext *ctx)
{
	if (strcmp(ctx->comp_name, "gnome-shell")) {
		LOG(stderr, "gnome inhibitor only works with 'gnome-shell', we have '%s'", ctx->comp_name);
		return false;
	}
	pid_t *inhibitor = xmalloc(sizeof(*inhibitor));
	*inhibitor = -1;
	ctx->idle.wl_ctx = ctx;
	ctx->idle.state = inhibitor;
	ctx->idle.inhibit_start = inhibit_start;
	ctx->idle.inhibit_stop = inhibit_stop;
	return true;
}
