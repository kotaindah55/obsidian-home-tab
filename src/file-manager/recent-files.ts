import { type App, Component, TFile } from 'obsidian';
import { get } from 'svelte/store';
import type { HomeTabSettings } from 'src/settings/settings-config';
import { recentFileStore } from 'src/store';
import type HomeTabPlugin from 'src/main';

export interface RecentFile {
    file: TFile;
    timestamp: number;
}

export interface RecentFileStoreItem {
    filepath: string;
    timestamp: number;
}

export class RecentFileManager extends Component {
    public readonly app: App;
    public readonly plugin: HomeTabPlugin;
    public readonly pluginSettings: HomeTabSettings;

    constructor(app: App, plugin: HomeTabPlugin) {
        super();
        this.app = app;
        this.plugin = plugin;
        this.pluginSettings = plugin.settings;
    }
    
    public onload(): void {
        // Save file to recent files list on opening
        this.registerEvent(this.app.workspace.on(
            'file-open',
            async file => {
                this._updateRecentFiles(file);
                await this._storeRecentFiles();
            }
        ));

        // Remove recent file if deleted
        this.registerEvent(this.app.vault.on(
            'delete',
            async file => {
                if (file instanceof TFile) this.removeRecentFile(file);
                await this._storeRecentFiles();
            }
        ));

        // Update displayed name on file rename
        this.registerEvent(this.app.vault.on(
            'rename',
            file => {
                if (file instanceof TFile) this._onFileRename();
            }
        ));

        this._loadStoredRecentFiles();
    }

    private _updateRecentFiles(openedFile: TFile | null): void {
        if (!openedFile) return;

        recentFileStore.update(files => {
            let openedRecentFile = files.find(item => item.file === openedFile);

            // If file is already in the recent files list update only the timestamp
            if (openedRecentFile)
                openedRecentFile.timestamp = Date.now();

            // If the recent files list is full replace the last (oldest) item
            else if (files.length >= this.pluginSettings.maxRecentFiles) {
                files[files.length - 1] = {
                    file: openedFile,
                    timestamp: Date.now()
                }
            }

            // If there is space and the file is not already in the recent files list add it
            else files.push({
                file: openedFile,
                timestamp: Date.now()
            });

            // Sort files by descending (new to old) opening time
            return files.sort((a, b) => b.timestamp - a.timestamp);
        })
    }
    
    public removeRecentFile(file: TFile): void {
        recentFileStore.update(files => {
            files.splice(files.findIndex(recentFile => recentFile.file == file), 1);
            return files;
        })

        this._storeRecentFiles();
    }

    public onNewMaxListLenght(newValue: number): void {
        let currentLenght = get(recentFileStore).length;
        if (newValue < currentLenght)
            this._removeRecentFiles(currentLenght - newValue);
    }

    private _removeRecentFiles(number: number): void {
        recentFileStore.update(files => {
            files.splice(files.length - number, number);
            return files;
        });
        
        this._storeRecentFiles();
    }

    private _onFileRename(): void {
        // Trigger refresh of svelte component, not sure if it's the best approach
        recentFileStore.update(files => files);
    }

    private async _storeRecentFiles(): Promise<void> {
        if (this.plugin.settings.storeRecentFile) {
            let storedItems: RecentFileStoreItem[] = []
            get(recentFileStore).forEach(file => storedItems.push({
                // Store only the path instead of the entire TFile instance
                filepath: file.file.path,
                timestamp: file.timestamp
            }));
            this.plugin.settings.recentFilesStore = storedItems;
            await this.plugin.saveData(this.plugin.settings);
        }
    }

    private _loadStoredRecentFiles(): void {
        if (!this.plugin.settings.storeRecentFile) return;

        let filesToLoad: RecentFile[] = [];
        this.app.workspace.onLayoutReady(() => { 
            this.plugin.settings.recentFilesStore.forEach((item: RecentFileStoreItem) => {
                let file = this.app.vault.getAbstractFileByPath(item.filepath);
                if (file instanceof TFile) filesToLoad.push({
                    file: file,
                    timestamp: item.timestamp
                });
            });
            recentFileStore.set(filesToLoad);
        })
    }
}