import IconTagRecord from 'lucide-static/tags.json';
import { getIconIds } from 'obsidian';
import type { IconSearchFile } from 'src/model/search-file';

type IconName = keyof typeof IconTagRecord;

export const IconSearchFiles: IconSearchFile[] = getIconIds().map(name => {
	if (name.startsWith('lucide-'))
		name = name.slice(7);

	let tags = IconTagRecord[name as IconName] ?? [];
	delete IconTagRecord[name as IconName];

	return { name, tags };
});

for (let name in IconTagRecord)
	delete IconTagRecord[name as IconName];