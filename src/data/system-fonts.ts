/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'obsidian';

export const SYSTEM_FONTS: string[] = [];

export async function tryGetSystemFonts(): Promise<string[]> {
	if (Platform.isDesktop) {
		try {
			let { getFonts } = require('font-list');
			SYSTEM_FONTS.push(...await getFonts({ disableQuoting: true }));
		} catch (error) {
			console.log('Failed to load fonts: ', error);
		}
	} else if (Platform.isMobile) {
		try {
			SYSTEM_FONTS.push(...await (Capacitor.Plugins.App.getFonts?.() ?? []));
		} catch (error) {
			console.log('Failed to load fonts: ', error);
		}
	}

	return SYSTEM_FONTS;
}