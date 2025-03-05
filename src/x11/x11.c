#include <stdio.h>
#include <dlfcn.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <X11/Xlib.h>
#include <X11/extensions/Xfixes.h>
#include <X11/extensions/XTest.h>
#include <X11/extensions/dpms.h>

#ifdef __DEBUG__
#define LOG(file, fmt, ...) fprintf(file, fmt, ##__VA_ARGS__)
#else
#define LOG(file, fmt, ...)
#endif

typedef Display *(*XOpenDisplayFunc)(const char *);
typedef Window (*XDefaultRootWindowFunc)(Display *);
typedef int (*XCloseDisplayFunc)(Display *);
typedef void (*XFixesHideCursorFunc)(Display *, Window);
typedef void (*XFixesShowCursorFunc)(Display *, Window);
typedef int (*XFlushFunc)(Display *);
typedef int (*XGrabPointerFunc)(Display *, Window, Bool, unsigned int, int, int, Window, Cursor, Time);
typedef int (*XGrabKeyboardFunc)(Display *, Window, Bool, int, int, Time);
typedef int (*XUngrabPointerFunc)(Display *, Time);
typedef int (*XUngrabKeyboardFunc)(Display *, Time);
typedef int (*XDefaultScreenFunc)(Display *);
typedef Window (*XRootWindowFunc)(Display *, int);
typedef Bool (*XTestFakeMotionEventFunc)(Display *, int, int, int, Time);
typedef Bool (*XTestFakeRelativeMotionEventFunc)(Display *, int, int, Time);
typedef Bool (*XTestFakeButtonEventFunc)(Display *, unsigned int, Bool, Time);
typedef Bool (*XTestFakeKeyEventFunc)(Display *, unsigned int, Bool, Time);
typedef Status (*DPMSEnableFunc)(Display *);
typedef Status (*DPMSDisableFunc)(Display *);
typedef Bool (*DPMSSetTimeoutsFunc)(Display *, CARD16, CARD16, CARD16);

static void *x11_handle = NULL;
static void *xfixes_handle = NULL;
static void *xtest_handle = NULL;
static void *dpms_handle = NULL;
static Display *display = NULL;
static Window root = None;
static int screen = 0;
static Bool dpms_was_enabled = False;
static Bool dpms_available = False;
static Bool xfixes_available = False;

static XOpenDisplayFunc xOpenDisplay = NULL;
static XDefaultScreenFunc xDefaultScreen = NULL;
static XRootWindowFunc xRootWindow = NULL;
static XCloseDisplayFunc xCloseDisplay = NULL;
static XFixesHideCursorFunc xFixesHideCursor = NULL;
static XFixesShowCursorFunc xFixesShowCursor = NULL;
static XFlushFunc xFlush = NULL;
static XGrabPointerFunc xGrabPointer = NULL;
static XGrabKeyboardFunc xGrabKeyboard = NULL;
static XUngrabPointerFunc xUngrabPointer = NULL;
static XUngrabKeyboardFunc xUngrabKeyboard = NULL;
static XTestFakeMotionEventFunc xTestFakeMotionEvent = NULL;
static XTestFakeRelativeMotionEventFunc xTestFakeRelativeMotionEvent = NULL;
static XTestFakeButtonEventFunc xTestFakeButtonEvent = NULL;
static XTestFakeKeyEventFunc xTestFakeKeyEvent = NULL;
static DPMSEnableFunc dpmsEnable = NULL;
static DPMSDisableFunc dpmsDisable = NULL;
static DPMSSetTimeoutsFunc dpmsSetTimeouts = NULL;

static int ensure_x11()
{
    if (display)
        return 0;

    x11_handle = dlopen("libX11.so.6", RTLD_LAZY);
    if (!x11_handle)
    {
        LOG(stderr, "Failed to load X11: %s\n", dlerror());
        return -1;
    }

    xfixes_handle = dlopen("libXfixes.so.3", RTLD_LAZY);
    if (!xfixes_handle)
    {
        LOG(stderr, "Failed to load Xfixes: %s\n", dlerror());
        dlclose(x11_handle);
        return -1;
    }

    xtest_handle = dlopen("libXtst.so.6", RTLD_LAZY);
    if (!xtest_handle)
    {
        LOG(stderr, "Failed to load XTest: %s\n", dlerror());
        dlclose(xfixes_handle);
        dlclose(x11_handle);
        return -1;
    }

    dpms_handle = dlopen("libXext.so.6", RTLD_LAZY);
    if (!dpms_handle)
    {
        LOG(stderr, "Warning: Failed to load Xext: %s\n", dlerror());
        LOG(stderr, "DPMS functionality will be disabled\n");
        dpms_available = False;
    }
    else
    {

        dpms_available = True;
    }

    xOpenDisplay = (XOpenDisplayFunc)dlsym(x11_handle, "XOpenDisplay");
    xDefaultScreen = (XDefaultScreenFunc)dlsym(x11_handle, "XDefaultScreen");
    xRootWindow = (XRootWindowFunc)dlsym(x11_handle, "XRootWindow");
    xCloseDisplay = (XCloseDisplayFunc)dlsym(x11_handle, "XCloseDisplay");
    xFlush = (XFlushFunc)dlsym(x11_handle, "XFlush");
    xGrabPointer = (XGrabPointerFunc)dlsym(x11_handle, "XGrabPointer");
    xGrabKeyboard = (XGrabKeyboardFunc)dlsym(x11_handle, "XGrabKeyboard");
    xUngrabPointer = (XUngrabPointerFunc)dlsym(x11_handle, "XUngrabPointer");
    xUngrabKeyboard = (XUngrabKeyboardFunc)dlsym(x11_handle, "XUngrabKeyboard");

    xFixesHideCursor = (XFixesHideCursorFunc)dlsym(xfixes_handle, "XFixesHideCursor");
    xFixesShowCursor = (XFixesShowCursorFunc)dlsym(xfixes_handle, "XFixesShowCursor");
    xfixes_available = xFixesHideCursor && xFixesShowCursor;

    xTestFakeMotionEvent = (XTestFakeMotionEventFunc)dlsym(xtest_handle, "XTestFakeMotionEvent");
    xTestFakeRelativeMotionEvent = (XTestFakeRelativeMotionEventFunc)dlsym(xtest_handle, "XTestFakeRelativeMotionEvent");
    xTestFakeButtonEvent = (XTestFakeButtonEventFunc)dlsym(xtest_handle, "XTestFakeButtonEvent");
    xTestFakeKeyEvent = (XTestFakeKeyEventFunc)dlsym(xtest_handle, "XTestFakeKeyEvent");

    if (dpms_available)
    {

        dpmsEnable = (DPMSEnableFunc)dlsym(dpms_handle, "DPMSEnable");
        dpmsDisable = (DPMSDisableFunc)dlsym(dpms_handle, "DPMSDisable");
        dpmsSetTimeouts = (DPMSSetTimeoutsFunc)dlsym(dpms_handle, "DPMSSetTimeouts");

        dpms_available = dpmsEnable && dpmsDisable && dpmsSetTimeouts;
    }

    if (!xOpenDisplay || !xDefaultScreen || !xRootWindow || !xCloseDisplay || !xFlush ||
        !xTestFakeMotionEvent || !xTestFakeRelativeMotionEvent ||
        !xTestFakeButtonEvent || !xTestFakeKeyEvent)
    {
        LOG(stderr, "Failed to load essential X11 functions: %s\n", dlerror());
        if (dpms_handle)
            dlclose(dpms_handle);
        dlclose(xtest_handle);
        dlclose(xfixes_handle);
        dlclose(x11_handle);
        return -1;
    }

    if (!xfixes_available)
    {
        LOG(stderr, "Warning: XFixes extension not available. Cursor hiding will be disabled.\n");
    }

    if (!dpms_available)
    {
        LOG(stderr, "Warning: DPMS extension not available. Idle inhibition will be disabled.\n");
    }

    display = xOpenDisplay(NULL);
    if (!display)
    {
        LOG(stderr, "Failed to connect to X server\n");
        if (dpms_handle)
            dlclose(dpms_handle);
        dlclose(xtest_handle);
        dlclose(xfixes_handle);
        dlclose(x11_handle);
        return -1;
    }

    screen = xDefaultScreen(display);
    root = xRootWindow(display, screen);
    return 0;
}

__attribute__((export_name("x11_hide_cursor"))) int x11_hide_cursor()
{
    if (ensure_x11() < 0)
        return -1;
    if (!xfixes_available)
    {
        LOG(stderr, "XFixes extension not available, cursor hiding not supported\n");
        return 0;
    }
    xFixesHideCursor(display, root);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_show_cursor"))) int x11_show_cursor()
{
    if (ensure_x11() < 0)
        return -1;
    if (!xfixes_available)
    {
        LOG(stderr, "XFixes extension not available, cursor showing not supported\n");
        return 0;
    }
    xFixesShowCursor(display, root);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_lock_input"))) int x11_lock_input()
{
    if (ensure_x11() < 0)
        return -1;

    int result = xGrabPointer(display, root, True,
                              ButtonPressMask | ButtonReleaseMask | PointerMotionMask,
                              GrabModeAsync, GrabModeAsync,
                              root, None, CurrentTime);

    if (result != GrabSuccess)
    {
        LOG(stderr, "Warning: Failed to grab pointer (this is normal in Xvfb)\n");
    }

    result = xGrabKeyboard(display, root, True,
                           GrabModeAsync, GrabModeAsync, CurrentTime);

    if (result != GrabSuccess)
    {
        LOG(stderr, "Warning: Failed to grab keyboard (this is normal in Xvfb)\n");
        xUngrabPointer(display, CurrentTime);
    }

    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_unlock_input"))) int x11_unlock_input()
{
    if (!display)
        return -1;

    xUngrabPointer(display, CurrentTime);
    xUngrabKeyboard(display, CurrentTime);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_mouse_motion"))) int x11_mouse_motion(int x, int y)
{
    if (ensure_x11() < 0)
        return -1;
    xTestFakeMotionEvent(display, screen, x, y, CurrentTime);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_mouse_relative_motion"))) int x11_mouse_relative_motion(int dx, int dy)
{
    if (ensure_x11() < 0)
        return -1;
    xTestFakeRelativeMotionEvent(display, dx, dy, CurrentTime);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_mouse_button"))) int x11_mouse_button(int button, int pressed)
{
    if (ensure_x11() < 0)
        return -1;
    xTestFakeButtonEvent(display, button, pressed ? True : False, CurrentTime);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_mouse_wheel"))) int x11_mouse_wheel(int horizontal, int vertical)
{
    if (ensure_x11() < 0)
        return -1;

    if (vertical > 0)
    {
        xTestFakeButtonEvent(display, 4, True, CurrentTime);
        xTestFakeButtonEvent(display, 4, False, CurrentTime);
    }
    else if (vertical < 0)
    {
        xTestFakeButtonEvent(display, 5, True, CurrentTime);
        xTestFakeButtonEvent(display, 5, False, CurrentTime);
    }

    if (horizontal > 0)
    {
        xTestFakeButtonEvent(display, 6, True, CurrentTime);
        xTestFakeButtonEvent(display, 6, False, CurrentTime);
    }
    else if (horizontal < 0)
    {
        xTestFakeButtonEvent(display, 7, True, CurrentTime);
        xTestFakeButtonEvent(display, 7, False, CurrentTime);
    }

    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_key_raw"))) int x11_key_raw(int keycode, int pressed)
{
    if (ensure_x11() < 0)
        return -1;
    xTestFakeKeyEvent(display, keycode, pressed ? True : False, CurrentTime);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_key"))) int x11_key(int keycode, int modifiers, int pressed)
{
    if (ensure_x11() < 0)
        return -1;

    if (modifiers & 0x01)
    {
        xTestFakeKeyEvent(display, 50, pressed ? True : False, CurrentTime);
    }
    if (modifiers & 0x02)
    {
        xTestFakeKeyEvent(display, 37, pressed ? True : False, CurrentTime);
    }
    if (modifiers & 0x04)
    {
        xTestFakeKeyEvent(display, 64, pressed ? True : False, CurrentTime);
    }

    xTestFakeKeyEvent(display, keycode, pressed ? True : False, CurrentTime);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_key_release_all"))) int x11_key_release_all()
{
    if (ensure_x11() < 0)
        return -1;

    xTestFakeKeyEvent(display, 50, False, CurrentTime);
    xTestFakeKeyEvent(display, 37, False, CurrentTime);
    xTestFakeKeyEvent(display, 64, False, CurrentTime);
    xTestFakeKeyEvent(display, 133, False, CurrentTime);

    for (int i = 24; i <= 47; i++)
    {
        xTestFakeKeyEvent(display, i, False, CurrentTime);
    }

    for (int i = 10; i <= 19; i++)
    {
        xTestFakeKeyEvent(display, i, False, CurrentTime);
    }

    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_idle_inhibit"))) int x11_idle_inhibit(int inhibit)
{
    if (ensure_x11() < 0)
        return -1;

    if (!dpms_available)
    {
        LOG(stderr, "DPMS extension not available, idle inhibition not supported\n");
        return 0;
    }

    if (inhibit)
    {

        dpmsDisable(display);
    }
    else
    {

        dpmsEnable(display);
        dpmsSetTimeouts(display, 600, 600, 600);
    }

    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_cleanup"))) void x11_cleanup()
{
    if (display)
    {

        if (dpms_available)
        {
            dpmsEnable(display);
        }

        xCloseDisplay(display);
        display = NULL;
        root = None;
    }
    if (dpms_handle)
    {
        dlclose(dpms_handle);
        dpms_handle = NULL;
    }
    if (xtest_handle)
    {
        dlclose(xtest_handle);
        xtest_handle = NULL;
    }
    if (xfixes_handle)
    {
        dlclose(xfixes_handle);
        xfixes_handle = NULL;
    }
    if (x11_handle)
    {
        dlclose(x11_handle);
        x11_handle = NULL;
    }
}
void x11_set_env(const char *key, const char *value)
{
    setenv(key, value, 1);
}

void x11_unset_env(const char *key)
{
    unsetenv(key);
}