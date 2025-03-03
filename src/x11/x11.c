#include <stdio.h>
#include <dlfcn.h>
#include <X11/Xlib.h>
#include <X11/extensions/Xfixes.h>

// Function pointer types
typedef Display* (*XOpenDisplayFunc)(const char*);
typedef Window (*XDefaultRootWindowFunc)(Display*);
typedef int (*XCloseDisplayFunc)(Display*);
typedef void (*XFixesHideCursorFunc)(Display*, Window);
typedef void (*XFixesShowCursorFunc)(Display*, Window);
typedef int (*XFlushFunc)(Display*);
typedef int (*XGrabPointerFunc)(Display*, Window, Bool, unsigned int, int, int, Window, Cursor, Time);
typedef int (*XGrabKeyboardFunc)(Display*, Window, Bool, int, int, Time);
typedef int (*XUngrabPointerFunc)(Display*, Time);
typedef int (*XUngrabKeyboardFunc)(Display*, Time);
typedef int (*XDefaultScreenFunc)(Display*);
typedef Window (*XRootWindowFunc)(Display*, int);

// Global variables
static void* x11_handle = NULL;
static void* xfixes_handle = NULL;
static Display* display = NULL;
static Window root = None;

// Function pointers
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

// Initialize X11 connection and load functions
static int ensure_x11() {
    if (display) return 0;  // Already initialized

    // Load X11 library
    fprintf(stderr, "Loading libX11.so.6...\n");
    x11_handle = dlopen("libX11.so.6", RTLD_LAZY);
    if (!x11_handle) {
        fprintf(stderr, "Failed to load X11: %s\n", dlerror());
        return -1;
    }
    fprintf(stderr, "Loaded X11 library\n");

    // Load Xfixes library
    fprintf(stderr, "Loading libXfixes.so.3...\n");
    xfixes_handle = dlopen("libXfixes.so.3", RTLD_LAZY);
    if (!xfixes_handle) {
        fprintf(stderr, "Failed to load Xfixes: %s\n", dlerror());
        dlclose(x11_handle);
        return -1;
    }
    fprintf(stderr, "Loaded Xfixes library\n");

    // Get function pointers
    fprintf(stderr, "Loading X11 functions...\n");
    xOpenDisplay = (XOpenDisplayFunc)dlsym(x11_handle, "XOpenDisplay");
    xDefaultScreen = (XDefaultScreenFunc)dlsym(x11_handle, "XDefaultScreen");
    xRootWindow = (XRootWindowFunc)dlsym(x11_handle, "XRootWindow");
    xCloseDisplay = (XCloseDisplayFunc)dlsym(x11_handle, "XCloseDisplay");
    xFlush = (XFlushFunc)dlsym(x11_handle, "XFlush");
    xGrabPointer = (XGrabPointerFunc)dlsym(x11_handle, "XGrabPointer");
    xGrabKeyboard = (XGrabKeyboardFunc)dlsym(x11_handle, "XGrabKeyboard");
    xUngrabPointer = (XUngrabPointerFunc)dlsym(x11_handle, "XUngrabPointer");
    xUngrabKeyboard = (XUngrabKeyboardFunc)dlsym(x11_handle, "XUngrabKeyboard");

    fprintf(stderr, "Loading Xfixes functions...\n");
    xFixesHideCursor = (XFixesHideCursorFunc)dlsym(xfixes_handle, "XFixesHideCursor");
    xFixesShowCursor = (XFixesShowCursorFunc)dlsym(xfixes_handle, "XFixesShowCursor");

    // Verify all functions were loaded
    if (!xOpenDisplay) fprintf(stderr, "Failed to load XOpenDisplay\n");
    if (!xDefaultScreen) fprintf(stderr, "Failed to load XDefaultScreen\n");
    if (!xRootWindow) fprintf(stderr, "Failed to load XRootWindow\n");
    if (!xCloseDisplay) fprintf(stderr, "Failed to load XCloseDisplay\n");
    if (!xFlush) fprintf(stderr, "Failed to load XFlush\n");
    if (!xGrabPointer) fprintf(stderr, "Failed to load XGrabPointer\n");
    if (!xGrabKeyboard) fprintf(stderr, "Failed to load XGrabKeyboard\n");
    if (!xUngrabPointer) fprintf(stderr, "Failed to load XUngrabPointer\n");
    if (!xUngrabKeyboard) fprintf(stderr, "Failed to load XUngrabKeyboard\n");
    if (!xFixesHideCursor) fprintf(stderr, "Failed to load XFixesHideCursor\n");
    if (!xFixesShowCursor) fprintf(stderr, "Failed to load XFixesShowCursor\n");

    if (!xOpenDisplay || !xDefaultScreen || !xRootWindow || !xCloseDisplay || !xFlush ||
        !xGrabPointer || !xGrabKeyboard || !xUngrabPointer || !xUngrabKeyboard ||
        !xFixesHideCursor || !xFixesShowCursor) {
        fprintf(stderr, "Failed to load X11 functions: %s\n", dlerror());
        dlclose(xfixes_handle);
        dlclose(x11_handle);
        return -1;
    }
    fprintf(stderr, "All functions loaded successfully\n");

    // Connect to X server
    fprintf(stderr, "Connecting to X server...\n");
    display = xOpenDisplay(NULL);
    if (!display) {
        fprintf(stderr, "Failed to connect to X server\n");
        dlclose(xfixes_handle);
        dlclose(x11_handle);
        return -1;
    }
    fprintf(stderr, "Connected to X server\n");

    // Get root window using XRootWindow instead of DefaultRootWindow macro
    int screen = xDefaultScreen(display);
    root = xRootWindow(display, screen);
    fprintf(stderr, "Got root window\n");
    return 0;
}

__attribute__((export_name("x11_hide_cursor")))
int x11_hide_cursor() {
    if (ensure_x11() < 0) return -1;
    xFixesHideCursor(display, root);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_show_cursor")))
int x11_show_cursor() {
    if (ensure_x11() < 0) return -1;
    xFixesShowCursor(display, root);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_lock_input")))
int x11_lock_input() {
    if (ensure_x11() < 0) return -1;
    
    int result = xGrabPointer(display, root, True,
        ButtonPressMask | ButtonReleaseMask | PointerMotionMask,
        GrabModeAsync, GrabModeAsync,
        root, None, CurrentTime);
        
    if (result != GrabSuccess) return -1;
    
    result = xGrabKeyboard(display, root, True,
        GrabModeAsync, GrabModeAsync, CurrentTime);
        
    if (result != GrabSuccess) {
        xUngrabPointer(display, CurrentTime);
        return -1;
    }
    
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_unlock_input")))
int x11_unlock_input() {
    if (!display) return -1;
    
    xUngrabPointer(display, CurrentTime);
    xUngrabKeyboard(display, CurrentTime);
    xFlush(display);
    return 0;
}

__attribute__((export_name("x11_cleanup")))
void x11_cleanup() {
    if (display) {
        xCloseDisplay(display);
        display = NULL;
        root = None;
    }
    if (xfixes_handle) {
        dlclose(xfixes_handle);
        xfixes_handle = NULL;
    }
    if (x11_handle) {
        dlclose(x11_handle);
        x11_handle = NULL;
    }
} 