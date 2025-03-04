#pragma once
#include <stdbool.h>
#include <sys/mman.h>
#include <sys/types.h>

extern char *osConfigPathOverride;
extern int osGetAnonFd(void);
extern char *osGetRuntimePath(char *name);
extern char *osGetHomeConfigPath(char *name);
/* check if a file exists */
extern bool osFileExists(const char *path);
/* create parents of a given path if they don't already exist */
extern bool osMakeParentDir(const char *path, mode_t mode);
/* drop setuid and setgid privileges; aborts on failure, as it should. */
extern void osDropPriv(void);
/* determine the name of the other end of a socket */
extern char *osGetPeerProcName(int fd);
/* set environment variable for testing */
extern int osSetEnv(const char *name, const char *value);
