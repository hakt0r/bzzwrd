#include "clip.h"
#include "wayland.h"
#include "sig.h"

extern char **environ;

/* check for wl-clipboard's presence */
bool clipHaveWlClipboard(void)
{
	bool ret = true;
	pid_t pid;
	int status;
	char *argv_0[] = {
		"wl-paste",
		"-v",
		NULL
	};
	char *argv_1[] = {
		"wl-copy",
		"-v",
		NULL
	};
	char **argv[] = {argv_0, argv_1};

	sigWaitSIGCHLD(true);

	for (int i = 0; i < 2; ++i) {
		if (posix_spawnp(&pid, argv[i][0], NULL, NULL, argv[i], environ)) {
			ret = false;
			goto done;
		}
		if (waitpid(pid, &status, 0) != pid) {
			ret = false;
			goto done;
		}
		if (status) {
			ret = false;
			goto done;
		}
		logDbg("Found %s", argv[i][0]);
	}
done:
	sigWaitSIGCHLD(false);
	return ret;
}

/* set wayland clipboard with wl-copy */
bool clipWlCopy(int id, const unsigned char *data, size_t len)
{
	pid_t pid;
	posix_spawn_file_actions_t fa;
	char *argv_regular[] = {
			"wl-copy",
			"-f",
			NULL};

	char *argv_primary[] = {
			"wl-copy",
			"-f",
			"--primary",
			NULL
		};
	char **argv[] = {argv_regular, argv_primary};
	/* create the pipe we will use to communicate with it */
	int fd[2];
	errno = 0;
	if (pipe(fd) == -1) {
		perror("pipe");
		return false;
	}
	posix_spawn_file_actions_init(&fa);
	posix_spawn_file_actions_adddup2(&fa, fd[0], STDIN_FILENO);
	posix_spawn_file_actions_addclose(&fa, fd[1]);
   	/* now we can spawn */
	errno = 0;
	if (posix_spawnp(&pid, "wl-copy", &fa, NULL, argv[id], environ)) {
		logPErr("wl-copy spawn");
		close(fd[0]);
		close(fd[1]);
		posix_spawn_file_actions_destroy(&fa);
		return false;
	}
	posix_spawn_file_actions_destroy(&fa);
	close(fd[0]);
	/* write to child process */
	write_full(fd[1], data, len, 0);
	close(fd[1]);
	return true;
}

