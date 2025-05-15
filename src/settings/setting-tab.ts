import { type App, PluginSettingTab, normalizePath } from 'obsidian';
import { ImageSuggester } from 'src/ui/suggester-handler/image-suggester';
import { IconSuggester } from 'src/ui/suggester-handler/icon-suggester';
import { CSS_UNIT_RE, VALID_URL_RE } from 'src/data/regexps';
import { IconSearchFiles } from 'src/data/icons';
import { DEFAULT_SETTINGS } from 'src/settings/settings-config';
import { FontSuggester } from 'src/ui/suggester-handler/font-suggester';
import type HomeTabPlugin from 'src/main';
import {
	ComplexDropdownSetting,
	DropdownSetting,
	HeadingSetting,
	SliderSetting,
	TextSetting,
	ToggleSetting
} from './components/setting-components';

const LOGO_OPTIONS = {
	default: 'Obsidian logo',
	oldLogo: 'Obsidian old logo',
	imagePath: 'Local image',
	imageLink: 'Link',
	lucideIcon: 'Lucide icon',
	none: 'Empty'
}

const COLOR_OPTIONS = {
	default: 'Theme default',
	accentColor: 'Accent color',
	custom: 'Custom'
}

const FONT_OPTIONS = {
	interfaceFont: 'Interface font',
	textFont: 'Text font',
	monospaceFont: 'Monospace font',
	custom: 'Custom font'
}

export class HomeTabSettingTab extends PluginSettingTab {
	public readonly plugin: HomeTabPlugin;
	
	constructor(app: App, plugin: HomeTabPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	public hide(): void {
		super.hide();
		this.containerEl.empty();
		if (this.plugin.refreshQueued) {
			this.plugin.refreshQueued = false;
			this.plugin.refreshAllViews();
		}
	}

	public display(): void {
		let { containerEl } = this,
			{ settings } = this.plugin;

		/*=== General ===*/

		new ToggleSetting({
			containerEl,
			name: 'Hometab as new tab',
			desc: 'Replace any new tab with Home tab.',
			record: settings, key: 'replaceNewTabs'
		});

		new ToggleSetting({
			containerEl,
			name: 'Open at startup',
			desc: 'If a Home tab is already open it\'ll focus it instead of opening a new one.',
			record: settings, key: 'newTabOnStart',
			callback: value => containerEl
				.querySelector<HTMLElement>('.hometab-setting-closePreviousSessionTabs')
				?.toggle(value)
		});

		new ToggleSetting({
			containerEl, cls: ['hometab-setting-closePreviousSessionTabs'],
			name: 'Close previous session tabs on start',
			desc: 'Close all the tabs and leave only a Home tab on startup.',
			record: settings, key: 'closePreviousSessionTabs'
		}).then(({ settingEl }) => settingEl.toggle(settings.newTabOnStart));

		/*=== Search ===*/

		new HeadingSetting({ containerEl, name: 'Search' });

		new ToggleSetting({
			containerEl,
			name: 'Use Omnisearch',
			desc: 'Set Omnisearch as the default search engine.',
			record: settings, key: 'omnisearch',
			callback: () => this.plugin.refreshQueued = true
		});

		new ToggleSetting({
			containerEl,
			name: 'Markdown only (default search)',
			desc: 'Search only markdown files.',
			record: settings, key: 'markdownOnly',
			callback: () => this.plugin.refreshQueued = true
		});

		new ToggleSetting({
			containerEl,
			name: 'Show uncreated files (default search)',
			record: settings, key: 'unresolvedLinks',
			callback: () => this.plugin.refreshQueued = true
		});

		new ToggleSetting({
			containerEl,
			name: 'Include files\' title (default search)',
			desc: 'Search through files\' title.',
			record: settings, key: 'searchTitle',
			callback: () => this.plugin.refreshQueued = true
		});

		new ToggleSetting({
			containerEl,
			name: 'Include notes\' headings (default search)',
			desc: 'Search through notes\' headings.',
			record: settings, key: 'searchHeadings',
			callback: () => this.plugin.refreshQueued = true
		});

		new ToggleSetting({
			containerEl,
			name: 'Show file path (default search)',
			desc: 'Display file path at the right of the filename.',
			record: settings, key: 'showPath',
			callback: () => this.plugin.refreshQueued = true
		});

		new ToggleSetting({
			containerEl,
			name: 'Jump to matched heading (default search)',
			desc: 'Automatically jump to the mathced heading.',
			record: settings, key: 'autoJumpToHeading'
		})

		new ToggleSetting({
			containerEl,
			name: 'Jump to first match (Omnisearch)',
			desc: 'Automatically jump to the first mathced text.',
			record: settings, key: 'jumpToFirstMatch'
		});

		new ToggleSetting({
			containerEl,
			name: 'Show excerpt (Omnisearch)',
			desc: 'Automatically jump to the first mathced text.',
			record: settings, key: 'showOmnisearchExcerpt'
		});

		new ToggleSetting({
			containerEl,
			name: 'Show shorcuts',
			desc: 'Show the contextual part of the note that matches the search.',
			record: settings, key: 'showShortcuts',
			callback: () => this.plugin.refreshQueued = true
		});

		new SliderSetting({
			containerEl,
			name: 'Max results',
			desc: 'Set how many results display.',
			record: settings, key: 'maxResults',
			defaultValue: DEFAULT_SETTINGS.maxResults,
			limit: [1, 25, 1]
		});

		new SliderSetting({
			containerEl,
			name: 'Search delay',
			desc: 'The value is in milliseconds.',
			record: settings, key: 'searchDelay',
			callback: () => this.plugin.refreshQueued = true,
			defaultValue: DEFAULT_SETTINGS.searchDelay,
			limit: [0, 500, 10]
		});

		/*=== Files display ===*/

		new HeadingSetting({ containerEl, name: 'Files display' });

		new ToggleSetting({
			containerEl,
			name: 'Show recent files',
			desc: 'Display recent files under the search bar.',
			record: settings, key: 'showRecentFiles',
			callback: value => containerEl
				.querySelectorAll<HTMLElement>('.hometab-setting-recentFilesConfig')
				.forEach(el => el.toggle(value))
		});

		new ToggleSetting({
			containerEl, cls: ['hometab-setting-recentFilesConfig'],
			name: 'Store last recent files',
			desc: 'Remembers the recent files of the previous session.',
			record: settings, key: 'storeRecentFile'
		}).then(({ settingEl }) => settingEl.toggle(settings.showRecentFiles));

		new SliderSetting({
			containerEl, cls: ['hometab-setting-recentFilesConfig'],
			name: 'Recent file amount',
			desc: 'Set how many recent files to be displayed.',
			record: settings, key: 'maxRecentFiles',
			callback: value => this.plugin.recentFileManager.onNewMaxListLenght(value),
			defaultValue: DEFAULT_SETTINGS.maxRecentFiles,
			limit: [1, 25, 1]
		}).then(({ settingEl }) => settingEl.toggle(settings.showRecentFiles));

		new ToggleSetting({
			containerEl,
			name: 'Show bookmarked files',
			desc: 'Display bookmarked files under the search bar.',
			record: settings, key: 'showBookmarkedFiles'
		});

		/*=== Appearance ===*/

		new HeadingSetting({ containerEl, name: 'Appearance' });

		new ComplexDropdownSetting({
			containerEl,
			name: 'Logo',
			desc: 'Remove or set a custom logo. Accepts local files, links to images or lucide icon ids.',
			record: settings, key: 'logoType',
			options: LOGO_OPTIONS,
			defaultValue: DEFAULT_SETTINGS.logoType,
			childControls: {
				'lucideIcon': {
					type: 'text',
					record: settings.logo, key: 'lucideIcon',
					suggester: inputEl => new IconSuggester(this.app, inputEl),
					pattern: value => !value || IconSearchFiles.some(iconDesc => iconDesc.name === value),
					defaultValue: ''
				},
				'imagePath': {
					type: 'text',
					record: settings.logo, key: 'imagePath',
					suggester: inputEl => new ImageSuggester(this.app, inputEl),
					defaultValue: '',
					pattern: async value => {
						if (!value || value === '/') return true;
						let normalizedPath = normalizePath(value);
						return await this.app.vault.adapter.exists(normalizedPath);
					}
				},
				'imageLink': {
					type: 'text',
					record: settings.logo, key: 'imageLink',
					pattern: VALID_URL_RE,
					defaultValue: ''
				}
			},
			callback: value => {
				containerEl
					.querySelectorAll<HTMLElement>('.hometab-setting-logoColor')
					.forEach(el => el.toggle(value === 'lucideIcon'));
			}
		});

		new ComplexDropdownSetting({
			containerEl, cls: ['hometab-setting-logoColor'],
			name: 'Logo icon color',
			desc: 'Set the icon color.',
			record: settings, key: 'iconColorType',
			options: COLOR_OPTIONS,
			defaultValue: DEFAULT_SETTINGS.iconColorType,
			childControls: {
				'custom': {
					type: 'colorPicker',
					record: settings, key: 'iconColor',
					defaultValue: '#000000'
				}
			}
		}).then(({ settingEl }) => settingEl.toggle(settings.logoType === 'lucideIcon'));

		new SliderSetting({
			containerEl,
			name: 'Logo scale',
			desc: 'Set the logo dimensions relative to the title font size.',
			record: settings, key: 'logoScale',
			defaultValue: DEFAULT_SETTINGS.logoScale,
			limit: [0.3, 3, 0.1]
		});

		new TextSetting({
			containerEl,
			name: 'Title',
			desc: 'Set a custom title.',
			record: settings, key: 'wordmark',
			defaultValue: DEFAULT_SETTINGS.wordmark
		});

		new ComplexDropdownSetting({
			containerEl, cls: ['compressed'],
			name: 'Title font',
			desc: 'Interface font, text font, and monospace font options match the fonts set in the Appearance setting tab.',
			record: settings, key: 'customFont',
			options: FONT_OPTIONS,
			defaultValue: DEFAULT_SETTINGS.customFont,
			childControls: {
				'custom': {
					type: 'text',
					record: settings, key: 'font',
					suggester: inputEl => new FontSuggester(this.app, inputEl),
					defaultValue: DEFAULT_SETTINGS.font
				}
			}
		});

		new TextSetting({
			containerEl,
			name: 'Title font size',
			desc: 'Accepts any CSS font-size value.',
			record: settings, key: 'fontSize',
			pattern: CSS_UNIT_RE,
			defaultValue: DEFAULT_SETTINGS.fontSize
		});

		new SliderSetting({
			containerEl,
			name: 'Title font weight',
			desc: 'Set title font weight.',
			record: settings, key: 'fontWeight',
			limit: [100, 900, 100],
			defaultValue: DEFAULT_SETTINGS.fontWeight
		});

		new ComplexDropdownSetting({
			containerEl,
			name: 'Title color',
			record: settings, key: 'fontColorType',
			options: COLOR_OPTIONS,
			defaultValue: DEFAULT_SETTINGS.fontColorType,
			childControls: {
				'custom': {
					type: 'colorPicker',
					record: settings, key: 'fontColor',
					defaultValue: '#000000'
				}
			}
		});

		new DropdownSetting({
			containerEl,
			name: 'Selection highlight',
			desc: 'Set the color of the selected item.',
			record: settings, key: 'selectionHighlight',
			defaultValue: DEFAULT_SETTINGS.selectionHighlight,
			callback: () => this.plugin.refreshQueued = true,
			options: {
				'default': 'Theme default',
				'accentColor': 'Accent color'
			}
		});

		new ToggleSetting({
			containerEl,
			name: 'Use iconic',
			desc: 'Use custom icon provided by Iconic for each item.',
			record: settings, key: 'useIconic',
			defaultValue: DEFAULT_SETTINGS.useIconic
		});
	}
}