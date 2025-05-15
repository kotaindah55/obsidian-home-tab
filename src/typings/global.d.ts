import type { CapacitorGlobal } from '@capacitor/core';
import type getSystemFonts from 'get-system-fonts';
import type FontList from 'font-list';

declare global {
	// eslint-disable-next-line no-var
	var Capacitor: CapacitorGlobal;

	declare namespace NodeJS {
		interface Require {
			(id: 'get-system-fonts'): typeof getSystemFonts;
			(id: 'font-list'): typeof FontList;
		}
	}
}