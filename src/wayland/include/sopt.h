/* sopt -- simple option parsing
 *
 * Version 1.9
 *
 * Copyright 2021 Ryan Farley <ryan.farley@gmx.com>
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

#ifndef SOPTH_INCLUDE
#define SOPTH_INCLUDE

#if defined(__GNUC__)
#define SHL_UNUSED __attribute__((unused))
#else
#define SHL_UNUSED
#endif

#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <float.h>
#include <limits.h>
#include <inttypes.h>
#include <errno.h>

enum sopt_argtype {
	SOPT_ARGTYPE_NULL,
	SOPT_ARGTYPE_STR,
	SOPT_ARGTYPE_CHAR,
	SOPT_ARGTYPE_SCHAR,
	SOPT_ARGTYPE_UCHAR,
	SOPT_ARGTYPE_SHORT,
	SOPT_ARGTYPE_USHORT,
	SOPT_ARGTYPE_INT,
	SOPT_ARGTYPE_UINT,
	SOPT_ARGTYPE_LONG,
	SOPT_ARGTYPE_ULONG,
	SOPT_ARGTYPE_LONGLONG,
	SOPT_ARGTYPE_ULONGLONG,
	SOPT_ARGTYPE_FLOAT,
	SOPT_ARGTYPE_DBL,
	SOPT_ARGTYPE_LONGDBL,
};

/* By setting SOPT_INVAL to '?', and terminating with it, we ensure that --
 * should a simple search through the option array yield no match, the final
 * element will have the value '?'*/
#define SOPT_INVAL '?'
#define SOPT_AFTER -1

struct sopt {
	/* Option ID. Should be unique. Indicates the following, based on
	 * value:
	 * 	alphanumeric:
	 * 		a short option, i.e. triggered with -o for 'o'
	 * 	SOPT_INVAL:
	 * 		signals end of option array
	 * 	SOPT_AFTER:
	 * 		specifies a non-option parameter documented in
	 * 		usage text
	 * 	other:
	 * 		identifies long option. Ideally, should be > UCHAR_MAX
	 * 		for this purpose, to ensure no collisions with
	 * 		potential short options.
	 */
	int val;
	/* Long option name, if not null. i.e. --long-option would be "long-option" */
	const char *name;
	/* type of parameter, if not null */
	enum sopt_argtype argtype;
	/* Parameter, if not null. Or name of unparsed argument, if SOPT_AFTER */
	const char *arg;
	/* Description for usage text */
	const char *desc;
};

union sopt_arg {
	char *str;
	signed char sc;
	unsigned char uc;
	char c;
	short s;
	unsigned short us;
	int i;
	unsigned int ui;
	long l;
	unsigned long ul;
	long long ll;
	unsigned long long ull;
	float f;
	double d;
	long double ld;
};


/* Initializer macros, for static option array definitions. Use like:
 * 	struct sopt optspec[] = {
 * 		SOPT...(...),
 * 		SOPT...(...),
 * 		...
 * 		SOPT_INIT_END
 * 	};
*/
/* Define a simple option like -o (takes no parameter) */
#define SOPT_INIT(opt, desc) { (opt), NULL, SOPT_ARGTYPE_NULL, NULL, (desc) }
/* Same as above, but with a long option name given */
#define SOPT_INITL(opt, name, desc) { (opt), (name), SOPT_ARGTYPE_NULL, NULL, (desc) }
/* Define an option with an argument, i.e. -o foo */
#define SOPT_INIT_ARG(opt, type, param, desc) { (opt), NULL, (type), (param), (desc)}
/* Same as above, but with long option name given */
#define SOPT_INIT_ARGL(opt, name, type, param, desc) {(opt), (name), (type), (param), (desc)}
/* Define an unparsed argument, i.e. after -- */
#define SOPT_INIT_AFTER(str, desc) {SOPT_AFTER, NULL, SOPT_ARGTYPE_NULL, (str), (desc)}
/* Terminate the option array. Must be last element. */
#define SOPT_INIT_END {SOPT_INVAL, NULL, SOPT_ARGTYPE_NULL, NULL, NULL}

#define SOPT_VALID(opt) ((opt)->val != SOPT_INVAL)

/*simple helper -- print out usage example*/
SHL_UNUSED static inline void sopt_usage_printopt(struct sopt *opt)
{
	bool shortopt, longopt;

	shortopt = (((unsigned char)opt->val) == opt->val) && isalnum(opt->val);
	longopt = opt->name;
	if (!(shortopt || longopt)) {
		return; /*borked, yo*/
	}
	if (shortopt) {
		LOG(stderr, "-%c", opt->val);
	}
	if (shortopt && longopt) {
		LOG(stderr, "|");
	}
	if (longopt) {
		LOG(stderr, "--%s", opt->name);
	}
	if (opt->arg) {
		LOG(stderr, " %s", opt->arg);
	}
}
/*print out usage message
 * Formatted as such:
 * $name: $desc
 *
 * USAGE: $name [-o|--opt] -- afteropt
 * 	-o|--opt:
 * 		option description here
*/
SHL_UNUSED static void sopt_usage(struct sopt *optspec, const char *name, const char *desc)
{
	struct sopt *opt;
	bool afteropt = false;

	if (!(name && desc && optspec))
		return;

	LOG(stderr, "%s: %s\n\nUSAGE: %s", name, desc, name);
	for (opt = optspec; SOPT_VALID(opt); ++opt) {
		if (opt->val == SOPT_AFTER) {
			afteropt = true;
			continue;
		}
		LOG(stderr, " [");
		sopt_usage_printopt(opt);
		LOG(stderr, "]");
	}
	if (afteropt) {
		LOG(stderr, " --");
		for (opt = optspec; SOPT_VALID(opt); ++opt) {
			if (opt->val == SOPT_AFTER)
				LOG(stderr, " %s", opt->arg);
		}
	}
	LOG(stderr, "\n\t");

	/* now we get to the descriptions */
	for (opt = optspec; SOPT_VALID(opt); ++opt) {
		if (opt->val == SOPT_AFTER)
			continue;
		sopt_usage_printopt(opt);
		LOG(stderr, ":\n\t\t%s\n\t", opt->desc);
	}
	if (afteropt) {
		for (opt = optspec; SOPT_VALID(opt); ++opt) {
			if (opt->val == SOPT_AFTER)
				LOG(stderr, "%s:\n\t\t%s\n\t", opt->arg, opt->desc);
		}
	}
	/*make it prettier*/
	LOG(stderr, "\n");
}
/*print out usage message, but with static storage of parameters.
 * If 'set' is true, other parameters are stored, and the function returns.
 * If 'set' is false, other parameters are ignored, and sopt_usage() is called
 * with stored values used */
SHL_UNUSED static void sopt_usage_static(struct sopt *opt, const char *name, const char *desc, bool set)
{
	static const char *name_s, *desc_s;
	static struct sopt *opt_s;
	if (set) {
		name_s = name;
		desc_s = desc;
		opt_s = opt;
	} else {
		sopt_usage(opt_s, name_s, desc_s);
	}
}
/* for convenience, set the static usage values for future use */
SHL_UNUSED static inline void sopt_usage_set(struct sopt *opt, const char *name, const char *desc)
{
	sopt_usage_static(opt, name, desc, true);
}
/* for convenience, call sopt_usage_static with stored parameters */
SHL_UNUSED static inline void sopt_usage_s(void)
{
	sopt_usage_static(NULL, NULL, NULL, false);
}

SHL_UNUSED static bool sopt_argconv_int(const char *s, intmax_t *out)
{
	char *endptr;
	errno = 0;
	*out = strtoimax(s, &endptr, 0);
	if (endptr == s)
		return false;
	if (errno)
		return false;
	return true;
}

SHL_UNUSED static bool sopt_argconv_uint(const char *s, uintmax_t *out)
{
	char *endptr;

	/* we do not want any negative values here */
	for (;*s && isspace(*s); ++s);
	if (!*s)
		return false;
	if (*s == '-')
		return false;

	errno = 0;
	*out = strtoumax(s, &endptr, 0);
	if (endptr == s)
		return false;
	if (errno)
		return false;
	return true;
}

SHL_UNUSED static bool sopt_argconv_ldbl(const char *s, long double *out)
{
	char *endptr;
	errno = 0;
	*out = strtold(s, &endptr);
	if (endptr == s)
		return false;
	if (errno)
		return false;
	return true;
}

SHL_UNUSED static void sopt_perror(struct sopt *opt, const char *msg)
{
	LOG(stderr, "Error parsing argument ");
	if (isalnum(opt->val)) {
		LOG(stderr, "-%c", opt->val);
		if (opt->name) {
			LOG(stderr, "/");
		}
	}
	if (opt->name) {
		LOG(stderr, "--%s", opt->name);
	}
	LOG(stderr, ": %s\n", msg);
}

/* replacement for getopt()
 * argc:
 * 	argc, obviously
 * argv:
 * 	argv, obviously
 * opt:
 * 	array of possible option structures
 * cpos:
 * 	Stores the current position in a combined option, i.e. -abcd.
 * 	*cpos MUST BE ZERO ON FIRST CALL
 * optind:
 * 	Current position in the argv array. At end of processing, will point
 * 	to first non-parsed argument.
 * 	*optind MUST BE ZERO ON FIRST CALL
 * arg:
 * 	Pointer to an sopt_arg union to contain the parsed argument.
 *
 * RETURNS:
 * 	'?' if unknown or invalid input given,
 * 	opt->val for the found option otherwise.
 */
SHL_UNUSED static int sopt_getopt(int argc, char **argv, struct sopt *opt, int *cpos, int *optind, union sopt_arg *arg)
{
	char *arg_str;
	intmax_t arg_int;
	bool arg_int_valid;
	uintmax_t arg_uint;
	bool arg_uint_valid;
	long double arg_float;
	bool arg_float_valid;

	if (!(opt && cpos &&argv && optind && arg && argc))
		return -1;
	/* handle the case of combined options */
	if (*cpos)
		goto shortopt;
	/*otherwise proceed normally*/
	if (++*optind >= argc)
		return -1;
	if (argv[*optind][0] != '-')
		return -1;

	if (argv[*optind][1] == '-') {
		/*end of options*/
		if (!argv[*optind][2]) {
			++*optind; //optind points at next non-option
			return -1;
		}
		/*or a long option*/
		for (; SOPT_VALID(opt); ++opt) {
			/*don't want to be passing NULL to strcmp, now do we?*/
			if (opt->name) {
				if (!strcmp(opt->name, argv[*optind] + 2))
					break;
			}
		}
	} else {
shortopt:
		/* if we're not in a combined option, start at first option
		 * character */
		if (!*cpos)
			*cpos = 1;
		/* find our shortopt */
		for (; SOPT_VALID(opt); ++opt) {
			if (opt->val == argv[*optind][*cpos])
				break;
		}
		/* check if we're in a combined option */
		if (argv[*optind][++*cpos]) {
			/* make sure that we're not expecting a param */
			if (opt->arg)
				return SOPT_INVAL;
		} else {
			*cpos = 0;
		}
	}
	if (opt->arg) {
		if (!(arg_str = argv[++*optind])) {
			sopt_perror(opt, "Missing required argument");
			return SOPT_INVAL;
		}
		arg_int_valid = sopt_argconv_int(arg_str, &arg_int);
		arg_uint_valid = sopt_argconv_uint(arg_str, &arg_uint);
		arg_float_valid = sopt_argconv_ldbl(arg_str, &arg_float);

		switch (opt->argtype) {
			case SOPT_ARGTYPE_STR:
				arg->str = arg_str;
				break;
			/* Signed integers */
#if CHAR_MIN
			/* because character types are implementation-defined with regard to sign */
			case SOPT_ARGTYPE_CHAR:
#endif
			case SOPT_ARGTYPE_SCHAR:
				if (!arg_int_valid) {
					sopt_perror(opt, "Argument is not an integer");
					return SOPT_INVAL;
				}
				if (!(arg_int >= SCHAR_MIN &&
				      arg_int <= SCHAR_MAX)) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->sc = arg_int;
				break;
			case SOPT_ARGTYPE_SHORT:
				if (!arg_int_valid) {
					sopt_perror(opt, "Argument is not an integer");
					return SOPT_INVAL;
				}
				if (!(arg_int >= SHRT_MIN &&
				      arg_int <= SHRT_MAX)) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->s = arg_int;
				break;
			case SOPT_ARGTYPE_INT:
				if (!arg_int_valid) {
					sopt_perror(opt, "Argument is not an integer");
					return SOPT_INVAL;
				}
				if (!(arg_int >= INT_MIN &&
				      arg_int <= INT_MAX)) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->i = arg_int;
				break;
			case SOPT_ARGTYPE_LONG:
				if (!arg_int_valid) {
					sopt_perror(opt, "Argument is not an integer");
					return SOPT_INVAL;
				}
				if (!(arg_int >= LONG_MIN &&
				      arg_int <= LONG_MAX)) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->l = arg_int;
				break;
			case SOPT_ARGTYPE_LONGLONG:
				if (!arg_int_valid) {
					sopt_perror(opt, "Argument is not an integer");
					return SOPT_INVAL;
				}
				if (!(arg_int >= LLONG_MIN &&
				      arg_int <= LLONG_MAX)) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->ll = arg_int;
				break;
			/* Unsigned integers */
#if !CHAR_MIN
			/* because implementation-defined char signedness */
			case SOPT_ARGTYPE_CHAR:
#endif
			case SOPT_ARGTYPE_UCHAR:
				if (!arg_uint_valid) {
					sopt_perror(opt, "Argument is not an unsigned integer");
					return SOPT_INVAL;
				}
				if (arg_uint > UCHAR_MAX) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->uc = arg_uint;
				break;
			case SOPT_ARGTYPE_USHORT:
				if (!arg_uint_valid) {
					sopt_perror(opt, "Argument is not an unsigned integer");
					return SOPT_INVAL;
				}
				if (arg_uint > USHRT_MAX) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->us = arg_uint;
				break;
			case SOPT_ARGTYPE_UINT:
				if (!arg_uint_valid) {
					sopt_perror(opt, "Argument is not an unsigned integer");
					return SOPT_INVAL;
				}
				if (arg_uint > UINT_MAX) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->ui = arg_uint;
				break;
			case SOPT_ARGTYPE_ULONG:
				if (!arg_uint_valid) {
					sopt_perror(opt, "Argument is not an unsigned integer");
					return SOPT_INVAL;
				}
				if (arg_uint > ULONG_MAX) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->ul = arg_uint;
				break;
			case SOPT_ARGTYPE_ULONGLONG:
				if (!arg_uint_valid) {
					sopt_perror(opt, "Argument is not an unsigned integer");
					return SOPT_INVAL;
				}
				if (arg_uint > ULLONG_MAX) {
					sopt_perror(opt, "Argument out of range");
					return SOPT_INVAL;
				}
				arg->ull = arg_uint;
				break;
			/* Floats */
			case SOPT_ARGTYPE_FLOAT:
				if (!arg_float_valid) {
					sopt_perror(opt, "Argument is not a valid floating-point number");
					return SOPT_INVAL;
				}
				arg->f = arg_float;
				break;
			case SOPT_ARGTYPE_DBL:
				if (!arg_float_valid) {
					sopt_perror(opt, "Argument is not a valid floating-point number");
					return SOPT_INVAL;
				}
				arg->d = arg_float;
				break;
			case SOPT_ARGTYPE_LONGDBL:
				if (!arg_float_valid) {
					sopt_perror(opt, "Argument is not a valid floating-point number");
					return SOPT_INVAL;
				}
				arg->ld = arg_float;
				break;
			default:
				return SOPT_INVAL;
		}
	}
	return opt->val;
}

/* A replacement for getopt() that allows the use of static allocation.
 * NOT THREAD SAFE
 *
 * Parameters are same as sopt_getopt(), with new semantics:
 *
 * opt:
 * 	If NULL, nothing is done save for reinitialization to a clean state
 * 	If different from the last call, reset only optind and cpos
 * cpos:
 * 	If NULL, a static allocation is used. Reset whenever opt changes.
 * optind:
 * 	If NULL, a static allocation is used. Reset whenever opt changes.
*/
SHL_UNUSED static int sopt_getopt_s(int argc, char **argv, struct sopt *opt, int *cpos, int *optind, union sopt_arg *arg)
{
	static struct sopt *opt_last = NULL;
	static int cpos_s = 0;
	static int optind_s = 0;

	if (!cpos)
		cpos = &cpos_s;
	if (!optind)
		optind = &optind_s;
	if (opt != opt_last) {
		*cpos = 0;
		*optind = 0;
		opt_last = opt;
	}

	if (!opt)
		return SOPT_INVAL;

	return sopt_getopt(argc, argv, opt, cpos, optind, arg);
}

#undef SHL_UNUSED
#endif
