import { cc } from "bun:ffi";

const { symbols } = cc({
  source: [
    "./src/wl_idle.c",
    "./src/wl_idle_gnome.c", 
    "./src/wl_idle_kde.c",
    "./src/wl_idle_ext.c",
    "./src/wl_input.c",
    "./src/wl_input_wlr.c",
    "./src/wl_input_kde.c",
    "./src/wl_input_uinput.c",
    "./src/clip.c",
    "./src/config.c",
    "./src/os.c",
    "./src/sig.c",
    "./src/ssp.c",
    "./src/wayland.c",
    "./src/log.c",
    "./protocol/generated/idle-protocol.c",
    "./protocol/generated/ext-idle-notify-v1-protocol.c",
    "./protocol/generated/fake-input-protocol.c",
    "./protocol/generated/keyboard-shortcuts-inhibit-unstable-v1-protocol.c",
    "./protocol/generated/virtual-keyboard-unstable-v1-protocol.c",
    "./protocol/generated/wlr-virtual-pointer-unstable-v1-protocol.c",
    "./protocol/generated/xdg-output-unstable-v1-protocol.c",
    "./protocol/generated/xdg-shell-protocol.c"
  ],
  include: ["include", "protocol/generated"],
  system_include: [
    "/usr/include",
    "/usr/include/x86_64-linux-gnu",
    "/usr/local/include",
    "/usr/lib/x86_64-linux-gnu/glib-2.0/include",
    "/usr/include/glib-2.0",
    "/usr/lib/gcc/x86_64-linux-gnu/13/include"
  ],
  define: {
    "__USE_GNU": "1",
    "_GNU_SOURCE": "1",
  },
  cflags: ["-std=gnu2x"],
  library: [
    "wayland-client",
    "xkbcommon",
    "wlroots-0.18"
  ],
  symbols: {
    wlContextNew: {
      args: [],
      returns: "ptr"
    },
    wlContextFree: {
      args: ["ptr"],
      returns: "void"
    },
    wlSetup: {
      args: ["ptr", "i32", "i32", "ptr"],
      returns: "bool"
    },
    wlClose: {
      args: ["ptr"],
      returns: "void"
    },
    wlPrepareFd: {
      args: ["ptr"],
      returns: "i32"
    },
    wlDisplayFlush: {
      args: ["ptr"],
      returns: "void"
    },
    clipHaveWlClipboard: {
      args: [],
      returns: "bool"
    },
    clipWlCopy: {
      args: ["i32", "ptr", "u64"],
      returns: "bool"
    },
    wlMouseMotion: {
      args: ["ptr", "i32", "i32"],
      returns: "void"
    },
    wlMouseRelativeMotion: {
      args: ["ptr", "i32", "i32"],
      returns: "void"
    },
    wlMouseButton: {
      args: ["ptr", "i32", "i32"],
      returns: "void"
    },
    wlMouseWheel: {
      args: ["ptr", "i16", "i16"],
      returns: "void"
    },
    wlKeyRaw: {
      args: ["ptr", "i32", "i32"],
      returns: "void"
    },
    wlKey: {
      args: ["ptr", "i32", "i32", "i32"],
      returns: "void"
    },
    wlKeyReleaseAll: {
      args: ["ptr"],
      returns: "void"
    },
    wlIdleInhibit: {
      args: ["ptr", "bool"],
      returns: "void"
    }
  }
});

export const {
  wlContextNew,
  wlContextFree,
  wlSetup,
  wlClose,
  wlPrepareFd,
  wlDisplayFlush,
  clipHaveWlClipboard,
  clipWlCopy,
  wlMouseMotion,
  wlMouseRelativeMotion,
  wlMouseButton,
  wlMouseWheel,
  wlKeyRaw,
  wlKey,
  wlKeyReleaseAll,
  wlIdleInhibit
} = symbols;