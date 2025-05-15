import type { AppPlugin } from '@capacitor/app';

declare module '@capacitor/app' {
	interface AppPlugin {
		getFonts(): Promise<string[]>;
	}
}

declare module '@capacitor/core' {
	interface PluginMap {
		'App': Partial<AppPlugin>;
	}

	export interface CapacitorGlobal {
		Plugins: PluginMap;
	}
}