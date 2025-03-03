#include <stdio.h>
#include <dlfcn.h>
#include <X11/Xlib.h>

typedef Display* (*XOpenDisplayFunc)(const char*);
typedef int (*XCloseDisplayFunc)(Display*);

__attribute__((export_name("test_x11")))
int test_x11() {
    void* handle = dlopen("libX11.so.6", RTLD_LAZY);
    if (!handle) {
        fprintf(stderr, "dlopen failed: %s\n", dlerror());
        return -1;
    }

    XOpenDisplayFunc xOpenDisplay = (XOpenDisplayFunc)dlsym(handle, "XOpenDisplay");
    XCloseDisplayFunc xCloseDisplay = (XCloseDisplayFunc)dlsym(handle, "XCloseDisplay");

    if (!xOpenDisplay || !xCloseDisplay) {
        fprintf(stderr, "dlsym failed: %s\n", dlerror());
        dlclose(handle);
        return -2;
    }

    Display* display = xOpenDisplay(NULL);
    if (!display) {
        dlclose(handle);
        return -3;
    }

    xCloseDisplay(display);
    dlclose(handle);
    return 0;
} 