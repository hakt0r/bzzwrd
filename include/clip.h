#pragma once
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>
#include <poll.h>
#include <stdint.h>
#include <stdbool.h>
#include "os.h"
#include "xmem.h"
#include "fdio_full.h"
#include <spawn.h>
#include "log.h"

/* check if wl-clipboard is even present */
bool clipHaveWlClipboard(void);

/* run wl-copy, with given data */
bool clipWlCopy(int id, const unsigned char *data, size_t len);
