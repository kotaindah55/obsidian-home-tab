import { writable } from 'svelte/store';
import type { HomeTabSettings } from 'src/settings/settings-config';
import type { RecentFile } from 'src/file-manager/recent-files';
import type { BookmarkedFile } from 'src/file-manager/bookmarked-files';

export const settingsStore = writable<HomeTabSettings>();
export const bookmarkedFileStore = writable<BookmarkedFile[]>([]);
export const recentFileStore = writable<RecentFile[]>([]);