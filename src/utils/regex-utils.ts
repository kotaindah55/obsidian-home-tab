export function literalize(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function concatStringsToRegexp(strings: string[], modifier = 'g'): RegExp {
	return new RegExp(strings.join('|'), modifier);
}