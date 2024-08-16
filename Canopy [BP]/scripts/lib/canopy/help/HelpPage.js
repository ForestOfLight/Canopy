import { HelpEntry, RuleHelpEntry, CommandHelpEntry } from './HelpEntry.js';
import Rule from '../Rule.js';
import Command from '../Command.js';

class HelpPage {
    entries = [];

    constructor(title, description = '', extensionName = false) {
        if (extensionName)
            this.title = extensionName + ':' + title;
        else
            this.title = title;
        this.description = description;
        this.extensionName = extensionName;
    }

    getEntries() {
        return this.entries;
    }

    getHeader() {
        let extensionFormat = '';
        let titleFormat = this.title;
        if (this.extensionName) {
            extensionFormat = '§f(§a' + this.extensionName + '§f) ';
            titleFormat = this.title.split(':')[1];
        }
        return '§l§aCanopy§r§2 Help Page: §f' + extensionFormat + titleFormat;
    }
}

class RuleHelpPage extends HelpPage {
    constructor(title, description, usage, extensionName = false) {
        super(title, description, extensionName);
        this.usage = usage;
    }

    addEntry(rule) {
        if (!(rule instanceof Rule)) {
            throw new Error('[HelpPage] Entry must be an instance of Rule');
        }
        if (this.hasEntry(rule))
            return;
        this.entries.push(new RuleHelpEntry(rule));
    }

    hasEntry(rule) {
        return this.entries.some(entry => entry.rule.getID() === rule.getID());
    }

    async toString() {
        let output = this.getHeader()
                + '\n§2' + this.usage + ' - ' + this.description;
        for (let entry of this.entries) {
            output += '\n  ';
            output += await entry.toString();
        }
        return output;
    }
}

class CommandHelpPage extends HelpPage {
    constructor(title, description = '', extensionName = false) {
        super(title, description, extensionName);
    }

    addEntry(command) {
        if (!(command instanceof Command)) {
            throw new Error('[HelpPage] Entry must be an instance of Command');
        }
        if (this.hasEntry(command))
            return;
        this.entries.push(new CommandHelpEntry(command));
    }

    hasEntry(command) {
        return this.entries.some(entry => entry.command.getName() === command.getName());
    }

    toString() {
        let output = this.getHeader();
        if (this.description !== '')
            output += '\n§2' + this.description;
        for (let entry of this.entries) {
            output += '\n  ' + entry.toString();
        }
        return output;
    }
}

export { HelpPage, RuleHelpPage, CommandHelpPage };