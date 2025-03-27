import { HelpEntry } from './HelpEntry';
import { Commands } from '../Commands';

class CommandHelpEntry extends HelpEntry {
    constructor(command) {
        super(command.getName(), command.getDescription());
        this.command = command;
    }

    toRawMessage() {
        const message = { rawtext: [{ text: `§2${this.command.getUsage()}§8 - ` }, this.description] };
        for (const helpEntry of this.command.getHelpEntries())
            message.rawtext.push({ rawtext: [{ text: `\n  §7> §2${Commands.getPrefix()}${helpEntry.usage}§8 - ` }, helpEntry.description] });
        return message;
    }
}

export { CommandHelpEntry };