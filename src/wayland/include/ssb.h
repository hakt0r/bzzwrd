/* simple string builder
 *
 * Version 1.3
 *
 * Copyright 2023 Ryan Farley <ryan.farley@gmx.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
 * IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

#ifndef SSB_H_INC
#define SSB_H_INC

#if defined(__GNUC__)
#define SHL_UNUSED __attribute__((unused))
#else
#define SHL_UNUSED
#endif

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <stdbool.h>
#include <errno.h>

/* defines the length used for ssb_readfile, if SSB_GROW_EXACT is used */
#if !defined SSB_READ_LEN
#define SSB_READ_LEN 4096
#endif


enum ssb_grow {
	/* grow by a factor of 1.5 */
	SSB_GROW_1_5 = 0,
	/* grow by a factor of 2.0 */
	SSB_GROW_2_0,
	/* grow by exactly the amount needed each time */
	SSB_GROW_EXACT
};

struct ssb {
	enum ssb_grow grow;
	char *buf;
	size_t size;
	size_t pos;
};

SHL_UNUSED static bool ssb_truncate(struct ssb *s, size_t newsize)
{
	char *realloc_buf;

	if (!(realloc_buf = realloc(s->buf, newsize + 1))) {
		return false;
	}
	s->buf = realloc_buf;
	if (s->pos >= newsize) {
		s->buf[newsize] = '\0';
	}

	s->size = newsize + 1;

	return true;
}

SHL_UNUSED static bool ssb_grow_min(struct ssb *s, size_t min)
{
	size_t newsize;

	newsize = min += s->size;

	switch (s->grow) {
		case SSB_GROW_1_5:
			newsize = s->size + (s->size / 2);
			break;
		case SSB_GROW_2_0:
			newsize = s->size * 2;
			break;
		default:
			break;
	}

	return ssb_truncate(s, (newsize >= min ? newsize : min));
}

SHL_UNUSED static void ssb_free(struct ssb *s)
{
	s->pos = 0;
	if (s->buf) {
		free(s->buf);
	}
	s->size = 0;
	s->buf = NULL;
}

/* read an entire file into a buffer */
SHL_UNUSED static bool ssb_readfile(struct ssb *s, FILE *f)
{
	size_t read_count = 0;

	do {
		s->pos += read_count;
		if (s->size - s->pos <= 2) {
			if (!ssb_grow_min(s, SSB_READ_LEN)) {
			       return false;
			}
		}
	} while ((read_count = fread(s->buf + s->pos, 1, s->size - s->pos - 1, f)));

	/* ideally the result would be NUL terminated, but we cannot be sure */
	s->buf[s->pos] = '\0';

	return feof(f);
}

SHL_UNUSED static void ssb_xtruncate(struct ssb *s, size_t newsize)
{
	if (!ssb_truncate(s, newsize))
		abort();
}

#undef SHL_UNUSED
#endif

